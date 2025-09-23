/**
 * JWT (JSON Web Token) Utilities for GrowPlate Multi-Tenant Platform
 * 
 * This module provides JWT token creation, validation, and management utilities
 * for the authentication system. All functions implement security best practices
 * including proper signature verification and payload validation.
 */

import jwt from 'jsonwebtoken';
import type { JWTPayload, TokenOptions, AuthConfig } from '~/types/auth';

// =====================================================================================
// CONFIGURATION
// =====================================================================================

/**
 * Get authentication configuration from environment variables
 */
function getAuthConfig(): AuthConfig {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters long');
  }

  return {
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    jwtIssuer: process.env.JWT_ISSUER || 'growplate.com',
    jwtAudience: process.env.JWT_AUDIENCE || 'api.growplate.com',
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')
  };
}

/**
 * Default JWT algorithm (HMAC SHA-256)
 */
const JWT_ALGORITHM = 'HS256';

// =====================================================================================
// CORE JWT FUNCTIONS
// =====================================================================================

/**
 * Create a JWT token with the provided payload
 * 
 * @param payload - User and tenant information to encode
 * @param options - Token creation options (expiration, issuer, audience)
 * @returns Signed JWT token string
 * 
 * @example
 * const token = createToken({
 *   userId: 'user-uuid',
 *   tenantId: 'tenant-uuid',
 *   email: 'user@example.com',
 *   role: 'customer'
 * });
 */
export function createToken(
  payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>,
  options: TokenOptions = {}
): string {
  const config = getAuthConfig();
  
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = options.expiresIn || config.jwtExpiresIn;
  
  // Calculate expiration timestamp
  let exp: number;
  if (typeof expiresIn === 'string') {
    // Parse time strings like '24h', '7d', '30m'
    const timeValue = parseInt(expiresIn);
    const timeUnit = expiresIn.slice(-1);
    
    switch (timeUnit) {
      case 's': exp = now + timeValue; break;
      case 'm': exp = now + (timeValue * 60); break;
      case 'h': exp = now + (timeValue * 60 * 60); break;
      case 'd': exp = now + (timeValue * 24 * 60 * 60); break;
      default: exp = now + (24 * 60 * 60); // Default to 24 hours
    }
  } else {
    exp = now + (24 * 60 * 60); // Default to 24 hours
  }

  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp,
    iss: options.issuer || config.jwtIssuer,
    aud: options.audience || config.jwtAudience
  };

  try {
    const token = jwt.sign(fullPayload, config.jwtSecret, {
      algorithm: JWT_ALGORITHM,
      noTimestamp: true // We set iat manually for consistency
    });

    return token;
  } catch (error) {
    throw new Error('Failed to create JWT token');
  }
}

/**
 * Validate and decode a JWT token
 * 
 * @param token - JWT token string to validate
 * @returns Decoded payload if valid, null if invalid
 * 
 * @example
 * const payload = validateToken(authHeader.split(' ')[1]);
 * if (payload) {
 *   console.log('User ID:', payload.userId);
 * }
 */
export function validateToken(token: string): JWTPayload | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const config = getAuthConfig();
    
    const decoded = jwt.verify(token, config.jwtSecret, {
      algorithms: [JWT_ALGORITHM],
      issuer: config.jwtIssuer,
      audience: config.jwtAudience
    }) as JWTPayload;

    // Additional payload validation
    if (!isValidJWTPayload(decoded)) {
      return null;
    }

    return decoded;
  } catch (error) {
    // Log different types of JWT errors for debugging
    if (error instanceof jwt.TokenExpiredError) {
      console.warn('JWT token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.warn('Invalid JWT token:', error.message);
    } else if (error instanceof jwt.NotBeforeError) {
      console.warn('JWT token not active yet');
    } else {
      console.error('JWT validation error:', error);
    }
    
    return null;
  }
}

/**
 * Extract JWT token from Authorization header
 * 
 * @param authHeader - Authorization header value
 * @returns Token string if found, null otherwise
 * 
 * @example
 * const token = extractTokenFromHeader(request.headers.authorization);
 * if (token) {
 *   const payload = validateToken(token);
 * }
 */
export function extractTokenFromHeader(authHeader: string | null | undefined): string | null {
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  const token = parts[1];
  
  // Basic token format validation (JWT has 3 parts separated by dots)
  if (!token || token.split('.').length !== 3) {
    return null;
  }

  return token;
}

/**
 * Check if a JWT payload has expired
 * 
 * @param payload - JWT payload to check
 * @returns True if token has expired
 */
export function isTokenExpired(payload: JWTPayload): boolean {
  if (!payload.exp) {
    return true; // No expiration means expired
  }

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

// =====================================================================================
// TOKEN ANALYSIS UTILITIES
// =====================================================================================

/**
 * Get token expiration date
 * 
 * @param payload - JWT payload
 * @returns Expiration date or null if no expiration
 */
export function getTokenExpirationDate(payload: JWTPayload): Date | null {
  if (!payload.exp) {
    return null;
  }

  return new Date(payload.exp * 1000);
}

/**
 * Get time until token expires in seconds
 * 
 * @param payload - JWT payload
 * @returns Seconds until expiration, 0 if expired
 */
export function getTimeUntilExpiration(payload: JWTPayload): number {
  if (!payload.exp) {
    return 0;
  }

  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - now);
}

/**
 * Check if token will expire within specified time
 * 
 * @param payload - JWT payload
 * @param secondsFromNow - Seconds from now to check
 * @returns True if token expires within the timeframe
 */
export function willExpireSoon(payload: JWTPayload, secondsFromNow: number): boolean {
  const timeUntilExp = getTimeUntilExpiration(payload);
  return timeUntilExp <= secondsFromNow;
}

// =====================================================================================
// PAYLOAD VALIDATION
// =====================================================================================

/**
 * Validate JWT payload structure and required fields
 * 
 * @param payload - Payload to validate
 * @returns True if payload is valid
 */
function isValidJWTPayload(payload: any): payload is JWTPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  // Check required string fields
  const requiredStringFields = ['userId', 'tenantId', 'email', 'iss', 'aud'];
  for (const field of requiredStringFields) {
    if (!payload[field] || typeof payload[field] !== 'string') {
      return false;
    }
  }

  // Check role is valid
  if (!payload.role || !['owner', 'staff', 'customer'].includes(payload.role)) {
    return false;
  }

  // Check required number fields
  const requiredNumberFields = ['iat', 'exp'];
  for (const field of requiredNumberFields) {
    if (!payload[field] || typeof payload[field] !== 'number') {
      return false;
    }
  }

  // Check UUIDs are valid format (basic check)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(payload.userId) || !uuidRegex.test(payload.tenantId)) {
    return false;
  }

  // Check email format (basic check)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payload.email)) {
    return false;
  }

  // Check timestamps are reasonable (not in far future or past)
  const now = Math.floor(Date.now() / 1000);
  const oneYearFromNow = now + (365 * 24 * 60 * 60);
  const oneYearAgo = now - (365 * 24 * 60 * 60);

  if (payload.iat < oneYearAgo || payload.iat > now + 60) { // Allow 60s clock skew
    return false;
  }

  if (payload.exp < now || payload.exp > oneYearFromNow) {
    return false;
  }

  return true;
}

// =====================================================================================
// DEBUGGING AND DEVELOPMENT UTILITIES
// =====================================================================================

/**
 * Decode JWT token without verification (for debugging only)
 * 
 * @param token - JWT token to decode
 * @returns Decoded payload or null if malformed
 * 
 * @warning This function does NOT verify the token signature
 * Only use for debugging purposes
 */
export function decodeTokenUnsafe(token: string): any {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

/**
 * Get JWT token information for debugging
 * 
 * @param token - JWT token to analyze
 * @returns Token information object
 */
export function getTokenInfo(token: string): {
  isValid: boolean;
  isExpired: boolean;
  payload: JWTPayload | null;
  expiresAt: Date | null;
  timeUntilExpiration: number;
} {
  const payload = validateToken(token);
  const isValid = payload !== null;
  const isExpired = payload ? isTokenExpired(payload) : true;
  const expiresAt = payload ? getTokenExpirationDate(payload) : null;
  const timeUntilExpiration = payload ? getTimeUntilExpiration(payload) : 0;

  return {
    isValid,
    isExpired,
    payload,
    expiresAt,
    timeUntilExpiration
  };
}

// =====================================================================================
// REFRESH TOKEN UTILITIES
// =====================================================================================

/**
 * Create a new token from an existing valid token
 * Useful for token refresh functionality
 * 
 * @param currentToken - Current valid JWT token
 * @param options - New token options
 * @returns New JWT token or null if current token is invalid
 */
export function refreshToken(
  currentToken: string,
  options: TokenOptions = {}
): string | null {
  const payload = validateToken(currentToken);
  
  if (!payload) {
    return null;
  }

  // Create new token with same user/tenant info but fresh timestamps
  const newTokenPayload = {
    userId: payload.userId,
    tenantId: payload.tenantId,
    email: payload.email,
    role: payload.role
  };

  return createToken(newTokenPayload, options);
}

/**
 * Check if a token is eligible for refresh
 * 
 * @param token - JWT token to check
 * @param maxAge - Maximum age in seconds for refresh eligibility
 * @returns True if token can be refreshed
 */
export function canRefreshToken(token: string, maxAge: number = 7 * 24 * 60 * 60): boolean {
  const payload = validateToken(token);
  
  if (!payload) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const tokenAge = now - payload.iat;
  
  return tokenAge <= maxAge;
}

// =====================================================================================
// EXPORTS
// =====================================================================================

export {
  JWT_ALGORITHM,
  getAuthConfig
};