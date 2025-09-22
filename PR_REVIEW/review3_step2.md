## PR Code Suggestions ✨
<!-- 5592cf3 -->

Latest suggestions up to 5592cf3
<table><thead><tr><td><strong>Category</strong></td><td align=left><strong>Suggestion&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; </strong></td><td align=center><strong>Impact</strong></td></tr><tbody><tr><td rowspan=2>Incremental <sup><a href='https://qodo-merge-docs.qodo.ai/core-abilities/incremental_update/'>[*]</a></sup></td>
<td>



<details><summary>Scope tenant setting to transaction</summary>

___

**Wrap the <code>SET LOCAL "app.tenant_id"</code> and the subsequent query in an explicit <br>transaction block (<code>BEGIN</code>/<code>COMMIT</code>) to ensure the tenant setting is correctly <br>applied for Row-Level Security.**

[app/lib/db.ts [148-168]](https://github.com/Liam345/growplate-multi-tenant/pull/4/files#diff-43313aeb0eb48022fc73d3831252457122bdef7102ee2a79673ddfaa3742ac24R148-R168)

```diff
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
-    // Set tenant_id for RLS policies to use
+    await client.query("BEGIN");
     await client.query('SET LOCAL "app.tenant_id" = $1', [tenantId]);
-    
-    // Execute original query without modification - RLS handles tenant isolation
     const result = await client.query<T>(baseQuery, params);
+    await client.query("COMMIT");
     return result;
+  } catch (e) {
+    try { await client.query("ROLLBACK"); } catch {}
+    throw e;
   } finally {
     client.release();
   }
 };
```


- [ ] **Apply / Chat** <!-- /improve --apply_suggestion=0 -->


<details><summary>Suggestion importance[1-10]: 10</summary>

__

Why: This suggestion correctly identifies a critical bug where `SET LOCAL` would have no effect on the query due to transaction scoping, rendering the Row-Level Security ineffective and leading to data leakage. The proposed fix is correct and essential.


</details></details></td><td align=center>High

</td></tr><tr><td>



<details><summary>Prevent stuck Redis connection state</summary>

___

**Refactor the <code>ensureConnection</code> function to more robustly handle Redis connection <br>state. This involves clearing the <code>connectionPromise</code> on both success and failure <br>and re-checking <code>client.isReady</code> to prevent stuck states.**

[app/lib/redis.ts [40-96]](https://github.com/Liam345/growplate-multi-tenant/pull/4/files#diff-137bd413e7e1e4f044c6452cfef4d7116f416144278613fd0c284b1f4f6f1f00R40-R96)

```diff
 // Connection state
 let isConnected = false;
 let isConnecting = false;
 let connectionPromise: Promise<void> | null = null;
 
-/**
- * Ensure Redis connection is established (prevents race conditions)
- */
 const ensureConnection = async (): Promise<void> => {
-  if (isConnected) {
+  if (isConnected && client.isReady) {
     return;
   }
 
   if (connectionPromise) {
     await connectionPromise;
-    return;
+    if (isConnected && client.isReady) return;
+    // fall through to retry if prior attempt didn't yield a ready client
   }
 
   connectionPromise = (async () => {
     try {
       isConnecting = true;
       await client.connect();
+      isConnected = true;
     } catch (error) {
       console.error("Failed to connect to Redis:", error instanceof Error ? error.message : "Unknown error");
-      // Reset for next attempt
+      throw error;
+    } finally {
+      // Always clear the latch; flags are set via event handlers and above
       connectionPromise = null;
       isConnecting = false;
-      throw error;
     }
   })();
 
   await connectionPromise;
+
+  if (!client.isReady) {
+    // Ensure callers can react if not ready after attempt
+    throw new Error("Redis client not ready after connect attempt");
+  }
 };
```


- [ ] **Apply / Chat** <!-- /improve --apply_suggestion=1 -->


<details><summary>Suggestion importance[1-10]: 7</summary>

__

Why: The suggestion improves the robustness of the Redis connection logic by correctly managing state flags and the connection promise, preventing potential stuck states and making reconnection attempts more reliable.


</details></details></td><td align=center>Medium

</td></tr><tr><td rowspan=3>Possible issue</td>
<td>



<details><summary>Fix test script imports</summary>

___

**Update the test script to require compiled JavaScript files from the <code>dist</code> <br>directory instead of non-existent <code>.js</code> files from the <code>app/lib</code> source directory. <br>This ensures the test can run correctly after TypeScript compilation.**

[scripts/test-connections.cjs [38-122]](https://github.com/Liam345/growplate-multi-tenant/pull/4/files#diff-319962d25975552da655a029cc5a4f8ae1fb3520cedeafe1f7ba69ad3797094fR38-R122)

```diff
 const testFile = `
-const { query, healthCheck, getPoolStatus } = require('./app/lib/db.js');
+// Ensure this script is run after TypeScript compilation (npx tsc)
+const { query, healthCheck, getPoolStatus } = require('./dist/app/lib/db.js');
 const { 
   setTenantCache, 
   getTenantCache, 
   healthCheck: redisHealthCheck,
   getConnectionStatus 
-} = require('./app/lib/redis.js');
-...
+} = require('./dist/app/lib/redis.js');
+
+async function runTests() {
+  const results = {
+    postgres: false,
+    redis: false,
+    postgresPool: null,
+    redisStatus: null,
+    errors: []
+  };
+
+  // Test PostgreSQL connection
+  try {
+    console.log('Testing PostgreSQL connection...');
+    results.postgres = await healthCheck();
+    results.postgresPool = getPoolStatus();
+    
+    if (results.postgres) {
+      console.log('✅ PostgreSQL connection successful');
+      console.log('Pool status:', JSON.stringify(results.postgresPool, null, 2));
+    } else {
+      console.log('❌ PostgreSQL connection failed');
+    }
+  } catch (error) {
+    console.log('❌ PostgreSQL connection error:', error.message);
+    results.errors.push(\`PostgreSQL: \${error.message}\`);
+  }
+
+  // Test Redis connection
+  try {
+    console.log('Testing Redis connection...');
+    results.redis = await redisHealthCheck();
+    results.redisStatus = getConnectionStatus();
+    
+    if (results.redis) {
+      console.log('✅ Redis connection successful');
+      console.log('Redis status:', JSON.stringify(results.redisStatus, null, 2));
+      
+      // Test cache operations
+      const testKey = 'test-connection-key';
+      const testValue = { message: 'Hello from Redis!', timestamp: new Date().toISOString() };
+      
+      await setTenantCache('test-tenant', testKey, testValue, { ttl: 30 });
+      const retrieved = await getTenantCache('test-tenant', testKey);
+      
+      if (JSON.stringify(retrieved) === JSON.stringify(testValue)) {
+        console.log('✅ Redis cache operations working');
+      } else {
+        console.log('❌ Redis cache operations failed');
+        results.errors.push('Redis cache operations failed');
+      }
+    } else {
+      console.log('❌ Redis connection failed');
+    }
+  } catch (error) {
+    console.log('❌ Redis connection error:', error.message);
+    results.errors.push(\`Redis: \${error.message}\`);
+  }
+
+  return results;
+}
+
+runTests().then(results => {
+  console.log('\\n=== Test Results ===');
+  console.log(JSON.stringify(results, null, 2));
+  
+  if (results.postgres && results.redis && results.errors.length === 0) {
+    console.log('\\n✅ All database connections are working!');
+    process.exit(0);
+  } else {
+    console.log('\\n❌ Some connections failed. Check the errors above.');
+    process.exit(1);
+  }
+}).catch(error => {
+  console.error('Test runner error:', error);
+  process.exit(1);
+});
 `;
```



`[To ensure code accuracy, apply this suggestion manually]`


<details><summary>Suggestion importance[1-10]: 8</summary>

__

Why: The suggestion correctly identifies that the test script generates code requiring `.js` files that do not exist, as the source is in TypeScript, and proposes a valid fix by pointing to a compiled output directory.


</details></details></td><td align=center>Medium

</td></tr><tr><td>



<details><summary>Enforce transaction around SET LOCAL</summary>

___

**Wrap the <code>tenantQuery</code> logic in an explicit <code>BEGIN</code>/<code>COMMIT</code>/<code>ROLLBACK</code> transaction. <br>This ensures that <code>SET LOCAL "app.tenant_id"</code> reliably applies to the user's <br>query, guaranteeing tenant isolation.**

[app/lib/db.ts [148-168]](https://github.com/Liam345/growplate-multi-tenant/pull/4/files#diff-43313aeb0eb48022fc73d3831252457122bdef7102ee2a79673ddfaa3742ac24R148-R168)

```diff
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
-    // Set tenant_id for RLS policies to use
+    await client.query("BEGIN");
     await client.query('SET LOCAL "app.tenant_id" = $1', [tenantId]);
-    
-    // Execute original query without modification - RLS handles tenant isolation
     const result = await client.query<T>(baseQuery, params);
+    await client.query("COMMIT");
     return result;
+  } catch (err) {
+    try {
+      await client.query("ROLLBACK");
+    } catch {
+      // ignore rollback errors
+    }
+    throw err;
   } finally {
     client.release();
   }
 };
```


- [ ] **Apply / Chat** <!-- /improve --apply_suggestion=3 -->


<details><summary>Suggestion importance[1-10]: 8</summary>

__

Why: The suggestion correctly identifies that `SET LOCAL` should be wrapped in an explicit transaction to guarantee its scope covers the subsequent query, which is a critical detail for ensuring the reliability of the Row-Level Security implementation.


</details></details></td><td align=center>Medium

</td></tr><tr><td>



<details><summary>Harden Redis connection state</summary>

___

**Refactor the Redis <code>ensureConnection</code> logic to improve state management. Clear the <br><code>connectionPromise</code> after a successful connection and reset it on connection <code>end</code> <br>or <code>error</code> events to prevent stale states and ensure robust reconnection.**

[app/lib/redis.ts [40-96]](https://github.com/Liam345/growplate-multi-tenant/pull/4/files#diff-137bd413e7e1e4f044c6452cfef4d7116f416144278613fd0c284b1f4f6f1f00R40-R96)

```diff
 // Connection state
 let isConnected = false;
 let isConnecting = false;
 let connectionPromise: Promise<void> | null = null;
 
 // Handle Redis events
 client.on("connect", () => {
   console.log("Redis client connecting...");
   isConnecting = true;
 });
 
 client.on("ready", () => {
   console.log("Redis client connected and ready");
   isConnected = true;
   isConnecting = false;
 });
 
 client.on("error", (error) => {
-  console.error("Redis client error:", error);
+  console.error("Redis client error:", error instanceof Error ? error.message : "Unknown error");
   isConnected = false;
   isConnecting = false;
+  // Allow future reconnect attempts
+  connectionPromise = null;
 });
 
 client.on("end", () => {
   console.log("Redis client connection ended");
   isConnected = false;
   isConnecting = false;
+  connectionPromise = null;
 });
 
 /**
  * Ensure Redis connection is established (prevents race conditions)
  */
 const ensureConnection = async (): Promise<void> => {
-  if (isConnected) {
+  // Prefer checking the client's own readiness
+  if (client.isReady) {
+    isConnected = true;
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
+      // After successful connect, mark ready and clear the gate
+      isConnected = client.isReady;
+      isConnecting = false;
+      connectionPromise = null;
     } catch (error) {
       console.error("Failed to connect to Redis:", error instanceof Error ? error.message : "Unknown error");
       // Reset for next attempt
       connectionPromise = null;
       isConnecting = false;
       throw error;
     }
   })();
 
   await connectionPromise;
 };
```


- [ ] **Apply / Chat** <!-- /improve --apply_suggestion=4 -->


<details><summary>Suggestion importance[1-10]: 7</summary>

__

Why: The suggestion correctly points out that the `connectionPromise` is not cleared on success, but the PR code already handles this by checking `isConnected` first, making the practical impact of the proposed change minor.


</details></details></td><td align=center>Medium

</td></tr>
<tr><td align="center" colspan="2">

- [ ] More <!-- /improve --more_suggestions=true -->

</td><td></td></tr></tbody></table>

___

#### Previous suggestions
<details><summary>✅ Suggestions up to commit f354000</summary>
<br><table><thead><tr><td><strong>Category</strong></td><td align=left><strong>Suggestion&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; </strong></td><td align=center><strong>Impact</strong></td></tr><tbody><tr><td rowspan=1>High-level</td>
<td>



<details><summary>Rethink the multi-tenant query implementation</summary>

___

**The current method of injecting <code>tenant_id</code> into SQL queries via string <br>replacement is unsafe and risks data leakage. Adopt a more secure approach like <br>a query builder or PostgreSQL's Row-Level Security.**


### Examples:



<details>
<summary>
<a href="https://github.com/Liam345/growplate-multi-tenant/pull/4/files#diff-43313aeb0eb48022fc73d3831252457122bdef7102ee2a79673ddfaa3742ac24R139-R167">app/lib/db.ts [139-167]</a>
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
// app/lib/db.ts
export const tenantQuery = async (tenantId, baseQuery, params) => {
  const tenantParams = [tenantId, ...params];
  let modifiedQuery = baseQuery;

  // Fragile string replacement to inject tenant_id
  if (baseQuery.toLowerCase().includes("where")) {
    modifiedQuery = baseQuery.replace(
      /where/i,
      "WHERE tenant_id = $1 AND"
    );
  } else if (baseQuery.toLowerCase().includes("from")) {
    modifiedQuery = baseQuery.replace(
      /(from\s+\w+)/i,
      "$1 WHERE tenant_id = $1"
    );
  }

  return query(modifiedQuery, tenantParams); // This is buggy
};

```



#### After:
```typescript
// app/lib/db.ts - Using Row-Level Security (RLS)
export const tenantQuery = async (tenantId, baseQuery, params) => {
  const client = await pool.connect();
  try {
    // Set tenant_id for the current transaction.
    // RLS policies in the database will use this setting to filter data.
    await client.query(`SET LOCAL "app.tenant_id" = '${tenantId}'`);
    
    // The original query can be executed without modification.
    const result = await client.query(baseQuery, params);
    return result;
  } finally {
    client.release();
  }
};

```




<details><summary>Suggestion importance[1-10]: 10</summary>

__

Why: The suggestion correctly identifies a critical security flaw in the `tenantQuery` implementation, where fragile string replacement can lead to data leakage between tenants, which is a severe issue for a multi-tenant application.


</details></details></td><td align=center>High

</td></tr><tr><td rowspan=3>Possible issue</td>
<td>



<details><summary><s>Fix broken multi-tenant query logic<!-- not_implemented --></s></summary>

___

**Refactor the <code>tenantQuery</code> function to correctly re-index existing query <br>parameters when injecting the <code>tenant_id</code> condition, preventing query failures and <br>incorrect data access.**

[app/lib/db.ts [151-164]](https://github.com/Liam345/growplate-multi-tenant/pull/4/files#diff-43313aeb0eb48022fc73d3831252457122bdef7102ee2a79673ddfaa3742ac24R151-R164)

```diff
-// Inject tenant_id condition into WHERE clause or add WHERE clause
-let modifiedQuery = baseQuery;
-if (baseQuery.toLowerCase().includes("where")) {
-  modifiedQuery = baseQuery.replace(
-    /where/i,
-    "WHERE tenant_id = $1 AND"
-  );
-} else if (baseQuery.toLowerCase().includes("from")) {
-  // Find the FROM clause and add WHERE after it
-  modifiedQuery = baseQuery.replace(
-    /(from\s+\w+)/i,
-    "$1 WHERE tenant_id = $1"
-  );
+// Re-index existing parameters
+const reindexedQuery = baseQuery.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n, 10) + 1}`);
+
+// Inject tenant_id condition
+let modifiedQuery;
+const whereMatch = reindexedQuery.match(/where/i);
+
+if (whereMatch && whereMatch.index !== undefined) {
+  // Find the position of the first WHERE clause
+  const whereIndex = whereMatch.index;
+  // Inject the tenant_id condition after "WHERE"
+  modifiedQuery = 
+    reindexedQuery.slice(0, whereIndex + 5) + // "WHERE" is 5 chars
+    ` tenant_id = $1 AND (` + 
+    reindexedQuery.slice(whereIndex + 5) + 
+    `)`;
+} else {
+  // No WHERE clause, so add one. This is a simplified approach.
+  // A more robust solution might need to consider GROUP BY, ORDER BY, etc.
+  const fromClauseEnd = reindexedQuery.toLowerCase().lastIndexOf('from ');
+  const nextClauseIndex = reindexedQuery.substring(fromClauseEnd).search(/group by|order by|limit|offset/i);
+  
+  if (nextClauseIndex > -1) {
+    const insertionPoint = fromClauseEnd + nextClauseIndex;
+    modifiedQuery = `${reindexedQuery.slice(0, insertionPoint)}WHERE tenant_id = $1 ${reindexedQuery.slice(insertionPoint)}`;
+  } else {
+    modifiedQuery = `${reindexedQuery} WHERE tenant_id = $1`;
+  }
 }
```


`[Suggestion processed]`


<details><summary>Suggestion importance[1-10]: 10</summary>

__

Why: The suggestion correctly identifies a critical bug in the `tenantQuery` function where parameter indexing is not updated, which would break most multi-tenant queries and corrupt data access.

</details></details></td><td align=center>High

</td></tr><tr><td>



<details><summary>✅ <s>Ensure type safety in deserialization</s></summary>

___

<details><summary><b>Suggestion Impact:</b></summary>The commit updated deserialize to log a warning and return null on JSON.parse failure, replacing the previous behavior of returning the original string, thus implementing the suggested type-safe approach.


code diff:

```diff
 /**
- * Deserialize a value from Redis storage
+ * Deserialize a value from Redis storage with type safety
  */
 const deserialize = <T = CacheValue>(value: string | null): T | null => {
   if (value === null) return null;
@@ -118,8 +126,9 @@
   try {
     return JSON.parse(value) as T;
   } catch {
-    // If parsing fails, return as string
-    return value as T;
+    // If parsing fails, the data is corrupt or not JSON
+    console.warn("Redis deserialize: Failed to parse cached value as JSON");
+    return null;
   }
```

</details>


___

**Modify the <code>deserialize</code> function to return <code>null</code> when <code>JSON.parse</code> fails, preventing <br>type-safety issues and subsequent runtime errors.**

[app/lib/redis.ts [115-124]](https://github.com/Liam345/growplate-multi-tenant/pull/4/files#diff-137bd413e7e1e4f044c6452cfef4d7116f416144278613fd0c284b1f4f6f1f00R115-R124)

```diff
 const deserialize = <T = CacheValue>(value: string | null): T | null => {
   if (value === null) return null;
   
   try {
+    // Attempt to parse the value as JSON.
     return JSON.parse(value) as T;
   } catch {
-    // If parsing fails, return as string
-    return value as T;
+    // If parsing fails, the data is corrupt or not JSON.
+    // Return null to indicate failure and ensure type safety.
+    console.warn("Redis deserialize: Failed to parse cached value as JSON.");
+    return null;
   }
 };
```


`[Suggestion processed]`


<details><summary>Suggestion importance[1-10]: 9</summary>

__

Why: The suggestion correctly identifies a critical type-safety issue in the `deserialize` function that would lead to runtime errors by incorrectly casting a string to an expected object type.

</details></details></td><td align=center>High

</td></tr><tr><td>



<details><summary>✅ <s>Prevent Redis connection race conditions</s></summary>

___

<details><summary><b>Suggestion Impact:</b></summary>The commit introduced a connectionPromise and rewrote ensureConnection to await an existing promise or create one, preventing multiple concurrent connects—implementing the suggested promise-based gate.


code diff:

```diff
+let connectionPromise: Promise<void> | null = null;
 
 // Handle Redis events
 client.on("connect", () => {
@@ -66,25 +67,32 @@
 });
 
 /**
- * Ensure Redis connection is established
+ * Ensure Redis connection is established (prevents race conditions)
  */
 const ensureConnection = async (): Promise<void> => {
-  if (isConnected) return;
-  
-  if (isConnecting) {
-    // Wait for connection to complete
-    while (isConnecting) {
-      await new Promise(resolve => setTimeout(resolve, 100));
+  if (isConnected) {
+    return;
+  }
+
+  if (connectionPromise) {
+    await connectionPromise;
+    return;
+  }
+
+  connectionPromise = (async () => {
+    try {
+      isConnecting = true;
+      await client.connect();
+    } catch (error) {
+      console.error("Failed to connect to Redis:", error instanceof Error ? error.message : "Unknown error");
+      // Reset for next attempt
+      connectionPromise = null;
+      isConnecting = false;
+      throw error;
     }
-    return;
-  }
-
-  try {
-    await client.connect();
-  } catch (error) {
-    console.error("Failed to connect to Redis:", error);
-    throw error;
-  }
+  })();
+
+  await connectionPromise;
 };
```

</details>


___

**Refactor <code>ensureConnection</code> to use a promise-based gate, preventing race <br>conditions where multiple concurrent requests could attempt to connect to Redis <br>simultaneously.**

[app/lib/redis.ts [71-88]](https://github.com/Liam345/growplate-multi-tenant/pull/4/files#diff-137bd413e7e1e4f044c6452cfef4d7116f416144278613fd0c284b1f4f6f1f00R71-R88)

```diff
+let connectionPromise: Promise<void> | null = null;
+
 const ensureConnection = async (): Promise<void> => {
-  if (isConnected) return;
-  
-  if (isConnecting) {
-    // Wait for connection to complete
-    while (isConnecting) {
-      await new Promise(resolve => setTimeout(resolve, 100));
-    }
+  if (isConnected) {
     return;
   }
 
-  try {
-    await client.connect();
-  } catch (error) {
-    console.error("Failed to connect to Redis:", error);
-    throw error;
+  if (connectionPromise) {
+    await connectionPromise;
+    return;
   }
+
+  connectionPromise = (async () => {
+    try {
+      isConnecting = true;
+      await client.connect();
+    } catch (error) {
+      console.error("Failed to connect to Redis:", error);
+      // Reset for next attempt
+      connectionPromise = null;
+      isConnecting = false;
+      throw error;
+    }
+  })();
+
+  await connectionPromise;
 };
```


`[Suggestion processed]`


<details><summary>Suggestion importance[1-10]: 8</summary>

__

Why: The suggestion correctly identifies a race condition in the `ensureConnection` function and proposes a robust, promise-based solution that prevents multiple connection attempts and inefficient polling.

</details></details></td><td align=center>Medium

</td></tr><tr><td rowspan=1>General</td>
<td>



<details><summary>✅ <s>Avoid blocking Redis with <code>KEYS</code> command</s></summary>

___

<details><summary><b>Suggestion Impact:</b></summary>The commit replaced the KEYS usage with a SCAN loop to collect keys and then delete them, implementing the suggested non-blocking approach in clearTenantCache.


code diff:

```diff
 /**
- * Clear all cache entries for a specific tenant
+ * Clear all cache entries for a specific tenant using non-blocking SCAN
  */
 export const clearTenantCache = async (tenantId: string): Promise<number> => {
   try {
     await ensureConnection();
     
     const pattern = getTenantKey(tenantId, "*");
-    const keys = await client.keys(pattern);
-    
-    if (keys.length === 0) return 0;
-    
-    const deleted = await client.del(keys);
+    const keysToDelete: string[] = [];
+    let cursor = 0;
+
+    // Use non-blocking SCAN instead of blocking KEYS
+    do {
+      const reply = await client.scan(cursor, { MATCH: pattern, COUNT: 100 });
+      cursor = reply.cursor;
+      keysToDelete.push(...reply.keys);
+    } while (cursor !== 0);
+
+    if (keysToDelete.length === 0) {
+      return 0;
+    }
+    
+    const deleted = await client.del(keysToDelete);
     return deleted;
   } catch (error) {
-    console.error("Redis clear tenant cache error:", error);
+    console.error("Redis clear tenant cache error:", {
+      operation: "clearTenantCache",
+      error: error instanceof Error ? error.message : "Unknown error"
+    });
     return 0;
   }
 };
```

</details>


___

**Replace the blocking <code>KEYS</code> command with the non-blocking <code>SCAN</code> command in <br><code>clearTenantCache</code> to avoid performance degradation on the Redis server in <br>production environments.**

[app/lib/redis.ts [260-275]](https://github.com/Liam345/growplate-multi-tenant/pull/4/files#diff-137bd413e7e1e4f044c6452cfef4d7116f416144278613fd0c284b1f4f6f1f00R260-R275)

```diff
 export const clearTenantCache = async (tenantId: string): Promise<number> => {
   try {
     await ensureConnection();
     
     const pattern = getTenantKey(tenantId, "*");
-    const keys = await client.keys(pattern);
+    const keysToDelete: string[] = [];
+    let cursor = 0;
+
+    do {
+      const reply = await client.scan(cursor, { MATCH: pattern, COUNT: 100 });
+      cursor = reply.cursor;
+      keysToDelete.push(...reply.keys);
+    } while (cursor !== 0);
+
+    if (keysToDelete.length === 0) {
+      return 0;
+    }
     
-    if (keys.length === 0) return 0;
-    
-    const deleted = await client.del(keys);
+    const deleted = await client.del(keysToDelete);
     return deleted;
   } catch (error) {
     console.error("Redis clear tenant cache error:", error);
     return 0;
   }
 };
```


`[Suggestion processed]`


<details><summary>Suggestion importance[1-10]: 8</summary>

__

Why: The suggestion correctly identifies the use of the blocking `KEYS` command, which is a significant performance risk in production, and replaces it with the non-blocking `SCAN` command.

</details></details></td><td align=center>Medium

</td></tr>
<tr><td align="center" colspan="2">

 <!-- /improve_multi --more_suggestions=true -->

</td><td></td></tr></tbody></table>

</details>
