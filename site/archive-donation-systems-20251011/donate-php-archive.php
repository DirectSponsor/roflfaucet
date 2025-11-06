<?php
// ROFLFaucet Donation System - Flat File PHP Implementation
// Follows design principles: minimal resources, filesystem over database

// Create data directories if they don't exist
$dataDir = __DIR__ . '/data/donations';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Initialize data files
$files = [
    'donations.json' => [],
    'monthly-totals.json' => new stdClass(),
    'transparency.json' => [
        'totalDonated' => 0,
        'totalAllocated' => 0,
        'currentMonth' => 0,
        'recipients' => [],
        'lastDonation' => null
    ]
];

foreach ($files as $filename => $defaultData) {
    $filepath = $dataDir . '/' . $filename;
    if (!file_exists($filepath)) {
        file_put_contents($filepath, json_encode($defaultData, JSON_PRETTY_PRINT));
    }
}

// API endpoint handling
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove base path and script name to get endpoint
$basePath = '/payments/donate.php';
if (strpos($requestUri, $basePath) !== false) {
    $path = str_replace($basePath, '', $requestUri);
} else {
    $path = str_replace('/donate.php', '', $requestUri);
}

// Handle query parameter for action
if (empty($path) && isset($_GET['action'])) {
    $path = '/' . $_GET['action'];
}

// Default to create for POST requests
if (empty($path) && $method === 'POST') {
    $path = '/create';
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($method === 'OPTIONS') {
    exit(0);
}

switch ($path) {
    case '/create':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }
        createDonation();
        break;
        
    case '/stats':
        if ($method !== 'GET') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }
        getDonationStats();
        break;
        
    case '/recent':
        if ($method !== 'GET') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }
        getRecentDonations();
        break;
        
    case '/test-payment':
    case '/test':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }
        processTestPayment();
        break;
        
    case '/check':
    case '/status':
        if ($method !== 'GET') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit;
        }
        checkPaymentStatus();
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
        exit;
}

function createDonation() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Pure sats input - much simpler!
    $sats = null;
    if (isset($input['amount_sats'])) {
        $sats = intval($input['amount_sats']);
    } elseif (isset($input['amount'])) {
        // Convert USD to sats for backward compatibility
        $btcPrice = getCurrentBitcoinPrice();
        $sats = round(($input['amount'] / $btcPrice) * 100000000);
    }
    
    if (!$sats || $sats <= 0 || $sats > 10000000) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid sats amount (1-10M sats)']);
        return;
    }
    
    $donationId = 'don_' . bin2hex(random_bytes(8));
    $timestamp = date('c');
    
    // Create donation record (pure sats)
    $donation = [
        'id' => $donationId,
        'amount_sats' => $sats,
        'memo' => $input['memo'] ?? "ROFLFaucet donation - {$sats} sats",
        'donor' => $input['donor']['name'] ?? 'Anonymous',
        'email' => $input['donor']['email'] ?? null,
        'status' => 'pending',
        'created' => $timestamp,
        'expires' => date('c', strtotime('+1 hour'))
    ];
    
    // Save pending donation FIRST (so it exists for status checking)
    savePendingDonation($donation);
    
    // Create real Coinos Lightning invoice
    $coinosInvoice = createCoinosInvoiceFromSats($sats, $donation['memo']);
    
    if (!$coinosInvoice) {
        // Remove the pending donation if invoice creation fails
        removePendingDonation($donationId);
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create Lightning invoice']);
        return;
    }
    
    // Update donation record with payment info
    $donation['payment_hash'] = $coinosInvoice['paymentHash'];
    $donation['coinos_invoice_id'] = $coinosInvoice['id'];
    
    // Update the saved donation with payment hash
    updatePendingDonation($donation);
    
    // Create invoice response (pure sats)
    $invoice = [
        'id' => $donationId,
        'amount_sats' => $sats,
        'bolt11' => $coinosInvoice['text'],
        'payment_hash' => $coinosInvoice['paymentHash'],
        'qr_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . urlencode($coinosInvoice['text']),
        'expires_at' => $donation['expires']
    ];
    
    echo json_encode([
        'success' => true,
        'invoice' => $invoice
    ]);
}

function getDonationStats() {
    global $dataDir;
    
    $transparency = json_decode(file_get_contents($dataDir . '/transparency.json'), true);
    $monthlyTotals = json_decode(file_get_contents($dataDir . '/monthly-totals.json'), true);
    
    $currentMonth = date('Y-m');
    $thisMonth = $monthlyTotals[$currentMonth] ?? ['totalUSD' => 0, 'count' => 0];
    
    $stats = [
        'totalAllTime' => $transparency['totalDonated'],
        'totalThisMonth' => $thisMonth['totalUSD'],
        'donationCount' => $thisMonth['count'],
        'lastDonation' => $transparency['lastDonation'],
        'nextAllocation' => date('Y-m-01', strtotime('+1 month'))
    ];
    
    echo json_encode($stats);
}

// Coinos API Integration
function createCoinosInvoice($amountUsd, $memo) {
    // Coinos API token (should be in config/env in production)
    $token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU0MjM5MGI4LTNkYTctNDQwNi05ZjYxLTgyZDIxZTExNGRmOCIsImlhdCI6MTc1ODc0NDI0MH0.k-ewIkwfKECv9J39QbTT9bsP1K_wKTvnV1iGyuc1ptY';
    
    // Convert USD to sats (get current rate from API)
    $btcPrice = getCurrentBitcoinPrice();
    $sats = round(($amountUsd / $btcPrice) * 100000000);
    
    $data = [
        'invoice' => [
            'amount' => $sats,
            'type' => 'lightning',
            'webhook' => 'https://roflfaucet.com/payments/webhook.php',
            'secret' => 'roflfaucet_webhook_secret_2024'
        ]
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://coinos.io/api/invoice');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        error_log("Coinos API error: HTTP $httpCode - $response");
        return false;
    }
    
    $invoice = json_decode($response, true);
    return $invoice ?: false;
}

function createCoinosInvoiceFromSats($sats, $memo) {
    // Create invoice directly from sats amount (no USD conversion)
    $token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU0MjM5MGI4LTNkYTctNDQwNi05ZjYxLTgyZDIxZTExNGRmOCIsImlhdCI6MTc1ODc0NDI0MH0.k-ewIkwfKECv9J39QbTT9bsP1K_wKTvnV1iGyuc1ptY';
    
    $data = [
        'invoice' => [
            'amount' => $sats,
            'type' => 'lightning',
            'webhook' => 'https://roflfaucet.com/payments/webhook.php',
            'secret' => 'roflfaucet_webhook_secret_2024'
        ]
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://coinos.io/api/invoice');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        error_log("Coinos API error: HTTP $httpCode - $response");
        return false;
    }
    
    $invoice = json_decode($response, true);
    return $invoice ?: false;
}

function getCurrentBitcoinPrice() {
    // Try to get current price from CoinGecko
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    if ($response) {
        $data = json_decode($response, true);
        if (isset($data['bitcoin']['usd'])) {
            return $data['bitcoin']['usd'];
        }
    }
    
    // Fallback price if API fails
    return 65000;
}

function checkCoinosInvoiceStatus($donation) {
    // Check if invoice has been paid via Coinos API
    if (!isset($donation['coinos_invoice_id'])) {
        return 'pending';
    }
    
    $token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU0MjM5MGI4LTNkYTctNDQwNi05ZjYxLTgyZDIxZTExNGRmOCIsImlhdCI6MTc1ODc0NDI0MH0.k-ewIkwfKECv9J39QbTT9bsP1K_wKTvnV1iGyuc1ptY';
    $invoiceId = $donation['coinos_invoice_id'];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://coinos.io/api/invoice/{$invoiceId}");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200 && $response) {
        $data = json_decode($response, true);
        if ($data && isset($data['received']) && $data['received'] > 0) {
            return 'paid';
        }
    }
    
    return 'pending';
}

function markInvoiceAsPaid($donation, &$pendingDonations) {
    global $dataDir;
    
    // Update donation status
    $donation['status'] = 'paid';
    $donation['paid_at'] = date('c');
    
    // Add to completed donations
    $donationsFile = $dataDir . '/donations.json';
    $donations = file_exists($donationsFile) ? json_decode(file_get_contents($donationsFile), true) : [];
    $donations[] = $donation;
    file_put_contents($donationsFile, json_encode($donations, JSON_PRETTY_PRINT));
    
    // Remove from pending donations
    $pendingFile = $dataDir . '/pending-donations.json';
    $pendingDonations = array_filter($pendingDonations, function($p) use ($donation) {
        return $p['id'] !== $donation['id'];
    });
    file_put_contents($pendingFile, json_encode(array_values($pendingDonations), JSON_PRETTY_PRINT));
    
    // Update transparency data
    updateTransparencyTotals($donation);
}

function getRecentDonations() {
    global $dataDir;
    
    $limit = intval($_GET['limit'] ?? 10);
    $donationsFile = $dataDir . '/donations.json';
    
    if (!file_exists($donationsFile)) {
        echo json_encode([]);
        return;
    }
    
    $donations = json_decode(file_get_contents($donationsFile), true);
    $recent = array_slice(array_reverse($donations), 0, $limit);
    
    $result = array_map(function($d) {
        return [
            'donor' => $d['donor'] === 'Anonymous' ? 'Anonymous' : substr($d['donor'], 0, 20) . '...',
            'amount' => $d['usdAmount'],
            'timestamp' => $d['paidAt']
        ];
    }, $recent);
    
    echo json_encode($result);
}

function processTestPayment() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['donationId']) || !isset($input['amount'])) {
        http_response_code(400);
        echo json_encode(['error' => 'donationId and amount are required']);
        return;
    }
    
    // Simulate payment processing
    $paymentData = [
        'invoice_id' => $input['donationId'],
        'amount' => $input['amount'],
        'usdAmount' => $input['amount'],
        'status' => 'paid',
        'paid_at' => date('c'),
        'donor' => 'Test Donor',
        'memo' => 'Test donation',
        'txid' => 'test_tx_' . time(),
        'payment_hash' => 'test_hash_' . time()
    ];
    
    processDonationPayment($paymentData);
    
    echo json_encode(['success' => true, 'message' => 'Test payment processed']);
}

function savePendingDonation($donation) {
    global $dataDir;
    
    $pendingFile = $dataDir . '/pending-donations.json';
    $pending = file_exists($pendingFile) ? json_decode(file_get_contents($pendingFile), true) : [];
    
    $pending[] = $donation;
    file_put_contents($pendingFile, json_encode($pending, JSON_PRETTY_PRINT));
}

function updatePendingDonation($updatedDonation) {
    global $dataDir;
    
    $pendingFile = $dataDir . '/pending-donations.json';
    if (!file_exists($pendingFile)) {
        return;
    }
    
    $pending = json_decode(file_get_contents($pendingFile), true);
    
    // Find and update the donation
    foreach ($pending as &$donation) {
        if ($donation['id'] === $updatedDonation['id']) {
            $donation = $updatedDonation;
            break;
        }
    }
    
    file_put_contents($pendingFile, json_encode($pending, JSON_PRETTY_PRINT));
}

function processDonationPayment($paymentData) {
    global $dataDir;
    
    $donation = [
        'id' => $paymentData['invoice_id'],
        'amount' => $paymentData['amount'],
        'usdAmount' => $paymentData['usdAmount'],
        'donor' => $paymentData['donor'] ?? 'Anonymous',
        'email' => $paymentData['email'] ?? null,
        'memo' => $paymentData['memo'] ?? '',
        'status' => 'completed',
        'paidAt' => $paymentData['paid_at'],
        'txid' => $paymentData['txid'] ?? null,
        'paymentHash' => $paymentData['payment_hash'] ?? null
    ];
    
    // Add to donations history
    addDonationToHistory($donation);
    
    // Update monthly totals
    updateMonthlyTotals($donation);
    
    // Update transparency data
    updateTransparencyData($donation);
    
    // Remove from pending
    removePendingDonation($donation['id']);
    
    error_log("Donation processed: $" . $donation['usdAmount'] . " from " . $donation['donor']);
}

function addDonationToHistory($donation) {
    global $dataDir;
    
    $donationsFile = $dataDir . '/donations.json';
    $donations = file_exists($donationsFile) ? json_decode(file_get_contents($donationsFile), true) : [];
    
    $donations[] = $donation;
    
    // Keep only last 1000 donations to prevent file from getting too large
    if (count($donations) > 1000) {
        $donations = array_slice($donations, -1000);
    }
    
    file_put_contents($donationsFile, json_encode($donations, JSON_PRETTY_PRINT));
}

function updateMonthlyTotals($donation) {
    global $dataDir;
    
    $totalsFile = $dataDir . '/monthly-totals.json';
    $totals = file_exists($totalsFile) ? json_decode(file_get_contents($totalsFile), true) : [];
    
    $month = substr($donation['paidAt'], 0, 7); // YYYY-MM
    
    if (!isset($totals[$month])) {
        $totals[$month] = [
            'totalUSD' => 0,
            'totalBTC' => 0,
            'count' => 0,
            'donations' => []
        ];
    }
    
    $totals[$month]['totalUSD'] += $donation['usdAmount'];
    $totals[$month]['totalBTC'] += $donation['amount'] / 100000000; // Convert sats to BTC
    $totals[$month]['count']++;
    $totals[$month]['donations'][] = [
        'id' => $donation['id'],
        'amount' => $donation['usdAmount'],
        'donor' => $donation['donor'],
        'timestamp' => $donation['paidAt']
    ];
    
    file_put_contents($totalsFile, json_encode($totals, JSON_PRETTY_PRINT));
}

function updateTransparencyData($donation) {
    global $dataDir;
    
    $transparencyFile = $dataDir . '/transparency.json';
    $transparency = json_decode(file_get_contents($transparencyFile), true);
    
    $transparency['totalDonated'] += $donation['usdAmount'];
    $transparency['currentMonth'] += $donation['usdAmount'];
    $transparency['lastDonation'] = [
        'amount' => $donation['usdAmount'],
        'donor' => $donation['donor'],
        'timestamp' => $donation['paidAt']
    ];
    
    file_put_contents($transparencyFile, json_encode($transparency, JSON_PRETTY_PRINT));
}

function removePendingDonation($donationId) {
    global $dataDir;
    
    $pendingFile = $dataDir . '/pending-donations.json';
    
    if (file_exists($pendingFile)) {
        $pending = json_decode(file_get_contents($pendingFile), true);
        $pending = array_filter($pending, function($d) use ($donationId) {
            return $d['id'] !== $donationId;
        });
        
        file_put_contents($pendingFile, json_encode(array_values($pending), JSON_PRETTY_PRINT));
    }
}

function checkPaymentStatus() {
    if (!isset($_GET['invoiceId'])) {
        http_response_code(400);
        echo json_encode(['error' => 'invoiceId parameter required']);
        return;
    }
    
    $invoiceId = $_GET['invoiceId'];
    global $dataDir;
    
    // First check completed donations
    $donationsFile = $dataDir . '/donations.json';
    if (file_exists($donationsFile)) {
        $donations = json_decode(file_get_contents($donationsFile), true) ?: [];
        foreach ($donations as $donation) {
            if ($donation['id'] === $invoiceId) {
                echo json_encode([
                    'status' => 'paid',
                    'message' => 'Payment received!',
                    'amount_received' => $donation['amount_received_sats'] ?? $donation['amount'] ?? 0,
                    'paid_at' => $donation['paid_at'] ?? null
                ]);
                return;
            }
        }
    }
    
    // Check pending donations
    $pendingFile = $dataDir . '/pending-donations.json';
    if (file_exists($pendingFile)) {
        $pending = json_decode(file_get_contents($pendingFile), true) ?: [];
        foreach ($pending as $donation) {
            if ($donation['id'] === $invoiceId) {
                // Check if expired
                if (isset($donation['expires']) && strtotime($donation['expires']) < time()) {
                    echo json_encode([
                        'status' => 'expired',
                        'message' => 'Invoice expired'
                    ]);
                    return;
                }
                
                // Try to check payment status via Coinos API
                $paymentStatus = checkCoinosInvoiceStatus($donation);
                if ($paymentStatus === 'paid') {
                    // Move from pending to completed
                    markInvoiceAsPaid($donation, $pending);
                    echo json_encode([
                        'status' => 'paid',
                        'message' => 'Payment received!',
                        'amount_received' => $donation['amount_sats'] ?? 0
                    ]);
                    return;
                }
                
                // Still pending
                $elapsed = time() - strtotime($donation['created']);
                echo json_encode([
                    'status' => 'pending',
                    'message' => 'Waiting for payment...',
                    'elapsed' => $elapsed
                ]);
                return;
            }
        }
    }
    
    echo json_encode([
        'status' => 'not_found',
        'message' => 'Invoice not found or expired'
    ]);
}

// Real Coinos API check function (for future use)
function checkCoinosPaymentStatus($invoiceId) {
    // This would be the real implementation:
    // $url = "https://coinos.io/api/invoice/{$invoiceId}";
    // $response = file_get_contents($url);
    // $data = json_decode($response, true);
    // return $data['status'] === 'paid';
    
    return false; // Placeholder
}

// For sats-based donations (used by webhook system)
function updateTransparencyTotals($donation) {
    global $dataDir;
    $transparencyFile = $dataDir . '/transparency.json';
    
    $transparency = [
        'totalDonated' => 0,
        'totalAllocated' => 0,
        'currentMonth' => 0,
        'recipients' => [],
        'lastDonation' => null
    ];
    
    if (file_exists($transparencyFile)) {
        $transparency = json_decode(file_get_contents($transparencyFile), true) ?: $transparency;
    }
    
    // Add to total (convert sats to USD approximately)
    $amountUsd = ($donation['amount_sats'] ?? 0) * 0.0001; // Rough conversion
    $transparency['totalDonated'] += $amountUsd;
    $transparency['lastDonation'] = [
        'amount' => $amountUsd,
        'amount_sats' => $donation['amount_sats'] ?? 0,
        'donor' => $donation['donor'],
        'timestamp' => $donation['paid_at']
    ];
    
    file_put_contents($transparencyFile, json_encode($transparency, JSON_PRETTY_PRINT));
}
?>
