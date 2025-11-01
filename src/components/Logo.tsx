// src/components/Logo.tsx
import { ShoppingBasket, Leaf } from "lucide-react";

type LogoProps = {
  /** If provided, clicking the logo will navigate to this view (usually "home"). */
  onNavigate?: (view: "home" | "wallet" | "orders" | "profile") => void;
  /** Optional aria-label override (defaults to "GroSave"). */
  ariaLabel?: string;
  /** Optional: make the logo non-interactive even if onNavigate is passed. */
  disabled?: boolean;
  /** Optional size multiplier (1 = default). */
  scale?: number;
};

export function Logo({
  onNavigate,
  ariaLabel = "GroSave",
  disabled = false,
  scale = 1,
}: LogoProps) {
  const interactive = !!onNavigate && !disabled;

  const handleClick = () => {
    if (interactive) onNavigate!("home");
  };

  const containerClasses = [
    "flex items-center gap-2 select-none",
    interactive ? "cursor-pointer hover:opacity-90 transition-opacity" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const iconSize = Math.round(8 * scale);
  const leafSize = Math.max(4, Math.round(4 * scale));

  return (
    <div
      className={containerClasses}
      onClick={handleClick}
      role={interactive ? "button" : undefined}
      aria-label={ariaLabel}
      aria-disabled={interactive ? disabled : undefined}
      tabIndex={interactive ? 0 : -1}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="relative" style={{ lineHeight: 0 }}>
        <ShoppingBasket
          className="text-[#3D3B6B]"
          style={{ width: iconSize, height: iconSize }}
        />
        <Leaf
          className="text-[#5CB85C] absolute -top-1 -right-1"
          style={{ width: leafSize, height: leafSize }}
        />
      </div>
      <span
        className="text-[#3D3B6B]"
        style={{ fontSize: `${1 * scale}rem`, fontWeight: 600 }}
      >
        GroSave
      </span>
    </div>
  );
}
