/**
 * Database TypeScript Interfaces and Types
 * 
 * This module contains all database-related TypeScript interfaces,
 * connection configurations, and query utilities for type safety.
 */

import type { PoolClient, QueryResult, QueryResultRow } from "pg";
import type { RedisClientType } from "redis";

// =====================================================================================
// DATABASE CONFIGURATION TYPES
// =====================================================================================

export interface DatabaseConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  connectionString?: string;
  ssl?: {
    rejectUnauthorized?: boolean;
  };
  
  // Pool configuration
  min?: number;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  url?: string;
  keyPrefix?: string;
  
  // Connection settings
  connectTimeout?: number;
  lazyConnect?: boolean;
  maxRetriesPerRequest?: number;
  retryDelayOnFailover?: number;
}

// =====================================================================================
// DATABASE ROW TYPES (matching schema.sql)
// =====================================================================================

export interface TenantRow {
  id: string;
  name: string;
  domain: string;
  subdomain: string | null;
  email: string;
  phone: string | null;
  address: Record<string, any> | null;
  settings: Record<string, any>;
  stripe_account_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TenantFeatureRow {
  id: string;
  tenant_id: string;
  feature_name: string;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserRow {
  id: string;
  tenant_id: string;
  email: string;
  password_hash: string | null;
  first_name: string | null;
  last_name: string | null;
  role: "owner" | "staff" | "customer";
  phone: string | null;
  loyalty_points: number;
  created_at: Date;
  updated_at: Date;
}

export interface MenuCategoryRow {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MenuItemRow {
  id: string;
  tenant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number; // Note: comes as string from pg, convert to number
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  search_vector: string | null; // tsvector representation
  created_at: Date;
  updated_at: Date;
}

export interface OrderRow {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  order_number: string;
  status: "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
  order_type: "dine_in" | "takeout" | "delivery";
  subtotal: number; // Note: comes as string from pg, convert to number
  tax_amount: number;
  tip_amount: number;
  total_amount: number;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  stripe_payment_intent_id: string | null;
  customer_notes: string | null;
  estimated_ready_time: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number; // Note: comes as string from pg, convert to number
  total_price: number;
  special_instructions: string | null;
  created_at: Date;
}

export interface LoyaltyTransactionRow {
  id: string;
  tenant_id: string;
  customer_id: string;
  order_id: string | null;
  transaction_type: "earned" | "redeemed" | "expired" | "adjusted";
  points: number;
  description: string | null;
  created_at: Date;
}

export interface LoyaltyRewardRow {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  points_required: number;
  reward_type: "discount_percent" | "discount_amount" | "free_item";
  reward_value: number | null; // Note: comes as string from pg, convert to number
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// =====================================================================================
// QUERY FUNCTION TYPES
// =====================================================================================

export type QueryParameters = (string | number | boolean | Date | null)[];

export type QueryFunction = <T extends QueryResultRow = any>(
  text: string,
  params?: QueryParameters
) => Promise<QueryResult<T>>;

export type TransactionFunction = <T>(
  fn: (client: PoolClient) => Promise<T>
) => Promise<T>;

// =====================================================================================
// CACHE TYPES
// =====================================================================================

export type CacheValue = 
  | string 
  | number 
  | boolean 
  | object 
  | Array<any> 
  | null;

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

// =====================================================================================
// QUERY HELPERS AND BUILDERS
// =====================================================================================

export interface QueryBuilder {
  select: string[];
  from: string;
  where?: string[];
  orderBy?: string;
  limit?: number;
  offset?: number;
}

export interface InsertData {
  [key: string]: any;
}

export interface UpdateData {
  [key: string]: any;
}

// =====================================================================================
// DATABASE OPERATION TYPES
// =====================================================================================

export interface DatabaseOperations {
  // Generic operations
  findById<T>(table: string, id: string, tenantId?: string): Promise<T | null>;
  findMany<T>(table: string, where?: Record<string, any>, tenantId?: string): Promise<T[]>;
  create<T>(table: string, data: InsertData, tenantId?: string): Promise<T>;
  update<T>(table: string, id: string, data: UpdateData, tenantId?: string): Promise<T | null>;
  delete(table: string, id: string, tenantId?: string): Promise<boolean>;
  
  // Tenant-specific operations
  findByTenant<T>(table: string, tenantId: string, where?: Record<string, any>): Promise<T[]>;
  countByTenant(table: string, tenantId: string, where?: Record<string, any>): Promise<number>;
}

// =====================================================================================
// ERROR TYPES
// =====================================================================================

export interface DatabaseError extends Error {
  code?: string;
  detail?: string;
  hint?: string;
  position?: string;
  internalPosition?: string;
  internalQuery?: string;
  where?: string;
  schema?: string;
  table?: string;
  column?: string;
  dataType?: string;
  constraint?: string;
}

export interface ConnectionError extends Error {
  code: "CONNECTION_ERROR";
  detail: string;
}

export interface QueryError extends Error {
  code: "QUERY_ERROR";
  query: string;
  parameters?: QueryParameters;
}

// =====================================================================================
// UTILITY TYPES
// =====================================================================================

export type DatabaseTable = 
  | "tenants"
  | "tenant_features" 
  | "users"
  | "menu_categories"
  | "menu_items"
  | "orders"
  | "order_items"
  | "loyalty_transactions"
  | "loyalty_rewards";

export type UserRole = "owner" | "staff" | "customer";
export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
export type OrderType = "dine_in" | "takeout" | "delivery";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type TransactionType = "earned" | "redeemed" | "expired" | "adjusted";
export type RewardType = "discount_percent" | "discount_amount" | "free_item";
export type FeatureName = "menu" | "orders" | "loyalty";

// =====================================================================================
// PAGINATION TYPES
// =====================================================================================

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// =====================================================================================
// SEARCH TYPES
// =====================================================================================

export interface SearchOptions {
  query: string;
  fields?: string[];
  limit?: number;
  offset?: number;
  tenantId?: string;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  searchTime: number;
}

// =====================================================================================
// ANALYTICS TYPES
// =====================================================================================

export interface DateRange {
  start: Date;
  end: Date;
}

export interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByType: Record<OrderType, number>;
  topMenuItems: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface LoyaltyAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  averagePointsPerCustomer: number;
  topRewards: Array<{
    rewardId: string;
    name: string;
    redemptions: number;
  }>;
}