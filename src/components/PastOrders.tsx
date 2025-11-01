// src/components/PastOrders.tsx
import { useEffect, useMemo, useState } from "react";
import { CheckCircle, RotateCcw } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { api, type Order, type OrdersResponse, type Product } from "../lib/api";

type PastOrderView = {
  id: string;
  orderNumber: string;
  productName: string;
  productImage?: string;
  quantity: number;
  completedOn?: string;
  coinsSpent: number;
};

interface PastOrdersProps {
  /**
   * Optional: handle Reorder click.
   * You’ll get the raw Order and (if loaded) the Product.
   * Common action: route to ProductDetail with that product,
   * so the user can pick a slot and reserve again.
   */
  onReorder?: (order: Order, product?: Product) => void;
}

export function PastOrders({ onReorder }: PastOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productsById, setProductsById] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [hydrating, setHydrating] = useState(false); // product fetch phase
  const [error, setError] = useState<string | null>(null);

  // Fetch past orders
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res: OrdersResponse = await api.pastOrders();
        if (cancelled) return;
        setOrders(res.orders ?? []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load past orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Hydrate product info (name/image) for the orders
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ids = Array.from(new Set(orders.map((o) => o.productId))).filter(Boolean);
      if (ids.length === 0) return;

      setHydrating(true);
      try {
        const entries = await Promise.all(
          ids.map(async (pid) => {
            try {
              const p = await api.getProduct(pid);
              return [pid, p] as const;
            } catch {
              return [pid, undefined] as const;
            }
          })
        );
        if (cancelled) return;
        const map: Record<string, Product> = {};
        for (const [pid, prod] of entries) {
          if (prod) map[pid] = prod;
        }
        setProductsById(map);
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orders]);

  const viewData: PastOrderView[] = useMemo(() => {
    return orders.map((o) => {
      const p = productsById[o.productId];
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        productName: p?.name ?? "Reserved Item",
        productImage: p?.image ?? (Array.isArray(p?.images) ? p?.images?.[0] : undefined),
        quantity: o.quantity,
        completedOn: o.completedAt
          ? new Date(o.completedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : undefined,
        coinsSpent: o.coinsSpent ?? 0,
      };
    });
  }, [orders, productsById]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-4 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </div>
            <div className="flex gap-3">
              <div className="w-20 h-20 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 bg-gray-200 rounded" />
                <div className="h-3 w-1/3 bg-gray-200 rounded" />
                <div className="h-3 w-1/4 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 border border-red-200">
        <p className="text-sm text-red-600">Failed to load past orders: {error}</p>
      </div>
    );
  }

  if (!viewData.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center">
        <p className="text-gray-600">No past orders yet.</p>
        <p className="text-sm text-gray-400">Your completed or cancelled orders will show up here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {viewData.map((orderView, idx) => {
        const rawOrder = orders.find((o) => o.id === orderView.id)!;
        const product = productsById[rawOrder.productId];

        return (
          <div key={orderView.id} className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{orderView.orderNumber}</span>
              <div className="flex items-center gap-1 text-[#5CB85C]">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">
                  {rawOrder.status === "completed" ? "Completed" : "Cancelled"}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <ImageWithFallback
                src={orderView.productImage}
                alt={orderView.productName}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 mb-1 truncate">{orderView.productName}</h3>
                <p className="text-sm text-gray-500 mb-1">
                  Quantity: {orderView.quantity} {orderView.quantity > 1 ? "units" : "unit"}
                </p>
                <p className="text-sm text-gray-500 mb-1">
                  {rawOrder.status === "completed"
                    ? `Completed: ${orderView.completedOn ?? "—"}`
                    : `Cancelled: ${
                        rawOrder.cancelledAt
                          ? new Date(rawOrder.cancelledAt).toLocaleDateString()
                          : "—"
                      }`}
                </p>
                <p className="text-sm text-[#3D3B6B]">
                  {rawOrder.status === "completed" ? "-" : ""}
                  {orderView.coinsSpent} GroCoins
                </p>
              </div>
            </div>

            <button
              className="w-full border-2 border-[#3D3B6B] text-[#3D3B6B] py-2 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              onClick={() => onReorder?.(rawOrder, product)}
              disabled={!product || hydrating}
              title={!product ? "Loading product details..." : "Reorder this item"}
            >
              <RotateCcw className="w-4 h-4" />
              Reorder
            </button>
          </div>
        );
      })}
    </div>
  );
}
