/**
 * Login API Endpoint for GrowPlate Multi-Tenant Platform
 * 
 * POST /api/auth/login
 * 
 * Authenticates users with email and password, returning a JWT token
 * for subsequent API requests. Supports tenant-scoped authentication.
 */

import { json, type ActionFunctionArgs } from '@remix-run/node';
import { authenticateUser, AuthenticationError } from '~/lib/auth';
import { validatePasswordStrength } from '~/lib/password';
import type { LoginRequest } from '~/types/auth';

// =====================================================================================
// API ENDPOINT HANDLER
// =====================================================================================

/**
 * Handle POST requests to /api/auth/login
 * 
 * @param request - Remix request object with tenant context
 * @returns JSON response with token and user info or error
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
        path: '/api/auth/login'
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
          path: '/api/auth/login'
        },
        { status: 404 }
      );
    }

    // Parse request body
    let requestData: LoginRequest;
    
    try {
      requestData = await request.json();
    } catch (error) {
      return json(
        {
          error: {
            code: 'invalid_json',
            message: 'Invalid JSON in request body'
          },
          timestamp: new Date().toISOString(),
          path: '/api/auth/login'
        },
        { status: 400 }
      );
    }

    // Validate required fields
    const validationErrors = validateLoginRequest(requestData);
    
    if (validationErrors.length > 0) {
      return json(
        {
          error: {
            code: 'validation_error',
            message: 'Validation failed',
            details: { errors: validationErrors }
          },
          timestamp: new Date().toISOString(),
          path: '/api/auth/login'
        },
        { status: 400 }
      );
    }

    // Authenticate user
    const authResponse = await authenticateUser(tenant.id, requestData);

    // Log successful authentication
    console.log('Successful login:', {
      tenantId: tenant.id,
      userId: authResponse.user.id,
      email: authResponse.user.email,
      timestamp: new Date().toISOString()
    });

    // Return success response
    return json(authResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    // Handle authentication errors
    if (error instanceof AuthenticationError) {
      // Log authentication failure (without sensitive details)
      console.warn('Authentication failed:', {
        tenantId: (request as any).tenant?.id,
        errorCode: error.code,
        timestamp: new Date().toISOString(),
        path: '/api/auth/login'
      });

      const statusCode = getStatusCodeForError(error.code);
      return json(
        error.toErrorResponse('/api/auth/login'),
        { status: statusCode }
      );
    }

    // Handle unexpected errors
    console.error('Login endpoint error:', error);
    
    return json(
      {
        error: {
          code: 'internal_error',
          message: 'An internal error occurred'
        },
        timestamp: new Date().toISOString(),
        path: '/api/auth/login'
      },
      { status: 500 }
    );
  }
}

// =====================================================================================
// VALIDATION FUNCTIONS
// =====================================================================================

/**
 * Validate login request data
 * 
 * @param data - Request data to validate
 * @returns Array of validation errors
 */
function validateLoginRequest(data: any): string[] {
  const errors: string[] = [];

  // Check if data exists
  if (!data || typeof data !== 'object') {
    errors.push('Request body must be a JSON object');
    return errors;
  }

  // Validate email
  if (!data.email) {
    errors.push('Email is required');
  } else if (typeof data.email !== 'string') {
    errors.push('Email must be a string');
  } else if (!isValidEmail(data.email)) {
    errors.push('Email must be a valid email address');
  }

  // Validate password
  if (!data.password) {
    errors.push('Password is required');
  } else if (typeof data.password !== 'string') {
    errors.push('Password must be a string');
  } else if (data.password.length < 1) {
    errors.push('Password cannot be empty');
  }

  return errors;
}

/**
 * Validate email format
 * 
 * @param email - Email to validate
 * @returns True if email is valid
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
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
    case 'invalid_credentials':
    case 'user_not_found':
    case 'token_expired':
    case 'token_invalid':
    case 'malformed_token':
      return 401; // Unauthorized
      
    case 'insufficient_permissions':
    case 'tenant_mismatch':
      return 403; // Forbidden
      
    case 'email_already_exists':
    case 'weak_password':
      return 400; // Bad Request
      
    default:
      return 401; // Default to unauthorized
  }
}

// =====================================================================================
// SECURITY HEADERS
// =====================================================================================

/**
 * Add security headers to response
 * 
 * @param response - Response object
 * @returns Response with security headers
 */
function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  
  // Prevent caching of authentication responses
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  
  // Security headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// =====================================================================================
// RATE LIMITING (Placeholder)
// =====================================================================================

/**
 * Check rate limit for login attempts
 * 
 * @param identifier - Rate limit identifier (IP, email, etc.)
 * @returns True if request should be allowed
 */
async function checkLoginRateLimit(identifier: string): Promise<boolean> {
  // TODO: Implement rate limiting with Redis
  // For now, always allow (should be implemented in production)
  return true;
}

/**
 * Log failed login attempt for monitoring
 * 
 * @param email - Email that failed authentication
 * @param tenantId - Tenant ID
 * @param request - Request object
 */
function logFailedLoginAttempt(
  email: string,
  tenantId: string,
  request: Request
): void {
  const logData = {
    event: 'failed_login',
    email: email.toLowerCase().trim(),
    tenantId,
    timestamp: new Date().toISOString(),
    ip: request.headers.get('X-Forwarded-For') || 
        request.headers.get('X-Real-IP') || 
        'unknown',
    userAgent: request.headers.get('User-Agent') || 'unknown'
  };

  console.warn('SECURITY_EVENT:', JSON.stringify(logData));
}

// =====================================================================================
// API DOCUMENTATION
// =====================================================================================

/**
 * API Documentation for Login Endpoint
 * 
 * POST /api/auth/login
 * 
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "userPassword123"
 * }
 * 
 * Success Response (200):
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": "user-uuid",
 *     "email": "user@example.com",
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "role": "customer",
 *     "phone": "+1234567890",
 *     "loyaltyPoints": 150,
 *     "createdAt": "2024-01-15T10:30:00Z"
 *   },
 *   "expiresAt": "2024-01-16T10:30:00Z"
 * }
 * 
 * Error Response (401):
 * {
 *   "error": {
 *     "code": "invalid_credentials",
 *     "message": "Invalid email or password"
 *   },
 *   "timestamp": "2024-01-15T10:30:00Z",
 *   "path": "/api/auth/login"
 * }
 * 
 * Error Codes:
 * - invalid_credentials: Wrong email or password
 * - validation_error: Request validation failed
 * - tenant_not_found: Tenant not found for domain
 * - method_not_allowed: Non-POST request
 * - invalid_json: Malformed JSON in request
 * - internal_error: Server error
 */