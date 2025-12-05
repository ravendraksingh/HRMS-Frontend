# HRMS Frontend - Technical Architecture Document

## Executive Summary

This document provides a comprehensive overview of the technical architecture of the HRMS (Human Resource Management System) Frontend application. The application is built using modern web technologies following industry best practices, designed to be scalable, maintainable, and secure.

**Version:** 1.0  
**Last Updated:** 2024  
**Document Type:** Technical Architecture  
**Audience:** Business Stakeholders, Technical Teams, Architects

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Patterns](#3-architecture-patterns)
4. [Application Structure](#4-application-structure)
5. [Security Architecture](#5-security-architecture)
6. [Data Flow & State Management](#6-data-flow--state-management)
7. [API Integration](#7-api-integration)
8. [UI/UX Architecture](#8-uiux-architecture)
9. [Performance & Optimization](#9-performance--optimization)
10. [Best Practices Assessment](#10-best-practices-assessment)
11. [Recommendations & Roadmap](#11-recommendations--roadmap)

---

## 1. System Overview

### 1.1 Purpose
The HRMS Frontend is a comprehensive web application designed to manage human resources operations including:
- Employee management and onboarding
- Attendance tracking and corrections
- Leave management
- Payroll and salary management
- Performance management
- Holiday calendar management
- Organizational structure management (departments, locations, roles)

### 1.2 Application Type
- **Type:** Single Page Application (SPA) with Server-Side Rendering capabilities
- **Framework:** Next.js 16.0.1 (React-based)
- **Deployment Model:** Client-Server Architecture
- **User Roles:** Admin, HR, Manager, Employee (ESS - Employee Self Service)

### 1.3 Key Characteristics
- **Responsive Design:** Mobile-first approach with responsive layouts
- **Role-Based Access Control:** Multi-role system with granular permissions
- **Real-time Updates:** Dynamic data fetching and state management
- **Secure Authentication:** JWT-based authentication with refresh token mechanism

---

## 2. Technology Stack

### 2.1 Core Framework & Libraries

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Next.js | 16.0.1 | React framework with SSR/SSG capabilities |
| **UI Library** | React | 19.2.0 | Component-based UI library |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS framework |
| **UI Components** | Radix UI | Latest | Accessible component primitives |
| **Component Library** | shadcn/ui | Latest | Pre-built component system |
| **Icons** | Lucide React | 0.548.0 | Icon library |

### 2.2 State Management & Data Fetching

| Technology | Purpose | Status |
|------------|---------|--------|
| React Context API | Authentication state, global UI state | ✅ Active |
| Redux Toolkit | Global state management | ⚠️ Installed but not actively used |
| Axios | HTTP client for API calls | ✅ Active |
| React Hook Form | Form state management | ✅ Active |
| Zod | Schema validation | ✅ Active |

### 2.3 Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting and quality |
| Next.js Turbo | Fast development builds |
| Webpack | Module bundling |

### 2.4 Additional Libraries

- **date-fns:** Date manipulation and formatting
- **recharts:** Data visualization and charts
- **react-leaflet:** Map integration for location features
- **sonner:** Toast notifications
- **jsonwebtoken:** JWT token handling
- **bcryptjs:** Password hashing (if needed client-side)

---

## 3. Architecture Patterns

### 3.1 Overall Architecture Pattern

**Pattern:** Layered Architecture with Component-Based Design

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Pages, Components, UI Elements)        │
├─────────────────────────────────────────┤
│         Application Layer                │
│  (Business Logic, State Management)     │
├─────────────────────────────────────────┤
│         Service Layer                   │
│  (API Clients, Data Fetching)           │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
│  (Auth, Storage, Utilities)            │
└─────────────────────────────────────────┘
```

### 3.2 Design Patterns Implemented

#### ✅ **Component-Based Architecture**
- Reusable, composable React components
- Separation of concerns (presentation vs. logic)
- Component library structure (UI components in `/components/ui`)

#### ✅ **Provider Pattern**
- `AuthProvider` for authentication context
- `ThemeProvider` for theme management
- `SidebarProvider` for UI state

#### ✅ **Repository Pattern**
- API clients abstract backend communication
- `externalApiClient.js` - External API calls
- `internalApiClient.js` - Internal API routes

#### ✅ **Middleware Pattern**
- Request/Response interceptors in Axios
- Token refresh mechanism
- Error handling middleware

#### ✅ **Route Guards**
- Client-side route protection (`RouteGuard`)
- Server-side authentication (`requireAuth`, `requireRole`)
- Role-based access control

### 3.3 Architectural Strengths

1. **Separation of Concerns:** Clear separation between UI, business logic, and data access
2. **Modularity:** Well-organized folder structure with clear boundaries
3. **Reusability:** Shared components and utilities
4. **Scalability:** Component-based architecture supports growth
5. **Security:** Multi-layer authentication and authorization

---

## 4. Application Structure

### 4.1 Directory Structure

```
HRMS-Frontend/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin module pages
│   ├── hr/                       # HR module pages
│   ├── manager/                  # Manager module pages
│   ├── ess/                      # Employee Self Service pages
│   ├── api/                      # API routes (Next.js API routes)
│   ├── services/                 # API client services
│   ├── layout.js                 # Root layout
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── common/                   # Shared/common components
│   ├── attendance/               # Attendance-specific components
│   ├── employees/                # Employee-related components
│   └── managers/                 # Manager-specific components
├── lib/                          # Utility functions and helpers
├── hooks/                        # Custom React hooks
├── public/                       # Static assets
└── docs/                         # Documentation
```

### 4.2 Module Organization

#### **Role-Based Module Structure**
- **`/app/admin`:** Administrative functions (users, roles, organization, departments, locations)
- **`/app/hr`:** HR operations (employee management, leave types, holidays, onboarding)
- **`/app/manager`:** Manager functions (team management, approvals)
- **`/app/ess`:** Employee self-service (personal details, leave requests, attendance)

#### **Component Organization**
- **`/components/ui`:** Reusable UI primitives (buttons, inputs, cards)
- **`/components/common`:** Shared business components (AuthContext, RouteGuard, AppShell)
- **`/components/[feature]`:** Feature-specific components

### 4.3 Code Organization Best Practices

✅ **Strengths:**
- Clear separation by feature/role
- Consistent naming conventions
- Reusable component library
- Centralized utility functions

⚠️ **Areas for Improvement:**
- Consider feature-based folder structure for larger modules
- Add barrel exports (`index.js`) for cleaner imports
- Consider TypeScript migration for better type safety

---

## 5. Security Architecture

### 5.1 Authentication Flow

```
User Login
    ↓
POST /api/auth/login
    ↓
Backend validates credentials
    ↓
Returns JWT tokens (access + refresh)
    ↓
Tokens stored in sessionStorage
    ↓
Access token included in API requests
    ↓
Token refresh on 401 errors
```

### 5.2 Authentication Mechanisms

#### **Token Storage**
- **Method:** Browser `sessionStorage`
- **Tokens:** Access Token (JWT) + Refresh Token
- **Security:** Tokens cleared on browser close
- **Memory Caching:** In-memory cache for performance

#### **Token Refresh Strategy**
- Automatic refresh on 401 errors
- Queue mechanism prevents multiple simultaneous refreshes
- Automatic redirect to login on refresh failure

### 5.3 Authorization

#### **Role-Based Access Control (RBAC)**
- **Client-Side:** `RouteGuard` component checks user roles
- **Server-Side:** `requireRole()` function in API routes
- **Flexible:** Supports single role or array of roles

#### **Route Protection**
- Public routes: `/login`
- Protected routes: All other routes require authentication
- Role-specific routes: Admin, HR, Manager, ESS modules

### 5.4 Security Best Practices

✅ **Implemented:**
- JWT token-based authentication
- Token refresh mechanism
- Secure token storage (sessionStorage)
- CORS handling with credentials
- Input validation (Zod schemas)
- XSS protection (React's built-in escaping)

⚠️ **Recommendations:**
- Consider httpOnly cookies for token storage (more secure)
- Implement CSRF protection
- Add rate limiting on API routes
- Implement Content Security Policy (CSP)
- Add security headers (HSTS, X-Frame-Options)

---

## 6. Data Flow & State Management

### 6.1 State Management Approach

**Primary Method:** React Context API + Local Component State

```
┌─────────────────┐
│  AuthContext     │  ← Global authentication state
│  (Context API)   │
└─────────────────┘
         ↓
┌─────────────────┐
│  Component State │  ← Local UI state
│  (useState)      │
└─────────────────┘
         ↓
┌─────────────────┐
│  API Calls      │  ← Data fetching
│  (Axios)        │
└─────────────────┘
```

### 6.2 State Management Analysis

#### **Current Implementation:**
- ✅ React Context for authentication
- ✅ Local state for component-specific data
- ✅ Server state via API calls (no caching library)

#### **Redux Toolkit Status:**
- ⚠️ Installed but not actively used
- Consider removing if not needed, or implementing for complex state

### 6.3 Data Fetching Patterns

#### **API Client Pattern**
```javascript
// External API calls
externalApiClient.get('/employees')
externalApiClient.post('/employees', data)
externalApiClient.patch('/employees/:id', data)
externalApiClient.delete('/employees/:id')
```

#### **Request/Response Flow**
1. Component triggers action
2. API client adds auth token
3. Request sent to backend
4. Response interceptor handles errors
5. Token refresh on 401
6. Data returned to component

### 6.4 Recommendations

✅ **Current Approach is Good For:**
- Small to medium applications
- Simple state requirements
- Fast development

⚠️ **Consider Adding:**
- **React Query / TanStack Query:** For server state management, caching, and synchronization
- **Zustand:** Lightweight alternative to Redux if global state grows
- **SWR:** Data fetching library with caching and revalidation

---

## 7. API Integration

### 7.1 API Architecture

**Pattern:** Hybrid API Approach

1. **Next.js API Routes** (`/app/api/*`)
   - Proxy endpoints
   - Authentication handling
   - Server-side operations

2. **External API Client** (`externalApiClient.js`)
   - Direct backend communication
   - Client-side API calls
   - Token management

### 7.2 API Client Features

#### **Request Interceptor**
- Automatically adds JWT token to headers
- Handles token retrieval from storage

#### **Response Interceptor**
- Handles 401 errors (token refresh)
- Standardizes error responses
- Queues requests during token refresh

### 7.3 Error Handling

```javascript
// Standardized error format
{
  message: "Error message",
  code: "ERROR_CODE",
  status: 404
}
```

✅ **Strengths:**
- Centralized error handling
- User-friendly error messages
- Toast notifications for errors

### 7.4 API Endpoints Structure

**Backend API Base URL:** Configurable via `NEXT_PUBLIC_BACKEND_API_BASE_URL`

**Common Endpoints:**
- `/auth/login` - Authentication
- `/auth/refresh` - Token refresh
- `/users` - User management
- `/employees` - Employee management
- `/attendance` - Attendance tracking
- `/leave` - Leave management
- `/financial-years` - Financial year management

---

## 8. UI/UX Architecture

### 8.1 Design System

**Component Library:** shadcn/ui (built on Radix UI)

**Design Principles:**
- ✅ Accessibility-first (Radix UI primitives)
- ✅ Consistent styling (Tailwind CSS)
- ✅ Responsive design
- ✅ Modern UI patterns

### 8.2 UI Component Structure

```
components/
├── ui/                    # Base UI components
│   ├── button.jsx
│   ├── input.jsx
│   ├── card.jsx
│   └── ...
├── common/                # Business components
│   ├── AppShell.js
│   ├── Navbar.js
│   ├── AppSidebar.js
│   └── ...
└── [feature]/             # Feature-specific components
```

### 8.3 Layout Architecture

**App Shell Pattern:**
```
AppShell
├── Sidebar (conditional)
├── Navbar (conditional)
└── Page Content
```

**Conditional Rendering:**
- Shell only shown for authenticated users
- Public routes (login) don't show shell

### 8.4 Responsive Design

- **Mobile-First:** Tailwind CSS responsive utilities
- **Breakpoints:** Standard Tailwind breakpoints (sm, md, lg, xl)
- **Layout:** Flexible grid system

### 8.5 User Experience Features

✅ **Implemented:**
- Loading states
- Error states
- Toast notifications
- Form validation
- Accessible components

---

## 9. Performance & Optimization

### 9.1 Next.js Optimizations

✅ **Implemented:**
- React Strict Mode
- Server-Side Rendering (SSR) capabilities
- Code splitting (automatic with Next.js)
- Image optimization (Next.js Image component ready)

### 9.2 Code Optimization

✅ **Current:**
- Component-based code splitting
- Lazy loading capabilities
- Webpack configuration for client/server separation

⚠️ **Recommendations:**
- Implement dynamic imports for large components
- Add React.memo for expensive components
- Implement virtual scrolling for large lists
- Add service worker for offline capabilities

### 9.3 Bundle Analysis

**Current Build:**
- Uses Webpack for bundling
- Client/server code separation configured

**Recommendations:**
- Regular bundle size analysis
- Tree shaking optimization
- Remove unused dependencies (Redux if not used)

### 9.4 Caching Strategy

**Current:**
- No explicit caching strategy
- Browser default caching

**Recommendations:**
- Implement React Query for API response caching
- Add service worker for asset caching
- Configure CDN for static assets

---

## 10. Best Practices Assessment

### 10.1 Code Quality ✅

| Practice | Status | Notes |
|----------|--------|-------|
| ESLint Configuration | ✅ | Next.js ESLint config |
| Code Organization | ✅ | Well-structured folders |
| Naming Conventions | ✅ | Consistent naming |
| Component Reusability | ✅ | Good component library |
| Error Handling | ✅ | Centralized error handling |

### 10.2 Security ✅

| Practice | Status | Notes |
|----------|--------|-------|
| Authentication | ✅ | JWT with refresh tokens |
| Authorization | ✅ | RBAC implemented |
| Input Validation | ✅ | Zod schemas |
| XSS Protection | ✅ | React built-in |
| HTTPS | ⚠️ | Ensure in production |
| CSRF Protection | ⚠️ | Consider adding |

### 10.3 Performance ⚠️

| Practice | Status | Notes |
|----------|--------|-------|
| Code Splitting | ✅ | Next.js automatic |
| Lazy Loading | ⚠️ | Can be improved |
| Image Optimization | ⚠️ | Ready but not enforced |
| Caching | ⚠️ | No API caching |
| Bundle Size | ⚠️ | Monitor regularly |

### 10.4 Maintainability ✅

| Practice | Status | Notes |
|----------|--------|-------|
| Documentation | ⚠️ | This document helps |
| Type Safety | ⚠️ | Consider TypeScript |
| Testing | ⚠️ | No tests found |
| CI/CD | ⚠️ | Not visible in codebase |

### 10.5 Accessibility ✅

| Practice | Status | Notes |
|----------|--------|-------|
| ARIA Labels | ✅ | Radix UI provides |
| Keyboard Navigation | ✅ | Radix UI components |
| Screen Reader Support | ✅ | Accessible components |
| Color Contrast | ✅ | Tailwind default |

---

## 11. Recommendations & Roadmap

### 11.1 High Priority Recommendations

#### 1. **Testing Infrastructure** 🔴 Critical
- **Action:** Implement unit tests (Jest) and integration tests (React Testing Library)
- **Impact:** Improved code quality, reduced bugs, safer refactoring
- **Effort:** Medium

#### 2. **TypeScript Migration** 🟡 Important
- **Action:** Gradually migrate to TypeScript
- **Impact:** Better type safety, improved developer experience, fewer runtime errors
- **Effort:** High (but can be incremental)

#### 3. **API State Management** 🟡 Important
- **Action:** Implement React Query or SWR
- **Impact:** Better caching, automatic refetching, improved UX
- **Effort:** Medium

#### 4. **Security Enhancements** 🟡 Important
- **Action:** 
  - Implement httpOnly cookies for tokens
  - Add CSRF protection
  - Add security headers
- **Impact:** Enhanced security posture
- **Effort:** Medium

### 11.2 Medium Priority Recommendations

#### 5. **Performance Optimization**
- Implement dynamic imports for route-based code splitting
- Add React.memo for expensive components
- Implement virtual scrolling for large data tables

#### 6. **Documentation**
- Add JSDoc comments to functions
- Create component storybook
- Add API documentation

#### 7. **CI/CD Pipeline**
- Set up automated testing
- Implement code quality checks
- Automated deployment pipeline

### 11.3 Low Priority / Future Considerations

#### 8. **Progressive Web App (PWA)**
- Add service worker
- Offline capabilities
- Install prompt

#### 9. **Internationalization (i18n)**
- Multi-language support
- Date/time localization

#### 10. **Monitoring & Analytics**
- Error tracking (Sentry)
- Performance monitoring
- User analytics

### 11.4 Technology Debt

#### **Remove Unused Dependencies**
- Redux Toolkit (if not used)
- Review all dependencies for usage

#### **Code Cleanup**
- Remove commented code
- Consolidate duplicate utilities
- Standardize error handling patterns

---

## 12. Architecture Diagrams

### 12.1 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Next.js Frontend Application             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │   │
│  │  │  Pages   │  │Components│  │  State   │     │   │
│  │  └──────────┘  └──────────┘  └──────────┘     │   │
│  │         │              │              │          │   │
│  │         └──────────────┼──────────────┘          │   │
│  │                        │                          │   │
│  │              ┌─────────▼─────────┐               │   │
│  │              │   API Clients     │               │   │
│  │              └─────────┬─────────┘               │   │
│  └───────────────────────┼──────────────────────────┘   │
│                          │                                │
└──────────────────────────┼────────────────────────────────┘
                           │
                           │ HTTPS
                           │
┌──────────────────────────▼────────────────────────────────┐
│              Next.js API Routes (Proxy)                     │
│  ┌────────────────────────────────────────────────────┐   │
│  │  /api/auth/*  /api/employees/*  /api/reports/*   │   │
│  └────────────────────────────────────────────────────┘   │
└──────────────────────────┬────────────────────────────────┘
                           │
                           │
┌──────────────────────────▼────────────────────────────────┐
│              Backend API Server                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Authentication │ Business Logic │ Database         │   │
│  └────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

### 12.2 Authentication Flow

```
User → Login Page → POST /api/auth/login
                        ↓
                   Backend API
                        ↓
                   JWT Tokens
                        ↓
              Store in sessionStorage
                        ↓
              Include in API Requests
                        ↓
              401 Error? → Refresh Token
                        ↓
              Continue or Redirect to Login
```

### 12.3 Component Hierarchy

```
RootLayout
├── AuthProvider
│   └── AppShell
│       ├── Sidebar (conditional)
│       ├── Navbar (conditional)
│       └── Page Content
│           └── RouteGuard (if protected)
│               └── Feature Components
```

---

## 13. Conclusion

### 13.1 Architecture Strengths

✅ **Well-Designed:**
- Modern tech stack (Next.js, React)
- Clear separation of concerns
- Reusable component library
- Secure authentication flow
- Role-based access control

✅ **Maintainable:**
- Organized folder structure
- Consistent patterns
- Good code organization

✅ **Scalable:**
- Component-based architecture
- Modular design
- API abstraction layer

### 13.2 Areas for Improvement

⚠️ **Testing:** No test infrastructure currently
⚠️ **Type Safety:** JavaScript only (consider TypeScript)
⚠️ **Performance:** Can optimize further with caching
⚠️ **Security:** Can enhance with additional measures

### 13.3 Overall Assessment

**Rating:** ⭐⭐⭐⭐ (4/5)

The HRMS Frontend demonstrates a **solid, modern architecture** following industry best practices. The codebase is well-organized, uses appropriate technologies, and implements security measures. With the recommended improvements (especially testing and TypeScript), it would achieve a 5/5 rating.

### 13.4 Business Value

- **Time to Market:** Fast development with Next.js and component library
- **Maintainability:** Well-structured code reduces maintenance costs
- **Scalability:** Architecture supports growth
- **Security:** Robust authentication and authorization
- **User Experience:** Modern, responsive, accessible UI

---

## Appendix A: Technology Versions

| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | 16.0.1 | Latest stable |
| React | 19.2.0 | Latest version |
| Node.js | - | Check compatibility |
| Tailwind CSS | 4.x | Latest version |

---

## Appendix B: Key Files Reference

| File | Purpose |
|------|---------|
| `app/layout.js` | Root layout with providers |
| `components/common/AuthContext.js` | Authentication context |
| `app/services/externalApiClient.js` | API client with interceptors |
| `lib/tokenStorage.js` | Token storage abstraction |
| `components/common/RouteGuard.js` | Route protection component |
| `app/error.js` | Global error boundary |

---

## Document Maintenance

**Review Schedule:** Quarterly  
**Next Review Date:** [To be set]  
**Document Owner:** Technical Architecture Team  
**Contributors:** Development Team

---

**End of Document**

