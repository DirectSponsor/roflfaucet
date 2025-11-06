<?php
/**
 * SITE INCOME API - ROFLFaucet Operating Donations
 * Handles general donations to support site operations and monthly distributions
 * Completely separate from project-specific donations
 * Updated: 2025-10-11 - Clean separation from project system
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Configuration
define('COINOS_API_URL', 'https://coinos.io/api');
define('COINOS_API_KEY', getenv('COINOS_API_KEY') ?: 'your-api-key-here');
// ROFLFaucet Data Directory Configuration
define('ROFLFAUCET_DATA_DIR', '/var/roflfaucet-data');

define('WEBHOOK_URL', 'https://roflfaucet.com/webhook.php'); // Smart webhook handles both systems
define('DATA_DIR', ROFLFAUCET_DATA_DIR . '/payments/data/site-income/');
define('LOG_FILE', ROFLFAUCET_DATA_DIR . '/logs/donate.log');

/**
 * Log donation API events
 */
function logDonate($message, $level = 'INFO') {
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$level] $message" . PHP_EOL;
    @file_put_contents(LOG_FILE, $logEntry, FILE_APPEND | LOCK_EX);
}

/**
 * Load JSON data from file with locking
 */
function loadJsonData($filename) {
    $filepath = DATA_DIR . $filename;
    if (!file_exists($filepath)) {
        return [];
    }
    
    $handle = fopen($filepath, 'r');
    if (!$handle || !flock($handle, LOCK_SH)) {
        return [];
    }
    
    $content = fread($handle, filesize($filepath) ?: 0);
    flock($handle, LOCK_UN);
    fclose($handle);
    
    return json_decode($content, true) ?: [];
}

/**
 * Save JSON data to file with locking
 */
function saveJsonData($filename, $data) {
    $filepath = DATA_DIR . $filename;
    $tempFile = $filepath . '.tmp';
    
    $handle = fopen($tempFile, 'w');
    if (!$handle || !flock($handle, LOCK_EX)) {
        return false;
    }
    
    fwrite($handle, json_encode($data, JSON_PRETTY_PRINT));
    flock($handle, LOCK_UN);
    fclose($handle);
    
    return rename($tempFile, $filepath);
}

/**
 * Rate limiting for invoice creation
 */
function checkRateLimit($ip, $maxAttempts = 10, $windowMinutes = 15) {
    $rateLimitFile = '/tmp/rate_limit_' . md5($ip) . '.json';
    $now = time();
    
    if (!file_exists($rateLimitFile)) {
        $data = ['attempts' => 1, 'first_attempt' => $now];
        file_put_contents($rateLimitFile, json_encode($data));
        return true;
    }
    
    $data = json_decode(file_get_contents($rateLimitFile), true) ?: [];
    $windowSeconds = $windowMinutes * 60;
    
    // Reset if window expired
    if (($now - $data['first_attempt']) > $windowSeconds) {
        $data = ['attempts' => 1, 'first_attempt' => $now];
        file_put_contents($rateLimitFile, json_encode($data));
        return true;
    }
    
    // Check if limit exceeded
    if ($data['attempts'] >= $maxAttempts) {
        $remainingTime = $windowSeconds - ($now - $data['first_attempt']);
        logDonate("Rate limit exceeded for IP $ip. Try again in " . ceil($remainingTime/60) . " minutes", 'WARNING');
        return false;
    }
    
    // Increment attempts
    $data['attempts']++;
    file_put_contents($rateLimitFile, json_encode($data));
    return true;
}

/**
 * Start background verification process for a payment
 */
function startBackgroundVerification($donationId) {
    $scriptPath = '/tmp/verify-single-payment.php';
    if (file_exists($scriptPath)) {
        $command = "php {$scriptPath} {$donationId} > /dev/null 2>&1 &";
        exec($command);
        logDonate("Started background verification for: $donationId");
    } else {
        logDonate("Background verification script not found: $scriptPath", 'WARNING');
    }
}

/**
 * Make API request to Coinos
 */
function coinosApiRequest($endpoint, $data = null, $method = 'GET') {
    $url = COINOS_API_URL . $endpoint;
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . COINOS_API_KEY,
            'Content-Type: application/json'
        ]
    ]);
    
    if ($method === 'POST' && $data) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        logDonate("CURL error: $error", 'ERROR');
        return false;
    }
    
    if ($httpCode >= 400) {
        logDonate("API error: HTTP $httpCode - $response", 'ERROR');
        return false;
    }
    
    return json_decode($response, true);
}

// Include transaction logger (fail-safe)
if (file_exists(__DIR__ . '/../scripts/transaction-logger.php')) {
    @include_once __DIR__ . '/../scripts/transaction-logger.php';
}

/**
 * Create Lightning invoice - Pure sats-based, no minimum restrictions
 */
function createInvoice($amountSats, $description, $donorName, $donorMessage = '') {
    logDonate("Creating invoice for $amountSats sats from $donorName");
    
    // Create invoice via Coinos API - correct format
    $invoiceData = [
        'invoice' => [
            'amount' => $amountSats, // Pure sats, no conversion
            'type' => 'lightning',
            'memo' => $description,
            'webhook' => WEBHOOK_URL,
            'secret' => 'roflfaucet_webhook_secret_2024'
        ]
    ];
    
    $response = coinosApiRequest('/invoice', $invoiceData, 'POST');
    
    if (!$response || !isset($response['text'])) {
        logDonate("Failed to create invoice", 'ERROR');
        return false;
    }
    
    // Generate unique donation ID
    $donationId = uniqid('donate_', true);
    
    // Store pending donation - pure sats record
    $donation = [
        'id' => $donationId,
        'donor_name' => $donorName,
        'donor_message' => $donorMessage,
        'amount_sats' => $amountSats, // Only sats, no USD conversion
        'invoice' => $response['text'],
        'payment_hash' => $response['hash'] ?? '',
        'coinos_id' => $response['id'] ?? '',
        'created_at' => date('Y-m-d H:i:s'),
        'status' => 'pending'
    ];
    
    // Add to pending donations
    $pending = loadJsonData('pending.json');
    $pending[] = $donation;
    
    if (!saveJsonData('pending.json', $pending)) {
        logDonate("Failed to save pending donation", 'ERROR');
        return false;
    }
    
    logDonate("Invoice created successfully: {$donation['id']} for {$amountSats} sats");
    
    // Site income donations are "kitty" money - only log when distributed to recipients
    // Individual site income donations stay in their own system (site-income.html)
    
    return [
        'donation_id' => $donationId,
        'invoice' => $response['text'],
        'amount_sats' => $amountSats,
        'qr_code' => "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" . urlencode($response['text'])
    ];
}

/**
 * Get recent site income donations
 */
function getRecentDonations($limit = 10) {
    $donations = loadJsonData('site-income.json');
    
    // Sort by confirmed_at or created_at (newest first)
    usort($donations, function($a, $b) {
        $dateA = $a['confirmed_at'] ?? $a['created_at'] ?? '1970-01-01 00:00:00';
        $dateB = $b['confirmed_at'] ?? $b['created_at'] ?? '1970-01-01 00:00:00';
        return strtotime($dateB) - strtotime($dateA);
    });
    
    // Limit results and format for display
    $recent = array_slice($donations, 0, $limit);
    
    $formatted = [];
    foreach ($recent as $donation) {
        $formatted[] = [
            'donor_name' => $donation['donor_name'] ?? 'Anonymous',
            'amount_sats' => intval($donation['amount_sats'] ?? 0),
            'donor_message' => $donation['donor_message'] ?? '',
            'created_at' => $donation['created_at'] ?? null,
            'confirmed_at' => $donation['confirmed_at'] ?? null,
            'status' => $donation['status'] ?? 'unknown'
        ];
    }
    
    return $formatted;
}

/**
 * Check payment status
 */
function checkPaymentStatus($donationId) {
    logDonate("Checking payment status for: $donationId");
    
    // Check if it's in confirmed donations
    $donations = loadJsonData('site-income.json');
    foreach ($donations as $donation) {
        if ($donation['id'] === $donationId) {
            logDonate("Payment found as confirmed: $donationId");
            return [
                'status' => 'paid',
                'confirmed_at' => $donation['confirmed_at'],
                'amount_sats' => $donation['amount_sats']
            ];
        }
    }
    
    // Check if it's still pending
    $pending = loadJsonData('pending.json');
    foreach ($pending as $donation) {
        if ($donation['id'] === $donationId) {
            // Check with Coinos API if we have the ID
            if (!empty($donation['coinos_id'])) {
                $invoiceStatus = coinosApiRequest('/invoice/' . $donation['coinos_id']);
                if ($invoiceStatus && isset($invoiceStatus['status'])) {
                    if ($invoiceStatus['status'] === 'paid') {
                        logDonate("Payment confirmed via API check: $donationId");
                        return ['status' => 'paid'];
                    }
                }
            }
            
            logDonate("Payment still pending: $donationId");
            return ['status' => 'pending'];
        }
    }
    
    logDonate("Payment not found: $donationId", 'WARNING');
    return ['status' => 'not_found'];
}

// Main API handling
try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Handle different actions
        if (isset($input['action'])) {
            switch ($input['action']) {
                case 'get_recent_donations':
                    $limit = intval($input['limit'] ?? 10);
                    $limit = min($limit, 50); // Max 50 donations
                    $recent = getRecentDonations($limit);
                    echo json_encode(['success' => true, 'data' => $recent]);
                    exit;
                    
                default:
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid action']);
                    exit;
            }
        }
        
        // Default: Create invoice (backward compatibility)
        if (!$input || !isset($input['amount_sats'], $input['donor_name'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields: amount_sats and donor_name']);
            exit;
        }
        
        $amountSats = intval($input['amount_sats']);
        $donorName = trim($input['donor_name']);
        $donorMessage = trim($input['donor_message'] ?? '');
        
        // Pure sats validation - allow any positive amount (even 1 sat)
        if ($amountSats < 1) {
            http_response_code(400);
            echo json_encode(['error' => 'Amount must be at least 1 sat']);
            exit;
        }
        
        // Reasonable maximum to prevent abuse
        if ($amountSats > 100000000) { // 1 BTC max
            http_response_code(400);
            echo json_encode(['error' => 'Amount too large - maximum 100M sats (1 BTC)']);
            exit;
        }
        
        if (empty($donorName) || strlen($donorName) > 50) {
            http_response_code(400);
            echo json_encode(['error' => 'Donor name required and must be under 50 characters']);
            exit;
        }
        
        // Rate limiting check
        $clientIp = $_SERVER['REMOTE_ADDR'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? 'unknown';
        if (!checkRateLimit($clientIp)) {
            http_response_code(429);
            echo json_encode(['error' => 'Too many invoice requests. Please try again in a few minutes.']);
            exit;
        }
        
        $description = "ROFLFaucet donation: {$amountSats} sats from {$donorName}";
        
        $result = createInvoice($amountSats, $description, $donorName, $donorMessage);
        
        if ($result) {
            // Start background verification process for this payment
            startBackgroundVerification($result['donation_id']);
            
            echo json_encode(['success' => true, 'data' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create Lightning invoice']);
        }
        
    } elseif ($method === 'GET') {
        // Check payment status
        $donationId = $_GET['donation_id'] ?? '';
        
        if (empty($donationId)) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing donation_id parameter']);
            exit;
        }
        
        $status = checkPaymentStatus($donationId);
        echo json_encode(['success' => true, 'data' => $status]);
        
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    logDonate("API error: " . $e->getMessage(), 'ERROR');
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}