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
    // Load manual distributions data
    $data_file = '../data/manual_distributions.json';
    
    if (!file_exists($data_file)) {
        sendResponse(true, [
            'distributions' => [],
            'summary' => [
                'total_payments' => 0,
                'total_amount_sats' => 0,
                'months_active' => 0
            ]
        ], null);
    }
    
    $data = json_decode(file_get_contents($data_file), true);
    
    if (!$data || !isset($data['distributions'])) {
        sendResponse(true, [
            'distributions' => [],
            'summary' => [
                'total_payments' => 0,
                'total_amount_sats' => 0,
                'months_active' => 0
            ]
        ], null);
    }
    
    // Format data for transparency display
    $all_payments = [];
    $confirmed_payments = 0;
    $pending_payments = 0;
    
    foreach ($data['distributions'] as $month => $month_data) {
        if (isset($month_data['payments'])) {
            foreach ($month_data['payments'] as $payment) {
                // Format payment for display
                $formatted_payment = [
                    'payment_id' => $payment['payment_id'],
                    'recipient_name' => $payment['recipient_name'],
                    'amount_sats' => $payment['amount_sats'],
                    'purpose' => $payment['purpose'],
                    'payment_date' => $payment['payment_date'],
                    'admin_notes' => $payment['admin_notes'] ?? '',
                    'confirmation_status' => $payment['recipient_confirmation']['confirmation_status'],
                    'confirmed_at' => $payment['recipient_confirmation']['confirmed_at'],
                    'recipient_notes' => $payment['recipient_confirmation']['recipient_notes'] ?? '',
                    'screenshot_path' => $payment['screenshot_path'] ?? null,
                    'month' => $month
                ];
                
                $all_payments[] = $formatted_payment;
                
                // Count statuses
                if ($payment['recipient_confirmation']['confirmation_status'] === 'received') {
                    $confirmed_payments++;
                } elseif ($payment['recipient_confirmation']['confirmation_status'] === 'pending') {
                    $pending_payments++;
                }
            }
        }
    }
    
    // Sort by payment_date (newest first)
    usort($all_payments, function($a, $b) {
        return strtotime($b['payment_date']) - strtotime($a['payment_date']);
    });
    
    // Create summary
    $summary = [
        'total_payments' => count($all_payments),
        'total_amount_sats' => $data['total_amount_sats'] ?? 0,
        'months_active' => count($data['distributions']),
        'confirmed_payments' => $confirmed_payments,
        'pending_payments' => $pending_payments,
        'last_updated' => $data['last_updated']
    ];
    
    sendResponse(true, [
        'distributions' => $all_payments,
        'summary' => $summary
    ], null);
    
} catch (Exception $e) {
    sendResponse(false, null, 'Error: ' . $e->getMessage());
}
?>