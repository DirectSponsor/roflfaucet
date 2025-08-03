<?php
/**
 * Export email addresses from Listmonk PostgreSQL database
 * Run this on the server to get the subscriber list before cleanup
 */

try {
    // Connect to PostgreSQL (using the correct password we found)
    $pdo = new PDO('pgsql:host=localhost;port=9432;dbname=listmonk', 'listmonk', 'L6rWMdxPoFjFs');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected to database successfully.\n\n";
    
    // Get all subscribers
    $stmt = $pdo->prepare('SELECT email, name, status, created_at FROM subscribers ORDER BY created_at');
    $stmt->execute();
    
    $subscribers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "=== LISTMONK SUBSCRIBERS EXPORT ===\n";
    echo "Total subscribers: " . count($subscribers) . "\n\n";
    
    // Output in CSV format
    echo "EMAIL,NAME,STATUS,CREATED_AT\n";
    foreach ($subscribers as $subscriber) {
        $email = $subscriber['email'];
        $name = $subscriber['name'] ?? '';
        $status = $subscriber['status'];
        $created = $subscriber['created_at'];
        
        echo "{$email},{$name},{$status},{$created}\n";
    }
    
    echo "\n=== END EXPORT ===\n";
    
    // Also save to file
    $csvContent = "EMAIL,NAME,STATUS,CREATED_AT\n";
    foreach ($subscribers as $subscriber) {
        $email = $subscriber['email'];
        $name = $subscriber['name'] ?? '';
        $status = $subscriber['status'];
        $created = $subscriber['created_at'];
        
        $csvContent .= "{$email},{$name},{$status},{$created}\n";
    }
    
    file_put_contents('listmonk_subscribers_export.csv', $csvContent);
    echo "Subscribers also saved to: listmonk_subscribers_export.csv\n";
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
