// ROFLFaucet Unified Balance System - File-Based Sync
// Simple architecture: track running total, flush to local file, Syncthing handles cross-site sync

class UnifiedBalanceSystem {
    constructor() {
        // Check login status
        this.isLoggedIn = !!this.getValidUsername();
        this.userId = this.isLoggedIn ? this.getUserIdFromToken() : 'guest';
        this.siteId = 'rf'; // ROFLFaucet identifier
        
        // Balance state
        this.fileBalance = 0; // Balance from file
        this.netChange = 0; // Running total of changes since last flush
        this.consecutiveFailures = 0;
        this.isFlushing = false; // Guard flag to prevent double flush
        this.isSyncing = false; // Guard flag for manual sync
        this.actionQueue = []; // Queue for actions during sync
        this.syncCheckDone = false; // Track if we've checked sync on first action
        
        console.log(`💰 ROFLFaucet Balance System initialized for ${this.isLoggedIn ? 'member' : 'guest'} user`);
        
        // Update currency display
        this.updateCurrencyDisplay();
        
        // Setup for logged-in users
        if (this.isLoggedIn) {
            // Only load netChange if this is a page refresh (not navigation)
            // Navigation should start with netChange = 0 (old page flushes on blur)
            if (performance.navigation.type === 1) {
                // Type 1 = reload (F5)
                this.loadNetChange();
            } else {
                // Type 0 = normal navigation - start fresh
                console.log('📊 Normal navigation - starting with netChange = 0');
                this.resetNetChange();
            }
            this.setupFlushTriggers();
            this.setupCrossSiteSync();
        }
    }
    
    // ========== NET CHANGE MANAGEMENT ==========
    
    getNetChangeKey() {
        return `balance_net_change:${this.getCombinedUserIdFromToken()}`;
    }
    
    loadNetChange() {
        const stored = localStorage.getItem(this.getNetChangeKey());
        this.netChange = stored ? parseFloat(stored) : 0;
        console.log(`📊 Loaded net change: ${this.netChange}`);
    }
    
    saveNetChange() {
        localStorage.setItem(this.getNetChangeKey(), this.netChange.toString());
    }
    
    resetNetChange() {
        this.netChange = 0;
        this.saveNetChange();
    }
    
    async addToNetChange(amount, source, description) {
        // On first action, check if we need to sync
        if (!this.syncCheckDone && this.isLoggedIn) {
            this.syncCheckDone = true;
            
            const needsSync = await this.checkIfNeedsSync();
            if (needsSync) {
                // Queue this action
                this.actionQueue.push({amount, source, description});
                console.log(`📋 Action queued: ${amount} coins (sync needed)`);
                
                // Start sync and process queue
                await this.syncAndProcessQueue();
                return;
            }
        }
        
        // If already syncing, queue the action
        if (this.isSyncing) {
            this.actionQueue.push({amount, source, description});
            console.log(`📋 Action queued: ${amount} coins (sync in progress)`);
            return;
        }
        
        // Normal processing
        this.netChange += amount;
        this.saveNetChange();
        
        // Update display optimistically
        this.updateBalanceDisplaysSync();
        
        console.log(`📝 Net change: ${this.netChange > 0 ? '+' : ''}${amount} from ${source || 'unknown'} (total: ${this.netChange})`);
    }
    
    async checkIfNeedsSync() {
        try {
            const combinedUserId = this.getCombinedUserIdFromToken();
            const response = await fetch(`/api/get_balance.php?user_id=${combinedUserId}`, {
                method: 'GET',
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.last_updated) {
                    const fileAge = Date.now() - (data.last_updated * 1000);
                    // If file modified in last 15 seconds, likely just came from another site
                    if (fileAge < 15000) {
                        console.log(`🔄 Fresh balance file detected (${Math.round(fileAge/1000)}s old) - sync needed`);
                        return true;
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Sync check error:', error);
        }
        return false;
    }
    
    async syncAndProcessQueue() {
        if (this.isSyncing) return;
        
        this.isSyncing = true;
        const totalQueuedAmount = this.actionQueue.reduce((sum, action) => sum + action.amount, 0);
        
        console.log(`🔄 Starting sync with ${this.actionQueue.length} queued actions (${totalQueuedAmount} coins)`);
        
        // Show progress notification with countdown
        for (let i = 10; i >= 0; i--) {
            this.showSyncProgress(totalQueuedAmount, i);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Reload balance after sync
        await this.getBalance();
        this.updateBalanceDisplaysSync();
        
        // Process all queued actions
        console.log(`✅ Sync complete - processing ${this.actionQueue.length} queued actions`);
        for (const action of this.actionQueue) {
            this.netChange += action.amount;
            console.log(`📝 Processed queued action: ${action.amount} from ${action.source}`);
        }
        this.saveNetChange();
        this.updateBalanceDisplaysSync();
        
        // Clear queue
        this.actionQueue = [];
        this.isSyncing = false;
        
        // Hide progress and show success
        this.hideSyncProgress();
        this.showSyncMessage(`✅ Synced! ${totalQueuedAmount} coins added`, 3000);
    }
    
    // ========== FLUSH TO LOCAL FILE ==========
    
    async flushNetChange(trigger = 'manual') {
        if (!this.isLoggedIn) return;
        if (this.netChange === 0) {
            console.log('✅ No net change to flush');
            return;
        }
        
        // Prevent double flush
        if (this.isFlushing) {
            console.log(`⏭️ Flush already in progress, skipping ${trigger}`);
            return;
        }
        
        const combinedUserId = this.getCombinedUserIdFromToken();
        if (combinedUserId === 'guest') return;
        
        this.isFlushing = true;
        console.log(`📤 Flushing net change: ${this.netChange > 0 ? '+' : ''}${this.netChange} (${trigger})`);
        
        try {
            const response = await fetch('/api/write_balance.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    user_id: combinedUserId,
                    net_change: this.netChange
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Update file balance and reset net change
                const previousNetChange = this.netChange;
                this.fileBalance = result.balance;
                this.resetNetChange();
                
                console.log('✅ Flush successful, new balance:', result.balance);
                
                this.consecutiveFailures = 0;
                this.hideHubWarning();
            } else {
                throw new Error(result.error || 'Flush failed');
            }
        } catch (error) {
            console.error('❌ Flush error:', error);
            this.consecutiveFailures++;
            
            if (this.consecutiveFailures >= 3) {
                this.showHubWarning(this.consecutiveFailures >= 10);
            }
        } finally {
            this.isFlushing = false;
        }
    }
    
    // ========== FLUSH TRIGGERS ==========
    
    setupFlushTriggers() {
        // 1. Timer - flush every 120 seconds
        this.flushInterval = setInterval(() => {
            this.flushNetChange('timer');
        }, 120000);
        
        // 2. Visibility change - flush when tab becomes hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.flushNetChange('visibility-hidden');
            }
        });
        
        // Also keep blur as backup
        window.addEventListener('blur', () => {
            this.flushNetChange('blur');
        });
        
        // 3. Beforeunload - flush before closing tab/window
        window.addEventListener('beforeunload', () => {
            this.flushNetChange('beforeunload');
        });
        
        console.log('⏱️ Flush triggers setup: timer (120s), blur, beforeunload');
    }
    
    // ========== MANUAL SYNC ==========
    
    async syncBalance() {
        if (!this.isLoggedIn) {
            this.showSyncMessage('⚠️ Please log in to sync balance', 3000);
            return;
        }
        
        if (this.isSyncing) return;
        
        this.isSyncing = true;
        
        try {
            this.updateSyncButton('syncing');
            await this.flushNetChange('manual-sync');
            this.showSyncMessage('⏳ Syncing balance... (10 seconds)');
            await new Promise(resolve => setTimeout(resolve, 10000));
            await this.getBalance();
            this.updateBalanceDisplaysSync();
            this.showSyncMessage('✅ Balance synced!', 2000);
            this.updateSyncButton('success');
            setTimeout(() => this.updateSyncButton('normal'), 2000);
            console.log('✅ Manual balance sync completed');
        } catch (error) {
            console.error('❌ Sync error:', error);
            this.showSyncMessage('❌ Sync failed. Please try again.', 3000);
            this.updateSyncButton('normal');
        } finally {
            this.isSyncing = false;
        }
    }
    
    updateSyncButton(state) {
        const btn = document.getElementById('sync-balance-btn');
        if (!btn) return;
        switch(state) {
            case 'syncing':
                btn.innerHTML = '⏳ Syncing...';
                btn.disabled = true;
                break;
            case 'success':
                btn.innerHTML = '✅ Synced!';
                btn.disabled = true;
                break;
            default:
                btn.innerHTML = '🔄 Sync <span class="sync-help">(?)</span>';
                btn.disabled = false;
        }
    }
    
    showSyncMessage(message, duration = null) {
        const existing = document.getElementById('sync-message');
        if (existing) existing.remove();
        const div = document.createElement('div');
        div.id = 'sync-message';
        div.textContent = message;
        div.style.cssText = 'position:fixed;top:70px;right:20px;background:#4CAF50;color:white;padding:12px 20px;border-radius:4px;box-shadow:0 2px 5px rgba(0,0,0,0.3);z-index:10001;font-size:14px;';
        document.body.appendChild(div);
        if (duration) setTimeout(() => { if (div.parentNode) div.remove(); }, duration);
    }
    
    showSyncProgress(queuedAmount, secondsRemaining) {
        let notification = document.getElementById('sync-progress-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'sync-progress-notification';
            notification.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10001;
                font-size: 14px;
                min-width: 280px;
            `;
            document.body.appendChild(notification);
        }
        
        const totalSeconds = 10;
        const progress = ((totalSeconds - secondsRemaining) / totalSeconds) * 100;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <div class="spinner" style="
                    border: 3px solid rgba(255,255,255,0.3);
                    border-top: 3px solid white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    animation: spin 1s linear infinite;
                "></div>
                <div style="flex: 1;">
                    <div style="font-weight: bold;">Syncing your balance...</div>
                    <div style="font-size: 12px; opacity: 0.9;">${queuedAmount} coins queued</div>
                </div>
            </div>
            <div style="background: rgba(255,255,255,0.2); height: 6px; border-radius: 3px; overflow: hidden;">
                <div style="background: white; height: 100%; width: ${progress}%; transition: width 0.3s;"></div>
            </div>
            <div style="text-align: center; margin-top: 6px; font-size: 12px; opacity: 0.9;">
                ${secondsRemaining}s remaining
            </div>
        `;
        
        // Add spinner animation if not already added
        if (!document.getElementById('spinner-style')) {
            const style = document.createElement('style');
            style.id = 'spinner-style';
            style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
            document.head.appendChild(style);
        }
    }
    
    hideSyncProgress() {
        const notification = document.getElementById('sync-progress-notification');
        if (notification) notification.remove();
    }
    
    setupCrossSiteSync() {
        // Simple: just refresh balance on focus
        window.addEventListener('focus', async () => {
            await this.getBalance();
            this.updateBalanceDisplaysSync();
        });
        // Keep storage listener for multi-tab
        window.addEventListener('storage', (e) => {
            if (e.key === this.getNetChangeKey()) {
                this.loadNetChange();
                this.updateBalanceDisplaysSync();
            }
        });
    }
    
    // ========== WARNING BANNERS ==========
    
    showHubWarning(isBlocking = false) {
        this.hideHubWarning();
        
        const banner = document.createElement('div');
        banner.id = 'hub-warning-banner';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: ${isBlocking ? '#dc3545' : '#ff9800'};
            color: white;
            padding: 12px 20px;
            text-align: center;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        
        if (isBlocking) {
            banner.innerHTML = `
                ❌ Unable to sync balance from other site.
                Network issue detected. Earning activities disabled until resolved.
                <button onclick="window.unifiedBalance.syncFromOtherSite()" 
                        style="margin-left: 10px; padding: 5px 10px; background: white; color: #dc3545; border: none; border-radius: 3px; cursor: pointer; font-weight: bold;">
                    Retry Now
                </button>
            `;
        } else {
            banner.innerHTML = `
                ⚠️ Connection issue - your earnings are being saved and will sync when reconnected.
                <button onclick="window.unifiedBalance.hideHubWarning()" 
                        style="margin-left: 10px; padding: 5px 10px; background: white; color: #ff9800; border: none; border-radius: 3px; cursor: pointer;">
                    Dismiss
                </button>
            `;
        }
        
        document.body.insertBefore(banner, document.body.firstChild);
    }
    
    hideHubWarning() {
        const banner = document.getElementById('hub-warning-banner');
        if (banner) banner.remove();
    }
    
    // ========== BALANCE OPERATIONS ==========
    
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
            
            const response = await fetch(`/api/get_balance.php?user_id=${combinedUserId}`, {
                method: 'GET',
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.fileBalance = parseFloat(data.balance) || 0;
                    // Always add net change for consistent display
                    const displayBalance = this.fileBalance + this.netChange;
                    console.log(`✅ Balance loaded: ${this.fileBalance} (file) + ${this.netChange} (pending) = ${displayBalance}`);
                    return displayBalance;
                }
            }
            
            this.fileBalance = 0;
            return this.netChange;
        } catch (error) {
            console.warn('⚠️ Balance API error:', error);
            return this.netChange;
        }
    }
    
    getGuestBalance() {
        const transactions = this.getGuestTransactions();
        this.fileBalance = transactions.reduce((total, tx) => {
            return total + (tx.type === 'spend' ? -tx.amount : tx.amount);
        }, 0);
        
        console.log('👤 Guest balance calculated:', this.fileBalance);
        return this.fileBalance;
    }
    
    async addBalance(amount, source, description) {
        if (this.isLoggedIn) {
            this.addToNetChange(amount, source, description);
            return { success: true, balance: this.fileBalance + this.netChange };
        } else {
            return this.addGuestBalance(amount, source, description);
        }
    }
    
    async subtractBalance(amount, source, description) {
        if (this.isLoggedIn) {
            this.addToNetChange(-amount, source, description);
            return { success: true, balance: this.fileBalance + this.netChange };
        } else {
            return this.subtractGuestBalance(amount, source, description);
        }
    }
    
    // ========== GUEST BALANCE METHODS ==========
    
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
    
    addGuestBalance(amount, source, description) {
        this.saveGuestTransaction('earn', amount, source, description);
        this.fileBalance += amount;
        this.updateBalanceDisplaysSync();
        
        console.log('🎁 Guest balance added:', amount);
        return { success: true, balance: this.fileBalance };
    }
    
    subtractGuestBalance(amount, source, description) {
        if (this.fileBalance < amount) {
            return { success: false, error: 'Insufficient balance' };
        }
        
        this.saveGuestTransaction('spend', amount, source, description);
        this.fileBalance -= amount;
        this.updateBalanceDisplaysSync();
        
        console.log('💸 Guest balance subtracted:', amount);
        return { success: true, balance: this.fileBalance };
    }
    
    // ========== USER MANAGEMENT ==========
    
    getValidUsername() {
        try {
            const sessionData = localStorage.getItem('directsponsor_session');
            if (sessionData) {
                const data = JSON.parse(sessionData);
                if (data.expires && Date.now() > data.expires) {
                    return null;
                }
                return data.username;
            }
            return localStorage.getItem('username');
        } catch (error) {
            return localStorage.getItem('username');
        }
    }
    
    getUserIdFromToken() {
        try {
            const sessionData = localStorage.getItem('directsponsor_session');
            if (sessionData) {
                const data = JSON.parse(sessionData);
                if (data.expires && Date.now() > data.expires) {
                    return 'guest';
                }
                return data.user_id || 'guest';
            }
            return localStorage.getItem('user_id') || 'guest';
        } catch (error) {
            return localStorage.getItem('user_id') || 'guest';
        }
    }
    
    getCombinedUserIdFromToken() {
        try {
            const sessionData = localStorage.getItem('directsponsor_session');
            if (sessionData) {
                const data = JSON.parse(sessionData);
                if (data.expires && Date.now() > data.expires) {
                    return 'guest';
                }
                
                if (data.combined_user_id) {
                    return data.combined_user_id;
                }
                
                if (data.user_id && data.username) {
                    return `${data.user_id}-${data.username}`;
                }
                
                return 'guest';
            }
            
            const storedCombined = localStorage.getItem('combined_user_id');
            if (storedCombined) return storedCombined;
            
            const userId = localStorage.getItem('user_id');
            const username = localStorage.getItem('username');
            if (userId && username) {
                return `${userId}-${username}`;
            }
            
            return 'guest';
        } catch (error) {
            return 'guest';
        }
    }
    
    // ========== UI UPDATES ==========
    
    updateCurrencyDisplay() {
        const currency = this.isLoggedIn ? 'coins' : 'tokens';
        const currencyElements = document.querySelectorAll('.currency, [data-currency], .currency-full');
        currencyElements.forEach(element => {
            element.textContent = currency;
        });
    }
    
    updateBalanceDisplaysSync() {
        const balance = this.fileBalance + this.netChange;
        const terminology = this.getTerminology();
        
        const balanceElements = document.querySelectorAll('.balance, #user-balance, #balance-display');
        balanceElements.forEach(element => {
            const formattedBalance = Math.floor(balance);
            element.textContent = formattedBalance;
            element.title = `${formattedBalance} ${terminology.fullName}`;
        });
        
        this.updateCurrencyDisplay();
    }
    
    getTerminology() {
        return {
            currency: this.isLoggedIn ? 'coins' : 'tokens',
            fullName: this.isLoggedIn ? 'Charity Coins' : 'Guest Tokens',
            action: this.isLoggedIn ? 'Earn Coins' : 'Earn Tokens'
        };
    }
    
    refreshLoginStatus() {
        const wasLoggedIn = this.isLoggedIn;
        this.isLoggedIn = !!this.getValidUsername();
        this.userId = this.isLoggedIn ? this.getUserIdFromToken() : 'guest';
        
        if (wasLoggedIn !== this.isLoggedIn) {
            console.log(`💰 Login status changed: ${wasLoggedIn ? 'member' : 'guest'} → ${this.isLoggedIn ? 'member' : 'guest'}`);
            this.updateCurrencyDisplay();
            
            if (this.isLoggedIn && !wasLoggedIn) {
                this.setupFlushTriggers();
                this.setupCrossSiteSync();
            }
            
            setTimeout(updateBalanceDisplays, 100);
            
            if (typeof updateLoginUI === 'function') {
                updateLoginUI();
            }
        }
    }
    
    clearGuestData() {
        localStorage.removeItem('guest_transactions');
        console.log('🗑️ Guest data cleared');
    }
    
    // ========== MANIPULATION DETECTION ==========
    
    checkManipulation(gameCost) {
        if (!this.isLoggedIn) return; // Skip for guests
        
        const clientBalance = this.fileBalance + this.netChange;
        
        // Call server to check for suspicious activity
        fetch('/scripts/analytics.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=check_manipulation&user_id=${this.userId}&client_balance=${clientBalance}&game_cost=${gameCost}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.server_balance) {
                // Check for significant discrepancy
                if (Math.abs(clientBalance - data.server_balance) > 10) {
                    console.warn(`🚨 Balance discrepancy detected: Client=${clientBalance}, Server=${data.server_balance}`);
                    
                    // Update local balance to match server
                    const discrepancy = data.server_balance - this.fileBalance;
                    this.netChange = discrepancy;
                    this.saveNetChange();
                    this.updateCurrencyDisplay();
                }
            }
        })
        .catch(error => {
            console.log('🔍 Manipulation check failed:', error);
        });
    }
}

// Global instance (singleton pattern)
if (!window.unifiedBalance) {
    window.unifiedBalance = new UnifiedBalanceSystem();
    window.UnifiedBalance = window.unifiedBalance;
    console.log('✅ UnifiedBalanceSystem singleton created');
} else {
    console.warn('⚠️ UnifiedBalanceSystem already exists! Script loaded multiple times.');
    console.warn('🔍 Stack trace:', new Error().stack);
}

// Global functions
window.updateBalanceDisplays = async () => {
    const balance = await window.unifiedBalance.getBalance();
    const terminology = window.unifiedBalance.getTerminology();
    
    const balanceElements = document.querySelectorAll('.balance, #user-balance, #balance-display');
    balanceElements.forEach(element => {
        const formattedBalance = Math.floor(balance);
        element.textContent = formattedBalance;
        element.title = `${formattedBalance} ${terminology.fullName}`;
    });
    
    window.updateCurrencyDisplays();
};

window.updateCurrencyDisplays = () => {
    const terminology = window.unifiedBalance.getTerminology();
    const currencyElements = document.querySelectorAll('.currency, #user-balance-label');
    currencyElements.forEach(element => {
        element.textContent = terminology.currency;
        element.title = terminology.fullName;
    });
};

// Global manipulation check function for games
window.checkManipulation = (gameCost) => {
    if (window.unifiedBalance && window.unifiedBalance.isLoggedIn) {
        window.unifiedBalance.checkManipulation(gameCost);
    }
};

window.getBalance = () => window.unifiedBalance.getBalance();
window.addBalance = (amount, source, description) => window.unifiedBalance.addBalance(amount, source, description);
window.subtractBalance = (amount, source, description) => window.unifiedBalance.subtractBalance(amount, source, description);
window.getTerminology = () => window.unifiedBalance.getTerminology();

// Auto-update on load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(updateBalanceDisplays, 100);
    console.log('💰 Balance system initialized');
});
