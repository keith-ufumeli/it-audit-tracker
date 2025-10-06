<?php
/**
 * Audit Management Class
 * Handles audit operations, findings, and progress tracking
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

require_once APP_ROOT . '/config/config.php';
require_once APP_ROOT . '/config/database.php';

class Audit {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Get all audits
     */
    public function getAllAudits($filters = []) {
        $sql = "SELECT a.*, u.name as manager_name FROM audits a 
                LEFT JOIN users u ON a.audit_manager = u.id WHERE 1=1";
        $params = [];
        
        // Apply filters
        if (!empty($filters['status'])) {
            $sql .= " AND a.status = :status";
            $params['status'] = $filters['status'];
        }
        
        if (!empty($filters['priority'])) {
            $sql .= " AND a.priority = :priority";
            $params['priority'] = $filters['priority'];
        }
        
        if (!empty($filters['manager'])) {
            $sql .= " AND a.audit_manager = :manager";
            $params['manager'] = $filters['manager'];
        }
        
        if (!empty($filters['auditor'])) {
            $sql .= " AND JSON_CONTAINS(a.assigned_auditors, :auditor_json)";
            $params['auditor_json'] = json_encode($filters['auditor']);
        }
        
        if (!empty($filters['search'])) {
            $sql .= " AND (a.title LIKE :search OR a.description LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }
        
        if (!empty($filters['date_from'])) {
            $sql .= " AND a.start_date >= :date_from";
            $params['date_from'] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $sql .= " AND a.end_date <= :date_to";
            $params['date_to'] = $filters['date_to'];
        }
        
        $sql .= " ORDER BY a.created_at DESC";
        
        // Add pagination
        if (!empty($filters['limit'])) {
            $sql .= " LIMIT :limit";
            $params['limit'] = (int)$filters['limit'];
            
            if (!empty($filters['offset'])) {
                $sql .= " OFFSET :offset";
                $params['offset'] = (int)$filters['offset'];
            }
        }
        
        $audits = $this->db->fetchAll($sql, $params);
        
        // Process audits to add additional data
        foreach ($audits as &$audit) {
            $audit['assigned_auditors'] = json_decode($audit['assigned_auditors'], true) ?? [];
            $audit['scope'] = json_decode($audit['scope'], true) ?? [];
            $audit['compliance_frameworks'] = json_decode($audit['compliance_frameworks'], true) ?? [];
            $audit['auditor_names'] = $this->getAuditorNames($audit['assigned_auditors']);
            $audit['findings_count'] = $this->getFindingsCount($audit['id']);
            $audit['documents_count'] = $this->getDocumentsCount($audit['id']);
        }
        
        return $audits;
    }
    
    /**
     * Get audit by ID
     */
    public function getAuditById($id) {
        $sql = "SELECT a.*, u.name as manager_name FROM audits a 
                LEFT JOIN users u ON a.audit_manager = u.id 
                WHERE a.id = :id";
        
        $audit = $this->db->fetch($sql, ['id' => $id]);
        
        if ($audit) {
            $audit['assigned_auditors'] = json_decode($audit['assigned_auditors'], true) ?? [];
            $audit['scope'] = json_decode($audit['scope'], true) ?? [];
            $audit['compliance_frameworks'] = json_decode($audit['compliance_frameworks'], true) ?? [];
            $audit['auditor_names'] = $this->getAuditorNames($audit['assigned_auditors']);
            $audit['findings'] = $this->getAuditFindings($id);
            $audit['documents'] = $this->getAuditDocuments($id);
            $audit['reports'] = $this->getAuditReports($id);
        }
        
        return $audit;
    }
    
    /**
     * Create new audit
     */
    public function createAudit($data) {
        try {
            // Validate required fields
            $required = ['title', 'description', 'priority', 'audit_manager', 'start_date', 'end_date'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    return ['success' => false, 'message' => "Field '{$field}' is required"];
                }
            }
            
            // Validate dates
            if (!isValidDate($data['start_date']) || !isValidDate($data['end_date'])) {
                return ['success' => false, 'message' => 'Invalid date format'];
            }
            
            if (strtotime($data['start_date']) > strtotime($data['end_date'])) {
                return ['success' => false, 'message' => 'Start date cannot be after end date'];
            }
            
            // Validate priority
            if (!array_key_exists($data['priority'], AUDIT_PRIORITIES)) {
                return ['success' => false, 'message' => 'Invalid priority'];
            }
            
            // Check if manager exists
            $userManager = new User();
            if (!$userManager->getUserById($data['audit_manager'])) {
                return ['success' => false, 'message' => 'Invalid audit manager'];
            }
            
            // Generate audit ID
            $auditId = generateId('audit_');
            
            // Prepare audit data
            $auditData = [
                'id' => $auditId,
                'title' => sanitizeInput($data['title']),
                'description' => sanitizeInput($data['description']),
                'status' => 'planning',
                'priority' => $data['priority'],
                'audit_manager' => $data['audit_manager'],
                'assigned_auditors' => json_encode($data['assigned_auditors'] ?? []),
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'scope' => json_encode($data['scope'] ?? []),
                'compliance_frameworks' => json_encode($data['compliance_frameworks'] ?? []),
                'progress' => 0,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            // Insert audit
            $this->db->insert('audits', $auditData);
            
            // Log activity
            $this->logActivity($auditId, 'System', 'audit_manager', 'audit_created', "New audit created: {$data['title']}", 'info', 'audit_management');
            
            return [
                'success' => true,
                'message' => 'Audit created successfully',
                'audit_id' => $auditId
            ];
            
        } catch (Exception $e) {
            error_log("Create audit error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to create audit'];
        }
    }
    
    /**
     * Update audit
     */
    public function updateAudit($id, $data) {
        try {
            // Check if audit exists
            $audit = $this->getAuditById($id);
            if (!$audit) {
                return ['success' => false, 'message' => 'Audit not found'];
            }
            
            // Validate dates if provided
            if (!empty($data['start_date']) && !isValidDate($data['start_date'])) {
                return ['success' => false, 'message' => 'Invalid start date format'];
            }
            
            if (!empty($data['end_date']) && !isValidDate($data['end_date'])) {
                return ['success' => false, 'message' => 'Invalid end date format'];
            }
            
            if (!empty($data['start_date']) && !empty($data['end_date'])) {
                if (strtotime($data['start_date']) > strtotime($data['end_date'])) {
                    return ['success' => false, 'message' => 'Start date cannot be after end date'];
                }
            }
            
            // Validate status if provided
            if (!empty($data['status']) && !array_key_exists($data['status'], AUDIT_STATUSES)) {
                return ['success' => false, 'message' => 'Invalid status'];
            }
            
            // Validate priority if provided
            if (!empty($data['priority']) && !array_key_exists($data['priority'], AUDIT_PRIORITIES)) {
                return ['success' => false, 'message' => 'Invalid priority'];
            }
            
            // Prepare update data
            $updateData = ['updated_at' => date('Y-m-d H:i:s')];
            
            if (!empty($data['title'])) {
                $updateData['title'] = sanitizeInput($data['title']);
            }
            
            if (!empty($data['description'])) {
                $updateData['description'] = sanitizeInput($data['description']);
            }
            
            if (!empty($data['status'])) {
                $updateData['status'] = $data['status'];
            }
            
            if (!empty($data['priority'])) {
                $updateData['priority'] = $data['priority'];
            }
            
            if (!empty($data['audit_manager'])) {
                $updateData['audit_manager'] = $data['audit_manager'];
            }
            
            if (isset($data['assigned_auditors'])) {
                $updateData['assigned_auditors'] = json_encode($data['assigned_auditors']);
            }
            
            if (!empty($data['start_date'])) {
                $updateData['start_date'] = $data['start_date'];
            }
            
            if (!empty($data['end_date'])) {
                $updateData['end_date'] = $data['end_date'];
            }
            
            if (isset($data['scope'])) {
                $updateData['scope'] = json_encode($data['scope']);
            }
            
            if (isset($data['compliance_frameworks'])) {
                $updateData['compliance_frameworks'] = json_encode($data['compliance_frameworks']);
            }
            
            if (isset($data['progress'])) {
                $updateData['progress'] = min(100, max(0, (int)$data['progress']));
            }
            
            // Update audit
            $this->db->update('audits', $updateData, 'id = :id', ['id' => $id]);
            
            // Log activity
            $this->logActivity($id, 'System', 'audit_manager', 'audit_updated', "Audit updated: {$audit['title']}", 'info', 'audit_management');
            
            return ['success' => true, 'message' => 'Audit updated successfully'];
            
        } catch (Exception $e) {
            error_log("Update audit error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to update audit'];
        }
    }
    
    /**
     * Delete audit
     */
    public function deleteAudit($id) {
        try {
            // Check if audit exists
            $audit = $this->getAuditById($id);
            if (!$audit) {
                return ['success' => false, 'message' => 'Audit not found'];
            }
            
            // Check if audit has findings
            if ($this->getFindingsCount($id) > 0) {
                return ['success' => false, 'message' => 'Cannot delete audit with findings'];
            }
            
            // Check if audit has documents
            if ($this->getDocumentsCount($id) > 0) {
                return ['success' => false, 'message' => 'Cannot delete audit with documents'];
            }
            
            // Delete audit
            $this->db->delete('audits', 'id = :id', ['id' => $id]);
            
            // Log activity
            $this->logActivity($id, 'System', 'audit_manager', 'audit_deleted', "Audit deleted: {$audit['title']}", 'warning', 'audit_management');
            
            return ['success' => true, 'message' => 'Audit deleted successfully'];
            
        } catch (Exception $e) {
            error_log("Delete audit error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to delete audit'];
        }
    }
    
    /**
     * Update audit progress
     */
    public function updateProgress($id, $progress) {
        try {
            $progress = min(100, max(0, (int)$progress));
            
            $this->db->update('audits', [
                'progress' => $progress,
                'updated_at' => date('Y-m-d H:i:s')
            ], 'id = :id', ['id' => $id]);
            
            // Auto-update status based on progress
            if ($progress >= 100) {
                $this->db->update('audits', [
                    'status' => 'completed',
                    'updated_at' => date('Y-m-d H:i:s')
                ], 'id = :id', ['id' => $id]);
            } elseif ($progress > 0) {
                $this->db->update('audits', [
                    'status' => 'in_progress',
                    'updated_at' => date('Y-m-d H:i:s')
                ], 'id = :id', ['id' => $id]);
            }
            
            return ['success' => true, 'message' => 'Progress updated successfully'];
            
        } catch (Exception $e) {
            error_log("Update progress error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to update progress'];
        }
    }
    
    /**
     * Get audit findings
     */
    public function getAuditFindings($auditId) {
        $sql = "SELECT af.*, u.name as assigned_to_name FROM audit_findings af 
                LEFT JOIN users u ON af.assigned_to = u.id 
                WHERE af.audit_id = :audit_id ORDER BY af.created_at DESC";
        
        return $this->db->fetchAll($sql, ['audit_id' => $auditId]);
    }
    
    /**
     * Add audit finding
     */
    public function addFinding($auditId, $data) {
        try {
            // Validate required fields
            $required = ['title', 'severity', 'description', 'recommendation'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    return ['success' => false, 'message' => "Field '{$field}' is required"];
                }
            }
            
            // Check if audit exists
            if (!$this->getAuditById($auditId)) {
                return ['success' => false, 'message' => 'Audit not found'];
            }
            
            // Generate finding ID
            $findingId = generateId('finding_');
            
            // Prepare finding data
            $findingData = [
                'id' => $findingId,
                'audit_id' => $auditId,
                'title' => sanitizeInput($data['title']),
                'severity' => $data['severity'],
                'status' => 'open',
                'description' => sanitizeInput($data['description']),
                'recommendation' => sanitizeInput($data['recommendation']),
                'assigned_to' => $data['assigned_to'] ?? null,
                'due_date' => $data['due_date'] ?? null,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            // Insert finding
            $this->db->insert('audit_findings', $findingData);
            
            // Log activity
            $this->logActivity($auditId, 'System', 'auditor', 'finding_added', "New finding added: {$data['title']}", 'info', 'audit_management');
            
            return [
                'success' => true,
                'message' => 'Finding added successfully',
                'finding_id' => $findingId
            ];
            
        } catch (Exception $e) {
            error_log("Add finding error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to add finding'];
        }
    }
    
    /**
     * Update finding
     */
    public function updateFinding($findingId, $data) {
        try {
            // Check if finding exists
            $sql = "SELECT * FROM audit_findings WHERE id = :id";
            $finding = $this->db->fetch($sql, ['id' => $findingId]);
            
            if (!$finding) {
                return ['success' => false, 'message' => 'Finding not found'];
            }
            
            // Prepare update data
            $updateData = ['updated_at' => date('Y-m-d H:i:s')];
            
            if (!empty($data['title'])) {
                $updateData['title'] = sanitizeInput($data['title']);
            }
            
            if (!empty($data['severity'])) {
                $updateData['severity'] = $data['severity'];
            }
            
            if (!empty($data['status'])) {
                $updateData['status'] = $data['status'];
                
                // Set resolved_at if status is resolved
                if ($data['status'] === 'resolved') {
                    $updateData['resolved_at'] = date('Y-m-d H:i:s');
                }
            }
            
            if (!empty($data['description'])) {
                $updateData['description'] = sanitizeInput($data['description']);
            }
            
            if (!empty($data['recommendation'])) {
                $updateData['recommendation'] = sanitizeInput($data['recommendation']);
            }
            
            if (isset($data['assigned_to'])) {
                $updateData['assigned_to'] = $data['assigned_to'];
            }
            
            if (!empty($data['due_date'])) {
                $updateData['due_date'] = $data['due_date'];
            }
            
            // Update finding
            $this->db->update('audit_findings', $updateData, 'id = :id', ['id' => $findingId]);
            
            // Log activity
            $this->logActivity($finding['audit_id'], 'System', 'auditor', 'finding_updated', "Finding updated: {$finding['title']}", 'info', 'audit_management');
            
            return ['success' => true, 'message' => 'Finding updated successfully'];
            
        } catch (Exception $e) {
            error_log("Update finding error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to update finding'];
        }
    }
    
    /**
     * Get audit documents
     */
    public function getAuditDocuments($auditId) {
        $sql = "SELECT d.*, u1.name as requested_by_name, u2.name as requested_from_name, u3.name as uploaded_by_name 
                FROM documents d 
                LEFT JOIN users u1 ON d.requested_by = u1.id 
                LEFT JOIN users u2 ON d.requested_from = u2.id 
                LEFT JOIN users u3 ON d.uploaded_by = u3.id 
                WHERE d.audit_id = :audit_id ORDER BY d.created_at DESC";
        
        $documents = $this->db->fetchAll($sql, ['audit_id' => $auditId]);
        
        // Process documents
        foreach ($documents as &$doc) {
            $doc['tags'] = json_decode($doc['tags'], true) ?? [];
        }
        
        return $documents;
    }
    
    /**
     * Get audit reports
     */
    public function getAuditReports($auditId) {
        $sql = "SELECT r.*, u.name as approved_by_name FROM reports r 
                LEFT JOIN users u ON r.approved_by = u.id 
                WHERE r.audit_id = :audit_id ORDER BY r.created_at DESC";
        
        $reports = $this->db->fetchAll($sql, ['audit_id' => $auditId]);
        
        // Process reports
        foreach ($reports as &$report) {
            $report['findings'] = json_decode($report['findings'], true) ?? [];
            $report['recommendations'] = json_decode($report['recommendations'], true) ?? [];
        }
        
        return $reports;
    }
    
    /**
     * Get audit statistics
     */
    public function getAuditStats() {
        $sql = "SELECT 
                    COUNT(*) as total_audits,
                    SUM(CASE WHEN status = 'planning' THEN 1 ELSE 0 END) as planning_audits,
                    SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_audits,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_audits,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_audits,
                    AVG(progress) as average_progress
                FROM audits";
        
        $stats = $this->db->fetch($sql);
        
        // Get audits by priority
        $priorityStats = $this->db->fetchAll("SELECT priority, COUNT(*) as count FROM audits GROUP BY priority");
        $stats['by_priority'] = array_column($priorityStats, 'count', 'priority');
        
        // Get audits by status
        $statusStats = $this->db->fetchAll("SELECT status, COUNT(*) as count FROM audits GROUP BY status");
        $stats['by_status'] = array_column($statusStats, 'count', 'status');
        
        return $stats;
    }
    
    /**
     * Get auditor names
     */
    private function getAuditorNames($auditorIds) {
        if (empty($auditorIds)) {
            return [];
        }
        
        $placeholders = str_repeat('?,', count($auditorIds) - 1) . '?';
        $sql = "SELECT id, name FROM users WHERE id IN ({$placeholders})";
        
        $auditors = $this->db->fetchAll($sql, $auditorIds);
        return array_column($auditors, 'name', 'id');
    }
    
    /**
     * Get findings count
     */
    private function getFindingsCount($auditId) {
        $sql = "SELECT COUNT(*) as count FROM audit_findings WHERE audit_id = :audit_id";
        $result = $this->db->fetch($sql, ['audit_id' => $auditId]);
        return $result['count'] ?? 0;
    }
    
    /**
     * Get documents count
     */
    private function getDocumentsCount($auditId) {
        $sql = "SELECT COUNT(*) as count FROM documents WHERE audit_id = :audit_id";
        $result = $this->db->fetch($sql, ['audit_id' => $auditId]);
        return $result['count'] ?? 0;
    }
    
    /**
     * Log activity
     */
    private function logActivity($auditId, $userName, $userRole, $action, $description, $severity = 'info', $resource = null, $metadata = null) {
        $activityLogger = new ActivityLogger();
        return $activityLogger->log($auditId, $userName, $userRole, $action, $description, $severity, $resource, $metadata);
    }
}

// Global audit instance
function getAuditManager() {
    static $auditManager = null;
    if ($auditManager === null) {
        $auditManager = new Audit();
    }
    return $auditManager;
}
