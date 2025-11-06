<?php
/**
 * Server-side migration script for distribution data
 * This safely migrates old distribution data to the new manual distribution system
 * WITHOUT overwriting existing server-generated data
 */

echo "🔄 ROFLFaucet Distribution Data Migration (Server-side)\n";
echo "=====================================================\n\n";

$oldFile = 'payments/data/accounts/distributions.json';
$newFile = 'data/manual_distributions.json';

// Check if old file exists
if (!file_exists($oldFile)) {
    echo "❌ Old distribution file not found: $oldFile\n";
    echo "   This might mean the migration already happened or the file path changed.\n";
    exit(1);
}

echo "📁 Found old distribution file: $oldFile\n";

// Load old data
$oldData = json_decode(file_get_contents($oldFile), true);
if (!$oldData) {
    echo "❌ Failed to parse old distribution data\n";
    exit(1);
}

echo "📊 Old data contains " . count($oldData) . " distribution entries\n";

// Load existing new data (if any) - preserve server-generated data
$newData = [
    'distributions' => [],
    'total_payments' => 0,
    'total_amount_sats' => 0,
    'last_updated' => null,
    'metadata' => [
        'created' => date('c'),
        'system' => 'ROFLFaucet Manual Payment Distribution System',
        'version' => '1.0',
        'migrated_from' => 'payments/data/accounts/distributions.json',
        'migration_date' => date('c')
    ]
];

if (file_exists($newFile)) {
    echo "📁 Found existing new data file, preserving server data...\n";
    $existing = json_decode(file_get_contents($newFile), true);
    if ($existing && isset($existing['distributions'])) {
        $newData = $existing;
        echo "✅ Preserved existing data structure\n";
    }
}

// Create backup of current state
$backupFile = 'manual_distributions_backup_' . date('Y_m_d_H_i_s') . '.json';
if (file_exists($newFile)) {
    copy($newFile, $backupFile);
    echo "💾 Backup created: $backupFile\n";
}

// Convert old format to new format
$migratedPayments = 0;
foreach ($oldData as $dist) {
    $month = $dist['month'];
    $distributionDate = $dist['distribution_date'];
    
    echo "🔄 Processing month: $month\n";
    
    // Create month entry if not exists
    if (!isset($newData['distributions'][$month])) {
        $newData['distributions'][$month] = [
            'payments' => [],
            'total_sent_sats' => 0,
            'distribution_complete' => true // Old entries are completed
        ];
    }
    
    foreach ($dist['distributions'] as $payment) {
        // Generate payment ID
        $paymentNumber = count($newData['distributions'][$month]['payments']) + 1;
        $paymentId = 'manual_' . str_replace('-', '_', $month) . '_' . str_pad($paymentNumber, 3, '0', STR_PAD_LEFT);
        
        // Convert old format to new format
        $newPayment = [
            'payment_id' => $paymentId,
            'recipient' => 'evans', // Based on the known recipient
            'recipient_username' => 'evans',
            'recipient_name' => $payment['recipient_name'],
            'amount_sats' => $payment['amount_sats'],
            'purpose' => $payment['purpose'],
            'payment_date' => $distributionDate,
            'admin_recorded_at' => $distributionDate,
            'payment_method' => 'coinos_manual',
            'screenshot_path' => isset($payment['payment_screenshot']) ? $payment['payment_screenshot'] : null,
            'admin_notes' => 'Migrated from old distribution system on ' . date('Y-m-d H:i:s'),
            'status' => 'sent',
            'recipient_confirmation' => [
                'confirmed_at' => $payment['confirmation_status'] === 'completed' ? $distributionDate : null,
                'confirmation_status' => $payment['confirmation_status'] === 'completed' ? 'received' : 'pending',
                'recipient_notes' => null
            ]
        ];
        
        $newData['distributions'][$month]['payments'][] = $newPayment;
        $newData['distributions'][$month]['total_sent_sats'] += $payment['amount_sats'];
        $migratedPayments++;
        
        echo "  ✅ Migrated payment: {$payment['recipient_name']} - {$payment['amount_sats']} sats\n";
    }
}

// Update totals
$newData['total_payments'] = 0;
$newData['total_amount_sats'] = 0;
$newData['last_updated'] = date('c');

foreach ($newData['distributions'] as $monthData) {
    $newData['total_payments'] += count($monthData['payments']);
    $newData['total_amount_sats'] += $monthData['total_sent_sats'];
}

// Save new data
if (file_put_contents($newFile, json_encode($newData, JSON_PRETTY_PRINT))) {
    echo "\n✅ Migration completed successfully!\n";
    echo "📊 Total payments migrated: $migratedPayments\n";
    echo "💰 Total amount: {$newData['total_amount_sats']} sats\n";
    echo "📁 Data saved to: $newFile\n";
    
    if (file_exists($backupFile)) {
        echo "💾 Backup available at: $backupFile\n";
    }
    
    echo "\n📝 Next steps:\n";
    echo "   1. Test the transparency page to verify screenshot links work\n";
    echo "   2. If everything works correctly, you can archive the old file:\n";
    echo "      mv $oldFile payments/data/accounts/distributions.json.migrated\n";
    echo "   3. Clean up backup file when confident: rm $backupFile\n";
    
} else {
    echo "\n❌ Failed to save migrated data\n";
    if (file_exists($backupFile)) {
        echo "💾 Original backup preserved at: $backupFile\n";
    }
    exit(1);
}

echo "\n🔒 Migration completed safely - existing server data preserved\n";
?>