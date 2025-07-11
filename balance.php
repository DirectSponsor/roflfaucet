<?php
require_once '../config.php';
header('Content-Type: application/json');

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

// GET balance
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user_id = requireAuth();
    
    try {
        $db = getUserDataDB();
        $stmt = $db->prepare("SELECT useless_coins FROM user_balances WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $balance = $stmt->fetchColumn();
        
        // Default to 0 if no balance record exists
        $balance = $balance ? floatval($balance) : 0;
        
        echo json_encode([
            'success' => true, 
            'balance' => $balance, 
            'can_claim' => true
        ]);
    } catch (Exception $e) {
        error_log("Balance fetch error: " . $e->getMessage());
        echo json_encode([
            'success' => true, 
            'balance' => 0, 
            'can_claim' => true
        ]);
    }
} 

// POST claim
elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && strpos($_SERVER['REQUEST_URI'], '/claim') !== false) {
    $user_id = requireAuth();
    
    try {
        $db = getUserDataDB();
        $coin_amount = 5;
        
        // Update balance (add coins)
        $stmt = $db->prepare("
            INSERT INTO user_balances (user_id, useless_coins) 
            VALUES (?, ?) 
            ON DUPLICATE KEY UPDATE useless_coins = useless_coins + VALUES(useless_coins)
        ");
        $stmt->execute([$user_id, $coin_amount]);
        
        echo json_encode([
            'success' => true, 
            'rewards' => ['useless_coins' => $coin_amount],
            'message' => "Claimed $coin_amount UselessCoins!"
        ]);
    } catch (Exception $e) {
        error_log("Claim error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to process claim']);
    }
} 

else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>

