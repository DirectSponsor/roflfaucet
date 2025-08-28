<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../userdata/UserDataManager.php';

// Simple JWT decoding (you may want to use a proper JWT library)
function decodeJWT($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }
    
    $payload = json_decode(base64_decode($parts[1]), true);
    return $payload;
}

// Get user ID from JWT token
function getUserIdFromToken() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7);
        $payload = decodeJWT($token);
        
        if ($payload && isset($payload['sub'])) {
            return $payload['sub']; // 'sub' is the standard JWT claim for user ID
        }
    }
    
    return null;
}

$userManager = new UserDataManager();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'GET':
            handleGetRequest($userManager, $action);
            break;
            
        case 'POST':
            handlePostRequest($userManager, $action);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error', 'message' => $e->getMessage()]);
}

function handleGetRequest($userManager, $action) {
    $userId = getUserIdFromToken();
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }
    
    switch ($action) {
        case 'balance':
            $balanceData = $userManager->getBalanceData($userId);
            echo json_encode([
                'success' => true,
                'balance' => $balanceData['balance'],
                'last_updated' => $balanceData['last_updated'],
                'transactions' => array_slice($balanceData['transactions'], 0, 5) // Last 5 transactions
            ]);
            break;
            
        case 'profile':
            $profileData = $userManager->getProfileData($userId);
            // Don't expose sensitive internal data
            unset($profileData['created_at']);
            echo json_encode([
                'success' => true,
                'profile' => $profileData
            ]);
            break;
            
        case 'balance_timestamp':
            // Lightweight endpoint - only returns timestamp for sync checking
            $balanceData = $userManager->getBalanceData($userId);
            echo json_encode([
                'success' => true,
                'last_updated' => $balanceData['last_updated']
            ]);
            break;
            
        case 'all':
            $userData = $userManager->getUserData($userId);
            echo json_encode([
                'success' => true,
                'balance' => $userData['balance_data']['balance'],
                'last_updated' => $userData['balance_data']['last_updated'],
                'profile' => $userData['profile_data'],
                'recent_transactions' => array_slice($userData['balance_data']['transactions'], 0, 5)
            ]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

function handlePostRequest($userManager, $action) {
    $userId = getUserIdFromToken();
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'update_balance':
            if (!isset($input['amount']) || !is_numeric($input['amount'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid amount']);
                return;
            }
            
            $amount = floatval($input['amount']);
            $source = $input['source'] ?? 'manual';
            
            if ($amount > 0) {
                $success = $userManager->addToBalance($userId, $amount, $source);
            } else {
                $success = $userManager->subtractFromBalance($userId, abs($amount), $source);
            }
            
            if ($success) {
                // Auto-increment stats based on source type
                autoIncrementStats($userManager, $userId, $source, $amount);
                
                $newBalanceData = $userManager->getBalanceData($userId);
                echo json_encode([
                    'success' => true,
                    'new_balance' => $newBalanceData['balance'],
                    'message' => 'Balance updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update balance']);
            }
            break;
            
        case 'faucet_claim':
            $claimAmount = floatval($input['amount'] ?? 10);
            
            // Add faucet claim logic here (cooldown check, etc.)
            $success = $userManager->addToBalance($userId, $claimAmount, 'faucet claim');
            
            if ($success) {
                // Update stats
                $userManager->incrementStat($userId, 'total_claims');
                
                $newBalanceData = $userManager->getBalanceData($userId);
                echo json_encode([
                    'success' => true,
                    'new_balance' => $newBalanceData['balance'],
                    'claimed_amount' => $claimAmount,
                    'message' => 'Faucet claimed successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to process faucet claim']);
            }
            break;
            
        case 'game_bet':
            if (!isset($input['bet_amount']) || !is_numeric($input['bet_amount'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid bet amount']);
                return;
            }
            
            $betAmount = floatval($input['bet_amount']);
            $balanceData = $userManager->getBalanceData($userId);
            
            if ($balanceData['balance'] < $betAmount) {
                echo json_encode([
                    'success' => false,
                    'error' => 'Insufficient balance'
                ]);
                return;
            }
            
            // Deduct bet amount
            $success = $userManager->subtractFromBalance($userId, $betAmount, 'slot game bet');
            
            if ($success) {
                $userManager->incrementStat($userId, 'total_games_played');
                
                $newBalanceData = $userManager->getBalanceData($userId);
                echo json_encode([
                    'success' => true,
                    'new_balance' => $newBalanceData['balance'],
                    'bet_amount' => $betAmount,
                    'message' => 'Bet placed successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to place bet']);
            }
            break;
            
        case 'game_win':
            if (!isset($input['win_amount']) || !is_numeric($input['win_amount'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid win amount']);
                return;
            }
            
            $winAmount = floatval($input['win_amount']);
            
            $success = $userManager->addToBalance($userId, $winAmount, 'slot game win');
            
            if ($success) {
                $userManager->incrementStat($userId, 'total_won', $winAmount);
                
                $newBalanceData = $userManager->getBalanceData($userId);
                echo json_encode([
                    'success' => true,
                    'new_balance' => $newBalanceData['balance'],
                    'win_amount' => $winAmount,
                    'message' => 'Win credited successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to credit win']);
            }
            break;
            
        case 'update_profile':
            // DEBUG: Log what we're receiving
            error_log("UPDATE_PROFILE DEBUG: Full input: " . json_encode($input));
            
            // Accept both direct format and nested format for flexibility
            $profileUpdates = $input['profile_updates'] ?? $input;
            
            // Remove action from profileUpdates to avoid confusion
            unset($profileUpdates['action']);
            
            error_log("UPDATE_PROFILE DEBUG: Profile updates after processing: " . json_encode($profileUpdates));
            
            if (!is_array($profileUpdates)) {
                error_log("UPDATE_PROFILE DEBUG: profileUpdates is not array, type: " . gettype($profileUpdates));
                http_response_code(400);
                echo json_encode(['error' => 'Invalid profile data']);
                return;
            }
            
            $success = $userManager->updateProfile($userId, $profileUpdates);
            error_log("UPDATE_PROFILE DEBUG: Update result: " . ($success ? 'SUCCESS' : 'FAILED'));
            
            if ($success) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Profile updated successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to update profile']);
            }
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

// Helper function to automatically increment stats based on transaction source
function autoIncrementStats($userManager, $userId, $source, $amount) {
    $source = strtolower($source);
    
    // Increment stats based on what type of action this was
    if (strpos($source, 'faucet') !== false) {
        $userManager->incrementStat($userId, 'total_claims');
    } elseif (strpos($source, 'game') !== false || strpos($source, 'slot') !== false) {
        if ($amount < 0) {
            // Negative amount = bet/spend
            $userManager->incrementStat($userId, 'total_games_played');
        } else {
            // Positive amount = win
            $userManager->incrementStat($userId, 'total_won', $amount);
        }
    }
}

?>
