<?php
/**
 * Ensure User Files API
 * 
 * Creates balance and profile files if they don't exist when user logs in.
 * This fixes the issue where users lose their level/profile data.
 * Called automatically during JWT login process.
 * 
 * @author ROFLFaucet Dev Team
 * @version 1.0
 * @date 2025-09-09
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get input data
$input = json_decode(file_get_contents('php://input'), true);
if (!$input || empty($input['user_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: user_id']);
    exit;
}

$userId = $input['user_id'];
$username = $input['username'] ?? '';
$email = $input['email'] ?? '';

// DEBUG: Log what we received
error_log("[ENSURE-FILES] Received data - UserID: $userId, Username: '$username', Email: '$email'");

$createdFiles = [];
$messages = [];

/**
 * Ensure balance file exists
 */
function ensureBalanceFile($userId, &$createdFiles, &$messages) {
    $balanceFile = __DIR__ . "/../userdata/balances/{$userId}.txt";
    
    if (!file_exists($balanceFile)) {
        $balanceData = [
            'balance' => 0, // Starting balance (no welcome bonus)
            'last_updated' => time(),
            'transactions' => [
                [
                    'timestamp' => time(),
                    'type' => 'system',
                    'old_balance' => 0,
                    'new_balance' => 0,
                    'change' => 0,
                    'description' => 'system: Account created - use faucet to earn coins'
                ]
            ]
        ];
        
        // Ensure directory exists
        $dir = dirname($balanceFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        if (file_put_contents($balanceFile, json_encode($balanceData, JSON_PRETTY_PRINT)) !== false) {
            $createdFiles[] = "balance file";
            $messages[] = "Created balance file - use faucet to earn coins";
            error_log("Created balance file for user_id: $userId");
            return true;
        } else {
            error_log("Failed to create balance file for user_id: $userId");
            return false;
        }
    } else {
        $messages[] = "Balance file already exists";
        return true;
    }
}

/**
 * Ensure profile file exists
 */
function ensureProfileFile($userId, $username, $email, &$createdFiles, &$messages) {
    $profileFile = __DIR__ . "/../userdata/profiles/{$userId}.txt";
    
    if (!file_exists($profileFile)) {
        // DEBUG: Log profile creation
        error_log("[ENSURE-FILES] Creating profile with email: '$email'");
        
        $profileData = [
            'user_id' => $userId,
            'level' => 1, // Starting level
            'username' => $username,
            'email' => $email,
            'bio' => '',
            'location' => '',
            'website' => '',
            'joined_date' => time(),
            'settings' => [
                'notifications' => true,
                'theme' => 'default'
            ],
            'stats' => [
                'total_claims' => 0,
                'total_games_played' => 0,
                'total_won' => 0
            ],
            'last_profile_update' => time()
        ];
        
        // Ensure directory exists
        $dir = dirname($profileFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        if (file_put_contents($profileFile, json_encode($profileData, JSON_PRETTY_PRINT)) !== false) {
            $createdFiles[] = "profile file";
            $messages[] = "Created profile file with username: $username";
            error_log("Created profile file for user_id: $userId with username: $username");
            return true;
        } else {
            error_log("Failed to create profile file for user_id: $userId");
            return false;
        }
    } else {
        $messages[] = "Profile file already exists";
        return true;
    }
}

// Ensure both files exist
$balanceSuccess = ensureBalanceFile($userId, $createdFiles, $messages);
$profileSuccess = ensureProfileFile($userId, $username, $email, $createdFiles, $messages);

if ($balanceSuccess && $profileSuccess) {
    echo json_encode([
        'success' => true,
        'message' => implode('; ', $messages),
        'created_files' => $createdFiles,
        'user_id' => $userId,
        'username' => $username
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to ensure all user files',
        'messages' => $messages,
        'created_files' => $createdFiles
    ]);
}
?>
