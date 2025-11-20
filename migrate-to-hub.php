#!/usr/bin/env php
<?php
/**
 * Migrate ROFLFaucet user data to DirectSponsor Hub
 * 
 * This script:
 * 1. Reads local balance files from api/userdata/
 * 2. Reads user profiles from auth database
 * 3. Creates hub-compatible JSON files
 * 4. Uploads to hub via API
 */

echo "🔄 ROFLFaucet to Hub Migration\n";
echo "================================\n\n";

// Configuration
$hubApiUrl = 'https://auth.directsponsor.org/api/sync.php';
$localBalanceDir = __DIR__ . '/site/api/userdata';
$authDbPath = '/var/www/auth.directsponsor.org/db/users.db'; // Update this if different

// Get list of users from balance files
$balanceFiles = glob($localBalanceDir . '/*-balance.json');
$userCount = count($balanceFiles);

echo "📊 Found {$userCount} users with balance data\n\n";

$successCount = 0;
$errorCount = 0;

foreach ($balanceFiles as $file) {
    $filename = basename($file);
    preg_match('/^(.+)-balance\.json$/', $filename, $matches);
    
    if (!$matches) {
        echo "⚠️  Skipping invalid filename: {$filename}\n";
        continue;
    }
    
    $combinedUserId = $matches[1];
    echo "👤 Processing user: {$combinedUserId}\n";
    
    // Read balance
    $balanceData = json_decode(file_get_contents($file), true);
    $balance = $balanceData['balance'] ?? 0;
    echo "   💰 Balance: {$balance} coins\n";
    
    // Extract user_id and username from combined format (e.g., "8-evans")
    $parts = explode('-', $combinedUserId, 2);
    $userId = $parts[0] ?? '';
    $username = $parts[1] ?? '';
    
    // Prepare hub data structure
    $hubData = [
        'user_id' => $combinedUserId,
        'username' => $username,
        'profile' => [
            'display_name' => ucfirst($username),
            'avatar' => '👤',
            'bio' => '',
            'location' => '',
            'website' => ''
        ],
        'balance' => [
            'coins' => (float)$balance,
            'points' => 0
        ],
        'global_roles' => [],
        'site_roles' => [
            'roflfaucet' => []
        ],
        'last_profile_update' => null,
        'last_balance_update' => date('Y-m-d\TH:i:s\Z'),
        'last_sync' => date('Y-m-d\TH:i:s\Z')
    ];
    
    // Push to hub
    echo "   📤 Pushing to hub...\n";
    
    $ch = curl_init($hubApiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'action' => 'push',
        'user_id' => $combinedUserId,
        'site_id' => 'roflfaucet',
        'data_type' => 'balance',
        'data' => ['coins' => (float)$balance]
    ]));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $result = json_decode($response, true);
        if ($result['success'] ?? false) {
            echo "   ✅ Successfully migrated\n";
            $successCount++;
        } else {
            echo "   ❌ Hub API error: " . ($result['error'] ?? 'Unknown') . "\n";
            $errorCount++;
        }
    } else {
        echo "   ❌ HTTP error: {$httpCode}\n";
        $errorCount++;
    }
    
    echo "\n";
    
    // Small delay to avoid overwhelming the server
    usleep(100000); // 0.1 second
}

echo "================================\n";
echo "📊 Migration Summary:\n";
echo "   Total users: {$userCount}\n";
echo "   ✅ Successful: {$successCount}\n";
echo "   ❌ Errors: {$errorCount}\n";
echo "\n";

if ($successCount === $userCount) {
    echo "🎉 All users migrated successfully!\n";
} else {
    echo "⚠️  Some migrations failed. Check the output above.\n";
}
