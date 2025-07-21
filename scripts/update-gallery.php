#!/usr/bin/env php
<?php
/**
 * Daily Gallery Updater
 * Run via cron: 0 2 * * * /path/to/your/site/scripts/update-gallery.php
 */

// Set working directory to script location
chdir(dirname(__FILE__));

// Include gallery system
require_once '../includes/gallery-system.php';

echo "=== ROFLFaucet Gallery Updater ===\n";
echo "Started at: " . date('Y-m-d H:i:s') . "\n\n";

// Update gallery images
$result = updateGalleryImages();

if ($result) {
    echo "\n✅ Gallery updated successfully!\n";
    
    // Show stats
    $stats = getGalleryStats();
    echo "Images: {$stats['count']}\n";
    echo "Last updated: {$stats['last_updated']}\n";
} else {
    echo "\n❌ Gallery update failed!\n";
    echo "Using fallback images.\n";
}

echo "\nCompleted at: " . date('Y-m-d H:i:s') . "\n";
echo "=====================================\n";
?>
