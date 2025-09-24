/**
 * Menu System TypeScript Interfaces
 * 
 * Type definitions for menu categories, menu items, and search functionality
 * following the database schema and business logic requirements.
 */

// =====================================================================================
// CORE MENU DATA TYPES
// =====================================================================================

export interface CategoryData {
  name: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface Category extends CategoryData {
  id: string;
  tenant_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface MenuItemData {
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available?: boolean;
  sort_order?: number;
}

export interface MenuItem extends MenuItemData {
  id: string;
  tenant_id: string;
  created_at: Date;
  updated_at: Date;
}

// =====================================================================================
// SEARCH TYPES
// =====================================================================================

export interface SearchOptions {
  limit?: number;
  offset?: number;
  includeUnavailable?: boolean;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
  searchTime: number;
}

export interface SearchQuery {
  original: string;
  sanitized: string;
  tsquery: string;
}

// =====================================================================================
// MENU OPERATION TYPES
// =====================================================================================

export interface MenuOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CategoryFilters {
  is_active?: boolean;
  sort_order?: 'ASC' | 'DESC';
}

export interface MenuItemFilters {
  category_id?: string;
  is_available?: boolean;
  price_min?: number;
  price_max?: number;
  sort_order?: 'ASC' | 'DESC';
  sort_by?: 'name' | 'price' | 'sort_order' | 'created_at';
}

// =====================================================================================
// ERROR TYPES
// =====================================================================================

export class MenuValidationError extends Error {
  constructor(field: string, message: string) {
    super(`Invalid ${field}: ${message}`);
    this.name = 'MenuValidationError';
  }
}

export class MenuDatabaseError extends Error {
  public cause?: Error;
  
  constructor(operation: string, cause: Error) {
    super(`Menu ${operation} failed: ${cause.message}`);
    this.name = 'MenuDatabaseError';
    this.cause = cause;
  }
}

export class MenuConstraintError extends Error {
  constructor(constraint: string, details: string) {
    super(`Constraint violation: ${constraint} - ${details}`);
    this.name = 'MenuConstraintError';
  }
}

export class MenuNotFoundError extends Error {
  constructor(type: 'category' | 'menu_item', id: string) {
    super(`${type === 'category' ? 'Category' : 'Menu item'} not found: ${id}`);
    this.name = 'MenuNotFoundError';
  }
}

export class MenuTenantMismatchError extends Error {
  constructor(type: 'category' | 'menu_item', id: string) {
    super(`${type === 'category' ? 'Category' : 'Menu item'} does not belong to tenant: ${id}`);
    this.name = 'MenuTenantMismatchError';
  }
}

// =====================================================================================
// UTILITY TYPES
// =====================================================================================

export type MenuTable = 'menu_categories' | 'menu_items';

export type CategorySortField = 'name' | 'sort_order' | 'created_at' | 'updated_at';
export type MenuItemSortField = 'name' | 'price' | 'sort_order' | 'created_at' | 'updated_at';

export interface CategoryWithItemCount extends Category {
  item_count: number;
}

export interface MenuItemWithCategory extends MenuItem {
  category_name: string;
  category_is_active: boolean;
}

// =====================================================================================
// VALIDATION HELPERS
// =====================================================================================

export const CATEGORY_CONSTRAINTS = {
  NAME_MAX_LENGTH: 255,
  DESCRIPTION_MAX_LENGTH: 1000,
  SORT_ORDER_MIN: 0,
  SORT_ORDER_MAX: 9999
} as const;

export const MENU_ITEM_CONSTRAINTS = {
  NAME_MAX_LENGTH: 255,
  DESCRIPTION_MAX_LENGTH: 2000,
  PRICE_MIN: 0,
  PRICE_MAX: 999999.99,
  SORT_ORDER_MIN: 0,
  SORT_ORDER_MAX: 9999,
  IMAGE_URL_MAX_LENGTH: 500
} as const;

export const SEARCH_CONSTRAINTS = {
  QUERY_MIN_LENGTH: 1,
  QUERY_MAX_LENGTH: 100,
  RESULTS_DEFAULT_LIMIT: 50,
  RESULTS_MAX_LIMIT: 200
} as const;