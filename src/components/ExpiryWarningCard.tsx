// src/components/ExpiryWarningCard.tsx
import { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle } from "lucide-react";
import { api, Product } from "../lib/api";

type Status = "urgent" | "warning" | "safe" | "free";

interface ExpiryWarningCardProps {
  /** Optional: if provided, the card will fetch product details and derive expiry/status. */
  productId?: string;

  /** If productId is not provided, use these props (current behavior). */
  expiryDate?: string; // ISO or readable string
  expiryStatus?: Status;

  /** Optional: override “free window” (hours before expiry) for messaging if you’re not using productId */
  freeAtHoursBeforeExpiry?: number;
}

/** Utility: parse ISO or loose date text safely */
function toDateSafe(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** Utility: format like "Nov 2, 2025" */
function formatNice(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Utility: compute hours (float) from now until given date */
function hoursUntil(d: Date | null): number | null {
  if (!d) return null;
  const ms = d.getTime() - Date.now();
  return ms / (1000 * 60 * 60);
}

/** Derive a status from hours remaining (fallback if no explicit status) */
function deriveStatusByHours(h: number | null, freeWindowHrs: number): Status {
  if (h === null) return "safe";
  if (h <= 0) return "free"; // practically expired today; treat as free/urgent window
  if (h <= freeWindowHrs) return "free";
  if (h <= 24) return "urgent";
  if (h <= 48) return "warning";
  return "safe";
}

export function ExpiryWarningCard(props: ExpiryWarningCardProps) {
  const {
    productId,
    expiryDate: expiryDateProp,
    expiryStatus: expiryStatusProp,
    freeAtHoursBeforeExpiry: freeWindowOverride,
  } = props;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(Boolean(productId));

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!productId) return;
      try {
        const p = await api.getProduct(productId);
        if (mounted) setProduct(p);
      } catch {
        // silent fail — keep UI graceful
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [productId]);

  // Choose data source (backend product vs props)
  const expiryDateISO =
    (product?.expiryDate as string | undefined) ?? expiryDateProp ?? "";
  const dynamicPricingEnabled = Boolean(product?.dynamicPricingEnabled);
  const freeAtHoursBeforeExpiry =
    product?.freeAtHoursBeforeExpiry ??
    freeWindowOverride ??
    6; // sensible default from your UX copy

  const expiry = useMemo(() => toDateSafe(expiryDateISO), [expiryDateISO]);
  const hoursLeft = useMemo(() => hoursUntil(expiry), [expiry]);

  // Final status: explicit prop > derived from backend > derived from date math
  const derivedStatus = useMemo<Status>(() => {
    if (expiryStatusProp) return expiryStatusProp;
    return deriveStatusByHours(hoursLeft, freeAtHoursBeforeExpiry);
  }, [expiryStatusProp, hoursLeft, freeAtHoursBeforeExpiry]);

  // Countdown label coloring
  const getCountdownColor = () => {
    switch (derivedStatus) {
      case "urgent":
      case "free":
        return "text-[#FF8C42]";
      case "warning":
        return "text-yellow-600";
      case "safe":
        return "text-[#5CB85C]";
      default:
        return "text-gray-600";
    }
  };

  // Humanized time text
  const getCountdownText = () => {
    if (hoursLeft === null) return "Check expiry";
    if (hoursLeft <= 0) return "Expires today!";
    if (derivedStatus === "free") {
      // inside free window or configured as free
      const h = Math.max(0, Math.floor(hoursLeft));
      const m = Math.max(0, Math.floor((hoursLeft % 1) * 60));
      return h > 0
        ? `FREE window active • ${h}h ${m}m left`
        : `FREE window active • ${m}m left`;
    }
    if (hoursLeft < 24) {
      const h = Math.ceil(hoursLeft);
      return `${h} hour${h === 1 ? "" : "s"} remaining`;
    }
    const d = Math.ceil(hoursLeft / 24);
    return `${d} day${d === 1 ? "" : "s"} remaining`;
  };

  // Secondary strip (safety)
  const safetyText =
    derivedStatus === "free"
      ? "Eligible for FREE pickup • Quality checked"
      : "Safe to consume • Quality checked";

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <div className="bg-white p-2 rounded-lg">
          <Calendar className="w-5 h-5 text-[#FF8C42]" />
        </div>
        <div className="flex-1">
          <p className="text-gray-900 mb-1">
            Best Before:{" "}
            <span className="text-gray-900">
              {loading ? "Loading…" : formatNice(expiry)}
            </span>
          </p>
          <p className={getCountdownColor()}>{loading ? " " : getCountdownText()}</p>
        </div>
      </div>

      {/* Dynamic pricing/free window hint (only when we know from backend or override) */}
      {(dynamicPricingEnabled || freeAtHoursBeforeExpiry > 0) && (
        <div className="mb-2">
          <div className="text-xs text-gray-700">
            {derivedStatus === "free"
              ? "This item is in the FREE window before expiry."
              : `Turns FREE in the last ${freeAtHoursBeforeExpiry} hour${
                  freeAtHoursBeforeExpiry === 1 ? "" : "s"
                } before expiry.`}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 bg-white/60 rounded-lg p-2">
        <CheckCircle className="w-4 h-4 text-[#5CB85C] flex-shrink-0" />
        <p className="text-sm text-gray-700">{safetyText}</p>
      </div>
    </div>
  );
}
