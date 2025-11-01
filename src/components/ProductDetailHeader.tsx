// src/components/ProductDetailHeader.tsx
import { ArrowLeft, Share2, Check } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
// Fix: import toast from 'sonner' (your ./ui/sonner doesn't export `toast`)
import { toast } from "sonner";
import type { Product } from "../lib/api";

interface ProductDetailHeaderProps {
  productName: string;
  onBack: () => void;
  product?: Product;
  shareUrlOverride?: string;
  shareTextOverride?: string;
}

export function ProductDetailHeader({
  productName,
  onBack,
  product,
  shareUrlOverride,
  shareTextOverride,
}: ProductDetailHeaderProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (shareUrlOverride) return shareUrlOverride;
    if (typeof window === "undefined") return "";
    if (product?.id) return `${window.location.origin}/?product=${product.id}`;
    return window.location.href;
  }, [product?.id, shareUrlOverride]);

  const shareText = shareTextOverride ?? `Check this on GroSave: ${productName}`;
  const shareTitle = productName || "GroSave Item";

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        toast.success("Link shared");
        return;
      }
    } catch {
      // ignore and fallback
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn’t copy the link");
    }
  }, [shareTitle, shareText, shareUrl]);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 hover:bg-purple-50 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6 text-[#3D3B6B]" />
        </button>

        <h1 className="flex-1 text-center mx-4 text-gray-900 truncate">{productName}</h1>

        <button
          onClick={handleShare}
          className="p-2 hover:bg-purple-50 rounded-full transition-colors"
          aria-label="Share product"
          title="Share"
        >
          {copied ? <Check className="w-6 h-6 text-[#5CB85C]" /> : <Share2 className="w-6 h-6 text-[#3D3B6B]" />}
        </button>
      </div>
    </header>
  );
}
