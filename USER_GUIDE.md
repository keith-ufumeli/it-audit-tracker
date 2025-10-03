# IT Audit Tracker - User Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Admin Portal](#admin-portal)
5. [Client Portal](#client-portal)
6. [Key Features](#key-features)
7. [Workflows](#workflows)
8. [Troubleshooting](#troubleshooting)
9. [Technical Information](#technical-information)

---

## System Overview

The IT Audit Tracker is a comprehensive audit management system designed to enhance transparency, accountability, and security by systematically recording and monitoring user activities across critical IT systems. The system provides role-based access control with two main portals: Admin Portal and Client Portal.

### Key Capabilities
- **Audit Management**: Create, assign, and track audit tasks with defined timelines
- **Document Management**: Secure document requests, uploads, and version control
- **Activity Logging**: Automatic recording of key events (logins, file access, changes)
- **Reporting**: Generate detailed audit reports, management dashboards, and export options
- **Notifications**: Email and in-app notifications with suspicious activity alerts
- **Real-time Monitoring**: WebSocket-based alerts and activity tracking

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn
- **Backend**: Next.js API routes
- **Authentication**: NextAuth.js with JWT sessions
- **Database**: In-memory JSON-based database (demo environment)
- **Real-time**: WebSocket connections for live updates

---

## Getting Started

### System Access
1. Navigate to the application URL (localhost)
2. Click "Sign In" to access the login page
3. Enter your credentials (see [User Roles & Permissions](#user-roles--permissions) for test accounts)
4. The system will automatically redirect you to the appropriate portal based on your role

### Default Login Credentials

| Role | Email | Password | Portal Access |
|------|-------|----------|---------------|
| Super Admin | `superadmin@audit.com` | `password` | Admin Portal |
| Audit Manager | `manager@audit.com` | `password` | Admin Portal |
| Auditor | `auditor@audit.com` | `password` | Admin Portal |
| Management | `management@audit.com` | `password` | Admin Portal |
| Client | `client@company.com` | `password` | Client Portal |
| Department | `dept@company.com` | `password` | Client Portal |

### First-Time Setup
1. **Super Admin**: Configure system settings, create users, and set up permissions
2. **Audit Manager**: Create initial audits and assign auditors
3. **Auditor**: Review assigned audits and begin audit activities
4. **Client/Department**: Respond to document requests and notifications

---

## User Roles & Permissions

### Super Admin
**Full system access with administrative privileges**

**Key Responsibilities:**
- System configuration and maintenance
- User management and role assignments
- Permission management and security settings
- Database configuration and backup settings
- System-wide monitoring and reporting

**Available Features:**
- User Management (create, edit, delete users)
- Permission Management (create custom permissions)
- System Settings (database, security, notifications)
- All audit and reporting capabilities
- Complete activity monitoring

### Audit Manager
**Audit oversight and team management**

**Key Responsibilities:**
- Create and initiate audits
- Assign tasks to auditors
- Track progress of audit assignments
- Generate detailed and summary reports
- Review findings and provide feedback

**Available Features:**
- Audit creation and management
- Auditor assignment and task delegation
- Report generation and scheduling
- User management within scope
- Activity monitoring and alerts

### Auditor
**Audit execution and evidence collection**

**Key Responsibilities:**
- Access system logs relevant to assigned audits
- Submit audit reports through the system
- Request documents from departments
- Review and manage departmental documents
- Flag suspicious activities for escalation

**Available Features:**
- View assigned audits and findings
- Submit audit reports
- Request documents from clients
- Upload evidence and findings
- Flag suspicious activities

### Management
**Executive oversight and approval**

**Key Responsibilities:**
- View high-level summaries and dashboards
- Provide feedback on audit reports
- Approve or reject audit outcomes
- Monitor compliance scores and trends

**Available Features:**
- Executive dashboards and summaries
- Report approval workflows
- Compliance score monitoring
- High-level audit oversight
- Export executive reports

### Client
**Client-side operations and communication**

**Key Responsibilities:**
- Receive email notifications triggered by system events
- Respond via secure client portal
- Upload requested documents
- Track audit progress and status

**Available Features:**
- Document upload and management
- Notification management
- Audit status tracking
- Report downloads
- Communication with audit team

### Department
**Department-level document management**

**Key Responsibilities:**
- Receive requests for documents from auditors
- Upload requested documents securely
- Track submission status
- Respond to auditor inquiries

**Available Features:**
- Document request management
- Secure document uploads
- Submission tracking
- Communication with auditors

---

## Admin Portal

The Admin Portal provides comprehensive audit management capabilities for internal users (Super Admin, Audit Manager, Auditor, Management).

### Dashboard
**Central hub for audit oversight and monitoring**

**Key Metrics:**
- Active Audits count and progress
- Document status overview
- Total users and active sessions
- Unread alerts and notifications

**Features:**
- Real-time audit progress tracking
- Recent activities feed
- Notification center
- Quick action buttons
- Analytics charts (audit status, priority distribution)

### Audit Management

#### Creating Audits
1. Navigate to **Audits** → **Create Audit**
2. Fill in required information:
   - **Title**: Descriptive audit name
   - **Description**: Detailed audit scope and objectives
   - **Start/End Dates**: Audit timeline
   - **Priority**: Critical, High, Medium, or Low
   - **Scope**: Comma-separated audit areas
   - **Compliance Frameworks**: Applicable standards (ISO 27001, SOC 2, etc.)
3. Click **Create Audit** to save

#### Managing Audits
- **View All Audits**: Browse all audits with filtering and search
- **Audit Details**: Click on any audit to view comprehensive details
- **Edit Audit**: Modify audit information (Audit Managers only)
- **Assign Auditors**: Add team members to audit assignments
- **Add Findings**: Document audit findings with severity levels
- **Cancel Audit**: Cancel audits with confirmation dialog

#### Audit Status Tracking
- **Planning**: Initial setup and preparation
- **In Progress**: Active audit execution
- **On Hold**: Temporarily paused audits
- **Completed**: Finished audits
- **Cancelled**: Terminated audits

### Report Management

#### Generating Reports
1. Navigate to **Reports** → **Generate Report**
2. Select report type:
   - **Audit Report**: Detailed audit findings
   - **Compliance Report**: Compliance status overview
   - **Activity Report**: System activity summary
3. Choose output format (PDF or CSV)
4. Click **Generate** to create and download

#### Report Scheduling
1. Navigate to **Reports** → **Schedule Reports**
2. Configure schedule:
   - **Frequency**: Daily, Weekly, or Monthly
   - **Recipients**: Users and email addresses
   - **Report Type**: Select report template
   - **Next Run**: Automatic execution time
3. Save schedule for automatic report generation

### User Management (Super Admin Only)

#### Creating Users
1. Navigate to **Users** → **Create User**
2. Enter user details:
   - **Name**: Full name
   - **Email**: Unique email address
   - **Role**: Select appropriate role
   - **Department**: User's department
   - **Permissions**: Custom permission assignments
3. Set initial password
4. Click **Create User**

#### Managing Permissions
1. Navigate to **Permissions** → **Manage Permissions**
2. Create custom permissions:
   - **Name**: Permission identifier
   - **Description**: Clear description
   - **Category**: Functional grouping
   - **Type**: System or Custom permission
3. Assign permissions to roles
4. Update role hierarchies

### System Settings (Super Admin Only)

#### Database Configuration
- **Backup Settings**: Automated backup schedules
- **Retention Policies**: Data retention periods
- **Cleanup Schedules**: Automated data cleanup

#### Security Settings
- **Session Timeouts**: User session duration
- **Login Attempts**: Failed login limits
- **Password Policies**: Complexity requirements
- **IP Whitelisting**: Access restrictions

#### Notification Settings
- **Email Configuration**: SMTP settings
- **System Notifications**: In-app notification preferences
- **Alert Thresholds**: Automated alert triggers

### Activity Monitoring

#### Activity Logs
- **Real-time Activity Feed**: Live system activities
- **User Actions**: Login, logout, data modifications
- **System Events**: Automated system activities
- **Search and Filter**: Find specific activities

#### Alert Management
- **Active Alerts**: Current system alerts
- **Alert Actions**: Acknowledge, Resolve, Dismiss
- **Severity Levels**: Critical, High, Medium, Low
- **WebSocket Updates**: Real-time alert notifications

---

## Client Portal

The Client Portal provides a simplified interface for external users (Clients and Departments) to interact with the audit process.

### Dashboard
**Overview of client-specific activities and requests**

**Key Metrics:**
- Pending document requests
- Submitted documents under review
- Unread notifications
- Audit status updates

**Features:**
- Document status overview
- Notification priority breakdown
- Quick action buttons
- Recent activity summary

### Document Management

#### Uploading Documents
1. Navigate to **Documents** → **Upload Document**
2. Select file to upload
3. Add document details:
   - **Title**: Document name
   - **Description**: Document purpose
   - **Category**: Document type
4. Click **Upload** to submit

#### Managing Document Requests
- **View Requests**: See all document requests
- **Upload Response**: Submit requested documents
- **Track Status**: Monitor submission progress
- **View History**: Access previous submissions

### Notification Management

#### Viewing Notifications
- **Unread Notifications**: Priority-based notification list
- **Notification Details**: Full message content
- **Mark as Read**: Update notification status
- **Priority Indicators**: Visual priority levels

#### Notification Types
- **Document Requests**: New document requirements
- **Audit Updates**: Progress and status changes
- **System Alerts**: Important system notifications
- **Deadline Reminders**: Upcoming due dates

---

## Key Features

### Real-time Updates
- **WebSocket Connections**: Live data updates
- **Activity Broadcasting**: Real-time activity feeds
- **Alert Notifications**: Instant alert delivery
- **Status Changes**: Immediate status updates

### Search and Filtering
- **Global Search**: Search across all data types
- **Advanced Filters**: Multi-criteria filtering
- **Status Filters**: Filter by audit/document status
- **Date Ranges**: Time-based filtering
- **User Filters**: Role and department filtering

### Document Security
- **Secure Upload**: Encrypted file uploads
- **Access Control**: Role-based document access
- **Version Control**: Document version tracking
- **Audit Trail**: Complete document history

### Reporting and Analytics
- **PDF Generation**: Professional report formatting
- **CSV Export**: Data export capabilities
- **Scheduled Reports**: Automated report delivery
- **Analytics Charts**: Visual data representation
- **Custom Templates**: Configurable report formats

### Activity Logging
- **Comprehensive Logging**: All user actions recorded
- **Metadata Capture**: IP addresses, user agents, timestamps
- **Severity Levels**: Info, Warning, Error, Critical
- **Search Capabilities**: Find specific activities
- **Export Options**: Activity log exports

---

## Workflows

### Audit Creation Workflow
1. **Audit Manager** creates new audit
2. **System** generates audit ID and initializes tracking
3. **Audit Manager** assigns auditors to audit
4. **Auditors** receive notifications of assignment
5. **Auditors** begin audit activities
6. **System** tracks progress and activities
7. **Auditors** submit findings and reports
8. **Audit Manager** reviews and approves
9. **Management** receives final reports

### Document Request Workflow
1. **Auditor** requests document from client
2. **System** sends notification to client
3. **Client** receives request notification
4. **Client** uploads requested document
5. **System** notifies auditor of submission
6. **Auditor** reviews and approves document
7. **System** updates document status
8. **Client** receives confirmation notification

### Alert Management Workflow
1. **System** detects suspicious activity
2. **System** generates alert with severity level
3. **Alert** appears in real-time dashboard
4. **Admin** acknowledges alert
5. **Admin** investigates and resolves
6. **System** logs resolution and updates status
7. **Stakeholders** receive resolution notification

### Report Generation Workflow
1. **User** requests report generation
2. **System** validates user permissions
3. **System** collects relevant data
4. **System** generates report in requested format
5. **User** downloads generated report
6. **System** logs report generation activity
7. **Scheduled reports** execute automatically

---

## Troubleshooting

### Common Issues

#### Login Problems
**Issue**: Cannot log in with credentials
**Solutions:**
- Verify email and password are correct
- Check if account is active
- Clear browser cache and cookies
- Try different browser or incognito mode

#### Permission Errors
**Issue**: "Access Denied" or missing features
**Solutions:**
- Verify user role and permissions
- Contact Super Admin for permission updates
- Check if feature requires specific role
- Log out and log back in

#### Upload Failures
**Issue**: Document upload not working
**Solutions:**
- Check file size limits
- Verify file format is supported
- Ensure stable internet connection
- Try uploading smaller files

#### Real-time Updates Not Working
**Issue**: Dashboard not updating in real-time
**Solutions:**
- Check WebSocket connection status
- Refresh browser page
- Verify network connectivity
- Check browser console for errors

### Performance Issues

#### Slow Loading
**Solutions:**
- Clear browser cache
- Close unnecessary browser tabs
- Check internet connection speed
- Contact system administrator

#### Search Not Working
**Solutions:**
- Verify search terms are correct
- Try different search keywords
- Clear search filters
- Refresh the page

### Data Issues

#### Missing Data
**Solutions:**
- Check if data was recently created
- Verify user permissions for data access
- Contact system administrator
- Check if data was deleted or archived

#### Incorrect Data Display
**Solutions:**
- Refresh the page
- Clear browser cache
- Check user permissions
- Contact system administrator

---

## Technical Information

### System Requirements
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **JavaScript**: Enabled
- **Cookies**: Enabled
- **Internet**: Stable connection for real-time features

### Security Features
- **Authentication**: NextAuth.js with JWT sessions
- **Authorization**: Role-based access control (RBAC)
- **Password Security**: bcrypt hashing
- **Session Management**: Configurable timeouts
- **Activity Logging**: Comprehensive audit trails
- **Input Validation**: Server-side validation

### Data Storage
- **Current Environment**: In-memory JSON database
- **Data Persistence**: Session-based (resets on server restart)
- **Backup**: Manual backup capabilities
- **Export**: CSV and PDF export options

### API Endpoints
- **Authentication**: `/api/auth/[...nextauth]`
- **Audits**: `/api/audits`
- **Reports**: `/api/reports`
- **Users**: `/api/users`
- **Documents**: `/api/upload/document`
- **Notifications**: `/api/notifications`
- **Alerts**: `/api/alerts`
- **WebSocket**: `/api/websocket`

### Browser Compatibility
- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile Browsers**: Responsive design support

### Performance Considerations
- **Real-time Updates**: WebSocket connections for live data
- **Caching**: Browser caching for static assets
- **Loading States**: Skeleton loaders for better UX
- **Error Handling**: Comprehensive error management
- **Responsive Design**: Mobile-friendly interface

---

## Support and Contact

### Getting Help
1. **Check this guide** for common solutions
2. **Contact your system administrator** for technical issues
3. **Review activity logs** for troubleshooting information
4. **Check system status** in the admin dashboard

### Best Practices
- **Regular Logins**: Keep your session active
- **Document Organization**: Use clear, descriptive names
- **Timely Responses**: Respond to requests promptly
- **Security**: Log out when finished
- **Backup**: Export important data regularly

### System Maintenance
- **Regular Updates**: System updates are applied automatically
- **Data Backup**: Regular backups are performed
- **Security Patches**: Applied as needed
- **Performance Monitoring**: Continuous system monitoring

---

*This guide covers the IT Audit Tracker system. For additional support or feature requests, contact your system administrator.*
