/**
 * Tenant Resolution Middleware for Remix
 *
 * This middleware resolves tenant information from the request hostname
 * and adds it to the request context for use in loaders and actions.
 */

import type {
  TenantContext,
  TenantResolutionResult,
  TenantMiddlewareConfig,
  TenantLookupOptions,
} from "~/types/tenant";
import { resolveTenant } from "~/lib/tenant";

// =====================================================================================
// MIDDLEWARE CONFIGURATION
// =====================================================================================

const DEFAULT_CONFIG: TenantMiddlewareConfig = {
  enableCaching: true,
  cacheTTL: 3600, // 1 hour
  skipPaths: [
    "/health",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
    "/api/health",
  ],
  requiredPaths: ["/admin", "/api", "/menu", "/order", "/loyalty"],
};

// =====================================================================================
// TENANT CONTEXT STORAGE
// =====================================================================================

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

// =====================================================================================
// MIDDLEWARE FUNCTIONS
// =====================================================================================

/**
 * Create tenant resolution middleware for Remix loaders/actions
 */
export function createTenantMiddleware(
  config: Partial<TenantMiddlewareConfig> = {}
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return async function tenantMiddleware(request: Request): Promise<{
    tenant: TenantContext | null;
    resolution: TenantResolutionResult;
  }> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Check if this path should skip tenant resolution
    if (shouldSkipPath(pathname, mergedConfig.skipPaths || [])) {
      const skipResult: TenantResolutionResult = {
        success: true,
        tenant: null,
        source: "cache",
        responseTime: 0,
      };

      setCurrentTenant(null, skipResult);
      return { tenant: null, resolution: skipResult };
    }

    // Extract hostname from request
    const hostname = getHostname(request);

    // Configure tenant lookup options
    const lookupOptions: TenantLookupOptions = {
      useCache: mergedConfig.enableCaching,
      cacheTTL: mergedConfig.cacheTTL,
      includeFeatures: true,
      includeSettings: true,
    };

    try {
      // Resolve tenant from hostname
      const resolution = await resolveTenant(hostname, lookupOptions);

      // Handle resolution failure
      if (!resolution.success) {
        console.warn("Tenant resolution failed:", {
          hostname,
          pathname,
          error: resolution.error,
        });

        // Check if tenant is required for this path
        if (isRequiredPath(pathname, mergedConfig.requiredPaths || [])) {
          if (mergedConfig.errorHandler) {
            throw mergedConfig.errorHandler(resolution.error!);
          }

          throw new Response(
            JSON.stringify({
              error: "Tenant not found",
              message:
                resolution.error?.message ||
                "Unable to resolve tenant from domain",
              code: resolution.error?.code || "TENANT_NOT_FOUND",
            }),
            {
              status: 404,
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
        }

        // Tenant not required, continue without tenant
        setCurrentTenant(null, resolution);
        return { tenant: null, resolution };
      }

      // Successful resolution
      const tenant = resolution.tenant!;

      console.log("Tenant resolved:", {
        tenantId: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        hostname,
        source: resolution.source,
        responseTime: resolution.responseTime,
      });

      setCurrentTenant(tenant, resolution);
      return { tenant, resolution };
    } catch (error) {
      console.error("Tenant middleware error:", error);

      // If it's already a Response, re-throw it
      if (error instanceof Response) {
        throw error;
      }

      // Create error response
      throw new Response(
        JSON.stringify({
          error: "Tenant resolution error",
          message: "Unable to resolve tenant information",
          code: "MIDDLEWARE_ERROR",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  };
}

/**
 * Default tenant middleware instance
 */
export const tenantMiddleware = createTenantMiddleware();

// =====================================================================================
// REMIX INTEGRATION HELPERS
// =====================================================================================

/**
 * Higher-order function to wrap Remix loaders with tenant resolution
 */
export function withTenant<T extends Record<string, any>>(
  loader: (args: {
    request: Request;
    params: any;
    context?: any;
    tenant: TenantContext;
  }) => Promise<T>
) {
  return async function wrappedLoader(args: {
    request: Request;
    params: any;
    context?: any;
  }): Promise<T> {
    const { tenant } = await tenantMiddleware(args.request);

    if (!tenant) {
      throw new Response("Tenant required", { status: 404 });
    }

    return loader({ ...args, tenant });
  };
}

/**
 * Higher-order function to wrap Remix actions with tenant resolution
 */
export function withTenantAction<T extends Record<string, any>>(
  action: (args: {
    request: Request;
    params: any;
    context?: any;
    tenant: TenantContext;
  }) => Promise<T>
) {
  return async function wrappedAction(args: {
    request: Request;
    params: any;
    context?: any;
  }): Promise<T> {
    const { tenant } = await tenantMiddleware(args.request);

    if (!tenant) {
      throw new Response("Tenant required", { status: 404 });
    }

    return action({ ...args, tenant });
  };
}

/**
 * Helper to get tenant in Remix loaders/actions
 */
export async function requireTenant(request: Request): Promise<TenantContext> {
  const { tenant } = await tenantMiddleware(request);

  if (!tenant) {
    throw new Response("Tenant not found", {
      status: 404,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return tenant;
}

/**
 * Helper to optionally get tenant in Remix loaders/actions
 */
export async function getTenant(
  request: Request
): Promise<TenantContext | null> {
  const { tenant } = await tenantMiddleware(request);
  return tenant;
}

// =====================================================================================
// UTILITY FUNCTIONS
// =====================================================================================

/**
 * Extract hostname from request with fallback handling
 */
function getHostname(request: Request): string {
  const url = new URL(request.url);

  // Check various headers for hostname (useful behind proxies)
  const headers = request.headers;

  // Try X-Forwarded-Host first (common with reverse proxies)
  const forwardedHost = headers.get("X-Forwarded-Host");
  if (forwardedHost) {
    return forwardedHost.split(",")[0].trim();
  }

  // Try Host header
  const hostHeader = headers.get("Host");
  if (hostHeader) {
    return hostHeader;
  }

  // Fallback to URL hostname
  return url.hostname + (url.port ? `:${url.port}` : "");
}

/**
 * Check if path should skip tenant resolution
 */
function shouldSkipPath(pathname: string, skipPaths: string[]): boolean {
  return skipPaths.some((skipPath) => {
    if (skipPath.endsWith("*")) {
      return pathname.startsWith(skipPath.slice(0, -1));
    }
    return pathname === skipPath;
  });
}

/**
 * Check if path requires tenant resolution
 */
function isRequiredPath(pathname: string, requiredPaths: string[]): boolean {
  return requiredPaths.some((requiredPath) => {
    if (requiredPath.endsWith("*")) {
      return pathname.startsWith(requiredPath.slice(0, -1));
    }
    return pathname.startsWith(requiredPath);
  });
}

// =====================================================================================
// ERROR HANDLERS
// =====================================================================================

/**
 * Default error handler for tenant resolution failures
 */
export function createTenantErrorHandler() {
  return function handleTenantError(error: any): Response {
    console.error("Tenant error:", error);

    const status = error.code === "TENANT_NOT_FOUND" ? 404 : 500;
    const message = error.message || "Tenant resolution failed";

    return new Response(
      JSON.stringify({
        error: "Tenant Error",
        message,
        code: error.code || "UNKNOWN_ERROR",
        timestamp: new Date().toISOString(),
      }),
      {
        status,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  };
}

// =====================================================================================
// DEVELOPMENT HELPERS
// =====================================================================================

/**
 * Create development middleware that uses a default tenant for localhost
 */
export function createDevTenantMiddleware(defaultTenantId?: string) {
  return createTenantMiddleware({
    enableCaching: false, // Disable caching in development
    errorHandler: (error) => {
      // In development, provide more detailed error information
      console.log("Dev tenant error:", error);

      if (error.code === "TENANT_NOT_FOUND" && defaultTenantId) {
        // Could implement fallback to default tenant
        console.log(`Falling back to default tenant: ${defaultTenantId}`);
      }

      return new Response(
        JSON.stringify({
          error: "Development Tenant Error",
          message: error.message,
          code: error.code,
          details: error.details,
          timestamp: new Date().toISOString(),
          hint: "Check your domain configuration or use a valid tenant domain",
        }),
        {
          status: error.code === "TENANT_NOT_FOUND" ? 404 : 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    },
  });
}

// =====================================================================================
// EXPORT DEFAULT MIDDLEWARE
// =====================================================================================

// Export the default middleware configuration
export default tenantMiddleware;
