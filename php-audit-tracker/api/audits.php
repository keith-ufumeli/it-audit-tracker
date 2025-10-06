<?php
/**
 * API Audits Endpoint
 * Handle audit management via API
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__, 2));
}

require_once APP_ROOT . '/config/config.php';

// Set JSON header
header('Content-Type: application/json');

$auth = getAuth();
$auditManager = getAuditManager();

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Get audits
            $auth->requireAuth();
            
            $filters = [
                'status' => $_GET['status'] ?? null,
                'priority' => $_GET['priority'] ?? null,
                'manager' => $_GET['manager'] ?? null,
                'auditor' => $_GET['auditor'] ?? null,
                'search' => $_GET['search'] ?? null,
                'date_from' => $_GET['date_from'] ?? null,
                'date_to' => $_GET['date_to'] ?? null,
                'limit' => $_GET['limit'] ?? 50,
                'offset' => $_GET['offset'] ?? 0
            ];
            
            $audits = $auditManager->getAllAudits($filters);
            sendSuccessResponse($audits);
            break;
            
        case 'POST':
            // Create audit
            $auth->requirePermission('create_audit');
            
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                sendErrorResponse('Invalid JSON input', 400);
            }
            
            $result = $auditManager->createAudit($input);
            
            if ($result['success']) {
                sendSuccessResponse($result, 'Audit created successfully');
            } else {
                sendErrorResponse($result['message'], 400);
            }
            break;
            
        case 'PUT':
            // Update audit
            $auth->requirePermission('create_audit');
            
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                sendErrorResponse('Invalid JSON input', 400);
            }
            
            $auditId = $input['id'] ?? null;
            if (!$auditId) {
                sendErrorResponse('Audit ID is required', 400);
            }
            
            unset($input['id']); // Remove ID from update data
            $result = $auditManager->updateAudit($auditId, $input);
            
            if ($result['success']) {
                sendSuccessResponse(null, 'Audit updated successfully');
            } else {
                sendErrorResponse($result['message'], 400);
            }
            break;
            
        case 'DELETE':
            // Delete audit
            $auth->requirePermission('create_audit');
            
            $auditId = $_GET['id'] ?? null;
            if (!$auditId) {
                sendErrorResponse('Audit ID is required', 400);
            }
            
            $result = $auditManager->deleteAudit($auditId);
            
            if ($result['success']) {
                sendSuccessResponse(null, 'Audit deleted successfully');
            } else {
                sendErrorResponse($result['message'], 400);
            }
            break;
            
        default:
            sendErrorResponse('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    error_log("API Audits error: " . $e->getMessage());
    sendErrorResponse('An error occurred', 500);
}
?>
