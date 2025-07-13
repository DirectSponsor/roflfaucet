<?php
require 'vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// JWT secret key
define('JWT_SECRET', 'your_secret_key_here');

date_default_timezone_set('UTC');

// Connect to the database
$pdo = new PDO('mysql:host=localhost;dbname=directsponsor_oauth', 'directsponsor_oauth', 'ds9Hj#k2P9*mN');

// Fetch user from the database
function getUser($username) {
    global $pdo;
    $stmt = $pdo->prepare('SELECT id, username, password FROM users WHERE username = ?');
    $stmt->execute([$username]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// Generate a JWT
function generateJWT($userId, $redirectUri) {
    $payload = [
        'iss' => 'auth.directsponsor.org',
        'aud' => parse_url($redirectUri, PHP_URL_HOST), // Use the host of the redirect URI as the audience
        'iat' => time(),
        'exp' => time() + (15 * 60), // 15 minutes
        'sub' => $userId
    ];
    return JWT::encode($payload, JWT_SECRET, 'HS256');
}

// Main logic
$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';
$redirectUri = $_GET['redirect_uri'] ?? '/';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $username && $password) {
    $user = getUser($username);
    if ($user && password_verify($password, $user['password'])) {
        $jwt = generateJWT($user['id'], $redirectUri);
        // Redirect back with JWT
        header('Location: ' . $redirectUri . '?jwt=' . urlencode($jwt));
        exit();
    } else {
        $error = 'Invalid credentials';
    }
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - ROFLFaucet</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
        .tabs { display: flex; margin-bottom: 20px; }
        .tab { flex: 1; padding: 10px; text-align: center; background: #f0f0f0; border: 1px solid #ccc; cursor: pointer; }
        .tab.active { background: #007cba; color: white; }
        .form-container { border: 1px solid #ccc; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input[type="text"], input[type="password"], input[type="email"] { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
        .submit-btn { background: #007cba; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        .submit-btn:hover { background: #005a8b; }
        .error { color: red; margin-bottom: 15px; }
    </style>
</head>
<body>
    <h2>🔐 Welcome to ROFLFaucet</h2>
    
    <div class="tabs">
        <div class="tab active" onclick="showTab('login')">Login</div>
        <div class="tab" onclick="showTab('signup')">Sign Up</div>
    </div>
    
    <div class="form-container">
        <?php if (isset($error)) : ?>
            <div class="error">Error: <?= htmlspecialchars($error) ?></div>
        <?php endif; ?>
        
        <!-- Login Form -->
        <form id="login-form" method="POST" action="?redirect_uri=<?= urlencode($redirectUri) ?>">
            <div class="form-group">
                <label for="username">Username:</label>
                <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit" class="submit-btn">🚀 Login</button>
        </form>
        
        <!-- Signup Form -->
        <form id="signup-form" method="POST" action="jwt-signup.php?redirect_uri=<?= urlencode($redirectUri) ?>" style="display: none;">
            <div class="form-group">
                <label for="signup-username">Username:</label>
                <input type="text" id="signup-username" name="username" required>
            </div>
            <div class="form-group">
                <label for="signup-password">Password:</label>
                <input type="password" id="signup-password" name="password" required>
            </div>
            <div class="form-group">
                <label for="signup-email">Email:</label>
                <input type="email" id="signup-email" name="email" required>
            </div>
            <button type="submit" class="submit-btn">🎉 Sign Up</button>
        </form>
    </div>
    
    <script>
        function showTab(tab) {
            const loginForm = document.getElementById('login-form');
            const signupForm = document.getElementById('signup-form');
            const tabs = document.querySelectorAll('.tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            
            if (tab === 'login') {
                loginForm.style.display = 'block';
                signupForm.style.display = 'none';
                tabs[0].classList.add('active');
            } else {
                loginForm.style.display = 'none';
                signupForm.style.display = 'block';
                tabs[1].classList.add('active');
            }
        }
    </script>
</body>
</html>
