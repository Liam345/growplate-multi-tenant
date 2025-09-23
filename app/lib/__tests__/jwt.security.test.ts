/**
 * Security Tests for JWT Utilities
 * 
 * Tests JWT functions before implementing fixes from PR review analysis
 */

// Using Jest for testing
import { createToken, validateToken, extractTokenFromHeader, isTokenExpired } from '../jwt';
import type { JWTPayload } from '~/types/auth';

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  process.env = {
    ...originalEnv,
    JWT_SECRET: 'test-secret-key-that-is-at-least-32-characters-long-for-security',
    JWT_EXPIRES_IN: '24h',
    JWT_ISSUER: 'growplate.com',
    JWT_AUDIENCE: 'api.growplate.com'
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('JWT Security Functions - Pre-Fix Tests', () => {
  const mockPayload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'> = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    tenantId: '123e4567-e89b-12d3-a456-426614174001',
    email: 'test@example.com',
    role: 'customer'
  };

  describe('createToken', () => {
    it('should create valid JWT tokens', () => {
      const token = createToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include all required payload fields', () => {
      const token = createToken(mockPayload);
      const decoded = validateToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded!.userId).toBe(mockPayload.userId);
      expect(decoded!.tenantId).toBe(mockPayload.tenantId);
      expect(decoded!.email).toBe(mockPayload.email);
      expect(decoded!.role).toBe(mockPayload.role);
      expect(decoded!.iat).toBeDefined();
      expect(decoded!.exp).toBeDefined();
      expect(decoded!.iss).toBe('growplate.com');
      expect(decoded!.aud).toBe('api.growplate.com');
    });

    it('should create tokens with custom expiration', () => {
      const token1h = createToken(mockPayload, { expiresIn: '1h' });
      const token30m = createToken(mockPayload, { expiresIn: '30m' });

      const decoded1h = validateToken(token1h);
      const decoded30m = validateToken(token30m);

      expect(decoded1h).toBeTruthy();
      expect(decoded30m).toBeTruthy();

      // 1h token should expire later than 30m token
      expect(decoded1h!.exp).toBeGreaterThan(decoded30m!.exp);
    });

    // Test for manual expiration calculation (will be simplified)
    it('should handle various time formats in custom logic', () => {
      const formats = ['1h', '30m', '7d', '3600s'];
      
      formats.forEach(format => {
        const token = createToken(mockPayload, { expiresIn: format });
        const decoded = validateToken(token);
        
        expect(decoded).toBeTruthy();
        expect(decoded!.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
      });
    });

    it('should handle invalid time formats gracefully', () => {
      // Current implementation defaults to 24h for invalid formats
      const token = createToken(mockPayload, { expiresIn: 'invalid' as any });
      const decoded = validateToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded!.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  describe('validateToken', () => {
    it('should validate correct tokens', () => {
      const token = createToken(mockPayload);
      const decoded = validateToken(token);

      expect(decoded).toBeTruthy();
      expect(decoded!.userId).toBe(mockPayload.userId);
    });

    it('should reject invalid tokens', () => {
      const invalidTokens = [
        'invalid.token.format',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        '',
        null,
        undefined
      ];

      invalidTokens.forEach(token => {
        const decoded = validateToken(token as any);
        expect(decoded).toBeNull();
      });
    });

    it('should reject tokens with wrong secret', () => {
      const token = createToken(mockPayload);
      
      // Change secret
      process.env.JWT_SECRET = 'different-secret-key-that-is-at-least-32-characters-long';
      
      const decoded = validateToken(token);
      expect(decoded).toBeNull();
    });

    it('should reject expired tokens', () => {
      // Create token with very short expiration
      const shortToken = createToken(mockPayload, { expiresIn: '1s' });
      
      // Wait for expiration
      return new Promise(resolve => {
        setTimeout(() => {
          const decoded = validateToken(shortToken);
          expect(decoded).toBeNull();
          resolve(undefined);
        }, 1100);
      });
    }, 2000);

    // Test redundant expiration check (will be removed)
    it('should have redundant expiration validation in payload check', () => {
      const now = Math.floor(Date.now() / 1000);
      
      // Create token that's valid by jwt.verify but might fail payload validation
      const token = createToken(mockPayload);
      const decoded = validateToken(token);
      
      expect(decoded).toBeTruthy();
      expect(decoded!.exp).toBeGreaterThan(now);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract valid Bearer tokens', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZXN0IjoidmFsdWUifQ.signature';
      const authHeader = `Bearer ${token}`;

      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).toBe(token);
    });

    it('should reject invalid Authorization headers', () => {
      const invalidHeaders = [
        'Basic token123',
        'Bearer',
        'Bearer token1 token2',
        'token123',
        '',
        null,
        undefined
      ];

      invalidHeaders.forEach(header => {
        const extracted = extractTokenFromHeader(header);
        expect(extracted).toBeNull();
      });
    });

    it('should validate JWT format in extracted token', () => {
      const invalidJWTFormats = [
        'Bearer single.part',
        'Bearer one.two.three.four',
        'Bearer ...',
        'Bearer invalid'
      ];

      invalidJWTFormats.forEach(header => {
        const extracted = extractTokenFromHeader(header);
        expect(extracted).toBeNull();
      });
    });
  });

  describe('isTokenExpired', () => {
    it('should correctly identify expired tokens', () => {
      const now = Math.floor(Date.now() / 1000);
      
      const expiredPayload: JWTPayload = {
        ...mockPayload,
        iat: now - 3600,
        exp: now - 1800, // Expired 30 minutes ago
        iss: 'growplate.com',
        aud: 'api.growplate.com'
      };

      expect(isTokenExpired(expiredPayload)).toBe(true);
    });

    it('should correctly identify valid tokens', () => {
      const now = Math.floor(Date.now() / 1000);
      
      const validPayload: JWTPayload = {
        ...mockPayload,
        iat: now,
        exp: now + 3600, // Expires in 1 hour
        iss: 'growplate.com',
        aud: 'api.growplate.com'
      };

      expect(isTokenExpired(validPayload)).toBe(false);
    });

    it('should handle missing expiration', () => {
      const payloadNoExp = {
        ...mockPayload,
        iat: Math.floor(Date.now() / 1000),
        iss: 'growplate.com',
        aud: 'api.growplate.com'
      } as JWTPayload;

      delete (payloadNoExp as any).exp;

      expect(isTokenExpired(payloadNoExp)).toBe(true);
    });
  });

  describe('Security Properties', () => {
    it('should create different tokens for same payload', () => {
      const token1 = createToken(mockPayload);
      const token2 = createToken(mockPayload);

      expect(token1).not.toBe(token2); // Different iat timestamps
    });

    it('should validate issuer and audience', () => {
      const token = createToken(mockPayload);
      
      // Change issuer in env
      process.env.JWT_ISSUER = 'different-issuer.com';
      
      const decoded = validateToken(token);
      expect(decoded).toBeNull(); // Should fail validation
    });

    it('should handle malformed payloads in validation', () => {
      const token = createToken(mockPayload);
      
      // This tests the isValidJWTPayload function indirectly
      const decoded = validateToken(token);
      expect(decoded).toBeTruthy();
      
      // Payload should have proper UUID format
      expect(decoded!.userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(decoded!.tenantId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      // Email should be valid format
      expect(decoded!.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      
      // Role should be valid
      expect(['owner', 'staff', 'customer']).toContain(decoded!.role);
    });
  });

  describe('Environment Configuration', () => {
    it('should throw error for weak JWT secret', () => {
      process.env.JWT_SECRET = 'short'; // Less than 32 characters
      
      expect(() => createToken(mockPayload)).toThrow('JWT_SECRET must be set and at least 32 characters long');
    });

    it('should use default values for missing config', () => {
      delete process.env.JWT_EXPIRES_IN;
      delete process.env.JWT_ISSUER;
      delete process.env.JWT_AUDIENCE;
      
      const token = createToken(mockPayload);
      const decoded = validateToken(token);
      
      expect(decoded).toBeTruthy();
      expect(decoded!.iss).toBe('growplate.com');
      expect(decoded!.aud).toBe('api.growplate.com');
    });
  });

  describe('Integration with Auth Flow', () => {
    it('should support complete auth flow', () => {
      // Create token
      const token = createToken(mockPayload);
      
      // Extract from header
      const authHeader = `Bearer ${token}`;
      const extractedToken = extractTokenFromHeader(authHeader);
      expect(extractedToken).toBe(token);
      
      // Validate
      const decoded = validateToken(extractedToken!);
      expect(decoded).toBeTruthy();
      expect(decoded!.userId).toBe(mockPayload.userId);
      
      // Check expiration
      expect(isTokenExpired(decoded!)).toBe(false);
    });
  });
});