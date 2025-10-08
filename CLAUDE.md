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
├── comparison/     # Insurance comparison flow
├── offers/         # Offer management
├── user/           # User-specific features (profile, quotes, policies)
├── insurers/       # Insurer functionality
├── admin/          # Admin functionality
├── notifications/  # Notification system
├── payments/       # Payment processing
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
- `src/features/comparison/`: Multi-step insurance comparison flow
- `src/features/offers/`: Offer management and display
- `src/features/user/`: User dashboard, quotes, policies, profile
- `src/features/insurers/`: Insurer dashboard and management
- `src/features/admin/`: Admin dashboard and system management

### Types & Validation
- `src/types/`: TypeScript type definitions
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
- **Admin Dashboard**: System supervision, user management, global statistics

## Configuration Files

### Vite Configuration (`vite.config.ts`)
- Development server on port 8080
- Path aliases for clean imports (`@/` → `./src/`)
- SWC plugin for fast compilation
- Component tagger for development

### TypeScript Configuration
- Multi-project setup with app and node configurations
- Relaxed strict settings for development flexibility
- Path mapping for import aliases

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
2. Create service functions in feature directories
3. Implement proper error handling and loading states
4. Use TypeScript interfaces for API responses

## Performance Considerations

- React Query for efficient data fetching and caching
- Component-based architecture supports code splitting
- Optimized bundle configuration with Vite
- Mock data structure supports easy replacement with real APIs

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

This codebase represents a well-architected, modern React application with excellent separation of concerns, comprehensive documentation, and a solid foundation for scaling the insurance comparison platform.