<?php
/**
 * API Users Endpoint
 * Handle user management via API
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__, 2));
}

require_once APP_ROOT . '/config/config.php';

// Set JSON header
header('Content-Type: application/json');

$auth = getAuth();
$userManager = getUserManager();

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Get users
            $auth->requirePermission('manage_users');
            
            $filters = [
                'role' => $_GET['role'] ?? null,
                'department' => $_GET['department'] ?? null,
                'is_active' => isset($_GET['is_active']) ? (bool)$_GET['is_active'] : null,
                'search' => $_GET['search'] ?? null,
                'limit' => $_GET['limit'] ?? 50,
                'offset' => $_GET['offset'] ?? 0
            ];
            
            $users = $userManager->getAllUsers($filters);
            sendSuccessResponse($users);
            break;
            
        case 'POST':
            // Create user
            $auth->requirePermission('manage_users');
            
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                sendErrorResponse('Invalid JSON input', 400);
            }
            
            $result = $userManager->createUser($input);
            
            if ($result['success']) {
                sendSuccessResponse($result, 'User created successfully');
            } else {
                sendErrorResponse($result['message'], 400);
            }
            break;
            
        case 'PUT':
            // Update user
            $auth->requirePermission('manage_users');
            
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                sendErrorResponse('Invalid JSON input', 400);
            }
            
            $userId = $input['id'] ?? null;
            if (!$userId) {
                sendErrorResponse('User ID is required', 400);
            }
            
            unset($input['id']); // Remove ID from update data
            $result = $userManager->updateUser($userId, $input);
            
            if ($result['success']) {
                sendSuccessResponse(null, 'User updated successfully');
            } else {
                sendErrorResponse($result['message'], 400);
            }
            break;
            
        case 'DELETE':
            // Delete user
            $auth->requirePermission('manage_users');
            
            $userId = $_GET['id'] ?? null;
            if (!$userId) {
                sendErrorResponse('User ID is required', 400);
            }
            
            $result = $userManager->deleteUser($userId);
            
            if ($result['success']) {
                sendSuccessResponse(null, 'User deleted successfully');
            } else {
                sendErrorResponse($result['message'], 400);
            }
            break;
            
        default:
            sendErrorResponse('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    error_log("API Users error: " . $e->getMessage());
    sendErrorResponse('An error occurred', 500);
}
?>
