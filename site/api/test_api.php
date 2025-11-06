<?php
// Simple test of the API - override the file path for local testing
function getProjectData($projectId) {
    $htmlFile = "/home/andy/work/projects/roflfaucet/site/project-{$projectId}.html";
    
    if (!file_exists($htmlFile)) {
        return ['success' => false, 'error' => 'Project not found'];
    }
    
    $html = file_get_contents($htmlFile);
    if ($html === false) {
        return ['success' => false, 'error' => 'Failed to read project file'];
    }
    
    // Extract markdown from HTML file using comment markers
    $fullDescriptionMarkdown = extractByComments($html, 'full-description-md', '');
    // If no markdown found, try to extract from old HTML format as fallback
    if (empty($fullDescriptionMarkdown)) {
        $fullDescriptionHtml = extractByComments($html, 'full-description', '');
        // Convert HTML paragraphs back to markdown for editing
        $fullDescriptionMarkdown = preg_replace('/<\/p>\s*<p>/i', "\n\n", $fullDescriptionHtml);
        $fullDescriptionMarkdown = preg_replace('/<\/?p>/i', '', $fullDescriptionMarkdown);
        $fullDescriptionMarkdown = trim($fullDescriptionMarkdown);
    }
    
    $projectData = [
        'id' => $projectId,
        'title' => extractByComments($html, 'title', 'Untitled Project'),
        'description' => extractByComments($html, 'description', ''),
        'full_description' => $fullDescriptionMarkdown,
        'recipient_name' => extractByComments($html, 'recipient-name', ''),
        'lightning_address' => extractByComments($html, 'lightning-address', ''),
        'website_url' => extractByComments($html, 'website-url', ''),
        'target_amount' => (int)extractByComments($html, 'target-amount', '50000'),
        'current_amount' => 5000,
        'supporters_count' => 3,
        'category' => 'General',
        'status' => 'active',
        'main_image' => null,
        'created_date' => '2024-10-13'
    ];
    
    return ['success' => true, 'data' => $projectData];
}

function extractByComments($html, $tag, $default = '') {
    $pattern = '/<!-- ' . preg_quote($tag, '/') . ' -->(.*?)<!-- end ' . preg_quote($tag, '/') . ' -->/s';
    if (preg_match($pattern, $html, $matches)) {
        return trim($matches[1]);
    }
    return $default;
}

$_GET = ['action' => 'get', 'project' => '002'];
$_SERVER['REQUEST_METHOD'] = 'GET';

// Test the local function directly
$result = getProjectData('002');
$output = json_encode($result);

echo "API Response:\n";
echo $output . "\n";

// Try to decode as JSON
$data = json_decode($output, true);
if ($data) {
    echo "\nJSON decoded successfully!\n";
    if (isset($data['data']['full_description'])) {
        echo "Full description: " . $data['data']['full_description'] . "\n";
    }
} else {
    echo "\nFailed to decode JSON\n";
}
?>