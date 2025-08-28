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

// Mobile navigation is now handled by CSS-only checkbox approach
// No JavaScript toggle function needed

// Setup click-based dropdowns
function setupDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const dropdownLink = dropdown.querySelector('a');
        
        if (dropdownLink) {
            // Prevent the main Games link from navigating on click
            dropdownLink.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Close all other dropdowns first
                dropdowns.forEach(d => {
                    if (d !== dropdown) {
                        d.classList.remove('open');
                    }
                });
                
                // Toggle this dropdown
                dropdown.classList.toggle('open');
            });
        }
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('open');
            });
        }
    });
}

// Login functionality
function showLoginDialog() {
    // Check if already logged in (has JWT token)
    const jwtToken = localStorage.getItem('jwt_token');
    
    if (jwtToken) {
        // Already logged in - show user menu or redirect to profile
        showUserMenu();
        return;
    }
    
    // Redirect to external auth server
    const currentUrl = window.location.href;
    const authUrl = `https://auth.directsponsor.org/jwt-login.php?redirect_uri=${encodeURIComponent(currentUrl)}`;
    window.location.href = authUrl;
}

function showUserMenu() {
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
    
    // Position relative to login button
    const loginBtn = document.getElementById('login-btn');
    const btnRect = loginBtn.getBoundingClientRect();
    
    menu.style.position = 'fixed';
    menu.style.top = (btnRect.bottom + window.scrollY) + 'px';
    menu.style.right = (window.innerWidth - btnRect.right) + 'px';
    
    document.body.appendChild(menu);
    
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

// Responsive header colspan adjustment
function updateHeaderColspan() {
    const headerCell = document.getElementById('header-cell');
    if (!headerCell) return;
    
    const width = window.innerWidth;
    
    // Match the CSS breakpoints from main.css
    if (width <= 600) {
        // Mobile: both sidebars hidden, only 1 column
        headerCell.setAttribute('colspan', '1');
    } else if (width <= 950) {
        // Tablet: right sidebar hidden, 2 columns (left + center)
        headerCell.setAttribute('colspan', '2');
    } else {
        // Desktop: all 3 columns visible
        headerCell.setAttribute('colspan', '3');
    }
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
        loginBtn.addEventListener('click', showLoginDialog);
        updateLoginButton();
    }
    
    // Also update login button on any guest login buttons (like in profile page)
    const guestLoginBtn = document.getElementById('login-btn-guest');
    if (guestLoginBtn) {
        guestLoginBtn.addEventListener('click', showLoginDialog);
    }
    
    // Set up responsive header colspan
    updateHeaderColspan();
    window.addEventListener('resize', updateHeaderColspan);
    
    // Mobile menu is now CSS-only (checkbox based) - no JavaScript needed
    
    // Set up click-based dropdowns
    setupDropdowns();
    
    // If we processed a token, refresh login status and balance
    if (tokenProcessed) {
        console.log('🔄 Token processed, refreshing login status...');
        updateLoginButton();
        
        // Refresh the unified balance system to recognize the new login
        if (window.unifiedBalance) {
            window.unifiedBalance.refreshLoginStatus();
            // Trigger balance display update
            setTimeout(() => window.updateBalanceDisplays(), 100);
        }
    }
});
