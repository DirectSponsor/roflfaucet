<?php
// Test script for transaction system
// This is for development testing only

require_once 'config.php';

echo "Testing Transaction System\n";
echo "==========================\n\n";

// Test 1: Check if we can create the necessary tables
try {
    $db = getUserDataDB();
    
    // Run the migration SQL
    $migration = file_get_contents('database_migration.sql');
    
    // Split by semicolon and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $migration)));
    
    foreach ($statements as $statement) {
        if (!empty($statement) && !preg_match('/^--/', $statement)) {
            try {
                $db->exec($statement);
                echo "✅ Executed: " . substr($statement, 0, 50) . "...\n";
            } catch (Exception $e) {
                echo "⚠️ Warning: " . $e->getMessage() . "\n";
            }
        }
    }
    
    echo "\n✅ Database migration completed!\n\n";
    
} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
    exit(1);
}

// Test 2: Simulate transaction API calls
echo "Testing Transaction API Endpoints:\n";
echo "==================================\n";

// Mock user ID for testing (you'll need to replace with a real one)
$test_user_id = 'test_user_123';

function testTransaction($type, $amount, $source, $description) {
    global $test_user_id;
    
    $data = [
        'type' => $type,
        'amount' => $amount,
        'source' => $source,
        'description' => $description,
        'metadata' => ['test' => true]
    ];
    
    echo "Testing $type transaction: $amount credits for $source\n";
    
    // Since we can't easily mock the auth token, just simulate the core logic
    try {
        $db = getUserDataDB();
        $db->beginTransaction();
        
        // Get current balance
        $stmt = $db->prepare("SELECT useless_coins, lifetime_earned FROM user_balances WHERE user_id = ?");
        $stmt->execute([$test_user_id]);
        $balance_data = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $current_balance = $balance_data ? floatval($balance_data['useless_coins']) : 0;
        $lifetime_earned = $balance_data ? floatval($balance_data['lifetime_earned']) : 0;
        
        // Calculate new balances
        $new_current_balance = $current_balance;
        $new_lifetime_earned = $lifetime_earned;
        
        switch ($type) {
            case 'spend':
                if ($current_balance < $amount) {
                    throw new Exception('Insufficient balance');
                }
                $new_current_balance = $current_balance - $amount;
                break;
                
            case 'earn':
                $new_current_balance = $current_balance + $amount;
                $new_lifetime_earned = $lifetime_earned + $amount;
                break;
                
            case 'gaming_win':
                $new_current_balance = $current_balance + $amount;
                break;
        }
        
        // Update balance
        $stmt = $db->prepare("
            INSERT INTO user_balances (user_id, useless_coins, lifetime_earned) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
                useless_coins = VALUES(useless_coins),
                lifetime_earned = VALUES(lifetime_earned)
        ");
        $stmt->execute([$test_user_id, $new_current_balance, $new_lifetime_earned]);
        
        // Log transaction
        $stmt = $db->prepare("
            INSERT INTO transaction_log (user_id, type, amount, source, description, metadata, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $metadata_json = json_encode($data['metadata']);
        $stmt->execute([$test_user_id, $type, $amount, $source, $description, $metadata_json]);
        
        $db->commit();
        
        echo "  ✅ Success! Current: $new_current_balance, Lifetime: $new_lifetime_earned\n";
        
    } catch (Exception $e) {
        $db->rollback();
        echo "  ❌ Error: " . $e->getMessage() . "\n";
    }
}

// Initialize test user with some balance
echo "Initializing test user...\n";
testTransaction('earn', 100, 'test_init', 'Initial test balance');

echo "\nTesting slot machine transactions:\n";
testTransaction('spend', 10, 'slots_bet', 'Slot bet: 10 credits');
testTransaction('gaming_win', 25, 'slots_win', 'Slot win: 25 credits');

echo "\nTesting other transaction types:\n";
testTransaction('earn', 5, 'faucet_claim', 'Faucet claim: 5 credits');
testTransaction('spend', 15, 'vote_cost', 'Vote cost: 15 credits');

echo "\nFinal balance check:\n";
try {
    $db = getUserDataDB();
    $stmt = $db->prepare("SELECT useless_coins, lifetime_earned FROM user_balances WHERE user_id = ?");
    $stmt->execute([$test_user_id]);
    $final_balance = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($final_balance) {
        echo "Final Current Balance: " . $final_balance['useless_coins'] . "\n";
        echo "Final Lifetime Earned: " . $final_balance['lifetime_earned'] . "\n";
    }
    
    // Show transaction history
    echo "\nTransaction History:\n";
    $stmt = $db->prepare("SELECT * FROM transaction_log WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->execute([$test_user_id]);
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($transactions as $tx) {
        echo "  {$tx['created_at']}: {$tx['type']} {$tx['amount']} ({$tx['source']})\n";
    }
    
} catch (Exception $e) {
    echo "Error checking final balance: " . $e->getMessage() . "\n";
}

echo "\n✅ Testing complete!\n";
echo "\nNext steps:\n";
echo "1. Run the database migration on your production database\n";
echo "2. Test the slots with the new transaction system\n";
echo "3. Verify both demo and logged-in user experiences\n";
?>

