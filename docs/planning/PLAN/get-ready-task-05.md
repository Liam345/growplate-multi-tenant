# Testing & Preparation Guide: TASK-001 through TASK-004

This document provides step-by-step instructions to test all completed tasks and prepare for TASK-005: Feature Flag System.

## 📋 Overview of Completed Tasks

- ✅ **TASK-001**: Initialize Remix Project Structure
- ✅ **TASK-002**: Database Schema Setup
- ✅ **TASK-003**: Database Connection Setup
- ✅ **TASK-004**: Tenant Resolution Middleware

---

## 🧪 Part 1: Testing Completed Tasks

### Step 1: Test TASK-001 (Remix Project Structure)

#### 1.1 Verify Development Server

```bash
# Navigate to project directory
cd /Users/liambanga/Code/growplate-multi-tenant

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

**Expected Result**:

- Server starts on `http://localhost:3000`
- No compilation errors
- Tailwind CSS styling works

#### 1.2 Verify TypeScript Compilation

```bash
# Run TypeScript compiler check
npx tsc --noEmit
```

**Expected Result**: No TypeScript errors

#### 1.3 Verify Linting and Formatting

```bash
# Run ESLint
npm run lint

# Run Prettier (if configured)
npm run format
```

**Expected Result**: No linting errors, consistent formatting

### Step 2: Test TASK-002 (Database Schema)

#### 2.1 Set Up PostgreSQL Database

```bash
# Option A: Using Homebrew (macOS)
brew services start postgresql
createdb growplate_dev

# Option B: Using Docker
docker run --name postgres-growplate \
  -e POSTGRES_DB=growplate_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Option C: Using existing PostgreSQL installation
# Just ensure PostgreSQL is running and create the database
```

#### 2.2 Apply Database Schema

```bash
# Apply database schema using Docker
docker exec -i postgres-growplate psql -U postgres -d growplate_dev < database/schema.sql

# Apply indexes using Docker
docker exec -i postgres-growplate psql -U postgres -d growplate_dev < database/indexes.sql

# Apply Row-Level Security policies using Docker (CRITICAL for tenant isolation)
# Note: This is now essential as tenant queries use explicit transactions with RLS
docker exec -i postgres-growplate psql -U postgres -d growplate_dev < database/rls.sql

# Optional: Add seed data using Docker
docker exec -i postgres-growplate psql -U postgres -d growplate_dev < database/seed.sql
```

#### 2.3 Verify Database Schema

```bash
# Connect to database using Docker
docker exec -it postgres-growplate psql -U postgres -d growplate_dev

# Once connected, run these SQL commands:
# List all tables
\dt

# Check tenants table structure
\d tenants

# Check other tables
\d tenant_features
\d users
\d menu_categories
\d menu_items
\d orders
\d order_items
\d loyalty_transactions
\d loyalty_rewards

# Verify Row-Level Security is enabled
SELECT * FROM check_rls_status();

# Exit
\q
```

**Expected Result**: 
- All 9 tables created with proper structure
- RLS (Row-Level Security) enabled on all tenant tables  
- RLS policies show proper tenant isolation
- Explicit transaction support ensures secure tenant queries

### Step 3: Test TASK-003 (Database Connections)

#### 3.1 Set Up Redis

```bash
# Option A: Using Homebrew (macOS)
brew services start redis

# Option B: Using Docker
docker run --name redis-growplate \
  -p 6379:6379 \
  -d redis:7-alpine

# Test Redis connection using Docker
docker exec redis-growplate redis-cli ping
```

**Expected Result**: Redis responds with "PONG"

#### 3.2 Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your database credentials
nano .env
```

**Update .env with your settings:**

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/growplate_dev
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=growplate_dev
DATABASE_USER=postgres
DATABASE_PASSWORD=password

# Database Pool Configuration
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_IDLE_TIMEOUT=30000
DATABASE_TIMEOUT=5000

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=growplate:
REDIS_CONNECT_TIMEOUT=5000

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here-please-change-this
JWT_EXPIRES_IN=7d

# Application Configuration
NODE_ENV=development
SESSION_SECRET=your-session-secret-here-please-change-this
ENCRYPTION_KEY=your-32-character-encryption-key

# Development
DEV_TENANT_ID=
```

#### 3.3 Test Database Connections

```bash
# IMPORTANT: Compile TypeScript first (required for test script imports)
npx tsc

# Run the connection test script
node scripts/test-connections.cjs

# If you want to test actual connections (requires running servers):
# 1. Ensure PostgreSQL and Redis containers are running
# 2. Copy environment file: cp .env.dev .env
# 3. TypeScript compilation (npx tsc) - already done above
# 4. Then the test script can create actual connections
```

**Expected Result**: All connection tests pass

**Security & Performance Notes**: 
- The database now uses Row-Level Security (RLS) with explicit transactions for secure tenant isolation
- Redis operations use non-blocking SCAN commands for better production performance
- Enhanced connection management prevents race conditions and improves reliability
- The test script now correctly imports from compiled output in the `./dist/` directory

### Step 4: Test TASK-004 (Tenant Resolution Middleware)

#### 4.1 Test Tenant Resolution Implementation

```bash
# Run tenant resolution tests
node scripts/test-tenant-resolution.cjs
```

**Expected Result**: All tests pass, including TypeScript compilation

#### 4.2 Create Test Tenant Data

```bash
# Connect to database using Docker
docker exec -it postgres-growplate psql -U postgres -d growplate_dev

# Once connected, run these SQL commands:
```

```sql

-- Insert a test tenant
INSERT INTO tenants (
    id,
    name,
    domain,
    subdomain,
    email,
    phone,
    address,
    settings,
    stripe_account_id,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Test Restaurant',
    'test-restaurant.com',
    'testrestaurant',
    'owner@test-restaurant.com',
    '+1-555-0123',
    '{"street": "123 Main St", "city": "Test City", "state": "CA", "zipCode": "12345", "country": "US"}',
    '{"enableOrders": true, "enableLoyalty": true, "currency": "USD", "timezone": "America/Los_Angeles"}',
    null,
    NOW(),
    NOW()
);

-- Insert tenant features
INSERT INTO tenant_features (
    id,
    tenant_id,
    feature_name,
    enabled,
    created_at,
    updated_at
) VALUES
(
    gen_random_uuid(),
    (SELECT id FROM tenants WHERE domain = 'test-restaurant.com'),
    'menu',
    true,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    (SELECT id FROM tenants WHERE domain = 'test-restaurant.com'),
    'orders',
    true,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    (SELECT id FROM tenants WHERE domain = 'test-restaurant.com'),
    'loyalty',
    false,
    NOW(),
    NOW()
);

-- Verify data
SELECT * FROM tenants WHERE domain = 'test-restaurant.com';
SELECT * FROM tenant_features WHERE tenant_id = (SELECT id FROM tenants WHERE domain = 'test-restaurant.com');

-- Exit
\q
```

### Step 5: Integration Test

#### 5.1 Test Complete Application Stack

```bash
# Start the development server
npm run dev

# In another terminal, test the health endpoints (if any exist)
curl http://localhost:3000/

# Verify no errors in the console
# Check that the application loads without errors
```

---

## 🚀 Part 2: Preparing for TASK-005 (Feature Flag System)

### Step 1: Understand TASK-005 Requirements

Based on the AI-TASK-BREAKDOWN.md, TASK-005 requires:

- Database queries for tenant features ✅ (already have tenant_features table)
- Redis caching for feature flags
- API endpoints for feature management
- TypeScript types for features ✅ (partially done)
- Default feature configuration

### Step 2: Verify Prerequisites

#### 2.1 Database Schema Check

```bash
# Verify tenant_features table exists and has correct structure using Docker
docker exec -it postgres-growplate psql -U postgres -d growplate_dev -c "\d tenant_features"
```

**Expected columns:**

- id (uuid)
- tenant_id (uuid)
- feature_name (varchar)
- enabled (boolean)
- created_at (timestamp)
- updated_at (timestamp)

#### 2.2 Verify Tenant Data

```bash
# Check that we have test tenants with features using Docker
docker exec -it postgres-growplate psql -U postgres -d growplate_dev -c "
SELECT t.name, t.domain, tf.feature_name, tf.enabled
FROM tenants t
LEFT JOIN tenant_features tf ON t.id = tf.tenant_id
ORDER BY t.name, tf.feature_name;
"
```

### Step 3: Prepare API Route Structure

#### 3.1 Create API Directory Structure

```bash
# Create API route directories
mkdir -p app/routes/api
mkdir -p app/routes/api/features

# Verify structure
# tree app/routes/api -I node_modules
```

### Step 4: Review Feature Flag Architecture

#### 4.1 Planned Feature Types

According to the task breakdown, these are the planned features:

- `menu` - Menu management functionality
- `orders` - Order processing functionality
- `loyalty` - Loyalty points system

#### 4.2 API Endpoints to Implement

- `GET /api/features` - Get tenant features
- `PUT /api/features` - Update tenant features

### Step 5: Prepare Development Environment

#### 5.1 Verify All Services Running

```bash
# Check PostgreSQL (using Docker)
docker exec postgres-growplate pg_isready -U postgres

# Check Redis (using Docker)
docker exec redis-growplate redis-cli ping

# Check application
curl -I http://localhost:3000/
```

#### 5.2 Test Current Middleware Integration

Create a simple test route to verify tenant middleware works:

```bash
# Create a test route
cat > app/routes/api.test-tenant.ts << 'EOF'
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireTenant } from "~/middleware/tenant";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const tenant = await requireTenant(request);
    return json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        features: tenant.features
      }
    });
  } catch (error) {
    return json({
      success: false,
      error: "Tenant not found"
    }, { status: 404 });
  }
}
EOF
```

#### 5.3 Test Tenant Resolution

```bash
# Test with a request that should fail (localhost)
curl http://localhost:3000/api/test-tenant

# Expected: 404 error since localhost doesn't resolve to a tenant
```

### Step 6: Prepare for Task Implementation

#### 6.1 Create Feature Flag Types File

```bash
# Create features type definitions (preview)
cat > app/types/features.ts << 'EOF'
/**
 * Feature Flag Types
 *
 * Type definitions for the feature flag system.
 */

export type FeatureName = 'menu' | 'orders' | 'loyalty';

export type Features = Record<FeatureName, boolean>;

export interface FeatureFlag {
  name: FeatureName;
  enabled: boolean;
  description: string;
}

export interface TenantFeatures {
  tenantId: string;
  features: Features;
  lastUpdated: Date;
}
EOF
```

#### 6.2 Plan Cache Strategy

The feature flag system will use these cache keys:

- `growplate:tenant:features:{tenantId}` - Cached feature flags for a tenant
- TTL: 30 minutes (1800 seconds)

**Performance Notes**: 
- Redis operations now use enhanced connection management with race condition prevention
- Cache clearing operations use non-blocking SCAN for production safety
- Improved error handling and automatic connection recovery

### Step 7: Final Preparation Checklist

#### 7.1 Environment Verification

- [ ] PostgreSQL running and accessible
- [ ] Redis running and accessible
- [ ] .env file configured correctly
- [ ] Test tenant data exists in database
- [ ] Application starts without errors
- [ ] All previous tasks tests pass

#### 7.2 Code Verification

- [ ] TypeScript compilation passes
- [ ] No linting errors
- [ ] Database connections work
- [ ] Tenant resolution middleware implemented
- [ ] Redis caching functional

#### 7.3 Development Setup

- [ ] API route structure prepared
- [ ] Feature types defined
- [ ] Test data available
- [ ] Documentation updated

---

## 🎯 Ready for TASK-005!

Once all the above steps are completed successfully, you'll be ready to implement TASK-005: Feature Flag System.

### Quick Verification Commands

```bash
# Run all tests to ensure everything is working
npm run dev &
node scripts/test-connections.cjs
node scripts/test-tenant-resolution.cjs
npx tsc --noEmit

# Kill dev server
pkill -f "npm run dev"
```

### TASK-005 Implementation Order

1. Create feature flag database operations (`app/lib/features.ts`)
2. Create feature management API routes (`app/routes/api.features.ts`)
3. Add Redis caching for feature flags
4. Create feature flag utilities and helpers
5. Test the complete feature flag system

---

## 📞 Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check if PostgreSQL Docker container is running
docker ps | grep postgres-growplate

# Check PostgreSQL container logs
docker logs postgres-growplate

# Restart PostgreSQL container if needed
docker restart postgres-growplate

# Check database exists using Docker
docker exec -it postgres-growplate psql -U postgres -l | grep growplate

# If using local PostgreSQL instead of Docker:
# brew services list | grep postgresql
# sudo systemctl status postgresql
```

#### Redis Connection Issues

```bash
# Check Redis Docker container status
docker ps | grep redis-growplate

# Check Redis container logs
docker logs redis-growplate

# Restart Redis container if needed
docker restart redis-growplate

# Test connection using Docker
docker exec redis-growplate redis-cli ping

# If using local Redis instead of Docker:
# brew services list | grep redis
# sudo systemctl status redis
```

#### Port Conflicts

```bash
# Check what's running on ports
lsof -i :3000  # Remix dev server
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
```

#### TypeScript Errors

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
rm -rf .next
rm -rf dist

# Reinstall dependencies
npm install

# Check compilation (required for test scripts)
npx tsc --noEmit

# Compile for test script execution
npx tsc
```

#### Connection Test Import Issues

If the test script fails with import errors:

```bash
# Ensure TypeScript is compiled first
npx tsc

# Verify compiled files exist
ls -la dist/app/lib/

# The test script now correctly imports from dist/ directory
# This was fixed to resolve Node.js import issues with TypeScript files
```

Your development environment is now fully prepared for implementing the Feature Flag System! 🚀
