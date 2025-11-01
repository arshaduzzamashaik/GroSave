// src/lib/clientPricing.ts
export async function fetchSuggestedPrice(input: {
  productId: string;
  mrp: number;
  hoursToExpiry: number;
  inventory: number;
  demandScore: number;
  sellThrough7d: number;
  enableLLM?: boolean;
}) {
  const res = await fetch("/api/pricing/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("pricing failed");
  return res.json();
}
