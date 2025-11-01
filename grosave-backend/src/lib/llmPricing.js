// src/lib/llmPricing.js
const OpenAI = require("openai");
const { z } = require("zod");

// Hard guardrails you control (business policy)
const PRICING_BOUNDS = {
  minPercentOfMRP: 0.1,   // never price below 10% of MRP (unless 'free' policy)
  maxPercentOfMRP: 1.0,   // never exceed MRP
  maxLLMAdjustmentPct: 0.25, // LLM can only tweak within ±25% of baseline
};

const SuggestionSchema = z.object({
  suggestedPrice: z.number().nonnegative(),
  rationale: z.string().max(500),
  adjustmentPercent: z.number().min(-0.5).max(0.5).optional(), // sanity
});

function clamp(n, lo, hi) {
  return Math.min(Math.max(n, lo), hi);
}

/**
 * Compute a deterministic baseline from your signals (NO AI).
 * You can tweak these weights freely.
 */
function computeBaseline({ mrp, hoursToExpiry, inventory, demandScore, sellThrough7d }) {
  // start at 70% of MRP
  let base = mrp * 0.7;

  // near expiry → more discount
  if (hoursToExpiry <= 6) base *= 0.6;
  else if (hoursToExpiry <= 24) base *= 0.7;
  else if (hoursToExpiry <= 72) base *= 0.8;

  // high inventory & low demand → cheaper
  if (inventory > 50 && demandScore < 0.4) base *= 0.85;

  // strong sell-through → slightly higher
  if (sellThrough7d > 0.7) base *= 1.08;

  // clamp to business rails
  const min = mrp * PRICING_BOUNDS.minPercentOfMRP;
  const max = mrp * PRICING_BOUNDS.maxPercentOfMRP;
  base = clamp(base, min, max);

  return { base, min, max };
}

/**
 * Ask the LLM for a bounded adjustment around the baseline.
 * The LLM is instructed to stay within ±maxLLMAdjustmentPct.
 */
async function getLLMAdjustment({
  base,
  min,
  max,
  context,
  enabled = true,
}) {
  if (!enabled) {
    return {
      price: base,
      reason: "LLM disabled — using baseline.",
      adjustmentPercent: 0,
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const sys = `
You are a pricing assistant for a near-expiry grocery marketplace (GroSave).
GOALS:
- Improve sell-through before expiry.
- Preserve fairness: NO discrimination by sensitive traits. ONLY use product and market signals.
- Never exceed provided min/max bounds.
- Stay within ±${Math.round(
    PRICING_BOUNDS.maxLLMAdjustmentPct * 100
  )}% of the baseline.

OUTPUT RULES:
- Return JSON with: suggestedPrice (number), rationale (<= 500 chars), adjustmentPercent (number between -0.25 and 0.25).
- Do not include any other fields or prose.
`;

  const usr = {
    baseline: base,
    min,
    max,
    context, // signals you pass in (hoursToExpiry, inventory, demandScore, etc.)
    policyNotes:
      "No dynamic pricing by user profile, geography microsegments, or protected classes.",
  };

  const resp = await client.responses.create({
    model: "gpt-4o-mini", // light/cheap; swap if you prefer
    reasoning: { effort: "medium" },
    temperature: 0.2,
    input: [
      { role: "system", content: sys },
      {
        role: "user",
        content:
          "Given this JSON input, reply with strictly valid JSON per the OUTPUT RULES.",
      },
      { role: "user", content: JSON.stringify(usr) },
    ],
  });

  const raw = resp.output_text || "{}";
  let parsed;
  try {
    parsed = SuggestionSchema.parse(JSON.parse(raw));
  } catch {
    // if LLM fails schema, just fall back to baseline
    return {
      price: base,
      reason: "LLM parse failed — using baseline.",
      adjustmentPercent: 0,
    };
  }

  // Bound the LLM adjustment tightly
  const adj = clamp(
    parsed.adjustmentPercent ?? 0,
    -PRICING_BOUNDS.maxLLMAdjustmentPct,
    PRICING_BOUNDS.maxLLMAdjustmentPct
  );
  let price = base * (1 + adj);

  // Clamp to absolute min/max rails
  price = clamp(price, min, max);

  return {
    price: Math.round(price), // round to integer coins
    reason: parsed.rationale,
    adjustmentPercent: adj,
  };
}

/**
 * High-level helper the controller can call.
 */
async function suggestPrice(signals, { enableLLM = true } = {}) {
  const { mrp } = signals;
  if (!mrp || mrp <= 0) throw new Error("MRP required");

  const { base, min, max } = computeBaseline(signals);
  const llm = await getLLMAdjustment({
    base,
    min,
    max,
    context: signals,
    enabled: enableLLM && !!process.env.OPENAI_API_KEY,
  });

  return {
    baseline: Math.round(base),
    min: Math.round(min),
    max: Math.round(max),
    suggested: llm.price,
    reason: llm.reason,
    adjustmentPercent: llm.adjustmentPercent,
  };
}

module.exports = { suggestPrice, PRICING_BOUNDS, computeBaseline };
