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

require_once 'config.php';

// JWT Secret key - must match jwt-auth.php
define('JWT_SECRET', 'rofl_jwt_secret_key_2025');

/**
 * Validate and decode JWT token
 */
function validateJWT($jwt) {
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) {
        return false;
    }
    
    list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;
    
    // Verify signature
    $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, JWT_SECRET, true);
    $expectedSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    if ($signatureEncoded !== $expectedSignature) {
        return false;
    }
    
    // Decode payload
    $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $payloadEncoded));
    $data = json_decode($payload, true);
    
    // Check if token is expired (allow 5 minute grace period for refresh)
    if ($data['exp'] < (time() - 300)) {
        return false;
    }
    
    return $data;
}

/**
 * Generate new JWT token
 */
function generateJWT($userId, $username, $ip) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'iss' => 'auth.directsponsor.org',
        'aud' => 'roflfaucet.com',
        'iat' => time(),
        'exp' => time() + (15 * 60), // 15 minutes
        'sub' => $userId,
        'username' => $username,
        'ip' => $ip
    ]);
    
    $headerEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $payloadEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, JWT_SECRET, true);
    $signatureEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
}

/**
 * Verify user still exists in database
 */
function verifyUser($userId) {
    try {
        $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $stmt = $pdo->prepare('SELECT id, username FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $user ? ['id' => $user['id'], 'username' => $user['username']] : false;
    } catch (PDOException $e) {
        error_log("JWT Refresh DB Error: " . $e->getMessage());
        return false;
    }
}

// Get JWT token from Authorization header
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['error' => 'Authorization header required']);
    exit();
}

$jwt = $matches[1];

// Validate current JWT
$tokenData = validateJWT($jwt);
if (!$tokenData) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit();
}

// Verify user still exists
$user = verifyUser($tokenData['sub']);
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'User no longer exists']);
    exit();
}

// Generate new token
$newJwt = generateJWT($user['id'], $user['username'], $tokenData['ip']);

// Log successful refresh
error_log("JWT Refresh Success: User {$user['username']} (ID: {$user['id']}) from IP: {$tokenData['ip']}");

echo json_encode([
    'success' => true,
    'jwt' => $newJwt,
    'user' => [
        'id' => $user['id'],
        'username' => $user['username']
    ],
    'expires_in' => 900 // 15 minutes
]);
?>
