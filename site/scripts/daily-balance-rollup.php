#!/usr/bin/env php
<?php
/**
 * ROFLFaucet Daily Balance Rollup Script
 * 
 * This script runs daily via cron to:
 * 1. Process old transactions into monthly summaries
 * 2. Keep only recent transactions (7 days) in detailed form
 * 3. Maintain manageable file sizes
 * 
 * Usage: php daily-balance-rollup.php
 * Cron: 0 2 * * * /path/to/daily-balance-rollup.php
 */

// ROFLFaucet Data Directory Configuration
define('ROFLFAUCET_DATA_DIR', '/var/roflfaucet-data');
define('USERDATA_DIR', ROFLFAUCET_DATA_DIR . '/userdata/balances');

// Configuration
define('RETENTION_DAYS', 7); // Keep detailed transactions for 7 days

/**
 * Load balance data from file
 */
function loadBalanceData($balanceFile) {
    if (file_exists($balanceFile)) {
        $data = json_decode(file_get_contents($balanceFile), true);
        if ($data && is_array($data)) {
            return array_merge([
                'balance' => 10.0,
                'last_updated' => time(),
                'recent_transactions' => [],
                'monthly_totals' => []
            ], $data);
        }
    }
    return null; // Skip non-existent files
}

/**
 * Roll up old transactions into monthly summaries
 */
function rollupOldTransactions($data) {
    $cutoffTime = time() - (RETENTION_DAYS * 24 * 60 * 60);
    $keptTransactions = [];
    $transactionsToRollup = [];
    
    // Separate recent transactions from old ones
    foreach ($data['recent_transactions'] as $transaction) {
        if ($transaction['timestamp'] > $cutoffTime) {
            $keptTransactions[] = $transaction;
        } else {
            $transactionsToRollup[] = $transaction;
        }
    }
    
    $rolledUpCount = 0;
    
    // Roll up old transactions into monthly totals
    foreach ($transactionsToRollup as $transaction) {
        $monthKey = date('Y-m', $transaction['timestamp']);
        
        // Initialize month if doesn't exist
        if (!isset($data['monthly_totals'][$monthKey])) {
            $data['monthly_totals'][$monthKey] = [
                'total_bets' => 0,
                'total_wins' => 0,
                'total_wagered' => 0.0,
                'total_won' => 0.0,
                'faucet_claims' => 0,
                'games_played' => 0
            ];
        }
        
        // Categorize and aggregate transaction
        $source = strtolower($transaction['source']);
        $amount = floatval($transaction['amount']);
        
        if (strpos($source, 'faucet') !== false) {
            $data['monthly_totals'][$monthKey]['faucet_claims']++;
        } elseif (strpos($source, 'bet') !== false || $amount < 0) {
            $data['monthly_totals'][$monthKey]['total_bets']++;
            $data['monthly_totals'][$monthKey]['total_wagered'] += abs($amount);
            $data['monthly_totals'][$monthKey]['games_played']++;
        } elseif (strpos($source, 'win') !== false || $amount > 0) {
            $data['monthly_totals'][$monthKey]['total_wins']++;
            $data['monthly_totals'][$monthKey]['total_won'] += $amount;
        }
        
        $rolledUpCount++;
    }
    
    $data['recent_transactions'] = $keptTransactions;
    
    return [$data, $rolledUpCount];
}

/**
 * Save balance data to file
 */
function saveBalanceData($balanceFile, $data) {
    return file_put_contents($balanceFile, json_encode($data, JSON_PRETTY_PRINT));
}

// Main execution
echo "ROFLFaucet Daily Balance Rollup - " . date('Y-m-d H:i:s') . "\n";
echo "======================================================\n";

if (!is_dir(USERDATA_DIR)) {
    echo "❌ Error: Userdata directory not found: " . USERDATA_DIR . "\n";
    exit(1);
}

$balanceFiles = glob(USERDATA_DIR . '/*.txt');
$totalFiles = count($balanceFiles);
$processedFiles = 0;
$totalRolledUp = 0;
$errors = 0;

echo "📁 Found {$totalFiles} balance files to process\n";
echo "🗓️  Rolling up transactions older than " . RETENTION_DAYS . " days\n";
echo "\n";

foreach ($balanceFiles as $balanceFile) {
    $fileName = basename($balanceFile);
    $userId = str_replace('.txt', '', $fileName);
    
    echo "Processing user {$userId}... ";
    
    try {
        $data = loadBalanceData($balanceFile);
        if (!$data) {
            echo "SKIP (invalid/empty file)\n";
            continue;
        }
        
        $transactionsBefore = count($data['recent_transactions']);
        [$newData, $rolledUpCount] = rollupOldTransactions($data);
        $transactionsAfter = count($newData['recent_transactions']);
        
        if ($rolledUpCount > 0) {
            if (saveBalanceData($balanceFile, $newData)) {
                echo "✅ PROCESSED ({$transactionsBefore} → {$transactionsAfter} transactions, {$rolledUpCount} rolled up)\n";
                $totalRolledUp += $rolledUpCount;
            } else {
                echo "❌ FAILED (could not save file)\n";
                $errors++;
            }
        } else {
            echo "⏭️ SKIP (no old transactions to roll up)\n";
        }
        
        $processedFiles++;
        
    } catch (Exception $e) {
        echo "❌ ERROR: " . $e->getMessage() . "\n";
        $errors++;
    }
}

echo "\n";
echo "======================================================\n";
echo "📊 Rollup Summary:\n";
echo "   Total files found: {$totalFiles}\n";
echo "   Files processed: {$processedFiles}\n";
echo "   Total transactions rolled up: {$totalRolledUp}\n";
echo "   Errors: {$errors}\n";
echo "   Completed at: " . date('Y-m-d H:i:s') . "\n";

if ($errors > 0) {
    echo "\n⚠️  Some errors occurred. Check the log above.\n";
    exit(1);
} else {
    echo "\n🎉 Daily rollup completed successfully!\n";
}
?>
