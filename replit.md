# Atelier - AI Interior Design Studio

## Overview

Atelier is an AI-powered interior design studio application that helps users analyze and reimagine interior spaces. The platform allows users to upload property photos, organize them by room type, and use AI-powered chat to generate design suggestions and rendered variations. The application follows an architectural minimalist visual identity with a clean, professional interface.

**Core Features:**
- User authentication (login/register)
- Project/property management dashboard
- Photo upload and organization by room categories
- AI-powered design workspace with before/after comparison views
- Chat interface for AI design consultations
- Document processing for MLS listings and property comparisons

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state, React Context for auth state
- **Styling**: Tailwind CSS v4 with custom design system tokens
- **UI Components**: shadcn/ui (New York style) with Radix UI primitives
- **Build Tool**: Vite

**Design System:**
The application uses a custom architectural minimalist theme defined in `client/src/index.css` with specific color palette (primary #1a1a1a, accent #2563eb, background #f8f9fa), Inter font family, and consistent spacing/radius values.

### Backend Architecture
- **Framework**: Express.js 5 with TypeScript
- **HTTP Server**: Node.js native HTTP server
- **Development**: Vite dev server integration with HMR
- **Static Serving**: Express static middleware for production builds

**API Design:**
Routes are registered in `server/routes.ts` and should be prefixed with `/api`. The backend uses a storage interface pattern (`server/storage.ts`) for data operations, currently implemented with in-memory storage but designed to be swapped for database storage.

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with migrations output to `./migrations`
- **Validation**: Zod schemas generated from Drizzle schemas using drizzle-zod

**Current Schema:**
- Users table with id, username, password fields
- Schema uses UUID primary keys with PostgreSQL's `gen_random_uuid()`

### Authentication
- Session-based authentication pattern with Express sessions
- Auth context provider on frontend (`client/src/contexts/AuthContext.tsx`)
- API client handles token storage and refresh (`client/src/lib/api.ts`)
- Designed to integrate with connect-pg-simple for PostgreSQL session storage

### Build & Deployment
- **Client Build**: Vite outputs to `dist/public`
- **Server Build**: esbuild bundles server to `dist/index.cjs`
- **Scripts**: `npm run dev` for development, `npm run build` + `npm start` for production
- **Database Sync**: `npm run db:push` to push schema changes

## External Dependencies

### Core Runtime Dependencies
- **Database**: PostgreSQL (connection via DATABASE_URL environment variable)
- **Session Store**: connect-pg-simple for PostgreSQL-backed sessions

### External API Integrations
The frontend API client (`client/src/lib/api.ts`) is configured to connect to an external backend API:
- **Base URL**: Configured via `VITE_API_URL` environment variable (defaults to `http://localhost:8000`)
- **Endpoints**: Auth (login/register), projects/properties CRUD, document upload, chat interface

### Key Frontend Libraries
- TanStack React Query for API state management
- React Hook Form with Zod resolvers for form validation
- Sonner for toast notifications
- Embla Carousel for image galleries
- react-resizable-panels for split view comparisons
- date-fns for date formatting

### Key Backend Libraries
- multer for file upload handling
- jsonwebtoken for JWT token operations
- passport/passport-local for authentication strategies
- ws for WebSocket support
- @google/generative-ai and openai for AI integrations