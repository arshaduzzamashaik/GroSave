// src/components/QuantitySelector.tsx
import { Minus, Plus } from 'lucide-react';
import { useMemo } from 'react';

interface QuantitySelectorProps {
  quantity: number;
  setQuantity: (quantity: number) => void;

  /** Hard ceiling from business rules (e.g., per-order limit) */
  maxQuantity: number;

  /** Live stock from backend: product.unitsAvailable */
  unitsAvailable: number;

  /** Optional: minimum allowed (default 1) */
  minQuantity?: number;

  /** Optional: called when user tries to exceed limits */
  onLimitHit?: (reason: 'min' | 'max' | 'stock') => void;
}

export function QuantitySelector({
  quantity,
  setQuantity,
  maxQuantity,
  unitsAvailable,
  minQuantity = 1,
  onLimitHit,
}: QuantitySelectorProps) {
  // The real ceiling is whichever is smaller: business limit vs stock
  const hardMax = useMemo(
    () => Math.max(minQuantity, Math.min(maxQuantity, Math.max(0, unitsAvailable))),
    [maxQuantity, unitsAvailable, minQuantity]
  );

  const canDecrease = quantity > minQuantity;
  const canIncrease = quantity < hardMax;

  const handleDecrease = () => {
    if (!canDecrease) {
      onLimitHit?.('min');
      return;
    }
    setQuantity(Math.max(minQuantity, quantity - 1));
  };

  const handleIncrease = () => {
    if (!canIncrease) {
      onLimitHit?.(unitsAvailable < maxQuantity ? 'stock' : 'max');
      return;
    }
    setQuantity(Math.min(hardMax, quantity + 1));
  };

  // Helper text + color based on remaining stock
  const remaining = Math.max(0, unitsAvailable - quantity);
  const lowStock = unitsAvailable > 0 && unitsAvailable <= 5;
  const helperColor =
    hardMax <= minQuantity
      ? 'text-[#FF8C42]' // effectively out-of-stock / no increments possible
      : lowStock
      ? 'text-[#FF8C42]'
      : 'text-[#5CB85C]';

  const helperText =
    unitsAvailable <= 0
      ? 'Out of stock'
      : `${unitsAvailable} units available${lowStock ? ' • low stock' : ''}`;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-700">Quantity</span>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDecrease}
            disabled={!canDecrease}
            aria-label="Decrease quantity"
            className={`w-10 h-10 rounded-lg border-2 border-[#3D3B6B] flex items-center justify-center transition-colors ${
              !canDecrease ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-50'
            }`}
          >
            <Minus className="w-5 h-5 text-[#3D3B6B]" />
          </button>

          <span
            className="text-2xl text-gray-900 min-w-[3rem] text-center"
            role="status"
            aria-live="polite"
          >
            {quantity}
          </span>

          <button
            type="button"
            onClick={handleIncrease}
            disabled={!canIncrease}
            aria-label="Increase quantity"
            className={`w-10 h-10 rounded-lg border-2 border-[#3D3B6B] flex items-center justify-center transition-colors ${
              !canIncrease ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-50'
            }`}
          >
            <Plus className="w-5 h-5 text-[#3D3B6B]" />
          </button>
        </div>
      </div>

      <p className={`text-sm ${helperColor} text-right`} aria-live="polite">
        {helperText}
        {remaining >= 0 && unitsAvailable > 0 ? (
          <span className="text-gray-400">{` • remaining after selection: ${remaining}`}</span>
        ) : null}
      </p>
    </div>
  );
}
