// Site Utilities
// General site-wide utility functions

// ====================================
// FAUCET COUNTDOWN BUTTON SYSTEM
// ====================================

// Use existing cooldown functions from faucet-bridge.js
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
            btn.style.background = '#27ae60';
            
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
            
            // Calculate progress percentage (how much time has passed)
            const elapsed = totalCooldown - remaining;
            const progressPercent = (elapsed / totalCooldown) * 100;
            
            // Update progress bar (green fill from left to right)
            btn.style.setProperty('--progress', `${progressPercent}%`);
            btn.style.background = `linear-gradient(to right, #27ae60 ${progressPercent}%, #95a5a6 ${progressPercent}%)`;
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
    
    // Redirect to faucet page
    window.location.href = 'index.html';
}

// Initialize countdown when page loads
document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('faucet-countdown-btn');
    if (btn) {
        startFaucetCountdown();
    }
});

// ====================================
// FUTURE UTILITY FUNCTIONS GO HERE
// ====================================

console.log('🔧 Site utilities ready!');
