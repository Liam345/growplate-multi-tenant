# GrowPlate Database Schema

This directory contains the PostgreSQL database schema for the GrowPlate multi-tenant restaurant management platform.

## Files

- **`schema.sql`** - Complete database schema with all tables, triggers, and functions
- **`indexes.sql`** - Performance indexes for optimal query performance  
- **`seed.sql`** - Sample data for testing and development
- **`test-schema.sql`** - Test script to validate schema syntax

## Database Setup

### Prerequisites

- PostgreSQL 14+ installed and running
- Database user with CREATE privileges
- Extensions: `uuid-ossp`, `pg_trgm`

### Setup Instructions

1. **Create Database**
   ```bash
   createdb growplate_dev
   ```

2. **Run Schema**
   ```bash
   psql -d growplate_dev -f schema.sql
   ```

3. **Add Indexes**
   ```bash
   psql -d growplate_dev -f indexes.sql
   ```

4. **Load Sample Data** (optional)
   ```bash
   psql -d growplate_dev -f seed.sql
   ```

### Test Installation

```bash
psql -d growplate_dev -f test-schema.sql
```

## Schema Overview

### Core Tables

- **`tenants`** - Restaurant tenants with domain-based routing
- **`tenant_features`** - Feature flags per tenant
- **`users`** - Multi-role users (owners, staff, customers)
- **`menu_categories`** - Menu organization
- **`menu_items`** - Menu items with full-text search
- **`orders`** - Customer orders with status tracking
- **`order_items`** - Order line items
- **`loyalty_transactions`** - Loyalty point tracking
- **`loyalty_rewards`** - Reward definitions

### Key Features

- **Multi-Tenant Isolation**: All tables include `tenant_id` for row-level security
- **UUID Primary Keys**: All tables use UUIDs with `gen_random_uuid()`
- **Full-Text Search**: PostgreSQL native search on menu items
- **Audit Trails**: Automatic timestamp tracking with triggers
- **Data Integrity**: Foreign keys, CHECK constraints, and business rules
- **Performance**: Strategic indexing for multi-tenant queries

### Sample Data

The seed file includes:
- 3 sample restaurants (Pizza Palace, Burger Spot, Sushi Garden)
- Different feature flag configurations
- Sample users with different roles
- Menu items with categories
- Sample orders in various statuses
- Loyalty transactions and rewards

## Environment Variables

Set these in your `.env` file:

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/growplate_dev
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=growplate_dev
DATABASE_USER=username
DATABASE_PASSWORD=password
```

## Multi-Tenant Architecture

Each tenant (restaurant) is isolated by:
- Unique domain for routing (`pizza-palace.com`)
- Row-level security with `tenant_id` in all queries
- Feature flags for per-tenant functionality
- Separate Stripe accounts for payments

## Performance Considerations

- All tenant-based queries use indexes starting with `tenant_id`
- Full-text search uses GIN indexes for fast text search
- Composite indexes for common query patterns
- Partial indexes for active records only

## Security

- All user passwords are hashed with bcrypt
- Foreign key constraints prevent orphaned records
- CHECK constraints validate enum values
- No sensitive data in logs or search vectors

## Development

For development, you can:
1. Use the seed data for testing
2. Run schema changes incrementally
3. Use `EXPLAIN ANALYZE` for query optimization
4. Monitor with `pg_stat_statements`

## Production

For production deployment:
1. Use managed PostgreSQL (AWS RDS recommended)
2. Enable connection pooling
3. Set up automated backups
4. Monitor query performance
5. Use read replicas for analytics