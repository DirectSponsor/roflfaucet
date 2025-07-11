// Simple OAuth ROFLFaucet - Clean Implementation with Real APIs
console.log('🔐 OAuth Simple Faucet loading...');

class OAuthSimpleFaucet {
    constructor() {
        // OAuth settings
        this.authApiBase = 'https://auth.directsponsor.org';
        this.userDataApiBase = 'https://data.directsponsor.org/api';
        this.clientId = 'roflfaucet';
        this.redirectUri = window.location.origin + '/auth/callback.html';
        
        // User state
        this.accessToken = null;
        this.userProfile = null;
        this.balance = 0;
        this.canClaim = false;
        
        console.log('🔧 OAuth Simple Faucet initialized');
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkAuth();
    }
    
    setupEventListeners() {
        // Main login button (matches HTML ID)
        const loginBtn = document.getElementById('oauth-login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.startLogin());
        }
        
        // Logout button (matches HTML ID)
        const logoutBtn = document.getElementById('oauth-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        // Claim button (matches HTML ID)
        const claimBtn = document.getElementById('oauth-claim-btn');
        if (claimBtn) {
            claimBtn.addEventListener('click', () => this.handleClaimClick());
        }
    }
    
    checkAuth() {
        console.log('🔍 Checking authentication...');
        
        // Check for OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');
        
        if (authCode) {
            console.log('📨 Processing OAuth callback...');
            this.exchangeCodeForToken(authCode);
            return;
        }
        
        // Check for existing token
        this.accessToken = localStorage.getItem('oauth_simple_token');
        if (this.accessToken) {
            console.log('🔑 Found existing token');
            this.loadUserData();
        } else {
            console.log('❌ No auth found, showing login');
            this.showLoginScreen();
        }
    }
    
    startLogin() {
        console.log('🔐 Starting OAuth login...');
        
        const state = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('oauth_state', state);
        
        const authUrl = new URL(`${this.authApiBase}/authorize.php`);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('client_id', this.clientId);
        authUrl.searchParams.append('redirect_uri', this.redirectUri);
        authUrl.searchParams.append('scope', 'read write');
        authUrl.searchParams.append('state', state);
        
        console.log('🌐 Redirecting to OAuth...');
        window.location.href = authUrl.toString();
    }
    
    async exchangeCodeForToken(code) {
        try {
            console.log('🔄 Exchanging code for token...');
            
            const response = await fetch(`${this.authApiBase}/oauth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: this.clientId,
                    code: code,
                    redirect_uri: this.redirectUri
                })
            });
            
            if (response.ok) {
                const tokenData = await response.json();
                this.accessToken = tokenData.access_token;
                localStorage.setItem('oauth_simple_token', this.accessToken);
                
                console.log('✅ Token received successfully');
                
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Load user data
                await this.loadUserData();
                
            } else {
                console.error('❌ Token exchange failed:', response.status);
                this.showMessage('Login failed. Please try again.', 'error');
                this.showLoginScreen();
            }
            
        } catch (error) {
            console.error('💥 Token exchange error:', error);
            this.showMessage('Connection error during login.', 'error');
            this.showLoginScreen();
        }
    }
    
    async loadUserData() {
        try {
            console.log('👤 Loading user profile...');
            
            // Get user profile
            const profileResponse = await fetch(`${this.authApiBase}/oauth/userinfo`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            if (profileResponse.ok) {
                this.userProfile = await profileResponse.json();
                console.log('✅ Profile loaded:', this.userProfile.username);
                
                // Load balance from data API
                await this.loadBalance();
                this.showFaucetScreen();
                
            } else {
                throw new Error('Profile load failed');
            }
            
        } catch (error) {
            console.error('💥 User data loading error:', error);
            this.showMessage('Failed to load user data.', 'error');
            this.handleLogout();
        }
    }
    
    async loadBalance() {
        try {
            console.log('💰 Loading user balance...');
            
            const url = `${this.userDataApiBase}/dashboard?site_id=roflfaucet&_t=${Date.now()}`;
            console.log('🔗 Calling dashboard API:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                cache: 'no-cache'
            });
            
            console.log('📊 Dashboard response status:', response.status);
            console.log('📊 Dashboard response headers:', [...response.headers.entries()]);
            
            if (response.ok) {
                const data = await response.json();
                this.balance = parseFloat(data.dashboard.balance.useless_coins);
                this.canClaim = data.dashboard.claim_statuses.roflfaucet.can_claim;
                
                console.log('✅ Balance loaded:', this.balance, 'Can claim:', this.canClaim);
                this.updateUI();
                
            } else {
                console.log('⚠️ Using fallback balance (API unavailable)');
                this.balance = 0;
                this.canClaim = true;
                this.updateUI();
            }
            
        } catch (error) {
            console.error('💥 Balance loading error:', error);
            console.log('⚠️ Using fallback balance');
            this.balance = 0;
            this.canClaim = true;
            this.updateUI();
        }
    }
    
    async handleClaim() {
        if (!this.canClaim) {
            this.showMessage('Please wait before claiming again.', 'warning');
            return;
        }
        
        try {
            console.log('🎲 Processing claim...');
            this.showMessage('Processing claim...', 'info');
            
            const response = await fetch(`${this.userDataApiBase}/balance/claim`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    site_id: 'roflfaucet'
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                const coinsEarned = result.rewards.useless_coins;
                console.log('✅ Claim successful! Earned:', coinsEarned);
                
                this.showMessage(`🎉 Claimed ${coinsEarned} UselessCoins!`, 'success');
                
                // Reload balance
                await this.loadBalance();
                
            } else {
                console.error('❌ Claim failed:', result);
                this.showMessage(result.error || 'Claim failed. Please try again.', 'error');
            }
            
        } catch (error) {
            console.error('💥 Claim error:', error);
            this.showMessage('Network error during claim. Please try again.', 'error');
        }
    }
    
    showLoginScreen() {
        // Show login section, hide faucet section
        const loginSection = document.getElementById('oauth-login-section');
        const faucetSection = document.getElementById('oauth-faucet-section');
        
        if (loginSection) loginSection.style.display = 'block';
        if (faucetSection) faucetSection.style.display = 'none';
    }
    
    showFaucetScreen() {
        // Hide login section, show faucet section
        const loginSection = document.getElementById('oauth-login-section');
        const faucetSection = document.getElementById('oauth-faucet-section');
        
        if (loginSection) loginSection.style.display = 'none';
        if (faucetSection) faucetSection.style.display = 'block';
        
        this.updateUI();
    }
    
    updateUI() {
        // Update username in all locations
        const usernameEls = document.querySelectorAll('#oauth-username, #header-username');
        if (this.userProfile) {
            usernameEls.forEach(el => {
                if (el) el.textContent = this.userProfile.username;
            });
        }
        
        // Update balance
        const balanceEl = document.getElementById('oauth-balance');
        if (balanceEl) {
            balanceEl.textContent = this.balance;
        }
        
        // Update claim button
        const claimBtn = document.getElementById('oauth-claim-btn');
        if (claimBtn) {
            claimBtn.disabled = this.accessToken ? !this.canClaim : false;
            
            if (!this.accessToken) {
                claimBtn.textContent = '🎲 Claim 5 UselessCoins';
                claimBtn.className = 'claim-button';
            } else if (this.canClaim) {
                claimBtn.textContent = '🎲 Claim 5 UselessCoins';
                claimBtn.className = 'claim-button';
            } else {
                claimBtn.textContent = '⏱️ Cooldown Active';
                claimBtn.className = 'claim-button disabled';
            }
            
            console.log('🔄 UI Updated - Balance:', this.balance, 'Can claim:', this.canClaim);
        }
    }
    
    handleLogout() {
        console.log('🚪 Logging out...');
        
        localStorage.removeItem('oauth_simple_token');
        localStorage.removeItem('oauth_state');
        
        this.accessToken = null;
        this.userProfile = null;
        this.balance = 0;
        this.canClaim = false;
        
        this.showLoginScreen();
        this.showMessage('Logged out successfully', 'info');
    }

    handleClaimClick() {
        if (!this.accessToken) {
            this.showLoginDialog();
        } else {
            this.handleClaim();
        }
    }

    showLoginDialog() {
        const dialog = document.getElementById('login-dialog');
        if (dialog) {
            dialog.style.display = 'flex';
        }
    }

    hideLoginDialog() {
        const dialog = document.getElementById('login-dialog');
        if (dialog) {
            dialog.style.display = 'none';
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

// Modal helper functions (globally accessible)
window.hideLoginDialog = () => {
    const dialog = document.getElementById('login-dialog');
    if (dialog) dialog.style.display = 'none';
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM loaded, initializing OAuth Simple Faucet...');
    window.oauthSimpleFaucet = new OAuthSimpleFaucet();
    console.log('✅ OAuth Simple Faucet ready!');
});

