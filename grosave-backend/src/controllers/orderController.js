// src/controllers/orderController.js
const prisma = require('../config/database');
const { generateOrderNumber, generateVerificationCode } = require('../utils/generateOrderNumber');
const { OrderStatus, OrderEventType, SlotId } = require('@prisma/client');

function toSlotEnumFromLabelOrId(input) {
  const low = String(input || '').toLowerCase();
  if (low.includes('morning') || low === 'morning') return SlotId.morning;
  if (low.includes('afternoon') || low === 'afternoon') return SlotId.afternoon;
  if (low.includes('evening') || low === 'evening') return SlotId.evening;
  return SlotId.morning; // default
}

function atMidnight(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0,0,0,0);
  return d;
}

async function createOrder(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { productId, quantity, pickupLocationId, pickupTimeSlot, pickupDate } = req.body;
    if (!productId || !quantity || !pickupLocationId || !pickupDate) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) return res.status(404).json({ error: 'Product not found' });
    if (product.unitsAvailable < quantity) return res.status(400).json({ error: 'Insufficient stock' });

    const coinsSpent = product.currentPrice * quantity;
    const wallet = await prisma.wallet.findFirst({ where: { userId } });
    if (!wallet || wallet.currentBalance < coinsSpent) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Capacity-managed slot
    const slotEnum = toSlotEnumFromLabelOrId(pickupTimeSlot);
    const dateMidnight = atMidnight(pickupDate);

    const orderNumber = generateOrderNumber();

    const result = await prisma.$transaction(async (tx) => {
      // find or create slot (in case not seeded yet for date)
      let slot = await tx.pickupSlot.findUnique({
        where: {
          pickupLocationId_date_slot: {
            pickupLocationId,
            date: dateMidnight,
            slot: slotEnum,
          },
        },
      });

      if (!slot) {
        // Default capacity if not existing
        slot = await tx.pickupSlot.create({
          data: {
            pickupLocationId,
            date: dateMidnight,
            slot: slotEnum,
            label:
              slotEnum === 'morning'
                ? 'Morning (8 AM - 12 PM)'
                : slotEnum === 'afternoon'
                ? 'Afternoon (12 PM - 4 PM)'
                : 'Evening (4 PM - 7 PM)',
            capacity: 15,
            reservedCount: 0,
          },
        });
      }

      if (slot.reservedCount + quantity > slot.capacity) {
        throw new Error('Slot capacity exceeded');
      }

      // decrement wallet + product, increment slot
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          currentBalance: wallet.currentBalance - coinsSpent,
          spent: wallet.spent + coinsSpent,
        },
      });

      const updatedProduct = await tx.product.update({
        where: { id: product.id },
        data: {
          unitsAvailable: product.unitsAvailable - quantity,
          isActive: product.unitsAvailable - quantity > 0 ? true : false,
        },
      });

      const updatedSlot = await tx.pickupSlot.update({
        where: { id: slot.id },
        data: { reservedCount: slot.reservedCount + quantity },
      });

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          productId,
          quantity,
          coinsSpent,
          status: OrderStatus.confirmed,
          pickupLocationId,
          pickupTimeSlot: pickupTimeSlot || updatedSlot.label,
          pickupDate: new Date(pickupDate),
          pickupSlotId: updatedSlot.id,
          verificationCode: generateVerificationCode(orderNumber),
        },
        include: { product: true, pickupLocation: true },
      });

      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: OrderEventType.reserved,
          meta: { quantity },
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'debit',
          amount: coinsSpent,
          description: `Order ${order.orderNumber}`,
          relatedOrderId: order.id,
          balanceAfter: updatedWallet.currentBalance,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          type: 'order',
          title: 'Order Confirmed',
          message: `Order ${order.orderNumber} reserved. Show QR at pickup.`,
          orderId: order.id,
        },
      });

      return order;
    });

    return res.json({ success: true, order: result });
  } catch (error) {
    if (String(error.message).includes('Slot capacity exceeded')) {
      return res.status(400).json({ error: 'Slot capacity exceeded' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Failed to create order' });
  }
}

async function getActiveOrders(req, res) {
  try {
    const userId = req.user?.userId;
    const orders = await prisma.order.findMany({
      where: { userId, status: { in: [OrderStatus.confirmed, OrderStatus.ready] } },
      orderBy: { reservedAt: 'desc' },
      include: { product: true, pickupLocation: true },
    });
    return res.json({ orders });
  } catch {
    return res.status(500).json({ error: 'Failed' });
  }
}

async function getPastOrders(req, res) {
  try {
    const userId = req.user?.userId;
    const orders = await prisma.order.findMany({
      where: { userId, status: { in: [OrderStatus.completed, OrderStatus.cancelled] } },
      orderBy: { reservedAt: 'desc' },
      include: { product: true },
    });
    return res.json({ orders });
  } catch {
    return res.status(500).json({ error: 'Failed' });
  }
}

async function cancelOrder(req, res) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, userId, status: { in: [OrderStatus.confirmed, OrderStatus.ready] } },
      include: { product: true, pickupSlot: true },
    });
    if (!order) return res.status(404).json({ error: 'Not found' });

    await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.cancelled, cancelledAt: new Date() },
      });

      // refund wallet
      const wallet = await tx.wallet.findFirst({ where: { userId } });
      const walletAfter = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          currentBalance: wallet.currentBalance + order.coinsSpent,
          spent: wallet.spent - order.coinsSpent,
        },
      });

      // return stock
      await tx.product.update({
        where: { id: order.productId },
        data: {
          unitsAvailable: { increment: order.quantity },
          isActive: true,
        },
      });

      // decrement slot reserved
      if (order.pickupSlotId) {
        await tx.pickupSlot.update({
          where: { id: order.pickupSlotId },
          data: { reservedCount: { decrement: order.quantity } },
        });
      }

      await tx.orderEvent.create({
        data: { orderId: id, type: OrderEventType.cancelled },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'refund',
          amount: order.coinsSpent,
          description: `Refund: Order ${order.orderNumber}`,
          relatedOrderId: id,
          balanceAfter: walletAfter.currentBalance,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          type: 'order',
          title: 'Order Cancelled',
          message: `Order ${order.orderNumber} cancelled & coins refunded.`,
          orderId: id,
        },
      });
    });

    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed' });
  }
}

async function markReady(req, res) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const order = await prisma.order.findFirst({ where: { id, userId } });
    if (!order) return res.status(404).json({ error: 'Not found' });
    if (order.status !== OrderStatus.confirmed) return res.status(400).json({ error: 'Invalid state' });

    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id }, data: { status: OrderStatus.ready } });
      await tx.orderEvent.create({ data: { orderId: id, type: OrderEventType.ready } });
      await tx.notification.create({
        data: {
          userId,
          type: 'order',
          title: 'Order Ready',
          message: `Order ${order.orderNumber} is ready for pickup.`,
          orderId: id,
        },
      });
    });

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Failed' });
  }
}

async function markScanned(req, res) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const order = await prisma.order.findFirst({ where: { id, userId } });
    if (!order) return res.status(404).json({ error: 'Not found' });
    if (![OrderStatus.confirmed, OrderStatus.ready].includes(order.status))
      return res.status(400).json({ error: 'Invalid state' });

    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id }, data: { scannedAt: new Date() } });
      await tx.orderEvent.create({ data: { orderId: id, type: OrderEventType.scanned } });
    });

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Failed' });
  }
}

async function completeOrder(req, res) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const order = await prisma.order.findFirst({ where: { id, userId } });
    if (!order) return res.status(404).json({ error: 'Not found' });
    if (![OrderStatus.confirmed, OrderStatus.ready].includes(order.status))
      return res.status(400).json({ error: 'Invalid state' });

    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id }, data: { status: OrderStatus.completed, completedAt: new Date() } });
      await tx.orderEvent.create({ data: { orderId: id, type: OrderEventType.completed } });
      await tx.notification.create({
        data: {
          userId,
          type: 'order',
          title: 'Order Completed',
          message: `Thanks! Order ${order.orderNumber} completed.`,
          orderId: id,
        },
      });
    });

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Failed' });
  }
}

module.exports = {
  createOrder,
  getActiveOrders,
  getPastOrders,
  cancelOrder,
  markReady,
  markScanned,
  completeOrder,
};
