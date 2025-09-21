/**
 * Tenant Resolution TypeScript Interfaces
 *
 * This module contains all tenant-related TypeScript interfaces
 * for the multi-tenant GrowPlate platform.
 */

// =====================================================================================
// CORE TENANT TYPES
// =====================================================================================

export interface TenantContext {
  id: string;
  name: string;
  domain: string;
  subdomain: string | null;
  email: string;
  phone: string | null;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  } | null;
  settings: Record<string, any>;
  stripeAccountId: string | null;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  // Business settings
  businessName?: string;
  businessType?: string;
  timezone?: string;
  currency?: string;

  // Feature settings
  enableOrders?: boolean;
  enableLoyalty?: boolean;
  enableReservations?: boolean;

  // Order settings
  orderTypes?: ("dine_in" | "takeout" | "delivery")[];
  orderTiming?: {
    orderAheadMinutes?: number;
    preparationTime?: number;
    deliveryRadius?: number;
  };

  // Loyalty settings
  loyaltyPointsPerDollar?: number;
  loyaltyWelcomeBonus?: number;
  loyaltyMinimumOrder?: number;

  // UI settings
  brandColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  logo?: string;
  favicon?: string;

  // Contact settings
  supportEmail?: string;
  supportPhone?: string;

  // Payment settings
  acceptedPayments?: string[];
  tipSuggestions?: number[];

  // Notification settings
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  orderNotifications?: boolean;
}

// =====================================================================================
// DOMAIN RESOLUTION TYPES
// =====================================================================================

export interface DomainInfo {
  hostname: string;
  domain: string;
  subdomain: string | null;
  port: string | null;
  isCustomDomain: boolean;
  isLocalhost: boolean;
}

export interface TenantResolutionResult {
  success: boolean;
  tenant: TenantContext | null;
  error?: TenantResolutionError;
  source: "cache" | "database";
  responseTime: number;
}

// =====================================================================================
// ERROR TYPES
// =====================================================================================

export type TenantResolutionErrorCode =
  | "TENANT_NOT_FOUND"
  | "INVALID_DOMAIN"
  | "DATABASE_ERROR"
  | "CACHE_ERROR"
  | "DOMAIN_PARSE_ERROR"
  | "TENANT_DISABLED";

export interface TenantResolutionError {
  code: TenantResolutionErrorCode;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export class TenantError extends Error {
  constructor(
    public code: TenantResolutionErrorCode,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "TenantError";
  }
}

// =====================================================================================
// TENANT LOOKUP TYPES
// =====================================================================================

export interface TenantLookupOptions {
  useCache?: boolean;
  cacheTTL?: number;
  includeFeatures?: boolean;
  includeSettings?: boolean;
}

export interface TenantCacheEntry {
  tenant: TenantContext;
  cachedAt: Date;
  ttl: number;
}

// =====================================================================================
// MIDDLEWARE TYPES
// =====================================================================================

export interface TenantMiddlewareConfig {
  defaultTenant?: string;
  enableCaching?: boolean;
  cacheTTL?: number;
  errorHandler?: (error: TenantResolutionError) => Response;
  skipPaths?: string[];
  requiredPaths?: string[];
}

export interface RequestWithTenant extends Request {
  tenant?: TenantContext;
  tenantResolution?: TenantResolutionResult;
}

// =====================================================================================
// VALIDATION TYPES
// =====================================================================================

export interface DomainValidationResult {
  isValid: boolean;
  normalizedDomain: string;
  errors: string[];
}

export interface TenantValidationResult {
  isValid: boolean;
  tenant: TenantContext | null;
  errors: string[];
  warnings: string[];
}

// =====================================================================================
// TENANT MANAGEMENT TYPES
// =====================================================================================

export interface CreateTenantData {
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
  settings?: TenantSettings;
  stripeAccountId?: string;
}

export interface UpdateTenantData {
  name?: string;
  domain?: string;
  subdomain?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  settings?: Partial<TenantSettings>;
  stripeAccountId?: string;
}

// =====================================================================================
// TENANT OPERATIONS TYPES
// =====================================================================================

export interface TenantOperations {
  // Core operations
  getByDomain(
    domain: string,
    options?: TenantLookupOptions
  ): Promise<TenantContext | null>;
  getBySubdomain(
    subdomain: string,
    options?: TenantLookupOptions
  ): Promise<TenantContext | null>;
  getById(
    id: string,
    options?: TenantLookupOptions
  ): Promise<TenantContext | null>;

  // Cache operations
  cacheSet(key: string, tenant: TenantContext, ttl?: number): Promise<boolean>;
  cacheGet(key: string): Promise<TenantContext | null>;
  cacheDelete(key: string): Promise<boolean>;
  cacheClear(tenantId: string): Promise<number>;

  // Domain operations
  parseDomain(hostname: string): DomainInfo;
  validateDomain(domain: string): DomainValidationResult;
  normalizeDomain(domain: string): string;

  // Resolution operations
  resolveTenant(
    hostname: string,
    options?: TenantLookupOptions
  ): Promise<TenantResolutionResult>;
}

// =====================================================================================
// REMIX INTEGRATION TYPES
// =====================================================================================

export interface LoaderDataWithTenant<T = any> {
  tenant: TenantContext;
  data: T;
}

export interface ActionDataWithTenant<T = any> {
  tenant: TenantContext;
  data: T;
}

// =====================================================================================
// FEATURE FLAG INTEGRATION
// =====================================================================================

export interface TenantFeature {
  id: string;
  tenantId: string;
  featureName: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type FeatureName =
  | "menu"
  | "orders"
  | "loyalty"
  | "reservations"
  | "analytics"
  | "notifications"
  | "payments"
  | "reviews";

export type Features = Record<FeatureName, boolean>;

// =====================================================================================
// ANALYTICS TYPES
// =====================================================================================

export interface TenantAnalytics {
  tenantId: string;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  customerCount: number;
  activeFeatures: string[];
  lastOrderDate: Date | null;
  joinDate: Date;
  subscriptionStatus: "active" | "inactive" | "trial" | "suspended";
}

// =====================================================================================
// UTILITY TYPES
// =====================================================================================

export type TenantStatus = "active" | "inactive" | "suspended" | "pending";

export interface TenantHealth {
  status: "healthy" | "warning" | "error";
  checks: {
    database: boolean;
    cache: boolean;
    features: boolean;
    payments: boolean;
  };
  lastChecked: Date;
  issues: string[];
}

// =====================================================================================
// CONSTANTS
// =====================================================================================

export const TENANT_CACHE_KEYS = {
  DOMAIN: (domain: string) => `tenant:domain:${domain}`,
  SUBDOMAIN: (subdomain: string) => `tenant:subdomain:${subdomain}`,
  ID: (id: string) => `tenant:id:${id}`,
  FEATURES: (tenantId: string) => `tenant:features:${tenantId}`,
} as const;

export const TENANT_CACHE_TTL = {
  DEFAULT: 3600, // 1 hour
  FEATURES: 1800, // 30 minutes
  SETTINGS: 7200, // 2 hours
} as const;

export const DEFAULT_TENANT_SETTINGS: TenantSettings = {
  enableOrders: true,
  enableLoyalty: false,
  enableReservations: false,
  orderTypes: ["dine_in", "takeout"],
  loyaltyPointsPerDollar: 1,
  loyaltyWelcomeBonus: 100,
  loyaltyMinimumOrder: 0,
  currency: "USD",
  timezone: "America/New_York",
  emailNotifications: true,
  smsNotifications: false,
  orderNotifications: true,
  acceptedPayments: ["card"],
  tipSuggestions: [15, 18, 20, 25],
} as const;
