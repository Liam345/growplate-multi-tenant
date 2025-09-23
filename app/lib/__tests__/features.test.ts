/**
 * Unit Tests for Feature Service
 * 
 * Tests for the core feature flag functionality including caching,
 * database operations, and error handling.
 */

import { FeatureService, DEFAULT_FEATURES } from '../features';
import * as db from '../db';
import * as redis from '../redis';

// Mock dependencies
jest.mock('../db');
jest.mock('../redis');

const mockDb = db as jest.Mocked<typeof db>;
const mockRedis = redis as jest.Mocked<typeof redis>;

describe('FeatureService', () => {
  let featureService: FeatureService;
  const testTenantId = 'tenant-123';

  beforeEach(() => {
    featureService = new FeatureService();
    jest.clearAllMocks();
  });

  describe('getTenantFeatures', () => {
    it('should return cached features if available', async () => {
      const cachedFeatures = { orders: true, loyalty: false, menu: true };
      mockRedis.getTenantCache.mockResolvedValue(cachedFeatures);

      const result = await featureService.getTenantFeatures(testTenantId);

      expect(result).toEqual(cachedFeatures);
      expect(mockRedis.getTenantCache).toHaveBeenCalledWith(testTenantId, 'features');
      expect(mockDb.tenantQueryMany).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache when cache misses', async () => {
      const dbRows = [
        { feature_name: 'orders', enabled: true },
        { feature_name: 'loyalty', enabled: false }
      ];
      mockRedis.getTenantCache.mockResolvedValue(null);
      mockDb.tenantQueryMany.mockResolvedValue(dbRows);
      mockRedis.setTenantCache.mockResolvedValue(true);

      const result = await featureService.getTenantFeatures(testTenantId);

      expect(result).toEqual({
        orders: true,
        loyalty: false,
        menu: true // Default value
      });
      expect(mockDb.tenantQueryMany).toHaveBeenCalledWith(
        testTenantId,
        expect.stringContaining('SELECT feature_name, enabled FROM tenant_features'),
        [testTenantId]
      );
      expect(mockRedis.setTenantCache).toHaveBeenCalledWith(
        testTenantId,
        'features',
        expect.objectContaining({ orders: true, loyalty: false, menu: true }),
        expect.objectContaining({ ttl: expect.any(Number) })
      );
    });

    it('should return defaults when no database records exist', async () => {
      mockRedis.getTenantCache.mockResolvedValue(null);
      mockDb.tenantQueryMany.mockResolvedValue([]);
      mockRedis.setTenantCache.mockResolvedValue(true);

      const result = await featureService.getTenantFeatures(testTenantId);

      expect(result).toEqual(DEFAULT_FEATURES);
    });

    it('should return defaults on error and log the error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockRedis.getTenantCache.mockRejectedValue(new Error('Redis error'));

      const result = await featureService.getTenantFeatures(testTenantId);

      expect(result).toEqual(DEFAULT_FEATURES);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get tenant features:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should throw error for missing tenant ID', async () => {
      await expect(featureService.getTenantFeatures('')).rejects.toThrow('Tenant ID is required');
    });
  });

  describe('updateTenantFeatures', () => {
    it('should update features and invalidate cache', async () => {
      const updates = { orders: true, loyalty: true };
      const expectedResult = { orders: true, loyalty: true, menu: true };

      mockDb.tenantQuery.mockResolvedValue({ rows: [], rowCount: 1 } as any);
      mockRedis.deleteTenantCache.mockResolvedValue(true);
      
      // Mock the subsequent getTenantFeatures call
      mockRedis.getTenantCache.mockResolvedValue(null);
      mockDb.tenantQueryMany.mockResolvedValue([
        { feature_name: 'orders', enabled: true },
        { feature_name: 'loyalty', enabled: true }
      ]);
      mockRedis.setTenantCache.mockResolvedValue(true);

      const result = await featureService.updateTenantFeatures(testTenantId, updates);

      expect(result).toEqual(expectedResult);
      expect(mockDb.tenantQuery).toHaveBeenCalledTimes(2); // Once for each feature
      expect(mockRedis.deleteTenantCache).toHaveBeenCalledWith(testTenantId, 'features');
    });

    it('should only update valid features', async () => {
      const updates = { orders: true, invalid: true } as any;

      mockDb.tenantQuery.mockResolvedValue({ rows: [], rowCount: 1 } as any);
      mockRedis.deleteTenantCache.mockResolvedValue(true);
      mockRedis.getTenantCache.mockResolvedValue(null);
      mockDb.tenantQueryMany.mockResolvedValue([
        { feature_name: 'orders', enabled: true }
      ]);
      mockRedis.setTenantCache.mockResolvedValue(true);

      await featureService.updateTenantFeatures(testTenantId, updates);

      // Should only update 'orders', not 'invalid'
      expect(mockDb.tenantQuery).toHaveBeenCalledTimes(1);
      expect(mockDb.tenantQuery).toHaveBeenCalledWith(
        testTenantId,
        expect.stringContaining('INSERT INTO tenant_features'),
        [testTenantId, 'orders', true]
      );
    });

    it('should throw error when no valid features provided', async () => {
      const updates = { invalid: true } as any;

      await expect(featureService.updateTenantFeatures(testTenantId, updates))
        .rejects.toThrow('No valid features provided');
    });

    it('should throw error for missing tenant ID', async () => {
      await expect(featureService.updateTenantFeatures('', { orders: true }))
        .rejects.toThrow('Tenant ID is required');
    });

    it('should throw error for invalid features object', async () => {
      await expect(featureService.updateTenantFeatures(testTenantId, null as any))
        .rejects.toThrow('Features object is required');
    });

    it('should handle database errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockDb.tenantQuery.mockRejectedValue(new Error('Database error'));

      await expect(featureService.updateTenantFeatures(testTenantId, { orders: true }))
        .rejects.toThrow('Database update failed');
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update tenant features:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return correct feature status', async () => {
      const features = { orders: true, loyalty: false, menu: true };
      mockRedis.getTenantCache.mockResolvedValue(features);

      const ordersEnabled = await featureService.isFeatureEnabled(testTenantId, 'orders');
      const loyaltyEnabled = await featureService.isFeatureEnabled(testTenantId, 'loyalty');

      expect(ordersEnabled).toBe(true);
      expect(loyaltyEnabled).toBe(false);
    });

    it('should return false for disabled features', async () => {
      const features = { orders: false, loyalty: false, menu: true };
      mockRedis.getTenantCache.mockResolvedValue(features);

      const ordersEnabled = await featureService.isFeatureEnabled(testTenantId, 'orders');

      expect(ordersEnabled).toBe(false);
    });
  });

  describe('initializeTenantFeatures', () => {
    it('should initialize default features for new tenant', async () => {
      mockDb.tenantQuery.mockResolvedValue({ rows: [], rowCount: 1 } as any);
      mockRedis.setTenantCache.mockResolvedValue(true);

      const result = await featureService.initializeTenantFeatures(testTenantId);

      expect(result).toEqual(DEFAULT_FEATURES);
      expect(mockDb.tenantQuery).toHaveBeenCalledTimes(3); // One for each default feature
      expect(mockRedis.setTenantCache).toHaveBeenCalledWith(
        testTenantId,
        'features',
        DEFAULT_FEATURES,
        expect.objectContaining({ ttl: expect.any(Number) })
      );
    });

    it('should throw error for missing tenant ID', async () => {
      await expect(featureService.initializeTenantFeatures(''))
        .rejects.toThrow('Tenant ID is required');
    });

    it('should handle database errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockDb.tenantQuery.mockRejectedValue(new Error('Database error'));

      await expect(featureService.initializeTenantFeatures(testTenantId))
        .rejects.toThrow('Feature initialization failed');
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize tenant features:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('clearFeatureCache', () => {
    it('should clear cache successfully', async () => {
      mockRedis.deleteTenantCache.mockResolvedValue(true);

      const result = await featureService.clearFeatureCache(testTenantId);

      expect(result).toBe(true);
      expect(mockRedis.deleteTenantCache).toHaveBeenCalledWith(testTenantId, 'features');
    });

    it('should return false for missing tenant ID', async () => {
      const result = await featureService.clearFeatureCache('');

      expect(result).toBe(false);
      expect(mockRedis.deleteTenantCache).not.toHaveBeenCalled();
    });

    it('should handle cache errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockRedis.deleteTenantCache.mockRejectedValue(new Error('Cache error'));

      const result = await featureService.clearFeatureCache(testTenantId);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to clear feature cache:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});