/**
 * Redis Connection and Caching Utilities
 * 
 * This module provides Redis connection management and caching utilities
 * for the multi-tenant GrowPlate platform with tenant-scoped keys.
 */

import { createClient, RedisClientType } from "redis";
import type { RedisConfig, CacheValue, CacheOptions } from "~/types/database";

// Redis configuration from environment variables
const getConfig = (): RedisConfig => {
  // Support REDIS_URL override (common in cloud environments)
  if (process.env.REDIS_URL) {
    return {
      url: process.env.REDIS_URL,
      keyPrefix: process.env.REDIS_KEY_PREFIX || "growplate:",
    };
  }

  return {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || "0"),
    keyPrefix: process.env.REDIS_KEY_PREFIX || "growplate:",
    
    // Connection settings
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || "5000"),
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
  };
};

// Create Redis client
const config = getConfig();
const client: RedisClientType = createClient(config);

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
  console.error("Redis client error:", error instanceof Error ? error.message : "Unknown error");
  isConnected = false;
  isConnecting = false;
  // Allow future reconnect attempts
  connectionPromise = null;
});

client.on("end", () => {
  console.log("Redis client connection ended");
  isConnected = false;
  isConnecting = false;
  // Reset connection promise for reconnection
  connectionPromise = null;
});

/**
 * Ensure Redis connection is established (prevents race conditions)
 */
const ensureConnection = async (): Promise<void> => {
  // Check actual client readiness
  if (isConnected && client.isReady) {
    return;
  }

  if (connectionPromise) {
    await connectionPromise;
    // Verify connection actually succeeded
    if (isConnected && client.isReady) return;
    // Fall through to retry if prior attempt didn't yield ready client
  }

  connectionPromise = (async () => {
    try {
      isConnecting = true;
      await client.connect();
      isConnected = true;
    } catch (error) {
      console.error("Failed to connect to Redis:", error instanceof Error ? error.message : "Unknown error");
      throw error;
    } finally {
      // Always clear the latch
      connectionPromise = null;
      isConnecting = false;
    }
  })();

  await connectionPromise;

  // Ensure callers can react if not ready after attempt
  if (!client.isReady) {
    throw new Error("Redis client not ready after connect attempt");
  }
};

/**
 * Generate a tenant-scoped cache key
 */
const getTenantKey = (tenantId: string, key: string): string => {
  return `${config.keyPrefix}tenant:${tenantId}:${key}`;
};

/**
 * Generate a global cache key (not tenant-scoped)
 */
const getGlobalKey = (key: string): string => {
  return `${config.keyPrefix}global:${key}`;
};

/**
 * Serialize a value for Redis storage
 */
const serialize = (value: CacheValue): string => {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
};

/**
 * Deserialize a value from Redis storage with type safety
 */
const deserialize = <T = CacheValue>(value: string | null): T | null => {
  if (value === null) return null;
  
  try {
    return JSON.parse(value) as T;
  } catch {
    // If parsing fails, the data is corrupt or not JSON
    console.warn("Redis deserialize: Failed to parse cached value as JSON");
    return null;
  }
};

/**
 * Set a value in cache with optional TTL (tenant-scoped)
 */
export const setTenantCache = async <T extends CacheValue>(
  tenantId: string,
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<boolean> => {
  try {
    await ensureConnection();
    
    const cacheKey = getTenantKey(tenantId, key);
    const serializedValue = serialize(value);
    
    if (options.ttl) {
      await client.setEx(cacheKey, options.ttl, serializedValue);
    } else {
      await client.set(cacheKey, serializedValue);
    }
    
    return true;
  } catch (error) {
    console.error("Redis set error:", {
      operation: "setTenantCache",
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return false;
  }
};

/**
 * Get a value from cache (tenant-scoped)
 */
export const getTenantCache = async <T = CacheValue>(
  tenantId: string,
  key: string
): Promise<T | null> => {
  try {
    await ensureConnection();
    
    const cacheKey = getTenantKey(tenantId, key);
    const value = await client.get(cacheKey);
    
    return deserialize<T>(value);
  } catch (error) {
    console.error("Redis get error:", {
      operation: "getTenantCache",
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return null;
  }
};

/**
 * Delete a value from cache (tenant-scoped)
 */
export const deleteTenantCache = async (
  tenantId: string,
  key: string
): Promise<boolean> => {
  try {
    await ensureConnection();
    
    const cacheKey = getTenantKey(tenantId, key);
    const deleted = await client.del(cacheKey);
    
    return deleted > 0;
  } catch (error) {
    console.error("Redis delete error:", {
      operation: "deleteTenantCache",
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return false;
  }
};

/**
 * Set a global value in cache (not tenant-scoped)
 */
export const setGlobalCache = async <T extends CacheValue>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<boolean> => {
  try {
    await ensureConnection();
    
    const cacheKey = getGlobalKey(key);
    const serializedValue = serialize(value);
    
    if (options.ttl) {
      await client.setEx(cacheKey, options.ttl, serializedValue);
    } else {
      await client.set(cacheKey, serializedValue);
    }
    
    return true;
  } catch (error) {
    console.error("Redis set global error:", {
      operation: "setGlobalCache",
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return false;
  }
};

/**
 * Get a global value from cache (not tenant-scoped)
 */
export const getGlobalCache = async <T = CacheValue>(
  key: string
): Promise<T | null> => {
  try {
    await ensureConnection();
    
    const cacheKey = getGlobalKey(key);
    const value = await client.get(cacheKey);
    
    return deserialize<T>(value);
  } catch (error) {
    console.error("Redis get global error:", {
      operation: "getGlobalCache",
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return null;
  }
};

/**
 * Delete a global value from cache
 */
export const deleteGlobalCache = async (key: string): Promise<boolean> => {
  try {
    await ensureConnection();
    
    const cacheKey = getGlobalKey(key);
    const deleted = await client.del(cacheKey);
    
    return deleted > 0;
  } catch (error) {
    console.error("Redis delete global error:", {
      operation: "deleteGlobalCache",
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return false;
  }
};

/**
 * Clear all cache entries for a specific tenant using non-blocking SCAN
 */
export const clearTenantCache = async (tenantId: string): Promise<number> => {
  try {
    await ensureConnection();
    
    const pattern = getTenantKey(tenantId, "*");
    const keysToDelete: string[] = [];
    let cursor = 0;

    // Use non-blocking SCAN instead of blocking KEYS
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
    console.error("Redis clear tenant cache error:", {
      operation: "clearTenantCache",
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return 0;
  }
};

/**
 * Get cache with automatic refresh callback
 */
export const getCacheOrFetch = async <T extends CacheValue>(
  tenantId: string,
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> => {
  // Try to get from cache first
  const cached = await getTenantCache<T>(tenantId, key);
  if (cached !== null) {
    return cached;
  }

  // Not in cache, fetch the data
  const data = await fetchFn();
  
  // Store in cache for next time
  await setTenantCache(tenantId, key, data, options);
  
  return data;
};

/**
 * Check Redis connection health
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    await ensureConnection();
    await client.ping();
    return true;
  } catch (error) {
    console.error("Redis health check failed:", {
      operation: "healthCheck",
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return false;
  }
};

/**
 * Get Redis connection status
 */
export const getConnectionStatus = () => ({
  isConnected,
  isConnecting,
  isReady: client.isReady,
});

/**
 * Close Redis connection
 * Useful for graceful shutdown
 */
export const closeConnection = async (): Promise<void> => {
  if (isConnected || isConnecting) {
    await client.quit();
    console.log("Redis connection closed");
  }
};

/**
 * Raw Redis client access for advanced use cases
 * Use with caution - prefer the helper functions above
 */
export const getRawClient = (): RedisClientType => client;

// Common cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 60 * 5,        // 5 minutes
  MEDIUM: 60 * 30,      // 30 minutes  
  LONG: 60 * 60 * 2,    // 2 hours
  VERY_LONG: 60 * 60 * 24, // 24 hours
} as const;

// Graceful shutdown handlers
process.on("SIGINT", async () => {
  console.log("Received SIGINT, closing Redis connection...");
  await closeConnection();
});

process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, closing Redis connection...");
  await closeConnection();
});