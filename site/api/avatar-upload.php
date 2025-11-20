<?php
/**
 * ROFLFaucet Secure Avatar Upload API
 * 
 * Simple and secure avatar upload system that integrates with existing txt file profile system.
 * 
 * SECURITY FEATURES:
 * - Only JPEG and PNG allowed (safest image formats)
 * - 512KB file size limit (reasonable for avatars)
 * - Magic byte validation (not just MIME type)
 * - Safe filename generation
 * - No image processing (avoids GD dependency and exploits)
 * - Automatic cleanup of old avatars
 * 
 * @author ROFLFaucet Dev Team
 * @version 2.0 (Secure)
 * @date 2025-09-20
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// SECURE Configuration
define('MAX_FILE_SIZE', 512 * 1024); // 512KB max
define('ALLOWED_TYPES', ['image/jpeg', 'image/png']); // Only safest formats
define('AVATAR_DIR', '/var/roflfaucet-data/avatars/'); // Protected from deployment overwrites
define('AVATAR_URL_BASE', 'images/avatars/'); // Public URL path (via Apache Alias)

/**
 * Get user ID from request
 */
function getUserId() {
    if (!empty($_POST['user_id'])) {
        return $_POST['user_id'];
    }
    if (!empty($_GET['user_id'])) {
        return $_GET['user_id'];
    }
    return null;
}

/**
 * Update user's profile avatar field
 */
function updateProfileAvatar($userId, $avatarValue) {
    $profileFile = __DIR__ . "/../userdata/profiles/{$userId}.txt";
    
    if (!file_exists($profileFile)) {
        return false;
    }
    
    $data = json_decode(file_get_contents($profileFile), true);
    if (!$data) {
        return false;
    }
    
    $data['avatar'] = $avatarValue;
    $data['last_profile_update'] = time();
    
    return file_put_contents($profileFile, json_encode($data, JSON_PRETTY_PRINT)) !== false;
}

/**
 * Validate image file securely
 */
function validateImageFile($filePath, $mimeType) {
    $handle = fopen($filePath, 'rb');
    if (!$handle) {
        return false;
    }
    
    $firstBytes = fread($handle, 8);
    fclose($handle);
    
    // Check magic bytes (file signatures)
    if ($mimeType === 'image/jpeg' && substr($firstBytes, 0, 2) === "\xFF\xD8") {
        return 'jpg';
    } elseif ($mimeType === 'image/png' && substr($firstBytes, 0, 8) === "\x89PNG\r\n\x1A\n") {
        return 'png';
    }
    
    return false;
}

/**
 * Clean up old avatar files for user
 */
function cleanupOldAvatars($userId) {
    $patterns = [
        AVATAR_DIR . $userId . '.jpg',
        AVATAR_DIR . $userId . '.png'
    ];
    
    foreach ($patterns as $pattern) {
        if (file_exists($pattern)) {
            unlink($pattern);
        }
    }
}

// Main API Logic
$userId = getUserId();
if (!$userId) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'upload') {
    // UPLOAD AVATAR
    
    if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'No valid file uploaded']);
        exit;
    }
    
    $file = $_FILES['avatar'];
    
    // Validate file size
    if ($file['size'] > MAX_FILE_SIZE) {
        http_response_code(400);
        echo json_encode(['error' => 'File too large (max 512KB)']);
        exit;
    }
    
    // Validate MIME type
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, ALLOWED_TYPES)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file type. Only JPEG and PNG allowed.']);
        exit;
    }
    
    // Validate file signature (magic bytes)
    $extension = validateImageFile($file['tmp_name'], $mimeType);
    if (!$extension) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid image file format.']);
        exit;
    }
    
    // Generate secure filename
    $filename = $userId . '.' . $extension;
    $destPath = AVATAR_DIR . $filename;
    
    // Ensure directory exists
    if (!is_dir(AVATAR_DIR)) {
        mkdir(AVATAR_DIR, 0755, true);
    }
    
    // Clean up any existing avatars
    cleanupOldAvatars($userId);
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save image']);
        exit;
    }
    
    // Update profile
    $avatarValue = 'uploaded:' . $filename;
    if (updateProfileAvatar($userId, $avatarValue)) {
        echo json_encode([
            'success' => true,
            'message' => 'Avatar uploaded successfully',
            'avatar' => $avatarValue,
            'url' => AVATAR_URL_BASE . $filename
        ]);
    } else {
        // Clean up file if profile update failed
        unlink($destPath);
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update profile']);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'delete') {
    // DELETE AVATAR
    
    cleanupOldAvatars($userId);
    
    // Revert to default emoji avatar
    if (updateProfileAvatar($userId, '👤')) {
        echo json_encode([
            'success' => true,
            'message' => 'Avatar deleted successfully',
            'avatar' => '👤'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update profile']);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'url') {
    // GET AVATAR URL
    
    $extensions = ['jpg', 'png'];
    $foundFile = null;
    
    foreach ($extensions as $ext) {
        $filename = $userId . '.' . $ext;
        $filePath = AVATAR_DIR . $filename;
        if (file_exists($filePath)) {
            $foundFile = $filename;
            break;
        }
    }
    
    if ($foundFile) {
        echo json_encode([
            'success' => true,
            'has_uploaded_avatar' => true,
            'url' => AVATAR_URL_BASE . $foundFile,
            'avatar' => 'uploaded:' . $foundFile
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'has_uploaded_avatar' => false,
            'avatar' => '👤'
        ]);
    }
    
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request. Use POST ?action=upload|delete or GET ?action=url']);
}
?>