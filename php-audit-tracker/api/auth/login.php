<?php
/**
 * API Login Endpoint
 * Handle authentication via API
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
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendErrorResponse('Invalid JSON input', 400);
    }
    
    $email = sanitizeInput($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $rememberMe = (bool)($input['remember_me'] ?? false);
    
    if (empty($email) || empty($password)) {
        sendErrorResponse('Email and password are required', 400);
    }
    
    $auth = getAuth();
    $result = $auth->login($email, $password, $rememberMe);
    
    if ($result['success']) {
        sendSuccessResponse($result, 'Login successful');
    } else {
        sendErrorResponse($result['message'], 401);
    }
    
} catch (Exception $e) {
    error_log("API Login error: " . $e->getMessage());
    sendErrorResponse('An error occurred during login', 500);
}
?>
