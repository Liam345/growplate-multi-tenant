/**
 * Analytics Abstraction
 * 
 * Environment-aware analytics tracking system that provides structured
 * event tracking with development logging and production analytics integration.
 */

// =====================================================================================
// TYPES AND INTERFACES
// =====================================================================================

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

export interface AnalyticsProvider {
  track: (event: string, properties?: Record<string, any>) => void;
  identify?: (userId: string, traits?: Record<string, any>) => void;
  page?: (name: string, properties?: Record<string, any>) => void;
}

// =====================================================================================
// ANALYTICS IMPLEMENTATION
// =====================================================================================

/**
 * Development Analytics Provider
 * Logs events to console in development environment
 */
class DevelopmentAnalyticsProvider implements AnalyticsProvider {
  track(event: string, properties?: Record<string, any>): void {
    console.group(`📊 Analytics: ${event}`);
    console.log('Event:', event);
    if (properties && Object.keys(properties).length > 0) {
      console.log('Properties:', properties);
    }
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }

  identify(userId: string, traits?: Record<string, any>): void {
    console.log(`👤 User Identified: ${userId}`, traits);
  }

  page(name: string, properties?: Record<string, any>): void {
    console.log(`📄 Page View: ${name}`, properties);
  }
}

/**
 * Production Analytics Provider
 * Integrates with real analytics services (Google Analytics, Mixpanel, etc.)
 */
class ProductionAnalyticsProvider implements AnalyticsProvider {
  track(event: string, properties?: Record<string, any>): void {
    // TODO: Integrate with actual analytics service
    // Example integrations:
    
    // Google Analytics 4
    // if (typeof gtag !== 'undefined') {
    //   gtag('event', event, properties);
    // }
    
    // Mixpanel
    // if (typeof mixpanel !== 'undefined') {
    //   mixpanel.track(event, properties);
    // }
    
    // PostHog
    // if (typeof posthog !== 'undefined') {
    //   posthog.capture(event, properties);
    // }
    
    // For now, silently ignore in production until analytics service is configured
  }

  identify(userId: string, traits?: Record<string, any>): void {
    // TODO: Implement user identification for production analytics
  }

  page(name: string, properties?: Record<string, any>): void {
    // TODO: Implement page view tracking for production analytics
  }
}

/**
 * No-op Analytics Provider
 * Used when analytics should be disabled entirely
 */
class NoOpAnalyticsProvider implements AnalyticsProvider {
  track(): void {
    // Intentionally empty
  }

  identify(): void {
    // Intentionally empty
  }

  page(): void {
    // Intentionally empty
  }
}

// =====================================================================================
// ANALYTICS FACTORY
// =====================================================================================

/**
 * Create analytics provider based on environment
 */
function createAnalyticsProvider(): AnalyticsProvider {
  // Check if analytics is explicitly disabled
  if (process.env.DISABLE_ANALYTICS === 'true') {
    return new NoOpAnalyticsProvider();
  }

  // Use development provider in development
  if (process.env.NODE_ENV === 'development') {
    return new DevelopmentAnalyticsProvider();
  }

  // Use production provider in production
  return new ProductionAnalyticsProvider();
}

// =====================================================================================
// MAIN ANALYTICS INSTANCE
// =====================================================================================

/**
 * Main analytics instance
 * This is the primary interface for tracking events throughout the application
 */
export const analytics: AnalyticsProvider = createAnalyticsProvider();

// =====================================================================================
// PREDEFINED EVENTS
// =====================================================================================

/**
 * Predefined analytics events for the GrowPlate application
 * This ensures consistent event naming across the application
 */
export const AnalyticsEvents = {
  // Feature Card Events
  FEATURE_CARD_CLICKED: 'feature_card_clicked',
  
  // Dashboard Events
  DASHBOARD_VIEWED: 'dashboard_viewed',
  
  // Navigation Events
  ADMIN_MENU_ACCESSED: 'admin_menu_accessed',
  ORDER_MANAGEMENT_ACCESSED: 'order_management_accessed',
  MENU_MANAGEMENT_ACCESSED: 'menu_management_accessed',
  LOYALTY_SYSTEM_ACCESSED: 'loyalty_system_accessed',
  
  // Feature Usage Events
  FEATURE_ENABLED: 'feature_enabled',
  FEATURE_DISABLED: 'feature_disabled',
  
  // Error Events
  ERROR_OCCURRED: 'error_occurred',
  
  // Performance Events
  COMPONENT_LOAD_TIME: 'component_load_time',
} as const;

// =====================================================================================
// HELPER FUNCTIONS
// =====================================================================================

/**
 * Track feature card click with standardized properties
 */
export function trackFeatureCardClick(
  featureName: string,
  tenantId?: string
): void {
  analytics.track(AnalyticsEvents.FEATURE_CARD_CLICKED, {
    feature_name: featureName,
    tenant_id: tenantId,
    source: 'admin_dashboard',
  });
}

/**
 * Track dashboard view with tenant context
 */
export function trackDashboardView(
  tenantId?: string,
  featuresEnabled?: string[]
): void {
  analytics.track(AnalyticsEvents.DASHBOARD_VIEWED, {
    tenant_id: tenantId,
    features_enabled: featuresEnabled,
    view_timestamp: new Date().toISOString(),
  });
}

/**
 * Track error occurrence with context
 */
export function trackError(
  error: Error,
  context?: Record<string, any>
): void {
  analytics.track(AnalyticsEvents.ERROR_OCCURRED, {
    error_message: error.message,
    error_stack: error.stack,
    error_name: error.name,
    ...context,
  });
}

// =====================================================================================
// EXPORTS
// =====================================================================================

export default analytics;