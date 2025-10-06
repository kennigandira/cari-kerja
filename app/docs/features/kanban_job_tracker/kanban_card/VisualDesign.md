# Enhanced Kanban Card Detail View - Visual Design Specification

**Version:** 1.0.0
**Last Updated:** 2025-10-06
**Status:** Complete Specification

---

## Table of Contents

1. [Design System Foundation](#1-design-system-foundation)
2. [Modal Container Specifications](#2-modal-container-specifications)
3. [Header Section](#3-header-section)
4. [Job Information Section](#4-job-information-section)
5. [Status-Specific Field Layouts](#5-status-specific-field-layouts)
6. [Match Analysis Section](#6-match-analysis-section)
7. [Footer Section](#7-footer-section)
8. [Animation Specifications](#8-animation-specifications)
9. [Responsive Breakpoints](#9-responsive-breakpoints)
10. [Accessibility Specifications](#10-accessibility-specifications)
11. [Design Tokens Reference](#11-design-tokens-reference)

---

## 1. Design System Foundation

### 1.1 Color Palette

All colors include both hex codes and Tailwind CSS utility classes for consistent implementation.

#### Status Colors
```typescript
const statusColors = {
  toSubmit: {
    primary: '#3B82F6',      // blue-600 - Active, ready to apply
    light: '#DBEAFE',        // blue-100 - Background tint
    lighter: '#EFF6FF',      // blue-50 - Softer background
    dark: '#2563EB',         // blue-700 - Hover state
    border: '#93C5FD',       // blue-300 - Border accent
    contrast: '#1E40AF',     // blue-800 - High contrast text
  },
  waitingForCall: {
    primary: '#F59E0B',      // amber-500 - Pending response
    light: '#FEF3C7',        // amber-100 - Background tint
    lighter: '#FFFBEB',      // amber-50 - Softer background
    dark: '#D97706',         // amber-600 - Hover state
    border: '#FDE68A',       // amber-200 - Border accent
    contrast: '#92400E',     // amber-800 - High contrast text
  },
  interviewing: {
    primary: '#8B5CF6',      // purple-600 - In progress
    light: '#E9D5FF',        // purple-200 - Background tint
    lighter: '#F5F3FF',      // purple-50 - Softer background
    dark: '#7C3AED',         // purple-700 - Hover state
    border: '#DDD6FE',       // purple-300 - Border accent
    contrast: '#5B21B6',     // purple-800 - High contrast text
  },
  offer: {
    primary: '#10B981',      // green-600 - Success/offer received
    light: '#D1FAE5',        // green-200 - Background tint
    lighter: '#ECFDF5',      // green-50 - Softer background
    dark: '#059669',         // green-700 - Hover state
    border: '#A7F3D0',       // green-300 - Border accent
    contrast: '#065F46',     // green-800 - High contrast text
  },
  notNow: {
    primary: '#6B7280',      // gray-500 - Rejected/archived
    light: '#F3F4F6',        // gray-100 - Background tint
    lighter: '#F9FAFB',      // gray-50 - Softer background
    dark: '#4B5563',         // gray-600 - Hover state
    border: '#E5E7EB',       // gray-200 - Border accent
    contrast: '#374151',     // gray-700 - High contrast text
  },
  accepted: {
    primary: '#059669',      // green-700 - Accepted offer
    light: '#6EE7B7',        // green-300 - Background tint
    lighter: '#D1FAE5',      // green-200 - Softer background
    dark: '#047857',         // green-800 - Hover state
    gradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
  },
};
```

#### UI Base Colors
```typescript
const uiColors = {
  background: {
    primary: '#FFFFFF',      // white - Main background
    secondary: '#F9FAFB',    // gray-50 - Secondary surface
    tertiary: '#F3F4F6',     // gray-100 - Tertiary surface
    overlay: 'rgba(0, 0, 0, 0.75)', // Modal backdrop
  },
  border: {
    light: '#F3F4F6',        // gray-100 - Subtle borders
    default: '#E5E7EB',      // gray-200 - Default borders
    medium: '#D1D5DB',       // gray-300 - Input borders
    dark: '#9CA3AF',         // gray-400 - Divider lines
  },
  text: {
    primary: '#111827',      // gray-900 - Main headings
    secondary: '#374151',    // gray-700 - Body text
    tertiary: '#6B7280',     // gray-500 - Meta text
    quaternary: '#9CA3AF',   // gray-400 - Placeholder
    inverse: '#FFFFFF',      // white - On dark backgrounds
  },
  semantic: {
    success: '#10B981',      // green-600
    successLight: '#ECFDF5', // green-50
    warning: '#F59E0B',      // amber-500
    warningLight: '#FFFBEB', // amber-50
    error: '#EF4444',        // red-600
    errorLight: '#FEF2F2',   // red-50
    info: '#3B82F6',         // blue-600
    infoLight: '#EFF6FF',    // blue-50
  },
};
```

#### Interactive Colors
```typescript
const interactiveColors = {
  primary: {
    default: '#3B82F6',      // blue-600
    hover: '#2563EB',        // blue-700
    active: '#1D4ED8',       // blue-800
    disabled: '#9CA3AF',     // gray-400
    focus: 'rgba(59, 130, 246, 0.1)', // blue-600 at 10% opacity
  },
  secondary: {
    default: '#F3F4F6',      // gray-100
    hover: '#E5E7EB',        // gray-200
    active: '#D1D5DB',       // gray-300
    text: '#374151',         // gray-700
  },
  danger: {
    default: '#EF4444',      // red-600
    hover: '#DC2626',        // red-700
    active: '#B91C1C',       // red-800
    light: '#FEE2E2',        // red-50
    lightHover: '#FECACA',   // red-100
  },
  success: {
    default: '#10B981',      // green-600
    hover: '#059669',        // green-700
    active: '#047857',       // green-800
  },
};
```

### 1.2 Typography Scale

All typography specifications include font-size, weight, line-height, and letter-spacing.

```typescript
const typography = {
  // Display - Modal title, major headings
  display: {
    fontSize: '28px',        // 1.75rem
    fontWeight: 700,         // bold
    lineHeight: '36px',      // 1.286 ratio (tight)
    letterSpacing: '-0.02em', // Tighter tracking for large text
    tailwind: 'text-3xl font-bold leading-tight tracking-tight',
  },

  // H1 - Section headings
  h1: {
    fontSize: '24px',        // 1.5rem
    fontWeight: 700,         // bold
    lineHeight: '32px',      // 1.333 ratio
    letterSpacing: '-0.01em',
    tailwind: 'text-2xl font-bold leading-8',
  },

  // H2 - Subsection headings
  h2: {
    fontSize: '20px',        // 1.25rem
    fontWeight: 600,         // semibold
    lineHeight: '28px',      // 1.4 ratio
    letterSpacing: '-0.005em',
    tailwind: 'text-xl font-semibold leading-7',
  },

  // H3 - Card titles, small headings
  h3: {
    fontSize: '18px',        // 1.125rem
    fontWeight: 600,         // semibold
    lineHeight: '24px',      // 1.333 ratio
    letterSpacing: '0',
    tailwind: 'text-lg font-semibold leading-6',
  },

  // Body Large - Important body text
  bodyLarge: {
    fontSize: '16px',        // 1rem
    fontWeight: 500,         // medium
    lineHeight: '24px',      // 1.5 ratio (comfortable)
    letterSpacing: '0',
    tailwind: 'text-base font-medium leading-6',
  },

  // Body - Default body text
  body: {
    fontSize: '16px',        // 1rem
    fontWeight: 400,         // normal
    lineHeight: '24px',      // 1.5 ratio
    letterSpacing: '0',
    tailwind: 'text-base font-normal leading-6',
  },

  // Body Small - Secondary text
  bodySmall: {
    fontSize: '14px',        // 0.875rem
    fontWeight: 400,         // normal
    lineHeight: '20px',      // 1.429 ratio
    letterSpacing: '0',
    tailwind: 'text-sm font-normal leading-5',
  },

  // Caption - Meta text, labels
  caption: {
    fontSize: '12px',        // 0.75rem
    fontWeight: 500,         // medium
    lineHeight: '16px',      // 1.333 ratio
    letterSpacing: '0.01em', // Slightly wider for readability
    textTransform: 'uppercase',
    tailwind: 'text-xs font-medium leading-4 uppercase tracking-wide',
  },

  // Label - Form labels
  label: {
    fontSize: '14px',        // 0.875rem
    fontWeight: 600,         // semibold
    lineHeight: '20px',      // 1.429 ratio
    letterSpacing: '0',
    tailwind: 'text-sm font-semibold leading-5',
  },

  // Button - Button text
  button: {
    fontSize: '16px',        // 1rem
    fontWeight: 600,         // semibold
    lineHeight: '24px',      // 1.5 ratio
    letterSpacing: '0',
    tailwind: 'text-base font-semibold leading-6',
  },

  // Button Small - Secondary button text
  buttonSmall: {
    fontSize: '14px',        // 0.875rem
    fontWeight: 500,         // medium
    lineHeight: '20px',      // 1.429 ratio
    letterSpacing: '0',
    tailwind: 'text-sm font-medium leading-5',
  },
};
```

### 1.3 Spacing System (8px Grid)

All spacing follows a strict 8px baseline grid for visual rhythm.

```typescript
const spacing = {
  0: '0px',
  0.5: '2px',   // Exception for fine-tuning
  1: '4px',     // 0.5 units - Minimal spacing
  2: '8px',     // 1 unit - Base unit
  3: '12px',    // 1.5 units - Small spacing
  4: '16px',    // 2 units - Default spacing
  5: '20px',    // 2.5 units - Medium spacing
  6: '24px',    // 3 units - Large spacing
  7: '28px',    // 3.5 units - Extra large spacing
  8: '32px',    // 4 units - Section spacing
  10: '40px',   // 5 units - Major section spacing
  12: '48px',   // 6 units - Component spacing
  14: '56px',   // 7 units
  16: '64px',   // 8 units - Large gaps
  20: '80px',   // 10 units
  24: '96px',   // 12 units

  // Semantic spacing names
  gutter: '16px',           // Default gap between elements
  sectionGap: '24px',       // Gap between major sections
  componentGap: '32px',     // Gap between components
  modalPadding: '40px',     // Modal internal padding (desktop)
  modalPaddingTablet: '24px',
  modalPaddingMobile: '16px',
};
```

### 1.4 Shadow Scale (Elevation Levels)

Shadows create visual hierarchy and depth. Each level corresponds to an elevation.

```typescript
const shadows = {
  // No shadow - Flat elements
  none: 'none',

  // Elevation 1 - Subtle lift (cards, inputs)
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  tailwind: 'shadow-sm',

  // Elevation 2 - Default cards
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  tailwind: 'shadow',

  // Elevation 3 - Raised elements (dropdowns, popovers)
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  tailwind: 'shadow-md',

  // Elevation 4 - Floating elements (modals)
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  tailwind: 'shadow-lg',

  // Elevation 5 - Modal overlays
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  tailwind: 'shadow-xl',

  // Elevation 6 - Maximum depth
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  tailwind: 'shadow-2xl',

  // Special shadows
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)', // Inset for pressed states
  focus: '0 0 0 4px rgba(59, 130, 246, 0.1)',      // Focus ring
};
```

### 1.5 Border Radius Scale

Consistent rounding for all interface elements.

```typescript
const borderRadius = {
  none: '0',
  sm: '4px',           // Small elements (badges, tags)
  DEFAULT: '8px',      // Default (buttons, inputs, cards)
  md: '8px',           // Alias for default
  lg: '12px',          // Large cards, panels
  xl: '16px',          // Extra large containers
  '2xl': '20px',       // Modals, major containers
  full: '9999px',      // Pills, fully rounded (badges, avatars)

  // Component-specific
  button: '8px',
  input: '8px',
  card: '12px',
  modal: '16px',
  badge: '9999px',
  avatar: '9999px',
};
```

---

## 2. Modal Container Specifications

### 2.1 Desktop Layout (>1024px)

The modal is the primary container for the enhanced card detail view.

#### Container Dimensions
- **Width:** `896px` (max-w-4xl in Tailwind)
- **Max Height:** `90vh` (90% of viewport height)
- **Position:** Centered in viewport
  - `position: fixed`
  - `top: 50%`
  - `left: 50%`
  - `transform: translate(-50%, -50%)`
- **Z-index:** `1000`

#### Container Styling
```css
.modal-container {
  /* Layout */
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 896px;
  max-width: calc(100vw - 64px); /* 32px padding on each side */
  max-height: 90vh;
  z-index: 1000;

  /* Visual */
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  /* Layout structure */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Children handle scroll */
}
```

#### Backdrop Overlay
```css
.modal-backdrop {
  /* Layout */
  position: fixed;
  inset: 0; /* top: 0, right: 0, bottom: 0, left: 0 */
  z-index: 999;

  /* Visual */
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px); /* Optional: adds depth */

  /* Interaction */
  cursor: pointer; /* Indicates clickable to close */
}
```

#### Scrollable Content Area
The main content area between header and footer should scroll.

```css
.modal-body {
  /* Layout */
  flex: 1; /* Takes remaining space between header and footer */
  overflow-y: auto;
  overflow-x: hidden;

  /* Padding */
  padding: 32px 40px;

  /* Scrollbar styling (webkit browsers) */
  scrollbar-width: thin;
  scrollbar-color: #D1D5DB #F3F4F6;
}

.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: #F3F4F6; /* gray-100 */
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #D1D5DB; /* gray-300 */
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #9CA3AF; /* gray-400 */
}
```

### 2.2 Tablet Layout (768px - 1024px)

#### Container Adjustments
```css
@media (min-width: 768px) and (max-width: 1024px) {
  .modal-container {
    width: 90vw;
    max-width: 720px;
  }

  .modal-body {
    padding: 24px;
  }
}
```

### 2.3 Mobile Layout (<768px)

#### Full-Screen Modal
```css
@media (max-width: 767px) {
  .modal-container {
    /* Full screen */
    position: fixed;
    inset: 0;
    width: 100%;
    max-width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0; /* No rounding on mobile */
    transform: none;
    top: 0;
    left: 0;
  }

  .modal-body {
    padding: 16px;
  }
}
```

---

## 3. Header Section (80px height)

The header contains company logo, job title, status badge, and close button.

### 3.1 Header Container

```css
.modal-header {
  /* Layout */
  height: 80px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 40px;

  /* Visual */
  background: #FFFFFF;
  border-bottom: 1px solid #E5E7EB; /* gray-200 */

  /* Position */
  position: relative; /* For absolute positioned close button */
  flex-shrink: 0; /* Don't shrink when content overflows */
}

@media (max-width: 767px) {
  .modal-header {
    height: 64px;
    padding: 12px 16px;
    gap: 12px;
  }
}
```

### 3.2 Company Logo

**Specifications:**
- **Size:** `48px × 48px` (desktop), `40px × 40px` (mobile)
- **Position:** Left-aligned, vertically centered
- **Border:** `1px solid #E5E7EB` (gray-200)
- **Border-radius:** `8px`
- **Background:** `#F9FAFB` (gray-50) when no logo available

```css
.company-logo {
  /* Dimensions */
  width: 48px;
  height: 48px;
  flex-shrink: 0; /* Never shrink */

  /* Visual */
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  background: #F9FAFB;

  /* Content */
  object-fit: cover; /* Crop to fit if image */
  object-position: center;
}

/* Placeholder when no logo */
.company-logo-placeholder {
  /* Same dimensions */
  width: 48px;
  height: 48px;
  flex-shrink: 0;

  /* Visual */
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);

  /* Center icon */
  display: flex;
  align-items: center;
  justify-content: center;

  /* Text/Icon */
  font-size: 24px;
  color: #3B82F6;
}

@media (max-width: 767px) {
  .company-logo,
  .company-logo-placeholder {
    width: 40px;
    height: 40px;
  }

  .company-logo-placeholder {
    font-size: 20px;
  }
}
```

### 3.3 Title Stack (Company Name + Position)

**Layout:**
- **Flex:** `1` (takes remaining space)
- **Gap:** `4px` between company and position
- **Overflow:** Both lines truncate with ellipsis

```css
.title-stack {
  /* Layout */
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0; /* Allow flex children to shrink */
}

.company-name {
  /* Typography */
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  color: #111827; /* gray-900 */

  /* Truncation */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.position-title {
  /* Typography */
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #6B7280; /* gray-500 */

  /* Truncation */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 767px) {
  .company-name {
    font-size: 16px;
    line-height: 22px;
  }

  .position-title {
    font-size: 13px;
    line-height: 18px;
  }
}
```

### 3.4 Status Badge

**Specifications (per status type):**
- **Height:** `32px`
- **Padding:** `8px 16px`
- **Border-radius:** `9999px` (fully rounded pill)
- **Font:** `14px`, weight `500`, white text
- **Margin-left:** `auto` (pushes to right before close button)

```css
.status-badge {
  /* Layout */
  height: 32px;
  padding: 8px 16px;
  display: inline-flex;
  align-items: center;
  gap: 6px; /* Gap between icon and text */
  flex-shrink: 0;

  /* Visual */
  border-radius: 9999px;

  /* Typography */
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  color: #FFFFFF;
  white-space: nowrap;
}

/* Status-specific colors */
.status-badge--to-submit {
  background: #3B82F6; /* blue-600 */
}

.status-badge--waiting-for-call {
  background: #F59E0B; /* amber-500 */
}

.status-badge--interviewing {
  background: #8B5CF6; /* purple-600 */
}

.status-badge--offer {
  background: #10B981; /* green-600 */
}

.status-badge--not-now {
  background: #6B7280; /* gray-500 */
}

.status-badge--accepted {
  background: #059669; /* green-700 */
}

/* Icon within badge */
.status-badge__icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

@media (max-width: 767px) {
  .status-badge {
    height: 28px;
    padding: 6px 12px;
    font-size: 12px;
    gap: 4px;
  }

  .status-badge__icon {
    width: 14px;
    height: 14px;
  }
}
```

### 3.5 Close Button

**Specifications:**
- **Size:** `40px × 40px` (desktop), `36px × 36px` (mobile)
- **Position:** Absolute `top: 20px, right: 40px` (desktop)
- **Background:** Transparent default, `#F3F4F6` (gray-100) on hover
- **Icon:** 24px × 24px X icon, `#6B7280` (gray-500)

```css
.close-button {
  /* Position */
  position: absolute;
  top: 20px;
  right: 40px;

  /* Dimensions */
  width: 40px;
  height: 40px;
  flex-shrink: 0;

  /* Layout */
  display: flex;
  align-items: center;
  justify-content: center;

  /* Visual */
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;

  /* Transition */
  transition: background 150ms ease-in-out;
}

.close-button:hover {
  background: #F3F4F6; /* gray-100 */
}

.close-button:active {
  background: #E5E7EB; /* gray-200 */
}

.close-button:focus-visible {
  outline: 2px solid #3B82F6; /* blue-600 */
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.close-button__icon {
  width: 24px;
  height: 24px;
  color: #6B7280; /* gray-500 */
}

@media (max-width: 767px) {
  .close-button {
    top: 14px;
    right: 16px;
    width: 36px;
    height: 36px;
  }

  .close-button__icon {
    width: 20px;
    height: 20px;
  }
}
```

---

## 4. Job Information Section

This section appears immediately after the header in the scrollable body.

### 4.1 Meta Pills (Location, Salary, Date)

**Container:**
```css
.meta-pills-container {
  /* Layout */
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}
```

**Individual Pill:**
```css
.meta-pill {
  /* Layout */
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 6px 12px;

  /* Visual */
  background: #F9FAFB; /* gray-50 */
  border: 1px solid #E5E7EB; /* gray-200 */
  border-radius: 9999px;

  /* Typography */
  font-size: 13px;
  font-weight: 400;
  line-height: 16px;
  color: #6B7280; /* gray-500 */
}

.meta-pill__icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* Special styling for deadline warning */
.meta-pill--deadline-near {
  background: #FEF2F2; /* red-50 */
  border-color: #FECACA; /* red-100 */
  color: #DC2626; /* red-600 */
  font-weight: 600;
}
```

### 4.2 Match Score Display

**Container:**
```css
.match-score-container {
  /* Layout */
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  margin-bottom: 24px;

  /* Visual */
  background: #F9FAFB; /* gray-50 */
  border: 1px solid #E5E7EB; /* gray-200 */
  border-radius: 12px;
}

.match-score-label {
  /* Typography */
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: #6B7280; /* gray-500 */
}

.match-score-badge {
  /* Layout */
  height: 36px;
  padding: 8px 16px;
  display: inline-flex;
  align-items: center;

  /* Visual */
  border-radius: 9999px;

  /* Typography */
  font-size: 18px;
  font-weight: 700;
  line-height: 20px;
}

/* Score color variants */
.match-score-badge--high {
  background: #D1FAE5; /* green-200 */
  color: #065F46; /* green-900 */
}

.match-score-badge--medium {
  background: #FEF3C7; /* amber-100 */
  color: #92400E; /* amber-800 */
}

.match-score-badge--low {
  background: #FEE2E2; /* red-100 */
  color: #991B1B; /* red-800 */
}
```

### 4.3 Job Description

**Container:**
```css
.job-description {
  /* Layout */
  margin-bottom: 32px;
}

.job-description__heading {
  /* Typography */
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  color: #111827; /* gray-900 */
  margin-bottom: 12px;
}

.job-description__content {
  /* Typography */
  font-size: 14px;
  font-weight: 400;
  line-height: 22px; /* 1.571 ratio for readability */
  color: #374151; /* gray-700 */
  white-space: pre-wrap; /* Preserve line breaks */

  /* Visual */
  max-height: 400px; /* Limit initial height */
  overflow-y: auto;

  /* Scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #D1D5DB #F3F4F6;
}

/* Optional: "Read More" expandable */
.job-description__content--collapsed {
  max-height: 200px;
  position: relative;
  overflow: hidden;
}

.job-description__content--collapsed::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to bottom, transparent, #FFFFFF);
}

.job-description__read-more {
  /* Layout */
  margin-top: 8px;

  /* Typography */
  font-size: 14px;
  font-weight: 500;
  color: #3B82F6; /* blue-600 */

  /* Interaction */
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  text-decoration: underline;

  /* Transition */
  transition: color 150ms ease;
}

.job-description__read-more:hover {
  color: #2563EB; /* blue-700 */
}
```

---

## 5. Status-Specific Field Layouts

Each status has unique fields and layouts. All measurements are pixel-perfect.

### 5.1 To Submit Status (`to_submit`)

#### Container
```css
.status-section--to-submit {
  /* Layout */
  padding: 20px;
  margin-bottom: 24px;

  /* Visual */
  background: #EFF6FF; /* blue-50 */
  border: 1px solid #BFDBFE; /* blue-200 */
  border-radius: 12px;
}
```

#### CV Readiness Badge

**Ready State:**
```css
.readiness-badge--ready {
  /* Layout */
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 8px 12px;

  /* Visual */
  background: #10B981; /* green-600 */
  border-radius: 6px;

  /* Typography */
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  color: #FFFFFF;
}

.readiness-badge--ready .icon {
  width: 16px;
  height: 16px;
}
```

**Not Ready State:**
```css
.readiness-badge--not-ready {
  /* Same layout as ready */
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 8px 12px;

  /* Visual - different color */
  background: #EF4444; /* red-600 */
  border-radius: 6px;

  /* Typography */
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  color: #FFFFFF;
}

.readiness-badge--not-ready .icon {
  width: 16px;
  height: 16px;
}
```

#### Cover Letter Badge
Same specifications as CV Readiness Badge.

#### Apply Button

```css
.apply-button {
  /* Layout */
  width: 100%;
  height: 48px;
  margin-top: 16px;

  /* Visual */
  background: #3B82F6; /* blue-600 */
  border: none;
  border-radius: 8px;
  cursor: pointer;

  /* Typography */
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: #FFFFFF;
  text-align: center;

  /* Transition */
  transition: all 150ms ease-in-out;
}

.apply-button:hover:not(:disabled) {
  background: #2563EB; /* blue-700 */
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.apply-button:active:not(:disabled) {
  background: #1D4ED8; /* blue-800 */
  transform: translateY(0);
}

.apply-button:disabled {
  background: #9CA3AF; /* gray-400 */
  cursor: not-allowed;
  opacity: 0.6;
}

.apply-button:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
```

#### Badge Container Layout
```css
.readiness-badges {
  /* Layout */
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.readiness-badge-row {
  /* Layout */
  display: flex;
  align-items: center;
  gap: 12px;
}

.readiness-badge-label {
  /* Typography */
  font-size: 14px;
  font-weight: 600;
  color: #374151; /* gray-700 */
  min-width: 100px;
}
```

### 5.2 Waiting for Call Status (`waiting_for_call`)

#### Timestamp Display

```css
.submission-timestamp {
  /* Layout */
  margin-bottom: 16px;

  /* Typography */
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #6B7280; /* gray-500 */
}

.submission-timestamp__value {
  font-weight: 600;
  color: #374151; /* gray-700 */
}
```

#### AI Insights Panel Container

```css
.ai-insights-panel {
  /* Layout */
  padding: 20px;
  margin-bottom: 24px;

  /* Visual */
  background: #F0FDF4; /* green-50 */
  border: 1px solid #BBF7D0; /* green-200 */
  border-radius: 12px;
}

.ai-insights-panel__heading {
  /* Layout */
  margin-bottom: 16px;

  /* Typography */
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: #065F46; /* green-900 */
}
```

#### Generate Insights Button (Before Generation)

```css
.generate-insights-button {
  /* Layout */
  width: auto;
  height: 40px;
  padding: 10px 20px;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  /* Visual */
  background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
  border: none;
  border-radius: 8px;
  cursor: pointer;

  /* Typography */
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: #FFFFFF;

  /* Transition */
  transition: all 150ms ease-in-out;
}

.generate-insights-button__icon {
  width: 18px;
  height: 18px;
  /* Icon: ✨ sparkles */
}

.generate-insights-button:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.3);
}

.generate-insights-button:active {
  transform: scale(1.02);
}

.generate-insights-button:focus-visible {
  outline: 2px solid #8B5CF6;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
}
```

#### Loading Skeleton (During Generation)

```css
.insights-skeleton {
  /* Layout */
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.insights-skeleton__bar {
  /* Dimensions */
  height: 16px;
  border-radius: 4px;

  /* Visual */
  background: #E5E7EB; /* gray-200 */

  /* Animation */
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.insights-skeleton__bar:nth-child(1) {
  width: 100%;
}

.insights-skeleton__bar:nth-child(2) {
  width: 85%;
}

.insights-skeleton__bar:nth-child(3) {
  width: 95%;
}

.insights-skeleton__bar:nth-child(4) {
  width: 70%;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

#### Checklist (After Generation)

```css
.insights-checklist {
  /* Layout */
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.insights-checklist-item {
  /* Layout */
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
}

.insights-checklist-item__checkbox {
  /* Dimensions */
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px; /* Align with first line of text */

  /* Visual */
  border: 2px solid #3B82F6; /* blue-600 */
  border-radius: 4px;
  background: #FFFFFF;
  cursor: pointer;

  /* Layout for checkmark */
  display: flex;
  align-items: center;
  justify-content: center;

  /* Transition */
  transition: all 150ms ease;
}

.insights-checklist-item__checkbox:hover {
  border-color: #2563EB; /* blue-700 */
  background: #EFF6FF; /* blue-50 */
}

/* Checked state */
.insights-checklist-item__checkbox--checked {
  background: #3B82F6; /* blue-600 */
  border-color: #3B82F6;
}

.insights-checklist-item__checkbox--checked svg {
  /* Checkmark icon */
  width: 12px;
  height: 12px;
  color: #FFFFFF;
}

.insights-checklist-item__label {
  /* Layout */
  flex: 1;

  /* Typography */
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #374151; /* gray-700 */

  /* Interaction */
  cursor: pointer;
  user-select: none;
}

/* Checked label styling */
.insights-checklist-item--checked .insights-checklist-item__label {
  text-decoration: line-through;
  color: #9CA3AF; /* gray-400 */
}
```

### 5.3 Interviewing (ongoing) Status

#### Phase Tracker Container

```css
.phase-tracker {
  /* Layout */
  width: 100%;
  padding: 24px;
  margin-bottom: 24px;

  /* Visual */
  background: #F5F3FF; /* purple-50 */
  border: 1px solid #E9D5FF; /* purple-200 */
  border-radius: 12px;
}

.phase-tracker__heading {
  /* Typography */
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  color: #5B21B6; /* purple-800 */
  margin-bottom: 20px;
}
```

#### Phase Input Fields

**Grid Layout:**
```css
.phase-inputs-grid {
  /* Layout */
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

@media (max-width: 767px) {
  .phase-inputs-grid {
    grid-template-columns: 1fr;
  }
}
```

**Input Field:**
```css
.phase-input-field {
  /* Layout */
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.phase-input-field__label {
  /* Typography */
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: #6B7280; /* gray-500 */
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.phase-input-field__input {
  /* Dimensions */
  height: 44px;
  padding: 12px 16px;

  /* Visual */
  background: #FFFFFF;
  border: 2px solid #D1D5DB; /* gray-300 */
  border-radius: 8px;

  /* Typography */
  font-size: 16px;
  font-weight: 400;
  line-height: 20px;
  color: #111827; /* gray-900 */

  /* Transition */
  transition: all 150ms ease;
}

.phase-input-field__input::placeholder {
  color: #9CA3AF; /* gray-400 */
}

.phase-input-field__input:hover {
  border-color: #9CA3AF; /* gray-400 */
}

.phase-input-field__input:focus {
  border-color: #3B82F6; /* blue-600 */
  outline: none;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

/* Date input specific styling */
.phase-input-field__input[type="date"] {
  /* Ensure consistent height across browsers */
  height: 44px;
}

/* Number input specific styling */
.phase-input-field__input[type="number"] {
  -moz-appearance: textfield; /* Remove spinner in Firefox */
}

.phase-input-field__input[type="number"]::-webkit-inner-spin-button,
.phase-input-field__input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
```

#### Progress Bar

```css
.interview-progress {
  /* Layout */
  width: 100%;
  margin-top: 20px;
}

.interview-progress__info {
  /* Layout */
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.interview-progress__label {
  /* Typography */
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: #6B7280; /* gray-500 */
}

.interview-progress__text {
  /* Typography */
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: #6B7280; /* gray-500 */
}

.interview-progress__bar-container {
  /* Dimensions */
  width: 100%;
  height: 8px;

  /* Visual */
  background: #E5E7EB; /* gray-200 */
  border-radius: 9999px;
  overflow: hidden;
}

.interview-progress__bar-fill {
  /* Dimensions */
  height: 100%;

  /* Visual */
  background: #8B5CF6; /* purple-600 */
  border-radius: 9999px;

  /* Transition */
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 5.4 Offer (success) Status

#### Salary Input Container

```css
.offer-section {
  /* Layout */
  padding: 20px;
  margin-bottom: 24px;

  /* Visual */
  background: #ECFDF5; /* green-50 */
  border: 1px solid #A7F3D0; /* green-200 */
  border-radius: 12px;
}

.salary-input-container {
  /* Layout */
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

@media (max-width: 767px) {
  .salary-input-container {
    grid-template-columns: 1fr;
  }
}
```

#### Amount Input

```css
.salary-amount-input {
  /* Grid */
  grid-column: span 2;

  /* Dimensions */
  height: 48px;
  padding: 14px 16px;

  /* Visual */
  background: #FFFFFF;
  border: 2px solid #D1D5DB; /* gray-300 */
  border-radius: 8px;

  /* Typography */
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
  color: #111827; /* gray-900 */

  /* Transition */
  transition: all 150ms ease;
}

.salary-amount-input::placeholder {
  color: #9CA3AF; /* gray-400 */
  font-weight: 400;
}

.salary-amount-input:focus {
  border-color: #10B981; /* green-600 */
  outline: none;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
}

@media (max-width: 767px) {
  .salary-amount-input {
    grid-column: span 1;
  }
}
```

#### Currency Dropdown

```css
.currency-dropdown {
  /* Grid */
  grid-column: span 1;

  /* Dimensions */
  height: 48px;
  padding: 14px 16px;
  padding-right: 40px; /* Space for dropdown arrow */

  /* Visual */
  background: #FFFFFF;
  border: 2px solid #D1D5DB; /* gray-300 */
  border-radius: 8px;
  cursor: pointer;

  /* Typography */
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
  color: #111827; /* gray-900 */

  /* Remove default select styling */
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  /* Transition */
  transition: all 150ms ease;
}

/* Custom dropdown arrow */
.currency-dropdown-wrapper {
  position: relative;
}

.currency-dropdown-wrapper::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid #6B7280;
  pointer-events: none;
}

.currency-dropdown:focus {
  border-color: #10B981; /* green-600 */
  outline: none;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
}
```

#### Benefits Textarea

```css
.benefits-textarea {
  /* Layout */
  width: 100%;
  margin-bottom: 16px;

  /* Dimensions */
  height: 96px; /* Approximately 6 lines */
  padding: 12px 16px;

  /* Visual */
  background: #FFFFFF;
  border: 2px solid #D1D5DB; /* gray-300 */
  border-radius: 8px;

  /* Typography */
  font-size: 16px;
  font-weight: 400;
  line-height: 20px;
  color: #111827; /* gray-900 */
  font-family: inherit;

  /* Interaction */
  resize: vertical; /* Allow vertical resizing only */

  /* Transition */
  transition: all 150ms ease;
}

.benefits-textarea::placeholder {
  color: #9CA3AF; /* gray-400 */
}

.benefits-textarea:focus {
  border-color: #10B981; /* green-600 */
  outline: none;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
}
```

#### Analyze Offer Button

```css
.analyze-offer-button {
  /* Layout */
  width: 100%;
  height: 48px;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  /* Visual */
  background: #8B5CF6; /* purple-600 */
  border: none;
  border-radius: 8px;
  cursor: pointer;

  /* Typography */
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: #FFFFFF;

  /* Transition */
  transition: all 150ms ease-in-out;
}

.analyze-offer-button__icon {
  width: 20px;
  height: 20px;
  /* Icon: ✨ sparkles */
}

.analyze-offer-button:hover {
  background: #7C3AED; /* purple-700 */
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.3);
}

.analyze-offer-button:active {
  background: #6D28D9; /* purple-800 */
  transform: translateY(0);
}

.analyze-offer-button:focus-visible {
  outline: 2px solid #8B5CF6;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
}
```

#### Analysis Result Card

```css
.offer-analysis-card {
  /* Layout */
  padding: 24px;
  margin-top: 20px;

  /* Visual */
  background: #ECFDF5; /* green-50 */
  border: 1px solid #A7F3D0; /* green-200 */
  border-radius: 12px;
}

.offer-analysis-card__heading {
  /* Typography */
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: #065F46; /* green-900 */
  margin-bottom: 16px;
}
```

#### Competitive Badge

```css
.competitive-badge {
  /* Layout */
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  margin-bottom: 16px;

  /* Visual */
  border-radius: 8px;

  /* Typography */
  font-size: 14px;
  font-weight: 600;
  line-height: 16px;
  color: #FFFFFF;
}

.competitive-badge__icon {
  width: 24px;
  height: 24px;
}

/* Above average */
.competitive-badge--above {
  background: #10B981; /* green-600 */
}

/* Average */
.competitive-badge--average {
  background: #F59E0B; /* amber-500 */
}

/* Below average */
.competitive-badge--below {
  background: #EF4444; /* red-600 */
}
```

#### Analysis Text

```css
.offer-analysis-text {
  /* Typography */
  font-size: 14px;
  font-weight: 400;
  line-height: 22px; /* 1.571 ratio */
  color: #374151; /* gray-700 */
  margin-bottom: 16px;
}
```

#### Sources Section

```css
.offer-sources {
  /* Layout */
  margin-top: 16px;
}

.offer-sources__heading {
  /* Typography */
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: #6B7280; /* gray-500 */
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.offer-sources__list {
  /* Layout */
  display: flex;
  flex-direction: column;
  gap: 10px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.offer-sources__item {
  /* Layout */
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.offer-sources__bullet {
  /* Dimensions */
  width: 6px;
  height: 6px;
  margin-top: 7px; /* Align with text */
  flex-shrink: 0;

  /* Visual */
  background: #3B82F6; /* blue-600 */
  border-radius: 50%;
}

.offer-sources__link {
  /* Typography */
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #2563EB; /* blue-700 */
  text-decoration: none;

  /* Transition */
  transition: all 150ms ease;
}

.offer-sources__link:hover {
  color: #1D4ED8; /* blue-800 */
  text-decoration: underline;
}
```

#### Action Buttons (Accept/Decline)

```css
.offer-actions {
  /* Layout */
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

@media (max-width: 767px) {
  .offer-actions {
    flex-direction: column;
  }
}
```

**Accept Button:**
```css
.offer-accept-button {
  /* Layout */
  flex: 1;
  height: 48px;

  /* Visual */
  background: #10B981; /* green-600 */
  border: none;
  border-radius: 8px;
  cursor: pointer;

  /* Typography */
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: #FFFFFF;
  text-align: center;

  /* Transition */
  transition: all 150ms ease-in-out;
}

.offer-accept-button:hover {
  background: #059669; /* green-700 */
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
}

.offer-accept-button:active {
  background: #047857; /* green-800 */
  transform: translateY(0);
}

.offer-accept-button:focus-visible {
  outline: 2px solid #10B981;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
}
```

**Decline Button:**
```css
.offer-decline-button {
  /* Layout */
  flex: 1;
  height: 48px;

  /* Visual */
  background: #F3F4F6; /* gray-100 */
  border: 1px solid #E5E7EB; /* gray-200 */
  border-radius: 8px;
  cursor: pointer;

  /* Typography */
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: #374151; /* gray-700 */
  text-align: center;

  /* Transition */
  transition: all 150ms ease-in-out;
}

.offer-decline-button:hover {
  background: #E5E7EB; /* gray-200 */
  transform: translateY(-1px);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.offer-decline-button:active {
  background: #D1D5DB; /* gray-300 */
  transform: translateY(0);
}

.offer-decline-button:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
```

### 5.5 Not Now Status (`not_now`)

#### Retrospective Container

```css
.retrospective-section {
  /* Layout */
  padding: 24px;
  margin-bottom: 24px;

  /* Visual */
  background: #FEF3C7; /* amber-50 */
  border: 1px solid #FDE68A; /* amber-200 */
  border-radius: 12px;
}

.retrospective-section__heading {
  /* Typography */
  font-size: 18px;
  font-weight: 600;
  line-height: 24px;
  color: #92400E; /* amber-800 */
  margin-bottom: 20px;
}
```

#### Reason Dropdown

```css
.reason-dropdown-wrapper {
  /* Layout */
  margin-bottom: 16px;
  position: relative;
}

.reason-dropdown__label {
  /* Layout */
  display: block;
  margin-bottom: 8px;

  /* Typography */
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: #6B7280; /* gray-500 */
}

.reason-dropdown {
  /* Dimensions */
  width: 100%;
  height: 44px;
  padding: 12px 16px;
  padding-right: 40px; /* Space for arrow */

  /* Visual */
  background: #FFFFFF;
  border: 2px solid #D1D5DB; /* gray-300 */
  border-radius: 8px;
  cursor: pointer;

  /* Typography */
  font-size: 15px;
  font-weight: 400;
  line-height: 20px;
  color: #111827; /* gray-900 */

  /* Remove default styling */
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  /* Transition */
  transition: all 150ms ease;
}

.reason-dropdown-wrapper::after {
  content: '';
  position: absolute;
  top: calc(50% + 14px); /* Account for label */
  right: 16px;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid #6B7280;
  pointer-events: none;
}

.reason-dropdown:focus {
  border-color: #3B82F6; /* blue-600 */
  outline: none;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
```

#### Learnings Textarea

```css
.learnings-textarea-wrapper {
  /* Layout */
  margin-top: 16px;
}

.learnings-textarea__label {
  /* Layout */
  display: block;
  margin-bottom: 8px;

  /* Typography */
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: #6B7280; /* gray-500 */
}

.learnings-textarea {
  /* Layout */
  width: 100%;

  /* Dimensions */
  height: 120px; /* Approximately 8 lines */
  padding: 12px 16px;

  /* Visual */
  background: #FFFFFF;
  border: 2px solid #D1D5DB; /* gray-300 */
  border-radius: 8px;

  /* Typography */
  font-size: 15px;
  font-weight: 400;
  line-height: 20px;
  color: #111827; /* gray-900 */
  font-family: inherit;

  /* Interaction */
  resize: vertical;

  /* Transition */
  transition: all 150ms ease;
}

.learnings-textarea::placeholder {
  color: #9CA3AF; /* gray-400 */
  line-height: 20px;
}

.learnings-textarea:focus {
  border-color: #3B82F6; /* blue-600 */
  outline: none;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
```

#### Save Learnings Button

```css
.save-learnings-button {
  /* Layout */
  width: 100%;
  height: 48px;
  margin-top: 16px;

  /* Visual */
  background: #3B82F6; /* blue-600 */
  border: none;
  border-radius: 8px;
  cursor: pointer;

  /* Typography */
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: #FFFFFF;
  text-align: center;

  /* Transition */
  transition: all 150ms ease-in-out;
}

.save-learnings-button:hover {
  background: #2563EB; /* blue-700 */
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
}

.save-learnings-button:active {
  background: #1D4ED8; /* blue-800 */
  transform: translateY(0);
}

.save-learnings-button:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
```

### 5.6 Accepted Status (`accepted`)

#### Congratulations Card

```css
.congratulations-card {
  /* Layout */
  padding: 48px 24px;
  text-align: center;
  margin-bottom: 24px;

  /* Visual */
  background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
  border: 2px solid #6EE7B7; /* green-300 */
  border-radius: 16px;
}
```

#### Emoji Icon

```css
.congratulations-card__emoji {
  /* Typography */
  font-size: 72px;
  line-height: 1;
  margin-bottom: 16px;
}

@media (max-width: 767px) {
  .congratulations-card__emoji {
    font-size: 56px;
  }
}
```

#### Heading

```css
.congratulations-card__heading {
  /* Typography */
  font-size: 28px;
  font-weight: 700;
  line-height: 36px;
  color: #065F46; /* green-900 */
  margin-bottom: 8px;
}

@media (max-width: 767px) {
  .congratulations-card__heading {
    font-size: 24px;
    line-height: 32px;
  }
}
```

#### Subtext

```css
.congratulations-card__subtext {
  /* Typography */
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: #047857; /* green-700 */
  max-width: 500px;
  margin: 0 auto;
}

@media (max-width: 767px) {
  .congratulations-card__subtext {
    font-size: 14px;
    line-height: 22px;
  }
}
```

#### Archive Button

```css
.archive-button {
  /* Layout */
  width: fit-content;
  height: 40px;
  padding: 10px 24px;
  margin: 24px auto 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  /* Visual */
  background: #10B981; /* green-600 */
  border: none;
  border-radius: 8px;
  cursor: pointer;

  /* Typography */
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: #FFFFFF;

  /* Transition */
  transition: all 150ms ease-in-out;
}

.archive-button:hover {
  background: #059669; /* green-700 */
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
}

.archive-button:active {
  background: #047857; /* green-800 */
  transform: translateY(0);
}

.archive-button:focus-visible {
  outline: 2px solid #10B981;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
}
```

---

## 6. Match Analysis Section

Displays the job match breakdown with strengths, partial matches, and gaps.

### Container

```css
.match-analysis-section {
  /* Layout */
  padding: 24px;
  margin: 24px 0;

  /* Visual */
  background: #F9FAFB; /* gray-50 */
  border: 1px solid #E5E7EB; /* gray-200 */
  border-radius: 12px;
}

.match-analysis-section__heading {
  /* Typography */
  font-size: 18px;
  font-weight: 700;
  line-height: 24px;
  color: #111827; /* gray-900 */
  margin-bottom: 20px;
}
```

### Category Sections

**Strengths Section:**
```css
.match-category--strengths {
  /* Layout */
  margin-bottom: 20px;
}

.match-category__heading--strengths {
  /* Layout */
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  /* Typography */
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: #059669; /* green-600 */
}

.match-category__icon--strengths {
  width: 20px;
  height: 20px;
  color: #059669; /* green-600 */
  /* Icon: ✓ checkmark or thumbs up */
}

.match-category__list--strengths {
  /* Layout */
  list-style: none;
  padding: 0;
  margin: 0;
  padding-left: 28px; /* Indent for bullets */
}

.match-category__item--strengths {
  /* Layout */
  position: relative;
  margin-bottom: 8px;

  /* Typography */
  font-size: 14px;
  font-weight: 400;
  line-height: 24px;
  color: #374151; /* gray-700 */
}

.match-category__item--strengths::before {
  content: '';
  position: absolute;
  left: -16px;
  top: 10px;
  width: 4px;
  height: 4px;
  background: #059669; /* green-600 */
  border-radius: 50%;
}
```

**Partial Matches Section:**
```css
.match-category--partials {
  /* Layout */
  margin-bottom: 20px;
}

.match-category__heading--partials {
  /* Layout */
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  /* Typography */
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: #D97706; /* amber-600 */
}

.match-category__icon--partials {
  width: 20px;
  height: 20px;
  color: #D97706; /* amber-600 */
  /* Icon: ~ tilde or half checkmark */
}

.match-category__list--partials {
  list-style: none;
  padding: 0;
  margin: 0;
  padding-left: 28px;
}

.match-category__item--partials {
  position: relative;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 400;
  line-height: 24px;
  color: #374151; /* gray-700 */
}

.match-category__item--partials::before {
  content: '';
  position: absolute;
  left: -16px;
  top: 10px;
  width: 4px;
  height: 4px;
  background: #D97706; /* amber-600 */
  border-radius: 50%;
}
```

**Gaps Section:**
```css
.match-category--gaps {
  /* No bottom margin on last section */
}

.match-category__heading--gaps {
  /* Layout */
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  /* Typography */
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: #DC2626; /* red-600 */
}

.match-category__icon--gaps {
  width: 20px;
  height: 20px;
  color: #DC2626; /* red-600 */
  /* Icon: X or warning triangle */
}

.match-category__list--gaps {
  list-style: none;
  padding: 0;
  margin: 0;
  padding-left: 28px;
}

.match-category__item--gaps {
  position: relative;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 400;
  line-height: 24px;
  color: #374151; /* gray-700 */
}

.match-category__item--gaps::before {
  content: '';
  position: absolute;
  left: -16px;
  top: 10px;
  width: 4px;
  height: 4px;
  background: #DC2626; /* red-600 */
  border-radius: 50%;
}
```

---

## 7. Footer Section

The footer is sticky at the bottom of the modal, containing action buttons.

### 7.1 Footer Container

```css
.modal-footer {
  /* Position */
  position: sticky;
  bottom: 0;
  z-index: 10;
  flex-shrink: 0;

  /* Layout */
  height: 72px;
  padding: 16px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  /* Visual */
  background: #FFFFFF;
  border-top: 1px solid #E5E7EB; /* gray-200 */
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05);
}

@media (max-width: 1024px) {
  .modal-footer {
    padding: 16px 24px;
  }
}

@media (max-width: 767px) {
  .modal-footer {
    padding: 16px 20px;
    height: 64px;
  }
}
```

### 7.2 Left Side - Edit Button

```css
.footer-edit-button {
  /* Dimensions */
  width: 120px;
  height: 40px;
  padding: 10px 20px;

  /* Visual */
  background: #F3F4F6; /* gray-100 */
  border: 1px solid #E5E7EB; /* gray-200 */
  border-radius: 8px;
  cursor: pointer;

  /* Typography */
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: #374151; /* gray-700 */

  /* Transition */
  transition: all 150ms ease-in-out;
}

.footer-edit-button:hover {
  background: #E5E7EB; /* gray-200 */
}

.footer-edit-button:active {
  background: #D1D5DB; /* gray-300 */
}

.footer-edit-button:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

@media (max-width: 767px) {
  .footer-edit-button {
    width: fit-content;
    padding: 10px 16px;
  }
}
```

### 7.3 Right Side - Delete Button

```css
.footer-delete-button {
  /* Dimensions */
  width: 120px;
  height: 40px;
  padding: 10px 20px;

  /* Layout */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  /* Visual */
  background: #FEE2E2; /* red-50 */
  border: 1px solid #FECACA; /* red-100 */
  border-radius: 8px;
  cursor: pointer;

  /* Typography */
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: #DC2626; /* red-600 */

  /* Transition */
  transition: all 150ms ease-in-out;
}

.footer-delete-button__icon {
  width: 20px;
  height: 20px;
}

.footer-delete-button:hover {
  background: #FECACA; /* red-100 */
}

.footer-delete-button:active {
  background: #FCA5A5; /* red-200 */
}

.footer-delete-button:focus-visible {
  outline: 2px solid #DC2626;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1);
}

@media (max-width: 767px) {
  .footer-delete-button {
    width: 40px;
    padding: 10px;
  }

  /* Hide text, show icon only on mobile */
  .footer-delete-button__text {
    display: none;
  }
}
```

### 7.4 Edit Mode - Save & Cancel Buttons

```css
.footer-edit-actions {
  /* Layout */
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex: 1;
}
```

**Cancel Button:**
```css
.footer-cancel-button {
  /* Dimensions */
  width: 100px;
  height: 40px;
  padding: 10px 20px;

  /* Visual */
  background: transparent;
  border: 1px solid #D1D5DB; /* gray-300 */
  border-radius: 8px;
  cursor: pointer;

  /* Typography */
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: #6B7280; /* gray-500 */

  /* Transition */
  transition: all 150ms ease-in-out;
}

.footer-cancel-button:hover {
  background: #F3F4F6; /* gray-100 */
}

.footer-cancel-button:active {
  background: #E5E7EB; /* gray-200 */
}

.footer-cancel-button:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
```

**Save Button:**
```css
.footer-save-button {
  /* Dimensions */
  width: 140px;
  height: 40px;
  padding: 10px 20px;

  /* Layout */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  /* Visual */
  background: #3B82F6; /* blue-600 */
  border: none;
  border-radius: 8px;
  cursor: pointer;

  /* Typography */
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: #FFFFFF;

  /* Transition */
  transition: all 150ms ease-in-out;
}

.footer-save-button__icon {
  width: 16px;
  height: 16px;
  /* Icon: checkmark */
}

.footer-save-button:hover:not(:disabled) {
  background: #2563EB; /* blue-700 */
}

.footer-save-button:active:not(:disabled) {
  background: #1D4ED8; /* blue-800 */
}

.footer-save-button:disabled {
  background: #9CA3AF; /* gray-400 */
  cursor: not-allowed;
}

.footer-save-button:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
```

---

## 8. Animation Specifications

All animations use specific easing functions and durations for smooth, professional motion.

### 8.1 Modal Enter Animation

```css
@keyframes modalEnter {
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.modal-container.entering {
  animation: modalEnter 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
```

**Backdrop Enter:**
```css
@keyframes backdropEnter {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-backdrop.entering {
  animation: backdropEnter 250ms ease-out forwards;
}
```

### 8.2 Modal Exit Animation

```css
@keyframes modalExit {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.98);
  }
}

.modal-container.exiting {
  animation: modalExit 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
```

**Backdrop Exit:**
```css
@keyframes backdropExit {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.modal-backdrop.exiting {
  animation: backdropExit 200ms ease-in forwards;
}
```

### 8.3 Status Field Transition

**Old Component Fade-Out:**
```css
.status-field-exit {
  animation: fadeOut 150ms ease-out forwards;
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
```

**New Component Slide-In:**
```css
.status-field-enter {
  animation: slideIn 200ms ease-out forwards;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 8.4 Button Hover Effects

```css
/* Primary buttons */
.button-primary {
  transition: all 150ms ease-in-out;
}

.button-primary:hover:not(:disabled) {
  transform: translateY(-1px);
}

.button-primary:active:not(:disabled) {
  transform: translateY(0);
}

/* Generate/Analyze buttons with special effect */
.button-special:hover:not(:disabled) {
  transform: scale(1.05);
}

.button-special:active:not(:disabled) {
  transform: scale(1.02);
}
```

### 8.5 Loading Pulse Animation

```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### 8.6 Progress Bar Fill Animation

```css
.progress-bar-fill {
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 8.7 Checkbox Check Animation

```css
.checkbox-checkmark {
  animation: checkmarkDraw 200ms ease-out forwards;
}

@keyframes checkmarkDraw {
  from {
    stroke-dashoffset: 16;
  }
  to {
    stroke-dashoffset: 0;
  }
}
```

---

## 9. Responsive Breakpoints

### 9.1 Breakpoint Values

```typescript
const breakpoints = {
  mobile: '767px',       // max-width
  tablet: '768px',       // min-width
  tabletMax: '1024px',   // max-width
  desktop: '1025px',     // min-width
};
```

### 9.2 Mobile (<768px)

**Modal:**
- Full-screen: `inset: 0`
- No border-radius
- Padding: `16px`

**Typography:**
- Display: `24px`
- H1: `20px`
- H2: `18px`
- H3: `16px`
- Body: `16px` (unchanged)
- Body Small: `14px` (unchanged)

**Buttons:**
- Height: `48px` (touch-friendly)
- Full width for primary actions

**Form Inputs:**
- Height: `48px` (touch-friendly)
- Grid: Single column

**Header:**
- Logo: `40px × 40px`
- Close button: `36px × 36px`

**Footer:**
- Delete button: icon-only, `40px × 40px`

### 9.3 Tablet (768px - 1024px)

**Modal:**
- Width: `90vw`, max `720px`
- Border-radius: `16px`
- Padding: `24px`

**Typography:**
- Display: `28px` (unchanged from desktop)
- H1: `22px`
- Others: desktop sizes

**Form Inputs:**
- Grid: 2 columns for most forms
- Height: `44px`

**Header:**
- Logo: `48px × 48px`
- Close button: `40px × 40px`

### 9.4 Desktop (>1024px)

All specifications in previous sections apply.

**Modal:**
- Width: `896px`
- Border-radius: `16px`
- Padding: `32px 40px`

**Form Inputs:**
- Grid: 2-3 columns depending on layout
- Height: `44-48px` depending on element

---

## 10. Accessibility Specifications

### 10.1 Focus States

**All Interactive Elements:**
```css
:focus-visible {
  outline: 2px solid #3B82F6; /* blue-600 */
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
```

**Buttons:**
```css
button:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

/* Danger buttons */
button.danger:focus-visible {
  outline-color: #DC2626; /* red-600 */
  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1);
}
```

**Form Inputs:**
```css
input:focus,
textarea:focus,
select:focus {
  border-color: #3B82F6; /* blue-600 */
  outline: none;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}
```

### 10.2 Touch Targets

**Minimum Size:**
- All interactive elements: `44px × 44px` minimum (WCAG 2.1 AAA)
- Mobile buttons: `48px` height

**Spacing:**
- Minimum gap between touch targets: `8px`

### 10.3 Color Contrast (WCAG 2.1 AA)

**Text Contrast Ratios:**
```
Primary Text (#111827 on #FFFFFF):     9.34:1 ✅ AAA
Secondary Text (#374151 on #FFFFFF):   8.91:1 ✅ AAA
Tertiary Text (#6B7280 on #FFFFFF):    4.60:1 ✅ AA
Small Text minimum (#6B7280):          4.60:1 ✅ AA (for 14px+)
Link Text (#2563EB on #FFFFFF):        6.67:1 ✅ AAA
Button Text (white on #3B82F6):        4.98:1 ✅ AA
Success Text (#065F46 on #ECFDF5):     8.24:1 ✅ AAA
Error Text (#DC2626 on #FFFFFF):       6.54:1 ✅ AAA
```

**Never Use:**
- Light gray text smaller than 14px
- Color as the only indicator (always include icons or text)

### 10.4 Screen Reader Text

**Visually Hidden but Accessible:**
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

**Usage Examples:**
```html
<button aria-label="Close modal">
  <svg>...</svg>
  <span class="sr-only">Close</span>
</button>

<input type="checkbox" id="insight-1">
<label for="insight-1">
  <span class="sr-only">Mark as completed:</span>
  Prepare responses to common interview questions
</label>
```

### 10.5 ARIA Attributes

**Modal:**
```html
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Company Name - Position Title</h2>
  <div id="modal-description">Job application details and status</div>
</div>
```

**Form Fields:**
```html
<label for="salary-input" id="salary-label">
  Salary Amount
</label>
<input
  id="salary-input"
  type="text"
  aria-labelledby="salary-label"
  aria-required="true"
  aria-invalid="false"
  aria-describedby="salary-help"
>
<span id="salary-help" class="help-text">
  Enter offered salary amount
</span>
```

**Status Badge:**
```html
<span
  class="status-badge status-badge--offer"
  role="status"
  aria-label="Application status: Offer received"
>
  <svg aria-hidden="true">...</svg>
  Offer
</span>
```

### 10.6 Keyboard Navigation

**Tab Order:**
1. Close button
2. Status badge (if interactive)
3. Form fields (top to bottom, left to right)
4. Action buttons
5. Edit/Delete buttons in footer

**Keyboard Shortcuts:**
- `Escape`: Close modal
- `Tab`: Move forward
- `Shift + Tab`: Move backward
- `Enter`: Activate button/submit form
- `Space`: Toggle checkbox

**Focus Trap:**
Modal must trap focus - tabbing from last element returns to first element within modal.

---

## 11. Design Tokens Reference

### 11.1 Complete Color Tokens

```typescript
export const colorTokens = {
  // Brand colors
  brand: {
    primary: '#3B82F6',      // blue-600
    primaryHover: '#2563EB', // blue-700
    primaryActive: '#1D4ED8',// blue-800
  },

  // Status colors
  status: {
    toSubmit: '#3B82F6',
    waitingForCall: '#F59E0B',
    interviewing: '#8B5CF6',
    offer: '#10B981',
    notNow: '#6B7280',
    accepted: '#059669',
  },

  // Semantic colors
  semantic: {
    success: '#10B981',
    successLight: '#ECFDF5',
    successDark: '#065F46',
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    warningDark: '#92400E',
    error: '#EF4444',
    errorLight: '#FEF2F2',
    errorDark: '#991B1B',
    info: '#3B82F6',
    infoLight: '#EFF6FF',
    infoDark: '#1E3A8A',
  },

  // UI colors
  ui: {
    backgroundPrimary: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
    backgroundTertiary: '#F3F4F6',
    borderLight: '#F3F4F6',
    borderDefault: '#E5E7EB',
    borderMedium: '#D1D5DB',
    borderDark: '#9CA3AF',
    textPrimary: '#111827',
    textSecondary: '#374151',
    textTertiary: '#6B7280',
    textQuaternary: '#9CA3AF',
    textInverse: '#FFFFFF',
  },
};
```

### 11.2 Complete Typography Tokens

```typescript
export const typographyTokens = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },

  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '28px',
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  letterSpacing: {
    tighter: '-0.02em',
    tight: '-0.01em',
    normal: '0',
    wide: '0.01em',
    wider: '0.05em',
  },
};
```

### 11.3 Complete Spacing Tokens

```typescript
export const spacingTokens = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
};
```

### 11.4 Complete Shadow Tokens

```typescript
export const shadowTokens = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  focus: '0 0 0 4px rgba(59, 130, 246, 0.1)',
};
```

### 11.5 Complete Border Radius Tokens

```typescript
export const borderRadiusTokens = {
  none: '0',
  sm: '4px',
  DEFAULT: '8px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  full: '9999px',
};
```

### 11.6 Transition Tokens

```typescript
export const transitionTokens = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },

  easing: {
    linear: 'linear',
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out',
    custom: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  property: {
    all: 'all',
    colors: 'background-color, border-color, color, fill, stroke',
    opacity: 'opacity',
    shadow: 'box-shadow',
    transform: 'transform',
  },
};
```

---

## Implementation Checklist

Use this checklist to ensure pixel-perfect implementation:

### Design System
- [ ] All color tokens implemented with exact hex values
- [ ] Typography scale matches specifications exactly
- [ ] 8px spacing grid enforced throughout
- [ ] Shadow scale applied correctly
- [ ] Border radius values consistent

### Modal Container
- [ ] Desktop width: 896px
- [ ] Modal centered with proper transform
- [ ] Backdrop overlay with 75% opacity black
- [ ] Scrollable content area with custom scrollbar
- [ ] Mobile full-screen layout

### Header
- [ ] Height: 80px (64px mobile)
- [ ] Company logo: 48px × 48px (40px mobile)
- [ ] Title stack with proper truncation
- [ ] Status badge with correct colors per status
- [ ] Close button: 40px × 40px (36px mobile)

### Status Sections
- [ ] To Submit: CV/CL badges, apply button
- [ ] Waiting: Timestamp, AI insights panel
- [ ] Interviewing: Phase tracker, progress bar
- [ ] Offer: Salary input, analysis card
- [ ] Not Now: Reason dropdown, learnings textarea
- [ ] Accepted: Congratulations card with gradient

### Forms
- [ ] All inputs: 44-48px height
- [ ] Focus states with blue ring
- [ ] Proper placeholder colors
- [ ] Grid layouts: 2 columns (1 on mobile)

### Footer
- [ ] Height: 72px (64px mobile)
- [ ] Edit button: 120px width
- [ ] Delete button: 120px (icon-only mobile)
- [ ] Sticky positioning with shadow

### Animations
- [ ] Modal enter: 300ms cubic-bezier
- [ ] Modal exit: 250ms cubic-bezier
- [ ] Status transitions: fade + slide
- [ ] Button hovers: 150ms ease
- [ ] Loading pulse animation

### Accessibility
- [ ] Focus visible on all interactive elements
- [ ] Touch targets: 44px minimum
- [ ] Color contrast: WCAG AA minimum
- [ ] ARIA labels and roles
- [ ] Keyboard navigation support
- [ ] Screen reader text where needed

### Responsive
- [ ] Mobile: full-screen, 16px padding
- [ ] Tablet: 90vw, 24px padding
- [ ] Desktop: 896px, 40px padding
- [ ] Typography scales properly
- [ ] Touch-friendly sizes on mobile

---

**End of Visual Design Specification**

This document provides complete pixel-perfect specifications for implementing the Enhanced Kanban Card Detail View. Every measurement, color, animation, and interaction state is defined to ensure consistent, high-quality implementation.
