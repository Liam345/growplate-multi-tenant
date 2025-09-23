/**
 * Admin Components Index
 * 
 * Centralized exports for all admin-related components.
 * This allows for clean imports throughout the application.
 */

// =====================================================================================
// DASHBOARD COMPONENTS
// =====================================================================================

export {
  Dashboard,
  hasDashboardFeatures,
  getEnabledFeatureCount,
  type DashboardProps,
  type TenantHeaderProps,
} from './Dashboard';

// =====================================================================================
// FEATURE CARD COMPONENTS
// =====================================================================================

export {
  FeatureCard,
  FeatureCardGrid,
  FeatureCardEmptyState,
  type FeatureCardProps,
  type FeatureCardGridProps,
  type FeatureCardEmptyStateProps,
} from './FeatureCard';

// =====================================================================================
// DEFAULT EXPORT
// =====================================================================================

export { Dashboard as default } from './Dashboard';