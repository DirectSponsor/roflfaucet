<?php
require 'vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Add CORS headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// JWT secret key
define('JWT_SECRET', 'your_secret_key_here');

date_default_timezone_set('UTC');

// Connect to the database
$pdo = new PDO('mysql:host=localhost;dbname=directsponsor_oauth', 'directsponsor_oauth', 'ds9Hj#k2P9*mN');

// Check if user exists
function userExists($username, $email) {
    global $pdo;
    $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ? OR email = ?');
    $stmt->execute([$username, $email]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// Create new user
function createUser($username, $password, $email) {
    global $pdo;
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO users (username, password, email, created_at) VALUES (?, ?, ?, NOW())');
    $stmt->execute([$username, $hashedPassword, $email]);
    return $pdo->lastInsertId();
}

// Generate a JWT
function generateJWT($userId, $ip) {
    $payload = [
        'iss' => 'auth.directsponsor.org',
        'aud' => 'roflfaucet.com',
        'iat' => time(),
        'exp' => time() + (15 * 60), // 15 minutes
        'sub' => $userId,
        'ip' => $ip
    ];
    return JWT::encode($payload, JWT_SECRET, 'HS256');
}

// Main logic
$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';
$email = $_POST['email'] ?? '';
$ip = $_SERVER['REMOTE_ADDR'];

if ($username && $password && $email) {
    // Check if user already exists
    if (userExists($username, $email)) {
        echo json_encode(['error' => 'Username or email already exists']);
        exit();
    }
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['error' => 'Invalid email format']);
        exit();
    }
    
    // Validate password strength (minimum 6 characters)
    if (strlen($password) < 6) {
        echo json_encode(['error' => 'Password must be at least 6 characters long']);
        exit();
    }
    
    try {
        // Create new user
        $userId = createUser($username, $password, $email);
        
        // Generate JWT token
        $jwt = generateJWT($userId, $ip);
        
        echo json_encode(['jwt' => $jwt]);
        
    } catch (Exception $e) {
        echo json_encode(['error' => 'Registration failed: ' . $e->getMessage()]);
    }
    
} else {
    echo json_encode(['error' => 'Username, password, and email are required']);
}

?>
