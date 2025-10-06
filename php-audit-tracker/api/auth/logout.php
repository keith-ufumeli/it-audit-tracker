<?php
/**
 * API Logout Endpoint
 * Handle logout via API
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__, 2));
}

require_once APP_ROOT . '/config/config.php';

// Set JSON header
header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendErrorResponse('Method not allowed', 405);
}

try {
    $auth = getAuth();
    $result = $auth->logout();
    
    if ($result['success']) {
        sendSuccessResponse(null, 'Logout successful');
    } else {
        sendErrorResponse($result['message'], 400);
    }
    
} catch (Exception $e) {
    error_log("API Logout error: " . $e->getMessage());
    sendErrorResponse('An error occurred during logout', 500);
}
?>
