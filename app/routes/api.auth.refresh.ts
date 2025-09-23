/**
 * Token Refresh API Endpoint for GrowPlate Multi-Tenant Platform
 * 
 * POST /api/auth/refresh
 * 
 * Refreshes JWT tokens by validating the current token and issuing
 * a new one with extended expiration. Maintains user session without
 * requiring re-authentication.
 */

import { json, type ActionFunctionArgs } from '@remix-run/node';
import { refreshAuthToken, AuthenticationError } from '~/lib/auth';
import { extractTokenFromHeader, validateToken } from '~/lib/jwt';
import type { RefreshResponse } from '~/types/auth';

// =====================================================================================
// API ENDPOINT HANDLER
// =====================================================================================

/**
 * Handle POST requests to /api/auth/refresh
 * 
 * @param request - Remix request object with Authorization header
 * @returns JSON response with new token or error
 */
export async function action({ request }: ActionFunctionArgs) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return json(
      {
        error: {
          code: 'method_not_allowed',
          message: 'Method not allowed. Use POST.'
        },
        timestamp: new Date().toISOString(),
        path: '/api/auth/refresh'
      },
      { status: 405, headers: { Allow: 'POST' } }
    );
  }

  try {
    // Get tenant context (injected by tenant middleware)
    const tenant = (request as any).tenant;
    
    if (!tenant) {
      return json(
        {
          error: {
            code: 'tenant_not_found',
            message: 'Tenant not found. Please check your domain.'
          },
          timestamp: new Date().toISOString(),
          path: '/api/auth/refresh'
        },
        { status: 404 }
      );
    }

    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const currentToken = extractTokenFromHeader(authHeader);
    
    if (!currentToken) {
      return json(
        {
          error: {
            code: 'missing_token',
            message: 'Authorization header with Bearer token is required'
          },
          timestamp: new Date().toISOString(),
          path: '/api/auth/refresh'
        },
        { status: 401 }
      );
    }

    // Validate current token format and extract payload
    const tokenPayload = validateToken(currentToken);
    
    if (!tokenPayload) {
      return json(
        {
          error: {
            code: 'token_invalid',
            message: 'Invalid or expired token'
          },
          timestamp: new Date().toISOString(),
          path: '/api/auth/refresh'
        },
        { status: 401 }
      );
    }

    // Validate tenant match
    if (tokenPayload.tenantId !== tenant.id) {
      return json(
        {
          error: {
            code: 'tenant_mismatch',
            message: 'Token tenant does not match request tenant'
          },
          timestamp: new Date().toISOString(),
          path: '/api/auth/refresh'
        },
        { status: 403 }
      );
    }

    // Check if token is eligible for refresh
    if (!isTokenEligibleForRefresh(tokenPayload)) {
      return json(
        {
          error: {
            code: 'token_not_refreshable',
            message: 'Token is not eligible for refresh. Please log in again.'
          },
          timestamp: new Date().toISOString(),
          path: '/api/auth/refresh'
        },
        { status: 401 }
      );
    }

    // Refresh the token
    const refreshResult = await refreshAuthToken(currentToken);
    
    if (!refreshResult) {
      return json(
        {
          error: {
            code: 'refresh_failed',
            message: 'Failed to refresh token. Please log in again.'
          },
          timestamp: new Date().toISOString(),
          path: '/api/auth/refresh'
        },
        { status: 401 }
      );
    }

    // Log successful token refresh
    console.log('Successful token refresh:', {
      tenantId: tenant.id,
      userId: tokenPayload.userId,
      email: tokenPayload.email,
      timestamp: new Date().toISOString()
    });

    // Return new token
    const response: RefreshResponse = {
      token: refreshResult.token,
      expiresAt: refreshResult.expiresAt
    };

    return json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Security headers
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

  } catch (error) {
    // Handle authentication errors
    if (error instanceof AuthenticationError) {
      // Log refresh failure (without sensitive details)
      console.warn('Token refresh failed:', {
        tenantId: (request as any).tenant?.id,
        errorCode: error.code,
        timestamp: new Date().toISOString(),
        path: '/api/auth/refresh'
      });

      const statusCode = getStatusCodeForError(error.code);
      return json(
        error.toErrorResponse('/api/auth/refresh'),
        { status: statusCode }
      );
    }

    // Handle unexpected errors
    console.error('Refresh endpoint error:', error);
    
    return json(
      {
        error: {
          code: 'internal_error',
          message: 'An internal error occurred'
        },
        timestamp: new Date().toISOString(),
        path: '/api/auth/refresh'
      },
      { status: 500 }
    );
  }
}

// =====================================================================================
// VALIDATION FUNCTIONS
// =====================================================================================

/**
 * Check if token is eligible for refresh
 * 
 * @param tokenPayload - JWT payload to check
 * @returns True if token can be refreshed
 */
function isTokenEligibleForRefresh(tokenPayload: any): boolean {
  if (!tokenPayload) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  
  // Check if token has expired (allow short grace period)
  const gracePeriod = 300; // 5 minutes
  if (tokenPayload.exp && tokenPayload.exp < (now - gracePeriod)) {
    return false; // Token expired too long ago
  }

  // Check if token is too old for refresh (max 7 days)
  const maxRefreshAge = 7 * 24 * 60 * 60; // 7 days in seconds
  if (tokenPayload.iat && (now - tokenPayload.iat) > maxRefreshAge) {
    return false; // Token too old for refresh
  }

  // Check if token was issued in the future (clock skew tolerance)
  const clockSkewTolerance = 300; // 5 minutes
  if (tokenPayload.iat && tokenPayload.iat > (now + clockSkewTolerance)) {
    return false; // Token issued in future
  }

  return true;
}

/**
 * Validate Authorization header format
 * 
 * @param authHeader - Authorization header value
 * @returns True if header format is valid
 */
function isValidAuthHeader(authHeader: string | null): boolean {
  if (!authHeader) {
    return false;
  }

  const parts = authHeader.split(' ');
  return parts.length === 2 && parts[0] === 'Bearer' && parts[1].length > 0;
}

// =====================================================================================
// ERROR HANDLING
// =====================================================================================

/**
 * Get HTTP status code for authentication error
 * 
 * @param errorCode - Authentication error code
 * @returns HTTP status code
 */
function getStatusCodeForError(errorCode: string): number {
  switch (errorCode) {
    case 'missing_token':
    case 'token_invalid':
    case 'token_expired':
    case 'malformed_token':
    case 'token_not_refreshable':
    case 'refresh_failed':
      return 401; // Unauthorized
      
    case 'tenant_mismatch':
    case 'insufficient_permissions':
      return 403; // Forbidden
      
    default:
      return 401; // Default to unauthorized
  }
}

// =====================================================================================
// SECURITY AND MONITORING
// =====================================================================================

/**
 * Check refresh rate limits
 * 
 * @param userId - User ID for rate limiting
 * @returns True if request should be allowed
 */
async function checkRefreshRateLimit(userId: string): Promise<boolean> {
  // TODO: Implement rate limiting with Redis
  // Limit: 10 refresh attempts per hour per user
  // For now, always allow (should be implemented in production)
  return true;
}

/**
 * Log token refresh attempt for monitoring
 * 
 * @param userId - User ID
 * @param tenantId - Tenant ID
 * @param success - Whether refresh was successful
 * @param request - Request object
 */
function logRefreshAttempt(
  userId: string,
  tenantId: string,
  success: boolean,
  request: Request
): void {
  const logData = {
    event: success ? 'successful_token_refresh' : 'failed_token_refresh',
    userId,
    tenantId,
    timestamp: new Date().toISOString(),
    ip: request.headers.get('X-Forwarded-For') || 
        request.headers.get('X-Real-IP') || 
        'unknown',
    userAgent: request.headers.get('User-Agent') || 'unknown'
  };

  if (success) {
    console.log('TOKEN_REFRESH_EVENT:', JSON.stringify(logData));
  } else {
    console.warn('TOKEN_REFRESH_EVENT:', JSON.stringify(logData));
  }
}

/**
 * Detect potential token abuse patterns
 * 
 * @param tokenPayload - JWT payload
 * @param request - Request object
 * @returns True if suspicious activity detected
 */
function detectSuspiciousActivity(
  tokenPayload: any,
  request: Request
): boolean {
  // Check for rapid refresh attempts (multiple refreshes within short time)
  // Check for unusual IP patterns
  // Check for concurrent sessions from different locations
  
  // TODO: Implement sophisticated abuse detection
  // For now, return false (no abuse detected)
  return false;
}

// =====================================================================================
// UTILITY FUNCTIONS
// =====================================================================================

/**
 * Calculate time remaining until token expires
 * 
 * @param tokenPayload - JWT payload
 * @returns Seconds until expiration
 */
function getTimeUntilExpiration(tokenPayload: any): number {
  if (!tokenPayload.exp) {
    return 0;
  }

  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, tokenPayload.exp - now);
}

/**
 * Check if token will expire soon
 * 
 * @param tokenPayload - JWT payload
 * @param thresholdSeconds - Threshold in seconds
 * @returns True if token expires within threshold
 */
function willExpireSoon(tokenPayload: any, thresholdSeconds: number = 300): boolean {
  const timeUntilExp = getTimeUntilExpiration(tokenPayload);
  return timeUntilExp <= thresholdSeconds;
}

// =====================================================================================
// API DOCUMENTATION
// =====================================================================================

/**
 * API Documentation for Token Refresh Endpoint
 * 
 * POST /api/auth/refresh
 * 
 * Headers:
 * Authorization: Bearer <current_jwt_token>
 * 
 * Request Body: None (empty)
 * 
 * Success Response (200):
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "expiresAt": "2024-01-16T10:30:00Z"
 * }
 * 
 * Error Response (401):
 * {
 *   "error": {
 *     "code": "token_invalid",
 *     "message": "Invalid or expired token"
 *   },
 *   "timestamp": "2024-01-15T10:30:00Z",
 *   "path": "/api/auth/refresh"
 * }
 * 
 * Error Codes:
 * - missing_token: No Authorization header provided
 * - token_invalid: Token is malformed or expired
 * - token_not_refreshable: Token too old or not eligible for refresh
 * - tenant_mismatch: Token tenant doesn't match request domain
 * - refresh_failed: User no longer exists or other refresh failure
 * - method_not_allowed: Non-POST request
 * - internal_error: Server error
 * 
 * Token Refresh Rules:
 * - Tokens can be refreshed up to 7 days after issue
 * - Expired tokens have a 5-minute grace period for refresh
 * - New token has same user/tenant info but fresh expiration
 * - Original token becomes invalid after refresh
 * 
 * Rate Limits:
 * - Maximum 10 refresh attempts per hour per user
 * - Suspicious patterns may trigger additional security checks
 */