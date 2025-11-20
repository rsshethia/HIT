# Healthcare Integration Tools (HIT) - replit.md

## Overview

Healthcare Integration Tools (HIT) is a comprehensive web application designed to help healthcare organizations evaluate, visualize, and improve their integration capabilities. The platform provides assessment tools, visualizations, and educational resources across clinical, business, and technical perspectives to support healthcare IT professionals in understanding and optimizing their integration landscape.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: TailwindCSS with custom theme configuration
- **Data Visualization**: D3.js and Observable Plot for interactive charts and diagrams
- **Routing**: Wouter for client-side routing
- **State Management**: React Query for server state, React hooks for local state
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Development**: TypeScript with tsx for development execution
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL
- **Authentication**: Basic user schema prepared (currently using in-memory storage)

### Development Setup
- **Environment**: Replit with Node.js 20, Web, and PostgreSQL 16 modules
- **Hot Reload**: Vite dev server with HMR
- **Build Process**: Vite for client build, esbuild for server bundling

## Key Components

### Assessment System
- **Maturity Assessment Tool**: Multi-section questionnaire evaluating integration capabilities
- **Progress Tracking**: Real-time completion tracking with visual indicators
- **Results Generation**: Scoring algorithm with personalized recommendations
- **Data Persistence**: Client-side storage using sessionStorage

### Visualization Components
- **D3.js Charts**: Custom pie charts, bar charts, and radar charts
- **Observable Plot**: Integration for advanced data visualization
- **Network Diagrams**: System integration mapping with D3 force layouts
- **Sankey Diagrams**: Data flow visualization between systems
- **Integration Matrix**: System connection mapping with quality indicators

### Educational Resources
- **HL7 Reference Guides**: Quick reference for common message types
- **Integration Mapping Tool**: System connection mapping with network diagrams and data flow visualization
- **Interactive Games**: HL7 Flow Game and Clinical Integration Play for learning
- **Best Practice Guides**: Organization, system, and interface level guidance

### UI Components
- **Design System**: Consistent component library using shadcn/ui
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Accessibility**: Built on Radix UI primitives for ARIA compliance
- **Theme System**: Professional theme with customizable colors and radius

## Data Flow

### Assessment Workflow
1. User completes multi-section assessment form
2. Answers stored in React state and validated client-side
3. Form submission triggers scoring calculation
4. Results stored in sessionStorage for persistence
5. User redirected to results page with detailed analysis

### Visualization Pipeline
1. User configures systems and connections through form inputs
2. Data transformed into appropriate format for chosen visualization
3. D3.js or Observable Plot renders interactive visualization
4. Export functionality generates PNG/PDF downloads

### Resource Navigation
1. Landing page provides overview of available tools
2. Resources page acts as hub for all features
3. Individual tool pages provide focused functionality
4. Navigation maintained through Wouter routing

## External Dependencies

### Core Libraries
- **React Ecosystem**: React 18, React DOM, React Query for state management
- **UI Framework**: Radix UI primitives, shadcn/ui components, TailwindCSS
- **Data Visualization**: D3.js v7, Observable Plot, custom chart components
- **Development Tools**: TypeScript, Vite, tsx, esbuild for builds

### Database & Backend
- **Database**: Neon serverless PostgreSQL with Drizzle ORM
- **Server**: Express.js with TypeScript support
- **Email**: SendGrid integration for notifications (configured but not actively used)

### Build & Development
- **Build Tools**: Vite for frontend, esbuild for backend bundling
- **Development**: Hot module replacement, TypeScript checking
- **Styling**: PostCSS with TailwindCSS and Autoprefixer

## Deployment Strategy

### Replit Configuration
- **Runtime**: Node.js 20 with web and PostgreSQL modules
- **Development Command**: `npm run dev` (starts tsx server)
- **Build Process**: `npm run build` (Vite + esbuild bundling)
- **Production Command**: `npm run start` (runs built server)
- **Port Configuration**: Internal port 5000, external port 80

### Database Setup
- **Provider**: Neon serverless PostgreSQL via DATABASE_URL environment variable
- **Schema Management**: Drizzle migrations in ./migrations directory
- **Schema Definition**: Shared schema in ./shared/schema.ts

### Build Output
- **Client**: Built to ./dist/public for static serving
- **Server**: Bundled to ./dist/index.js for production
- **Assets**: Static assets served from server/public in development

## Changelog

Changelog:
- June 19, 2025. Initial setup
- June 19, 2025. Enhanced Sheet to Booklet tool with PDF generation using jsPDF library, added comprehensive sample files with authentic healthcare integration data, implemented "Try Sample Data" functionality for instant testing, and created downloadable sample PDF output for Integration Architects
- January 3, 2025. Added Integration Diagram Tool using tldraw library for interactive healthcare system architecture drawings, workflow visualizations, and integration documentation with professional templates for common patterns
- November 3, 2025. Added PlantUML Mapping Tool for creating professional UML diagrams using text-based PlantUML notation, featuring healthcare-specific templates for sequence diagrams, component architectures, and workflow visualizations


## User Preferences

Preferred communication style: Simple, everyday language.