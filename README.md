# IT Audit Tracker

A comprehensive web application for managing IT audits, compliance tracking, and document management. Built with Next.js 15, React 19, and TypeScript.

## 🚀 Features

### Core Functionality
- **Audit Management**: Create, track, and manage IT audits with full lifecycle support
- **Document Management**: Upload, view, and download audit-related documents
- **User Management**: Role-based access control with multiple user types
- **Permission System**: Granular permissions for different user roles
- **Real-time Notifications**: WebSocket-based alerts and notifications
- **Report Generation**: Generate and export audit reports in multiple formats
- **Activity Logging**: Comprehensive audit trail for all system activities

### User Roles
- **Super Admin**: Full system access and user management
- **Audit Manager**: Manage audits and oversee audit processes
- **Auditor**: Conduct audits and create reports
- **Management**: View reports and audit status
- **Client**: Access assigned documents and audit results
- **Department**: Department-specific audit access

### Technical Features
- **Modern UI**: Built with Radix UI and Tailwind CSS
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Real-time Updates**: WebSocket integration for live notifications
- **File Processing**: Support for PDF, DOC, XLS, and image files
- **Export Capabilities**: PDF, CSV, and text report exports
- **Security**: NextAuth.js authentication with bcrypt password hashing

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Library**: Radix UI + Tailwind CSS
- **Authentication**: NextAuth.js
- **Database**: In-memory JSON database (easily replaceable)
- **Real-time**: WebSocket with Socket.IO
- **File Processing**: Mammoth (DOC), XLSX, PDF.js
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation

## 📋 Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd it-audit-tracker
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Database Configuration (if using external DB)
DATABASE_URL=your-database-url

# Email Configuration (optional)
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@example.com
EMAIL_SERVER_PASSWORD=your-password
EMAIL_FROM=noreply@example.com
```

### 4. Generate a Secure Secret Key

#### Option 1: Using the Built-in Script
```bash
npm run generate-secret
```

#### Option 2: Using Git Bash (Windows)
```bash
# Generate a 32-byte random hex string
openssl rand -hex 32

# Or using Node.js directly
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using PowerShell (if available)
powershell -Command "[System.Web.Security.Membership]::GeneratePassword(64, 0)"
```

#### Option 3: Using Online Tools
- Visit [generate-secret.vercel.app](https://generate-secret.vercel.app)
- Copy the generated secret to your `.env.local` file

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production with Turbopack
npm run start        # Start production server
npm run lint         # Run ESLint

# Utilities
npm run generate-secret  # Generate NextAuth secret key
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── client/            # Client dashboard pages
│   └── shared/            # Shared/public pages
├── components/            # React components
│   ├── admin/             # Admin-specific components
│   ├── client/            # Client-specific components
│   ├── providers/         # Context providers
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── middleware/            # Next.js middleware
├── types/                 # TypeScript type definitions
└── data/                  # JSON data files
```

## 🔐 Authentication & Security

### Default Users
The application comes with pre-configured users for testing:

- **Super Admin**: `admin@example.com` / `admin123`
- **Audit Manager**: `manager@example.com` / `manager123`
- **Auditor**: `auditor@example.com` / `auditor123`

### Security Features
- Password hashing with bcrypt
- JWT-based session management
- Role-based access control
- CSRF protection
- Secure file upload handling
- Activity logging and audit trails

## 📊 Database

Currently uses an in-memory JSON database for development. The data structure includes:

- **Users**: User accounts and roles
- **Audits**: Audit records and metadata
- **Documents**: File uploads and metadata
- **Permissions**: Role-based permissions
- **Activities**: System activity logs
- **Notifications**: User notifications
- **Reports**: Generated audit reports

### Migrating to a Real Database

To use a real database (PostgreSQL, MySQL, etc.):

1. Install your preferred database adapter
2. Update the database configuration in `src/lib/database.ts`
3. Create database migrations
4. Update environment variables

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The application can be deployed to any platform that supports Node.js:

- **Netlify**: Use the Next.js build command
- **Railway**: Connect your GitHub repository
- **DigitalOcean App Platform**: Deploy from GitHub
- **AWS/GCP/Azure**: Use container deployment

### Environment Variables for Production

```bash
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://your-domain.com
DATABASE_URL=your-production-database-url
```

## 🧪 Testing

```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit

# Build test
npm run build
```

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signout` - User sign out

### User Management
- `GET /api/users` - List all users
- `GET /api/users/[id]` - Get user by ID
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### Audit Management
- `GET /api/audits` - List all audits
- `GET /api/audits/[id]` - Get audit by ID
- `POST /api/audits` - Create new audit
- `PUT /api/audits/[id]` - Update audit

### Document Management
- `GET /api/documents` - List documents
- `POST /api/upload/document` - Upload document
- `GET /api/documents/[id]/download` - Download document
- `GET /api/documents/[id]/view` - View document

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use ESLint configuration provided
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**Build Errors**
- Ensure Node.js version is 18+
- Clear `node_modules` and reinstall dependencies
- Check TypeScript configuration

**Authentication Issues**
- Verify `NEXTAUTH_SECRET` is set correctly
- Check `NEXTAUTH_URL` matches your environment
- Ensure user credentials are correct

**File Upload Issues**
- Check file size limits
- Verify file type is supported
- Ensure upload directory has write permissions

### Getting Help

- Check the [Issues](https://github.com/your-repo/issues) page
- Review the documentation
- Contact the development team

## 🔄 Changelog

### Version 0.1.0
- Initial release
- Core audit management functionality
- User authentication and authorization
- Document upload and management
- Report generation
- Real-time notifications

---

**Built with ❤️ using Next.js, React, and TypeScript**