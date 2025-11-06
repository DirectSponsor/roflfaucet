<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get user ID from JWT token (simple)
function getUserId() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7);
        $parts = explode('.', $token);
        if (count($parts) === 3) {
            $payload = json_decode(base64_decode($parts[1]), true);
            return $payload['sub'] ?? null;
        }
    }
    return null;
}

$userId = getUserId();
if (!$userId) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

$action = $_GET['action'] ?? '';
$balanceFile = "userdata/balances/{$userId}.txt";

// Simple file operations
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'balance') {
    // Read balance
    if (file_exists($balanceFile)) {
        $data = json_decode(file_get_contents($balanceFile), true);
        echo json_encode([
            'success' => true,
            'balance' => $data['balance'] ?? 0,
            'last_updated' => $data['last_updated'] ?? time()
        ]);
    } else {
        // No file exists - this should not happen after proper user setup
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Balance file not found - user files may not be properly initialized'
        ]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update_balance') {
    // Update balance
    $input = json_decode(file_get_contents('php://input'), true);
    $amount = floatval($input['amount'] ?? 0);
    $source = $input['source'] ?? 'manual';
    
    // Read current balance
    if (!file_exists($balanceFile)) {
        http_response_code(404);
        echo json_encode(['error' => 'Balance file not found - user files may not be properly initialized']);
        exit;
    }
    
    $data = json_decode(file_get_contents($balanceFile), true);
    if (!$data || !isset($data['balance'])) {
        http_response_code(500);
        echo json_encode(['error' => 'Balance file corrupted or invalid']);
        exit;
    }
    
    $currentBalance = $data['balance'];
    
    // Calculate new balance
    $newBalance = $currentBalance + $amount;
    $newBalance = max(0, $newBalance); // Don't go below 0
    
    // Write new balance (super simple)
    $newData = [
        'balance' => $newBalance,
        'last_updated' => time(),
        'last_transaction' => [
            'amount' => $amount,
            'source' => $source,
            'timestamp' => time()
        ]
    ];
    
    // Just write it like nano would
    if (file_put_contents($balanceFile, json_encode($newData, JSON_PRETTY_PRINT))) {
        echo json_encode([
            'success' => true,
            'new_balance' => $newBalance,
            'message' => 'Balance updated'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to write file']);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
}
?>
