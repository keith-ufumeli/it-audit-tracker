<?php

/**
 * Notification Manager Class
 * Handles notifications, alerts, and messaging
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

require_once APP_ROOT . '/config/config.php';
require_once APP_ROOT . '/config/database.php';

class NotificationManager
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Create notification
     */
    public function create($userId, $userName, $userRole, $title, $message, $type, $priority = 'medium', $metadata = null)
    {
        try {
            // Generate notification ID
            $notificationId = generateId('notif_');

            // Prepare notification data
            $notificationData = [
                'id' => $notificationId,
                'user_id' => $userId,
                'user_name' => sanitizeInput($userName),
                'user_role' => sanitizeInput($userRole),
                'title' => sanitizeInput($title),
                'message' => sanitizeInput($message),
                'type' => $type,
                'status' => 'unread',
                'priority' => $priority,
                'created_at' => date('Y-m-d H:i:s'),
                'read_at' => null,
                'expires_at' => $this->getExpirationDate($priority),
                'metadata' => $metadata ? json_encode($metadata) : null
            ];

            // Insert notification
            $this->db->insert('notifications', $notificationData);

            // Send email notification if configured
            if (getConfig('SMTP_FROM_EMAIL')) {
                $this->sendEmailNotification($userId, $title, $message, $priority);
            }

            return $notificationId;
        } catch (Exception $e) {
            error_log("Create notification error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get notifications for user
     */
    public function getNotificationsByUser($userId, $filters = [])
    {
        $sql = "SELECT * FROM notifications WHERE user_id = :user_id";
        $params = ['user_id' => $userId];

        // Apply filters
        if (!empty($filters['status'])) {
            $sql .= " AND status = :status";
            $params['status'] = $filters['status'];
        }

        if (!empty($filters['type'])) {
            $sql .= " AND type = :type";
            $params['type'] = $filters['type'];
        }

        if (!empty($filters['priority'])) {
            $sql .= " AND priority = :priority";
            $params['priority'] = $filters['priority'];
        }

        if (!empty($filters['unread_only'])) {
            $sql .= " AND status = 'unread'";
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

        $notifications = $this->db->fetchAll($sql, $params);

        // Process notifications
        foreach ($notifications as &$notification) {
            $notification['metadata'] = $notification['metadata'] ? json_decode($notification['metadata'], true) : null;
        }

        return $notifications;
    }

    /**
     * Get unread notifications for user
     */
    public function getUnreadNotificationsByUser($userId)
    {
        return $this->getNotificationsByUser($userId, ['unread_only' => true]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead($notificationId, $userId = null)
    {
        try {
            $sql = "UPDATE notifications SET status = 'read', read_at = NOW() WHERE id = :id";
            $params = ['id' => $notificationId];

            if ($userId) {
                $sql .= " AND user_id = :user_id";
                $params['user_id'] = $userId;
            }

            $result = $this->db->query($sql, $params);

            return $result->rowCount() > 0;
        } catch (Exception $e) {
            error_log("Mark notification as read error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Mark all notifications as read for user
     */
    public function markAllAsRead($userId)
    {
        try {
            $sql = "UPDATE notifications SET status = 'read', read_at = NOW() WHERE user_id = :user_id AND status = 'unread'";
            $result = $this->db->query($sql, ['user_id' => $userId]);

            return $result->rowCount();
        } catch (Exception $e) {
            error_log("Mark all notifications as read error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Archive notification
     */
    public function archiveNotification($notificationId, $userId = null)
    {
        try {
            $sql = "UPDATE notifications SET status = 'archived' WHERE id = :id";
            $params = ['id' => $notificationId];

            if ($userId) {
                $sql .= " AND user_id = :user_id";
                $params['user_id'] = $userId;
            }

            $result = $this->db->query($sql, $params);

            return $result->rowCount() > 0;
        } catch (Exception $e) {
            error_log("Archive notification error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete notification
     */
    public function deleteNotification($notificationId, $userId = null)
    {
        try {
            $sql = "DELETE FROM notifications WHERE id = :id";
            $params = ['id' => $notificationId];

            if ($userId) {
                $sql .= " AND user_id = :user_id";
                $params['user_id'] = $userId;
            }

            $result = $this->db->query($sql, $params);

            return $result->rowCount() > 0;
        } catch (Exception $e) {
            error_log("Delete notification error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get notification statistics
     */
    public function getNotificationStats()
    {
        $sql = "SELECT 
                    COUNT(*) as total_notifications,
                    SUM(CASE WHEN status = 'unread' THEN 1 ELSE 0 END) as unread_notifications,
                    SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read_notifications,
                    SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived_notifications,
                    SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority_notifications,
                    SUM(CASE WHEN priority = 'critical' THEN 1 ELSE 0 END) as critical_notifications
                FROM notifications";

        $stats = $this->db->fetch($sql);

        // Get notifications by type
        $typeStats = $this->db->fetchAll("SELECT type, COUNT(*) as count FROM notifications GROUP BY type");
        $stats['by_type'] = array_column($typeStats, 'count', 'type');

        // Get notifications by priority
        $priorityStats = $this->db->fetchAll("SELECT priority, COUNT(*) as count FROM notifications GROUP BY priority");
        $stats['by_priority'] = array_column($priorityStats, 'count', 'priority');

        return $stats;
    }

    /**
     * Get notification by ID
     */
    public function getNotificationById($id)
    {
        $sql = "SELECT * FROM notifications WHERE id = :id";
        $notification = $this->db->fetch($sql, ['id' => $id]);

        if ($notification) {
            $notification['metadata'] = $notification['metadata'] ? json_decode($notification['metadata'], true) : null;
        }

        return $notification;
    }

    /**
     * Clean expired notifications
     */
    public function cleanExpiredNotifications()
    {
        try {
            $sql = "DELETE FROM notifications WHERE expires_at IS NOT NULL AND expires_at < NOW()";
            $result = $this->db->query($sql);

            return $result->rowCount();
        } catch (Exception $e) {
            error_log("Clean expired notifications error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Clean old notifications
     */
    public function cleanOldNotifications($days = 90)
    {
        try {
            $sql = "DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL :days DAY)";
            $result = $this->db->query($sql, ['days' => $days]);

            return $result->rowCount();
        } catch (Exception $e) {
            error_log("Clean old notifications error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Send bulk notification
     */
    public function sendBulkNotification($userIds, $title, $message, $type, $priority = 'medium', $metadata = null)
    {
        $sent = 0;
        $errors = [];

        foreach ($userIds as $userId) {
            $userManager = new User();
            $user = $userManager->getUserById($userId);

            if ($user) {
                $result = $this->create($userId, $user['name'], $user['role'], $title, $message, $type, $priority, $metadata);
                if ($result) {
                    $sent++;
                } else {
                    $errors[] = "Failed to send notification to user {$userId}";
                }
            } else {
                $errors[] = "User {$userId} not found";
            }
        }

        return [
            'sent' => $sent,
            'errors' => $errors,
            'total' => count($userIds)
        ];
    }

    /**
     * Send notification to role
     */
    public function sendNotificationToRole($role, $title, $message, $type, $priority = 'medium', $metadata = null)
    {
        $userManager = new User();
        $users = $userManager->getUsersByRole($role);
        $userIds = array_column($users, 'id');

        return $this->sendBulkNotification($userIds, $title, $message, $type, $priority, $metadata);
    }

    /**
     * Send notification to department
     */
    public function sendNotificationToDepartment($department, $title, $message, $type, $priority = 'medium', $metadata = null)
    {
        $userManager = new User();
        $users = $userManager->getUsersByDepartment($department);
        $userIds = array_column($users, 'id');

        return $this->sendBulkNotification($userIds, $title, $message, $type, $priority, $metadata);
    }

    /**
     * Get notification trends
     */
    public function getNotificationTrends($days = 30)
    {
        $sql = "SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as total_notifications,
                    SUM(CASE WHEN status = 'unread' THEN 1 ELSE 0 END) as unread_count,
                    SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority_count,
                    SUM(CASE WHEN priority = 'critical' THEN 1 ELSE 0 END) as critical_count
                FROM notifications 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
                GROUP BY DATE(created_at)
                ORDER BY date DESC";

        return $this->db->fetchAll($sql, ['days' => $days]);
    }

    /**
     * Get expiration date based on priority
     */
    private function getExpirationDate($priority)
    {
        $expirationDays = [
            'low' => 30,
            'medium' => 14,
            'high' => 7,
            'critical' => 3
        ];

        $days = $expirationDays[$priority] ?? 14;
        return date('Y-m-d H:i:s', strtotime("+{$days} days"));
    }

    /**
     * Send email notification
     */
    private function sendEmailNotification($userId, $title, $message, $priority)
    {
        try {
            $userManager = new User();
            $user = $userManager->getUserById($userId);

            if (!$user || !$user['email']) {
                return false;
            }

            // In a real implementation, you would use PHPMailer or similar
            // For now, we'll just log the email
            $emailData = [
                'to' => $user['email'],
                'subject' => "[{$priority}] {$title}",
                'message' => $message,
                'priority' => $priority
            ];

            logMessage("Email notification: " . json_encode($emailData), 'INFO');

            return true;
        } catch (Exception $e) {
            error_log("Send email notification error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Export notifications to CSV
     */
    public function exportNotifications($filters = [])
    {
        $sql = "SELECT * FROM notifications WHERE 1=1";
        $params = [];

        // Apply filters
        if (!empty($filters['user_id'])) {
            $sql .= " AND user_id = :user_id";
            $params['user_id'] = $filters['user_id'];
        }

        if (!empty($filters['status'])) {
            $sql .= " AND status = :status";
            $params['status'] = $filters['status'];
        }

        if (!empty($filters['type'])) {
            $sql .= " AND type = :type";
            $params['type'] = $filters['type'];
        }

        if (!empty($filters['priority'])) {
            $sql .= " AND priority = :priority";
            $params['priority'] = $filters['priority'];
        }

        $sql .= " ORDER BY created_at DESC";

        $notifications = $this->db->fetchAll($sql, $params);

        $data = [
            ['ID', 'User Name', 'User Role', 'Title', 'Message', 'Type', 'Status', 'Priority', 'Created At', 'Read At']
        ];

        foreach ($notifications as $notification) {
            $data[] = [
                $notification['id'],
                $notification['user_name'],
                $notification['user_role'],
                $notification['title'],
                $notification['message'],
                $notification['type'],
                $notification['status'],
                $notification['priority'],
                $notification['created_at'],
                $notification['read_at']
            ];
        }

        $filename = 'notifications_' . date('Y-m-d_H-i-s') . '.csv';
        arrayToCSV($data, $filename);
    }
}

// Global notification manager instance
function getNotificationManager()
{
    static $notificationManager = null;
    if ($notificationManager === null) {
        $notificationManager = new NotificationManager();
    }
    return $notificationManager;
}
