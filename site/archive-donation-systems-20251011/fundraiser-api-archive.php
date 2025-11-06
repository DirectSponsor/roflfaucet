<?php
/**
 * ROFLFaucet Fundraiser API
 * 
 * Manages fundraiser pages similar to BTCPay Server crowdfunding.
 * Designed to work with the flat-file system for simplicity and sync efficiency.
 * 
 * FILE STRUCTURE:
 * {
 *   "fundraiser_id": "lightning-lova-modem",
 *   "title": "Bitcoin Ghana Project - Internet Modem", 
 *   "tagline": "Help establish internet connectivity for Bitcoin Ghana education",
 *   "owner_user_id": "3-lightninglova",
 *   "type": "one-time", // or "monthly"
 *   "goal_amount": 150,
 *   "current_amount": 0,
 *   "currency": "USD",
 *   "status": "active", // "active", "completed", "paused", "cancelled"
 *   "created_date": 1728140700,
 *   "description": "Short description for cards/lists",
 *   "story": "Full story content with HTML support",
 *   "hero_image": "modem-need-photo.jpg",
 *   "images": ["image1.jpg", "image2.jpg"],
 *   "contact_info": {
 *     "preferred_contact": "roflfaucet_inbox",
 *     "location": "Ghana"
 *   },
 *   "lightning_address": "lightninglova@coinos.io",
 *   "transparency": {
 *     "show_donors": true,
 *     "show_amounts": false
 *   },
 *   "verification": {
 *     "verified_by": "admin",
 *     "verification_date": 1728140700,
 *     "verification_notes": "Verified community member"
 *   },
 *   "contributions": [],
 *   "updates": [],
 *   "last_updated": 1728140700
 * }
 * 
 * FEATURES:
 * - CRUD operations for fundraisers
 * - Role-based access control (fundraiser role required to create)
 * - Admin approval workflow
 * - Contribution tracking
 * - Progress updates
 * - Lightning payment integration ready
 * 
 * ENDPOINTS:
 * GET  ?action=list               - List all active fundraisers
 * GET  ?action=get&id=xxx         - Get specific fundraiser details
 * POST ?action=create             - Create new fundraiser (fundraiser role required)
 * POST ?action=update&id=xxx      - Update fundraiser (owner or admin)
 * POST ?action=add_contribution   - Add contribution record
 * POST ?action=add_update         - Add progress update
 * 
 * @author ROFLFaucet Dev Team
 * @version 1.0
 * @date 2025-10-07
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Get user ID from request 
 * @return string|null User ID or null if not provided
 */
function getUserId() {
    // Try different auth methods in order of preference
    if (!empty($_GET['user_id'])) {
        return $_GET['user_id'];
    }
    if (!empty($_POST['user_id'])) {
        return $_POST['user_id'];
    }
    $input = json_decode(file_get_contents('php://input'), true);
    if (!empty($input['user_id'])) {
        return $input['user_id'];
    }
    return null;
}

/**
 * Check if user has required role
 * @param string $userId User ID
 * @param array $requiredRoles Required roles
 * @return bool True if user has at least one required role
 */
function checkUserRole($userId, $requiredRoles) {
    $profileFile = __DIR__ . "/userdata/profiles/{$userId}.txt";
    if (!file_exists($profileFile)) {
        return false;
    }
    
    $profileData = json_decode(file_get_contents($profileFile), true);
    $userRoles = $profileData['roles'] ?? ['member'];
    
    foreach ($requiredRoles as $role) {
        if (in_array($role, $userRoles)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Check if user has fundraiser capability
 * Roles with fundraiser capability: recipient, fundraiser, admin
 * @param string $userId User ID
 * @return bool True if user can create fundraisers
 */
function checkFundraiserCapability($userId) {
    return checkUserRole($userId, ['recipient', 'fundraiser', 'admin']);
}

/**
 * Check if user has moderation capability  
 * Roles with moderation capability: moderator, admin
 * @param string $userId User ID
 * @return bool True if user can moderate fundraisers
 */
function checkModerationCapability($userId) {
    return checkUserRole($userId, ['moderator', 'admin']);
}

/**
 * Load fundraiser data with default structure
 * @param string $fundraiserFile Path to fundraiser file
 * @param string $fundraiserId Fundraiser ID
 * @return array|null Fundraiser data or null if not found
 */
function loadFundraiserData($fundraiserFile, $fundraiserId) {
    if (!file_exists($fundraiserFile)) {
        return null;
    }
    
    $data = json_decode(file_get_contents($fundraiserFile), true);
    if (!$data || !is_array($data)) {
        return null;
    }
    
    // Ensure all required fields exist
    return array_merge([
        'id' => $fundraiserId,
        'slug' => $fundraiserId,
        'title' => '',
        'tagline' => '',
        'owner_user_id' => '',
        'type' => 'one-time',
        'category' => 'general',
        'goal_amount' => 0,
        'current_amount' => 0,
        'currency' => 'USD',
        'status' => 'active',
        'created_date' => time(),
        'description' => '',
        'story' => '',
        'hero_image' => '',
        'images' => [],
        'contact_info' => [
            'preferred_contact' => 'roflfaucet_inbox',
            'location' => ''
        ],
        'lightning_address' => '',
        'transparency' => [
            'show_donors' => true,
            'show_amounts' => false
        ],
        'verification' => [
            'verified' => false,
            'verified_by' => '',
            'verification_date' => 0,
            'verification_notes' => ''
        ],
        'contributions' => [],
        'updates' => [],
        'tags' => [],
        'featured' => false,
        'allow_anonymous' => true,
        'minimum_contribution' => 1,
        'overflow_handling' => [
            'excess_amount' => 0,
            'pending_for_next' => 0,
            'auto_complete_on_target' => true,
            'allow_overflow' => true
        ],
        'completion_info' => [
            'completed' => false,
            'completed_date' => null,
            'final_amount' => 0,
            'excess_transferred' => 0
        ],
        'last_updated' => time()
    ], $data);
}

/**
 * Save fundraiser data to file
 * @param string $fundraiserFile Path to fundraiser file
 * @param array $data Fundraiser data to save
 * @return bool Success status
 */
function saveFundraiserData($fundraiserFile, $data) {
    $data['last_updated'] = time();
    
    // Ensure directory exists
    $dir = dirname($fundraiserFile);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    
    return file_put_contents($fundraiserFile, json_encode($data, JSON_PRETTY_PRINT)) !== false;
}

/**
 * Generate unique fundraiser ID from title
 * @param string $title Fundraiser title
 * @return string Generated ID
 */
function generateFundraiserId($title) {
    $id = strtolower($title);
    $id = preg_replace('/[^a-z0-9\-]/', '-', $id);
    $id = preg_replace('/-+/', '-', $id);
    $id = trim($id, '-');
    
    // Add timestamp to ensure uniqueness
    $id .= '-' . time();
    
    return $id;
}

/**
 * List all fundraisers (with optional filtering)
 * @param string $status Filter by status
 * @return array List of fundraisers
 */
function listFundraisers($status = '') {
    $fundraiserDir = __DIR__ . "/userdata/fundraisers/";
    
    if (!is_dir($fundraiserDir)) {
        return [];
    }
    
    $fundraisers = [];
    $files = glob($fundraiserDir . "*.json");
    
    foreach ($files as $file) {
        $fundraiserId = basename($file, '.json');
        $data = loadFundraiserData($file, $fundraiserId);
        
        if ($data && ($status === '' || $data['status'] === $status)) {
            // Return summary data for list view
            $fundraisers[] = [
                'id' => $data['id'] ?? $fundraiserId,
                'slug' => $data['slug'] ?? $fundraiserId,
                'title' => $data['title'],
                'tagline' => $data['tagline'],
                'description' => $data['description'],
                'owner_user_id' => $data['owner_user_id'],
                'type' => $data['type'],
                'category' => $data['category'] ?? 'general',
                'goal_amount' => $data['goal_amount'],
                'current_amount' => $data['current_amount'],
                'currency' => $data['currency'],
                'status' => $data['status'],
                'hero_image' => $data['hero_image'],
                'created_date' => $data['created_date'],
                'featured' => $data['featured'] ?? false,
                'verification' => $data['verification'] ?? [],
                'progress_percentage' => $data['goal_amount'] > 0 ? ($data['current_amount'] / $data['goal_amount']) * 100 : 0
            ];
        }
    }
    
    // Sort by created_date (newest first)
    usort($fundraisers, function($a, $b) {
        return $b['created_date'] - $a['created_date'];
    });
    
    return $fundraisers;
}

/**
 * Get current active fundraiser for a recipient
 * @param string $recipientUserId User ID of the recipient
 * @return array|null Current fundraiser or null if none
 */
function getCurrentFundraiser($recipientUserId) {
    $fundraiserDir = __DIR__ . "/userdata/fundraisers/";
    
    if (!is_dir($fundraiserDir)) {
        return null;
    }
    
    $files = glob($fundraiserDir . "*.json");
    $activeFundraisers = [];
    
    foreach ($files as $file) {
        $fundraiserId = basename($file, '.json');
        $data = loadFundraiserData($file, $fundraiserId);
        
        if ($data && $data['owner_user_id'] === $recipientUserId && $data['status'] === 'active') {
            $activeFundraisers[] = $data;
        }
    }
    
    if (empty($activeFundraisers)) {
        return null;
    }
    
    // Sort by created_date (newest first) and return the most recent
    usort($activeFundraisers, function($a, $b) {
        return $b['created_date'] - $a['created_date'];
    });
    
    return $activeFundraisers[0];
}

/**
 * Check and handle fundraiser completion/overflow
 * @param string $fundraiserId Fundraiser ID
 * @param float $newDonationAmount Amount of new donation
 * @return array Status of completion check
 */
function checkFundraiserCompletion($fundraiserId, $newDonationAmount = 0) {
    $fundraiserFile = __DIR__ . "/userdata/fundraisers/{$fundraiserId}.json";
    $data = loadFundraiserData($fundraiserFile, $fundraiserId);
    
    if (!$data) {
        return ['success' => false, 'error' => 'Fundraiser not found'];
    }
    
    $totalAmount = $data['current_amount'] + $newDonationAmount;
    $goalAmount = $data['goal_amount'];
    $result = ['success' => true, 'completed' => false, 'overflow' => 0];
    
    // Check if fundraiser will be completed
    if ($totalAmount >= $goalAmount && !$data['completion_info']['completed']) {
        $overflow = $totalAmount - $goalAmount;
        
        // Mark as completed
        $data['completion_info'] = [
            'completed' => true,
            'completed_date' => time(),
            'final_amount' => $goalAmount,
            'excess_transferred' => $overflow
        ];
        
        $data['overflow_handling']['excess_amount'] = $overflow;
        $data['status'] = 'completed';
        $data['current_amount'] = $goalAmount; // Cap at goal
        
        // Save updated fundraiser
        saveFundraiserData($fundraiserFile, $data);
        
        $result['completed'] = true;
        $result['overflow'] = $overflow;
        $result['message'] = "Fundraiser completed! Excess {$overflow} held for next fundraiser.";
        
        // Handle overflow for recipient's next fundraiser
        if ($overflow > 0) {
            handleRecipientOverflow($data['owner_user_id'], $overflow, $fundraiserId);
        }
    }
    
    return $result;
}

/**
 * Handle overflow funds for recipient's future fundraisers
 * @param string $recipientUserId Recipient user ID
 * @param float $overflowAmount Amount of overflow
 * @param string $sourceFundraiserId Source fundraiser ID
 */
function handleRecipientOverflow($recipientUserId, $overflowAmount, $sourceFundraiserId) {
    $overflowFile = __DIR__ . "/userdata/fundraisers/overflow-{$recipientUserId}.json";
    
    $overflowData = [];
    if (file_exists($overflowFile)) {
        $overflowData = json_decode(file_get_contents($overflowFile), true) ?? [];
    }
    
    // Add this overflow to the recipient's pending funds
    $overflowData[] = [
        'amount' => $overflowAmount,
        'source_fundraiser' => $sourceFundraiserId,
        'date' => time(),
        'status' => 'pending',
        'applied_to' => null
    ];
    
    file_put_contents($overflowFile, json_encode($overflowData, JSON_PRETTY_PRINT));
    
    // Try to apply to current active fundraiser if one exists
    $currentFundraiser = getCurrentFundraiser($recipientUserId);
    if ($currentFundraiser && $currentFundraiser['id'] !== $sourceFundraiserId) {
        applyOverflowToFundraiser($recipientUserId, $currentFundraiser['id']);
    }
}

/**
 * Apply pending overflow funds to a fundraiser
 * @param string $recipientUserId Recipient user ID
 * @param string $targetFundraiserId Target fundraiser ID
 */
function applyOverflowToFundraiser($recipientUserId, $targetFundraiserId) {
    $overflowFile = __DIR__ . "/userdata/fundraisers/overflow-{$recipientUserId}.json";
    
    if (!file_exists($overflowFile)) {
        return;
    }
    
    $overflowData = json_decode(file_get_contents($overflowFile), true) ?? [];
    $totalOverflow = 0;
    $appliedOverflows = [];
    
    // Calculate total pending overflow
    foreach ($overflowData as $index => $overflow) {
        if ($overflow['status'] === 'pending') {
            $totalOverflow += $overflow['amount'];
            $overflowData[$index]['status'] = 'applied';
            $overflowData[$index]['applied_to'] = $targetFundraiserId;
            $appliedOverflows[] = $overflow;
        }
    }
    
    if ($totalOverflow > 0) {
        // Update overflow file
        file_put_contents($overflowFile, json_encode($overflowData, JSON_PRETTY_PRINT));
        
        // Add overflow to target fundraiser
        $fundraiserFile = __DIR__ . "/userdata/fundraisers/{$targetFundraiserId}.json";
        $fundraiserData = loadFundraiserData($fundraiserFile, $targetFundraiserId);
        
        if ($fundraiserData) {
            $fundraiserData['current_amount'] += $totalOverflow;
            $fundraiserData['overflow_handling']['pending_for_next'] = 0; // Reset
            
            // Add overflow contribution entries for transparency
            foreach ($appliedOverflows as $overflow) {
                $fundraiserData['contributions'][] = [
                    'amount' => $overflow['amount'],
                    'currency' => $fundraiserData['currency'],
                    'date' => time(),
                    'contributor' => 'overflow-transfer',
                    'message' => "Overflow funds from completed fundraiser (ID: {$overflow['source_fundraiser']})",
                    'type' => 'overflow'
                ];
            }
            
            // Add update about overflow transfer
            $fundraiserData['updates'][] = [
                'id' => 'overflow-' . time(),
                'date' => time(),
                'title' => 'Overflow Funds Applied',
                'content' => "<p>Great news! We've received <strong>{$fundraiserData['currency']} {$totalOverflow}</strong> in overflow funds from a previously completed fundraiser.</p><p>This helps us reach our goal faster while ensuring full transparency of all donations.</p>"
            ];
            
            saveFundraiserData($fundraiserFile, $fundraiserData);
        }
    }
}

/**
 * Get pending overflow amount for recipient
 * @param string $recipientUserId Recipient user ID
 * @return float Total pending overflow amount
 */
function getRecipientPendingOverflow($recipientUserId) {
    $overflowFile = __DIR__ . "/userdata/fundraisers/overflow-{$recipientUserId}.json";
    
    if (!file_exists($overflowFile)) {
        return 0;
    }
    
    $overflowData = json_decode(file_get_contents($overflowFile), true) ?? [];
    $pendingTotal = 0;
    
    foreach ($overflowData as $overflow) {
        if ($overflow['status'] === 'pending') {
            $pendingTotal += $overflow['amount'];
        }
    }
    
    return $pendingTotal;
}

// Main API Logic
$action = $_GET['action'] ?? '';
$fundraiserId = $_GET['id'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'list') {
    // LIST FUNDRAISERS - Public endpoint
    $status = $_GET['status'] ?? '';
    $fundraisers = listFundraisers($status);
    
    echo json_encode([
        'success' => true,
        'fundraisers' => $fundraisers,
        'count' => count($fundraisers)
    ]);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'current') {
    // GET CURRENT FUNDRAISER BY RECIPIENT - Public endpoint
    $recipient = $_GET['recipient'] ?? '';
    if (!$recipient) {
        http_response_code(400);
        echo json_encode(['error' => 'Recipient parameter required']);
        exit;
    }
    
    $fundraiser = getCurrentFundraiser($recipient);
    
    if (!$fundraiser) {
        echo json_encode([
            'success' => true,
            'fundraiser' => null,
            'message' => 'No active fundraiser found for this recipient'
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'fundraiser' => $fundraiser
        ]);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'donate') {
    // PROCESS DONATION - Public endpoint (called by donate system)
    $input = json_decode(file_get_contents('php://input'), true);
    
    $fundraiserId = $input['fundraiser_id'] ?? '';
    $amount = floatval($input['amount'] ?? 0);
    $currency = $input['currency'] ?? 'USD';
    $contributor = $input['contributor'] ?? 'anonymous';
    $message = $input['message'] ?? '';
    
    if (!$fundraiserId || $amount <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid fundraiser ID or amount']);
        exit;
    }
    
    $fundraiserFile = __DIR__ . "/userdata/fundraisers/{$fundraiserId}.json";
    $data = loadFundraiserData($fundraiserFile, $fundraiserId);
    
    if (!$data) {
        http_response_code(404);
        echo json_encode(['error' => 'Fundraiser not found']);
        exit;
    }
    
    if ($data['status'] !== 'active') {
        http_response_code(400);
        echo json_encode(['error' => 'Fundraiser is not active']);
        exit;
    }
    
    // Check for completion and overflow
    $completionResult = checkFundraiserCompletion($fundraiserId, $amount);
    
    if (!$completionResult['success']) {
        http_response_code(500);
        echo json_encode(['error' => $completionResult['error']]);
        exit;
    }
    
    // Add contribution to fundraiser (reload data after completion check)
    $data = loadFundraiserData($fundraiserFile, $fundraiserId);
    
    // Add contribution entry
    $contributionAmount = $completionResult['overflow'] > 0 ? 
        $amount - $completionResult['overflow'] : $amount;
    
    $data['contributions'][] = [
        'amount' => $contributionAmount,
        'currency' => $currency,
        'date' => time(),
        'contributor' => $contributor,
        'message' => $message
    ];
    
    // Update current amount (capped at goal if completed)
    if (!$data['completion_info']['completed']) {
        $data['current_amount'] += $amount;
        $data['last_updated'] = time();
    }
    
    // Save updated fundraiser
    saveFundraiserData($fundraiserFile, $data);
    
    $response = [
        'success' => true,
        'fundraiser_id' => $fundraiserId,
        'amount_applied' => $contributionAmount,
        'fundraiser_completed' => $completionResult['completed']
    ];
    
    if ($completionResult['overflow'] > 0) {
        $response['overflow_amount'] = $completionResult['overflow'];
        $response['overflow_message'] = $completionResult['message'];
    }
    
    echo json_encode($response);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get') {
    // GET SPECIFIC FUNDRAISER - Public endpoint
    if (!$fundraiserId) {
        http_response_code(400);
        echo json_encode(['error' => 'Fundraiser ID required']);
        exit;
    }
    
    $fundraiserFile = __DIR__ . "/userdata/fundraisers/{$fundraiserId}.json";
    $data = loadFundraiserData($fundraiserFile, $fundraiserId);
    
    if (!$data) {
        http_response_code(404);
        echo json_encode(['error' => 'Fundraiser not found']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'fundraiser' => $data
    ]);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'create') {
    // CREATE FUNDRAISER - Requires fundraiser role
    $userId = getUserId();
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }
    
    // Check if user has fundraiser capability
    if (!checkFundraiserCapability($userId)) {
        http_response_code(403);
        echo json_encode(['error' => 'Fundraiser capability required (recipient, fundraiser, or admin role)']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $requiredFields = ['title', 'description', 'goal_amount', 'currency'];
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Field '{$field}' is required"]);
            exit;
        }
    }
    
    // Generate fundraiser ID
    $fundraiserId = $input['fundraiser_id'] ?? generateFundraiserId($input['title']);
    $fundraiserFile = __DIR__ . "/userdata/fundraisers/{$fundraiserId}.json";
    
    // Check if fundraiser already exists
    if (file_exists($fundraiserFile)) {
        http_response_code(409);
        echo json_encode(['error' => 'Fundraiser ID already exists']);
        exit;
    }
    
    // Create fundraiser data
    $data = [
        'fundraiser_id' => $fundraiserId,
        'title' => $input['title'],
        'tagline' => $input['tagline'] ?? '',
        'owner_user_id' => $userId,
        'type' => $input['type'] ?? 'one-time',
        'goal_amount' => floatval($input['goal_amount']),
        'current_amount' => 0,
        'currency' => $input['currency'],
        'status' => 'active',
        'created_date' => time(),
        'description' => $input['description'],
        'story' => $input['story'] ?? $input['description'],
        'hero_image' => $input['hero_image'] ?? '',
        'images' => $input['images'] ?? [],
        'contact_info' => $input['contact_info'] ?? [
            'preferred_contact' => 'roflfaucet_inbox',
            'location' => ''
        ],
        'lightning_address' => $input['lightning_address'] ?? '',
        'transparency' => $input['transparency'] ?? [
            'show_donors' => true,
            'show_amounts' => false
        ],
        'verification' => [
            'verified_by' => '',
            'verification_date' => 0,
            'verification_notes' => 'Pending verification'
        ],
        'contributions' => [],
        'updates' => [],
        'last_updated' => time()
    ];
    
    // Save fundraiser
    if (saveFundraiserData($fundraiserFile, $data)) {
        echo json_encode([
            'success' => true,
            'fundraiser_id' => $fundraiserId,
            'message' => 'Fundraiser created successfully',
            'fundraiser' => $data
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save fundraiser']);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update') {
    // UPDATE FUNDRAISER - Owner or admin only
    $userId = getUserId();
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }
    
    if (!$fundraiserId) {
        http_response_code(400);
        echo json_encode(['error' => 'Fundraiser ID required']);
        exit;
    }
    
    $fundraiserFile = __DIR__ . "/userdata/fundraisers/{$fundraiserId}.json";
    $data = loadFundraiserData($fundraiserFile, $fundraiserId);
    
    if (!$data) {
        http_response_code(404);
        echo json_encode(['error' => 'Fundraiser not found']);
        exit;
    }
    
    // Check if user is owner or admin
    $isOwner = $data['owner_user_id'] === $userId;
    $isAdmin = checkModerationCapability($userId);
    
    if (!$isOwner && !$isAdmin) {
        http_response_code(403);
        echo json_encode(['error' => 'Only fundraiser owner or admin can update']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Update allowed fields
    $allowedFields = ['title', 'tagline', 'description', 'story', 'hero_image', 'images', 'contact_info', 'lightning_address', 'transparency'];
    
    // Admin can update additional fields
    if ($isAdmin) {
        $allowedFields = array_merge($allowedFields, ['goal_amount', 'currency', 'status', 'verification']);
    }
    
    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $input)) {
            $data[$field] = $input[$field];
        }
    }
    
    // Save updated data
    if (saveFundraiserData($fundraiserFile, $data)) {
        echo json_encode([
            'success' => true,
            'message' => 'Fundraiser updated successfully',
            'fundraiser' => $data
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save fundraiser updates']);
    }
    
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request - Use GET ?action=list|get or POST ?action=create|update']);
}
?>