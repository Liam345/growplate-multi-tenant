/**
 * Menu Database Operations
 * 
 * CRUD operations for menu categories and items with full-text search functionality,
 * tenant isolation, and comprehensive error handling.
 */

import { tenantQuery, tenantQueryOne, tenantQueryMany } from '../db';
import { 
  sanitizeSearchQuery, 
  buildFullTextSearchQuery, 
  buildSearchParams,
  calculateSearchTime,
  formatSearchResults,
  validateSearchQuery
} from '../search';

import type {
  Category,
  MenuItem,
  CategoryData,
  MenuItemData,
  CategoryFilters,
  MenuItemFilters,
  SearchOptions,
  SearchResult,
  CategoryWithItemCount,
  MenuItemWithCategory,
  CATEGORY_CONSTRAINTS,
  MENU_ITEM_CONSTRAINTS
} from '~/types/menu';

import {
  MenuValidationError,
  MenuDatabaseError,
  MenuConstraintError,
  MenuNotFoundError,
  MenuTenantMismatchError
} from '~/types/menu';

import type { MenuCategoryRow, MenuItemRow } from '~/types/database';

// =====================================================================================
// VALIDATION UTILITIES
// =====================================================================================

/**
 * Validate category data
 */
function validateCategoryData(data: CategoryData): void {
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    if (!data.name || typeof data.name !== 'string') {
      throw new MenuValidationError('name', 'Category name is required');
    } else {
      throw new MenuValidationError('name', 'Category name cannot be empty');
    }
  }

  if (data.name.length > 255) {
    throw new MenuValidationError('name', 'Category name too long (max 255 characters)');
  }

  if (data.description && data.description.length > 1000) {
    throw new MenuValidationError('description', 'Category description too long (max 1000 characters)');
  }

  if (data.sort_order !== undefined && (data.sort_order < 0 || data.sort_order > 9999)) {
    throw new MenuValidationError('sort_order', 'Sort order must be between 0 and 9999');
  }
}

/**
 * Validate menu item data
 */
function validateMenuItemData(data: MenuItemData): void {
  if (!data.name || typeof data.name !== 'string') {
    throw new MenuValidationError('name', 'Menu item name is required');
  }

  if (data.name.trim().length === 0) {
    throw new MenuValidationError('name', 'Menu item name cannot be empty');
  }

  if (data.name.length > 255) {
    throw new MenuValidationError('name', 'Menu item name too long (max 255 characters)');
  }

  if (!data.category_id || typeof data.category_id !== 'string') {
    throw new MenuValidationError('category_id', 'Category ID is required');
  }

  if (data.price === undefined || data.price === null || typeof data.price !== 'number') {
    throw new MenuValidationError('price', 'Price is required');
  }

  if (data.price < 0 || data.price > 999999.99) {
    throw new MenuValidationError('price', 'Price must be between 0 and 999999.99');
  }

  if (data.description && data.description.length > 2000) {
    throw new MenuValidationError('description', 'Menu item description too long (max 2000 characters)');
  }

  if (data.image_url && data.image_url.length > 500) {
    throw new MenuValidationError('image_url', 'Image URL too long (max 500 characters)');
  }

  if (data.sort_order !== undefined && (data.sort_order < 0 || data.sort_order > 9999)) {
    throw new MenuValidationError('sort_order', 'Sort order must be between 0 and 9999');
  }
}

/**
 * Validate tenant ID
 */
function validateTenantId(tenantId: string): void {
  if (!tenantId || typeof tenantId !== 'string' || tenantId.trim().length === 0) {
    throw new MenuValidationError('tenant_id', 'Tenant ID is required');
  }
}

/**
 * Convert database row to Category object
 */
function mapRowToCategory(row: MenuCategoryRow): Category {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    name: row.name,
    description: row.description || undefined,
    sort_order: row.sort_order,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

/**
 * Convert database row to MenuItem object
 */
function mapRowToMenuItem(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    category_id: row.category_id || '',
    name: row.name,
    description: row.description || undefined,
    price: typeof row.price === 'string' ? parseFloat(row.price) : row.price,
    image_url: row.image_url || undefined,
    is_available: row.is_available,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

// =====================================================================================
// CATEGORY OPERATIONS
// =====================================================================================

/**
 * Create a new menu category
 */
export async function createCategory(
  tenantId: string,
  data: CategoryData
): Promise<Category> {
  try {
    validateTenantId(tenantId);
    validateCategoryData(data);

    const sql = `
      INSERT INTO menu_categories (
        tenant_id, name, description, sort_order, is_active
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const params = [
      tenantId,
      data.name.trim(),
      data.description?.trim() || null,
      data.sort_order ?? 0,
      data.is_active ?? true
    ];

    const row = await tenantQueryOne<MenuCategoryRow>(tenantId, sql, params);
    
    if (!row) {
      throw new MenuDatabaseError('create', new Error('Failed to create category'));
    }

    return mapRowToCategory(row);
  } catch (error) {
    if (error instanceof MenuValidationError) {
      throw error;
    }
    
    console.error('Failed to create category:', error);
    throw new MenuDatabaseError('create', error as Error);
  }
}

/**
 * Get all categories for a tenant
 */
export async function getCategories(
  tenantId: string,
  filters: CategoryFilters = {}
): Promise<Category[]> {
  try {
    validateTenantId(tenantId);

    let sql = `
      SELECT *
      FROM menu_categories
      WHERE tenant_id = $1
    `;

    const params: any[] = [tenantId];

    // Apply filters
    if (filters.is_active !== undefined) {
      sql += ` AND is_active = $${params.length + 1}`;
      params.push(filters.is_active);
    }

    // Add ordering
    const sortOrder = filters.sort_order === 'DESC' ? 'DESC' : 'ASC';
    sql += ` ORDER BY sort_order ${sortOrder}, name ASC`;

    const rows = await tenantQueryMany<MenuCategoryRow>(tenantId, sql, params);
    
    return rows.map(mapRowToCategory);
  } catch (error) {
    if (error instanceof MenuValidationError) {
      throw error;
    }
    
    console.error('Failed to get categories:', error);
    throw new MenuDatabaseError('get', error as Error);
  }
}

/**
 * Get a single category by ID
 */
export async function getCategoryById(
  tenantId: string,
  categoryId: string
): Promise<Category | null> {
  try {
    validateTenantId(tenantId);

    if (!categoryId) {
      throw new MenuValidationError('category_id', 'Category ID is required');
    }

    const sql = `
      SELECT *
      FROM menu_categories
      WHERE id = $1 AND tenant_id = $2
    `;

    const row = await tenantQueryOne<MenuCategoryRow>(tenantId, sql, [categoryId, tenantId]);
    
    return row ? mapRowToCategory(row) : null;
  } catch (error) {
    if (error instanceof MenuValidationError) {
      throw error;
    }
    
    console.error('Failed to get category:', error);
    throw new MenuDatabaseError('get', error as Error);
  }
}

/**
 * Update a category
 */
export async function updateCategory(
  tenantId: string,
  categoryId: string,
  data: Partial<CategoryData>
): Promise<Category> {
  try {
    validateTenantId(tenantId);
    
    if (!categoryId) {
      throw new MenuValidationError('category_id', 'Category ID is required');
    }

    // Validate the update data
    if (data.name !== undefined) {
      validateCategoryData({ name: data.name } as CategoryData);
    }
    if (data.description !== undefined && data.description && data.description.length > 1000) {
      throw new MenuValidationError('description', 'Category description too long');
    }
    if (data.sort_order !== undefined && (data.sort_order < 0 || data.sort_order > 9999)) {
      throw new MenuValidationError('sort_order', 'Sort order must be between 0 and 9999');
    }

    // Verify category exists and belongs to tenant
    const existing = await getCategoryById(tenantId, categoryId);
    if (!existing) {
      throw new MenuNotFoundError('category', categoryId);
    }

    if (existing.tenant_id !== tenantId) {
      throw new MenuTenantMismatchError('category', categoryId);
    }

    // Build update query
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      params.push(data.name.trim());
    }

    if (data.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      params.push(data.description ? data.description.trim() : null);
    }

    if (data.sort_order !== undefined) {
      updateFields.push(`sort_order = $${paramIndex++}`);
      params.push(data.sort_order);
    }

    if (data.is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      params.push(data.is_active);
    }

    if (updateFields.length === 0) {
      return existing; // No changes
    }

    // Add WHERE clause parameters
    params.push(categoryId);
    const whereClause = `WHERE id = $${paramIndex}`;

    const sql = `
      UPDATE menu_categories
      SET ${updateFields.join(', ')}
      ${whereClause}
      RETURNING *
    `;

    const row = await tenantQueryOne<MenuCategoryRow>(tenantId, sql, params);
    
    if (!row) {
      throw new MenuDatabaseError('update', new Error('Failed to update category'));
    }

    return mapRowToCategory(row);
  } catch (error) {
    if (error instanceof MenuValidationError || 
        error instanceof MenuNotFoundError || 
        error instanceof MenuTenantMismatchError) {
      throw error;
    }
    
    console.error('Failed to update category:', error);
    throw new MenuDatabaseError('update', error as Error);
  }
}

/**
 * Delete a category (only if no menu items are associated)
 */
export async function deleteCategory(
  tenantId: string,
  categoryId: string
): Promise<void> {
  try {
    validateTenantId(tenantId);

    if (!categoryId) {
      throw new MenuValidationError('category_id', 'Category ID is required');
    }

    // Verify category exists and belongs to tenant
    const existing = await getCategoryById(tenantId, categoryId);
    if (!existing) {
      throw new MenuNotFoundError('category', categoryId);
    }

    if (existing.tenant_id !== tenantId) {
      throw new MenuTenantMismatchError('category', categoryId);
    }

    // Check for associated menu items
    const itemCountSql = `
      SELECT COUNT(*) as count
      FROM menu_items
      WHERE category_id = $1 AND tenant_id = $2
    `;

    const countResult = await tenantQueryOne<{ count: number }>(
      tenantId, 
      itemCountSql, 
      [categoryId, tenantId]
    );

    const itemCount = countResult ? parseInt(countResult.count.toString()) : 0;
    
    if (itemCount > 0) {
      throw new MenuConstraintError(
        'foreign_key_violation',
        'Cannot delete category with associated menu items'
      );
    }

    // Delete the category
    const deleteSql = `
      DELETE FROM menu_categories
      WHERE id = $1 AND tenant_id = $2
    `;

    const result = await tenantQuery(tenantId, deleteSql, [categoryId, tenantId]);
    
    if (!result.rowCount || result.rowCount === 0) {
      throw new MenuDatabaseError('delete', new Error('Failed to delete category'));
    }
  } catch (error) {
    if (error instanceof MenuValidationError || 
        error instanceof MenuNotFoundError || 
        error instanceof MenuTenantMismatchError ||
        error instanceof MenuConstraintError) {
      throw error;
    }
    
    console.error('Failed to delete category:', error);
    throw new MenuDatabaseError('delete', error as Error);
  }
}

/**
 * Get category with item count
 */
export async function getCategoryWithItemCount(
  tenantId: string,
  categoryId: string
): Promise<CategoryWithItemCount | null> {
  try {
    validateTenantId(tenantId);

    const sql = `
      SELECT 
        c.*,
        COUNT(mi.id) as item_count
      FROM menu_categories c
      LEFT JOIN menu_items mi ON c.id = mi.category_id AND mi.tenant_id = c.tenant_id
      WHERE c.id = $1 AND c.tenant_id = $2
      GROUP BY c.id, c.tenant_id, c.name, c.description, c.sort_order, c.is_active, c.created_at, c.updated_at
    `;

    const row = await tenantQueryOne<MenuCategoryRow & { item_count: number }>(
      tenantId, 
      sql, 
      [categoryId, tenantId]
    );
    
    if (!row) {
      return null;
    }

    return {
      ...mapRowToCategory(row),
      item_count: parseInt(row.item_count.toString())
    };
  } catch (error) {
    console.error('Failed to get category with item count:', error);
    throw new MenuDatabaseError('get', error as Error);
  }
}

// =====================================================================================
// MENU ITEM OPERATIONS
// =====================================================================================

/**
 * Create a new menu item
 */
export async function createMenuItem(
  tenantId: string,
  data: MenuItemData
): Promise<MenuItem> {
  try {
    validateTenantId(tenantId);
    validateMenuItemData(data);

    // Verify category exists and belongs to tenant
    const category = await getCategoryById(tenantId, data.category_id);
    if (!category) {
      throw new MenuNotFoundError('category', data.category_id);
    }

    if (category.tenant_id !== tenantId) {
      throw new MenuTenantMismatchError('category', data.category_id);
    }

    const sql = `
      INSERT INTO menu_items (
        tenant_id, category_id, name, description, price, 
        image_url, is_available, sort_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const params = [
      tenantId,
      data.category_id,
      data.name.trim(),
      data.description?.trim() || null,
      data.price,
      data.image_url?.trim() || null,
      data.is_available ?? true,
      data.sort_order ?? 0
    ];

    const row = await tenantQueryOne<MenuItemRow>(tenantId, sql, params);
    
    if (!row) {
      throw new MenuDatabaseError('create', new Error('Failed to create menu item'));
    }

    return mapRowToMenuItem(row);
  } catch (error) {
    if (error instanceof MenuValidationError || 
        error instanceof MenuNotFoundError ||
        error instanceof MenuTenantMismatchError) {
      throw error;
    }
    
    console.error('Failed to create menu item:', error);
    throw new MenuDatabaseError('create', error as Error);
  }
}

/**
 * Get menu items for a tenant
 */
export async function getMenuItems(
  tenantId: string,
  categoryId?: string,
  filters: MenuItemFilters = {}
): Promise<MenuItem[]> {
  try {
    validateTenantId(tenantId);

    let sql = `
      SELECT *
      FROM menu_items
      WHERE tenant_id = $1
    `;

    const params: any[] = [tenantId];

    // Add category filter if provided
    if (categoryId) {
      sql += ` AND category_id = $${params.length + 1}`;
      params.push(categoryId);
    }

    // Apply additional filters
    if (filters.is_available !== undefined) {
      sql += ` AND is_available = $${params.length + 1}`;
      params.push(filters.is_available);
    }

    if (filters.price_min !== undefined) {
      sql += ` AND price >= $${params.length + 1}`;
      params.push(filters.price_min);
    }

    if (filters.price_max !== undefined) {
      sql += ` AND price <= $${params.length + 1}`;
      params.push(filters.price_max);
    }

    // Add ordering
    const sortField = filters.sort_by || 'sort_order';
    const sortOrder = filters.sort_order === 'DESC' ? 'DESC' : 'ASC';
    sql += ` ORDER BY ${sortField} ${sortOrder}`;
    
    if (sortField !== 'name') {
      sql += ', name ASC';
    }

    const rows = await tenantQueryMany<MenuItemRow>(tenantId, sql, params);
    
    return rows.map(mapRowToMenuItem);
  } catch (error) {
    if (error instanceof MenuValidationError) {
      throw error;
    }
    
    console.error('Failed to get menu items:', error);
    throw new MenuDatabaseError('get', error as Error);
  }
}

/**
 * Get a single menu item by ID
 */
export async function getMenuItemById(
  tenantId: string,
  itemId: string
): Promise<MenuItem | null> {
  try {
    validateTenantId(tenantId);

    if (!itemId) {
      throw new MenuValidationError('item_id', 'Menu item ID is required');
    }

    const sql = `
      SELECT *
      FROM menu_items
      WHERE id = $1 AND tenant_id = $2
    `;

    const row = await tenantQueryOne<MenuItemRow>(tenantId, sql, [itemId, tenantId]);
    
    return row ? mapRowToMenuItem(row) : null;
  } catch (error) {
    if (error instanceof MenuValidationError) {
      throw error;
    }
    
    console.error('Failed to get menu item:', error);
    throw new MenuDatabaseError('get', error as Error);
  }
}

/**
 * Update a menu item
 */
export async function updateMenuItem(
  tenantId: string,
  itemId: string,
  data: Partial<MenuItemData>
): Promise<MenuItem> {
  try {
    validateTenantId(tenantId);
    
    if (!itemId) {
      throw new MenuValidationError('item_id', 'Menu item ID is required');
    }

    // Validate update data
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new MenuValidationError('name', 'Menu item name cannot be empty');
      }
      if (data.name.length > 255) {
        throw new MenuValidationError('name', 'Menu item name too long');
      }
    }

    if (data.price !== undefined && (data.price < 0 || data.price > 999999.99)) {
      throw new MenuValidationError('price', 'Price must be between 0 and 999999.99');
    }

    if (data.description !== undefined && data.description && data.description.length > 2000) {
      throw new MenuValidationError('description', 'Description too long');
    }

    if (data.image_url !== undefined && data.image_url && data.image_url.length > 500) {
      throw new MenuValidationError('image_url', 'Image URL too long');
    }

    // Verify item exists and belongs to tenant
    const existing = await getMenuItemById(tenantId, itemId);
    if (!existing) {
      throw new MenuNotFoundError('menu_item', itemId);
    }

    if (existing.tenant_id !== tenantId) {
      throw new MenuTenantMismatchError('menu_item', itemId);
    }

    // If category is being changed, verify the new category exists
    if (data.category_id && data.category_id !== existing.category_id) {
      const category = await getCategoryById(tenantId, data.category_id);
      if (!category) {
        throw new MenuNotFoundError('category', data.category_id);
      }
      if (category.tenant_id !== tenantId) {
        throw new MenuTenantMismatchError('category', data.category_id);
      }
    }

    // Build update query
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.category_id !== undefined) {
      updateFields.push(`category_id = $${paramIndex++}`);
      params.push(data.category_id);
    }

    if (data.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      params.push(data.name.trim());
    }

    if (data.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      params.push(data.description ? data.description.trim() : null);
    }

    if (data.price !== undefined) {
      updateFields.push(`price = $${paramIndex++}`);
      params.push(data.price);
    }

    if (data.image_url !== undefined) {
      updateFields.push(`image_url = $${paramIndex++}`);
      params.push(data.image_url ? data.image_url.trim() : null);
    }

    if (data.is_available !== undefined) {
      updateFields.push(`is_available = $${paramIndex++}`);
      params.push(data.is_available);
    }

    if (data.sort_order !== undefined) {
      updateFields.push(`sort_order = $${paramIndex++}`);
      params.push(data.sort_order);
    }

    if (updateFields.length === 0) {
      return existing; // No changes
    }

    // Add WHERE clause parameters
    params.push(itemId);
    const whereClause = `WHERE id = $${paramIndex}`;

    const sql = `
      UPDATE menu_items
      SET ${updateFields.join(', ')}
      ${whereClause}
      RETURNING *
    `;

    const row = await tenantQueryOne<MenuItemRow>(tenantId, sql, params);
    
    if (!row) {
      throw new MenuDatabaseError('update', new Error('Failed to update menu item'));
    }

    return mapRowToMenuItem(row);
  } catch (error) {
    if (error instanceof MenuValidationError || 
        error instanceof MenuNotFoundError || 
        error instanceof MenuTenantMismatchError) {
      throw error;
    }
    
    console.error('Failed to update menu item:', error);
    throw new MenuDatabaseError('update', error as Error);
  }
}

/**
 * Delete a menu item
 */
export async function deleteMenuItem(
  tenantId: string,
  itemId: string
): Promise<void> {
  try {
    validateTenantId(tenantId);

    if (!itemId) {
      throw new MenuValidationError('item_id', 'Menu item ID is required');
    }

    // Verify item exists and belongs to tenant
    const existing = await getMenuItemById(tenantId, itemId);
    if (!existing) {
      throw new MenuNotFoundError('menu_item', itemId);
    }

    if (existing.tenant_id !== tenantId) {
      throw new MenuTenantMismatchError('menu_item', itemId);
    }

    // Delete the menu item
    const sql = `
      DELETE FROM menu_items
      WHERE id = $1 AND tenant_id = $2
    `;

    const result = await tenantQuery(tenantId, sql, [itemId, tenantId]);
    
    if (!result.rowCount || result.rowCount === 0) {
      throw new MenuDatabaseError('delete', new Error('Failed to delete menu item'));
    }
  } catch (error) {
    if (error instanceof MenuValidationError || 
        error instanceof MenuNotFoundError || 
        error instanceof MenuTenantMismatchError) {
      throw error;
    }
    
    console.error('Failed to delete menu item:', error);
    throw new MenuDatabaseError('delete', error as Error);
  }
}

/**
 * Get menu item with category information
 */
export async function getMenuItemWithCategory(
  tenantId: string,
  itemId: string
): Promise<MenuItemWithCategory | null> {
  try {
    validateTenantId(tenantId);

    const sql = `
      SELECT 
        mi.*,
        mc.name as category_name,
        mc.is_active as category_is_active
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mi.id = $1 AND mi.tenant_id = $2
    `;

    const row = await tenantQueryOne<MenuItemRow & { 
      category_name: string;
      category_is_active: boolean;
    }>(tenantId, sql, [itemId, tenantId]);
    
    if (!row) {
      return null;
    }

    return {
      ...mapRowToMenuItem(row),
      category_name: row.category_name,
      category_is_active: row.category_is_active
    };
  } catch (error) {
    console.error('Failed to get menu item with category:', error);
    throw new MenuDatabaseError('get', error as Error);
  }
}

// =====================================================================================
// SEARCH OPERATIONS
// =====================================================================================

/**
 * Search menu items using full-text search
 */
export async function searchMenuItems(
  tenantId: string,
  query: string,
  options: SearchOptions = {}
): Promise<MenuItem[]> {
  try {
    validateTenantId(tenantId);

    const startTime = Date.now();
    
    // Handle empty query - return all items
    if (!query || !query.trim()) {
      return await getMenuItems(tenantId, undefined, {
        is_available: options.includeUnavailable === false ? true : undefined,
        sort_by: 'sort_order',
        sort_order: 'ASC'
      });
    }

    // Validate and sanitize search query
    const sanitizedQuery = sanitizeSearchQuery(query);
    if (!validateSearchQuery(sanitizedQuery)) {
      console.warn('Invalid search query rejected:', query);
      return [];
    }

    // Build search query and parameters
    const sql = buildFullTextSearchQuery(tenantId, sanitizedQuery, options);
    const params = buildSearchParams(tenantId, sanitizedQuery, options);

    const rows = await tenantQueryMany<MenuItemRow>(tenantId, sql, params);
    
    return rows.map(mapRowToMenuItem);
  } catch (error) {
    if (error instanceof MenuValidationError) {
      throw error;
    }
    
    console.error('Failed to search menu items:', error);
    throw new MenuDatabaseError('search', error as Error);
  }
}