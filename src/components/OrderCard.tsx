// src/components/OrderCard.tsx
import { MapPin, Clock, QrCode, ExternalLink } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useMemo, useState } from "react";
import type { Order } from "./ActiveOrders";
import { api } from "../lib/api";

interface OrderCardProps {
  order: Order;
  /** Ask parent to refetch once something changes (status/cancel). */
  onChanged?: () => void;
}

export function OrderCard({ order, onChanged }: OrderCardProps) {
  const [showQR, setShowQR] = useState(false);
  const [busy, setBusy] = useState<null | "advance" | "cancel">(null);

  // --- Status chip for the limited union your Order type uses ---
  const statusChip = useMemo(() => {
    switch (order.status) {
      case "confirmed":
        return { className: "bg-yellow-400 text-gray-900", label: "Confirmed" };
      case "ready":
        return { className: "bg-[#5CB85C] text-white", label: "Ready for Pickup" };
      case "expires-today":
        return { className: "bg-red-500 text-white", label: "Expires Today" };
      default:
        return { className: "bg-gray-400 text-white", label: "Unknown" as const };
    }
  }, [order.status]);

  // Decide the primary action based on current status
  // With your current Order.status union, we only expose "Mark Ready" from 'confirmed'.
  const nextAction = useMemo(() => {
    if (order.status === "confirmed") {
      return { label: "Mark Ready", fn: () => api.markReady(order.id) };
    }
    return null;
  }, [order.id, order.status]);

  const canCancel = order.status === "confirmed";
  const disableAll = busy !== null;

  async function handleAdvance() {
    if (!nextAction) return;
    try {
      setBusy("advance");
      await nextAction.fn();
      onChanged?.();
    } catch (e: any) {
      alert(e?.message ?? "Failed to update order status");
    } finally {
      setBusy(null);
    }
  }

  async function handleCancel() {
    if (!canCancel) return;
    const ok = window.confirm("Cancel this reservation?");
    if (!ok) return;
    try {
      setBusy("cancel");
      await api.cancelOrder(order.id);
      onChanged?.();
    } catch (e: any) {
      alert(e?.message ?? "Failed to cancel order");
    } finally {
      setBusy(null);
    }
  }

  function openDirections() {
    // Coordinates are not in your Order type; use place search fallback
    const query = encodeURIComponent(order.pickupLocation || "Pickup Hub");
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, "_blank");
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">{order.orderNumber}</span>
          <span className={`text-xs px-3 py-1 rounded-full ${statusChip.className}`}>
            {statusChip.label}
          </span>
        </div>

        {/* Product segment */}
        <div className="flex gap-3 mb-4">
          <ImageWithFallback
            src={order.productImage}
            alt={order.productName}
            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            <h3 className="text-gray-900 mb-1 truncate">{order.productName}</h3>
            <p className="text-sm text-gray-500 mb-1">Quantity: {order.quantity} units</p>
            <p className="text-sm text-gray-500">Reserved on: {order.reservedOn}</p>
          </div>
        </div>

        {/* Pickup info */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2 mb-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[#3D3B6B] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-900">{order.pickupLocation}</p>

              <div className="flex items-center gap-2 mt-1">
                {typeof order.distance === "number" && (
                  <p className="text-xs text-gray-500">{order.distance} km away</p>
                )}
                <button
                  type="button"
                  onClick={openDirections}
                  className="text-xs text-[#3D3B6B] hover:underline flex items-center gap-1"
                >
                  Get Directions
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#3D3B6B] flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-900">{order.pickupTime}</p>
              <p className="text-xs text-gray-500">{order.pickupDate || ""}</p>
            </div>
          </div>
        </div>

        {/* QR */}
        <button
          onClick={() => setShowQR((s) => !s)}
          className="w-full border-2 border-[#3D3B6B] text-[#3D3B6B] py-2 rounded-lg hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 mb-3 disabled:opacity-60"
          disabled={disableAll}
        >
          <QrCode className="w-5 h-5" />
          {showQR ? "Hide QR Code" : "Show QR Code for Pickup"}
        </button>

        {showQR && (
          <div className="border-2 border-gray-200 rounded-lg p-4 mb-3 bg-gray-50">
            <div className="flex flex-col items-center">
              <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center mb-3 border-2 border-gray-300">
                {/* Placeholder — replace with a real QR rendering if needed */}
                <QrCode className="w-32 h-32 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Show this at pickup hub</p>
              <p className="text-[#3D3B6B] tracking-wider">
                {order.verificationCode || "—"}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            className="flex-1 bg-[#5CB85C] text-white py-2.5 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleAdvance}
            disabled={!nextAction || disableAll}
            title={!nextAction ? "No further action available" : nextAction.label}
          >
            {busy === "advance"
              ? "Updating..."
              : nextAction
              ? nextAction.label
              : "No Action"}
          </button>

          <button
            className="text-gray-500 hover:text-gray-700 px-4 disabled:opacity-60"
            onClick={handleCancel}
            disabled={!canCancel || disableAll}
            title={canCancel ? "Cancel reservation" : "Cannot cancel now"}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
