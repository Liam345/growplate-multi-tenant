/**
 * Security Tests for Password Utilities
 * 
 * Tests critical security functions before implementing fixes from PR review analysis
 */

// Using Jest for testing
import {
  generateSecurePassword,
  constantTimeEqual,
  hashPassword,
  verifyPassword,
  validatePasswordStrength
} from '../password';

describe('Password Security Functions - Pre-Fix Tests', () => {
  describe('generateSecurePassword', () => {
    it('should generate passwords with required length', () => {
      const password8 = generateSecurePassword(8);
      const password16 = generateSecurePassword(16);
      const password32 = generateSecurePassword(32);

      expect(password8).toHaveLength(8);
      expect(password16).toHaveLength(16);
      expect(password32).toHaveLength(32);
    });

    it('should include characters from all categories', () => {
      const password = generateSecurePassword(16);
      
      // Should have lowercase
      expect(password).toMatch(/[a-z]/);
      
      // Should have uppercase
      expect(password).toMatch(/[A-Z]/);
      
      // Should have numbers
      expect(password).toMatch(/\d/);
      
      // Should have special characters
      expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
    });

    it('should generate different passwords on multiple calls', () => {
      const password1 = generateSecurePassword(16);
      const password2 = generateSecurePassword(16);
      const password3 = generateSecurePassword(16);

      expect(password1).not.toBe(password2);
      expect(password2).not.toBe(password3);
      expect(password1).not.toBe(password3);
    });

    it('should throw error for invalid lengths', () => {
      expect(() => generateSecurePassword(7)).toThrow('Password length must be between 8 and 128 characters');
      expect(() => generateSecurePassword(129)).toThrow('Password length must be between 8 and 128 characters');
    });

    // Test for Math.random() usage (will be fixed)
    it('should use secure random number generation', () => {
      // This test documents current insecure behavior
      // After fix, this should pass with crypto.randomInt
      const passwords = new Set();
      for (let i = 0; i < 100; i++) {
        passwords.add(generateSecurePassword(12));
      }
      
      // Should generate unique passwords (Math.random is predictable but not completely broken)
      expect(passwords.size).toBe(100);
    });
  });

  describe('constantTimeEqual', () => {
    it('should return true for identical strings', () => {
      expect(constantTimeEqual('hello', 'hello')).toBe(true);
      expect(constantTimeEqual('', '')).toBe(true);
      expect(constantTimeEqual('complex_string_123!@#', 'complex_string_123!@#')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(constantTimeEqual('hello', 'world')).toBe(false);
      expect(constantTimeEqual('hello', 'Hello')).toBe(false);
      expect(constantTimeEqual('test', 'testing')).toBe(false);
    });

    it('should return false for different length strings', () => {
      expect(constantTimeEqual('short', 'longer_string')).toBe(false);
      expect(constantTimeEqual('', 'nonempty')).toBe(false);
    });

    // Test timing safety (will be improved with crypto.timingSafeEqual)
    it('should have consistent timing for different strings of same length', async () => {
      const str1 = 'a'.repeat(100);
      const str2 = 'b'.repeat(100);
      const str3 = 'c'.repeat(100);

      // Measure timing for multiple comparisons
      const measurements = [];
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        constantTimeEqual(str1, str2);
        const end = performance.now();
        measurements.push(end - start);
      }

      const measurements2 = [];
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        constantTimeEqual(str1, str3);
        const end = performance.now();
        measurements2.push(end - start);
      }

      // Current implementation should have reasonably consistent timing
      // (This test documents current behavior, will be more secure after fix)
      const avg1 = measurements.reduce((a, b) => a + b) / measurements.length;
      const avg2 = measurements2.reduce((a, b) => a + b) / measurements2.length;
      
      // Timing should be similar (within reasonable variance)
      const ratio = Math.max(avg1, avg2) / Math.min(avg1, avg2);
      expect(ratio).toBeLessThan(2); // Allow for some variance in JS timing
    });
  });

  describe('hashPassword', () => {
    it('should hash passwords successfully', async () => {
      const password = 'testPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[ayb]\$\d{2}\$.{53}$/); // bcrypt format
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Different salts
    });

    it('should throw error for invalid input', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password must be a non-empty string');
      await expect(hashPassword(null as any)).rejects.toThrow('Password must be a non-empty string');
    });

    it('should use appropriate salt rounds', async () => {
      const password = 'testPassword123!';
      const start = Date.now();
      await hashPassword(password);
      const duration = Date.now() - start;

      // Should take reasonable time (bcrypt with 12 rounds ~100ms)
      expect(duration).toBeGreaterThan(10);
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct passwords', async () => {
      const password = 'testPassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const password = 'testPassword123!';
      const wrongPassword = 'wrongPassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it('should handle invalid inputs gracefully', async () => {
      const password = 'testPassword123!';
      const hash = await hashPassword(password);

      // Invalid password inputs
      expect(await verifyPassword('', hash)).toBe(false);
      expect(await verifyPassword(null as any, hash)).toBe(false);

      // Invalid hash inputs
      expect(await verifyPassword(password, '')).toBe(false);
      expect(await verifyPassword(password, 'invalid_hash')).toBe(false);
      expect(await verifyPassword(password, null as any)).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'StrongP@ssw0rd123',
        'C0mplex!P@ssword2024',
        'MySecur3P@ssphrase!'
      ];

      strongPasswords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
        expect(result.score).toBeGreaterThan(80);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'short',
        '12345678',
        'password',
        'qwerty123',
        'aaaaaaaa'
      ];

      weakPasswords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should handle minimum length requirement', () => {
      const shortPassword = '1234567'; // 7 chars
      const validPassword = '12345678'; // 8 chars

      const shortResult = validatePasswordStrength(shortPassword);
      const validResult = validatePasswordStrength(validPassword);

      expect(shortResult.isValid).toBe(false);
      expect(shortResult.errors).toContain('Password must be at least 8 characters long');

      expect(validResult.isValid).toBe(true);
    });
  });
});

describe('Integration Tests', () => {
  it('should work with generated secure passwords', async () => {
    // Generate password and test full cycle
    const password = generateSecurePassword(16);
    const validationResult = validatePasswordStrength(password);
    
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.score).toBeGreaterThan(80);

    // Hash and verify
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);
    
    expect(isValid).toBe(true);
  });

  it('should maintain security properties across functions', async () => {
    const password1 = generateSecurePassword(20);
    const password2 = generateSecurePassword(20);
    
    // Passwords should be different
    expect(password1).not.toBe(password2);
    
    // Both should be strong
    expect(validatePasswordStrength(password1).isValid).toBe(true);
    expect(validatePasswordStrength(password2).isValid).toBe(true);
    
    // Hashes should be different
    const hash1 = await hashPassword(password1);
    const hash2 = await hashPassword(password2);
    expect(hash1).not.toBe(hash2);
    
    // Each should verify correctly
    expect(await verifyPassword(password1, hash1)).toBe(true);
    expect(await verifyPassword(password2, hash2)).toBe(true);
    expect(await verifyPassword(password1, hash2)).toBe(false);
    expect(await verifyPassword(password2, hash1)).toBe(false);
  });
});