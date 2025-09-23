// Core tenant types
export interface Tenant {
  id: string;
  name: string;
  domain: string;
  subdomain?: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  settings: Record<string, unknown>;
  stripeAccountId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// User types
export interface User {
  id: string;
  tenantId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "owner" | "staff" | "customer";
  phone?: string;
  loyaltyPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

// Menu types
export interface MenuCategory {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

export interface MenuItem {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Order types
export interface Order {
  id: string;
  tenantId: string;
  customerId?: string;
  orderNumber: string;
  status: "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
  orderType: "dine_in" | "takeout" | "delivery";
  subtotal: number;
  taxAmount: number;
  tipAmount: number;
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  stripePaymentIntentId?: string;
  customerNotes?: string;
  estimatedReadyTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
  createdAt: Date;
}

// Re-export feature types for consistency
export type { FeatureName, Features, FeatureFlag, TenantFeatures } from "./features";

// Re-export authentication types
export type {
  Role,
  JWTPayload,
  UserContext,
  AuthContext,
  LoginRequest,
  RegisterRequest,
  UserProfile,
  AuthResponse,
  RefreshResponse,
  AuthError,
  AuthErrorResponse,
  AuthenticatedRequest,
  AuthMiddlewareOptions,
  UserData,
  CreateUserData,
  AuthConfig
} from "./auth";
export { AuthErrorCode, isValidRole, isValidJWTPayload, isAuthenticatedRequest } from "./auth";

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}