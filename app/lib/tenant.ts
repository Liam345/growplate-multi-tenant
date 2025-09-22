/**
 * Tenant Resolution Utilities
 *
 * This module provides utilities for tenant resolution, domain parsing,
 * and caching for the multi-tenant GrowPlate platform.
 */

import type {
  TenantContext,
  DomainInfo,
  TenantResolutionResult,
  TenantResolutionError,
  TenantLookupOptions,
  DomainValidationResult,
} from "~/types/tenant";
import { TenantError } from "~/types/tenant";
import type { TenantRow } from "~/types/database";
import { query, queryOne } from "~/lib/db";
import {
  setTenantCache,
  getTenantCache,
  deleteTenantCache,
  clearTenantCache,
  CACHE_TTL,
} from "~/lib/redis";

// =====================================================================================
// DOMAIN PARSING AND VALIDATION
// =====================================================================================

/**
 * Domain configuration interface
 */
export interface DomainConfig {
  platformDomain: string;
  allowLocalhost: boolean;
  requireHttps: boolean;
}

/**
 * Get domain configuration from environment variables
 */
export function getDomainConfig(): DomainConfig {
  return {
    platformDomain: process.env.PLATFORM_DOMAIN || "growplate.com",
    allowLocalhost: process.env.NODE_ENV === "development" || process.env.ALLOW_LOCALHOST === "true",
    requireHttps: process.env.NODE_ENV === "production" && process.env.REQUIRE_HTTPS !== "false"
  };
}

/**
 * Parse hostname to extract domain components
 */
export function parseDomain(hostname: string, config?: DomainConfig): DomainInfo {
  const domainConfig = config || getDomainConfig();
  // Remove protocol if present and normalize
  const cleanHostname = hostname.replace(/^https?:\/\//, "").toLowerCase().trim();

  // Extract port if present
  const [rawHostPart, port] = cleanHostname.split(":");
  // Strip leading/trailing dots from hostname
  const hostPart = rawHostPart.replace(/\.+$/, "").replace(/^\.+/, "");

  // Check if localhost
  const isLocalhost = hostPart === "localhost" || hostPart.startsWith("127.") || hostPart === "::1";

  if (isLocalhost) {
    if (!domainConfig.allowLocalhost) {
      throw new TenantError(
        "LOCALHOST_NOT_ALLOWED",
        "Localhost access not permitted in this environment",
        { hostname, environment: process.env.NODE_ENV }
      );
    }

    return {
      hostname: cleanHostname,
      domain: normalizeDomain(hostPart),
      subdomain: null,
      port: port || null,
      isCustomDomain: false,
      isLocalhost: true,
    };
  }

  // Split domain parts and filter out empty parts
  const parts = hostPart.split(".").filter(Boolean);

  if (parts.length < 2) {
    throw new TenantError(
      "DOMAIN_PARSE_ERROR",
      `Invalid domain format: ${hostname}`,
      { hostname, parts }
    );
  }

  // Check if this is a subdomain of our platform (e.g., restaurant.growplate.com)
  const platformParts = domainConfig.platformDomain.split(".").map(s => s.trim().toLowerCase()).filter(Boolean);
  const isSubdomainOfPlatform = 
    parts.length >= platformParts.length + 1 &&
    parts.slice(-platformParts.length).join(".") === domainConfig.platformDomain.toLowerCase();

  let domain: string;
  let subdomain: string | null = null;
  let isCustomDomain: boolean;

  if (isSubdomainOfPlatform) {
    // Extract subdomain (support multi-level subdomains)
    const subdomainParts = parts.slice(0, -(platformParts.length));
    const computedSub = subdomainParts.join(".").toLowerCase().trim();

    // Reject empty, wildcard, or invalid subdomains
    if (!computedSub || computedSub === "*" || /[*]/.test(computedSub)) {
      throw new TenantError(
        "DOMAIN_PARSE_ERROR",
        `Invalid subdomain for platform domain: ${hostname}`,
        { hostname, subdomain: computedSub }
      );
    }

    subdomain = computedSub;
    domain = parts.slice(subdomainParts.length).join(".");
    isCustomDomain = false;
  } else {
    // Custom domain like restaurant.com
    domain = hostPart;
    subdomain = null;
    isCustomDomain = true;
  }

  const normalizedDomain = normalizeDomain(domain);

  return {
    hostname: cleanHostname,
    domain: normalizedDomain,
    subdomain,
    port: port || null,
    isCustomDomain,
    isLocalhost: false,
  };
}

/**
 * Validate domain format
 */
export function validateDomain(domain: string): DomainValidationResult {
  const errors: string[] = [];

  if (!domain || domain.trim() === "") {
    errors.push("Domain cannot be empty");
  }

  if (domain.length > 253) {
    errors.push("Domain name too long (max 253 characters)");
  }

  // Basic domain format validation
  const domainRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!domainRegex.test(domain)) {
    errors.push("Invalid domain format");
  }

  // Check for localhost
  if (domain === "localhost" || domain === "127.0.0.1") {
    // Localhost is valid for development
  }

  const normalizedDomain = normalizeDomain(domain);

  return {
    isValid: errors.length === 0,
    normalizedDomain,
    errors,
  };
}

/**
 * Normalize domain to consistent format
 */
export function normalizeDomain(domain: string): string {
  return domain.toLowerCase().trim();
}

// =====================================================================================
// CACHE OPERATIONS
// =====================================================================================

/**
 * Generate cache key for tenant domain lookup
 */
function getTenantCacheKey(domain: string): string {
  return `tenant:domain:${normalizeDomain(domain)}`;
}

/**
 * Generate cache key for tenant subdomain lookup
 */
function getTenantSubdomainCacheKey(subdomain: string): string {
  return `tenant:subdomain:${subdomain.toLowerCase()}`;
}

/**
 * Cache tenant data
 */
export async function cacheTenant(
  key: string,
  tenant: TenantContext,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<boolean> {
  try {
    return await setTenantCache("global", key, tenant, { ttl });
  } catch (error) {
    console.error("Failed to cache tenant:", error);
    return false;
  }
}

/**
 * Get tenant from cache
 */
export async function getCachedTenant(
  key: string
): Promise<TenantContext | null> {
  try {
    return await getTenantCache<TenantContext>("global", key);
  } catch (error) {
    console.error("Failed to get cached tenant:", error);
    return null;
  }
}

/**
 * Clear tenant cache
 */
export async function clearTenantCacheById(tenantId: string): Promise<number> {
  try {
    return await clearTenantCache(tenantId);
  } catch (error) {
    console.error("Failed to clear tenant cache:", error);
    return 0;
  }
}

// =====================================================================================
// DATABASE OPERATIONS
// =====================================================================================

/**
 * Convert database row to TenantContext
 */
function dbRowToTenantContext(row: TenantRow): TenantContext {
  return {
    id: row.id,
    name: row.name,
    domain: row.domain,
    subdomain: row.subdomain,
    email: row.email,
    phone: row.phone,
    address: row.address as TenantContext["address"], // Type assertion for address
    settings: row.settings,
    stripeAccountId: row.stripe_account_id,
    features: [], // Will be populated separately if needed
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get tenant by domain from database
 */
export async function getTenantByDomain(
  domain: string,
  options: TenantLookupOptions = {}
): Promise<TenantContext | null> {
  try {
    const normalizedDomain = normalizeDomain(domain);

    const row = await queryOne<TenantRow>(
      "SELECT * FROM tenants WHERE domain = $1 AND created_at IS NOT NULL",
      [normalizedDomain]
    );

    if (!row) {
      return null;
    }

    const tenant = dbRowToTenantContext(row);

    // Load features if requested
    if (options.includeFeatures) {
      tenant.features = await getTenantFeatures(tenant.id);
    }

    return tenant;
  } catch (error) {
    console.error("Database error getting tenant by domain:", error);
    throw new TenantError(
      "DATABASE_ERROR",
      `Failed to get tenant by domain: ${domain}`,
      { domain, error: error instanceof Error ? error.message : error }
    );
  }
}

/**
 * Get tenant by subdomain from database
 */
export async function getTenantBySubdomain(
  subdomain: string,
  options: TenantLookupOptions = {}
): Promise<TenantContext | null> {
  try {
    const normalizedSubdomain = subdomain.toLowerCase();

    const row = await queryOne<TenantRow>(
      "SELECT * FROM tenants WHERE subdomain = $1 AND created_at IS NOT NULL",
      [normalizedSubdomain]
    );

    if (!row) {
      return null;
    }

    const tenant = dbRowToTenantContext(row);

    // Load features if requested
    if (options.includeFeatures) {
      tenant.features = await getTenantFeatures(tenant.id);
    }

    return tenant;
  } catch (error) {
    console.error("Database error getting tenant by subdomain:", error);
    throw new TenantError(
      "DATABASE_ERROR",
      `Failed to get tenant by subdomain: ${subdomain}`,
      { subdomain, error: error instanceof Error ? error.message : error }
    );
  }
}

/**
 * Get tenant by ID from database
 */
export async function getTenantById(
  id: string,
  options: TenantLookupOptions = {}
): Promise<TenantContext | null> {
  try {
    const row = await queryOne<TenantRow>(
      "SELECT * FROM tenants WHERE id = $1",
      [id]
    );

    if (!row) {
      return null;
    }

    const tenant = dbRowToTenantContext(row);

    // Load features if requested
    if (options.includeFeatures) {
      tenant.features = await getTenantFeatures(tenant.id);
    }

    return tenant;
  } catch (error) {
    console.error("Database error getting tenant by ID:", error);
    throw new TenantError(
      "DATABASE_ERROR",
      `Failed to get tenant by ID: ${id}`,
      { id, error: error instanceof Error ? error.message : error }
    );
  }
}

/**
 * Get tenant features from database
 */
async function getTenantFeatures(tenantId: string): Promise<string[]> {
  try {
    const result = await query(
      "SELECT feature_name FROM tenant_features WHERE tenant_id = $1 AND enabled = true",
      [tenantId]
    );

    return result.rows.map((row) => row.feature_name);
  } catch (error) {
    console.error("Error getting tenant features:", error);
    return [];
  }
}

// =====================================================================================
// TENANT RESOLUTION
// =====================================================================================

/**
 * Resolve tenant from hostname with caching
 */
export async function resolveTenant(
  hostname: string,
  options: TenantLookupOptions = {}
): Promise<TenantResolutionResult> {
  const startTime = Date.now();

  try {
    // Parse domain information
    const domainInfo = parseDomain(hostname);

    // Handle localhost for development
    if (domainInfo.isLocalhost) {
      // For development, you might want to use a default tenant
      // or implement tenant selection logic
      return {
        success: false,
        tenant: null,
        error: {
          code: "TENANT_NOT_FOUND",
          message: "Localhost requires tenant selection",
          details: { hostname, domainInfo },
          timestamp: new Date(),
        },
        source: "database",
        responseTime: Date.now() - startTime,
      };
    }

    // Validate domain
    const validation = validateDomain(domainInfo.domain);
    if (!validation.isValid) {
      return {
        success: false,
        tenant: null,
        error: {
          code: "INVALID_DOMAIN",
          message: `Invalid domain: ${validation.errors.join(", ")}`,
          details: { hostname, domainInfo, validation },
          timestamp: new Date(),
        },
        source: "database",
        responseTime: Date.now() - startTime,
      };
    }

    let tenant: TenantContext | null = null;
    let source: "cache" | "database" = "database";

    // Determine lookup strategy
    const isSubdomainLookup =
      !domainInfo.isCustomDomain && domainInfo.subdomain;
    const lookupKey = isSubdomainLookup
      ? domainInfo.subdomain!
      : domainInfo.domain;
    const cacheKey = isSubdomainLookup
      ? getTenantSubdomainCacheKey(lookupKey)
      : getTenantCacheKey(lookupKey);

    // Try cache first if enabled
    if (options.useCache !== false) {
      tenant = await getCachedTenant(cacheKey);
      if (tenant) {
        source = "cache";
      }
    }

    // Fallback to database
    if (!tenant) {
      if (isSubdomainLookup) {
        tenant = await getTenantBySubdomain(lookupKey, options);
      } else {
        tenant = await getTenantByDomain(lookupKey, options);
      }

      // Cache the result if found
      if (tenant && options.useCache !== false) {
        await cacheTenant(cacheKey, tenant, options.cacheTTL);
      }
    }

    if (!tenant) {
      return {
        success: false,
        tenant: null,
        error: {
          code: "TENANT_NOT_FOUND",
          message: `No tenant found for ${isSubdomainLookup ? "subdomain" : "domain"}: ${lookupKey}`,
          details: { hostname, domainInfo, lookupKey, isSubdomainLookup },
          timestamp: new Date(),
        },
        source,
        responseTime: Date.now() - startTime,
      };
    }

    return {
      success: true,
      tenant,
      source,
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error("Tenant resolution error:", error);

    if (error instanceof TenantError) {
      return {
        success: false,
        tenant: null,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp: new Date(),
        },
        source: "database",
        responseTime: Date.now() - startTime,
      };
    }

    return {
      success: false,
      tenant: null,
      error: {
        code: "DATABASE_ERROR",
        message: "Unexpected error during tenant resolution",
        details: {
          hostname,
          error: error instanceof Error ? error.message : error,
        },
        timestamp: new Date(),
      },
      source: "database",
      responseTime: Date.now() - startTime,
    };
  }
}

// =====================================================================================
// UTILITY FUNCTIONS
// =====================================================================================

/**
 * Check if hostname matches tenant domain or subdomain
 */
export function matchesTenant(
  hostname: string,
  tenant: TenantContext
): boolean {
  try {
    const domainInfo = parseDomain(hostname);

    // Check custom domain match
    if (domainInfo.isCustomDomain && domainInfo.domain === tenant.domain) {
      return true;
    }

    // Check subdomain match
    if (
      !domainInfo.isCustomDomain &&
      domainInfo.subdomain &&
      domainInfo.subdomain === tenant.subdomain
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Get all possible cache keys for a tenant (for cache invalidation)
 */
export function getTenantCacheKeys(tenant: TenantContext): string[] {
  const keys: string[] = [];

  // Domain-based cache key
  keys.push(getTenantCacheKey(tenant.domain));

  // Subdomain-based cache key
  if (tenant.subdomain) {
    keys.push(getTenantSubdomainCacheKey(tenant.subdomain));
  }

  return keys;
}

/**
 * Invalidate all cache entries for a tenant
 */
export async function invalidateTenantCache(
  tenant: TenantContext
): Promise<void> {
  const cacheKeys = getTenantCacheKeys(tenant);

  for (const key of cacheKeys) {
    try {
      await deleteTenantCache("global", key);
    } catch (error) {
      console.error(`Failed to invalidate cache key ${key}:`, error);
    }
  }
}

// =====================================================================================
// DEVELOPMENT HELPERS
// =====================================================================================

/**
 * Create a mock tenant for development/testing
 */
export function createMockTenant(
  overrides: Partial<TenantContext> = {}
): TenantContext {
  return {
    id: "mock-tenant-id",
    name: "Mock Restaurant",
    domain: "mock-restaurant.com",
    subdomain: "mock",
    email: "owner@mock-restaurant.com",
    phone: "+1-555-0123",
    address: {
      street: "123 Main St",
      city: "Anytown",
      state: "NY",
      zipCode: "12345",
      country: "US",
    },
    settings: {
      enableOrders: true,
      enableLoyalty: true,
      currency: "USD",
      timezone: "America/New_York",
    },
    stripeAccountId: null,
    features: ["menu", "orders", "loyalty"],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Get development tenant for localhost
 */
export async function getDevTenant(): Promise<TenantContext> {
  // In development, you might want to:
  // 1. Use environment variable to specify default tenant
  // 2. Load from a seed tenant in database
  // 3. Return a mock tenant

  const devTenantId = process.env.DEV_TENANT_ID;
  if (devTenantId) {
    const tenant = await getTenantById(devTenantId);
    if (tenant) {
      return tenant;
    }
  }

  // Fallback to mock tenant for development
  return createMockTenant();
}
