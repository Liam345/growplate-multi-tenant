TASK-003: Database Connection Setup Implementation Plan                                                                                                                     │ │
│ │                                                                                                                                                                             │ │
│ │ Overview                                                                                                                                                                    │ │
│ │                                                                                                                                                                             │ │
│ │ I'll create TypeScript database and Redis connection modules with proper connection pooling, environment configuration, and error handling for the GrowPlate multi-tenant   │ │
│ │ platform.                                                                                                                                                                   │ │
│ │                                                                                                                                                                             │ │
│ │ Implementation Strategy                                                                                                                                                     │ │
│ │                                                                                                                                                                             │ │
│ │ 1. File Structure Updates                                                                                                                                                   │ │
│ │                                                                                                                                                                             │ │
│ │ Note: Task requirements specify src/lib/ but our Remix project uses app/lib/. I'll follow Remix conventions:                                                                │ │
│ │ app/lib/                                                                                                                                                                    │ │
│ │ ├── db.ts              # PostgreSQL connection with pooling                                                                                                                 │ │
│ │ ├── redis.ts           # Redis connection with retry logic                                                                                                                  │ │
│ │ └── database.ts        # Database utility functions                                                                                                                         │ │
│ │ app/types/                                                                                                                                                                  │ │
│ │ └── database.ts        # Database-specific TypeScript interfaces                                                                                                            │ │
│ │                                                                                                                                                                             │ │
│ │ 2. Core Components                                                                                                                                                          │ │
│ │                                                                                                                                                                             │ │
│ │ PostgreSQL Connection (app/lib/db.ts)                                                                                                                                       │ │
│ │                                                                                                                                                                             │ │
│ │ - Connection Pooling: Using pg.Pool for efficient connection management                                                                                                     │ │
│ │ - Environment Variables: Typed configuration from environment                                                                                                               │ │
│ │ - Error Handling: Comprehensive error handling and logging                                                                                                                  │ │
│ │ - Health Checks: Connection validation functions                                                                                                                            │ │
│ │ - Retry Logic: Automatic reconnection on failures                                                                                                                           │ │
│ │ - Query Helpers: Typed query execution functions                                                                                                                            │ │
│ │                                                                                                                                                                             │ │
│ │ Redis Connection (app/lib/redis.ts)                                                                                                                                         │ │
│ │                                                                                                                                                                             │ │
│ │ - Redis Client: Using redis library with TypeScript                                                                                                                         │ │
│ │ - Connection Management: Automatic reconnection and health monitoring                                                                                                       │ │
│ │ - Error Handling: Graceful degradation when Redis unavailable                                                                                                               │ │
│ │ - Utility Functions: Common cache operations (get, set, del, expire)                                                                                                        │ │
│ │ - Serialization: JSON serialization for complex objects                                                                                                                     │ │
│ │                                                                                                                                                                             │ │
│ │ Database Types (app/types/database.ts)                                                                                                                                      │ │
│ │                                                                                                                                                                             │ │
│ │ - Row Types: Database row interfaces matching schema                                                                                                                        │ │
│ │ - Query Types: Parameter and result types for queries                                                                                                                       │ │
│ │ - Connection Types: Configuration and connection interfaces                                                                                                                 │ │
│ │ - Error Types: Database-specific error handling                                                                                                                             │ │
│ │                                                                                                                                                                             │ │
│ │ 3. Key Features                                                                                                                                                             │ │
│ │                                                                                                                                                                             │ │
│ │ Multi-Tenant Query Helpers                                                                                                                                                  │ │
│ │                                                                                                                                                                             │ │
│ │ - Automatic tenant_id injection for all queries                                                                                                                             │ │
│ │ - Type-safe query builders for common operations                                                                                                                            │ │
│ │ - Tenant isolation validation                                                                                                                                               │ │
│ │                                                                                                                                                                             │ │
│ │ Connection Pool Configuration                                                                                                                                               │ │
│ │                                                                                                                                                                             │ │
│ │ - Configurable pool size based on environment                                                                                                                               │ │
│ │ - Connection timeout and idle timeout settings                                                                                                                              │ │
│ │ - Health check intervals                                                                                                                                                    │ │
│ │                                                                                                                                                                             │ │
│ │ Environment Configuration                                                                                                                                                   │ │
│ │                                                                                                                                                                             │ │
│ │ - Comprehensive environment variable validation                                                                                                                             │ │
│ │ - Default values for development                                                                                                                                            │ │
│ │ - Production-ready configuration options                                                                                                                                    │ │
│ │                                                                                                                                                                             │ │
│ │ Error Handling Strategy                                                                                                                                                     │ │
│ │                                                                                                                                                                             │ │
│ │ - Database connection failures                                                                                                                                              │ │
│ │ - Query execution errors                                                                                                                                                    │ │
│ │ - Redis connection issues                                                                                                                                                   │ │
│ │ - Graceful degradation patterns                                                                                                                                             │ │
│ │                                                                                                                                                                             │ │
│ │ 4. Implementation Details                                                                                                                                                   │ │
│ │                                                                                                                                                                             │ │
│ │ Database Connection Features                                                                                                                                                │ │
│ │                                                                                                                                                                             │ │
│ │ - Pool Management: Min/max connections, idle timeout                                                                                                                        │ │
│ │ - Query Execution: Prepared statements, parameter binding                                                                                                                   │ │
│ │ - Transaction Support: BEGIN/COMMIT/ROLLBACK helpers                                                                                                                        │ │
│ │ - Health Monitoring: Connection status and metrics                                                                                                                          │ │
│ │ - Multi-Tenant Safety: Automatic tenant_id validation                                                                                                                       │ │
│ │                                                                                                                                                                             │ │
│ │ Redis Connection Features                                                                                                                                                   │ │
│ │                                                                                                                                                                             │ │
│ │ - Caching Patterns: Set, get, delete with TTL                                                                                                                               │ │
│ │ - JSON Serialization: Automatic object serialization                                                                                                                        │ │
│ │ - Connection Resilience: Retry logic and fallback                                                                                                                           │ │
│ │ - Key Namespacing: Tenant-scoped cache keys                                                                                                                                 │ │
│ │ - Health Checks: Redis availability monitoring                                                                                                                              │ │
│ │                                                                                                                                                                             │ │
│ │ TypeScript Integration                                                                                                                                                      │ │
│ │                                                                                                                                                                             │ │
│ │ - Full Type Safety: All database operations typed                                                                                                                           │ │
│ │ - Interface Definitions: Match database schema exactly                                                                                                                      │ │
│ │ - Generic Helpers: Reusable query patterns                                                                                                                                  │ │
│ │ - Error Types: Specific error classifications                                                                                                                               │ │
│ │                                                                                                                                                                             │ │
│ │ 5. Files to Create                                                                                                                                                          │ │
│ │                                                                                                                                                                             │ │
│ │ app/lib/db.ts                                                                                                                                                               │ │
│ │                                                                                                                                                                             │ │
│ │ Complete PostgreSQL connection module with:                                                                                                                                 │ │
│ │ - Connection pool setup and configuration                                                                                                                                   │ │
│ │ - Query execution helpers with type safety                                                                                                                                  │ │
│ │ - Transaction management utilities                                                                                                                                          │ │
│ │ - Health check and monitoring functions                                                                                                                                     │ │
│ │ - Multi-tenant query helpers                                                                                                                                                │ │
│ │                                                                                                                                                                             │ │
│ │ app/lib/redis.ts                                                                                                                                                            │ │
│ │                                                                                                                                                                             │ │
│ │ Redis connection and caching module with:                                                                                                                                   │ │
│ │ - Redis client configuration and connection                                                                                                                                 │ │
│ │ - Cache operation helpers (get, set, delete, expire)                                                                                                                        │ │
│ │ - JSON serialization/deserialization                                                                                                                                        │ │
│ │ - Connection health monitoring                                                                                                                                              │ │
│ │ - Tenant-scoped key management                                                                                                                                              │ │
│ │                                                                                                                                                                             │ │
│ │ app/types/database.ts                                                                                                                                                       │ │
│ │                                                                                                                                                                             │ │
│ │ Database-specific TypeScript interfaces:                                                                                                                                    │ │
│ │ - Database row type definitions                                                                                                                                             │ │
│ │ - Query parameter and result types                                                                                                                                          │ │
│ │ - Connection configuration interfaces                                                                                                                                       │ │
│ │ - Error handling types                                                                                                                                                      │ │
│ │                                                                                                                                                                             │ │
│ │ Environment Configuration                                                                                                                                                   │ │
│ │                                                                                                                                                                             │ │
│ │ Update .env.example with database configuration options                                                                                                                     │ │
│ │                                                                                                                                                                             │ │
│ │ 6. Integration Points                                                                                                                                                       │ │
│ │                                                                                                                                                                             │ │
│ │ Environment Variables                                                                                                                                                       │ │
│ │                                                                                                                                                                             │ │
│ │ DATABASE_URL=postgresql://username:password@localhost:5432/growplate                                                                                                        │ │
│ │ DATABASE_HOST=localhost                                                                                                                                                     │ │
│ │ DATABASE_PORT=5432                                                                                                                                                          │ │
│ │ DATABASE_NAME=growplate_dev                                                                                                                                                 │ │
│ │ DATABASE_USER=username                                                                                                                                                      │ │
│ │ DATABASE_PASSWORD=password                                                                                                                                                  │ │
│ │ DATABASE_POOL_MIN=2                                                                                                                                                         │ │
│ │ DATABASE_POOL_MAX=10                                                                                                                                                        │ │
│ │ DATABASE_TIMEOUT=30000                                                                                                                                                      │ │
│ │                                                                                                                                                                             │ │
│ │ REDIS_URL=redis://localhost:6379                                                                                                                                            │ │
│ │ REDIS_HOST=localhost                                                                                                                                                        │ │
│ │ REDIS_PORT=6379                                                                                                                                                             │ │
│ │ REDIS_PASSWORD=                                                                                                                                                             │ │
│ │ REDIS_DB=0                                                                                                                                                                  │ │
│ │ REDIS_KEY_PREFIX=growplate:                                                                                                                                                 │ │
│ │                                                                                                                                                                             │ │
│ │ Connection Health Monitoring                                                                                                                                                │ │
│ │                                                                                                                                                                             │ │
│ │ - Database connection validation                                                                                                                                            │ │
│ │ - Redis availability checks                                                                                                                                                 │ │
│ │ - Automatic reconnection logic                                                                                                                                              │ │
│ │ - Error reporting and logging                                                                                                                                               │ │
│ │                                                                                                                                                                             │ │
│ │ Multi-Tenant Safety                                                                                                                                                         │ │
│ │                                                                                                                                                                             │ │
│ │ - Tenant ID validation in all queries                                                                                                                                       │ │
│ │ - Automatic tenant scoping for cache keys                                                                                                                                   │ │
│ │ - Row-level security helpers                                                                                                                                                │ │
│ │ - Data isolation verification                                                                                                                                               │ │
│ │                                                                                                                                                                             │ │
│ │ Acceptance Criteria Validation                                                                                                                                              │ │
│ │                                                                                                                                                                             │ │
│ │ ✅ Database connections work in development: PostgreSQL pool with health checks✅ Environment variables are properly typed: Full TypeScript environment config✅ Connection    │ │
│ │  pooling is configured: pg.Pool with optimized settings✅ Error handling for connection failures: Comprehensive error handling and retry logic✅ Redis connection working:    │ │
│ │ Full Redis client with caching utilities✅ TypeScript interfaces: Complete database entity type definitions                                                                  │ │
│ │                                                                                                                                                                             │ │
│ │ Testing Strategy                                                                                                                                                            │ │
│ │                                                                                                                                                                             │ │
│ │ 1. Connection Testing: Validate PostgreSQL and Redis connections                                                                                                            │ │
│ │ 2. Pool Testing: Verify connection pooling behavior                                                                                                                         │ │
│ │ 3. Error Handling: Test failure scenarios and recovery                                                                                                                      │ │
│ │ 4. Type Safety: Ensure all database operations are properly typed                                                                                                           │ │
│ │ 5. Multi-Tenant: Verify tenant isolation in queries                                                                                                                         │ │
│ │                                                                                                                                                                             │ │
│ │ This foundation will be ready for TASK-004: Tenant Resolution Middleware. 