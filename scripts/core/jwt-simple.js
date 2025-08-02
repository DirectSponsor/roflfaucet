// Simple JWT Implementation for ROFLFaucet
console.log('🔐 JWT Simple Faucet loading...');

class SimpleFaucet {
    constructor() {
        // JWT settings
        this.authApiBase = 'auth'; // Use local auth directory
        this.userDataApiBase = 'https://data.directsponsor.org/api';
        
        // User state
        this.jwtToken = null;
        this.userProfile = null;
        this.balance = 0;
        this.canClaim = false;
        
        console.log('🔧 JWT Simple Faucet initialized');
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.handleCallback(); // Handle JWT callback from auth server
        this.checkAuth();
        this.setupAutoRefresh();
    }
    
    handleCallback() {
        // Check if we're returning from auth server with JWT token
        const urlParams = new URLSearchParams(window.location.search);
        const jwt = urlParams.get('jwt');
        
        if (jwt) {
            console.log('🔑 JWT received from auth server');
            localStorage.setItem('jwt_token', jwt);
            this.jwtToken = jwt;
            
            // Clean up URL by removing the JWT parameter
            const cleanUrl = window.location.pathname;
            history.replaceState({}, document.title, cleanUrl);
            
            // Load user data and show faucet
            this.loadUserData();
            return true;
        }
        return false;
    }
    
    setupEventListeners() {
        // Main login button
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginDialog());
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        // Claim button (handled by faucet-bridge.js)
        // The claim process is now handled by the bridge script
    }
    
    checkAuth() {
        console.log('🔍 Checking JWT authentication...');
        
        // Check for existing JWT token
        this.jwtToken = localStorage.getItem('jwt_token');
        if (this.jwtToken) {
            console.log('🔑 Found existing JWT');
            if (this.isTokenValid()) {
                this.loadUserData();
            } else {
                console.log('⚠️ JWT expired, removing');
                this.handleLogout();
            }
        } else {
            console.log('❌ No JWT found, showing login');
            this.showLoginScreen();
        }
    }
    
    isTokenValid() {
        if (!this.jwtToken) return false;
        
        try {
            // Decode JWT payload (base64)
            const payload = JSON.parse(atob(this.jwtToken.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            
            // Check if token is expired
            if (payload.exp < now) {
                console.log('🕐 JWT expired');
                return false;
            }
            
            // Check IP binding (basic check - server will validate properly)
            console.log('✅ JWT appears valid');
            return true;
            
        } catch (error) {
            console.error('💥 Error validating JWT:', error);
            return false;
        }
    }
    
    async handleLogin(username, password) {
        try {
            console.log('🔐 Logging in with JWT...');
            
            const response = await fetch(`${this.authApiBase}/jwt-auth.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    username: username,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.jwt) {
                console.log('✅ JWT received successfully');
                localStorage.setItem('jwt_token', data.jwt);
                this.jwtToken = data.jwt;
                
                this.hideLoginDialog();
                await this.loadUserData();
                
            } else {
                console.error('❌ Login failed:', data.error);
                this.showMessage(data.error || 'Login failed', 'error');
            }
            
        } catch (error) {
            console.error('💥 Login error:', error);
            this.showMessage('Network error during login. Please try again.', 'error');
        }
    }
    
    async handleSignup(username, password, email) {
        try {
            console.log('🎉 Signing up with JWT...');
            
            const response = await fetch(`${this.authApiBase}/jwt-register.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    username: username,
                    password: password,
                    email: email
                })
            });
            
            const data = await response.json();
            
            if (data.jwt) {
                console.log('✅ Signup successful, JWT received');
                localStorage.setItem('jwt_token', data.jwt);
                this.jwtToken = data.jwt;
                
                this.hideLoginDialog();
                this.showMessage('Welcome to ROFLFaucet! Account created successfully.', 'success');
                await this.loadUserData();
                
            } else {
                console.error('❌ Signup failed:', data.error);
                this.showMessage(data.error || 'Signup failed', 'error');
            }
            
        } catch (error) {
            console.error('💥 Signup error:', error);
            this.showMessage('Network error during signup. Please try again.', 'error');
        }
    }
    
    async loadUserData() {
        try {
            console.log('👤 Loading user profile...');
            
            // Get user info from JWT payload
            const payload = JSON.parse(atob(this.jwtToken.split('.')[1]));
            
            // For now, use JWT user ID to get profile from user data API
            const profileResponse = await fetch(`${this.userDataApiBase}/profile?user_id=${payload.sub}`, {
                headers: {
                    'Authorization': `Bearer ${this.jwtToken}`
                }
            });
            
            if (profileResponse.ok) {
                this.userProfile = await profileResponse.json();
                console.log('✅ Profile loaded:', this.userProfile.username);
                
                // Load balance
                await this.loadBalance();
                this.showFaucetScreen();
                
            } else {
                // Fallback: use JWT data directly
                const username = payload.username || payload.name || payload.user || `User ${payload.sub}`;
                this.userProfile = { username: username };
                console.log('✅ Using JWT username:', username);
                await this.loadBalance();
                this.showFaucetScreen();
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
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.jwtToken}`,
                    'Content-Type': 'application/json'
                },
                cache: 'no-cache'
            });
            
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
                    'Authorization': `Bearer ${this.jwtToken}`,
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
    
    setupAutoRefresh() {
        // Check token expiration every minute
        setInterval(() => {
            if (this.jwtToken && this.isTokenValid()) {
                const payload = JSON.parse(atob(this.jwtToken.split('.')[1]));
                const now = Math.floor(Date.now() / 1000);
                const timeUntilExpiry = payload.exp - now;
                
                // Refresh if less than 2 minutes remaining
                if (timeUntilExpiry < 120) {
                    console.log('🔄 Auto-refreshing JWT...');
                    this.refreshToken();
                }
            }
        }, 60000); // Check every minute
    }
    
    async refreshToken() {
        try {
            const response = await fetch(`${this.authApiBase}/jwt-refresh.php`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.jwtToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.jwt) {
                console.log('✅ JWT refreshed successfully');
                localStorage.setItem('jwt_token', data.jwt);
                this.jwtToken = data.jwt;
            } else {
                console.log('⚠️ Token refresh failed, logging out');
                this.handleLogout();
            }
            
        } catch (error) {
            console.error('💥 Token refresh error:', error);
            this.handleLogout();
        }
    }
    
initializeFaucet() {
        const faucetSection = document.getElementById('oauth-faucet-section');
        
        if (faucetSection) {
            faucetSection.style.display = 'block';
            const loginNotice = document.getElementById('login-notice');
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) welcomeMessage.style.display = this.jwtToken ? 'block' : 'none';
            if (loginNotice) loginNotice.style.display = this.jwtToken ? 'none' : 'block';
        }
    }
    
    showFaucetScreen() {
        // Show/hide login notice and welcome message based on auth state
        const loginNotice = document.getElementById('login-notice');
        const welcomeMessage = document.getElementById('welcome-message');
        const logoutSection = document.getElementById('logout-section');
        
        if (loginNotice) loginNotice.style.display = this.jwtToken ? 'none' : 'block';
        if (welcomeMessage) welcomeMessage.style.display = this.jwtToken ? 'block' : 'none';
        if (logoutSection) logoutSection.style.display = this.jwtToken ? 'block' : 'none';
        
        this.updateUI();
    }
    
    updateUI() {
        // Update username
        const usernameEls = document.querySelectorAll('#username');
        if (this.userProfile) {
            usernameEls.forEach(el => {
                if (el) el.textContent = this.userProfile.username;
            });
        }
        
        // Update balance
        const balanceEl = document.getElementById('balance');
        if (balanceEl) {
            balanceEl.textContent = this.balance;
        }
        
        // Update header login button
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            if (this.jwtToken && this.userProfile) {
                loginBtn.textContent = `👤 ${this.userProfile.username}`;
                loginBtn.className = 'header-auth-btn member';
            } else {
                loginBtn.textContent = 'Login';
                loginBtn.className = 'header-auth-btn';
            }
        }
        
        // Update claim button
        const claimBtn = document.getElementById('oauth-claim-btn');
        if (claimBtn) {
            claimBtn.disabled = this.jwtToken ? !this.canClaim : false;
            
            if (!this.jwtToken) {
                claimBtn.textContent = '🎲 Claim 5 UselessCoins';
                claimBtn.className = 'claim-button';
            } else if (this.canClaim) {
                claimBtn.textContent = '🎲 Claim 5 UselessCoins';
                claimBtn.className = 'claim-button';
            } else {
                claimBtn.textContent = '⏱️ Cooldown Active';
                claimBtn.className = 'claim-button disabled';
            }
        }
    }
    
    handleLogout() {
        console.log('🚪 Logging out...');
        
        localStorage.removeItem('jwt_token');
        
        this.jwtToken = null;
        this.userProfile = null;
        this.balance = 0;
        this.canClaim = false;
        
        this.showLoginScreen();
        this.showMessage('Logged out successfully', 'info');
    }
    
    handleClaimClick() {
        if (!this.jwtToken) {
            this.showLoginDialog();
        } else {
            this.handleClaim();
        }
    }
    
    showLoginDialog() {
        // If already logged in, show member menu (logout)
        if (this.jwtToken) {
            if (confirm('Are you sure you want to logout?')) {
                this.handleLogout();
            }
            return;
        }
        
        // Redirect to external auth server
        const currentUrl = window.location.href;
        const authUrl = `https://auth.directsponsor.org/jwt-login.php?redirect_uri=${encodeURIComponent(currentUrl)}`;
        window.location.href = authUrl;
    }
    
    showMessage(text, type = 'info') {
        console.log(`📢 ${type.toUpperCase()}: ${text}`);
        
        const messageEl = document.getElementById('message');
        if (messageEl) {
            messageEl.textContent = text;
            messageEl.className = `message ${type}`;
            messageEl.style.display = 'block';
            
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 3000);
        }
    }
    
    showLoginScreen() {
        const loginSection = document.getElementById('oauth-login-section');
        const faucetSection = document.getElementById('oauth-faucet-section');
        
        if (loginSection) loginSection.style.display = 'block';
        if (faucetSection) faucetSection.style.display = 'none';
        
        this.updateUI();
    }
}

// Handle login form submission
function handleJWTLogin() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    if (username && password) {
        window.jwtSimpleFaucet.handleLogin(username, password);
    } else {
        window.jwtSimpleFaucet.showMessage('Please enter username and password', 'error');
    }
}

// Clean up old code - no longer needed with redirect-based auth

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM loaded, initializing JWT Simple Faucet...');
    window.jwtSimpleFaucet = new SimpleFaucet();
    console.log('✅ JWT Simple Faucet ready!');
});
