## PR Reviewer Guide 🔍

Here are some key observations to aid the review process:

<table>
<tr><td>⏱️&nbsp;<strong>Estimated effort to review</strong>: 4 🔵🔵🔵🔵⚪</td></tr>
<tr><td>🧪&nbsp;<strong>No relevant tests</strong></td></tr>
<tr><td>🔒&nbsp;<strong>No security concerns identified</strong></td></tr>
<tr><td>⚡&nbsp;<strong>Recommended focus areas for review</strong><br><br>

<details><summary><a href='https://github.com/Liam345/growplate-multi-tenant/pull/5/files#diff-43313aeb0eb48022fc73d3831252457122bdef7102ee2a79673ddfaa3742ac24R140-R167'><strong>Possible Issue</strong></a>

The multi-tenant query injection in `tenantQuery` uses `$1` both for the tenant_id parameter and within the regex replacement for WHERE, which likely produces invalid SQL or misplaces conditions. The simplistic string replace for "where"/"from" is fragile and could break queries.
</summary>

```typescript
  tenantId: string,
  baseQuery: string,
  params: QueryParameters = []
): Promise<QueryResult<T>> => {
  if (!tenantId) {
    throw new Error("Tenant ID is required for all database operations");
  }

  // Add tenant_id as the first parameter
  const tenantParams = [tenantId, ...params];

  // Inject tenant_id condition into WHERE clause or add WHERE clause
  let modifiedQuery = baseQuery;
  if (baseQuery.toLowerCase().includes("where")) {
    modifiedQuery = baseQuery.replace(
      /where/i,
      "WHERE tenant_id = $1 AND"
    );
  } else if (baseQuery.toLowerCase().includes("from")) {
    // Find the FROM clause and add WHERE after it
    modifiedQuery = baseQuery.replace(
      /(from\s+\w+)/i,
      "$1 WHERE tenant_id = $1"
    );
  }

  return query<T>(modifiedQuery, tenantParams);
};
```

</details>

<details><summary><a href='https://github.com/Liam345/growplate-multi-tenant/pull/5/files#diff-38e34820bf3adad7459b248b5a6ce5e52a66ebf780b1f46d53889369a6f8fe7dR37-R65'><strong>Concurrency Risk</strong></a>

Middleware stores `currentTenant` and `currentResolution` in module-level variables, which are shared across requests. In a server with concurrent requests, this can cause cross-request leakage. Prefer request-scoped context (e.g., AsyncLocalStorage) or pass through function args.
</summary>

```typescript
// Store tenant context for the current request
// This uses AsyncLocalStorage-like pattern for Remix
let currentTenant: TenantContext | null = null;
let currentResolution: TenantResolutionResult | null = null;

/**
 * Get current tenant from request context
 */
export function getCurrentTenant(): TenantContext | null {
  return currentTenant;
}

/**
 * Get current tenant resolution result
 */
export function getCurrentTenantResolution(): TenantResolutionResult | null {
  return currentResolution;
}

/**
 * Set current tenant context (internal use)
 */
function setCurrentTenant(
  tenant: TenantContext | null,
  resolution: TenantResolutionResult | null
) {
  currentTenant = tenant;
  currentResolution = resolution;
}
```

</details>

<details><summary><a href='https://github.com/Liam345/growplate-multi-tenant/pull/5/files#diff-833d0c8931dab023bbacbfa2797f9c2d5b59978d2086564ffd64818712b2a8ffR66-R93'><strong>Domain Parsing Robustness</strong></a>

`parseDomain` assumes platform domain `growplate.com` and takes the first label as subdomain. It doesn't handle multi-level subdomains, public suffixes, or case normalization for subdomain cache keys consistently with domain normalization. Consider normalizing and making base domain configurable.
</summary>

```typescript
// Check if this is a subdomain of our platform (e.g., restaurant.growplate.com)
const isSubdomainOfPlatform =
  parts.length >= 3 && parts.slice(-2).join(".") === "growplate.com"; // Configure this for your platform

let domain: string;
let subdomain: string | null = null;
let isCustomDomain: boolean;

if (isSubdomainOfPlatform) {
  // Extract subdomain from restaurant.growplate.com
  subdomain = parts[0];
  domain = parts.slice(1).join(".");
  isCustomDomain = false;
} else {
  // Custom domain like restaurant.com
  domain = hostPart;
  subdomain = null;
  isCustomDomain = true;
}

return {
  hostname: cleanHostname,
  domain,
  subdomain,
  port: port || null,
  isCustomDomain,
  isLocalhost: false,
};
```

</details>

</td></tr>
</table>


## PR Code Suggestions ✨

<!-- 9f47a54 -->

Explore these optional code suggestions:

<table><thead><tr><td><strong>Category</strong></td><td align=left><strong>Suggestion&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; </strong></td><td align=center><strong>Impact</strong></td></tr><tbody><tr><td rowspan=1>High-level</td>
<td>



<details><summary>Revise multi-tenancy implementation to ensure data isolation</summary>

___

**The multi-tenancy implementation should be revised to fix critical data <br>isolation flaws. Replace the global variables in the middleware with <br><code>AsyncLocalStorage</code> to prevent data leakage between concurrent requests, and <br>substitute the unsafe regex-based query modification with a robust query builder <br>to ensure secure tenant data scoping.**


### Examples:



<details>
<summary>
<a href="https://github.com/Liam345/growplate-multi-tenant/pull/5/files#diff-38e34820bf3adad7459b248b5a6ce5e52a66ebf780b1f46d53889369a6f8fe7dR39-R65">app/middleware/tenant.ts [39-65]</a>
</summary>



```typescript
let currentTenant: TenantContext | null = null;
let currentResolution: TenantResolutionResult | null = null;

/**
 * Get current tenant from request context
 */
export function getCurrentTenant(): TenantContext | null {
  return currentTenant;
}


 ... (clipped 17 lines)
```
</details>



<details>
<summary>
<a href="https://github.com/Liam345/growplate-multi-tenant/pull/5/files#diff-43313aeb0eb48022fc73d3831252457122bdef7102ee2a79673ddfaa3742ac24R139-R167">app/lib/db.ts [139-167]</a>
</summary>



```typescript
export const tenantQuery = async <T extends QueryResultRow = any>(
  tenantId: string,
  baseQuery: string,
  params: QueryParameters = []
): Promise<QueryResult<T>> => {
  if (!tenantId) {
    throw new Error("Tenant ID is required for all database operations");
  }

  // Add tenant_id as the first parameter

 ... (clipped 19 lines)
```
</details>




### Solution Walkthrough:



#### Before:
```typescript
// app/middleware/tenant.ts
let currentTenant: TenantContext | null = null;

function setCurrentTenant(tenant: TenantContext | null) {
  currentTenant = tenant;
}

export async function tenantMiddleware(request: Request) {
    const resolution = await resolveTenant(request.hostname);
    setCurrentTenant(resolution.tenant);
    // ...
}

// app/lib/db.ts
export const tenantQuery = async (tenantId, baseQuery) => {
    let modifiedQuery = baseQuery.replace(/where/i, "WHERE tenant_id = $1 AND");
    // ... more brittle string replacement
    return query(modifiedQuery, [tenantId, ...params]);
};

```



#### After:
```typescript
// app/middleware/tenant.ts
import { AsyncLocalStorage } from 'async_hooks';

const tenantContext = new AsyncLocalStorage<TenantContext | null>();

export function getCurrentTenant() {
  return tenantContext.getStore();
}

export async function tenantMiddleware(request: Request, next: () => Promise<Response>) {
  const resolution = await resolveTenant(request.hostname);
  return tenantContext.run(resolution.tenant, next);
}

// app/lib/db.ts
import { sql } from 'slonik';

export const tenantQuery = async (tenantId, baseQuery) => {
    // Use a safe query builder that understands SQL syntax
    const finalQuery = sql.type(MyType)`${baseQuery} WHERE tenant_id = ${tenantId}`;
    return db.query(finalQuery);
};

```




<details><summary>Suggestion importance[1-10]: 10</summary>

__

Why: The suggestion correctly identifies two critical architectural flaws: the use of global variables for request context, causing data leakage between users, and an unsafe regex-based query modification for tenant isolation, which is brittle and insecure.


</details></details></td><td align=center>High

</td></tr><tr><td rowspan=3>Possible issue</td>
<td>



<details><summary>Fix race condition with AsyncLocalStorage</summary>

___

**Replace the unsafe module-level variables used for storing request context with <br><code>AsyncLocalStorage</code> to prevent race conditions and ensure request-specific data <br>isolation.**

[app/middleware/tenant.ts [37-65]](https://github.com/Liam345/growplate-multi-tenant/pull/5/files#diff-38e34820bf3adad7459b248b5a6ce5e52a66ebf780b1f46d53889369a6f8fe7dR37-R65)

```diff
-// Store tenant context for the current request
-// This uses AsyncLocalStorage-like pattern for Remix
-let currentTenant: TenantContext | null = null;
-let currentResolution: TenantResolutionResult | null = null;
+import { AsyncLocalStorage } from "async_hooks";
+
+interface TenantRequestContext {
+  tenant: TenantContext | null;
+  resolution: TenantResolutionResult | null;
+}
+
+const tenantContextStorage = new AsyncLocalStorage<TenantRequestContext>();
 
 /**
  * Get current tenant from request context
  */
 export function getCurrentTenant(): TenantContext | null {
-  return currentTenant;
+  return tenantContextStorage.getStore()?.tenant ?? null;
 }
 
 /**
  * Get current tenant resolution result
  */
 export function getCurrentTenantResolution(): TenantResolutionResult | null {
-  return currentResolution;
+  return tenantContextStorage.getStore()?.resolution ?? null;
 }
 
 /**
  * Set current tenant context (internal use)
  */
 function setCurrentTenant(
   tenant: TenantContext | null,
   resolution: TenantResolutionResult | null
 ) {
-  currentTenant = tenant;
-  currentResolution = resolution;
+  const store = tenantContextStorage.getStore();
+  if (store) {
+    store.tenant = tenant;
+    store.resolution = resolution;
+  }
 }
 
+// You will also need to wrap your middleware execution to establish the context.
+// For example, in your main middleware function:
+/*
+return async function tenantMiddleware(request: Request): Promise<{...}> {
+  return tenantContextStorage.run({ tenant: null, resolution: null }, async () => {
+    // ... existing middleware logic ...
+  });
+}
+*/
+
```



`[To ensure code accuracy, apply this suggestion manually]`


<details><summary>Suggestion importance[1-10]: 10</summary>

__

Why: This suggestion correctly identifies a critical race condition that would cause data leakage between tenants in a concurrent environment, which is a major security and functionality bug.

</details></details></td><td align=center>High

</td></tr><tr><td>



<details><summary>Improve cache deserialization type safety</summary>

___

**Improve the <code>deserialize</code> function's type safety by only attempting to <code>JSON.parse</code> <br>values that are explicitly formatted as JSON objects or arrays, preventing <br>incorrect type coercion for simple string values.**

[app/lib/redis.ts [115-124]](https://github.com/Liam345/growplate-multi-tenant/pull/5/files#diff-137bd413e7e1e4f044c6452cfef4d7116f416144278613fd0c284b1f4f6f1f00R115-R124)

```diff
 const deserialize = <T = CacheValue>(value: string | null): T | null => {
   if (value === null) return null;
+
+  // Only attempt to parse what looks like a JSON object or array.
+  if (value.startsWith('{') || value.startsWith('[')) {
+    try {
+      return JSON.parse(value) as T;
+    } catch (e) {
+      console.error("Failed to deserialize JSON from Redis:", e);
+      // Fallback to returning the raw value if it's what the type expects,
+      // otherwise it's better to return null to indicate a failure.
+      return value as T;
+    }
+  }
   
-  try {
-    return JSON.parse(value) as T;
-  } catch {
-    // If parsing fails, return as string
-    return value as T;
-  }
+  // For primitive types stored as strings (e.g. numbers, booleans, or just strings)
+  // that were not JSON.stringified objects/arrays.
+  return value as T;
 };
```


- [ ] **Apply / Chat** <!-- /improve --apply_suggestion=2 -->


<details><summary>Suggestion importance[1-10]: 6</summary>

__

Why: The suggestion improves the robustness of the cache deserialization logic, preventing subtle type-related bugs by making the parsing behavior more explicit and less prone to accidental type coercion.

</details></details></td><td align=center>Low

</td></tr><tr><td>



<details><summary>Prevent temporary file resource leaks</summary>

___

**Use a <code>finally</code> block to ensure the temporary file <code>temp-db-test.js</code> is always <br>deleted, even if the TypeScript compilation check fails and causes an early <br>return.**

[scripts/test-connections.cjs [128-149]](https://github.com/Liam345/growplate-multi-tenant/pull/5/files#diff-319962d25975552da655a029cc5a4f8ae1fb3520cedeafe1f7ba69ad3797094fR128-R149)

```diff
+const tempFilePath = path.join(process.cwd(), 'temp-db-test.js');
 try {
-  execSync('npx tsc --noEmit', { cwd: process.cwd(), stdio: 'pipe' });
-  log.success('TypeScript compilation successful');
-} catch (error) {
-  log.error('TypeScript compilation failed');
-  console.log(error.stdout?.toString() || error.stderr?.toString());
-  return false;
+  // ... (code to write temp file) ...
+
+  try {
+    execSync('npx tsc --noEmit', { cwd: process.cwd(), stdio: 'pipe' });
+    log.success('TypeScript compilation successful');
+  } catch (error) {
+    log.error('TypeScript compilation failed');
+    console.log(error.stdout?.toString() || error.stderr?.toString());
+    return false;
+  }
+  
+  log.info('Running connection tests...');
+  
+  // ... (logging instructions) ...
+  
+  return true;
+} finally {
+  // Clean up
+  if (require('fs').existsSync(tempFilePath)) {
+    require('fs').unlinkSync(tempFilePath);
+  }
 }
 
-log.info('Running connection tests...');
-
-// Note: Actual connection tests require database servers to be running
-// We'll provide instructions instead of failing
-log.warning('Database connection tests require running PostgreSQL and Redis servers');
-log.info('To test connections manually:');
-log.info('1. Start PostgreSQL: brew services start postgresql (macOS) or docker run postgres');
-log.info('2. Start Redis: brew services start redis (macOS) or docker run redis');
-log.info('3. Copy .env.example to .env and update credentials');
-log.info('4. Run: node temp-db-test.js');
-
-// Clean up
-require('fs').unlinkSync(path.join(process.cwd(), 'temp-db-test.js'));
-
```



`[To ensure code accuracy, apply this suggestion manually]`


<details><summary>Suggestion importance[1-10]: 6</summary>

__

Why: The suggestion correctly identifies a resource leak where a temporary file is not deleted on a specific failure path. Using a `finally` block is the correct pattern to ensure cleanup, improving the script's robustness.


</details></details></td><td align=center>Low

</td></tr><tr><td rowspan=1>Security</td>
<td>



<details><summary>Improve multi-tenant query security</summary>

___

**Refactor the <code>tenantQuery</code> function to remove the brittle regex-based query <br>modification and instead require developers to explicitly include a <code>tenant_id = </code><br><code>$1</code> clause for improved security and robustness.**

[app/lib/db.ts [139-167]](https://github.com/Liam345/growplate-multi-tenant/pull/5/files#diff-43313aeb0eb48022fc73d3831252457122bdef7102ee2a79673ddfaa3742ac24R139-R167)

```diff
 export const tenantQuery = async <T extends QueryResultRow = any>(
   tenantId: string,
   baseQuery: string,
   params: QueryParameters = []
 ): Promise<QueryResult<T>> => {
   if (!tenantId) {
     throw new Error("Tenant ID is required for all database operations");
   }
 
+  // Ensure the query is designed for multi-tenancy.
+  if (!baseQuery.includes("tenant_id = $1")) {
+    console.error("Security risk: tenantQuery called with a query that does not include 'tenant_id = $1'. Query:", baseQuery);
+    throw new Error("Query is not properly tenant-scoped. It must include 'tenant_id = $1'.");
+  }
+
   // Add tenant_id as the first parameter
   const tenantParams = [tenantId, ...params];
   
-  // Inject tenant_id condition into WHERE clause or add WHERE clause
-  let modifiedQuery = baseQuery;
-  if (baseQuery.toLowerCase().includes("where")) {
-    modifiedQuery = baseQuery.replace(
-      /where/i,
-      "WHERE tenant_id = $1 AND"
-    );
-  } else if (baseQuery.toLowerCase().includes("from")) {
-    // Find the FROM clause and add WHERE after it
-    modifiedQuery = baseQuery.replace(
-      /(from\s+\w+)/i,
-      "$1 WHERE tenant_id = $1"
-    );
-  }
-
-  return query<T>(modifiedQuery, tenantParams);
+  return query<T>(baseQuery, tenantParams);
 };
```


- [ ] **Apply / Chat** <!-- /improve --apply_suggestion=4 -->


<details><summary>Suggestion importance[1-10]: 9</summary>

__

Why: The suggestion addresses a significant security risk where the automatic injection of `tenant_id` could fail on complex queries, potentially leading to data leakage between tenants.

</details></details></td><td align=center>High

</td></tr><tr><td rowspan=1>General</td>
<td>



<details><summary>Improve error logging for diagnostics</summary>

___

**Improve error logging for the <code>execSync</code> command by printing both <code>stdout</code> and <br><code>stderr</code> in the <code>catch</code> block, ensuring all diagnostic information is visible on <br>failure.**

[scripts/test-connections.cjs [128-135]](https://github.com/Liam345/growplate-multi-tenant/pull/5/files#diff-319962d25975552da655a029cc5a4f8ae1fb3520cedeafe1f7ba69ad3797094fR128-R135)

```diff
 try {
   execSync('npx tsc --noEmit', { cwd: process.cwd(), stdio: 'pipe' });
   log.success('TypeScript compilation successful');
 } catch (error) {
   log.error('TypeScript compilation failed');
-  console.log(error.stdout?.toString() || error.stderr?.toString());
+  const stdout = error.stdout?.toString();
+  const stderr = error.stderr?.toString();
+  if (stdout) console.log('STDOUT:\n', stdout);
+  if (stderr) console.log('STDERR:\n', stderr);
   return false;
 }
```


- [ ] **Apply / Chat** <!-- /improve --apply_suggestion=5 -->


<details><summary>Suggestion importance[1-10]: 5</summary>

__

Why: The suggestion correctly points out that logging only `stdout` or `stderr` can hide information. The proposed change to log both streams improves the script's diagnostic output, which is a valuable quality improvement for a test script.


</details></details></td><td align=center>Low

</td></tr>
<tr><td align="center" colspan="2">

- [ ] More <!-- /improve --more_suggestions=true -->

</td><td></td></tr></tbody></table>

