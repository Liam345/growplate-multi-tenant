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
  console.error("Redis client error:", error);
  isConnected = false;
  isConnecting = false;
});

client.on("end", () => {
  console.log("Redis client connection ended");
  isConnected = false;
  isConnecting = false;
});

/**
 * Ensure Redis connection is established
 */
const ensureConnection = async (): Promise<void> => {
  if (isConnected) return;
  
  if (isConnecting) {
    // Wait for connection to complete
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }

  try {
    await client.connect();
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    throw error;
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
 * Deserialize a value from Redis storage
 */
const deserialize = <T = CacheValue>(value: string | null): T | null => {
  if (value === null) return null;
  
  try {
    return JSON.parse(value) as T;
  } catch {
    // If parsing fails, return as string
    return value as T;
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
    console.error("Redis set error:", error);
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
    console.error("Redis get error:", error);
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
    console.error("Redis delete error:", error);
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
    console.error("Redis set global error:", error);
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
    console.error("Redis get global error:", error);
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
    console.error("Redis delete global error:", error);
    return false;
  }
};

/**
 * Clear all cache entries for a specific tenant
 */
export const clearTenantCache = async (tenantId: string): Promise<number> => {
  try {
    await ensureConnection();
    
    const pattern = getTenantKey(tenantId, "*");
    const keys = await client.keys(pattern);
    
    if (keys.length === 0) return 0;
    
    const deleted = await client.del(keys);
    return deleted;
  } catch (error) {
    console.error("Redis clear tenant cache error:", error);
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
    console.error("Redis health check failed:", error);
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