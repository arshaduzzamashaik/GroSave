// src/components/OrdersHeader.tsx
import { Filter, RotateCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

type OrderStatus =
  | "confirmed"
  | "ready"
  | "scanned"
  | "completed"
  | "cancelled";

interface OrdersHeaderProps {
  /** Notifies parent when user chooses a status filter. Use 'all' to clear. */
  onFilterChange?: (status: OrderStatus | "all") => void;
  /** Optional: parent can react to new totals whenever we refetch. */
  onRefetched?: (totals: { active: number; past: number }) => void;
  /** If true, we won’t auto-fetch counts on mount (parent fully controls it). */
  disableAutoFetch?: boolean;
}

export function OrdersHeader({
  onFilterChange,
  onRefetched,
  disableAutoFetch,
}: OrdersHeaderProps) {
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [pastCount, setPastCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selected, setSelected] = useState<OrderStatus | "all">("all");

  const filters: Array<{ key: OrderStatus | "all"; label: string }> = useMemo(
    () => [
      { key: "all", label: "All" },
      { key: "confirmed", label: "Confirmed" },
      { key: "ready", label: "Ready" },
      { key: "scanned", label: "Scanned" },
      { key: "completed", label: "Completed" },
      { key: "cancelled", label: "Cancelled" },
    ],
    []
  );

  async function fetchCounts() {
    try {
      setLoading(true);
      const [activeRes, pastRes] = await Promise.all([
        api.activeOrders(),
        api.pastOrders(),
      ]);
      const a = activeRes?.orders?.length ?? 0;
      const p = pastRes?.orders?.length ?? 0;
      setActiveCount(a);
      setPastCount(p);
      onRefetched?.({ active: a, past: p });
    } catch (e: any) {
      // Keep UI calm; you can also toast here
      console.error("Failed to fetch order counts", e?.message || e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!disableAutoFetch) {
      fetchCounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disableAutoFetch]);

  function applyFilter(k: OrderStatus | "all") {
    setSelected(k);
    setShowFilter(false);
    onFilterChange?.(k);
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <h1 className="text-[#3D3B6B]">My Orders</h1>

          {/* Pills with counts */}
          <div className="flex items-center gap-2">
            <span className="text-xs bg-purple-50 text-[#3D3B6B] px-2 py-1 rounded-full">
              Active {activeCount === null ? "…" : activeCount}
            </span>
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              Past {pastCount === null ? "…" : pastCount}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Refresh */}
          <button
            className="p-2 hover:bg-purple-50 rounded-full transition-colors disabled:opacity-60"
            onClick={fetchCounts}
            disabled={loading}
            title="Refresh counts"
          >
            <RotateCw
              className={`w-5 h-5 text-[#3D3B6B] ${
                loading ? "animate-spin" : ""
              }`}
            />
          </button>

          {/* Filter dropdown trigger */}
          <button
            className="p-2 hover:bg-purple-50 rounded-full transition-colors"
            onClick={() => setShowFilter((s) => !s)}
            title="Filter"
          >
            <Filter className="w-6 h-6 text-[#3D3B6B]" />
          </button>

          {/* Dropdown */}
          {showFilter && (
            <div className="absolute right-4 top-14 bg-white border border-gray-200 rounded-lg shadow-md w-44 py-1 z-50">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => applyFilter(f.key)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                    selected === f.key ? "text-[#3D3B6B]" : "text-gray-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
