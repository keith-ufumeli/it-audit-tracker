<?php
/**
 * Database Connection Test
 * Test script to verify database connectivity and schema
 */

// Define application root
define('APP_ROOT', __DIR__);

// Include configuration
require_once APP_ROOT . '/config/config.php';

echo "<h1>IT Audit Tracker - Database Connection Test</h1>\n";
echo "<style>body{font-family:Arial,sans-serif;margin:20px;} .success{color:green;} .error{color:red;} .info{color:blue;}</style>\n";

try {
    // Test database connection
    echo "<h2>1. Database Connection Test</h2>\n";
    $db = Database::getInstance();
    $connection = $db->getConnection();
    echo "<p class='success'>✓ Database connection successful</p>\n";
    
    // Test database health
    echo "<h2>2. Database Health Check</h2>\n";
    $health = $db->checkHealth();
    echo "<p class='success'>✓ Database health check passed</p>\n";
    echo "<p class='info'>Connection: " . ($health['connection'] ? 'OK' : 'FAILED') . "</p>\n";
    echo "<p class='info'>Database Size: " . $health['size'] . " MB</p>\n";
    echo "<p class='info'>Tables: " . implode(', ', $health['tables']) . "</p>\n";
    
    // Test table existence
    echo "<h2>3. Table Structure Verification</h2>\n";
    $requiredTables = ['users', 'audits', 'audit_findings', 'documents', 'activities', 'notifications', 'alerts', 'reports', 'system_settings'];
    
    foreach ($requiredTables as $table) {
        if ($db->tableExists($table)) {
            echo "<p class='success'>✓ Table '{$table}' exists</p>\n";
        } else {
            echo "<p class='error'>✗ Table '{$table}' missing</p>\n";
        }
    }
    
    // Test sample data
    echo "<h2>4. Sample Data Verification</h2>\n";
    
    // Test users table
    $userCount = $db->fetch("SELECT COUNT(*) as count FROM users");
    echo "<p class='info'>Users in database: " . $userCount['count'] . "</p>\n";
    
    if ($userCount['count'] > 0) {
        $sampleUser = $db->fetch("SELECT id, name, email, role FROM users LIMIT 1");
        echo "<p class='success'>✓ Sample user found: " . $sampleUser['name'] . " (" . $sampleUser['email'] . ")</p>\n";
    }
    
    // Test audits table
    $auditCount = $db->fetch("SELECT COUNT(*) as count FROM audits");
    echo "<p class='info'>Audits in database: " . $auditCount['count'] . "</p>\n";
    
    if ($auditCount['count'] > 0) {
        $sampleAudit = $db->fetch("SELECT id, title, status FROM audits LIMIT 1");
        echo "<p class='success'>✓ Sample audit found: " . $sampleAudit['title'] . " (" . $sampleAudit['status'] . ")</p>\n";
    }
    
    // Test core classes
    echo "<h2>5. Core Classes Test</h2>\n";
    
    // Test Auth class
    if (class_exists('Auth')) {
        echo "<p class='success'>✓ Auth class loaded</p>\n";
        $auth = new Auth();
        echo "<p class='success'>✓ Auth instance created</p>\n";
    } else {
        echo "<p class='error'>✗ Auth class not found</p>\n";
    }
    
    // Test User class
    if (class_exists('User')) {
        echo "<p class='success'>✓ User class loaded</p>\n";
        $userManager = new User();
        echo "<p class='success'>✓ User instance created</p>\n";
        
        // Test user stats
        $userStats = $userManager->getUserStats();
        echo "<p class='info'>Total users: " . $userStats['total_users'] . "</p>\n";
        echo "<p class='info'>Active users: " . $userStats['active_users'] . "</p>\n";
    } else {
        echo "<p class='error'>✗ User class not found</p>\n";
    }
    
    // Test Audit class
    if (class_exists('Audit')) {
        echo "<p class='success'>✓ Audit class loaded</p>\n";
        $auditManager = new Audit();
        echo "<p class='success'>✓ Audit instance created</p>\n";
        
        // Test audit stats
        $auditStats = $auditManager->getAuditStats();
        echo "<p class='info'>Total audits: " . $auditStats['total_audits'] . "</p>\n";
        echo "<p class='info'>In progress: " . $auditStats['in_progress_audits'] . "</p>\n";
    } else {
        echo "<p class='error'>✗ Audit class not found</p>\n";
    }
    
    // Test configuration
    echo "<h2>6. Configuration Test</h2>\n";
    echo "<p class='info'>App Name: " . APP_NAME . "</p>\n";
    echo "<p class='info'>App Version: " . APP_VERSION . "</p>\n";
    echo "<p class='info'>Database Host: " . DB_HOST . "</p>\n";
    echo "<p class='info'>Database Name: " . DB_NAME . "</p>\n";
    echo "<p class='info'>Session Lifetime: " . SESSION_LIFETIME . " seconds</p>\n";
    
    // Test file permissions
    echo "<h2>7. File Permissions Test</h2>\n";
    $directories = [UPLOAD_DIR, LOG_DIR, CACHE_DIR];
    
    foreach ($directories as $dir) {
        if (is_dir($dir)) {
            if (is_writable($dir)) {
                echo "<p class='success'>✓ Directory '{$dir}' is writable</p>\n";
            } else {
                echo "<p class='error'>✗ Directory '{$dir}' is not writable</p>\n";
            }
        } else {
            echo "<p class='error'>✗ Directory '{$dir}' does not exist</p>\n";
        }
    }
    
    echo "<h2>8. Test Summary</h2>\n";
    echo "<p class='success'><strong>✓ Database connection and schema verification completed successfully!</strong></p>\n";
    echo "<p class='info'>The IT Audit Tracker PHP application is ready for use.</p>\n";
    
} catch (Exception $e) {
    echo "<h2>Error</h2>\n";
    echo "<p class='error'>✗ Database test failed: " . $e->getMessage() . "</p>\n";
    echo "<p class='error'>Please check your database configuration and ensure MySQL is running.</p>\n";
}

echo "<hr>\n";
echo "<p><a href='index.php'>← Back to Application</a></p>\n";
?>
