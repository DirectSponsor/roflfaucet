<?php
/**
 * HTML Project File Update Functions
 * 
 * Updates project HTML files with balance and donation data
 * Includes proper file locking to handle concurrent donations
 */

/**
 * Update project HTML with new balance and donation
 * Uses exclusive locking to prevent race conditions
 */
function updateProjectHTML($projectId, $donationAmount, $donorName, $donorMessage, $projectsDir, $ledgerFile, $logFunction) {
    $maxRetries = 3;
    $retryDelay = 2; // seconds
    
    // Find project HTML file
    $htmlFile = null;
    $username = null;
    
    $userDirs = glob($projectsDir . '/*', GLOB_ONLYDIR);
    foreach ($userDirs as $userDir) {
        $testFile = $userDir . '/' . $projectId . '.html';
        if (file_exists($testFile)) {
            $htmlFile = $testFile;
            $username = basename($userDir);
            break;
        }
    }
    
    if (!$htmlFile) {
        $logFunction("Project HTML file not found for project $projectId");
        return false;
    }
    
    // Try to update with retries
    for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
        $handle = @fopen($htmlFile, 'r+');
        
        if (!$handle) {
            $logFunction("Failed to open HTML file (attempt $attempt/$maxRetries)");
            if ($attempt < $maxRetries) {
                sleep($retryDelay);
                continue;
            }
            return false;
        }
        
        // Get exclusive lock (will block until available)
        if (!flock($handle, LOCK_EX)) {
            $logFunction("Failed to lock HTML file (attempt $attempt/$maxRetries)");
            fclose($handle);
            if ($attempt < $maxRetries) {
                sleep($retryDelay);
                continue;
            }
            return false;
        }
        
        // Read current content
        $html = stream_get_contents($handle);
        fclose($handle); // Close read handle
        
        if ($html === false) {
            $logFunction("Failed to read HTML file");
            return false;
        }
        
        // Calculate new balance from ledger (source of truth)
        $newBalance = calculateProjectBalance($projectId, $ledgerFile);
        
        // Update balance in HTML
        $html = preg_replace(
            '/<!-- current-amount -->.*?<!-- end current-amount -->/s',
            '<!-- current-amount -->' . number_format($newBalance) . '<!-- end current-amount -->',
            $html
        );
        
        // Update supporters count (unique donors)
        $supportersCount = countUniqueSupporters($projectId, $ledgerFile);
        $html = preg_replace(
            '/<!-- supporters-count -->.*?<!-- end supporters-count -->/s',
            '<!-- supporters-count -->' . $supportersCount . '<!-- end supporters-count -->',
            $html
        );
        
        // Add new donation to donations list
        $html = addDonationToHTML($html, $donorName, $donationAmount, $donorMessage);
        
        // Write back atomically
        $tempFile = $htmlFile . '.tmp';
        if (file_put_contents($tempFile, $html, LOCK_EX) === false) {
            $logFunction("Failed to write temp file");
            @unlink($tempFile);
            return false;
        }
        
        // Atomic rename
        if (!rename($tempFile, $htmlFile)) {
            $logFunction("Failed to rename temp file");
            @unlink($tempFile);
            return false;
        }
        
        $logFunction("Updated HTML for project $projectId: balance=$newBalance, supporters=$supportersCount");
        return true;
    }
    
    return false;
}

/**
 * Calculate project balance from ledger
 */
function calculateProjectBalance($projectId, $ledgerFile) {
    if (!file_exists($ledgerFile)) {
        return 0;
    }
    
    $ledger = json_decode(file_get_contents($ledgerFile), true);
    if (!$ledger) {
        return 0;
    }
    
    $total = 0;
    foreach ($ledger as $transaction) {
        if (isset($transaction['project_id']) && $transaction['project_id'] === $projectId && 
            $transaction['type'] === 'project_donation' && 
            isset($transaction['amount_sats'])) {
            $total += $transaction['amount_sats'];
        }
    }
    
    return $total;
}

/**
 * Count unique supporters from ledger
 */
function countUniqueSupporters($projectId, $ledgerFile) {
    if (!file_exists($ledgerFile)) {
        return 0;
    }
    
    $ledger = json_decode(file_get_contents($ledgerFile), true);
    if (!$ledger) {
        return 0;
    }
    
    $supporters = [];
    foreach ($ledger as $transaction) {
        if (isset($transaction['project_id']) && $transaction['project_id'] === $projectId && 
            $transaction['type'] === 'project_donation') {
            $donor = $transaction['donor_name'] ?? 'Anonymous';
            $supporters[$donor] = true;
        }
    }
    
    return count($supporters);
}

/**
 * Add new donation to HTML donations list
 * Keeps most recent 25 donations
 */
function addDonationToHTML($html, $donorName, $amount, $message) {
    // Extract existing donations
    $donations = [];
    if (preg_match('/<!-- donations -->(.*?)<!-- end donations -->/s', $html, $matches)) {
        $donationsJson = trim($matches[1]);
        if (!empty($donationsJson)) {
            $donations = json_decode($donationsJson, true) ?: [];
        }
    }
    
    // Add new donation to front
    array_unshift($donations, [
        'donor' => $donorName ?: 'Anonymous',
        'amount' => $amount,
        'date' => date('Y-m-d H:i'),
        'message' => $message ?: ''
    ]);
    
    // Keep only most recent 25
    $donations = array_slice($donations, 0, 25);
    
    // Update HTML
    $donationsJson = json_encode($donations, JSON_PRETTY_PRINT);
    
    if (preg_match('/<!-- donations -->.*?<!-- end donations -->/s', $html)) {
        // Update existing
        $html = preg_replace(
            '/<!-- donations -->.*?<!-- end donations -->/s',
            '<!-- donations -->' . "\n" . $donationsJson . "\n" . '<!-- end donations -->',
            $html
        );
    } else {
        // Add new donations section before </body>
        $donationsSection = "\n    <!-- donations -->\n" . $donationsJson . "\n    <!-- end donations -->\n";
        $html = str_replace('</body>', $donationsSection . '</body>', $html);
    }
    
    return $html;
}
?>
