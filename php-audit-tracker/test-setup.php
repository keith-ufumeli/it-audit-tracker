<?php
/**
 * Simple Setup Test
 * Test basic PHP setup and database connection
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>IT Audit Tracker - Setup Test</h1>";

// Test 1: PHP Version
echo "<h2>1. PHP Version</h2>";
echo "<p>PHP Version: " . phpversion() . "</p>";

// Test 2: Required Extensions
echo "<h2>2. Required Extensions</h2>";
$required_extensions = ['pdo', 'pdo_mysql', 'json', 'mbstring', 'openssl'];
foreach ($required_extensions as $ext) {
    $status = extension_loaded($ext) ? '✓' : '✗';
    echo "<p>{$status} {$ext}</p>";
}

// Test 3: Configuration
echo "<h2>3. Configuration</h2>";
try {
    define('APP_ROOT', __DIR__);
    require_once APP_ROOT . '/config/config.php';
    echo "<p>✓ Configuration loaded successfully</p>";
    echo "<p>App Name: " . APP_NAME . "</p>";
    echo "<p>Database: " . DB_NAME . "</p>";
} catch (Exception $e) {
    echo "<p>✗ Configuration error: " . $e->getMessage() . "</p>";
}

// Test 4: Database Connection
echo "<h2>4. Database Connection</h2>";
try {
    require_once APP_ROOT . '/includes/Database.php';
    $db = Database::getInstance();
    echo "<p>✓ Database class loaded</p>";
    
    $health = $db->checkHealth();
    if ($health['connection']) {
        echo "<p>✓ Database connection successful</p>";
    } else {
        echo "<p>✗ Database connection failed: " . $health['message'] . "</p>";
    }
} catch (Exception $e) {
    echo "<p>✗ Database error: " . $e->getMessage() . "</p>";
}

// Test 5: Core Classes
echo "<h2>5. Core Classes</h2>";
$classes = ['Auth', 'User', 'Audit', 'Document', 'Report', 'ActivityLogger', 'NotificationManager'];
foreach ($classes as $class) {
    $file = APP_ROOT . '/includes/' . $class . '.php';
    if (file_exists($file)) {
        echo "<p>✓ {$class}.php exists</p>";
    } else {
        echo "<p>✗ {$class}.php missing</p>";
    }
}

// Test 6: Directory Structure
echo "<h2>6. Directory Structure</h2>";
$directories = ['config', 'includes', 'assets', 'pages', 'api', 'uploads', 'logs'];
foreach ($directories as $dir) {
    if (is_dir(APP_ROOT . '/' . $dir)) {
        echo "<p>✓ {$dir}/ directory exists</p>";
    } else {
        echo "<p>✗ {$dir}/ directory missing</p>";
    }
}

echo "<h2>Test Complete</h2>";
echo "<p>If you see any ✗ marks above, those need to be fixed before the application will work.</p>";
echo "<p><a href='index.php'>Try accessing the main application</a></p>";
?>
