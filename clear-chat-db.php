<?php
/**
 * Clear Chat Database Script
 * Clears all chat messages and resets the chat system
 */

// Database connection (same as chat-api.php)
function getDbConnection() {
    try {
        $pdo = new PDO('mysql:host=localhost;dbname=roflfaucet;charset=utf8mb4', 'roflfaucet', 'RoflFaucet2025SecureDB!');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    } catch (PDOException $e) {
        echo "Database connection failed: " . $e->getMessage() . "\n";
        return false;
    }
}

$pdo = getDbConnection();

if (!$pdo) {
    echo "❌ Failed to connect to database\n";
    exit(1);
}

try {
    echo "🗑️  Clearing chat messages...\n";
    
    // Clear all chat messages
    $stmt = $pdo->prepare('DELETE FROM chat_messages');
    $result1 = $stmt->execute();
    $deletedMessages = $stmt->rowCount();
    
    echo "✅ Deleted {$deletedMessages} chat messages\n";
    
    // Clear online users
    echo "🗑️  Clearing online users...\n";
    $stmt = $pdo->prepare('DELETE FROM chat_users_online');
    $result2 = $stmt->execute();
    $deletedOnline = $stmt->rowCount();
    
    echo "✅ Deleted {$deletedOnline} online user records\n";
    
    // Clear rate limits
    echo "🗑️  Clearing rate limit data...\n";
    $stmt = $pdo->prepare('DELETE FROM chat_user_limits');
    $result3 = $stmt->execute();
    $deletedLimits = $stmt->rowCount();
    
    echo "✅ Deleted {$deletedLimits} rate limit records\n";
    
    // Reset auto-increment counters
    echo "🔄 Resetting auto-increment counters...\n";
    $pdo->exec('ALTER TABLE chat_messages AUTO_INCREMENT = 1');
    $pdo->exec('ALTER TABLE chat_user_limits AUTO_INCREMENT = 1');
    
    echo "✅ Reset auto-increment counters\n";
    
    echo "\n🎉 Chat database cleared successfully!\n";
    echo "The chat system is now reset and ready for fresh messages.\n";
    
} catch (PDOException $e) {
    echo "❌ Error clearing database: " . $e->getMessage() . "\n";
    exit(1);
}
?>
