// src/components/SuccessScreen.tsx
import { useEffect, useState } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

interface SuccessScreenProps {
  onStartShopping: () => void;
  /** Optionally override the credited amount shown */
  creditedOverride?: number;
}

export function SuccessScreen({ onStartShopping, creditedOverride }: SuccessScreenProps) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [credited, setCredited] = useState<number | null>(null);

  // Entrance animation
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Fetch real wallet info to show the actual monthly credit from backend
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        // If caller already knows the amount, skip network
        if (typeof creditedOverride === 'number') {
          if (mounted) {
            setCredited(creditedOverride);
            setLoading(false);
          }
          return;
        }

        const w = await api.walletBalance(); // requires auth token already set during OTP verify
        // Prefer the configured monthly credit; fall back to current balance if needed
        const amount = typeof w.monthlyCredit === 'number'
          ? w.monthlyCredit
          : (typeof w.currentBalance === 'number' ? w.currentBalance : 4000);

        if (mounted) {
          setCredited(amount);
        }
      } catch {
        // Silent fallback to default demo value
        if (mounted) setCredited(4000);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [creditedOverride]);

  const amountText = loading
    ? '••••'
    : `${credited?.toLocaleString('en-IN') ?? '4,000'}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3D3B6B] to-[#5CB85C] flex flex-col items-center justify-center px-6">
      <div
        className={`flex flex-col items-center transition-all duration-700 ${
          show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center animate-bounce">
            <CheckCircle className="w-20 h-20 text-[#5CB85C]" strokeWidth={2} />
          </div>
          <div className="absolute -top-4 -right-4 animate-pulse">
            <Sparkles className="w-12 h-12 text-yellow-300" />
          </div>
          <div className="absolute -bottom-2 -left-4 animate-pulse delay-150">
            <Sparkles className="w-8 h-8 text-yellow-300" />
          </div>
        </div>

        <h1 className="text-white text-4xl mb-3 text-center">Welcome to GroSave!</h1>

        <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 mb-8">
          <p className="text-white text-center text-lg">
            Wallet credited with{' '}
            <span className="text-yellow-300">
              {amountText} GroCoins
            </span>
          </p>
        </div>

        <p className="text-purple-200 text-center mb-12 max-w-md">
          You're all set! Start browsing quality groceries and make a positive impact on the environment.
        </p>

        <button
          onClick={onStartShopping}
          className="bg-white text-[#3D3B6B] px-12 py-4 rounded-full text-lg hover:bg-gray-100 transition-colors shadow-lg disabled:opacity-60"
          aria-label="Start Shopping"
          disabled={loading && typeof creditedOverride !== 'number'}
        >
          Start Shopping
        </button>
      </div>
    </div>
  );
}
