// src/components/ProductCard.tsx
import { Leaf } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { Product } from "../lib/api";

interface ProductCardProps {
  product: Product;
  /** Open product detail page */
  onClick?: () => void;
  /** Optional quick-reserve action from the card */
  onReserve?: (product: Product) => void;
}

function computeExpiryBadge(p: Product): { status: "safe" | "warning" | "urgent" | "free"; text: string } {
  // If it's free now (per backend dynamic pricing), show FREE
  if (p.currentPrice === 0) return { status: "free", text: "FREE now" };

  // Map backend statuses to UI severity; backend may send "ok" | "warning" | "danger"
  const raw = (p.expiryStatus ?? "ok").toLowerCase();
  let status: "safe" | "warning" | "urgent" = "safe";
  if (raw.includes("warn")) status = "warning";
  if (raw.includes("danger") || raw.includes("urgent")) status = "urgent";

  // Derive a friendly text from expiryDate if present
  if (p.expiryDate) {
    const now = new Date();
    const exp = new Date(p.expiryDate);
    // days left (ceil)
    const msLeft = exp.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return { status, text: "Expires today" };
    if (daysLeft === 1) return { status, text: "1 day left" };
    return { status, text: `${daysLeft} days left` };
  }

  return { status, text: status === "safe" ? "Fresh" : status === "warning" ? "Short-dated" : "Expiring soon" };
}

function badgeClasses(status: "safe" | "warning" | "urgent" | "free") {
  switch (status) {
    case "safe":
      return "bg-[#5CB85C] text-white";
    case "warning":
      return "bg-yellow-400 text-gray-900";
    case "urgent":
      return "bg-[#FF8C42] text-white";
    case "free":
      return "bg-gray-500 text-white";
    default:
      return "bg-gray-400 text-white";
  }
}

export function ProductCard({ product, onClick, onReserve }: ProductCardProps) {
  const { status, text } = computeExpiryBadge(product);
  const disabled = (product.unitsAvailable ?? 0) <= 0;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="relative">
        <ImageWithFallback src={product.image} alt={product.name} className="w-full h-36 object-cover" />
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs ${badgeClasses(status)}`}>{text}</div>
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-gray-900 line-clamp-2 flex-1 pr-1">{product.name}</h3>
          <Leaf className="w-4 h-4 text-[#5CB85C] flex-shrink-0" />
        </div>

        {product.brand && <p className="text-gray-500 text-sm mb-3">{product.brand}</p>}

        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            {product.currentPrice === 0 ? (
              <>
                <span className="text-[#3D3B6B] text-xl">FREE</span>
                {product.originalPrice ? (
                  <span className="text-gray-400 text-sm line-through">{product.originalPrice} GroCoins</span>
                ) : null}
              </>
            ) : (
              <>
                <span className="text-[#3D3B6B] text-xl">{product.currentPrice}</span>
                {product.originalPrice ? (
                  <span className="text-gray-400 text-sm line-through">{product.originalPrice}</span>
                ) : null}
              </>
            )}
          </div>
          {typeof product.discount === "number" && product.discount > 0 && (
            <div className="mt-1">
              <span className="bg-[#5CB85C] text-white text-xs px-2 py-0.5 rounded">-{product.discount}%</span>
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onReserve?.(product);
          }}
          disabled={disabled}
          className={`w-full py-2 rounded-lg transition-colors ${
            disabled
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-[#3D3B6B] text-white hover:bg-[#2d2950]"
          }`}
        >
          {disabled ? "Out of Stock" : "Reserve Now"}
        </button>
      </div>
    </div>
  );
}
