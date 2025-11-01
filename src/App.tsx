// src/App.tsx
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { HomePage } from './components/HomePage';
import { ProductDetailPage } from './components/ProductDetailPage';
import { WalletPage } from './components/WalletPage';
import { OrdersPage } from './components/OrdersPage';
import { ProfilePage } from './components/ProfilePage';
import { OnboardingFlow } from './components/OnboardingFlow';
import type { Product } from './components/ProductGrid';

/** ----------------------------
 * Minimal API + Auth scaffolding
 * (no style impact, no UI changes)
 * -----------------------------*/

// Safely read Vite env without TypeScript errors and normalize to end with /api
const RAW_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_API_URL) ??
  (typeof process !== 'undefined' && (process as any)?.env?.VITE_API_URL) ??
  'http://localhost:5001';

const TRIMMED = String(RAW_BASE).replace(/\/+$/, '');
const API_BASE = TRIMMED.endsWith('/api') ? TRIMMED : `${TRIMMED}/api`;

type AuthState = {
  token: string | null;
  setToken: (t: string | null) => void;
};
export const AuthContext = createContext<AuthState>({
  token: null,
  setToken: () => {},
});

type Api = {
  base: string;
  get: <T = any>(path: string, token?: string | null) => Promise<T>;
  post: <T = any>(path: string, body?: any, token?: string | null) => Promise<T>;
  // Convenience endpoints you can use inside pages later:
  sendOtp: (phone: string) => Promise<{ success: boolean; otp?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ token: string; user: any }>;
  registerProfile: (
    payload: {
      name: string;
      aadhaarLast4: string;
      incomeRange?: string | null;
      schoolGoingChildren?: number;
      address?: string;
      city?: string;
      pincode?: string;
    },
    token: string
  ) => Promise<any>;
  getProfile: (token: string) => Promise<any>;
  getProducts: () => Promise<{ products: any[] }>;
  getPickupLocations: () => Promise<{ locations: any[] }>;
  reserveOrder: (
    body: {
      productId: string;
      quantity: number;
      pickupLocationId: string;
      pickupTimeSlot: string;
      pickupDate: string;
    },
    token: string
  ) => Promise<any>;
  getActiveOrders: (token: string) => Promise<{ orders: any[] }>;
  cancelOrder: (orderId: string, token: string) => Promise<any>;
  getPastOrders: (token: string) => Promise<{ orders: any[] }>;
  getWalletBalance: (token: string) => Promise<any>;
  getTransactions: (token: string) => Promise<{ transactions: any[]; pagination: any }>;
  getCategories: () => Promise<{ categories: any[] }>;
};

export const ApiContext = createContext<Api | null>(null);

function createApi(): Api {
  const req = async <T,>(
    path: string,
    method: 'GET' | 'POST',
    body?: any,
    token?: string | null
  ): Promise<T> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
    }
    return res.json() as Promise<T>;
  };

  const get = <T,>(path: string, token?: string | null) => req<T>(path, 'GET', undefined, token);
  const post = <T,>(path: string, body?: any, token?: string | null) =>
    req<T>(path, 'POST', body, token);

  return {
    base: API_BASE,
    get,
    post,
    // Auth
    sendOtp: (phone) => post('/auth/send-otp', { phone }),
    verifyOtp: (phone, otp) => post('/auth/verify-otp', { phone, otp }),
    // User
    registerProfile: (payload, token) => post('/users/register', payload, token),
    getProfile: (token) => get('/users/profile', token),
    // Catalog
    getProducts: () => get('/products'),
    getPickupLocations: () => get('/pickup-locations'),
    getCategories: () => get('/products/categories'),
    // Orders
    reserveOrder: (body, token) => post('/orders/reserve', body, token),
    getActiveOrders: (token) => get('/orders/active', token),
    cancelOrder: (orderId, token) => post(`/orders/${orderId}/cancel`, undefined, token),
    getPastOrders: (token) => get('/orders/past', token),
    // Wallet
    getWalletBalance: (token) => get('/wallet/balance', token),
    getTransactions: (token) => get('/wallet/transactions', token),
  };
}

/** ----------------------------
 * Your existing app shell
 * -----------------------------*/
type View = 'onboarding' | 'home' | 'product' | 'wallet' | 'orders' | 'profile';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('onboarding');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Token persisted locally; no UI/style impact.
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('gs_token');
    } catch {
      return null;
    }
  });

  const setTokenMemo = useCallback((t: string | null) => {
    setToken(t);
    try {
      if (t) localStorage.setItem('gs_token', t);
      else localStorage.removeItem('gs_token');
    } catch {
      // ignore storage errors
    }
  }, []);

  const api = useMemo(() => createApi(), []);
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug('[GroSave] API_BASE =', api.base);
  }, [api.base]);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product');
  };

  const handleBack = () => {
    setCurrentView('home');
    setSelectedProduct(null);
  };

  const handleNavigation = (view: View) => {
    setCurrentView(view);
  };

  const handleOnboardingComplete = () => {
    setCurrentView('home');
  };

  return (
    <AuthContext.Provider value={{ token, setToken: setTokenMemo }}>
      <ApiContext.Provider value={api}>
        <div className="min-h-screen bg-[#F8F9FA]">
          {currentView === 'onboarding' && (
            <OnboardingFlow onComplete={handleOnboardingComplete} />
          )}
          {currentView === 'home' && (
            <HomePage onProductClick={handleProductClick} onNavigate={handleNavigation} />
          )}
          {currentView === 'product' && selectedProduct && (
            <ProductDetailPage product={selectedProduct} onBack={handleBack} />
          )}
          {currentView === 'wallet' && <WalletPage onNavigate={handleNavigation} />}
          {currentView === 'orders' && <OrdersPage onNavigate={handleNavigation} />}
          {currentView === 'profile' && <ProfilePage onNavigate={handleNavigation} />}
        </div>
      </ApiContext.Provider>
    </AuthContext.Provider>
  );
}
