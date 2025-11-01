// src/components/CategoryFilters.tsx
import { useEffect, useMemo, useState } from "react";
import { api, type CategoriesResponse } from "../lib/api";

type CategoryFiltersProps = {
  /** Controlled value (category display name like "All", "Dairy", etc.). If omitted, component is uncontrolled. */
  value?: string;
  /** Called whenever selection changes (receives category display name). */
  onChange?: (category: string) => void;
  /** Show product counts returned by the backend (default: false to keep your original UI clean). */
  showCounts?: boolean;
  /** ClassName passthrough for the root container. */
  className?: string;
};

/** Static fallback list used when the API is unavailable. */
const FALLBACK = ["All", "Dairy", "Packaged Food", "Fresh Produce", "Beverages"];

export function CategoryFilters({
  value,
  onChange,
  showCounts = false,
  className = "",
}: CategoryFiltersProps) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [serverCats, setServerCats] = useState<CategoriesResponse["categories"]>([]);

  // Uncontrolled local state, seeded to "All"
  const [internalSelected, setInternalSelected] = useState<string>("All");

  const selected = value ?? internalSelected;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setErr(null);
        setLoading(true);
        const res = await api.listCategories(); // { categories: [{id,name,productCount}, ...] }
        if (!mounted) return;

        // Keep order: ensure "All" stays first if present
        const sorted = [...res.categories].sort((a, b) => {
          if (a.name === "All") return -1;
          if (b.name === "All") return 1;
          // then by name
          return a.name.localeCompare(b.name);
        });

        setServerCats(sorted);
      } catch (e: any) {
        setErr(e?.message || "Failed to load categories");
        setServerCats([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    // Prefer server categories -> map to display names
    if (serverCats.length > 0) return serverCats.map((c) => c.name);
    // If server failed or returned nothing, fallback
    return FALLBACK;
  }, [serverCats]);

  function handleSelect(categoryName: string) {
    if (value === undefined) {
      // Uncontrolled: update local state
      setInternalSelected(categoryName);
    }
    onChange?.(categoryName);
  }

  // Optional counts map (only if showCounts enabled and we have server data)
  const counts: Record<string, number> = useMemo(() => {
    if (!showCounts || serverCats.length === 0) return {};
    const map: Record<string, number> = {};
    for (const c of serverCats) {
      // backend uses -1 for "All" synthetic count — hide or compute later if needed
      if (typeof c.productCount === "number" && c.productCount >= 0) {
        map[c.name] = c.productCount;
      }
    }
    return map;
  }, [showCounts, serverCats]);

  return (
    <div className={`mb-6 -mx-4 px-4 ${className}`}>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="tablist" aria-label="Product categories">
        {/* Loading shimmer pills (subtle, keep styles aligned with your design) */}
        {loading && serverCats.length === 0 ? (
          <>
            <div className="h-9 w-20 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
            <div className="h-9 w-28 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
            <div className="h-9 w-24 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
          </>
        ) : null}

        {/* Render categories (from server or fallback) */}
        {!loading &&
          categories.map((category) => {
            const isActive = selected === category;
            const count = counts[category];

            return (
              <button
                key={category}
                role="tab"
                aria-selected={isActive}
                onClick={() => handleSelect(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? "bg-[#3D3B6B] text-white shadow-md"
                    : "bg-white text-[#3D3B6B] border-2 border-[#3D3B6B]"
                }`}
              >
                <span>{category}</span>
                {showCounts && typeof count === "number" ? (
                  <span
                    className={`ml-2 inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-full ${
                      isActive ? "bg-white text-[#3D3B6B]" : "bg-[#3D3B6B] text-white"
                    }`}
                    aria-label={`${count} items`}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
      </div>

      {/* Non-blocking error note (kept minimal; UI still works with fallback) */}
      {err && serverCats.length === 0 ? (
        <div className="mt-2 text-xs text-red-600">{err}</div>
      ) : null}
    </div>
  );
}
