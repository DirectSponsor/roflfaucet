<?php
/**
 * JWT Authentication Endpoint
 * 
 * Handles JWT-based authentication for ROFLFaucet and other JWT-compatible clients
 * Integrates with the existing DirectSponsor OAuth database
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

// JWT Secret key - should be same across all JWT endpoints
define('JWT_SECRET', 'rofl_jwt_secret_key_2025');

/**
 * Generate JWT token
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
 * Authenticate user against database
 */
function authenticateUser($username, $password) {
    try {
        $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $stmt = $pdo->prepare('SELECT id, username, password_hash FROM users WHERE username = ?');
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password_hash'])) {
            return ['id' => $user['id'], 'username' => $user['username']];
        }
        
        return false;
    } catch (PDOException $e) {
        error_log("JWT Auth DB Error: " . $e->getMessage());
        return false;
    }
}

// Get login credentials
$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Username and password required']);
    exit();
}

// Authenticate user
$user = authenticateUser($username, $password);

if ($user) {
    // Generate JWT token
    $jwt = generateJWT($user['id'], $user['username'], $ip);
    
    // Log successful authentication
    error_log("JWT Auth Success: User {$user['username']} (ID: {$user['id']}) from IP: $ip");
    
    echo json_encode([
        'success' => true,
        'jwt' => $jwt,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username']
        ],
        'expires_in' => 900 // 15 minutes
    ]);
} else {
    // Log failed authentication
    error_log("JWT Auth Failed: Username '$username' from IP: $ip");
    
    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
}
?>
