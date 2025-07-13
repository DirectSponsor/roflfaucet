<?php
require 'vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

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
function generateJWT($userId, $redirectUri) {
    $payload = [
        'iss' => 'auth.directsponsor.org',
        'aud' => parse_url($redirectUri, PHP_URL_HOST),
        'iat' => time(),
        'exp' => time() + (15 * 60),
        'sub' => $userId
    ];
    return JWT::encode($payload, JWT_SECRET, 'HS256');
}

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';
$email = $_POST['email'] ?? '';
$redirectUri = $_GET['redirect_uri'] ?? '/';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $username && $password && $email) {
    if (userExists($username, $email)) {
        $error = 'Username or email already exists';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Invalid email format';
    } elseif (strlen($password) < 6) {
        $error = 'Password must be at least 6 characters long';
    } else {
        try {
            $userId = createUser($username, $password, $email);
            $jwt = generateJWT($userId, $redirectUri);
            header('Location: ' . $redirectUri . '?jwt=' . urlencode($jwt));
            exit();
        } catch (Exception $e) {
            $error = 'Registration failed: ' . $e->getMessage();
        }
    }
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Up</title>
</head>
<body>
    <h2>Sign Up to Continue</h2>
    <?php if (isset($error)) : ?>
        <p style="color: red;">Error: <?= htmlspecialchars($error) ?></p>
    <?php endif; ?>
    <form method="POST" action="?redirect_uri=<?= urlencode($redirectUri) ?>">
        <label for="username">Username:</label><br>
        <input type="text" id="username" name="username" required><br>
        <label for="password">Password:</label><br>
        <input type="password" id="password" name="password" required><br>
        <label for="email">Email:</label><br>
        <input type="email" id="email" name="email" required><br><br>
        <input type="submit" value="Sign Up">
    </form>
</body>
</html>

