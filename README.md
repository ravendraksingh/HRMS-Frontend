# Employee Management System (EMS)

A comprehensive, modern Employee Management System built with Next.js, designed to streamline HR operations, employee self-service, and organizational management.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Authentication & Authorization](#authentication--authorization)
- [API Integration](#api-integration)
- [Logging](#logging)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

The Employee Management System (EMS) is a full-featured web application that enables organizations to manage employees, track attendance, handle leave requests, manage payroll, and perform various HR operations. The system supports multiple user roles (Admin, HR Manager, Manager, Employee) with role-based access control.

### Key Capabilities

- **Employee Management**: Complete employee lifecycle management
- **Attendance Tracking**: Real-time attendance marking and monitoring
- **Leave Management**: Leave request submission, approval workflows, and tracking
- **Payroll Management**: Salary information and payroll processing
- **HR Operations**: Comprehensive HR management tools
- **Manager Dashboard**: Team oversight and management capabilities
- **Reporting**: Attendance and employee reports
- **Self-Service Portal**: Employee self-service features

## ✨ Features

### Employee Features
- Personal dashboard with quick access to key information
- Attendance marking and correction requests
- Leave application and tracking
- Salary information viewing
- Personal details management
- Performance tracking
- Roster viewing

### HR Manager Features
- Employee management (CRUD operations)
- Attendance policy management
- Holiday calendar management
- Shift management
- Overtime tracking
- Employee onboarding
- Monthly calendar view
- Comprehensive reports

### Manager Features
- Team dashboard with overview statistics
- Team attendance monitoring
- Leave approval workflow
- Team directory
- Attendance reports for direct reports

### Admin Features
- User management
- Department management
- Location management
- Role management
- System settings
- Organization-wide configuration

### Technical Features
- JWT-based authentication with refresh tokens
- Multiple token storage options (localStorage, sessionStorage, httpOnly cookies)
- Role-based access control (RBAC)
- Responsive design with mobile support
- Dark/Light theme support
- Real-time notifications
- Structured logging (Pino)
- API request/response interceptors
- Error handling and validation

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 16.0.1 (React 19.2.0)
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **State Management**: Redux Toolkit, Zustand
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Maps**: Leaflet, React Leaflet
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Date Handling**: date-fns, react-day-picker

### Backend Integration
- **HTTP Client**: Axios
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcryptjs, crypto-js

### Development Tools
- **Linting**: ESLint with Next.js config
- **Logging**: Pino with dual output (console JSON + file text)
- **Build Tool**: Webpack (Next.js default)

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher (recommended: v20.x)
- **npm**: v9.0.0 or higher (or yarn/pnpm)
- **Backend API**: A running backend API server (see API Integration section)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ems
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables** (see [Configuration](#configuration) section)

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Backend API Configuration
BACKEND_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_BACKEND_API_BASE_URL=http://localhost:8080

# Token Storage Configuration
# Options: "localStorage", "sessionStorage", "cookie"
# Default: "localStorage"
NEXT_PUBLIC_TOKEN_STORAGE_TYPE=localStorage

# Logging Configuration
LOG_LEVEL=info
# Options: "trace", "debug", "info", "warn", "error", "fatal"

# Node Environment
NODE_ENV=development
```

### Environment Variable Descriptions

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `BACKEND_API_BASE_URL` | Backend API URL (server-side) | Yes | `http://localhost:8080` |
| `NEXT_PUBLIC_BACKEND_API_BASE_URL` | Backend API URL (client-side) | Yes | `http://localhost:8080` |
| `NEXT_PUBLIC_TOKEN_STORAGE_TYPE` | Token storage mechanism | No | `localStorage` |
| `LOG_LEVEL` | Logging level | No | `info` |
| `NODE_ENV` | Node environment | No | `development` |

### Token Storage Options

The application supports three token storage mechanisms:

1. **localStorage** (default)
   - Tokens stored in browser localStorage
   - Persists across browser sessions
   - Accessible via JavaScript

2. **sessionStorage**
   - Tokens stored in browser sessionStorage
   - Cleared when browser tab closes
   - Accessible via JavaScript

3. **cookie**
   - Tokens stored in httpOnly cookies
   - Most secure option
   - Not accessible via JavaScript
   - Recommended for production

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

The application will start on [http://localhost:3000](http://localhost:3000) with hot-reload enabled.

### Production Build

```bash
# Build the application
npm run build

# Start the production server
npm start
```

### Other Commands

```bash
# Run linter
npm run lint

# Check for type errors (if using TypeScript)
npm run type-check
```

## 📁 Project Structure

```
ems/
├── app/                          # Next.js App Router
│   ├── (employees)/             # Employee route group
│   │   ├── attendance/          # Attendance pages
│   │   ├── dashboard/           # Employee dashboard
│   │   ├── leave/               # Leave management
│   │   ├── profile/             # Employee profile
│   │   └── layout.js            # Employee layout with auth
│   ├── (hr)/                    # HR Manager route group
│   │   ├── employees/          # Employee management
│   │   ├── holidays/           # Holiday management
│   │   ├── shifts/             # Shift management
│   │   └── layout.js           # HR layout with auth
│   ├── (managers)/              # Manager route group
│   │   ├── team/               # Team management
│   │   └── layout.js           # Manager layout with auth
│   ├── admin/                   # Admin routes
│   │   ├── users/              # User management
│   │   ├── departments/        # Department management
│   │   ├── locations/          # Location management
│   │   └── roles/               # Role management
│   ├── api/                     # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── employees/          # Employee endpoints
│   │   └── reports/            # Report endpoints
│   ├── services/               # Service layer
│   │   ├── externalApiClient.js # External API client
│   │   └── internalApiClient.js # Internal API client
│   ├── layout.js                # Root layout
│   └── page.js                  # Home page
├── components/                  # React components
│   ├── auth/                   # Authentication components
│   ├── common/                 # Common/shared components
│   ├── employees/              # Employee-related components
│   ├── managers/               # Manager-related components
│   ├── attendance/              # Attendance components
│   └── ui/                     # UI component library
├── lib/                        # Utility libraries
│   ├── authorizeRequest.js     # Request authorization
│   ├── fetchBackend.js         # Backend API fetcher
│   ├── tokenStorage.js         # Token storage utilities
│   ├── serverAuth.js           # Server-side auth
│   ├── logger.js               # Pino logger configuration
│   └── utils.js                # General utilities
├── hooks/                      # Custom React hooks
├── store/                      # State management stores
├── public/                     # Static assets
├── logs/                       # Application logs (gitignored)
├── postman/                    # Postman collection (gitignored)
├── next.config.mjs            # Next.js configuration
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## 🔐 Authentication & Authorization

### Authentication Flow

1. User logs in with username/password
2. Backend validates credentials and returns JWT tokens
3. Tokens are stored based on `NEXT_PUBLIC_TOKEN_STORAGE_TYPE`
4. Access token is included in subsequent API requests
5. Refresh token is used to obtain new access tokens when expired

### Token Management

- **Access Token**: Short-lived token for API authentication
- **Refresh Token**: Long-lived token for obtaining new access tokens
- **Automatic Refresh**: Tokens are automatically refreshed when expired
- **Secure Storage**: Supports httpOnly cookies for enhanced security

### Role-Based Access Control (RBAC)

The application supports the following roles:

- **Admin**: Full system access
- **HR Manager**: HR operations and employee management
- **Manager**: Team management and leave approvals
- **Employee**: Self-service features

Routes are protected using Next.js route groups and server-side authentication checks.

### Protected Routes

- `/admin/*` - Requires Admin role
- `/employees/*` - Requires HR Manager role
- `/team/*` - Requires Manager role (with direct reports)
- `/(employees)/*` - Requires authenticated user

## 🔌 API Integration

### Backend API Requirements

The application requires a backend API that provides:

- Authentication endpoints (`/auth/login`, `/auth/refresh`, `/auth/logout`)
- Employee management endpoints
- Attendance endpoints
- Leave management endpoints
- Manager-specific endpoints
- Report endpoints

### API Client Configuration

The application uses two API clients:

1. **External API Client** (`externalApiClient.js`)
   - For client-side API calls
   - Includes automatic token refresh
   - Handles authentication headers

2. **Internal API Client** (`internalApiClient.js`)
   - For server-side API calls
   - Uses server-side token storage

### API Request/Response Interceptors

- **Request Interceptor**: Adds authentication tokens to requests
- **Response Interceptor**: Handles token refresh on 401 errors
- **Error Handling**: Centralized error handling and user notifications

## 📝 Logging

The application uses **Pino** for structured logging with dual output:

- **Console**: JSON format (for structured logging tools)
- **File**: Human-readable text format (in `logs/app.log`)

### Logging Levels

- `trace` - Very detailed debugging information
- `debug` - Debugging information
- `info` - General information (default)
- `warn` - Warning messages
- `error` - Error messages
- `fatal` - Critical errors

### Usage Example

```javascript
import logger from '@/lib/logger';

// Basic logging
logger.info('Application started');
logger.warn('This is a warning');
logger.error('This is an error');

// Logging with context
logger.info({ userId: 123, action: 'login' }, 'User logged in');
logger.error({ err: error, statusCode: 500 }, 'Request failed');

// Create child logger with context
import { createLogger } from '@/lib/logger';
const requestLogger = createLogger({ requestId: 'req-123' });
requestLogger.info('Processing request');
```

### Log File Location

Logs are written to `logs/app.log` (automatically created if it doesn't exist).

## 💻 Development

### Code Style

- ESLint configuration follows Next.js best practices
- React components use functional components with hooks
- File naming: PascalCase for components, camelCase for utilities

### Adding New Features

1. Create feature branch from `main`
2. Implement feature following existing patterns
3. Add appropriate authentication/authorization checks
4. Update documentation if needed
5. Submit pull request

### Testing

```bash
# Run linter
npm run lint

# Check for build errors
npm run build
```

### Common Development Tasks

**Adding a new protected route:**
1. Create route in appropriate route group (`(employees)`, `(hr)`, `(managers)`, or `admin`)
2. Add authentication check in layout or page
3. Update sidebar navigation if needed

**Adding a new API endpoint:**
1. Create route in `app/api/`
2. Use `authorizeRequest` for authentication
3. Use `fetchBackend` for backend API calls

**Adding a new component:**
1. Create component in appropriate `components/` subdirectory
2. Use existing UI components from `components/ui/`
3. Follow existing component patterns

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

### Environment Variables for Production

Ensure all environment variables are set in your production environment:

- `BACKEND_API_BASE_URL` - Production backend API URL
- `NEXT_PUBLIC_BACKEND_API_BASE_URL` - Production backend API URL (public)
- `NEXT_PUBLIC_TOKEN_STORAGE_TYPE` - Set to `cookie` for production (recommended)
- `NODE_ENV` - Set to `production`
- `LOG_LEVEL` - Set to `info` or `warn` for production

### Deployment Platforms

The application can be deployed to:

- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Docker** container
- Any Node.js hosting platform

### Docker Deployment (Optional)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## 🐛 Troubleshooting

### Common Issues

**Issue: API requests failing with 401 errors**
- **Solution**: Check that `BACKEND_API_BASE_URL` is correctly set
- Verify tokens are being stored correctly
- Check browser console for token refresh errors

**Issue: Logs not appearing in file**
- **Solution**: Ensure `logs/` directory exists and is writable
- Check `LOG_LEVEL` environment variable

**Issue: Authentication not working**
- **Solution**: Verify `NEXT_PUBLIC_TOKEN_STORAGE_TYPE` is set correctly
- Check backend API is running and accessible
- Verify CORS settings on backend

**Issue: Build errors**
- **Solution**: Clear `.next` directory and rebuild
- Ensure all dependencies are installed
- Check Node.js version compatibility

### Getting Help

- Check the [Issues](../../issues) page for known issues
- Review application logs in `logs/app.log`
- Check browser console for client-side errors
- Verify backend API is running and accessible

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow existing code style and patterns
- Add appropriate tests if applicable
- Update documentation for new features
- Ensure all checks pass before submitting PR

## 📄 License

This project is private and proprietary. All rights reserved.

## 📞 Support

For support, please contact the development team or open an issue in the repository.

---

**Built with ❤️ using Next.js and React**

