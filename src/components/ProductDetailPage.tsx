// src/components/ProductDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProductDetailHeader } from "./ProductDetailHeader";
import { ProductCarousel } from "./ProductCarousel";
import { ProductInfoCard } from "./ProductInfoCard";
import { ExpiryWarningCard } from "./ExpiryWarningCard";
import { DynamicPricingCard } from "./DynamicPricingCard";
import { QuantitySelector } from "./QuantitySelector";
import { PickupDetails } from "./PickupDetails";
import { CollapsibleSection } from "./CollapsibleSection";
import { api, toMidnightUTCIso } from "../lib/api";
import type { Product, SuggestAiPriceResponse } from "../lib/api";

/** Map product.expiryStatus / days-to-expiry to the card’s palette keys */
function computeExpiryBadgeStatus(
  product: Product
): "urgent" | "warning" | "safe" | "free" {
  const s = (product.expiryStatus || "").toLowerCase();
  if (["urgent", "warning", "safe", "free"].includes(s)) {
    return s as any;
  }
  if (!product.expiryDate) return "safe";
  const now = new Date();
  const end = new Date(product.expiryDate);
  const days = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "free";
  if (days === 1) return "urgent";
  if (days <= 2) return "warning";
  return "safe";
}

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
}

export function ProductDetailPage({ product, onBack }: ProductDetailPageProps) {
  const [quantity, setQuantity] = useState(1);
  const [reserving, setReserving] = useState(false);

  // --- AI pricing state ---
  const [aiPrice, setAiPrice] = useState<Pick<SuggestAiPriceResponse, "price" | "reason"> | null>(null);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const resp = await api.suggestAiPrice({
          productId: product.id,
          basePrice: product.currentPrice,
          expiryDate: product.expiryDate,            // ISO preferred by your backend
          inventory: product.unitsAvailable ?? 1,
          demandIndex: 0.55,                         // TODO: wire from views/sales/interest
          returnReason: true,
        });
        if (!abort && resp?.price != null) {
          setAiPrice({ price: resp.price, reason: resp.reason });
        }
      } catch (e) {
        // soft-fail; keep original price
        console.warn("AI pricing failed", e);
      }
    })();
    return () => { abort = true; };
  }, [product.id, product.currentPrice, product.expiryDate, product.unitsAvailable]);

  const images = useMemo<string[]>(
    () =>
      product.images && product.images.length
        ? product.images
        : product.image
        ? [product.image]
        : [],
    [product.images, product.image]
  );

  const expiryBadge = useMemo(() => computeExpiryBadgeStatus(product), [product]);

  // Merge AI price into a product view without mutating the prop
  const pricedProduct: Product = useMemo(() => {
    if (!aiPrice) return product;

    const original = product.originalPrice ?? product.currentPrice ?? 0;
    const computedDiscount =
      original > 0 ? Math.max(0, Math.round(100 - (aiPrice.price / original) * 100)) : product.discount ?? 0;

    return {
      ...product,
      currentPrice: aiPrice.price,
      discount: computedDiscount,
    };
  }, [product, aiPrice]);

  async function handleReserve() {
    if (!product?.id) {
      toast.error("Missing product id");
      return;
    }
    if (quantity < 1) {
      toast.error("Select at least 1 unit");
      return;
    }

    try {
      setReserving(true);
      // Minimal reservation payload to avoid compile errors with PickupDetails selection
      const resp = await api.reserveOrder({
        productId: product.id,
        quantity,
        // Optional fields (safe default if backend allows)
        pickupDate: toMidnightUTCIso(new Date()), // today (replace when you wire selection)
        // pickupLocationId / pickupTimeSlot can be added once your UI collects them
      } as any);

      if (resp?.success) {
        toast.success("Reserved! Check it under My Orders.");
      } else {
        toast.error("Could not reserve this item");
      }
    } catch (e: any) {
      toast.error(e?.message || "Reservation failed");
    } finally {
      setReserving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <ProductDetailHeader productName={product.name} product={product} onBack={onBack} />

      <div className="max-w-md mx-auto pb-8">
        {images.length > 0 && <ProductCarousel images={images} />}

        <div className="px-4 space-y-4 mt-4">
          <ProductInfoCard name={product.name} brand={product.brand} category={product.category} />

          <ExpiryWarningCard expiryDate={product.expiryDate ?? "N/A"} expiryStatus={expiryBadge} />

          {/* Dynamic pricing card now receives a product with AI-adjusted price */}
          <DynamicPricingCard product={pricedProduct} dropPriceCoins={aiPrice?.price} />

          {/* Optional “why this price” note */}
          {aiPrice?.reason && (
            <p className="text-xs text-gray-500 italic">Pricing note: {aiPrice.reason}</p>
          )}

          <QuantitySelector
            quantity={quantity}
            setQuantity={setQuantity}
            maxQuantity={product.unitsAvailable ?? 1}
            unitsAvailable={product.unitsAvailable ?? 1}
          />

          {/* Keep your current PickupDetails (no props) to match its signature */}
          <PickupDetails />

          <button
            onClick={handleReserve}
            disabled={reserving}
            className={`w-full bg-[#3D3B6B] text-white py-4 rounded-xl shadow-lg transition-colors ${
              reserving ? "opacity-80 cursor-not-allowed" : "hover:bg-[#2d2950]"
            }`}
          >
            {reserving ? "Reserving..." : "Reserve for Pickup"}
          </button>

          <CollapsibleSection title="Nutritional Information">
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Calories</span>
                <span>150 kcal</span>
              </div>
              <div className="flex justify-between">
                <span>Protein</span>
                <span>8g</span>
              </div>
              <div className="flex justify-between">
                <span>Fat</span>
                <span>8g</span>
              </div>
              <div className="flex justify-between">
                <span>Carbohydrates</span>
                <span>12g</span>
              </div>
              <div className="flex justify-between">
                <span>Calcium</span>
                <span>300mg (30% DV)</span>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Storage Guidelines">
            <div className="space-y-2 text-sm text-gray-700">
              <p>• Keep refrigerated at 4°C or below</p>
              <p>• Once opened, consume within 3 days</p>
              <p>• Do not freeze</p>
              <p>• Store in original container</p>
              <p>• Keep away from strong-smelling foods</p>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Food Safety Instructions">
            <div className="space-y-2 text-sm text-gray-700">
              <p>• Check seal before opening</p>
              <p>• Smell and visually inspect before consuming</p>
              <p>• Discard if product appears spoiled or has unusual odor</p>
              <p>• Not suitable for individuals with dairy allergies</p>
              <p>• Quality checked by GroSave partner hubs</p>
            </div>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
}
