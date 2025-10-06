<?php
/**
 * Home Page
 * Landing page and redirect logic
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

require_once APP_ROOT . '/config/config.php';

$auth = getAuth();

// Redirect logged-in users to their dashboard
if ($auth->isLoggedIn()) {
    $user = $auth->getCurrentUser();
    redirect(getPortalRoute($user['role']));
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo APP_NAME; ?> - IT Audit Management System</title>
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav class="navbar">
        <div class="container">
            <div class="flex items-center justify-between">
                <a href="/" class="navbar-brand">
                    <?php echo APP_NAME; ?>
                </a>
                <div class="flex items-center space-x-4">
                    <a href="/auth/login" class="btn btn-primary">Sign In</a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div class="container text-center">
            <h1 class="text-5xl font-bold mb-6">
                Comprehensive IT Audit Management
            </h1>
            <p class="text-xl mb-8 max-w-3xl mx-auto">
                Streamline your IT audit processes with our powerful, secure, and user-friendly audit management system. 
                Track compliance, manage findings, and generate comprehensive reports.
            </p>
            <div class="flex justify-center space-x-4">
                <a href="/auth/login" class="btn btn-lg bg-white text-blue-600 hover:bg-gray-100">
                    Get Started
                </a>
                <a href="#features" class="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-blue-600">
                    Learn More
                </a>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-20">
        <div class="container">
            <div class="text-center mb-16">
                <h2 class="text-4xl font-bold text-gray-900 mb-4">
                    Powerful Features for Audit Management
                </h2>
                <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                    Everything you need to manage IT audits, track compliance, and generate comprehensive reports.
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <!-- Feature 1 -->
                <div class="card text-center">
                    <div class="card-content">
                        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold mb-3">Audit Management</h3>
                        <p class="text-gray-600">
                            Create, track, and manage IT audits with comprehensive workflow support and real-time progress monitoring.
                        </p>
                    </div>
                </div>

                <!-- Feature 2 -->
                <div class="card text-center">
                    <div class="card-content">
                        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold mb-3">Document Management</h3>
                        <p class="text-gray-600">
                            Secure document upload, version control, and automated document request workflows.
                        </p>
                    </div>
                </div>

                <!-- Feature 3 -->
                <div class="card text-center">
                    <div class="card-content">
                        <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold mb-3">Reporting & Analytics</h3>
                        <p class="text-gray-600">
                            Generate comprehensive reports with built-in analytics and export capabilities.
                        </p>
                    </div>
                </div>

                <!-- Feature 4 -->
                <div class="card text-center">
                    <div class="card-content">
                        <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold mb-3">Role-Based Access</h3>
                        <p class="text-gray-600">
                            Secure access control with granular permissions for different user roles and departments.
                        </p>
                    </div>
                </div>

                <!-- Feature 5 -->
                <div class="card text-center">
                    <div class="card-content">
                        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h6v-2H4v2zM4 11h6V9H4v2zM4 7h6V5H4v2z"></path>
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold mb-3">Compliance Tracking</h3>
                        <p class="text-gray-600">
                            Track compliance with various frameworks including ISO 27001, SOC 2, GDPR, and more.
                        </p>
                    </div>
                </div>

                <!-- Feature 6 -->
                <div class="card text-center">
                    <div class="card-content">
                        <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold mb-3">Real-time Notifications</h3>
                        <p class="text-gray-600">
                            Stay updated with real-time notifications and automated alerts for important events.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 bg-gray-900 text-white">
        <div class="container text-center">
            <h2 class="text-4xl font-bold mb-6">
                Ready to Streamline Your Audit Process?
            </h2>
            <p class="text-xl mb-8 max-w-2xl mx-auto">
                Join organizations that trust our platform to manage their IT audit requirements efficiently and securely.
            </p>
            <a href="/auth/login" class="btn btn-lg bg-blue-600 hover:bg-blue-700">
                Get Started Today
            </a>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-white border-t">
        <div class="container py-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <h3 class="text-lg font-semibold mb-4"><?php echo APP_NAME; ?></h3>
                    <p class="text-gray-600">
                        Comprehensive IT audit management system designed for modern organizations.
                    </p>
                </div>
                <div>
                    <h3 class="text-lg font-semibold mb-4">Features</h3>
                    <ul class="space-y-2 text-gray-600">
                        <li>Audit Management</li>
                        <li>Document Control</li>
                        <li>Compliance Tracking</li>
                        <li>Reporting & Analytics</li>
                    </ul>
                </div>
                <div>
                    <h3 class="text-lg font-semibold mb-4">Support</h3>
                    <ul class="space-y-2 text-gray-600">
                        <li>Documentation</li>
                        <li>Help Center</li>
                        <li>Contact Support</li>
                        <li>System Status</li>
                    </ul>
                </div>
            </div>
            <div class="border-t mt-8 pt-8 text-center text-gray-600">
                <p>&copy; <?php echo date('Y'); ?> <?php echo APP_NAME; ?>. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <script src="/assets/js/app.js"></script>
</body>
</html>
