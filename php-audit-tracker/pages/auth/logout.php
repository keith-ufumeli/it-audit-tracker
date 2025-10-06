<?php
/**
 * Logout Page
 * Handle user logout
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__, 2));
}

require_once APP_ROOT . '/config/config.php';

$auth = getAuth();

// Perform logout
$result = $auth->logout();

// Redirect to login page
redirect('/auth/login');
?>
