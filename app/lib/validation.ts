/**
 * Feature Flag Validation Utilities
 * 
 * Input validation and sanitization for feature flag operations
 * 
 * TASK-005: Feature Flag System Implementation
 */

import type { Features, FeatureName } from "~/types/features";

// Valid feature names for Task-005 scope
const VALID_FEATURES: FeatureName[] = ['orders', 'loyalty', 'menu'];

/**
 * Validate feature update payload
 * Ensures the input is a valid partial Features object
 */
export function validateFeatureUpdate(features: unknown): features is Partial<Features> {
  if (!features || typeof features !== 'object' || Array.isArray(features)) {
    return false;
  }

  // Check that all provided keys are valid feature names with boolean values
  return Object.entries(features).every(([key, value]) => {
    return VALID_FEATURES.includes(key as FeatureName) && typeof value === 'boolean';
  });
}

/**
 * Sanitize features object
 * Returns only valid features with boolean values
 */
export function sanitizeFeatures(features: unknown): Partial<Features> {
  if (!features || typeof features !== 'object' || Array.isArray(features)) {
    return {};
  }

  const sanitized: Partial<Features> = {};
  const featuresObj = features as Record<string, unknown>;

  VALID_FEATURES.forEach(feature => {
    if (feature in featuresObj && typeof featuresObj[feature] === 'boolean') {
      sanitized[feature] = featuresObj[feature];
    }
  });

  return sanitized;
}

/**
 * Validate individual feature name
 */
export function isValidFeatureName(name: string): name is FeatureName {
  return VALID_FEATURES.includes(name as FeatureName);
}

/**
 * Validate feature value
 */
export function isValidFeatureValue(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Validate complete Features object
 * Ensures all required features are present with valid values
 */
export function validateCompleteFeatures(features: unknown): features is Features {
  if (!features || typeof features !== 'object' || Array.isArray(features)) {
    return false;
  }

  const featuresObj = features as Record<string, unknown>;

  // Check that all required features are present with boolean values
  return VALID_FEATURES.every(feature => 
    feature in featuresObj && typeof featuresObj[feature] === 'boolean'
  );
}

/**
 * Create validation error message
 */
export function createValidationError(field: string, value: unknown): string {
  if (field === 'features') {
    return `Invalid features object. Expected object with boolean values for: ${VALID_FEATURES.join(', ')}`;
  }
  
  if (VALID_FEATURES.includes(field as FeatureName)) {
    return `Invalid value for feature '${field}'. Expected boolean, got ${typeof value}`;
  }
  
  return `Invalid feature name '${field}'. Valid features are: ${VALID_FEATURES.join(', ')}`;
}

/**
 * Validate API request body for feature updates
 */
export function validateFeatureUpdateRequest(body: unknown): {
  isValid: boolean;
  features?: Partial<Features>;
  error?: string;
} {
  if (!body) {
    return {
      isValid: false,
      error: 'Request body is required'
    };
  }

  if (!body || typeof body !== 'object' || !('features' in body)) {
    return {
      isValid: false,
      error: 'Features object is required in request body'
    };
  }

  const bodyObj = body as Record<string, unknown>;
  const features = bodyObj.features;
  
  if (!validateFeatureUpdate(features)) {
    return {
      isValid: false,
      error: createValidationError('features', features)
    };
  }

  const sanitizedFeatures = sanitizeFeatures(features);
  
  if (Object.keys(sanitizedFeatures).length === 0) {
    return {
      isValid: false,
      error: 'No valid features provided for update'
    };
  }

  return {
    isValid: true,
    features: sanitizedFeatures
  };
}

// Export valid features for reference
export { VALID_FEATURES };