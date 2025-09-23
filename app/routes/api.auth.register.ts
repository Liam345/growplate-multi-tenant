/**
 * Registration API Endpoint for GrowPlate Multi-Tenant Platform
 * 
 * POST /api/auth/register
 * 
 * Registers new users with email, password, and profile information,
 * returning a JWT token for immediate authentication. Supports
 * tenant-scoped user registration with role assignment.
 */

import { json, type ActionFunctionArgs } from '@remix-run/node';
import { registerUser, AuthenticationError } from '~/lib/auth';
import { validatePasswordStrength } from '~/lib/password';
import type { RegisterRequest, Role } from '~/types/auth';

// =====================================================================================
// API ENDPOINT HANDLER
// =====================================================================================

/**
 * Handle POST requests to /api/auth/register
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
        path: '/api/auth/register'
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
          path: '/api/auth/register'
        },
        { status: 404 }
      );
    }

    // Parse request body
    let requestData: RegisterRequest;
    
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
          path: '/api/auth/register'
        },
        { status: 400 }
      );
    }

    // Validate request data
    const validationErrors = validateRegistrationRequest(requestData);
    
    if (validationErrors.length > 0) {
      return json(
        {
          error: {
            code: 'validation_error',
            message: 'Validation failed',
            details: { errors: validationErrors }
          },
          timestamp: new Date().toISOString(),
          path: '/api/auth/register'
        },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(requestData.password);
    
    if (!passwordValidation.isValid) {
      return json(
        {
          error: {
            code: 'weak_password',
            message: 'Password does not meet security requirements',
            details: { 
              errors: passwordValidation.errors,
              score: passwordValidation.score 
            }
          },
          timestamp: new Date().toISOString(),
          path: '/api/auth/register'
        },
        { status: 400 }
      );
    }

    // Register user
    const authResponse = await registerUser(tenant.id, requestData);

    // Log successful registration
    console.log('Successful registration:', {
      tenantId: tenant.id,
      userId: authResponse.user.id,
      email: authResponse.user.email,
      role: authResponse.user.role,
      timestamp: new Date().toISOString()
    });

    // Return success response
    return json(authResponse, {
      status: 201, // Created
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    // Handle authentication errors
    if (error instanceof AuthenticationError) {
      // Log registration failure (without sensitive details)
      console.warn('Registration failed:', {
        tenantId: (request as any).tenant?.id,
        errorCode: error.code,
        timestamp: new Date().toISOString(),
        path: '/api/auth/register'
      });

      const statusCode = getStatusCodeForError(error.code);
      return json(
        error.toErrorResponse('/api/auth/register'),
        { status: statusCode }
      );
    }

    // Handle unexpected errors
    console.error('Registration endpoint error:', error);
    
    return json(
      {
        error: {
          code: 'internal_error',
          message: 'An internal error occurred'
        },
        timestamp: new Date().toISOString(),
        path: '/api/auth/register'
      },
      { status: 500 }
    );
  }
}

// =====================================================================================
// VALIDATION FUNCTIONS
// =====================================================================================

/**
 * Validate registration request data
 * 
 * @param data - Request data to validate
 * @returns Array of validation errors
 */
function validateRegistrationRequest(data: any): string[] {
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
  } else if (data.email.length > 255) {
    errors.push('Email cannot exceed 255 characters');
  }

  // Validate password
  if (!data.password) {
    errors.push('Password is required');
  } else if (typeof data.password !== 'string') {
    errors.push('Password must be a string');
  }

  // Validate first name
  if (!data.firstName) {
    errors.push('First name is required');
  } else if (typeof data.firstName !== 'string') {
    errors.push('First name must be a string');
  } else if (data.firstName.trim().length < 1) {
    errors.push('First name cannot be empty');
  } else if (data.firstName.length > 100) {
    errors.push('First name cannot exceed 100 characters');
  }

  // Validate last name
  if (!data.lastName) {
    errors.push('Last name is required');
  } else if (typeof data.lastName !== 'string') {
    errors.push('Last name must be a string');
  } else if (data.lastName.trim().length < 1) {
    errors.push('Last name cannot be empty');
  } else if (data.lastName.length > 100) {
    errors.push('Last name cannot exceed 100 characters');
  }

  // Validate role (optional)
  if (data.role !== undefined) {
    if (typeof data.role !== 'string') {
      errors.push('Role must be a string');
    } else if (!isValidRole(data.role)) {
      errors.push('Role must be one of: owner, staff, customer');
    }
  }

  // Validate phone (optional)
  if (data.phone !== undefined && data.phone !== null) {
    if (typeof data.phone !== 'string') {
      errors.push('Phone must be a string');
    } else if (data.phone.trim().length > 0 && !isValidPhone(data.phone)) {
      errors.push('Phone must be a valid phone number');
    } else if (data.phone.length > 20) {
      errors.push('Phone cannot exceed 20 characters');
    }
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

/**
 * Validate role value
 * 
 * @param role - Role to validate
 * @returns True if role is valid
 */
function isValidRole(role: string): role is Role {
  return ['owner', 'staff', 'customer'].includes(role);
}

/**
 * Validate phone number format
 * 
 * @param phone - Phone number to validate
 * @returns True if phone is valid
 */
function isValidPhone(phone: string): boolean {
  // Basic phone validation - allows various formats
  const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)\.]{7,15}$/;
  return phoneRegex.test(phone.trim());
}

/**
 * Validate name characters (letters, spaces, hyphens, apostrophes)
 * 
 * @param name - Name to validate
 * @returns True if name contains valid characters
 */
function isValidName(name: string): boolean {
  const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
  return nameRegex.test(name.trim());
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
    case 'email_already_exists':
    case 'weak_password':
    case 'validation_error':
      return 400; // Bad Request
      
    case 'invalid_credentials':
    case 'user_not_found':
    case 'token_expired':
    case 'token_invalid':
    case 'malformed_token':
      return 401; // Unauthorized
      
    case 'insufficient_permissions':
    case 'tenant_mismatch':
      return 403; // Forbidden
      
    default:
      return 400; // Default to bad request for registration
  }
}

// =====================================================================================
// SECURITY AND MONITORING
// =====================================================================================

/**
 * Check registration rate limits
 * 
 * @param identifier - Rate limit identifier (IP address)
 * @returns True if request should be allowed
 */
async function checkRegistrationRateLimit(identifier: string): Promise<boolean> {
  // TODO: Implement rate limiting with Redis
  // For now, always allow (should be implemented in production)
  return true;
}

/**
 * Log registration attempt for monitoring
 * 
 * @param email - Email being registered
 * @param tenantId - Tenant ID
 * @param success - Whether registration was successful
 * @param request - Request object
 */
function logRegistrationAttempt(
  email: string,
  tenantId: string,
  success: boolean,
  request: Request
): void {
  const logData = {
    event: success ? 'successful_registration' : 'failed_registration',
    email: email.toLowerCase().trim(),
    tenantId,
    timestamp: new Date().toISOString(),
    ip: request.headers.get('X-Forwarded-For') || 
        request.headers.get('X-Real-IP') || 
        'unknown',
    userAgent: request.headers.get('User-Agent') || 'unknown'
  };

  if (success) {
    console.log('REGISTRATION_EVENT:', JSON.stringify(logData));
  } else {
    console.warn('REGISTRATION_EVENT:', JSON.stringify(logData));
  }
}

/**
 * Sanitize registration data for logging
 * 
 * @param data - Registration data
 * @returns Sanitized data without sensitive information
 */
function sanitizeRegistrationData(data: RegisterRequest): Partial<RegisterRequest> {
  const { password, ...sanitized } = data;
  return {
    ...sanitized,
    password: '[REDACTED]'
  };
}

// =====================================================================================
// BUSINESS LOGIC HELPERS
// =====================================================================================

/**
 * Determine default role based on tenant settings
 * 
 * @param tenant - Tenant object
 * @returns Default role for new users
 */
function getDefaultRole(tenant: any): Role {
  // Check tenant settings for default role
  if (tenant.settings?.defaultUserRole) {
    const defaultRole = tenant.settings.defaultUserRole;
    if (isValidRole(defaultRole)) {
      return defaultRole;
    }
  }
  
  // Default to customer role
  return 'customer';
}

/**
 * Check if role assignment is allowed for tenant
 * 
 * @param role - Role being assigned
 * @param tenant - Tenant object
 * @returns True if role assignment is allowed
 */
function isRoleAssignmentAllowed(role: Role, tenant: any): boolean {
  // Check tenant settings for role restrictions
  const allowedRoles = tenant.settings?.allowedRegistrationRoles || ['customer'];
  
  return allowedRoles.includes(role);
}

// =====================================================================================
// API DOCUMENTATION
// =====================================================================================

/**
 * API Documentation for Registration Endpoint
 * 
 * POST /api/auth/register
 * 
 * Request Body:
 * {
 *   "email": "newuser@example.com",
 *   "password": "securePassword123!",
 *   "firstName": "Jane",
 *   "lastName": "Doe",
 *   "role": "customer",     // Optional: owner, staff, customer (default: customer)
 *   "phone": "+1234567890"  // Optional
 * }
 * 
 * Success Response (201):
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": "user-uuid",
 *     "email": "newuser@example.com",
 *     "firstName": "Jane",
 *     "lastName": "Doe",
 *     "role": "customer",
 *     "phone": "+1234567890",
 *     "loyaltyPoints": 0,
 *     "createdAt": "2024-01-15T10:30:00Z"
 *   },
 *   "expiresAt": "2024-01-16T10:30:00Z"
 * }
 * 
 * Error Response (400):
 * {
 *   "error": {
 *     "code": "validation_error",
 *     "message": "Validation failed",
 *     "details": {
 *       "errors": ["Email is required", "Password is too weak"]
 *     }
 *   },
 *   "timestamp": "2024-01-15T10:30:00Z",
 *   "path": "/api/auth/register"
 * }
 * 
 * Error Codes:
 * - validation_error: Request validation failed
 * - email_already_exists: Email is already registered
 * - weak_password: Password doesn't meet requirements
 * - tenant_not_found: Tenant not found for domain
 * - method_not_allowed: Non-POST request
 * - invalid_json: Malformed JSON in request
 * - internal_error: Server error
 * 
 * Password Requirements:
 * - Minimum 8 characters
 * - Recommended: mix of uppercase, lowercase, numbers, special characters
 * - Avoid common patterns and dictionary words
 */