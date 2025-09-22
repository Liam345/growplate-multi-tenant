-- GrowPlate Multi-Tenant Restaurant Management Platform
-- Sample Seed Data for Testing and Development
--
-- This file contains sample data for testing the multi-tenant functionality
-- Run this after schema.sql and indexes.sql

-- =====================================================================================
-- SAMPLE TENANTS
-- =====================================================================================

INSERT INTO tenants (id, name, domain, subdomain, email, phone, address, settings) VALUES 
(
    'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    'Pizza Palace',
    'pizza-palace.com',
    'pizza-palace',
    'owner@pizza-palace.com',
    '+1-555-0101',
    '{"street": "123 Main St", "city": "New York", "state": "NY", "zipCode": "10001", "country": "USA"}',
    '{"timezone": "America/New_York", "currency": "USD", "tax_rate": 8.25}'
),
(
    'b2c3d4e5-a6b7-8901-2345-678901bcdefb',
    'Burger Spot',
    'burger-spot.com', 
    'burger-spot',
    'manager@burger-spot.com',
    '+1-555-0202',
    '{"street": "456 Oak Ave", "city": "Los Angeles", "state": "CA", "zipCode": "90210", "country": "USA"}',
    '{"timezone": "America/Los_Angeles", "currency": "USD", "tax_rate": 9.5}'
),
(
    'c3d4e5f6-a7b8-9012-3456-789012cdefcb',
    'Sushi Garden',
    'sushi-garden.com',
    'sushi-garden', 
    'chef@sushi-garden.com',
    '+1-555-0303',
    '{"street": "789 Pine Blvd", "city": "Seattle", "state": "WA", "zipCode": "98101", "country": "USA"}',
    '{"timezone": "America/Los_Angeles", "currency": "USD", "tax_rate": 10.1}'
);

-- =====================================================================================
-- FEATURE FLAGS FOR TENANTS
-- =====================================================================================

-- Pizza Palace: All features enabled
INSERT INTO tenant_features (tenant_id, feature_name, enabled) VALUES
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'menu', true),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'orders', true),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'loyalty', true);

-- Burger Spot: Menu and Orders only
INSERT INTO tenant_features (tenant_id, feature_name, enabled) VALUES
('b2c3d4e5-a6b7-8901-2345-678901bcdefb', 'menu', true),
('b2c3d4e5-a6b7-8901-2345-678901bcdefb', 'orders', true),
('b2c3d4e5-a6b7-8901-2345-678901bcdefb', 'loyalty', false);

-- Sushi Garden: Menu only (just starting)
INSERT INTO tenant_features (tenant_id, feature_name, enabled) VALUES
('c3d4e5f6-a7b8-9012-3456-789012cdefcb', 'menu', true),
('c3d4e5f6-a7b8-9012-3456-789012cdefcb', 'orders', false),
('c3d4e5f6-a7b8-9012-3456-789012cdefcb', 'loyalty', false);

-- =====================================================================================
-- SAMPLE USERS
-- =====================================================================================

-- Pizza Palace Users
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, phone, loyalty_points) VALUES
-- Owner
('f1a1b1c1-d1e1-a1b1-c1d1-e1f1a1b1c1d1', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'owner@pizza-palace.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYFH8z1.S7P3.se', 'Mario', 'Rossi', 'owner', '+1-555-0111', 0),
-- Staff
('f2a2b2c2-d2e2-a2b2-c2d2-e2f2a2b2c2d2', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'staff@pizza-palace.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYFH8z1.S7P3.se', 'Tony', 'Soprano', 'staff', '+1-555-0112', 0),
-- Customers
('f3a3b3c3-d3e3-a3b3-c3d3-e3f3a3b3c3d3', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'john@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYFH8z1.S7P3.se', 'John', 'Doe', 'customer', '+1-555-0113', 150),
('f4a4b4c4-d4e4-a4b4-c4d4-e4f4a4b4c4d4', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'jane@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYFH8z1.S7P3.se', 'Jane', 'Smith', 'customer', '+1-555-0114', 250);

-- Burger Spot Users  
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, phone, loyalty_points) VALUES
-- Owner
('f5b5c5d5-e5f5-a5b5-c5d5-e5f5a5b5c5d5', 'b2c3d4e5-a6b7-8901-2345-678901bcdefb', 'manager@burger-spot.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYFH8z1.S7P3.se', 'Bob', 'Johnson', 'owner', '+1-555-0221', 0),
-- Customer
('f6b6c6d6-e6f6-a6b6-c6d6-e6f6a6b6c6d6', 'b2c3d4e5-a6b7-8901-2345-678901bcdefb', 'customer@burger-spot.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYFH8z1.S7P3.se', 'Alice', 'Wilson', 'customer', '+1-555-0222', 0);

-- Sushi Garden Users
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, phone, loyalty_points) VALUES
-- Owner
('f7c7d7e7-a7b7-c7d7-e7f7-a7b7c7d7e7f7', 'c3d4e5f6-a7b8-9012-3456-789012cdefcb', 'chef@sushi-garden.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYFH8z1.S7P3.se', 'Akira', 'Tanaka', 'owner', '+1-555-0331', 0);

-- =====================================================================================
-- SAMPLE MENU DATA
-- =====================================================================================

-- Pizza Palace Menu Categories
INSERT INTO menu_categories (id, tenant_id, name, description, sort_order, is_active) VALUES
('ca1a1b1c-1d1e-1a1b-1c1d-1e1a1b1c1d1e', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Appetizers', 'Start your meal with these delicious appetizers', 1, true),
('ca2a2b2c-2d2e-2a2b-2c2d-2e2a2b2c2d2e', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Pizzas', 'Our signature wood-fired pizzas', 2, true),
('ca3a3b3c-3d3e-3a3b-3c3d-3e3a3b3c3d3e', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Beverages', 'Refresh yourself with our drink selection', 3, true);

-- Burger Spot Menu Categories
INSERT INTO menu_categories (id, tenant_id, name, description, sort_order, is_active) VALUES
('cb4b4c4d-4e4a-4b4c-4d4e-4a4b4c4d4e4a', 'b2c3d4e5-a6b7-8901-2345-678901bcdefb', 'Burgers', 'Juicy burgers made with premium beef', 1, true),
('cb5b5c5d-5e5a-5b5c-5d5e-5a5b5c5d5e5a', 'b2c3d4e5-a6b7-8901-2345-678901bcdefb', 'Sides', 'Perfect sides to complete your meal', 2, true);

-- Pizza Palace Menu Items
INSERT INTO menu_items (id, tenant_id, category_id, name, description, price, is_available, sort_order) VALUES
-- Appetizers
('a1a1b1c1-1d1e-1a1b-1c1d-1e1a1b1c1d1e', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'ca1a1b1c-1d1e-1a1b-1c1d-1e1a1b1c1d1e', 'Garlic Bread', 'Fresh baked bread with garlic butter and herbs', 8.99, true, 1),
('a2a2b2c2-2d2e-2a2b-2c2d-2e2a2b2c2d2e', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'ca1a1b1c-1d1e-1a1b-1c1d-1e1a1b1c1d1e', 'Mozzarella Sticks', 'Crispy breaded mozzarella with marinara sauce', 12.99, true, 2),
-- Pizzas
('a3a3b3c3-3d3e-3a3b-3c3d-3e3a3b3c3d3e', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'ca2a2b2c-2d2e-2a2b-2c2d-2e2a2b2c2d2e', 'Margherita Pizza', 'Classic pizza with fresh mozzarella, tomatoes, and basil', 18.99, true, 1),
('a4a4b4c4-4d4e-4a4b-4c4d-4e4a4b4c4d4e', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'ca2a2b2c-2d2e-2a2b-2c2d-2e2a2b2c2d2e', 'Pepperoni Pizza', 'Traditional pepperoni pizza with extra cheese', 21.99, true, 2),
('a5a5b5c5-5d5e-5a5b-5c5d-5e5a5b5c5d5e', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'ca2a2b2c-2d2e-2a2b-2c2d-2e2a2b2c2d2e', 'Supreme Pizza', 'Loaded with pepperoni, sausage, peppers, onions, and mushrooms', 26.99, true, 3),
-- Beverages
('a6a6b6c6-6d6e-6a6b-6c6d-6e6a6b6c6d6e', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'ca3a3b3c-3d3e-3a3b-3c3d-3e3a3b3c3d3e', 'Coca Cola', 'Classic Coca Cola', 3.99, true, 1),
('a7a7b7c7-7d7e-7a7b-7c7d-7e7a7b7c7d7e', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'ca3a3b3c-3d3e-3a3b-3c3d-3e3a3b3c3d3e', 'Italian Wine', 'House red wine from Tuscany', 8.99, true, 2);

-- Burger Spot Menu Items
INSERT INTO menu_items (id, tenant_id, category_id, name, description, price, is_available, sort_order) VALUES
-- Burgers
('b8b8c8d8-8e8a-8b8c-8d8e-8a8b8c8d8e8a', 'b2c3d4e5-a6b7-8901-2345-678901bcdefb', 'cb4b4c4d-4e4a-4b4c-4d4e-4a4b4c4d4e4a', 'Classic Burger', 'Beef patty with lettuce, tomato, onion, and pickles', 14.99, true, 1),
('b9b9c9d9-9e9a-9b9c-9d9e-9a9b9c9d9e9a', 'b2c3d4e5-a6b7-8901-2345-678901bcdefb', 'cb4b4c4d-4e4a-4b4c-4d4e-4a4b4c4d4e4a', 'Cheeseburger', 'Classic burger with melted cheddar cheese', 16.99, true, 2),
-- Sides
('b0b0c0d0-0e0a-0b0c-0d0e-0a0b0c0d0e0a', 'b2c3d4e5-a6b7-8901-2345-678901bcdefb', 'cb5b5c5d-5e5a-5b5c-5d5e-5a5b5c5d5e5a', 'French Fries', 'Crispy golden french fries', 5.99, true, 1),
('b1b1c1d1-1e1a-1b1c-1d1e-1a1b1c1d1e1a', 'b2c3d4e5-a6b7-8901-2345-678901bcdefb', 'cb5b5c5d-5e5a-5b5c-5d5e-5a5b5c5d5e5a', 'Onion Rings', 'Beer-battered onion rings', 7.99, true, 2);

-- =====================================================================================
-- SAMPLE ORDERS
-- =====================================================================================

-- Pizza Palace Orders
INSERT INTO orders (id, tenant_id, customer_id, order_number, status, order_type, subtotal, tax_amount, tip_amount, total_amount, payment_status, customer_notes) VALUES
('e1a1b1c1-1d1e-1a1b-1c1d-1e1a1b1c1d1e', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'f3a3b3c3-d3e3-a3b3-c3d3-e3f3a3b3c3d3', 'PP-001', 'completed', 'dine_in', 27.98, 2.31, 5.00, 35.29, 'paid', 'Extra cheese please'),
('e2a2b2c2-2d2e-2a2b-2c2d-2e2a2b2c2d2e', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'f4a4b4c4-d4e4-a4b4-c4d4-e4f4a4b4c4d4', 'PP-002', 'preparing', 'takeout', 18.99, 1.57, 0.00, 20.56, 'paid', NULL);

-- Burger Spot Orders
INSERT INTO orders (id, tenant_id, customer_id, order_number, status, order_type, subtotal, tax_amount, tip_amount, total_amount, payment_status, customer_notes) VALUES
('e3b3c3d3-3e3a-3b3c-3d3e-3a3b3c3d3e3a', 'b2c3d4e5-a6b7-8901-2345-678901bcdefb', 'f6b6c6d6-e6f6-a6b6-c6d6-e6f6a6b6c6d6', 'BS-001', 'ready', 'takeout', 22.98, 2.18, 3.00, 28.16, 'paid', 'No pickles');

-- =====================================================================================
-- SAMPLE ORDER ITEMS
-- =====================================================================================

-- Pizza Palace Order Items
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_instructions) VALUES
-- Order PP-001
('e1a1b1c1-1d1e-1a1b-1c1d-1e1a1b1c1d1e', 'a1a1b1c1-1d1e-1a1b-1c1d-1e1a1b1c1d1e', 1, 8.99, 8.99, NULL),
('e1a1b1c1-1d1e-1a1b-1c1d-1e1a1b1c1d1e', 'a3a3b3c3-3d3e-3a3b-3c3d-3e3a3b3c3d3e', 1, 18.99, 18.99, 'Extra cheese'),
-- Order PP-002  
('e2a2b2c2-2d2e-2a2b-2c2d-2e2a2b2c2d2e', 'a3a3b3c3-3d3e-3a3b-3c3d-3e3a3b3c3d3e', 1, 18.99, 18.99, NULL);

-- Burger Spot Order Items
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_instructions) VALUES
-- Order BS-001
('e3b3c3d3-3e3a-3b3c-3d3e-3a3b3c3d3e3a', 'b9b9c9d9-9e9a-9b9c-9d9e-9a9b9c9d9e9a', 1, 16.99, 16.99, 'No pickles'),
('e3b3c3d3-3e3a-3b3c-3d3e-3a3b3c3d3e3a', 'b0b0c0d0-0e0a-0b0c-0d0e-0a0b0c0d0e0a', 1, 5.99, 5.99, NULL);

-- =====================================================================================
-- SAMPLE LOYALTY DATA
-- =====================================================================================

-- Loyalty transactions for Pizza Palace customers
INSERT INTO loyalty_transactions (tenant_id, customer_id, order_id, transaction_type, points, description) VALUES
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'f3a3b3c3-d3e3-a3b3-c3d3-e3f3a3b3c3d3', 'e1a1b1c1-1d1e-1a1b-1c1d-1e1a1b1c1d1e', 'earned', 35, 'Points earned from order PP-001'),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'f3a3b3c3-d3e3-a3b3-c3d3-e3f3a3b3c3d3', NULL, 'earned', 50, 'Welcome bonus'),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'f3a3b3c3-d3e3-a3b3-c3d3-e3f3a3b3c3d3', NULL, 'earned', 100, 'Birthday bonus'),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'f3a3b3c3-d3e3-a3b3-c3d3-e3f3a3b3c3d3', NULL, 'redeemed', -35, 'Redeemed free appetizer'),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'f4a4b4c4-d4e4-a4b4-c4d4-e4f4a4b4c4d4', NULL, 'earned', 250, 'Multiple order points');

-- Loyalty rewards for Pizza Palace
INSERT INTO loyalty_rewards (tenant_id, name, description, points_required, reward_type, reward_value, is_active) VALUES
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Free Appetizer', 'Get any appetizer free', 100, 'free_item', 0, true),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', '10% Off', '10% discount on your order', 150, 'discount_percent', 10, true),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', '$5 Off', '$5 discount on orders over $25', 200, 'discount_amount', 5, true),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Free Pizza', 'Free medium pizza', 500, 'free_item', 0, true);

-- =====================================================================================
-- NOTES
-- =====================================================================================

-- This seed data provides:
-- - 3 sample tenants with different configurations
-- - Feature flags showing different enablement levels
-- - Users with different roles across tenants  
-- - Menu structure with categories and items
-- - Sample orders in different statuses
-- - Loyalty transactions and rewards
--
-- Password hash is for "password123" (for testing only)
-- All UUIDs are manually generated for consistency in testing
-- Full-text search vectors will be automatically generated by triggers