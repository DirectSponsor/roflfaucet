# Coin Allocation System - Technical Specification

## 🗄️ Database Schema Extensions

### **User Allocation Settings Table**
```sql
CREATE TABLE user_allocations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    allocation_method ENUM('manual', 'auto', 'save') DEFAULT 'auto',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### **Manual Allocation Preferences Table**
```sql
CREATE TABLE allocation_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    recipient_id INT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL, -- 0.00 to 100.00
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES recipients(id),
    UNIQUE KEY unique_user_recipient (user_id, recipient_id)
);
```

### **Recipients Table**
```sql
CREATE TABLE recipients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    website_url VARCHAR(255),
    donation_address VARCHAR(255), -- Crypto address or payment info
    total_received DECIMAL(10,2) DEFAULT 0.00,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_url VARCHAR(255),
    verification_status ENUM('pending', 'verified', 'featured') DEFAULT 'pending'
);
```

### **Monthly Distributions Table**
```sql
CREATE TABLE monthly_distributions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    distribution_date DATE NOT NULL,
    total_revenue DECIMAL(10,2) NOT NULL,
    operating_costs DECIMAL(10,2) NOT NULL,
    distribution_pool DECIMAL(10,2) NOT NULL,
    total_coins_allocated BIGINT NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Distribution Details Table**
```sql
CREATE TABLE distribution_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    distribution_id INT NOT NULL,
    recipient_id INT NOT NULL,
    coins_allocated BIGINT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    amount_usd DECIMAL(10,2) NOT NULL,
    payment_status ENUM('pending', 'sent', 'confirmed') DEFAULT 'pending',
    transaction_id VARCHAR(255),
    FOREIGN KEY (distribution_id) REFERENCES monthly_distributions(id),
    FOREIGN KEY (recipient_id) REFERENCES recipients(id)
);
```

### **Coin Transactions Table** (Extended)
```sql
ALTER TABLE coin_transactions ADD COLUMN allocation_processed BOOLEAN DEFAULT FALSE;
ALTER TABLE coin_transactions ADD COLUMN allocated_at TIMESTAMP NULL;
```

## 🎮 Frontend Components

### **Allocation Settings Page** (`allocation-settings.html`)
```html
<!-- User can choose their allocation method -->
<div class="allocation-method-selector">
    <div class="method-option" data-method="save">
        <h3>💰 Save for Level-ups</h3>
        <p>Keep coins to unlock higher betting limits</p>
    </div>
    <div class="method-option" data-method="auto">
        <h3>🤖 Auto-Allocation</h3>
        <p>Distribute equally among all recipients</p>
    </div>
    <div class="method-option" data-method="manual">
        <h3>🎯 Manual Allocation</h3>
        <p>Choose specific recipients and percentages</p>
    </div>
</div>

<!-- Manual allocation interface (shown when manual selected) -->
<div class="manual-allocation-interface" style="display: none;">
    <div class="recipients-list">
        <!-- Dynamic recipient cards with percentage sliders -->
    </div>
    <div class="allocation-summary">
        <p>Total Allocated: <span id="total-percentage">0</span>%</p>
        <button id="save-allocations">Save Preferences</button>
    </div>
</div>
```

### **Recipients Browser** (`recipients.html`)
```html
<!-- Browse and learn about available recipients -->
<div class="recipients-grid">
    <div class="recipient-card" data-recipient-id="1">
        <img src="recipient-photo.jpg" alt="Recipient Name">
        <h3>Clean Water Project</h3>
        <p>Providing clean water access to rural communities</p>
        <div class="stats">
            <span>$12,345 received this month</span>
            <span>2,345 users supporting</span>
        </div>
        <div class="allocation-controls">
            <input type="range" min="0" max="100" class="percentage-slider">
            <span class="percentage-display">25%</span>
        </div>
    </div>
</div>
```

### **Impact Dashboard** (`impact.html`)
```html
<!-- Show user's personal contribution impact -->
<div class="personal-impact">
    <h2>Your Impact This Month</h2>
    <div class="impact-stats">
        <div class="stat">
            <span class="number">1,234</span>
            <span class="label">Coins Allocated</span>
        </div>
        <div class="stat">
            <span class="number">$15.67</span>
            <span class="label">Real Money Impact</span>
        </div>
    </div>
    
    <div class="allocation-breakdown">
        <h3>Where Your Coins Went</h3>
        <div class="allocation-chart">
            <!-- Pie chart or bar chart showing distribution -->
        </div>
    </div>
</div>
```

## ⚙️ Backend API Endpoints

### **Allocation Management**
```php
// GET /api/allocation-settings.php
// Returns user's current allocation method and preferences

// POST /api/allocation-settings.php
// Updates user's allocation method and preferences
{
    "action": "update_method",
    "method": "manual|auto|save"
}

// POST /api/allocation-preferences.php
// Updates manual allocation percentages
{
    "action": "update_preferences",
    "allocations": [
        {"recipient_id": 1, "percentage": 40.0},
        {"recipient_id": 2, "percentage": 60.0}
    ]
}
```

### **Recipients Management**
```php
// GET /api/recipients.php
// Returns list of active recipients with details

// GET /api/recipient-stats.php?id=1
// Returns detailed stats for specific recipient
```

### **Distribution Processing**
```php
// POST /api/process-distribution.php (Admin only)
// Processes monthly distribution
{
    "action": "calculate_distribution",
    "month": "2025-08",
    "total_revenue": 1000.00,
    "operating_costs": 200.00
}

// GET /api/distribution-report.php?month=2025-08
// Returns public transparency report
```

## 🔧 JavaScript Classes

### **AllocationManager**
```javascript
class AllocationManager {
    constructor() {
        this.currentMethod = 'auto';
        this.preferences = [];
        this.recipients = [];
    }
    
    async loadUserSettings() {
        // Fetch current allocation method and preferences
    }
    
    async updateAllocationMethod(method) {
        // Update user's allocation method
    }
    
    async updatePreferences(allocations) {
        // Update manual allocation percentages
    }
    
    validateAllocations(allocations) {
        // Ensure percentages add up to 100%
        const total = allocations.reduce((sum, alloc) => sum + alloc.percentage, 0);
        return Math.abs(total - 100) < 0.01;
    }
    
    calculateImpact(userCoins, totalCoins, distributionPool) {
        // Calculate user's real-world impact
        const userShare = userCoins / totalCoins;
        return userShare * distributionPool;
    }
}
```

### **RecipientBrowser**
```javascript
class RecipientBrowser {
    constructor() {
        this.recipients = [];
        this.selectedAllocations = {};
    }
    
    async loadRecipients() {
        // Fetch recipient list from API
    }
    
    renderRecipientCards() {
        // Generate recipient selection interface
    }
    
    updateAllocationSlider(recipientId, percentage) {
        // Handle percentage slider changes
        this.selectedAllocations[recipientId] = percentage;
        this.updateTotalPercentage();
    }
    
    updateTotalPercentage() {
        // Update total percentage display
        const total = Object.values(this.selectedAllocations)
            .reduce((sum, pct) => sum + pct, 0);
        document.getElementById('total-percentage').textContent = total.toFixed(1);
    }
}
```

## 📊 Distribution Processing Logic

### **Monthly Distribution Calculator**
```php
class DistributionProcessor {
    
    public function calculateMonthlyDistribution($month, $totalRevenue, $operatingCosts) {
        $distributionPool = $totalRevenue - $operatingCosts;
        
        // Get all allocated coins for the month
        $totalCoinsAllocated = $this->getTotalAllocatedCoins($month);
        
        if ($totalCoinsAllocated == 0) {
            throw new Exception("No coins allocated for distribution");
        }
        
        // Calculate each recipient's share
        $recipientShares = $this->calculateRecipientShares($month, $totalCoinsAllocated);
        
        // Create distribution record
        $distributionId = $this->createDistributionRecord($month, $totalRevenue, $operatingCosts, $distributionPool, $totalCoinsAllocated);
        
        // Create individual recipient distributions
        foreach ($recipientShares as $recipientId => $share) {
            $amount = ($share['coins'] / $totalCoinsAllocated) * $distributionPool;
            $this->createDistributionDetail($distributionId, $recipientId, $share['coins'], $share['percentage'], $amount);
        }
        
        return $distributionId;
    }
    
    private function calculateRecipientShares($month, $totalCoins) {
        $shares = [];
        
        // Process manual allocations
        $manualAllocations = $this->getManualAllocations($month);
        foreach ($manualAllocations as $allocation) {
            $shares[$allocation['recipient_id']] = [
                'coins' => $allocation['coins'],
                'percentage' => ($allocation['coins'] / $totalCoins) * 100
            ];
        }
        
        // Process auto-allocations
        $autoCoins = $this->getAutoAllocationCoins($month);
        if ($autoCoins > 0) {
            $activeRecipients = $this->getActiveRecipients();
            $coinsPerRecipient = $autoCoins / count($activeRecipients);
            
            foreach ($activeRecipients as $recipient) {
                $shares[$recipient['id']]['coins'] += $coinsPerRecipient;
                $shares[$recipient['id']]['percentage'] += ($coinsPerRecipient / $totalCoins) * 100;
            }
        }
        
        return $shares;
    }
}
```

## 🎯 Integration Points

### **Game Integration**
```javascript
// In dice-game.js, slots.js, wheel.js
class GameIntegration {
    
    async handleWin(winAmount) {
        // Award coins to user
        await this.unifiedBalance.addBalance(winAmount, 'game_win');
        
        // Check if coins should be auto-allocated
        const allocationMethod = await this.getAllocationMethod();
        if (allocationMethod === 'auto') {
            await this.queueCoinsForAllocation(winAmount);
        }
    }
    
    async queueCoinsForAllocation(amount) {
        // Mark coins as pending allocation
        await fetch('/api/queue-allocation.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'queue_coins',
                amount: amount
            })
        });
    }
}
```

### **Level System Integration**
```javascript
// In levels-system.js
async purchaseUpgrade() {
    const nextLevel = this.getNextLevel();
    if (!nextLevel) return false;
    
    // Check allocation method - only deduct from saved coins
    const allocationMethod = await this.getAllocationMethod();
    if (allocationMethod !== 'save') {
        const shouldSwitch = confirm(
            'You need to switch to "Save for Level-ups" mode to purchase upgrades. ' +
            'This will stop auto-allocating your coins to recipients. Continue?'
        );
        
        if (shouldSwitch) {
            await this.updateAllocationMethod('save');
        } else {
            return false;
        }
    }
    
    // Proceed with normal upgrade logic
    await this.unifiedBalance.subtractBalance(nextLevel.cost, 'level_upgrade');
    // ... rest of upgrade logic
}
```

## 🔒 Security Considerations

### **Data Validation**
- Percentage allocations must sum to 100%
- User can only modify their own allocations
- Recipient IDs must be valid and active
- Distribution calculations require admin authentication

### **Financial Security**
- All monetary calculations use precise decimal arithmetic
- Distribution amounts are logged and auditable
- Multi-step approval process for large distributions
- Cryptocurrency addresses are verified before payments

### **Privacy Protection**
- Individual user allocations are private
- Only aggregate statistics are public
- User identities not linked in transparency reports
- Optional anonymous allocation mode

---

This technical specification provides the foundation for implementing the transparent charity ecosystem while maintaining security, user privacy, and operational efficiency.
