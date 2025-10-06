<?php
/**
 * Activity Logger Class
 * Handles logging of user activities and system events
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

require_once APP_ROOT . '/config/config.php';
require_once APP_ROOT . '/config/database.php';

class ActivityLogger {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Log activity
     */
    public function log($userId, $userName, $userRole, $action, $description, $severity = 'info', $resource = null, $metadata = null) {
        try {
            // Generate activity ID
            $activityId = generateId('activity_');
            
            // Prepare activity data
            $activityData = [
                'id' => $activityId,
                'user_id' => $userId,
                'user_name' => sanitizeInput($userName),
                'user_role' => sanitizeInput($userRole),
                'action' => sanitizeInput($action),
                'description' => sanitizeInput($description),
                'timestamp' => date('Y-m-d H:i:s'),
                'ip_address' => getClientIP(),
                'user_agent' => getUserAgent(),
                'severity' => $severity,
                'resource' => $resource,
                'metadata' => $metadata ? json_encode($metadata) : null
            ];
            
            // Insert activity
            $this->db->insert('activities', $activityData);
            
            // Log to file if configured
            if (APP_DEBUG) {
                $logMessage = "[{$severity}] {$userName} ({$userRole}): {$action} - {$description}";
                logMessage($logMessage, strtoupper($severity));
            }
            
            return $activityId;
            
        } catch (Exception $e) {
            error_log("Activity logging error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get activities with filters
     */
    public function getActivities($filters = []) {
        $sql = "SELECT * FROM activities WHERE 1=1";
        $params = [];
        
        // Apply filters
        if (!empty($filters['user_id'])) {
            $sql .= " AND user_id = :user_id";
            $params['user_id'] = $filters['user_id'];
        }
        
        if (!empty($filters['action'])) {
            $sql .= " AND action = :action";
            $params['action'] = $filters['action'];
        }
        
        if (!empty($filters['severity'])) {
            $sql .= " AND severity = :severity";
            $params['severity'] = $filters['severity'];
        }
        
        if (!empty($filters['resource'])) {
            $sql .= " AND resource = :resource";
            $params['resource'] = $filters['resource'];
        }
        
        if (!empty($filters['date_from'])) {
            $sql .= " AND timestamp >= :date_from";
            $params['date_from'] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $sql .= " AND timestamp <= :date_to";
            $params['date_to'] = $filters['date_to'];
        }
        
        if (!empty($filters['search'])) {
            $sql .= " AND (description LIKE :search OR action LIKE :search OR user_name LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }
        
        $sql .= " ORDER BY timestamp DESC";
        
        // Add pagination
        if (!empty($filters['limit'])) {
            $sql .= " LIMIT :limit";
            $params['limit'] = (int)$filters['limit'];
            
            if (!empty($filters['offset'])) {
                $sql .= " OFFSET :offset";
                $params['offset'] = (int)$filters['offset'];
            }
        }
        
        $activities = $this->db->fetchAll($sql, $params);
        
        // Process activities
        foreach ($activities as &$activity) {
            $activity['metadata'] = $activity['metadata'] ? json_decode($activity['metadata'], true) : null;
        }
        
        return $activities;
    }
    
    /**
     * Get recent activities
     */
    public function getRecentActivities($limit = 50) {
        $sql = "SELECT * FROM activities ORDER BY timestamp DESC LIMIT :limit";
        $activities = $this->db->fetchAll($sql, ['limit' => $limit]);
        
        // Process activities
        foreach ($activities as &$activity) {
            $activity['metadata'] = $activity['metadata'] ? json_decode($activity['metadata'], true) : null;
        }
        
        return $activities;
    }
    
    /**
     * Get activities by user
     */
    public function getActivitiesByUser($userId, $limit = 100) {
        $sql = "SELECT * FROM activities WHERE user_id = :user_id ORDER BY timestamp DESC LIMIT :limit";
        $activities = $this->db->fetchAll($sql, ['user_id' => $userId, 'limit' => $limit]);
        
        // Process activities
        foreach ($activities as &$activity) {
            $activity['metadata'] = $activity['metadata'] ? json_decode($activity['metadata'], true) : null;
        }
        
        return $activities;
    }
    
    /**
     * Get activity statistics
     */
    public function getActivityStats() {
        $sql = "SELECT 
                    COUNT(*) as total_activities,
                    SUM(CASE WHEN severity = 'info' THEN 1 ELSE 0 END) as info_activities,
                    SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as warning_activities,
                    SUM(CASE WHEN severity = 'error' THEN 1 ELSE 0 END) as error_activities,
                    SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_activities,
                    SUM(CASE WHEN timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as recent_activities
                FROM activities";
        
        $stats = $this->db->fetch($sql);
        
        // Get activities by action
        $actionStats = $this->db->fetchAll("SELECT action, COUNT(*) as count FROM activities GROUP BY action ORDER BY count DESC LIMIT 10");
        $stats['by_action'] = array_column($actionStats, 'count', 'action');
        
        // Get activities by user
        $userStats = $this->db->fetchAll("SELECT user_name, COUNT(*) as count FROM activities GROUP BY user_name ORDER BY count DESC LIMIT 10");
        $stats['by_user'] = array_column($userStats, 'count', 'user_name');
        
        return $stats;
    }
    
    /**
     * Clean old activities
     */
    public function cleanOldActivities($days = 90) {
        try {
            $sql = "DELETE FROM activities WHERE timestamp < DATE_SUB(NOW(), INTERVAL :days DAY)";
            $deleted = $this->db->query($sql, ['days' => $days]);
            
            return $deleted->rowCount();
            
        } catch (Exception $e) {
            error_log("Clean old activities error: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Export activities to CSV
     */
    public function exportActivities($filters = []) {
        $activities = $this->getActivities($filters);
        
        $data = [
            ['ID', 'User Name', 'User Role', 'Action', 'Description', 'Timestamp', 'IP Address', 'Severity', 'Resource']
        ];
        
        foreach ($activities as $activity) {
            $data[] = [
                $activity['id'],
                $activity['user_name'],
                $activity['user_role'],
                $activity['action'],
                $activity['description'],
                $activity['timestamp'],
                $activity['ip_address'],
                $activity['severity'],
                $activity['resource']
            ];
        }
        
        $filename = 'activities_' . date('Y-m-d_H-i-s') . '.csv';
        arrayToCSV($data, $filename);
    }
    
    /**
     * Get activity by ID
     */
    public function getActivityById($id) {
        $sql = "SELECT * FROM activities WHERE id = :id";
        $activity = $this->db->fetch($sql, ['id' => $id]);
        
        if ($activity) {
            $activity['metadata'] = $activity['metadata'] ? json_decode($activity['metadata'], true) : null;
        }
        
        return $activity;
    }
    
    /**
     * Search activities
     */
    public function searchActivities($query, $filters = []) {
        $sql = "SELECT * FROM activities WHERE (description LIKE :query OR action LIKE :query OR user_name LIKE :query)";
        $params = ['query' => '%' . $query . '%'];
        
        // Apply additional filters
        if (!empty($filters['severity'])) {
            $sql .= " AND severity = :severity";
            $params['severity'] = $filters['severity'];
        }
        
        if (!empty($filters['date_from'])) {
            $sql .= " AND timestamp >= :date_from";
            $params['date_from'] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $sql .= " AND timestamp <= :date_to";
            $params['date_to'] = $filters['date_to'];
        }
        
        $sql .= " ORDER BY timestamp DESC";
        
        if (!empty($filters['limit'])) {
            $sql .= " LIMIT :limit";
            $params['limit'] = (int)$filters['limit'];
        }
        
        $activities = $this->db->fetchAll($sql, $params);
        
        // Process activities
        foreach ($activities as &$activity) {
            $activity['metadata'] = $activity['metadata'] ? json_decode($activity['metadata'], true) : null;
        }
        
        return $activities;
    }
    
    /**
     * Get activities by resource
     */
    public function getActivitiesByResource($resource) {
        $sql = "SELECT * FROM activities WHERE resource = :resource ORDER BY timestamp DESC";
        $activities = $this->db->fetchAll($sql, ['resource' => $resource]);
        
        // Process activities
        foreach ($activities as &$activity) {
            $activity['metadata'] = $activity['metadata'] ? json_decode($activity['metadata'], true) : null;
        }
        
        return $activities;
    }
    
    /**
     * Get activities by date range
     */
    public function getActivitiesByDateRange($startDate, $endDate) {
        $sql = "SELECT * FROM activities WHERE timestamp BETWEEN :start_date AND :end_date ORDER BY timestamp DESC";
        $activities = $this->db->fetchAll($sql, [
            'start_date' => $startDate,
            'end_date' => $endDate
        ]);
        
        // Process activities
        foreach ($activities as &$activity) {
            $activity['metadata'] = $activity['metadata'] ? json_decode($activity['metadata'], true) : null;
        }
        
        return $activities;
    }
    
    /**
     * Get activity trends
     */
    public function getActivityTrends($days = 30) {
        $sql = "SELECT 
                    DATE(timestamp) as date,
                    COUNT(*) as total_activities,
                    SUM(CASE WHEN severity = 'info' THEN 1 ELSE 0 END) as info_count,
                    SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as warning_count,
                    SUM(CASE WHEN severity = 'error' THEN 1 ELSE 0 END) as error_count,
                    SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_count
                FROM activities 
                WHERE timestamp >= DATE_SUB(NOW(), INTERVAL :days DAY)
                GROUP BY DATE(timestamp)
                ORDER BY date DESC";
        
        return $this->db->fetchAll($sql, ['days' => $days]);
    }
}

// Global activity logger instance
function getActivityLogger() {
    static $activityLogger = null;
    if ($activityLogger === null) {
        $activityLogger = new ActivityLogger();
    }
    return $activityLogger;
}
