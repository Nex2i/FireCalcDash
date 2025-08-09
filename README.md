# FIRE Calculator Dashboard

## Overview

A comprehensive frontend-only web application for calculating Financial Independence, Retire Early (FIRE) numbers. The dashboard helps users determine the earliest age they can retire based on their financial inputs, investment projections, and retirement goals. Users can input their current financial situation, expected expenses, and various market assumptions to get detailed projections of when they can achieve financial independence. The application includes features for managing multiple scenarios using browser localStorage, visualizing investment growth over time, and comparing different retirement strategies. No backend server required - all data is stored locally in the browser.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui components for accessible, customizable interface
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Charts**: Recharts for investment growth visualizations
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Data Storage**: Browser localStorage for persistent scenario storage (frontend-only)
- **No Server Required**: Complete client-side application with no backend dependencies
- **Validation**: Zod schemas for consistent data validation
- **Development**: Vite for fast development builds and hot module replacement

### Core Features
- **FIRE Calculations**: Real-time calculations of retirement numbers based on user inputs
- **Scenario Management**: Save, load, and compare multiple retirement scenarios
- **Investment Projections**: Year-by-year projections with compound growth calculations
- **Windfall Management**: Support for one-time financial windfalls at specific ages
- **Interactive Charts**: Visual representation of investment growth vs FIRE targets
- **Responsive Design**: Mobile-friendly interface with adaptive layouts

### Data Models
- **Scenarios**: Store complete FIRE calculation inputs including starting investments, monthly contributions, current age, annual expenses, market assumptions, and windfalls
- **Windfalls**: Separate entities for one-time financial events with amount and age received
- **Calculations**: Real-time computation of FIRE numbers, achievable retirement age, and year-by-year projections

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL driver for Neon database integration
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-kit**: Database migration and schema management tools

### UI Framework
- **@radix-ui/***: Comprehensive set of accessible UI primitives (dialogs, dropdowns, forms, etc.)
- **@tanstack/react-query**: Server state management and data fetching
- **recharts**: Charting library for investment growth visualizations
- **wouter**: Lightweight routing solution

### Styling and Utilities
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant API for component styling
- **clsx**: Conditional className utility
- **date-fns**: Date manipulation and formatting

### Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking
- **esbuild**: Fast JavaScript bundler for production builds
- **tsx**: TypeScript execution for development

### Form Handling
- **react-hook-form**: Performant forms with easy validation
- **@hookform/resolvers**: Integration between React Hook Form and validation libraries
- **zod**: TypeScript-first schema validation

The application is designed with a clean separation between client and server, using shared TypeScript types and validation schemas to ensure data consistency across the full stack.