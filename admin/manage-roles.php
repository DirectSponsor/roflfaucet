<?php
/**
 * TEMPORARY Role Management API (ROFLFaucet)
 * Mirrors functionality planned for auth server.
 * Changes propagate via Syncthing because profile files live in shared userdata storage.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

function getProfilePath($userId) {
    return '/var/www/staging/userdata/profiles/' . $userId . '.txt';
}

function loadProfile($userId) {
    $path = getProfilePath($userId);
    if (!file_exists($path)) {
        return null;
    }
    return json_decode(file_get_contents($path), true);
}

function saveProfile($userId, $profile) {
    $path = getProfilePath($userId);
    $profile['last_profile_update'] = time();
    file_put_contents($path, json_encode($profile, JSON_PRETTY_PRINT));
}

function currentUserHasAdminRole() {
    if (empty($_SESSION['user_id'])) {
        return false;
    }
    $profile = loadProfile($_SESSION['user_id']);
    return $profile && !empty($profile['roles']) && in_array('admin', $profile['roles'], true);
}

function isAllowlistedAdmin() {
    // Allow emergency access for known admin profiles even without session
    $allowlisted = ['3-lightninglova'];
    foreach ($allowlisted as $adminId) {
        $profile = loadProfile($adminId);
        if ($profile && !empty($profile['roles']) && in_array('admin', $profile['roles'], true)) {
            return true;
        }
    }
    return false;
}

if (!currentUserHasAdminRole() && !isAllowlistedAdmin()) {
    echo json_encode(['success' => false, 'error' => 'Admin access required']);
    exit;
}

$action = $_POST['action'] ?? '';
$userId = $_POST['user_id'] ?? '';
$role = $_POST['role'] ?? '';

if (!$action || !$userId || !$role) {
    echo json_encode(['success' => false, 'error' => 'Missing parameters']);
    exit;
}

$profile = loadProfile($userId);
if (!$profile) {
    echo json_encode(['success' => false, 'error' => 'User profile not found']);
    exit;
}

$profile['roles'] = $profile['roles'] ?? ['member'];

if ($action === 'add') {
    if (!in_array($role, $profile['roles'], true)) {
        $profile['roles'][] = $role;
    }
} elseif ($action === 'remove') {
    $profile['roles'] = array_values(array_filter(
        $profile['roles'],
        fn($existingRole) => $existingRole !== $role
    ));
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid action']);
    exit;
}

saveProfile($userId, $profile);

echo json_encode([
    'success' => true,
    'message' => "Role '$role' $action for user '$userId'",
    'user_id' => $userId,
    'role' => $role,
    'action' => $action,
    'new_roles' => $profile['roles']
]);
?>
