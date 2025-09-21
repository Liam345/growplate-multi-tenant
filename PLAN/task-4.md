TASK-004: Tenant Resolution Middleware Implementation Plan │ │
│ │ │ │
│ │ 📋 Overview │ │
│ │ │ │
│ │ Implement middleware to resolve tenant from domain/subdomain in Remix, with Redis caching and proper error handling for multi-tenant isolation. │ │
│ │ │ │
│ │ ✅ Prerequisites Completed │ │
│ │ │ │
│ │ - ✅ TASK-001: Remix project structure │ │
│ │ - ✅ TASK-002: Database schema with tenants table │ │
│ │ - ✅ TASK-003: Database connections (PostgreSQL + Redis) │ │
│ │ │ │
│ │ 🎯 Implementation Strategy │ │
│ │ │ │
│ │ Phase 1: Core Tenant Resolution (30 min) │ │
│ │ │ │
│ │ 1. Create tenant utility functions (app/lib/tenant.ts) │ │
│ │ - Extract tenant from request hostname │ │
│ │ - Database queries for tenant lookup │ │
│ │ - Domain parsing logic (custom domains + subdomains) │ │
│ │ - Error handling for tenant not found │ │
│ │ 2. Create tenant TypeScript interfaces (app/types/tenant.ts) │ │
│ │ - TenantContext interface with id, name, domain, settings, features │ │
│ │ - Domain resolution types │ │
│ │ - Error types for tenant resolution │ │
│ │ │ │
│ │ Phase 2: Middleware Implementation (15 min) │ │
│ │ │ │
│ │ 3. Create tenant middleware (app/middleware/tenant.ts) │ │
│ │ - Remix-compatible middleware function │ │
│ │ - Request hostname extraction │ │
│ │ - Tenant resolution and caching │ │
│ │ - Context injection into requests │ │
│ │ - Proper error responses for invalid domains │ │
│ │ │ │
│ │ Phase 3: Redis Caching Integration (15 min) │ │
│ │ │ │
│ │ 4. Implement tenant caching │ │
│ │ - Redis cache key strategy: tenant:domain:{domain} │ │
│ │ - Cache tenant data with 1-hour TTL │ │
│ │ - Cache invalidation on tenant updates │ │
│ │ - Fallback to database on cache miss │ │
│ │ │ │
│ │ Phase 4: Integration & Testing (15 min) │ │
│ │ │ │
│ │ 5. Remix route integration │ │
│ │ - Add middleware to appropriate routes │ │
│ │ - Type-safe tenant context access │ │
│ │ - Error boundary for tenant resolution failures │ │
│ │ 6. Validation & Testing │ │
│ │ - Test domain resolution (both custom domains and subdomains) │ │
│ │ - Verify Redis caching works │ │
│ │ - Confirm proper error handling │ │
│ │ - TypeScript compilation validation │ │
│ │ │ │
│ │ 📁 Files to Create/Modify │ │
│ │ │ │
│ │ New Files: │ │
│ │ │ │
│ │ - app/lib/tenant.ts - Core tenant utilities and database operations │ │
│ │ - app/middleware/tenant.ts - Remix tenant resolution middleware │ │
│ │ - app/types/tenant.ts - TypeScript interfaces for tenant context │ │
│ │ │ │
│ │ Integration Points: │ │
│ │ │ │
│ │ - Add tenant context to route loaders where needed │ │
│ │ - Integrate with existing Redis connection (app/lib/redis.ts) │ │
│ │ - Use existing database connection (app/lib/db.ts) │ │
│ │ │ │
│ │ 🔧 Technical Specifications │ │
│ │ │ │
│ │ Domain Resolution Strategy: │ │
│ │ │ │
│ │ - Custom Domains: restaurant.com → lookup by domain │ │
│ │ - Subdomains: restaurant.growplate.com → lookup by subdomain │ │
│ │ - Development: localhost:3000 → default tenant or tenant selection │ │
│ │ │ │
│ │ Caching Strategy: │ │
│ │ │ │
│ │ - Cache Key: growplate:tenant:domain:{hostname} │ │
│ │ - TTL: 3600 seconds (1 hour) │ │
│ │ - Cache Invalidation: Manual on tenant updates │ │
│ │ - Fallback: Database query on cache miss │ │
│ │ │ │
│ │ Error Handling: │ │
│ │ │ │
│ │ - Tenant Not Found: Return 404 with clear error message │ │
│ │ - Database Errors: Return 500 with logging │ │
│ │ - Cache Failures: Fallback to database, log warning │ │
│ │ - Invalid Domains: Return 400 with validation error │ │
│ │ │ │
│ │ 🎯 Success Criteria │ │
│ │ │ │
│ │ 1. Middleware correctly identifies tenant from hostname │ │
│ │ 2. Tenant data cached efficiently in Redis (sub-100ms lookup) │ │
│ │ 3. Proper error handling for invalid domains │ │
│ │ 4. TypeScript types provide full type safety │ │
│ │ 5. Integration works seamlessly with Remix routes │ │
│ │ 6. All TypeScript compilation passes without errors │ │
│ │ │ │
│ │ 🚀 Post-Implementation Validation │ │
│ │ │ │
│ │ - Test with multiple domain formats │ │
│ │ - Verify Redis cache hit/miss scenarios │ │
│ │ - Confirm tenant isolation works correctly │ │
│ │ - Validate error responses are user-friendly │ │
│ │ - Ready for TASK-005: Feature Flag System │ │
│ │ │ │
│ │ This implementation will provide the foundation for multi-tenant functionality, ensuring proper tenant isolation and efficient performance through Redis caching.
