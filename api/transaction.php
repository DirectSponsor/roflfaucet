<?php
require_once '../config.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

function getAuthToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    return null;
}

function requireAuth() {
    $token = getAuthToken();
    $user_id = validateToken($token);
    if (!$user_id) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token']);
        exit;
    }
    return $user_id;
}

// POST transaction
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    error_log("Transaction API called - URI: " . $_SERVER['REQUEST_URI']);
    $user_id = requireAuth();
    error_log("Transaction API - User ID: " . $user_id);
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($input['type']) || !isset($input['amount']) || !isset($input['source'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: type, amount, source']);
        exit;
    }
    
    $type = $input['type'];
    $amount = floatval($input['amount']);
    $source = $input['source'];
    $description = $input['description'] ?? '';
    $recipient_id = $input['recipient_id'] ?? null;
    $metadata = $input['metadata'] ?? [];
    
    // Validate transaction type
    $valid_types = ['spend', 'earn', 'gaming_win'];
    if (!in_array($type, $valid_types)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid transaction type. Must be: spend, earn, or gaming_win']);
        exit;
    }
    
    // Validate amount
    if ($amount <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Amount must be positive']);
        exit;
    }
    
    try {
        $db = getUserDataDB();
        $db->beginTransaction();
        
        // Get current balance
        $stmt = $db->prepare("SELECT useless_coins, lifetime_earned FROM user_balances WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $balance_data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $current_balance = $balance_data ? floatval($balance_data['useless_coins']) : 0;
        $lifetime_earned = $balance_data ? floatval($balance_data['lifetime_earned']) : 0;
        
        // Calculate new balances based on transaction type
        $new_current_balance = $current_balance;
        $new_lifetime_earned = $lifetime_earned;
        
        switch ($type) {
            case 'spend':
                // Check sufficient balance
                if ($current_balance < $amount) {
                    throw new Exception('Insufficient balance');
                }
                $new_current_balance = $current_balance - $amount;
                // Lifetime unchanged
                break;
                
            case 'earn':
                $new_current_balance = $current_balance + $amount;
                $new_lifetime_earned = $lifetime_earned + $amount;
                break;
                
            case 'gaming_win':
                $new_current_balance = $current_balance + $amount;
                // Lifetime unchanged (handled by daily rollup)
                break;
        }
        
        // Update balance
        $stmt = $db->prepare("
            INSERT INTO user_balances (user_id, useless_coins, lifetime_earned) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
                useless_coins = VALUES(useless_coins),
                lifetime_earned = VALUES(lifetime_earned)
        ");
        $stmt->execute([$user_id, $new_current_balance, $new_lifetime_earned]);
        
        // Log transaction (optional - for audit trail)
        $stmt = $db->prepare("
            INSERT INTO transaction_log (user_id, type, amount, source, description, metadata, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $metadata_json = json_encode($metadata);
        $stmt->execute([$user_id, $type, $amount, $source, $description, $metadata_json]);
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'transaction' => [
                'type' => $type,
                'amount' => $amount,
                'source' => $source
            ],
            'balance' => [
                'current' => $new_current_balance,
                'lifetime' => $new_lifetime_earned
            ]
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        error_log("Transaction error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>

