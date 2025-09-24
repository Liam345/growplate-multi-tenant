/**
 * Analytics Abstraction Tests
 * 
 * Comprehensive test suite for the analytics abstraction system.
 * Tests environment-aware behavior, event tracking, and helper functions.
 */

import { 
  analytics, 
  AnalyticsEvents,
  trackFeatureCardClick,
  trackDashboardView,
  trackError 
} from '~/lib/analytics';

// =====================================================================================
// ENVIRONMENT MOCKING
// =====================================================================================

// Store original environment
const originalEnv = process.env;

// Mock console methods
const mockConsoleGroup = jest.fn();
const mockConsoleLog = jest.fn();
const mockConsoleGroupEnd = jest.fn();

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
  
  // Reset console mocks
  mockConsoleGroup.mockClear();
  mockConsoleLog.mockClear();
  mockConsoleGroupEnd.mockClear();
  
  // Mock console methods
  global.console = {
    ...console,
    group: mockConsoleGroup,
    log: mockConsoleLog,
    groupEnd: mockConsoleGroupEnd,
  };
});

afterEach(() => {
  process.env = originalEnv;
});

// =====================================================================================
// ANALYTICS PROVIDER TESTS
// =====================================================================================

describe('Analytics Provider Selection', () => {
  test('uses development provider in development environment', () => {
    process.env.NODE_ENV = 'development';
    
    // Re-import to get fresh instance with new env
    jest.resetModules();
    const { analytics } = require('~/lib/analytics');
    
    analytics.track('test_event', { test: 'data' });
    
    expect(mockConsoleGroup).toHaveBeenCalledWith('📊 Analytics: test_event');
    expect(mockConsoleLog).toHaveBeenCalledWith('Event:', 'test_event');
    expect(mockConsoleLog).toHaveBeenCalledWith('Properties:', { test: 'data' });
    expect(mockConsoleGroupEnd).toHaveBeenCalled();
  });

  test('uses production provider in production environment', () => {
    process.env.NODE_ENV = 'production';
    
    jest.resetModules();
    const { analytics } = require('~/lib/analytics');
    
    // Production provider should not log to console
    analytics.track('test_event', { test: 'data' });
    
    expect(mockConsoleGroup).not.toHaveBeenCalled();
    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  test('uses no-op provider when analytics is disabled', () => {
    process.env.DISABLE_ANALYTICS = 'true';
    process.env.NODE_ENV = 'development';
    
    jest.resetModules();
    const { analytics } = require('~/lib/analytics');
    
    analytics.track('test_event', { test: 'data' });
    
    // Should not log anything
    expect(mockConsoleGroup).not.toHaveBeenCalled();
    expect(mockConsoleLog).not.toHaveBeenCalled();
  });
});

// =====================================================================================
// DEVELOPMENT PROVIDER TESTS
// =====================================================================================

describe('Development Analytics Provider', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    jest.resetModules();
  });

  test('logs events with properties', () => {
    const { analytics } = require('~/lib/analytics');
    const testProperties = { feature: 'orders', tenant_id: 'test-123' };
    
    analytics.track('feature_clicked', testProperties);
    
    expect(mockConsoleGroup).toHaveBeenCalledWith('📊 Analytics: feature_clicked');
    expect(mockConsoleLog).toHaveBeenCalledWith('Event:', 'feature_clicked');
    expect(mockConsoleLog).toHaveBeenCalledWith('Properties:', testProperties);
    expect(mockConsoleLog).toHaveBeenCalledWith('Timestamp:', expect.any(String));
    expect(mockConsoleGroupEnd).toHaveBeenCalled();
  });

  test('logs events without properties', () => {
    const { analytics } = require('~/lib/analytics');
    
    analytics.track('simple_event');
    
    expect(mockConsoleGroup).toHaveBeenCalledWith('📊 Analytics: simple_event');
    expect(mockConsoleLog).toHaveBeenCalledWith('Event:', 'simple_event');
    expect(mockConsoleLog).toHaveBeenCalledWith('Timestamp:', expect.any(String));
    expect(mockConsoleGroupEnd).toHaveBeenCalled();
    
    // Should not log properties if none provided
    expect(mockConsoleLog).not.toHaveBeenCalledWith('Properties:', expect.anything());
  });

  test('logs events with empty properties object', () => {
    const { analytics } = require('~/lib/analytics');
    
    analytics.track('empty_props_event', {});
    
    expect(mockConsoleGroup).toHaveBeenCalledWith('📊 Analytics: empty_props_event');
    expect(mockConsoleLog).toHaveBeenCalledWith('Event:', 'empty_props_event');
    expect(mockConsoleLog).toHaveBeenCalledWith('Timestamp:', expect.any(String));
    expect(mockConsoleGroupEnd).toHaveBeenCalled();
    
    // Should not log empty properties object
    expect(mockConsoleLog).not.toHaveBeenCalledWith('Properties:', {});
  });

  test('identify method logs user identification', () => {
    const { analytics } = require('~/lib/analytics');
    const traits = { name: 'Test User', role: 'admin' };
    
    analytics.identify('user-123', traits);
    
    expect(mockConsoleLog).toHaveBeenCalledWith('👤 User Identified: user-123', traits);
  });

  test('page method logs page views', () => {
    const { analytics } = require('~/lib/analytics');
    const properties = { path: '/admin/dashboard' };
    
    analytics.page('Dashboard', properties);
    
    expect(mockConsoleLog).toHaveBeenCalledWith('📄 Page View: Dashboard', properties);
  });
});

// =====================================================================================
// PRODUCTION PROVIDER TESTS
// =====================================================================================

describe('Production Analytics Provider', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();
  });

  test('does not log to console in production', () => {
    const { analytics } = require('~/lib/analytics');
    
    analytics.track('production_event', { data: 'test' });
    analytics.identify('user-123', { name: 'Test' });
    analytics.page('Test Page', { path: '/test' });
    
    expect(mockConsoleGroup).not.toHaveBeenCalled();
    expect(mockConsoleLog).not.toHaveBeenCalled();
    expect(mockConsoleGroupEnd).not.toHaveBeenCalled();
  });

  test('methods are callable without errors', () => {
    const { analytics } = require('~/lib/analytics');
    
    expect(() => {
      analytics.track('test_event');
      analytics.identify('user-123');
      analytics.page('Test Page');
    }).not.toThrow();
  });
});

// =====================================================================================
// NO-OP PROVIDER TESTS
// =====================================================================================

describe('No-Op Analytics Provider', () => {
  beforeEach(() => {
    process.env.DISABLE_ANALYTICS = 'true';
    process.env.NODE_ENV = 'development'; // Even in dev, should be disabled
    jest.resetModules();
  });

  test('does not log when analytics is disabled', () => {
    const { analytics } = require('~/lib/analytics');
    
    analytics.track('disabled_event', { data: 'test' });
    analytics.identify('user-123', { name: 'Test' });
    analytics.page('Test Page', { path: '/test' });
    
    expect(mockConsoleGroup).not.toHaveBeenCalled();
    expect(mockConsoleLog).not.toHaveBeenCalled();
    expect(mockConsoleGroupEnd).not.toHaveBeenCalled();
  });

  test('methods are callable without errors when disabled', () => {
    const { analytics } = require('~/lib/analytics');
    
    expect(() => {
      analytics.track('test_event');
      analytics.identify('user-123');
      analytics.page('Test Page');
    }).not.toThrow();
  });
});

// =====================================================================================
// ANALYTICS EVENTS TESTS
// =====================================================================================

describe('Analytics Events Constants', () => {
  test('exports all required event constants', () => {
    expect(AnalyticsEvents.FEATURE_CARD_CLICKED).toBe('feature_card_clicked');
    expect(AnalyticsEvents.DASHBOARD_VIEWED).toBe('dashboard_viewed');
    expect(AnalyticsEvents.ADMIN_MENU_ACCESSED).toBe('admin_menu_accessed');
    expect(AnalyticsEvents.ORDER_MANAGEMENT_ACCESSED).toBe('order_management_accessed');
    expect(AnalyticsEvents.MENU_MANAGEMENT_ACCESSED).toBe('menu_management_accessed');
    expect(AnalyticsEvents.LOYALTY_SYSTEM_ACCESSED).toBe('loyalty_system_accessed');
    expect(AnalyticsEvents.FEATURE_ENABLED).toBe('feature_enabled');
    expect(AnalyticsEvents.FEATURE_DISABLED).toBe('feature_disabled');
    expect(AnalyticsEvents.ERROR_OCCURRED).toBe('error_occurred');
    expect(AnalyticsEvents.COMPONENT_LOAD_TIME).toBe('component_load_time');
  });

  test('event constants are strings', () => {
    Object.values(AnalyticsEvents).forEach(event => {
      expect(typeof event).toBe('string');
      expect(event.length).toBeGreaterThan(0);
    });
  });
});

// =====================================================================================
// HELPER FUNCTION TESTS
// =====================================================================================

describe('Analytics Helper Functions', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    jest.resetModules();
  });

  describe('trackFeatureCardClick', () => {
    test('tracks feature card click with tenant ID', () => {
      const { trackFeatureCardClick } = require('~/lib/analytics');
      
      trackFeatureCardClick('orders', 'tenant-123');
      
      expect(mockConsoleGroup).toHaveBeenCalledWith('📊 Analytics: feature_card_clicked');
      expect(mockConsoleLog).toHaveBeenCalledWith('Properties:', {
        feature_name: 'orders',
        tenant_id: 'tenant-123',
        source: 'admin_dashboard',
      });
    });

    test('tracks feature card click without tenant ID', () => {
      const { trackFeatureCardClick } = require('~/lib/analytics');
      
      trackFeatureCardClick('menu');
      
      expect(mockConsoleGroup).toHaveBeenCalledWith('📊 Analytics: feature_card_clicked');
      expect(mockConsoleLog).toHaveBeenCalledWith('Properties:', {
        feature_name: 'menu',
        tenant_id: undefined,
        source: 'admin_dashboard',
      });
    });

    test('tracks different feature types', () => {
      const { trackFeatureCardClick } = require('~/lib/analytics');
      
      const features = ['orders', 'menu', 'loyalty'];
      
      features.forEach(feature => {
        trackFeatureCardClick(feature, 'tenant-123');
        
        expect(mockConsoleLog).toHaveBeenCalledWith('Properties:', 
          expect.objectContaining({
            feature_name: feature,
            tenant_id: 'tenant-123',
            source: 'admin_dashboard',
          })
        );
      });
    });
  });

  describe('trackDashboardView', () => {
    test('tracks dashboard view with all parameters', () => {
      const { trackDashboardView } = require('~/lib/analytics');
      
      trackDashboardView('tenant-123', ['orders', 'menu']);
      
      expect(mockConsoleGroup).toHaveBeenCalledWith('📊 Analytics: dashboard_viewed');
      expect(mockConsoleLog).toHaveBeenCalledWith('Properties:', {
        tenant_id: 'tenant-123',
        features_enabled: ['orders', 'menu'],
        view_timestamp: expect.any(String),
      });
    });

    test('tracks dashboard view without tenant ID', () => {
      const { trackDashboardView } = require('~/lib/analytics');
      
      trackDashboardView(undefined, ['loyalty']);
      
      expect(mockConsoleLog).toHaveBeenCalledWith('Properties:', {
        tenant_id: undefined,
        features_enabled: ['loyalty'],
        view_timestamp: expect.any(String),
      });
    });

    test('tracks dashboard view with empty features', () => {
      const { trackDashboardView } = require('~/lib/analytics');
      
      trackDashboardView('tenant-123', []);
      
      expect(mockConsoleLog).toHaveBeenCalledWith('Properties:', {
        tenant_id: 'tenant-123',
        features_enabled: [],
        view_timestamp: expect.any(String),
      });
    });

    test('includes valid ISO timestamp', () => {
      const { trackDashboardView } = require('~/lib/analytics');
      
      trackDashboardView('tenant-123', ['orders']);
      
      const call = mockConsoleLog.mock.calls.find(call => 
        call[0] === 'Properties:' && call[1].view_timestamp
      );
      
      expect(call).toBeTruthy();
      const timestamp = call[1].view_timestamp;
      expect(() => new Date(timestamp)).not.toThrow();
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });

  describe('trackError', () => {
    test('tracks error with full context', () => {
      const { trackError } = require('~/lib/analytics');
      
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';
      const context = { component: 'Dashboard', action: 'load' };
      
      trackError(error, context);
      
      expect(mockConsoleGroup).toHaveBeenCalledWith('📊 Analytics: error_occurred');
      expect(mockConsoleLog).toHaveBeenCalledWith('Properties:', {
        error_message: 'Test error',
        error_stack: 'Error: Test error\n    at test.js:1:1',
        error_name: 'Error',
        component: 'Dashboard',
        action: 'load',
      });
    });

    test('tracks error without context', () => {
      const { trackError } = require('~/lib/analytics');
      
      const error = new Error('Simple error');
      
      trackError(error);
      
      expect(mockConsoleLog).toHaveBeenCalledWith('Properties:', {
        error_message: 'Simple error',
        error_stack: expect.any(String),
        error_name: 'Error',
      });
    });

    test('handles error without stack trace', () => {
      const { trackError } = require('~/lib/analytics');
      
      const error = new Error('No stack error');
      delete error.stack;
      
      expect(() => trackError(error)).not.toThrow();
      
      expect(mockConsoleLog).toHaveBeenCalledWith('Properties:', {
        error_message: 'No stack error',
        error_stack: undefined,
        error_name: 'Error',
      });
    });

    test('tracks different error types', () => {
      const { trackError } = require('~/lib/analytics');
      
      const typeError = new TypeError('Type error');
      const rangeError = new RangeError('Range error');
      
      trackError(typeError);
      trackError(rangeError);
      
      expect(mockConsoleLog).toHaveBeenCalledWith('Properties:', 
        expect.objectContaining({
          error_name: 'TypeError',
          error_message: 'Type error',
        })
      );
      
      expect(mockConsoleLog).toHaveBeenCalledWith('Properties:', 
        expect.objectContaining({
          error_name: 'RangeError',
          error_message: 'Range error',
        })
      );
    });
  });
});

// =====================================================================================
// INTEGRATION TESTS
// =====================================================================================

describe('Analytics Integration', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    jest.resetModules();
  });

  test('all helper functions use the same analytics instance', () => {
    const { trackFeatureCardClick, trackDashboardView, trackError } = require('~/lib/analytics');
    
    trackFeatureCardClick('orders', 'tenant-123');
    trackDashboardView('tenant-123', ['orders']);
    trackError(new Error('Test'));
    
    // All should log through the same development provider
    expect(mockConsoleGroup).toHaveBeenCalledTimes(3);
    expect(mockConsoleGroupEnd).toHaveBeenCalledTimes(3);
  });

  test('analytics works consistently across multiple calls', () => {
    const { analytics } = require('~/lib/analytics');
    
    for (let i = 0; i < 5; i++) {
      analytics.track(`test_event_${i}`, { iteration: i });
    }
    
    expect(mockConsoleGroup).toHaveBeenCalledTimes(5);
    expect(mockConsoleGroupEnd).toHaveBeenCalledTimes(5);
    
    // Check that each call had unique properties
    for (let i = 0; i < 5; i++) {
      expect(mockConsoleLog).toHaveBeenCalledWith('Properties:', { iteration: i });
    }
  });
});

// =====================================================================================
// REGRESSION TESTS
// =====================================================================================

describe('Analytics Regression Tests', () => {
  test('console.log replacement does not break functionality', () => {
    process.env.NODE_ENV = 'development';
    jest.resetModules();
    
    const { trackDashboardView } = require('~/lib/analytics');
    
    // Should not throw and should log properly
    expect(() => {
      trackDashboardView('tenant-123', ['orders', 'menu']);
    }).not.toThrow();
    
    expect(mockConsoleGroup).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalled();
    expect(mockConsoleGroupEnd).toHaveBeenCalled();
  });

  test('environment switching works correctly', () => {
    // Test development
    process.env.NODE_ENV = 'development';
    jest.resetModules();
    let { analytics } = require('~/lib/analytics');
    
    analytics.track('dev_test');
    expect(mockConsoleGroup).toHaveBeenCalled();
    
    // Reset mocks
    mockConsoleGroup.mockClear();
    
    // Test production
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    ({ analytics } = require('~/lib/analytics'));
    
    analytics.track('prod_test');
    expect(mockConsoleGroup).not.toHaveBeenCalled();
  });

  test('helper functions maintain backward compatibility', () => {
    process.env.NODE_ENV = 'development';
    jest.resetModules();
    
    const { trackFeatureCardClick, trackDashboardView } = require('~/lib/analytics');
    
    // Original API should still work
    expect(() => {
      trackFeatureCardClick('orders', 'tenant-123');
      trackDashboardView('tenant-123', ['orders', 'menu']);
    }).not.toThrow();
    
    // Should use correct event names
    expect(mockConsoleGroup).toHaveBeenCalledWith('📊 Analytics: feature_card_clicked');
    expect(mockConsoleGroup).toHaveBeenCalledWith('📊 Analytics: dashboard_viewed');
  });
});