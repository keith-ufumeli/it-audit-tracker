<?php
// Minimal test to identify the issue
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Minimal Test</h1>";

// Test 1: Basic PHP
echo "<p>✓ PHP is working</p>";

// Test 2: Check if database exists
try {
    $pdo = new PDO("mysql:host=localhost", "root", "");
    echo "<p>✓ MySQL connection successful</p>";
    
    // Check if database exists
    $stmt = $pdo->query("SHOW DATABASES LIKE 'it_audit_tracker'");
    if ($stmt->rowCount() > 0) {
        echo "<p>✓ Database 'it_audit_tracker' exists</p>";
    } else {
        echo "<p>✗ Database 'it_audit_tracker' does not exist</p>";
        echo "<p>Please create the database first by running the schema.sql file</p>";
    }
} catch (Exception $e) {
    echo "<p>✗ MySQL connection failed: " . $e->getMessage() . "</p>";
}

// Test 3: Check file permissions
$dirs = ['uploads', 'logs', 'cache'];
foreach ($dirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
        echo "<p>✓ Created directory: {$dir}</p>";
    } else {
        echo "<p>✓ Directory exists: {$dir}</p>";
    }
}

echo "<p>Test complete. Check the results above.</p>";
?>
