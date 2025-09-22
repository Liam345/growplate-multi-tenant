-- GrowPlate Multi-Tenant Restaurant Management Platform
-- Row-Level Security (RLS) Policies for Tenant Isolation
--
-- This file creates RLS policies to enforce tenant data isolation at the database level.
-- Run this after schema.sql to enable secure multi-tenant queries.

-- =====================================================================================
-- ENABLE ROW-LEVEL SECURITY ON ALL MULTI-TENANT TABLES
-- =====================================================================================

-- Enable RLS on all tables with tenant_id
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- =====================================================================================
-- CREATE RLS POLICIES FOR TENANT ISOLATION
-- =====================================================================================

-- Tenants table: Users can only access their own tenant record
CREATE POLICY tenant_isolation_policy ON tenants
  FOR ALL TO PUBLIC
  USING (id = current_setting('app.tenant_id', true)::uuid);

-- Tenant features: Only accessible by the owning tenant
CREATE POLICY tenant_isolation_policy ON tenant_features
  FOR ALL TO PUBLIC  
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Users: Only accessible within the same tenant
CREATE POLICY tenant_isolation_policy ON users
  FOR ALL TO PUBLIC
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Menu categories: Only accessible within the same tenant
CREATE POLICY tenant_isolation_policy ON menu_categories
  FOR ALL TO PUBLIC
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Menu items: Only accessible within the same tenant
CREATE POLICY tenant_isolation_policy ON menu_items
  FOR ALL TO PUBLIC
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Orders: Only accessible within the same tenant
CREATE POLICY tenant_isolation_policy ON orders
  FOR ALL TO PUBLIC
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Order items: Accessible if the associated order belongs to the tenant
CREATE POLICY tenant_isolation_policy ON order_items
  FOR ALL TO PUBLIC
  USING (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.tenant_id = current_setting('app.tenant_id', true)::uuid
  ));

-- Loyalty transactions: Only accessible within the same tenant
CREATE POLICY tenant_isolation_policy ON loyalty_transactions
  FOR ALL TO PUBLIC
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Loyalty rewards: Only accessible within the same tenant
CREATE POLICY tenant_isolation_policy ON loyalty_rewards
  FOR ALL TO PUBLIC
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================================================
-- UTILITY FUNCTIONS FOR RLS
-- =====================================================================================

-- Function to get current tenant ID (useful for debugging)
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS uuid AS $$
BEGIN
  RETURN current_setting('app.tenant_id', true)::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if RLS is properly configured
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE(table_name text, rls_enabled boolean, policies_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::text,
    t.rowsecurity,
    COUNT(p.policyname)
  FROM pg_tables t
  LEFT JOIN pg_policies p ON t.tablename = p.tablename
  WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'tenants', 'tenant_features', 'users', 'menu_categories', 
    'menu_items', 'orders', 'order_items', 'loyalty_transactions', 'loyalty_rewards'
  )
  GROUP BY t.tablename, t.rowsecurity
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================================
-- VERIFICATION QUERIES
-- =====================================================================================

-- Check RLS status on all tables
SELECT * FROM check_rls_status();

-- Example: Test RLS by setting a tenant and querying
-- SET LOCAL "app.tenant_id" = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
-- SELECT * FROM users; -- Should only return users for this tenant

-- =====================================================================================
-- USAGE NOTES
-- =====================================================================================

-- 1. Application code must call: SET LOCAL "app.tenant_id" = '<tenant-uuid>';
--    before executing any queries within a transaction
--
-- 2. The tenantQuery() function in app/lib/db.ts handles this automatically
--
-- 3. To test RLS manually:
--    BEGIN;
--    SET LOCAL "app.tenant_id" = 'your-tenant-id-here';
--    SELECT * FROM users; -- Only shows users for this tenant
--    ROLLBACK;
--
-- 4. To bypass RLS (for superuser maintenance):
--    SET row_security = off; -- Use with extreme caution!
--
-- 5. Monitor RLS performance with EXPLAIN ANALYZE on queries