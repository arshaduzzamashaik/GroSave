// src/controllers/impactController.js
const prisma = require('../config/database');

/**
 * Very simple placeholder: computes last 30 days orders completed
 * and converts to impact using fixed multipliers.
 */
async function getImpact(req, res) {
  try {
    const userId = req.user?.userId;

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: 'completed',
        completedAt: { gte: since },
      },
      include: { product: true },
    });

    // naive multipliers (tunable)
    const KG_PER_UNIT = 1.0; // assume 1kg per unit rescued
    const CO2_PER_KG = 2.5;  // kg CO2 saved per kg food waste avoided
    const RS_PER_COIN = 1;   // 1 coin = ₹1 (for display)

    const units = orders.reduce((sum, o) => sum + o.quantity, 0);
    const kgRescued = units * KG_PER_UNIT;
    const co2SavedKg = kgRescued * CO2_PER_KG;
    const rupeesSaved = orders.reduce((sum, o) => sum + o.coinsSpent, 0) * RS_PER_COIN;

    return res.json({
      rangeDays: 30,
      ordersCompleted: orders.length,
      kgRescued,
      co2SavedKg,
      rupeesSaved,
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to compute impact' });
  }
}

module.exports = { getImpact };
