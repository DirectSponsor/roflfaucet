// Site Utilities
// General site-wide utility functions

// ====================================
// FAUCET COUNTDOWN BUTTON SYSTEM
// ====================================

// Central color configuration - change once, affects everything!
const FAUCET_COLORS = {
    primary: '#3CE74C',
    secondary: '#2DD93C',
    ready: 'linear-gradient(90deg, #3CE74C 0%, #2DD93C 50%, #3CE74C 100%)',
    progress: '#3CE74C',
    disabled: '#95a5a6'
};

// Cooldown functions - single source of truth for all buttons
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
    const buttons = ['faucet-countdown-btn', 'faucet-countdown-btn-back'];
    const totalCooldown = 5 * 60 * 1000; // 5 minutes in milliseconds
    const remaining = getRemainingCooldownTime();
    
    // Calculate progress percentage (how much time has passed)
    const elapsed = totalCooldown - remaining;
    const progressPercent = Math.max(0, Math.min(100, (elapsed / totalCooldown) * 100));
    
    // Update faucet countdown buttons (with .btn-text spans)
    buttons.forEach(buttonId => {
        const btn = document.getElementById(buttonId);
        if (!btn) return;
        
        const btnText = btn.querySelector('.btn-text');
        if (!btnText) return;
        
        if (remaining <= 0) {
            // Ready to claim
            btn.disabled = false;
            btn.classList.add('ready');
            btnText.textContent = 'Faucet: Ready';
            btn.style.background = FAUCET_COLORS.ready;
            
            // Clear interval if running
            if (faucetCountdownInterval) {
                clearInterval(faucetCountdownInterval);
                faucetCountdownInterval = null;
            }
        } else {
            // Still in cooldown
            btn.disabled = true;
            btn.classList.remove('ready');
            const seconds = Math.ceil(remaining / 1000);
            btnText.textContent = `Faucet: ${seconds}s`;
            
            // Update progress bar (green fill from left to right)
            btn.style.setProperty('--progress', `${progressPercent}%`);
            btn.style.background = `linear-gradient(to right, ${FAUCET_COLORS.progress} ${progressPercent}%, ${FAUCET_COLORS.disabled} ${progressPercent}%)`;
        }
    });
    
    // Update start claim button (direct text content, no .btn-text span)
    const startClaimBtn = document.getElementById('start-claim-btn');
    if (startClaimBtn) {
        if (remaining <= 0) {
            // Ready to claim
            startClaimBtn.disabled = false;
            startClaimBtn.classList.add('ready');
            startClaimBtn.textContent = '🎲 Start Claim Process';
            startClaimBtn.style.background = '';
            startClaimBtn.classList.remove('countdown');
        } else {
            // Still in cooldown
            startClaimBtn.disabled = true;
            startClaimBtn.classList.remove('ready');
            startClaimBtn.classList.add('countdown');
            const seconds = Math.ceil(remaining / 1000);
            startClaimBtn.textContent = `⏱️ ${seconds}s`;
            
            // Update progress bar (green fill from left to right)
            startClaimBtn.style.background = `linear-gradient(to right, ${FAUCET_COLORS.progress} ${progressPercent}%, ${FAUCET_COLORS.disabled} ${progressPercent}%)`;
        }
    }
    
    // Update faucet progress indicators (slim bars between reels and control panel)
    const progressIndicators = ['faucet-progress-indicator', 'faucet-progress-indicator-back'];
    const progressFills = ['faucet-progress-fill', 'faucet-progress-fill-back'];
    
    progressIndicators.forEach((indicatorId, index) => {
        const indicator = document.getElementById(indicatorId);
        const fill = document.getElementById(progressFills[index]);
        
        if (!indicator || !fill) return;
        
        if (remaining <= 0) {
            // Ready to claim - full green with glow animation
            fill.style.width = '100%';
            indicator.classList.add('ready');
        } else {
            // In cooldown - show progress
            fill.style.width = `${progressPercent}%`;
            indicator.classList.remove('ready');
        }
    });
    
    // Update slot machine progress bars (progress-fill elements)
    const slotProgressBars = ['progress-fill', 'progress-fill-back'];
    slotProgressBars.forEach(progressId => {
        const progressBar = document.getElementById(progressId);
        if (!progressBar) return;
        
        // Set dynamic colors using central configuration
        progressBar.style.background = FAUCET_COLORS.ready;
        
        if (remaining <= 0) {
            // Ready to claim - show full progress
            progressBar.style.width = '100%';
        } else {
            // In cooldown - show progress percentage
            progressBar.style.width = `${progressPercent}%`;
        }
    });
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

// Initialize countdown when page loads
document.addEventListener('DOMContentLoaded', function() {
    const faucetBtn = document.getElementById('faucet-countdown-btn');
    const startClaimBtn = document.getElementById('start-claim-btn');
    if (faucetBtn || startClaimBtn) {
        startFaucetCountdown();
    }
});

// ====================================
// MOBILE DETECTION SYSTEM
// ====================================

// Simple mobile detection function - avoids layout calculations on early load  
function isMobileDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
    const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
    const isTouchDevice = 'ontouchstart' in window;
    
    // Always use media query to avoid layout forcing completely
    const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
    
    return isMobileUA || (isTouchDevice && isSmallScreen);
}

// Mobile redirect removed - now using single responsive slots.html for all devices

// ====================================
// MOBILE MENU SYSTEM
// ====================================

// Mobile hamburger menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (menuBtn && mobileNav) {
        menuBtn.addEventListener('click', function() {
            // Toggle mobile nav overlay
            mobileNav.classList.toggle('active');
            // Toggle hamburger animation
            menuBtn.classList.toggle('open');
        });
        
        // Close mobile menu when clicking on navigation links
        const mobileNavLinks = mobileNav.querySelectorAll('.nav-link');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileNav.classList.remove('active');
                menuBtn.classList.remove('open');
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!menuBtn.contains(event.target) && !mobileNav.contains(event.target)) {
                mobileNav.classList.remove('active');
                menuBtn.classList.remove('open');
            }
        });
        
        console.log('📱 Mobile menu system initialized');
    }
});

// ====================================
// FUTURE UTILITY FUNCTIONS GO HERE
// ====================================

console.log('🔧 Site utilities ready!');
