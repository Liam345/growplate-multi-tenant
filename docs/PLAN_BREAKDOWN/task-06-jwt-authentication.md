# TASK-006: JWT Authentication System - Implementation Plan

## 📋 Task Overview

**Complexity**: Medium | **Estimated Time**: 60 min | **Dependencies**: TASK-004 (Tenant Resolution Middleware)

**Description**: Implement JWT-based authentication with tenant and role scoping for the GrowPlate multi-tenant restaurant management platform.

## 🎯 Objectives

- Create secure JWT token generation and validation system
- Implement tenant-scoped authentication with role-based access control
- Build authentication middleware for API route protection
- Establish user registration and login API endpoints
- Ensure password security with bcrypt hashing

## 🏗️ Technical Architecture

### 1. Authentication Flow Design

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │    │   Auth Endpoint  │    │  Protected API  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         │ 1. Login Request       │                       │
         ├───────────────────────►│                       │
         │   (email, password)    │                       │
         │                        │ 2. Validate User     │
         │                        │    & Tenant          │
         │                        │                       │
         │ 3. JWT Token           │                       │
         │◄───────────────────────┤                       │
         │                        │                       │
         │ 4. API Request         │                       │
         │    (Authorization:     │                       │
         │     Bearer <token>)    │                       │
         ├─────────────────────────────────────────────►│
         │                        │                       │
         │                        │                       │ 5. Validate JWT
         │                        │                       │    & Extract Context
         │                        │                       │
         │ 6. API Response        │                       │
         │◄───────────────────────────────────────────────┤
```

### 2. JWT Payload Structure

```typescript
interface JWTPayload {
  // Core Identity
  userId: string;           // User UUID
  tenantId: string;         // Tenant UUID  
  email: string;            // User email
  
  // Authorization
  role: 'owner' | 'staff' | 'customer';
  
  // Token Metadata
  iat: number;              // Issued at
  exp: number;              // Expires at
  iss: string;              // Issuer (growplate.com)
  aud: string;              // Audience (api.growplate.com)
}
```

### 3. Security Implementation

#### Password Security
- **Hashing Algorithm**: bcrypt with salt rounds = 12
- **Minimum Requirements**: 8+ characters, validated on frontend
- **Storage**: Only password hashes stored, never plaintext

#### JWT Security
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Secret Key**: Environment variable (min 32 characters)
- **Token Expiration**: 24 hours (configurable)
- **Refresh Strategy**: New token required after expiry

#### Tenant Isolation
- **Token Scoping**: Every JWT contains tenantId
- **Middleware Validation**: Verify token tenant matches request tenant
- **Cross-Tenant Protection**: Reject requests with mismatched tenant context

## 📁 File Structure

```
src/
├── lib/
│   ├── auth.ts                 # Core auth utilities
│   └── password.ts             # Password hashing utilities
├── middleware/
│   └── auth.ts                 # Authentication middleware
├── types/
│   └── auth.ts                 # Authentication TypeScript types
└── utils/
    └── jwt.ts                  # JWT utilities

app/routes/
├── api.auth.login.ts           # Login endpoint
├── api.auth.register.ts        # Registration endpoint
├── api.auth.refresh.ts         # Token refresh endpoint
└── api.auth.logout.ts          # Logout endpoint (optional)
```

## 🔧 Implementation Steps

### Step 1: Core Authentication Utilities
**File**: `src/lib/auth.ts`

```typescript
// Core functions to implement:
- generateJWT(payload: JWTPayload): string
- verifyJWT(token: string): JWTPayload | null
- hashPassword(password: string): Promise<string>
- verifyPassword(password: string, hash: string): Promise<boolean>
- createAuthResponse(user: User, tenant: Tenant): AuthResponse
```

### Step 2: Password Security
**File**: `src/lib/password.ts`

```typescript
// Password management functions:
- hashPassword(password: string): Promise<string>
- verifyPassword(password: string, hash: string): Promise<boolean>
- validatePasswordStrength(password: string): ValidationResult
```

### Step 3: JWT Utilities  
**File**: `src/utils/jwt.ts`

```typescript
// JWT-specific utilities:
- createToken(payload: JWTPayload): string
- validateToken(token: string): JWTPayload | null
- extractTokenFromHeader(authHeader: string): string | null
- isTokenExpired(payload: JWTPayload): boolean
```

### Step 4: Authentication Middleware
**File**: `src/middleware/auth.ts`

```typescript
// Middleware functions:
- authenticateRequest(request: Request): Promise<AuthContext>
- requireAuth(roles?: Role[]): MiddlewareFunction
- extractUserContext(request: Request): Promise<UserContext>
- validateTenantMatch(token: JWTPayload, tenant: Tenant): boolean
```

### Step 5: API Endpoints

#### Login Endpoint
**File**: `app/routes/api.auth.login.ts`
```typescript
POST /api/auth/login
Request: { email: string, password: string }
Response: { token: string, user: UserProfile, expiresAt: string }
```

#### Registration Endpoint  
**File**: `app/routes/api.auth.register.ts`
```typescript
POST /api/auth/register
Request: { email: string, password: string, firstName: string, lastName: string, role?: Role }
Response: { token: string, user: UserProfile, expiresAt: string }
```

#### Token Refresh Endpoint
**File**: `app/routes/api.auth.refresh.ts`
```typescript
POST /api/auth/refresh
Headers: { Authorization: "Bearer <token>" }
Response: { token: string, expiresAt: string }
```

### Step 6: TypeScript Types
**File**: `src/types/auth.ts`

```typescript
// All authentication-related types:
- JWTPayload
- AuthResponse  
- UserContext
- AuthContext
- LoginRequest
- RegisterRequest
- Role enum
- AuthError types
```

## 🔐 Security Requirements

### 1. Password Security
- Minimum 8 characters length validation
- bcrypt hashing with salt rounds = 12
- No password storage in logs or error messages
- Rate limiting on login attempts (future enhancement)

### 2. JWT Security
- Secure secret key from environment variables
- Token expiration enforcement (24 hours)
- Algorithm specification (HS256)
- Proper token validation in middleware

### 3. Tenant Isolation
- JWT tokens must include tenantId
- Middleware validates token tenant matches request tenant
- Cross-tenant access prevention
- Tenant context injection into request

### 4. API Security
- Input validation on all endpoints
- Proper error handling without information leakage
- HTTPS enforcement (production)
- Secure headers configuration

## 🧪 Testing Strategy

### 1. Unit Tests
- **Password utilities**: Hashing and verification
- **JWT utilities**: Token generation and validation
- **Auth utilities**: Core authentication functions
- **Middleware**: Authentication and authorization logic

### 2. Integration Tests
- **Login flow**: End-to-end authentication
- **Registration flow**: User creation and token generation
- **Protected routes**: Middleware protection verification
- **Tenant isolation**: Cross-tenant access prevention

### 3. Security Tests
- **Invalid tokens**: Malformed, expired, tampered tokens
- **Wrong tenant**: Cross-tenant access attempts
- **Brute force**: Multiple failed login attempts
- **Edge cases**: Missing headers, invalid payloads

## 🔗 Integration Points

### Dependencies (Must Exist)
- **TASK-004**: Tenant resolution middleware provides `req.tenant`
- **Database connection**: User queries and tenant validation
- **Environment configuration**: JWT secrets and database credentials

### Enables (Future Tasks)
- **Menu API (TASK-010)**: Uses auth middleware for protection
- **Order API (TASK-016)**: Customer authentication for orders
- **Loyalty API (TASK-020)**: Customer point management
- **Admin routes**: Owner/staff role protection

### Integration Interfaces

```typescript
// Middleware provides this context to protected routes
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    tenantId: string;
    email: string;
    role: Role;
  };
  tenant: {
    id: string;
    domain: string;
    name: string;
  };
}
```

## 📊 Performance Considerations

### 1. Token Operations
- **JWT Generation**: < 10ms per token
- **JWT Validation**: < 5ms per validation
- **Password Hashing**: < 100ms per hash (bcrypt cost factor 12)

### 2. Middleware Performance
- **Authentication Check**: < 2ms per request
- **Database Queries**: Minimal - leverage cached tenant data
- **Memory Usage**: Stateless design, no server-side session storage

### 3. Caching Strategy
- **No caching**: JWTs are stateless, no server-side storage needed
- **User data**: Leverage existing tenant caching from TASK-004
- **Rate limiting**: Future enhancement for production

## 🚨 Error Handling

### 1. Authentication Errors
```typescript
enum AuthErrorCode {
  INVALID_CREDENTIALS = 'invalid_credentials',
  TOKEN_EXPIRED = 'token_expired',
  TOKEN_INVALID = 'token_invalid',
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',
  TENANT_MISMATCH = 'tenant_mismatch',
  USER_NOT_FOUND = 'user_not_found'
}
```

### 2. Error Response Format
```typescript
interface AuthErrorResponse {
  error: {
    code: AuthErrorCode;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
  path: string;
}
```

### 3. Error Scenarios
- **Invalid login**: Clear message without revealing if email exists
- **Expired token**: Prompt for re-authentication
- **Insufficient permissions**: Role-based error messages
- **Tenant mismatch**: Security violation logging
- **Malformed requests**: Input validation errors

## 📋 Environment Variables

```bash
# Required for Task 6
JWT_SECRET=your-super-secure-secret-key-min-32-chars
JWT_EXPIRES_IN=24h
JWT_ISSUER=growplate.com
JWT_AUDIENCE=api.growplate.com

# Password Security
BCRYPT_SALT_ROUNDS=12

# Database (from previous tasks)
DATABASE_URL=postgresql://username:password@localhost:5432/growplate
```

## ✅ Success Criteria

### Functional Requirements
1. Users can register with email/password ✓
2. Users can login and receive JWT token ✓
3. JWT tokens contain user, tenant, and role information ✓
4. Authentication middleware protects API routes ✓
5. Role-based access control functions correctly ✓
6. Tenant isolation prevents cross-tenant access ✓

### Technical Requirements  
1. Password hashing uses bcrypt with appropriate salt rounds ✓
2. JWT tokens are properly signed and validated ✓
3. TypeScript types provide full type safety ✓
4. Error handling provides clear, secure feedback ✓
5. Integration interfaces are clean and well-documented ✓

### Security Requirements
1. Passwords are never stored in plaintext ✓
2. JWT secrets are secure and environment-based ✓
3. Token validation prevents tampering and replay attacks ✓
4. Tenant isolation is enforced at the authentication layer ✓
5. Error messages don't leak sensitive information ✓

## 🔄 Future Enhancements (Out of Scope)

- Password reset functionality
- Multi-factor authentication (MFA)
- OAuth integration (Google, Facebook)
- Rate limiting and brute force protection
- Session management and concurrent login limits
- Audit logging for authentication events
- Token blacklisting for logout functionality

---

**Next Phase**: After Task 6 completion, the authentication system will be ready to protect API endpoints in Phase 2 (Menu Management) and beyond.