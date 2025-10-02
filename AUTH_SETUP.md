# Authentication Setup - IT Audit Trail Tracker

## Overview
This document outlines the authentication system implemented for the IT Audit Trail Tracker using NextAuth.js with role-based access control (RBAC).

## Features Implemented

### 🔐 Authentication System
- **NextAuth.js** with credentials provider
- **JWT-based sessions** for stateless authentication
- **Password hashing** using bcryptjs
- **TypeScript support** with proper type definitions

### 👥 User Roles & Permissions
- **Audit Manager**: Create audits, assign tasks, generate reports
- **Auditor**: Access logs, submit reports, request documents
- **Management**: View dashboards, approve reports
- **Client**: View notifications, respond to requests
- **Department**: Upload documents, view requests

### 🛡️ Route Protection
- **RBAC Middleware** automatically redirects users to appropriate portals
- **Admin Portal** (`/admin`): Accessible to Audit Managers, Auditors, Management
- **Client Portal** (`/client`): Accessible to Clients and Departments
- **Public Routes**: Home page and authentication pages

## Demo Accounts

All accounts use the password: `password`

| Role | Email | Name | Portal |
|------|-------|------|--------|
| Audit Manager | manager@audit.com | John Manager | Admin |
| Auditor | auditor@audit.com | Jane Auditor | Admin |
| Management | management@audit.com | Bob Executive | Admin |
| Client | client@company.com | Alice Client | Client |
| Department | dept@company.com | Charlie Department | Client |

## File Structure

```
src/
├── lib/
│   └── auth.ts                 # NextAuth configuration
├── types/
│   └── next-auth.d.ts         # TypeScript declarations
├── middleware.ts              # RBAC middleware
├── app/
│   ├── api/auth/[...nextauth]/
│   │   └── route.ts           # NextAuth API route
│   ├── auth/
│   │   ├── signin/page.tsx    # Login page
│   │   └── error/page.tsx     # Auth error page
│   ├── admin/page.tsx         # Admin portal
│   ├── client/page.tsx        # Client portal
│   └── layout.tsx             # App layout with providers
└── components/
    └── providers/
        └── auth-provider.tsx  # Session provider
```

## Environment Variables

Create a `.env.local` file with:

```env
NEXTAUTH_SECRET=your-super-secret-key-change-in-production-12345
NEXTAUTH_URL=http://localhost:3000
```

## How It Works

1. **Login Process**:
   - User enters credentials on `/auth/signin`
   - NextAuth validates against mock user database
   - JWT token created with user role and permissions
   - User redirected to appropriate portal based on role

2. **Route Protection**:
   - Middleware checks authentication status
   - Validates user role against route requirements
   - Redirects unauthorized users to appropriate portal
   - Protects both admin and client routes

3. **Session Management**:
   - JWT tokens stored in HTTP-only cookies
   - Session data includes user role and permissions
   - Automatic token refresh and validation

## Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT token-based authentication
- ✅ Role-based access control
- ✅ Route protection middleware
- ✅ Secure session management
- ✅ TypeScript type safety

## Testing the Authentication

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click "Sign In" or use demo accounts
4. Test different user roles and portal access
5. Verify route protection by trying to access unauthorized routes

## Next Steps

- Replace mock user database with real database
- Add MFA/SSO support
- Implement password reset functionality
- Add user management features
- Enhance audit logging for authentication events
