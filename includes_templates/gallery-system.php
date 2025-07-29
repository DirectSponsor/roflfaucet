<?php
/**
 * ROFLFaucet Gallery System
 * Manages dynamic image rotation from PostImg
 */

// Gallery configuration
define('GALLERY_DATA_FILE', __DIR__ . '/../data/gallery-images.json');
define('POSTIMG_GALLERY_URL', 'https://postimg.cc/gallery/RJrzGL1');

/**
 * Get a random image URL from the gallery
 */
function getRandomGalleryImage() {
    $images = loadGalleryImages();
    if (empty($images)) {
        // Fallback images if file doesn't exist or is empty
        $fallback = [
            'https://i.postimg.cc/3JBvQqJt/anim-laughing-faucet-1.gif',
            'https://i.postimg.cc/j5nqvQw4/animal-muppet-laughing.gif',
            'https://i.postimg.cc/3RNcjKGv/baby.gif'
        ];
        return $fallback[array_rand($fallback)];
    }
    
    return $images[array_rand($images)];
}

/**
 * Load gallery images from JSON file
 */
function loadGalleryImages() {
    if (!file_exists(GALLERY_DATA_FILE)) {
        return [];
    }
    
    $data = json_decode(file_get_contents(GALLERY_DATA_FILE), true);
    return $data['images'] ?? [];
}

/**
 * Save gallery images to JSON file
 */
function saveGalleryImages($images) {
    $dataDir = dirname(GALLERY_DATA_FILE);
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0755, true);
    }
    
    $data = [
        'images' => $images,
        'last_updated' => date('Y-m-d H:i:s'),
        'count' => count($images)
    ];
    
    return file_put_contents(GALLERY_DATA_FILE, json_encode($data, JSON_PRETTY_PRINT));
}

/**
 * Fetch and update gallery images from PostImg
 * (Called by daily cron job)
 */
function updateGalleryImages() {
    echo "Fetching gallery from: " . POSTIMG_GALLERY_URL . "\n";
    
    $html = @file_get_contents(POSTIMG_GALLERY_URL);
    if (!$html) {
        echo "Error: Could not fetch gallery page\n";
        return false;
    }
    
    // Extract image URLs using regex
    $imageUrls = [];
    
    // Look for PostImg direct image URLs
    if (preg_match_all('/https:\/\/i\.postimg\.cc\/[A-Za-z0-9]+\/[A-Za-z0-9\-_]+\.(gif|jpg|jpeg|png)/i', $html, $matches)) {
        $imageUrls = array_unique($matches[0]);
    }
    
    if (empty($imageUrls)) {
        echo "Warning: No images found in gallery\n";
        return false;
    }
    
    echo "Found " . count($imageUrls) . " images\n";
    foreach ($imageUrls as $url) {
        echo "  - $url\n";
    }
    
    return saveGalleryImages($imageUrls);
}

/**
 * Get gallery stats (for admin/debugging)
 */
function getGalleryStats() {
    if (!file_exists(GALLERY_DATA_FILE)) {
        return ['count' => 0, 'last_updated' => 'Never'];
    }
    
    $data = json_decode(file_get_contents(GALLERY_DATA_FILE), true);
    return [
        'count' => $data['count'] ?? 0,
        'last_updated' => $data['last_updated'] ?? 'Unknown'
    ];
}
?>
