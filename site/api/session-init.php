<?php
// Session Init - establishes PHP session from localStorage user data
// Called once per page load by unified-balance.js for logged-in users
// Allows write_balance.php and other write APIs to verify identity via $_SESSION

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$combinedUserId = $input['user_id'] ?? '';
$username       = $input['username'] ?? '';

// Validate combined user_id format: digits-alphanumeric (e.g. "1-andytest1")
if (!preg_match('/^\d+-[a-zA-Z0-9_-]+$/', $combinedUserId)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid user_id format']);
    exit;
}

session_start();
$_SESSION['authenticated'] = true;
$_SESSION['user_id']       = $combinedUserId;
$_SESSION['username']      = $username;

echo json_encode(['success' => true]);
