// src/components/FamilyDetailsCard.tsx
import { useEffect, useMemo, useState } from "react";
import { Users, MapPin } from "lucide-react";
import { getToken, API_BASE } from "../lib/api";

type IncomeRange =
  | "BELOW_1_5_LPA"
  | "BETWEEN_1_5_2_5_LPA"
  | "BETWEEN_2_5_3_5_LPA"
  | "ABOVE_3_5_LPA";

type Profile = {
  id: string;
  phone: string;
  name?: string | null;
  isVerified: boolean;
  eligibilityStatus?: string | null; // e.g., "approved"
  incomeRange?: IncomeRange | null;
  schoolGoingChildren?: number | null;
  address?: string | null;
  city?: string | null;
  pincode?: string | null;
  createdAt?: string;
};

async function authFetch<T = any>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}/api/users/me${path}`, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    let body: any = {};
    try {
      body = await res.json();
    } catch {
      // ignore
    }
    throw new Error(body?.error || body?.message || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

// Convenience overloads for GET / PUT on /api/users/me
function getProfile(): Promise<Profile> {
  return authFetch<Profile>("", { method: "GET" });
}

function updateProfile(payload: Partial<Profile>): Promise<{ success: boolean; user: Profile }> {
  // Backend controller supports updating: name, address, city, pincode
  return authFetch<{ success: boolean; user: Profile }>("", {
    method: "PUT",
    body: JSON.stringify({
      name: payload.name,
      address: payload.address,
      city: payload.city,
      pincode: payload.pincode,
    }),
  });
}

function friendlyIncomeText(v?: IncomeRange | null): string {
  switch (v) {
    case "BELOW_1_5_LPA":
      return "≤ ₹1.5 LPA";
    case "BETWEEN_1_5_2_5_LPA":
      return "₹1.5 – ₹2.5 LPA";
    case "BETWEEN_2_5_3_5_LPA":
      return "₹2.5 – ₹3.5 LPA";
    case "ABOVE_3_5_LPA":
      return "≥ ₹3.5 LPA";
    default:
      return "Not provided";
  }
}

function isEligible(v?: IncomeRange | null): boolean {
  // Mirror your backend “approved” logic: up to 3.5 LPA considered eligible
  return (
    v === "BELOW_1_5_LPA" ||
    v === "BETWEEN_1_5_2_5_LPA" ||
    v === "BETWEEN_2_5_3_5_LPA"
  );
}

export function FamilyDetailsCard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  // local editable fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        const me = await getProfile();
        if (!mounted) return;
        setProfile(me);
        setName(me.name ?? "");
        setAddress(me.address ?? "");
        setCity(me.city ?? "");
        setPincode(me.pincode ?? "");
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, []);

  const eligible = useMemo(() => isEligible(profile?.incomeRange), [profile]);
  const incomeText = useMemo(
    () => friendlyIncomeText(profile?.incomeRange),
    [profile]
  );

  const addressLine = useMemo(() => {
    const parts = [profile?.address, profile?.city, profile?.pincode]
      .filter(Boolean)
      .join(", ");
    return parts || "Address not provided";
  }, [profile]);

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await updateProfile({ name, address, city, pincode });
      setProfile(res.user);
      setEditMode(false);
    } catch (e: any) {
      setError(e?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      {/* Header row */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5 text-[#3D3B6B]" />
        </div>

        <div className="flex-1">
          <h3 className="text-gray-900 mb-2">Family Details</h3>

          {/* Loading / Error */}
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    eligible ? "bg-[#5CB85C]" : "bg-gray-300"
                  }`}
                />
                <span>
                  {eligible ? "Eligible" : "Not eligible"} ({incomeText})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#5CB85C]" />
                <span>
                  {Number.isFinite(profile?.schoolGoingChildren as any)
                    ? `${profile?.schoolGoingChildren} school-going ${
                        (profile?.schoolGoingChildren ?? 0) === 1
                          ? "child"
                          : "children"
                      }`
                    : "Children info not provided"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="flex items-start gap-3 mb-4">
        <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
        {loading ? (
          <p className="text-sm text-gray-500">Loading address…</p>
        ) : (
          <p className="text-sm text-gray-600">{addressLine}</p>
        )}
      </div>

      {/* Edit form (inline) */}
      {editMode && !loading && (
        <div className="mb-4 rounded-lg border border-gray-100 p-3 bg-gray-50">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3D3B6B]/30"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Address</label>
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3D3B6B]/30"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street / Area"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">City</label>
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3D3B6B]/30"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Pincode
                </label>
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3D3B6B]/30"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 560003"
                />
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              disabled={saving}
              onClick={onSave}
              className="bg-[#3D3B6B] text-white px-4 py-2 rounded-md hover:bg-[#2d2950] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              disabled={saving}
              onClick={() => {
                setEditMode(false);
                // reset edits to current profile
                if (profile) {
                  setName(profile.name ?? "");
                  setAddress(profile.address ?? "");
                  setCity(profile.city ?? "");
                  setPincode(profile.pincode ?? "");
                }
              }}
              className="text-[#3D3B6B] px-3 py-2 rounded-md hover:bg-purple-50 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* CTA */}
      {!loading && (
        <button
          className="text-[#3D3B6B] text-sm hover:underline"
          onClick={() => setEditMode((v) => !v)}
        >
          {editMode ? "Close" : "Update Details"}
        </button>
      )}
    </div>
  );
}
