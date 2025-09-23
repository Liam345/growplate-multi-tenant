## PR Reviewer Guide 🔍

Here are some key observations to aid the review process:

<table>
<tr><td>⏱️&nbsp;<strong>Estimated effort to review</strong>: 4 🔵🔵🔵🔵⚪</td></tr>
<tr><td>🧪&nbsp;<strong>PR contains tests</strong></td></tr>
<tr><td>🔒&nbsp;<strong>No security concerns identified</strong></td></tr>
<tr><td>⚡&nbsp;<strong>Recommended focus areas for review</strong><br><br>

<details><summary><a href='https://github.com/Liam345/growplate-multi-tenant/pull/8/files#diff-fad002f88e57305854ee7307dbba2480ac04d131fe6358a2510285cb9ccfcca3R221-R233'><strong>A11y Label Mismatch</strong></a>

The mobile toggle button uses a constant sr-only label "Open main menu" while aria-expanded changes; when expanded it should announce "Close main menu" or update the sr-only text to reflect state for screen readers.
</summary>

```tsx
  type="button"
  className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-neutral-600 hover:text-primary-600 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors"
  aria-controls="mobile-menu"
  aria-expanded={isMobileMenuOpen}
  onClick={toggleMobileMenu}
>
  <span className="sr-only">Open main menu</span>
  {isMobileMenuOpen ? (
    <X className="w-6 h-6" aria-hidden="true" />
  ) : (
    <Menu className="w-6 h-6" aria-hidden="true" />
  )}
</button>
```

</details>

<details><summary><a href='https://github.com/Liam345/growplate-multi-tenant/pull/8/files#diff-fad002f88e57305854ee7307dbba2480ac04d131fe6358a2510285cb9ccfcca3R8-R15'><strong>Remix Router Mismatch</strong></a>

Tests render with react-router-dom while the component imports Link/useLocation from @remix-run/react. Ensure routing context alignment in tests and app to avoid runtime differences; consider unifying helpers or adjusting tests.
</summary>

```tsx
import { useState } from 'react';
import { Link, useLocation } from '@remix-run/react';
import { Menu, X, User, LogOut, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import type { TenantContext } from '~/types/tenant';
import type { UserContext } from '~/types/auth';
import { useFeatures, filterNavigationItems, type NavigationItem } from '~/hooks/useFeatures';

```

</details>

<details><summary><a href='https://github.com/Liam345/growplate-multi-tenant/pull/8/files#diff-4b0cbf0fc8b8d49e0109a2ef108b62b6094ffe83610255fe56167956995c19a0R100-R123'><strong>Direct DOM Side Effects</strong></a>

The layout and hook mutate document.title and meta tags directly; in Remix this can conflict with <Meta> and <Links>. Validate SSR/CSR consistency and potential duplicate meta tags when multiple pages use these utilities.
</summary>

```tsx
useEffect(() => {
  setIsMounted(true);
}, []);

// Update document title and meta tags
useEffect(() => {
  if (title) {
    const tenantName = tenant?.name || 'GrowPlate';
    document.title = `${title} - ${tenantName}`;
  }

  if (description) {
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }
  }
}, [title, description, tenant?.name]);

```

</details>

</td></tr>
</table>

## PR Code Suggestions ✨

<!-- 385dd5e -->

Explore these optional code suggestions:

<table><thead><tr><td><strong>Category</strong></td><td align=left><strong>Suggestion&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; </strong></td><td align=center><strong>Impact</strong></td></tr><tbody><tr><td rowspan=1>High-level</td>
<td>



<details><summary>Consider using an existing component library</summary>

___

**Instead of building UI components from scratch, consider adopting an existing <br>unstyled component library like Shadcn/ui. This would reduce implementation and <br>maintenance efforts for foundational elements.**


### Examples:



<details>
<summary>
<a href="https://github.com/Liam345/growplate-multi-tenant/pull/8/files#diff-c3c50467c99a1d8fb5ce74d09df7eaf4060ba1ba1e828911175138dd7dbc5862R59-R175">app/components/layout/AdminLayout.tsx [59-175]</a>
</summary>



```typescript
export function AdminLayout({
  children,
  title,
  tenant,
  user,
  features = { orders: true, loyalty: false, menu: true },
  className,
  showSidebar = true,
  showFooter = true,
}: AdminLayoutProps) {

 ... (clipped 107 lines)
```
</details>



<details>
<summary>
<a href="https://github.com/Liam345/growplate-multi-tenant/pull/8/files#diff-4b0cbf0fc8b8d49e0109a2ef108b62b6094ffe83610255fe56167956995c19a0R84-R178">app/components/layout/CustomerLayout.tsx [84-178]</a>
</summary>



```typescript
export function CustomerLayout({
  children,
  title,
  description,
  tenant,
  user,
  features = { orders: true, loyalty: false, menu: true },
  className,
  showHeader = true,
  showFooter = true,

 ... (clipped 85 lines)
```
</details>




### Solution Walkthrough:



#### Before:
```typescript
// app/components/layout/AdminLayout.tsx
export function AdminLayout({ children, ... }) {
  const sidebar = useSidebar(true);
  // ... useEffects for resizing, etc.

  return (
    <FeatureProvider features={features}>
      <div className="min-h-screen ...">
        <Header onMenuToggle={sidebar.toggle} ... />
        <div className="flex-1 flex">
          <Sidebar isOpen={sidebar.isOpen} ... />
          <main className="...">
            {children}
          </main>
        </div>
        <Footer isAdmin={true} ... />
      </div>
    </FeatureProvider>
  );
}

```



#### After:
```typescript
// Using a library like Shadcn/ui.
// The custom layout composition might remain, but the building blocks
// (Buttons, Cards, Menus) would come from the library, simplifying
// components like Header, Sidebar, and AdminCard.

// Example: Simplified AdminCard
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function AdminCard({ title, children, actions }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle>{title}</CardTitle>
          {actions}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

```




<details><summary>Suggestion importance[1-10]: 9</summary>

__

Why: This is a critical architectural suggestion that questions the "build vs. buy" decision for foundational UI, which has significant long-term impact on development speed and maintenance.


</details></details></td><td align=center>High

</td></tr><tr><td rowspan=5>Possible issue</td>
<td>



<details><summary>Fix circular dependency with hook</summary>

___

**Resolve a circular dependency by moving the <code>useSidebar</code> hook from <code>Sidebar.tsx</code> to <br>a separate, dedicated file to prevent runtime errors.**

[app/components/layout/Sidebar.tsx [265-286]](https://github.com/Liam345/growplate-multi-tenant/pull/8/files#diff-176181cd2caae1ce754b2e20dcead18bd3810369c8b7f8984a86ffb5b31a9e7bR265-R286)

```diff
-import { useState } from 'react';
+// The useSidebar hook should be moved to a separate file (e.g., app/hooks/useSidebar.ts)
+// to be properly shared between AdminLayout.tsx and Sidebar.tsx without circular dependencies.
+// The import { useState } from 'react'; for the hook should also be moved.
 
-/**
- * Custom hook for managing sidebar state
- * 
- * @param initialOpen - Initial sidebar open state
- * @returns Sidebar state and controls
- */
-export function useSidebar(initialOpen: boolean = true) {
-  const [isOpen, setIsOpen] = useState(initialOpen);
-
-  const toggle = () => setIsOpen(!isOpen);
-  const open = () => setIsOpen(true);
-  const close = () => setIsOpen(false);
-
-  return {
-    isOpen,
-    toggle,
-    open,
-    close,
-  };
-}
-
```


- [ ] **Apply / Chat** <!-- /improve --apply_suggestion=1 -->


<details><summary>Suggestion importance[1-10]: 9</summary>

__

Why: The suggestion correctly identifies a critical circular dependency where `AdminLayout.tsx` imports a hook from `Sidebar.tsx` that is defined in the same file, which would cause a runtime error.

</details></details></td><td align=center>High

</td></tr><tr><td>



<details><summary>Make breakpoint hook reactive to resize</summary>

___

**Refactor the <code>useBreakpoint</code> hook to be reactive to window resize events by using <br><code>useState</code> and <code>useEffect</code>, ensuring the responsive UI updates correctly when the <br>viewport size changes.**

[app/components/layout/utilities.tsx [52-56]](https://github.com/Liam345/growplate-multi-tenant/pull/8/files#diff-588138dee8775113f42aecc8795a0a86488a888896c177106cbb8048810ee6bcR52-R56)

```diff
+import { useState, useEffect } from 'react';
+
 export function useBreakpoint(breakpoint: keyof typeof Breakpoints): boolean {
-  if (typeof window === 'undefined') return false;
-  
-  return window.innerWidth >= Breakpoints[breakpoint];
+  const [matches, setMatches] = useState(() => {
+    if (typeof window === 'undefined') return false;
+    return window.innerWidth >= Breakpoints[breakpoint];
+  });
+
+  useEffect(() => {
+    if (typeof window === 'undefined') return;
+
+    const handleResize = () => {
+      setMatches(window.innerWidth >= Breakpoints[breakpoint]);
+    };
+
+    window.addEventListener('resize', handleResize);
+    return () => window.removeEventListener('resize', handleResize);
+  }, [breakpoint]);
+
+  return matches;
 }
```


- [ ] **Apply / Chat** <!-- /improve --apply_suggestion=2 -->


<details><summary>Suggestion importance[1-10]: 9</summary>

__

Why: This suggestion fixes a critical bug in the `useBreakpoint` hook, which currently fails to update on window resize, breaking the responsive behavior of components that use it.


</details></details></td><td align=center>High

</td></tr><tr><td>



<details><summary>Fix meta tag removal bug</summary>

___

**Update the <code>useEffect</code> hook to remove the meta description tag from the document <br>head when the <code>description</code> prop is empty or undefined to prevent outdated SEO <br>information.**

[app/components/layout/CustomerLayout.tsx [104-122]](https://github.com/Liam345/growplate-multi-tenant/pull/8/files#diff-4b0cbf0fc8b8d49e0109a2ef108b62b6094ffe83610255fe56167956995c19a0R104-R122)

```diff
 // Update document title and meta tags
 useEffect(() => {
   if (title) {
     const tenantName = tenant?.name || 'GrowPlate';
     document.title = `${title} - ${tenantName}`;
   }
 
+  let metaDescription = document.querySelector('meta[name="description"]');
   if (description) {
-    const metaDescription = document.querySelector('meta[name="description"]');
-    if (metaDescription) {
-      metaDescription.setAttribute('content', description);
-    } else {
-      const meta = document.createElement('meta');
-      meta.name = 'description';
-      meta.content = description;
-      document.head.appendChild(meta);
+    if (!metaDescription) {
+      metaDescription = document.createElement('meta');
+      metaDescription.name = 'description';
+      document.head.appendChild(metaDescription);
     }
+    metaDescription.setAttribute('content', description);
+  } else if (metaDescription) {
+    // Remove the tag if description is not provided
+    metaDescription.remove();
   }
 }, [title, description, tenant?.name]);
```


- [ ] **Apply / Chat** <!-- /improve --apply_suggestion=3 -->


<details><summary>Suggestion importance[1-10]: 7</summary>

__

Why: The suggestion correctly identifies and fixes a bug where the meta description tag would not be removed on client-side navigation to a page without a description, which could harm SEO.

</details></details></td><td align=center>Medium

</td></tr><tr><td>



<details><summary>Throw error on missing context</summary>

___

**Modify the <code>useFeatures</code> hook to throw an error when used outside a <br><code>FeatureProvider</code>, instead of silently falling back to default values, to prevent <br>masking configuration errors.**

[app/hooks/useFeatures.tsx [85-102]](https://github.com/Liam345/growplate-multi-tenant/pull/8/files#diff-9c9a98b3c465386ac777baafbc8a1889e824eb4d085bd49ff56c3a410f9ee2aeR85-R102)

```diff
 if (!context) {
-  // Provide fallback for development/testing
-  console.warn('useFeatures must be used within a FeatureProvider. Falling back to default features.');
-  
-  const defaultFeatures: Features = {
-    orders: true,
-    loyalty: false,
-    menu: true,
-  };
-  
-  return {
-    features: defaultFeatures,
-    hasFeature: (feature: FeatureName) => defaultFeatures[feature] ?? false,
-    hasOrders: defaultFeatures.orders,
-    hasLoyalty: defaultFeatures.loyalty,
-    hasMenu: defaultFeatures.menu,
-  };
+  throw new Error('useFeatures must be used within a FeatureProvider');
 }
```


- [ ] **Apply / Chat** <!-- /improve --apply_suggestion=4 -->


<details><summary>Suggestion importance[1-10]: 7</summary>

__

Why: The suggestion correctly identifies that silently falling back to default values can hide bugs, and throwing an error when the context is missing is a more robust and safer design pattern.


</details></details></td><td align=center>Medium

</td></tr><tr><td>



<details><summary>Isolate tests by restoring mocks</summary>

___

**Improve test reliability by using <code>jest.spyOn</code> with <code>beforeEach</code> and <code>afterEach</code> to <br>mock <code>window.innerWidth</code>, ensuring mocks are restored and tests are isolated.**

[app/components/layout/__tests__/Layout.integration.test.tsx [318-339]](https://github.com/Liam345/growplate-multi-tenant/pull/8/files#diff-08bbcc5c167139bdf9c7114a3c18f64545e0043c9cc595f03eabed29c17039eaR318-R339)

```diff
-// Mock window.innerWidth
-const mockInnerWidth = (width: number) => {
-  Object.defineProperty(window, 'innerWidth', {
-    writable: true,
-    configurable: true,
-    value: width,
+describe('Layout Responsive Integration', () => {
+  let innerWidthSpy: jest.SpyInstance;
+
+  beforeEach(() => {
+    innerWidthSpy = jest.spyOn(window, 'innerWidth', 'get');
   });
-  window.dispatchEvent(new Event('resize'));
-};
 
-test('admin layout adapts sidebar to mobile', async () => {
-  mockInnerWidth(600);
-  renderAdminLayout();
-  
-  // Sidebar should be closed on mobile
-  const sidebar = screen.getByLabelText('Sidebar navigation');
-  expect(sidebar).toHaveClass('w-16'); // Collapsed state
-  
-  // Mobile menu overlay should be available
-  const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
-  expect(mobileMenuButton).toBeInTheDocument();
+  afterEach(() => {
+    innerWidthSpy.mockRestore();
+  });
+
+  const mockInnerWidth = (width: number) => {
+    innerWidthSpy.mockReturnValue(width);
+    window.dispatchEvent(new Event('resize'));
+  };
+
+  test('admin layout adapts sidebar to mobile', async () => {
+    mockInnerWidth(600);
+    renderAdminLayout();
+    
+    // Sidebar should be closed on mobile
+    const sidebar = screen.getByLabelText('Sidebar navigation');
+    expect(sidebar).toHaveClass('w-16'); // Collapsed state
+    
+    // Mobile menu overlay should be available
+    const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
+    expect(mobileMenuButton).toBeInTheDocument();
+  });
+  // ... other tests in this describe block
 });
```


- [ ] **Apply / Chat** <!-- /improve --apply_suggestion=5 -->


<details><summary>Suggestion importance[1-10]: 6</summary>

__

Why: The suggestion correctly identifies that modifying global state in tests without cleanup can lead to flaky tests and improves the test suite's reliability by properly isolating test side effects.

</details></details></td><td align=center>Low

</td></tr><tr><td rowspan=1>General</td>
<td>



<details><summary>Memoize context value to prevent re-renders</summary>

___

**Optimize the <code>FeatureProvider</code> by memoizing the context value with <code>useMemo</code> and the <br><code>hasFeature</code> function with <code>useCallback</code> to prevent unnecessary re-renders of <br>consuming components.**

[app/hooks/useFeatures.tsx [40-58]](https://github.com/Liam345/growplate-multi-tenant/pull/8/files#diff-9c9a98b3c465386ac777baafbc8a1889e824eb4d085bd49ff56c3a410f9ee2aeR40-R58)

```diff
+import { useContext, createContext, type ReactNode, useMemo, useCallback } from 'react';
+
 export function FeatureProvider({ children, features }: FeatureProviderProps) {
-  const hasFeature = (feature: FeatureName): boolean => {
+  const hasFeature = useCallback((feature: FeatureName): boolean => {
     return features[feature] ?? false;
-  };
+  }, [features]);
 
-  const contextValue: FeatureContextType = {
+  const contextValue: FeatureContextType = useMemo(() => ({
     features,
     hasFeature,
     hasOrders: hasFeature('orders'),
     hasLoyalty: hasFeature('loyalty'),
     hasMenu: hasFeature('menu'),
-  };
+  }), [features, hasFeature]);
 
   return (
     <FeatureContext.Provider value={contextValue}>
       {children}
     </FeatureContext.Provider>
   );
 }
```


- [ ] **Apply / Chat** <!-- /improve --apply_suggestion=6 -->


<details><summary>Suggestion importance[1-10]: 7</summary>

__

Why: The suggestion correctly points out a potential performance issue and proposes using `useMemo` and `useCallback` to prevent unnecessary re-renders of context consumers, which is a standard React optimization.


</details></details></td><td align=center>Medium

</td></tr>
<tr><td align="center" colspan="2">

- [ ] More <!-- /improve --more_suggestions=true -->

</td><td></td></tr></tbody></table>

