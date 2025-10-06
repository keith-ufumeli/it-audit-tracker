# IT Audit Tracker - PHP Version

A comprehensive IT audit management system built with PHP and MySQL, designed to run on XAMPP. This application provides a complete audit management solution with role-based access control, document management, reporting, and real-time notifications.

## Features

### Core Functionality
- **User Management**: Role-based access control with 6 user roles (Super Admin, Audit Manager, Auditor, Management, Client, Department)
- **Audit Management**: Create, track, and manage IT audits with comprehensive workflow support
- **Document Management**: Secure document upload, version control, and automated request workflows
- **Reporting & Analytics**: Generate comprehensive reports with built-in analytics and export capabilities
- **Activity Logging**: Complete audit trail of all user actions and system events
- **Notification System**: Real-time notifications and automated alerts
- **Compliance Tracking**: Support for various frameworks (ISO 27001, SOC 2, GDPR, etc.)

### Technical Features
- **Secure Authentication**: Session-based authentication with remember me functionality
- **Database Security**: PDO with prepared statements to prevent SQL injection
- **CSRF Protection**: Built-in CSRF token validation
- **Responsive Design**: Mobile-friendly interface with custom CSS
- **API Endpoints**: RESTful API for all major operations
- **File Upload Security**: Secure file handling with type validation
- **Error Handling**: Comprehensive error logging and user-friendly error pages

## Requirements

- **XAMPP** (Apache, MySQL, PHP 7.4+)
- **PHP Extensions**: PDO, PDO_MySQL, JSON, Session, FileInfo
- **MySQL** 5.7+ or MariaDB 10.3+
- **Web Browser** with JavaScript enabled

## Installation

### 1. Setup XAMPP
1. Download and install [XAMPP](https://www.apachefriends.org/download.html)
2. Start Apache and MySQL services from XAMPP Control Panel

### 2. Database Setup
1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Create a new database named `it_audit_tracker`
3. Import the database schema:
   ```sql
   -- Run the contents of database/schema.sql in phpMyAdmin
   ```

### 3. Application Setup
1. Copy the `php-audit-tracker` folder to your XAMPP htdocs directory:
   ```
   C:\xampp\htdocs\php-audit-tracker\
   ```

2. Update database configuration in `config/config.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'it_audit_tracker');
   define('DB_USER', 'root');
   define('DB_PASS', ''); // Leave empty for XAMPP default
   ```

3. Set proper file permissions:
   ```bash
   chmod 755 uploads/
   chmod 755 logs/
   chmod 644 config/config.php
   ```

### 4. Access the Application
1. Open your web browser
2. Navigate to: `http://localhost/php-audit-tracker`
3. Use the demo credentials to login (see below)

## Demo Credentials

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Super Admin | superadmin@audit.com | password | Full system access |
| Audit Manager | manager@audit.com | password | Audit management |
| Auditor | auditor@audit.com | password | Audit execution |
| Management | management@audit.com | password | Executive dashboard |
| Client | client@company.com | password | Document submission |
| Department | dept@company.com | password | Department access |

## Project Structure

```
php-audit-tracker/
├── config/                 # Configuration files
│   ├── config.php         # Main configuration
│   └── database.php       # Database configuration
├── database/              # Database files
│   └── schema.sql         # Database schema
├── includes/              # PHP classes and functions
│   ├── Auth.php          # Authentication class
│   ├── User.php          # User management
│   ├── Audit.php         # Audit management
│   ├── Document.php      # Document management
│   ├── Report.php        # Report generation
│   ├── ActivityLogger.php # Activity logging
│   ├── NotificationManager.php # Notifications
│   └── functions.php     # Utility functions
├── assets/               # Static assets
│   ├── css/
│   │   └── style.css    # Custom CSS (replaces TailwindCSS)
│   ├── js/
│   │   └── app.js       # JavaScript functionality
│   └── images/          # Image assets
├── pages/               # PHP pages
│   ├── admin/          # Admin pages
│   ├── client/         # Client pages
│   ├── auth/           # Authentication pages
│   └── home.php        # Landing page
├── api/                # API endpoints
│   ├── auth/           # Authentication API
│   ├── users.php       # User management API
│   ├── audits.php      # Audit management API
│   ├── documents.php   # Document management API
│   ├── reports.php     # Report management API
│   ├── notifications.php # Notification API
│   └── activities.php  # Activity logging API
├── uploads/            # File upload directory
├── logs/              # Application logs
└── index.php          # Main entry point
```

## Configuration

### Database Configuration
Edit `config/config.php` to configure your database connection:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'it_audit_tracker');
define('DB_USER', 'root');
define('DB_PASS', '');
```

### Security Configuration
Update security settings in `config/config.php`:

```php
define('SECRET_KEY', 'your-secret-key-here');
define('SESSION_LIFETIME', 3600); // 1 hour
define('MAX_LOGIN_ATTEMPTS', 5);
```

### File Upload Configuration
Configure file upload settings:

```php
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB
define('ALLOWED_FILE_TYPES', ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png']);
```

## API Usage

The application provides RESTful API endpoints for all major operations:

### Authentication
```bash
# Login
POST /api/auth/login
{
    "email": "user@example.com",
    "password": "password",
    "remember_me": false
}

# Logout
POST /api/auth/logout
```

### User Management
```bash
# Get users
GET /api/users

# Create user
POST /api/users
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password",
    "role": "auditor",
    "department": "IT Security"
}
```

### Audit Management
```bash
# Get audits
GET /api/audits

# Create audit
POST /api/audits
{
    "title": "Q1 2024 Security Audit",
    "description": "Comprehensive security audit",
    "priority": "high",
    "audit_manager": "user_id",
    "start_date": "2024-01-01",
    "end_date": "2024-03-31"
}
```

## User Roles and Permissions

### Super Admin
- Full system access
- User management
- System configuration
- All audit operations

### Audit Manager
- Create and manage audits
- Assign auditors
- Approve reports
- User management

### Auditor
- Execute assigned audits
- Submit findings
- Upload evidence
- Generate reports

### Management
- View dashboards
- Approve reports
- View compliance scores
- Export executive reports

### Client
- View notifications
- Respond to requests
- View audit status
- Download reports

### Department
- Upload documents
- View requests
- Respond to auditors
- Track submissions

## Security Features

- **Password Hashing**: bcrypt with salt
- **Session Security**: Secure session configuration
- **CSRF Protection**: Token-based CSRF protection
- **SQL Injection Prevention**: PDO prepared statements
- **File Upload Security**: Type validation and secure storage
- **Access Control**: Role-based permissions
- **Activity Logging**: Complete audit trail
- **Input Sanitization**: All user input sanitized

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check MySQL service is running in XAMPP
   - Verify database credentials in `config/config.php`
   - Ensure database `it_audit_tracker` exists

2. **File Upload Issues**
   - Check `uploads/` directory permissions (755)
   - Verify `MAX_FILE_SIZE` setting
   - Check PHP `upload_max_filesize` setting

3. **Session Issues**
   - Check PHP session configuration
   - Verify `logs/` directory is writable
   - Clear browser cookies and cache

4. **Permission Errors**
   - Ensure proper file permissions on directories
   - Check Apache error logs
   - Verify PHP error reporting settings

### Log Files
- Application logs: `logs/` directory
- Apache logs: XAMPP Control Panel → Apache → Logs
- PHP logs: XAMPP Control Panel → Apache → Logs

## Development

### Adding New Features
1. Create new PHP classes in `includes/`
2. Add API endpoints in `api/`
3. Create pages in `pages/`
4. Update routing in `index.php`
5. Add CSS styles in `assets/css/style.css`

### Database Changes
1. Update `database/schema.sql`
2. Run migration scripts
3. Update model classes in `includes/`

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support

For support and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check application logs
4. Contact system administrator

## Changelog

### Version 1.0.0
- Initial release
- Complete audit management system
- Role-based access control
- Document management
- Reporting and analytics
- Real-time notifications
- API endpoints
- Responsive design
