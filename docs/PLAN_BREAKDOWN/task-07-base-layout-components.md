# PLAN BREAKDOWN - TASK-007: Base Layout Components

## 📋 Task Overview
**Task**: TASK-007 - Base Layout Components  
**Complexity**: Low  
**Estimated Time**: 45 minutes  
**Dependencies**: TASK-001 (Initialize Remix Project Structure)  
**Phase**: 1 - Foundation & Tenant Management

## 🎯 Task Description
Create reusable layout components for admin dashboard and customer interface that provide consistent structure and responsive design across the GrowPlate multi-tenant application.

## 🏗️ Implementation Plan

### Step 1: Header Component (15 minutes)
**Purpose**: Navigation and branding component for all pages

**Implementation Details**:
- Create responsive header with navigation
- Support tenant branding customization
- Include user authentication status
- Mobile-responsive navigation menu
- Accessible navigation structure

**Files to Create**:
- `app/components/layout/Header.tsx`

**Key Features**:
- Tenant name/logo display
- Navigation menu (responsive)
- User profile/logout button
- Mobile hamburger menu
- ARIA accessibility labels

### Step 2: Sidebar Component (10 minutes)
**Purpose**: Admin dashboard navigation sidebar

**Implementation Details**:
- Collapsible sidebar for admin interface
- Feature-based navigation items
- Role-based menu visibility
- Clean, professional design
- Mobile-responsive behavior

**Files to Create**:
- `app/components/layout/Sidebar.tsx`

**Key Features**:
- Expandable/collapsible design
- Icon-based navigation items
- Feature flag conditional rendering
- Role-based access control
- Mobile overlay behavior

### Step 3: Footer Component (5 minutes)
**Purpose**: Consistent footer across all pages

**Implementation Details**:
- Simple, clean footer design
- Copyright and tenant information
- Contact links if needed
- Responsive layout

**Files to Create**:
- `app/components/layout/Footer.tsx`

**Key Features**:
- Tenant customizable content
- Responsive design
- Clean typography
- Optional contact information

### Step 4: Layout Wrapper Components (15 minutes)
**Purpose**: Complete layout containers for different user types

**Implementation Details**:
- AdminLayout for restaurant dashboard
- CustomerLayout for public-facing pages
- Proper component composition
- Consistent spacing and styling
- SEO-friendly structure

**Files to Create**:
- `app/components/layout/AdminLayout.tsx`
- `app/components/layout/CustomerLayout.tsx`

**Key Features**:
- Header/sidebar/footer composition
- Main content area management
- Responsive grid system
- Consistent padding/margins
- HTML semantic structure

## 🔧 Technical Requirements

### Component Architecture
```typescript
interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  tenant?: TenantContext;
}

interface HeaderProps {
  tenant?: TenantContext;
  user?: User;
  onMenuToggle?: () => void;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  features: string[];
  userRole: 'owner' | 'staff' | 'customer';
}
```

### Design System Integration
- **Styling**: TailwindCSS with design tokens
- **Typography**: Consistent font hierarchy
- **Colors**: Brand-aware color system
- **Spacing**: Standardized padding/margins
- **Breakpoints**: Mobile-first responsive design

### Accessibility Requirements
- **ARIA Labels**: Proper semantic markup
- **Keyboard Navigation**: Tab-friendly navigation
- **Screen Reader Support**: Descriptive labels
- **Focus Management**: Clear focus indicators
- **Color Contrast**: WCAG 2.1 AA compliance

## 🎨 Design Specifications

### Layout Structure
```
AdminLayout:
┌─────────────────────────────────┐
│            Header               │
├─────────┬───────────────────────┤
│         │                       │
│ Sidebar │    Main Content       │
│         │                       │
├─────────┼───────────────────────┤
│            Footer               │
└─────────────────────────────────┘

CustomerLayout:
┌─────────────────────────────────┐
│            Header               │
├─────────────────────────────────┤
│                                 │
│        Main Content             │
│                                 │
├─────────────────────────────────┤
│            Footer               │
└─────────────────────────────────┘
```

### Responsive Behavior
- **Desktop**: Full sidebar visible, expanded header
- **Tablet**: Collapsible sidebar, compact header
- **Mobile**: Overlay sidebar, hamburger menu

### Color Scheme
- **Primary**: Tenant-configurable brand colors
- **Background**: Clean whites/light grays
- **Text**: High contrast dark text
- **Accent**: Subtle highlighting colors

## 📱 Responsive Design Strategy

### Breakpoints
- **Mobile**: < 768px (sm)
- **Tablet**: 768px - 1024px (md)
- **Desktop**: > 1024px (lg)

### Mobile-First Approach
1. Design for mobile first
2. Progressive enhancement for larger screens
3. Touch-friendly interactive elements
4. Optimized content hierarchy

### Component Responsive Features
- **Header**: Hamburger menu on mobile, full nav on desktop
- **Sidebar**: Overlay on mobile, permanent on desktop
- **Footer**: Stacked content on mobile, horizontal on desktop

## 🔄 Component Integration

### Tenant Context Integration
```typescript
// Each layout component should accept tenant context
const { tenant } = useTenant(); // From TASK-004

// Use tenant data for:
// - Brand colors/styling
// - Logo/name display
// - Feature availability
// - Contact information
```

### User Context Integration
```typescript
// Components should be aware of user authentication
const { user, isAuthenticated } = useAuth(); // From TASK-006

// Use user data for:
// - Profile display
// - Role-based navigation
// - Logout functionality
// - Permission checks
```

### Feature Flag Integration
```typescript
// Layout should conditionally show navigation based on features
const { hasOrders, hasLoyalty, hasMenu } = useFeatures(); // From TASK-005

// Show navigation items only for enabled features
```

## 🧪 Testing Strategy

### Component Testing
- **Unit Tests**: Individual component rendering
- **Integration Tests**: Layout composition testing
- **Accessibility Tests**: ARIA compliance verification
- **Responsive Tests**: Breakpoint behavior testing

### Test Scenarios
1. **Header Component**:
   - Renders with tenant branding
   - Shows/hides navigation based on screen size
   - Handles user authentication states

2. **Sidebar Component**:
   - Toggles open/closed state
   - Shows features based on feature flags
   - Responds to role permissions

3. **Layout Components**:
   - Composes header/sidebar/footer correctly
   - Handles responsive behavior
   - Maintains consistent structure

### Testing Tools
- **React Testing Library**: Component testing
- **Jest**: Unit test framework
- **axe-core**: Accessibility testing
- **Storybook**: Component documentation (future)

## 📚 Documentation Requirements

### Component Documentation
- **JSDoc Comments**: All public props and methods
- **Usage Examples**: How to implement layouts
- **Props Interface**: TypeScript interface documentation
- **Responsive Behavior**: Breakpoint documentation

### Integration Guide
- **Layout Selection**: When to use AdminLayout vs CustomerLayout
- **Tenant Customization**: How to apply tenant-specific styling
- **Feature Integration**: How components interact with feature flags
- **Accessibility Notes**: WCAG compliance implementation

## 🔗 Dependencies & Integration Points

### Input Dependencies
- **TASK-001**: Remix project structure and TailwindCSS setup
- **Tenant Context**: From tenant resolution middleware (TASK-004)
- **User Context**: From authentication system (TASK-006)
- **Feature Flags**: From feature flag system (TASK-005)

### Output Integration
- **TASK-008**: Basic Admin Dashboard will use AdminLayout
- **Future Tasks**: All admin pages will use layout components
- **Public Pages**: Customer-facing pages will use CustomerLayout
- **Theme System**: Layout provides foundation for tenant theming

### Interface Contracts
```typescript
// Expected exports for consuming components
export { Header, Sidebar, Footer, AdminLayout, CustomerLayout };
export type { LayoutProps, HeaderProps, SidebarProps };

// Expected context consumption
import { useTenant } from '~/lib/tenant';
import { useAuth } from '~/lib/auth';
import { useFeatures } from '~/hooks/useFeatures';
```

## 🎯 Success Criteria

### Functional Success
1. **Complete Layout System**: All layout components work together
2. **Responsive Design**: Layouts work on all device sizes
3. **Accessibility Compliance**: WCAG 2.1 AA standards met
4. **Integration Ready**: Prepared for admin dashboard implementation

### Technical Success
1. **TypeScript Compliance**: All components properly typed
2. **Performance**: Fast rendering, no layout shifts
3. **Reusability**: Components can be used across different pages
4. **Maintainability**: Clean, well-documented code structure

### Quality Gates
- [ ] All components render without errors
- [ ] Responsive behavior verified on all breakpoints
- [ ] Accessibility tests pass
- [ ] TypeScript compilation successful
- [ ] ESLint and Prettier compliance
- [ ] Component integration tests pass

## 🚀 Deliverables

### Primary Deliverables
1. **Header Component** (`app/components/layout/Header.tsx`)
2. **Sidebar Component** (`app/components/layout/Sidebar.tsx`)
3. **Footer Component** (`app/components/layout/Footer.tsx`)
4. **AdminLayout Component** (`app/components/layout/AdminLayout.tsx`)
5. **CustomerLayout Component** (`app/components/layout/CustomerLayout.tsx`)

### Supporting Deliverables
1. **TypeScript Interfaces**: Component prop definitions
2. **Component Tests**: Unit tests for all components
3. **Integration Examples**: Usage documentation
4. **Responsive Test Cases**: Breakpoint verification

### Future Enablement
- **Theme Foundation**: Ready for tenant-specific styling
- **Navigation Framework**: Prepared for feature-based menus
- **Page Templates**: Foundation for all future page layouts
- **Component Library**: Building blocks for UI consistency

---

**Next Task**: TASK-008 (Basic Admin Dashboard) will build upon these layout components to create the admin dashboard interface.