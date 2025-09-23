/**
 * Layout Components Index
 * 
 * Centralized exports for all layout components and utilities
 */

// =====================================================================================
// MAIN LAYOUT COMPONENTS
// =====================================================================================

export { Header } from './Header';
export type { HeaderProps } from './Header';

export { Sidebar } from './Sidebar';
export type { SidebarProps } from './Sidebar';

export { Footer } from './Footer';
export type { FooterProps } from './Footer';

export { AdminLayout, AdminPage, AdminCard, AdminStatsGrid, AdminStatCard, useAdminPage } from './AdminLayout';
export type { AdminLayoutProps } from './AdminLayout';

export { 
  CustomerLayout, 
  CustomerPage, 
  CustomerHero, 
  CustomerSection, 
  CustomerCard,
  useCustomerPage 
} from './CustomerLayout';
export type { CustomerLayoutProps, CustomerPageProps } from './CustomerLayout';

// =====================================================================================
// HOOKS AND UTILITIES
// =====================================================================================

export { 
  FeatureProvider, 
  useFeatures, 
  hasAnyFeatures, 
  getEnabledFeatures, 
  filterNavigationItems 
} from '~/hooks/useFeatures';
export type { NavigationItem } from '~/hooks/useFeatures';

export { useSidebar } from '~/hooks/useSidebar';
export type { SidebarState } from '~/hooks/useSidebar';

// Shadcn/ui components
export { Button, buttonVariants } from '~/components/ui/button';
export type { ButtonProps } from '~/components/ui/button';
export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '~/components/ui/card';
export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from '~/components/ui/sheet';

// =====================================================================================
// LAYOUT PRESETS
// =====================================================================================

/**
 * Common layout configurations for quick setup
 */
export const LayoutPresets = {
  /** Standard admin dashboard layout */
  admin: {
    showSidebar: true,
    showFooter: true,
    background: 'neutral' as const,
  },
  
  /** Minimal admin layout for focused tasks */
  adminMinimal: {
    showSidebar: true,
    showFooter: false,
    background: 'white' as const,
  },
  
  /** Standard customer layout */
  customer: {
    showHeader: true,
    showFooter: true,
    background: 'white' as const,
    fullWidth: false,
  },
  
  /** Full-width customer layout for landing pages */
  customerLanding: {
    showHeader: true,
    showFooter: true,
    background: 'white' as const,
    fullWidth: true,
  },
  
  /** Minimal customer layout for focused experiences */
  customerMinimal: {
    showHeader: true,
    showFooter: false,
    background: 'neutral' as const,
    fullWidth: false,
  },
} as const;

// =====================================================================================
// LAYOUT UTILITIES
// =====================================================================================

/**
 * Utility function to determine layout type based on pathname
 */
export function getLayoutType(pathname: string): 'admin' | 'customer' {
  return pathname.startsWith('/admin') ? 'admin' : 'customer';
}

/**
 * Utility function to get appropriate layout preset
 */
export function getLayoutPreset(pathname: string, variant?: string) {
  const type = getLayoutType(pathname);
  
  if (type === 'admin') {
    return variant === 'minimal' ? LayoutPresets.adminMinimal : LayoutPresets.admin;
  }
  
  if (variant === 'landing') return LayoutPresets.customerLanding;
  if (variant === 'minimal') return LayoutPresets.customerMinimal;
  
  return LayoutPresets.customer;
}

// =====================================================================================
// UTILITY COMPONENTS AND FUNCTIONS
// =====================================================================================

export { SkipToMain, ScreenReaderOnly, Breakpoints, useBreakpoint } from './utilities';