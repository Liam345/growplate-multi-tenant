/**
 * Authentication Types for GrowPlate Multi-Tenant Platform
 * 
 * This file contains all TypeScript types and interfaces related to authentication,
 * JWT tokens, user roles, and authorization in the multi-tenant system.
 */

// =====================================================================================
// CORE AUTHENTICATION TYPES
// =====================================================================================

/**
 * User roles in the multi-tenant system
 * - owner: Restaurant owner with full access
 * - staff: Restaurant staff with limited access
 * - customer: Customers who place orders
 */
export type Role = 'owner' | 'staff' | 'customer';

/**
 * JWT Payload structure containing all necessary user and tenant information
 */
export interface JWTPayload {
  /** User UUID */
  userId: string;
  /** Tenant UUID for multi-tenant isolation */
  tenantId: string;
  /** User email address */
  email: string;
  /** User role for authorization */
  role: Role;
  /** Token issued at timestamp */
  iat: number;
  /** Token expiration timestamp */
  exp: number;
  /** Token issuer */
  iss: string;
  /** Token audience */
  aud: string;
}

/**
 * User context extracted from JWT and injected into requests
 */
export interface UserContext {
  /** User UUID */
  id: string;
  /** Tenant UUID */
  tenantId: string;
  /** User email */
  email: string;
  /** User role */
  role: Role;
  /** First name */
  firstName?: string;
  /** Last name */
  lastName?: string;
}

/**
 * Authentication context containing both user and tenant information
 */
export interface AuthContext {
  /** Authenticated user information */
  user: UserContext;
  /** Tenant information from tenant resolution middleware */
  tenant: {
    id: string;
    domain: string;
    name: string;
    settings?: Record<string, any>;
  };
}

// =====================================================================================
// API REQUEST/RESPONSE TYPES
// =====================================================================================

/**
 * Login request payload
 */
export interface LoginRequest {
  /** User email address */
  email: string;
  /** User password */
  password: string;
}

/**
 * Registration request payload
 */
export interface RegisterRequest {
  /** User email address */
  email: string;
  /** User password (min 8 characters) */
  password: string;
  /** User first name */
  firstName: string;
  /** User last name */
  lastName: string;
  /** User role (defaults to 'customer' if not specified) */
  role?: Role;
  /** Phone number (optional) */
  phone?: string;
}

/**
 * User profile information returned in authentication responses
 */
export interface UserProfile {
  /** User UUID */
  id: string;
  /** User email */
  email: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** User role */
  role: Role;
  /** Phone number */
  phone?: string;
  /** Loyalty points (for customers) */
  loyaltyPoints?: number;
  /** Account creation timestamp */
  createdAt: string;
}

/**
 * Successful authentication response
 */
export interface AuthResponse {
  /** JWT token for subsequent requests */
  token: string;
  /** User profile information */
  user: UserProfile;
  /** Token expiration timestamp */
  expiresAt: string;
}

/**
 * Token refresh response
 */
export interface RefreshResponse {
  /** New JWT token */
  token: string;
  /** New token expiration timestamp */
  expiresAt: string;
}

// =====================================================================================
// ERROR TYPES
// =====================================================================================

/**
 * Authentication error codes
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'invalid_credentials',
  TOKEN_EXPIRED = 'token_expired',
  TOKEN_INVALID = 'token_invalid',
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',
  TENANT_MISMATCH = 'tenant_mismatch',
  USER_NOT_FOUND = 'user_not_found',
  EMAIL_ALREADY_EXISTS = 'email_already_exists',
  WEAK_PASSWORD = 'weak_password',
  MISSING_TOKEN = 'missing_token',
  MALFORMED_TOKEN = 'malformed_token'
}

/**
 * Authentication error structure
 */
export interface AuthError {
  /** Error code for programmatic handling */
  code: AuthErrorCode;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, any>;
}

/**
 * Standardized error response format
 */
export interface AuthErrorResponse {
  /** Error information */
  error: AuthError;
  /** Error timestamp */
  timestamp: string;
  /** Request path where error occurred */
  path: string;
}

// =====================================================================================
// VALIDATION TYPES
// =====================================================================================

/**
 * Password strength validation result
 */
export interface PasswordValidationResult {
  /** Whether password meets requirements */
  isValid: boolean;
  /** Validation error messages */
  errors: string[];
  /** Password strength score (0-100) */
  score?: number;
}

/**
 * Input validation result
 */
export interface ValidationResult {
  /** Whether input is valid */
  isValid: boolean;
  /** Field-specific error messages */
  errors: Record<string, string[]>;
}

// =====================================================================================
// MIDDLEWARE TYPES
// =====================================================================================

/**
 * Extended request type with authentication context
 * Used by authentication middleware to inject user/tenant context
 */
export interface AuthenticatedRequest extends Request {
  /** Authenticated user information */
  user: UserContext;
  /** Tenant information (from tenant resolution middleware) */
  tenant: {
    id: string;
    domain: string;
    name: string;
    settings?: Record<string, any>;
  };
}

/**
 * Middleware configuration options
 */
export interface AuthMiddlewareOptions {
  /** Required roles for access (empty means any authenticated user) */
  requiredRoles?: Role[];
  /** Whether to allow requests without authentication */
  optional?: boolean;
  /** Custom error handler */
  onError?: (error: AuthError) => Response;
}

// =====================================================================================
// DATABASE TYPES
// =====================================================================================

/**
 * User data structure from database
 */
export interface UserData {
  /** User UUID */
  id: string;
  /** Tenant UUID */
  tenant_id: string;
  /** User email */
  email: string;
  /** Hashed password */
  password_hash: string;
  /** First name */
  first_name: string;
  /** Last name */
  last_name: string;
  /** User role */
  role: Role;
  /** Phone number */
  phone?: string;
  /** Loyalty points */
  loyalty_points: number;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
}

/**
 * User creation data for database insertion
 */
export interface CreateUserData {
  /** Tenant UUID */
  tenant_id: string;
  /** User email */
  email: string;
  /** Hashed password */
  password_hash: string;
  /** First name */
  first_name: string;
  /** Last name */
  last_name: string;
  /** User role */
  role: Role;
  /** Phone number */
  phone?: string;
}

// =====================================================================================
// UTILITY TYPES
// =====================================================================================

/**
 * JWT token creation options
 */
export interface TokenOptions {
  /** Token expiration time (default: 24h) */
  expiresIn?: string;
  /** Token issuer (default: from env) */
  issuer?: string;
  /** Token audience (default: from env) */
  audience?: string;
}

/**
 * Password hashing options
 */
export interface HashOptions {
  /** bcrypt salt rounds (default: 12) */
  saltRounds?: number;
}

/**
 * Authentication configuration
 */
export interface AuthConfig {
  /** JWT secret key */
  jwtSecret: string;
  /** JWT expiration time */
  jwtExpiresIn: string;
  /** JWT issuer */
  jwtIssuer: string;
  /** JWT audience */
  jwtAudience: string;
  /** bcrypt salt rounds */
  bcryptSaltRounds: number;
}

// =====================================================================================
// TYPE GUARDS AND UTILITIES
// =====================================================================================

/**
 * Type guard to check if a value is a valid Role
 */
export function isValidRole(value: any): value is Role {
  return typeof value === 'string' && ['owner', 'staff', 'customer'].includes(value);
}

/**
 * Type guard to check if an object is a valid JWTPayload
 */
export function isValidJWTPayload(payload: any): payload is JWTPayload {
  return (
    payload &&
    typeof payload.userId === 'string' &&
    typeof payload.tenantId === 'string' &&
    typeof payload.email === 'string' &&
    isValidRole(payload.role) &&
    typeof payload.iat === 'number' &&
    typeof payload.exp === 'number'
  );
}

/**
 * Type guard to check if request has authentication context
 */
export function isAuthenticatedRequest(req: any): req is AuthenticatedRequest {
  return req && req.user && req.tenant;
}

// All types are already exported above with their definitions