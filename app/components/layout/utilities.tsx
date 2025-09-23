/**
 * Layout Utility Components
 * 
 * Utility components for accessibility and responsive design
 */

import React from 'react';

// =====================================================================================
// ACCESSIBILITY UTILITIES
// =====================================================================================

/**
 * Skip to main content link for accessibility
 */
export function SkipToMain() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}

/**
 * Screen reader only text component
 */
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

// =====================================================================================
// RESPONSIVE UTILITIES
// =====================================================================================

/**
 * Breakpoint utilities matching TailwindCSS configuration
 */
export const Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Check if current screen matches breakpoint
 * Reactive hook that listens to window resize events
 */
export function useBreakpoint(breakpoint: keyof typeof Breakpoints): boolean {
  const [matches, setMatches] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= Breakpoints[breakpoint];
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setMatches(window.innerWidth >= Breakpoints[breakpoint]);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return matches;
}