// Site Utilities - Minimal Version
// Essential functions for faucet countdown system

// Cooldown functions
function getRemainingCooldownTime() {
    const lastClaim = localStorage.getItem('last_claim_time');
    if (!lastClaim) return 0;
    
    const now = Date.now();
    const cooldownTime = 5 * 60 * 1000; // 5 minutes
    const timeSinceLastClaim = now - parseInt(lastClaim);
    
    return Math.max(0, cooldownTime - timeSinceLastClaim);
}

function canClaim() {
    return getRemainingCooldownTime() === 0;
}

let faucetCountdownInterval = null;

function updateFaucetCountdownButton() {
    const btn = document.getElementById('faucet-countdown-btn');
    if (!btn) return;
    
    const btnText = btn.querySelector('.btn-text');
    if (!btnText) return;
    
    const totalCooldown = 5 * 60 * 1000; // 5 minutes in milliseconds
    const remaining = getRemainingCooldownTime();
    
    // Calculate progress percentage (how much time has passed)
    const elapsed = totalCooldown - remaining;
    const progressPercent = Math.max(0, Math.min(100, (elapsed / totalCooldown) * 100));
    
    if (remaining <= 0) {
        // Ready to claim - bright green gradient
        btn.disabled = false;
        btnText.textContent = 'Faucet: Ready';
        btn.style.background = 'linear-gradient(90deg, #3CE74C 0%, #2DD93C 50%, #3CE74C 100%)';
        
        // Clear interval if running
        if (faucetCountdownInterval) {
            clearInterval(faucetCountdownInterval);
            faucetCountdownInterval = null;
        }
    } else {
        // Still in cooldown - progress gradient
        btn.disabled = true;
        const seconds = Math.ceil(remaining / 1000);
        btnText.textContent = `Faucet: ${seconds}s`;
        
        // Progress bar effect - green fills from left as time passes
        btn.style.background = `linear-gradient(to right, #3CE74C ${progressPercent}%, #95a5a6 ${progressPercent}%)`;
    }
    
    // Update slot machine progress bars (progress-fill elements)
    const progressBar = document.getElementById('progress-fill');
    if (progressBar) {
        if (remaining <= 0) {
            // Ready to claim - show full progress
            progressBar.style.width = '100%';
            
            // Check if this is the first time reaching 100% (trigger red pulse)
            if (!progressBar.hasAttribute('data-pulsed')) {
                progressBar.setAttribute('data-pulsed', 'true');
                
                // Red pulse animation - 2 quick pulses
                progressBar.style.background = '#ff4757'; // Bright red
                progressBar.style.transition = 'background 0.3s ease';
                
                setTimeout(() => {
                    progressBar.style.background = 'linear-gradient(90deg, #3CE74C 0%, #2DD93C 50%, #3CE74C 100%)'; // Green
                    setTimeout(() => {
                        progressBar.style.background = '#ff4757'; // Red again
                        setTimeout(() => {
                            progressBar.style.background = 'linear-gradient(90deg, #3CE74C 0%, #2DD93C 50%, #3CE74C 100%)'; // Final green
                            progressBar.style.transition = ''; // Remove transition
                        }, 300);
                    }, 300);
                }, 300);
            } else {
                // Already pulsed, just show steady green
                progressBar.style.background = 'linear-gradient(90deg, #3CE74C 0%, #2DD93C 50%, #3CE74C 100%)';
            }
        } else {
            // In cooldown - show progress percentage
            progressBar.style.width = `${progressPercent}%`;
            progressBar.style.background = 'linear-gradient(90deg, #3CE74C 0%, #2DD93C 50%, #3CE74C 100%)';
            
            // Reset pulse flag when back in cooldown
            progressBar.removeAttribute('data-pulsed');
        }
    }
}

function startFaucetCountdown() {
    // Clear any existing interval
    if (faucetCountdownInterval) {
        clearInterval(faucetCountdownInterval);
    }
    
    // Update immediately
    updateFaucetCountdownButton();
    
    // Update every second
    faucetCountdownInterval = setInterval(updateFaucetCountdownButton, 1000);
}

function handleFaucetClaim() {
    if (!canClaim()) {
        alert('Faucet is not ready yet!');
        return;
    }
    
    // Determine where to redirect based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (currentPage === 'index.html' || currentPage === '') {
        // From main faucet page, go to claim page
        window.location.href = 'faucet-claim.html';
    } else if (currentPage === 'faucet-result.html') {
        // From result page, go back to main faucet page
        window.location.href = 'index.html';
    } else {
        // Default fallback to main page
        window.location.href = 'index.html';
    }
}

// Mobile navigation toggle
function toggleMobileNav() {
    const nav = document.getElementById('main-nav');
    if (nav) {
        nav.classList.toggle('mobile-nav-open');
    }
}

// Login functionality
function showLoginDialog(clickedButton = null) {
    // Check if already logged in (has JWT token)
    const jwtToken = localStorage.getItem('jwt_token');
    
    if (jwtToken) {
        // Already logged in - show user menu or redirect to profile
        showUserMenu(clickedButton);
        return;
    }
    
    // Redirect to external auth server
    const currentUrl = window.location.href;
    const authUrl = `https://auth.directsponsor.org/jwt-login.php?redirect_uri=${encodeURIComponent(currentUrl)}`;
    window.location.href = authUrl;
}

function showUserMenu(clickedButton = null) {
    // Simple user menu for logged in users
    const existingMenu = document.getElementById('user-menu-dropdown');
    
    if (existingMenu) {
        // Toggle existing menu
        existingMenu.style.display = existingMenu.style.display === 'none' ? 'block' : 'none';
        return;
    }
    
    // Create user menu dropdown
    const menu = document.createElement('div');
    menu.id = 'user-menu-dropdown';
    menu.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        min-width: 180px;
        z-index: 1000;
        display: block;
    `;
    
    // Get username from JWT token
    let username = 'User';
    try {
        const jwtToken = localStorage.getItem('jwt_token');
        if (jwtToken) {
            const payload = JSON.parse(atob(jwtToken.split('.')[1]));
            username = payload.username || payload.sub || 'User';
        }
    } catch (e) {
        console.warn('Could not decode JWT token for username');
    }
    
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
        <div onclick="handleLogout()" style="padding: 10px; cursor: pointer; color: #dc3545; border-bottom: none;">
            🚪 Logout
        </div>
    `;
    
    // Determine which login button to position relative to
    let referenceBtn = clickedButton;
    if (!referenceBtn) {
        // Try desktop button first, then mobile button
        referenceBtn = document.getElementById('login-btn') || document.getElementById('login-btn-mobile');
    }
    
    if (referenceBtn) {
        const btnRect = referenceBtn.getBoundingClientRect();
        
        // Check if this is a mobile button (inside mobile nav)
        const isMobileButton = referenceBtn.id === 'login-btn-mobile';
        
        if (isMobileButton) {
            // Position for mobile - center horizontally, below the button
            menu.style.top = (btnRect.bottom + window.scrollY + 5) + 'px';
            menu.style.left = '50%';
            menu.style.transform = 'translateX(-50%)';
        } else {
            // Position for desktop - align to right edge
            menu.style.top = (btnRect.bottom + window.scrollY + 5) + 'px';
            menu.style.right = (window.innerWidth - btnRect.right) + 'px';
        }
    } else {
        // Fallback positioning - center of screen
        menu.style.top = '20%';
        menu.style.left = '50%';
        menu.style.transform = 'translateX(-50%)';
    }
    
    document.body.appendChild(menu);
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (referenceBtn && !referenceBtn.contains(e.target) && !menu.contains(e.target)) {
                menu.style.display = 'none';
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

function handleLogout() {
    console.log('🚪 Logging out...');
    
    // Clear JWT token
    localStorage.removeItem('jwt_token');
    
    // Close any open user menu
    const existingMenu = document.getElementById('user-menu-dropdown');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    // Force page refresh to reset all UI elements
    window.location.reload();
}

// Update login button based on auth state
function updateLoginButton() {
    const loginBtn = document.getElementById('login-btn');
    if (!loginBtn) return;
    
    const jwtToken = localStorage.getItem('jwt_token');
    
    if (jwtToken) {
        // Get username from JWT token
        let username = 'User';
        try {
            const payload = JSON.parse(atob(jwtToken.split('.')[1]));
            username = payload.username || payload.sub || 'User';
        } catch (e) {
            console.warn('Could not decode JWT token for username');
        }
        
        loginBtn.textContent = `👤 ${username}`;
        loginBtn.style.background = '#27ae60'; // Green for logged in
    } else {
        loginBtn.textContent = '🚪 Login';
        loginBtn.style.background = '#4A90E2'; // Blue for login
    }
}

// Update login-dependent content visibility (show/hide guest-only elements)
function updateLoginDependentContent() {
    const jwtToken = localStorage.getItem('jwt_token');
    const isLoggedIn = !!jwtToken;
    
    // Find all elements with 'guest-only' class
    const guestOnlyElements = document.querySelectorAll('.guest-only');
    
    guestOnlyElements.forEach(element => {
        if (isLoggedIn) {
            // Hide guest-only content when logged in
            element.style.display = 'none';
        } else {
            // Show guest-only content when logged out
            element.style.display = '';
        }
    });
    
    console.log(`👁️ Login-dependent content updated: ${guestOnlyElements.length} guest-only elements ${isLoggedIn ? 'hidden' : 'shown'}`);
}

// Update mobile login button based on auth state
function updateMobileLoginButton() {
    const mobileLoginBtn = document.getElementById('login-btn-mobile');
    if (!mobileLoginBtn) return;
    
    const jwtToken = localStorage.getItem('jwt_token');
    
    if (jwtToken) {
        // Get username from JWT token
        let username = 'User';
        try {
            const payload = JSON.parse(atob(jwtToken.split('.')[1]));
            username = payload.username || payload.sub || 'User';
        } catch (e) {
            console.warn('Could not decode JWT token for username');
        }
        
        mobileLoginBtn.textContent = `👤 ${username}`;
        mobileLoginBtn.style.background = '#27ae60'; // Green for logged in
    } else {
        mobileLoginBtn.textContent = '🚪 Login';
        mobileLoginBtn.style.background = '#4A90E2'; // Blue for login
    }
}

// Process JWT token from URL parameters
function processJwtFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const jwtParam = urlParams.get('jwt');
    
    if (jwtParam) {
        console.log('🔑 JWT token found in URL, storing in localStorage...');
        
        // Store the token in localStorage
        localStorage.setItem('jwt_token', jwtParam);
        
        // Clean up the URL by removing JWT parameters
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
        
        console.log('✅ JWT token stored successfully');
        return true;
    }
    
    return false;
}

// Initialize countdown when page loads
document.addEventListener('DOMContentLoaded', function() {
    // First, process any JWT token from URL
    const tokenProcessed = processJwtFromUrl();
    
    const faucetBtn = document.getElementById('faucet-countdown-btn');
    if (faucetBtn) {
        startFaucetCountdown();
    }
    
    // Set up login button functionality
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            showLoginDialog(loginBtn);
        });
        updateLoginButton();
    }
    
    // Update login-dependent content visibility on page load
    updateLoginDependentContent();
    
    // Set up mobile login button functionality
    const mobileLoginBtn = document.getElementById('login-btn-mobile');
    if (mobileLoginBtn) {
        mobileLoginBtn.addEventListener('click', function() {
            showLoginDialog(mobileLoginBtn);
        });
        // Also update mobile login button text/style
        updateMobileLoginButton();
    }
    
    // Also update login button on any guest login buttons (like in profile page)
    const guestLoginBtn = document.getElementById('login-btn-guest');
    if (guestLoginBtn) {
        guestLoginBtn.addEventListener('click', showLoginDialog);
    }
    
    // If we processed a token, refresh login status and balance
    if (tokenProcessed) {
        console.log('🔄 Token processed, refreshing login status...');
        updateLoginButton();
        updateMobileLoginButton();
        updateLoginDependentContent();
        
        // Refresh the unified balance system to recognize the new login
        if (window.unifiedBalance) {
            window.unifiedBalance.refreshLoginStatus();
            // Trigger balance display update
            setTimeout(() => window.updateBalanceDisplays(), 100);
        }
    }
});
