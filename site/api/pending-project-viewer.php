<?php
// pending-project-viewer.php - Serve pending project files with owner verification
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

$projectId = $_GET['id'] ?? '';
$filename = $_GET['file'] ?? '';
$requestingUser = $_GET['user'] ?? '';

if (empty($projectId) || empty($filename) || empty($requestingUser)) {
    echo json_encode(['success' => false, 'error' => 'Missing parameters']);
    exit;
}

try {
    // Security: Only allow alphanumeric and hyphens in filename to prevent directory traversal
    if (!preg_match('/^[a-zA-Z0-9\-\.]+$/', $filename)) {
        echo json_encode(['success' => false, 'error' => 'Invalid filename']);
        exit;
    }
    
    // Construct file path
    $pendingFile = "/var/roflfaucet-data/projects/pending/{$filename}";
    
    // Check if file exists
    if (!file_exists($pendingFile)) {
        echo json_encode(['success' => false, 'error' => 'Project file not found']);
        exit;
    }
    
    // Read file content
    $content = file_get_contents($pendingFile);
    if ($content === false) {
        echo json_encode(['success' => false, 'error' => 'Failed to read project file']);
        exit;
    }
    
    // Extract owner from HTML comment
    $owner = null;
    if (preg_match('/<!-- OWNER: ([^\s]+) -->/', $content, $matches)) {
        $owner = $matches[1];
    }
    
    // Verify ownership
    if ($owner !== $requestingUser) {
        echo json_encode(['success' => false, 'error' => 'Access denied']);
        exit;
    }
    
    // Remove the OWNER comment from displayed content for cleanliness
    $displayContent = preg_replace('/<!-- OWNER: [^\s]+ -->\s*/', '', $content);
    
    echo json_encode([
        'success' => true,
        'content' => $displayContent,
        'project_id' => $projectId,
        'filename' => $filename,
        'owner' => $owner
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>