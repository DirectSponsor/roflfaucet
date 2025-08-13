// Simple JWT Implementation for ROFLFaucet
console.log('🔐 JWT Simple Faucet loading...');

class SimpleFaucet {
    constructor() {
        // JWT settings
        this.authApiBase = 'auth'; // Use local auth directory
        this.userDataApiBase = 'api'; // Use local flat-file API
        
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
            
            // Refresh login status in unified balance system
            if (window.unifiedBalance) {
                window.unifiedBalance.refreshLoginStatus();
            }
            
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
            
            const response = await fetch(`${this.authApiBase}/jwt-login.php`, {
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
            
            if (data.jwt_token || data.jwt) {
                const token = data.jwt_token || data.jwt;
                console.log('✅ JWT received successfully');
                localStorage.setItem('jwt_token', token);
                this.jwtToken = token;
                
                this.hideLoginDialog();
                await this.loadUserData();
                
                // Refresh login status in unified balance system
                if (window.unifiedBalance) {
                    window.unifiedBalance.refreshLoginStatus();
                }
                
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
            
            const response = await fetch(`${this.authApiBase}/jwt-signup.php`, {
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
            
            if (data.jwt_token || data.jwt) {
                const token = data.jwt_token || data.jwt;
                console.log('✅ Signup successful, JWT received');
                localStorage.setItem('jwt_token', token);
                this.jwtToken = token;
                
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
            
            // Try to load from flat-file API
            const profileResponse = await fetch(`${this.userDataApiBase}/user-data.php?action=profile`, {
                headers: {
                    'Authorization': `Bearer ${this.jwtToken}`
                }
            });
            
            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                if (profileData.success) {
                    this.userProfile = { username: profileData.profile.username || payload.username };
                    console.log('✅ Profile loaded from flat-file API:', this.userProfile.username);
                } else {
                    throw new Error('Profile API returned error');
                }
            } else {
                throw new Error('Profile API request failed');
            }
            
            // Load balance
            await this.loadBalance();
            this.showFaucetScreen();
            
        } catch (error) {
            console.log('⚠️ Using JWT fallback data due to:', error.message);
            
            // Fallback: use JWT data directly
            const payload = JSON.parse(atob(this.jwtToken.split('.')[1]));
            const username = payload.username || payload.name || payload.user || `User${payload.sub.slice(-4)}`;
            this.userProfile = { username: username };
            console.log('✅ Using JWT username:', username);
            
            await this.loadBalance();
            this.showFaucetScreen();
        }
    }
    
    async loadBalance() {
        try {
            console.log('💰 Loading user balance...');
            
            const response = await fetch(`${this.userDataApiBase}/user-data.php?action=balance`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.jwtToken}`,
                    'Content-Type': 'application/json'
                },
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.balance = parseFloat(data.balance);
                    this.canClaim = true; // For now, always allow claims for testing
                    
                    console.log('✅ Balance loaded from flat-file API:', this.balance);
                    this.updateUI();
                } else {
                    throw new Error('Balance API returned error: ' + (data.error || 'Unknown'));
                }
                
            } else {
                throw new Error('Balance API request failed: ' + response.status);
            }
            
        } catch (error) {
            console.log('⚠️ Using fallback balance due to:', error.message);
            this.balance = 10; // Default balance for new users
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
            console.log('🎲 Processing faucet claim...');
            this.showMessage('Processing claim...', 'info');
            
            const response = await fetch(`${this.userDataApiBase}/user-data.php?action=faucet_claim`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.jwtToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: 10
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                const coinsEarned = result.claimed_amount;
                console.log('✅ Faucet claim successful! Earned:', coinsEarned);
                
                this.showMessage(`🎉 Claimed ${coinsEarned} Useless Coins!`, 'success');
                
                // Update local balance
                this.balance = result.new_balance;
                this.updateUI();
                
                // Trigger flat-file balance system update if available
                if (window.flatFileUserData) {
                    window.flatFileUserData.balanceCache = result.new_balance;
                    window.flatFileUserData.updateBalanceDisplay(result.new_balance);
                }
                
            } else {
                console.error('❌ Faucet claim failed:', result);
                this.showMessage(result.error || 'Claim failed. Please try again.', 'error');
            }
            
        } catch (error) {
            console.error('💥 Faucet claim error:', error);
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
            
            if (data.jwt_token || data.jwt) {
                const token = data.jwt_token || data.jwt;
                console.log('✅ JWT refreshed successfully');
                localStorage.setItem('jwt_token', token);
                this.jwtToken = token;
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
        // Initialize faucet UI elements (most are now handled by unified balance system)
        const loginNotice = document.getElementById('login-notice');
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage) welcomeMessage.style.display = this.jwtToken ? 'block' : 'none';
        if (loginNotice) loginNotice.style.display = this.jwtToken ? 'none' : 'block';
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
        
        // Update faucet claim button (if exists on page)
        const claimBtn = document.getElementById('faucet-countdown-btn');
        if (claimBtn) {
            claimBtn.disabled = this.jwtToken ? !this.canClaim : false;
            
            const btnText = claimBtn.querySelector('.btn-text');
            if (btnText) {
                if (!this.jwtToken) {
                    btnText.textContent = 'Faucet: 300';
                } else if (this.canClaim) {
                    btnText.textContent = 'Faucet: Ready';
                } else {
                    btnText.textContent = 'Faucet: Cooldown';
                }
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
        
        // Refresh login status in unified balance system
        if (window.unifiedBalance) {
            window.unifiedBalance.refreshLoginStatus();
        }
    }
    
    handleClaimClick() {
        if (!this.jwtToken) {
            this.showLoginDialog();
        } else {
            this.handleClaim();
        }
    }
    
    showLoginDialog() {
        // If already logged in, show member menu
        if (this.jwtToken) {
            this.showUserMenu();
            return;
        }
        
        // Redirect to external auth server
        const currentUrl = window.location.href;
        const authUrl = `https://auth.directsponsor.org/jwt-login.php?redirect_uri=${encodeURIComponent(currentUrl)}`;
        window.location.href = authUrl;
    }
    
    showUserMenu() {
        // Create or show user menu dropdown
        let existingMenu = document.getElementById('user-menu-dropdown');
        
        if (existingMenu) {
            // Toggle existing menu
            existingMenu.style.display = existingMenu.style.display === 'none' ? 'block' : 'none';
            return;
        }
        
        // Create user menu dropdown
        const menu = document.createElement('div');
        menu.id = 'user-menu-dropdown';
        menu.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-radius: 5px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            min-width: 180px;
            z-index: 1000;
            display: block;
        `;
        
        const username = this.userProfile?.username || 'User';
        
        menu.innerHTML = `
            <div style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #333;">
                👤 ${username}
            </div>
            <a href="profile.html" style="display: block; padding: 10px; text-decoration: none; color: #333; border-bottom: 1px solid #eee;">
                ✏️ Edit Profile
            </a>
            <a href="profile.html" style="display: block; padding: 10px; text-decoration: none; color: #333; border-bottom: 1px solid #eee;">
                👁️ View Profile
            </a>
            <div onclick="window.jwtSimpleFaucet.handleLogout()" style="padding: 10px; cursor: pointer; color: #dc3545; border-bottom: none;">
                🚪 Logout
            </div>
        `;
        
        // Position relative to login button
        const loginBtn = document.getElementById('login-btn');
        loginBtn.style.position = 'relative';
        loginBtn.appendChild(menu);
        
        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!loginBtn.contains(e.target)) {
                    menu.style.display = 'none';
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
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
        // Show/hide relevant UI elements for login state
        const loginNotice = document.getElementById('login-notice');
        const welcomeMessage = document.getElementById('welcome-message');
        
        if (loginNotice) loginNotice.style.display = 'block';
        if (welcomeMessage) welcomeMessage.style.display = 'none';
        
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
