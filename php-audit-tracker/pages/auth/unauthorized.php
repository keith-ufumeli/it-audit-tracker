<?php
/**
 * Unauthorized Access Page
 * Displayed when user doesn't have required permissions
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__, 2));
}

require_once APP_ROOT . '/config/config.php';

$auth = getAuth();
$user = $auth->getCurrentUser();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unauthorized Access - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
</head>
<body class="bg-gray-50">
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
            <!-- Header -->
            <div class="text-center">
                <div class="mx-auto h-16 w-16 text-red-500 mb-4">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                </div>
                <h1 class="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p class="text-lg text-gray-600">
                    You don't have permission to access this resource.
                </p>
            </div>

            <!-- Content -->
            <div class="card">
                <div class="card-content text-center">
                    <div class="mb-6">
                        <h2 class="text-xl font-semibold text-gray-900 mb-2">Unauthorized Access</h2>
                        <p class="text-gray-600">
                            Your current role (<strong><?php echo escapeHtml(USER_ROLES[$user['role']] ?? $user['role']); ?></strong>) 
                            doesn't have the required permissions to access this page.
                        </p>
                    </div>

                    <div class="space-y-4">
                        <a href="<?php echo getPortalRoute($user['role']); ?>" class="btn btn-primary w-full">
                            Go to Dashboard
                        </a>
                        
                        <a href="/auth/logout" class="btn btn-outline w-full">
                            Sign Out
                        </a>
                    </div>

                    <?php if ($user['role'] === 'super_admin'): ?>
                        <div class="mt-6 p-4 bg-yellow-50 rounded-lg">
                            <h3 class="text-sm font-medium text-yellow-800 mb-2">Need Help?</h3>
                            <p class="text-xs text-yellow-700">
                                As a super administrator, you should have access to all areas. 
                                If you're seeing this page, there might be a configuration issue.
                            </p>
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Footer -->
            <div class="text-center">
                <p class="text-xs text-gray-500">
                    If you believe this is an error, please contact your system administrator.
                </p>
            </div>
        </div>
    </div>

    <script src="/assets/js/app.js"></script>
</body>
</html>
