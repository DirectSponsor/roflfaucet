// Unified Balance System
// Works the same for both guest users (localStorage) and members (API)

class UnifiedBalanceSystem {
    constructor() {
        this.isLoggedIn = !!localStorage.getItem('jwt_token');
        this.userId = this.isLoggedIn ? this.getUserIdFromToken() : 'guest';
        this.accessToken = localStorage.getItem('jwt_token');
        this.balance = 0;
        
        console.log(`💰 Unified Balance System initialized for ${this.isLoggedIn ? 'member' : 'guest'} user`);
    }
    
    getUserIdFromToken() {
        try {
            const token = localStorage.getItem('jwt_token');
            if (!token) return 'guest';
            
            // Decode JWT token to get user ID (simple base64 decode)
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.sub || payload.user_id || 'guest';
        } catch (e) {
            console.warn('Could not decode JWT token, using guest');
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
            const response = await fetch('https://data.directsponsor.org/api/dashboard?site_id=roflfaucet&_t=' + Date.now(), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.balance = Math.floor(parseFloat(data.dashboard.balance.useless_coins) || 0);
                console.log('✅ Real balance loaded:', this.balance);
                return this.balance;
            } else {
                console.log('⚠️ API unavailable, falling back to guest mode');
                return this.fallbackToGuestMode();
            }
        } catch (error) {
            console.error('💥 Balance loading error:', error);
            return this.fallbackToGuestMode();
        }
    }
    
    getGuestBalance() {
        const transactions = this.getGuestTransactions();
        this.balance = transactions.reduce((total, tx) => {
            return total + (tx.type === 'spend' ? -tx.amount : tx.amount);
        }, 0);
        
        // console.log('👤 Guest balance calculated:', this.balance);
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
        try {
            const response = await fetch('https://data.directsponsor.org/api/user/transaction', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'earn',
                    amount: amount,
                    source: source,
                    site_id: 'roflfaucet',
                    description: description
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.balance = Math.floor(data.balance.current);
                console.log('✅ Real balance added:', amount, 'New balance:', this.balance);
                return { success: true, balance: this.balance };
            } else {
                console.log('⚠️ API transaction failed, falling back to guest mode');
                return this.addGuestBalance(amount, source, description);
            }
        } catch (error) {
            console.error('💥 Add balance error:', error);
            return this.addGuestBalance(amount, source, description);
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
        try {
            const response = await fetch('https://data.directsponsor.org/api/user/transaction', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'spend',
                    amount: amount,
                    source: source,
                    site_id: 'roflfaucet',
                    description: description
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.balance = Math.floor(data.balance.current);
                console.log('✅ Real balance subtracted:', amount, 'New balance:', this.balance);
                return { success: true, balance: this.balance };
            } else {
                console.log('⚠️ API transaction failed, falling back to guest mode');
                return this.subtractGuestBalance(amount, source, description);
            }
        } catch (error) {
            console.error('💥 Subtract balance error:', error);
            return this.subtractGuestBalance(amount, source, description);
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
    
    // Update every 10 seconds in case of external changes
    setInterval(updateBalanceDisplays, 10000);
});

console.log('🔧 Unified Balance System ready!');
