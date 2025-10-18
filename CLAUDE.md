# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based insurance comparison platform called "Noli" built with TypeScript, Vite, and shadcn/ui components. The application allows users to compare insurance offers, manage policies, and provides role-based interfaces for users, insurers, and administrators.

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
# Start development server (runs on localhost:8080)
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview

# Testing
npm run test              # Run tests in watch mode
npm run test:ui           # Run tests with UI interface
npm run test:run          # Run tests once
npm run test:coverage     # Run tests with coverage report
```

## Architecture Overview

### Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── common/         # Shared components (Footer, etc.)
│   ├── home/           # Homepage specific components
│   └── insurer/        # Insurer-specific components
├── features/           # Feature-based modules
│   ├── admin/          # Admin functionality
│   ├── auth/           # Authentication
│   ├── chat/           # Chat system
│   ├── comparison/     # Insurance comparison flow
│   ├── insurers/       # Insurer management
│   ├── notifications/  # Notification system
│   ├── offers/         # Offer management
│   ├── payments/       # Payment processing
│   ├── quotes/         # Quote management
│   ├── tarification/   # Pricing rules
│   └── user/           # User management
├── contexts/           # React contexts
├── guards/             # Route protection
├── layouts/            # Page layouts
├── pages/              # Route components
│   ├── admin/          # Admin pages
│   ├── insurer/        # Insurer pages
│   ├── public/         # Public pages
│   └── user/           # User pages
├── services/           # API services
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Key Architectural Patterns

1. **Feature-based organization**: Code is organized by business features rather than file types
2. **Role-based access control**: Three main roles (USER, INSURER, ADMIN) with protected routes
3. **Layout-based routing**: Different layouts for different user types
4. **Context-based state management**: Global state managed through React contexts

### Authentication & Authorization

- **AuthContext** (`src/contexts/AuthContext.tsx`): Handles user authentication state
- **AuthGuard** (`src/guards/AuthGuard.tsx`): Protects routes based on user roles
- **RoleGuard** (`src/guards/RoleGuard.tsx`): Additional role-based protection
- **Supabase Auth**: Primary authentication provider with email/password and social login
- Token-based authentication with localStorage persistence
- Automatic role-based redirects to appropriate dashboards
- Row Level Security (RLS) implemented in Supabase for data access control

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
5. **Admin Dashboard**: User management, supervision, analytics, system configuration

### UI Components

- Uses shadcn/ui components extensively
- Custom components follow the same design patterns
- Responsive design with Tailwind CSS
- Dark mode support via ThemeContext
- Consistent styling with `cn()` utility function

### Data Flow

- **Supabase Client**: Primary database and authentication client
- API services in `src/data/api/` (though some services are in `src/features/*/services/`)
- TanStack Query for server state management and caching
- React contexts for global client state
- Form state managed with React Hook Form
- Database migrations in `/supabase/migrations/` for schema management

### State Management

- **AuthContext**: Authentication state and user data
- **UserContext**: Additional user-related state
- **ThemeContext**: Theme preferences (dark/light mode)
- **Feature contexts**: Some features have dedicated contexts (e.g., ComparisonContext)

### Development Notes

- Uses absolute imports with `@/` prefix
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Components follow functional component pattern with hooks
- Consistent error handling patterns across services
- **Environment Configuration**: Use `.env.local` for development, `.env.production` for production
- **Supabase Setup**: Configure Supabase URL and keys in environment variables
- **Additional Dependencies**:
  - `papaparse` for CSV processing
  - `react-day-picker` for date handling
  - `input-otp` for OTP inputs
  - `vaul` for mobile-friendly modals
  - `lovable-tagger` for development component tagging

### Testing

- **Framework**: Vitest with jsdom environment
- **Testing Library**: React Testing Library for component testing
- **Configuration**: `vitest.config.ts` with React plugin and path aliases
- **Test Setup**: `src/test/setup.ts` for global test configuration
- **Coverage**: Built-in Vitest coverage reporting
- **Test Files**: Place tests in `__tests__/` directories or `.test.ts/.test.tsx` files

### Build & Deployment

- Vite for fast development and optimized builds
- Production builds optimized with manual chunking (vendor, router, ui, charts, forms, utils, pdf, supabase, query)
- Development server runs on `localhost:8080` with host binding to `::`
- Source maps enabled in development mode
- Tree-shaking and static asset optimization
- Environment-specific configurations (.env.local, .env.production)
- **Supabase Integration**: Full database setup with migrations, RLS policies, and auth functions