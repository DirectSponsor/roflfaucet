<?php
/**
 * GIPHY Gallery Fetcher
 * Uses GIPHY API to fetch all GIFs from RoflFaucet collection
 * Creates JavaScript gallery data for the website
 */

// GIPHY API configuration
$api_key = 'hhW0mi4fTaEb8WIn5pon2JN5Gj6C7qAm';
$username = 'RoflFaucet';

// All 15 GIF IDs from the RoflFaucet gallery
$gif_ids = [
    'CaOXbNkbMwr0Lmkrej',
    'PjLJbT5e4olNA8rW3v', 
    '7MAo6K10qron0Yvrov',
    's4dYanbuIqq5jIXYSF',
    'sQELeRCWtfzSLs2KBa',
    'A8DG0BTEkRIee7kyLF',
    'f0ZLcAg1YR91PJdeGG',
    'pPJQbTV4MipOT5dntb',
    'KB54HLRuPF0qootDRd',
    'A9xU0bU9X17ZuSh54i',
    '7ZT4rNFY8gxIRRpIFF',
    'JqsRlnOQwtdJmrKtMu',
    'dvnLYqiFP73QYNycqg',
    'VEeh928onskB4H7QzU',
    'A6yaCQYpX0d5POXEtg'
];

function fetchGiphyData($gif_id, $api_key) {
    $url = "https://api.giphy.com/v1/gifs/{$gif_id}?api_key={$api_key}";
    $response = file_get_contents($url);
    
    if ($response === FALSE) {
        echo "Error fetching GIF data for ID: {$gif_id}\n";
        return null;
    }
    
    $data = json_decode($response, true);
    
    if (!$data || !isset($data['data'])) {
        echo "Invalid response for GIF ID: {$gif_id}\n";
        return null;
    }
    
    $gif = $data['data'];
    
    // Extract the data we need
    return [
        'id' => $gif['id'],
        'title' => $gif['title'] ?: 'Laughing GIF',
        'url' => $gif['images']['original']['url'] ?? $gif['images']['downsized']['url'],
        'preview_url' => $gif['images']['fixed_width']['url'] ?? $gif['images']['preview_gif']['url'],
        'page_url' => $gif['url'],
        'username' => $gif['username'] ?? 'RoflFaucet',
        'width' => $gif['images']['original']['width'] ?? '480',
        'height' => $gif['images']['original']['height'] ?? '480'
    ];
}

echo "Fetching GIPHY gallery data...\n";
echo "API Key: " . substr($api_key, 0, 8) . "...\n";
echo "Total GIFs to fetch: " . count($gif_ids) . "\n\n";

$gallery_data = [];
$api_calls = 0;

foreach ($gif_ids as $gif_id) {
    echo "Fetching GIF: {$gif_id}... ";
    $gif_data = fetchGiphyData($gif_id, $api_key);
    $api_calls++;
    
    if ($gif_data) {
        $gallery_data[] = $gif_data;
        echo "✅ Success\n";
    } else {
        echo "❌ Failed\n";
    }
    
    // Be nice to the API
    usleep(100000); // 0.1 second delay
}

echo "\n=== RESULTS ===\n";
echo "API calls used: {$api_calls}/100\n";
echo "GIFs successfully fetched: " . count($gallery_data) . "\n";

// Generate JavaScript gallery object
echo "\n=== JAVASCRIPT GALLERY DATA ===\n";
echo "giphy: {\n";
echo "    name: 'GIPHY Laughing Gallery',\n";
echo "    images: [\n";

foreach ($gallery_data as $index => $gif) {
    $comma = ($index < count($gallery_data) - 1) ? ',' : '';
    
    echo "        {\n";
    echo "            id: '{$gif['id']}',\n";
    echo "            url: '{$gif['url']}',\n";
    echo "            pageUrl: '{$gif['page_url']}',\n";
    echo "            alt: '{$gif['title']}',\n";
    echo "            preview: '{$gif['preview_url']}',\n";
    echo "            username: '{$gif['username']}'\n";
    echo "        }{$comma}\n";
}

echo "    ]\n";
echo "}\n";

echo "\n=== SUMMARY ===\n";
echo "✅ Copy the JavaScript object above and paste it into scripts/core/gallery-system.js\n";
echo "✅ Replace the existing GIPHY gallery section\n";
echo "✅ This will give you a fully working GIPHY gallery with proper metadata\n";
echo "\nRemaining API calls: " . (100 - $api_calls) . "/100\n";

?>
