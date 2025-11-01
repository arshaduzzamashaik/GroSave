// src/components/ProductGrid.tsx
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "./ProductCard";
import { api } from "../lib/api";
import type { Product as ApiProduct } from "../lib/api";

export interface Product {
  id: string;
  name: string;
  brand: string;
  image: string;
  images?: string[];
  currentPrice: number;
  originalPrice: number;
  discount: number;
  expiryStatus: "urgent" | "warning" | "safe" | "free";
  expiryText: string;
  expiryDate: string;
  category: string;
  unitsAvailable: number;
  description?: string;
}

type Props = {
  onProductClick: (product: Product) => void;
  /** Optional: filter by backend category name */
  category?: string;
  /** Optional: backend search query */
  search?: string;
  /** Optional: page size; backend default 20 */
  limit?: number;
};

function computeExpiryStatus(p: ApiProduct): "urgent" | "warning" | "safe" | "free" {
  // Prefer backend string if present & valid
  const s = (p.expiryStatus || "").toLowerCase();
  if (s === "free" || s === "urgent" || s === "warning" || s === "safe") {
    return s as any;
  }
  // Fallback by days remaining
  if (!p.expiryDate) return "safe";
  const now = new Date();
  const end = new Date(p.expiryDate);
  const days = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "free";
  if (days === 1) return "urgent";
  if (days <= 2) return "warning";
  return "safe";
}

function computeExpiryText(status: Product["expiryStatus"], p: ApiProduct): string {
  if (status === "free") return "FREE - Last hours!";
  if (!p.expiryDate) return "Check expiry";
  const now = new Date();
  const end = new Date(p.expiryDate);
  const days = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  if (status === "urgent") return "< 2 days - Hurry!";
  if (status === "warning") return `${days} day${days > 1 ? "s" : ""} left`;
  return `${days >= 5 ? "5+" : days} days left`;
}

function mapApiToUi(p: ApiProduct): Product {
  const expiryStatus = computeExpiryStatus(p);
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    image: p.image || (p.images && p.images[0]) || "",
    images: p.images || (p.image ? [p.image] : []),
    currentPrice: p.currentPrice ?? 0,
    originalPrice: p.originalPrice ?? p.currentPrice ?? 0,
    discount: p.discount ?? 0,
    expiryStatus,
    expiryText: computeExpiryText(expiryStatus, p),
    expiryDate: p.expiryDate || "",
    category: p.category || "Other",
    unitsAvailable: p.unitsAvailable ?? 0,
    description: p.description,
  };
}

export function ProductGrid({ onProductClick, category, search, limit = 20 }: Props) {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      category: category || undefined,
      search: search || undefined,
      page: 1,
      limit,
    }),
    [category, search, limit]
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);

    api
      .listProducts(queryParams)
      .then((res) => {
        if (!alive) return;
        const mapped = (res.products || []).map(mapApiToUi);
        setItems(mapped);
      })
      .catch((e: any) => {
        if (!alive) return;
        setErr(e?.message || "Failed to load products");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [queryParams]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
            <div className="w-full h-36 bg-gray-200" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-8 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (err) {
    return (
      <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-4">
        {err}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="text-center text-gray-500 py-8">
        No products found{category ? ` in "${category}"` : ""}.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((product) => (
        <ProductCard key={product.id} product={product} onClick={() => onProductClick(product)} />
      ))}
    </div>
  );
}
