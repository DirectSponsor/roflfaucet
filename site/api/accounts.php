<?php
// ROFLFaucet Data Directory Configuration
define('ROFLFAUCET_DATA_DIR', '/var/roflfaucet-data');
define('DATA_DIR', ROFLFAUCET_DATA_DIR . '/data');

/**
 * ROFLFaucet Accounts API
 * Provides paginated access to recipient transaction data
 * Created: 2025-10-12
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

/**
 * Get paginated transaction data directly from project files
 */
function getAccountsData($page = 1, $limit = 50) {
    // Get all confirmed project donations directly from project files
    $allTransactions = getAllProjectDonations();
    
    if (empty($allTransactions)) {
        return [
            'success' => false,
            'transactions' => [],
            'pagination' => [
                'current_page' => 1,
                'total_pages' => 0,
                'total' => 0,
                'start' => 0,
                'end' => 0
            ]
        ];
    }
    
    // Sort by timestamp (newest first)
    usort($allTransactions, function($a, $b) {
        return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });
    
    // Calculate pagination
    $total = count($allTransactions);
    $totalPages = ceil($total / $limit);
    $page = max(1, min($page, $totalPages));
    $offset = ($page - 1) * $limit;
    
    // Get page slice
    $transactions = array_slice($allTransactions, $offset, $limit);
    
    return [
        'success' => true,
        'transactions' => $transactions,
        'pagination' => [
            'current_page' => $page,
            'total_pages' => $totalPages,
            'total' => $total,
            'start' => min($offset + 1, $total),
            'end' => min($offset + count($transactions), $total)
        ]
    ];
}

/**
 * Get all transactions directly from simple ledger file (fast and simple)
 */
function getAllProjectDonations() {
    $ledgerFile = DATA_DIR . '/accounts-ledger.json';
    
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

// Main API handling
try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        $page = intval($_GET['page'] ?? 1);
        $limit = intval($_GET['limit'] ?? 50);
        
        // Validate parameters
        $page = max(1, $page);
        $limit = max(1, min($limit, 200)); // Max 200 per page
        
        $result = getAccountsData($page, $limit);
        echo json_encode($result);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}