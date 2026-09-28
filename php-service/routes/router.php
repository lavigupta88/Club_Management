<?php
/**
 * Simple router — matches URI patterns and dispatches to controllers.
 */

require_once __DIR__ . '/../controllers/ExportController.php';
require_once __DIR__ . '/../controllers/ReceiptController.php';
require_once __DIR__ . '/../controllers/AttendanceController.php';

$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Strip the base path when served via Apache sub-directory (e.g. /php-service)
$basePath = '/php-service';
if (str_starts_with($uri, $basePath)) {
    $uri = substr($uri, strlen($basePath));
}
if ($uri === '' || $uri === false) {
    $uri = '/';
}

// GET /export/csv/{eventId}
if ($method === 'GET' && preg_match('#^/export/csv/(\d+)$#', $uri, $m)) {
    ExportController::csv((int)$m[1], $pdo);
    exit;
}

// GET /receipt/{registrationId}
if ($method === 'GET' && preg_match('#^/receipt/(\d+)$#', $uri, $m)) {
    ReceiptController::ticket((int)$m[1], $pdo);
    exit;
}

// GET /attendance/summary/{eventId}
if ($method === 'GET' && preg_match('#^/attendance/summary/(\d+)$#', $uri, $m)) {
    AttendanceController::summary((int)$m[1], $pdo);
    exit;
}

// Health check
if ($method === 'GET' && $uri === '/health') {
    json_success(['status' => 'ok']);
}

// Fallback
json_error('Not found', 404);
