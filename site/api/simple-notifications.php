<?php
/**
 * ROFLFaucet Simple Notifications API
 * Flat-file based notifications system
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

// File paths
define('USERDATA_DIR', __DIR__ . '/../userdata');

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
 * Load user notifications - supports both numeric and combined ID formats
 */
function loadUserNotifications($userId) {
    // Try combined format first: {userID}-{username}.txt
    $notificationFile = USERDATA_DIR . "/inbox/{$userId}.txt";
    
    if (!file_exists($notificationFile) && strpos($userId, '-') === false) {
        // If numeric ID provided and file doesn't exist, look for combined format files
        $files = glob(USERDATA_DIR . "/inbox/{$userId}-*.txt");
        if (!empty($files)) {
            $notificationFile = $files[0]; // Use the first match
        }
    }
    
    if (!file_exists($notificationFile)) {
        return [];
    }
    
    $notifications = json_decode(file_get_contents($notificationFile), true);
    return $notifications ?: [];
}

/**
 * Save user notifications - uses the provided user ID format for filename
 */
function saveUserNotifications($userId, $notifications) {
    $notificationFile = USERDATA_DIR . "/inbox/{$userId}.txt";
    
    // Ensure directory exists
    $dir = dirname($notificationFile);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    
    return file_put_contents($notificationFile, json_encode($notifications, JSON_PRETTY_PRINT), LOCK_EX) !== false;
}

/**
 * Get notification summary (unread count, recent notifications)
 */
function getNotificationSummary($userId, $limit = 10) {
    $notifications = loadUserNotifications($userId);
    
    $unreadCount = 0;
    $recentNotifications = [];
    
    foreach ($notifications as $notification) {
        if (!$notification['read']) {
            $unreadCount++;
        }
        
        if (count($recentNotifications) < $limit) {
            $recentNotifications[] = $notification;
        }
    }
    
    return [
        'unread_count' => $unreadCount,
        'total_count' => count($notifications),
        'recent' => $recentNotifications
    ];
}

/**
 * Mark specific notifications as read
 */
function markNotificationsAsRead($userId, $notificationIds) {
    $notifications = loadUserNotifications($userId);
    $marked = 0;
    
    foreach ($notifications as &$notification) {
        if (in_array($notification['id'], $notificationIds) && !$notification['read']) {
            $notification['read'] = true;
            $marked++;
        }
    }
    
    if ($marked > 0) {
        saveUserNotifications($userId, $notifications);
    }
    
    return $marked;
}

/**
 * Mark all notifications as read
 */
function markAllNotificationsAsRead($userId) {
    $notifications = loadUserNotifications($userId);
    $marked = 0;
    
    foreach ($notifications as &$notification) {
        if (!$notification['read']) {
            $notification['read'] = true;
            $marked++;
        }
    }
    
    if ($marked > 0) {
        saveUserNotifications($userId, $notifications);
    }
    
    return $marked;
}

/**
 * Delete old notifications (keep most recent 50)
 */
function cleanupOldNotifications($userId) {
    $notifications = loadUserNotifications($userId);
    
    if (count($notifications) > 50) {
        $notifications = array_slice($notifications, 0, 50);
        saveUserNotifications($userId, $notifications);
        return true;
    }
    
    return false;
}

// Main API logic
$method = $_SERVER['REQUEST_METHOD'];
$auth = getUserAuth();

if (!$auth) {
    http_response_code(400);
    echo json_encode(['error' => 'User authentication required']);
    exit();
}

$userId = $auth['user_id'];

if ($method === 'GET') {
    $action = $_GET['action'] ?? 'summary';
    
    switch ($action) {
        case 'summary':
            // Get notification summary (unread count + recent notifications)
            $limit = intval($_GET['limit'] ?? 10);
            $summary = getNotificationSummary($userId, $limit);
            echo json_encode(['success' => true, 'data' => $summary]);
            break;
            
        case 'all':
            // Get all notifications
            $notifications = loadUserNotifications($userId);
            echo json_encode(['success' => true, 'notifications' => $notifications]);
            break;
            
        case 'unread':
            // Get only unread notifications
            $notifications = loadUserNotifications($userId);
            $unread = array_filter($notifications, function($n) { return !$n['read']; });
            echo json_encode(['success' => true, 'notifications' => array_values($unread)]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
    }
    
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'mark_read':
            // Mark specific notifications as read
            $notificationIds = $input['notification_ids'] ?? [];
            if (empty($notificationIds)) {
                http_response_code(400);
                echo json_encode(['error' => 'No notification IDs provided']);
                break;
            }
            
            $marked = markNotificationsAsRead($userId, $notificationIds);
            echo json_encode(['success' => true, 'marked_count' => $marked]);
            break;
            
        case 'mark_all_read':
            // Mark all notifications as read
            $marked = markAllNotificationsAsRead($userId);
            echo json_encode(['success' => true, 'marked_count' => $marked]);
            break;
            
        case 'mark_replied':
            // Mark notification as replied
            $notificationId = $input['notification_id'] ?? '';
            if (empty($notificationId)) {
                http_response_code(400);
                echo json_encode(['error' => 'No notification ID provided']);
                break;
            }
            
            $notifications = loadUserNotifications($userId);
            $found = false;
            foreach ($notifications as &$notification) {
                if ($notification['id'] === $notificationId) {
                    $notification['replied'] = true;
                    $found = true;
                    break;
                }
            }
            
            if ($found) {
                saveUserNotifications($userId, $notifications);
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Notification not found']);
            }
            break;
            
        case 'dismiss':
            // Remove individual notification
            $notificationId = $input['notification_id'] ?? '';
            if (empty($notificationId)) {
                http_response_code(400);
                echo json_encode(['error' => 'No notification ID provided']);
                break;
            }
            
            $notifications = loadUserNotifications($userId);
            $originalCount = count($notifications);
            $notifications = array_filter($notifications, function($n) use ($notificationId) {
                return $n['id'] !== $notificationId;
            });
            
            if (count($notifications) < $originalCount) {
                saveUserNotifications($userId, array_values($notifications));
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Notification not found']);
            }
            break;
            
        case 'clear_all':
            // Remove all notifications
            saveUserNotifications($userId, []);
            echo json_encode(['success' => true, 'cleared_count' => count(loadUserNotifications($userId))]);
            break;
            
        case 'cleanup':
            // Clean up old notifications
            $cleaned = cleanupOldNotifications($userId);
            echo json_encode(['success' => true, 'cleaned' => $cleaned]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
    }
    
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
