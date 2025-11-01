// src/controllers/pricingController.js
const { z } = require("zod");
const { suggestPrice } = require("../lib/llmPricing");

const InputSchema = z.object({
  productId: z.string().min(1),
  mrp: z.number().positive(),                 // original price (GroCoins)
  hoursToExpiry: z.number().min(0),
  inventory: z.number().min(0),
  demandScore: z.number().min(0).max(1),      // 0..1 (from views/reservations)
  sellThrough7d: z.number().min(0).max(1),    // 0..1 (completed / stocked)
  // optional business toggles
  enableLLM: z.boolean().optional(),
});

async function postSuggestPrice(req, res) {
  try {
    const body = InputSchema.parse(req.body);

    const result = await suggestPrice(
      {
        mrp: body.mrp,
        hoursToExpiry: body.hoursToExpiry,
        inventory: body.inventory,
        demandScore: body.demandScore,
        sellThrough7d: body.sellThrough7d,
      },
      { enableLLM: body.enableLLM !== false } // default ON if key exists
    );

    return res.json({
      success: true,
      ...result,
      productId: body.productId,
      // a simple recommendation policy you can show in UI
      policy: {
        note: "Fair pricing: adjustments use only product/time/inventory/demand signals.",
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      success: false,
      error: err?.message || "Bad request",
    });
  }
}

module.exports = { postSuggestPrice };
