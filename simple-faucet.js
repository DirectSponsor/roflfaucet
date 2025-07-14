// Multi-Step Faucet Implementation
console.log('🚰 Multi-Step Faucet loading...');

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
        this.showFaucetStep(1);
        this.setupEventListeners();
        this.handleCallback();
        
        if (this.jwtToken) {
            this.loadUserData();
        }
        
        this.updateUI();
    }
    
    showFaucetStep(step) {
        this.currentStep = step;
        const steps = ['welcome-step', 'faucet-step', 'result-step'];
        steps.forEach((stepId, index) => {
            const element = document.getElementById(stepId);
            if (element) {
                element.style.display = index === (step - 1) ? 'block' : 'none';
            }
        });

        // Update content based on step
        if (step === 3) {
            this.handleClaimSuccess();
        }
        
        this.updateUI();
    }
    
    setupEventListeners() {
        // Step navigation
        const startBtn = document.getElementById('start-claim-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.goToStep2());
        }
        
        const finalBtn = document.getElementById('final-claim-btn');
        if (finalBtn) {
            finalBtn.addEventListener('click', () => this.processClaim());
        }
        
        const backBtn = document.getElementById('back-to-start');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showFaucetStep(1));
        }

        // Header login button
        const loginBtn = document.getElementById('oauth-login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleLoginClick());
        }
        
        // Logout button
        const logoutBtn = document.getElementById('oauth-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }
    
    goToStep2() {
        // Check cooldown before proceeding
        const now = Date.now();
        const cooldownTime = 5 * 60 * 1000; // 5 minutes
        
        if (now - this.lastClaimTime < cooldownTime) {
            const remainingTime = Math.ceil((cooldownTime - (now - this.lastClaimTime)) / 1000 / 60);
            this.showMessage(`⏱️ Please wait ${remainingTime} more minute(s) before claiming again`, 'warning');
            return;
        }
        
        this.showFaucetStep(2);
    }
    
    processClaim() {
        // In a real implementation, you'd validate the captcha here
        this.showFaucetStep(3);
    }
    
    handleClaimSuccess() {
        const now = Date.now();
        const claimAmount = 5;
        
        if (this.jwtToken) {
            // Logged in - claim real coins
            this.balance += claimAmount;
            document.getElementById('won-amount').textContent = claimAmount;
            document.getElementById('won-type').textContent = 'UselessCoins';
            document.getElementById('result-message').textContent = 'added to your balance!';
            this.showMessage('🎉 Claimed 5 UselessCoins!', 'success');
        } else {
            // Not logged in - claim demo coins
            this.localBalance += claimAmount;
            localStorage.setItem('local_balance', this.localBalance.toString());
            document.getElementById('won-amount').textContent = claimAmount;
            document.getElementById('won-type').textContent = 'Demo Coins';
            document.getElementById('result-message').textContent = 'added to your demo balance!';
            this.showMessage('🎮 Claimed 5 Demo Coins! Login to earn real UselessCoins.', 'success');
        }
        
        // Update last claim time
        this.lastClaimTime = now;
        localStorage.setItem('last_claim_time', now.toString());
        
        this.updateUI();
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
            
            this.updateUI();
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
    
    handleLogout() {
        localStorage.removeItem('jwt_token');
        this.jwtToken = null;
        this.userProfile = null;
        this.balance = 0;
        
        this.showFaucetStep(1);
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
        
        // Update coin labels
        const balanceLabel = document.getElementById('balance-label');
        if (balanceLabel) {
            if (this.jwtToken) {
                balanceLabel.textContent = 'UselessCoins';
            } else {
                balanceLabel.textContent = 'Demo Coins';
            }
        }
        
        // Update claim text on step 2
        const claimAmount = document.getElementById('claim-amount');
        const claimType = document.getElementById('claim-type');
        const claimBtnAmount = document.getElementById('claim-btn-amount');
        const claimBtnType = document.getElementById('claim-btn-type');
        
        if (claimAmount) claimAmount.textContent = '5';
        if (claimBtnAmount) claimBtnAmount.textContent = '5';
        
        if (claimType && claimBtnType) {
            const typeText = this.jwtToken ? 'UselessCoins' : 'Demo Coins';
            claimType.textContent = typeText;
            claimBtnType.textContent = typeText;
        }
        
        // Update login notice based on auth status
        const loginNotice = document.getElementById('login-notice');
        const welcomeMessage = document.getElementById('welcome-message');
        const logoutSection = document.getElementById('logout-section');
        
        if (this.jwtToken && this.userProfile) {
            if (loginNotice) loginNotice.style.display = 'none';
            if (welcomeMessage) welcomeMessage.style.display = 'block';
            if (logoutSection) logoutSection.style.display = 'block';
        } else {
            if (loginNotice) loginNotice.style.display = 'block';
            if (welcomeMessage) welcomeMessage.style.display = 'none';
            if (logoutSection) logoutSection.style.display = 'none';
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
