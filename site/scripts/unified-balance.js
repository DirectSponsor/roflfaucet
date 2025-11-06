// Unified Balance System
// Works the same for both guest users (localStorage) and members (API)

class UnifiedBalanceSystem {
    constructor() {
        // Use simple username detection with localStorage (with expiration check)
        this.isLoggedIn = !!this.getValidUsername();
        this.userId = this.isLoggedIn ? this.getUserIdFromToken() : 'guest';
        this.accessToken = null; // No longer needed
        this.balance = 0;
        
        // Smart sync system properties
        this.lastServerTimestamp = null;
        this.lastSyncTime = null;
        this.syncInProgress = false;
        this.inactivityTimer = null;
        this.isPageVisible = true;
        
        console.log(`💰 Unified Balance System initialized for ${this.isLoggedIn ? 'member' : 'guest'} user`);
        
        // Update currency display immediately
        this.updateCurrencyDisplay();
        
        // Setup smart sync system
        this.setupSmartSync();
    }
    
    
    updateCurrencyDisplay() {
        const currency = this.isLoggedIn ? 'coins' : 'tokens';
        console.log(`💱 Unified: Updating currency display to: ${currency}`);
        
        // Update all currency display elements
        const currencyElements = document.querySelectorAll('.currency, .currency-full, [data-currency]');
        
        console.log(`🔄 Unified: Found ${currencyElements.length} currency elements to update`);
        currencyElements.forEach(element => {
            const oldValue = element.textContent;
            element.textContent = currency;
            console.log(`  → Unified: Updated element: ${oldValue} → ${currency}`);
        });
    }
    
    setupSmartSync() {
        if (!this.isLoggedIn) {
            console.log('📱 Smart sync: Guest mode - no sync needed');
            return;
        }
        
        console.log('🔄 Smart sync: Setting up event listeners');
        
        // Page visibility change sync
        document.addEventListener('visibilitychange', () => {
            this.isPageVisible = !document.hidden;
            if (!this.isPageVisible) {
                console.log('👁️ Smart sync: Page hidden - triggering sync');
                this.syncIfNeeded('visibility_change');
            }
        });
        
        // Page unload sync
        window.addEventListener('beforeunload', () => {
            console.log('🚪 Smart sync: Page unloading - triggering sync');
            this.syncIfNeeded('page_unload');
        });
        
        // Setup inactivity fallback timer
        this.resetInactivityTimer();
        
        // Track user activity to reset inactivity timer
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, () => this.resetInactivityTimer(), { passive: true });
        });
    }
    
    resetInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
        
        // Set 5-minute inactivity fallback
        this.inactivityTimer = setTimeout(() => {
            if (this.isLoggedIn && this.isPageVisible) {
                console.log('⏰ Smart sync: Inactivity fallback - triggering sync');
                this.syncIfNeeded('inactivity_fallback');
            }
        }, 5 * 60 * 1000); // 5 minutes
    }
    
    async checkIfSyncNeeded() {
        if (!this.isLoggedIn) return false;
        
        try {
            const combinedUserId = this.getCombinedUserIdFromToken();
            if (combinedUserId === 'guest') return false;
            
            const response = await fetch(`api/coins-balance.php?action=timestamp&user_id=${combinedUserId}`);//
            if (!response.ok) {
                console.warn('⚠️ Sync check failed, assuming sync needed');
                return true; // Fail safe - sync if check fails
            }
            
            const data = await response.json();
            
            if (this.lastServerTimestamp && data.timestamp > this.lastServerTimestamp) {
                console.log('🔄 Balance file modified elsewhere - sync needed');
                this.lastServerTimestamp = data.timestamp;
                return true;
            }
            
            this.lastServerTimestamp = data.timestamp;
            return false;
        } catch (error) {
            console.warn('⚠️ Sync check failed, assuming sync needed:', error);
            return true; // Fail safe - sync if check fails
        }
    }
    
    async syncIfNeeded(trigger = 'manual') {
        if (!this.isLoggedIn) {
            return false;
        }
        
        console.log(`🔄 Smart sync: Checking sync (trigger: ${trigger})`);
        
        // For current single-site usage, only sync on important triggers
        // This keeps the infrastructure ready for future multi-site sync
        const criticalTriggers = ['before_game', 'after_game', 'visibility_change'];
        const shouldCheck = criticalTriggers.includes(trigger);
        
        if (shouldCheck) {
            // Show brief indicator for critical syncs
            this.showSyncIndicator();
            
            try {
                const needsSync = await this.checkIfSyncNeeded();
                if (needsSync) {
                    console.log(`✅ Smart sync: Sync needed, fetching fresh balance`);
                    await this.getRealBalance();
                    this.lastSyncTime = Date.now();
                    return true;
                } else {
                    console.log(`⏭️ Smart sync: No sync needed`);
                    return false;
                }
            } finally {
                this.hideSyncIndicator();
            }
        } else {
            // For non-critical triggers, skip sync check (optimization)
            console.log(`⏭️ Smart sync: Skipping check for trigger: ${trigger}`);
            return false;
        }
    }
    
    showSyncIndicator() {
        // Only show for logged-in users (multi-tab sync scenarios)
        if (!this.isLoggedIn) return;
        
        // Remove any existing indicator
        this.hideSyncIndicator();
        
        const indicator = document.createElement('div');
        indicator.id = 'sync-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 20px 30px;
                border-radius: 10px;
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 15px;
                font-family: Arial, sans-serif;
                font-size: 16px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            ">
                <div class="spinner" style="
                    border: 3px solid #333;
                    border-top: 3px solid #fff;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    animation: spin 1s linear infinite;
                "></div>
                Syncing balance...
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(indicator);
    }
    
    hideSyncIndicator() {
        const indicator = document.getElementById('sync-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    getValidUsername() {
        try {
            const sessionData = localStorage.getItem('roflfaucet_session');
            if (sessionData) {
                const data = JSON.parse(sessionData);
                if (data.expires && Date.now() > data.expires) {
                    return null; // Expired
                }
                return data.username;
            }
            return localStorage.getItem('username');
        } catch (error) {
            return localStorage.getItem('username');
        }
    }
    
    getUserIdFromToken() {
        // Use simple localStorage user_id with expiration check
        try {
            const sessionData = localStorage.getItem('roflfaucet_session');
            if (sessionData) {
                const data = JSON.parse(sessionData);
                if (data.expires && Date.now() > data.expires) {
                    return 'guest'; // Expired
                }
                return data.user_id || 'guest';
            }
            return localStorage.getItem('user_id') || 'guest';
        } catch (error) {
            return localStorage.getItem('user_id') || 'guest';
        }
    }
    
    getCombinedUserIdFromToken() {
        // Get combined userID for file access (userID-username)
        try {
            const sessionData = localStorage.getItem('roflfaucet_session');
            if (sessionData) {
                const data = JSON.parse(sessionData);
                if (data.expires && Date.now() > data.expires) {
                    return 'guest'; // Expired
                }
                
                // If combined_user_id exists, use it
                if (data.combined_user_id) {
                    return data.combined_user_id;
                }
                
                // Otherwise construct it from user_id and username
                if (data.user_id && data.username) {
                    return `${data.user_id}-${data.username}`;
                }
                
                return 'guest';
            }
            
            // Try direct localStorage access
            const storedCombined = localStorage.getItem('combined_user_id');
            if (storedCombined) {
                return storedCombined;
            }
            
            // Fall back to constructing from individual items
            const userId = localStorage.getItem('user_id');
            const username = localStorage.getItem('username');
            if (userId && username) {
                return `${userId}-${username}`;
            }
            
            return 'guest';
        } catch (error) {
            console.error('Error getting combined user ID:', error);
            
            // Final fallback
            const userId = localStorage.getItem('user_id');
            const username = localStorage.getItem('username');
            if (userId && username) {
                return `${userId}-${username}`;
            }
            
            return 'guest';
        }
    }
    
    async getBalance() {
        if (this.isLoggedIn) {
            return await this.getRealBalance();
        } else {
            return this.getGuestBalance();
        }
    }
    
    async getRealBalance() {
        try {
            const combinedUserId = this.getCombinedUserIdFromToken();
            if (combinedUserId === 'guest') {
                return this.getGuestBalance();
            }
            
            const response = await fetch(`api/coins-balance.php?action=balance&user_id=${combinedUserId}&_t=` + Date.now(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.balance = parseFloat(data.balance) || 0;
                    console.log('✅ Simple balance loaded:', this.balance);
                    return this.balance;
                } else {
                    throw new Error(data.error || 'API returned error');
                }
            } else {
                throw new Error('API request failed');
            }
        } catch (error) {
            console.error('💥 Balance fetch error:', error);
            throw error;
        }
    }
    
    getLocalBalance() {
        const transactions = this.getLocalTransactions();
        this.balance = transactions.reduce((total, tx) => {
            return total + (tx.type === 'spend' ? -tx.amount : tx.amount);
        }, 0);
        
        console.log(`💰 ${this.isLoggedIn ? 'Member' : 'Guest'} balance calculated:`, this.balance);
        return this.balance;
    }
    
    getGuestBalance() {
        const transactions = this.getGuestTransactions();
        this.balance = transactions.reduce((total, tx) => {
            return total + (tx.type === 'spend' ? -tx.amount : tx.amount);
        }, 0);
        
        console.log('👤 Guest balance calculated:', this.balance);
        return this.balance;
    }
    
    getGuestTransactions() {
        const stored = localStorage.getItem('guest_transactions');
        return stored ? JSON.parse(stored) : [];
    }
    
    saveGuestTransaction(type, amount, source, description) {
        const transactions = this.getGuestTransactions();
        const transaction = {
            id: Date.now().toString(),
            type: type,
            amount: amount,
            source: source,
            description: description,
            timestamp: new Date().toISOString()
        };
        
        transactions.push(transaction);
        localStorage.setItem('guest_transactions', JSON.stringify(transactions));
        
        console.log('📝 Guest transaction saved:', transaction);
        return transaction;
    }
    
    async addBalance(amount, source, description) {
        if (this.isLoggedIn) {
            return await this.addRealBalance(amount, source, description);
        } else {
            return this.addGuestBalance(amount, source, description);
        }
    }
    
    async addRealBalance(amount, source, description) {
        // Check if we need to sync before making changes
        await this.syncIfNeeded('before_balance_change');
        
        try {
            const combinedUserId = this.getCombinedUserIdFromToken();
            if (combinedUserId === 'guest') {
                return this.addGuestBalance(amount, source, description);
            }
            
            const response = await fetch('api/coins-balance.php?action=update_balance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: combinedUserId,
                    amount: amount,
                    source: `${source}: ${description}`
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.balance = parseFloat(data.new_balance) || 0;
                    // Reset inactivity timer after successful balance change
                    this.resetInactivityTimer();
                    console.log('✅ Real balance added via flat-file:', amount, 'New balance:', this.balance);
                    return { success: true, balance: this.balance };
                } else {
                    throw new Error(data.error || 'API returned error');
                }
            } else {
                throw new Error('API request failed');
            }
        } catch (error) {
            console.error('💥 Add balance error:', error);
            throw error; // Don't fall back for logged-in users
        }
    }
    
    addGuestBalance(amount, source, description) {
        this.saveGuestTransaction('earn', amount, source, description);
        this.balance += amount;
        
        console.log('🎁 Guest balance added:', amount, 'New balance:', this.balance);
        return { success: true, balance: this.balance };
    }
    
    async subtractBalance(amount, source, description) {
        if (this.isLoggedIn) {
            return await this.subtractRealBalance(amount, source, description);
        } else {
            return this.subtractGuestBalance(amount, source, description);
        }
    }
    
    async subtractRealBalance(amount, source, description) {
        // Check if we need to sync before making changes
        await this.syncIfNeeded('before_balance_change');
        
        try {
            const combinedUserId = this.getCombinedUserIdFromToken();
            if (combinedUserId === 'guest') {
                return this.subtractGuestBalance(amount, source, description);
            }
            
            const response = await fetch('api/coins-balance.php?action=update_balance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: combinedUserId,
                    amount: -amount, // Negative amount for subtraction
                    source: `${source}: ${description}`
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.balance = parseFloat(data.new_balance) || 0;
                    // Reset inactivity timer after successful balance change
                    this.resetInactivityTimer();
                    console.log('✅ Real balance subtracted via flat-file:', amount, 'New balance:', this.balance);
                    return { success: true, balance: this.balance };
                } else {
                    throw new Error(data.error || 'API returned error');
                }
            } else {
                throw new Error('API request failed');
            }
        } catch (error) {
            console.error('💥 Subtract balance error:', error);
            throw error; // Don't fall back for logged-in users
        }
    }
    
    subtractGuestBalance(amount, source, description) {
        if (this.balance < amount) {
            console.log('❌ Insufficient guest balance');
            return { success: false, balance: this.balance, error: 'Insufficient balance' };
        }
        
        this.saveGuestTransaction('spend', amount, source, description);
        this.balance -= amount;
        
        console.log('💸 Guest balance subtracted:', amount, 'New balance:', this.balance);
        return { success: true, balance: this.balance };
    }
    
    async fallbackToGuestMode() {
        console.log('🔄 Falling back to guest mode...');
        this.isLoggedIn = false;
        this.userId = 'guest';
        this.accessToken = null;
        return this.getGuestBalance();
    }
    
    refreshLoginStatus() {
        const wasLoggedIn = this.isLoggedIn;
        this.isLoggedIn = !!this.getValidUsername();
        this.userId = this.isLoggedIn ? this.getUserIdFromToken() : 'guest';
        this.accessToken = null; // No longer needed
        
        if (wasLoggedIn !== this.isLoggedIn) {
            console.log(`💰 Login status changed: ${wasLoggedIn ? 'member' : 'guest'} → ${this.isLoggedIn ? 'member' : 'guest'}`);
            // Note: This is mainly used for logout, as login triggers a page refresh
            this.updateCurrencyDisplay();
            setTimeout(updateBalanceDisplays, 100);
            
            // Update login-dependent content visibility
            if (typeof updateLoginDependentContent === 'function') {
                updateLoginDependentContent();
            }
        }
    }
    
    getTerminology() {
        return {
            currency: this.isLoggedIn ? 'Coins' : 'Tokens',
            fullName: this.isLoggedIn ? 'Useless Coins' : 'Pointless Tokens',
            action: this.isLoggedIn ? 'Claim Coins' : 'Claim Tokens'
        };
    }
    
    // Clear all guest data (for testing)
    clearGuestData() {
        localStorage.removeItem('guest_transactions');
        console.log('🗑️ Guest data cleared');
    }
}

// Global instance
window.unifiedBalance = new UnifiedBalanceSystem();

// Global convenience functions
// Global function to update all balance displays
window.updateBalanceDisplays = async () => {
    const balance = await window.unifiedBalance.getBalance();
    const terminology = window.unifiedBalance.getTerminology();
    
    // Find all elements with 'balance' class and update them
    const balanceElements = document.querySelectorAll('.balance');
    balanceElements.forEach(element => {
        // Format the balance number as whole number
        const formattedBalance = Math.floor(balance);
        element.textContent = formattedBalance;
        
        // Update title attribute for hover tooltip
        element.title = `${formattedBalance} ${terminology.fullName}`;
    });
    
    // Also update any elements with specific IDs for backward compatibility
    const legacyElements = [
        'balance',
        'current-balance',
        'current-balance-back',
        'user-balance',
        'balance-display'
    ];
    
    legacyElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = Math.floor(balance);
            element.title = `${Math.floor(balance)} ${terminology.fullName}`;
        }
    });
    
    // Update currency terminology
    updateCurrencyDisplays();
    
    // console.log('💰 Balance displays updated:', Math.floor(balance), terminology.currency);
};

// Global function to update currency terminology displays
window.updateCurrencyDisplays = () => {
    const terminology = window.unifiedBalance.getTerminology();
    
    // Find all elements with 'currency' class and update them
    const currencyElements = document.querySelectorAll('.currency');
    currencyElements.forEach(element => {
        element.textContent = terminology.currency;
        element.title = terminology.fullName;
    });
    
    // Find all elements with 'currency-upper' class and update them (for UPPERCASE display)
    const currencyUpperElements = document.querySelectorAll('.currency-upper');
    currencyUpperElements.forEach(element => {
        element.textContent = terminology.currency.toUpperCase();
        element.title = terminology.fullName;
    });
    
    // Find all elements with 'currency-full' class and update them (for full name)
    const currencyFullElements = document.querySelectorAll('.currency-full');
    currencyFullElements.forEach(element => {
        element.textContent = terminology.fullName;
        element.title = terminology.fullName;
    });
    
    // console.log('🏷️ Currency displays updated:', terminology.currency);
};

// Global convenience functions
window.getBalance = () => window.unifiedBalance.getBalance();
window.addBalance = (amount, source, description) => window.unifiedBalance.addBalance(amount, source, description);
window.subtractBalance = (amount, source, description) => window.unifiedBalance.subtractBalance(amount, source, description);
window.getTerminology = () => window.unifiedBalance.getTerminology();

// Auto-update balance displays when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initial update
    setTimeout(updateBalanceDisplays, 100);
    
    // Note: No more 10-second polling! Smart sync system handles updates
    console.log('🔧 Smart sync system active - no polling needed');
});

console.log('🔧 Unified Balance System ready!');
