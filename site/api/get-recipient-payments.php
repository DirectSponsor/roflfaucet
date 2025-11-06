<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

function sendResponse($success, $data = null, $error = null) {
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'error' => $error,
        'timestamp' => date('c')
    ]);
    exit;
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, 'Only GET requests allowed');
}

try {
    // Get username from query parameter
    $username = isset($_GET['username']) ? trim($_GET['username']) : '';
    
    if (empty($username)) {
        sendResponse(false, null, 'Username parameter is required');
    }
    
    // Load manual distributions data
    $data_file = '../data/manual_distributions.json';
    
    if (!file_exists($data_file)) {
        sendResponse(true, ['payments' => []], null);
    }
    
    $data = json_decode(file_get_contents($data_file), true);
    
    if (!$data || !isset($data['distributions'])) {
        sendResponse(true, ['payments' => []], null);
    }
    
    // Find payments for this recipient
    $recipient_payments = [];
    
    foreach ($data['distributions'] as $month => $month_data) {
        if (isset($month_data['payments'])) {
            foreach ($month_data['payments'] as $payment) {
                if ($payment['recipient_username'] === $username) {
                    $recipient_payments[] = $payment;
                }
            }
        }
    }
    
    // Sort payments by payment_date (newest first)
    usort($recipient_payments, function($a, $b) {
        return strtotime($b['payment_date']) - strtotime($a['payment_date']);
    });
    
    sendResponse(true, ['payments' => $recipient_payments], null);
    
} catch (Exception $e) {
    sendResponse(false, null, 'Error: ' . $e->getMessage());
}
?>