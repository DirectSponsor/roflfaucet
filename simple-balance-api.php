<?php
/**
 * Ultra-Simple Balance API
 * Direct PHP session management - no complex middleware
 */

session_start();
header('Content-Type: application/json');

// Simple JWT validation function
function validateJWT($jwt) {
    if (!$jwt) return false;
    
    try {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) return false;
        
        // For now, just decode payload without signature validation
        $payload = json_decode(base64_decode($parts[1]), true);
        
        // Check if token has expired
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }
        
        return $payload;
    } catch (Exception $e) {
        return false;
    }
}

// Get action
$action = $_POST['action'] ?? '';

try {
    switch ($action) {
        case 'get_balance':
            $jwt = $_POST['jwt'] ?? '';
            $payload = validateJWT($jwt);
            
            if ($payload) {
                // Member authenticated
                $_SESSION['member_authenticated'] = true;
                $_SESSION['member_id'] = $payload['user_id'] ?? $payload['sub'] ?? 'unknown';
                $_SESSION['member_balance'] = $_SESSION['member_balance'] ?? 0.0;
                
                echo json_encode([
                    'success' => true,
                    'balance' => $_SESSION['member_balance'],
                    'authenticated' => true
                ]);
            } else {
                // Not authenticated
                echo json_encode([
                    'success' => false,
                    'error' => 'Not authenticated'
                ]);
            }
            break;
            
        case 'add_balance':
            $jwt = $_POST['jwt'] ?? '';
            $amount = floatval($_POST['amount'] ?? 0);
            $payload = validateJWT($jwt);
            
            if (!$payload) {
                echo json_encode(['success' => false, 'error' => 'Not authenticated']);
                break;
            }
            
            if ($amount <= 0) {
                echo json_encode(['success' => false, 'error' => 'Invalid amount']);
                break;
            }
            
            // Initialize member session
            $_SESSION['member_authenticated'] = true;
            $_SESSION['member_id'] = $payload['user_id'] ?? $payload['sub'] ?? 'unknown';
            $_SESSION['member_balance'] = $_SESSION['member_balance'] ?? 0.0;
            
            // Add balance
            $oldBalance = $_SESSION['member_balance'];
            $_SESSION['member_balance'] += $amount;
            
            echo json_encode([
                'success' => true,
                'old_balance' => $oldBalance,
                'new_balance' => $_SESSION['member_balance'],
                'amount_added' => $amount
            ]);
            break;
            
        case 'subtract_balance':
            $jwt = $_POST['jwt'] ?? '';
            $amount = floatval($_POST['amount'] ?? 0);
            $payload = validateJWT($jwt);
            
            if (!$payload) {
                echo json_encode(['success' => false, 'error' => 'Not authenticated']);
                break;
            }
            
            if ($amount <= 0) {
                echo json_encode(['success' => false, 'error' => 'Invalid amount']);
                break;
            }
            
            // Initialize member session
            $_SESSION['member_authenticated'] = true;
            $_SESSION['member_id'] = $payload['user_id'] ?? $payload['sub'] ?? 'unknown';
            $_SESSION['member_balance'] = $_SESSION['member_balance'] ?? 0.0;
            
            // Check if sufficient balance
            if ($_SESSION['member_balance'] < $amount) {
                echo json_encode([
                    'success' => false,
                    'error' => 'Insufficient balance',
                    'current_balance' => $_SESSION['member_balance']
                ]);
                break;
            }
            
            // Subtract balance
            $oldBalance = $_SESSION['member_balance'];
            $_SESSION['member_balance'] -= $amount;
            
            echo json_encode([
                'success' => true,
                'old_balance' => $oldBalance,
                'new_balance' => $_SESSION['member_balance'],
                'amount_subtracted' => $amount
            ]);
            break;
            
        default:
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
?>
