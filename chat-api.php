<?php
/**
 * ROFLFaucet Chat API
 * Main endpoint for chat functionality (polling and sending messages)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection is handled in getDbConnection() function below
// No external config file needed

// JWT Secret - same as auth system
define('JWT_SECRET', 'rofl_jwt_secret_key_2025');

/**
 * Validate JWT token
 */
function validateJWT($token) {
    try {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            error_log("Chat JWT Debug: Invalid token format - expected 3 parts, got " . count($parts));
            return false;
        }
        
        list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;
        
        // Decode and log payload for debugging
        $payload = str_replace(['-', '_'], ['+', '/'], $payloadEncoded);
        $payload = base64_decode($payload . str_repeat('=', (4 - strlen($payload) % 4) % 4));
        $payloadData = json_decode($payload, true);
        
        error_log("Chat JWT Debug: Token payload: " . json_encode($payloadData));
        error_log("Chat JWT Debug: Current time: " . time() . ", Token exp: " . ($payloadData['exp'] ?? 'not set'));
        
        // Check expiration first
        if (isset($payloadData['exp']) && $payloadData['exp'] < time()) {
            error_log("Chat JWT Debug: Token expired");
            return false;
        }
        
        // Verify signature
        $signature = str_replace(['-', '_'], ['+', '/'], $signatureEncoded);
        $signature = base64_decode($signature . str_repeat('=', (4 - strlen($signature) % 4) % 4));
        
        $expectedSignature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, JWT_SECRET, true);
        
        if (!hash_equals($signature, $expectedSignature)) {
            error_log("Chat JWT Debug: Signature validation failed");
            return false;
        }
        
        error_log("Chat JWT Debug: Token validation successful for user: " . ($payloadData['username'] ?? 'unknown'));
        return $payloadData;
    } catch (Exception $e) {
        error_log("Chat JWT Debug: Exception during validation: " . $e->getMessage());
        return false;
    }
}

/**
 * Get database connection
 */
function getDbConnection() {
    try {
        // Production setup with MySQL
        $pdo = new PDO('mysql:host=localhost;dbname=roflfaucet;charset=utf8mb4', 'roflfaucet', 'RoflFaucet2025SecureDB!');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    } catch (PDOException $e) {
        error_log("Chat API DB Error: " . $e->getMessage());
        return false;
    }
}

/**
 * Check rate limiting
 */
function checkRateLimit($pdo, $userId) {
    $stmt = $pdo->prepare('
        SELECT message_count_last_minute, reset_time 
        FROM chat_user_limits 
        WHERE user_id = ?
    ');
    $stmt->execute([$userId]);
    $limit = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $now = time();
    
    if (!$limit) {
        // First message from this user
        $stmt = $pdo->prepare('
            INSERT INTO chat_user_limits (user_id, message_count_last_minute, reset_time) 
            VALUES (?, 1, ?)
        ');
        $stmt->execute([$userId, $now + 60]);
        return true;
    }
    
    // Reset counter if minute has passed
    if ($now >= $limit['reset_time']) {
        $stmt = $pdo->prepare('
            UPDATE chat_user_limits 
            SET message_count_last_minute = 1, reset_time = ? 
            WHERE user_id = ?
        ');
        $stmt->execute([$now + 60, $userId]);
        return true;
    }
    
    // Check if under limit (10 messages per minute)
    if ($limit['message_count_last_minute'] >= 10) {
        return false;
    }
    
    // Increment counter
    $stmt = $pdo->prepare('
        UPDATE chat_user_limits 
        SET message_count_last_minute = message_count_last_minute + 1 
        WHERE user_id = ?
    ');
    $stmt->execute([$userId]);
    
    return true;
}

/**
 * Update user online status
 */
function updateOnlineStatus($pdo, $userId, $username, $roomId = 1) {
    // MySQL UPSERT syntax
    $stmt = $pdo->prepare('
        INSERT INTO chat_users_online (user_id, username, room_id, last_seen) 
        VALUES (?, ?, ?, NOW()) 
        ON DUPLICATE KEY UPDATE 
        username = VALUES(username),
        room_id = VALUES(room_id),
        last_seen = NOW()
    ');
    $stmt->execute([$userId, $username, $roomId]);
}

/**
 * Get messages since last poll
 */
function getMessages($pdo, $roomId, $lastMessageId = 0) {
    $stmt = $pdo->prepare('
        SELECT id, user_id, username, message, message_type, metadata, created_at
        FROM chat_messages 
        WHERE room_id = ? AND id > ?
        ORDER BY created_at ASC
        LIMIT 50
    ');
    $stmt->execute([$roomId, $lastMessageId]);
    
    $messages = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $messages[] = [
            'id' => intval($row['id']),
            'user_id' => $row['user_id'],
            'username' => $row['username'],
            'message' => $row['message'],
            'type' => $row['message_type'],
            'metadata' => $row['metadata'] ? json_decode($row['metadata'], true) : null,
            'timestamp' => strtotime($row['created_at'])
        ];
    }
    
    return $messages;
}

/**
 * Get online users count
 */
function getOnlineCount($pdo, $roomId) {
    // Clean up old users (inactive for more than 5 minutes) - MySQL syntax
    $stmt = $pdo->prepare('DELETE FROM chat_users_online WHERE last_seen < NOW() - INTERVAL 5 MINUTE');
    $stmt->execute();
    
    // Get current count
    $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM chat_users_online WHERE room_id = ?');
    $stmt->execute([$roomId]);
    return intval($stmt->fetch(PDO::FETCH_ASSOC)['count']);
}

/**
 * Send message to chat
 */
function sendMessage($pdo, $userId, $username, $message, $roomId = 1) {
    // Sanitize message
    $message = trim(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));
    if (empty($message) || strlen($message) > 500) {
        return ['error' => 'Invalid message length'];
    }
    
    // Check for commands
    $messageType = 'message';
    $metadata = null;
    
    if (substr($message, 0, 1) === '/') {
        $parts = explode(' ', $message, 3);
        $command = strtolower(substr($parts[0], 1));
        
        switch ($command) {
            case 'tip':
                if (count($parts) >= 3) {
                    $targetUser = $parts[1];
                    $amount = floatval($parts[2]);
                    
                    if ($amount > 0 && $amount <= 1000) {
                        $messageType = 'tip';
                        $metadata = json_encode([
                            'target_user' => $targetUser,
                            'amount' => $amount
                        ]);
                        $message = "tipped {$targetUser} {$amount} coins";
                    } else {
                        return ['error' => 'Invalid tip amount (1-1000 coins)'];
                    }
                } else {
                    return ['error' => 'Usage: /tip username amount'];
                }
                break;
                
            case 'rain':
                if (count($parts) >= 2) {
                    $amount = floatval($parts[1]);
                    
                    if ($amount >= 10) {
                        $messageType = 'rain';
                        $metadata = json_encode(['amount' => $amount]);
                        $message = "started a rain of {$amount} coins!";
                    } else {
                        return ['error' => 'Rain minimum is 10 coins'];
                    }
                } else {
                    return ['error' => 'Usage: /rain amount'];
                }
                break;
                
            case 'balance':
                // Return current balance (would integrate with user_balances table)
                return ['success' => true, 'message' => 'Your balance: 1000 coins', 'type' => 'system'];
                
            case 'online':
                $count = getOnlineCount($pdo, $roomId);
                return ['success' => true, 'message' => "Online users: {$count}", 'type' => 'system'];
                
            default:
                return ['error' => 'Unknown command'];
        }
    }
    
    // Insert message
    $stmt = $pdo->prepare('
        INSERT INTO chat_messages (user_id, username, message, room_id, message_type, metadata) 
        VALUES (?, ?, ?, ?, ?, ?)
    ');
    
    if ($stmt->execute([$userId, $username, $message, $roomId, $messageType, $metadata])) {
        return [
            'success' => true,
            'message_id' => $pdo->lastInsertId(),
            'message' => $message,
            'type' => $messageType
        ];
    } else {
        return ['error' => 'Failed to send message'];
    }
}

// Main API logic
$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

if (!$pdo) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

// Get request parameters
$userId = $_GET['user_id'] ?? $_POST['user_id'] ?? null;
$username = $_GET['username'] ?? $_POST['username'] ?? null;
$roomId = intval($_GET['room'] ?? 1);
$isPolling = isset($_GET['action']) && $_GET['action'] === 'poll';
$isGuest = isset($_GET['guest']) && $_GET['guest'] == '1';

// Only update online status when sending messages, not when polling
if (!$isPolling && !$isGuest && $userId && $username) {
    updateOnlineStatus($pdo, $userId, $username, $roomId);
}

if ($method === 'GET') {
    // POLLING - Get new messages
    $lastMessageId = intval($_GET['last_id'] ?? 0);
    
    $messages = getMessages($pdo, $roomId, $lastMessageId);
    $onlineCount = getOnlineCount($pdo, $roomId);
    
    echo json_encode([
        'success' => true,
        'messages' => $messages,
        'online_count' => $onlineCount,
        'room_id' => $roomId
    ]);
    
} elseif ($method === 'POST') {
    // SENDING - Post new message
    $input = json_decode(file_get_contents('php://input'), true);
    $message = $input['message'] ?? '';
    
    // Get user info from JSON payload for POST requests
    $userId = $input['user_id'] ?? null;
    $username = $input['username'] ?? null;
    $roomId = intval($input['room'] ?? 1);
    
    if (empty($message)) {
        http_response_code(400);
        echo json_encode(['error' => 'Message cannot be empty']);
        exit();
    }
    
    if (!$userId || !$username) {
        http_response_code(400);
        echo json_encode(['error' => 'User authentication required']);
        exit();
    }
    
    // Update online status when sending messages
    updateOnlineStatus($pdo, $userId, $username, $roomId);
    
    // Check rate limiting
    if (!checkRateLimit($pdo, $userId)) {
        http_response_code(429);
        echo json_encode(['error' => 'Rate limit exceeded. Max 10 messages per minute.']);
        exit();
    }
    
    $result = sendMessage($pdo, $userId, $username, $message, $roomId);
    
    if (isset($result['error'])) {
        http_response_code(400);
    }
    
    echo json_encode($result);
    
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
