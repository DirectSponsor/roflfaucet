// Flat File User Data System Client
class FlatFileUserData {
    constructor() {
        this.apiUrl = 'api/user-data.php';
        this.balanceCache = null;
        this.profileCache = null;
        this.lastUpdate = 0;
        this.updateCallbacks = [];
        
        // Initialize the system
        this.init();
    }
    
    init() {
        // Check if user is logged in via JWT
        const token = this.getJWTToken();
        
        if (token) {
            // User is logged in - load their data
            this.loadUserData();
            this.updateCurrencyDisplay('coins');
            this.updateLongCurrencyDisplay('Useless Coins');
        } else {
            // Guest mode - use localStorage fallback
            this.loadGuestData();
            this.updateCurrencyDisplay('tokens');
            this.updateLongCurrencyDisplay('Pointless Tokens');
        }
        
        // Set up periodic updates for logged-in users
        if (token) {
            setInterval(() => {
                this.refreshBalance();
            }, 30000); // Refresh every 30 seconds
        }
    }
    
    getJWTToken() {
        // Check for JWT token in localStorage, sessionStorage, or cookies
        return localStorage.getItem('jwt_token') || 
               sessionStorage.getItem('jwt_token') || 
               this.getCookie('jwt_token');
    }
    
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
    
    isLoggedIn() {
        return !!this.getJWTToken();
    }
    
    // === USER DATA LOADING ===
    
    async loadUserData() {
        try {
            const response = await this.makeAuthenticatedRequest('GET', '?action=all');
            
            if (response.success) {
                this.balanceCache = response.balance;
                this.profileCache = response.profile;
                this.lastUpdate = Date.now();
                
                // Update UI
                this.updateBalanceDisplay(response.balance);
                this.notifyCallbacks('data_loaded', response);
                
                return response;
            } else {
                console.error('Failed to load user data:', response.error);
                return null;
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            return null;
        }
    }
    
    loadGuestData() {
        // For guests, use localStorage with default values
        const guestBalance = parseFloat(localStorage.getItem('guest_balance') || '10');
        
        this.balanceCache = guestBalance;
        this.profileCache = {
            user_id: 'guest',
            username: 'Guest',
            email: '',
            settings: {
                notifications: false,
                theme: 'default'
            }
        };
        
        this.updateBalanceDisplay(guestBalance);
        this.notifyCallbacks('guest_data_loaded', { balance: guestBalance });
    }
    
    // === BALANCE OPERATIONS ===
    
    async getBalance() {
        if (!this.isLoggedIn()) {
            return parseFloat(localStorage.getItem('guest_balance') || '10');
        }
        
        try {
            const response = await this.makeAuthenticatedRequest('GET', '?action=balance');
            
            if (response.success) {
                this.balanceCache = response.balance;
                this.updateBalanceDisplay(response.balance);
                return response.balance;
            }
        } catch (error) {
            console.error('Error getting balance:', error);
        }
        
        return this.balanceCache || 0;
    }
    
    async updateBalance(amount, source = 'manual') {
        if (!this.isLoggedIn()) {
            // Guest mode - update localStorage
            const currentBalance = parseFloat(localStorage.getItem('guest_balance') || '10');
            const newBalance = Math.max(0, currentBalance + amount);
            
            localStorage.setItem('guest_balance', newBalance.toString());
            this.balanceCache = newBalance;
            this.updateBalanceDisplay(newBalance);
            this.notifyCallbacks('balance_updated', { balance: newBalance, change: amount });
            
            return newBalance;
        }
        
        try {
            const response = await this.makeAuthenticatedRequest('POST', '?action=update_balance', {
                amount: amount,
                source: source
            });
            
            if (response.success) {
                this.balanceCache = response.new_balance;
                this.updateBalanceDisplay(response.new_balance);
                this.notifyCallbacks('balance_updated', response);
                return response.new_balance;
            } else {
                console.error('Failed to update balance:', response.error);
                return null;
            }
        } catch (error) {
            console.error('Error updating balance:', error);
            return null;
        }
    }
    
    async claimFaucet(amount = 10) {
        if (!this.isLoggedIn()) {
            // Guest mode - simple cooldown check
            const lastClaim = parseInt(localStorage.getItem('guest_last_claim') || '0');
            const now = Date.now();
            const cooldown = 60000; // 1 minute for guests
            
            if (now - lastClaim < cooldown) {
                const remainingTime = Math.ceil((cooldown - (now - lastClaim)) / 1000);
                throw new Error(`Please wait ${remainingTime} seconds before claiming again`);
            }
            
            localStorage.setItem('guest_last_claim', now.toString());
            return await this.updateBalance(amount, 'faucet claim');
        }
        
        try {
            const response = await this.makeAuthenticatedRequest('POST', '?action=faucet_claim', {
                amount: amount
            });
            
            if (response.success) {
                this.balanceCache = response.new_balance;
                this.updateBalanceDisplay(response.new_balance);
                this.notifyCallbacks('faucet_claimed', response);
                return response.new_balance;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('Error claiming faucet:', error);
            throw error;
        }
    }
    
    // === GAME OPERATIONS ===
    
    async placeBet(betAmount) {
        if (!this.isLoggedIn()) {
            // Guest mode - simple balance check
            const currentBalance = await this.getBalance();
            if (currentBalance < betAmount) {
                throw new Error('Insufficient balance');
            }
            
            return await this.updateBalance(-betAmount, 'slot game bet');
        }
        
        try {
            const response = await this.makeAuthenticatedRequest('POST', '?action=game_bet', {
                bet_amount: betAmount
            });
            
            if (response.success) {
                this.balanceCache = response.new_balance;
                this.updateBalanceDisplay(response.new_balance);
                this.notifyCallbacks('bet_placed', response);
                return response.new_balance;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('Error placing bet:', error);
            throw error;
        }
    }
    
    async creditWin(winAmount) {
        if (!this.isLoggedIn()) {
            return await this.updateBalance(winAmount, 'slot game win');
        }
        
        try {
            const response = await this.makeAuthenticatedRequest('POST', '?action=game_win', {
                win_amount: winAmount
            });
            
            if (response.success) {
                this.balanceCache = response.new_balance;
                this.updateBalanceDisplay(response.new_balance);
                this.notifyCallbacks('win_credited', response);
                return response.new_balance;
            } else {
                console.error('Failed to credit win:', response.error);
                return null;
            }
        } catch (error) {
            console.error('Error crediting win:', error);
            return null;
        }
    }
    
    // === PROFILE OPERATIONS ===
    
    async updateProfile(profileUpdates) {
        if (!this.isLoggedIn()) {
            // Guest mode - update local cache only
            this.profileCache = { ...this.profileCache, ...profileUpdates };
            this.notifyCallbacks('profile_updated', { profile: this.profileCache });
            return true;
        }
        
        try {
            const response = await this.makeAuthenticatedRequest('POST', '?action=update_profile', {
                profile_updates: profileUpdates
            });
            
            if (response.success) {
                // Merge updates into cache
                this.profileCache = { ...this.profileCache, ...profileUpdates };
                this.notifyCallbacks('profile_updated', response);
                return true;
            } else {
                console.error('Failed to update profile:', response.error);
                return false;
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            return false;
        }
    }
    
    // === UI UPDATES ===
    
    updateBalanceDisplay(balance) {
        // Update all balance display elements
        const balanceElements = document.querySelectorAll('.balance, #balance, [data-balance]');
        
        balanceElements.forEach(element => {
            if (element.tagName === 'INPUT') {
                element.value = balance.toFixed(2);
            } else {
                element.textContent = balance.toFixed(2);
            }
        });
    }
    
    updateCurrencyDisplay(currency) {
        // Update all currency display elements
        const currencyElements = document.querySelectorAll('.currency, [data-currency]');
        
        currencyElements.forEach(element => {
            element.textContent = currency;
        });
        
        // Update page title if needed
        const title = document.querySelector('title');
        if (title && title.textContent.includes('ROFL')) {
            const newTitle = currency === 'coins' ? 
                title.textContent.replace(/tokens?/gi, 'coins').replace(/Tokens?/gi, 'Coins') :
                title.textContent.replace(/coins?/gi, 'tokens').replace(/Coins?/gi, 'Tokens');
            title.textContent = newTitle;
        }
    }
    
    updateLongCurrencyDisplay(longCurrency) {
        // Update long currency display elements (for full names like "Useless Coins")
        const longCurrencyElements = document.querySelectorAll('.long-currency, [data-long-currency]');
        
        longCurrencyElements.forEach(element => {
            element.textContent = longCurrency;
        });
    }
    
    async refreshBalance() {
        if (this.isLoggedIn()) {
            const balance = await this.getBalance();
            return balance;
        }
        return this.balanceCache;
    }
    
    // === EVENT SYSTEM ===
    
    onUpdate(callback) {
        this.updateCallbacks.push(callback);
    }
    
    offUpdate(callback) {
        this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    }
    
    notifyCallbacks(event, data) {
        this.updateCallbacks.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Error in update callback:', error);
            }
        });
    }
    
    // === UTILITY METHODS ===
    
    async makeAuthenticatedRequest(method, url, data = null) {
        const token = this.getJWTToken();
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
        
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(this.apiUrl + url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    // === PUBLIC API METHODS (for compatibility with existing code) ===
    
    async getCurrentBalance() {
        return await this.getBalance();
    }
    
    async addCoins(amount, source = 'unknown') {
        return await this.updateBalance(amount, source);
    }
    
    async subtractCoins(amount, reason = 'unknown') {
        return await this.updateBalance(-amount, reason);
    }
    
    getCurrencyName() {
        return this.isLoggedIn() ? 'coins' : 'tokens';
    }
    
    // Clear all data (for logout)
    clear() {
        this.balanceCache = null;
        this.profileCache = null;
        this.lastUpdate = 0;
        
        // Clear guest data
        localStorage.removeItem('guest_balance');
        localStorage.removeItem('guest_last_claim');
        
        this.notifyCallbacks('data_cleared', {});
    }
}

// Global instance
window.flatFileUserData = new FlatFileUserData();

// Backward compatibility aliases
window.balance = window.flatFileUserData;
window.userBalance = window.flatFileUserData;
