// Faucet Bridge Script - Minimal Version
// Handles the faucet claim process

document.addEventListener('DOMContentLoaded', function() {
    console.log('🌉 Faucet Bridge: Starting initialization...');
    
    // Wait for unified balance system to be ready
    function waitForUnifiedBalance() {
        if (window.unifiedBalance) {
            initializeFaucetBridge();
        } else {
            setTimeout(waitForUnifiedBalance, 100);
        }
    }
    
    function initializeFaucetBridge() {
        console.log('🔍 Faucet Bridge: Guest mode initialized');
        
        // Update currency display
        if (window.unifiedBalance.updateCurrencyDisplay) {
            window.unifiedBalance.updateCurrencyDisplay();
        }
        
        // Set up claim button
        const finalClaimBtn = document.getElementById('final-claim-btn');
        if (finalClaimBtn) {
            finalClaimBtn.addEventListener('click', async function() {
                console.log('🚀 Faucet Bridge: Final claim button clicked!');
                
                // Check cooldown before processing claim
                if (!canClaim()) {
                    const remaining = getRemainingCooldownTime();
                    alert(`⏱️ Please wait ${Math.ceil(remaining / 60000)} more minute(s) before claiming again.`);
                    return;
                }
                
                // Process the claim
                console.log('💰 Faucet Bridge: Processing faucet claim...');
                await window.unifiedBalance.addBalance(20, 'faucet', 'Faucet claim reward');
                updateLastClaimTime();
                
                // Flush pending operations before redirecting (for logged-in users)
                if (window.unifiedBalance.isLoggedIn) {
                    console.log('⏳ Flushing balance before redirect...');
                    await window.unifiedBalance.flushPendingOps('faucet-claim');
                }
                
                // Redirect to result page
                window.location.href = 'faucet-result.html';
            });
        }
    }
    
    waitForUnifiedBalance();
});

function updateLastClaimTime() {
    const now = Date.now();
    localStorage.setItem('last_claim_time', now.toString());
    console.log('⏱️ Updated last claim time:', new Date(now).toLocaleTimeString());
    
    // Restart countdown if function exists
    if (typeof startFaucetCountdown === 'function') {
        startFaucetCountdown();
    }
}
