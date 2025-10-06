<?php
/**
 * API Activities Endpoint
 * Handle activity logging and retrieval via API
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__, 2));
}

require_once APP_ROOT . '/config/config.php';

// Set JSON header
header('Content-Type: application/json');

$auth = getAuth();
$activityLogger = getActivityLogger();

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Get activities
            $auth->requireAuth();
            
            $filters = [
                'user_id' => $_GET['user_id'] ?? null,
                'action' => $_GET['action'] ?? null,
                'severity' => $_GET['severity'] ?? null,
                'resource' => $_GET['resource'] ?? null,
                'date_from' => $_GET['date_from'] ?? null,
                'date_to' => $_GET['date_to'] ?? null,
                'search' => $_GET['search'] ?? null,
                'limit' => $_GET['limit'] ?? 50,
                'offset' => $_GET['offset'] ?? 0
            ];
            
            // Check permissions for viewing all activities
            if ($filters['user_id'] && !$auth->hasPermission('view_all_logs')) {
                $user = $auth->getCurrentUser();
                $filters['user_id'] = $user['id']; // Only allow viewing own activities
            }
            
            $activities = $activityLogger->getActivities($filters);
            sendSuccessResponse($activities);
            break;
            
        case 'POST':
            // Log activity
            $auth->requireAuth();
            
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                sendErrorResponse('Invalid JSON input', 400);
            }
            
            $required = ['action', 'description'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    sendErrorResponse("Field '{$field}' is required", 400);
                }
            }
            
            $user = $auth->getCurrentUser();
            
            $activityId = $activityLogger->log(
                $user['id'],
                $user['name'],
                $user['role'],
                $input['action'],
                $input['description'],
                $input['severity'] ?? 'info',
                $input['resource'] ?? null,
                $input['metadata'] ?? null
            );
            
            if ($activityId) {
                sendSuccessResponse(['activity_id' => $activityId], 'Activity logged successfully');
            } else {
                sendErrorResponse('Failed to log activity', 500);
            }
            break;
            
        default:
            sendErrorResponse('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    error_log("API Activities error: " . $e->getMessage());
    sendErrorResponse('An error occurred', 500);
}
?>
