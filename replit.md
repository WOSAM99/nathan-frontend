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

### Frontend Architecture (React + Tailwind CSS)
- **Framework**: React 19 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state, React Context for auth state
- **Styling**: Tailwind CSS v4 with custom design system tokens
- **UI Components**: shadcn/ui (New York style) with Radix UI primitives
- **Build Tool**: Vite
- **Development**: `npm run dev:client` starts Vite on port 5000

**Design System:**
The application uses a custom architectural minimalist theme defined in `client/src/index.css` with specific color palette (primary #1a1a1a, accent #2563eb, background #f8f9fa), Inter font family, and consistent spacing/radius values.

### Backend (External FastAPI)
The frontend connects to an external FastAPI backend. No Node.js/Express backend is included in this project.

**API Base URL**: Configured via `VITE_API_URL` environment variable (defaults to `http://localhost:8000`)

**API Endpoints:**
- `POST /auth/login` - User authentication
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout
- `GET /doc/projects` - List user projects
- `GET /doc/:property_id` - Get property details (rooms, images, iterations)
- `POST /doc/upload` - Upload documents/images
- `GET /doc/image/:image_id` - Fetch specific image
- `POST /chat/regenerate` - AI design regeneration

### Authentication
- JWT token-based authentication with the FastAPI backend
- Auth context provider on frontend (`client/src/contexts/AuthContext.tsx`)
- API client handles token storage and refresh (`client/src/lib/api.ts`)
- Tokens stored in localStorage with automatic refresh on expiration

### Build & Deployment
- **Client Build**: `npm run build` outputs to `dist/public`
- **Development**: `npm run dev:client` runs Vite dev server on port 5000
- **Preview**: `npm run preview` serves the built app

## Project Structure

```
client/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts (AuthContext)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities (api.ts, utils.ts)
│   ├── pages/          # Page components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ProjectSetupPage.tsx
│   │   ├── DesignWorkspacePage.tsx
│   │   ├── OrganizePage.tsx
│   │   └── MarketCompsPage.tsx
│   ├── App.tsx         # Main app with routing
│   └── index.css       # Global styles and design tokens
├── public/             # Static assets
└── index.html          # Entry HTML
```

## Key Frontend Libraries
- TanStack React Query for API state management
- React Hook Form with Zod resolvers for form validation
- Sonner for toast notifications
- Embla Carousel for image galleries
- react-resizable-panels for split view comparisons
- date-fns for date formatting
- Framer Motion for animations
- Lucide React for icons
