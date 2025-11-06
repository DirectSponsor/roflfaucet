<?php
/**
 * Clean up duplicate payment entries after migration
 * Removes payments without screenshots and keeps the migrated ones
 */

echo "🧹 Cleaning up duplicate payment entries...\n";

$newFile = 'data/manual_distributions.json';

if (!file_exists($newFile)) {
    echo "❌ Manual distributions file not found: $newFile\n";
    exit(1);
}

// Create backup
$backupFile = 'manual_distributions_backup_cleanup_' . date('Y_m_d_H_i_s') . '.json';
copy($newFile, $backupFile);
echo "💾 Backup created: $backupFile\n";

// Load data
$data = json_decode(file_get_contents($newFile), true);
if (!$data) {
    echo "❌ Failed to parse data\n";
    exit(1);
}

$cleaned = 0;
$duplicatesFound = 0;

// Clean up duplicates - keep only payments with proper migration notes or screenshot paths
foreach ($data['distributions'] as $month => &$monthData) {
    echo "🔍 Checking month: $month\n";
    
    $originalCount = count($monthData['payments']);
    $cleanedPayments = [];
    
    foreach ($monthData['payments'] as $payment) {
        // Keep payments that have either:
        // 1. A screenshot_path that's not null, or
        // 2. Migration notes indicating they were migrated
        if (
            (!is_null($payment['screenshot_path']) && $payment['screenshot_path'] !== '') ||
            (isset($payment['admin_notes']) && strpos($payment['admin_notes'], 'Migrated from old distribution system') !== false)
        ) {
            $cleanedPayments[] = $payment;
            echo "  ✅ Kept payment: {$payment['payment_id']} - " . ($payment['screenshot_path'] ? 'with screenshot' : 'migrated') . "\n";
        } else {
            echo "  🗑️  Removed duplicate: {$payment['payment_id']} - no screenshot/migration marker\n";
            $duplicatesFound++;
        }
    }
    
    $monthData['payments'] = $cleanedPayments;
    
    // Recalculate totals for this month
    $monthData['total_sent_sats'] = array_sum(array_column($cleanedPayments, 'amount_sats'));
    
    if ($originalCount !== count($cleanedPayments)) {
        $cleaned += ($originalCount - count($cleanedPayments));
        echo "  📊 Month $month: $originalCount → " . count($cleanedPayments) . " payments\n";
    }
}

// Recalculate global totals
$data['total_payments'] = 0;
$data['total_amount_sats'] = 0;

foreach ($data['distributions'] as $monthData) {
    $data['total_payments'] += count($monthData['payments']);
    $data['total_amount_sats'] += $monthData['total_sent_sats'];
}

$data['last_updated'] = date('c');

// Save cleaned data
if (file_put_contents($newFile, json_encode($data, JSON_PRETTY_PRINT))) {
    echo "\n✅ Cleanup completed successfully!\n";
    echo "🗑️  Removed $cleaned duplicate payment(s)\n";
    echo "📊 Total payments: {$data['total_payments']}\n";
    echo "💰 Total amount: {$data['total_amount_sats']} sats\n";
    echo "💾 Backup: $backupFile\n";
} else {
    echo "\n❌ Failed to save cleaned data\n";
    exit(1);
}

if ($duplicatesFound === 0) {
    echo "\n🎉 No duplicates found - data was already clean!\n";
}
?>