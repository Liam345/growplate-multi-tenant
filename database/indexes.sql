-- GrowPlate Multi-Tenant Restaurant Management Platform
-- Performance Indexes and Constraints
--
-- This file contains strategic indexes for optimizing query performance
-- in a multi-tenant environment with proper tenant isolation

-- =====================================================================================
-- TENANT ISOLATION INDEXES
-- =====================================================================================

-- Critical tenant-based indexes for multi-tenant row-level security
CREATE INDEX idx_tenant_features_tenant_id ON tenant_features(tenant_id);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_menu_categories_tenant_id ON menu_categories(tenant_id);
CREATE INDEX idx_menu_items_tenant_id ON menu_items(tenant_id);
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_loyalty_transactions_tenant_id ON loyalty_transactions(tenant_id);
CREATE INDEX idx_loyalty_rewards_tenant_id ON loyalty_rewards(tenant_id);

-- =====================================================================================
-- DOMAIN AND AUTHENTICATION INDEXES
-- =====================================================================================

-- Domain lookup for tenant resolution (critical for multi-tenant routing)
CREATE INDEX idx_tenants_domain ON tenants(domain);
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain) WHERE subdomain IS NOT NULL;

-- User authentication and lookup indexes
CREATE INDEX idx_users_email_tenant ON users(tenant_id, email);
CREATE INDEX idx_users_role_tenant ON users(tenant_id, role);

-- =====================================================================================
-- MENU AND SEARCH INDEXES
-- =====================================================================================

-- Full-text search index for menu items (already created in schema, but referenced here)
-- CREATE INDEX idx_menu_items_search ON menu_items USING gin(search_vector);

-- Menu category and item relationship indexes
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_tenant_category ON menu_items(tenant_id, category_id);

-- Menu availability and sorting indexes
CREATE INDEX idx_menu_items_available ON menu_items(tenant_id, is_available, sort_order);
CREATE INDEX idx_menu_categories_active ON menu_categories(tenant_id, is_active, sort_order);

-- Price range queries
CREATE INDEX idx_menu_items_price ON menu_items(tenant_id, price) WHERE is_available = true;

-- =====================================================================================
-- ORDER MANAGEMENT INDEXES
-- =====================================================================================

-- Order lookup and status tracking indexes
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, status);
CREATE INDEX idx_orders_tenant_created ON orders(tenant_id, created_at DESC);
CREATE INDEX idx_orders_number_tenant ON orders(tenant_id, order_number);

-- Payment tracking indexes
CREATE INDEX idx_orders_payment_status ON orders(tenant_id, payment_status);
CREATE INDEX idx_orders_stripe_intent ON orders(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- Order timing and analytics indexes
CREATE INDEX idx_orders_ready_time ON orders(estimated_ready_time) WHERE estimated_ready_time IS NOT NULL;
CREATE INDEX idx_orders_date_range ON orders(tenant_id, created_at, status);

-- Order items relationship indexes
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item ON order_items(menu_item_id);

-- =====================================================================================
-- LOYALTY SYSTEM INDEXES
-- =====================================================================================

-- Customer loyalty tracking indexes
CREATE INDEX idx_loyalty_transactions_customer ON loyalty_transactions(tenant_id, customer_id);
CREATE INDEX idx_loyalty_transactions_order ON loyalty_transactions(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_loyalty_transactions_type ON loyalty_transactions(tenant_id, transaction_type, created_at DESC);

-- Loyalty rewards lookup indexes
CREATE INDEX idx_loyalty_rewards_active ON loyalty_rewards(tenant_id, is_active, points_required);
CREATE INDEX idx_loyalty_rewards_points ON loyalty_rewards(tenant_id, points_required) WHERE is_active = true;

-- =====================================================================================
-- ANALYTICS AND REPORTING INDEXES
-- =====================================================================================

-- Time-based analytics indexes (simplified for compatibility)
-- Note: These are optimized for time-range queries rather than exact date grouping
CREATE INDEX idx_orders_analytics_time ON orders(tenant_id, created_at, status);
-- For daily/monthly analytics, queries will use created_at with date range filters

-- Revenue tracking indexes  
CREATE INDEX idx_orders_revenue ON orders(tenant_id, created_at, total_amount) WHERE payment_status = 'paid';

-- Popular items analytics
CREATE INDEX idx_order_items_analytics ON order_items(menu_item_id, quantity, created_at);

-- Customer analytics indexes
CREATE INDEX idx_users_loyalty_points ON users(tenant_id, loyalty_points DESC) WHERE role = 'customer';
CREATE INDEX idx_users_signup_date ON users(tenant_id, created_at DESC) WHERE role = 'customer';

-- =====================================================================================
-- FEATURE FLAG INDEXES
-- =====================================================================================

-- Feature flag lookup optimization
CREATE INDEX idx_tenant_features_lookup ON tenant_features(tenant_id, feature_name, enabled);

-- =====================================================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- =====================================================================================

-- Menu browsing (tenant + category + availability + sort)
CREATE INDEX idx_menu_items_browse ON menu_items(tenant_id, category_id, is_available, sort_order);

-- Order dashboard (tenant + status + created time)
CREATE INDEX idx_orders_dashboard ON orders(tenant_id, status, created_at DESC);

-- Customer order history (customer + tenant + created time)
CREATE INDEX idx_orders_customer_history ON orders(customer_id, tenant_id, created_at DESC);

-- Active menu categories with item count optimization
CREATE INDEX idx_menu_categories_with_items ON menu_categories(tenant_id, is_active, sort_order);

-- Loyalty transaction history (customer + tenant + transaction time)
CREATE INDEX idx_loyalty_history ON loyalty_transactions(customer_id, tenant_id, created_at DESC);

-- =====================================================================================
-- PARTIAL INDEXES FOR EFFICIENCY
-- =====================================================================================

-- Active records only (saves space and improves performance)
CREATE INDEX idx_menu_items_active_only ON menu_items(tenant_id, category_id, sort_order) 
    WHERE is_available = true;

CREATE INDEX idx_menu_categories_active_only ON menu_categories(tenant_id, sort_order) 
    WHERE is_active = true;

CREATE INDEX idx_loyalty_rewards_active_only ON loyalty_rewards(tenant_id, points_required) 
    WHERE is_active = true;

-- Pending/active orders only
CREATE INDEX idx_orders_active_only ON orders(tenant_id, created_at DESC) 
    WHERE status IN ('pending', 'confirmed', 'preparing', 'ready');

-- =====================================================================================
-- UNIQUE CONSTRAINTS (Additional Business Rules)
-- =====================================================================================

-- Ensure order numbers are unique per tenant (already in schema, but documented here)
-- UNIQUE(tenant_id, order_number) - defined in schema

-- Ensure email uniqueness per tenant (already in schema, but documented here)  
-- UNIQUE(tenant_id, email) - defined in schema

-- Ensure feature names are unique per tenant (already in schema, but documented here)
-- UNIQUE(tenant_id, feature_name) - defined in schema

-- =====================================================================================
-- INDEX MAINTENANCE NOTES
-- =====================================================================================

-- These indexes are designed for:
-- 1. Multi-tenant isolation (tenant_id in most indexes)
-- 2. Common query patterns (dashboard, menu browsing, order tracking)
-- 3. Search performance (full-text search, filtering)
-- 4. Analytics queries (time-based, revenue, popular items)
-- 5. Authentication and authorization (user lookup, role-based)
--
-- Monitor query performance and adjust indexes based on actual usage patterns
-- Consider EXPLAIN ANALYZE for slow queries and add indexes as needed
-- Regularly VACUUM and ANALYZE tables for optimal performance