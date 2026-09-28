<?php
/**
 * Campus Events — PHP Reporting Micro-service
 * Entry point: routes all requests via a simple router.
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/helpers.php';
require_once __DIR__ . '/routes/router.php';
