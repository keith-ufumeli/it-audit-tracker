<?php
/**
 * Client Dashboard Page
 * Main dashboard for client users
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__, 2));
}

require_once APP_ROOT . '/config/config.php';

$auth = getAuth();
$auth->requireAuth();

$user = $auth->getCurrentUser();

// Check if user has client access
if (!$auth->hasRole(['client', 'department'])) {
    redirect('/admin/dashboard');
}

$documentManager = getDocumentManager();
$notificationManager = getNotificationManager();

// Get user-specific data
$userDocuments = $documentManager->getAllDocuments([
    'requested_from' => $user['id'],
    'limit' => 10
]);

$userNotifications = $notificationManager->getUnreadNotificationsByUser($user['id']);

// Calculate stats
$pendingDocs = array_filter($userDocuments, function($doc) {
    return $doc['status'] === 'pending';
});

$submittedDocs = array_filter($userDocuments, function($doc) {
    return $doc['status'] === 'submitted';
});

// Generate CSRF token
$csrfToken = generateCSRFToken();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="<?php echo $csrfToken; ?>">
    <title>Client Dashboard - <?php echo APP_NAME; ?></title>
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
            <a href="/client/dashboard" class="nav-link active">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                </svg>
                Dashboard
            </a>
            <a href="/client/documents" class="nav-link">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Documents
            </a>
            <a href="/client/notifications" class="nav-link">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h6v-2H4v2zM4 11h6V9H4v2zM4 7h6V5H4v2z"></path>
                </svg>
                Notifications
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
                            <?php if (count($userNotifications) > 0): ?>
                                <span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    <?php echo count($userNotifications); ?>
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
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <!-- Pending Requests -->
                <div class="card">
                    <div class="card-content">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Pending Requests</p>
                                <p class="text-3xl font-bold text-orange-600"><?php echo count($pendingDocs); ?></p>
                                <p class="text-sm text-gray-500">Action required</p>
                            </div>
                            <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Submitted Documents -->
                <div class="card">
                    <div class="card-content">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Submitted</p>
                                <p class="text-3xl font-bold text-green-600"><?php echo count($submittedDocs); ?></p>
                                <p class="text-sm text-gray-500">Under review</p>
                            </div>
                            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Notifications -->
                <div class="card">
                    <div class="card-content">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Notifications</p>
                                <p class="text-3xl font-bold text-blue-600"><?php echo count($userNotifications); ?></p>
                                <p class="text-sm text-gray-500">Unread messages</p>
                            </div>
                            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h6v-2H4v2zM4 11h6V9H4v2zM4 7h6V5H4v2z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Document Requests and Notifications -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Pending Document Requests -->
                <div class="card">
                    <div class="card-header">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="card-title">Document Requests</h3>
                                <p class="card-description">Documents pending your action</p>
                            </div>
                            <a href="/client/documents" class="btn btn-outline btn-sm">View All</a>
                        </div>
                    </div>
                    <div class="card-content">
                        <div class="space-y-4">
                            <?php if (!empty($pendingDocs)): ?>
                                <?php foreach (array_slice($pendingDocs, 0, 4) as $doc): ?>
                                    <div class="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50">
                                        <div class="flex-1">
                                            <h4 class="font-medium text-sm"><?php echo escapeHtml($doc['title']); ?></h4>
                                            <p class="text-xs text-gray-600 mt-1"><?php echo escapeHtml($doc['description']); ?></p>
                                            <div class="flex items-center mt-2 space-x-2">
                                                <span class="badge badge-<?php echo getStatusColor($doc['status']); ?>">
                                                    <?php echo escapeHtml(ucfirst($doc['status'])); ?>
                                                </span>
                                                <span class="text-xs text-gray-500">
                                                    Due: <?php echo date('M j, Y', strtotime($doc['due_date'])); ?>
                                                </span>
                                            </div>
                                        </div>
                                        <svg class="w-4 h-4 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                        </svg>
                                    </div>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <div class="text-center py-8 text-gray-500">
                                    <svg class="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    <p class="text-sm">No pending requests</p>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>

                <!-- Recent Notifications -->
                <div class="card">
                    <div class="card-header">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="card-title">Recent Notifications</h3>
                                <p class="card-description">Latest updates and alerts</p>
                            </div>
                            <a href="/client/notifications" class="btn btn-outline btn-sm">View All</a>
                        </div>
                    </div>
                    <div class="card-content">
                        <div class="space-y-4">
                            <?php if (!empty($userNotifications)): ?>
                                <?php foreach (array_slice($userNotifications, 0, 4) as $notification): ?>
                                    <div class="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                        <div class="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                                        <div class="flex-1">
                                            <div class="flex items-center space-x-2 mb-1">
                                                <p class="text-sm font-medium"><?php echo escapeHtml($notification['title']); ?></p>
                                                <span class="badge badge-<?php echo getPriorityColor($notification['priority']); ?>">
                                                    <?php echo escapeHtml(ucfirst($notification['priority'])); ?>
                                                </span>
                                            </div>
                                            <p class="text-xs text-gray-600"><?php echo escapeHtml($notification['message']); ?></p>
                                            <p class="text-xs text-gray-500 mt-1">
                                                <?php echo getRelativeTime($notification['created_at']); ?>
                                            </p>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <div class="text-center py-8 text-gray-500">
                                    <svg class="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h6v-2H4v2zM4 11h6V9H4v2zM4 7h6V5H4v2z"></path>
                                    </svg>
                                    <p class="text-sm">No unread notifications</p>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="card mt-6">
                <div class="card-header">
                    <h3 class="card-title">Quick Actions</h3>
                    <p class="card-description">Common tasks and shortcuts</p>
                </div>
                <div class="card-content">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <a href="/client/documents" class="btn btn-outline h-auto flex-col items-start p-4 hover:bg-blue-50 hover:border-blue-500">
                            <svg class="w-5 h-5 mb-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                            </svg>
                            <span class="font-semibold">Upload Documents</span>
                            <span class="text-xs text-gray-600 mt-1">Submit requested documents</span>
                        </a>
                        
                        <a href="/client/documents" class="btn btn-outline h-auto flex-col items-start p-4 hover:bg-orange-50 hover:border-orange-500">
                            <svg class="w-5 h-5 mb-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <span class="font-semibold">View Requests</span>
                            <span class="text-xs text-gray-600 mt-1">Check document requests</span>
                        </a>
                        
                        <a href="/client/notifications" class="btn btn-outline h-auto flex-col items-start p-4 hover:bg-green-50 hover:border-green-500">
                            <svg class="w-5 h-5 mb-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h6v-2H4v2zM4 11h6V9H4v2zM4 7h6V5H4v2z"></path>
                            </svg>
                            <span class="font-semibold">Check Notifications</span>
                            <span class="text-xs text-gray-600 mt-1">View all notifications</span>
                        </a>
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
