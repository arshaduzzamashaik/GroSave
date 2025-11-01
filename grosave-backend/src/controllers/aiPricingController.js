// src/controllers/aiPricingController.js
exports.suggestPrice = async (req, res) => {
  try {
    const { productId, basePrice, expiryDate, inventory, demandIndex, returnReason } = req.body || {};
    if (!productId || typeof basePrice !== 'number' || !expiryDate) {
      return res.status(400).json({ error: 'productId, basePrice, expiryDate are required' });
    }

    // Simple heuristic pricing (replace with your OpenAI call later)
    const hoursToExpiry = Math.max(0, Math.floor((new Date(expiryDate).getTime() - Date.now()) / 36e5));
    const invFactor = Math.max(0.1, Math.min(2, (inventory ?? 1) / 25));
    const demand = typeof demandIndex === 'number' ? demandIndex : 0.5; // 0..1

    let price = basePrice;
    // drop price closer to expiry, raise a bit for demand, scale by inventory factor
    price *= (0.6 + 0.4 * Math.min(1, hoursToExpiry / 48));  // closer => smaller
    price *= (0.8 + 0.6 * demand);                           // demand high => larger
    price *= (0.7 + 0.6 * (1 / invFactor));                  // low inv => larger

    const finalPrice = Math.max(0, Math.round(price));

    const reason = returnReason
      ? `Heuristic: hoursToExpiry=${hoursToExpiry}, demand=${demand}, inventory=${inventory ?? 0}.`
      : undefined;

    return res.json({ price: finalPrice, currency: 'GroCoins', reason });
  } catch (e) {
    console.error('suggestPrice error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
