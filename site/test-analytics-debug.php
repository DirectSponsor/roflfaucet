<?php
// Simple test to debug analytics system
echo "🔧 Analytics Debug Test\n";

// Set up POST environment
$_SERVER['REQUEST_METHOD'] = 'POST';
$_POST['action'] = 'log_game';
$_POST['user_id'] = 'debug-test';
$_POST['game_type'] = 'poker-dice';
$_POST['bet_amount'] = '7';
$_POST['payout'] = '14';

echo "📝 POST data set up:\n";
print_r($_POST);

echo "\n🔄 Including analytics.php...\n";

// Capture any output
ob_start();
include 'scripts/analytics.php';
$output = ob_get_clean();

echo "📤 Output from analytics.php: $output\n";

echo "\n📁 Checking if files were created...\n";
$statsDir = 'userdata/stats/';
if (is_dir($statsDir)) {
    $files = scandir($statsDir);
    echo "Files in $statsDir:\n";
    foreach ($files as $file) {
        if ($file !== '.' && $file !== '..') {
            echo "  - $file\n";
        }
    }
} else {
    echo "❌ Stats directory $statsDir does not exist!\n";
}

echo "\n✅ Debug test complete\n";
?>