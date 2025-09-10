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

// Simple login handler - dynamically builds redirect URL
function handleLogin() {
    // Get current page URL dynamically (works for staging, production, any domain)
    const currentUrl = window.location.origin + window.location.pathname;
    
    // Build auth URL with dynamic redirect
    const authUrl = `https://auth.directsponsor.org/jwt-login.php?redirect_uri=${encodeURIComponent(currentUrl)}`;
    
    console.log('🚀 Redirecting to login:', authUrl);
    
    // Go to auth server
    window.location.href = authUrl;
}

// Helper function to get valid (non-expired) username
function getValidUsername() {
    try {
        // Check the main session data first
        const sessionData = localStorage.getItem('roflfaucet_session');
        if (sessionData) {
            const data = JSON.parse(sessionData);
            // Check if session has expired
            if (data.expires && Date.now() > data.expires) {
                console.log('🔐 Session expired, logging out automatically');
                handleLogout();
                return null;
            }
            return data.username;
        }
        
        // Fallback to individual username item
        return localStorage.getItem('username');
    } catch (error) {
        console.error('Error checking login status:', error);
        return localStorage.getItem('username'); // Fallback
    }
}

// Helper function to get valid user ID
function getValidUserId() {
    try {
        const sessionData = localStorage.getItem('roflfaucet_session');
        if (sessionData) {
            const data = JSON.parse(sessionData);
            if (data.expires && Date.now() > data.expires) {
                return null; // Expired
            }
            return data.user_id;
        }
        return localStorage.getItem('user_id');
    } catch (error) {
        return localStorage.getItem('user_id');
    }
}

// Simple logout handler - clears session and refreshes page
function handleLogout() {
    console.log('🚪 Logging out...');
    
    // Clear all login storage
    localStorage.removeItem('roflfaucet_session');
    localStorage.removeItem('username');
    localStorage.removeItem('user_id');
    localStorage.removeItem('login_time');
    
    // Refresh the unified balance system
    if (window.unifiedBalance) {
        window.unifiedBalance.refreshLoginStatus();
    }
    
    // Update the UI
    updateLoginButtons();
    
    // Update balance and currency displays
    setTimeout(() => {
        if (window.updateBalanceDisplays) window.updateBalanceDisplays();
        if (window.updateCurrencyDisplays) window.updateCurrencyDisplays();
    }, 100);
    
    console.log('✅ Logged out successfully');
}

// Simple login state management - just handle member elements and username display
function updateLoginButtons() {
    const username = getValidUsername();
    const isLoggedIn = !!username;
    
    // Hide/show guest-only elements (this was already working)
    const guestOnlyElements = document.querySelectorAll('.guest-only');
    guestOnlyElements.forEach(element => {
        element.style.display = isLoggedIn ? 'none' : '';
    });
    
    // Show/hide member-only elements (new)
    const memberOnlyElements = document.querySelectorAll('.member-only');
    memberOnlyElements.forEach(element => {
        element.style.display = isLoggedIn ? '' : 'none';
    });
    
    // Update username in dropdown button
    const userMenuButton = document.getElementById('user-menu-button');
    if (userMenuButton && isLoggedIn) {
        userMenuButton.textContent = `👤 ${username}`;
    }
    
    console.log(`👁️ Login state: ${isLoggedIn ? `Logged in as ${username}` : 'Guest'}`);
}

// One-time JWT processing - extract username then discard token
function processJwtFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const jwtParam = urlParams.get('jwt');
    
    if (jwtParam) {
        console.log('🔑 Processing login token...');
        
        try {
            // Extract username from JWT token
            const payload = JSON.parse(atob(jwtParam.split('.')[1]));
            
            // DEBUG: Log the full JWT payload to see what data we have
            console.log('🔍 Full JWT Payload:', JSON.stringify(payload, null, 2));
            console.log('🔍 Email from JWT:', payload.email || 'NOT IN JWT');
            
            const username = payload.username || payload.sub || 'User';
            const userId = payload.sub || 'unknown';
            
            // Store login data in localStorage with expiration for cross-tab compatibility
            const loginData = {
                username: username,
                user_id: userId,
                login_time: Date.now(),
                expires: Date.now() + (30 * 60 * 60 * 1000) // Expire after 30 hours
            };
            localStorage.setItem('roflfaucet_session', JSON.stringify(loginData));
            
            // Also set individual items for backward compatibility
            localStorage.setItem('username', username);
            localStorage.setItem('user_id', userId);
            localStorage.setItem('login_time', Date.now().toString());
            
            console.log(`✅ Logged in as: ${username}`);
            
            // CRITICAL: Ensure user files exist (balance and profile)
            ensureUserFilesExist(userId, username, payload.email || '');
            
            // Clean up the URL by removing JWT parameters
            const cleanUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, document.title, cleanUrl);
            
            // Update UI to show logged in state
            updateLoginButtons();
            
            // Refresh the unified balance system to detect new login status
            if (window.unifiedBalance) {
                window.unifiedBalance.refreshLoginStatus();
                // Update displays immediately
                setTimeout(() => {
                    if (window.updateBalanceDisplays) window.updateBalanceDisplays();
                    if (window.updateCurrencyDisplays) window.updateCurrencyDisplays();
                }, 100);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Failed to process login token:', error);
        }
    }
    
    return false;
}

// Initialize countdown when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Process any JWT token from login redirect
    processJwtFromUrl();
    
    // Update login buttons based on current login state
    updateLoginButtons();
    
    const faucetBtn = document.getElementById('faucet-countdown-btn');
    if (faucetBtn) {
        startFaucetCountdown();
    }
});

/**
 * Ensure user files exist when logging in
 * This fixes the issue where users lose their level/profile data
 * @param {string} userId - User ID from JWT
 * @param {string} username - Username from JWT
 * @param {string} email - Email from JWT
 */
async function ensureUserFilesExist(userId, username, email) {
    console.log(`📁 Ensuring user files exist for ${username} (ID: ${userId})`);
    
    try {
        // Call a simple API to create/ensure both balance and profile files exist
        const response = await fetch('api/ensure-user-files.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                username: username,
                email: email
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                console.log(`✅ User files ensured:`, result.message);
                if (result.created_files && result.created_files.length > 0) {
                    console.log(`🎉 Created new files: ${result.created_files.join(', ')}`);
                }
            } else {
                console.error('❌ Failed to ensure user files:', result.error);
            }
        } else {
            console.error('❌ API call failed:', response.status);
        }
    } catch (error) {
        console.error('🚑 Error ensuring user files:', error);
        // Don't block login if file creation fails
    }
}
