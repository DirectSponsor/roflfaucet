<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../userdata/UserDataManager.php';

// Simple JWT decoding function
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$userId = getUserIdFromToken();
if (!$userId) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

if (!isset($_FILES['avatar'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No avatar file provided']);
    exit;
}

$file = $_FILES['avatar'];

// Validate file
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$maxSize = 2 * 1024 * 1024; // 2MB

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'File upload error']);
    exit;
}

if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type. Please use JPEG, PNG, GIF, or WebP.']);
    exit;
}

if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['error' => 'File too large. Maximum size is 2MB.']);
    exit;
}

// Create avatars directory if it doesn't exist
$avatarDir = '../userdata/avatars/';
if (!is_dir($avatarDir)) {
    mkdir($avatarDir, 0755, true);
}

// Generate filename
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = $userId . '_' . time() . '.' . $extension;
$filepath = $avatarDir . $filename;

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $filepath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save avatar']);
    exit;
}

// Update user profile with avatar filename
try {
    $userManager = new UserDataManager();
    $success = $userManager->updateProfile($userId, [
        'avatar' => $filename,
        'avatar_updated' => time()
    ]);
    
    if ($success) {
        echo json_encode([
            'success' => true,
            'avatar_url' => 'userdata/avatars/' . $filename,
            'message' => 'Avatar updated successfully'
        ]);
    } else {
        // Clean up uploaded file if database update fails
        unlink($filepath);
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update profile']);
    }
    
} catch (Exception $e) {
    // Clean up uploaded file on error
    unlink($filepath);
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

?>
