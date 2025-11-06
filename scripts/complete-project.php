#!/usr/bin/env php
<?php
/**
 * Complete Project Script
 * 
 * Marks a project as complete and rolls over excess funds to next project
 * Usage: php complete-project.php <username> <project_id>
 */

define('ROFLFAUCET_DATA_DIR', '/var/roflfaucet-data');
define('PROJECTS_DIR', ROFLFAUCET_DATA_DIR . '/projects');
define('LEDGER_FILE', ROFLFAUCET_DATA_DIR . '/data/accounts-ledger.json');

function calculateProjectBalance($projectId) {
    if (!file_exists(LEDGER_FILE)) {
        return 0;
    }
    
    $ledger = json_decode(file_get_contents(LEDGER_FILE), true);
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

function getProjectTarget($projectFile) {
    $html = file_get_contents($projectFile);
    if (!$html) return 0;
    
    // Extract target from HTML comment
    if (preg_match('/<!-- target-amount -->(.*?)<!-- end target-amount -->/s', $html, $matches)) {
        return (int)str_replace(',', '', trim($matches[1]));
    }
    return 0;
}

function getNextProject($username) {
    $userDir = PROJECTS_DIR . '/' . $username;
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

function addRolloverToLedger($fromProject, $toProject, $amount) {
    $ledger = [];
    if (file_exists(LEDGER_FILE)) {
        $ledger = json_decode(file_get_contents(LEDGER_FILE), true) ?? [];
    }
    
    $rolloverEntry = [
        'type' => 'project_donation',
        'project_id' => $toProject,
        'amount_sats' => $amount,
        'timestamp' => date('Y-m-d H:i:s'),
        'donor_name' => 'System',
        'note' => "Rollover from completed project $fromProject (excess funds after reaching goal)"
    ];
    
    $ledger[] = $rolloverEntry;
    
    file_put_contents(LEDGER_FILE, json_encode($ledger, JSON_PRETTY_PRINT));
    return true;
}

// Main script
if ($argc < 3) {
    echo "Usage: php complete-project.php <username> <project_id>\n";
    echo "Example: php complete-project.php lightninglova 001\n";
    exit(1);
}

$username = $argv[1];
$projectId = $argv[2];

$userDir = PROJECTS_DIR . '/' . $username;
$projectFile = $userDir . '/' . $projectId . '.html';

if (!file_exists($projectFile)) {
    echo "Error: Project file not found: $projectFile\n";
    exit(1);
}

// Calculate current balance
$currentBalance = calculateProjectBalance($projectId);
$targetAmount = getProjectTarget($projectFile);

echo "\n=== Project Completion ===\n";
echo "User: $username\n";
echo "Project: $projectId\n";
echo "Current Balance: $currentBalance sats\n";
echo "Target Amount: $targetAmount sats\n";

// Check if there's excess
$excess = $currentBalance - $targetAmount;

if ($excess < 0) {
    echo "\nWarning: Project has NOT reached target yet!\n";
    echo "Shortfall: " . abs($excess) . " sats\n";
    echo "\nProceed anyway? (yes/no): ";
    $confirm = trim(fgets(STDIN));
    if ($confirm !== 'yes') {
        echo "Cancelled.\n";
        exit(0);
    }
    $excess = 0; // No rollover if under target
}

echo "Excess to rollover: $excess sats\n";

// Get next project
$nextProject = getNextProject($username);

if ($excess > 0 && $nextProject) {
    echo "Next active project: $nextProject\n";
    echo "\nRollover $excess sats to project $nextProject? (yes/no): ";
    $confirm = trim(fgets(STDIN));
    
    if ($confirm === 'yes') {
        addRolloverToLedger($projectId, $nextProject, $excess);
        echo "✓ Rollover transaction added to ledger\n";
    } else {
        echo "Skipped rollover.\n";
    }
} else if ($excess > 0 && !$nextProject) {
    echo "\nNote: No next project found. Excess funds will remain in account.\n";
}

// Move project to completed
$completedDir = $userDir . '/completed';
if (!is_dir($completedDir)) {
    mkdir($completedDir, 0755, true);
}

$completedFile = $completedDir . '/' . $projectId . '.html';

// Update HTML to mark as completed
$html = file_get_contents($projectFile);
if ($html) {
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
    
    // Disable/hide donation form by wrapping in display:none div
    // Look for common donation form patterns
    $html = preg_replace(
        '/(<form[^>]*donate[^>]*>.*?<\/form>)/is',
        '<div style="display:none;">$1</div>',
        $html
    );
    
    // Also hide any donate buttons
    $html = preg_replace(
        '/(<[^>]*class=["\'][^"\']*(donate|payment)[^"\'][^"\']*["\'][^>]*>)/i',
        '<div style="display:none;">$1</div>',
        $html
    );
    
    file_put_contents($projectFile, $html);
    echo "✓ Updated HTML to mark as completed and disable donations\n";
}

rename($projectFile, $completedFile);

echo "✓ Moved $projectId.html to completed/\n";

// Show new active project
$newActive = getNextProject($username);
if ($newActive) {
    $newBalance = calculateProjectBalance($newActive);
    echo "\n=== New Active Project ===\n";
    echo "Project: $newActive\n";
    echo "Starting Balance: $newBalance sats\n";
} else {
    echo "\nNo more active projects for $username\n";
}

echo "\nComplete!\n\n";
?>
