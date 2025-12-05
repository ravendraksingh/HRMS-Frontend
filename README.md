# HRMS - Human Resource Management System

A comprehensive, modern Human Resource Management System built with Next.js and React, designed for organizations to manage employees, attendance, leave, payroll, and comprehensive HR operations.

**Developed by:** [Niyava Technologies Pvt. Ltd.](https://niyava.com)  
**License:** Proprietary Commercial License  
**Version:** 0.1.0

---

## 🚀 Features

### Core Modules

- **👥 Employee Management**
  - Employee onboarding and profile management
  - Personal details, education, employment history
  - Job profile and organizational structure

- **⏰ Attendance Management**
  - Real-time attendance tracking
  - Attendance calendar and history
  - Attendance corrections and approvals
  - Daily and monthly attendance reports

- **🏖️ Leave Management**
  - Leave type configuration
  - Leave balance tracking
  - Leave requests and approvals
  - Leave history and reports

- **💰 Payroll & Salary**
  - Salary management
  - Financial year management
  - Payroll processing

- **📅 Holiday Management**
  - Holiday calendar creation
  - Location and department-specific holidays
  - Financial year-based holiday planning

- **👔 Organization Management**
  - Organization details and settings
  - Department management
  - Location management
  - Role and permission management
  - Financial years management

- **📊 Reports & Analytics**
  - Attendance reports
  - Employee reports
  - Dashboard analytics

### User Roles

- **Admin:** Full system access and configuration
- **HR:** Employee and HR operations management
- **Manager:** Team management and approvals
- **Employee (ESS):** Self-service portal

---

## 🛠️ Technology Stack

### Core Framework
- **Next.js 16.0.1** - React framework with SSR/SSG
- **React 19.2.0** - UI library
- **Node.js** - Runtime environment

### UI & Styling
- **Tailwind CSS 4.x** - Utility-first CSS framework
- **shadcn/ui** - Component library
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### State Management & Data
- **React Context API** - Global state management
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Additional Libraries
- **date-fns** - Date manipulation
- **recharts** - Data visualization
- **react-leaflet** - Map integration
- **sonner** - Toast notifications

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **Git** for version control

---

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ravendraksingh/HRMS-Frontend.git
cd HRMS-Frontend
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Backend API Configuration
NEXT_PUBLIC_BACKEND_API_BASE_URL=http://localhost:8080
BACKEND_API_BASE_URL=http://localhost:8080

# JWT Configuration (Server-side only)
JWT_SECRET=your-jwt-secret-key-here

# Token Storage Type (localStorage/sessionStorage/cookie)
NEXT_PUBLIC_TOKEN_STORAGE_TYPE=sessionStorage
```

**⚠️ Important:** Never commit `.env.local` or any files containing secrets to the repository.

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ Project Structure

```
HRMS-Frontend/
├── app/                    # Next.js App Router
│   ├── admin/              # Admin module
│   ├── hr/                 # HR module
│   ├── manager/            # Manager module
│   ├── ess/                # Employee Self Service
│   ├── api/                # API routes
│   └── services/           # API clients
├── components/            # React components
│   ├── ui/                 # UI primitives
│   ├── common/             # Shared components
│   └── [feature]/          # Feature components
├── lib/                    # Utilities and helpers
├── hooks/                  # Custom React hooks
├── public/                 # Static assets
├── docs/                   # Documentation
└── scripts/                # Utility scripts
```

---

## 🔐 Security

### Environment Variables

The application uses environment variables for sensitive configuration. Ensure:

- ✅ Never commit `.env*` files
- ✅ Use strong, unique `JWT_SECRET` values
- ✅ Keep backend API URLs secure
- ✅ Use HTTPS in production

### Authentication

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Secure token storage (sessionStorage)
- Automatic token refresh on expiration

### Best Practices

- All sensitive files are in `.gitignore`
- No hardcoded secrets or API keys
- Secure API communication
- Input validation and sanitization

---

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbo

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
```

---

## 🧪 Development

### Code Style

- ESLint configuration for code quality
- Consistent component structure
- Modular architecture

### Adding New Features

1. Create feature branch
2. Follow existing code patterns
3. Add appropriate tests (when test suite is added)
4. Update documentation
5. Submit pull request

---

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Technical Architecture](./docs/TECHNICAL_ARCHITECTURE.md)** - Complete architecture overview
- **[Licensing Guide](./docs/LICENSING_GUIDE.md)** - Commercial licensing information
- **[Third-Party Licenses](./THIRD_PARTY_LICENSES.md)** - Open-source dependencies

---

## 🔒 License

This software is proprietary and confidential property of **Niyava Technologies Pvt. Ltd.**

**Copyright (c) 2024 Niyava Technologies Pvt. Ltd. All rights reserved.**

This software is licensed, not sold. For commercial licensing inquiries, please contact:

- **Email:** ravendra@niyava.com
- **Website:** https://niyava.com

See [LICENSE](./LICENSE) file for full terms and conditions.

---

## 🤝 Contributing

This is a proprietary commercial product. For contribution guidelines, please contact the development team.

---

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Module Not Found**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

**Environment Variables Not Loading**
- Ensure `.env.local` is in root directory
- Restart development server
- Check variable names match exactly

---

## 📞 Support

For support, feature requests, or licensing inquiries:

- **Email:** ravendra@niyava.com
- **Website:** https://niyava.com

---

## 🗺️ Roadmap

- [ ] TypeScript migration
- [ ] Comprehensive test suite
- [ ] Performance optimizations
- [ ] Enhanced reporting features
- [ ] Mobile app support
- [ ] Advanced analytics

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- And many other open-source libraries (see [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md))

---

## 📄 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and updates.

---

**Made with ❤️ by Niyava Technologies Pvt. Ltd.**

