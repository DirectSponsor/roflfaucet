<?php
// project-management-api.php - Handle project editing and management
error_reporting(E_ALL);
ini_set('display_errors', 0); // Disable error display to prevent malformed JSON

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Read raw input - POST requests only for security
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit;
}

$action = $input['action'] ?? '';

try {
    switch ($action) {
        case 'get_project':
            $projectId = $input['project_id'] ?? '';
            $username = $input['username'] ?? '';
            
            // Require authentication to load project data for editing
            if (empty($username)) {
                echo json_encode(['success' => false, 'error' => 'Username required']);
                break;
            }
            
            // Check if user can edit this project before showing data
            if (!canUserEditProject($username, $projectId)) {
                echo json_encode(['success' => false, 'error' => 'Access denied']);
                break;
            }
            
            echo json_encode(getProjectData($projectId));
            break;
            
        case 'update_project':
            echo json_encode(updateProject($input));
            break;
            
        default:
            echo json_encode(['success' => false, 'error' => 'Unknown action']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function getProjectData($projectId) {
    $htmlFile = "/var/www/html/project-{$projectId}.html";
    
    if (!file_exists($htmlFile)) {
        return ['success' => false, 'error' => 'Project not found'];
    }
    
    $html = file_get_contents($htmlFile);
    if ($html === false) {
        return ['success' => false, 'error' => 'Failed to read project file'];
    }
    
    // Extract HTML and convert to plain text for textarea editing
    $fullDescriptionHtml = extractByComments($html, 'full-description', '');
    // Decode HTML entities first, then convert HTML paragraphs to plain text
    $fullDescriptionHtml = html_entity_decode($fullDescriptionHtml, ENT_QUOTES, 'UTF-8');
    $fullDescriptionText = preg_replace('/<\/p>\s*<p>/i', "\n\n", $fullDescriptionHtml);
    $fullDescriptionText = preg_replace('/<\/?p>/i', '', $fullDescriptionText);
    $fullDescriptionText = trim($fullDescriptionText);
    
    $projectData = [
        'id' => $projectId,
        'title' => extractByComments($html, 'title', 'Untitled Project'),
        'description' => extractByComments($html, 'description', ''),
        'full_description' => $fullDescriptionText,
        'recipient_name' => extractByComments($html, 'recipient-name', ''),
        'lightning_address' => extractByComments($html, 'lightning-address', ''),
        'website_url' => extractByComments($html, 'website-url', ''),
        'target_amount' => (int)extractByComments($html, 'target-amount', '50000'),
        'current_amount' => 5000,  // Mock for now - would come from donation system
        'supporters_count' => 3,   // Mock for now - would come from donation system
        'category' => 'General',   // Could be extracted or stored separately
        'status' => 'active',
        'main_image' => null,
        'created_date' => '2024-10-13'
    ];
    
    return ['success' => true, 'data' => $projectData];
}

// Helper function to extract content between comment markers
function extractByComments($html, $tag, $default = '') {
    $pattern = '/<!-- ' . preg_quote($tag, '/') . ' -->(.*?)<!-- end ' . preg_quote($tag, '/') . ' -->/s';
    if (preg_match($pattern, $html, $matches)) {
        return trim($matches[1]);
    }
    return $default;
}

// Helper function to update content between comment markers
function updateByComments($html, $tag, $newContent) {
    $pattern = '/<!-- ' . preg_quote($tag, '/') . ' -->.*?<!-- end ' . preg_quote($tag, '/') . ' -->/s';
    $replacement = '<!-- ' . $tag . ' -->' . $newContent . '<!-- end ' . $tag . ' -->';
    return preg_replace($pattern, $replacement, $html);
}

function updateProject($data) {
    $projectId = $data['project_id'] ?? '';
    $username = $data['username'] ?? ''; // We'll need to pass username from client
    
    // Basic validation
    if (empty($projectId)) {
        return ['success' => false, 'error' => 'Project ID required'];
    }
    
    if (empty($data['title'])) {
        return ['success' => false, 'error' => 'Title is required'];
    }
    
    if (empty($data['description'])) {
        return ['success' => false, 'error' => 'Description is required'];
    }
    
    if (!is_numeric($data['target_amount']) || $data['target_amount'] < 1000) {
        return ['success' => false, 'error' => 'Target amount must be at least 1000 sats'];
    }
    
    if (!filter_var($data['lightning_address'], FILTER_VALIDATE_EMAIL)) {
        return ['success' => false, 'error' => 'Valid lightning address required'];
    }
    
    // Check if project file exists and user can edit it
    $htmlFile = "/var/www/html/project-{$projectId}.html";
    if (!file_exists($htmlFile)) {
        return ['success' => false, 'error' => 'Project not found'];
    }
    
    // Dynamic ownership check using the file-based system
    if (!canUserEditProject($username, $projectId)) {
        return ['success' => false, 'error' => 'Access denied: You can only edit your own projects'];
    }
    
    // Proceed with update since user has permission
    // Convert double line breaks to HTML paragraphs
    $fullDescriptionText = $data['full_description'] ?? '';
    $fullDescriptionHtml = '';
    if (!empty(trim($fullDescriptionText))) {
        $paragraphs = explode("\n\n", trim($fullDescriptionText));
        $htmlParagraphs = [];
        foreach ($paragraphs as $paragraph) {
            $paragraph = trim($paragraph);
            if (!empty($paragraph)) {
                $htmlParagraphs[] = '<p>' . htmlspecialchars($paragraph) . '</p>';
            }
        }
        $fullDescriptionHtml = implode("\n\n", $htmlParagraphs);
    }
    
    $updateData = [
        'title' => htmlspecialchars($data['title']),
        'description' => htmlspecialchars($data['description']),
        'full_description' => $fullDescriptionHtml,
        'target_amount' => (int)$data['target_amount'],
        'recipient_name' => htmlspecialchars($data['recipient_name'] ?? ''),
        'lightning_address' => htmlspecialchars($data['lightning_address']),
        'website_url' => htmlspecialchars($data['website_url'] ?? ''),
        'main_image' => htmlspecialchars($data['main_image'] ?? '')
    ];
    
    // Update the actual HTML file
    $updateResult = updateProjectHtmlFile($projectId, $updateData);
    
    if ($updateResult) {
        // Log the successful update
        $updateLog = [
            'timestamp' => date('Y-m-d H:i:s'),
            'project_id' => $projectId,
            'action' => 'update_project',
            'data' => $updateData
        ];
        
        $logFile = '/tmp/project_updates.log';
        file_put_contents($logFile, json_encode($updateLog) . "\n", FILE_APPEND);
        
        return [
            'success' => true, 
            'message' => 'Project updated successfully and changes are now live!'
        ];
    } else {
        return [
            'success' => false, 
            'error' => 'Failed to update project file'
        ];
    }
}

// Function to update the actual project HTML file
function updateProjectHtmlFile($projectId, $projectData) {
    $htmlFile = "/var/www/html/project-{$projectId}.html";
    
    if (!file_exists($htmlFile)) {
        return false;
    }
    
    // Read the current HTML file
    $html = file_get_contents($htmlFile);
    
    if ($html === false) {
        return false;
    }
    
    // Update content using comment markers - much more robust!
    $html = updateByComments($html, 'title', $projectData['title']);
    $html = updateByComments($html, 'description', $projectData['description']);
    $html = updateByComments($html, 'full-description', $projectData['full_description']);
    $html = updateByComments($html, 'recipient-name', $projectData['recipient_name']);
    $html = updateByComments($html, 'lightning-address', $projectData['lightning_address']);
    $html = updateByComments($html, 'website-url', $projectData['website_url']);
    $html = updateByComments($html, 'target-amount', number_format($projectData['target_amount']));
    
    // Update main image if provided
    if (!empty($projectData['main_image'])) {
        $imageHtml = '<div class="project-main-image" style="margin-bottom: 20px;"><img src="' . $projectData['main_image'] . '" alt="Project Image" style="max-width: 100%; max-height: 400px; object-fit: cover; border-radius: 8px;"></div>';
        $html = updateByComments($html, 'main-image', $imageHtml);
    }
    
    // Write the updated HTML back to the file
    $result = file_put_contents($htmlFile, $html);
    
    return $result !== false;
}

// Function to check project ownership by reading from project file
function canUserEditProject($username, $projectId) {
    $htmlFile = "/var/www/html/project-{$projectId}.html";
    
    if (!file_exists($htmlFile)) {
        return false;
    }
    
    // Read the HTML file to extract owner information
    $html = file_get_contents($htmlFile);
    if ($html === false) {
        return false;
    }
    
    // Extract owner from HTML comment or meta tag
    // Look for owner in HTML comments like: <!-- OWNER: username -->
    if (preg_match('/<!-- OWNER: ([^\s]+) -->/', $html, $matches)) {
        return $matches[1] === $username;
    }
    
    // Fallback: hardcoded for existing projects during transition
    if ($projectId === '001' && $username === 'lightninglova') {
        return true;
    }
    if ($projectId === '002' && $username === 'andytest1') {
        return true;
    }
    
    return false;
}
?>