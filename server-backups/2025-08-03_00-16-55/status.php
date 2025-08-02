<?php
// OAuth System Status Check
require_once 'config.php';

header('Content-Type: application/json');

$status = [
    'system' => 'DirectSponsor OAuth',
    'version' => '1.0',
    'timestamp' => date('Y-m-d H:i:s'),
    'database' => 'disconnected',
    'tables' => [],
    'users_count' => 0,
    'tokens_count' => 0
];

try {
    // Test database connection
    $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $status['database'] = 'connected';
    
    // Check tables exist
    $tables = ['users', 'auth_codes', 'access_tokens'];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            $status['tables'][] = $table;
        }
    }
    
    // Count users
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM users');
    $result = $stmt->fetch();
    $status['users_count'] = $result['count'];
    
    // Count active tokens
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM access_tokens WHERE expires_at > NOW()');
    $result = $stmt->fetch();
    $status['tokens_count'] = $result['count'];
    
    $status['status'] = 'ok';
    
} catch (Exception $e) {
    $status['status'] = 'error';
    $status['error'] = $e->getMessage();
}

echo json_encode($status, JSON_PRETTY_PRINT);
?>

