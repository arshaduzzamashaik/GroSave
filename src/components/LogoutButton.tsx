// src/components/LogoutButton.tsx
import { useState } from "react";
import { LogOut } from "lucide-react";
import { clearToken } from "../lib/api";

type LogoutButtonProps = {
  /** Optional: navigate somewhere after logout (e.g. home/onboarding). */
  onNavigate?: (view: "home" | "wallet" | "orders" | "profile" | "onboarding") => void;
  /** Where to go after logout when onNavigate is provided. Default: "home". */
  redirectTo?: "home" | "wallet" | "orders" | "profile" | "onboarding";
  /** Optional: fire extra cleanup (e.g. reset stores). */
  onLoggedOut?: () => void;
  /** Ask for confirmation before logging out. Default: true. */
  confirm?: boolean;
};

export function LogoutButton({
  onNavigate,
  redirectTo = "home",
  onLoggedOut,
  confirm = true,
}: LogoutButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    if (busy) return;
    if (confirm && !window.confirm("Are you sure you want to log out?")) return;

    try {
      setBusy(true);
      // Clear auth session
      clearToken();

      // Optional extra cleanup for caller
      onLoggedOut?.();

      // Optional redirect if the parent provided navigation
      onNavigate?.(redirectTo);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={busy}
      className="w-full py-3 text-red-500 hover:text-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      aria-label="Log out"
    >
      <LogOut className="w-5 h-5" />
      <span>{busy ? "Logging out..." : "Logout"}</span>
    </button>
  );
}
