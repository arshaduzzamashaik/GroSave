// src/controllers/adminDemoController.js
const prisma = require('../config/database');
const { OrderEventType } = require('@prisma/client');

function getExpectedToken() {
  const envToken = process.env.DEMO_ADMIN_TOKEN;
  if (process.env.NODE_ENV === 'production') return envToken || '';
  return envToken ?? 'change-me';
}

/** Header must be: Authorization: DemoAdmin <token> */
function requireDemoAdmin(req, res) {
  const hdr = req.headers.authorization || '';
  const [scheme, token] = hdr.split(' ');
  const ok = scheme === 'DemoAdmin' && token && token === getExpectedToken();
  if (!ok) {
    res.status(401).json({ error: 'Unauthorized (demo admin)' });
    return false;
  }
  return true;
}

/** Map admin "to" → valid OrderEventType */
function mapToEventType(to) {
  // Your enum likely: reserved | ready | scanned | completed | cancelled
  if (to === 'confirmed') return OrderEventType.reserved; // closest semantic
  if (to === 'ready')     return OrderEventType.ready;
  if (to === 'scanned')   return OrderEventType.scanned;
  if (to === 'completed') return OrderEventType.completed;
  if (to === 'cancelled') return OrderEventType.cancelled;
  return OrderEventType.reserved; // safe fallback
}

async function forceTransition(req, res) {
  if (!requireDemoAdmin(req, res)) return;

  const { orderId } = req.params;
  const { to } = req.body;

  const validStates = new Set(['confirmed', 'ready', 'scanned', 'completed', 'cancelled']);
  if (!validStates.has(to)) {
    return res.status(400).json({ error: 'Invalid target state' });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const now = new Date();
  const data = { updatedAt: now };

  if (to === 'confirmed') data.status = 'confirmed';
  if (to === 'ready')     data.status = 'ready';
  if (to === 'scanned')   data.scannedAt = now;
  if (to === 'completed') { data.status = 'completed'; data.completedAt = now; }
  if (to === 'cancelled') { data.status = 'cancelled'; data.cancelledAt = now; }

  const updated = await prisma.order.update({ where: { id: orderId }, data });

  // Write a valid enum event + mark meta as admin action
  await prisma.orderEvent.create({
    data: {
      orderId,
      type: mapToEventType(to),
      at: now,
      meta: { by: 'admin', forcedTo: to },
    },
  });

  return res.json({ success: true, order: updated });
}

async function seedExtraProduct(req, res) {
  if (!requireDemoAdmin(req, res)) return;
  const now = Date.now();

  const p = await prisma.product.create({
    data: {
      name: `Demo Bread ${now % 10000}`,
      brand: 'Daily Bakes',
      category: 'Bakery',
      description: 'Fresh loaf for demo.',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
      images: [],
      currentPrice: 30,
      originalPrice: 60,
      discount: 50,
      expiryStatus: 'fresh',
      expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      unitsAvailable: 10,
      nutritionInfo: { calories: 200 },
      storageInfo: ['Store in a cool, dry place'],
      safetyInfo: [],
      dynamicPricingEnabled: true,
      dropToPriceAtHoursBeforeExpiry: 18,
      freeAtHoursBeforeExpiry: 4,
      isActive: true,
    },
  });

  return res.json({ success: true, product: p });
}

module.exports = { forceTransition, seedExtraProduct };
