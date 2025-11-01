import { useSyncExternalStore } from "react";
import { api } from "../lib/api";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  return {
    isAuthenticated: api.isAuthenticated(),
    user: api.getCurrentUser(),
    token: api.getToken(),
  };
}

export function useAuth() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
