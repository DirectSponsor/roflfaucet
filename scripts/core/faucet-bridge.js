// Faucet Bridge Script
// Connects the multi-step faucet process with the JWT system

document.addEventListener('DOMContentLoaded', function() {
    console.log('🌉 Faucet Bridge: Starting initialization...');
    
    const isLoggedIn = localStorage.getItem('jwt_token') !== null;
    console.log('🔍 Faucet Bridge: Login status:', isLoggedIn ? 'logged in' : 'guest');
    
    // Initialize member/guest behavior (no visual theming, just currency and prompts)
    if (isLoggedIn) {
        console.log('📑 Member mode: Full features available');
    } else {
        console.log('📑 Guest mode: Limited features, prompts for member-only actions');
        initGuestPrompts();
    }

    // Currency terminology is now handled by the unified balance system
    // via currency classes (.currency, .currency-upper, .currency-full)

    // Balance is now handled by unified-balance.js

    // Reference to all steps
    const welcomeStep = document.getElementById('welcome-step');
    const faucetStep = document.getElementById('faucet-step');
    const resultStep = document.getElementById('result-step');

    // Initial visibility - disabled for multi-page system
    // showStep(welcomeStep);

    // Event listeners for navigation
    const startClaimBtn = document.getElementById('start-claim-btn');
    if (startClaimBtn) {
        startClaimBtn.addEventListener('click', () => {
            if (canClaim()) {
                showStep(faucetStep);
            } else {
                const remaining = getRemainingCooldownTime();
                alert(`⏱️ Please wait ${Math.ceil(remaining / 60000)} more minute(s) before claiming again.`);
            }
        });
    }

    const backToStartBtn = document.getElementById('back-to-start');
    if (backToStartBtn) {
        backToStartBtn.addEventListener('click', () => showStep(welcomeStep));
    }

    const finalClaimBtn = document.getElementById('final-claim-btn');
    console.log('🎯 Faucet Bridge: Final claim button found:', !!finalClaimBtn);
    if (finalClaimBtn) {
        finalClaimBtn.addEventListener('click', function() {
            console.log('🚀 Faucet Bridge: Final claim button clicked!');
            
            // Check cooldown again before processing claim
            if (!canClaim()) {
                const remaining = getRemainingCooldownTime();
                alert(`⏱️ Please wait ${Math.ceil(remaining / 60000)} more minute(s) before claiming again.`);
                return;
            }
            
            // Redirect to result page instead of showing step
            window.location.href = 'faucet-result.html';
            
    // Add tokens using unified balance system
            if (!isLoggedIn) {
                console.log('🎁 Faucet Bridge: Adding tokens for guest user...');
                addBalance(10, 'faucet_claim', 'Faucet claim reward');
                updateLastClaimTime();
                // Balance displays are automatically updated by unified-balance.js
            } else {
                console.log('💰 Faucet Bridge: Logged in user, skipping token addition');
            }
            
            if (window.jwtSimpleFaucet) {
                console.log('🔧 Faucet Bridge: Calling jwtSimpleFaucet.handleClaim()');
                window.jwtSimpleFaucet.handleClaim();
            }
        });
    }
});

// This function is no longer needed - using unified balance system

function showStep(stepElement) {
    document.querySelectorAll('.faucet-step').forEach(function(step) {
        step.style.display = 'none';
    });

    if (stepElement) {
        stepElement.style.display = 'block';
    }
}

// Cooldown functions are now in site-utils.js (global functions)

function updateLastClaimTime() {
    const now = Date.now();
    localStorage.setItem('last_claim_time', now.toString());
    console.log('⏱️ Updated last claim time:', new Date(now).toLocaleTimeString());
    
    // Restart countdown on all pages if function exists
    if (typeof startFaucetCountdown === 'function') {
        startFaucetCountdown();
    }
}

// Balance display functions removed - now handled by unified-balance.js

// Guest member-only feature prompts
function initGuestPrompts() {
    // Find all elements marked as member-only and add click handlers
    const memberOnlyElements = document.querySelectorAll('.member-only');
    memberOnlyElements.forEach(element => {
        const featureName = element.getAttribute('data-feature-name') || 'This feature';
        element.addEventListener('click', function(e) {
            e.preventDefault();
            showMemberPrompt(featureName);
        });
    });
    
    console.log('🔒 Guest prompts initialized for', memberOnlyElements.length, 'member-only elements');
}

function showMemberPrompt(featureName) {
    const prompt = document.createElement('div');
    prompt.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    
    prompt.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 400px; text-align: center; box-shadow: 0 8px 30px rgba(0,0,0,0.3);">
            <h3 style="margin-top: 0; color: #4A90E2;">🎯 Member Feature</h3>
            <p style="margin: 1rem 0; color: #2C3E50;">${featureName} requires a member account.</p>
            <p style="margin: 1rem 0; color: #7F8C8D; font-size: 0.9rem;">Members get real Useless Coins, progress tracking, and exclusive features!</p>
            <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem;">
                <button onclick="redirectToLogin()" style="background: #4A90E2; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: bold;">Sign Up / Login</button>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: transparent; color: #7F8C8D; border: 1px solid #E1E8ED; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;">Continue as Guest</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(prompt);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (prompt.parentElement) {
            prompt.remove();
        }
    }, 10000);
}

function redirectToLogin() {
    // Redirect to local login
    const loginUrl = '/auth/jwt-login.php';
    window.location.href = loginUrl;
}

