// src/components/EmptyOrders.tsx
import { useEffect, useState } from "react";
import { ShoppingBasket, Leaf } from "lucide-react";
import { api } from "../lib/api";

interface EmptyOrdersProps {
  onNavigate: (view: "home" | "wallet" | "orders" | "profile") => void;
}

export function EmptyOrders({ onNavigate }: EmptyOrdersProps) {
  const [meta, setMeta] = useState<{ totalProducts?: number; totalHubs?: number }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchMeta() {
      try {
        // Get total products (use tiny page size, read pagination.total)
        const productsResp = await api.listProducts({ page: 1, limit: 1 });
        // Get pickup hubs count
        const hubsResp = await api.listPickupLocations();

        if (!mounted) return;
        setMeta({
          totalProducts: productsResp?.pagination?.total ?? 0,
          totalHubs: hubsResp?.locations?.length ?? 0,
        });
      } catch {
        // Silent fail — keep the UI clean if backend is down
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchMeta();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="relative mb-6">
        <div className="w-32 h-32 rounded-full bg-purple-100 flex items-center justify-center">
          <ShoppingBasket className="w-16 h-16 text-[#3D3B6B]" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <Leaf className="w-6 h-6 text-[#5CB85C]" />
        </div>
      </div>

      <h2 className="text-gray-900 mb-2 text-center">No active reservations</h2>
      <p className="text-gray-500 text-center mb-4 max-w-xs">
        Browse fresh items and reserve your groceries to help reduce food waste
      </p>

      {/* Context badges from backend */}
      {!loading && (meta.totalProducts || meta.totalHubs) ? (
        <div className="flex items-center gap-2 mb-6">
          {typeof meta.totalProducts === "number" ? (
            <span className="text-xs bg-purple-50 text-[#3D3B6B] border border-purple-200 px-3 py-1 rounded-full">
              {meta.totalProducts} items available
            </span>
          ) : null}
          {typeof meta.totalHubs === "number" ? (
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full">
              {meta.totalHubs} pickup hubs
            </span>
          ) : null}
        </div>
      ) : (
        <div className="h-6 mb-6" />
      )}

      <button
        onClick={() => onNavigate("home")}
        className="bg-[#3D3B6B] text-white px-8 py-3 rounded-lg hover:bg-[#2d2950] transition-colors"
      >
        Start Shopping
      </button>
    </div>
  );
}
