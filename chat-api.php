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

// Include config and auth functions
require_once 'server-backups/2025-08-03_00-16-55/config.php';

// JWT Secret - same as auth system
define('JWT_SECRET', 'rofl_jwt_secret_key_2025');

/**
 * Validate JWT token
 */
function validateJWT($token) {
    try {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return false;
        
        list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;
        
        // Verify signature
        $signature = str_replace(['-', '_'], ['+', '/'], $signatureEncoded);
        $signature = base64_decode($signature . str_repeat('=', (4 - strlen($signature) % 4) % 4));
        
        $expectedSignature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, JWT_SECRET, true);
        
        if (!hash_equals($signature, $expectedSignature)) return false;
        
        // Decode payload
        $payload = str_replace(['-', '_'], ['+', '/'], $payloadEncoded);
        $payload = base64_decode($payload . str_repeat('=', (4 - strlen($payload) % 4) % 4));
        $payloadData = json_decode($payload, true);
        
        // Check expiration
        if ($payloadData['exp'] < time()) return false;
        
        return $payloadData;
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Get database connection
 */
function getDbConnection() {
    try {
        // Production setup with Docker PostgreSQL
        $pdo = new PDO('pgsql:host=localhost;port=9432;dbname=listmonk', 'listmonk', 'listmonk');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
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
    // PostgreSQL UPSERT syntax
    $stmt = $pdo->prepare('
        INSERT INTO chat_users_online (user_id, username, room_id, last_seen) 
        VALUES (?, ?, ?, NOW()) 
        ON CONFLICT (user_id) DO UPDATE SET 
        username = EXCLUDED.username,
        room_id = EXCLUDED.room_id,
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
    // Clean up old users (inactive for more than 5 minutes) - PostgreSQL syntax
    $stmt = $pdo->prepare('DELETE FROM chat_users_online WHERE last_seen < NOW() - INTERVAL \'5 minutes\'');
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

// Get JWT token from Authorization header
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = '';

if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    $token = $matches[1];
}

// Validate authentication
$user = validateJWT($token);
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit();
}

$userId = $user['sub'];
$username = $user['username'];
$roomId = intval($_GET['room'] ?? 1);

// Update user online status
updateOnlineStatus($pdo, $userId, $username, $roomId);

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
    
    if (empty($message)) {
        http_response_code(400);
        echo json_encode(['error' => 'Message cannot be empty']);
        exit();
    }
    
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
