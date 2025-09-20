#!/usr/bin/env node

/**
 * Bluequee Healthcare Management System - Developer Export Script
 * 
 * This script creates a comprehensive package for external developers
 * including source code, documentation, and setup instructions.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🏥 Bluequee Healthcare System - Developer Export Tool');
console.log('================================================\n');

// Change to project root directory
const projectRoot = path.dirname(__dirname);
process.chdir(projectRoot);

// Create export directory
const exportDir = 'bluequee-export';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
const exportPath = `${exportDir}-${timestamp}`;

if (!fs.existsSync(exportPath)) {
  fs.mkdirSync(exportPath, { recursive: true });
}

console.log(`📦 Creating export package in: ${exportPath}\n`);

// Define files and directories to include
const includeItems = [
  // Core application files
  'client/',
  'server/',
  'shared/',
  
  // Configuration files
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tailwind.config.ts',
  'vite.config.ts',
  'drizzle.config.ts',
  'postcss.config.js',
  
  // Documentation and setup
  'replit.md',
  '.env.example',
  
  // Testing configuration
  'cypress.config.js',
  'cypress/',
  
  // Build and deployment
  'dist/',
  'public/'
];

// Define files to exclude (sensitive or unnecessary)
const excludePatterns = [
  'node_modules/',
  '.git/',
  '.replit',
  '.env',
  'tmp/',
  '*.log',
  '.DS_Store',
  'coverage/',
  'dist/',
  '.vscode/',
  '.idea/'
];

// Copy function with exclusion logic
function copyWithExclusions(src, dest) {
  try {
    const stats = fs.statSync(src);
    
    // Check if path should be excluded
    const relativePath = path.relative('.', src);
    const shouldExclude = excludePatterns.some(pattern => {
      if (pattern.endsWith('/')) {
        return relativePath.startsWith(pattern.slice(0, -1));
      }
      return relativePath.includes(pattern) || relativePath.endsWith(pattern.slice(1));
    });
    
    if (shouldExclude) {
      return;
    }
    
    if (stats.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      const files = fs.readdirSync(src);
      files.forEach(file => {
        copyWithExclusions(
          path.join(src, file), 
          path.join(dest, file)
        );
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  } catch (error) {
    console.warn(`Warning: Could not copy ${src}: ${error.message}`);
  }
}

// Copy project files
console.log('📁 Copying project files...');
includeItems.forEach(item => {
  if (fs.existsSync(item)) {
    const destPath = path.join(exportPath, item);
    console.log(`   → ${item}`);
    copyWithExclusions(item, destPath);
  }
});

// Generate additional documentation files
console.log('\n📚 Generating developer documentation...');

// Create developer setup guide
const setupGuide = `# Bluequee Healthcare Management System - Developer Setup

## 🏥 Overview
Bluequee is a comprehensive digital health platform specializing in advanced medical communication, intelligent lab result analysis, and patient engagement for rural healthcare delivery.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Git

### Installation
\`\`\`bash
# Clone and install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and API keys

# Set up database
npm run db:push

# Start development server
npm run dev
\`\`\`

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

\`\`\`bash
# Development
npm run dev              # Start dev server (frontend + backend)

# Database
npm run db:push          # Sync database schema

# Type Checking
npm run check            # Run TypeScript type checking

# Build
npm run build            # Build for production
npm start                # Start production server
\`\`\`

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
\`\`\`env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bluequee

# Session Security
SESSION_SECRET=your-secure-session-secret

# API Keys (Optional)
VITE_FIREBASE_API_KEY=your-firebase-key
VITE_FIREBASE_APP_ID=your-firebase-app-id
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
\`\`\`

### Initial Setup

**First-Time Setup:**
1. Run the development server: \`npm run dev\`
2. Access the application at \`http://localhost:5000\`
3. Use the initial setup wizard to create your first admin user
4. Configure your organization settings

**Note**: Default credentials are not provided for security reasons. You must create your first admin user during initial setup.

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
\`\`\`bash
# Interactive test runner
npm run test

# Cypress E2E tests
npm run test:e2e

# Test specific component
npm run test -- PatientDashboard
\`\`\`

## 🚀 Deployment

### Production Checklist
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations: \`npm run db:push\`
4. Build application: \`npm run build\`
5. Start production server: \`npm start\`

### Monitoring
- Health check endpoint: \`/api/health\`
- Performance monitoring built-in
- Error logging and reporting

## 📖 API Documentation

### Authentication
\`\`\`http
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
\`\`\`

### Patients
\`\`\`http
GET    /api/patients
POST   /api/patients
GET    /api/patients/:id
PUT    /api/patients/:id
DELETE /api/patients/:id
\`\`\`

### Visits
\`\`\`http
GET  /api/patients/:id/visits
POST /api/patients/:id/visits
GET  /api/visits/:id
PUT  /api/visits/:id
\`\`\`

### Lab Results
\`\`\`http
GET  /api/lab-results
POST /api/lab-results
GET  /api/patients/:id/lab-results
\`\`\`

### Prescriptions
\`\`\`http
GET  /api/prescriptions
POST /api/prescriptions
GET  /api/patients/:id/prescriptions
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature/new-feature\`
3. Make your changes and add tests
4. Ensure all tests pass: \`npm run test\`
5. Commit your changes: \`git commit -m 'Add new feature'\`
6. Push to the branch: \`git push origin feature/new-feature\`
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
`;

fs.writeFileSync(path.join(exportPath, 'DEVELOPER_SETUP.md'), setupGuide);

// Create environment template
const envTemplate = `# Bluequee Healthcare System - Environment Configuration

# Database Configuration (REQUIRED)
DATABASE_URL=postgresql://username:password@localhost:5432/bluequee_development

# Session Configuration (REQUIRED)
SESSION_SECRET=your-very-secure-session-secret-here-change-this-in-production

# Development Settings
NODE_ENV=development
PORT=5000

# AI Features (REQUIRED for AI analysis features)
ANTHROPIC_API_KEY=your-anthropic-api-key-for-ai-features

# Email Configuration (OPTIONAL - for email notifications)
SENDGRID_API_KEY=your-sendgrid-api-key-for-email-features

# Firebase Configuration (OPTIONAL - for advanced features)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_APP_ID=your-firebase-app-id
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id

# File Storage (for patient documents)
STORAGE_TYPE=local
STORAGE_PATH=./uploads

# Security Settings (Production)
# SESSION_SECURE=true
# SESSION_SAME_SITE=strict
# CORS_ORIGIN=https://yourdomain.com

# Note: Missing required environment variables will cause specific features to fail.
# The system will still run but some functionality may be disabled.
`;

fs.writeFileSync(path.join(exportPath, '.env.example'), envTemplate);

// Create deployment guide
const deploymentGuide = `# Bluequee - Deployment Guide

## 🚀 Production Deployment

### Option 1: Replit Deployment
1. Import project to Replit
2. Set environment variables in Secrets
3. Click "Deploy" button
4. Configure custom domain (optional)

### Option 2: Traditional Hosting

#### Prerequisites
- Node.js 18+
- PostgreSQL database
- Web server (nginx/Apache)

#### Steps
1. **Database Setup**
   \`\`\`bash
   # Create PostgreSQL database
   createdb bluequee_production
   
   # Set DATABASE_URL
   export DATABASE_URL="postgresql://user:pass@host:5432/bluequee_production"
   \`\`\`

2. **Application Setup**
   \`\`\`bash
   # Clone and install
   git clone <your-repo>
   cd bluequee
   npm install --production
   
   # Build application
   npm run build
   
   # Run database migrations
   npm run db:push
   \`\`\`

3. **Environment Configuration**
   \`\`\`bash
   # Copy environment template
   cp .env.example .env
   
   # Edit with production values
   nano .env
   \`\`\`

4. **Process Management**
   \`\`\`bash
   # Using PM2
   npm install -g pm2
   pm2 start npm --name "bluequee" -- start
   pm2 startup
   pm2 save
   \`\`\`

### Option 3: Docker Deployment

\`\`\`dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
\`\`\`

## 🔒 Security Checklist

- [ ] Change default credentials
- [ ] Set secure SESSION_SECRET
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Enable audit logging
- [ ] Configure rate limiting
- [ ] Set up monitoring

## 📊 Monitoring

### Health Checks
- \`GET /api/health\` - Application health
- \`GET /api/health/db\` - Database connectivity

### Logging
- Application logs: \`/var/log/bluequee/\`
- Error tracking built-in
- Audit logs in database

## 🔄 Maintenance

### Regular Tasks
- Database backups
- Log rotation
- Security updates
- Performance monitoring

### Backup Strategy
\`\`\`bash
# Database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Application backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz /path/to/bluequee
\`\`\`
`;

fs.writeFileSync(path.join(exportPath, 'DEPLOYMENT.md'), deploymentGuide);

// Generate API documentation
console.log('   → API Documentation');
const apiDocs = `# Bluequee API Documentation

## Base URL
\`https://your-domain.com/api\`

## Authentication
All protected endpoints require session authentication.

### Login
\`\`\`http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
\`\`\`

### Logout
\`\`\`http
POST /api/auth/logout
\`\`\`

### Get Current User
\`\`\`http
GET /api/auth/me
\`\`\`

## Patients

### List Patients
\`\`\`http
GET /api/patients
\`\`\`

### Create Patient
\`\`\`http
POST /api/patients
Content-Type: application/json

{
  "firstName": "string",
  "lastName": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "phone": "string",
  "email": "string",
  "address": "string"
}
\`\`\`

### Get Patient
\`\`\`http
GET /api/patients/:id
\`\`\`

### Update Patient
\`\`\`http
PUT /api/patients/:id
Content-Type: application/json

{
  "firstName": "string",
  "lastName": "string",
  // ... other fields
}
\`\`\`

## Visits

### List Patient Visits
\`\`\`http
GET /api/patients/:patientId/visits
\`\`\`

### Create Visit
\`\`\`http
POST /api/patients/:patientId/visits
Content-Type: application/json

{
  "visitType": "string",
  "chiefComplaint": "string",
  "diagnosis": "string",
  "treatmentPlan": "string",
  "vitalSigns": {
    "bloodPressure": "string",
    "heartRate": "string",
    "temperature": "string"
  }
}
\`\`\`

## Lab Results

### List Lab Results
\`\`\`http
GET /api/lab-results
\`\`\`

### Create Lab Result
\`\`\`http
POST /api/lab-results
Content-Type: application/json

{
  "patientId": "number",
  "testName": "string",
  "result": "string",
  "status": "string",
  "dateOrdered": "YYYY-MM-DD"
}
\`\`\`

## Prescriptions

### List Prescriptions
\`\`\`http
GET /api/prescriptions
\`\`\`

### Create Prescription
\`\`\`http
POST /api/prescriptions
Content-Type: application/json

{
  "patientId": "number",
  "medication": "string",
  "dosage": "string",
  "frequency": "string",
  "duration": "string"
}
\`\`\`

## Error Responses

All endpoints return errors in this format:
\`\`\`json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
\`\`\`

## Status Codes
- \`200\` - Success
- \`201\` - Created
- \`400\` - Bad Request
- \`401\` - Unauthorized
- \`403\` - Forbidden
- \`404\` - Not Found
- \`500\` - Internal Server Error
`;

fs.writeFileSync(path.join(exportPath, 'API_DOCUMENTATION.md'), apiDocs);

// Create package.json for the export
console.log('   → Package configuration');
const exportPackageJson = {
  "name": "bluequee-healthcare-system",
  "version": "1.0.0",
  "type": "module",
  "description": "Comprehensive digital health platform for rural healthcare delivery",
  "keywords": ["healthcare", "medical", "patient-management", "HIPAA", "telemedicine"],
  "author": "Bluequee Development Team",
  "license": "MIT",
  "main": "server/index.ts",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.3",
    "@hookform/resolvers": "^3.3.4",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-scroll-area": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@tanstack/react-query": "^5.0.0",
    "bcrypt": "^5.1.1",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "cmdk": "^0.2.0",
    "connect-pg-simple": "^9.0.1",
    "date-fns": "^3.6.0",
    "drizzle-orm": "^0.30.0",
    "drizzle-zod": "^0.5.1",
    "express": "^4.19.2",
    "express-session": "^1.18.0",
    "framer-motion": "^11.0.0",
    "jsonwebtoken": "^9.0.2",
    "lucide-react": "^0.379.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.51.4",
    "recharts": "^2.12.7",
    "tailwind-merge": "^2.3.0",
    "tailwindcss-animate": "^1.0.7",
    "wouter": "^3.1.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/express": "^4.17.21",
    "@types/express-session": "^1.18.0",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.14.2",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.19",
    "cypress": "^13.0.0",
    "drizzle-kit": "^0.21.0",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "tsx": "^4.15.2",
    "typescript": "^5.4.5",
    "vite": "^5.2.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/bluequee-healthcare-system.git"
  }
};

fs.writeFileSync(
  path.join(exportPath, 'package.json'), 
  JSON.stringify(exportPackageJson, null, 2)
);

// Generate database schema documentation
console.log('   → Database schema export');

try {
  // Try to read the schema file
  const schemaContent = fs.readFileSync('shared/schema.ts', 'utf8');
  
  const schemaDoc = `# Database Schema Documentation

## Overview
The Bluequee healthcare system uses a comprehensive PostgreSQL database schema designed for multi-tenant healthcare organizations with HIPAA compliance.

## Core Tables

### Users & Authentication
- **users** - Healthcare staff accounts with role-based permissions
- **user_sessions** - Session management and tracking
- **organizations** - Multi-tenant healthcare facilities

### Patient Management  
- **patients** - Patient demographics and medical information
- **patient_contacts** - Emergency contacts and family members
- **patient_allergies** - Allergy tracking and management

### Clinical Data
- **visits** - Medical visit documentation and notes
- **prescriptions** - Medication prescriptions and refill tracking
- **lab_results** - Laboratory test results and analysis
- **vital_signs** - Patient vital signs and measurements

### Administrative
- **appointments** - Appointment scheduling and management
- **audit_logs** - Complete activity tracking for compliance
- **system_settings** - Application configuration

## Schema File
The complete schema definition is available in \`shared/schema.ts\`

\`\`\`typescript
${schemaContent}
\`\`\`

## Key Features

### Multi-Tenant Architecture
- Organization-level data isolation
- Role-based access control across organizations
- Scalable for multiple healthcare facilities

### HIPAA Compliance
- Comprehensive audit logging
- Secure patient data handling
- Access control and permission management

### Data Integrity
- Foreign key relationships
- Validation constraints
- Proper indexing for performance

## Migration Commands

\`\`\`bash
# Sync schema changes to database
npm run db:push

# Force sync (use with caution)
npm run db:push --force

# Open database management interface
npm run db:studio
\`\`\`
`;

  fs.writeFileSync(path.join(exportPath, 'DATABASE_SCHEMA.md'), schemaDoc);
} catch (error) {
  console.warn('   Warning: Could not read schema file for documentation');
}

// Create README for the export
const exportReadme = `# Bluequee Healthcare Management System - Developer Package

## 📦 Package Contents

This export contains everything needed to set up and develop the Bluequee healthcare management system:

- **Source Code** - Complete frontend and backend implementation
- **Documentation** - Comprehensive setup and API guides
- **Database Schema** - Full PostgreSQL schema with healthcare data models
- **Testing Framework** - Cypress E2E testing setup
- **Deployment Guides** - Multiple deployment options

## 🚀 Quick Start

1. **Read the Setup Guide**
   \`\`\`
   DEVELOPER_SETUP.md - Complete development setup instructions
   \`\`\`

2. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure Environment**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your database credentials
   \`\`\`

4. **Start Development**
   \`\`\`bash
   npm run dev
   \`\`\`

## 📚 Documentation

- **DEVELOPER_SETUP.md** - Complete development environment setup
- **API_DOCUMENTATION.md** - RESTful API endpoints and usage
- **DATABASE_SCHEMA.md** - Database structure and relationships
- **DEPLOYMENT.md** - Production deployment options

## 🏥 System Overview

Bluequee is a comprehensive digital health platform featuring:

- **Patient Management** - Complete patient records and demographics
- **Visit Documentation** - Detailed medical visit recording
- **Lab Results** - Interactive results dashboard with trend analysis
- **Prescription Management** - Medication tracking and refill alerts
- **Mobile Optimization** - Responsive design with offline support
- **HIPAA Compliance** - Enterprise-grade security and audit logging

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Express.js, Node.js, PostgreSQL, Drizzle ORM
- **Authentication**: Session-based with role-based access control
- **Testing**: Cypress for E2E testing
- **Mobile**: Progressive Web App with offline support

## 🔐 Security Features

- Multi-tenant organization support
- Role-based access control (Doctor, Nurse, Admin, Super Admin)
- Comprehensive audit logging
- HIPAA-compliant data handling
- Session management with timeout

## 📱 Mobile Support

- Progressive Web App capabilities
- Offline functionality with service worker
- Touch-optimized interface
- WCAG 2.1 AA accessibility compliance

## 🧪 Testing

- Unit tests for components and utilities
- Integration tests for API endpoints
- End-to-end tests for complete workflows
- Security testing for authentication and authorization

## 📞 Support

For questions or issues:
1. Review the documentation files
2. Check the API documentation for endpoint usage
3. Examine test files for implementation examples
4. Review shared schema for data structures

---

**Healthcare Data Platform - Built for Excellence**
*Comprehensive, Secure, Mobile-Optimized Healthcare Management*
`;

fs.writeFileSync(path.join(exportPath, 'README.md'), exportReadme);

// Create installation script
const installScript = `#!/bin/bash

echo "🏥 Bluequee Healthcare System - Auto Setup"
echo "========================================"
echo ""

# Check Node.js version
echo "📋 Checking prerequisites..."
node_version=$(node -v 2>/dev/null | cut -c 2-)
if [ -z "$node_version" ]; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $node_version"

# Check PostgreSQL
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL found"
else
    echo "⚠️  PostgreSQL not found. You'll need to install it manually."
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: sudo apt-get install postgresql postgresql-contrib"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "⚙️  Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
    echo "⚠️  Please edit .env with your database credentials"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🗄️  Database setup..."
echo "   Run 'npm run db:push' after configuring your database"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your database credentials"
echo "2. Run: npm run db:push"
echo "3. Run: npm run dev"
echo ""
echo "📖 Read DEVELOPER_SETUP.md for detailed instructions"
`;

fs.writeFileSync(path.join(exportPath, 'install.sh'), installScript);

// Make install script executable
try {
  fs.chmodSync(path.join(exportPath, 'install.sh'), '755');
} catch (error) {
  console.warn('   Warning: Could not make install.sh executable');
}

console.log('\n✅ Export package created successfully!');
console.log(`\n📁 Package location: ${exportPath}/`);
console.log('\n📋 Package contents:');
console.log('   • Complete source code');
console.log('   • Developer setup guide');
console.log('   • API documentation');
console.log('   • Database schema');
console.log('   • Deployment instructions');
console.log('   • Auto-install script');

console.log('\n🎯 Next steps for external developers:');
console.log('   1. Share the export folder');
console.log('   2. They should read README.md first');
console.log('   3. Run ./install.sh for auto-setup');
console.log('   4. Follow DEVELOPER_SETUP.md for detailed instructions');

console.log('\n🏥 Bluequee export complete! Ready for external development.');