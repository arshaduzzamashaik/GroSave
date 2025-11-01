// src/components/ProductInfoCard.tsx
import type { Product } from "../lib/api";

type ProvidedFields = {
  name?: string;
  brand?: string;
  category?: string;
};

interface ProductInfoCardProps extends ProvidedFields {
  /** Optional: pass the full Product from backend; falls back to explicit props if not provided */
  product?: Product | null;
}

export function ProductInfoCard(props: ProductInfoCardProps) {
  const { product } = props;

  // Prefer values from product (when provided), otherwise use explicit props (backward compatible)
  const name = (product?.name ?? props.name ?? "").trim();
  const brand = (product?.brand ?? props.brand ?? "").trim();
  const category = (product?.category ?? props.category ?? "").trim();

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h2 className="text-gray-900 mb-2">{name || "Unnamed Product"}</h2>
      <p className="text-gray-500 mb-3">{brand || "—"}</p>

      {category ? (
        <div className="inline-block">
          <span className="bg-[#3D3B6B] text-white text-sm px-3 py-1 rounded-full">
            {category}
          </span>
        </div>
      ) : null}
    </div>
  );
}
