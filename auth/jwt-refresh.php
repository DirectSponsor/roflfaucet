<?php
/**
 * JWT Token Refresh Endpoint
 * 
 * Handles JWT token refreshing for seamless authentication.
 * Called automatically by jwt-simple.js when tokens are near expiry.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get refresh token from request
$input = json_decode(file_get_contents('php://input'), true);
$refreshToken = $input['refresh_token'] ?? null;

if (!$refreshToken) {
    http_response_code(400);
    echo json_encode(['error' => 'Refresh token required']);
    exit();
}

try {
    // In a real implementation, you would:
    // 1. Validate the refresh token
    // 2. Check if it's not expired
    // 3. Verify it exists in your database
    // 4. Generate new access and refresh tokens
    
    // For demo purposes, we'll simulate a successful refresh
    // Replace this with your actual JWT validation logic
    
    $userId = 'demo_user_' . time();
    $username = 'demo_user';
    
    // Generate new tokens (in production, use proper JWT library)
    $newAccessToken = base64_encode(json_encode([
        'user_id' => $userId,
        'username' => $username,
        'exp' => time() + 3600, // 1 hour expiry
        'iat' => time(),
        'type' => 'access'
    ]));
    
    $newRefreshToken = base64_encode(json_encode([
        'user_id' => $userId,
        'exp' => time() + (7 * 24 * 3600), // 7 days expiry
        'iat' => time(),
        'type' => 'refresh'
    ]));
    
    // Return new tokens
    echo json_encode([
        'success' => true,
        'access_token' => $newAccessToken,
        'refresh_token' => $newRefreshToken,
        'expires_in' => 3600,
        'user' => [
            'id' => $userId,
            'username' => $username
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Token refresh failed',
        'message' => $e->getMessage()
    ]);
}
?>
