<?php
// ROFLFaucet Data Directory Configuration
define('ROFLFAUCET_DATA_DIR', '/var/roflfaucet-data');
define('USERDATA_DIR', ROFLFAUCET_DATA_DIR . '/userdata');

/**
 * Coins Balance API - Clean Version for Unified Balance System
 * 
 * Handles member coin balances (guests use localStorage tokens)
 * File format: {userid}-{username}.txt
 * 
 * Usage:
 * GET  ?action=balance&user_id=1-andytest1     - Get current balance
 * POST ?action=update_balance + JSON body      - Update balance
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get user ID (expects format: "1-andytest1")
function getUserId() {
    // For GET requests, get from URL parameter
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        return $_GET['user_id'] ?? null;
    }
    
    // For POST requests, get from JSON body
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        return $input['user_id'] ?? null;
    }
    
    return null;
}

/**
 * Fetch balance data from auth server sync API
 * @param string $userId User ID
 * @return array|null Balance data from auth server, or null on failure
 */
function fetchBalanceFromAuthServer($userId) {
    $authUrl = "https://auth.directsponsor.org/api/sync.php?action=get&user_id=" . urlencode($userId) . "&data_type=balance";
    
    $ch = curl_init($authUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200 && $response) {
        $data = json_decode($response, true);
        if ($data && $data['success'] && isset($data['data'])) {
            return $data['data'];
        }
    }
    
    return null;
}

// Find balance file for user
function getBalanceFilePath($userId) {
    if (!$userId || $userId === 'guest') {
        return null;
    }
    
    // Clean the userId to prevent path traversal
    $cleanUserId = preg_replace('/[^a-zA-Z0-9\-_]/', '', $userId);
    $balanceDir = USERDATA_DIR . '/balances/';
    $balanceFile = $balanceDir . $cleanUserId . '.txt';
    
    return $balanceFile;
}

// Load balance data from file
function loadBalanceData($balanceFile, $userId = null) {
    if (file_exists($balanceFile)) {
        $content = file_get_contents($balanceFile);
        $data = json_decode($content, true);
        
        if ($data) {
            // Ensure required fields exist
            return [
                'balance' => $data['balance'] ?? 0,
                'last_updated' => $data['last_updated'] ?? time(),
                'recent_transactions' => $data['recent_transactions'] ?? []
            ];
        }
    }
    
    // LAZY LOADING: File doesn't exist locally, try fetching from auth server
    if ($userId) {
        $authBalance = fetchBalanceFromAuthServer($userId);
        if ($authBalance && isset($authBalance['coins'])) {
            // Create local balance file with data from auth server
            $balanceData = [
                'balance' => floatval($authBalance['coins']),
                'last_updated' => time(),
                'recent_transactions' => []
            ];
            
            // Ensure directory exists
            $dir = dirname($balanceFile);
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
            
            // Cache the balance locally for future requests
            saveBalanceData($balanceFile, $balanceData);
            
            return $balanceData;
        }
    }
    
    return null;
}

// Save balance data to file
function saveBalanceData($balanceFile, $data) {
    $data['last_updated'] = time();
    return file_put_contents($balanceFile, json_encode($data, JSON_PRETTY_PRINT));
}

// Main logic
$userId = getUserId();
$action = $_GET['action'] ?? '';

if (!$userId) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID required']);
    exit;
}

$balanceFile = getBalanceFilePath($userId);
if (!$balanceFile) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid user ID']);
    exit;
}

// Handle GET timestamp request (for sync detection)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'timestamp') {
    if (file_exists($balanceFile)) {
        $timestamp = filemtime($balanceFile);
        echo json_encode([
            'success' => true,
            'timestamp' => $timestamp
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Balance file not found']);
    }
    
// Handle GET balance request
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'balance') {
    $data = loadBalanceData($balanceFile, $userId);
    
    if ($data === null) {
        http_response_code(404);
        echo json_encode(['error' => 'Balance file not found']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'balance' => $data['balance'],
        'last_updated' => $data['last_updated'],
        'recent_transactions' => array_slice($data['recent_transactions'], 0, 10)
    ]);
    
// Handle POST balance update
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update_balance') {
    $input = json_decode(file_get_contents('php://input'), true);
    $amount = floatval($input['amount'] ?? 0);
    $source = $input['source'] ?? 'manual';
    
    $data = loadBalanceData($balanceFile, $userId);
    if ($data === null) {
        http_response_code(404);
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
        'description' => $amount > 0 ? 
            "Earned " . number_format($amount, 2) . " from $source" :
            "Spent " . number_format(abs($amount), 2) . " on $source"
    ];
    
    array_unshift($data['recent_transactions'], $transaction);
    
    // Keep only recent transactions (last 100)
    $data['recent_transactions'] = array_slice($data['recent_transactions'], 0, 100);
    
    // Save updated data
    if (saveBalanceData($balanceFile, $data)) {
        echo json_encode([
            'success' => true,
            'new_balance' => $data['balance'],
            'transaction_logged' => true,
            'message' => 'Balance updated successfully'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save balance data']);
    }

} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid action or method']);
}
?>