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

// Fetch user from the database (mocked for demonstration)
function getUser($username) {
    global $pdo;
    $stmt = $pdo->prepare('SELECT id, username, password FROM users WHERE username = ?');
    $stmt->execute([$username]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
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
$ip = $_SERVER['REMOTE_ADDR'];

if ($username && $password) {
    $user = getUser($username);
    if ($user && password_verify($password, $user['password'])) {
        $jwt = generateJWT($user['id'], $ip);
        echo json_encode(['jwt' => $jwt]);
    } else {
        echo json_encode(['error' => 'Invalid credentials']);
    }
} else {
    echo json_encode(['error' => 'Username and password required']);
}

?>
