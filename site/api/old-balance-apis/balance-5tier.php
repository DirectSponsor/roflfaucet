<?php
/**
 * ROFLFaucet 5-Tier Balance System
 * 
 * Storage Architecture:
 * - detailed/{userId}-{YYYY-MM-DD-HH}.json    # Raw transactions (1 hour retention)
 * - hourly/{userId}-{YYYY-MM-DD}.json         # 24 hourly aggregates (1 day retention)  
 * - daily/{userId}-{YYYY-MM-DD}.json          # Daily summaries (7 days retention)
 * - weekly/{userId}-{YYYY-MM-DD}.json         # Weekly summaries (4 weeks retention)
 * - monthly/{userId}-{YYYY-MM}.json           # Monthly summaries (permanent)
 * 
 * This ensures minimal storage while maintaining detailed analytics
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configuration
define('BASE_DIR', __DIR__ . '/../userdata/balance-tiers');
define('DETAILED_DIR', BASE_DIR . '/detailed');
define('HOURLY_DIR', BASE_DIR . '/hourly');
define('DAILY_DIR', BASE_DIR . '/daily');
define('WEEKLY_DIR', BASE_DIR . '/weekly');
define('MONTHLY_DIR', BASE_DIR . '/monthly');

/**
 * Ensure all tier directories exist
 */
function ensureDirectories() {
    $dirs = [BASE_DIR, DETAILED_DIR, HOURLY_DIR, DAILY_DIR, WEEKLY_DIR, MONTHLY_DIR];
    foreach ($dirs as $dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }
}

/**
 * Get user ID from request
 */
function getUserId() {
    if (!empty($_GET['user_id'])) return $_GET['user_id'];
    if (!empty($_POST['user_id'])) return $_POST['user_id'];
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!empty($input['user_id'])) return $input['user_id'];
    
    return null;
}

/**
 * Get current balance from all tiers (most recent source wins)
 */
function getCurrentBalance($userId) {
    $currentHour = date('Y-m-d-H');
    $today = date('Y-m-d');
    
    // Check detailed tier first (most recent)
    $detailedFile = DETAILED_DIR . "/{$userId}-{$currentHour}.json";
    if (file_exists($detailedFile)) {
        $data = json_decode(file_get_contents($detailedFile), true);
        return $data['balance'] ?? 0;
    }
    
    // Check hourly tier
    $hourlyFile = HOURLY_DIR . "/{$userId}-{$today}.json";
    if (file_exists($hourlyFile)) {
        $data = json_decode(file_get_contents($hourlyFile), true);
        $hourData = $data['hours'][intval(date('H'))] ?? null;
        if ($hourData) return $hourData['ending_balance'] ?? 0;
    }
    
    // Check daily tier for recent days
    for ($i = 0; $i < 7; $i++) {
        $checkDate = date('Y-m-d', strtotime("-{$i} days"));
        $dailyFile = DAILY_DIR . "/{$userId}-{$checkDate}.json";
        if (file_exists($dailyFile)) {
            $data = json_decode(file_get_contents($dailyFile), true);
            return $data['ending_balance'] ?? 0;
        }
    }
    
    return 0; // New user
}

/**
 * Add transaction to detailed tier
 */
function addTransaction($userId, $amount, $source, $description = null) {
    ensureDirectories();
    
    $currentHour = date('Y-m-d-H');
    $detailedFile = DETAILED_DIR . "/{$userId}-{$currentHour}.json";
    
    // Load or create detailed file for current hour
    $data = ['balance' => getCurrentBalance($userId), 'transactions' => []];
    if (file_exists($detailedFile)) {
        $data = json_decode(file_get_contents($detailedFile), true) ?: $data;
    }
    
    // Add transaction
    $data['balance'] = max(0, $data['balance'] + $amount);
    $data['transactions'][] = [
        'amount' => $amount,
        'source' => $source,
        'timestamp' => time(),
        'description' => $description ?: generateDescription($amount, $source)
    ];
    
    // Save detailed file
    file_put_contents($detailedFile, json_encode($data, JSON_PRETTY_PRINT));
    
    // Trigger rollups if needed
    triggerRollupsIfNeeded($userId);
    
    return $data['balance'];
}

/**
 * Generate description for transaction
 */
function generateDescription($amount, $source) {
    if ($amount > 0) {
        return "Earned " . number_format($amount, 2) . " from " . $source;
    } else {
        return "Spent " . number_format(abs($amount), 2) . " on " . $source;
    }
}

/**
 * Trigger rollups if needed based on time boundaries
 */
function triggerRollupsIfNeeded($userId) {
    // Check if we need to rollup based on time
    $lastHour = date('Y-m-d-H', strtotime('-1 hour'));
    $yesterday = date('Y-m-d', strtotime('-1 day'));
    $lastWeek = date('Y-m-d', strtotime('-1 week'));
    $lastMonth = date('Y-m', strtotime('-1 month'));
    
    // Rollup last hour to hourly tier
    rollupDetailedToHourly($userId, $lastHour);
    
    // Rollup yesterday to daily tier
    rollupHourlyToDaily($userId, $yesterday);
    
    // Rollup last week to weekly tier (on Mondays)
    if (date('N') == 1) { // Monday
        rollupDailyToWeekly($userId, $lastWeek);
    }
    
    // Rollup last month to monthly tier (on 1st of month)
    if (date('j') == 1) { // 1st day of month
        rollupWeeklyToMonthly($userId, $lastMonth);
    }
    
    // Clean up old files
    cleanupOldFiles($userId);
}

/**
 * Rollup detailed transactions to hourly aggregates
 */
function rollupDetailedToHourly($userId, $hourKey) {
    $detailedFile = DETAILED_DIR . "/{$userId}-{$hourKey}.json";
    if (!file_exists($detailedFile)) return;
    
    $detailedData = json_decode(file_get_contents($detailedFile), true);
    if (!$detailedData || empty($detailedData['transactions'])) return;
    
    $date = substr($hourKey, 0, 10); // Extract YYYY-MM-DD
    $hour = intval(substr($hourKey, 11, 2)); // Extract hour
    
    $hourlyFile = HOURLY_DIR . "/{$userId}-{$date}.json";
    $hourlyData = ['date' => $date, 'hours' => []];
    if (file_exists($hourlyFile)) {
        $hourlyData = json_decode(file_get_contents($hourlyFile), true) ?: $hourlyData;
    }
    
    // Aggregate hour data
    $hourStats = [
        'hour' => $hour,
        'transaction_count' => count($detailedData['transactions']),
        'total_wagered' => 0,
        'total_won' => 0,
        'games_played' => 0,
        'faucet_claims' => 0,
        'ending_balance' => $detailedData['balance']
    ];
    
    foreach ($detailedData['transactions'] as $tx) {
        $amount = $tx['amount'];
        $source = strtolower($tx['source']);
        
        if (strpos($source, 'faucet') !== false) {
            $hourStats['faucet_claims']++;
        } elseif ($amount < 0) {
            $hourStats['total_wagered'] += abs($amount);
            $hourStats['games_played']++;
        } elseif ($amount > 0 && strpos($source, 'win') !== false) {
            $hourStats['total_won'] += $amount;
        }
    }
    
    $hourlyData['hours'][$hour] = $hourStats;
    file_put_contents($hourlyFile, json_encode($hourlyData, JSON_PRETTY_PRINT));
    
    // Delete processed detailed file
    unlink($detailedFile);
}

/**
 * Rollup hourly data to daily summaries
 */
function rollupHourlyToDaily($userId, $date) {
    $hourlyFile = HOURLY_DIR . "/{$userId}-{$date}.json";
    if (!file_exists($hourlyFile)) return;
    
    $hourlyData = json_decode(file_get_contents($hourlyFile), true);
    if (!$hourlyData || empty($hourlyData['hours'])) return;
    
    $dailyFile = DAILY_DIR . "/{$userId}-{$date}.json";
    
    // Aggregate daily stats
    $dailyStats = [
        'date' => $date,
        'transaction_count' => 0,
        'total_wagered' => 0,
        'total_won' => 0,
        'games_played' => 0,
        'faucet_claims' => 0,
        'ending_balance' => 0,
        'hourly_breakdown' => []
    ];
    
    foreach ($hourlyData['hours'] as $hour => $stats) {
        $dailyStats['transaction_count'] += $stats['transaction_count'];
        $dailyStats['total_wagered'] += $stats['total_wagered'];
        $dailyStats['total_won'] += $stats['total_won'];
        $dailyStats['games_played'] += $stats['games_played'];
        $dailyStats['faucet_claims'] += $stats['faucet_claims'];
        $dailyStats['ending_balance'] = $stats['ending_balance']; // Last hour wins
        
        $dailyStats['hourly_breakdown'][$hour] = [
            'wagered' => $stats['total_wagered'],
            'won' => $stats['total_won'],
            'games' => $stats['games_played']
        ];
    }
    
    file_put_contents($dailyFile, json_encode($dailyStats, JSON_PRETTY_PRINT));
    
    // Delete processed hourly file
    unlink($hourlyFile);
}

/**
 * Rollup daily data to weekly summaries
 */
function rollupDailyToWeekly($userId, $weekStartDate) {
    $weeklyStats = [
        'week_start' => $weekStartDate,
        'transaction_count' => 0,
        'total_wagered' => 0,
        'total_won' => 0,
        'games_played' => 0,
        'faucet_claims' => 0,
        'ending_balance' => 0,
        'daily_breakdown' => []
    ];
    
    // Process 7 days
    for ($i = 0; $i < 7; $i++) {
        $checkDate = date('Y-m-d', strtotime($weekStartDate . " +{$i} days"));
        $dailyFile = DAILY_DIR . "/{$userId}-{$checkDate}.json";
        
        if (file_exists($dailyFile)) {
            $dailyData = json_decode(file_get_contents($dailyFile), true);
            if ($dailyData) {
                $weeklyStats['transaction_count'] += $dailyData['transaction_count'];
                $weeklyStats['total_wagered'] += $dailyData['total_wagered'];
                $weeklyStats['total_won'] += $dailyData['total_won'];
                $weeklyStats['games_played'] += $dailyData['games_played'];
                $weeklyStats['faucet_claims'] += $dailyData['faucet_claims'];
                $weeklyStats['ending_balance'] = $dailyData['ending_balance']; // Last day wins
                
                $weeklyStats['daily_breakdown'][$checkDate] = [
                    'wagered' => $dailyData['total_wagered'],
                    'won' => $dailyData['total_won'],
                    'games' => $dailyData['games_played']
                ];
                
                unlink($dailyFile); // Clean up
            }
        }
    }
    
    if ($weeklyStats['transaction_count'] > 0) {
        $weeklyFile = WEEKLY_DIR . "/{$userId}-{$weekStartDate}.json";
        file_put_contents($weeklyFile, json_encode($weeklyStats, JSON_PRETTY_PRINT));
    }
}

/**
 * Rollup weekly data to monthly summaries
 */
function rollupWeeklyToMonthly($userId, $monthKey) {
    $monthlyStats = [
        'month' => $monthKey,
        'transaction_count' => 0,
        'total_wagered' => 0,
        'total_won' => 0,
        'games_played' => 0,
        'faucet_claims' => 0,
        'ending_balance' => 0,
        'weekly_breakdown' => []
    ];
    
    // Find all weekly files for this month
    $weeklyFiles = glob(WEEKLY_DIR . "/{$userId}-{$monthKey}-*.json");
    
    foreach ($weeklyFiles as $weeklyFile) {
        $weeklyData = json_decode(file_get_contents($weeklyFile), true);
        if ($weeklyData) {
            $monthlyStats['transaction_count'] += $weeklyData['transaction_count'];
            $monthlyStats['total_wagered'] += $weeklyData['total_wagered'];
            $monthlyStats['total_won'] += $weeklyData['total_won'];
            $monthlyStats['games_played'] += $weeklyData['games_played'];
            $monthlyStats['faucet_claims'] += $weeklyData['faucet_claims'];
            $monthlyStats['ending_balance'] = $weeklyData['ending_balance']; // Last week wins
            
            $weekStart = basename($weeklyFile, '.json');
            $weekStart = substr($weekStart, strlen($userId) + 1); // Remove userId prefix
            $monthlyStats['weekly_breakdown'][$weekStart] = [
                'wagered' => $weeklyData['total_wagered'],
                'won' => $weeklyData['total_won'],
                'games' => $weeklyData['games_played']
            ];
            
            unlink($weeklyFile); // Clean up
        }
    }
    
    if ($monthlyStats['transaction_count'] > 0) {
        $monthlyFile = MONTHLY_DIR . "/{$userId}-{$monthKey}.json";
        file_put_contents($monthlyFile, json_encode($monthlyStats, JSON_PRETTY_PRINT));
    }
}

/**
 * Clean up old files beyond retention periods
 */
function cleanupOldFiles($userId) {
    // Detailed files: older than 1 hour
    $cutoffHour = date('Y-m-d-H', strtotime('-2 hours'));
    $files = glob(DETAILED_DIR . "/{$userId}-*.json");
    foreach ($files as $file) {
        $hourKey = basename($file, '.json');
        $hourKey = substr($hourKey, strlen($userId) + 1); // Remove userId prefix
        if ($hourKey < $cutoffHour) {
            unlink($file);
        }
    }
    
    // Hourly files: older than 1 day
    $cutoffDay = date('Y-m-d', strtotime('-2 days'));
    $files = glob(HOURLY_DIR . "/{$userId}-*.json");
    foreach ($files as $file) {
        $dateKey = basename($file, '.json');
        $dateKey = substr($dateKey, strlen($userId) + 1); // Remove userId prefix
        if ($dateKey < $cutoffDay) {
            unlink($file);
        }
    }
    
    // Daily files: older than 7 days
    $cutoffWeek = date('Y-m-d', strtotime('-8 days'));
    $files = glob(DAILY_DIR . "/{$userId}-*.json");
    foreach ($files as $file) {
        $dateKey = basename($file, '.json');
        $dateKey = substr($dateKey, strlen($userId) + 1); // Remove userId prefix
        if ($dateKey < $cutoffWeek) {
            unlink($file);
        }
    }
    
    // Weekly files: older than 4 weeks
    $cutoffMonth = date('Y-m-d', strtotime('-5 weeks'));
    $files = glob(WEEKLY_DIR . "/{$userId}-*.json");
    foreach ($files as $file) {
        $dateKey = basename($file, '.json');
        $dateKey = substr($dateKey, strlen($userId) + 1); // Remove userId prefix
        if ($dateKey < $cutoffMonth) {
            unlink($file);
        }
    }
}

// Main API Logic
$userId = getUserId();
if (!$userId) {
    http_response_code(401);
    echo json_encode(['error' => 'User ID required']);
    exit;
}

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'balance') {
    // Get current balance and recent activity
    $balance = getCurrentBalance($userId);
    
    // Get recent transactions from detailed tier
    $currentHour = date('Y-m-d-H');
    $detailedFile = DETAILED_DIR . "/{$userId}-{$currentHour}.json";
    $recentTransactions = [];
    
    if (file_exists($detailedFile)) {
        $data = json_decode(file_get_contents($detailedFile), true);
        $recentTransactions = array_slice($data['transactions'] ?? [], -10); // Last 10
    }
    
    echo json_encode([
        'success' => true,
        'balance' => $balance,
        'recent_transactions' => $recentTransactions,
        'tier_system' => '5-tier enhanced (1h→24h→7d→4w→∞)'
    ]);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update_balance') {
    // Add transaction and update balance
    $input = json_decode(file_get_contents('php://input'), true);
    $amount = floatval($input['amount'] ?? 0);
    $source = $input['source'] ?? 'manual';
    $description = $input['description'] ?? null;
    
    $newBalance = addTransaction($userId, $amount, $source, $description);
    
    echo json_encode([
        'success' => true,
        'new_balance' => $newBalance,
        'transaction_logged' => true,
        'message' => 'Balance updated with 5-tier rollup system'
    ]);
    
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Invalid action or method']);
}
?>