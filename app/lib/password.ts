/**
 * Password Security Utilities for GrowPlate Multi-Tenant Platform
 * 
 * This module provides secure password hashing, verification, and validation
 * using bcrypt with configurable salt rounds. All functions are designed
 * to prevent timing attacks and follow security best practices.
 */

import bcrypt from 'bcryptjs';
import type { PasswordValidationResult, HashOptions } from '~/types/auth';

// =====================================================================================
// CONFIGURATION
// =====================================================================================

/**
 * Default bcrypt salt rounds for password hashing
 * Higher values = more secure but slower
 * 12 provides good balance of security and performance (~100ms)
 */
const DEFAULT_SALT_ROUNDS = 12;

/**
 * Password requirements
 */
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireLowercase: false, // Will be enforced on frontend
  requireUppercase: false, // Will be enforced on frontend
  requireNumbers: false,   // Will be enforced on frontend
  requireSpecialChars: false // Will be enforced on frontend
} as const;

// =====================================================================================
// CORE PASSWORD FUNCTIONS
// =====================================================================================

/**
 * Hash a password using bcrypt with salt
 * 
 * @param password - Plain text password to hash
 * @param options - Hashing options (salt rounds)
 * @returns Promise resolving to hashed password
 * 
 * @example
 * const hash = await hashPassword('mySecurePassword123');
 * // Returns: $2a$12$...
 */
export async function hashPassword(
  password: string, 
  options: HashOptions = {}
): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    throw new Error(`Password cannot exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`);
  }

  const saltRounds = options.saltRounds ?? 
    parseInt(process.env.BCRYPT_SALT_ROUNDS || String(DEFAULT_SALT_ROUNDS));

  if (saltRounds < 10 || saltRounds > 20) {
    throw new Error('Salt rounds must be between 10 and 20');
  }

  try {
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
  } catch (error) {
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against its hash
 * 
 * @param password - Plain text password to verify
 * @param hash - Stored password hash
 * @returns Promise resolving to true if password matches
 * 
 * @example
 * const isValid = await verifyPassword('myPassword', storedHash);
 * if (isValid) {
 *   // Password is correct
 * }
 */
export async function verifyPassword(
  password: string, 
  hash: string
): Promise<boolean> {
  if (!password || typeof password !== 'string') {
    return false;
  }

  if (!hash || typeof hash !== 'string') {
    return false;
  }

  // Validate hash format (bcrypt hashes start with $2a$, $2b$, or $2y$)
  if (!hash.match(/^\$2[ayb]\$[0-9]{2}\$.{53}$/)) {
    return false;
  }

  try {
    const isValid = await bcrypt.compare(password, hash);
    return isValid;
  } catch (error) {
    // Log error but don't throw to prevent timing attacks
    console.error('Password verification error:', error);
    return false;
  }
}

// =====================================================================================
// PASSWORD VALIDATION
// =====================================================================================

/**
 * Validate password strength and requirements
 * 
 * @param password - Password to validate
 * @returns Validation result with errors and score
 * 
 * @example
 * const result = validatePasswordStrength('myPassword123');
 * if (!result.isValid) {
 *   console.log('Errors:', result.errors);
 * }
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Check if password exists
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['Password is required'],
      score: 0
    };
  }

  // Length requirements
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  } else {
    score += 20;
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password cannot exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`);
  }

  // Character type checks (for scoring only)
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (hasLowercase) score += 15;
  if (hasUppercase) score += 15;
  if (hasNumbers) score += 15;
  if (hasSpecialChars) score += 15;

  // Length bonus
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Common password patterns (deduct points)
  const commonPatterns = [
    /(.)\1{2,}/, // Repeated characters (aaa, 111)
    /123456/,    // Sequential numbers
    /abcdef/i,   // Sequential letters
    /qwerty/i,   // Keyboard patterns
    /password/i, // Common words
    /admin/i,
    /login/i
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      score = Math.max(0, score - 20);
      errors.push('Password contains common patterns that reduce security');
      break; // Only show this error once
    }
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    score: Math.min(100, Math.max(0, score))
  };
}

// =====================================================================================
// UTILITY FUNCTIONS
// =====================================================================================

/**
 * Check if a hash appears to be a valid bcrypt hash
 * 
 * @param hash - Hash string to validate
 * @returns True if hash format is valid
 */
export function isValidBcryptHash(hash: string): boolean {
  if (!hash || typeof hash !== 'string') {
    return false;
  }

  // bcrypt hash format: $2a$12$53character_hash
  return /^\$2[ayb]\$[0-9]{2}\$.{53}$/.test(hash);
}

/**
 * Get password requirements for client-side validation
 * 
 * @returns Password requirements object
 */
export function getPasswordRequirements() {
  return {
    ...PASSWORD_REQUIREMENTS,
    // Add helpful descriptions
    descriptions: {
      minLength: `At least ${PASSWORD_REQUIREMENTS.minLength} characters`,
      maxLength: `No more than ${PASSWORD_REQUIREMENTS.maxLength} characters`,
      recommendations: [
        'Use a mix of uppercase and lowercase letters',
        'Include numbers and special characters',
        'Avoid common words and patterns',
        'Consider using a passphrase'
      ]
    }
  };
}

/**
 * Generate a cryptographically secure random password
 * 
 * @param length - Password length (default: 16)
 * @returns Random password string
 */
export function generateSecurePassword(length: number = 16): string {
  if (length < 8 || length > 128) {
    throw new Error('Password length must be between 8 and 128 characters');
  }

  const { randomInt } = require('crypto');

  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + special;
  let password = '';

  // Ensure at least one character from each category
  password += lowercase[randomInt(lowercase.length)];
  password += uppercase[randomInt(uppercase.length)];
  password += numbers[randomInt(numbers.length)];
  password += special[randomInt(special.length)];

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[randomInt(allChars.length)];
  }

  // Shuffle the password to avoid predictable patterns
  // Use Fisher-Yates shuffle with crypto random
  const passwordArray = password.split('');
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }
  
  return passwordArray.join('');
}

// =====================================================================================
// SECURITY UTILITIES
// =====================================================================================

/**
 * Compare two strings in constant time to prevent timing attacks
 * 
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const { timingSafeEqual } = require('crypto');
  
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  return timingSafeEqual(aBuffer, bBuffer);
}

/**
 * Sanitize password for logging (completely remove)
 * 
 * @param data - Object that might contain password fields
 * @returns Sanitized object with passwords removed
 */
export function sanitizePasswordFromLogs(data: Record<string, any>): Record<string, any> {
  const sensitiveFields = [
    'password',
    'newPassword',
    'oldPassword',
    'confirmPassword',
    'passwordHash',
    'hash'
  ];

  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

// =====================================================================================
// EXPORTS
// =====================================================================================

export {
  DEFAULT_SALT_ROUNDS,
  PASSWORD_REQUIREMENTS
};