<?php
/**
 * User Management Class
 * Handles user operations, permissions, and profile management
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

require_once APP_ROOT . '/config/config.php';
require_once APP_ROOT . '/config/database.php';

class User {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Get all users
     */
    public function getAllUsers($filters = []) {
        $sql = "SELECT id, name, email, role, department, is_active, last_login, created_at, updated_at FROM users WHERE 1=1";
        $params = [];
        
        // Apply filters
        if (!empty($filters['role'])) {
            $sql .= " AND role = :role";
            $params['role'] = $filters['role'];
        }
        
        if (!empty($filters['department'])) {
            $sql .= " AND department = :department";
            $params['department'] = $filters['department'];
        }
        
        if (isset($filters['is_active'])) {
            $sql .= " AND is_active = :is_active";
            $params['is_active'] = $filters['is_active'];
        }
        
        if (!empty($filters['search'])) {
            $sql .= " AND (name LIKE :search OR email LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }
        
        $sql .= " ORDER BY created_at DESC";
        
        // Add pagination
        if (!empty($filters['limit'])) {
            $sql .= " LIMIT :limit";
            $params['limit'] = (int)$filters['limit'];
            
            if (!empty($filters['offset'])) {
                $sql .= " OFFSET :offset";
                $params['offset'] = (int)$filters['offset'];
            }
        }
        
        return $this->db->fetchAll($sql, $params);
    }
    
    /**
     * Get user by ID
     */
    public function getUserById($id) {
        $sql = "SELECT * FROM users WHERE id = :id";
        return $this->db->fetch($sql, ['id' => $id]);
    }
    
    /**
     * Get user by email
     */
    public function getUserByEmail($email) {
        $sql = "SELECT * FROM users WHERE email = :email";
        return $this->db->fetch($sql, ['email' => $email]);
    }
    
    /**
     * Create new user
     */
    public function createUser($data) {
        try {
            // Validate required fields
            $required = ['name', 'email', 'password', 'role', 'department'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    return ['success' => false, 'message' => "Field '{$field}' is required"];
                }
            }
            
            // Validate email
            if (!validateEmail($data['email'])) {
                return ['success' => false, 'message' => 'Invalid email format'];
            }
            
            // Check if email already exists
            if ($this->getUserByEmail($data['email'])) {
                return ['success' => false, 'message' => 'Email already exists'];
            }
            
            // Validate password
            $passwordErrors = validatePassword($data['password']);
            if (!empty($passwordErrors)) {
                return ['success' => false, 'message' => implode(', ', $passwordErrors)];
            }
            
            // Validate role
            if (!array_key_exists($data['role'], USER_ROLES)) {
                return ['success' => false, 'message' => 'Invalid role'];
            }
            
            // Generate user ID
            $userId = generateId('user_');
            
            // Hash password
            $passwordHash = hashPassword($data['password']);
            
            // Get default permissions for role
            $permissions = DEFAULT_PERMISSIONS[$data['role']] ?? [];
            
            // Prepare user data
            $userData = [
                'id' => $userId,
                'name' => sanitizeInput($data['name']),
                'email' => sanitizeInput($data['email']),
                'password_hash' => $passwordHash,
                'role' => $data['role'],
                'department' => sanitizeInput($data['department']),
                'is_active' => $data['is_active'] ?? true,
                'permissions' => json_encode($permissions),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            // Insert user
            $this->db->insert('users', $userData);
            
            // Log activity
            $this->logActivity($userId, $data['name'], $data['role'], 'user_created', 'New user account created', 'info', 'user_management');
            
            return [
                'success' => true,
                'message' => 'User created successfully',
                'user_id' => $userId
            ];
            
        } catch (Exception $e) {
            error_log("Create user error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to create user'];
        }
    }
    
    /**
     * Update user
     */
    public function updateUser($id, $data) {
        try {
            // Check if user exists
            $user = $this->getUserById($id);
            if (!$user) {
                return ['success' => false, 'message' => 'User not found'];
            }
            
            // Validate email if provided
            if (!empty($data['email']) && !validateEmail($data['email'])) {
                return ['success' => false, 'message' => 'Invalid email format'];
            }
            
            // Check if email already exists (excluding current user)
            if (!empty($data['email']) && $data['email'] !== $user['email']) {
                if ($this->getUserByEmail($data['email'])) {
                    return ['success' => false, 'message' => 'Email already exists'];
                }
            }
            
            // Validate role if provided
            if (!empty($data['role']) && !array_key_exists($data['role'], USER_ROLES)) {
                return ['success' => false, 'message' => 'Invalid role'];
            }
            
            // Prepare update data
            $updateData = ['updated_at' => date('Y-m-d H:i:s')];
            
            if (!empty($data['name'])) {
                $updateData['name'] = sanitizeInput($data['name']);
            }
            
            if (!empty($data['email'])) {
                $updateData['email'] = sanitizeInput($data['email']);
            }
            
            if (!empty($data['role'])) {
                $updateData['role'] = $data['role'];
                // Update permissions based on new role
                $permissions = DEFAULT_PERMISSIONS[$data['role']] ?? [];
                $updateData['permissions'] = json_encode($permissions);
            }
            
            if (!empty($data['department'])) {
                $updateData['department'] = sanitizeInput($data['department']);
            }
            
            if (isset($data['is_active'])) {
                $updateData['is_active'] = (bool)$data['is_active'];
            }
            
            // Update user
            $this->db->update('users', $updateData, 'id = :id', ['id' => $id]);
            
            // Log activity
            $this->logActivity($id, $user['name'], $user['role'], 'user_updated', 'User profile updated', 'info', 'user_management');
            
            return ['success' => true, 'message' => 'User updated successfully'];
            
        } catch (Exception $e) {
            error_log("Update user error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to update user'];
        }
    }
    
    /**
     * Delete user
     */
    public function deleteUser($id) {
        try {
            // Check if user exists
            $user = $this->getUserById($id);
            if (!$user) {
                return ['success' => false, 'message' => 'User not found'];
            }
            
            // Prevent deleting super admin
            if ($user['role'] === 'super_admin') {
                return ['success' => false, 'message' => 'Cannot delete super administrator'];
            }
            
            // Check if user has any active audits
            $sql = "SELECT COUNT(*) as count FROM audits WHERE audit_manager = :id OR JSON_CONTAINS(assigned_auditors, :id_json)";
            $result = $this->db->fetch($sql, [
                'id' => $id,
                'id_json' => json_encode($id)
            ]);
            
            if ($result['count'] > 0) {
                return ['success' => false, 'message' => 'Cannot delete user with active audits'];
            }
            
            // Delete user
            $this->db->delete('users', 'id = :id', ['id' => $id]);
            
            // Log activity
            $this->logActivity($id, $user['name'], $user['role'], 'user_deleted', 'User account deleted', 'warning', 'user_management');
            
            return ['success' => true, 'message' => 'User deleted successfully'];
            
        } catch (Exception $e) {
            error_log("Delete user error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to delete user'];
        }
    }
    
    /**
     * Activate/Deactivate user
     */
    public function toggleUserStatus($id) {
        try {
            $user = $this->getUserById($id);
            if (!$user) {
                return ['success' => false, 'message' => 'User not found'];
            }
            
            $newStatus = !$user['is_active'];
            $this->db->update('users', [
                'is_active' => $newStatus,
                'updated_at' => date('Y-m-d H:i:s')
            ], 'id = :id', ['id' => $id]);
            
            $action = $newStatus ? 'activated' : 'deactivated';
            $this->logActivity($id, $user['name'], $user['role'], 'user_status_changed', "User account {$action}", 'info', 'user_management');
            
            return [
                'success' => true,
                'message' => "User {$action} successfully",
                'is_active' => $newStatus
            ];
            
        } catch (Exception $e) {
            error_log("Toggle user status error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to update user status'];
        }
    }
    
    /**
     * Update user permissions
     */
    public function updatePermissions($id, $permissions) {
        try {
            $user = $this->getUserById($id);
            if (!$user) {
                return ['success' => false, 'message' => 'User not found'];
            }
            
            // Validate permissions
            $allPermissions = array_merge(...array_values(DEFAULT_PERMISSIONS));
            $validPermissions = array_intersect($permissions, $allPermissions);
            
            if (count($validPermissions) !== count($permissions)) {
                return ['success' => false, 'message' => 'Invalid permissions provided'];
            }
            
            $this->db->update('users', [
                'permissions' => json_encode($validPermissions),
                'updated_at' => date('Y-m-d H:i:s')
            ], 'id = :id', ['id' => $id]);
            
            $this->logActivity($id, $user['name'], $user['role'], 'permissions_updated', 'User permissions updated', 'info', 'user_management');
            
            return ['success' => true, 'message' => 'Permissions updated successfully'];
            
        } catch (Exception $e) {
            error_log("Update permissions error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to update permissions'];
        }
    }
    
    /**
     * Get user statistics
     */
    public function getUserStats() {
        $sql = "SELECT 
                    COUNT(*) as total_users,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
                    SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_users,
                    SUM(CASE WHEN last_login > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as recent_logins
                FROM users";
        
        $stats = $this->db->fetch($sql);
        
        // Get users by role
        $roleStats = $this->db->fetchAll("SELECT role, COUNT(*) as count FROM users GROUP BY role");
        $stats['by_role'] = array_column($roleStats, 'count', 'role');
        
        // Get users by department
        $deptStats = $this->db->fetchAll("SELECT department, COUNT(*) as count FROM users GROUP BY department");
        $stats['by_department'] = array_column($deptStats, 'count', 'department');
        
        return $stats;
    }
    
    /**
     * Get user activity
     */
    public function getUserActivity($userId, $limit = 50) {
        $sql = "SELECT * FROM activities WHERE user_id = :user_id ORDER BY timestamp DESC LIMIT :limit";
        return $this->db->fetchAll($sql, ['user_id' => $userId, 'limit' => $limit]);
    }
    
    /**
     * Search users
     */
    public function searchUsers($query, $filters = []) {
        $sql = "SELECT id, name, email, role, department, is_active, last_login FROM users WHERE 1=1";
        $params = [];
        
        if (!empty($query)) {
            $sql .= " AND (name LIKE :query OR email LIKE :query OR department LIKE :query)";
            $params['query'] = '%' . $query . '%';
        }
        
        // Apply additional filters
        if (!empty($filters['role'])) {
            $sql .= " AND role = :role";
            $params['role'] = $filters['role'];
        }
        
        if (isset($filters['is_active'])) {
            $sql .= " AND is_active = :is_active";
            $params['is_active'] = $filters['is_active'];
        }
        
        $sql .= " ORDER BY name ASC";
        
        if (!empty($filters['limit'])) {
            $sql .= " LIMIT :limit";
            $params['limit'] = (int)$filters['limit'];
        }
        
        return $this->db->fetchAll($sql, $params);
    }
    
    /**
     * Get users by role
     */
    public function getUsersByRole($role) {
        $sql = "SELECT id, name, email, department, is_active FROM users WHERE role = :role AND is_active = 1 ORDER BY name";
        return $this->db->fetchAll($sql, ['role' => $role]);
    }
    
    /**
     * Get users by department
     */
    public function getUsersByDepartment($department) {
        $sql = "SELECT id, name, email, role, is_active FROM users WHERE department = :department AND is_active = 1 ORDER BY name";
        return $this->db->fetchAll($sql, ['department' => $department]);
    }
    
    /**
     * Get user profile data
     */
    public function getUserProfile($id) {
        $user = $this->getUserById($id);
        if (!$user) {
            return null;
        }
        
        // Remove sensitive data
        unset($user['password_hash']);
        
        // Decode permissions
        $user['permissions'] = json_decode($user['permissions'], true) ?? [];
        
        // Get recent activity
        $user['recent_activity'] = $this->getUserActivity($id, 10);
        
        // Get user statistics
        $user['stats'] = [
            'audits_managed' => $this->getUserAuditCount($id, 'manager'),
            'audits_assigned' => $this->getUserAuditCount($id, 'auditor'),
            'documents_uploaded' => $this->getUserDocumentCount($id),
            'reports_created' => $this->getUserReportCount($id)
        ];
        
        return $user;
    }
    
    /**
     * Get user audit count
     */
    private function getUserAuditCount($userId, $type) {
        if ($type === 'manager') {
            $sql = "SELECT COUNT(*) as count FROM audits WHERE audit_manager = :user_id";
        } else {
            $sql = "SELECT COUNT(*) as count FROM audits WHERE JSON_CONTAINS(assigned_auditors, :user_id_json)";
        }
        
        $params = ['user_id' => $userId];
        if ($type === 'auditor') {
            $params['user_id_json'] = json_encode($userId);
        }
        
        $result = $this->db->fetch($sql, $params);
        return $result['count'] ?? 0;
    }
    
    /**
     * Get user document count
     */
    private function getUserDocumentCount($userId) {
        $sql = "SELECT COUNT(*) as count FROM documents WHERE uploaded_by = :user_id";
        $result = $this->db->fetch($sql, ['user_id' => $userId]);
        return $result['count'] ?? 0;
    }
    
    /**
     * Get user report count
     */
    private function getUserReportCount($userId) {
        $sql = "SELECT COUNT(*) as count FROM reports WHERE created_by = :user_id";
        $result = $this->db->fetch($sql, ['user_id' => $userId]);
        return $result['count'] ?? 0;
    }
    
    /**
     * Log activity
     */
    private function logActivity($userId, $userName, $userRole, $action, $description, $severity = 'info', $resource = null, $metadata = null) {
        $activityLogger = new ActivityLogger();
        return $activityLogger->log($userId, $userName, $userRole, $action, $description, $severity, $resource, $metadata);
    }
}

// Global user instance
function getUserManager() {
    static $userManager = null;
    if ($userManager === null) {
        $userManager = new User();
    }
    return $userManager;
}
