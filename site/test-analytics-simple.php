<?php
/**
 * Test the analytics-simple.php system
 */

// Simulate POST request
$_SERVER['REQUEST_METHOD'] = 'POST';
$_POST = [
    'action' => 'log_game',
    'user_id' => 'testuser',
    'game_type' => 'poker-dice',
    'bet_amount' => '10',
    'payout' => '20'
];

echo "Testing analytics-simple.php system...\n";

// Include the analytics system
include 'scripts/analytics-simple.php';

echo "\nChecking if files were created...\n";

// Check if stats-simple directory was created
if (is_dir('userdata/stats-simple/')) {
    echo "✅ stats-simple directory created\n";
    
    // List files
    $files = glob('userdata/stats-simple/*');
    foreach ($files as $file) {
        echo "📁 Created: " . basename($file) . "\n";
        if (strpos($file, '.json') !== false) {
            $content = file_get_contents($file);
            echo "   Content preview: " . substr($content, 0, 100) . "...\n";
        }
    }
} else {
    echo "❌ stats-simple directory not found\n";
}

echo "\nTesting dashboard API...\n";

// Test dashboard
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET = ['action' => 'dashboard', 'days' => '7'];
$_POST = [];

ob_start();
include 'scripts/analytics-simple.php';
$dashboardResult = ob_get_clean();

echo "Dashboard API response: " . substr($dashboardResult, 0, 200) . "...\n";
?>