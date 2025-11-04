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
│   ├── ui/              # shadcn/ui components (42+ components)
│   ├── common/          # Shared components (Header, Footer, etc.)
│   ├── forms/           # Form components
│   └── layout/          # Layout components
├── features/            # Feature-based modules
│   ├── auth/           # Authentication flow
│   ├── comparison/     # Insurance comparison process
│   ├── offers/         # Offer management
│   ├── insurers/       # Insurer dashboard
│   └── admin/          # Admin functionality
├── pages/              # Route components
│   ├── public/         # Public pages
│   ├── admin/          # Admin pages
│   ├── insurer/        # Insurer pages
│   └── user/           # User pages
├── services/           # API services and business logic
├── lib/                # Utilities and configurations
├── types/              # TypeScript type definitions
├── hooks/              # Custom React hooks
├── contexts/           # React contexts
├── guards/             # Route guards (RBAC)
├── layouts/            # Page layouts
└── config/             # App configuration
```

### Key Architectural Patterns

**Feature-Driven Development**: Code is organized by business features (auth, comparison, offers, etc.) rather than technical layers.

**Component Architecture**:
- Base UI components in `components/ui/` (shadcn/ui)
- Business components in respective feature folders
- Shared components in `components/common/`

**State Management**:
- Authentication state via `AuthContext`
- User data via `UserContext`
- Server state with TanStack Query
- Form state with React Hook Form + Zod

**Security Architecture**:
- Row Level Security (RLS) with Supabase
- Role-based access control (USER/INSURER/ADMIN)
- httpOnly cookies for auth tokens
- Content Security Policy with nonces

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
**Coverage Target**: 90%+ maintained

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

### Common Development Tasks

**Adding New Features:**
1. Create feature folder in `src/features/[feature-name]/`
2. Add components, pages, services, and types
3. Update routing in route configuration
4. Add tests for new functionality
5. Update Storybook documentation

**Database Changes:**
1. Create Supabase migration
2. Update TypeScript types in `types/database.ts`
3. Update service layer functions
4. Test with mock data first

**Adding New UI Components:**
1. Create in `src/components/ui/` if reusable
2. Use shadcn/ui as base when possible
3. Add Storybook stories
4. Include accessibility tests

### Debugging Tips
- Use `VITE_DEBUG=true` for detailed logging
- Check browser console for structured logs
- Use React DevTools for component state
- Network tab shows Supabase requests clearly
- Storybook helps isolate component issues