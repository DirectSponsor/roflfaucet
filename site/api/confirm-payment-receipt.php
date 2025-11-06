<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
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

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, 'Only POST requests allowed');
}

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendResponse(false, null, 'Invalid JSON input');
    }
    
    // Validate required fields
    $required_fields = ['payment_id', 'status', 'username'];
    foreach ($required_fields as $field) {
        if (!isset($input[$field]) || trim($input[$field]) === '') {
            sendResponse(false, null, "Field '$field' is required");
        }
    }
    
    $payment_id = trim($input['payment_id']);
    $status = trim($input['status']);
    $username = trim($input['username']);
    $recipient_notes = isset($input['recipient_notes']) ? trim($input['recipient_notes']) : '';
    
    // Validate status
    $valid_statuses = ['received', 'not_received', 'partial'];
    if (!in_array($status, $valid_statuses)) {
        sendResponse(false, null, 'Invalid status value');
    }
    
    // Load manual distributions data
    $data_file = '../data/manual_distributions.json';
    
    if (!file_exists($data_file)) {
        sendResponse(false, null, 'No payment data found');
    }
    
    $data = json_decode(file_get_contents($data_file), true);
    
    if (!$data || !isset($data['distributions'])) {
        sendResponse(false, null, 'Invalid payment data format');
    }
    
    // Find and update the payment
    $payment_found = false;
    $payment_updated = false;
    
    foreach ($data['distributions'] as $month => &$month_data) {
        if (isset($month_data['payments'])) {
            foreach ($month_data['payments'] as &$payment) {
                if ($payment['payment_id'] === $payment_id && $payment['recipient_username'] === $username) {
                    $payment_found = true;
                    
                    // Only allow updates if currently pending
                    if ($payment['recipient_confirmation']['confirmation_status'] === 'pending') {
                        $payment['recipient_confirmation'] = [
                            'confirmed_at' => date('c'),
                            'confirmation_status' => $status,
                            'recipient_notes' => $recipient_notes
                        ];
                        $payment_updated = true;
                    }
                    break 2; // Break out of both loops
                }
            }
        }
    }
    
    if (!$payment_found) {
        sendResponse(false, null, 'Payment not found or you do not have permission to confirm this payment');
    }
    
    if (!$payment_updated) {
        sendResponse(false, null, 'Payment has already been confirmed and cannot be updated');
    }
    
    // Update metadata
    $data['last_updated'] = date('c');
    
    // Save updated data
    if (!file_put_contents($data_file, json_encode($data, JSON_PRETTY_PRINT))) {
        sendResponse(false, null, 'Failed to save confirmation');
    }
    
    sendResponse(true, [
        'payment_id' => $payment_id,
        'confirmation_status' => $status,
        'confirmed_at' => date('c')
    ], null);
    
} catch (Exception $e) {
    sendResponse(false, null, 'Error: ' . $e->getMessage());
}
?>