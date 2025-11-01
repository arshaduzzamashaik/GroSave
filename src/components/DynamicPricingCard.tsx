// src/components/DynamicPricingCard.tsx
import { useEffect, useMemo, useState } from "react";
import { TrendingDown, Clock } from "lucide-react";
import type { Product } from "../lib/api";

// ⏱️ simple ticking countdown hook
function useCountdown(targetIso?: string) {
  const target = useMemo(
    () => (targetIso ? new Date(targetIso).getTime() : null),
    [targetIso]
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!target) return { hours: 0, minutes: 0, seconds: 0, done: true };

  const diff = Math.max(0, target - now);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  const done = diff <= 0;
  return { hours, minutes, seconds, done };
}

/**
 * Backward-compatible props:
 * - You can pass a full `product` (old usage)
 * - Or pass explicit pricing props (new usage, e.g. AI price)
 *
 * If both are provided, explicit pricing props win for price/discount display,
 * while timing/drop windows still come from `product` (if present).
 */
type Props = {
  /** Optional: full Product (used for timing windows and as default price source) */
  product?: Product;

  /** Optional explicit overrides (new AI usage) */
  currentPrice?: number;
  originalPrice?: number;
  discount?: number;

  /** Optional note to explain AI pricing adjustments */
  pricingNote?: string;

  /**
   * Optional: show an exact target price when the drop window starts.
   * If omitted, we’ll show “Reduced price window starts in”.
   */
  dropPriceCoins?: number;
};

export function DynamicPricingCard({
  product,
  currentPrice,
  originalPrice,
  discount,
  pricingNote,
  dropPriceCoins,
}: Props) {
  // Pull timing & dynamic flags from product (if provided)
  const {
    expiryDate,
    dynamicPricingEnabled,
    dropToPriceAtHoursBeforeExpiry,
    freeAtHoursBeforeExpiry,
  } = product ?? {};

  const expiryAt = expiryDate ? new Date(expiryDate) : null;
  const dropStartsAt =
    expiryAt && typeof dropToPriceAtHoursBeforeExpiry === "number"
      ? new Date(expiryAt.getTime() - dropToPriceAtHoursBeforeExpiry * 60 * 60 * 1000)
      : null;

  const freeStartsAt =
    expiryAt && typeof freeAtHoursBeforeExpiry === "number"
      ? new Date(expiryAt.getTime() - freeAtHoursBeforeExpiry * 60 * 60 * 1000)
      : null;

  const now = new Date();

  // Determine phase relative to expiry & windows
  const phase: "expired" | "free" | "drop" | "normal" = useMemo(() => {
    if (!expiryAt) return "normal";
    if (now >= expiryAt) return "expired";
    if (freeStartsAt && now >= freeStartsAt) return "free";
    if (dropStartsAt && now >= dropStartsAt) return "drop";
    return "normal";
  }, [now, expiryAt, freeStartsAt, dropStartsAt]);

  // Resolve effective prices:
  // 1) If explicit props are given, use them
  // 2) Else use values from product
  const baseCurrent = currentPrice ?? product?.currentPrice ?? 0;
  const baseOriginal = originalPrice ?? product?.originalPrice ?? baseCurrent ?? 0;

  // Effective price respects FREE window
  const effectivePrice = phase === "free" ? 0 : baseCurrent;

  // Discount: prefer explicit `discount` prop, else derive
  const discountPct =
    typeof discount === "number"
      ? discount
      : baseOriginal > 0
      ? Math.round(((baseOriginal - (effectivePrice || 0)) / baseOriginal) * 100)
      : 0;

  const savings = Math.max(0, (baseOriginal || 0) - (effectivePrice || 0));

  // Next event for countdown
  const nextEvent = useMemo(() => {
    if (!expiryAt)
      return { label: null as string | null, atIso: undefined as string | undefined };

    if (phase === "normal" && dropStartsAt) {
      return {
        label: dropPriceCoins
          ? `Price drops to ${dropPriceCoins} coins in`
          : "Reduced price window starts in",
        atIso: dropStartsAt.toISOString(),
      };
    }
    if ((phase === "normal" || phase === "drop") && freeStartsAt) {
      return { label: "FREE window starts in", atIso: freeStartsAt.toISOString() };
    }
    // Otherwise count down to expiry
    return { label: "Expires in", atIso: expiryAt.toISOString() };
  }, [phase, dropStartsAt, freeStartsAt, expiryAt, dropPriceCoins]);

  const t = useCountdown(nextEvent.atIso);

  // Helper for 2-digit
  const d2 = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-5 shadow-sm border border-purple-100">
      {/* Price row */}
      <div className="flex items-baseline gap-3 mb-3">
        {effectivePrice === 0 ? (
          <>
            <span className="text-[#3D3B6B] text-4xl">FREE</span>
            {baseOriginal > 0 && (
              <span className="text-gray-400 text-lg line-through">{baseOriginal} GroCoins</span>
            )}
          </>
        ) : (
          <>
            <span className="text-[#3D3B6B] text-4xl">{effectivePrice}</span>
            <span className="text-gray-500">GroCoins</span>
            {baseOriginal > 0 && (
              <span className="text-gray-400 text-lg line-through ml-auto">{baseOriginal}</span>
            )}
          </>
        )}
      </div>

      {/* Savings pill */}
      {baseOriginal > 0 && savings > 0 && (
        <div className="bg-[#5CB85C] text-white px-3 py-2 rounded-lg inline-flex items-center gap-2 mb-3">
          <TrendingDown className="w-4 h-4" />
          <span>
            You save {savings} coins{discountPct ? ` (${discountPct}%)` : ""}
          </span>
        </div>
      )}

      {/* Optional: Pricing note (AI reason) */}
      {!!pricingNote && (
        <p className="text-xs text-gray-500 italic mb-3">Pricing note: {pricingNote}</p>
      )}

      {/* Dynamic pricing info & countdown (only if product supplies timing & not expired) */}
      {dynamicPricingEnabled && expiryAt && phase !== "expired" && (
        <>
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[#FF8C42]" />
              <p className="text-sm text-gray-900">
                {phase === "normal" && nextEvent.label
                  ? nextEvent.label
                  : phase === "drop" && nextEvent.label
                  ? nextEvent.label // usually “FREE window starts in”
                  : "Expires in"}
              </p>
            </div>

            <div className="flex gap-2">
              <div className="bg-white rounded px-2 py-1 min-w-[3rem] text-center">
                <div className="text-[#3D3B6B]">{d2(t.hours)}</div>
                <div className="text-xs text-gray-500">hours</div>
              </div>
              <div className="bg-white rounded px-2 py-1 min-w-[3rem] text-center">
                <div className="text-[#3D3B6B]">{d2(t.minutes)}</div>
                <div className="text-xs text-gray-500">mins</div>
              </div>
              <div className="bg-white rounded px-2 py-1 min-w-[3rem] text-center">
                <div className="text-[#3D3B6B]">{d2(t.seconds)}</div>
                <div className="text-xs text-gray-500">secs</div>
              </div>
            </div>
          </div>

          {/* Footer note about free window (if configured) */}
          {typeof freeAtHoursBeforeExpiry === "number" && freeAtHoursBeforeExpiry > 0 && (
            <p className="text-sm text-gray-600 text-center">
              <span className="text-[#5CB85C]">FREE (0 coins)</span> in last{" "}
              {freeAtHoursBeforeExpiry} {freeAtHoursBeforeExpiry === 1 ? "hour" : "hours"} before
              expiry
            </p>
          )}
        </>
      )}

      {/* If dynamic pricing is disabled, still hint expiry if we have it */}
      {!dynamicPricingEnabled && expiryAt && phase !== "expired" && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 mt-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-600" />
            <p className="text-sm text-gray-900">Expires in</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-white rounded px-2 py-1 min-w-[3rem] text-center">
              <div className="text-[#3D3B6B]">{d2(t.hours)}</div>
              <div className="text-xs text-gray-500">hours</div>
            </div>
            <div className="bg-white rounded px-2 py-1 min-w-[3rem] text-center">
              <div className="text-[#3D3B6B]">{d2(t.minutes)}</div>
              <div className="text-xs text-gray-500">mins</div>
            </div>
            <div className="bg-white rounded px-2 py-1 min-w-[3rem] text-center">
              <div className="text-[#3D3B6B]">{d2(t.seconds)}</div>
              <div className="text-xs text-gray-500">secs</div>
            </div>
          </div>
        </div>
      )}

      {/* Expired state */}
      {phase === "expired" && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-3">
          This item has expired.
        </p>
      )}
    </div>
  );
}
