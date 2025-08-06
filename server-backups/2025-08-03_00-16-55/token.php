<?php
// Dead Simple Token Exchange
require_once 'config.php';
header('Content-Type: application/json');

$code = $_POST['code'] ?? '';
if (!$code) {
    echo json_encode(['error' => 'missing_code']);
    exit;
}

$pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME, DB_USER, DB_PASS);

// Check auth code
$stmt = $pdo->prepare('SELECT user_id FROM auth_codes WHERE code = ? AND expires_at > NOW()');
$stmt->execute([$code]);
$result = $stmt->fetch();

if (!$result) {
    echo json_encode(['error' => 'invalid_code']);
    exit;
}

// Delete used code
$pdo->prepare('DELETE FROM auth_codes WHERE code = ?')->execute([$code]);

// Create access token
$access_token = bin2hex(random_bytes(32));
$stmt = $pdo->prepare('INSERT INTO access_tokens (token, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))');
$stmt->execute([$access_token, $result['user_id']]);

echo json_encode([
    'access_token' => $access_token,
    'token_type' => 'Bearer',
    'expires_in' => 3600
]);
?>

