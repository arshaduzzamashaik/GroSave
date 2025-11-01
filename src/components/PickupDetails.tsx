// src/components/PickupDetails.tsx
import { MapPin, ChevronDown, Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, type PickupLocation, type PickupSlot, todayYMD, toMidnightUTCIso } from "../lib/api";

type Selection = {
  pickupLocationId?: string;
  /** Human label required by backend, e.g. "Morning (8 AM - 12 PM)" */
  pickupTimeSlotLabel?: string;
  /** Optional: the capacity slot id we matched (good for UI, not required by reserve API) */
  pickupSlotId?: string | null;
  /** ISO string at 00:00:00Z for the chosen day (what /orders/reserve expects) */
  pickupDate?: string;
};

interface PickupDetailsProps {
  value?: Selection;
  onChange?: (selection: Selection) => void;
}

export function PickupDetails({ value, onChange }: PickupDetailsProps) {
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [errorLoc, setErrorLoc] = useState<string | null>(null);

  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(value?.pickupLocationId);
  const [ymd, setYmd] = useState<string>(() => {
    // Use existing selection if provided, else today
    if (value?.pickupDate) {
      const d = new Date(value.pickupDate);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    return todayYMD();
  });

  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errorSlots, setErrorSlots] = useState<string | null>(null);

  const [selectedSlotId, setSelectedSlotId] = useState<string | undefined>(value?.pickupSlotId ?? undefined);

  // Load locations
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingLoc(true);
      setErrorLoc(null);
      try {
        const res = await api.listPickupLocations();
        if (cancelled) return;
        setLocations(res.locations || []);
      } catch (e: any) {
        if (!cancelled) setErrorLoc(e?.message || "Failed to load pickup locations");
      } finally {
        if (!cancelled) setLoadingLoc(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Default to first active location when locations load
  useEffect(() => {
    if (!selectedLocationId && locations.length > 0) {
      const first = locations[0];
      setSelectedLocationId(first.id);
      // bubble up location + date (no slot yet)
      onChange?.({
        pickupLocationId: first.id,
        pickupDate: toMidnightUTCIso(new Date(ymd)),
        pickupSlotId: undefined,
        pickupTimeSlotLabel: undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations]);

  // Load slots whenever location or date changes
  useEffect(() => {
    if (!selectedLocationId || !ymd) return;
    let cancelled = false;
    (async () => {
      setLoadingSlots(true);
      setErrorSlots(null);
      try {
        const res = await api.listPickupSlots(selectedLocationId, ymd);
        if (cancelled) return;
        const s = res.slots || [];
        setSlots(s);

        // If previously selected slot is not in the fresh list, clear it
        if (!s.find((x) => x.id === selectedSlotId)) {
          setSelectedSlotId(undefined);
          onChange?.({
            pickupLocationId: selectedLocationId,
            pickupDate: toMidnightUTCIso(new Date(ymd)),
            pickupSlotId: undefined,
            pickupTimeSlotLabel: undefined,
          });
        }
      } catch (e: any) {
        if (!cancelled) setErrorSlots(e?.message || "Failed to load pickup slots");
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocationId, ymd]);

  const selectedLocation = useMemo(
    () => locations.find((l) => l.id === selectedLocationId),
    [locations, selectedLocationId]
  );

  const handlePickLocation = (id: string) => {
    setSelectedLocationId(id);
    setSelectedSlotId(undefined);
    onChange?.({
      pickupLocationId: id,
      pickupDate: toMidnightUTCIso(new Date(ymd)),
      pickupSlotId: undefined,
      pickupTimeSlotLabel: undefined,
    });
  };

  const handlePickDate: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const newYmd = e.target.value;
    setYmd(newYmd);
    // Clear slot when date changes
    setSelectedSlotId(undefined);
    onChange?.({
      pickupLocationId: selectedLocationId,
      pickupDate: toMidnightUTCIso(new Date(newYmd)),
      pickupSlotId: undefined,
      pickupTimeSlotLabel: undefined,
    });
  };

  const handlePickSlot = (slot: PickupSlot) => {
    setSelectedSlotId(slot.id);
    onChange?.({
      pickupLocationId: selectedLocationId,
      pickupDate: toMidnightUTCIso(new Date(ymd)),
      pickupSlotId: slot.id,
      pickupTimeSlotLabel: slot.label, // backend expects human label
    });
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
      {/* Location Picker */}
      <div>
        <label className="text-gray-700 mb-2 block">Select Pickup Location</label>

        {loadingLoc ? (
          <div className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 animate-pulse">
            <div className="h-4 w-2/3 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-1/3 bg-gray-200 rounded" />
          </div>
        ) : errorLoc ? (
          <div className="w-full bg-white border-2 border-red-200 rounded-lg px-4 py-3">
            <p className="text-sm text-red-600">Failed to load locations: {errorLoc}</p>
          </div>
        ) : locations.length === 0 ? (
          <div className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3">
            <p className="text-sm text-gray-600">No pickup locations available.</p>
          </div>
        ) : (
          <div className="relative">
            <button className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between hover:border-[#3D3B6B] transition-colors">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#3D3B6B]" />
                <div className="text-left">
                  <div className="text-gray-900">
                    {selectedLocation?.name ?? "Select a pickup location"}
                  </div>
                  {/* Distance is not provided by backend; omit or compute client-side later */}
                  {selectedLocation?.address ? (
                    <div className="text-sm text-gray-500">{selectedLocation.address}</div>
                  ) : null}
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>

            {/* Simple dropdown list */}
            <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => handlePickLocation(loc.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors ${
                    loc.id === selectedLocationId ? "bg-purple-50" : "bg-white"
                  }`}
                >
                  <div className="text-gray-900">{loc.name}</div>
                  {loc.address && <div className="text-xs text-gray-500">{loc.address}</div>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Date Picker */}
      <div>
        <label className="text-gray-700 mb-2 block">Select Pickup Date</label>
        <input
          type="date"
          value={ymd}
          onChange={handlePickDate}
          className="w-full bg-white border-2 border-gray-200 rounded-lg px-4 py-3 hover:border-[#3D3B6B] focus:outline-none transition-colors"
          min={todayYMD()}
        />
      </div>

      {/* Slot Picker */}
      <div>
        <label className="text-gray-700 mb-2 block">Select Pickup Time</label>

        {loadingSlots ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 animate-pulse">
                <div className="h-4 w-1/2 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-1/3 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : errorSlots ? (
          <div className="w-full bg-white border-2 border-red-200 rounded-lg px-4 py-3">
            <p className="text-sm text-red-600">Failed to load slots: {errorSlots}</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="w-full bg-white border-2 border-yellow-200 rounded-lg px-4 py-3">
            <p className="text-sm text-gray-700">No slots available for {ymd}. Try another date.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {slots.map((slot) => {
              const remaining = Math.max(0, slot.capacity - (slot.reservedCount ?? 0));
              const isSelected = selectedSlotId === slot.id;
              return (
                <button
                  key={slot.id}
                  onClick={() => handlePickSlot(slot)}
                  className={`w-full border-2 rounded-lg px-4 py-3 flex items-center justify-between transition-all ${
                    isSelected ? "border-[#3D3B6B] bg-purple-50" : "border-gray-200 hover:border-[#3D3B6B]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Clock className={`w-5 h-5 ${isSelected ? "text-[#3D3B6B]" : "text-gray-400"}`} />
                    <div className="text-left">
                      <div className="text-gray-900">{slot.label}</div>
                      <div className="text-sm text-gray-500">
                        {slot.slot === "morning"
                          ? "8 AM - 12 PM"
                          : slot.slot === "afternoon"
                          ? "12 PM - 4 PM"
                          : slot.slot === "evening"
                          ? "4 PM - 7 PM"
                          : slot.slot}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm ${remaining > 0 ? "text-[#5CB85C]" : "text-gray-400"}`}>
                    {remaining} slots available
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
