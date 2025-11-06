<?php
/**
 * Auto-completion Functions for Webhook
 * 
 * To be included in webhook.php for automatic project completion
 * Handles race conditions gracefully
 */

/**
 * Get project owner from HTML file
 */
function getProjectOwner($htmlFile) {
    $html = @file_get_contents($htmlFile);
    if (!$html) return null;
    
    if (preg_match('/<!-- OWNER: ([^\s]+) -->/', $html, $matches)) {
        return $matches[1];
    }
    return null;
}

/**
 * Get project target from HTML file
 */
function getProjectTarget($htmlFile) {
    $html = @file_get_contents($htmlFile);
    if (!$html) return 0;
    
    if (preg_match('/<!-- target-amount -->(.*?)<!-- end target-amount -->/s', $html, $matches)) {
        return (int)str_replace(',', '', trim($matches[1]));
    }
    return 0;
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
 * Find next active project for user
 */
function getNextProjectForUser($username, $projectsDir) {
    $userDir = $projectsDir . '/' . $username;
    if (!is_dir($userDir)) {
        return null;
    }
    
    $htmlFiles = glob($userDir . '/*.html');
    $projectNumbers = [];
    
    foreach ($htmlFiles as $file) {
        if (preg_match('/\/(\d+)\.html$/', $file, $matches)) {
            $projectNumbers[] = $matches[1];
        }
    }
    
    if (empty($projectNumbers)) {
        return null;
    }
    
    sort($projectNumbers);
    return $projectNumbers[0]; // Lowest number = next active
}

/**
 * Add rollover transaction to ledger
 */
function addRolloverTransaction($fromProject, $toProject, $amount, $ledgerFile, $logFunction) {
    $ledger = [];
    if (file_exists($ledgerFile)) {
        $ledger = json_decode(file_get_contents($ledgerFile), true) ?? [];
    }
    
    $rolloverEntry = [
        'id' => 'TX-' . date('Y') . '-' . uniqid(),
        'timestamp' => date('Y-m-d H:i:s'),
        'type' => 'project_donation',
        'project_id' => $toProject,
        'amount_sats' => $amount,
        'donor_name' => 'System',
        'notes' => "Rollover from completed project $fromProject (excess funds after reaching goal)",
        'system' => 'auto-completion',
        'processed_by' => 'webhook'
    ];
    
    $ledger[] = $rolloverEntry;
    
    // Atomic write
    $tempFile = $ledgerFile . '.tmp';
    if (file_put_contents($tempFile, json_encode($ledger, JSON_PRETTY_PRINT), LOCK_EX)) {
        rename($tempFile, $ledgerFile);
        $logFunction("Rollover transaction added: $amount sats from $fromProject to $toProject");
        return true;
    }
    
    return false;
}

/**
 * Mark project HTML as completed
 */
function markProjectCompleted($htmlFile, $logFunction) {
    $html = @file_get_contents($htmlFile);
    if (!$html) return false;
    
    // Update status comment tag
    $html = preg_replace(
        '/<!-- status -->.*?<!-- end status -->/s',
        '<!-- status -->completed<!-- end status -->',
        $html
    );
    
    // Add archived banner after opening body tag
    $archivedBanner = '
<div style="background: #f39c12; color: #000; padding: 15px; text-align: center; font-weight: bold; border-bottom: 3px solid #e67e22;">
    ⚠️ PROJECT COMPLETED - This project has reached its goal and is now archived. Donations are no longer accepted.
</div>
';
    
    // Insert banner after <body> tag
    $html = preg_replace(
        '/(<body[^>]*>)/i',
        '$1' . $archivedBanner,
        $html
    );
    
    // Disable donation buttons/forms
    $html = preg_replace(
        '/(<button[^>]*donate[^>]*>.*?<\/button>)/is',
        '<div style="display:none;">$1</div>',
        $html
    );
    
    if (file_put_contents($htmlFile, $html, LOCK_EX)) {
        $logFunction("Marked project HTML as completed: " . basename($htmlFile));
        return true;
    }
    
    return false;
}

/**
 * Auto-complete project if goal reached
 * Returns: ['completed' => bool, 'redirected' => bool, 'next_project' => string|null]
 */
function autoCompleteIfGoalReached($projectId, $donationAmount, $projectsDir, $ledgerFile, $logFunction) {
    $result = ['completed' => false, 'redirected' => false, 'next_project' => null];
    
    // Find project HTML file - try all users
    $projectFile = null;
    $username = null;
    
    $userDirs = glob($projectsDir . '/*', GLOB_ONLYDIR);
    foreach ($userDirs as $userDir) {
        $testFile = $userDir . '/' . $projectId . '.html';
        if (file_exists($testFile)) {
            $projectFile = $testFile;
            $username = basename($userDir);
            break;
        }
    }
    
    // RACE CONDITION: Project was already moved to completed by another webhook
    if (!$projectFile || !file_exists($projectFile)) {
        $logFunction("Project $projectId not found - may have been completed by concurrent donation");
        
        // Find owner from completed directory
        foreach ($userDirs as $userDir) {
            $completedFile = $userDir . '/completed/' . $projectId . '.html';
            if (file_exists($completedFile)) {
                $username = basename($userDir);
                $logFunction("Found completed project in $username/completed/");
                break;
            }
        }
        
        if ($username) {
            // Redirect donation to next project
            $nextProject = getNextProjectForUser($username, $projectsDir);
            if ($nextProject) {
                addRolloverTransaction($projectId, $nextProject, $donationAmount, $ledgerFile, $logFunction);
                $result['redirected'] = true;
                $result['next_project'] = $nextProject;
                $logFunction("Donation redirected to next project: $nextProject");
            }
        }
        
        return $result;
    }
    
    // Calculate current balance AFTER this donation
    $currentBalance = calculateProjectBalance($projectId, $ledgerFile);
    $targetAmount = getProjectTarget($projectFile);
    
    $logFunction("Project $projectId: balance=$currentBalance, target=$targetAmount");
    
    // Check if goal reached
    if ($currentBalance >= $targetAmount && $targetAmount > 0) {
        $logFunction("Project $projectId reached goal! Auto-completing...");
        
        $excess = $currentBalance - $targetAmount;
        $nextProject = getNextProjectForUser($username, $projectsDir);
        
        // Rollover excess to next project
        if ($excess > 0 && $nextProject) {
            addRolloverTransaction($projectId, $nextProject, $excess, $ledgerFile, $logFunction);
            $result['next_project'] = $nextProject;
        }
        
        // Mark HTML as completed
        markProjectCompleted($projectFile, $logFunction);
        
        // Move to completed directory
        $completedDir = dirname($projectFile) . '/completed';
        if (!is_dir($completedDir)) {
            mkdir($completedDir, 0755, true);
        }
        
        $completedFile = $completedDir . '/' . basename($projectFile);
        if (rename($projectFile, $completedFile)) {
            $logFunction("Project $projectId moved to completed/");
            $result['completed'] = true;
        }
    }
    
    return $result;
}
?>
