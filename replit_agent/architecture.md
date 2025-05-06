# Architecture Overview - Healthcare Integration Tools (HIT)

## 1. Overview

Healthcare Integration Tools (HIT) is a comprehensive platform designed to help healthcare organizations evaluate, visualize, and improve their integration capabilities. The application provides multiple tools including assessment tools, visualization components, reference guides, and interactive diagrams for healthcare system integration.

The project follows a monorepo structure with a clear separation between client and server components. It uses a modern JavaScript/TypeScript stack with React for the frontend and Express for the backend, all bundled and served using Vite.

### Key Features

- Integration Maturity Assessment Tool
- System Integration Visualizations
- HL7 Reference Guides
- Integration Flow Diagrams
- Healthcare Integration Resources

### Target Users

- Healthcare IT Directors and Managers
- System Analysts
- Technical Developers
- Project Teams working on healthcare integration

## 2. System Architecture

The application follows a client-server architecture with the following key components:

### High-Level Architecture

```
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│               │         │               │         │               │
│  React Client │ ◄─────► │ Express Server│ ◄─────► │ PostgreSQL DB │
│               │         │               │         │               │
└───────────────┘         └───────────────┘         └───────────────┘
```

### Technology Stack

- **Frontend**: React, Typescript, TailwindCSS, shadcn/ui, Radix UI
- **Data Visualization**: D3.js, Observable Plot
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Build/DevTools**: Vite, ESBuild, TypeScript
- **Deployment**: Replit deployment configuration

## 3. Key Components

### 3.1 Frontend Architecture

The frontend is built with React and TypeScript, organized into the following structure:

- **Pages**: Separate page components for different sections of the application
  - Assessment tool
  - Results visualization
  - Integration flow diagrams
  - Reference guides
  - Resources
  - Visualization demos

- **Components**: Reusable UI components including:
  - Form components (assessment-form, question-item)
  - Visualization components (d3-bar-chart, d3-pie-chart, network-diagram)
  - UI components (based on shadcn/ui library)

- **Hooks**: Custom React hooks for toast notifications, mobile detection
  
- **Lib**: Utility functions and data definitions
  - Query client setup
  - Assessment form data structure
  - General utility functions

- **Routing**: Uses Wouter (lightweight router) for page navigation

### 3.2 Backend Architecture

The backend is built with Express.js and provides:

- API endpoints for health checks and future functionality
- Static file serving of the React frontend
- Development middleware for Vite in development mode

The server architecture is minimalistic as most of the application logic occurs client-side, with data stored in sessionStorage rather than requiring complex database interactions.

### 3.3 Data Storage

The application primarily uses client-side storage (sessionStorage) for the assessment tool data. However, it includes a PostgreSQL database with Drizzle ORM for future expansion:

- **Schema**: Contains a minimal user model for future authentication
- **Storage Service**: Implements an interface for database operations with both DB and in-memory implementations

### 3.4 Visualization Components

The application includes multiple visualization components:

- **D3.js Visualizations**: Bar charts, pie charts, radar charts for data visualization
- **Network Diagrams**: For displaying system integration relationships
- **Observable Plot**: For modern, reactive data visualization
- **Sankey Diagrams**: For data flow visualization
- **Integration Matrix**: For mapping connections between systems

## 4. Data Flow

### 4.1 Assessment Tool Flow

1. User completes the assessment form sections
2. Form data is processed client-side to calculate integration maturity scores
3. Results are stored in sessionStorage
4. User is redirected to results page with visualizations and recommendations
5. Results can be exported as PDF

### 4.2 Visualization Flow

1. User inputs system and connection data
2. Client-side components transform the data into visualization-ready format
3. D3.js or Observable Plot renders the visualizations
4. User can interact with and export the visualizations

### 4.3 Server-Client Communication

Currently minimal, as most operations happen client-side. The server primarily:
- Serves the static frontend application
- Provides a health check endpoint
- Includes scaffolding for future API expansion

## 5. External Dependencies

### 5.1 UI Components

- **Radix UI**: Low-level, accessible UI component primitives
- **shadcn/ui**: Component collection built on Radix UI
- **TailwindCSS**: Utility-first CSS framework for styling

### 5.2 Data Visualization

- **D3.js**: For creating custom data visualizations
- **Observable Plot**: Higher-level visualization library
- **Observable stdlib**: Standard library for Observable notebooks integration

### 5.3 Form Handling

- **React Hook Form**: For form state management
- **Zod**: For form validation schema definitions

### 5.4 Database

- **Drizzle ORM**: TypeScript ORM for PostgreSQL
- **NeonDB Serverless**: Serverless PostgreSQL provider

## 6. Deployment Strategy

The application is configured for deployment on Replit with the following strategy:

### 6.1 Build Process

1. Vite builds the React frontend into static assets
2. ESBuild bundles the server code
3. The bundle includes both frontend and backend code

### 6.2 Runtime Environment

- **Development**: Uses Vite dev server with HMR for frontend and tsx for server
- **Production**: Serves static assets from the Express server

### 6.3 Database Strategy

Currently using a minimal database schema with provision for future expansion. The database is configured through environment variables with Drizzle ORM handling the database connections.

### 6.4 Scaling Considerations

- The application is designed to be lightweight with minimal server-side processing
- Most compute-intensive operations (visualizations, assessments) happen client-side
- The server is stateless, allowing for horizontal scaling if needed

## 7. Future Architecture Considerations

The current architecture suggests several areas for future expansion:

1. **User Authentication**: The database schema includes a users table, indicating plans for authentication
2. **Persistent Assessment Storage**: Moving from sessionStorage to database storage for assessments
3. **API Expansion**: The routes file includes scaffolding for additional API endpoints
4. **Additional Visualization Tools**: The codebase is structured to easily add more visualization components

## 8. Security Considerations

- Client-side only storage currently limits the security concerns
- Database schema includes password fields, suggesting future authentication needs
- No evident encryption or secure storage mechanisms for sensitive data yet

## 9. Testing Strategy

No explicit testing files are present in the repository, suggesting that testing may be a future consideration or is handled through external processes.