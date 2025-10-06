<?php
/**
 * IT Audit Tracker Configuration
 * Main configuration file for the PHP application
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

// Application Configuration
define('APP_NAME', 'IT Audit Tracker');
define('APP_VERSION', '1.0.0');
define('APP_ENV', 'development'); // development, staging, production
define('APP_DEBUG', true);
define('BASE_URL', 'http://localhost/php-audit-tracker');

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'it_audit_tracker');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', 'utf8mb4_unicode_ci');

// Security Configuration
define('SECRET_KEY', '3feef70c5714aaebad30bde3bdfab39886d832db27c62405ab3517a2f27f59b5');
define('SESSION_NAME', 'IT_AUDIT_SESSION');
define('SESSION_LIFETIME', 3600); // 1 hour
define('PASSWORD_MIN_LENGTH', 8);
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_TIME', 900); // 15 minutes

// File Upload Configuration
define('UPLOAD_DIR', APP_ROOT . '/uploads/');
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB
define('ALLOWED_FILE_TYPES', ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png']);
define('UPLOAD_CHUNK_SIZE', 1024 * 1024); // 1MB chunks

// Email Configuration (for notifications)
define('SMTP_HOST', 'localhost');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', '');
define('SMTP_PASSWORD', '');
define('SMTP_FROM_EMAIL', 'noreply@audittracker.local');
define('SMTP_FROM_NAME', 'IT Audit Tracker');

// Logging Configuration
define('LOG_DIR', APP_ROOT . '/logs/');
define('LOG_LEVEL', 'DEBUG'); // DEBUG, INFO, WARNING, ERROR, CRITICAL
define('LOG_MAX_FILES', 30);
define('LOG_MAX_SIZE', 10 * 1024 * 1024); // 10MB

// Cache Configuration
define('CACHE_ENABLED', true);
define('CACHE_DIR', APP_ROOT . '/cache/');
define('CACHE_LIFETIME', 3600); // 1 hour

// API Configuration
define('API_RATE_LIMIT', 100); // requests per minute
define('API_TIMEOUT', 30); // seconds

// User Roles and Permissions
define('USER_ROLES', [
    'super_admin' => 'Super Administrator',
    'audit_manager' => 'Audit Manager',
    'auditor' => 'Auditor',
    'management' => 'Management',
    'client' => 'Client',
    'department' => 'Department'
]);

define('DEFAULT_PERMISSIONS', [
    'super_admin' => [
        'super_admin_access',
        'manage_all_users',
        'manage_permissions',
        'manage_system_settings',
        'manage_database_config',
        'view_all_logs',
        'export_all_data',
        'create_audit',
        'assign_tasks',
        'view_reports',
        'approve_audits',
        'manage_notifications',
        'manage_reports',
        'manage_alerts'
    ],
    'audit_manager' => [
        'create_audit',
        'assign_tasks',
        'view_reports',
        'manage_users',
        'view_all_logs',
        'approve_audits',
        'export_data'
    ],
    'auditor' => [
        'view_logs',
        'submit_reports',
        'request_documents',
        'flag_activities',
        'view_assigned_audits',
        'upload_evidence'
    ],
    'management' => [
        'view_dashboards',
        'approve_reports',
        'view_summaries',
        'view_compliance_scores',
        'export_executive_reports'
    ],
    'client' => [
        'view_notifications',
        'respond_requests',
        'view_audit_status',
        'download_reports'
    ],
    'department' => [
        'upload_documents',
        'view_requests',
        'respond_to_auditors',
        'track_submissions'
    ]
]);

// Audit Status and Priority Options
define('AUDIT_STATUSES', [
    'planning' => 'Planning',
    'in_progress' => 'In Progress',
    'completed' => 'Completed',
    'cancelled' => 'Cancelled'
]);

define('AUDIT_PRIORITIES', [
    'low' => 'Low',
    'medium' => 'Medium',
    'high' => 'High',
    'critical' => 'Critical'
]);

define('DOCUMENT_TYPES', [
    'policy' => 'Policy',
    'procedure' => 'Procedure',
    'log' => 'Log',
    'plan' => 'Plan',
    'report' => 'Report',
    'evidence' => 'Evidence'
]);

define('DOCUMENT_STATUSES', [
    'draft' => 'Draft',
    'pending' => 'Pending',
    'submitted' => 'Submitted',
    'approved' => 'Approved',
    'rejected' => 'Rejected'
]);

// Notification Types
define('NOTIFICATION_TYPES', [
    'audit_request' => 'Audit Request',
    'document_request' => 'Document Request',
    'document_upload' => 'Document Upload',
    'audit_assignment' => 'Audit Assignment',
    'report_ready' => 'Report Ready',
    'security_alert' => 'Security Alert',
    'system_update' => 'System Update'
]);

// Timezone Configuration
date_default_timezone_set('UTC');

// Error Reporting
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Session Configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 0); // Set to 1 in production with HTTPS
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_samesite', 'Strict');

// Create necessary directories if they don't exist
$directories = [
    UPLOAD_DIR,
    LOG_DIR,
    CACHE_DIR
];

foreach ($directories as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Helper function to get configuration value
function getConfig($key, $default = null) {
    return defined($key) ? constant($key) : $default;
}

// Helper function to check if user has permission
function hasPermission($userPermissions, $requiredPermission) {
    if (!is_array($userPermissions)) {
        $userPermissions = json_decode($userPermissions, true) ?? [];
    }
    return in_array($requiredPermission, $userPermissions);
}

// Helper function to check if user has role
function hasRole($userRole, $requiredRoles) {
    if (!is_array($requiredRoles)) {
        $requiredRoles = [$requiredRoles];
    }
    return in_array($userRole, $requiredRoles);
}

// Helper function to get portal route based on role
function getPortalRoute($role) {
    switch ($role) {
        case 'super_admin':
        case 'audit_manager':
        case 'auditor':
        case 'management':
            return '/admin/dashboard';
        case 'client':
        case 'department':
            return '/client/dashboard';
        default:
            return '/';
    }
}

// Helper function to check if user is Super Admin
function isSuperAdmin($userRole) {
    return $userRole === 'super_admin';
}

// Helper function to check if user has admin access
function hasAdminAccess($userRole) {
    return in_array($userRole, ['super_admin', 'audit_manager', 'auditor', 'management']);
}

// Helper function to generate unique ID
function generateId($prefix = '') {
    return $prefix . uniqid() . '_' . bin2hex(random_bytes(4));
}

// Helper function to sanitize input
function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

// Helper function to format date
function formatDate($date, $format = 'Y-m-d H:i:s') {
    if (is_string($date)) {
        $date = new DateTime($date);
    }
    return $date->format($format);
}

// Helper function to get relative time
function getRelativeTime($date) {
    $time = time() - strtotime($date);
    
    if ($time < 60) return 'just now';
    if ($time < 3600) return floor($time/60) . ' minutes ago';
    if ($time < 86400) return floor($time/3600) . ' hours ago';
    if ($time < 2592000) return floor($time/86400) . ' days ago';
    if ($time < 31536000) return floor($time/2592000) . ' months ago';
    
    return floor($time/31536000) . ' years ago';
}

// Helper function to log activity
function logActivity($userId, $userName, $userRole, $action, $description, $severity = 'info', $resource = null, $metadata = null) {
    $activityLogger = new ActivityLogger();
    return $activityLogger->log($userId, $userName, $userRole, $action, $description, $severity, $resource, $metadata);
}

// Helper function to send notification
function sendNotification($userId, $userName, $userRole, $title, $message, $type, $priority = 'medium', $metadata = null) {
    $notificationManager = new NotificationManager();
    return $notificationManager->create($userId, $userName, $userRole, $title, $message, $type, $priority, $metadata);
}

// Autoloader for classes
spl_autoload_register(function ($class) {
    $file = APP_ROOT . '/includes/' . $class . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

// Include common functions
require_once APP_ROOT . '/includes/functions.php';
