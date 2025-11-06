<?php
/**
 * Add screenshot reference to old distribution data on server
 * This adds the missing payment_screenshot field before migration
 */

echo "🖼️  Adding screenshot reference to old distribution data...\n";

$oldFile = 'payments/data/accounts/distributions.json';

// Check if old file exists
if (!file_exists($oldFile)) {
    echo "❌ Old distribution file not found: $oldFile\n";
    exit(1);
}

// Create backup
$backupFile = 'distributions_backup_before_screenshot_' . date('Y_m_d_H_i_s') . '.json';
copy($oldFile, $backupFile);
echo "💾 Backup created: $backupFile\n";

// Load and modify data
$data = json_decode(file_get_contents($oldFile), true);
if (!$data) {
    echo "❌ Failed to parse old data\n";
    exit(1);
}

// Add screenshot reference to the September payment
foreach ($data as &$dist) {
    if ($dist['month'] === '2025-09') {
        foreach ($dist['distributions'] as &$payment) {
            if ($payment['recipient_name'] === 'Evans - Kenya Reforestation Project') {
                $payment['payment_screenshot'] = 'september_2024_payment.png';
                echo "✅ Added screenshot reference: september_2024_payment.png\n";
            }
        }
    }
}

// Save updated data
if (file_put_contents($oldFile, json_encode($data, JSON_PRETTY_PRINT))) {
    echo "✅ Updated old distribution file with screenshot reference\n";
    echo "📁 Modified: $oldFile\n";
    echo "💾 Backup: $backupFile\n";
} else {
    echo "❌ Failed to save updated data\n";
    exit(1);
}

echo "\n🔄 Now you can re-run the migration script to include the screenshot\n";
?>