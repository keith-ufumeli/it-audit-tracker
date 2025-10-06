<?php
/**
 * Simplified Index for Testing
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Define application root
define('APP_ROOT', __DIR__);

try {
    // Include configuration
    require_once APP_ROOT . '/config/config.php';
    echo "<h1>IT Audit Tracker</h1>";
    echo "<p>✓ Configuration loaded successfully</p>";
    
    // Test database connection
    require_once APP_ROOT . '/includes/Database.php';
    $db = Database::getInstance();
    $health = $db->checkHealth();
    
    if ($health['connection']) {
        echo "<p>✓ Database connection successful</p>";
    } else {
        echo "<p>✗ Database connection failed: " . $health['message'] . "</p>";
    }
    
    // Test basic routing
    $requestUri = $_SERVER['REQUEST_URI'];
    $path = parse_url($requestUri, PHP_URL_PATH);
    
    echo "<p>Request URI: " . htmlspecialchars($requestUri) . "</p>";
    echo "<p>Path: " . htmlspecialchars($path) . "</p>";
    
    // Simple routing
    if ($path === '/' || $path === '/index.php' || $path === '/index-simple.php') {
        echo "<h2>Welcome to IT Audit Tracker</h2>";
        echo "<p>Application is working correctly!</p>";
        echo "<p><a href='pages/auth/login.php'>Go to Login</a></p>";
        echo "<p><a href='test-setup.php'>Run Setup Test</a></p>";
        echo "<p><a href='minimal-test.php'>Run Minimal Test</a></p>";
    } else {
        echo "<p>Route not found: " . htmlspecialchars($path) . "</p>";
    }
    
} catch (Exception $e) {
    echo "<h1>Error</h1>";
    echo "<p>Error: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>File: " . htmlspecialchars($e->getFile()) . "</p>";
    echo "<p>Line: " . $e->getLine() . "</p>";
    echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
}
?>
