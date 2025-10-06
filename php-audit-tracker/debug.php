<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "PHP Debug Test\n";
echo "PHP Version: " . phpversion() . "\n";

// Test basic includes
try {
    echo "Testing config...\n";
    define('APP_ROOT', __DIR__);
    require_once APP_ROOT . '/config/config.php';
    echo "Config loaded successfully\n";
} catch (Exception $e) {
    echo "Config error: " . $e->getMessage() . "\n";
    exit;
}

// Test database
try {
    echo "Testing database...\n";
    require_once APP_ROOT . '/includes/Database.php';
    $db = Database::getInstance();
    echo "Database connected successfully\n";
} catch (Exception $e) {
    echo "Database error: " . $e->getMessage() . "\n";
    exit;
}

echo "All tests passed!\n";
?>
