// src/components/MonthlyCapCard.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

type MonthlyCapCardProps = {
  /** Optional override for the monthly bonus cap; if omitted, uses VITE_MAX_BONUS_COINS_PER_MONTH or 500 */
  capOverride?: number;
  /** When true, hides the card if the cap is not available or request fails */
  hideOnError?: boolean;
};

export function MonthlyCapCard({ capOverride, hideOnError = false }: MonthlyCapCardProps) {
  const [loading, setLoading] = useState(true);
  const [earned, setEarned] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Resolve cap: prop override → env → 500 default
  const cap: number = useMemo(() => {
    if (typeof capOverride === "number" && Number.isFinite(capOverride)) return capOverride;
    const fromEnv = Number((import.meta as any).env?.VITE_MAX_BONUS_COINS_PER_MONTH);
    return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : 500;
  }, [capOverride]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // walletBalance returns: currentBalance, monthlyCredit, spent, refillDate, daysUntilRefill
        // In your backend, wallet model tracks `bonusEarned` (updated by /api/earn/ad).
        // If controller includes it, we use it; else we gracefully fallback to 0.
        const res: any = await api.walletBalance();
        const bonusEarned = typeof res?.bonusEarned === "number" ? res.bonusEarned : 0;
        if (!mounted) return;
        setEarned(bonusEarned);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load bonus usage");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-5 shadow-sm border border-purple-100 animate-pulse">
        <div className="h-5 w-48 bg-white/70 rounded mb-4" />
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <div className="h-4 w-24 bg-white/70 rounded" />
            <div className="h-4 w-40 bg-white/70 rounded" />
          </div>
          <div className="h-3 bg-white rounded-full overflow-hidden">
            <div className="h-full bg-white/60 rounded-full w-1/3" />
          </div>
          <div className="h-4 w-56 bg-white/70 rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (error && hideOnError) return null;

  // Clamp values and compute progress
  const safeEarned = Math.max(0, Math.min(earned, cap));
  const remaining = Math.max(0, cap - safeEarned);
  const percentage = cap > 0 ? (safeEarned / cap) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-5 shadow-sm border border-purple-100">
      <h3 className="text-gray-900 mb-4">Bonus Earnings This Month</h3>

      {error && (
        <p className="text-xs text-red-500 mb-2">
          {error} — showing latest known values.
        </p>
      )}

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="text-[#3D3B6B]">
            {safeEarned} / {cap} coins earned
          </span>
        </div>

        <div className="h-3 bg-white rounded-full overflow-hidden" aria-label="Bonus earnings progress">
          <div
            className="h-full bg-gradient-to-r from-[#3D3B6B] to-[#5CB85C] rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className="text-sm text-gray-600 text-center">
          <span className="text-[#5CB85C]">{remaining} bonus coins</span> remaining this month
        </p>
      </div>
    </div>
  );
}
