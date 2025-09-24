# TASK-09: Menu Database Operations - Plan Breakdown

## Task Overview
**Task ID**: TASK-009  
**Phase**: Phase 2 - Menu Management  
**Complexity**: Medium  
**Estimated Time**: 60 minutes  
**Dependencies**: TASK-003 (Database Connection Setup)

## Description
Create database operations for menu categories and items with full-text search functionality. This task establishes the data layer for menu management including CRUD operations, tenant-scoped queries, and PostgreSQL full-text search implementation.

## Scope Definition

### In Scope for Task-09
✅ **Database Operations for Menu Categories**:
- Create category with tenant isolation
- Get categories for a tenant (with sorting)
- Update category details
- Delete category (with constraint handling)

✅ **Database Operations for Menu Items**:
- Create menu item with category association
- Get menu items (all or filtered by category)
- Update menu item details
- Delete menu item
- Handle image URL storage

✅ **Full-Text Search Implementation**:
- PostgreSQL search vector setup
- Search function for menu items
- Proper indexing for performance
- Search relevance ranking

✅ **Tenant Security**:
- All queries must be tenant-scoped
- Proper error handling for tenant isolation
- Input validation and sanitization

### Out of Scope for Task-09
❌ **API Layer**: REST endpoints (covered in TASK-010)
❌ **Frontend Components**: UI for menu management (covered in TASK-011, TASK-012)
❌ **Image Upload Logic**: File handling (covered in TASK-012)
❌ **Authentication**: JWT handling (already done in TASK-006)
❌ **Database Schema**: Table creation (covered in TASK-002)

## Technical Requirements

### Database Schema Assumptions
This task assumes the following tables exist (from TASK-002):
- `tenants` table with proper structure
- `menu_categories` table with tenant_id, name, description, sort_order, is_active
- `menu_items` table with tenant_id, category_id, name, description, price, image_url, is_available, sort_order, search_vector

### Core Functions to Implement

#### Menu Categories
```typescript
// Create category
createCategory(tenantId: string, data: CategoryData): Promise<Category>

// Get all categories for tenant
getCategories(tenantId: string): Promise<Category[]>

// Update category
updateCategory(tenantId: string, id: string, data: Partial<CategoryData>): Promise<Category>

// Delete category
deleteCategory(tenantId: string, id: string): Promise<void>
```

#### Menu Items
```typescript
// Create menu item
createMenuItem(tenantId: string, data: MenuItemData): Promise<MenuItem>

// Get menu items (optionally filtered by category)
getMenuItems(tenantId: string, categoryId?: string): Promise<MenuItem[]>

// Update menu item
updateMenuItem(tenantId: string, id: string, data: Partial<MenuItemData>): Promise<MenuItem>

// Delete menu item
deleteMenuItem(tenantId: string, id: string): Promise<void>

// Search menu items
searchMenuItems(tenantId: string, query: string): Promise<MenuItem[]>
```

### Full-Text Search Requirements
- Use PostgreSQL `tsvector` and `tsquery` for search
- Update search_vector when menu items are created/updated
- Search across name and description fields
- Return results ordered by relevance
- Support partial word matching

### TypeScript Interfaces
```typescript
interface CategoryData {
  name: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

interface Category extends CategoryData {
  id: string;
  tenant_id: string;
  created_at: Date;
}

interface MenuItemData {
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available?: boolean;
  sort_order?: number;
}

interface MenuItem extends MenuItemData {
  id: string;
  tenant_id: string;
  created_at: Date;
  updated_at: Date;
}
```

## Implementation Steps

### Step 1: Setup Base Database Module (15 min)
- Create `src/lib/db/menu.ts` file
- Import database connection from existing setup
- Setup basic TypeScript interfaces
- Add proper error handling patterns

### Step 2: Implement Category Operations (20 min)
- `createCategory()`: Insert with tenant_id and validation
- `getCategories()`: Select with tenant filter and sorting
- `updateCategory()`: Update with tenant verification
- `deleteCategory()`: Delete with constraint checks

### Step 3: Implement Menu Item Operations (20 min)
- `createMenuItem()`: Insert with search vector generation
- `getMenuItems()`: Select with optional category filter
- `updateMenuItem()`: Update with search vector refresh
- `deleteMenuItem()`: Delete with tenant verification

### Step 4: Implement Full-Text Search (5 min)
- `searchMenuItems()`: PostgreSQL full-text search query
- Setup search vector generation utility
- Handle search relevance ranking

## Acceptance Criteria

### Functional Requirements
- ✅ All CRUD operations work correctly for categories and items
- ✅ Every database query includes proper tenant filtering
- ✅ Full-text search returns relevant results ordered by relevance
- ✅ Search vector is automatically updated when items change
- ✅ Proper error handling for database constraints and failures

### Technical Requirements
- ✅ All functions are properly typed with TypeScript
- ✅ Database operations use parameterized queries (no SQL injection)
- ✅ Proper error handling with meaningful error messages
- ✅ Functions return appropriate data structures
- ✅ Code follows existing project patterns and conventions

### Data Integrity
- ✅ Category deletion checks for associated menu items
- ✅ Menu item operations verify category exists
- ✅ All operations maintain referential integrity
- ✅ Tenant isolation is enforced at the database level

## Testing Considerations
- Test all CRUD operations with valid data
- Test tenant isolation (queries should not return other tenants' data)
- Test search functionality with various queries
- Test error handling for invalid inputs
- Test constraint violations (e.g., deleting category with items)

## Files to Create
```
src/lib/db/menu.ts          # Main database operations
src/lib/search.ts           # Full-text search utilities  
src/types/menu.ts           # TypeScript interfaces (if not in database.ts)
```

## Dependencies
- **Requires**: TASK-003 (Database Connection Setup) - needs working database connection
- **Enables**: TASK-010 (Menu Management API) - provides data layer for API
- **Enables**: TASK-011 (Menu Category Management UI) - provides data operations

## Risk Mitigation
- **SQL Injection**: Use parameterized queries exclusively
- **Performance**: Ensure proper indexing on tenant_id and search vectors
- **Data Integrity**: Implement proper constraint checking
- **Error Handling**: Provide clear error messages for debugging

## Success Metrics
- All database operations execute without errors
- Search functionality returns relevant results
- Tenant isolation is maintained across all operations
- Code passes TypeScript compilation
- Functions integrate properly with existing database connection