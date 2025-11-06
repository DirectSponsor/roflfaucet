<?php
/**
 * Test script to create a sample notification
 * Run this to test if the notification system is working
 */

// Include the notification functions
require_once 'api/chat-notifications.php';

// Test adding a notification for user 10 (andytest2)
echo "Creating test notification for user 10...\n";

$success = addNotification(
    10,  // user_id 
    'tip',  // type
    'You received 50 coins from testuser! 💰',  // message
    'testuser',  // from_user
    ['amount' => 50, 'tip_type' => 'received']  // metadata
);

if ($success) {
    echo "✅ Test notification created successfully!\n";
    
    // Now try to retrieve it
    echo "Retrieving notifications for user 10...\n";
    $notifications = getNotifications(10, false);
    
    echo "Found " . count($notifications) . " notifications:\n";
    foreach ($notifications as $notification) {
        echo "- {$notification['type']}: {$notification['message']}\n";
    }
} else {
    echo "❌ Failed to create test notification\n";
}

echo "\nDone!\n";
?>
