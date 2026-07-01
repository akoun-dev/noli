# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
```bash
npm run dev              # Start development server on localhost:8080
npm run build            # Production build
npm run build:dev        # Development build
npm run preview          # Preview production build
```

### Code Quality
```bash
npm run lint             # ESLint check
npm run lint:fix         # ESLint with auto-fix
npm run test             # Run tests in watch mode
npm run test:run         # Run all tests once
npm run test:coverage    # Generate coverage report
npm run test:ui          # Run tests with UI interface
npm run test:accessibility # Run accessibility tests
npm run test:a11y        # Run accessibility tests (alias)
```

### Performance & Monitoring
```bash
npm run performance:bundle    # Analyze bundle size
npm run performance:budget    # Check performance budgets
npm run lighthouse:local      # Local Lighthouse audit
npm run lighthouse:ci         # Lighthouse CI audit
npm run lighthouse            # Run Lighthouse CI audit
```

### Database & Seeding
```bash
npm run seed:tarification     # Seed tarification data
npm run migrate:auth          # Migrate to secure auth
npm run validate:mock-migration    # Validate migrations
```

### Storybook
```bash
npm run storybook             # Start Storybook development server
npm run build-storybook       # Build static Storybook
```

### Debugging & Utilities
```bash
npm run fix:logging           # Fix logging issues
```

## Architecture Overview

### Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui (Radix UI) + Tailwind CSS
- **State Management**: React Context + TanStack Query
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Testing**: Vitest + Testing Library + Playwright (E2E)
- **Build Tools**: Vite with SWC, optimized code splitting
- **Error Tracking**: Sentry
- **Documentation**: Storybook
- **Form Validation**: React Hook Form + Zod
- **Charts**: Recharts
- **PDF Generation**: jsPDF + html2canvas
- **CSV Processing**: PapaParse

### Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components (Radix UI + Tailwind)
│   ├── common/          # Shared components (Header, Footer, etc.)
│   ├── auth/            # Authentication components
│   └── layout/          # Layout components
├── features/            # Feature-based modules (PRIMARY ORGANIZATION)
│   ├── auth/           # Authentication flow
│   ├── comparison/     # Insurance comparison process
│   ├── chat/           # Real-time chat functionality
│   ├── payments/       # Payment processing
│   ├── insurers/       # Insurer management
│   ├── admin/          # Admin functionality
│   ├── quotes/         # Quote management
│   ├── notifications/  # Notification system
│   └── tarification/   # Pricing and rules engine
├── pages/              # Route components organized by role
│   ├── public/         # Public pages
│   ├── user/           # User-facing pages
│   ├── insurer/        # Insurer-specific pages
│   └── admin/          # Admin pages
├── services/           # Core business logic services
├── api/                # API layer and service interfaces
├── lib/                # Utilities and configurations
│   ├── supabase/       # Supabase client and helpers
│   ├── logger/         # Structured logging system
│   ├── monitoring/     # Performance monitoring
│   ├── analytics/      # Analytics tracking
│   └── utils/          # Utility functions
├── contexts/           # React contexts (Auth, User, Theme)
├── hooks/              # Custom React hooks
├── guards/             # Route guards (RBAC)
├── layouts/            # Page layouts by role
├── types/              # TypeScript type definitions
└── routes/             # Optimized routing with lazy loading
```

### Key Architectural Patterns

**Feature-Driven Development**: Primary organization by business features with encapsulated components, services, pages, and types within each feature directory.

**Service Layer Architecture**:
- Core business logic in `src/services/`
- Feature-specific services in `src/features/[name]/services/`
- Clear separation between UI components and business logic

**Component Architecture**:
- Base UI components in `components/ui/` (shadcn/ui built on Radix UI)
- Business components in respective feature folders
- Shared components in `components/common/`

**State Management**:
- Authentication state via `AuthContext`
- User data via `UserContext`
- Server state with TanStack Query and caching
- Form state with React Hook Form + Zod validation

**Security Architecture**:
- Row Level Security (RLS) with Supabase
- Role-based access control (USER/INSURER/ADMIN)
- httpOnly cookies for auth tokens
- Content Security Policy with cryptographic nonces
- Structured logging and audit trails

**Type-Safe Database Integration**:
- Comprehensive TypeScript types in `types/database.ts`
- Supabase client configured with PKCE flow
- Database-first approach with strong typing

### Data Flow

**Authentication Flow**:
1. User authenticates via Supabase Auth
2. Auth tokens stored in httpOnly cookies
3. AuthContext updates with user session
4. Role guards protect routes based on user role

**Comparison Flow**:
1. User fills comparison form (3 steps: Profile → Vehicle → Coverage)
2. Form validated with Zod schemas
3. Data sent to backend via services
4. Results cached with TanStack Query
5. Offers displayed with filtering/sorting

### Performance Optimizations

**Code Splitting**: Manual chunks configured in vite.config.ts:
- `vendor`: React & React DOM
- `router`: React Router
- `ui`: Radix UI components
- `charts`: Recharts
- `forms`: Form libraries
- `utils`: Utility libraries
- `pdf`: PDF generation
- `supabase`: Supabase client
- `query`: TanStack Query

**Bundle Optimization**:
- Tree shaking enabled
- Dynamic imports for heavy components
- Optimized dependency pre-bundling
- Source maps only in development

### Testing Strategy

**Unit Tests**: Component and utility tests with Vitest
**Integration Tests**: API service tests
**E2E Tests**: Critical user journey tests
**Coverage Target**: 75%+ maintained

### Testing Configuration with Playwright
- Configuration in `playwright.config.ts`
- Tests run against multiple browsers (Chrome, Firefox, Safari, Mobile)
- Automatic server startup for development
- Screenshots and traces on failure
- CI-optimized with retries and parallel execution

### Environment Configuration

**Required Variables**:
```bash
VITE_SUPABASE_URL=your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=NOLI Assurance
```

**Development Setup**:
1. Copy `.env.example` to `.env.local`
2. Add Supabase configuration
3. Run `npm install`
4. Start dev server with `npm run dev`

### Role-Based Access Control

**Roles**:
- `USER`: Compare insurance, manage personal quotes/contracts
- `INSURER`: Manage offers, track commercial performance
- `ADMIN`: Full platform supervision and user management

**Route Protection**:
- Guard components in `guards/` directory
- Role-based layout rendering
- Automatic redirects for unauthorized access

### Key Services

**Core Services**:
- `pdfService.ts`: PDF generation with jsPDF + html2canvas
- `quoteService.ts`: Quote management and calculations
- `coverageTarificationService.ts`: Tarification logic and pricing rules
- `notificationService.ts`: User notifications and alerts
- `realtimeService.ts`: Real-time updates with Supabase subscriptions

**Supabase Integration**:
- Client configuration in `lib/supabase.ts` with PKCE flow
- Helper functions in `supabaseHelpers` for common operations
- Row Level Security policies for data protection
- Real-time subscriptions for live updates
- Database types in `types/database.ts`
- Secure authentication with httpOnly cookies

### Development Guidelines

**Code Style**:
- ESLint + Prettier configuration
- TypeScript strict mode enabled
- Conventional commits enforced via Husky
- Pre-commit hooks with lint-staged

**Component Guidelines**:
- Use shadcn/ui components as base
- Business logic in services, not components
- Form validation with Zod schemas
- Error boundaries for error handling

**Performance Guidelines**:
- Lazy load routes and heavy components
- Optimize images and assets
- Use React Query for data caching
- Monitor bundle size regularly

## Testing Configuration

### Test Structure
- **Unit Tests**: Component tests in `src/**/__tests__/` and `src/**/*.test.{ts,tsx}`
- **Integration Tests**: `src/__tests__/integration/` for workflow testing
- **E2E Tests**: `tests/e2e/` with Playwright for critical user journeys
- **Coverage**: Target 70%+ across branches, functions, lines, statements

### Test Commands
```bash
npm run test                    # Watch mode for development
npm run test:run               # Run all tests once
npm run test:coverage          # Generate coverage report
npm run test:ui                # Interactive test UI
npm run test:accessibility     # Accessibility testing
```

### E2E Testing with Playwright
- Configuration in `playwright.config.ts`
- Tests run against multiple browsers (Chrome, Firefox, Safari, Mobile)
- Automatic server startup for development
- Screenshots and traces on failure
- CI-optimized with retries and parallel execution

## Environment Configuration

### Required Environment Variables
Copy `.env.example` to `.env.local` and configure:

```bash
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Application (Optional)
VITE_APP_NAME=NOLI Assurance
VITE_APP_VERSION=1.0.0
VITE_ENABLE_SOCIAL_LOGIN=true
VITE_ENABLE_MFA=false

# Development
VITE_DEBUG=true
VITE_MOCK_DATA=true
```

### Feature Flags
- `VITE_ENABLE_SOCIAL_LOGIN`: Enable OAuth providers (Google, Facebook, GitHub)
- `VITE_ENABLE_PHONE_VERIFICATION`: Phone number verification
- `VITE_ENABLE_MFA`: Multi-factor authentication
- `VITE_ENABLE_QUOTE_COMPARISON`: Insurance comparison features
- `VITE_ENABLE_ONLINE_PAYMENT`: Payment processing

## Security Implementation

### Authentication Flow
1. User authenticates via Supabase Auth with PKCE flow
2. Auth tokens stored securely in httpOnly cookies (not localStorage)
3. `AuthContext` manages authentication state globally
4. Role guards protect routes based on user permissions
5. Session refresh handled automatically by Supabase

### Permission System
- **Role-Based Access Control**: USER/INSURER/ADMIN roles
- **Permission Cache`: `usePermissionCache` hook for optimized permission checking
- **Route Guards**: `AuthGuard` and `RoleGuard` components
- **Audit Logging**: Actions logged via `supabaseHelpers.logAction()`

### Security Features
- Row Level Security (RLS) with Supabase
- Content Security Policy with cryptographic nonces
- Input validation with Zod schemas
- Secure password policies
- Session timeout management
- CSRF protection

## State Management Patterns

### React Contexts
- **AuthContext**: Authentication state and user management
- **UserContext**: User profile and preferences
- **ThemeContext**: Light/dark mode theming
- **ComparisonContext**: Insurance comparison workflow state

### Data Fetching
- **TanStack Query**: Server state management and caching
- **Custom Hooks**: Feature-specific data fetching hooks
- **Optimistic Updates**: Immediate UI updates with rollback on error
- **Background Refetching**: Automatic data synchronization

### Form Management
- **React Hook Form**: Performant form handling
- **Zod Validation**: Type-safe form validation
- **Multi-step Forms**: Wizard-style forms with progress tracking
- **Form Persistence**: Save form state across navigation

## Important Development Notes

### Code Organization
- Feature-based structure in `src/features/` for business logic
- Shared components in `src/components/` organized by type
- Business logic should be in services, not components
- Use TypeScript strict mode - all types must be defined

### Performance Considerations
- Manual code splitting configured in `vite.config.ts`
- Lazy loading for routes and heavy components
- Bundle size monitoring with performance budgets
- Image optimization and progressive loading
- React Query for efficient data caching

### Error Handling
- Error boundaries wrap major sections of the app
- Sentry integration for production error tracking
- Structured logging with `logger` utility
- Graceful fallbacks for missing data

### File Upload & Media
- Maximum file size: 10MB (configurable via `VITE_MAX_FILE_SIZE`)
- Supported types: PDF, DOC, DOCX, JPG, PNG, JPEG
- Secure file handling with validation
- Progress tracking for uploads

### Domain-Specific Features

**French Insurance Market**:
- Specialized for French insurance regulations and requirements
- Multi-category insurance support (auto, property, health, etc.)
- Comprehensive pricing rules and tarification engine
- Localization and French language support

**Real-time Features**:
- Chat system for insurer-client communication via `features/chat/`
- Live notifications and updates via `features/notifications/`
- Real-time quote comparisons and status tracking

**Multi-Tenant Architecture**:
- Separate dashboards for different user roles
- Role-based UI components and layouts
- Permission-based data access and features

### Common Development Tasks

**Adding New Features:**
1. Create feature folder in `src/features/[feature-name]/`
2. Add components, pages, services, and types
3. Update routing in `src/routes/` with lazy loading
4. Add tests for new functionality
5. Update Storybook documentation

**Database Changes:**
1. Create Supabase migration
2. Update TypeScript types in `types/database.ts`
3. Update service layer functions
4. Test with mock data first

**Adding New UI Components:**
1. Create in `src/components/ui/` if reusable
2. Use shadcn/ui (Radix UI) as base when possible
3. Add Storybook stories
4. Include accessibility tests

### Debugging Tips
- Use `VITE_DEBUG=true` for detailed logging
- Check browser console for structured logs
- Use React DevTools for component state
- Network tab shows Supabase requests clearly
- Storybook helps isolate component issues

## Advanced Architectural Patterns

### Sophisticated Authentication System

The authentication system implements several advanced patterns critical for production:

**Role Preservation Cache**: Essential caching mechanism that preserves user roles (especially ADMIN) across page refreshes, preventing regression to USER role when Supabase RPC calls fail. This prevents privilege escalation bugs during network issues.

**Secure Storage Migration**: Gradual migration from localStorage to secure cookies with comprehensive cleanup strategies. The system handles both legacy and new storage methods during transition.

**Multi-layered Auth Initialization**: Retry logic with exponential backoff for session validation. Authentication state is preserved during temporary network failures with automatic recovery.

**Permission Cache System**: Dedicated `usePermissionCache` hook with background refresh and optimistic updates for role-based access control.

### Advanced Performance Architecture

**Manual Code Splitting Strategy**: Explicit chunk configuration in vite.config.ts for optimal loading:
- `vendor`: React & React DOM
- `ui`: All Radix UI components (17 different packages)
- `charts`: Recharts
- `forms`: Form-related libraries
- `pdf`: PDF generation utilities
- `supabase`: Supabase client
- `query`: TanStack Query

**Smart Proxy Configuration**: Special handling for admin routes to avoid 404s on refresh. The Vite proxy ensures proper routing for Single Page Application architecture.

### Domain-Specific Business Logic

**Multi-Step Form Context**: `ComparisonContext` manages complex 3-step wizard form state with independent section updates. Each step maintains its own validation state while allowing data flow between steps.

**Coverage-Based Tarification Engine**: Sophisticated pricing system with:
- Fixed amount tariffs for basic coverage
- Formula-based calculations for complex pricing
- Free coverage options for promotional periods
- Vehicle category-specific rates (MTPL, TCM/TCL) following French insurance standards

**French Market Integration**: Specialized for French insurance regulations with contract types (Tiers Simple, Tiers+, Tous Risques) and French-specific validation patterns for phone numbers, dates, and postal codes.

### Error Resilience Patterns

**Supabase Fallback Strategy**: Automatic retry with direct REST API calls when Supabase client fails. This ensures application remains functional during client library issues.

**Graceful Degradation**: UI remains functional even when certain services are unavailable. Components display appropriate fallbacks and retry mechanisms.

**Network Timeout Management**: Proper timeout configuration for critical operations with user feedback for long-running operations.

### Real-time Architecture

**Supabase Realtime Integration**: Built-in real-time subscriptions for live updates across quotes, offers, and notifications. The system handles connection drops and automatic reconnection.

**Chat System Architecture**: Dedicated real-time chat for insurer-client communication with message persistence and typing indicators.

### Security Implementation Details

**Comprehensive Logout Cleanup**: Multi-stage cleanup process including localStorage, sessionStorage, cookies, and Supabase tokens. Ensures no residual authentication data remains on logout.

**CSP with Cryptographic Nonces**: Content Security Policy implemented with per-request nonce generation for maximum XSS protection.

**Audit Trail System**: Structured logging for all user actions with context preservation for security investigations and compliance.

### Testing Architecture

**Multi-Environment Testing**: Development, production, and security-specific test configurations. Tests validate both functional and non-functional requirements.

**Performance Budget Monitoring**: Automated checks for bundle size, loading times, and Web Vitals. CI enforces performance standards.

**Accessibility Integration**: Automated accessibility testing with Lighthouse CI and manual testing protocols for WCAG compliance.

### State Management Patterns

**Context Composition Strategy**: Multiple specialized contexts (Auth, User, Theme, Comparison) with clear separation of concerns and optimized re-renders.

**Optimistic Updates with Rollback**: UI updates immediately with server synchronization and automatic rollback on errors for better user experience.

**Cache Invalidation Strategies**: Smart cache management with background refresh and stale-while-revalidate patterns.

### Key Development Commands

**Single Test Execution**:
```bash
# Run specific test file
npm run test:run path/to/test.test.ts

# Run tests in watch mode for specific file
npm run test path/to/test.test.ts

# Run tests with coverage for specific directory
npm run test:coverage src/features/auth/__tests__/
```

**Database Operations**:
```bash
# Start local Supabase (required for development)
supabase start

# Reset local database
supabase db reset

# Generate database types
supabase gen types typescript --local > types/database.ts

# Apply migrations
supabase db push
```

**Performance Analysis**:
```bash
# Analyze bundle size changes
npm run performance:bundle

# Check against performance budgets
npm run performance:budget

# Detailed performance audit
npm run lighthouse:local
```

### Critical Development Notes

**Always Start Supabase**: The local development environment requires `supabase start` before running `npm run dev`. The application will fail without the local Supabase instance running.

**Role Cache Debugging**: When debugging authentication issues, check the role preservation cache in browser dev tools. Admin role may be cached even after database changes.

**Zod Schema Conflicts**: When modifying validation schemas, never use `required_error` and `errorMap` together in the same Zod schema definition. Use only `errorMap` with proper error code handling.

**Feature Flag Dependencies**: Some features depend on multiple feature flags. Check related flags when debugging missing functionality.

**Environment-Specific Behavior**: The application behaves differently with `VITE_MOCK_DATA=true` vs real Supabase connection. Ensure consistent environment configuration across development team.