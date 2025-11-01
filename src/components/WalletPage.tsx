// src/components/WalletPage.tsx
import { WalletHeader } from './WalletHeader';
import { WalletBalanceCard } from './WalletBalanceCard';
import { TransactionHistory } from './TransactionHistory';
import { EarnCoinsSection } from './EarnCoinsSection';
import { MonthlyCapCard } from './MonthlyCapCard';
import { BottomNav } from './BottomNav';

type View = 'home' | 'wallet' | 'orders' | 'profile';

interface WalletPageProps {
  onNavigate: (view: View) => void;
}

export function WalletPage({ onNavigate }: WalletPageProps) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* Header pulls live wallet info (current balance / refill hint) from backend */}
      <WalletHeader onOpenSettings={() => onNavigate('profile')} />

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Balance card calls api.walletBalance() internally and renders loading/error states */}
        <WalletBalanceCard />

        {/* Recent transactions fetches api.walletTransactions(page, limit) */}
        <TransactionHistory />

        {/* Earn actions: calls api.earnByAd() with optimistic UI + toasts */}
        <EarnCoinsSection />

        {/* Bonus-cap progress: derives from wallet/transactions as wired in its component */}
        <MonthlyCapCard />
      </main>

      <BottomNav activeTab="wallet" onNavigate={onNavigate} />
    </div>
  );
}
