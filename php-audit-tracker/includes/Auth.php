<?php
/**
 * Authentication Class
 * Handles user authentication, session management, and security
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

require_once APP_ROOT . '/config/config.php';
require_once APP_ROOT . '/config/database.php';

class Auth {
    private $db;
    private $user;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->startSession();
    }
    
    /**
     * Start session if not already started
     */
    private function startSession() {
        if (session_status() === PHP_SESSION_NONE) {
            session_name(SESSION_NAME);
            session_set_cookie_params([
                'lifetime' => SESSION_LIFETIME,
                'path' => '/',
                'domain' => '',
                'secure' => false, // Set to true in production with HTTPS
                'httponly' => true,
                'samesite' => 'Strict'
            ]);
            session_start();
        }
    }
    
    /**
     * Login user with email and password
     */
    public function login($email, $password, $rememberMe = false) {
        try {
            // Validate input
            if (empty($email) || empty($password)) {
                return ['success' => false, 'message' => 'Email and password are required'];
            }
            
            if (!validateEmail($email)) {
                return ['success' => false, 'message' => 'Invalid email format'];
            }
            
            // Check login attempts
            if ($this->isAccountLocked($email)) {
                return ['success' => false, 'message' => 'Account is temporarily locked due to too many failed attempts'];
            }
            
            // Get user from database
            $user = $this->getUserByEmail($email);
            if (!$user) {
                $this->recordFailedLogin($email);
                return ['success' => false, 'message' => 'Invalid email or password'];
            }
            
            // Check if user is active
            if (!$user['is_active']) {
                return ['success' => false, 'message' => 'Account is deactivated'];
            }
            
            // Verify password
            if (!verifyPassword($password, $user['password_hash'])) {
                $this->recordFailedLogin($email);
                return ['success' => false, 'message' => 'Invalid email or password'];
            }
            
            // Clear failed login attempts
            $this->clearFailedLogins($email);
            
            // Update last login
            $this->updateLastLogin($user['id']);
            
            // Set session data
            $this->setSession($user);
            
            // Set remember me cookie if requested
            if ($rememberMe) {
                $this->setRememberMeCookie($user['id']);
            }
            
            // Log successful login
            $this->logActivity($user['id'], $user['name'], $user['role'], 'login', 'User logged into the system', 'info', 'authentication');
            
            return [
                'success' => true, 
                'message' => 'Login successful',
                'user' => $this->getUserData($user),
                'redirect' => getPortalRoute($user['role'])
            ];
            
        } catch (Exception $e) {
            error_log("Login error: " . $e->getMessage());
            return ['success' => false, 'message' => 'An error occurred during login'];
        }
    }
    
    /**
     * Logout user
     */
    public function logout() {
        if ($this->isLoggedIn()) {
            $user = $this->getCurrentUser();
            
            // Log logout activity
            if ($user) {
                $this->logActivity($user['id'], $user['name'], $user['role'], 'logout', 'User logged out of the system', 'info', 'authentication');
            }
            
            // Clear remember me cookie
            $this->clearRememberMeCookie();
            
            // Destroy session
            session_destroy();
            
            return ['success' => true, 'message' => 'Logged out successfully'];
        }
        
        return ['success' => false, 'message' => 'Not logged in'];
    }
    
    /**
     * Check if user is logged in
     */
    public function isLoggedIn() {
        return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
    }
    
    /**
     * Get current logged in user
     */
    public function getCurrentUser() {
        if (!$this->isLoggedIn()) {
            return null;
        }
        
        if (!$this->user) {
            $this->user = $this->getUserById($_SESSION['user_id']);
        }
        
        return $this->user;
    }
    
    /**
     * Check if user has permission
     */
    public function hasPermission($permission) {
        $user = $this->getCurrentUser();
        if (!$user) {
            return false;
        }
        
        $permissions = json_decode($user['permissions'], true) ?? [];
        return in_array($permission, $permissions);
    }
    
    /**
     * Check if user has role
     */
    public function hasRole($role) {
        $user = $this->getCurrentUser();
        if (!$user) {
            return false;
        }
        
        if (is_array($role)) {
            return in_array($user['role'], $role);
        }
        
        return $user['role'] === $role;
    }
    
    /**
     * Check if user has admin access
     */
    public function hasAdminAccess() {
        return $this->hasRole(['super_admin', 'audit_manager', 'auditor', 'management']);
    }
    
    /**
     * Check if user is super admin
     */
    public function isSuperAdmin() {
        return $this->hasRole('super_admin');
    }
    
    /**
     * Require authentication
     */
    public function requireAuth() {
        if (!$this->isLoggedIn()) {
            if (isAjaxRequest()) {
                sendErrorResponse('Authentication required', 401);
            } else {
                redirect('/auth/login.php');
            }
        }
    }
    
    /**
     * Require specific permission
     */
    public function requirePermission($permission) {
        $this->requireAuth();
        
        if (!$this->hasPermission($permission)) {
            if (isAjaxRequest()) {
                sendErrorResponse('Insufficient permissions', 403);
            } else {
                redirect('/auth/unauthorized.php');
            }
        }
    }
    
    /**
     * Require specific role
     */
    public function requireRole($role) {
        $this->requireAuth();
        
        if (!$this->hasRole($role)) {
            if (isAjaxRequest()) {
                sendErrorResponse('Insufficient permissions', 403);
            } else {
                redirect('/auth/unauthorized.php');
            }
        }
    }
    
    /**
     * Require admin access
     */
    public function requireAdminAccess() {
        $this->requireAuth();
        
        if (!$this->hasAdminAccess()) {
            if (isAjaxRequest()) {
                sendErrorResponse('Admin access required', 403);
            } else {
                redirect('/auth/unauthorized.php');
            }
        }
    }
    
    /**
     * Get user by email
     */
    private function getUserByEmail($email) {
        $sql = "SELECT * FROM users WHERE email = :email AND is_active = 1";
        return $this->db->fetch($sql, ['email' => $email]);
    }
    
    /**
     * Get user by ID
     */
    private function getUserById($id) {
        $sql = "SELECT * FROM users WHERE id = :id AND is_active = 1";
        return $this->db->fetch($sql, ['id' => $id]);
    }
    
    /**
     * Set session data
     */
    private function setSession($user) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['user_department'] = $user['department'];
        $_SESSION['user_permissions'] = $user['permissions'];
        $_SESSION['login_time'] = time();
        $_SESSION['last_activity'] = time();
    }
    
    /**
     * Update last login time
     */
    private function updateLastLogin($userId) {
        $sql = "UPDATE users SET last_login = NOW() WHERE id = :id";
        $this->db->query($sql, ['id' => $userId]);
    }
    
    /**
     * Set remember me cookie
     */
    private function setRememberMeCookie($userId) {
        $token = generateToken();
        $expires = time() + (30 * 24 * 60 * 60); // 30 days
        
        // Store token in database
        $sql = "INSERT INTO remember_tokens (user_id, token, expires_at) VALUES (:user_id, :token, :expires_at)";
        $this->db->query($sql, [
            'user_id' => $userId,
            'token' => hash('sha256', $token),
            'expires_at' => date('Y-m-d H:i:s', $expires)
        ]);
        
        // Set cookie
        setcookie('remember_token', $token, $expires, '/', '', false, true);
    }
    
    /**
     * Clear remember me cookie
     */
    private function clearRememberMeCookie() {
        if (isset($_COOKIE['remember_token'])) {
            $token = $_COOKIE['remember_token'];
            
            // Remove from database
            $sql = "DELETE FROM remember_tokens WHERE token = :token";
            $this->db->query($sql, ['token' => hash('sha256', $token)]);
            
            // Clear cookie
            setcookie('remember_token', '', time() - 3600, '/', '', false, true);
        }
    }
    
    /**
     * Check remember me token
     */
    public function checkRememberMe() {
        if (isset($_COOKIE['remember_token']) && !$this->isLoggedIn()) {
            $token = $_COOKIE['remember_token'];
            $hashedToken = hash('sha256', $token);
            
            $sql = "SELECT u.* FROM users u 
                    JOIN remember_tokens rt ON u.id = rt.user_id 
                    WHERE rt.token = :token AND rt.expires_at > NOW() AND u.is_active = 1";
            
            $user = $this->db->fetch($sql, ['token' => $hashedToken]);
            
            if ($user) {
                $this->setSession($user);
                $this->updateLastLogin($user['id']);
                
                // Log automatic login
                $this->logActivity($user['id'], $user['name'], $user['role'], 'auto_login', 'User automatically logged in via remember me', 'info', 'authentication');
                
                return true;
            } else {
                // Invalid token, clear cookie
                setcookie('remember_token', '', time() - 3600, '/', '', false, true);
            }
        }
        
        return false;
    }
    
    /**
     * Check if account is locked
     */
    private function isAccountLocked($email) {
        $sql = "SELECT COUNT(*) as attempts FROM failed_logins 
                WHERE email = :email AND attempted_at > DATE_SUB(NOW(), INTERVAL :lockout_time SECOND)";
        
        $result = $this->db->fetch($sql, [
            'email' => $email,
            'lockout_time' => LOGIN_LOCKOUT_TIME
        ]);
        
        return $result['attempts'] >= MAX_LOGIN_ATTEMPTS;
    }
    
    /**
     * Record failed login attempt
     */
    private function recordFailedLogin($email) {
        $sql = "INSERT INTO failed_logins (email, ip_address, user_agent, attempted_at) 
                VALUES (:email, :ip_address, :user_agent, NOW())";
        
        $this->db->query($sql, [
            'email' => $email,
            'ip_address' => getClientIP(),
            'user_agent' => getUserAgent()
        ]);
    }
    
    /**
     * Clear failed login attempts
     */
    private function clearFailedLogins($email) {
        $sql = "DELETE FROM failed_logins WHERE email = :email";
        $this->db->query($sql, ['email' => $email]);
    }
    
    /**
     * Get user data for response
     */
    private function getUserData($user) {
        return [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'department' => $user['department'],
            'permissions' => json_decode($user['permissions'], true) ?? [],
            'last_login' => $user['last_login']
        ];
    }
    
    /**
     * Log activity
     */
    private function logActivity($userId, $userName, $userRole, $action, $description, $severity = 'info', $resource = null, $metadata = null) {
        $activityLogger = new ActivityLogger();
        return $activityLogger->log($userId, $userName, $userRole, $action, $description, $severity, $resource, $metadata);
    }
    
    /**
     * Change password
     */
    public function changePassword($currentPassword, $newPassword) {
        $user = $this->getCurrentUser();
        if (!$user) {
            return ['success' => false, 'message' => 'Not logged in'];
        }
        
        // Verify current password
        if (!verifyPassword($currentPassword, $user['password_hash'])) {
            return ['success' => false, 'message' => 'Current password is incorrect'];
        }
        
        // Validate new password
        $errors = validatePassword($newPassword);
        if (!empty($errors)) {
            return ['success' => false, 'message' => implode(', ', $errors)];
        }
        
        // Update password
        $newHash = hashPassword($newPassword);
        $sql = "UPDATE users SET password_hash = :password_hash, updated_at = NOW() WHERE id = :id";
        $this->db->query($sql, ['password_hash' => $newHash, 'id' => $user['id']]);
        
        // Log password change
        $this->logActivity($user['id'], $user['name'], $user['role'], 'password_change', 'User changed password', 'info', 'security');
        
        return ['success' => true, 'message' => 'Password changed successfully'];
    }
    
    /**
     * Reset password (admin function)
     */
    public function resetPassword($userId, $newPassword) {
        if (!$this->isSuperAdmin()) {
            return ['success' => false, 'message' => 'Insufficient permissions'];
        }
        
        // Validate password
        $errors = validatePassword($newPassword);
        if (!empty($errors)) {
            return ['success' => false, 'message' => implode(', ', $errors)];
        }
        
        // Update password
        $newHash = hashPassword($newPassword);
        $sql = "UPDATE users SET password_hash = :password_hash, updated_at = NOW() WHERE id = :id";
        $this->db->query($sql, ['password_hash' => $newHash, 'id' => $userId]);
        
        // Log password reset
        $this->logActivity($userId, 'System', 'super_admin', 'password_reset', 'Password reset by administrator', 'warning', 'security');
        
        return ['success' => true, 'message' => 'Password reset successfully'];
    }
    
    /**
     * Check session timeout
     */
    public function checkSessionTimeout() {
        if ($this->isLoggedIn()) {
            $lastActivity = $_SESSION['last_activity'] ?? 0;
            $timeout = SESSION_LIFETIME;
            
            if (time() - $lastActivity > $timeout) {
                $this->logout();
                return false;
            }
            
            // Update last activity
            $_SESSION['last_activity'] = time();
        }
        
        return true;
    }
    
    /**
     * Regenerate session ID
     */
    public function regenerateSessionId() {
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
        }
    }
    
    /**
     * Get session info
     */
    public function getSessionInfo() {
        if (!$this->isLoggedIn()) {
            return null;
        }
        
        return [
            'user_id' => $_SESSION['user_id'],
            'login_time' => $_SESSION['login_time'] ?? null,
            'last_activity' => $_SESSION['last_activity'] ?? null,
            'session_lifetime' => SESSION_LIFETIME
        ];
    }
}

// Global auth instance
function getAuth() {
    static $auth = null;
    if ($auth === null) {
        $auth = new Auth();
    }
    return $auth;
}
