# AI PR Review Task 4: Tenant Resolution Middleware Fixes

**Related to**: TASK-004: Tenant Resolution Middleware  
**Priority**: CRITICAL  
**Estimated Time**: 75 minutes

## Critical Issues to Fix

### 🔥 CRITICAL: Fix Race Condition with Global Variables
**File**: `app/middleware/tenant.ts`  
**Issue**: Module-level variables cause data leakage between concurrent requests in multi-tenant environment.

**Current Broken Code**:
```typescript
// DANGEROUS: Shared across all requests!
let currentTenant: TenantContext | null = null;
let currentResolution: TenantResolutionResult | null = null;

export function getCurrentTenant(): TenantContext | null {
  return currentTenant; // Request A gets Request B's tenant!
}

function setCurrentTenant(
  tenant: TenantContext | null,
  resolution: TenantResolutionResult | null
) {
  currentTenant = tenant;    // Race condition
  currentResolution = resolution; // Data leakage
}
```

**REQUIRED FIX**: Use AsyncLocalStorage for request isolation:
```typescript
import { AsyncLocalStorage } from "async_hooks";

interface TenantRequestContext {
  tenant: TenantContext | null;
  resolution: TenantResolutionResult | null;
}

const tenantContextStorage = new AsyncLocalStorage<TenantRequestContext>();

/**
 * Get current tenant from request context (thread-safe)
 */
export function getCurrentTenant(): TenantContext | null {
  return tenantContextStorage.getStore()?.tenant ?? null;
}

/**
 * Get current tenant resolution result (thread-safe)
 */
export function getCurrentTenantResolution(): TenantResolutionResult | null {
  return tenantContextStorage.getStore()?.resolution ?? null;
}

/**
 * Execute function with tenant context
 */
export function withTenantContext<T>(
  tenant: TenantContext | null,
  resolution: TenantResolutionResult | null,
  fn: () => T
): T {
  return tenantContextStorage.run(
    { tenant, resolution },
    fn
  );
}

/**
 * Tenant middleware wrapper
 */
export async function tenantMiddleware(
  request: Request,
  next: () => Promise<Response>
): Promise<Response> {
  const resolution = await resolveTenant(request);
  
  return withTenantContext(
    resolution.tenant,
    resolution,
    async () => {
      return await next();
    }
  );
}
```

### 🔒 SECURITY: Fix Multi-Tenant Query Security
**File**: `app/lib/db.ts` (carries over from Task 3)  
**Issue**: Brittle regex-based query modification can fail and cause data leakage.

**REQUIRED FIX**: Require explicit tenant filtering in queries:
```typescript
export const tenantQuery = async <T extends QueryResultRow = any>(
  tenantId: string,
  baseQuery: string,
  params: QueryParameters = []
): Promise<QueryResult<T>> => {
  if (!tenantId) {
    throw new Error("Tenant ID is required for all database operations");
  }

  // Security: Ensure query is designed for multi-tenancy
  if (!baseQuery.includes("tenant_id = $1")) {
    console.error("Security risk: Query missing tenant_id filter:", baseQuery);
    throw new Error("Query must include 'tenant_id = $1' for tenant isolation");
  }

  // Tenant ID is first parameter
  const tenantParams = [tenantId, ...params];
  
  return query<T>(baseQuery, tenantParams);
};
```

### 🌐 ROBUSTNESS: Improve Domain Parsing
**File**: `app/lib/tenant.ts` - `parseDomain` function  
**Issue**: Hardcoded platform domain, doesn't handle edge cases, inconsistent normalization.

**REQUIRED FIX**: Make domain parsing configurable and robust:
```typescript
interface DomainConfig {
  platformDomain: string;
  allowLocalhost: boolean;
  requireHttps: boolean;
}

const defaultDomainConfig: DomainConfig = {
  platformDomain: process.env.PLATFORM_DOMAIN || "growplate.com",
  allowLocalhost: process.env.NODE_ENV === "development",
  requireHttps: process.env.NODE_ENV === "production"
};

export function parseDomain(
  hostname: string, 
  config: DomainConfig = defaultDomainConfig
): DomainInfo {
  // Normalize hostname
  const cleanHostname = hostname.toLowerCase().trim();
  
  // Handle localhost in development
  if (config.allowLocalhost && (cleanHostname === "localhost" || cleanHostname.startsWith("127."))) {
    return {
      hostname: cleanHostname,
      domain: cleanHostname,
      subdomain: null,
      port: null,
      isCustomDomain: false,
      isLocalhost: true,
    };
  }

  // Remove port if present
  const [hostPart, portPart] = cleanHostname.split(":");
  const port = portPart ? parseInt(portPart, 10) : null;

  // Split domain parts
  const parts = hostPart.split(".");
  
  // Validate minimum domain structure
  if (parts.length < 2) {
    throw new Error(`Invalid domain format: ${hostname}`);
  }

  // Check if subdomain of platform
  const platformParts = config.platformDomain.split(".");
  const isSubdomainOfPlatform = 
    parts.length >= platformParts.length + 1 &&
    parts.slice(-platformParts.length).join(".") === config.platformDomain;

  let domain: string;
  let subdomain: string | null = null;
  let isCustomDomain: boolean;

  if (isSubdomainOfPlatform) {
    // Extract subdomain (support multi-level)
    const subdomainParts = parts.slice(0, -(platformParts.length));
    subdomain = subdomainParts.join(".");
    domain = parts.slice(subdomainParts.length).join(".");
    isCustomDomain = false;
  } else {
    // Custom domain
    domain = hostPart;
    subdomain = null;
    isCustomDomain = true;
  }

  return {
    hostname: cleanHostname,
    domain,
    subdomain,
    port,
    isCustomDomain,
    isLocalhost: false,
  };
}
```

### 🧪 TESTING: Fix Resource Leak in Test Script
**File**: `scripts/test-tenant-resolution.cjs`  
**Issue**: Temporary files not cleaned up if TypeScript compilation fails.

**REQUIRED FIX**: Use try-finally for cleanup:
```javascript
const tempFilePath = path.join(process.cwd(), 'temp-tenant-test.js');

try {
  // Generate test file
  require('fs').writeFileSync(tempFilePath, testFileContent);

  try {
    // Check TypeScript compilation  
    execSync('npx tsc --noEmit', { cwd: process.cwd(), stdio: 'pipe' });
    log.success('TypeScript compilation successful');
  } catch (error) {
    log.error('TypeScript compilation failed');
    const stdout = error.stdout?.toString();
    const stderr = error.stderr?.toString();
    if (stdout) console.log('STDOUT:\n', stdout);
    if (stderr) console.log('STDERR:\n', stderr);
    return false;
  }
  
  log.info('Running tenant resolution tests...');
  log.info('Manual test: node temp-tenant-test.js');
  
  return true;
} finally {
  // Always clean up temporary file
  if (require('fs').existsSync(tempFilePath)) {
    require('fs').unlinkSync(tempFilePath);
  }
}
```

### 🔧 ENHANCEMENT: Improve Cache Type Safety  
**File**: `app/lib/redis.ts` - `deserialize` function  
**Issue**: Better JSON parsing logic for cache values.

**REQUIRED FIX**:
```typescript
const deserialize = <T = CacheValue>(value: string | null): T | null => {
  if (value === null) return null;

  // Only attempt JSON parsing for objects/arrays
  if (value.startsWith('{') || value.startsWith('[')) {
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      console.error("Failed to deserialize JSON from Redis:", e);
      return null; // Safer than casting to T
    }
  }
  
  // Return primitive values as-is (strings, numbers stored as strings)
  return value as T;
};
```

## Environment Configuration Updates

Add to `.env.dev`:
```env
# Tenant Configuration
PLATFORM_DOMAIN=growplate.com
TENANT_CACHE_TTL=1800
ALLOW_LOCALHOST=true

# Security
REQUIRE_HTTPS=false
```

Add to production `.env`:
```env
# Tenant Configuration  
PLATFORM_DOMAIN=growplate.com
TENANT_CACHE_TTL=3600
ALLOW_LOCALHOST=false

# Security
REQUIRE_HTTPS=true
```

## Remix Integration Updates

Update your Remix app to use the new middleware:

**File**: `app/entry.server.tsx` or route files:
```typescript
import { tenantMiddleware, getCurrentTenant } from "~/middleware/tenant";

export async function loader({ request }: LoaderFunctionArgs) {
  return await tenantMiddleware(request, async () => {
    const tenant = getCurrentTenant();
    
    if (!tenant) {
      throw new Response("Tenant not found", { status: 404 });
    }

    // Your route logic with tenant context
    return json({ tenant });
  });
}
```

## Database Updates for Tenant Context

Update queries to use the secure tenant pattern:

**Example Before** (vulnerable):
```typescript
// BAD: Relies on broken regex injection
const users = await tenantQuery(
  tenantId,
  "SELECT * FROM users WHERE role = $1",
  ["customer"]
);
```

**Example After** (secure):
```typescript
// GOOD: Explicit tenant filtering
const users = await tenantQuery(
  tenantId,
  "SELECT * FROM users WHERE tenant_id = $1 AND role = $2",
  ["customer"]
);
```

## Acceptance Criteria

- [ ] No global variables for request state (use AsyncLocalStorage)
- [ ] Multi-tenant queries are secure and explicit
- [ ] Domain parsing handles edge cases and is configurable
- [ ] Test scripts clean up resources properly
- [ ] Cache deserialization is robust
- [ ] Request isolation prevents data leakage between tenants
- [ ] Middleware integrates properly with Remix
- [ ] Configuration supports development and production environments
- [ ] Error handling provides useful diagnostics

## Testing Requirements

After fixes:
1. **Concurrency Test**: Multiple simultaneous requests with different tenants shouldn't leak data
2. **Domain Test**: Various domain formats (subdomains, custom domains, localhost) parse correctly  
3. **Security Test**: Attempts to bypass tenant filtering should fail
4. **Performance Test**: AsyncLocalStorage doesn't significantly impact performance
5. **Error Test**: Invalid domains and missing tenants handled gracefully

## Critical Security Notes

⚠️ **CRITICAL**: The original middleware implementation has severe data leakage vulnerabilities:
- Multiple users could see each other's data
- Tenant isolation completely broken under concurrent load
- Multi-tenant queries could return data from wrong tenants

The AsyncLocalStorage approach is essential for production multi-tenant applications.

## Migration Path

1. **Phase 1**: Implement AsyncLocalStorage middleware (highest priority)
2. **Phase 2**: Update all route handlers to use new middleware pattern
3. **Phase 3**: Secure database queries with explicit tenant filtering
4. **Phase 4**: Add comprehensive testing for tenant isolation
5. **Phase 5**: Performance optimization and monitoring