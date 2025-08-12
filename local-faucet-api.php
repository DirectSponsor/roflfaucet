<?php
/**
 * Local Faucet API - Pure Session-Based Performance
 * Pure Sync Hybrid Architecture - Phase 2
 * 
 * All user interactions are instant (PHP sessions)
 * Background sync handles persistence
 */

require_once 'session-bridge.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Initialize session bridge
$bridge = new SessionBridge();

// Get action
$action = $_POST['action'] ?? $_GET['action'] ?? 'status';

try {
    switch ($action) {
        case 'authenticate':
            handleAuthenticate($bridge);
            break;
            
        case 'status':
            handleStatus($bridge);
            break;
            
        case 'claim':
            handleClaim($bridge);
            break;
            
        case 'balance':
            handleBalance($bridge);
            break;
            
        default:
            jsonResponse(['error' => 'Invalid action'], 400);
    }
    
} catch (Exception $e) {
    error_log('Local Faucet API Error: ' . $e->getMessage());
    jsonResponse(['error' => 'Server error'], 500);
}

/**
 * Authenticate user with JWT
 */
function handleAuthenticate($bridge) {
    $jwt = $_POST['jwt'] ?? $_GET['jwt'] ?? null;
    
    if (!$jwt) {
        jsonResponse(['error' => 'JWT token required'], 400);
        return;
    }
    
    $authenticated = $bridge->authenticateUser($jwt);
    
    if ($authenticated) {
        $user = $bridge->getCurrentUser();
        jsonResponse([
            'success' => true,
            'message' => 'Authentication successful',
            'user' => $user
        ]);
    } else {
        jsonResponse(['error' => 'Authentication failed'], 401);
    }
}

/**
 * Get current user status and balance (instant from session)
 */
function handleStatus($bridge) {
    // Try to authenticate from any available token
    $bridge->authenticateUser();
    
    if ($bridge->isAuthenticated()) {
        $user = $bridge->getCurrentUser();
        $lastClaim = $_SESSION['last_claim'] ?? 0;
        $canClaim = (time() - $lastClaim) >= 300; // 5 minutes
        
        jsonResponse([
            'authenticated' => true,
            'user' => $user,
            'balance' => $bridge->getBalance(),
            'can_claim' => $canClaim,
            'seconds_until_claim' => $canClaim ? 0 : (300 - (time() - $lastClaim)),
            'session_data' => [
                'last_sync' => $_SESSION['last_sync_time'] ?? 0,
                'dirty_fields' => $_SESSION['dirty_fields'] ?? []
            ]
        ]);
    } else {
        // Guest mode
        jsonResponse([
            'authenticated' => false,
            'guest_mode' => true,
            'balance' => $_SESSION['balance'] ?? 0.0,
            'can_claim' => true,
            'message' => 'Running in guest mode - login for full features'
        ]);
    }
}

/**
 * Handle faucet claim (instant from session)
 */
function handleClaim($bridge) {
    // Authenticate user
    $bridge->authenticateUser();
    
    $amount = floatval($_POST['amount'] ?? 100);
    $lastClaim = $_SESSION['last_claim'] ?? 0;
    
    // Check cooldown (5 minutes)
    if (time() - $lastClaim < 300) {
        $remainingTime = 300 - (time() - $lastClaim);
        jsonResponse([
            'error' => 'Claim cooldown active',
            'remaining_seconds' => $remainingTime
        ], 429);
        return;
    }
    
    // Process claim (instant!)
    $oldBalance = $bridge->getBalance();
    $newBalance = $bridge->updateBalance($amount, 'add');
    $_SESSION['last_claim'] = time();
    
    // Mark claim time as dirty for sync
    if (!in_array('last_claim', $_SESSION['dirty_fields'])) {
        $_SESSION['dirty_fields'][] = 'last_claim';
    }
    
    jsonResponse([
        'success' => true,
        'message' => 'Claim successful!',
        'claimed_amount' => $amount,
        'old_balance' => $oldBalance,
        'new_balance' => $newBalance,
        'authenticated' => $bridge->isAuthenticated(),
        'performance' => 'instant_session'
    ]);
}

/**
 * Get balance (instant from session)
 */
function handleBalance($bridge) {
    $bridge->authenticateUser();
    
    jsonResponse([
        'success' => true,
        'balance' => $bridge->getBalance(),
        'authenticated' => $bridge->isAuthenticated(),
        'user' => $bridge->getCurrentUser(),
        'performance' => 'instant_session'
    ]);
}

/**
 * JSON response helper
 */
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit();
}
?>
