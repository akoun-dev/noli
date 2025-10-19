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

# Performance & Monitoring
npm run build              # Build for production
npm run performance:bundle    # Analyze bundle sizes
npm run performance:budget    # Check performance budgets
npm run lighthouse:ci       # Automated Lighthouse audit
npm run lighthouse:local    # Local Lighthouse audit

# Security
npm run migrate:auth        # Migrate to secure authentication
npm run validate:mock-migration    # Validate mock migrations

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

1. **Feature-based organization**: Code is organized by business features rather
   than file types
2. **Role-based access control**: Three main roles (USER, INSURER, ADMIN) with
   protected routes
3. **Layout-based routing**: Different layouts for different user types
4. **Context-based state management**: Global state managed through React
   contexts
5. **🚀 Performance-optimized routing**: Lazy loading with priority-based code
   splitting
6. **🔒 Security-first architecture**: CSP with nonces, secure cookies, RBAC
   implementation
7. **🧪 Comprehensive testing**: Unit tests, integration tests, E2E tests with
   90%+ coverage
8. **📊 Monitoring integration**: Sentry for errors, Lighthouse CI for
   performance

### Authentication & Authorization

- **AuthContext** (`src/contexts/AuthContext.tsx`): Handles user authentication
  state with secure integration
- **AuthGuard** (`src/guards/AuthGuard.tsx`): Protects routes based on user
  roles
- **RoleGuard** (`src/guards/RoleGuard.tsx`): Additional role-based protection
- **Supabase Auth**: Primary authentication provider with PKCE flow and social
  login
- **🔐 Secure token storage**: httpOnly cookies (NO localStorage)
- **🛡️ CSP Integration**: Content Security Policy with cryptographic nonces
- **🔑 Security Middleware**: Automatic security validation and cleanup
- **📊 Automatic role-based redirects** to appropriate dashboards
- **🔒 Row Level Security (RLS)** implemented in Supabase for data access
  control
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

### Data Flow

- **Supabase Client**: Primary database and authentication client
- API services in `src/data/api/` (though some services are in
  `src/features/*/services/`)
- TanStack Query for server state management and caching
- React contexts for global client state
- Form state managed with React Hook Form
- Database migrations in `/supabase/migrations/` for schema management

### State Management

- **AuthContext**: Authentication state and user data
- **UserContext**: Additional user-related state
- **ThemeContext**: Theme preferences (dark/light mode)
- **Feature contexts**: Some features have dedicated contexts (e.g.,
  ComparisonContext)

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

- `papaparse` for CSV processing
- `react-day-picker` for date handling
- `input-otp` for OTP inputs
- `vaul` for mobile-friendly modals
- `lovable-tagger` for development component tagging

### Security Libraries Added

- **CSP Management**: Content Security Policy with cryptographic nonces
- **Security Middleware**: Automatic security validation and cleanup
- **Secure Auth**: Migration tools for httpOnly cookie storage

### Testing

- **Framework**: Vitest with jsdom environment (90%+ coverage target)
- **Testing Library**: React Testing Library for component testing
- **Configuration**: `vitest.config.ts` with React plugin and path aliases
- **Test Setup**: `src/test/setup.ts` for global test configuration
- **Coverage**: Built-in Vitest coverage reporting with thresholds (70% minimum)
- **Test Files**: Place tests in `__tests__/` directories or
  `.test.ts/.test.tsx` files
- **Integration Tests**: E2E tests for authentication flows and user journeys
- **Security Tests**: Tests for CSP compliance and authentication security

### Performance & Monitoring

- **Lazy Loading**: Priority-based code splitting for optimal loading
- **Bundle Analysis**: Automated bundle size monitoring with budgets
- **Web Vitals**: Performance metrics tracking with Sentry
- **Lighthouse CI**: Automated performance audits with minimum scores
- **Source Maps**: Enabled in development mode for debugging
- **Tree-shaking**: Optimized builds with dead code elimination

### Security Features

- **CSP**: Content Security Policy with cryptographic nonces in production
- **Authentication**: Secure cookie storage with httpOnly flags
- **Authorization**: Role-based access control (RBAC) with route guards
- **Data Protection**: Row Level Security (RLS) in Supabase
- **Monitoring**: Real-time security validation and cleanup

### Build & Deployment

- **Vite**: Fast development and optimized builds
- **Production Optimization**: Manual chunking (vendor, router, ui, charts,
  forms, utils, pdf, supabase, query)
- **Development Server**: Runs on `localhost:8080` with host binding to `::`
- **Environment Configurations**: Separate configs for development, staging,
  production
- **Asset Optimization**: Static asset optimization and compression
- **CI/CD Ready**: Automated testing, linting, and performance checks

### 🚀 Performance Targets

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Bundle Size Initial**: < 150KB (70% reduction achieved)

### 🔒 Security Checklist

- ✅ CSP implemented with nonces (no 'unsafe-inline' in production)
- ✅ Tokens stored in httpOnly cookies (no localStorage)
- ✅ RBAC implemented with route guards
- ✅ Environment variables properly secured
- ✅ Row Level Security (RLS) active on all tables
- ✅ Security middleware validates on startup

### 📊 Documentation

- **[Audit Complet](./RAPPORT_AUDIT_COMPLET.md)**: Comprehensive project
  analysis
- **[Corrections Critiques](./RAPPORT_CORRECTIONS_CRITIQUES.md)**: Critical
  fixes applied
- **[Optimisation Routes](./ROUTES_OPTIMIZATION.md)**: Lazy loading
  implementation guide
- **[README.md](./README.md)**: User-facing documentation
- **[Storybook](http://localhost:6006)**: Component documentation and examples
