<?php
/**
 * Cleanup Expired Lightning Invoices
 * Removes invoices older than 24 hours from pending.json
 * Run daily via cron job to keep pending invoices list manageable
 */

// Configuration
define('DATA_DIR', __DIR__ . '/../payments/data/donations/');
define('LOG_FILE', __DIR__ . '/../payments/data/logs/cleanup.log');
define('EXPIRATION_HOURS', 24);

/**
 * Log cleanup events
 */
function logCleanup($message, $level = 'INFO') {
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$level] $message" . PHP_EOL;
    @file_put_contents(LOG_FILE, $logEntry, FILE_APPEND | LOCK_EX);
}

/**
 * Load JSON data from file with locking
 */
function loadJsonData($filename) {
    $filepath = DATA_DIR . $filename;
    if (!file_exists($filepath)) {
        return [];
    }
    
    $handle = fopen($filepath, 'r');
    if (!$handle || !flock($handle, LOCK_SH)) {
        return [];
    }
    
    $content = fread($handle, filesize($filepath) ?: 0);
    flock($handle, LOCK_UN);
    fclose($handle);
    
    return json_decode($content, true) ?: [];
}

/**
 * Save JSON data to file with locking
 */
function saveJsonData($filename, $data) {
    $filepath = DATA_DIR . $filename;
    $tempFile = $filepath . '.tmp';
    
    $handle = fopen($tempFile, 'w');
    if (!$handle || !flock($handle, LOCK_EX)) {
        return false;
    }
    
    fwrite($handle, json_encode($data, JSON_PRETTY_PRINT));
    flock($handle, LOCK_UN);
    fclose($handle);
    
    return rename($tempFile, $filepath);
}

/**
 * Clean up expired invoices
 */
function cleanupExpiredInvoices() {
    logCleanup("Starting invoice cleanup...");
    
    // Load pending invoices
    $pending = loadJsonData('pending.json');
    if (empty($pending)) {
        logCleanup("No pending invoices found");
        return;
    }
    
    $initialCount = count($pending);
    $cutoffTime = time() - (EXPIRATION_HOURS * 3600); // 24 hours ago
    
    // Filter out expired invoices
    $activePending = array_filter($pending, function($invoice) use ($cutoffTime) {
        $createdTime = strtotime($invoice['created_at'] ?? '');
        if (!$createdTime) {
            logCleanup("Invalid created_at timestamp for invoice: " . ($invoice['id'] ?? 'unknown'), 'WARNING');
            return false; // Remove invoices with invalid timestamps
        }
        return $createdTime > $cutoffTime;
    });
    
    // Reindex array (remove gaps from filtering)
    $activePending = array_values($activePending);
    $finalCount = count($activePending);
    $removedCount = $initialCount - $finalCount;
    
    // Save updated list if anything was removed
    if ($removedCount > 0) {
        if (saveJsonData('pending.json', $activePending)) {
            logCleanup("Successfully removed $removedCount expired invoices (kept $finalCount active)");
        } else {
            logCleanup("Failed to save updated pending invoices", 'ERROR');
        }
    } else {
        logCleanup("No expired invoices found (checked $initialCount invoices)");
    }
    
    // Log summary
    if ($finalCount > 100) {
        logCleanup("Warning: $finalCount active invoices remaining - consider investigating", 'WARNING');
    }
}

// Main execution
try {
    // Ensure directories exist
    if (!is_dir(DATA_DIR)) {
        logCleanup("Data directory does not exist: " . DATA_DIR, 'ERROR');
        exit(1);
    }
    
    // Run cleanup
    cleanupExpiredInvoices();
    
    logCleanup("Cleanup completed successfully");
    
} catch (Exception $e) {
    logCleanup("Cleanup failed: " . $e->getMessage(), 'ERROR');
    exit(1);
}