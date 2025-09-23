/**
 * Authentication Middleware for GrowPlate Multi-Tenant Platform
 * 
 * This module provides middleware functions for protecting API routes,
 * validating JWT tokens, enforcing role-based access control, and
 * ensuring tenant isolation in the multi-tenant system.
 */

import { json } from '@remix-run/node';
import { extractTokenFromHeader } from '~/lib/jwt';
import { validateTokenAndGetUser, hasRequiredRole, AuthenticationError, createAuthError } from '~/lib/auth';
import type {
  AuthenticatedRequest,
  AuthMiddlewareOptions,
  UserContext,
  Role
} from '~/types/auth';
import { AuthErrorCode } from '~/types/auth';

// =====================================================================================
// CORE MIDDLEWARE FUNCTIONS
// =====================================================================================

/**
 * Extract and validate authentication from request
 * 
 * @param request - Remix request object
 * @returns User context if authenticated, null otherwise
 */
export async function extractUserContext(request: Request): Promise<UserContext | null> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return null;
    }

    // Validate token and get user
    const userContext = await validateTokenAndGetUser(token);
    
    return userContext;
  } catch (error) {
    console.error('Error extracting user context:', error);
    return null;
  }
}

/**
 * Authenticate request and inject user context
 * 
 * @param request - Remix request object
 * @returns Authentication context with user and tenant info
 * @throws AuthenticationError if authentication fails
 */
export async function authenticateRequest(request: Request): Promise<{
  user: UserContext;
  tenant: any; // Will be injected by tenant middleware
}> {
  // Get user context from token
  const userContext = await extractUserContext(request);
  
  if (!userContext) {
    throw createAuthError(
      AuthErrorCode.MISSING_TOKEN,
      'Authentication required'
    );
  }

  // Get tenant context (should be injected by tenant middleware)
  const tenant = (request as any).tenant;
  
  if (!tenant) {
    throw createAuthError(
      AuthErrorCode.TENANT_MISMATCH,
      'Tenant context not found'
    );
  }

  // Validate tenant match
  if (userContext.tenantId !== tenant.id) {
    throw createAuthError(
      AuthErrorCode.TENANT_MISMATCH,
      'Token tenant does not match request tenant'
    );
  }

  return {
    user: userContext,
    tenant
  };
}

/**
 * Create authentication middleware for protecting routes
 * 
 * @param options - Middleware configuration options
 * @returns Middleware function
 */
export function requireAuth(options: AuthMiddlewareOptions = {}) {
  return async function authMiddleware(
    request: Request,
    handler: (req: AuthenticatedRequest) => Promise<Response>
  ): Promise<Response> {
    try {
      const authContext = await authenticateRequest(request);
      
      // Check role requirements
      if (options.requiredRoles && options.requiredRoles.length > 0) {
        if (!hasRequiredRole(authContext.user.role, options.requiredRoles)) {
          const error = createAuthError(
            AuthErrorCode.INSUFFICIENT_PERMISSIONS,
            `Access denied. Required roles: ${options.requiredRoles.join(', ')}`
          );
          
          return createErrorResponse(error, request.url, 403);
        }
      }

      // Create authenticated request
      const authenticatedRequest = Object.assign(request, {
        user: authContext.user,
        tenant: authContext.tenant
      }) as AuthenticatedRequest;

      // Call the handler with authenticated request
      return await handler(authenticatedRequest);
      
    } catch (error) {
      if (error instanceof AuthenticationError) {
        const statusCode = getStatusCodeForAuthError(error.code);
        return createErrorResponse(error, request.url, statusCode);
      }

      // Handle custom error handler
      if (options.onError && error instanceof AuthenticationError) {
        return options.onError(error);
      }

      console.error('Authentication middleware error:', error);
      const authError = createAuthError(
        AuthErrorCode.TOKEN_INVALID,
        'Authentication failed'
      );
      
      return createErrorResponse(authError, request.url, 401);
    }
  };
}

/**
 * Optional authentication middleware (doesn't require authentication)
 * Injects user context if available, but doesn't fail if missing
 * 
 * @returns Middleware function
 */
export function optionalAuth() {
  return async function optionalAuthMiddleware(
    request: Request,
    handler: (req: Request & { user?: UserContext; tenant?: any }) => Promise<Response>
  ): Promise<Response> {
    try {
      const userContext = await extractUserContext(request);
      const tenant = (request as any).tenant;

      // Validate tenant match if user is authenticated
      if (userContext && tenant && userContext.tenantId !== tenant.id) {
        // Log security violation but don't fail the request
        console.warn('Optional auth: tenant mismatch detected', {
          userTenantId: userContext.tenantId,
          requestTenantId: tenant.id,
          url: request.url
        });
      }

      // Add user context to request if available
      const requestWithAuth = Object.assign(request, {
        user: userContext || undefined,
        tenant
      });

      return await handler(requestWithAuth);
      
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      
      // For optional auth, continue without user context
      return await handler(request);
    }
  };
}

// =====================================================================================
// ROLE-BASED ACCESS CONTROL
// =====================================================================================

/**
 * Middleware for owner-only access
 */
export const requireOwner = requireAuth({ requiredRoles: ['owner'] });

/**
 * Middleware for staff and owner access
 */
export const requireStaff = requireAuth({ requiredRoles: ['owner', 'staff'] });

/**
 * Middleware for any authenticated user
 */
export const requireCustomer = requireAuth({ requiredRoles: ['owner', 'staff', 'customer'] });

/**
 * Check if user has permission for specific action
 * 
 * @param userRole - User's role
 * @param action - Action being performed
 * @param resource - Resource being accessed
 * @returns True if user has permission
 */
export function hasPermission(
  userRole: Role,
  action: string,
  resource: string
): boolean {
  // Define permission matrix
  const permissions: Record<Role, Record<string, string[]>> = {
    owner: {
      '*': ['*'], // Owners can do everything
    },
    staff: {
      read: ['menu', 'orders', 'customers'],
      create: ['orders'],
      update: ['orders', 'menu'],
      delete: []
    },
    customer: {
      read: ['menu', 'own_orders', 'own_profile'],
      create: ['orders'],
      update: ['own_profile'],
      delete: []
    }
  };

  const userPermissions = permissions[userRole];
  
  if (!userPermissions) {
    return false;
  }

  // Check if user has global permissions
  if (userPermissions['*']?.includes('*')) {
    return true;
  }

  // Check specific action permissions
  const actionPermissions = userPermissions[action];
  
  if (!actionPermissions) {
    return false;
  }

  return actionPermissions.includes(resource) || actionPermissions.includes('*');
}

// =====================================================================================
// UTILITY FUNCTIONS
// =====================================================================================

/**
 * Create standardized error response
 * 
 * @param error - Authentication error
 * @param path - Request path
 * @param statusCode - HTTP status code
 * @returns JSON error response
 */
function createErrorResponse(
  error: AuthenticationError,
  path: string,
  statusCode: number
): Response {
  return json(
    error.toErrorResponse(path),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer realm="api"'
      }
    }
  );
}

/**
 * Get appropriate HTTP status code for authentication error
 * 
 * @param errorCode - Authentication error code
 * @returns HTTP status code
 */
function getStatusCodeForAuthError(errorCode: AuthErrorCode): number {
  switch (errorCode) {
    case AuthErrorCode.MISSING_TOKEN:
    case AuthErrorCode.TOKEN_INVALID:
    case AuthErrorCode.TOKEN_EXPIRED:
    case AuthErrorCode.MALFORMED_TOKEN:
      return 401; // Unauthorized
      
    case AuthErrorCode.INSUFFICIENT_PERMISSIONS:
      return 403; // Forbidden
      
    case AuthErrorCode.TENANT_MISMATCH:
      return 403; // Forbidden
      
    case AuthErrorCode.USER_NOT_FOUND:
      return 401; // Unauthorized (don't reveal user existence)
      
    case AuthErrorCode.INVALID_CREDENTIALS:
      return 401; // Unauthorized
      
    default:
      return 401; // Default to unauthorized
  }
}

/**
 * Extract tenant ID from request (assumes tenant middleware has run)
 * 
 * @param request - Request with tenant context
 * @returns Tenant ID or null
 */
export function getTenantId(request: Request): string | null {
  const tenant = (request as any).tenant;
  return tenant?.id || null;
}

/**
 * Check if request is authenticated
 * 
 * @param request - Request to check
 * @returns True if request has user context
 */
export function isAuthenticated(request: Request): boolean {
  return !!(request as any).user;
}

/**
 * Get current user from authenticated request
 * 
 * @param request - Authenticated request
 * @returns User context or null
 */
export function getCurrentUser(request: AuthenticatedRequest): UserContext {
  return request.user;
}

/**
 * Get current tenant from request
 * 
 * @param request - Request with tenant context
 * @returns Tenant context or null
 */
export function getCurrentTenant(request: Request): any {
  return (request as any).tenant;
}

// =====================================================================================
// SECURITY UTILITIES
// =====================================================================================

/**
 * Log security events for monitoring
 * 
 * @param event - Security event type
 * @param details - Event details
 * @param request - Request context
 */
export function logSecurityEvent(
  event: 'auth_failure' | 'auth_success' | 'permission_denied' | 'tenant_mismatch',
  details: Record<string, any>,
  request: Request
): void {
  const logData = {
    event,
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method,
    userAgent: request.headers.get('User-Agent'),
    ip: request.headers.get('X-Forwarded-For') || request.headers.get('X-Real-IP'),
    ...details
  };

  // Log to console (in production, send to logging service)
  console.log('SECURITY_EVENT:', JSON.stringify(logData));
}

/**
 * Rate limiting check (placeholder for future implementation)
 * 
 * @param request - Request to check
 * @param identifier - Rate limit identifier (IP, user ID, etc.)
 * @returns True if request should be allowed
 */
export async function checkRateLimit(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  identifier: string
): Promise<boolean> {
  // TODO: Implement rate limiting logic with Redis
  // For now, always allow
  return true;
}

// =====================================================================================
// MIDDLEWARE COMPOSITION HELPERS
// =====================================================================================

/**
 * Compose multiple middleware functions
 * 
 * @param middlewares - Array of middleware functions
 * @returns Composed middleware function
 */
export function composeMiddleware(
  ...middlewares: Array<(req: Request, next: (req: Request) => Promise<Response>) => Promise<Response>>
) {
  return async function composedMiddleware(
    request: Request,
    handler: (req: Request) => Promise<Response>
  ): Promise<Response> {
    let index = -1;

    async function dispatch(i: number): Promise<Response> {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      
      index = i;
      
      if (i === middlewares.length) {
        return handler(request);
      }
      
      const middleware = middlewares[i];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      return middleware(request, (req) => dispatch(i + 1));
    }

    return dispatch(0);
  };
}

// =====================================================================================
// EXPORTS
// =====================================================================================

export {
  AuthenticationError,
  createAuthError
};