<?php
/**
 * Document Management Class
 * Handles document operations, file uploads, and document tracking
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

require_once APP_ROOT . '/config/config.php';
require_once APP_ROOT . '/config/database.php';

class Document {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Get all documents
     */
    public function getAllDocuments($filters = []) {
        $sql = "SELECT d.*, a.title as audit_title, u1.name as requested_by_name, u2.name as requested_from_name, u3.name as uploaded_by_name 
                FROM documents d 
                LEFT JOIN audits a ON d.audit_id = a.id 
                LEFT JOIN users u1 ON d.requested_by = u1.id 
                LEFT JOIN users u2 ON d.requested_from = u2.id 
                LEFT JOIN users u3 ON d.uploaded_by = u3.id 
                WHERE 1=1";
        $params = [];
        
        // Apply filters
        if (!empty($filters['audit_id'])) {
            $sql .= " AND d.audit_id = :audit_id";
            $params['audit_id'] = $filters['audit_id'];
        }
        
        if (!empty($filters['status'])) {
            $sql .= " AND d.status = :status";
            $params['status'] = $filters['status'];
        }
        
        if (!empty($filters['type'])) {
            $sql .= " AND d.type = :type";
            $params['type'] = $filters['type'];
        }
        
        if (!empty($filters['requested_by'])) {
            $sql .= " AND d.requested_by = :requested_by";
            $params['requested_by'] = $filters['requested_by'];
        }
        
        if (!empty($filters['requested_from'])) {
            $sql .= " AND d.requested_from = :requested_from";
            $params['requested_from'] = $filters['requested_from'];
        }
        
        if (!empty($filters['search'])) {
            $sql .= " AND (d.title LIKE :search OR d.description LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }
        
        if (!empty($filters['is_confidential'])) {
            $sql .= " AND d.is_confidential = :is_confidential";
            $params['is_confidential'] = $filters['is_confidential'];
        }
        
        $sql .= " ORDER BY d.created_at DESC";
        
        // Add pagination
        if (!empty($filters['limit'])) {
            $sql .= " LIMIT :limit";
            $params['limit'] = (int)$filters['limit'];
            
            if (!empty($filters['offset'])) {
                $sql .= " OFFSET :offset";
                $params['offset'] = (int)$filters['offset'];
            }
        }
        
        $documents = $this->db->fetchAll($sql, $params);
        
        // Process documents
        foreach ($documents as &$doc) {
            $doc['tags'] = json_decode($doc['tags'], true) ?? [];
        }
        
        return $documents;
    }
    
    /**
     * Get document by ID
     */
    public function getDocumentById($id) {
        $sql = "SELECT d.*, a.title as audit_title, u1.name as requested_by_name, u2.name as requested_from_name, u3.name as uploaded_by_name 
                FROM documents d 
                LEFT JOIN audits a ON d.audit_id = a.id 
                LEFT JOIN users u1 ON d.requested_by = u1.id 
                LEFT JOIN users u2 ON d.requested_from = u2.id 
                LEFT JOIN users u3 ON d.uploaded_by = u3.id 
                WHERE d.id = :id";
        
        $document = $this->db->fetch($sql, ['id' => $id]);
        
        if ($document) {
            $document['tags'] = json_decode($document['tags'], true) ?? [];
        }
        
        return $document;
    }
    
    /**
     * Create document request
     */
    public function createDocumentRequest($data) {
        try {
            // Validate required fields
            $required = ['title', 'description', 'type', 'audit_id', 'requested_by', 'requested_from', 'due_date'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    return ['success' => false, 'message' => "Field '{$field}' is required"];
                }
            }
            
            // Validate document type
            if (!array_key_exists($data['type'], DOCUMENT_TYPES)) {
                return ['success' => false, 'message' => 'Invalid document type'];
            }
            
            // Validate due date
            if (!isValidDate($data['due_date'])) {
                return ['success' => false, 'message' => 'Invalid due date format'];
            }
            
            // Check if audit exists
            $auditManager = new Audit();
            if (!$auditManager->getAuditById($data['audit_id'])) {
                return ['success' => false, 'message' => 'Audit not found'];
            }
            
            // Check if users exist
            $userManager = new User();
            if (!$userManager->getUserById($data['requested_by'])) {
                return ['success' => false, 'message' => 'Requested by user not found'];
            }
            
            if (!$userManager->getUserById($data['requested_from'])) {
                return ['success' => false, 'message' => 'Requested from user not found'];
            }
            
            // Generate document ID
            $documentId = generateId('doc_');
            
            // Prepare document data
            $documentData = [
                'id' => $documentId,
                'title' => sanitizeInput($data['title']),
                'description' => sanitizeInput($data['description']),
                'type' => $data['type'],
                'audit_id' => $data['audit_id'],
                'requested_by' => $data['requested_by'],
                'requested_from' => $data['requested_from'],
                'status' => 'pending',
                'due_date' => $data['due_date'],
                'tags' => json_encode($data['tags'] ?? []),
                'is_confidential' => (bool)($data['is_confidential'] ?? false),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            // Insert document
            $this->db->insert('documents', $documentData);
            
            // Send notification to requested user
            $this->sendDocumentRequestNotification($documentId, $data);
            
            // Log activity
            $this->logActivity($documentId, 'System', 'auditor', 'document_requested', "Document request created: {$data['title']}", 'info', 'document_management');
            
            return [
                'success' => true,
                'message' => 'Document request created successfully',
                'document_id' => $documentId
            ];
            
        } catch (Exception $e) {
            error_log("Create document request error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to create document request'];
        }
    }
    
    /**
     * Upload document
     */
    public function uploadDocument($documentId, $file) {
        try {
            // Check if document exists
            $document = $this->getDocumentById($documentId);
            if (!$document) {
                return ['success' => false, 'message' => 'Document not found'];
            }
            
            // Validate file
            $validation = $this->validateFile($file);
            if (!$validation['success']) {
                return $validation;
            }
            
            // Generate unique filename
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = $documentId . '_' . time() . '.' . $extension;
            $filepath = UPLOAD_DIR . $filename;
            
            // Create upload directory if it doesn't exist
            createDirectory(UPLOAD_DIR);
            
            // Move uploaded file
            if (!move_uploaded_file($file['tmp_name'], $filepath)) {
                return ['success' => false, 'message' => 'Failed to upload file'];
            }
            
            // Generate file hash
            $fileHash = generateFileHash($filepath);
            
            // Update document
            $updateData = [
                'status' => 'submitted',
                'uploaded_by' => $_SESSION['user_id'] ?? null,
                'uploaded_at' => date('Y-m-d H:i:s'),
                'file_name' => $file['name'],
                'file_path' => $filepath,
                'file_size' => $file['size'],
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            $this->db->update('documents', $updateData, 'id = :id', ['id' => $documentId]);
            
            // Send notification to requester
            $this->sendDocumentUploadNotification($documentId);
            
            // Log activity
            $this->logActivity($documentId, 'System', 'client', 'document_uploaded', "Document uploaded: {$file['name']}", 'info', 'document_management');
            
            return [
                'success' => true,
                'message' => 'Document uploaded successfully',
                'file_path' => $filepath,
                'file_hash' => $fileHash
            ];
            
        } catch (Exception $e) {
            error_log("Upload document error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to upload document'];
        }
    }
    
    /**
     * Update document status
     */
    public function updateDocumentStatus($id, $status, $comments = null) {
        try {
            // Check if document exists
            $document = $this->getDocumentById($id);
            if (!$document) {
                return ['success' => false, 'message' => 'Document not found'];
            }
            
            // Validate status
            if (!array_key_exists($status, DOCUMENT_STATUSES)) {
                return ['success' => false, 'message' => 'Invalid status'];
            }
            
            // Update document
            $updateData = [
                'status' => $status,
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            $this->db->update('documents', $updateData, 'id = :id', ['id' => $id]);
            
            // Send notification
            $this->sendDocumentStatusNotification($id, $status, $comments);
            
            // Log activity
            $this->logActivity($id, 'System', 'auditor', 'document_status_updated', "Document status updated to: {$status}", 'info', 'document_management');
            
            return ['success' => true, 'message' => 'Document status updated successfully'];
            
        } catch (Exception $e) {
            error_log("Update document status error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to update document status'];
        }
    }
    
    /**
     * Delete document
     */
    public function deleteDocument($id) {
        try {
            // Check if document exists
            $document = $this->getDocumentById($id);
            if (!$document) {
                return ['success' => false, 'message' => 'Document not found'];
            }
            
            // Delete file if exists
            if (!empty($document['file_path']) && file_exists($document['file_path'])) {
                unlink($document['file_path']);
            }
            
            // Delete document
            $this->db->delete('documents', 'id = :id', ['id' => $id]);
            
            // Log activity
            $this->logActivity($id, 'System', 'auditor', 'document_deleted', "Document deleted: {$document['title']}", 'warning', 'document_management');
            
            return ['success' => true, 'message' => 'Document deleted successfully'];
            
        } catch (Exception $e) {
            error_log("Delete document error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to delete document'];
        }
    }
    
    /**
     * Download document
     */
    public function downloadDocument($id) {
        try {
            $document = $this->getDocumentById($id);
            if (!$document) {
                return ['success' => false, 'message' => 'Document not found'];
            }
            
            if (empty($document['file_path']) || !file_exists($document['file_path'])) {
                return ['success' => false, 'message' => 'File not found'];
            }
            
            // Check permissions
            $auth = getAuth();
            if (!$auth->hasPermission('download_documents') && 
                $document['requested_from'] !== $_SESSION['user_id'] && 
                $document['uploaded_by'] !== $_SESSION['user_id']) {
                return ['success' => false, 'message' => 'Insufficient permissions'];
            }
            
            // Log download activity
            $this->logActivity($id, 'System', 'user', 'document_downloaded', "Document downloaded: {$document['title']}", 'info', 'document_management');
            
            // Set headers for download
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . $document['file_name'] . '"');
            header('Content-Length: ' . filesize($document['file_path']));
            header('Cache-Control: no-cache, must-revalidate');
            header('Pragma: no-cache');
            
            // Output file
            readfile($document['file_path']);
            exit;
            
        } catch (Exception $e) {
            error_log("Download document error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to download document'];
        }
    }
    
    /**
     * View document
     */
    public function viewDocument($id) {
        try {
            $document = $this->getDocumentById($id);
            if (!$document) {
                return ['success' => false, 'message' => 'Document not found'];
            }
            
            if (empty($document['file_path']) || !file_exists($document['file_path'])) {
                return ['success' => false, 'message' => 'File not found'];
            }
            
            // Check permissions
            $auth = getAuth();
            if (!$auth->hasPermission('view_documents') && 
                $document['requested_from'] !== $_SESSION['user_id'] && 
                $document['uploaded_by'] !== $_SESSION['user_id']) {
                return ['success' => false, 'message' => 'Insufficient permissions'];
            }
            
            // Log view activity
            $this->logActivity($id, 'System', 'user', 'document_viewed', "Document viewed: {$document['title']}", 'info', 'document_management');
            
            // Determine content type
            $extension = strtolower(pathinfo($document['file_name'], PATHINFO_EXTENSION));
            $contentType = $this->getContentType($extension);
            
            // Set headers
            header('Content-Type: ' . $contentType);
            header('Content-Length: ' . filesize($document['file_path']));
            header('Cache-Control: no-cache, must-revalidate');
            header('Pragma: no-cache');
            
            // Output file
            readfile($document['file_path']);
            exit;
            
        } catch (Exception $e) {
            error_log("View document error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to view document'];
        }
    }
    
    /**
     * Get document statistics
     */
    public function getDocumentStats() {
        $sql = "SELECT 
                    COUNT(*) as total_documents,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_documents,
                    SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted_documents,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_documents,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_documents,
                    SUM(CASE WHEN is_confidential = 1 THEN 1 ELSE 0 END) as confidential_documents
                FROM documents";
        
        $stats = $this->db->fetch($sql);
        
        // Get documents by type
        $typeStats = $this->db->fetchAll("SELECT type, COUNT(*) as count FROM documents GROUP BY type");
        $stats['by_type'] = array_column($typeStats, 'count', 'type');
        
        // Get documents by status
        $statusStats = $this->db->fetchAll("SELECT status, COUNT(*) as count FROM documents GROUP BY status");
        $stats['by_status'] = array_column($statusStats, 'count', 'status');
        
        return $stats;
    }
    
    /**
     * Get overdue documents
     */
    public function getOverdueDocuments() {
        $sql = "SELECT d.*, a.title as audit_title, u1.name as requested_by_name, u2.name as requested_from_name 
                FROM documents d 
                LEFT JOIN audits a ON d.audit_id = a.id 
                LEFT JOIN users u1 ON d.requested_by = u1.id 
                LEFT JOIN users u2 ON d.requested_from = u2.id 
                WHERE d.due_date < CURDATE() AND d.status IN ('pending', 'draft') 
                ORDER BY d.due_date ASC";
        
        $documents = $this->db->fetchAll($sql);
        
        // Process documents
        foreach ($documents as &$doc) {
            $doc['tags'] = json_decode($doc['tags'], true) ?? [];
        }
        
        return $documents;
    }
    
    /**
     * Validate uploaded file
     */
    private function validateFile($file) {
        // Check if file was uploaded
        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            return ['success' => false, 'message' => 'No file uploaded'];
        }
        
        // Check file size
        if ($file['size'] > MAX_FILE_SIZE) {
            return ['success' => false, 'message' => 'File size exceeds maximum allowed size'];
        }
        
        // Check file type
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!isAllowedFileType($file['name'])) {
            return ['success' => false, 'message' => 'File type not allowed'];
        }
        
        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return ['success' => false, 'message' => 'File upload error'];
        }
        
        return ['success' => true];
    }
    
    /**
     * Get content type for file extension
     */
    private function getContentType($extension) {
        $contentTypes = [
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'txt' => 'text/plain',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png'
        ];
        
        return $contentTypes[$extension] ?? 'application/octet-stream';
    }
    
    /**
     * Send document request notification
     */
    private function sendDocumentRequestNotification($documentId, $data) {
        $notificationManager = new NotificationManager();
        
        $notificationManager->create(
            $data['requested_from'],
            'System',
            'client',
            'Document Request',
            "New document request: {$data['title']}",
            'document_request',
            'medium',
            ['document_id' => $documentId, 'audit_id' => $data['audit_id']]
        );
    }
    
    /**
     * Send document upload notification
     */
    private function sendDocumentUploadNotification($documentId) {
        $document = $this->getDocumentById($documentId);
        if (!$document) return;
        
        $notificationManager = new NotificationManager();
        
        $notificationManager->create(
            $document['requested_by'],
            'System',
            'auditor',
            'Document Uploaded',
            "Document uploaded: {$document['title']}",
            'document_upload',
            'medium',
            ['document_id' => $documentId, 'audit_id' => $document['audit_id']]
        );
    }
    
    /**
     * Send document status notification
     */
    private function sendDocumentStatusNotification($documentId, $status, $comments = null) {
        $document = $this->getDocumentById($documentId);
        if (!$document) return;
        
        $notificationManager = new NotificationManager();
        
        $message = "Document status updated to: {$status}";
        if ($comments) {
            $message .= " - {$comments}";
        }
        
        $notificationManager->create(
            $document['requested_from'],
            'System',
            'client',
            'Document Status Update',
            $message,
            'document_status_update',
            'medium',
            ['document_id' => $documentId, 'status' => $status]
        );
    }
    
    /**
     * Log activity
     */
    private function logActivity($documentId, $userName, $userRole, $action, $description, $severity = 'info', $resource = null, $metadata = null) {
        $activityLogger = new ActivityLogger();
        return $activityLogger->log($documentId, $userName, $userRole, $action, $description, $severity, $resource, $metadata);
    }
}

// Global document instance
function getDocumentManager() {
    static $documentManager = null;
    if ($documentManager === null) {
        $documentManager = new Document();
    }
    return $documentManager;
}
