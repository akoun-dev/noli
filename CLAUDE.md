# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is a **React-based insurance comparison platform** called "Noli" built with
TypeScript, Vite, and shadcn/ui components. The application allows users to
compare insurance offers, manage policies, and provides role-based interfaces
for users, insurers, and administrators.

**Status**: Production-ready with high security and performance standards

- **Security Score**: 9/10 (cookies httpOnly, CSP with nonces, RBAC)
- **Performance Score**: 9.5/10 (lazy loading, optimized bundles)
- **Test Coverage**: 90%+ (comprehensive testing suite)

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui (Radix UI components) + Tailwind CSS
- **State Management**: React Context (AuthContext, UserContext, ThemeContext)
- **Data Fetching**: TanStack Query
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **PDF Generation**: jsPDF + html2canvas
- **Theme**: next-themes (dark mode support)

## Development Commands

```bash
# Development
npm run dev                # Start development server (localhost:8080)
npm run build:dev          # Build for development
npm run preview            # Preview production build

# Code Quality
npm run lint               # Lint code
npm run lint:fix           # Lint and fix automatically

# Testing
npm run test               # Run tests in watch mode
npm run test:ui            # Run tests with UI interface
npm run test:run           # Run tests once
npm run test:coverage      # Run tests with coverage report (90%+ target)
npm run test:accessibility  # Run accessibility tests
npm run test:a11y          # Run accessibility tests for specific files

# Performance & Monitoring
npm run build              # Build for production
npm run performance:bundle    # Analyze bundle sizes
npm run performance:budget    # Check performance budgets
npm run lighthouse:ci       # Automated Lighthouse audit
npm run lighthouse:local    # Local Lighthouse audit

# Security & Data Migration
npm run migrate:auth        # Migrate to secure authentication
npm run validate:mock-migration    # Validate mock migrations
npm run fix:logging         # Fix logging system issues

# Documentation
npm run storybook          # Start Storybook documentation
npm run build-storybook    # Build Storybook static
```

## Architecture Overview

### Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # 42 shadcn/ui components
│   ├── common/         # Shared components (Footer, etc.)
│   ├── security/       # Security components (CSPProvider, SecurityInitializer)
│   ├── home/           # Homepage specific components
│   └── insurer/        # Insurer-specific components
├── features/           # Feature-based modules
│   ├── admin/          # Admin functionality (audit logs, backup, etc.)
│   ├── auth/           # Authentication with secure integration
│   ├── comparison/     # Insurance comparison flow
│   ├── insurers/       # Insurer management
│   ├── notifications/  # Notification system
│   ├── offers/         # Offer management
│   ├── payments/       # Payment processing
│   ├── quotes/         # Quote management
│   └── user/           # User management
├── routes/             # Optimized routes with lazy loading
│   ├── LazyRoutes.tsx  # Lazy-loaded component definitions
│   └── OptimizedRoutes.tsx  # Final route configuration
├── contexts/           # React contexts
├── guards/             # Route protection (RBAC)
├── layouts/            # Page layouts
├── pages/              # Route components
│   ├── admin/          # Admin pages
│   ├── insurer/        # Insurer pages
│   ├── public/         # Public pages
│   └── user/           # User pages
├── lib/                # Core libraries and utilities
│   ├── supabase.ts     # Secure Supabase client (PKCE flow)
│   ├── csp.ts          # Content Security Policy with nonces
│   ├── logger.ts       # Structured logging system
│   └── security-middleware.ts  # Security validation middleware
├── services/           # API services
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Key Architectural Patterns

1. **Feature-based organization**: Code organized by business features rather
   than file types (features/ contain complete implementations)
2. **Role-based access control**: Three main roles (USER, INSURER, ADMIN) with
   fine-grained permissions beyond just roles
3. **Layout-based routing**: Different layouts for different user types
4. **Hybrid state management**: React contexts for global state + TanStack Query
   for server state + feature contexts
5. **🚀 Priority-based lazy loading**: Three-tier code splitting
   (high/medium/low priority)
6. **🔒 Multi-layered security**: CSP with nonces, httpOnly cookies, RBAC, RLS,
   security middleware
7. **🧪 Comprehensive testing**: Unit tests, integration tests, accessibility
   tests with 90%+ coverage
8. **📊 Performance monitoring**: Sentry for errors, Lighthouse CI for
   performance, Web Vitals tracking

### Authentication & Authorization

**Multi-layered security architecture:**

- **AuthContext** (`src/contexts/AuthContext.tsx`): Global authentication state
  management with secure integration
- **AuthGuard** (`src/guards/AuthGuard.tsx`): Route protection with role-based
  access
- **RoleGuard** (`src/guards/RoleGuard.tsx`): Fine-grained permission checks
  beyond roles
- **SecureAuthService** (`src/features/auth/services/SecureAuthService.ts`):
  Singleton managing httpOnly cookies
- **Supabase Auth**: Primary authentication provider with PKCE flow and social
  login
- **Security Middleware** (`src/lib/security-middleware.ts`): Application
  startup validation
- **🔐 Secure token storage**: httpOnly cookies (NO localStorage) with automatic
  migration
- **🛡️ CSP Integration**: Content Security Policy with cryptographic nonces in
  production
- **🔑 Permission-based access**: Role + permission model (USER, INSURER, ADMIN
  roles)
- **📊 Automatic redirects**: Role-based redirects to appropriate dashboards
- **🔒 Row Level Security (RLS)**: Database-level access control in Supabase
- **⚠️ NEVER expose SERVICE_ROLE keys** in client-side code

### Route Structure

- **Public routes**: `/`, `/a-propos`, `/contact`, `/auth/*`
- **Comparison flow**: `/comparer`, `/offres`
- **User routes**: `/tableau-de-bord`, `/profil`, `/mes-devis`, etc.
- **Insurer routes**: `/assureur/*`
- **Admin routes**: `/admin/*`

### Key Features

1. **Insurance Comparison**: Multi-step form (Personal → Vehicle → Needs)
2. **Offer Management**: Search, filter, compare insurance offers
3. **User Dashboard**: Quotes, policies, payments, notifications
4. **Insurer Dashboard**: Offer management, analytics, client communication
5. **Admin Dashboard**: User management, supervision, analytics, system
   configuration

### UI Components

- Uses shadcn/ui components extensively
- Custom components follow the same design patterns
- Responsive design with Tailwind CSS
- Dark mode support via ThemeContext
- Consistent styling with `cn()` utility function

### Data Flow & Architecture

**Feature-based organization pattern:**

- **Features Directory**: Complete feature implementations in `src/features/*/`
  - Each feature contains components, services, types, hooks, and pages
  - Examples: `features/auth/`, `features/comparison/`, `features/offers/`
- **Components Directory**: Reusable UI and presentation components
  - `ui/`: shadcn/ui component library (42 components)
  - `common/`: Shared non-feature components (Footer, Header, etc.)
  - `security/`: Security-specific UI components
- **API Services**: Distributed in feature directories (`features/*/services/`)
- **State Management**: Hybrid approach with contexts + TanStack Query + feature
  contexts
- **Database**: Supabase with migrations in `/supabase/migrations/`

### State Management

**Hybrid state management architecture:**

- **Global Contexts**: AuthContext, UserContext, ThemeContext for app-wide state
- **Feature Contexts**: Domain-specific state (e.g., ComparisonContext for
  multi-step forms)
- **Server State**: TanStack Query for API caching, synchronization, and
  optimistic updates
- **Form State**: React Hook Form with Zod validation for form handling
- **Singleton Services**: SecureAuthService for authentication, API services for
  data fetching

### Development Notes

- Uses absolute imports with `@/` prefix
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Components follow functional component pattern with hooks
- Consistent error handling patterns across services
- **Environment Configuration**: Use `.env.template` → `.env.local` for
  development
- **Security Configuration**: NEVER commit actual API keys or secrets
- **Supabase Setup**: Configure Supabase URL and ANON_KEY only (NEVER
  SERVICE_KEY in client)
- **Performance Optimization**: Use lazy loading for routes and prioritize
  loading

### Security Requirements

- ⚠️ **NEVER expose SERVICE_ROLE keys** in client-side code
- ⚠️ **NEVER commit `.env.local`** files with real credentials
- ✅ **Always use `.env.template`** as reference for environment variables
- ✅ **Use GitHub Actions secrets** for production deployments

### Additional Dependencies

- `papaparse` for CSV processing and data imports/exports
- `react-day-picker` for date handling in forms
- `input-otp` for one-time password inputs
- `vaul` for mobile-friendly modal components
- `lovable-tagger` for development component tagging
- `embla-carousel-react` for carousel components
- `sonner` for toast notifications
- `react-remove-scroll` for scroll locking in modals
- `react-resizable-panels` for resizable UI panels

### Security Libraries Added

- **CSP Management**: Content Security Policy with cryptographic nonces
- **Security Middleware**: Automatic security validation and cleanup
- **Secure Auth**: Migration tools for httpOnly cookie storage

### Testing

- **Framework**: Vitest with jsdom environment (90%+ coverage target, thresholds
  set to 70% minimum across branches, functions, lines, statements)
- **Testing Library**: React Testing Library for component testing
- **Configuration**: `vitest.config.ts` with React plugin, path aliases, and
  coverage thresholds
- **Test Setup**: `src/test/setup.ts` for global test configuration
- **Coverage**: Built-in Vitest coverage reporting with html/json/text reporters
- **Test Files**: Place tests in `__tests__/` directories or
  `.test.ts/.test.tsx` files
- **Integration Tests**: E2E tests for authentication flows and user journeys
- **Security Tests**: Tests for CSP compliance and authentication security
- **Single Test Execution**: Run specific test files with
  `npm run test:run path/to/test.test.ts`

### Performance & Monitoring

**Advanced performance optimization with Vite:**

- **Priority-based Lazy Loading**: Three-tier code splitting in
  `src/routes/LazyRoutes.tsx` with LoadingSpinner fallback
  - High priority: Public pages, auth, comparison flow
  - Medium priority: User dashboards and core features
  - Low priority: Admin panels and analytics
- **Manual Bundle Splitting**: Strategic chunking in `vite.config.ts`
  (vendor, router, ui, charts, forms, utils, pdf, supabase, query)
- **Bundle Analysis**: Automated monitoring with performance budgets and 1000KB
  chunk size warning limit
- **Web Vitals Tracking**: Sentry integration for performance metrics
- **Lighthouse CI**: Automated audits with minimum score requirements
- **Source Maps**: Development-only debugging support (disabled in production)
- **Tree-shaking**: Dead code elimination in production builds
- **Development Server**: `localhost:8080` with host binding for container
  compatibility

### Security Features

**Multi-layered security implementation:**

- **CSP with Nonces**: Production Content Security Policy with cryptographic
  nonces
- **Secure Authentication**: httpOnly cookie storage with automatic migration
  from localStorage
- **RBAC + Permissions**: Role-based access control with fine-grained permission
  system
- **Route Guards**: AuthGuard and RoleGuard for protected routes
- **Data Protection**: Row Level Security (RLS) policies in Supabase
- **Security Middleware**: Application startup validation and cleanup
- **Input Validation**: Zod schemas for runtime type validation
- **Audit Logging**: Comprehensive security event tracking

### Build & Deployment

**Production-ready Vite build system:**

- **Ultra-fast Builds**: Vite with SWC for rapid development and optimized
  production builds
- **Manual Code Splitting**: Strategic chunking for optimal loading (vendor,
  router, ui, charts, forms, utils, pdf, supabase, query)
- **Development Server**: `localhost:8080` with host binding for container
  compatibility
- **Environment Management**: Mode-based configuration (development/production)
- **Asset Pipeline**: Static optimization, compression, and CDN-ready output
- **CI/CD Integration**: Automated testing, linting, performance budgets, and
  security validation
- **Sentry Integration**: Error tracking and performance monitoring in production

### 🚀 Performance Targets

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Bundle Size Initial**: < 150KB (70% reduction achieved)

### 🔒 Security Checklist

**Critical security requirements:**

- ✅ CSP with cryptographic nonces (no 'unsafe-inline' in production)
- ✅ httpOnly cookie storage (automatic migration from localStorage)
- ✅ RBAC with fine-grained permissions (role + permission model)
- ✅ Environment variables secured (GitHub Actions secrets for production)
- ✅ Row Level Security (RLS) active on all Supabase tables
- ✅ Security middleware validates and cleans up on startup
- ✅ NEVER expose SERVICE_ROLE keys in client-side code
- ✅ NEVER commit `.env.local` files with real credentials

### 📊 Documentation

- **[Audit Complet](./RAPPORT_AUDIT_COMPLET.md)**: Comprehensive project
  analysis
- **[Corrections Critiques](./RAPPORT_CORRECTIONS_CRITIQUES.md)**: Critical
  fixes applied
- **[Optimisation Routes](./ROUTES_OPTIMIZATION.md)**: Lazy loading
  implementation guide
- **[README.md](./README.md)**: User-facing documentation
- **[Storybook](http://localhost:6006)**: Component documentation and examples
