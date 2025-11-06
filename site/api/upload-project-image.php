<?php
// upload-project-image.php - Handle project image uploads
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Check if it's a POST request with file upload
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_FILES['image'])) {
    echo json_encode(['success' => false, 'error' => 'No image file provided']);
    exit;
}

$projectId = $_POST['project_id'] ?? '';
if (empty($projectId)) {
    echo json_encode(['success' => false, 'error' => 'Project ID required']);
    exit;
}

$uploadedFile = $_FILES['image'];

// Validate upload
if ($uploadedFile['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'error' => 'Upload failed: ' . $uploadedFile['error']]);
    exit;
}

// Validate file size (max 2MB)
if ($uploadedFile['size'] > 2 * 1024 * 1024) {
    echo json_encode(['success' => false, 'error' => 'File too large. Maximum 2MB allowed.']);
    exit;
}

// Validate file type - JPG only for simplicity
$allowedTypes = ['image/jpeg', 'image/jpg'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $uploadedFile['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowedTypes)) {
    echo json_encode(['success' => false, 'error' => 'Please upload a JPG image file. Other formats will be converted automatically.']);
    exit;
}

// Create upload directory if it doesn't exist
$uploadDir = '/var/www/html/images/projects/';
if (!file_exists($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        echo json_encode(['success' => false, 'error' => 'Failed to create upload directory']);
        exit;
    }
}

// Always use .jpg extension for simplicity
$filename = 'project-' . $projectId . '.jpg';
$targetPath = $uploadDir . $filename;

error_log('DEBUG upload: projectId=' . $projectId);
error_log('DEBUG upload: filename=' . $filename);
error_log('DEBUG upload: targetPath=' . $targetPath);

// File will be automatically overwritten if it exists

// Move uploaded file
if (move_uploaded_file($uploadedFile['tmp_name'], $targetPath)) {
    // Return the web-accessible URL
    $imageUrl = '/images/projects/' . $filename;
    
    echo json_encode([
        'success' => true,
        'image_url' => $imageUrl,
        'filename' => $filename
    ]);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to save uploaded file']);
}
?>