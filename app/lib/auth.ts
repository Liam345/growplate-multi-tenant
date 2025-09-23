/**
 * Core Authentication Library for GrowPlate Multi-Tenant Platform
 * 
 * This module provides the main authentication functions that combine
 * password hashing, JWT token management, user validation, and database
 * operations for a complete authentication system.
 */

import { query } from './db';
import { hashPassword, verifyPassword } from './password';
import { createToken, validateToken } from './jwt';
import type {
  JWTPayload,
  UserContext,
  AuthResponse,
  UserProfile,
  UserData,
  CreateUserData,
  LoginRequest,
  RegisterRequest,
  Role,
  AuthError
} from '~/types/auth';
import { AuthErrorCode } from '~/types/auth';

// =====================================================================================
// USER DATABASE OPERATIONS
// =====================================================================================

/**
 * Find user by email within a specific tenant
 * 
 * @param tenantId - Tenant UUID
 * @param email - User email address
 * @returns User data or null if not found
 */
async function findUserByEmail(tenantId: string, email: string): Promise<UserData | null> {
  try {
    const result = await query(
      'SELECT * FROM users WHERE tenant_id = $1 AND email = $2',
      [tenantId, email]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw new Error('Database error during user lookup');
  }
}

/**
 * Find user by ID within a specific tenant
 * 
 * @param tenantId - Tenant UUID
 * @param userId - User UUID
 * @returns User data or null if not found
 */
async function findUserById(tenantId: string, userId: string): Promise<UserData | null> {
  try {
    const result = await query(
      'SELECT * FROM users WHERE tenant_id = $1 AND id = $2',
      [tenantId, userId]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw new Error('Database error during user lookup');
  }
}

/**
 * Create a new user in the database
 * 
 * @param userData - User data to create
 * @returns Created user data
 */
async function createUser(userData: CreateUserData): Promise<UserData> {
  try {
    const result = await query(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userData.tenant_id,
        userData.email,
        userData.password_hash,
        userData.first_name,
        userData.last_name,
        userData.role,
        userData.phone || null
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Check for unique constraint violation (email already exists)
    if (error instanceof Error && error.message.includes('unique constraint')) {
      throw new AuthenticationError(
        AuthErrorCode.EMAIL_ALREADY_EXISTS,
        'An account with this email already exists'
      );
    }
    
    throw new Error('Database error during user creation');
  }
}

// =====================================================================================
// AUTHENTICATION FUNCTIONS
// =====================================================================================

/**
 * Authenticate user with email and password
 * 
 * @param tenantId - Tenant UUID
 * @param credentials - Login credentials
 * @returns Authentication response with token and user info
 */
export async function authenticateUser(
  tenantId: string,
  credentials: LoginRequest
): Promise<AuthResponse> {
  const { email, password } = credentials;

  // Validate input
  if (!email || !password) {
    throw new AuthenticationError(
      AuthErrorCode.INVALID_CREDENTIALS,
      'Email and password are required'
    );
  }

  // Find user in database
  const user = await findUserByEmail(tenantId, email.toLowerCase().trim());
  
  if (!user) {
    // Don't reveal if email exists or not
    throw new AuthenticationError(
      AuthErrorCode.INVALID_CREDENTIALS,
      'Invalid email or password'
    );
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password, user.password_hash);
  
  if (!isPasswordValid) {
    throw new AuthenticationError(
      AuthErrorCode.INVALID_CREDENTIALS,
      'Invalid email or password'
    );
  }

  // Create JWT token
  const tokenPayload = {
    userId: user.id,
    tenantId: user.tenant_id,
    email: user.email,
    role: user.role
  };

  const token = createToken(tokenPayload);
  
  // Calculate expiration time
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return {
    token,
    user: mapUserDataToProfile(user),
    expiresAt: expiresAt.toISOString()
  };
}

/**
 * Register a new user
 * 
 * @param tenantId - Tenant UUID
 * @param registrationData - User registration data
 * @returns Authentication response with token and user info
 */
export async function registerUser(
  tenantId: string,
  registrationData: RegisterRequest
): Promise<AuthResponse> {
  const { email, password, firstName, lastName, role = 'customer', phone } = registrationData;

  // Validate input
  if (!email || !password || !firstName || !lastName) {
    throw new AuthenticationError(
      AuthErrorCode.INVALID_CREDENTIALS,
      'Email, password, first name, and last name are required'
    );
  }

  // Validate role
  if (!['owner', 'staff', 'customer'].includes(role)) {
    throw new AuthenticationError(
      AuthErrorCode.INVALID_CREDENTIALS,
      'Invalid role specified'
    );
  }

  // Check if user already exists
  const existingUser = await findUserByEmail(tenantId, email.toLowerCase().trim());
  
  if (existingUser) {
    throw new AuthenticationError(
      AuthErrorCode.EMAIL_ALREADY_EXISTS,
      'An account with this email already exists'
    );
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const userData: CreateUserData = {
    tenant_id: tenantId,
    email: email.toLowerCase().trim(),
    password_hash: passwordHash,
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    role: role as Role,
    phone: phone?.trim() || undefined
  };

  const newUser = await createUser(userData);

  // Create JWT token
  const tokenPayload = {
    userId: newUser.id,
    tenantId: newUser.tenant_id,
    email: newUser.email,
    role: newUser.role
  };

  const token = createToken(tokenPayload);
  
  // Calculate expiration time
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return {
    token,
    user: mapUserDataToProfile(newUser),
    expiresAt: expiresAt.toISOString()
  };
}

/**
 * Validate JWT token and return user context
 * 
 * @param token - JWT token string
 * @returns User context or null if invalid
 */
export async function validateTokenAndGetUser(token: string): Promise<UserContext | null> {
  // Validate JWT token
  const payload = validateToken(token);
  
  if (!payload) {
    return null;
  }

  // Verify user still exists in database
  const user = await findUserById(payload.tenantId, payload.userId);
  
  if (!user) {
    return null;
  }

  // Return user context
  return {
    id: user.id,
    tenantId: user.tenant_id,
    email: user.email,
    role: user.role,
    firstName: user.first_name,
    lastName: user.last_name
  };
}

/**
 * Refresh JWT token
 * 
 * @param currentToken - Current valid JWT token
 * @returns New token with extended expiration
 */
export async function refreshAuthToken(currentToken: string): Promise<{ token: string; expiresAt: string } | null> {
  // Validate current token
  const payload = validateToken(currentToken);
  
  if (!payload) {
    return null;
  }

  // Verify user still exists
  const user = await findUserById(payload.tenantId, payload.userId);
  
  if (!user) {
    return null;
  }

  // Create new token with same payload
  const newTokenPayload = {
    userId: payload.userId,
    tenantId: payload.tenantId,
    email: payload.email,
    role: payload.role
  };

  const newToken = createToken(newTokenPayload);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return {
    token: newToken,
    expiresAt: expiresAt.toISOString()
  };
}

// =====================================================================================
// AUTHORIZATION FUNCTIONS
// =====================================================================================

/**
 * Check if user has required role
 * 
 * @param userRole - User's current role
 * @param requiredRoles - Required roles for access
 * @returns True if user has permission
 */
export function hasRequiredRole(userRole: Role, requiredRoles: Role[]): boolean {
  if (requiredRoles.length === 0) {
    return true; // No specific role required
  }

  return requiredRoles.includes(userRole);
}

/**
 * Check if user can access tenant-specific resource
 * 
 * @param userTenantId - User's tenant ID
 * @param resourceTenantId - Resource tenant ID
 * @returns True if user can access resource
 */
export function canAccessTenantResource(userTenantId: string, resourceTenantId: string): boolean {
  return userTenantId === resourceTenantId;
}

/**
 * Validate tenant match between token and request
 * 
 * @param tokenPayload - JWT payload
 * @param requestTenantId - Tenant ID from request context
 * @returns True if tenant matches
 */
export function validateTenantMatch(tokenPayload: JWTPayload, requestTenantId: string): boolean {
  return tokenPayload.tenantId === requestTenantId;
}

// =====================================================================================
// UTILITY FUNCTIONS
// =====================================================================================

/**
 * Map database user data to user profile
 * 
 * @param user - User data from database
 * @returns User profile for API responses
 */
function mapUserDataToProfile(user: UserData): UserProfile {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    phone: user.phone || undefined,
    loyaltyPoints: user.loyalty_points,
    createdAt: user.created_at
  };
}

/**
 * Sanitize user data for logging
 * 
 * @param user - User data to sanitize
 * @returns Sanitized user data without sensitive information
 */
export function sanitizeUserForLogs(user: Partial<UserData>): Partial<UserData> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...sanitized } = user;
  return sanitized;
}

// =====================================================================================
// ERROR HANDLING
// =====================================================================================

/**
 * Custom authentication error class
 */
export class AuthenticationError extends Error {
  public code: AuthErrorCode;
  public details?: Record<string, any>;

  constructor(code: AuthErrorCode, message: string, details?: Record<string, any>) {
    super(message);
    this.name = 'AuthenticationError';
    this.code = code;
    this.details = details;
  }

  /**
   * Convert to API error response format
   */
  toErrorResponse(path: string): {
    error: AuthError;
    timestamp: string;
    path: string;
  } {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details
      },
      timestamp: new Date().toISOString(),
      path
    };
  }
}

/**
 * Create standard authentication error
 * 
 * @param code - Error code
 * @param message - Error message
 * @param details - Additional error details
 * @returns AuthenticationError instance
 */
export function createAuthError(
  code: AuthErrorCode,
  message: string,
  details?: Record<string, any>
): AuthenticationError {
  return new AuthenticationError(code, message, details);
}

// =====================================================================================
// EXPORTS
// =====================================================================================

export {
  findUserByEmail,
  findUserById,
  createUser,
  mapUserDataToProfile
};