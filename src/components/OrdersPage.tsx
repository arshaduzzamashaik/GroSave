// src/components/OrdersPage.tsx
import { useState } from "react";
import { OrdersHeader } from "./OrdersHeader";
import { OrdersTabs } from "./OrdersTabs";
import { ActiveOrders } from "./ActiveOrders";
import { PastOrders } from "./PastOrders";
import { BottomNav } from "./BottomNav";

interface OrdersPageProps {
  onNavigate: (view: "home" | "wallet" | "orders" | "profile") => void;
}

export function OrdersPage({ onNavigate }: OrdersPageProps) {
  const [tab, setTab] = useState<"active" | "past">("active");

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* Keep header simple to match your current props */}
      <OrdersHeader />

      <main className="px-4 py-6 max-w-md mx-auto">
        <OrdersTabs activeTab={tab} onTabChange={setTab} />

        {tab === "active" ? (
          // Remove statusFilter prop to match your current ActiveOrdersProps
          <ActiveOrders onNavigate={onNavigate} />
        ) : (
          <PastOrders />
        )}
      </main>

      <BottomNav activeTab="orders" onNavigate={onNavigate} />
    </div>
  );
}
