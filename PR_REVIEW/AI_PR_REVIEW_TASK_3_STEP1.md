# AI PR Review Task 3: Database Connection Setup Fixes

**Related to**: TASK-003: Database Connection Setup  
**Priority**: CRITICAL  
**Estimated Time**: 60 minutes

## Critical Issues to Fix

### 🔥 CRITICAL: Fix Multi-Tenant Query Parameter Collision
**File**: `app/lib/db.ts` - `tenantQuery` function  
**Issue**: Parameter collision where `$1` is used for both tenant_id and reused in regex replacement, causing invalid SQL.

**Current Broken Code**:
```typescript
export const tenantQuery = async <T extends QueryResultRow = any>(
  tenantId: string,
  baseQuery: string,
  params: QueryParameters = []
): Promise<QueryResult<T>> => {
  const tenantParams = [tenantId, ...params];

  // BROKEN: $1 collision and parameter reindexing
  let modifiedQuery = baseQuery;
  if (baseQuery.toLowerCase().includes("where")) {
    modifiedQuery = baseQuery.replace(
      /where/i,
      "WHERE tenant_id = $1 AND"
    );
  } else if (baseQuery.toLowerCase().includes("from")) {
    modifiedQuery = baseQuery.replace(
      /(from\s+\w+)/i,
      "$1 WHERE tenant_id = $1"  // $1 refers to FROM capture group!
    );
  }

  return query<T>(modifiedQuery, tenantParams);
};
```

**REQUIRED FIX**: Replace with Row-Level Security approach:
```typescript
export const tenantQuery = async <T extends QueryResultRow = any>(
  tenantId: string,
  baseQuery: string,
  params: QueryParameters = []
): Promise<QueryResult<T>> => {
  if (!tenantId) {
    throw new Error("Tenant ID is required for all database operations");
  }

  const client = await pool.connect();
  try {
    // Set tenant_id for RLS policies
    await client.query('SET LOCAL "app.tenant_id" = $1', [tenantId]);
    
    // Execute original query without modification
    const result = await client.query<T>(baseQuery, params);
    return result;
  } finally {
    client.release();
  }
};
```

### 🔒 SECURITY: Fix Sensitive Information Logging
**File**: `app/lib/db.ts` and `app/lib/redis.ts`  
**Issue**: Database errors log full query text and parameters, potentially exposing secrets/PII.

**REQUIRED FIX**: Sanitize error logging:
```typescript
// In db.ts
} catch (error) {
  const sanitizedError = {
    code: error.code,
    message: error.message,
    // Remove: query text, parameters, stack traces in production
  };
  console.error("Database operation failed:", sanitizedError);
  throw error;
}

// In redis.ts  
} catch (error) {
  console.error("Redis operation failed:", {
    operation: "get/set/del", 
    error: error.message
    // Remove: keys, values, detailed errors
  });
  throw error;
}
```

### ⚡ PERFORMANCE: Replace Blocking KEYS with SCAN
**File**: `app/lib/redis.ts` - `clearTenantCache` function  
**Issue**: Uses blocking `KEYS` command which can freeze Redis in production.

**REQUIRED FIX**:
```typescript
export const clearTenantCache = async (tenantId: string): Promise<number> => {
  try {
    await ensureConnection();
    
    const pattern = getTenantKey(tenantId, "*");
    const keysToDelete: string[] = [];
    let cursor = 0;

    // Use non-blocking SCAN instead of KEYS
    do {
      const reply = await client.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = reply.cursor;
      keysToDelete.push(...reply.keys);
    } while (cursor !== 0);

    if (keysToDelete.length === 0) {
      return 0;
    }
    
    const deleted = await client.del(keysToDelete);
    return deleted;
  } catch (error) {
    console.error("Redis clear tenant cache error:", error.message);
    return 0;
  }
};
```

### 🐛 BUG: Fix Redis Connection Race Conditions
**File**: `app/lib/redis.ts` - `ensureConnection` function  
**Issue**: Race conditions where multiple requests try to connect simultaneously.

**REQUIRED FIX**:
```typescript
let connectionPromise: Promise<void> | null = null;

const ensureConnection = async (): Promise<void> => {
  if (isConnected) {
    return;
  }

  if (connectionPromise) {
    await connectionPromise;
    return;
  }

  connectionPromise = (async () => {
    try {
      isConnecting = true;
      await client.connect();
    } catch (error) {
      console.error("Failed to connect to Redis:", error.message);
      // Reset for next attempt
      connectionPromise = null;
      isConnecting = false;
      throw error;
    }
  })();

  await connectionPromise;
};
```

### 🔧 BUG: Fix Cache Deserialization Type Safety
**File**: `app/lib/redis.ts` - `deserialize` function  
**Issue**: Type safety issues when JSON parsing fails.

**REQUIRED FIX**:
```typescript
const deserialize = <T = CacheValue>(value: string | null): T | null => {
  if (value === null) return null;
  
  try {
    return JSON.parse(value) as T;
  } catch {
    // If parsing fails, the data is corrupt
    console.warn("Redis deserialize: Failed to parse cached value as JSON");
    return null;
  }
};
```

### 🧪 TESTING: Fix Test Script Execution Error
**File**: `scripts/test-connections.cjs`  
**Issue**: Generated test file tries to `require()` TypeScript files directly, which Node.js cannot execute.

**REQUIRED FIX**: Update test file generation to use `.js` imports:
```javascript
const testFile = `
const { query, healthCheck, getPoolStatus } = require('./app/lib/db.js');
const { 
  setTenantCache, 
  getTenantCache, 
  healthCheck: redisHealthCheck,
  getConnectionStatus 
} = require('./app/lib/redis.js');

// ... rest of test code
`;
```

OR add TypeScript compilation step:
```javascript
// First compile TypeScript, then require compiled JS
const { execSync } = require('child_process');
execSync('npx tsc');
const { query, healthCheck } = require('./dist/app/lib/db.js');
```

## Database Schema Requirements (RLS Setup)

For the Row-Level Security approach, add these SQL policies to your schema:

```sql
-- Enable RLS on all multi-tenant tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tenant isolation
CREATE POLICY tenant_isolation_policy ON tenants
  FOR ALL TO PUBLIC
  USING (id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_policy ON tenant_features
  FOR ALL TO PUBLIC  
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Repeat for all other tables with tenant_id columns
-- ... (add policies for users, menu_categories, menu_items, orders, etc.)
```

## Acceptance Criteria

- [ ] Multi-tenant queries work correctly without parameter collisions
- [ ] Database errors don't expose sensitive information
- [ ] Redis cache clearing uses non-blocking SCAN command  
- [ ] Redis connections handle race conditions properly
- [ ] Cache deserialization is type-safe
- [ ] Test scripts can execute successfully
- [ ] Row-Level Security policies enforce tenant isolation
- [ ] All database operations respect tenant boundaries
- [ ] Performance is maintained under concurrent load

## Testing Requirements

After fixes:
1. Run `node scripts/test-connections.cjs` - should complete without errors
2. Test concurrent tenant operations don't leak data
3. Verify Redis operations under load don't block
4. Confirm sensitive data isn't logged in error cases
5. Test database queries with complex WHERE clauses work correctly

## Security Notes

⚠️ **CRITICAL**: The original `tenantQuery` implementation has data leakage vulnerabilities. The Row-Level Security approach is the recommended fix for production multi-tenant applications.