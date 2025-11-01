// src/components/GroCoinWallet.tsx
import { useEffect, useMemo, useState } from "react";
import { Coins } from "lucide-react";
import { api } from "../lib/api";

type Balance = {
  currentBalance: number;
  monthlyCredit: number;
  spent: number;
  refillDate?: string;
  daysUntilRefill: number;
};

export function GroCoinWallet() {
  const [data, setData] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.walletBalance(); // GET /api/wallet/balance (auth)
        if (!mounted) return;
        setData(res);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Failed to load wallet");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const usagePct = useMemo(() => {
    if (!data) return 0;
    const denom = data.monthlyCredit || 1;
    // backend returns `spent`, so %used = spent / monthlyCredit
    const pct = Math.max(0, Math.min(100, (data.spent / denom) * 100));
    return Math.round(pct);
  }, [data]);

  const refillText = useMemo(() => {
    if (!data) return "";
    const d = Math.max(0, Math.floor(data.daysUntilRefill || 0));
    if (d === 0) return "Refills today";
    if (d === 1) return "Next refill in 1 day";
    return `Next refill in ${d} days`;
  }, [data]);

  const balanceDisplay = useMemo(() => {
    if (!data) return "—";
    return data.currentBalance.toLocaleString();
  }, [data]);

  return (
    <div className="bg-gradient-to-br from-[#3D3B6B] to-[#5a5896] rounded-2xl p-6 shadow-lg mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center shadow-md">
              <Coins className="w-6 h-6 text-yellow-900" />
            </div>
            <div>
              <div className="text-white text-3xl">
                {loading ? "…" : balanceDisplay}
              </div>
            </div>
          </div>
          <p className="text-purple-200 text-sm">
            {loading ? "Loading balance…" : "Available Balance"}
          </p>
        </div>

        <div className="bg-[#5CB85C] text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap">
          {loading ? "Checking refill…" : refillText}
        </div>
      </div>

      {/* Error notice */}
      {err && (
        <div className="mb-3 text-xs text-red-200 bg-red-500/10 border border-red-400/30 rounded-md px-3 py-2">
          {err}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-purple-200">
          <span>Monthly usage</span>
          {loading ? (
            <span>—</span>
          ) : (
            <span>
              {usagePct}% used
              {data?.monthlyCredit
                ? ` • ${data.spent.toLocaleString()}/${data.monthlyCredit.toLocaleString()}`
                : ""}
            </span>
          )}
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#5CB85C] to-green-400 rounded-full transition-[width] duration-500"
            style={{ width: loading ? "0%" : `${usagePct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
