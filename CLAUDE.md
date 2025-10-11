# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NOLI Assurance is a comprehensive auto insurance comparison platform for the Ivorian market, built as a modern React application with TypeScript. The platform serves three main user types: individual customers, insurance companies, and administrators.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on port 8080)
npm run dev

# Build for production
npm run build

# Development build
npm run build:dev

# Run linter
npm run lint

# Preview production build
npm run preview
```

Note: The project currently does not have dedicated test commands configured. Testing infrastructure should be added as the project grows.

## Technology Stack

- **Frontend**: React 18.3.1 with TypeScript 5.8.3
- **Build Tool**: Vite 5.4.19 with SWC for fast development builds
- **Routing**: React Router DOM 6.30.1 with nested route patterns
- **UI Framework**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS 3.4.17 with custom animations
- **State Management**: React Query (TanStack Query) 5.83.0 + Context API
- **Forms**: React Hook Form 7.61.1 with Zod validation
- **Icons**: Lucide React 0.462.0
- **Data Fetching**: React Query for caching and synchronization

## Architecture Overview

### 1. Feature-Based Architecture
The application follows a feature-based structure where each business domain is self-contained:

```
src/features/
├── auth/           # Authentication (login, register)
├── comparison/     # Insurance comparison flow and history
├── offers/         # Offer management and display
├── user/           # User-specific features (profile, quotes, policies)
├── insurers/       # Insurer functionality and analytics
├── admin/          # Admin functionality with enterprise features
├── notifications/  # Notification system
├── payments/       # Payment processing
├── tarification/   # Insurance pricing and guarantee management
├── chat/           # Chat functionality
├── quotes/         # Quote management and PDF generation
└── reporting/      # Analytics and reporting
```

### 2. Role-Based Access Control (RBAC)
Three main user roles with dedicated layouts and route protection:
- **USER**: Can compare offers, request quotes, manage policies
- **INSURER**: Can manage offers, respond to quotes, view analytics
- **ADMIN**: Full system access, user management, supervision

Route protection uses `AuthGuard` and `RoleGuard` components for security.

### 3. Multi-Step Application Flow
The insurance comparison follows a structured 3-step process:
1. **Personal Information**: User details, driving history, usage patterns
2. **Vehicle Information**: Car details, registration, value assessment
3. **Insurance Needs**: Coverage preferences, budget, options

### 4. Layout System
- **PublicLayout**: For public pages (home, about, contact)
- **UserLayout**: For regular users with dashboard and quotes
- **InsurerLayout**: For insurance companies with performance metrics
- **AdminLayout**: For administrators with system oversight

## Key Development Patterns

### State Management Strategy
- **Global State**: React Query for server state, Context for auth/user data
- **Form State**: React Hook Form with Zod validation schemas
- **Local State**: useState/useEffect for component-specific state
- **Cache Management**: React Query handles data caching and synchronization

### Component Development
- Uses shadcn/ui as the base component library
- Custom components follow established patterns in `src/components/`
- Consistent theming with CSS variables
- Mobile-first responsive design

### Data Flow
1. **API Layer**: Mock services in `src/data/api/` for development
2. **Repository Pattern**: Business logic in `src/data/repositories/`
3. **State Management**: React Query for server state, Context for client state
4. **Component Layer**: Features consume data through hooks and contexts

## Important File Locations

### Routing & Navigation
- `src/App.tsx`: Main routing configuration with role guards
- `src/layouts/`: Layout components for different user roles
- `src/guards/`: Route protection components

### Authentication & Authorization
- `src/contexts/AuthContext.tsx`: Authentication state management
- `src/contexts/UserContext.tsx`: User data management
- `src/features/auth/`: Authentication pages and services

### Core Features
- `src/features/comparison/`: Multi-step insurance comparison flow and history tracking
- `src/features/offers/`: Offer management and display
- `src/features/user/`: User dashboard, quotes, policies, profile, and notifications
- `src/features/insurers/`: Insurer dashboard, client management, analytics, and communication
- `src/features/admin/`: Admin dashboard and system management
  - **Audit Logs**: Complete activity tracking with filtering and export capabilities
  - **Role Management**: Advanced RBAC with granular permissions across 12 categories
  - **Backup & Restore**: Automated backup system with scheduling and selective restoration
- `src/features/tarification/`: Insurance pricing engine and guarantee management
- `src/features/chat/`: Chat functionality for user communication
- `src/features/quotes/`: Quote management with PDF generation capabilities
- `src/features/payments/`: Payment processing and transaction management
- `src/features/notifications/`: Multi-channel notification system

### Types & Validation
- `src/types/`: TypeScript type definitions including admin types (audit logs, roles, backups)
- `src/lib/`: Utilities and validation schemas

## Development Guidelines

### Code Quality
- TypeScript for type safety (configured with relaxed settings for flexibility)
- ESLint configuration for code consistency
- Component-based architecture with clear separation
- Import aliases using `@/` prefix for clean paths

### Form Development
- Use React Hook Form for all forms
- Validate with Zod schemas
- Implement proper error handling and display
- Use shadcn/ui form components for consistency

### UI Development
- Use Tailwind CSS classes for styling
- Follow established design system
- Use shadcn/ui components when possible
- Implement responsive design with mobile-first approach

### Mock Data Development
The project currently uses mock data for development:
- Mock users, offers, and policies in respective feature directories
- Mock API services that simulate real backend behavior
- Real API integration should be implemented when backend is ready

## Business Logic Implementation

### Authentication System
- JWT-based authentication with mock implementation
- Multi-role login with role-based redirection
- Password strength validation
- Session persistence with localStorage

### Insurance Comparison Engine
- Multi-step form with progress tracking
- Real-time validation and error handling
- Context-based state management for comparison flow
- Mock data for insurance offers and providers

### Offer Management
- CRUD operations for insurance offers
- CSV/Excel import functionality
- Advanced filtering and sorting
- Comparison modal for side-by-side analysis

### Dashboard Systems
- **User Dashboard**: Quote history, policy management, profile settings
- **Insurer Dashboard**: Offer performance, quote management, analytics
- **Admin Dashboard**: System supervision, user management, global statistics, audit logs, role management, backup system

## Configuration Files

### Vite Configuration (`vite.config.ts`)
- Development server on port 8080 with host binding to `::`
- Path aliases for clean imports (`@/` → `./src/`)
- SWC plugin for fast React compilation
- Component tagger for development (enabled only in development mode)
- Environment-based plugin loading

### TypeScript Configuration (`tsconfig.json`)
- Multi-project setup with app and node configurations
- Relaxed strict settings for development flexibility:
  - `noImplicitAny: false` for gradual typing adoption
  - `strictNullChecks: false` for easier development
  - `noUnusedLocals: false` and `noUnusedParameters: false`
  - `skipLibCheck: true` for faster compilation
- Path mapping for import aliases (`@/*` → `./src/*`)
- `allowJs: true` for JavaScript interoperability

### ESLint Configuration
- TypeScript support with React hooks rules
- Code quality and consistency checks

## Testing & Quality

The project is set up for development but currently lacks dedicated test configuration. The architecture supports:
- Unit testing with React Testing Library
- Integration testing for feature flows
- Mock data for development and testing

## Common Development Tasks

### Adding New Features
1. Create feature directory under `src/features/`
2. Follow established structure (components, hooks, services, types)
3. Update routing in `src/App.tsx` if needed
4. Add validation schemas to appropriate files
5. Update navigation in relevant layouts

### Working with Forms
1. Use React Hook Form with Zod validation
2. Implement proper error handling and user feedback
3. Use shadcn/ui form components for consistency
4. Add loading states for async operations

### Working with Authentication
1. Use existing AuthContext and UserContext
2. Implement proper route protection with AuthGuard
3. Use RoleGuard for role-based access control
4. Follow established redirect patterns

### Working with Data
1. Use React Query for data fetching and caching
2. Create service functions in feature directories (see `src/features/admin/services/` for patterns)
3. Implement proper error handling and loading states
4. Use TypeScript interfaces for API responses
5. Mock data patterns are established in `src/features/*/services/*.ts` files

**Current Service Architecture:**
The application contains 18 specialized service files across features:
- `src/features/admin/services/`: userService.ts, analyticsService.ts, roleService.ts, backupService.ts, auditService.ts
- `src/features/comparison/services/`: comparisonHistoryService.ts
- `src/features/insurers/services/`: clientCommunicationService.ts, insurerAnalyticsService.ts, insurerAlertService.ts
- `src/features/payments/services/`: paymentService.ts
- `src/features/quotes/services/`: pdfService.ts
- `src/features/tarification/services/`: guaranteeService.ts, pricingService.ts
- `src/features/chat/services/`: chatService.ts
- `src/features/notifications/services/`: notificationService.ts
- `src/features/user/services/`: quoteService.ts, notificationService.ts

All services follow consistent patterns with mock implementations, comprehensive TypeScript interfaces, and simulated real backend behavior.

### Admin Features Development
1. Follow established patterns in `src/features/admin/services/` for new admin functionality
2. Use comprehensive TypeScript interfaces from `src/types/admin.d.ts`
3. Implement proper filtering, pagination, and export functionality
4. Follow role-based access control patterns when creating new admin features
5. Use consistent UI patterns from existing admin components (dialogs, tables, tabs)

## Performance Considerations

- React Query for efficient data fetching and caching
- Component-based architecture supports code splitting
- Optimized bundle configuration with Vite
- Mock data structure supports easy replacement with real APIs

## Development Environment

The project uses Lovable for development with Git integration:
- **Local Development**: `npm run dev` starts Vite dev server on port 8080
- **Lovable Integration**: Changes via Lovable are auto-committed to the repo
  - Project URL: https://lovable.dev/projects/7636aede-d87c-44de-a0b3-bfb1e99b67b8
- **IDE Support**: Full local development with TypeScript and hot reload
- **Deployment**: Available through Lovable's publishing system (Share -> Publish)
- **Custom Domains**: Supported through Lovable's domain management
- **Git Workflow**: Changes can be made via Lovable, local IDE, or GitHub Codespaces

## Areas for Enhancement

### Testing Infrastructure
- Add Vitest or Jest configuration
- Implement unit tests for critical business logic
- Add integration tests for user flows

### Error Handling
- Implement global error boundaries
- Add comprehensive error reporting
- Improve user feedback for errors

### Performance
- Implement code splitting for large features
- Add loading skeletons for better UX
- Optimize bundle size for production

## Admin System Architecture

The admin system implements enterprise-grade features with complete audit trails and security:

### Audit System (`src/features/admin/services/auditService.ts`)
- Tracks all system activities with 28+ action types
- Supports real-time filtering, export (CSV/JSON/PDF), and security monitoring
- Implements severity-based alerting (LOW, MEDIUM, HIGH, CRITICAL)
- Provides comprehensive statistics and compliance reporting

### Role-Based Access Control (`src/features/admin/services/roleService.ts`)
- Granular permissions across 12 categories (USER_MANAGEMENT, ROLE_MANAGEMENT, etc.)
- Supports role inheritance and per-user permission overrides
- Pre-configured roles: Super Admin, Admin, Insurer Admin, Insurer Agent, User, Auditor
- Complete CRUD operations with conflict prevention

### Backup System (`src/features/admin/services/backupService.ts`)
- Automated scheduling (daily/weekly/monthly) with configurable retention
- Multiple backup types: FULL, INCREMENTAL, DIFFERENTIAL
- Selective restoration with conflict resolution (OVERWRITE/SKIP/MERGE)
- Real-time progress tracking and connection testing
- Compression and encryption with storage quota management

All admin features follow consistent patterns:
- Mock services that simulate real backend behavior
- Comprehensive TypeScript interfaces in `src/types/admin.d.ts`
- Rich UI components with tables, dialogs, tabs, and real-time updates
- Proper error handling and loading states
- Export functionality and statistical dashboards

This codebase represents a well-architected, modern React application with enterprise-grade admin capabilities, excellent separation of concerns, comprehensive documentation, and a solid foundation for scaling the insurance comparison platform.