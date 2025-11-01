
const RAW_BASE =
  (import.meta as any).env?.VITE_API_URL ??
  (typeof process !== "undefined" && (process as any).env?.VITE_API_URL) ??
  "http://localhost:5001";

// Trim trailing slashes and optional `/api`
const TRIMMED = String(RAW_BASE).replace(/\/+$/, "");
export const API_BASE = TRIMMED.endsWith("/api") ? TRIMMED.slice(0, -4) : TRIMMED;

const DEFAULT_TIMEOUT_MS = 15_000;

//
// ---------- Types (minimal, aligned to your backend) ----------
//

// Common
export type ApiError = {
  status?: number;
  error?: string;
  message?: string;
  details?: unknown;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

// Auth
export type SendOtpResponse = {
  success: boolean;
  message: string;
  otp?: string; // present in local/dev
};

export type VerifyOtpResponse = {
  success: boolean;
  token: string;
};

// Products
export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  description?: string;
  image?: string;
  images?: string[];
  currentPrice: number;
  originalPrice?: number;
  discount?: number;
  expiryStatus?: string; // "ok" | "warning" | "danger" (string for flexibility)
  expiryDate?: string; // ISO
  unitsAvailable?: number;
  nutritionInfo?: any;
  storageInfo?: string[];
  safetyInfo?: string[];
  isActive?: boolean;
  dynamicPricingEnabled?: boolean;
  dropToPriceAtHoursBeforeExpiry?: number;
  freeAtHoursBeforeExpiry?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ListProductsResponse = {
  products: Product[];
  pagination: Pagination;
};

export type Category = { id: string; name: string; productCount: number };
export type CategoriesResponse = { categories: Category[] };

// Pickup
export type LegacyTimeSlot = { id: string; label: string; time: string; available?: number };

export type PickupSlot = {
  id: string;
  date: string; // ISO
  slot: "morning" | "afternoon" | "evening" | string;
  label: string; // e.g. "Morning (8 AM - 12 PM)"
  capacity: number;
  reservedCount: number;
  pickupLocationId: string;
};

export type PickupLocation = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
  // legacy UI compatibility
  timeSlots?: LegacyTimeSlot[];
  // normalized capacity-managed slots
  slots?: PickupSlot[];
};

export type PickupLocationsResponse = { locations: PickupLocation[] };
export type PickupSlotsResponse = { slots: PickupSlot[] };

// Orders
export type OrderStatus = "confirmed" | "ready" | "scanned" | "completed" | "cancelled";

export type Order = {
  id: string;
  orderNumber: string;
  userId: string;
  productId: string;
  quantity: number;
  coinsSpent: number;
  status: OrderStatus;
  pickupLocationId: string;
  pickupTimeSlot: string; // human label
  pickupDate?: string; // ISO
  pickupSlotId?: string | null;
  verificationCode?: string;
  reservedAt?: string;
  scannedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ReserveOrderBody = {
  productId: string;
  quantity: number;
  pickupLocationId: string;
  pickupTimeSlot: string; // e.g. "Morning (8 AM - 12 PM)"
  pickupDate: string; // e.g. "2025-11-01T00:00:00.000Z"
};

export type ReserveOrderResponse = { success: boolean; order: Order };
export type OrdersResponse = { orders: Order[] };
export type SimpleSuccess = { success: boolean };

// Wallet
export type WalletBalanceResponse = {
  currentBalance: number;
  monthlyCredit: number;
  spent: number;
  refillDate?: string; // ISO
  daysUntilRefill: number;
};

export type Transaction = {
  id: string;
  userId: string;
  type: "debit" | "credit" | "refund" | string;
  amount: number;
  description?: string;
  relatedOrderId?: string | null;
  balanceAfter?: number;
  createdAt: string;
};

export type TransactionsResponse = {
  transactions: Transaction[];
  pagination: Pagination;
};

// Notifications
export type Notification = {
  id: string;
  userId: string;
  type: string; // "wallet" | "order" | ...
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string | null;
  data?: any;
  orderId?: string | null;
  createdAt: string;
};

export type NotificationsResponse = { notifications: Notification[] };

// Impact
export type ImpactResponse = {
  rangeDays: number;
  ordersCompleted: number;
  kgRescued: number;
  co2SavedKg: number;
  rupeesSaved: number;
};

// Earn
export type EarnAdBody = { adId: string };
export type EarnResponse = { success: boolean; credited: number };

// Demo Admin
export type ForceState = "confirmed" | "ready" | "scanned" | "completed" | "cancelled";
export type ForceStateBody = { to: ForceState };
export type AdminSeedProductResponse = { success: boolean; product: Product };

// AI Pricing
export type SuggestAiPriceBody = {
  productId: string;
  basePrice: number;
  expiryDate?: string;
  inventory?: number;
  demandIndex?: number;
  returnReason?: boolean;
};
export type SuggestAiPriceResponse = { price: number; currency: string; reason?: string };

// Query helpers
type QueryInput = Record<string, string | number | boolean | undefined | null>;

//
// ---------- Token store ----------
//

const TOKEN_KEY = "token";
let authListeners: Array<(token: string | null) => void> = [];

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    authListeners.forEach((fn) => fn(token));
  } catch {
    // no-op
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    authListeners.forEach((fn) => fn(null));
  } catch {
    // no-op
  }
}

export function onAuthChange(cb: (token: string | null) => void) {
  authListeners.push(cb);
  return () => {
    authListeners = authListeners.filter((f) => f !== cb);
  };
}

//
// ---------- Utils ----------
//

function buildQuery(q?: QueryInput): string {
  if (!q) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null) continue;
    params.append(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

function withTimeout<T>(p: Promise<T>, ms = DEFAULT_TIMEOUT_MS): Promise<T> {
  let t: any;
  const timeout = new Promise<never>((_, rej) => {
    t = setTimeout(() => rej(new Error(`Request timed out after ${ms}ms`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(t));
}

async function parseJsonSafe(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text };
  }
}

function normalizeError(status: number, body: any): ApiError {
  const msg = body?.error || body?.message || `HTTP ${status}`;
  return { status, error: body?.error, message: msg, details: body };
}

//
// ---------- Core request wrapper ----------
//

type ReqOpts = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  query?: QueryInput;
  body?: unknown;
  timeoutMs?: number;
  auth?: boolean; // When true, adds Authorization: Bearer <token>
  demoAdminToken?: string | null; // Special header for demo-admin endpoints
};

async function request<T>(path: string, opts: ReqOpts = {}): Promise<T> {
  const {
    method = "GET",
    headers = {},
    query,
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    auth = false,
    demoAdminToken = null,
  } = opts;

  const url = `${API_BASE}${path}${buildQuery(query)}`;

  const finalHeaders: Record<string, string> = {
    ...headers,
  };

  if (body !== undefined && method !== "GET") {
    finalHeaders["Content-Type"] = finalHeaders["Content-Type"] ?? "application/json";
  }

  if (auth) {
    const token = getToken();
    if (token) {
      finalHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  if (demoAdminToken) {
    // backend expects: Authorization: DemoAdmin <token>
    finalHeaders["Authorization"] = `DemoAdmin ${demoAdminToken}`;
  }

  const fetchPromise = fetch(url, {
    method,
    headers: finalHeaders,
    body: body !== undefined && method !== "GET" ? JSON.stringify(body) : undefined,
  });

  const res = await withTimeout(fetchPromise, timeoutMs);
  if (!res.ok) {
    const errBody = await parseJsonSafe(res);
    throw normalizeError(res.status, errBody);
  }
  return (await parseJsonSafe(res)) as T;
}

//
// ---------- Public API surface ----------
//

export const api = {
  // --- Auth ---
  sendOtp: (phone: string) =>
    request<SendOtpResponse>("/api/auth/send-otp", {
      method: "POST",
      body: { phone },
    }),

  verifyOtp: async (phone: string, otp: string) => {
    const res = await request<VerifyOtpResponse>("/api/auth/verify-otp", {
      method: "POST",
      body: { phone, otp },
    });
    // Side-effect: persist token
    if (res?.token) setToken(res.token);
    return res;
  },

  // --- Products ---
  listProducts: (params?: { category?: string; search?: string; page?: number; limit?: number }) =>
    request<ListProductsResponse>("/api/products", {
      query: {
        category: params?.category,
        search: params?.search,
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
      },
    }),

  getProduct: (id: string) => request<Product>(`/api/products/${id}`),

  listCategories: () => request<CategoriesResponse>("/api/products/categories"),

  // --- Pickup (locations + capacity slots) ---
  listPickupLocations: () => request<PickupLocationsResponse>("/api/pickup-locations"),

  listPickupSlots: (pickupLocationId: string, dateYYYYMMDD: string) =>
    request<PickupSlotsResponse>("/api/pickup-slots", {
      query: { pickupLocationId, date: dateYYYYMMDD },
    }),

  // --- Orders ---
  reserveOrder: (payload: ReserveOrderBody) =>
    request<ReserveOrderResponse>("/api/orders/reserve", {
      method: "POST",
      body: payload,
      auth: true,
    }),

  activeOrders: () =>
    request<OrdersResponse>("/api/orders/active", {
      auth: true,
    }),

  pastOrders: () =>
    request<OrdersResponse>("/api/orders/past", {
      auth: true,
    }),

  cancelOrder: (orderId: string) =>
    request<SimpleSuccess>(`/api/orders/${orderId}/cancel`, {
      method: "POST",
      auth: true,
    }),

  markReady: (orderId: string) =>
    request<SimpleSuccess>(`/api/orders/${orderId}/ready`, {
      method: "POST",
      auth: true,
    }),

  markScanned: (orderId: string) =>
    request<SimpleSuccess>(`/api/orders/${orderId}/scanned`, {
      method: "POST",
      auth: true,
    }),

  completeOrder: (orderId: string) =>
    request<SimpleSuccess>(`/api/orders/${orderId}/complete`, {
      method: "POST",
      auth: true,
    }),

  // --- Wallet ---
  walletBalance: () =>
    request<WalletBalanceResponse>("/api/wallet/balance", {
      auth: true,
    }),

  walletTransactions: (page = 1, limit = 20) =>
    request<TransactionsResponse>("/api/wallet/transactions", {
      auth: true,
      query: { page, limit },
    }),

  // --- Notifications ---
  notifications: () =>
    request<NotificationsResponse>("/api/notifications", {
      auth: true,
    }),

  markAllNotificationsRead: () =>
    request<SimpleSuccess>("/api/notifications/read-all", {
      method: "POST",
      auth: true,
    }),

  // --- Impact ---
  impact: () =>
    request<ImpactResponse>("/api/impact", {
      auth: true,
    }),

  // --- Earn ---
  earnByAd: (adId: string) =>
    request<EarnResponse>("/api/earn/ad", {
      method: "POST",
      auth: true,
      body: { adId } as EarnAdBody,
    }),

  // --- Demo Admin helpers (for local/demo only) ---
  adminForceOrder: (orderId: string, to: ForceState, demoAdminToken: string) =>
    request<{ success: boolean; order: Order }>(`/api/demo-admin/orders/${orderId}/force`, {
      method: "POST",
      demoAdminToken,
      body: { to } as ForceStateBody,
    }),

  adminSeedProduct: (demoAdminToken: string) =>
    request<AdminSeedProductResponse>("/api/demo-admin/seed/product", {
      method: "POST",
      demoAdminToken,
    }),

  // --- AI Pricing ---
  suggestAiPrice: (body: SuggestAiPriceBody) =>
    request<SuggestAiPriceResponse>("/api/ai/pricing/suggest", {
      method: "POST",
      body,
    }),
};

//
// ---------- Convenience helpers for UI ----------
//

/**
 * Returns ISO date string for midnight UTC of the given local Date.
 * Useful for `pickupDate`.
 */
export function toMidnightUTCIso(d: Date): string {
  const z = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
  return z.toISOString();
}

/**
 * Shortcut: today’s YYYY-MM-DD string (local calendar), useful for pickup-slot queries.
 */
export function todayYMD(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
