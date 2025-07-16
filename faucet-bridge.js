// Faucet Bridge Script
// Connects the multi-step faucet process with the JWT system

document.addEventListener('DOMContentLoaded', function() {
    console.log('🌉 Faucet Bridge: Starting initialization...');
    
    const isLoggedIn = localStorage.getItem('jwt_token') !== null;
    console.log('🔍 Faucet Bridge: Login status:', isLoggedIn ? 'logged in' : 'guest');

    // Adjust terminology based on login status
    const claimTypeElements = document.querySelectorAll('#claim-type, #claim-btn-type, #won-type');
    console.log('🏷️ Faucet Bridge: Found', claimTypeElements.length, 'terminology elements');
    claimTypeElements.forEach(el => {
        el.textContent = isLoggedIn ? 'Coins' : 'Tokens';
    });

    // Update balance label terminology
    const balanceLabel = document.getElementById('balance-label');
    if (balanceLabel) {
        balanceLabel.textContent = isLoggedIn ? 'UselessCoins' : 'Tokens';
    }

    // Load and display current balance
    loadAndDisplayBalance();

    // Reference to all steps
    const welcomeStep = document.getElementById('welcome-step');
    const faucetStep = document.getElementById('faucet-step');
    const resultStep = document.getElementById('result-step');

    // Initial visibility
    showStep(welcomeStep);

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
            
            showStep(resultStep);
            
    // Add tokens using unified balance system
            if (!isLoggedIn) {
                console.log('🎁 Faucet Bridge: Adding tokens for guest user...');
                addBalance(10, 'faucet_claim', 'Faucet claim reward');
                updateLastClaimTime();
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

// Cooldown and balance management functions
function canClaim() {
    const lastClaim = localStorage.getItem('last_claim_time');
    if (!lastClaim) return true;
    
    const now = Date.now();
    const cooldownTime = 5 * 60 * 1000; // 5 minutes
    const timeSinceLastClaim = now - parseInt(lastClaim);
    
    console.log('⏱️ Cooldown check:', {
        lastClaim: new Date(parseInt(lastClaim)).toLocaleTimeString(),
        now: new Date(now).toLocaleTimeString(),
        timeSinceLastClaim: Math.floor(timeSinceLastClaim / 1000) + ' seconds',
        cooldownTime: cooldownTime / 1000 + ' seconds',
        canClaim: timeSinceLastClaim >= cooldownTime
    });
    
    return timeSinceLastClaim >= cooldownTime;
}

function getRemainingCooldownTime() {
    const lastClaim = localStorage.getItem('last_claim_time');
    if (!lastClaim) return 0;
    
    const now = Date.now();
    const cooldownTime = 5 * 60 * 1000; // 5 minutes
    const timeSinceLastClaim = now - parseInt(lastClaim);
    
    return Math.max(0, cooldownTime - timeSinceLastClaim);
}

function updateLastClaimTime() {
    const now = Date.now();
    localStorage.setItem('last_claim_time', now.toString());
    console.log('⏱️ Updated last claim time:', new Date(now).toLocaleTimeString());
}

async function loadAndDisplayBalance() {
    // Use unified balance system
    const balance = await getBalance();
    updateBalanceDisplay(balance);
    console.log('💰 Loaded unified balance:', balance);
}

function updateBalanceDisplay(balance) {
    const balanceElement = document.getElementById('balance');
    if (balanceElement) {
        balanceElement.textContent = balance;
        console.log('📊 Updated balance display:', balance);
    } else {
        console.warn('⚠️ Balance element not found');
    }
}

