/**
 * PostgreSQL Database Connection and Utilities
 * 
 * This module provides a connection pool and query utilities for the multi-tenant
 * GrowPlate platform with automatic tenant isolation and type safety.
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import type { 
  DatabaseConfig, 
  QueryParameters, 
  QueryFunction,
  TransactionFunction 
} from "~/types/database";

// Database configuration from environment variables
const getConfig = (): DatabaseConfig => {
  const config: DatabaseConfig = {
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "5432"),
    database: process.env.DATABASE_NAME || "growplate_dev", 
    user: process.env.DATABASE_USER || "postgres",
    password: process.env.DATABASE_PASSWORD || "",
    
    // Connection pool settings
    min: parseInt(process.env.DATABASE_POOL_MIN || "2"),
    max: parseInt(process.env.DATABASE_POOL_MAX || "10"),
    idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || "30000"),
    connectionTimeoutMillis: parseInt(process.env.DATABASE_TIMEOUT || "5000"),
    
    // Additional settings
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  };

  // Support DATABASE_URL override (common in cloud environments)
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: config.ssl,
      min: config.min,
      max: config.max,
      idleTimeoutMillis: config.idleTimeoutMillis,
      connectionTimeoutMillis: config.connectionTimeoutMillis,
    };
  }

  return config;
};

// Create the connection pool
const pool = new Pool(getConfig());

// Handle pool errors
pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err);
});

// Handle pool connection events
pool.on("connect", (client) => {
  console.log("PostgreSQL client connected");
});

/**
 * Execute a query with automatic error handling and logging
 */
export const query: QueryFunction = async <T extends QueryResultRow = any>(
  text: string,
  params?: QueryParameters
): Promise<QueryResult<T>> => {
  const start = Date.now();
  
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === "development") {
      console.log("Query executed:", { text, duration: `${duration}ms`, rows: result.rowCount });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    // Sanitized error logging - avoid exposing sensitive data
    const sanitizedError = {
      code: (error as any)?.code,
      message: error instanceof Error ? error.message : "Unknown error",
      duration: `${duration}ms`,
      // In production, avoid logging query text and parameters which may contain sensitive data
      ...(process.env.NODE_ENV === "development" && {
        query: text,
        paramCount: params?.length || 0
      })
    };
    
    console.error("Database query error:", sanitizedError);
    throw error;
  }
};

/**
 * Execute a query and return only the first row (or null)
 */
export const queryOne = async <T extends QueryResultRow = any>(
  text: string,
  params?: QueryParameters
): Promise<T | null> => {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
};

/**
 * Execute a query and return all rows
 */
export const queryMany = async <T extends QueryResultRow = any>(
  text: string,
  params?: QueryParameters
): Promise<T[]> => {
  const result = await query<T>(text, params);
  return result.rows;
};

/**
 * Execute multiple queries within a transaction
 */
export const transaction: TransactionFunction = async <T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Multi-tenant safe query using Row-Level Security
 * Requires database tables to have RLS policies that use app.tenant_id setting
 */
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
    // Begin explicit transaction - required for SET LOCAL to work properly
    await client.query("BEGIN");
    
    // Set tenant_id for RLS policies to use
    await client.query('SET LOCAL "app.tenant_id" = $1', [tenantId]);
    
    // Execute original query without modification - RLS handles tenant isolation
    const result = await client.query<T>(baseQuery, params);
    
    // Commit transaction
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback errors
    }
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Multi-tenant query for a single row
 */
export const tenantQueryOne = async <T extends QueryResultRow = any>(
  tenantId: string,
  baseQuery: string,
  params: QueryParameters = []
): Promise<T | null> => {
  const result = await tenantQuery<T>(tenantId, baseQuery, params);
  return result.rows[0] || null;
};

/**
 * Multi-tenant query for multiple rows
 */
export const tenantQueryMany = async <T extends QueryResultRow = any>(
  tenantId: string,
  baseQuery: string,
  params: QueryParameters = []
): Promise<T[]> => {
  const result = await tenantQuery<T>(tenantId, baseQuery, params);
  return result.rows;
};

/**
 * Check database connection health
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    await query("SELECT 1");
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
};

/**
 * Get connection pool status
 */
export const getPoolStatus = () => ({
  totalCount: pool.totalCount,
  idleCount: pool.idleCount,
  waitingCount: pool.waitingCount,
});

/**
 * Close all connections in the pool
 * Useful for graceful shutdown
 */
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log("Database connection pool closed");
};

/**
 * Raw pool access for advanced use cases
 * Use with caution - prefer the helper functions above
 */
export const getRawPool = (): Pool => pool;

// Graceful shutdown handler
process.on("SIGINT", async () => {
  console.log("Received SIGINT, closing database connections...");
  await closePool();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, closing database connections...");
  await closePool();
  process.exit(0);
});