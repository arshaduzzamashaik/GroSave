// src/components/WalletHeader.tsx
import { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { api, type WalletBalanceResponse } from '../lib/api';

type Props = {
  /** Optional click handler for the Settings button */
  onOpenSettings?: () => void;
};

export function WalletHeader({ onOpenSettings }: Props) {
  const [wb, setWb] = useState<WalletBalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.walletBalance(); // requires auth token set via verification flow
        if (mounted) setWb(res);
      } catch {
        // Silent fail → keep header minimal if unauthenticated or API not ready
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const balanceText =
    wb && !loading ? `${wb.currentBalance.toLocaleString()} coins` : null;

  const refillText =
    wb && !loading
      ? wb.daysUntilRefill === 0
        ? 'Refills today'
        : `Refills in ${wb.daysUntilRefill} day${wb.daysUntilRefill === 1 ? '' : 's'}`
      : null;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-[#3D3B6B] leading-tight">My GroWallet</h1>

          {/* Subtle live info from backend (optional) */}
          {(balanceText || refillText) && (
            <div className="mt-0.5 flex items-center gap-2">
              {balanceText && (
                <span className="text-xs text-[#3D3B6B] bg-purple-50 px-2 py-0.5 rounded-full">
                  {balanceText}
                </span>
              )}
              {refillText && (
                <span className="text-xs text-gray-500 truncate">{refillText}</span>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onOpenSettings}
          className="p-2 hover:bg-purple-50 rounded-full transition-colors"
          aria-label="Wallet settings"
        >
          <Settings className="w-6 h-6 text-[#3D3B6B]" />
        </button>
      </div>
    </header>
  );
}
