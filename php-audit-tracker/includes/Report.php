<?php
/**
 * Report Management Class
 * Handles report generation, management, and export functionality
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

require_once APP_ROOT . '/config/config.php';
require_once APP_ROOT . '/config/database.php';

class Report {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Get all reports
     */
    public function getAllReports($filters = []) {
        $sql = "SELECT r.*, a.title as audit_title, u1.name as created_by_name, u2.name as approved_by_name 
                FROM reports r 
                LEFT JOIN audits a ON r.audit_id = a.id 
                LEFT JOIN users u1 ON r.created_by = u1.id 
                LEFT JOIN users u2 ON r.approved_by = u2.id 
                WHERE 1=1";
        $params = [];
        
        // Apply filters
        if (!empty($filters['audit_id'])) {
            $sql .= " AND r.audit_id = :audit_id";
            $params['audit_id'] = $filters['audit_id'];
        }
        
        if (!empty($filters['status'])) {
            $sql .= " AND r.status = :status";
            $params['status'] = $filters['status'];
        }
        
        if (!empty($filters['report_type'])) {
            $sql .= " AND r.report_type = :report_type";
            $params['report_type'] = $filters['report_type'];
        }
        
        if (!empty($filters['created_by'])) {
            $sql .= " AND r.created_by = :created_by";
            $params['created_by'] = $filters['created_by'];
        }
        
        if (!empty($filters['search'])) {
            $sql .= " AND (r.title LIKE :search OR r.content LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }
        
        if (!empty($filters['date_from'])) {
            $sql .= " AND r.created_at >= :date_from";
            $params['date_from'] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $sql .= " AND r.created_at <= :date_to";
            $params['date_to'] = $filters['date_to'];
        }
        
        $sql .= " ORDER BY r.created_at DESC";
        
        // Add pagination
        if (!empty($filters['limit'])) {
            $sql .= " LIMIT :limit";
            $params['limit'] = (int)$filters['limit'];
            
            if (!empty($filters['offset'])) {
                $sql .= " OFFSET :offset";
                $params['offset'] = (int)$filters['offset'];
            }
        }
        
        $reports = $this->db->fetchAll($sql, $params);
        
        // Process reports
        foreach ($reports as &$report) {
            $report['findings'] = json_decode($report['findings'], true) ?? [];
            $report['recommendations'] = json_decode($report['recommendations'], true) ?? [];
        }
        
        return $reports;
    }
    
    /**
     * Get report by ID
     */
    public function getReportById($id) {
        $sql = "SELECT r.*, a.title as audit_title, u1.name as created_by_name, u2.name as approved_by_name 
                FROM reports r 
                LEFT JOIN audits a ON r.audit_id = a.id 
                LEFT JOIN users u1 ON r.created_by = u1.id 
                LEFT JOIN users u2 ON r.approved_by = u2.id 
                WHERE r.id = :id";
        
        $report = $this->db->fetch($sql, ['id' => $id]);
        
        if ($report) {
            $report['findings'] = json_decode($report['findings'], true) ?? [];
            $report['recommendations'] = json_decode($report['recommendations'], true) ?? [];
        }
        
        return $report;
    }
    
    /**
     * Create new report
     */
    public function createReport($data) {
        try {
            // Validate required fields
            $required = ['title', 'audit_id', 'report_type', 'content', 'created_by'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    return ['success' => false, 'message' => "Field '{$field}' is required"];
                }
            }
            
            // Check if audit exists
            $auditManager = new Audit();
            $audit = $auditManager->getAuditById($data['audit_id']);
            if (!$audit) {
                return ['success' => false, 'message' => 'Audit not found'];
            }
            
            // Check if user exists
            $userManager = new User();
            $user = $userManager->getUserById($data['created_by']);
            if (!$user) {
                return ['success' => false, 'message' => 'User not found'];
            }
            
            // Generate report ID
            $reportId = generateId('report_');
            
            // Prepare report data
            $reportData = [
                'id' => $reportId,
                'title' => sanitizeInput($data['title']),
                'audit_id' => $data['audit_id'],
                'audit_title' => $audit['title'],
                'report_type' => sanitizeInput($data['report_type']),
                'status' => 'draft',
                'created_by' => $data['created_by'],
                'created_by_name' => $user['name'],
                'content' => $data['content'],
                'findings' => json_encode($data['findings'] ?? []),
                'recommendations' => json_encode($data['recommendations'] ?? []),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            // Insert report
            $this->db->insert('reports', $reportData);
            
            // Log activity
            $this->logActivity($reportId, $user['name'], $user['role'], 'report_created', "New report created: {$data['title']}", 'info', 'report_management');
            
            return [
                'success' => true,
                'message' => 'Report created successfully',
                'report_id' => $reportId
            ];
            
        } catch (Exception $e) {
            error_log("Create report error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to create report'];
        }
    }
    
    /**
     * Update report
     */
    public function updateReport($id, $data) {
        try {
            // Check if report exists
            $report = $this->getReportById($id);
            if (!$report) {
                return ['success' => false, 'message' => 'Report not found'];
            }
            
            // Check if report can be updated
            if ($report['status'] === 'approved') {
                return ['success' => false, 'message' => 'Cannot update approved report'];
            }
            
            // Prepare update data
            $updateData = ['updated_at' => date('Y-m-d H:i:s')];
            
            if (!empty($data['title'])) {
                $updateData['title'] = sanitizeInput($data['title']);
            }
            
            if (!empty($data['report_type'])) {
                $updateData['report_type'] = sanitizeInput($data['report_type']);
            }
            
            if (!empty($data['content'])) {
                $updateData['content'] = $data['content'];
            }
            
            if (isset($data['findings'])) {
                $updateData['findings'] = json_encode($data['findings']);
            }
            
            if (isset($data['recommendations'])) {
                $updateData['recommendations'] = json_encode($data['recommendations']);
            }
            
            // Update report
            $this->db->update('reports', $updateData, 'id = :id', ['id' => $id]);
            
            // Log activity
            $this->logActivity($id, 'System', 'auditor', 'report_updated', "Report updated: {$report['title']}", 'info', 'report_management');
            
            return ['success' => true, 'message' => 'Report updated successfully'];
            
        } catch (Exception $e) {
            error_log("Update report error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to update report'];
        }
    }
    
    /**
     * Submit report for approval
     */
    public function submitReport($id) {
        try {
            // Check if report exists
            $report = $this->getReportById($id);
            if (!$report) {
                return ['success' => false, 'message' => 'Report not found'];
            }
            
            // Check if report can be submitted
            if ($report['status'] !== 'draft') {
                return ['success' => false, 'message' => 'Only draft reports can be submitted'];
            }
            
            // Update report status
            $this->db->update('reports', [
                'status' => 'pending',
                'submitted_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ], 'id = :id', ['id' => $id]);
            
            // Send notification to approvers
            $this->sendReportSubmissionNotification($id);
            
            // Log activity
            $this->logActivity($id, 'System', 'auditor', 'report_submitted', "Report submitted for approval: {$report['title']}", 'info', 'report_management');
            
            return ['success' => true, 'message' => 'Report submitted for approval'];
            
        } catch (Exception $e) {
            error_log("Submit report error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to submit report'];
        }
    }
    
    /**
     * Approve report
     */
    public function approveReport($id, $approvedBy) {
        try {
            // Check if report exists
            $report = $this->getReportById($id);
            if (!$report) {
                return ['success' => false, 'message' => 'Report not found'];
            }
            
            // Check if report can be approved
            if ($report['status'] !== 'pending') {
                return ['success' => false, 'message' => 'Only pending reports can be approved'];
            }
            
            // Check if user has permission to approve
            $auth = getAuth();
            if (!$auth->hasPermission('approve_reports')) {
                return ['success' => false, 'message' => 'Insufficient permissions to approve reports'];
            }
            
            // Update report status
            $this->db->update('reports', [
                'status' => 'approved',
                'approved_at' => date('Y-m-d H:i:s'),
                'approved_by' => $approvedBy,
                'updated_at' => date('Y-m-d H:i:s')
            ], 'id = :id', ['id' => $id]);
            
            // Send notification to report creator
            $this->sendReportApprovalNotification($id);
            
            // Log activity
            $this->logActivity($id, 'System', 'audit_manager', 'report_approved', "Report approved: {$report['title']}", 'info', 'report_management');
            
            return ['success' => true, 'message' => 'Report approved successfully'];
            
        } catch (Exception $e) {
            error_log("Approve report error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to approve report'];
        }
    }
    
    /**
     * Reject report
     */
    public function rejectReport($id, $rejectedBy, $reason = null) {
        try {
            // Check if report exists
            $report = $this->getReportById($id);
            if (!$report) {
                return ['success' => false, 'message' => 'Report not found'];
            }
            
            // Check if report can be rejected
            if ($report['status'] !== 'pending') {
                return ['success' => false, 'message' => 'Only pending reports can be rejected'];
            }
            
            // Check if user has permission to reject
            $auth = getAuth();
            if (!$auth->hasPermission('approve_reports')) {
                return ['success' => false, 'message' => 'Insufficient permissions to reject reports'];
            }
            
            // Update report status
            $this->db->update('reports', [
                'status' => 'rejected',
                'updated_at' => date('Y-m-d H:i:s')
            ], 'id = :id', ['id' => $id]);
            
            // Send notification to report creator
            $this->sendReportRejectionNotification($id, $reason);
            
            // Log activity
            $this->logActivity($id, 'System', 'audit_manager', 'report_rejected', "Report rejected: {$report['title']}", 'warning', 'report_management');
            
            return ['success' => true, 'message' => 'Report rejected'];
            
        } catch (Exception $e) {
            error_log("Reject report error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to reject report'];
        }
    }
    
    /**
     * Delete report
     */
    public function deleteReport($id) {
        try {
            // Check if report exists
            $report = $this->getReportById($id);
            if (!$report) {
                return ['success' => false, 'message' => 'Report not found'];
            }
            
            // Check if report can be deleted
            if ($report['status'] === 'approved') {
                return ['success' => false, 'message' => 'Cannot delete approved report'];
            }
            
            // Delete report
            $this->db->delete('reports', 'id = :id', ['id' => $id]);
            
            // Log activity
            $this->logActivity($id, 'System', 'auditor', 'report_deleted', "Report deleted: {$report['title']}", 'warning', 'report_management');
            
            return ['success' => true, 'message' => 'Report deleted successfully'];
            
        } catch (Exception $e) {
            error_log("Delete report error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to delete report'];
        }
    }
    
    /**
     * Generate audit report
     */
    public function generateAuditReport($auditId, $reportType = 'executive_summary') {
        try {
            // Get audit data
            $auditManager = new Audit();
            $audit = $auditManager->getAuditById($auditId);
            if (!$audit) {
                return ['success' => false, 'message' => 'Audit not found'];
            }
            
            // Get audit findings
            $findings = $auditManager->getAuditFindings($auditId);
            
            // Get audit documents
            $documentManager = new Document();
            $documents = $documentManager->getAllDocuments(['audit_id' => $auditId]);
            
            // Generate report content based on type
            $content = $this->generateReportContent($audit, $findings, $documents, $reportType);
            
            // Extract findings and recommendations
            $findingsList = array_column($findings, 'title');
            $recommendations = array_column($findings, 'recommendation');
            
            // Create report
            $reportData = [
                'title' => "{$audit['title']} - {$reportType}",
                'audit_id' => $auditId,
                'report_type' => $reportType,
                'content' => $content,
                'findings' => $findingsList,
                'recommendations' => $recommendations,
                'created_by' => $_SESSION['user_id'] ?? 'system'
            ];
            
            return $this->createReport($reportData);
            
        } catch (Exception $e) {
            error_log("Generate audit report error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to generate audit report'];
        }
    }
    
    /**
     * Export report to PDF
     */
    public function exportToPDF($reportId) {
        try {
            $report = $this->getReportById($reportId);
            if (!$report) {
                return ['success' => false, 'message' => 'Report not found'];
            }
            
            // Check permissions
            $auth = getAuth();
            if (!$auth->hasPermission('export_reports')) {
                return ['success' => false, 'message' => 'Insufficient permissions to export reports'];
            }
            
            // Generate PDF content
            $html = $this->generatePDFContent($report);
            
            // Set headers for PDF download
            $filename = sanitizeInput($report['title']) . '.pdf';
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            header('Cache-Control: no-cache, must-revalidate');
            header('Pragma: no-cache');
            
            // For now, return HTML content (in production, use a PDF library like TCPDF or mPDF)
            echo $html;
            exit;
            
        } catch (Exception $e) {
            error_log("Export to PDF error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to export report to PDF'];
        }
    }
    
    /**
     * Export report to Excel
     */
    public function exportToExcel($reportId) {
        try {
            $report = $this->getReportById($reportId);
            if (!$report) {
                return ['success' => false, 'message' => 'Report not found'];
            }
            
            // Check permissions
            $auth = getAuth();
            if (!$auth->hasPermission('export_reports')) {
                return ['success' => false, 'message' => 'Insufficient permissions to export reports'];
            }
            
            // Prepare data for Excel export
            $data = [
                ['Report Title', $report['title']],
                ['Audit', $report['audit_title']],
                ['Report Type', $report['report_type']],
                ['Status', $report['status']],
                ['Created By', $report['created_by_name']],
                ['Created At', $report['created_at']],
                ['', ''],
                ['Content', $report['content']],
                ['', ''],
                ['Findings', ''],
            ];
            
            // Add findings
            foreach ($report['findings'] as $finding) {
                $data[] = ['', $finding];
            }
            
            $data[] = ['', ''];
            $data[] = ['Recommendations', ''];
            
            // Add recommendations
            foreach ($report['recommendations'] as $recommendation) {
                $data[] = ['', $recommendation];
            }
            
            // Export to CSV (simplified Excel export)
            $filename = sanitizeInput($report['title']) . '.csv';
            arrayToCSV($data, $filename);
            
        } catch (Exception $e) {
            error_log("Export to Excel error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to export report to Excel'];
        }
    }
    
    /**
     * Get report statistics
     */
    public function getReportStats() {
        $sql = "SELECT 
                    COUNT(*) as total_reports,
                    SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_reports,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reports,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_reports,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_reports
                FROM reports";
        
        $stats = $this->db->fetch($sql);
        
        // Get reports by type
        $typeStats = $this->db->fetchAll("SELECT report_type, COUNT(*) as count FROM reports GROUP BY report_type");
        $stats['by_type'] = array_column($typeStats, 'count', 'report_type');
        
        // Get reports by status
        $statusStats = $this->db->fetchAll("SELECT status, COUNT(*) as count FROM reports GROUP BY status");
        $stats['by_status'] = array_column($statusStats, 'count', 'status');
        
        return $stats;
    }
    
    /**
     * Generate report content
     */
    private function generateReportContent($audit, $findings, $documents, $reportType) {
        $content = "<h1>{$audit['title']}</h1>\n";
        $content .= "<h2>Executive Summary</h2>\n";
        $content .= "<p>{$audit['description']}</p>\n";
        
        $content .= "<h2>Audit Details</h2>\n";
        $content .= "<ul>\n";
        $content .= "<li><strong>Status:</strong> {$audit['status']}</li>\n";
        $content .= "<li><strong>Priority:</strong> {$audit['priority']}</li>\n";
        $content .= "<li><strong>Start Date:</strong> {$audit['start_date']}</li>\n";
        $content .= "<li><strong>End Date:</strong> {$audit['end_date']}</li>\n";
        $content .= "<li><strong>Progress:</strong> {$audit['progress']}%</li>\n";
        $content .= "</ul>\n";
        
        if (!empty($audit['scope'])) {
            $content .= "<h2>Scope</h2>\n";
            $content .= "<ul>\n";
            foreach ($audit['scope'] as $scope) {
                $content .= "<li>{$scope}</li>\n";
            }
            $content .= "</ul>\n";
        }
        
        if (!empty($audit['compliance_frameworks'])) {
            $content .= "<h2>Compliance Frameworks</h2>\n";
            $content .= "<ul>\n";
            foreach ($audit['compliance_frameworks'] as $framework) {
                $content .= "<li>{$framework}</li>\n";
            }
            $content .= "</ul>\n";
        }
        
        if (!empty($findings)) {
            $content .= "<h2>Findings</h2>\n";
            foreach ($findings as $finding) {
                $content .= "<h3>{$finding['title']}</h3>\n";
                $content .= "<p><strong>Severity:</strong> {$finding['severity']}</p>\n";
                $content .= "<p><strong>Status:</strong> {$finding['status']}</p>\n";
                $content .= "<p><strong>Description:</strong> {$finding['description']}</p>\n";
                $content .= "<p><strong>Recommendation:</strong> {$finding['recommendation']}</p>\n";
                if ($finding['due_date']) {
                    $content .= "<p><strong>Due Date:</strong> {$finding['due_date']}</p>\n";
                }
                $content .= "<hr>\n";
            }
        }
        
        if (!empty($documents)) {
            $content .= "<h2>Documents</h2>\n";
            $content .= "<ul>\n";
            foreach ($documents as $document) {
                $content .= "<li>{$document['title']} ({$document['status']})</li>\n";
            }
            $content .= "</ul>\n";
        }
        
        return $content;
    }
    
    /**
     * Generate PDF content
     */
    private function generatePDFContent($report) {
        $html = "<!DOCTYPE html>\n";
        $html .= "<html>\n";
        $html .= "<head>\n";
        $html .= "<meta charset='UTF-8'>\n";
        $html .= "<title>{$report['title']}</title>\n";
        $html .= "<style>\n";
        $html .= "body { font-family: Arial, sans-serif; margin: 20px; }\n";
        $html .= "h1 { color: #333; border-bottom: 2px solid #333; }\n";
        $html .= "h2 { color: #666; margin-top: 30px; }\n";
        $html .= "h3 { color: #888; }\n";
        $html .= "p { line-height: 1.6; }\n";
        $html .= "ul { margin: 10px 0; }\n";
        $html .= "li { margin: 5px 0; }\n";
        $html .= "</style>\n";
        $html .= "</head>\n";
        $html .= "<body>\n";
        $html .= $report['content'];
        $html .= "</body>\n";
        $html .= "</html>\n";
        
        return $html;
    }
    
    /**
     * Send report submission notification
     */
    private function sendReportSubmissionNotification($reportId) {
        $report = $this->getReportById($reportId);
        if (!$report) return;
        
        $notificationManager = new NotificationManager();
        
        // Get users with approval permissions
        $sql = "SELECT id, name, email FROM users WHERE JSON_CONTAINS(permissions, '\"approve_reports\"') AND is_active = 1";
        $approvers = $this->db->fetchAll($sql);
        
        foreach ($approvers as $approver) {
            $notificationManager->create(
                $approver['id'],
                'System',
                'audit_manager',
                'Report Pending Approval',
                "Report pending approval: {$report['title']}",
                'report_ready',
                'high',
                ['report_id' => $reportId, 'audit_id' => $report['audit_id']]
            );
        }
    }
    
    /**
     * Send report approval notification
     */
    private function sendReportApprovalNotification($reportId) {
        $report = $this->getReportById($reportId);
        if (!$report) return;
        
        $notificationManager = new NotificationManager();
        
        $notificationManager->create(
            $report['created_by'],
            'System',
            'auditor',
            'Report Approved',
            "Your report has been approved: {$report['title']}",
            'report_ready',
            'medium',
            ['report_id' => $reportId, 'audit_id' => $report['audit_id']]
        );
    }
    
    /**
     * Send report rejection notification
     */
    private function sendReportRejectionNotification($reportId, $reason = null) {
        $report = $this->getReportById($reportId);
        if (!$report) return;
        
        $notificationManager = new NotificationManager();
        
        $message = "Your report has been rejected: {$report['title']}";
        if ($reason) {
            $message .= " - Reason: {$reason}";
        }
        
        $notificationManager->create(
            $report['created_by'],
            'System',
            'auditor',
            'Report Rejected',
            $message,
            'report_ready',
            'medium',
            ['report_id' => $reportId, 'audit_id' => $report['audit_id']]
        );
    }
    
    /**
     * Log activity
     */
    private function logActivity($reportId, $userName, $userRole, $action, $description, $severity = 'info', $resource = null, $metadata = null) {
        $activityLogger = new ActivityLogger();
        return $activityLogger->log($reportId, $userName, $userRole, $action, $description, $severity, $resource, $metadata);
    }
}

// Global report instance
function getReportManager() {
    static $reportManager = null;
    if ($reportManager === null) {
        $reportManager = new Report();
    }
    return $reportManager;
}
