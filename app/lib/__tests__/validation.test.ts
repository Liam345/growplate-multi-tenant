/**
 * Unit Tests for Validation Utilities
 * 
 * Tests for feature flag validation and sanitization functions.
 */

import {
  validateFeatureUpdate,
  sanitizeFeatures,
  isValidFeatureName,
  isValidFeatureValue,
  validateCompleteFeatures,
  createValidationError,
  validateFeatureUpdateRequest,
  VALID_FEATURES
} from '../validation';

describe('Validation Utilities', () => {
  describe('validateFeatureUpdate', () => {
    it('should validate correct partial features object', () => {
      const validPartial = { orders: true, loyalty: false };
      expect(validateFeatureUpdate(validPartial)).toBe(true);
    });

    it('should validate single feature update', () => {
      const singleFeature = { menu: false };
      expect(validateFeatureUpdate(singleFeature)).toBe(true);
    });

    it('should reject null or undefined', () => {
      expect(validateFeatureUpdate(null)).toBe(false);
      expect(validateFeatureUpdate(undefined)).toBe(false);
    });

    it('should reject non-object types', () => {
      expect(validateFeatureUpdate('string')).toBe(false);
      expect(validateFeatureUpdate(123)).toBe(false);
      expect(validateFeatureUpdate(true)).toBe(false);
    });

    it('should reject arrays', () => {
      expect(validateFeatureUpdate(['orders', 'loyalty'])).toBe(false);
    });

    it('should reject invalid feature names', () => {
      const invalidName = { invalidFeature: true };
      expect(validateFeatureUpdate(invalidName)).toBe(false);
    });

    it('should reject non-boolean values', () => {
      const nonBoolean = { orders: 'true' };
      expect(validateFeatureUpdate(nonBoolean)).toBe(false);
    });

    it('should reject mixed valid and invalid features', () => {
      const mixed = { orders: true, invalidFeature: false };
      expect(validateFeatureUpdate(mixed)).toBe(false);
    });

    it('should accept empty object', () => {
      expect(validateFeatureUpdate({})).toBe(true);
    });
  });

  describe('sanitizeFeatures', () => {
    it('should return only valid features', () => {
      const input = { 
        orders: true, 
        loyalty: false, 
        invalidFeature: true,
        menu: false
      };
      const result = sanitizeFeatures(input);
      
      expect(result).toEqual({
        orders: true,
        loyalty: false,
        menu: false
      });
    });

    it('should filter out non-boolean values', () => {
      const input = {
        orders: true,
        loyalty: 'false', // string instead of boolean
        menu: 1 // number instead of boolean
      };
      const result = sanitizeFeatures(input);
      
      expect(result).toEqual({
        orders: true
      });
    });

    it('should return empty object for invalid input', () => {
      expect(sanitizeFeatures(null)).toEqual({});
      expect(sanitizeFeatures(undefined)).toEqual({});
      expect(sanitizeFeatures('string')).toEqual({});
      expect(sanitizeFeatures([])).toEqual({});
    });

    it('should handle empty object', () => {
      expect(sanitizeFeatures({})).toEqual({});
    });

    it('should preserve valid features and ignore invalid ones', () => {
      const input = {
        orders: true,
        invalidFeature1: false,
        loyalty: true,
        invalidFeature2: 'string',
        menu: false
      };
      const result = sanitizeFeatures(input);
      
      expect(result).toEqual({
        orders: true,
        loyalty: true,
        menu: false
      });
    });
  });

  describe('isValidFeatureName', () => {
    it('should validate correct feature names', () => {
      VALID_FEATURES.forEach(feature => {
        expect(isValidFeatureName(feature)).toBe(true);
      });
    });

    it('should reject invalid feature names', () => {
      expect(isValidFeatureName('invalidFeature')).toBe(false);
      expect(isValidFeatureName('reservations')).toBe(false);
      expect(isValidFeatureName('')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(isValidFeatureName('Orders')).toBe(false);
      expect(isValidFeatureName('MENU')).toBe(false);
    });
  });

  describe('isValidFeatureValue', () => {
    it('should validate boolean values', () => {
      expect(isValidFeatureValue(true)).toBe(true);
      expect(isValidFeatureValue(false)).toBe(true);
    });

    it('should reject non-boolean values', () => {
      expect(isValidFeatureValue('true')).toBe(false);
      expect(isValidFeatureValue(1)).toBe(false);
      expect(isValidFeatureValue(0)).toBe(false);
      expect(isValidFeatureValue(null)).toBe(false);
      expect(isValidFeatureValue(undefined)).toBe(false);
      expect(isValidFeatureValue({})).toBe(false);
    });
  });

  describe('validateCompleteFeatures', () => {
    it('should validate complete features object', () => {
      const complete = {
        orders: true,
        loyalty: false,
        menu: true
      };
      expect(validateCompleteFeatures(complete)).toBe(true);
    });

    it('should reject incomplete features object', () => {
      const incomplete = {
        orders: true,
        loyalty: false
        // missing menu
      };
      expect(validateCompleteFeatures(incomplete)).toBe(false);
    });

    it('should reject objects with extra properties', () => {
      const extra = {
        orders: true,
        loyalty: false,
        menu: true,
        extraFeature: false
      };
      expect(validateCompleteFeatures(extra)).toBe(false);
    });

    it('should reject non-object types', () => {
      expect(validateCompleteFeatures(null)).toBe(false);
      expect(validateCompleteFeatures('object')).toBe(false);
      expect(validateCompleteFeatures([])).toBe(false);
    });
  });

  describe('createValidationError', () => {
    it('should create error for features field', () => {
      const error = createValidationError('features', {});
      expect(error).toContain('Invalid features object');
      expect(error).toContain('orders, loyalty, menu');
    });

    it('should create error for specific feature', () => {
      const error = createValidationError('orders', 'string');
      expect(error).toContain("Invalid value for feature 'orders'");
      expect(error).toContain('Expected boolean, got string');
    });

    it('should create error for invalid feature name', () => {
      const error = createValidationError('invalidFeature', true);
      expect(error).toContain("Invalid feature name 'invalidFeature'");
      expect(error).toContain('Valid features are: orders, loyalty, menu');
    });
  });

  describe('validateFeatureUpdateRequest', () => {
    it('should validate correct request body', () => {
      const body = {
        features: {
          orders: true,
          loyalty: false
        }
      };
      const result = validateFeatureUpdateRequest(body);
      
      expect(result.isValid).toBe(true);
      expect(result.features).toEqual({
        orders: true,
        loyalty: false
      });
      expect(result.error).toBeUndefined();
    });

    it('should reject missing request body', () => {
      const result = validateFeatureUpdateRequest(null);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Request body is required');
    });

    it('should reject missing features property', () => {
      const body = { otherProperty: 'value' };
      const result = validateFeatureUpdateRequest(body);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Features object is required in request body');
    });

    it('should reject invalid features object', () => {
      const body = {
        features: 'invalid'
      };
      const result = validateFeatureUpdateRequest(body);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid features object');
    });

    it('should reject when no valid features provided after sanitization', () => {
      const body = {
        features: {
          invalidFeature: true
        }
      };
      const result = validateFeatureUpdateRequest(body);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('No valid features provided for update');
    });

    it('should sanitize and return valid features', () => {
      const body = {
        features: {
          orders: true,
          invalidFeature: false,
          loyalty: true,
          anotherInvalid: 'string'
        }
      };
      const result = validateFeatureUpdateRequest(body);
      
      expect(result.isValid).toBe(true);
      expect(result.features).toEqual({
        orders: true,
        loyalty: true
      });
    });

    it('should handle empty features object', () => {
      const body = {
        features: {}
      };
      const result = validateFeatureUpdateRequest(body);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('No valid features provided for update');
    });
  });
});