export type {
  User,
  Wallet,
  Product,
  Order,
  PickupLocation,
  PickupSlot,
  Transaction,
  Notification,
  OrderEvent,
  ImpactStat,
  EarnEvent,
} from '@prisma/client';

import type { OrderStatus, TransactionType } from '@prisma/client';

export interface UserProfile {
  id: string;
  phone: string;
  name: string | null;
  isVerified: boolean;
  eligibilityStatus: string; // legacy text kept for UI
}

export interface WalletInfo {
  currentBalance: number;
  monthlyCredit: number;
  spent: number;
  refillDate: Date;
  daysUntilRefill: number;
}

export interface OrderWithDetails {
  id: string;
  orderNumber: string;
  product: {
    id: string;
    name: string;
    image: string;
  };
  quantity: number;
  coinsSpent: number;
  status: OrderStatus; // 'confirmed' | 'ready' | 'completed' | 'cancelled'
  pickupLocation: {
    name: string;
    address: string;
  };
  pickupTimeSlot: string; // legacy label
  pickupDate: Date;
  verificationCode: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}