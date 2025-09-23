## PR Reviewer Guide 🔍

Here are some key observations to aid the review process:

<table>
<tr><td>⏱️&nbsp;<strong>Estimated effort to review</strong>: 3 🔵🔵🔵⚪⚪</td></tr>
<tr><td>🧪&nbsp;<strong>No relevant tests</strong></td></tr>
<tr><td>🔒&nbsp;<strong>Security concerns</strong><br><br>

<strong>Authorization:</strong><br> The PUT /api/features endpoint lacks explicit role/authorization checks; if middleware isn’t enforcing auth upstream (not shown here), tenants could be modified by unauthorized users. Ensure this route is protected or add role validation.</td></tr>
<tr><td>⚡&nbsp;<strong>Recommended focus areas for review</strong><br><br>

<details><summary><a href='https://github.com/Liam345/growplate-multi-tenant/pull/6/files#diff-80a3784a372f807e70af6cdec57a52e74f9d607ea2b76b6f43e334ba59a4114fR56-R63'><strong>Possible Issue</strong></a>

The service falls back to returning default features on any error in getTenantFeatures, which may mask outages and flip features unexpectedly at runtime. Consider distinguishing cache vs. DB errors and surfacing failures appropriately or adding a feature flag to control fallback behavior.
</summary>

```typescript
    return dbFeatures;
  } catch (error) {
    console.error('Failed to get tenant features:', error);

    // Return default features on error for graceful degradation
    return { ...DEFAULT_FEATURES };
  }
}
```

</details>

<details><summary><a href='https://github.com/Liam345/growplate-multi-tenant/pull/6/files#diff-80a3784a372f807e70af6cdec57a52e74f9d607ea2b76b6f43e334ba59a4114fR77-R105'><strong>Input Validation</strong></a>

updateTenantFeatures filters keys but does not validate against an empty update beyond throwing a generic error. Consider reusing the validation utilities from app/lib/validation.ts within the service to ensure consistent sanitization and clearer error messages.
</summary>

```typescript
  try {
    // Update database for each feature
    const updates = Object.entries(features).filter(([key, value]) => 
      VALID_FEATURES.includes(key as FeatureName) && typeof value === 'boolean'
    );

    if (updates.length === 0) {
      throw new Error("No valid features provided");
    }

    for (const [featureName, enabled] of updates) {
      await tenantQuery(tenantId, `
        INSERT INTO tenant_features (tenant_id, feature_name, enabled)
        VALUES ($1, $2, $3)
        ON CONFLICT (tenant_id, feature_name)
        DO UPDATE SET enabled = $3, updated_at = NOW()
      `, [tenantId, featureName, enabled]);
    }

    // Invalidate cache
    await deleteTenantCache(tenantId, FEATURES_CACHE_KEY);

    // Return updated features
    return await this.getTenantFeatures(tenantId);
  } catch (error) {
    console.error('Failed to update tenant features:', error);
    throw new Error('Database update failed');
  }
}
```

</details>

<details><summary><a href='https://github.com/Liam345/growplate-multi-tenant/pull/6/files#diff-e4143e3f2aaf33b8343616ad48bd47d7dd47c22250b0afe26ef570bccfb66c08R48-R113'><strong>Authorization Gap</strong></a>

The API endpoints rely on tenant resolution but do not enforce any user authorization/role checks within this task. Confirm that this is intentionally deferred; otherwise, restrict PUT to authorized roles to prevent unauthorized feature changes.
</summary>

```typescript
/**
 * PUT /api/features - Update tenant features
 * Updates feature flags for the requesting tenant
 */
export async function action({ request }: ActionFunctionArgs) {
  // Only allow PUT method
  if (request.method !== "PUT") {
    return json({
      success: false,
      error: "Method not allowed",
      message: "Only PUT method is supported for feature updates"
    }, { status: 405 });
  }

  try {
    // Get tenant from request (TASK-004 dependency)
    const tenant = await requireTenant(request);

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return json({
        success: false,
        error: "Invalid JSON",
        message: "Request body must be valid JSON"
      }, { status: 400 });
    }

    // Validate request body
    const validation = validateFeatureUpdateRequest(body);
    if (!validation.isValid) {
      return json({
        success: false,
        error: "Validation failed",
        message: validation.error
      }, { status: 400 });
    }

    // Update features
    const updatedFeatures = await featureService.updateTenantFeatures(
      tenant.id, 
      validation.features!
    );

    return json({
      success: true,
      data: updatedFeatures,
      message: "Features updated successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Feature update error:", error);

    // If it's already a Response (from requireTenant), re-throw it
    if (error instanceof Response) {
      throw error;
    }

    return json({
      success: false,
      error: "Failed to update features",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
```

</details>

</td></tr>
</table>


## PR Code Suggestions ✨

<!-- c927028 -->

Explore these optional code suggestions:

<table><thead><tr><td><strong>Category</strong></td><td align=left><strong>Suggestion&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; </strong></td><td align=center><strong>Impact</strong></td></tr><tbody><tr><td rowspan=1>High-level</td>
<td>



<details><summary>The feature flag system is not extensible</summary>

___

**To improve scalability and maintainability, centralize feature flag definitions <br>instead of hardcoding them across multiple files. This can be done using a <br>single configuration object or a database table, allowing for dynamic handling <br>of features.**


### Examples:



<details>
<summary>
<a href="https://github.com/Liam345/growplate-multi-tenant/pull/6/files#diff-80a3784a372f807e70af6cdec57a52e74f9d607ea2b76b6f43e334ba59a4114fR26-R26">app/lib/features.ts [26]</a>
</summary>



```typescript
const VALID_FEATURES: FeatureName[] = ['orders', 'loyalty', 'menu'];
```
</details>



<details>
<summary>
<a href="https://github.com/Liam345/growplate-multi-tenant/pull/6/files#diff-95c8cf46d11d445154f46a97922dd441f6a4623467b61d0e83692fd0836361b9R12-R12">app/lib/validation.ts [12]</a>
</summary>



```typescript
const VALID_FEATURES: FeatureName[] = ['orders', 'loyalty', 'menu'];
```
</details>




### Solution Walkthrough:



#### Before:
```typescript
// app/types/features.ts
export type FeatureName = 'orders' | 'loyalty' | 'menu';
export interface Features {
  orders: boolean;
  loyalty: boolean;
  menu: boolean;
}

// app/lib/features.ts
const VALID_FEATURES: FeatureName[] = ['orders', 'loyalty', 'menu'];
const DEFAULT_FEATURES: Features = { ... };

// app/lib/validation.ts
const VALID_FEATURES: FeatureName[] = ['orders', 'loyalty', 'menu'];

```



#### After:
```typescript
// app/config/features.ts (new centralized file)
export const FEATURE_DEFINITIONS = {
  orders: { defaultEnabled: false },
  loyalty: { defaultEnabled: false },
  menu: { defaultEnabled: true },
} as const;

export type FeatureName = keyof typeof FEATURE_DEFINITIONS;
export const VALID_FEATURES = Object.keys(FEATURE_DEFINITIONS) as FeatureName[];

// app/types/features.ts
import { FeatureName } from '~/config/features';
export type Features = Partial<Record<FeatureName, boolean>>;

// app/lib/features.ts & app/lib/validation.ts
import { VALID_FEATURES } from '~/config/features'; // Use centralized definition

```




<details><summary>Suggestion importance[1-10]: 7</summary>

__

Why: The suggestion correctly identifies a design limitation that hinders scalability, as adding new features requires modifying multiple hardcoded constants and types, which is a valid architectural concern.


</details></details></td><td align=center>Medium

</td></tr><tr><td rowspan=1>Possible issue</td>
<td>



<details><summary>Fix race condition during cache invalidation</summary>

___

**To fix a race condition, fetch updated features directly from the database and <br>then update the cache, rather than deleting the cache and re-fetching. This <br>ensures the cache is updated atomically.**

[app/lib/features.ts [96-100]](https://github.com/Liam345/growplate-multi-tenant/pull/6/files#diff-80a3784a372f807e70af6cdec57a52e74f9d607ea2b76b6f43e334ba59a4114fR96-R100)

```diff
-// Invalidate cache
-await deleteTenantCache(tenantId, FEATURES_CACHE_KEY);
+// Fetch the updated features from the database directly
+const updatedFeatures = await this.getFromDatabase(tenantId);
+
+// Update the cache with the new state
+await setTenantCache(tenantId, FEATURES_CACHE_KEY, updatedFeatures, {
+  ttl: FEATURES_CACHE_TTL
+});
 
 // Return updated features
-return await this.getTenantFeatures(tenantId);
+return updatedFeatures;
```


- [ ] **Apply / Chat** <!-- /improve --apply_suggestion=1 -->


<details><summary>Suggestion importance[1-10]: 7</summary>

__

Why: The suggestion correctly identifies a potential race condition and proposes a more robust "cache-aside" update pattern, which is a valuable improvement for correctness and performance.


</details></details></td><td align=center>Medium

</td></tr><tr><td rowspan=1>Security</td>
<td>



<details><summary>Prevent leaking database errors to clients</summary>

___

**To prevent leaking sensitive database details, wrap the original error from <br><code>getFromDatabase</code> in a generic, application-specific error before re-throwing it.**

[app/lib/features.ts [131-134]](https://github.com/Liam345/growplate-multi-tenant/pull/6/files#diff-80a3784a372f807e70af6cdec57a52e74f9d607ea2b76b6f43e334ba59a4114fR131-R134)

```diff
 } catch (error) {
   console.error('Database query failed:', error);
-  throw error;
+  // Wrap the original error to avoid leaking database-specific details to the client.
+  throw new Error('Failed to retrieve features from database.');
 }
```


- [ ] **Apply / Chat** <!-- /improve --apply_suggestion=2 -->


<details><summary>Suggestion importance[1-10]: 7</summary>

__

Why: The suggestion correctly identifies a potential information leak and recommends wrapping the error, which is a security best practice to avoid exposing internal implementation details to clients.


</details></details></td><td align=center>Medium

</td></tr>
<tr><td align="center" colspan="2">

- [ ] More <!-- /improve --more_suggestions=true -->

</td><td></td></tr></tbody></table>

