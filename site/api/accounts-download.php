<?php
/**
 * ROFLFaucet Accounts Download API
 * Exports recipient transaction data in CSV or JSON format
 * Created: 2025-10-12
 */

/**
 * Get all transactions directly from simple ledger file (fast and simple)
 */
function getAllTransactionsForExport() {
    $ledgerFile = __DIR__ . '/../site/data/accounts-ledger.json';
    
    if (!file_exists($ledgerFile)) {
        return [];
    }
    
    $content = @file_get_contents($ledgerFile);
    if ($content === false) {
        return [];
    }
    
    $transactions = json_decode($content, true);
    return is_array($transactions) ? $transactions : [];
}

/**
 * Export as CSV
 */
function exportCSV($transactions) {
    $filename = 'roflfaucet-accounts-' . date('Y-m-d') . '.csv';
    
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=' . $filename);
    
    $output = fopen('php://output', 'w');
    
    // CSV headers
    fputcsv($output, [
        'Date',
        'Type',
        'Amount_Sats',
        'Project',
        'Donor',
        'Recipient',
        'Method',
        'Source',
        'Notes',
        'Transaction_ID'
    ]);
    
    // Sort by timestamp (newest first)
    usort($transactions, function($a, $b) {
        return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });
    
    // Output data
    foreach ($transactions as $tx) {
        fputcsv($output, [
            $tx['timestamp'],
            $tx['type'],
            $tx['amount_sats'],
            $tx['project_id'] ?? '',
            $tx['donor_name'] ?? '',
            $tx['recipient_name'] ?? '',
            $tx['payment_method'],
            $tx['source'] ?? '',
            $tx['notes'] ?? '',
            $tx['id']
        ]);
    }
    
    fclose($output);
}

/**
 * Export as JSON
 */
function exportJSON($transactions) {
    $filename = 'roflfaucet-accounts-' . date('Y-m-d') . '.json';
    
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename=' . $filename);
    
    // Sort by timestamp (newest first)
    usort($transactions, function($a, $b) {
        return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });
    
    $exportData = [
        'export_info' => [
            'generated_at' => date('c'),
            'description' => 'ROFLFaucet recipient transaction accounts',
            'total_transactions' => count($transactions),
            'format' => 'JSON'
        ],
        'transactions' => $transactions
    ];
    
    echo json_encode($exportData, JSON_PRETTY_PRINT);
}

// Main export handling
try {
    $format = $_GET['format'] ?? 'csv';
    $transactions = getAllTransactionsForExport();
    
    if (empty($transactions)) {
        // No data available
        header('Content-Type: text/plain');
        echo "No recipient transaction data available for export.\n";
        echo "This export shows actual payments to recipients only.\n";
        echo "Site income donations remain in the 'kitty' until distributed.\n";
        exit;
    }
    
    switch (strtolower($format)) {
        case 'csv':
            exportCSV($transactions);
            break;
            
        case 'json':
            exportJSON($transactions);
            break;
            
        default:
            header('Content-Type: text/plain');
            http_response_code(400);
            echo "Invalid format. Use ?format=csv or ?format=json";
    }
    
} catch (Exception $e) {
    header('Content-Type: text/plain');
    http_response_code(500);
    echo "Export error: " . $e->getMessage();
}