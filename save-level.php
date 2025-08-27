<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Simple JWT decoding (same as in user-data.php)
function decodeJWT($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }
    
    $payload = json_decode(base64_decode($parts[1]), true);
    return $payload;
}

// Get user ID from JWT token
function getUserIdFromToken() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7);
        $payload = decodeJWT($token);
        
        if ($payload && isset($payload['sub'])) {
            return $payload['sub'];
        }
    }
    
    return null;
}

try {
    // Get user ID
    $userId = getUserIdFromToken();
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
    
    // Read current profile
    $profileFile = "api/userdata/profiles/{$userId}.txt";
    if (!file_exists($profileFile)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User profile not found']);
        exit;
    }
    
    $profileData = json_decode(file_get_contents($profileFile), true);
    if (!$profileData) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to read profile data']);
        exit;
    }
    
    // Update level
    $profileData['level'] = $newLevel;
    $profileData['last_profile_update'] = time();
    
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
