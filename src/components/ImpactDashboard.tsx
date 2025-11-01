// src/components/ImpactDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { Leaf, Scale, TrendingUp, RefreshCw } from "lucide-react";
import { api, type ImpactResponse } from "../lib/api";

export function ImpactDashboard() {
  const [data, setData] = useState<ImpactResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchImpact() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.impact(); // requires auth token in storage
      setData(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load impact");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchImpact();
  }, []);

  // Formatters
  const formatKg = (v: number) => `${Number(v).toFixed(v % 1 === 0 ? 0 : 1)} kg`;
  const formatINR = (v: number) =>
    `₹${Math.round(v).toLocaleString("en-IN")}`;

  const metrics = useMemo(() => {
    const d = data || { kgRescued: 0, co2SavedKg: 0, rupeesSaved: 0 } as ImpactResponse;
    return [
      { icon: Scale, value: formatKg(d.kgRescued), label: "Food rescued", color: "text-[#5CB85C]" },
      { icon: Leaf, value: formatKg(d.co2SavedKg), label: "CO₂ saved", color: "text-[#5CB85C]" },
      { icon: TrendingUp, value: formatINR(d.rupeesSaved), label: "Saved this month", color: "text-[#5CB85C]" },
    ];
  }, [data]);

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm p-5 border border-green-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#5CB85C] flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-gray-900">Your Impact</h3>
        </div>

        <button
          onClick={fetchImpact}
          className="flex items-center gap-1 text-xs text-green-700 hover:text-green-800 px-2 py-1 rounded-md hover:bg-green-100"
          aria-label="Refresh impact"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white" />
              <div className="flex-1">
                <div className="h-4 bg-green-100 rounded w-1/3 mb-2" />
                <div className="h-2 bg-green-100 rounded w-2/3" />
              </div>
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-green-200">
            <div className="h-3 bg-green-100 rounded w-2/3 mx-auto" />
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="bg-white rounded-lg p-4 border border-red-200">
          <p className="text-sm text-red-600 mb-2">Failed to load impact data.</p>
          <button
            onClick={fetchImpact}
            className="text-sm text-green-700 hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Data state */}
      {!loading && !error && (
        <>
          <div className="space-y-4">
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  <metric.icon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl ${metric.color}`}>{metric.value}</span>
                    <span className="text-sm text-gray-600">{metric.label}</span>
                  </div>
                  {index !== metrics.length - 1 && (
                    <div
                      className="h-1 bg-gradient-to-r from-[#5CB85C] to-green-300 rounded-full mt-2"
                      style={{ width: `${(index + 1) * 30}%` }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-green-200">
            <p className="text-sm text-gray-600 text-center">
              {data
                ? `In the last ${data.rangeDays} days • ${data.ordersCompleted} order${data.ordersCompleted === 1 ? "" : "s"} completed`
                : "You're making a real difference! 🌱"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
