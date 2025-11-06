<?php
/**
 * One-time migration script to create initial accounts ledger from existing project donations
 */

// Find the project files
$projectsDir = __DIR__ . '/../projects/';
$projectFiles = glob($projectsDir . '*-*.json');

echo "Looking for projects in: $projectsDir\n";
echo "Found " . count($projectFiles) . " project files\n";

$ledgerEntries = [];

foreach ($projectFiles as $projectFile) {
    $project = json_decode(file_get_contents($projectFile), true);
    if (!$project || !isset($project['donations'])) {
        continue;
    }
    
    echo "Processing project {$project['project_id']}: {$project['title']}\n";
    echo "  Found " . count($project['donations']) . " donations in this project\n";
    
    foreach ($project['donations'] as $index => $donation) {
        echo "  Donation $index: status=" . ($donation['status'] ?? 'none') . ", confirmed_at=" . ($donation['confirmed_at'] ?? 'none') . "\n";
        // Handle confirmed donations - check for status=confirmed or just confirmed_at field
        if ((isset($donation['confirmed_at']) && $donation['confirmed_at']) || 
            (isset($donation['status']) && $donation['status'] === 'confirmed')) {
            // Use confirmed_at if available, otherwise use created_at for timestamp
            $timestamp = $donation['confirmed_at'] ?? $donation['created_at'] ?? date('Y-m-d H:i:s');
            
            $ledgerEntries[] = [
                'id' => 'TX-' . date('Y') . '-' . str_pad(count($ledgerEntries) + 1, 6, '0', STR_PAD_LEFT),
                'timestamp' => $timestamp,
                'type' => 'project_donation',
                'amount_sats' => intval($donation['amount_sats']),
                'project_id' => $project['project_id'],
                'donor_name' => $donation['donor_name'] ?? 'Anonymous',
                'donor_message' => $donation['donor_message'] ?? '',
                'recipient_name' => $project['recipient_name'],
                'payment_method' => 'lightning',
                'invoice_id' => $donation['donation_id'] ?? $donation['payment_id'] ?? null,
                'notes' => 'Direct to ' . $project['title'] . ' project',
                'system' => 'project-donations',
                'processed_by' => 'system',
                'confirmed_at' => $donation['confirmed_at'] ?? $timestamp,
                'created_at' => $donation['created_at'] ?? $timestamp
            ];
            echo "  Added donation: {$donation['amount_sats']} sats from {$donation['donor_name']}\n";
        }
    }
}

// Sort by timestamp (newest first)
usort($ledgerEntries, function($a, $b) {
    return strtotime($b['timestamp']) - strtotime($a['timestamp']);
});

echo "\nFound " . count($ledgerEntries) . " total confirmed donations\n";

// Write to ledger file
$ledgerFile = __DIR__ . '/../site/data/accounts-ledger.json';
$ledgerDir = dirname($ledgerFile);

if (!is_dir($ledgerDir)) {
    mkdir($ledgerDir, 0755, true);
    echo "Created data directory: $ledgerDir\n";
}

file_put_contents($ledgerFile, json_encode($ledgerEntries, JSON_PRETTY_PRINT));
echo "Created ledger file: $ledgerFile\n";

echo "\nMigration complete! Accounts system will now read from the ledger file.\n";
echo "Future donations will be automatically appended by the webhook.\n";
?>