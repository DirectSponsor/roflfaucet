<?php
/**
 * Reset User Files API
 * 
 * Deletes user's balance and profile files so they can be recreated fresh on next login.
 * This fixes corrupted or incomplete user data.
 * 
 * @author ROFLFaucet Dev Team
 * @version 1.0
 * @date 2025-09-09
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get input data
$input = json_decode(file_get_contents('php://input'), true);
if (!$input || empty($input['user_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required field: user_id']);
    exit;
}

$userId = $input['user_id'];
$deletedFiles = [];
$messages = [];

// Delete balance file
$balanceFile = __DIR__ . "/../userdata/balances/{$userId}.txt";
if (file_exists($balanceFile)) {
    if (unlink($balanceFile)) {
        $deletedFiles[] = "balance file";
        $messages[] = "Deleted balance file";
        error_log("Deleted balance file for user_id: $userId");
    } else {
        $messages[] = "Failed to delete balance file";
        error_log("Failed to delete balance file for user_id: $userId");
    }
} else {
    $messages[] = "Balance file not found";
}

// Delete profile file
$profileFile = __DIR__ . "/../userdata/profiles/{$userId}.txt";
if (file_exists($profileFile)) {
    if (unlink($profileFile)) {
        $deletedFiles[] = "profile file";
        $messages[] = "Deleted profile file";
        error_log("Deleted profile file for user_id: $userId");
    } else {
        $messages[] = "Failed to delete profile file";
        error_log("Failed to delete profile file for user_id: $userId");
    }
} else {
    $messages[] = "Profile file not found";
}

// Return result
echo json_encode([
    'success' => true,
    'message' => implode('; ', $messages),
    'deleted_files' => $deletedFiles,
    'user_id' => $userId,
    'note' => 'Fresh files will be created on next login with correct JWT data'
]);
?>
