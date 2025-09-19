-- Test script to validate schema syntax
-- Run this to test if the schema files are syntactically correct

-- Test 1: Create a temporary database and run the schema
BEGIN;

-- Import the schema (this tests syntax)
\i schema.sql

-- Import the indexes (this tests index syntax)  
\i indexes.sql

-- Test basic queries to ensure tables exist
SELECT COUNT(*) FROM tenants;
SELECT COUNT(*) FROM tenant_features;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM menu_categories;
SELECT COUNT(*) FROM menu_items;
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM order_items;
SELECT COUNT(*) FROM loyalty_transactions;
SELECT COUNT(*) FROM loyalty_rewards;

-- Test that search vector trigger works
INSERT INTO menu_items (tenant_id, name, description, price) 
VALUES ('123e4567-e89b-12d3-a456-426614174000', 'Test Pizza', 'Delicious test pizza with cheese', 19.99);

-- Verify search vector was created
SELECT name, search_vector FROM menu_items WHERE name = 'Test Pizza';

-- Test full-text search
SELECT name FROM menu_items WHERE search_vector @@ to_tsquery('pizza');

ROLLBACK;