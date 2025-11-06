#!/usr/bin/env php
<?php
/**
 * ROFLFaucet Balance Migration Script
 * 
 * Migrates existing balance files from old 7-day system to new 5-tier system
 */

// ROFLFaucet Data Directory Configuration
define('ROFLFAUCET_DATA_DIR', '/var/roflfaucet-data');
define('USERDATA_DIR', ROFLFAUCET_DATA_DIR . '/userdata');

// Configuration
$oldBalanceDir = USERDATA_DIR . '/balances';
$newBaseDir = USERDATA_DIR . '/balance-tiers';
$detailedDir = $newBaseDir . '/detailed';
$hourlyDir = $newBaseDir . '/hourly';
$dailyDir = $newBaseDir . '/daily';
$weeklyDir = $newBaseDir . '/weekly';
$monthlyDir = $newBaseDir . '/monthly';

echo "ROFLFaucet Balance Migration to 5-Tier System\n";
echo "=============================================\n\n";

// Create new directories
$dirs = [$newBaseDir, $detailedDir, $hourlyDir, $dailyDir, $weeklyDir, $monthlyDir];
foreach ($dirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
        echo "Created directory: $dir\n";
    }
}

// Find all old balance files
$balanceFiles = glob($oldBalanceDir . '/*.txt');
$totalFiles = count($balanceFiles);

echo "\nFound $totalFiles balance files to migrate\n";
echo "==========================================\n\n";

$migrated = 0;
$errors = 0;

foreach ($balanceFiles as $balanceFile) {
    $fileName = basename($balanceFile, '.txt');
    $userId = $fileName;
    
    echo "Migrating user: $userId ... ";
    
    try {
        // Load old balance data
        $oldData = json_decode(file_get_contents($balanceFile), true);
        if (!$oldData || !isset($oldData['recent_transactions'])) {
            echo "SKIP (invalid format)\n";
            continue;
        }
        
        $transactions = $oldData['recent_transactions'];
        $currentBalance = $oldData['balance'] ?? 0;
        
        echo "(" . count($transactions) . " transactions) ";
        
        // Group transactions by hour
        $hourlyGroups = [];
        foreach ($transactions as $tx) {
            $hourKey = date('Y-m-d-H', $tx['timestamp']);
            if (!isset($hourlyGroups[$hourKey])) {
                $hourlyGroups[$hourKey] = [];
            }
            $hourlyGroups[$hourKey][] = $tx;
        }
        
        echo "-> " . count($hourlyGroups) . " hours ";
        
        // Create detailed files for recent hours
        $currentHour = date('Y-m-d-H');
        $cutoffTime = time() - 3600; // 1 hour ago
        
        foreach ($hourlyGroups as $hourKey => $hourTransactions) {
            // Only create detailed files for the last hour
            if (strtotime($hourKey . ':00:00') >= $cutoffTime) {
                $detailedFile = $detailedDir . "/{$userId}-{$hourKey}.json";
                
                $detailedData = [
                    'balance' => $currentBalance, // Will be corrected by the balance calculation
                    'transactions' => $hourTransactions
                ];
                
                file_put_contents($detailedFile, json_encode($detailedData, JSON_PRETTY_PRINT));
                echo "D";
            } else {
                // Create hourly aggregates for older hours
                $date = substr($hourKey, 0, 10);
                $hour = intval(substr($hourKey, 11, 2));
                
                $hourlyFile = $hourlyDir . "/{$userId}-{$date}.json";
                $hourlyData = ['date' => $date, 'hours' => []];
                if (file_exists($hourlyFile)) {
                    $hourlyData = json_decode(file_get_contents($hourlyFile), true);
                }
                
                // Aggregate hour stats
                $hourStats = [
                    'hour' => $hour,
                    'transaction_count' => count($hourTransactions),
                    'total_wagered' => 0,
                    'total_won' => 0,
                    'games_played' => 0,
                    'faucet_claims' => 0,
                    'ending_balance' => $currentBalance
                ];
                
                foreach ($hourTransactions as $tx) {
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
                echo "H";
            }
        }
        
        // Migrate monthly totals if they exist
        if (isset($oldData['monthly_totals']) && !empty($oldData['monthly_totals'])) {
            foreach ($oldData['monthly_totals'] as $month => $stats) {
                $monthlyFile = $monthlyDir . "/{$userId}-{$month}.json";
                $monthlyData = [
                    'month' => $month,
                    'transaction_count' => $stats['total_bets'] + $stats['total_wins'] + $stats['faucet_claims'],
                    'total_wagered' => $stats['total_wagered'],
                    'total_won' => $stats['total_won'],
                    'games_played' => $stats['games_played'],
                    'faucet_claims' => $stats['faucet_claims'],
                    'ending_balance' => $currentBalance,
                    'weekly_breakdown' => []
                ];
                
                file_put_contents($monthlyFile, json_encode($monthlyData, JSON_PRETTY_PRINT));
                echo "M";
            }
        }
        
        echo " ✅ SUCCESS\n";
        $migrated++;
        
        // Backup old file
        rename($balanceFile, $balanceFile . '.backup');
        
    } catch (Exception $e) {
        echo " ❌ ERROR: " . $e->getMessage() . "\n";
        $errors++;
    }
}

echo "\n";
echo "Migration Summary:\n";
echo "==================\n";
echo "Total files: $totalFiles\n";
echo "Migrated: $migrated\n";
echo "Errors: $errors\n";

if ($migrated > 0) {
    echo "\n✅ Migration completed successfully!\n";
    echo "\nOld files backed up with .backup extension\n";
    echo "New 5-tier system is ready to use\n\n";
    
    echo "To use the new system, update your balance API calls to:\n";
    echo "  /api/balance-5tier.php?action=balance&user_id=USER\n";
    echo "  /api/balance-5tier.php?action=update_balance (POST)\n";
} else {
    echo "\n❌ No files migrated. Check for errors above.\n";
}
?>