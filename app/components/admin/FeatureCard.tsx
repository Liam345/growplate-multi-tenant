/**
 * FeatureCard Component
 * 
 * Reusable card component for displaying admin dashboard features.
 * Supports conditional rendering, navigation, and accessibility.
 */

import React from 'react';
import { Link } from '@remix-run/react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';

// =====================================================================================
// TYPES AND INTERFACES
// =====================================================================================

export interface FeatureCardProps {
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Card title */
  title: string;
  /** Card description */
  description: string;
  /** Navigation href */
  href: string;
  /** Whether the feature is enabled */
  enabled?: boolean;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Click handler (optional, for analytics/tracking) */
  onClick?: () => void;
}

// =====================================================================================
// FEATURE CARD COMPONENT
// =====================================================================================

/**
 * FeatureCard - Reusable admin feature card component
 * 
 * Features:
 * - Clean design using shadcn/ui Card component
 * - Hover effects and transitions
 * - Accessibility support with ARIA labels
 * - Conditional rendering based on enabled state
 * - Navigation using Remix Link component
 * - TypeScript type safety
 * 
 * @param props - FeatureCard component props
 * @returns JSX.Element
 */
export function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
  enabled = true,
  disabled = false,
  className,
  onClick,
}: FeatureCardProps) {
  // Don't render if not enabled
  if (!enabled) {
    return null;
  }

  const isDisabled = disabled;

  const cardContent = (
    <Card
      className={clsx(
        'transition-all duration-200 border border-neutral-200',
        !isDisabled && 'hover:border-primary-300 hover:shadow-md cursor-pointer',
        isDisabled && 'opacity-50 cursor-not-allowed',
        'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div
            className={clsx(
              'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
              !isDisabled
                ? 'bg-primary-100 text-primary-600'
                : 'bg-neutral-100 text-neutral-400'
            )}
          >
            <Icon className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg font-semibold text-neutral-900">
              {title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm text-neutral-600 leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );

  // If disabled, render without link
  if (isDisabled) {
    return (
      <div
        className="block"
        aria-label={`${title} - Feature disabled`}
        role="button"
        tabIndex={-1}
      >
        {cardContent}
      </div>
    );
  }

  // Render with Link component
  return (
    <Link
      to={href}
      className="block focus:outline-none"
      onClick={onClick}
      aria-label={`Navigate to ${title}`}
    >
      {cardContent}
    </Link>
  );
}

// =====================================================================================
// FEATURE CARD GRID COMPONENT
// =====================================================================================

export interface FeatureCardGridProps {
  /** Child FeatureCard components */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FeatureCardGrid - Responsive grid layout for feature cards
 * 
 * @param props - FeatureCardGrid component props
 * @returns JSX.Element
 */
export function FeatureCardGrid({ children, className }: FeatureCardGridProps) {
  return (
    <div
      className={clsx(
        'grid gap-6',
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        'auto-rows-fr', // Equal height cards
        className
      )}
    >
      {children}
    </div>
  );
}

// =====================================================================================
// EMPTY STATE COMPONENT
// =====================================================================================

export interface FeatureCardEmptyStateProps {
  /** Empty state message */
  message?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FeatureCardEmptyState - Empty state when no features are enabled
 * 
 * @param props - FeatureCardEmptyState component props
 * @returns JSX.Element
 */
export function FeatureCardEmptyState({
  message = 'No features are currently enabled for your restaurant.',
  className,
}: FeatureCardEmptyStateProps) {
  return (
    <Card className={clsx('text-center py-12', className)}>
      <CardContent>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          No Features Available
        </h3>
        <p className="text-neutral-600 max-w-sm mx-auto">
          {message}
        </p>
        <p className="text-sm text-neutral-500 mt-4">
          Contact support to enable features for your restaurant.
        </p>
      </CardContent>
    </Card>
  );
}

// =====================================================================================
// EXPORTS
// =====================================================================================

export default FeatureCard;