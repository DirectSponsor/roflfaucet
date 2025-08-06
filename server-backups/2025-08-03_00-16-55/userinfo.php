<?php
// Dead Simple User Info
require_once 'config.php';
header('Content-Type: application/json');

// Get bearer token
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!preg_match('/Bearer (.+)/', $auth, $matches)) {
    http_response_code(401);
    echo json_encode(['error' => 'no_token']);
    exit;
}

$token = $matches[1];
$pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME, DB_USER, DB_PASS);

// Check token and get user
$stmt = $pdo->prepare('
    SELECT u.id, u.username, u.email 
    FROM access_tokens t 
    JOIN users u ON t.user_id = u.id 
    WHERE t.token = ? AND t.expires_at > NOW()
');
$stmt->execute([$token]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'invalid_token']);
    exit;
}

echo json_encode([
    'id' => $user['id'],
    'username' => $user['username'],
    'email' => $user['email']
]);
?>

