// src/components/WalletBalanceCard.tsx
import { useEffect, useState } from 'react';
import { Coins, Calendar } from 'lucide-react';
import { api, type WalletBalanceResponse } from '../lib/api';

export function WalletBalanceCard() {
  const [data, setData] = useState<WalletBalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.walletBalance();
        if (mounted) setData(res);
      } catch (e: any) {
        if (mounted) setErr(e?.message || 'Could not load wallet balance.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const currentBalance = data?.currentBalance ?? 0;
  const monthlyCredit = data?.monthlyCredit ?? 0;
  const spent = data?.spent ?? 0;
  const daysUntilRefill = data?.daysUntilRefill ?? 0;

  const percentUsed =
    monthlyCredit > 0 ? Math.min(100, Math.max(0, (spent / monthlyCredit) * 100)) : 0;

  return (
    <div className="bg-gradient-to-br from-[#3D3B6B] via-[#5a5896] to-[#3D3B6B] rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center shadow-lg animate-pulse">
            <Coins className="w-10 h-10 text-yellow-900" />
          </div>
          <div className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 animate-ping opacity-20"></div>
        </div>

        <div className="text-white text-5xl mb-2">
          {loading ? '—' : currentBalance.toLocaleString()}
        </div>
        <p className="text-purple-200">GroCoins</p>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-purple-100 text-sm">Monthly Credit</span>
          <span className="text-white">
            {loading ? '—' : `${monthlyCredit.toLocaleString()} coins`}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-purple-200">
            <span>{loading ? '—' : `${spent.toLocaleString()} spent`}</span>
            <span>
              {loading
                ? '—'
                : `${Math.max(0, monthlyCredit - spent).toLocaleString()} remaining`}
            </span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#5CB85C] to-green-400 rounded-full transition-all"
              style={{ width: `${percentUsed}%` }}
            ></div>
          </div>
        </div>
      </div>

      {err ? (
        <div className="text-center text-sm text-red-200">{err}</div>
      ) : (
        <div className="flex items-center justify-center gap-2 text-purple-100 text-sm">
          <Calendar className="w-4 h-4" />
          <span>
            {loading
              ? 'Refill info loading…'
              : daysUntilRefill === 0
              ? 'Refills today'
              : `Refills in ${daysUntilRefill} day${daysUntilRefill === 1 ? '' : 's'}`}
          </span>
        </div>
      )}
    </div>
  );
}
