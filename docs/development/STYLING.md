# GrowPlate Styling Guide

**Version**: 1.0  
**Last Updated**: January 2025  
**Target Audience**: AI Code Generators, Developers  

## 🎯 **Overview**

This guide establishes consistent styling patterns for the GrowPlate multi-tenant restaurant management platform. All subsequent AI code generators and developers must follow these guidelines to maintain design consistency and code quality.

---

## 📚 **Core Libraries & Tools**

### **Primary Stack**
- **TailwindCSS**: Utility-first CSS framework (primary styling approach)
- **ShadCN/UI**: Component library built on Radix UI primitives
- **Radix UI**: Accessible component primitives
- **CVA (Class Variance Authority)**: For component variant management
- **clsx + tailwind-merge**: For conditional and conflict-free class composition

### **Key Dependencies**
```json
{
  "@radix-ui/react-*": "Latest stable",
  "tailwindcss": "^3.0",
  "class-variance-authority": "^0.7",
  "clsx": "^2.0",
  "tailwind-merge": "^2.0",
  "@tailwindcss/forms": "^0.5",
  "@tailwindcss/typography": "^0.5"
}
```

---

## 🎨 **Design System**

### **Color Palette**

#### **Primary Colors (Orange Theme)**
```css
primary: {
  50: '#fef7ee',   /* Lightest tint - backgrounds */
  100: '#fdedd6',  /* Light backgrounds */
  200: '#fad7ac',  /* Subtle accents */
  300: '#f6ba77',  /* Disabled states */
  400: '#f19340',  /* Secondary actions */
  500: '#ed7525',  /* Main brand color */
  600: '#de5914',  /* Primary buttons, links */
  700: '#b84213',  /* Hover states */
  800: '#933517',  /* Active states */
  900: '#762d15',  /* Text on light */
  950: '#401508',  /* Darkest - high contrast text */
}
```

#### **Secondary Colors (Green Theme)**
```css
secondary: {
  50: '#f0fdf4',   /* Success backgrounds */
  100: '#dcfce7',  /* Light success states */
  200: '#bbf7d0',  /* Subtle success */
  300: '#86efac',  /* Secondary accents */
  400: '#4ade80',  /* Success indicators */
  500: '#22c55e',  /* Secondary brand */
  600: '#16a34a',  /* Secondary buttons */
  700: '#15803d',  /* Success text */
  800: '#166534',  /* Active success */
  900: '#14532d',  /* Dark success */
  950: '#052e16',  /* Darkest success */
}
```

#### **Neutral Colors**
```css
neutral: {
  50: '#fafafa',   /* Page backgrounds */
  100: '#f5f5f5',  /* Card backgrounds */
  200: '#e5e5e5',  /* Borders */
  300: '#d4d4d4',  /* Disabled borders */
  400: '#a3a3a3',  /* Placeholder text */
  500: '#737373',  /* Secondary text */
  600: '#525252',  /* Primary text */
  700: '#404040',  /* Headings */
  800: '#262626',  /* Dark headings */
  900: '#171717',  /* Maximum contrast */
  950: '#0a0a0a',  /* Black */
}
```

### **Typography**

#### **Font Families**
```css
font-sans: ['Inter', 'system-ui', 'sans-serif']     /* Body text */
font-display: ['Lexend', 'system-ui', 'sans-serif'] /* Headings, display */
```

#### **Typography Scale**
```css
/* Headings */
.text-4xl  /* 36px - Page titles */
.text-3xl  /* 30px - Section titles */
.text-2xl  /* 24px - Card titles */
.text-xl   /* 20px - Subheadings */
.text-lg   /* 18px - Large text */

/* Body Text */
.text-base /* 16px - Default body */
.text-sm   /* 14px - Secondary text */
.text-xs   /* 12px - Captions, labels */
```

#### **Font Weights**
```css
.font-normal    /* 400 - Body text */
.font-medium    /* 500 - Emphasized text */
.font-semibold  /* 600 - Subheadings */
.font-bold      /* 700 - Headings */
```

### **Spacing System**

#### **Standard Spacing Scale**
```css
.p-1   /* 4px */   .gap-1   /* 4px */
.p-2   /* 8px */   .gap-2   /* 8px */
.p-3   /* 12px */  .gap-3   /* 12px */
.p-4   /* 16px */  .gap-4   /* 16px */
.p-6   /* 24px */  .gap-6   /* 24px */
.p-8   /* 32px */  .gap-8   /* 32px */
.p-12  /* 48px */  .gap-12  /* 48px */
```

#### **Layout Spacing**
```css
/* Page-level spacing */
.px-4 .sm:px-6 .lg:px-8  /* Horizontal page padding */
.py-6                     /* Vertical section padding */
.py-12                    /* Large vertical spacing */

/* Component spacing */
.space-y-6               /* Vertical component spacing */
.space-x-4               /* Horizontal component spacing */
```

### **Border Radius**
```css
.rounded-none  /* 0px */
.rounded-sm    /* 2px */
.rounded       /* 4px - default */
.rounded-md    /* 6px - cards */
.rounded-lg    /* 8px - buttons, major cards */
.rounded-xl    /* 12px - modal, special cards */
.rounded-full  /* 50% - avatars, icons */
```

---

## 🧩 **Component Patterns**

### **1. ShadCN/UI Components (REQUIRED)**

#### **Use ShadCN Components For:**
- **Buttons**: All button interactions
- **Cards**: Content containers, dashboards
- **Forms**: Inputs, selects, checkboxes
- **Navigation**: Dropdowns, menus
- **Overlays**: Modals, tooltips, popovers
- **Data Display**: Tables, badges, avatars

#### **Available ShadCN Components**
```typescript
// Already installed and configured
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "~/components/ui/sheet"

// Standard import pattern
import { ComponentName } from "~/components/ui/component-name"
```

### **2. Button Patterns**

#### **ShadCN Button Usage (PREFERRED)**
```typescript
import { Button } from "~/components/ui/button"

// Primary actions
<Button variant="default" size="default">
  Primary Action
</Button>

// Secondary actions  
<Button variant="secondary" size="default">
  Secondary Action
</Button>

// Destructive actions
<Button variant="destructive" size="sm">
  Delete
</Button>

// Ghost buttons (subtle)
<Button variant="ghost" size="sm">
  Cancel
</Button>

// Link-style buttons
<Button variant="link" size="sm">
  Learn More
</Button>
```

#### **Legacy CSS Classes (FALLBACK ONLY)**
```css
/* Use only when ShadCN Button doesn't fit needs */
.btn-primary    /* Primary actions */
.btn-secondary  /* Secondary actions */
.btn-outline    /* Outlined buttons */
.btn-ghost      /* Subtle actions */
```

### **3. Card Patterns**

#### **ShadCN Card Usage (REQUIRED)**
```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"

// Standard card structure
<Card className="w-full">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Card content */}
  </CardContent>
</Card>

// Dashboard stats card
<Card className="text-center">
  <CardContent className="pt-6">
    <div className="text-2xl font-bold text-neutral-900 mb-1">
      {value}
    </div>
    <div className="text-sm text-neutral-600">
      {label}
    </div>
  </CardContent>
</Card>
```

#### **Custom Card Extensions**
```typescript
// Feature cards with business logic
<Card className={clsx(
  'transition-all duration-200 border border-neutral-200',
  'hover:border-primary-300 hover:shadow-md cursor-pointer',
  'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2'
)}>
  {/* Use ShadCN CardHeader, CardContent internally */}
</Card>
```

### **4. Layout Patterns**

#### **Page Layout Structure**
```typescript
// Admin pages
<AdminLayout
  title="Page Title"
  tenant={tenant}
  features={features}
>
  <div className="space-y-6">
    {/* Page content */}
  </div>
</AdminLayout>

// Customer pages  
<CustomerLayout
  tenant={tenant}
  features={features}
>
  <div className="space-y-8">
    {/* Page content */}
  </div>
</CustomerLayout>
```

#### **Responsive Grid Patterns**
```css
/* Feature cards grid */
.grid .grid-cols-1 .sm:grid-cols-2 .lg:grid-cols-3 .gap-6

/* Stats grid */
.grid .grid-cols-1 .sm:grid-cols-2 .lg:grid-cols-4 .gap-6

/* Two-column layout */
.grid .grid-cols-1 .lg:grid-cols-2 .gap-8

/* Content sections */
.space-y-6    /* Standard section spacing */
.space-y-8    /* Large section spacing */
```

#### **Container Patterns**
```css
/* Page containers */
.max-w-7xl .mx-auto     /* Standard page width */
.px-4 .sm:px-6 .lg:px-8 /* Responsive padding */

/* Content sections */
.bg-white .rounded-lg .border .border-neutral-200 .p-6 .shadow-sm
```

---

## 🎛️ **Component Composition Utilities**

### **Class Composition Pattern**

#### **Required Utilities**
```typescript
import { clsx } from 'clsx'
import { cn } from '~/lib/utils' // twMerge + clsx combination

// Standard composition
const className = clsx(
  'base-classes',
  condition && 'conditional-classes',
  variant === 'primary' && 'variant-classes',
  userClassName
)

// ShadCN-style composition (PREFERRED)
const className = cn(
  'base-classes',
  variants({ variant, size }),
  userClassName
)
```

#### **Component Variant Authority (CVA)**
```typescript
import { cva, type VariantProps } from 'class-variance-authority'

// Define component variants
const cardVariants = cva(
  // Base classes
  'rounded-lg border border-neutral-200 bg-white shadow-sm',
  {
    variants: {
      variant: {
        default: 'p-6',
        compact: 'p-4',
        large: 'p-8',
      },
      shadow: {
        none: 'shadow-none',
        sm: 'shadow-sm',
        md: 'shadow-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      shadow: 'sm',
    },
  }
)
```

---

## 🏢 **Multi-Tenant Theming**

### **CSS Custom Properties**
```css
/* Tenant-specific themes in globals.css */
[data-tenant="restaurant-a"] {
  --primary: 142 76% 36%;           /* Green theme */
  --primary-foreground: 0 0% 98%;
}

[data-tenant="restaurant-b"] {
  --primary: 221 83% 53%;           /* Blue theme */
  --primary-foreground: 0 0% 98%;
}
```

### **Theme Implementation**
```typescript
// Apply tenant theme via data attribute
<div data-tenant={tenant.id}>
  {/* Theme colors applied via CSS variables */}
  <Button className="bg-primary text-primary-foreground">
    Themed Button
  </Button>
</div>
```

---

## 📱 **Responsive Design**

### **Breakpoint System**
```css
/* Mobile First Approach */
/* Default: 320px+ */
sm:   /* 640px+ - Large phones */
md:   /* 768px+ - Tablets */
lg:   /* 1024px+ - Desktops */
xl:   /* 1280px+ - Large desktops */
2xl:  /* 1536px+ - Extra large */
```

### **Responsive Patterns**
```typescript
// Grid responsiveness
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

// Text responsiveness  
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">

// Spacing responsiveness
<div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

// Show/hide by breakpoint
<div className="block sm:hidden">Mobile only</div>
<div className="hidden sm:block">Desktop and up</div>
```

---

## ♿ **Accessibility Standards**

### **Required Patterns**

#### **Semantic HTML**
```typescript
// Use proper semantic elements
<main role="main" aria-label="Main content">
<nav aria-label="Primary navigation">
<section aria-labelledby="section-title">
<button aria-describedby="help-text">
```

#### **Focus Management**
```css
/* Custom focus styles */
.focus-visible:outline-none
.focus-visible:ring-2
.focus-visible:ring-primary-500
.focus-visible:ring-offset-2

/* ShadCN components include focus styles by default */
```

#### **Color Contrast**
- **Text on white**: Use `neutral-600` or darker
- **Headings**: Use `neutral-900` for maximum contrast
- **Secondary text**: Use `neutral-500` minimum
- **Links**: Use `primary-600` with hover states

#### **Screen Reader Support**
```typescript
// Hidden labels for complex interactions
<span className="sr-only">Screen reader description</span>

// ARIA labels for interactive elements
<button aria-label="Close dialog">
  <X className="w-4 h-4" aria-hidden="true" />
</button>
```

---

## 🔧 **Animation & Transitions**

### **Standard Transitions**
```css
/* Component states */
.transition-colors    /* For hover states */
.transition-all       /* For complex animations */
.duration-200         /* Fast interactions */
.duration-300         /* Standard duration */

/* Custom animations (defined in tailwind.config.js) */
.animate-fade-in      /* Entrance animations */
.animate-slide-up     /* Modal animations */
.animate-slide-down   /* Dropdown animations */
```

### **Hover & Active States**
```css
/* Buttons */
.hover:bg-primary-700
.active:bg-primary-800

/* Cards */
.hover:border-primary-300
.hover:shadow-md

/* Links */
.hover:text-primary-700
.hover:underline
```

---

## ✅ **Do's and Don'ts**

### **✅ DO**

#### **Component Selection**
- **Always use ShadCN/UI components first** before creating custom
- **Extend ShadCN components** with business logic when needed
- **Use CVA for component variants** instead of prop-based conditionals
- **Leverage existing layout components** (AdminLayout, CustomerLayout)

#### **Styling Approach**
- **Use utility classes** for simple styling
- **Compose classes with `cn()` utility** for complex combinations
- **Follow the spacing system** (4px increments)
- **Use semantic color names** (`neutral-600` not `gray-600`)

#### **Accessibility**
- **Include focus styles** on all interactive elements  
- **Use semantic HTML** elements
- **Provide screen reader text** for icon-only buttons
- **Test with keyboard navigation**

#### **Responsive Design**
- **Start mobile-first** with base styles
- **Use standard breakpoints** (`sm:`, `md:`, `lg:`)
- **Test on real devices** not just browser tools

### **❌ DON'T**

#### **Component Anti-Patterns**
- **Don't create custom buttons** when ShadCN Button exists
- **Don't hardcode colors** outside the design system
- **Don't use arbitrary values** (`w-[247px]`) without justification
- **Don't ignore component composition patterns**

#### **Styling Anti-Patterns**
- **Don't use inline styles** except for dynamic values
- **Don't override ShadCN component internals** without good reason
- **Don't mix different spacing scales** 
- **Don't use `!important`** unless absolutely necessary

#### **Accessibility Anti-Patterns**
- **Don't rely only on color** for conveying information
- **Don't remove focus outlines** without providing alternatives
- **Don't use `div` for interactive elements**
- **Don't forget alt text** for meaningful images

---

## 📋 **AI Code Generator Checklist**

### **Before Creating Components**
- [ ] Check if ShadCN/UI component exists for the use case
- [ ] Review existing similar components in the codebase
- [ ] Identify if this is a layout, business logic, or pure UI component
- [ ] Plan component composition strategy

### **During Development**
- [ ] Import and use ShadCN components as base
- [ ] Apply consistent spacing using the scale
- [ ] Use semantic color names from the palette
- [ ] Include responsive design from mobile-first
- [ ] Add accessibility attributes and focus styles
- [ ] Use `cn()` utility for class composition

### **Component Structure**
```typescript
// Required imports
import { cn } from "~/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"

// TypeScript interfaces
interface ComponentProps {
  children: React.ReactNode
  className?: string
  // ... other props
}

// Component with ShadCN base
export function Component({ children, className, ...props }: ComponentProps) {
  return (
    <Card className={cn("default-classes", className)}>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}
```

### **Code Review Checklist**
- [ ] No hardcoded colors outside design system
- [ ] Responsive design implemented correctly
- [ ] Accessibility attributes included
- [ ] ShadCN components used where applicable
- [ ] TypeScript types properly defined
- [ ] Class composition follows `cn()` pattern

---

## 🔄 **Migration and Updates**

### **ShadCN Component Updates**
```bash
# Add new ShadCN components
npx shadcn@latest add [component-name]

# Update existing components
npx shadcn@latest update [component-name]
```

### **Legacy CSS Migration**
When encountering legacy CSS classes (`.btn-primary`, `.card`):
1. **Identify ShadCN equivalent**
2. **Update component to use ShadCN**
3. **Test accessibility and responsiveness**
4. **Remove legacy CSS if no longer used**

---

## 📚 **Resources & References**

### **Documentation**
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [ShadCN/UI Components](https://ui.shadcn.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Class Variance Authority](https://cva.style/docs)

### **Tools**
- [TailwindCSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [Headless UI](https://headlessui.com/) (for complex interactions)
- [Radix Colors](https://www.radix-ui.com/colors) (for extended palettes)

### **Examples in Codebase**
- **Layout Components**: `app/components/layout/AdminLayout.tsx`
- **ShadCN Usage**: `app/components/ui/button.tsx`
- **Custom Components**: `app/components/admin/FeatureCard.tsx`
- **Multi-tenant Theming**: `app/styles/globals.css`

---

**This guide ensures consistent, accessible, and maintainable styling across the GrowPlate platform. All AI code generators must follow these patterns to maintain design system integrity.**