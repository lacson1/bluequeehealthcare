# Bluequee Healthcare Management System - Developer Setup

## 🏥 Overview
Bluequee is a comprehensive digital health platform specializing in advanced medical communication, intelligent lab result analysis, and patient engagement for rural healthcare delivery.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Git

### Installation
```bash
# Clone and install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and API keys

# Set up database
npm run db:push

# Start development server
npm run dev
```

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Wouter** for client-side routing
- **TanStack Query** for data fetching and caching
- **Shadcn/UI** components with Tailwind CSS
- **Responsive design** with mobile-first approach

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** with PostgreSQL
- **Session-based authentication** with role-based access control
- **Multi-tenant architecture** for healthcare organizations

### Key Features
- 👥 **Patient Management** - Comprehensive patient records
- 🩺 **Visit Recording** - Detailed medical visit documentation
- 🧪 **Lab Results** - Interactive results dashboard with trend analysis
- 💊 **Prescription Management** - Medication tracking and refill alerts
- 📱 **Mobile Optimized** - Touch-friendly interface with offline support
- 🔐 **HIPAA Compliant** - Enterprise-grade security and audit logging

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Start dev server (frontend + backend)
npm run dev:client       # Frontend only
npm run dev:server       # Backend only

# Database
npm run db:push          # Sync database schema
npm run db:push --force  # Force sync (data loss warning)
npm run db:studio        # Open Drizzle Studio

# Testing
npm run test             # Run test suite
npm run test:e2e         # Run Cypress end-to-end tests
npm run test:coverage    # Generate test coverage report

# Build
npm run build            # Build for production
npm run preview          # Preview production build
```

## 🗄️ Database Schema

The system uses a comprehensive PostgreSQL schema with 40+ tables including:

### Core Entities
- **Users** - Healthcare staff with role-based permissions
- **Organizations** - Multi-tenant healthcare facilities
- **Patients** - Patient demographics and medical records
- **Visits** - Medical visit documentation
- **Prescriptions** - Medication management
- **Lab Results** - Laboratory test results and analysis

### Security & Audit
- **Audit Logs** - Complete activity tracking
- **User Sessions** - Authentication and session management
- **Role Permissions** - Granular access control

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bluequee

# Session Security
SESSION_SECRET=your-secure-session-secret

# API Keys (Optional)
VITE_FIREBASE_API_KEY=your-firebase-key
VITE_FIREBASE_APP_ID=your-firebase-app-id
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
```

### Default Credentials
**Super Admin:**
- Username: `Ade`
- Password: `admin123`

**Test Patient Portal:**
- Patient ID: `5`
- Phone: `0790887656`
- DOB: `1987-06-02`

## 🔐 Security Features

- **Role-Based Access Control** - Doctor, Nurse, Admin, Super Admin roles
- **Session Management** - Secure authentication with timeout
- **Audit Logging** - Complete activity tracking for compliance
- **Multi-Tenant Support** - Organization-level data isolation
- **HIPAA Compliance** - Healthcare data protection standards

## 📱 Mobile Support

- **Progressive Web App** - Installable on mobile devices
- **Offline Functionality** - Service worker for offline access
- **Touch Optimized** - Mobile-first responsive design
- **Accessibility** - WCAG 2.1 AA compliant

## 🧪 Testing

### Test Coverage
- **Unit Tests** - Component and utility function testing
- **Integration Tests** - API endpoint testing
- **E2E Tests** - Complete user workflow testing
- **Security Tests** - Authentication and authorization testing

### Running Tests
```bash
# Interactive test runner
npm run test

# Cypress E2E tests
npm run test:e2e

# Test specific component
npm run test -- PatientDashboard
```

## 🚀 Deployment

### Production Checklist
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations: `npm run db:push`
4. Build application: `npm run build`
5. Start production server: `npm start`

### Monitoring
- Health check endpoint: `/api/health`
- Performance monitoring built-in
- Error logging and reporting

## 📖 API Documentation

### Authentication
```http
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Patients
```http
GET    /api/patients
POST   /api/patients
GET    /api/patients/:id
PUT    /api/patients/:id
DELETE /api/patients/:id
```

### Visits
```http
GET  /api/patients/:id/visits
POST /api/patients/:id/visits
GET  /api/visits/:id
PUT  /api/visits/:id
```

### Lab Results
```http
GET  /api/lab-results
POST /api/lab-results
GET  /api/patients/:id/lab-results
```

### Prescriptions
```http
GET  /api/prescriptions
POST /api/prescriptions
GET  /api/patients/:id/prescriptions
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `npm run test`
5. Commit your changes: `git commit -m 'Add new feature'`
6. Push to the branch: `git push origin feature/new-feature`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical support or questions:
- Review the API documentation above
- Check the test files for usage examples
- Examine the shared schema for data structures
- Review component files for UI implementation patterns

## 🏥 Healthcare Compliance

This system is designed to meet healthcare industry standards:
- **HIPAA Compliance** - Protected health information handling
- **Audit Trails** - Complete activity logging
- **Data Security** - Encryption and secure storage
- **Access Controls** - Role-based permissions
- **Data Backup** - Automated backup and recovery
