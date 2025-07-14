// Simple Faucet - Always show interface
console.log('🚰 Simple Faucet loading...');

class SimpleFaucet {
constructor() {
    this.jwtToken = localStorage.getItem('jwt_token');
    this.currentStep = 1;
        this.userProfile = null;
        this.balance = 0;
        this.localBalance = parseInt(localStorage.getItem('local_balance') || '0');
        this.lastClaimTime = parseInt(localStorage.getItem('last_claim_time') || '0');
        
        this.init();
    }
    
    init() {
        this.showFaucet();
        this.setupEventListeners();
        this.handleCallback();
        
        if (this.jwtToken) {
            this.loadUserData();
        }
    }
    
showFaucetStep(step) {
    this.currentStep = step;
    const steps = ['welcome-step', 'faucet-step', 'result-step'];
    steps.forEach((stepId, index) => {
      document.getElementById(stepId).style.display = index === (step - 1) ? 'block' : 'none';
    });

    // Update final result if step 3
    if (step === 3) {
      const wonAmount = this.jwtToken ? 5 : 5; // Adjust logic as needed
      document.getElementById('won-amount').textContent = wonAmount;
    }
  }
        const faucetSection = document.getElementById('oauth-faucet-section');
        if (faucetSection) {
            faucetSection.style.display = 'block';
        }
        
        // Show/hide messages based on authentication
        const loginNotice = document.getElementById('login-notice');
        const welcomeMessage = document.getElementById('welcome-message');
        const logoutSection = document.getElementById('logout-section');
        
        if (this.jwtToken && this.userProfile) {
            if (loginNotice) loginNotice.style.display = 'none';
            if (welcomeMessage) welcomeMessage.style.display = 'block';
            if (logoutSection) logoutSection.style.display = 'block';
        } else {
            // Show local token info for non-logged-in users
            if (loginNotice) {
                loginNotice.innerHTML = `
                    <strong>🎮 Demo Mode</strong><br>
                    Earn local demo coins to play games! Login to earn real UselessCoins that work across the ecosystem.
                `;
                loginNotice.style.display = 'block';
            }
            if (welcomeMessage) welcomeMessage.style.display = 'none';
            if (logoutSection) logoutSection.style.display = 'none';
        }
        
        this.updateUI();
    }
    
setupEventListeners() {
    // Step navigation
    document.getElementById('start-claim-btn').addEventListener('click', () => this.showFaucetStep(2));
    document.getElementById('final-claim-btn').addEventListener('click', () => this.showFaucetStep(3));
    document.getElementById('back-to-start').addEventListener('click', () => this.showFaucetStep(1));

    // Header login button
        const loginBtn = document.getElementById('oauth-login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleLoginClick());
        }
        
        // Claim button
        const claimBtn = document.getElementById('oauth-claim-btn');
        if (claimBtn) {
            claimBtn.addEventListener('click', () => this.handleClaimClick());
        }
        
        // Logout button
        const logoutBtn = document.getElementById('oauth-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }
    
    handleCallback() {
        // Handle JWT from auth server
        const urlParams = new URLSearchParams(window.location.search);
        const jwt = urlParams.get('jwt');
        
        if (jwt) {
            console.log('🔑 JWT received from auth server');
            localStorage.setItem('jwt_token', jwt);
            this.jwtToken = jwt;
            
            // Clean URL
            history.replaceState({}, document.title, window.location.pathname);
            
            // Load user data
            this.loadUserData();
        }
    }
    
    async loadUserData() {
        try {
            const payload = JSON.parse(atob(this.jwtToken.split('.')[1]));
            this.userProfile = { username: payload.username || `User ${payload.sub}` };
            this.balance = 0; // Start with 0, will load from API if available
            
            this.showFaucet();
        } catch (error) {
            console.error('Error loading user data:', error);
            this.handleLogout();
        }
    }
    
    handleLoginClick() {
        if (this.jwtToken) {
            // Already logged in - show logout confirm
            if (confirm('Are you sure you want to logout?')) {
                this.handleLogout();
            }
        } else {
            // Redirect to auth server
            const currentUrl = window.location.href;
            const authUrl = `https://auth.directsponsor.org/jwt-login.php?redirect_uri=${encodeURIComponent(currentUrl)}`;
            window.location.href = authUrl;
        }
    }
    
    handleClaimClick() {
        const now = Date.now();
        const cooldownTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        // Check cooldown
        if (now - this.lastClaimTime < cooldownTime) {
            const remainingTime = Math.ceil((cooldownTime - (now - this.lastClaimTime)) / 1000 / 60);
            this.showMessage(`⏱️ Please wait ${remainingTime} more minute(s) before claiming again`, 'warning');
            return;
        }
        
        if (this.jwtToken) {
            // Logged in - claim real coins (demo for now)
            this.showMessage('🎉 Claimed 5 UselessCoins!', 'success');
            this.balance += 5;
        } else {
            // Not logged in - claim local demo coins
            this.localBalance += 5;
            localStorage.setItem('local_balance', this.localBalance.toString());
            this.showMessage('🎮 Claimed 5 Demo Coins! Login to earn real UselessCoins.', 'success');
        }
        
        // Update last claim time
        this.lastClaimTime = now;
        localStorage.setItem('last_claim_time', now.toString());
        
        this.updateUI();
    }
    
    handleLogout() {
        localStorage.removeItem('jwt_token');
        this.jwtToken = null;
        this.userProfile = null;
        this.balance = 0;
        
        this.showFaucet();
        this.showMessage('Logged out successfully. You can still earn demo coins!', 'info');
    }
    
    updateUI() {
        // Update username displays
        const usernameEls = document.querySelectorAll('#oauth-username');
        if (this.userProfile) {
            usernameEls.forEach(el => {
                if (el) el.textContent = this.userProfile.username;
            });
        }
        
        // Update balance display
        const balanceEl = document.getElementById('oauth-balance');
        if (balanceEl) {
            if (this.jwtToken) {
                balanceEl.textContent = this.balance;
            } else {
                balanceEl.textContent = `${this.localBalance} (Demo)`;
            }
        }
        
        // Update faucet title to show token type
        const faucetTitle = document.getElementById('faucet-title');
        if (faucetTitle) {
            if (this.jwtToken) {
                faucetTitle.textContent = '🚰 UselessCoin Faucet';
            } else {
                faucetTitle.textContent = '🎮 Demo Coin Faucet';
            }
        }
        
        // Update header login button
        const loginBtn = document.getElementById('oauth-login-btn');
        if (loginBtn) {
            if (this.jwtToken && this.userProfile) {
                loginBtn.textContent = `👤 ${this.userProfile.username}`;
                loginBtn.className = 'header-auth-btn member';
            } else {
                loginBtn.textContent = 'Login';
                loginBtn.className = 'header-auth-btn';
            }
        }
        
        // Update coin label
        const coinLabel = document.querySelector('#oauth-faucet-section .stats-label');
        if (coinLabel) {
            if (this.jwtToken) {
                coinLabel.textContent = 'UselessCoins';
            } else {
                coinLabel.textContent = 'Demo Coins';
            }
        }
    }
    
    showMessage(text, type = 'info') {
        console.log(`📢 ${type.toUpperCase()}: ${text}`);
        
        const messageEl = document.getElementById('oauth-message');
        if (messageEl) {
            messageEl.textContent = text;
            messageEl.className = `message ${type}`;
            messageEl.style.display = 'block';
            
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 3000);
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM loaded, initializing Simple Faucet...');
    window.simpleFaucet = new SimpleFaucet();
    console.log('✅ Simple Faucet ready!');
});
