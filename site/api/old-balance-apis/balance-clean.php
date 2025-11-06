<?php
/**
 * Clean, Simple Balance API
 * Handles userid-username format files
 * No legacy complexity - just works!
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

function getBalanceFile($userId) {
    $balanceDir = __DIR__ . '/../userdata/balances/';
    
    // If userId contains a dash, it's already in userid-username format
    if (strpos($userId, '-') !== false) {
        $filename = $userId . '.txt';
    } else {
        // Search for files starting with this userid
        $files = glob($balanceDir . $userId . '-*.txt');
        if (!empty($files)) {
            $filename = basename($files[0]);
        } else {
            return null; // No file found
        }
    }
    
    $filepath = $balanceDir . $filename;
    return file_exists($filepath) ? $filepath : null;
}

function loadBalance($filepath) {
    if (!$filepath || !file_exists($filepath)) {
        return null;
    }
    
    $content = file_get_contents($filepath);
    $data = json_decode($content, true);
    
    if (!$data) {
        return null;
    }
    
    // Ensure required fields exist
    $data['balance'] = $data['balance'] ?? 0;
    $data['recent_transactions'] = $data['recent_transactions'] ?? [];
    $data['last_updated'] = $data['last_updated'] ?? time();
    
    return $data;
}

function saveBalance($filepath, $data) {
    $data['last_updated'] = time();
    return file_put_contents($filepath, json_encode($data, JSON_PRETTY_PRINT));
}

// Main logic
$action = $_GET['action'] ?? '';
$userId = $_GET['user_id'] ?? $_POST['user_id'] ?? null;

if (!$userId) {
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? null;
}

if (!$userId) {
    http_response_code(401);
    echo json_encode(['error' => 'User ID required']);
    exit;
}

$balanceFile = getBalanceFile($userId);

if ($action === 'balance' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get balance
    $data = loadBalance($balanceFile);
    
    if ($data === null) {
        echo json_encode(['error' => 'Balance file not found']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'balance' => $data['balance'],
        'last_updated' => $data['last_updated'],
        'recent_transactions' => array_slice($data['recent_transactions'], 0, 10)
    ]);
    
} elseif ($action === 'update_balance' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Update balance
    $input = json_decode(file_get_contents('php://input'), true);
    $amount = floatval($input['amount'] ?? 0);
    $source = $input['source'] ?? 'manual';
    
    $data = loadBalance($balanceFile);
    if ($data === null) {
        echo json_encode(['error' => 'Balance file not found']);
        exit;
    }
    
    // Update balance (ensure it doesn't go below 0)
    $data['balance'] = max(0, $data['balance'] + $amount);
    
    // Add transaction record
    $transaction = [
        'amount' => $amount,
        'source' => $source,
        'timestamp' => time(),
        'description' => $amount > 0 ? "Earned $amount from $source" : "Spent " . abs($amount) . " on $source"
    ];
    
    array_unshift($data['recent_transactions'], $transaction);
    
    // Keep only recent transactions (last 100)
    $data['recent_transactions'] = array_slice($data['recent_transactions'], 0, 100);
    
    // Save updated data
    if (saveBalance($balanceFile, $data)) {
        echo json_encode([
            'success' => true,
            'new_balance' => $data['balance'],
            'transaction_logged' => true
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save balance']);
    }
    
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid action or method']);
}
?>