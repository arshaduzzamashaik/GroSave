// src/components/ActiveOrders.tsx
import { useEffect, useRef, useState } from "react";
import { OrderCard } from "./OrderCard";
import { EmptyOrders } from "./EmptyOrders";
import { api, type Order as ApiOrder, type Product } from "../lib/api";

// --- Local UI contract (matches your existing OrderCard/EmptyOrders usage) ---
export interface Order {
  id: string;
  orderNumber: string;
  productName: string;
  productImage: string;
  quantity: number;
  reservedOn: string;
  status: "confirmed" | "ready" | "expires-today";
  pickupLocation: string;
  distance: string;
  pickupTime: string;
  pickupDate: string;
  verificationCode: string;
}

interface ActiveOrdersProps {
  onNavigate: (view: "home" | "wallet" | "orders" | "profile") => void;
}

// --- Helpers ---
function fmtDateShort(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function relDayOrDate(targetISO?: string) {
  if (!targetISO) return "";
  const t = new Date(targetISO);
  const now = new Date();
  const tY = t.getFullYear(),
    tM = t.getMonth(),
    tD = t.getDate();
  const nY = now.getFullYear(),
    nM = now.getMonth(),
    nD = now.getDate();

  const today = new Date(nY, nM, nD);
  const thatDay = new Date(tY, tM, tD);
  const diffDays = Math.round((thatDay.getTime() - today.getTime()) / (1000 * 3600 * 24));

  const monthDay = t.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  if (diffDays === 0) return `Today, ${monthDay}`;
  if (diffDays === 1) return `Tomorrow, ${monthDay}`;
  if (diffDays === -1) return `Yesterday, ${monthDay}`;
  return monthDay;
}

function statusForCard(o: ApiOrder): Order["status"] {
  // If pickup is today and not yet ready/scanned, highlight as expiring today
  const todayStr = new Date().toISOString().slice(0, 10);
  const pickupYMD = o.pickupDate ? new Date(o.pickupDate).toISOString().slice(0, 10) : "";
  if ((o.status === "confirmed" || o.status === "ready") && pickupYMD === todayStr) {
    return "expires-today";
  }
  // Treat "scanned" as effectively "ready" in the UI
  if (o.status === "ready" || o.status === "scanned") return "ready";
  return "confirmed";
}

function timeLabelFromOrder(o: ApiOrder): string {
  // Backend stores a human label in pickupTimeSlot (e.g., "Morning (8 AM - 12 PM)")
  if (o.pickupTimeSlot) {
    // Normalize to your previous style: "Morning: 8 AM - 12 PM"
    const m = o.pickupTimeSlot.match(/^([^()]+)\s*\((.+)\)$/);
    if (m) return `${m[1].trim()}: ${m[2].trim()}`;
    return o.pickupTimeSlot;
  }
  return "";
}

function safeVerificationCode(o: ApiOrder): string {
  return o.verificationCode ?? "";
}

function reservedOnLabel(o: ApiOrder): string {
  const d = o.reservedAt ? new Date(o.reservedAt) : new Date();
  return fmtDateShort(d);
}

// --- Component ---
export function ActiveOrders({ onNavigate }: ActiveOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);

  async function fetchActive() {
    try {
      setError(null);
      setLoading(true);

      // 1) Fetch active orders
      const res = await api.activeOrders();
      const list = res.orders ?? [];

      if (list.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // 2) Enrich with product details (name/image)
      const productMap = new Map<string, Product>();
      await Promise.all(
        list.map(async (o) => {
          if (!productMap.has(o.productId)) {
            try {
              const p = await api.getProduct(o.productId);
              productMap.set(o.productId, p);
            } catch {
              // keep missing product gracefully
              productMap.set(o.productId, {
                id: o.productId,
                name: "Product",
                brand: "",
                category: "",
                currentPrice: 0
              } as Product);
            }
          }
        })
      );

      // 3) Shape into UI Order for OrderCard
      const uiOrders: Order[] = list.map((o) => {
        const p = productMap.get(o.productId);
        return {
          id: o.id,
          orderNumber: `#${o.orderNumber ?? ""}`,
          productName: p?.name ?? "Product",
          productImage: (p?.image || (p?.images?.[0] ?? "")) as string,
          quantity: o.quantity ?? 1,
          reservedOn: reservedOnLabel(o),
          status: statusForCard(o),
          pickupLocation: o.pickupLocationId, // You only have the ID; if you want name, fetch locations and map id->name.
          distance: "", // Not available from API right now
          pickupTime: timeLabelFromOrder(o),
          pickupDate: relDayOrDate(o.pickupDate),
          verificationCode: safeVerificationCode(o)
        };
      });

      setOrders(uiOrders);
    } catch (e: any) {
      setError(e?.message || "Failed to load active orders");
      setOrders([]);
    } finally {
      setLoading(false);
      lastFetchRef.current = Date.now();
    }
  }

  // Initial + visibility refresh
  useEffect(() => {
    fetchActive();
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        if (now - lastFetchRef.current > 10000) fetchActive();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Empty state
  if (!loading && !error && orders.length === 0) {
    return <EmptyOrders onNavigate={onNavigate} />;
  }

  // Simple loading/error states (non-intrusive; you can replace with your skeletons/toasts)
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-24 rounded-xl bg-gray-100" />
        <div className="animate-pulse h-24 rounded-xl bg-gray-100" />
        <div className="animate-pulse h-24 rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg">
        {error}
        <button
          onClick={fetchActive}
          className="ml-3 px-3 py-1 rounded-md bg-red-600 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  // Render orders
  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
