<?php
/**
 * Debug Analytics System - Run this on staging to test functionality
 * This simulates what happens when you play a game and check the dashboard
 */

echo "🔍 Analytics System Debug Test\n";
echo "================================\n\n";

// Include the analytics system
require_once 'scripts/analytics-simple.php';

echo "1. Testing game logging...\n";
try {
    // Simulate a poker-dice game result
    logGameResult('debug-user', 'poker-dice', 10, 20);
    echo "✅ Game logged successfully\n";
} catch (Exception $e) {
    echo "❌ Error logging game: " . $e->getMessage() . "\n";
}

echo "\n2. Checking if stats directory exists...\n";
$statsDir = 'userdata/stats-simple/';
if (is_dir($statsDir)) {
    echo "✅ Stats directory exists: $statsDir\n";
    
    // List files in the directory
    $files = scandir($statsDir);
    echo "   Files in directory:\n";
    foreach ($files as $file) {
        if ($file !== '.' && $file !== '..') {
            echo "   - $file\n";
            
            // Show content of small files for debugging
            $filepath = $statsDir . $file;
            if (is_file($filepath) && filesize($filepath) < 500) {
                echo "     Content: " . substr(file_get_contents($filepath), 0, 100) . "\n";
            }
        }
    }
} else {
    echo "❌ Stats directory does not exist: $statsDir\n";
    
    // Try to create it
    echo "   Attempting to create directory...\n";
    if (mkdir($statsDir, 0755, true)) {
        echo "✅ Directory created successfully\n";
    } else {
        echo "❌ Failed to create directory - check permissions\n";
    }
}

echo "\n3. Testing dashboard API...\n";
try {
    $stats = SimpleGameAnalytics::getDashboardStats(7);
    echo "✅ Dashboard API working\n";
    echo "   Total games: " . ($stats['total_games'] ?? 0) . "\n";
    echo "   Total bet: " . ($stats['total_bet'] ?? 0) . "\n";
    echo "   Net result: " . ($stats['net_result'] ?? 0) . "\n";
    echo "   Game breakdown: " . count($stats['game_breakdown'] ?? []) . " game types\n";
} catch (Exception $e) {
    echo "❌ Dashboard API error: " . $e->getMessage() . "\n";
}

echo "\n4. Testing leaderboard API...\n";
try {
    $leaderboard = SimpleGameAnalytics::getUserLeaderboard(null, 7);
    echo "✅ Leaderboard API working\n";
    echo "   Total users: " . count($leaderboard) . "\n";
    if (count($leaderboard) > 0) {
        echo "   Top user: " . $leaderboard[0]['user_id'] . " with net " . $leaderboard[0]['net_result'] . "\n";
    }
} catch (Exception $e) {
    echo "❌ Leaderboard API error: " . $e->getMessage() . "\n";
}

echo "\n🎯 Debug Test Complete!\n";
echo "If you see checkmarks above, the system is working.\n";
echo "If you see X marks, those issues need to be fixed before games can log properly.\n\n";

// Show current working directory for reference
echo "📁 Current working directory: " . getcwd() . "\n";
echo "📁 Stats directory path (relative): " . $statsDir . "\n";
echo "📁 Stats directory path (absolute): " . realpath('.') . '/' . $statsDir . "\n";
?>