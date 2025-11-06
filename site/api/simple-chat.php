<?php
/**
 * ROFLFaucet Simple Chat API
 * Flat-file based chat system - no database dependencies
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

// ROFLFaucet Data Directory Configuration  
define('ROFLFAUCET_DATA_DIR', '/var/roflfaucet-data');
define('USERDATA_DIR', ROFLFAUCET_DATA_DIR . '/userdata');

// Configuration
define('CHAT_MESSAGE_LIMIT', 100);  // Keep last 100 messages
define('MAX_MESSAGE_LENGTH', 500);
define('RATE_LIMIT_MESSAGES', 10);  // Max 10 messages per minute
define('RATE_LIMIT_WINDOW', 60);    // 60 seconds

// File paths
define('CHAT_MESSAGES_FILE', USERDATA_DIR . '/chat/messages.txt');
define('CHAT_META_FILE', USERDATA_DIR . '/chat/meta.txt');

/**
 * Get user authentication from request
 */
function getUserAuth() {
    $userId = $_GET['user_id'] ?? $_POST['user_id'] ?? null;
    $username = $_GET['username'] ?? $_POST['username'] ?? null;
    
    // Check JSON input for POST requests
    if (!$userId || !$username) {
        $input = json_decode(file_get_contents('php://input'), true);
        if ($input) {
            $userId = $userId ?? $input['user_id'] ?? null;
            $username = $username ?? $input['username'] ?? null;
        }
    }
    
    if ($userId && $username && $userId !== 'guest') {
        return ['user_id' => $userId, 'username' => $username];
    }
    
    return false;
}

/**
 * Load user balance data
 */
function loadUserBalance($userId) {
    $balanceDir = USERDATA_DIR . '/balances';
    
    // Try new format first: {userID}-{username}.txt
    $files = glob($balanceDir . '/' . $userId . '-*.txt');
    if (!empty($files)) {
        $balanceFile = $files[0];
    } else {
        // Fallback to old format: {userID}.txt
        $balanceFile = $balanceDir . '/' . $userId . '.txt';
        if (!file_exists($balanceFile)) {
            return false;
        }
    }
    
    $data = json_decode(file_get_contents($balanceFile), true);
    return $data ? floatval($data['balance']) : false;
}

/**
 * Update user balance (integrate with existing balance system)
 */
function updateUserBalance($userId, $newBalance, $change, $description) {
    $balanceDir = USERDATA_DIR . '/balances';
    
    // Try to find existing file (new or old format)
    $files = glob($balanceDir . '/' . $userId . '-*.txt');
    if (!empty($files)) {
        $balanceFile = $files[0]; // Use existing new format file
    } else {
        // Check for old format file
        $oldFile = $balanceDir . '/' . $userId . '.txt';
        if (file_exists($oldFile)) {
            $balanceFile = $oldFile; // Use existing old format file
        } else {
            // Create new file - need username for new format
            $username = getUsernameFromId($userId) ?: 'user' . $userId;
            $balanceFile = $balanceDir . '/' . $userId . '-' . $username . '.txt';
        }
    }
    
    // Load existing data or create new
    $data = [];
    if (file_exists($balanceFile)) {
        $data = json_decode(file_get_contents($balanceFile), true) ?: [];
    }
    
    $oldBalance = floatval($data['balance'] ?? 0);
    $data['balance'] = $newBalance;
    $data['last_updated'] = time();
    
    // Add transaction record
    if (!isset($data['transactions'])) {
        $data['transactions'] = [];
    }
    
    $data['transactions'][] = [
        'timestamp' => time(),
        'type' => $change > 0 ? 'credit' : 'debit',
        'old_balance' => $oldBalance,
        'new_balance' => $newBalance,
        'change' => $change,
        'description' => $description
    ];
    
    // Limit transaction history to last 50
    if (count($data['transactions']) > 50) {
        $data['transactions'] = array_slice($data['transactions'], -50);
    }
    
    return file_put_contents($balanceFile, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX) !== false;
}

/**
 * Universal user lookup - finds combined user ID by either numeric ID or username
 * Since both user ID and username are unique, either can be used to find the file
 * Returns the full combined ID (userID-username) format
 */
function findCombinedUserIdByIdOrUsername($searchTerm) {
    $balanceDir = USERDATA_DIR . '/balances';
    if (!is_dir($balanceDir)) {
        return false;
    }
    
    $searchLower = strtolower(trim($searchTerm));
    $files = glob($balanceDir . '/*-*.txt');
    
    foreach ($files as $file) {
        $filename = basename($file, '.txt');
        $parts = explode('-', $filename, 2); // Split on first dash only
        
        if (count($parts) === 2) {
            $userId = $parts[0];
            $fileUsername = $parts[1];
            
            // Check if search term matches either the numeric ID or username
            if ($userId === $searchLower || strtolower($fileUsername) === $searchLower) {
                return $filename; // Return the full combined ID (userID-username)
            }
        }
    }
    
    return false;
}

/**
 * Legacy wrapper functions for backward compatibility
 */
function findCombinedUserIdByUsername($targetUsername) {
    return findCombinedUserIdByIdOrUsername($targetUsername);
}

function findUserIdByUsername($targetUsername) {
    $combinedId = findCombinedUserIdByIdOrUsername($targetUsername);
    if ($combinedId) {
        $parts = explode('-', $combinedId, 2);
        return $parts[0]; // Return just the numeric part
    }
    return false;
}

/**
 * Get username from user ID using filename lookup
 */
function getUsernameFromId($userId) {
    $balanceDir = USERDATA_DIR . '/balances';
    if (!is_dir($balanceDir)) {
        return false;
    }
    
    // Look for file matching pattern: {userID}-{username}.txt
    $files = glob($balanceDir . '/' . $userId . '-*.txt');
    
    if (!empty($files)) {
        $filename = basename($files[0], '.txt');
        $parts = explode('-', $filename, 2);
        
        if (count($parts) === 2) {
            return $parts[1]; // Return the username part
        }
    }
    
    return false;
}

/**
 * Check rate limiting
 */
function checkRateLimit($userId) {
    $rateLimitFile = USERDATA_DIR . "/chat/ratelimit_{$userId}.txt";
    $now = time();
    
    // Load existing rate limit data
    $data = [];
    if (file_exists($rateLimitFile)) {
        $data = json_decode(file_get_contents($rateLimitFile), true) ?: [];
    }
    
    // Reset if window has passed
    if (!isset($data['window_start']) || ($now - $data['window_start']) >= RATE_LIMIT_WINDOW) {
        $data = [
            'window_start' => $now,
            'message_count' => 1
        ];
        file_put_contents($rateLimitFile, json_encode($data), LOCK_EX);
        return true;
    }
    
    // Check if under limit
    if ($data['message_count'] >= RATE_LIMIT_MESSAGES) {
        return false;
    }
    
    // Increment counter
    $data['message_count']++;
    file_put_contents($rateLimitFile, json_encode($data), LOCK_EX);
    return true;
}


/**
 * Add notification for user
 */
function addNotification($userId, $type, $message, $fromUsername = null, $metadata = null) {
    $notificationFile = USERDATA_DIR . "/inbox/{$userId}.txt";
    
    // Load existing notifications
    $notifications = [];
    if (file_exists($notificationFile)) {
        $notifications = json_decode(file_get_contents($notificationFile), true) ?: [];
    }
    
    // Create new notification
    $notification = [
        'id' => 'msg_' . time() . '_' . uniqid(),
        'type' => $type,
        'from' => $fromUsername,
        'message' => $message,
        'timestamp' => time(),
        'read' => false,
        'metadata' => $metadata
    ];
    
    // Add to beginning
    array_unshift($notifications, $notification);
    
    // Limit to 50 notifications per user
    if (count($notifications) > 50) {
        $notifications = array_slice($notifications, 0, 50);
    }
    
    return file_put_contents($notificationFile, json_encode($notifications, JSON_PRETTY_PRINT), LOCK_EX) !== false;
}

/**
 * Process @mention notifications
 */
function processMentionNotifications($fromUsername, $message) {
    // Find all @username mentions in the message
    if (preg_match_all('/@([a-zA-Z0-9_]+)/', $message, $matches)) {
        foreach ($matches[1] as $mentionedUsername) {
            // Skip self-mentions
            if (strtolower($mentionedUsername) === strtolower($fromUsername)) {
                continue;
            }
            
            // Find the mentioned user's combined ID
            $mentionedCombinedId = findCombinedUserIdByIdOrUsername($mentionedUsername);
            if ($mentionedCombinedId !== false) {
                // Create notification
                $notificationMessage = "mentioned you in chat: " . substr($message, 0, 100) . (strlen($message) > 100 ? '...' : '');
                addNotification($mentionedCombinedId, 'mention', $notificationMessage, $fromUsername, [
                    'message' => $message,
                    'timestamp' => time()
                ]);
            }
        }
    }
}

/**
 * Add message to chat file
 */
function addChatMessage($username, $message, $type = 'message', $metadata = null) {
    $timestamp = time();
    $metadataStr = $metadata ? '|' . json_encode($metadata) : '';
    $line = "{$timestamp}|{$username}|{$message}|{$type}{$metadataStr}\n";
    
    // Append message
    $result = file_put_contents(CHAT_MESSAGES_FILE, $line, FILE_APPEND | LOCK_EX);
    
    if ($result !== false) {
        // Update message count and check cleanup
        cleanupMessagesIfNeeded();
        
        // Process @mentions for notifications (only for regular messages, not commands)
        if ($type === 'message') {
            processMentionNotifications($username, $message);
        }
    }
    
    return $result !== false;
}

/**
 * Clean up old messages (keep last CHAT_MESSAGE_LIMIT)
 */
function cleanupMessagesIfNeeded() {
    if (!file_exists(CHAT_MESSAGES_FILE)) {
        return;
    }
    
    $lines = file(CHAT_MESSAGES_FILE, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
    if (count($lines) > CHAT_MESSAGE_LIMIT) {
        // Keep only the last CHAT_MESSAGE_LIMIT messages
        $keepLines = array_slice($lines, -CHAT_MESSAGE_LIMIT);
        file_put_contents(CHAT_MESSAGES_FILE, implode("\n", $keepLines) . "\n", LOCK_EX);
        
        // Update meta
        $meta = ['last_cleanup' => time(), 'total_messages' => count($keepLines)];
        file_put_contents(CHAT_META_FILE, json_encode($meta), LOCK_EX);
    }
}

/**
 * Get messages since timestamp
 */
function getMessagesSince($sinceTimestamp = 0) {
    if (!file_exists(CHAT_MESSAGES_FILE)) {
        return [];
    }
    
    $lines = file(CHAT_MESSAGES_FILE, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $messages = [];
    
    foreach ($lines as $line) {
        $parts = explode('|', $line, 5);
        if (count($parts) >= 4) {
            $timestamp = intval($parts[0]);
            
            if ($timestamp > $sinceTimestamp) {
                $messages[] = [
                    'timestamp' => $timestamp,
                    'username' => $parts[1],
                    'message' => $parts[2],
                    'type' => $parts[3],
                    'metadata' => isset($parts[4]) ? json_decode($parts[4], true) : null
                ];
            }
        }
    }
    
    return $messages;
}

/**
 * Get online user count (simple file-based tracking)
 */
function updateOnlineStatus($userId, $username) {
    $onlineFile = USERDATA_DIR . '/chat/online.txt';
    $now = time();
    
    // Load online users
    $online = [];
    if (file_exists($onlineFile)) {
        $online = json_decode(file_get_contents($onlineFile), true) ?: [];
    }
    
    // Update this user's status
    $online[$userId] = ['username' => $username, 'last_seen' => $now];
    
    // Remove users inactive for more than 5 minutes
    foreach ($online as $uid => $data) {
        if (($now - $data['last_seen']) > 300) { // 5 minutes
            unset($online[$uid]);
        }
    }
    
    file_put_contents($onlineFile, json_encode($online), LOCK_EX);
    return count($online);
}

/**
 * Process chat commands
 */
function processCommand($userId, $username, $message) {
    $parts = explode(' ', trim($message));
    $command = strtolower(substr($parts[0], 1)); // Remove the /
    
    switch ($command) {
        case 'tip':
            if (count($parts) < 3) {
                return ['error' => 'Usage: /tip username amount'];
            }
            
            $targetUsername = $parts[1];
            $amount = floatval($parts[2]);
            
            if ($amount <= 0 || $amount > 10000) {
                return ['error' => 'Tip amount must be between 0.01 and 10000'];
            }
            
            // Check if target user exists and get combined ID
            $targetCombinedId = findCombinedUserIdByIdOrUsername($targetUsername);
            if ($targetCombinedId === false) {
                return ['error' => "User '{$targetUsername}' not found. They need to chat first!"];
            }
            
            // Extract numeric ID for balance operations (legacy compatibility)
            $targetUserId = explode('-', $targetCombinedId, 2)[0];
            
            // Check sender balance
            $senderBalance = loadUserBalance($userId);
            if ($senderBalance === false || $senderBalance < $amount) {
                return ['error' => 'Insufficient balance'];
            }
            
            // Check recipient balance file exists (create if needed)
            $recipientBalance = loadUserBalance($targetUserId);
            if ($recipientBalance === false) {
                $recipientBalance = 0; // Start with 0 if no balance file exists
            }
            
            // Process the tip transaction
            $newSenderBalance = $senderBalance - $amount;
            $newRecipientBalance = $recipientBalance + $amount;
            
            // Deduct from sender
            if (!updateUserBalance($userId, $newSenderBalance, -$amount, "Tip to {$targetUsername}")) {
                return ['error' => 'Failed to process tip - sender deduction failed'];
            }
            
            // Credit to recipient
            if (!updateUserBalance($targetUserId, $newRecipientBalance, $amount, "Tip received from {$username}")) {
                // Rollback sender transaction if recipient credit fails
                updateUserBalance($userId, $senderBalance, $amount, "Tip rollback - recipient credit failed");
                return ['error' => 'Failed to process tip - recipient credit failed'];
            }
            
            // Add chat message
            $tipMessage = "tipped {$targetUsername} {$amount} coins";
            addChatMessage($username, $tipMessage, 'tip', ['amount' => $amount, 'target' => $targetUsername]);
            
            // Add notification for recipient using combined ID
            addNotification($targetCombinedId, 'tip', "You received {$amount} coins from {$username}! 💰", $username, ['amount' => $amount]);
            
            return ['success' => true, 'message' => "Sent {$amount} coins to {$targetUsername}!", 'type' => 'system'];
            
        case 'rain':
            if (count($parts) < 2) {
                return ['error' => 'Usage: /rain amount'];
            }
            
            $amount = floatval($parts[1]);
            
            if ($amount < 10 || $amount > 10000) {
                return ['error' => 'Rain amount must be between 10 and 10000'];
            }
            
            // Check sender balance
            $senderBalance = loadUserBalance($userId);
            if ($senderBalance === false || $senderBalance < $amount) {
                return ['error' => 'Insufficient balance'];
            }
            
            // Deduct from sender
            $newSenderBalance = $senderBalance - $amount;
            if (!updateUserBalance($userId, $newSenderBalance, -$amount, "Rain of {$amount} coins")) {
                return ['error' => 'Failed to process rain - balance deduction failed'];
            }
            
            // Add chat message
            $rainMessage = "made it rain {$amount} coins! 🌧️";
            addChatMessage($username, $rainMessage, 'rain', ['amount' => $amount]);
            
            return ['success' => true, 'message' => "Started rain of {$amount} coins! 🌧️", 'type' => 'system'];
            
        case 'balance':
            $balance = loadUserBalance($userId);
            $formattedBalance = $balance !== false ? number_format($balance, 2) : '0.00';
            return ['success' => true, 'message' => "Your balance: {$formattedBalance} coins", 'type' => 'system'];
            
        case 'online':
            $count = updateOnlineStatus($userId, $username);
            return ['success' => true, 'message' => "Online users: {$count}", 'type' => 'system'];
            
        case 'help':
            return ['success' => true, 'message' => 'Available commands: /tip username amount, /rain amount, /balance, /online, /help', 'type' => 'system'];
            
        default:
            return ['error' => 'Unknown command. Type /help for available commands.'];
    }
}

// Main API logic
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Check if this is a user lookup request (by ID or username)
    if (isset($_GET['lookup_user'])) {
        $searchTerm = $_GET['lookup_user'];
        $combinedId = findCombinedUserIdByIdOrUsername($searchTerm);
        
        if ($combinedId) {
            // Extract username from combined ID for response
            $parts = explode('-', $combinedId, 2);
            $actualUsername = count($parts) === 2 ? $parts[1] : $searchTerm;
            
            echo json_encode([
                'success' => true,
                'combined_user_id' => $combinedId,
                'search_term' => $searchTerm,
                'username' => $actualUsername
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'error' => "User '{$searchTerm}' not found"
            ]);
        }
        exit();
    }
    
    // POLLING - Get new messages
    $sinceTimestamp = intval($_GET['since'] ?? 0);
    $auth = getUserAuth();
    
    if ($auth) {
        $onlineCount = updateOnlineStatus($auth['user_id'], $auth['username']);
    } else {
        $onlineCount = 0; // Guest users don't count in online
    }
    
    $messages = getMessagesSince($sinceTimestamp);
    
    // Use the last message timestamp, not current server time
    // This prevents the frontend from skipping its own messages
    $lastTimestamp = !empty($messages) ? end($messages)['timestamp'] : $sinceTimestamp;
    
    echo json_encode([
        'success' => true,
        'messages' => $messages,
        'online_count' => $onlineCount,
        'current_timestamp' => $lastTimestamp
    ]);
    
} elseif ($method === 'POST') {
    // SENDING - Post new message
    $input = json_decode(file_get_contents('php://input'), true);
    $message = trim($input['message'] ?? '');
    
    
    if (empty($message)) {
        http_response_code(400);
        echo json_encode(['error' => 'Message cannot be empty']);
        exit();
    }
    
    if (strlen($message) > MAX_MESSAGE_LENGTH) {
        http_response_code(400);
        echo json_encode(['error' => 'Message too long (max ' . MAX_MESSAGE_LENGTH . ' characters)']);
        exit();
    }
    
    $auth = getUserAuth();
    if (!$auth) {
        http_response_code(400);
        echo json_encode(['error' => 'User authentication required']);
        exit();
    }
    
    $userId = $auth['user_id'];
    $username = $auth['username'];
    
    // Check rate limiting
    if (!checkRateLimit($userId)) {
        http_response_code(429);
        echo json_encode(['error' => 'Rate limit exceeded. Max ' . RATE_LIMIT_MESSAGES . ' messages per minute.']);
        exit();
    }
    
    // Update online status
    updateOnlineStatus($userId, $username);
    
    // Check if it's a command
    if (substr($message, 0, 1) === '/') {
        $result = processCommand($userId, $username, $message);
        echo json_encode($result);
    } else {
        // Regular message
        $cleanMessage = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
        
        if (addChatMessage($username, $cleanMessage)) {
            
            echo json_encode([
                'success' => true,
                'message' => $cleanMessage,
                'type' => 'message'
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to send message']);
        }
    }
    
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
