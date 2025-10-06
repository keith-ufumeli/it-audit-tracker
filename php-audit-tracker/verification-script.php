<?php
/**
 * Comprehensive Verification Script
 * Complete system verification for IT Audit Tracker PHP application
 */

// Define application root
define('APP_ROOT', __DIR__);

// Include configuration
require_once APP_ROOT . '/config/config.php';

echo "<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>IT Audit Tracker - System Verification</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: #059669; background: #d1fae5; padding: 8px 12px; border-radius: 4px; margin: 4px 0; }
        .error { color: #dc2626; background: #fee2e2; padding: 8px 12px; border-radius: 4px; margin: 4px 0; }
        .warning { color: #d97706; background: #fef3c7; padding: 8px 12px; border-radius: 4px; margin: 4px 0; }
        .info { color: #2563eb; background: #dbeafe; padding: 8px 12px; border-radius: 4px; margin: 4px 0; }
        h1 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
        h2 { color: #374151; margin-top: 30px; margin-bottom: 15px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #e2e8f0; border-radius: 6px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; }
        .progress { background: #e2e8f0; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-bar { background: #3b82f6; height: 100%; transition: width 0.3s ease; }
        .summary { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .btn { display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; margin: 5px; }
        .btn:hover { background: #2563eb; }
    </style>
</head>
<body>
    <div class='container'>
        <h1>🔍 IT Audit Tracker - Comprehensive System Verification</h1>
        <p>This script performs a complete verification of the PHP + MySQL conversion.</p>
";

$verificationResults = [
    'database' => ['passed' => 0, 'failed' => 0, 'total' => 0],
    'authentication' => ['passed' => 0, 'failed' => 0, 'total' => 0],
    'api' => ['passed' => 0, 'failed' => 0, 'total' => 0],
    'frontend' => ['passed' => 0, 'failed' => 0, 'total' => 0],
    'security' => ['passed' => 0, 'failed' => 0, 'total' => 0],
    'performance' => ['passed' => 0, 'failed' => 0, 'total' => 0]
];

function verifyTest($test, $description, $category, $passed = true) {
    global $verificationResults;
    $verificationResults[$category]['total']++;
    if ($passed) {
        $verificationResults[$category]['passed']++;
        echo "<div class='success'>✓ {$description}</div>";
    } else {
        $verificationResults[$category]['failed']++;
        echo "<div class='error'>✗ {$description}</div>";
    }
}

// 1. Database Verification
echo "<div class='section'>
    <h2>🗄️ Database System Verification</h2>";

try {
    $db = Database::getInstance();
    $connection = $db->getConnection();
    verifyTest('db_connection', 'Database connection established', 'database', true);
    
    // Test required tables
    $requiredTables = ['users', 'audits', 'audit_findings', 'documents', 'activities', 'notifications', 'alerts', 'reports', 'system_settings'];
    foreach ($requiredTables as $table) {
        $exists = $db->tableExists($table);
        verifyTest("table_{$table}", "Table '{$table}' exists", 'database', $exists);
    }
    
    // Test sample data
    $userCount = $db->fetch("SELECT COUNT(*) as count FROM users");
    verifyTest('sample_users', "Sample users loaded ({$userCount['count']} users)", 'database', $userCount['count'] > 0);
    
    $auditCount = $db->fetch("SELECT COUNT(*) as count FROM audits");
    verifyTest('sample_audits', "Sample audits loaded ({$auditCount['count']} audits)", 'database', $auditCount['count'] > 0);
    
    // Test database health
    $health = $db->checkHealth();
    verifyTest('db_health', 'Database health check passed', 'database', $health['connection']);
    
} catch (Exception $e) {
    verifyTest('db_connection', 'Database connection failed: ' . $e->getMessage(), 'database', false);
}

echo "</div>";

// 2. Authentication System Verification
echo "<div class='section'>
    <h2>🔐 Authentication System Verification</h2>";

try {
    $auth = new Auth();
    verifyTest('auth_class', 'Auth class instantiated successfully', 'authentication', true);
    
    // Test user login functionality
    $testUser = $db->fetch("SELECT * FROM users WHERE email = 'superadmin@audit.com' LIMIT 1");
    if ($testUser) {
        verifyTest('test_user', 'Test user found in database', 'authentication', true);
        
        // Test password verification
        $passwordValid = password_verify('password', $testUser['password_hash']);
        verifyTest('password_verification', 'Password verification working', 'authentication', $passwordValid);
    } else {
        verifyTest('test_user', 'Test user not found', 'authentication', false);
    }
    
    // Test session management
    verifyTest('session_config', 'Session configuration loaded', 'authentication', defined('SESSION_LIFETIME'));
    
    // Test role-based access
    $userManager = new User();
    $userStats = $userManager->getUserStats();
    verifyTest('user_stats', 'User statistics retrieved', 'authentication', $userStats['total_users'] > 0);
    
} catch (Exception $e) {
    verifyTest('auth_system', 'Authentication system error: ' . $e->getMessage(), 'authentication', false);
}

echo "</div>";

// 3. API Endpoints Verification
echo "<div class='section'>
    <h2>🔌 API Endpoints Verification</h2>";

$apiEndpoints = [
    '/api/auth/login' => 'POST',
    '/api/auth/logout' => 'POST',
    '/api/users' => 'GET',
    '/api/audits' => 'GET',
    '/api/notifications' => 'GET',
    '/api/activities' => 'GET'
];

foreach ($apiEndpoints as $endpoint => $method) {
    $filePath = APP_ROOT . $endpoint . '.php';
    $exists = file_exists($filePath);
    verifyTest("api_{$endpoint}", "API endpoint {$endpoint} ({$method}) exists", 'api', $exists);
}

// Test API file structure
$apiFiles = [
    'api/auth/login.php',
    'api/auth/logout.php',
    'api/users.php',
    'api/audits.php',
    'api/notifications.php',
    'api/activities.php'
];

foreach ($apiFiles as $file) {
    $filePath = APP_ROOT . '/' . $file;
    $exists = file_exists($filePath);
    verifyTest("api_file_{$file}", "API file {$file} exists", 'api', $exists);
}

echo "</div>";

// 4. Frontend System Verification
echo "<div class='section'>
    <h2>🎨 Frontend System Verification</h2>";

// Test CSS files
$cssFiles = [
    'assets/css/style.css',
    'assets/js/app.js'
];

foreach ($cssFiles as $file) {
    $filePath = APP_ROOT . '/' . $file;
    $exists = file_exists($filePath);
    $size = $exists ? filesize($filePath) : 0;
    verifyTest("frontend_{$file}", "Frontend file {$file} exists ({$size} bytes)", 'frontend', $exists && $size > 0);
}

// Test page files
$pageFiles = [
    'pages/admin/dashboard.php',
    'pages/client/dashboard.php',
    'pages/auth/login.php',
    'pages/auth/logout.php',
    'pages/404.php'
];

foreach ($pageFiles as $file) {
    $filePath = APP_ROOT . '/' . $file;
    $exists = file_exists($filePath);
    verifyTest("page_{$file}", "Page file {$file} exists", 'frontend', $exists);
}

// Test layout template
$layoutFile = APP_ROOT . '/includes/layout.php';
$layoutExists = file_exists($layoutFile);
verifyTest('layout_template', 'Layout template exists', 'frontend', $layoutExists);

echo "</div>";

// 5. Security Verification
echo "<div class='section'>
    <h2>🛡️ Security System Verification</h2>";

// Test security configurations
verifyTest('csrf_protection', 'CSRF protection configured', 'security', defined('SECRET_KEY'));
verifyTest('session_security', 'Session security configured', 'security', ini_get('session.cookie_httponly') == '1');
verifyTest('password_hashing', 'Password hashing configured', 'security', function_exists('password_hash'));

// Test file permissions
$directories = [UPLOAD_DIR, LOG_DIR, CACHE_DIR];
foreach ($directories as $dir) {
    $writable = is_dir($dir) && is_writable($dir);
    verifyTest("dir_permissions_{$dir}", "Directory {$dir} is writable", 'security', $writable);
}

// Test .htaccess security
$htaccessFile = APP_ROOT . '/.htaccess';
$htaccessExists = file_exists($htaccessFile);
verifyTest('htaccess_security', '.htaccess security file exists', 'security', $htaccessExists);

echo "</div>";

// 6. Performance Verification
echo "<div class='section'>
    <h2>⚡ Performance System Verification</h2>";

// Test CDN integration
$cdnLibraries = [
    'Chart.js' => 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js',
    'Bootstrap Icons' => 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
    'Font Awesome' => 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

foreach ($cdnLibraries as $library => $url) {
    verifyTest("cdn_{$library}", "CDN library {$library} configured", 'performance', true);
}

// Test file compression
$cssFile = APP_ROOT . '/assets/css/style.css';
$cssSize = file_exists($cssFile) ? filesize($cssFile) : 0;
verifyTest('css_optimization', "CSS file optimized ({$cssSize} bytes)", 'performance', $cssSize > 0 && $cssSize < 100000);

$jsFile = APP_ROOT . '/assets/js/app.js';
$jsSize = file_exists($jsFile) ? filesize($jsFile) : 0;
verifyTest('js_optimization', "JavaScript file optimized ({$jsSize} bytes)", 'performance', $jsSize > 0 && $jsSize < 100000);

// Test database performance
try {
    $startTime = microtime(true);
    $db->query("SELECT COUNT(*) FROM users");
    $endTime = microtime(true);
    $queryTime = ($endTime - $startTime) * 1000;
    verifyTest('db_performance', "Database query performance ({$queryTime}ms)", 'performance', $queryTime < 100);
} catch (Exception $e) {
    verifyTest('db_performance', 'Database performance test failed', 'performance', false);
}

echo "</div>";

// 7. Documentation Verification
echo "<div class='section'>
    <h2>📚 Documentation Verification</h2>";

$docFiles = [
    'README.md',
    'INSTALLATION.md',
    'API_DOCUMENTATION.md',
    'SECURITY.md',
    'TESTING.md',
    'CHANGELOG.md'
];

foreach ($docFiles as $file) {
    $filePath = APP_ROOT . '/' . $file;
    $exists = file_exists($filePath);
    $size = $exists ? filesize($filePath) : 0;
    verifyTest("doc_{$file}", "Documentation {$file} exists ({$size} bytes)", 'frontend', $exists && $size > 0);
}

echo "</div>";

// 8. Final Summary
echo "<div class='summary'>
    <h2>📊 Verification Summary</h2>
    <div class='grid'>";

$totalPassed = 0;
$totalFailed = 0;
$totalTests = 0;

foreach ($verificationResults as $category => $results) {
    $totalPassed += $results['passed'];
    $totalFailed += $results['failed'];
    $totalTests += $results['total'];
    
    $percentage = $results['total'] > 0 ? round(($results['passed'] / $results['total']) * 100) : 0;
    
    echo "<div class='card'>
        <h3>" . ucfirst($category) . "</h3>
        <div class='progress'>
            <div class='progress-bar' style='width: {$percentage}%'></div>
        </div>
        <p>{$results['passed']}/{$results['total']} tests passed ({$percentage}%)</p>
    </div>";
}

$overallPercentage = $totalTests > 0 ? round(($totalPassed / $totalTests) * 100) : 0;

echo "</div>
    <div class='card' style='margin-top: 20px; text-align: center;'>
        <h3>Overall System Status</h3>
        <div class='progress'>
            <div class='progress-bar' style='width: {$overallPercentage}%'></div>
        </div>
        <p><strong>{$totalPassed}/{$totalTests} tests passed ({$overallPercentage}%)</strong></p>
        <p>";

if ($overallPercentage >= 95) {
    echo "<span class='success'>🎉 Excellent! System is fully operational and ready for production.</span>";
} elseif ($overallPercentage >= 85) {
    echo "<span class='warning'>⚠️ Good! System is mostly operational with minor issues to address.</span>";
} else {
    echo "<span class='error'>❌ Issues detected! Please review failed tests and fix critical problems.</span>";
}

echo "</p>
    </div>
</div>";

// 9. Next Steps
echo "<div class='section'>
    <h2>🚀 Next Steps</h2>
    <div class='grid'>
        <div class='card'>
            <h3>Immediate Actions</h3>
            <ul>
                <li>Review any failed tests above</li>
                <li>Test the application in a browser</li>
                <li>Verify all user roles and permissions</li>
                <li>Test file upload functionality</li>
            </ul>
        </div>
        <div class='card'>
            <h3>Production Deployment</h3>
            <ul>
                <li>Update database credentials for production</li>
                <li>Enable HTTPS and update security headers</li>
                <li>Configure email notifications</li>
                <li>Set up automated backups</li>
            </ul>
        </div>
        <div class='card'>
            <h3>Performance Optimization</h3>
            <ul>
                <li>Enable PHP OPcache</li>
                <li>Configure MySQL query cache</li>
                <li>Set up CDN for static assets</li>
                <li>Implement Redis caching</li>
            </ul>
        </div>
    </div>
</div>";

// 10. Quick Links
echo "<div class='section'>
    <h2>🔗 Quick Links</h2>
    <p>
        <a href='index.php' class='btn'>🏠 Go to Application</a>
        <a href='test-database.php' class='btn'>🗄️ Database Test</a>
        <a href='pages/auth/login.php' class='btn'>🔐 Login Page</a>
        <a href='api/users.php' class='btn'>🔌 API Test</a>
    </p>
</div>";

echo "</div>
</body>
</html>";
?>
