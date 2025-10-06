<?php
/**
 * API Notifications Endpoint
 * Handle notifications via API
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__, 2));
}

require_once APP_ROOT . '/config/config.php';

// Set JSON header
header('Content-Type: application/json');

$auth = getAuth();
$notificationManager = getNotificationManager();

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Get notifications for current user
            $auth->requireAuth();
            
            $user = $auth->getCurrentUser();
            $filters = [
                'status' => $_GET['status'] ?? null,
                'type' => $_GET['type'] ?? null,
                'priority' => $_GET['priority'] ?? null,
                'unread_only' => isset($_GET['unread_only']) ? (bool)$_GET['unread_only'] : false,
                'limit' => $_GET['limit'] ?? 50,
                'offset' => $_GET['offset'] ?? 0
            ];
            
            $notifications = $notificationManager->getNotificationsByUser($user['id'], $filters);
            sendSuccessResponse($notifications);
            break;
            
        case 'POST':
            // Mark notification as read
            $auth->requireAuth();
            
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                sendErrorResponse('Invalid JSON input', 400);
            }
            
            $action = $input['action'] ?? null;
            $notificationId = $input['notification_id'] ?? null;
            
            if (!$action || !$notificationId) {
                sendErrorResponse('Action and notification ID are required', 400);
            }
            
            $user = $auth->getCurrentUser();
            $result = false;
            
            switch ($action) {
                case 'mark_read':
                    $result = $notificationManager->markAsRead($notificationId, $user['id']);
                    break;
                case 'mark_all_read':
                    $result = $notificationManager->markAllAsRead($user['id']);
                    break;
                case 'archive':
                    $result = $notificationManager->archiveNotification($notificationId, $user['id']);
                    break;
                case 'delete':
                    $result = $notificationManager->deleteNotification($notificationId, $user['id']);
                    break;
                default:
                    sendErrorResponse('Invalid action', 400);
            }
            
            if ($result) {
                sendSuccessResponse(null, 'Action completed successfully');
            } else {
                sendErrorResponse('Failed to complete action', 400);
            }
            break;
            
        default:
            sendErrorResponse('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    error_log("API Notifications error: " . $e->getMessage());
    sendErrorResponse('An error occurred', 500);
}
?>
