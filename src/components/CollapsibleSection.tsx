// src/components/CollapsibleSection.tsx
import React, { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  children?: React.ReactNode;

  /**
   * Optional async loader. If provided, the component
   * will fetch on first open and render the returned JSX.
   * You can still pass `children`; they will render above the async content.
   */
  asyncContent?: () => Promise<React.ReactNode>;

  /** Start opened */
  defaultOpen?: boolean;

  /** Controlled open state (if you want to manage it from parent) */
  open?: boolean;

  /** Called when open/close toggles */
  onToggle?: (open: boolean) => void;

  /** Extra classes for the outer card */
  className?: string;
}

export function CollapsibleSection({
  title,
  children,
  asyncContent,
  defaultOpen = false,
  open,
  onToggle,
  className = "",
}: CollapsibleSectionProps) {
  const isControlled = typeof open === "boolean";
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? open! : internalOpen;

  const [loadedOnce, setLoadedOnce] = useState(false);
  const [loading, setLoading] = useState(false);
  const [asyncNode, setAsyncNode] = useState<React.ReactNode>(null);
  const [error, setError] = useState<string | null>(null);

  const panelId = useId();
  const hasRequestedRef = useRef(false);

  function toggle() {
    const next = !isOpen;
    if (!isControlled) setInternalOpen(next);
    onToggle?.(next);
  }

  // Lazy-fetch async content on first open
  useEffect(() => {
    if (!isOpen) return;
    if (!asyncContent) return;
    if (hasRequestedRef.current) return;

    hasRequestedRef.current = true;
    setLoading(true);
    setError(null);

    asyncContent()
      .then((node) => {
        setAsyncNode(node);
        setLoadedOnce(true);
      })
      .catch((e: any) => {
        setError(e?.message || "Failed to load content");
      })
      .finally(() => setLoading(false));
  }, [isOpen, asyncContent]);

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={toggle}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="text-gray-900">{title}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div id={panelId} className="px-4 pb-4 border-t border-gray-100">
          <div className="pt-4 space-y-3">
            {/* Static children render first (e.g., product info sections) */}
            {children}

            {/* Async block (optional) */}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-500 animate-spin" />
                Loading…
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            {loadedOnce && !loading && !error && asyncNode}
          </div>
        </div>
      )}
    </div>
  );
}
