<?php
/**
 * IT Audit Tracker - Main Entry Point
 * Lightweight routing and application bootstrap
 */

// Define application root
define('APP_ROOT', __DIR__);

// Start output buffering
ob_start();

// Include configuration
require_once APP_ROOT . '/config/config.php';

// Initialize authentication
$auth = getAuth();

// Check remember me token
$auth->checkRememberMe();

// Check session timeout
$auth->checkSessionTimeout();

// Simple routing mechanism
class Router {
    private $routes = [];
    private $middleware = [];
    
    public function __construct() {
        $this->setupRoutes();
    }
    
    private function setupRoutes() {
        // Define routes
        $this->routes = [
            // Public routes
            '/' => 'pages/home.php',
            '/auth/login' => 'pages/auth/login.php',
            '/auth/logout' => 'pages/auth/logout.php',
            '/auth/unauthorized' => 'pages/auth/unauthorized.php',
            
            // Admin routes
            '/admin' => 'pages/admin/dashboard.php',
            '/admin/dashboard' => 'pages/admin/dashboard.php',
            '/admin/users' => 'pages/admin/users.php',
            '/admin/audits' => 'pages/admin/audits.php',
            '/admin/audits/{id}' => 'pages/admin/audit-detail.php',
            '/admin/reports' => 'pages/admin/reports.php',
            '/admin/reports/{id}' => 'pages/admin/report-detail.php',
            '/admin/settings' => 'pages/admin/settings.php',
            '/admin/activities' => 'pages/admin/activities.php',
            '/admin/alerts' => 'pages/admin/alerts.php',
            '/admin/notifications' => 'pages/admin/notifications.php',
            '/admin/management' => 'pages/admin/management.php',
            '/admin/permissions' => 'pages/admin/permissions.php',
            
            // Client routes
            '/client' => 'pages/client/dashboard.php',
            '/client/dashboard' => 'pages/client/dashboard.php',
            '/client/documents' => 'pages/client/documents.php',
            '/client/notifications' => 'pages/client/notifications.php',
            
            // API routes
            '/api/auth/login' => 'api/auth/login.php',
            '/api/auth/logout' => 'api/auth/logout.php',
            '/api/users' => 'api/users.php',
            '/api/audits' => 'api/audits.php',
            '/api/audits/{id}' => 'api/audits/detail.php',
            '/api/documents' => 'api/documents.php',
            '/api/documents/{id}' => 'api/documents/detail.php',
            '/api/reports' => 'api/reports.php',
            '/api/reports/{id}' => 'api/reports/detail.php',
            '/api/notifications' => 'api/notifications.php',
            '/api/activities' => 'api/activities.php',
            '/api/upload' => 'api/upload.php',
            '/api/export' => 'api/export.php',
        ];
    }
    
    public function route() {
        $requestUri = $_SERVER['REQUEST_URI'];
        $requestMethod = $_SERVER['REQUEST_METHOD'];
        
        // Remove query string
        $path = parse_url($requestUri, PHP_URL_PATH);
        
        // Remove base path if running in subdirectory
        $basePath = dirname($_SERVER['SCRIPT_NAME']);
        if ($basePath !== '/') {
            $path = substr($path, strlen($basePath));
        }
        
        // Normalize path
        $path = rtrim($path, '/') ?: '/';
        
        // Find matching route
        $matchedRoute = $this->findRoute($path);
        
        if ($matchedRoute) {
            $this->executeRoute($matchedRoute, $path);
        } else {
            $this->handle404();
        }
    }
    
    private function findRoute($path) {
        // Direct match
        if (isset($this->routes[$path])) {
            return [
                'file' => $this->routes[$path],
                'params' => []
            ];
        }
        
        // Pattern match
        foreach ($this->routes as $route => $file) {
            if (strpos($route, '{') !== false) {
                $pattern = preg_replace('/\{[^}]+\}/', '([^/]+)', $route);
                $pattern = '#^' . $pattern . '$#';
                
                if (preg_match($pattern, $path, $matches)) {
                    // Extract parameter names
                    preg_match_all('/\{([^}]+)\}/', $route, $paramNames);
                    $params = [];
                    
                    for ($i = 1; $i < count($matches); $i++) {
                        $params[$paramNames[1][$i-1]] = $matches[$i];
                    }
                    
                    return [
                        'file' => $file,
                        'params' => $params
                    ];
                }
            }
        }
        
        return null;
    }
    
    private function executeRoute($route, $path) {
        $file = APP_ROOT . '/' . $route['file'];
        
        // Set route parameters as global variables
        foreach ($route['params'] as $key => $value) {
            $GLOBALS['route_params'][$key] = $value;
        }
        
        // Check if file exists
        if (file_exists($file)) {
            // Apply middleware
            $this->applyMiddleware($path);
            
            // Include the file
            include $file;
        } else {
            $this->handle404();
        }
    }
    
    private function applyMiddleware($path) {
        // Authentication middleware
        if (strpos($path, '/auth/') === false && $path !== '/') {
            $auth = getAuth();
            $auth->requireAuth();
        }
        
        // Admin access middleware
        if (strpos($path, '/admin/') === 0) {
            $auth = getAuth();
            $auth->requireAdminAccess();
        }
        
        // API middleware
        if (strpos($path, '/api/') === 0) {
            header('Content-Type: application/json');
            
            // Handle CORS
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization');
            
            // Handle preflight requests
            if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
                http_response_code(200);
                exit;
            }
        }
    }
    
    private function handle404() {
        http_response_code(404);
        
        if (strpos($_SERVER['REQUEST_URI'], '/api/') === 0) {
            sendErrorResponse('Not Found', 404);
        } else {
            include APP_ROOT . '/pages/404.php';
        }
    }
}

// Handle errors
set_error_handler(function($severity, $message, $file, $line) {
    if (APP_DEBUG) {
        echo "<div style='background: #f8d7da; color: #721c24; padding: 10px; margin: 10px; border: 1px solid #f5c6cb; border-radius: 4px;'>";
        echo "<strong>Error:</strong> {$message} in {$file} on line {$line}";
        echo "</div>";
    } else {
        error_log("PHP Error: {$message} in {$file} on line {$line}");
    }
});

set_exception_handler(function($exception) {
    if (APP_DEBUG) {
        echo "<div style='background: #f8d7da; color: #721c24; padding: 10px; margin: 10px; border: 1px solid #f5c6cb; border-radius: 4px;'>";
        echo "<strong>Exception:</strong> " . $exception->getMessage();
        echo "<br><strong>File:</strong> " . $exception->getFile();
        echo "<br><strong>Line:</strong> " . $exception->getLine();
        echo "<br><strong>Trace:</strong><pre>" . $exception->getTraceAsString() . "</pre>";
        echo "</div>";
    } else {
        error_log("PHP Exception: " . $exception->getMessage() . " in " . $exception->getFile() . " on line " . $exception->getLine());
        http_response_code(500);
        echo "An error occurred. Please try again later.";
    }
});

// Initialize and run router
try {
    $router = new Router();
    $router->route();
} catch (Exception $e) {
    if (APP_DEBUG) {
        echo "<div style='background: #f8d7da; color: #721c24; padding: 10px; margin: 10px; border: 1px solid #f5c6cb; border-radius: 4px;'>";
        echo "<strong>Router Error:</strong> " . $e->getMessage();
        echo "</div>";
    } else {
        error_log("Router Error: " . $e->getMessage());
        http_response_code(500);
        echo "An error occurred. Please try again later.";
    }
}

// Clean up
ob_end_flush();
