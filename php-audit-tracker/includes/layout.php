<?php
/**
 * Layout Template
 * Common layout template with CDN integration and responsive design
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

// Get current user if logged in
$auth = getAuth();
$currentUser = $auth->getCurrentUser();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="<?php echo generateId(); ?>">
    <meta name="description" content="IT Audit Tracker - Comprehensive audit management system">
    <meta name="keywords" content="audit, compliance, IT security, management, tracking">
    <meta name="author" content="IT Audit Tracker">
    
    <title><?php echo $pageTitle ?? 'IT Audit Tracker'; ?></title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/assets/images/favicon.ico">
    
    <!-- CDN Libraries for Enhanced Performance -->
    <!-- Chart.js for data visualization -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js" integrity="sha512-7O4bjqMwe53sd7ODZ9AOTUqCOtnqECmE9d5xjgDwznWyxI/3P3CHnxjoiJ6Ob3SP49QfG3c58j/xWr8gor0hzQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    
    <!-- Bootstrap Icons for UI icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" integrity="sha384-4LISF5TTJX/fLmGSsOrXvWjXzYdAQJ1eq4+CcC9w7ln8tc5K4icdZ9pQcTTkuZ07" crossorigin="anonymous">
    
    <!-- Font Awesome for additional icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer">
    
    <!-- Google Fonts for typography -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="/assets/css/style.css">
    
    <!-- Page-specific CSS -->
    <?php if (isset($pageCSS)): ?>
        <?php foreach ($pageCSS as $css): ?>
            <link rel="stylesheet" href="<?php echo $css; ?>">
        <?php endforeach; ?>
    <?php endif; ?>
    
    <!-- Performance Optimization -->
    <link rel="preload" href="/assets/js/app.js" as="script">
    <link rel="dns-prefetch" href="//cdn.jsdelivr.net">
    <link rel="dns-prefetch" href="//cdnjs.cloudflare.com">
    <link rel="dns-prefetch" href="//fonts.googleapis.com">
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "IT Audit Tracker",
        "description": "Comprehensive audit management system for IT compliance and security",
        "url": "<?php echo BASE_URL; ?>",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web Browser"
    }
    </script>
</head>
<body class="<?php echo $bodyClass ?? ''; ?>">
    <!-- Skip to main content for accessibility -->
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    <!-- Loading indicator -->
    <div id="loading-indicator" class="loading-overlay" style="display: none;">
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>
    </div>
    
    <!-- Navigation -->
    <?php if ($currentUser): ?>
        <!-- Sidebar Navigation -->
        <nav class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <a href="/admin/dashboard" class="navbar-brand">
                    <i class="bi bi-shield-check"></i>
                    IT Audit Tracker
                </a>
            </div>
            
            <div class="sidebar-nav">
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="/admin/dashboard" class="nav-link <?php echo $currentPage === 'dashboard' ? 'active' : ''; ?>">
                            <i class="bi bi-speedometer2 nav-icon"></i>
                            Dashboard
                        </a>
                    </li>
                    
                    <?php if ($auth->hasPermission('manage_users')): ?>
                    <li class="nav-item">
                        <a href="/admin/users" class="nav-link <?php echo $currentPage === 'users' ? 'active' : ''; ?>">
                            <i class="bi bi-people nav-icon"></i>
                            Users
                        </a>
                    </li>
                    <?php endif; ?>
                    
                    <?php if ($auth->hasPermission('create_audit')): ?>
                    <li class="nav-item">
                        <a href="/admin/audits" class="nav-link <?php echo $currentPage === 'audits' ? 'active' : ''; ?>">
                            <i class="bi bi-clipboard-check nav-icon"></i>
                            Audits
                        </a>
                    </li>
                    <?php endif; ?>
                    
                    <?php if ($auth->hasPermission('view_reports')): ?>
                    <li class="nav-item">
                        <a href="/admin/reports" class="nav-link <?php echo $currentPage === 'reports' ? 'active' : ''; ?>">
                            <i class="bi bi-file-earmark-text nav-icon"></i>
                            Reports
                        </a>
                    </li>
                    <?php endif; ?>
                    
                    <li class="nav-item">
                        <a href="/admin/activities" class="nav-link <?php echo $currentPage === 'activities' ? 'active' : ''; ?>">
                            <i class="bi bi-activity nav-icon"></i>
                            Activities
                        </a>
                    </li>
                    
                    <li class="nav-item">
                        <a href="/admin/notifications" class="nav-link <?php echo $currentPage === 'notifications' ? 'active' : ''; ?>">
                            <i class="bi bi-bell nav-icon"></i>
                            Notifications
                            <?php if (isset($unreadNotifications) && $unreadNotifications > 0): ?>
                                <span class="notification-badge"><?php echo $unreadNotifications; ?></span>
                            <?php endif; ?>
                        </a>
                    </li>
                    
                    <?php if ($auth->isSuperAdmin()): ?>
                    <li class="nav-item">
                        <a href="/admin/settings" class="nav-link <?php echo $currentPage === 'settings' ? 'active' : ''; ?>">
                            <i class="bi bi-gear nav-icon"></i>
                            Settings
                        </a>
                    </li>
                    <?php endif; ?>
                </ul>
            </div>
            
            <!-- User Profile Section -->
            <div class="sidebar-footer">
                <div class="user-profile">
                    <div class="user-avatar">
                        <i class="bi bi-person-circle"></i>
                    </div>
                    <div class="user-info">
                        <div class="user-name"><?php echo htmlspecialchars($currentUser['name']); ?></div>
                        <div class="user-role"><?php echo ucfirst(str_replace('_', ' ', $currentUser['role'])); ?></div>
                    </div>
                </div>
                
                <div class="user-actions">
                    <a href="/admin/profile" class="btn btn-outline btn-sm">
                        <i class="bi bi-person"></i>
                        Profile
                    </a>
                    <a href="/auth/logout" class="btn btn-outline btn-sm" data-confirm="Are you sure you want to logout?">
                        <i class="bi bi-box-arrow-right"></i>
                        Logout
                    </a>
                </div>
            </div>
        </nav>
        
        <!-- Top Navigation -->
        <header class="top-navbar">
            <div class="navbar-content">
                <div class="navbar-left">
                    <button class="sidebar-toggle" data-sidebar-toggle>
                        <i class="bi bi-list"></i>
                    </button>
                    
                    <div class="breadcrumb">
                        <?php if (isset($breadcrumbs)): ?>
                            <?php foreach ($breadcrumbs as $crumb): ?>
                                <?php if (isset($crumb['url'])): ?>
                                    <a href="<?php echo $crumb['url']; ?>"><?php echo $crumb['title']; ?></a>
                                <?php else: ?>
                                    <span><?php echo $crumb['title']; ?></span>
                                <?php endif; ?>
                                <?php if (!end($breadcrumbs)): ?>
                                    <i class="bi bi-chevron-right"></i>
                                <?php endif; ?>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                </div>
                
                <div class="navbar-right">
                    <!-- Search -->
                    <div class="search-container">
                        <input type="text" class="search-input" placeholder="Search..." data-search>
                        <i class="bi bi-search search-icon"></i>
                    </div>
                    
                    <!-- Notifications -->
                    <div class="notification-dropdown">
                        <button class="notification-toggle" data-notification-toggle>
                            <i class="bi bi-bell"></i>
                            <?php if (isset($unreadNotifications) && $unreadNotifications > 0): ?>
                                <span class="notification-badge"><?php echo $unreadNotifications; ?></span>
                            <?php endif; ?>
                        </button>
                        
                        <div class="notification-menu" id="notification-menu">
                            <div class="notification-header">
                                <h4>Notifications</h4>
                                <a href="/admin/notifications" class="view-all">View All</a>
                            </div>
                            <div class="notification-list" data-notifications>
                                <!-- Notifications will be loaded here -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- User Menu -->
                    <div class="user-dropdown">
                        <button class="user-toggle" data-user-toggle>
                            <div class="user-avatar-small">
                                <i class="bi bi-person-circle"></i>
                            </div>
                            <span class="user-name-small"><?php echo htmlspecialchars($currentUser['name']); ?></span>
                            <i class="bi bi-chevron-down"></i>
                        </button>
                        
                        <div class="user-menu" id="user-menu">
                            <a href="/admin/profile" class="user-menu-item">
                                <i class="bi bi-person"></i>
                                Profile
                            </a>
                            <a href="/admin/settings" class="user-menu-item">
                                <i class="bi bi-gear"></i>
                                Settings
                            </a>
                            <hr class="user-menu-divider">
                            <a href="/auth/logout" class="user-menu-item" data-confirm="Are you sure you want to logout?">
                                <i class="bi bi-box-arrow-right"></i>
                                Logout
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </header>
        
        <!-- Main Content -->
        <main class="main-content" id="main-content">
            <div class="content-wrapper">
                <?php if (isset($pageHeader)): ?>
                    <div class="content-header">
                        <div class="header-content">
                            <h1 class="page-title"><?php echo $pageHeader['title']; ?></h1>
                            <?php if (isset($pageHeader['description'])): ?>
                                <p class="page-description"><?php echo $pageHeader['description']; ?></p>
                            <?php endif; ?>
                        </div>
                        
                        <?php if (isset($pageHeader['actions'])): ?>
                            <div class="header-actions">
                                <?php foreach ($pageHeader['actions'] as $action): ?>
                                    <a href="<?php echo $action['url']; ?>" class="btn <?php echo $action['class'] ?? 'btn-primary'; ?>">
                                        <?php if (isset($action['icon'])): ?>
                                            <i class="<?php echo $action['icon']; ?>"></i>
                                        <?php endif; ?>
                                        <?php echo $action['text']; ?>
                                    </a>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
                
                <div class="content-body">
                    <?php echo $content ?? ''; ?>
                </div>
            </div>
        </main>
        
    <?php else: ?>
        <!-- Public Layout -->
        <div class="public-layout">
            <header class="public-header">
                <div class="container">
                    <div class="header-content">
                        <a href="/" class="logo">
                            <i class="bi bi-shield-check"></i>
                            IT Audit Tracker
                        </a>
                        
                        <nav class="public-nav">
                            <a href="/auth/login" class="btn btn-primary">Sign In</a>
                        </nav>
                    </div>
                </div>
            </header>
            
            <main class="public-content">
                <?php echo $content ?? ''; ?>
            </main>
            
            <footer class="public-footer">
                <div class="container">
                    <div class="footer-content">
                        <p>&copy; <?php echo date('Y'); ?> IT Audit Tracker. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    <?php endif; ?>
    
    <!-- Notification Container -->
    <div class="notification-container"></div>
    
    <!-- Custom JavaScript -->
    <script src="/assets/js/app.js"></script>
    
    <!-- Page-specific JavaScript -->
    <?php if (isset($pageJS)): ?>
        <?php foreach ($pageJS as $js): ?>
            <script src="<?php echo $js; ?>"></script>
        <?php endforeach; ?>
    <?php endif; ?>
    
    <!-- Inline JavaScript -->
    <?php if (isset($inlineJS)): ?>
        <script>
            <?php echo $inlineJS; ?>
        </script>
    <?php endif; ?>
    
    <!-- Performance Monitoring -->
    <script>
        // Performance monitoring
        window.addEventListener('load', function() {
            const loadTime = performance.now();
            console.log('Page load time:', loadTime + 'ms');
            
            // Send performance data to analytics if needed
            if (typeof gtag !== 'undefined') {
                gtag('event', 'page_load_time', {
                    'value': Math.round(loadTime),
                    'event_category': 'Performance'
                });
            }
        });
    </script>
</body>
</html>
