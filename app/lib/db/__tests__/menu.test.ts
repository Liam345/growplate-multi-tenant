/**
 * Unit Tests for Menu Database Operations
 * 
 * Comprehensive test suite covering CRUD operations for menu categories and items,
 * including happy paths, edge cases, error scenarios, and tenant isolation.
 */

import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  createMenuItem,
  getMenuItems,
  updateMenuItem,
  deleteMenuItem,
  searchMenuItems,
  getCategoryWithItemCount,
  getMenuItemWithCategory
} from '../menu';

import * as db from '../../db';
import type { 
  Category, 
  MenuItem, 
  CategoryData, 
  MenuItemData,
  MenuValidationError,
  MenuDatabaseError,
  MenuConstraintError,
  MenuNotFoundError,
  MenuTenantMismatchError
} from '~/types/menu';

// Mock the database module
jest.mock('../../db');
const mockDb = db as jest.Mocked<typeof db>;

describe('Menu Database Operations', () => {
  const testTenantId = 'tenant-123';
  const testCategoryId = 'category-456';
  const testMenuItemId = 'item-789';
  const otherTenantId = 'other-tenant-999';

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockDb.tenantQueryOne.mockReset();
    mockDb.tenantQueryMany.mockReset();
    mockDb.tenantQuery.mockReset();
  });

  // =====================================================================================
  // CATEGORY OPERATIONS TESTS
  // =====================================================================================

  describe('createCategory', () => {
    const validCategoryData: CategoryData = {
      name: 'Appetizers',
      description: 'Delicious appetizers to start your meal',
      sort_order: 1,
      is_active: true
    };

    describe('Happy Path', () => {
      it('should create category with all fields', async () => {
        const expectedCategory: Category = {
          id: testCategoryId,
          tenant_id: testTenantId,
          ...validCategoryData,
          created_at: new Date(),
          updated_at: new Date()
        };

        mockDb.tenantQueryOne.mockResolvedValue(expectedCategory);

        const result = await createCategory(testTenantId, validCategoryData);

        expect(result).toEqual(expectedCategory);
        expect(mockDb.tenantQueryOne).toHaveBeenCalledWith(
          testTenantId,
          expect.stringContaining('INSERT INTO menu_categories'),
          [testTenantId, 'Appetizers', 'Delicious appetizers to start your meal', 1, true]
        );
      });

      it('should create category with minimal required data', async () => {
        const minimalData: CategoryData = { name: 'Desserts' };
        const expectedCategory: Category = {
          id: testCategoryId,
          tenant_id: testTenantId,
          name: 'Desserts',
          description: undefined,
          sort_order: 0,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        };

        mockDb.tenantQueryOne.mockResolvedValue(expectedCategory);

        const result = await createCategory(testTenantId, minimalData);

        expect(result).toEqual(expectedCategory);
        expect(mockDb.tenantQueryOne).toHaveBeenCalledWith(
          testTenantId,
          expect.stringContaining('INSERT INTO menu_categories'),
          [testTenantId, 'Desserts', null, 0, true]
        );
      });
    });

    describe('Edge Cases', () => {
      it('should handle unicode characters in name', async () => {
        const unicodeData: CategoryData = { name: '🍕 Pizzas & Más' };
        const expectedCategory: Category = {
          id: testCategoryId,
          tenant_id: testTenantId,
          ...unicodeData,
          description: undefined,
          sort_order: 0,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        };

        mockDb.tenantQueryOne.mockResolvedValue(expectedCategory);

        const result = await createCategory(testTenantId, unicodeData);

        expect(result).toBeDefined();
        expect(result.name).toBe('🍕 Pizzas & Más');
      });

      it('should handle maximum length fields', async () => {
        const longData: CategoryData = {
          name: 'A'.repeat(255),
          description: 'D'.repeat(1000),
          sort_order: 9999
        };

        const expectedCategory: Category = {
          id: testCategoryId,
          tenant_id: testTenantId,
          ...longData,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        };

        mockDb.tenantQueryOne.mockResolvedValue(expectedCategory);

        const result = await createCategory(testTenantId, longData);

        expect(result).toEqual(expectedCategory);
      });
    });

    describe('Error Scenarios', () => {
      it('should throw validation error for missing name', async () => {
        const invalidData = { description: 'No name' } as CategoryData;

        await expect(createCategory(testTenantId, invalidData))
          .rejects.toThrow('Category name is required');
      });

      it('should throw validation error for empty name', async () => {
        const invalidData: CategoryData = { name: '' };

        await expect(createCategory(testTenantId, invalidData))
          .rejects.toThrow('Category name cannot be empty');
      });

      it('should throw validation error for name too long', async () => {
        const invalidData: CategoryData = { name: 'A'.repeat(256) };

        await expect(createCategory(testTenantId, invalidData))
          .rejects.toThrow('Category name too long');
      });

      it('should throw validation error for invalid sort order', async () => {
        const invalidData: CategoryData = { name: 'Test', sort_order: -1 };

        await expect(createCategory(testTenantId, invalidData))
          .rejects.toThrow('Sort order must be between 0 and 9999');
      });

      it('should throw error for missing tenant ID', async () => {
        await expect(createCategory('', validCategoryData))
          .rejects.toThrow('Tenant ID is required');
      });

      it('should handle database errors', async () => {
        mockDb.tenantQueryOne.mockRejectedValue(new Error('Database connection failed'));

        await expect(createCategory(testTenantId, validCategoryData))
          .rejects.toThrow('Menu create failed: Database connection failed');
      });
    });
  });

  describe('getCategories', () => {
    const mockCategories: Category[] = [
      {
        id: 'cat-1',
        tenant_id: testTenantId,
        name: 'Appetizers',
        description: 'Start your meal',
        sort_order: 1,
        is_active: true,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01')
      },
      {
        id: 'cat-2',
        tenant_id: testTenantId,
        name: 'Main Courses',
        description: 'Main dishes',
        sort_order: 2,
        is_active: true,
        created_at: new Date('2023-01-02'),
        updated_at: new Date('2023-01-02')
      }
    ];

    describe('Happy Path', () => {
      it('should return all categories for tenant', async () => {
        mockDb.tenantQueryMany.mockResolvedValue(mockCategories);

        const result = await getCategories(testTenantId);

        expect(result).toEqual(mockCategories);
        expect(mockDb.tenantQueryMany).toHaveBeenCalledWith(
          testTenantId,
          expect.stringContaining('SELECT * FROM menu_categories'),
          [testTenantId]
        );
      });

      it('should return empty array when no categories exist', async () => {
        mockDb.tenantQueryMany.mockResolvedValue([]);

        const result = await getCategories(testTenantId);

        expect(result).toEqual([]);
      });

      it('should order categories by sort_order and name', async () => {
        const unorderedCategories = [...mockCategories].reverse();
        mockDb.tenantQueryMany.mockResolvedValue(unorderedCategories);

        const result = await getCategories(testTenantId);

        expect(mockDb.tenantQueryMany).toHaveBeenCalledWith(
          testTenantId,
          expect.stringContaining('ORDER BY sort_order ASC, name ASC'),
          [testTenantId]
        );
      });
    });

    describe('Error Scenarios', () => {
      it('should throw error for missing tenant ID', async () => {
        await expect(getCategories(''))
          .rejects.toThrow('Tenant ID is required');
      });

      it('should handle database errors', async () => {
        mockDb.tenantQueryMany.mockRejectedValue(new Error('Query failed'));

        await expect(getCategories(testTenantId))
          .rejects.toThrow('Menu get failed: Query failed');
      });
    });
  });

  describe('updateCategory', () => {
    const existingCategory: Category = {
      id: testCategoryId,
      tenant_id: testTenantId,
      name: 'Old Name',
      description: 'Old description',
      sort_order: 1,
      is_active: true,
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01')
    };

    const updateData: Partial<CategoryData> = {
      name: 'New Name',
      description: 'New description'
    };

    describe('Happy Path', () => {
      it('should update category successfully', async () => {
        const updatedCategory: Category = {
          ...existingCategory,
          ...updateData,
          updated_at: new Date()
        };

        mockDb.tenantQueryOne
          .mockResolvedValueOnce(existingCategory) // Verification query
          .mockResolvedValueOnce(updatedCategory); // Update query

        const result = await updateCategory(testTenantId, testCategoryId, updateData);

        expect(result).toEqual(updatedCategory);
        expect(mockDb.tenantQueryOne).toHaveBeenNthCalledWith(1,
          testTenantId,
          expect.stringContaining('SELECT * FROM menu_categories WHERE id = $1'),
          [testCategoryId]
        );
        expect(mockDb.tenantQueryOne).toHaveBeenNthCalledWith(2,
          testTenantId,
          expect.stringContaining('UPDATE menu_categories SET'),
          expect.arrayContaining([testCategoryId, 'New Name', 'New description'])
        );
      });

      it('should update only provided fields', async () => {
        const partialUpdate = { name: 'Only Name Changed' };
        
        mockDb.tenantQueryOne
          .mockResolvedValueOnce(existingCategory)
          .mockResolvedValueOnce({
            ...existingCategory,
            name: 'Only Name Changed',
            updated_at: new Date()
          });

        const result = await updateCategory(testTenantId, testCategoryId, partialUpdate);

        expect(result.name).toBe('Only Name Changed');
        expect(result.description).toBe(existingCategory.description); // Unchanged
      });
    });

    describe('Error Scenarios', () => {
      it('should throw error when category not found', async () => {
        mockDb.tenantQueryOne.mockResolvedValue(null);

        await expect(updateCategory(testTenantId, testCategoryId, updateData))
          .rejects.toThrow('Category not found: ' + testCategoryId);
      });

      it('should throw error when category belongs to different tenant', async () => {
        const otherTenantCategory = { ...existingCategory, tenant_id: otherTenantId };
        mockDb.tenantQueryOne.mockResolvedValue(otherTenantCategory);

        await expect(updateCategory(testTenantId, testCategoryId, updateData))
          .rejects.toThrow('Category does not belong to tenant: ' + testCategoryId);
      });

      it('should validate update data', async () => {
        const invalidUpdate: Partial<CategoryData> = { name: '' };

        await expect(updateCategory(testTenantId, testCategoryId, invalidUpdate))
          .rejects.toThrow('Category name cannot be empty');
      });

      it('should throw error for missing tenant ID', async () => {
        await expect(updateCategory('', testCategoryId, updateData))
          .rejects.toThrow('Tenant ID is required');
      });
    });
  });

  describe('deleteCategory', () => {
    const existingCategory: Category = {
      id: testCategoryId,
      tenant_id: testTenantId,
      name: 'Category to Delete',
      description: undefined,
      sort_order: 1,
      is_active: true,
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01')
    };

    describe('Happy Path', () => {
      it('should delete category with no associated menu items', async () => {
        mockDb.tenantQueryOne
          .mockResolvedValueOnce(existingCategory) // Verification query
          .mockResolvedValueOnce({ count: 0 }); // Item count check
        
        mockDb.tenantQuery.mockResolvedValue({ rowCount: 1 } as any);

        await deleteCategory(testTenantId, testCategoryId);

        expect(mockDb.tenantQuery).toHaveBeenCalledWith(
          testTenantId,
          expect.stringContaining('DELETE FROM menu_categories WHERE id = $1'),
          [testCategoryId]
        );
      });
    });

    describe('Error Scenarios', () => {
      it('should throw error when category has associated menu items', async () => {
        mockDb.tenantQueryOne
          .mockResolvedValueOnce(existingCategory)
          .mockResolvedValueOnce({ count: 3 }); // Has 3 menu items

        await expect(deleteCategory(testTenantId, testCategoryId))
          .rejects.toThrow('Cannot delete category with associated menu items');
      });

      it('should throw error when category not found', async () => {
        mockDb.tenantQueryOne.mockResolvedValue(null);

        await expect(deleteCategory(testTenantId, testCategoryId))
          .rejects.toThrow('Category not found: ' + testCategoryId);
      });

      it('should throw error when category belongs to different tenant', async () => {
        const otherTenantCategory = { ...existingCategory, tenant_id: otherTenantId };
        mockDb.tenantQueryOne.mockResolvedValue(otherTenantCategory);

        await expect(deleteCategory(testTenantId, testCategoryId))
          .rejects.toThrow('Category does not belong to tenant: ' + testCategoryId);
      });
    });
  });

  // =====================================================================================
  // MENU ITEM OPERATIONS TESTS
  // =====================================================================================

  describe('createMenuItem', () => {
    const validMenuItemData: MenuItemData = {
      category_id: testCategoryId,
      name: 'Margherita Pizza',
      description: 'Fresh mozzarella, tomato sauce, basil',
      price: 14.99,
      image_url: 'https://example.com/pizza.jpg',
      is_available: true,
      sort_order: 1
    };

    const mockCategory: Category = {
      id: testCategoryId,
      tenant_id: testTenantId,
      name: 'Pizzas',
      description: undefined,
      sort_order: 1,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    describe('Happy Path', () => {
      it('should create menu item with all fields', async () => {
        const expectedMenuItem: MenuItem = {
          id: testMenuItemId,
          tenant_id: testTenantId,
          ...validMenuItemData,
          created_at: new Date(),
          updated_at: new Date()
        };

        mockDb.tenantQueryOne
          .mockResolvedValueOnce(mockCategory) // Category verification
          .mockResolvedValueOnce(expectedMenuItem); // Insert result

        const result = await createMenuItem(testTenantId, validMenuItemData);

        expect(result).toEqual(expectedMenuItem);
        expect(mockDb.tenantQueryOne).toHaveBeenNthCalledWith(1,
          testTenantId,
          expect.stringContaining('SELECT * FROM menu_categories WHERE id = $1'),
          [testCategoryId]
        );
        expect(mockDb.tenantQueryOne).toHaveBeenNthCalledWith(2,
          testTenantId,
          expect.stringContaining('INSERT INTO menu_items'),
          expect.arrayContaining([testTenantId, testCategoryId, 'Margherita Pizza'])
        );
      });

      it('should create menu item with minimal required data', async () => {
        const minimalData: MenuItemData = {
          category_id: testCategoryId,
          name: 'Simple Item',
          price: 9.99
        };

        const expectedMenuItem: MenuItem = {
          id: testMenuItemId,
          tenant_id: testTenantId,
          category_id: testCategoryId,
          name: 'Simple Item',
          description: undefined,
          price: 9.99,
          image_url: undefined,
          is_available: true,
          sort_order: 0,
          created_at: new Date(),
          updated_at: new Date()
        };

        mockDb.tenantQueryOne
          .mockResolvedValueOnce(mockCategory)
          .mockResolvedValueOnce(expectedMenuItem);

        const result = await createMenuItem(testTenantId, minimalData);

        expect(result).toEqual(expectedMenuItem);
      });
    });

    describe('Error Scenarios', () => {
      it('should throw error when category does not exist', async () => {
        mockDb.tenantQueryOne.mockResolvedValue(null);

        await expect(createMenuItem(testTenantId, validMenuItemData))
          .rejects.toThrow('Category not found: ' + testCategoryId);
      });

      it('should throw error when category belongs to different tenant', async () => {
        const otherTenantCategory = { ...mockCategory, tenant_id: otherTenantId };
        mockDb.tenantQueryOne.mockResolvedValue(otherTenantCategory);

        await expect(createMenuItem(testTenantId, validMenuItemData))
          .rejects.toThrow('Category does not belong to tenant: ' + testCategoryId);
      });

      it('should validate required fields', async () => {
        const invalidData = { category_id: testCategoryId, price: 10 } as MenuItemData;

        await expect(createMenuItem(testTenantId, invalidData))
          .rejects.toThrow('Menu item name is required');
      });

      it('should validate price is non-negative', async () => {
        const invalidData: MenuItemData = {
          ...validMenuItemData,
          price: -5.99
        };

        await expect(createMenuItem(testTenantId, invalidData))
          .rejects.toThrow('Price must be non-negative');
      });

      it('should validate image URL length', async () => {
        const invalidData: MenuItemData = {
          ...validMenuItemData,
          image_url: 'https://' + 'x'.repeat(500) + '.jpg'
        };

        await expect(createMenuItem(testTenantId, invalidData))
          .rejects.toThrow('Image URL too long');
      });
    });
  });

  describe('getMenuItems', () => {
    const mockMenuItems: MenuItem[] = [
      {
        id: 'item-1',
        tenant_id: testTenantId,
        category_id: testCategoryId,
        name: 'Margherita Pizza',
        description: 'Classic pizza',
        price: 14.99,
        image_url: 'pizza.jpg',
        is_available: true,
        sort_order: 1,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01')
      },
      {
        id: 'item-2',
        tenant_id: testTenantId,
        category_id: testCategoryId,
        name: 'Pepperoni Pizza',
        description: 'Spicy pepperoni',
        price: 16.99,
        image_url: 'pepperoni.jpg',
        is_available: true,
        sort_order: 2,
        created_at: new Date('2023-01-02'),
        updated_at: new Date('2023-01-02')
      }
    ];

    describe('Happy Path', () => {
      it('should return all menu items for tenant', async () => {
        mockDb.tenantQueryMany.mockResolvedValue(mockMenuItems);

        const result = await getMenuItems(testTenantId);

        expect(result).toEqual(mockMenuItems);
        expect(mockDb.tenantQueryMany).toHaveBeenCalledWith(
          testTenantId,
          expect.stringContaining('SELECT * FROM menu_items'),
          [testTenantId]
        );
      });

      it('should filter by category when provided', async () => {
        const categoryItems = mockMenuItems.filter(item => item.category_id === testCategoryId);
        mockDb.tenantQueryMany.mockResolvedValue(categoryItems);

        const result = await getMenuItems(testTenantId, testCategoryId);

        expect(mockDb.tenantQueryMany).toHaveBeenCalledWith(
          testTenantId,
          expect.stringContaining('WHERE tenant_id = $1 AND category_id = $2'),
          [testTenantId, testCategoryId]
        );
      });

      it('should return empty array when no items exist', async () => {
        mockDb.tenantQueryMany.mockResolvedValue([]);

        const result = await getMenuItems(testTenantId);

        expect(result).toEqual([]);
      });
    });

    describe('Error Scenarios', () => {
      it('should throw error for missing tenant ID', async () => {
        await expect(getMenuItems(''))
          .rejects.toThrow('Tenant ID is required');
      });
    });
  });

  describe('searchMenuItems', () => {
    const mockSearchResults: MenuItem[] = [
      {
        id: 'item-1',
        tenant_id: testTenantId,
        category_id: testCategoryId,
        name: 'Margherita Pizza',
        description: 'Classic Italian pizza with fresh basil',
        price: 14.99,
        image_url: undefined,
        is_available: true,
        sort_order: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    describe('Happy Path', () => {
      it('should search menu items by name and description', async () => {
        mockDb.tenantQueryMany.mockResolvedValue(mockSearchResults);

        const result = await searchMenuItems(testTenantId, 'pizza');

        expect(result).toEqual(mockSearchResults);
        expect(mockDb.tenantQueryMany).toHaveBeenCalledWith(
          testTenantId,
          expect.stringContaining('WHERE search_vector @@ plainto_tsquery'),
          expect.arrayContaining([testTenantId, 'pizza'])
        );
      });

      it('should order results by relevance', async () => {
        mockDb.tenantQueryMany.mockResolvedValue(mockSearchResults);

        await searchMenuItems(testTenantId, 'margherita');

        expect(mockDb.tenantQueryMany).toHaveBeenCalledWith(
          testTenantId,
          expect.stringContaining('ORDER BY ts_rank(search_vector, plainto_tsquery'),
          expect.any(Array)
        );
      });

      it('should return empty results for no matches', async () => {
        mockDb.tenantQueryMany.mockResolvedValue([]);

        const result = await searchMenuItems(testTenantId, 'nonexistent');

        expect(result).toEqual([]);
      });

      it('should handle empty search query by returning all items', async () => {
        mockDb.tenantQueryMany.mockResolvedValue(mockSearchResults);

        const result = await searchMenuItems(testTenantId, '');

        expect(mockDb.tenantQueryMany).toHaveBeenCalledWith(
          testTenantId,
          expect.stringContaining('SELECT * FROM menu_items WHERE tenant_id = $1'),
          [testTenantId]
        );
      });
    });

    describe('Error Scenarios', () => {
      it('should throw error for missing tenant ID', async () => {
        await expect(searchMenuItems('', 'pizza'))
          .rejects.toThrow('Tenant ID is required');
      });

      it('should sanitize special characters in search query', async () => {
        mockDb.tenantQueryMany.mockResolvedValue([]);

        await searchMenuItems(testTenantId, "'; DROP TABLE menu_items; --");

        // Should call with sanitized query, not the malicious one
        expect(mockDb.tenantQueryMany).toHaveBeenCalledWith(
          testTenantId,
          expect.any(String),
          expect.arrayContaining([testTenantId, 'DROP TABLE menu_items'])
        );
      });
    });
  });

  // =====================================================================================
  // TENANT ISOLATION TESTS
  // =====================================================================================

  describe('Tenant Isolation', () => {
    it('should not return other tenant categories', async () => {
      // Mock that only returns categories for the correct tenant
      mockDb.tenantQueryMany.mockImplementation(async (tenantId) => {
        if (tenantId === testTenantId) {
          return [{ id: 'cat-1', tenant_id: testTenantId, name: 'My Category' }];
        }
        return [];
      });

      const myResult = await getCategories(testTenantId);
      const otherResult = await getCategories(otherTenantId);

      expect(myResult).toHaveLength(1);
      expect(otherResult).toHaveLength(0);
    });

    it('should not return other tenant menu items', async () => {
      mockDb.tenantQueryMany.mockImplementation(async (tenantId) => {
        if (tenantId === testTenantId) {
          return [{ id: 'item-1', tenant_id: testTenantId, name: 'My Item' }];
        }
        return [];
      });

      const myResult = await getMenuItems(testTenantId);
      const otherResult = await getMenuItems(otherTenantId);

      expect(myResult).toHaveLength(1);
      expect(otherResult).toHaveLength(0);
    });

    it('should not find other tenant items in search', async () => {
      mockDb.tenantQueryMany.mockImplementation(async (tenantId) => {
        if (tenantId === testTenantId) {
          return [{ id: 'item-1', tenant_id: testTenantId, name: 'Pizza' }];
        }
        return [];
      });

      const myResult = await searchMenuItems(testTenantId, 'pizza');
      const otherResult = await searchMenuItems(otherTenantId, 'pizza');

      expect(myResult).toHaveLength(1);
      expect(otherResult).toHaveLength(0);
    });
  });
});