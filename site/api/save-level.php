<?php
/**
 * Simple Level Save API - New Architecture
 * 
 * Uses sessionStorage authentication like other new APIs
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Get user ID from request
 */
function getUserId() {
    // Try different auth methods in order of preference
    if (!empty($_GET['user_id'])) {
        return $_GET['user_id'];
    }
    if (!empty($_POST['user_id'])) {
        return $_POST['user_id'];
    }
    $input = json_decode(file_get_contents('php://input'), true);
    if (!empty($input['user_id'])) {
        return $input['user_id'];
    }
    return null;
}

try {
    // Get user ID
    $userId = getUserId();
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Authentication required']);
        exit;
    }
    
    // Get input data
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['level']) || !is_numeric($input['level'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid level data']);
        exit;
    }
    
    $newLevel = (int)$input['level'];
    
    // Validate level range
    if ($newLevel < 1 || $newLevel > 12) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Level out of range (1-12)']);
        exit;
    }
    
    // Use absolute path to match other new APIs
    $profileFile = __DIR__ . "/../userdata/profiles/{$userId}.txt";
    
    // Load existing profile data or create default
    $profileData = [];
    if (file_exists($profileFile)) {
        $profileData = json_decode(file_get_contents($profileFile), true);
        if (!$profileData) {
            $profileData = [];
        }
    }
    
    // Update level
    $profileData['level'] = $newLevel;
    $profileData['last_profile_update'] = time();
    
    // Ensure we have other required fields with defaults
    $profileData = array_merge([
        'username' => 'User' . $userId,
        'display_name' => 'User' . $userId,
        'level' => 1,
        'created_at' => time(),
        'last_profile_update' => time()
    ], $profileData);
    
    // Write back to file with locking
    $result = file_put_contents($profileFile, json_encode($profileData, JSON_PRETTY_PRINT), LOCK_EX);
    
    if ($result === false) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save profile']);
        exit;
    }
    
    echo json_encode(['success' => true, 'level' => $newLevel]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>
