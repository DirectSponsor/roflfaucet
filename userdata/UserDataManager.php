<?php

class UserDataManager {
    private $balanceDir = 'userdata/balances/';
    private $profileDir = 'userdata/profiles/';
    
    public function __construct() {
        // Ensure directories exist
        if (!is_dir($this->balanceDir)) {
            mkdir($this->balanceDir, 0755, true);
        }
        if (!is_dir($this->profileDir)) {
            mkdir($this->profileDir, 0755, true);
        }
    }
    
    // ===== BALANCE DATA METHODS (Frequent Updates) =====
    
    /**
     * Get user balance data
     * @param string $userId
     * @return array
     */
    public function getBalanceData($userId) {
        $balanceFile = $this->balanceDir . $userId . '.txt';
        
        if (!file_exists($balanceFile)) {
            // Default balance data for new users
            return [
                'balance' => 10,
                'last_updated' => time(),
                'transactions' => []
            ];
        }
        
        $content = file_get_contents($balanceFile);
        $data = json_decode($content, true);
        
        if (!$data) {
            // Fallback if file is corrupted
            return [
                'balance' => 10,
                'last_updated' => time(),
                'transactions' => []
            ];
        }
        
        return $data;
    }
    
    /**
     * Update user balance
     * @param string $userId
     * @param float $newBalance
     * @param string $transactionType (optional)
     * @param string $description (optional)
     */
    public function updateBalance($userId, $newBalance, $transactionType = 'update', $description = '') {
        $balanceData = $this->getBalanceData($userId);
        $oldBalance = $balanceData['balance'];
        
        $balanceData['balance'] = $newBalance;
        $balanceData['last_updated'] = time();
        
        // Add transaction record (keep last 10 transactions)
        $transaction = [
            'timestamp' => time(),
            'type' => $transactionType,
            'old_balance' => $oldBalance,
            'new_balance' => $newBalance,
            'change' => $newBalance - $oldBalance,
            'description' => $description
        ];
        
        array_unshift($balanceData['transactions'], $transaction);
        $balanceData['transactions'] = array_slice($balanceData['transactions'], 0, 10);
        
        return $this->saveBalanceData($userId, $balanceData);
    }
    
    /**
     * Add to user balance
     * @param string $userId
     * @param float $amount
     * @param string $source
     */
    public function addToBalance($userId, $amount, $source = 'faucet') {
        $balanceData = $this->getBalanceData($userId);
        $newBalance = $balanceData['balance'] + $amount;
        return $this->updateBalance($userId, $newBalance, 'credit', $source . ': +' . $amount);
    }
    
    /**
     * Subtract from user balance
     * @param string $userId
     * @param float $amount
     * @param string $reason
     */
    public function subtractFromBalance($userId, $amount, $reason = 'game') {
        $balanceData = $this->getBalanceData($userId);
        $newBalance = max(0, $balanceData['balance'] - $amount);
        return $this->updateBalance($userId, $newBalance, 'debit', $reason . ': -' . $amount);
    }
    
    /**
     * Save balance data to file
     * @param string $userId
     * @param array $balanceData
     */
    private function saveBalanceData($userId, $balanceData) {
        $balanceFile = $this->balanceDir . $userId . '.txt';
        $content = json_encode($balanceData, JSON_PRETTY_PRINT);
        
        // Use file locking to prevent corruption during concurrent writes
        $result = file_put_contents($balanceFile, $content, LOCK_EX);
        
        return $result !== false;
    }
    
    // ===== PROFILE DATA METHODS (Infrequent Updates) =====
    
    /**
     * Get user profile data
     * @param string $userId
     * @return array
     */
    public function getProfileData($userId) {
        $profileFile = $this->profileDir . $userId . '.txt';
        
        if (!file_exists($profileFile)) {
            // Default profile data for new users
            return [
                'user_id' => $userId,
                'username' => '',
                'email' => '',
                'joined_date' => time(),
                'settings' => [
                    'notifications' => true,
                    'theme' => 'default'
                ],
                'stats' => [
                    'total_claims' => 0,
                    'total_games_played' => 0,
                    'total_won' => 0
                ],
                'created_at' => time(),
                'last_profile_update' => time()
            ];
        }
        
        $content = file_get_contents($profileFile);
        $data = json_decode($content, true);
        
        if (!$data) {
            // Fallback if file is corrupted
            return $this->getProfileData($userId); // Returns default
        }
        
        return $data;
    }
    
    /**
     * Update user profile data
     * @param string $userId
     * @param array $profileUpdates
     */
    public function updateProfile($userId, $profileUpdates) {
        $profileData = $this->getProfileData($userId);
        
        // Merge updates into existing profile
        foreach ($profileUpdates as $key => $value) {
            if (is_array($value) && isset($profileData[$key]) && is_array($profileData[$key])) {
                // Merge arrays (for settings, stats, etc.)
                $profileData[$key] = array_merge($profileData[$key], $value);
            } else {
                // Direct assignment for simple values
                $profileData[$key] = $value;
            }
        }
        
        $profileData['last_profile_update'] = time();
        
        return $this->saveProfileData($userId, $profileData);
    }
    
    /**
     * Increment user stats
     * @param string $userId
     * @param string $stat
     * @param int $amount
     */
    public function incrementStat($userId, $stat, $amount = 1) {
        $profileData = $this->getProfileData($userId);
        
        if (!isset($profileData['stats'][$stat])) {
            $profileData['stats'][$stat] = 0;
        }
        
        $profileData['stats'][$stat] += $amount;
        $profileData['last_profile_update'] = time();
        
        return $this->saveProfileData($userId, $profileData);
    }
    
    /**
     * Save profile data to file
     * @param string $userId
     * @param array $profileData
     */
    private function saveProfileData($userId, $profileData) {
        $profileFile = $this->profileDir . $userId . '.txt';
        $content = json_encode($profileData, JSON_PRETTY_PRINT);
        
        // Use file locking to prevent corruption during concurrent writes
        $result = file_put_contents($profileFile, $content, LOCK_EX);
        
        return $result !== false;
    }
    
    // ===== UTILITY METHODS =====
    
    /**
     * Get complete user data (both balance and profile)
     * @param string $userId
     * @return array
     */
    public function getUserData($userId) {
        return [
            'balance_data' => $this->getBalanceData($userId),
            'profile_data' => $this->getProfileData($userId)
        ];
    }
    
    /**
     * Check if user exists (has either balance or profile file)
     * @param string $userId
     * @return bool
     */
    public function userExists($userId) {
        $balanceFile = $this->balanceDir . $userId . '.txt';
        $profileFile = $this->profileDir . $userId . '.txt';
        
        return file_exists($balanceFile) || file_exists($profileFile);
    }
    
    /**
     * Delete all user data (both files)
     * @param string $userId
     * @return bool
     */
    public function deleteUser($userId) {
        $balanceFile = $this->balanceDir . $userId . '.txt';
        $profileFile = $this->profileDir . $userId . '.txt';
        
        $balanceDeleted = !file_exists($balanceFile) || unlink($balanceFile);
        $profileDeleted = !file_exists($profileFile) || unlink($profileFile);
        
        return $balanceDeleted && $profileDeleted;
    }
    
    /**
     * List all user IDs
     * @return array
     */
    public function getAllUserIds() {
        $userIds = [];
        
        // Get user IDs from balance files
        $balanceFiles = glob($this->balanceDir . '*.txt');
        foreach ($balanceFiles as $file) {
            $userId = basename($file, '.txt');
            if (!in_array($userId, $userIds)) {
                $userIds[] = $userId;
            }
        }
        
        // Get user IDs from profile files
        $profileFiles = glob($this->profileDir . '*.txt');
        foreach ($profileFiles as $file) {
            $userId = basename($file, '.txt');
            if (!in_array($userId, $userIds)) {
                $userIds[] = $userId;
            }
        }
        
        return $userIds;
    }
}

// Example usage:
/*
$userManager = new UserDataManager();

// Get user data
$userData = $userManager->getUserData('user123');
echo "Balance: " . $userData['balance_data']['balance'] . "\n";
echo "Username: " . $userData['profile_data']['username'] . "\n";

// Update balance
$userManager->addToBalance('user123', 50, 'faucet claim');

// Update profile
$userManager->updateProfile('user123', [
    'username' => 'john_doe',
    'settings' => ['theme' => 'dark']
]);

// Increment stats
$userManager->incrementStat('user123', 'total_claims');
*/

?>
