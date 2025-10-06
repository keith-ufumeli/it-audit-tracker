<?php
/**
 * Admin Dashboard Page
 * Main dashboard for admin users
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__, 2));
}

require_once APP_ROOT . '/config/config.php';

$auth = getAuth();
$auth->requireAdminAccess();

$user = $auth->getCurrentUser();
$auditManager = getAuditManager();
$userManager = getUserManager();
$documentManager = getDocumentManager();
$reportManager = getReportManager();
$notificationManager = getNotificationManager();
$activityLogger = getActivityLogger();

// Get dashboard data
$auditStats = $auditManager->getAuditStats();
$userStats = $userManager->getUserStats();
$documentStats = $documentManager->getDocumentStats();
$reportStats = $reportManager->getReportStats();
$notificationStats = $notificationManager->getNotificationStats();

$recentActivities = $activityLogger->getRecentActivities(10);
$recentNotifications = $notificationManager->getUnreadNotificationsByUser($user['id']);
$recentAudits = $auditManager->getAllAudits(['limit' => 5]);

// Generate CSRF token
$csrfToken = generateCSRFToken();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="<?php echo $csrfToken; ?>">
    <title>Admin Dashboard - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
</head>
<body>
    <!-- Sidebar -->
    <div class="sidebar">
        <div class="sidebar-header">
            <h2 class="text-xl font-bold text-gray-900"><?php echo APP_NAME; ?></h2>
        </div>
        <nav class="sidebar-nav">
            <a href="/admin/dashboard" class="nav-link active">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                </svg>
                Dashboard
            </a>
            <a href="/admin/audits" class="nav-link">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Audits
            </a>
            <a href="/admin/users" class="nav-link">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                </svg>
                Users
            </a>
            <a href="/admin/reports" class="nav-link">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Reports
            </a>
            <a href="/admin/activities" class="nav-link">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Activities
            </a>
            <a href="/admin/notifications" class="nav-link">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h6v-2H4v2zM4 11h6V9H4v2zM4 7h6V5H4v2z"></path>
                </svg>
                Notifications
            </a>
            <a href="/admin/settings" class="nav-link">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Settings
            </a>
        </nav>
    </div>

    <!-- Main Content -->
    <div class="main-content">
        <!-- Header -->
        <div class="content-header">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p class="text-gray-600">Welcome back, <?php echo escapeHtml($user['name']); ?></p>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="relative">
                        <button class="btn btn-outline relative">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h6v-2H4v2zM4 11h6V9H4v2zM4 7h6V5H4v2z"></path>
                            </svg>
                            Notifications
                            <?php if (count($recentNotifications) > 0): ?>
                                <span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    <?php echo count($recentNotifications); ?>
                                </span>
                            <?php endif; ?>
                        </button>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="text-sm text-gray-600"><?php echo escapeHtml(USER_ROLES[$user['role']]); ?></span>
                        <a href="/auth/logout" class="btn btn-outline btn-sm">Logout</a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Dashboard Content -->
        <div class="content-body">
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <!-- Active Audits -->
                <div class="card">
                    <div class="card-content">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Active Audits</p>
                                <p class="text-3xl font-bold text-blue-600"><?php echo $auditStats['in_progress_audits'] ?? 0; ?></p>
                                <p class="text-sm text-gray-500"><?php echo $auditStats['total_audits'] ?? 0; ?> total audits</p>
                            </div>
                            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Total Users -->
                <div class="card">
                    <div class="card-content">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Total Users</p>
                                <p class="text-3xl font-bold text-green-600"><?php echo $userStats['total_users'] ?? 0; ?></p>
                                <p class="text-sm text-gray-500"><?php echo $userStats['active_users'] ?? 0; ?> active</p>
                            </div>
                            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Documents -->
                <div class="card">
                    <div class="card-content">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Documents</p>
                                <p class="text-3xl font-bold text-orange-600"><?php echo $documentStats['total_documents'] ?? 0; ?></p>
                                <p class="text-sm text-gray-500"><?php echo $documentStats['pending_documents'] ?? 0; ?> pending</p>
                            </div>
                            <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Reports -->
                <div class="card">
                    <div class="card-content">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Reports</p>
                                <p class="text-3xl font-bold text-purple-600"><?php echo $reportStats['total_reports'] ?? 0; ?></p>
                                <p class="text-sm text-gray-500"><?php echo $reportStats['pending_reports'] ?? 0; ?> pending</p>
                            </div>
                            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Activities and Notifications -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Recent Activities -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Recent Activities</h3>
                        <p class="card-description">Latest system activities and user actions</p>
                    </div>
                    <div class="card-content">
                        <div class="space-y-4">
                            <?php if (!empty($recentActivities)): ?>
                                <?php foreach (array_slice($recentActivities, 0, 6) as $activity): ?>
                                    <div class="flex items-start space-x-3">
                                        <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                        <div class="flex-1">
                                            <p class="text-sm font-medium"><?php echo escapeHtml($activity['user_name']); ?></p>
                                            <p class="text-sm text-gray-600"><?php echo escapeHtml($activity['description']); ?></p>
                                            <p class="text-xs text-gray-500"><?php echo getRelativeTime($activity['timestamp']); ?></p>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <p class="text-sm text-gray-500 text-center py-4">No recent activities</p>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>

                <!-- Recent Notifications -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Recent Notifications</h3>
                        <p class="card-description">Unread notifications and alerts</p>
                    </div>
                    <div class="card-content">
                        <div class="space-y-4">
                            <?php if (!empty($recentNotifications)): ?>
                                <?php foreach (array_slice($recentNotifications, 0, 6) as $notification): ?>
                                    <div class="flex items-start space-x-3">
                                        <div class="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                                        <div class="flex-1">
                                            <p class="text-sm font-medium"><?php echo escapeHtml($notification['title']); ?></p>
                                            <p class="text-sm text-gray-600"><?php echo escapeHtml($notification['message']); ?></p>
                                            <p class="text-xs text-gray-500"><?php echo getRelativeTime($notification['created_at']); ?></p>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <p class="text-sm text-gray-500 text-center py-4">No unread notifications</p>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Audits -->
            <div class="card mt-6">
                <div class="card-header">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="card-title">Recent Audits</h3>
                            <p class="card-description">Latest audit activities</p>
                        </div>
                        <a href="/admin/audits" class="btn btn-outline btn-sm">View All</a>
                    </div>
                </div>
                <div class="card-content">
                    <div class="space-y-4">
                        <?php if (!empty($recentAudits)): ?>
                            <?php foreach ($recentAudits as $audit): ?>
                                <div class="flex items-center justify-between p-4 border rounded-lg">
                                    <div class="flex-1">
                                        <h4 class="font-medium"><?php echo escapeHtml($audit['title']); ?></h4>
                                        <p class="text-sm text-gray-600"><?php echo escapeHtml($audit['description']); ?></p>
                                        <div class="flex items-center space-x-4 mt-2">
                                            <span class="badge badge-<?php echo getStatusColor($audit['status']); ?>">
                                                <?php echo escapeHtml(ucfirst(str_replace('_', ' ', $audit['status']))); ?>
                                            </span>
                                            <span class="badge badge-<?php echo getPriorityColor($audit['priority']); ?>">
                                                <?php echo escapeHtml(ucfirst($audit['priority'])); ?>
                                            </span>
                                            <span class="text-sm text-gray-500">
                                                Progress: <?php echo $audit['progress']; ?>%
                                            </span>
                                        </div>
                                    </div>
                                    <div class="ml-4">
                                        <div class="progress w-24">
                                            <div class="progress-bar" style="width: <?php echo $audit['progress']; ?>%"></div>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <p class="text-sm text-gray-500 text-center py-4">No recent audits</p>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="/assets/js/app.js"></script>
    <script>
        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            // Start auto-updates
            AuditTracker.startAutoUpdates();
        });
    </script>
</body>
</html>
