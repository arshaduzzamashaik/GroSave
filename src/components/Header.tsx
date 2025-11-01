// src/components/Header.tsx
import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { Logo } from "./Logo";
import { api } from "../lib/api";

type HeaderProps = {
  /** Optional: open a Notifications screen/sheet in your app shell */
  onOpenNotifications?: () => void;
};

export function Header({ onOpenNotifications }: HeaderProps) {
  const [initials, setInitials] = useState<string>("JD");
  const [unread, setUnread] = useState<number | null>(null); // null = unknown/loading

  // Fetch profile (for initials) + notifications (for unread count)
  useEffect(() => {
    let mounted = true;

    (async () => {
      // Profile → initials (guard against missing api.getUserProfile type)
      try {
        const profile = await (api as any).getUserProfile?.();
        if (mounted && profile) {
          const name = (profile.name || "").trim();
          const parts = name ? name.split(/\s+/) : [];
          const calc =
            parts.length >= 2
              ? `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase()
              : (name[0] || "U").toUpperCase();
          setInitials(calc);
        }
      } catch {
        // keep default initials (JD)
      }

      // Notifications → unread count
      try {
        const res = await api.notifications();
        if (mounted) {
          const count = (res?.notifications || []).filter((n) => !n.isRead).length;
          setUnread(count);
        }
      } catch {
        if (mounted) setUnread(0); // fallback silently
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Badge text (cap at 9+ to keep the pill tiny)
  const badgeText = useMemo(() => {
    if (unread === null) return ""; // loading → show no number
    if (unread <= 0) return "";
    return unread > 9 ? "9+" : String(unread);
  }, [unread]);

  const handleBellClick = async () => {
    onOpenNotifications?.();

    try {
      if (unread && unread > 0) {
        await api.markAllNotificationsRead();
        setUnread(0);
      }
    } catch {
      // ignore
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
        <Logo />

        <div className="flex items-center gap-3">
          <button
            onClick={handleBellClick}
            aria-label={
              unread && unread > 0
                ? `You have ${unread} unread notifications`
                : "Notifications"
            }
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Bell className="w-6 h-6 text-gray-600" />
            {badgeText ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF8C42] text-white text-[10px] leading-[18px] text-center font-medium">
                {badgeText}
              </span>
            ) : null}
          </button>

          <div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3D3B6B] to-[#5CB85C] flex items-center justify-center text-white select-none"
            title="Account"
            aria-label="Account avatar"
          >
            <span className="text-sm font-semibold">{initials}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
