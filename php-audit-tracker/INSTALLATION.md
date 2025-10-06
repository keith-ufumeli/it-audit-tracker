# Installation Guide - IT Audit Tracker

This guide will walk you through setting up the IT Audit Tracker PHP application on XAMPP.

## Prerequisites

- Windows, macOS, or Linux operating system
- XAMPP (Apache, MySQL, PHP 7.4+)
- Web browser with JavaScript enabled
- At least 100MB free disk space

## Step 1: Install XAMPP

1. Download XAMPP from [https://www.apachefriends.org/download.html](https://www.apachefriends.org/download.html)
2. Run the installer and follow the setup wizard
3. Start XAMPP Control Panel
4. Start Apache and MySQL services

## Step 2: Setup Database

1. Open phpMyAdmin in your browser: `http://localhost/phpmyadmin`
2. Click "New" to create a new database
3. Name the database: `it_audit_tracker`
4. Set collation to: `utf8mb4_unicode_ci`
5. Click "Create"

### Import Database Schema

1. In phpMyAdmin, select the `it_audit_tracker` database
2. Click the "Import" tab
3. Click "Choose File" and select `database/schema.sql` from the project folder
4. Click "Go" to import the schema

## Step 3: Install Application

1. Copy the entire `php-audit-tracker` folder to your XAMPP htdocs directory:
   - Windows: `C:\xampp\htdocs\php-audit-tracker\`
   - macOS: `/Applications/XAMPP/htdocs/php-audit-tracker/`
   - Linux: `/opt/lampp/htdocs/php-audit-tracker/`

2. Set proper file permissions (Linux/macOS):
   ```bash
   chmod 755 php-audit-tracker/
   chmod 755 php-audit-tracker/uploads/
   chmod 755 php-audit-tracker/logs/
   chmod 644 php-audit-tracker/config/config.php
   ```

## Step 4: Configure Application

1. Open `config/config.php` in a text editor
2. Verify database settings:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'it_audit_tracker');
   define('DB_USER', 'root');
   define('DB_PASS', ''); // Leave empty for XAMPP default
   ```

3. Update security settings (optional):
   ```php
   define('SECRET_KEY', 'your-unique-secret-key-here');
   ```

## Step 5: Test Installation

1. Open your web browser
2. Navigate to: `http://localhost/php-audit-tracker`
3. You should see the landing page

### Test Login

1. Click "Sign In" or navigate to: `http://localhost/php-audit-tracker/auth/login`
2. Use demo credentials:
   - Email: `superadmin@audit.com`
   - Password: `password`
3. You should be redirected to the admin dashboard

## Step 6: Verify Functionality

### Test Admin Dashboard
1. Login as superadmin@audit.com
2. Verify you can see:
   - Dashboard statistics
   - Recent activities
   - Navigation menu
   - User information

### Test Client Dashboard
1. Logout and login as client@company.com
2. Verify you can see:
   - Client dashboard
   - Document requests
   - Notifications

### Test API Endpoints
1. Open browser developer tools (F12)
2. Go to Network tab
3. Navigate through the application
4. Verify API calls are working (status 200)

## Troubleshooting

### Common Issues

#### Database Connection Error
**Error**: "Database connection failed"
**Solution**:
1. Check MySQL is running in XAMPP Control Panel
2. Verify database name is `it_audit_tracker`
3. Check database credentials in `config/config.php`

#### File Permission Error
**Error**: "Permission denied" or "Cannot write to directory"
**Solution**:
1. Check file permissions on `uploads/` and `logs/` directories
2. Ensure Apache has write access to these directories
3. On Windows, run XAMPP as Administrator

#### 404 Not Found Error
**Error**: "Page not found" for all pages
**Solution**:
1. Check `.htaccess` file exists in project root
2. Verify Apache mod_rewrite is enabled
3. Check Apache error logs

#### Session Error
**Error**: "Session cannot be started"
**Solution**:
1. Check PHP session configuration
2. Verify `logs/` directory is writable
3. Clear browser cookies

### Checking Logs

#### Application Logs
- Location: `logs/` directory
- Files: `YYYY-MM-DD.log`

#### Apache Error Logs
- Windows: `C:\xampp\apache\logs\error.log`
- macOS: `/Applications/XAMPP/logs/apache_error.log`
- Linux: `/opt/lampp/logs/error_log`

#### PHP Error Logs
- Check `php.ini` for `error_log` setting
- Usually in Apache logs directory

## Security Configuration

### Production Setup

1. **Change Default Passwords**:
   - Update all demo user passwords
   - Use strong, unique passwords

2. **Update Secret Key**:
   ```php
   define('SECRET_KEY', 'your-very-long-random-secret-key');
   ```

3. **Enable HTTPS**:
   - Uncomment HTTPS redirect in `.htaccess`
   - Configure SSL certificate

4. **File Permissions**:
   ```bash
   chmod 600 config/config.php
   chmod 755 uploads/
   chmod 755 logs/
   ```

5. **Database Security**:
   - Create dedicated database user
   - Use strong database password
   - Limit database user permissions

## Performance Optimization

### PHP Configuration
Edit `php.ini`:
```ini
memory_limit = 256M
max_execution_time = 60
upload_max_filesize = 10M
post_max_size = 10M
```

### Apache Configuration
Enable compression in `.htaccess` (already included)

### Database Optimization
1. Add indexes for frequently queried columns
2. Regular database maintenance
3. Monitor slow queries

## Backup and Maintenance

### Database Backup
```bash
mysqldump -u root -p it_audit_tracker > backup_$(date +%Y%m%d).sql
```

### File Backup
```bash
tar -czf audit_tracker_backup_$(date +%Y%m%d).tar.gz php-audit-tracker/
```

### Regular Maintenance
1. Clean old log files
2. Optimize database tables
3. Update application files
4. Monitor disk space

## Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review application logs
3. Check Apache/PHP error logs
4. Verify XAMPP services are running
5. Test with different browsers
6. Clear browser cache and cookies

## Next Steps

After successful installation:

1. **Configure Users**: Add your organization's users
2. **Setup Audits**: Create your first audit
3. **Configure Notifications**: Set up email notifications
4. **Customize**: Modify settings for your organization
5. **Training**: Train users on the system
6. **Backup**: Set up regular backups

## Uninstallation

To remove the application:

1. Stop Apache and MySQL in XAMPP
2. Delete the `php-audit-tracker` folder from htdocs
3. Drop the `it_audit_tracker` database in phpMyAdmin
4. Clear browser cache and cookies

The application is now completely removed from your system.
