// src/components/BottomNav.tsx  (no visual changes except tiny badges)
import { useEffect, useRef, useState } from "react";
import { Home, ClipboardList, Coins, User } from "lucide-react";
import { api } from "../lib/api";

type TabId = "home" | "orders" | "wallet" | "profile";

const navItems: Array<{ id: TabId; label: string; icon: any }> = [
  { id: "home", label: "Home", icon: Home },
  { id: "orders", label: "My Orders", icon: ClipboardList },
  { id: "wallet", label: "Earn Coins", icon: Coins },
  { id: "profile", label: "Profile", icon: User }
];

interface BottomNavProps {
  activeTab: string;
  onNavigate: (view: TabId) => void;
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold bg-[#3D3B6B] text-white leading-none">
      {children}
    </span>
  );
}

function compactNumber(n: number) {
  try {
    return Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);
  } catch {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  }
}

export function BottomNav({ activeTab, onNavigate }: BottomNavProps) {
  const [activeOrdersCount, setActiveOrdersCount] = useState<number | null>(null);
  const [walletCoins, setWalletCoins] = useState<number | null>(null);
  const lastFetchRef = useRef<number>(0);

  async function fetchBadges() {
    const now = Date.now();
    if (now - lastFetchRef.current < 7000) return;
    lastFetchRef.current = now;

    try {
      const [ordersRes, walletRes] = await Promise.allSettled([
        api.activeOrders(),
        api.walletBalance()
      ]);
      if (ordersRes.status === "fulfilled") {
        setActiveOrdersCount(ordersRes.value.orders?.length ?? 0);
      }
      if (walletRes.status === "fulfilled") {
        setWalletCoins(walletRes.value.currentBalance ?? 0);
      }
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    fetchBadges();
  }, [activeTab]);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") fetchBadges();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-50">
      <div className="max-w-md mx-auto px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                activeTab === id ? "text-[#3D3B6B]" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs flex items-center">
                {label}
                {id === "orders" && activeOrdersCount ? <Badge>{activeOrdersCount}</Badge> : null}
                {id === "wallet" && walletCoins ? <Badge>{compactNumber(walletCoins)}</Badge> : null}
              </span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
