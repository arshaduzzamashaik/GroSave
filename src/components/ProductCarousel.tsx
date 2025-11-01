// src/components/ProductCarousel.tsx
import { useEffect, useRef, useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "../lib/api";

interface ProductCarouselProps {
  /** Pass either a product (preferred)… */
  product?: Product;
  /** …or a raw list of image URLs (fallback). */
  images?: string[];
  className?: string;
  /** Notified when the visible slide changes (index). */
  onIndexChange?: (index: number) => void;
}

function buildImagesFromProduct(p?: Product, images?: string[]): string[] {
  if (images && images.length) return images;
  if (!p) return [];
  if (p.images && p.images.length) return p.images;
  if (p.image) return [p.image];
  return [];
}

export function ProductCarousel({ product, images, className, onIndexChange }: ProductCarouselProps) {
  const imgs = buildImagesFromProduct(product, images);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Touch swipe (very small footprint)
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);

  // Keyboard nav for accessibility
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!imgs.length || imgs.length < 2) return;
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgs.length, currentIndex]);

  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);

  const goToPrevious = () => {
    if (!imgs.length) return;
    setCurrentIndex((prev) => (prev === 0 ? imgs.length - 1 : prev - 1));
  };

  const goToNext = () => {
    if (!imgs.length) return;
    setCurrentIndex((prev) => (prev === imgs.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index: number) => {
    if (!imgs.length) return;
    setCurrentIndex(index);
  };

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (touchStartX.current == null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    const threshold = 40; // px
    if (touchDeltaX.current > threshold) goToPrevious();
    else if (touchDeltaX.current < -threshold) goToNext();
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  const showControls = imgs.length > 1;

  // Simple placeholder if no images available
  const fallback = [
    "data:image/svg+xml;base64," +
      btoa(
        `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
          <rect width='100%' height='100%' fill='#f5f5f5'/>
          <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9aa0a6' font-family='Arial' font-size='20'>
            No image available
          </text>
        </svg>`
      ),
  ];

  const slides = imgs.length ? imgs : fallback;

  return (
    <div className={`relative bg-white ${className ?? ""}`}>
      <div
        className="relative h-80 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((image, index) => (
            <div key={index} className="w-full flex-shrink-0">
              <ImageWithFallback
                src={image}
                alt={
                  product
                    ? `${product.name} image ${index + 1}`
                    : `Product image ${index + 1}`
                }
                className="w-full h-80 object-cover"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>

        {showControls && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[#3D3B6B]" />
            </button>

            <button
              type="button"
              aria-label="Next image"
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-[#3D3B6B]" />
            </button>
          </>
        )}
      </div>

      {showControls && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              aria-label={`Go to image ${index + 1}`}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? "bg-[#3D3B6B] w-6" : "bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
