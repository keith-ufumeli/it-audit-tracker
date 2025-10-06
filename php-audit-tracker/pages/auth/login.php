<?php
/**
 * Login Page
 * User authentication form
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__, 2));
}

require_once APP_ROOT . '/config/config.php';

$auth = getAuth();

// Redirect if already logged in
if ($auth->isLoggedIn()) {
    $user = $auth->getCurrentUser();
    redirect(getPortalRoute($user['role']));
}

$error = '';
$success = '';

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = sanitizeInput($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $rememberMe = isset($_POST['remember_me']);
    
    if (empty($email) || empty($password)) {
        $error = 'Please enter both email and password.';
    } else {
        $result = $auth->login($email, $password, $rememberMe);
        
        if ($result['success']) {
            $success = $result['message'];
            // Redirect after successful login
            header("refresh:1;url=" . $result['redirect']);
        } else {
            $error = $result['message'];
        }
    }
}

// Generate CSRF token
$csrfToken = generateCSRFToken();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="<?php echo $csrfToken; ?>">
    <title>Login - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
</head>
<body class="bg-gray-50">
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
            <!-- Header -->
            <div class="text-center">
                <h1 class="text-4xl font-bold text-blue-600 mb-2"><?php echo APP_NAME; ?></h1>
                <h2 class="text-2xl font-semibold text-gray-900">Sign in to your account</h2>
                <p class="mt-2 text-sm text-gray-600">
                    Enter your credentials to access the audit management system
                </p>
            </div>

            <!-- Login Form -->
            <div class="card">
                <div class="card-content">
                    <?php if ($error): ?>
                        <div class="alert alert-danger mb-4">
                            <?php echo escapeHtml($error); ?>
                        </div>
                    <?php endif; ?>

                    <?php if ($success): ?>
                        <div class="alert alert-success mb-4">
                            <?php echo escapeHtml($success); ?>
                        </div>
                    <?php endif; ?>

                    <form method="POST" action="/auth/login" data-ajax>
                        <input type="hidden" name="csrf_token" value="<?php echo $csrfToken; ?>">
                        
                        <div class="form-group">
                            <label for="email" class="form-label">Email Address</label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                class="form-input" 
                                placeholder="Enter your email"
                                value="<?php echo escapeHtml($_POST['email'] ?? ''); ?>"
                                required
                                autofocus
                            >
                        </div>

                        <div class="form-group">
                            <label for="password" class="form-label">Password</label>
                            <input 
                                type="password" 
                                id="password" 
                                name="password" 
                                class="form-input" 
                                placeholder="Enter your password"
                                required
                            >
                        </div>

                        <div class="form-group">
                            <label class="flex items-center">
                                <input 
                                    type="checkbox" 
                                    name="remember_me" 
                                    class="form-checkbox mr-2"
                                    <?php echo isset($_POST['remember_me']) ? 'checked' : ''; ?>
                                >
                                <span class="text-sm text-gray-600">Remember me for 30 days</span>
                            </label>
                        </div>

                        <div class="form-group">
                            <button type="submit" class="btn btn-primary w-full">
                                Sign In
                            </button>
                        </div>
                    </form>

                    <!-- Demo Credentials -->
                    <div class="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h3 class="text-sm font-medium text-blue-900 mb-2">Demo Credentials</h3>
                        <div class="text-xs text-blue-700 space-y-1">
                            <div><strong>Super Admin:</strong> superadmin@audit.com / password</div>
                            <div><strong>Audit Manager:</strong> manager@audit.com / password</div>
                            <div><strong>Auditor:</strong> auditor@audit.com / password</div>
                            <div><strong>Management:</strong> management@audit.com / password</div>
                            <div><strong>Client:</strong> client@company.com / password</div>
                            <div><strong>Department:</strong> dept@company.com / password</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="text-center">
                <p class="text-xs text-gray-500">
                    &copy; <?php echo date('Y'); ?> <?php echo APP_NAME; ?>. All rights reserved.
                </p>
            </div>
        </div>
    </div>

    <script src="/assets/js/app.js"></script>
    <script>
        // Auto-focus email field
        document.addEventListener('DOMContentLoaded', function() {
            const emailField = document.getElementById('email');
            if (emailField && !emailField.value) {
                emailField.focus();
            }
        });

        // Handle form submission
        document.querySelector('form').addEventListener('submit', function(e) {
            const submitButton = this.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner"></span> Signing in...';
        });
    </script>
</body>
</html>
