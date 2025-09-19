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
    'b2c3d4e5-f6g7-8901-2345-678901bcdefg',
    'Burger Spot',
    'burger-spot.com', 
    'burger-spot',
    'manager@burger-spot.com',
    '+1-555-0202',
    '{"street": "456 Oak Ave", "city": "Los Angeles", "state": "CA", "zipCode": "90210", "country": "USA"}',
    '{"timezone": "America/Los_Angeles", "currency": "USD", "tax_rate": 9.5}'
),
(
    'c3d4e5f6-g7h8-9012-3456-789012cdefgh',
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
('b2c3d4e5-f6g7-8901-2345-678901bcdefg', 'menu', true),
('b2c3d4e5-f6g7-8901-2345-678901bcdefg', 'orders', true),
('b2c3d4e5-f6g7-8901-2345-678901bcdefg', 'loyalty', false);

-- Sushi Garden: Menu only (just starting)
INSERT INTO tenant_features (tenant_id, feature_name, enabled) VALUES
('c3d4e5f6-g7h8-9012-3456-789012cdefgh', 'menu', true),
('c3d4e5f6-g7h8-9012-3456-789012cdefgh', 'orders', false),
('c3d4e5f6-g7h8-9012-3456-789012cdefgh', 'loyalty', false);

-- =====================================================================================
-- SAMPLE USERS
-- =====================================================================================

-- Pizza Palace Users
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, phone, loyalty_points) VALUES
-- Owner
('u1a1b1c1-d1e1-f1g1-h1i1-j1k1l1m1n1o1', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'owner@pizza-palace.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYFH8z1.S7P3.se', 'Mario', 'Rossi', 'owner', '+1-555-0111', 0),
-- Staff
('u2a2b2c2-d2e2-f2g2-h2i2-j2k2l2m2n2o2', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'staff@pizza-palace.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYFH8z1.S7P3.se', 'Tony', 'Soprano', 'staff', '+1-555-0112', 0),
-- Customers
('u3a3b3c3-d3e3-f3g3-h3i3-j3k3l3m3n3o3', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'john@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYFH8z1.S7P3.se', 'John', 'Doe', 'customer', '+1-555-0113', 150),
('u4a4b4c4-d4e4-f4g4-h4i4-j4k4l4m4n4o4', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'jane@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYFH8z1.S7P3.se', 'Jane', 'Smith', 'customer', '+1-555-0114', 250);

-- Burger Spot Users  
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, phone, loyalty_points) VALUES
-- Owner
('u5b5c5d5-e5f5-g5h5-i5j5-k5l5m5n5o5p5', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', 'manager@burger-spot.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYFH8z1.S7P3.se', 'Bob', 'Johnson', 'owner', '+1-555-0221', 0),
-- Customer
('u6b6c6d6-e6f6-g6h6-i6j6-k6l6m6n6o6p6', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', 'customer@burger-spot.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYFH8z1.S7P3.se', 'Alice', 'Wilson', 'customer', '+1-555-0222', 0);

-- Sushi Garden Users
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, phone, loyalty_points) VALUES
-- Owner
('u7c7d7e7-f7g7-h7i7-j7k7-l7m7n7o7p7q7', 'c3d4e5f6-g7h8-9012-3456-789012cdefgh', 'chef@sushi-garden.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYFH8z1.S7P3.se', 'Akira', 'Tanaka', 'owner', '+1-555-0331', 0);

-- =====================================================================================
-- SAMPLE MENU DATA
-- =====================================================================================

-- Pizza Palace Menu Categories
INSERT INTO menu_categories (id, tenant_id, name, description, sort_order, is_active) VALUES
('mc1a1b1c-1d1e-1f1g-1h1i-1j1k1l1m1n1o', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Appetizers', 'Start your meal with these delicious appetizers', 1, true),
('mc2a2b2c-2d2e-2f2g-2h2i-2j2k2l2m2n2o', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Pizzas', 'Our signature wood-fired pizzas', 2, true),
('mc3a3b3c-3d3e-3f3g-3h3i-3j3k3l3m3n3o', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'Beverages', 'Refresh yourself with our drink selection', 3, true);

-- Burger Spot Menu Categories
INSERT INTO menu_categories (id, tenant_id, name, description, sort_order, is_active) VALUES
('mc4b4c4d-4e4f-4g4h-4i4j-4k4l4m4n4o4p', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', 'Burgers', 'Juicy burgers made with premium beef', 1, true),
('mc5b5c5d-5e5f-5g5h-5i5j-5k5l5m5n5o5p', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', 'Sides', 'Perfect sides to complete your meal', 2, true);

-- Pizza Palace Menu Items
INSERT INTO menu_items (id, tenant_id, category_id, name, description, price, is_available, sort_order) VALUES
-- Appetizers
('mi1a1b1c-1d1e-1f1g-1h1i-1j1k1l1m1n1o', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'mc1a1b1c-1d1e-1f1g-1h1i-1j1k1l1m1n1o', 'Garlic Bread', 'Fresh baked bread with garlic butter and herbs', 8.99, true, 1),
('mi2a2b2c-2d2e-2f2g-2h2i-2j2k2l2m2n2o', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'mc1a1b1c-1d1e-1f1g-1h1i-1j1k1l1m1n1o', 'Mozzarella Sticks', 'Crispy breaded mozzarella with marinara sauce', 12.99, true, 2),
-- Pizzas
('mi3a3b3c-3d3e-3f3g-3h3i-3j3k3l3m3n3o', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'mc2a2b2c-2d2e-2f2g-2h2i-2j2k2l2m2n2o', 'Margherita Pizza', 'Classic pizza with fresh mozzarella, tomatoes, and basil', 18.99, true, 1),
('mi4a4b4c-4d4e-4f4g-4h4i-4j4k4l4m4n4o', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'mc2a2b2c-2d2e-2f2g-2h2i-2j2k2l2m2n2o', 'Pepperoni Pizza', 'Traditional pepperoni pizza with extra cheese', 21.99, true, 2),
('mi5a5b5c-5d5e-5f5g-5h5i-5j5k5l5m5n5o', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'mc2a2b2c-2d2e-2f2g-2h2i-2j2k2l2m2n2o', 'Supreme Pizza', 'Loaded with pepperoni, sausage, peppers, onions, and mushrooms', 26.99, true, 3),
-- Beverages
('mi6a6b6c-6d6e-6f6g-6h6i-6j6k6l6m6n6o', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'mc3a3b3c-3d3e-3f3g-3h3i-3j3k3l3m3n3o', 'Coca Cola', 'Classic Coca Cola', 3.99, true, 1),
('mi7a7b7c-7d7e-7f7g-7h7i-7j7k7l7m7n7o', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'mc3a3b3c-3d3e-3f3g-3h3i-3j3k3l3m3n3o', 'Italian Wine', 'House red wine from Tuscany', 8.99, true, 2);

-- Burger Spot Menu Items
INSERT INTO menu_items (id, tenant_id, category_id, name, description, price, is_available, sort_order) VALUES
-- Burgers
('mi8b8c8d-8e8f-8g8h-8i8j-8k8l8m8n8o8p', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', 'mc4b4c4d-4e4f-4g4h-4i4j-4k4l4m4n4o4p', 'Classic Burger', 'Beef patty with lettuce, tomato, onion, and pickles', 14.99, true, 1),
('mi9b9c9d-9e9f-9g9h-9i9j-9k9l9m9n9o9p', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', 'mc4b4c4d-4e4f-4g4h-4i4j-4k4l4m4n4o4p', 'Cheeseburger', 'Classic burger with melted cheddar cheese', 16.99, true, 2),
-- Sides
('mi10b10c-10d1-0e10-f10g-10h10i10j10k1', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', 'mc5b5c5d-5e5f-5g5h-5i5j-5k5l5m5n5o5p', 'French Fries', 'Crispy golden french fries', 5.99, true, 1),
('mi11b11c-11d1-1e11-f11g-11h11i11j11k1', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', 'mc5b5c5d-5e5f-5g5h-5i5j-5k5l5m5n5o5p', 'Onion Rings', 'Beer-battered onion rings', 7.99, true, 2);

-- =====================================================================================
-- SAMPLE ORDERS
-- =====================================================================================

-- Pizza Palace Orders
INSERT INTO orders (id, tenant_id, customer_id, order_number, status, order_type, subtotal, tax_amount, tip_amount, total_amount, payment_status, customer_notes) VALUES
('o1a1b1c1-d1e1-f1g1-h1i1-j1k1l1m1n1o1', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'u3a3b3c3-d3e3-f3g3-h3i3-j3k3l3m3n3o3', 'PP-001', 'completed', 'dine_in', 27.98, 2.31, 5.00, 35.29, 'paid', 'Extra cheese please'),
('o2a2b2c2-d2e2-f2g2-h2i2-j2k2l2m2n2o2', 'a1b2c3d4-e5f6-7890-1234-567890abcdef', 'u4a4b4c4-d4e4-f4g4-h4i4-j4k4l4m4n4o4', 'PP-002', 'preparing', 'takeout', 18.99, 1.57, 0.00, 20.56, 'paid', NULL);

-- Burger Spot Orders
INSERT INTO orders (id, tenant_id, customer_id, order_number, status, order_type, subtotal, tax_amount, tip_amount, total_amount, payment_status, customer_notes) VALUES
('o3b3c3d3-e3f3-g3h3-i3j3-k3l3m3n3o3p3', 'b2c3d4e5-f6g7-8901-2345-678901bcdefg', 'u6b6c6d6-e6f6-g6h6-i6j6-k6l6m6n6o6p6', 'BS-001', 'ready', 'takeout', 22.98, 2.18, 3.00, 28.16, 'paid', 'No pickles');

-- =====================================================================================
-- SAMPLE ORDER ITEMS
-- =====================================================================================

-- Pizza Palace Order Items
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_instructions) VALUES
-- Order PP-001
('o1a1b1c1-d1e1-f1g1-h1i1-j1k1l1m1n1o1', 'mi1a1b1c-1d1e-1f1g-1h1i-1j1k1l1m1n1o', 1, 8.99, 8.99, NULL),
('o1a1b1c1-d1e1-f1g1-h1i1-j1k1l1m1n1o1', 'mi3a3b3c-3d3e-3f3g-3h3i-3j3k3l3m3n3o', 1, 18.99, 18.99, 'Extra cheese'),
-- Order PP-002  
('o2a2b2c2-d2e2-f2g2-h2i2-j2k2l2m2n2o2', 'mi3a3b3c-3d3e-3f3g-3h3i-3j3k3l3m3n3o', 1, 18.99, 18.99, NULL);

-- Burger Spot Order Items
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price, special_instructions) VALUES
-- Order BS-001
('o3b3c3d3-e3f3-g3h3-i3j3-k3l3m3n3o3p3', 'mi9b9c9d-9e9f-9g9h-9i9j-9k9l9m9n9o9p', 1, 16.99, 16.99, 'No pickles'),
('o3b3c3d3-e3f3-g3h3-i3j3-k3l3m3n3o3p3', 'mi10b10c-10d1-0e10-f10g-10h10i10j10k1', 1, 5.99, 5.99, NULL);

-- =====================================================================================
-- SAMPLE LOYALTY DATA
-- =====================================================================================

-- Loyalty transactions for Pizza Palace customers
INSERT INTO loyalty_transactions (tenant_id, customer_id, order_id, transaction_type, points, description) VALUES
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'u3a3b3c3-d3e3-f3g3-h3i3-j3k3l3m3n3o3', 'o1a1b1c1-d1e1-f1g1-h1i1-j1k1l1m1n1o1', 'earned', 35, 'Points earned from order PP-001'),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'u3a3b3c3-d3e3-f3g3-h3i3-j3k3l3m3n3o3', NULL, 'earned', 50, 'Welcome bonus'),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'u3a3b3c3-d3e3-f3g3-h3i3-j3k3l3m3n3o3', NULL, 'earned', 100, 'Birthday bonus'),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'u3a3b3c3-d3e3-f3g3-h3i3-j3k3l3m3n3o3', NULL, 'redeemed', -35, 'Redeemed free appetizer'),
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'u4a4b4c4-d4e4-f4g4-h4i4-j4k4l4m4n4o4', NULL, 'earned', 250, 'Multiple order points');

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