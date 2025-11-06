<?php
/**
 * Balance Timestamp API
 * Returns file modification timestamp for user's balance file
 * 
 * Current Use: Efficient multi-tab synchronization checking
 * Future Use: Multi-site conflict resolution and delta sync
 *             (See PURE_SYNC_ARCHITECTURE_2025-08-12.md)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Get user ID from request
$userId = $_GET['user_id'] ?? null;

if (!$userId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user_id parameter']);
    exit;
}

// Validate user ID format (basic security)
if (!preg_match('/^[a-zA-Z0-9_-]+$/', $userId) || strlen($userId) > 50) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid user_id format']);
    exit;
}

// Construct balance file path
$balanceFile = "../userdata/balances/{$userId}.txt";

// Check if balance file exists and get timestamp
if (file_exists($balanceFile)) {
    $timestamp = filemtime($balanceFile);
    if ($timestamp === false) {
        // File exists but couldn't get timestamp
        http_response_code(500);
        echo json_encode(['error' => 'Could not read file timestamp']);
        exit;
    }
    
    echo json_encode([
        'timestamp' => $timestamp,
        'exists' => true
    ]);
} else {
    // File doesn't exist - new user or no balance set yet
    echo json_encode([
        'timestamp' => 0,
        'exists' => false
    ]);
}
?>
