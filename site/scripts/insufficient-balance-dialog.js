// Insufficient Balance Dialog - Minimal Version
// Simple alert-based insufficient balance notification

function showInsufficientBalanceDialog(requiredAmount, currentBalance) {
    // Get the current currency from the unified balance system
    const currency = (window.UnifiedBalanceSystem && new UnifiedBalanceSystem().isLoggedIn) ? 'coins' : 'tokens';
    const message = `Insufficient balance!\n\nRequired: ${requiredAmount} ${currency}\nCurrent: ${currentBalance} ${currency}\n\nClaim from the faucet to get more ${currency}.`;
    alert(message);
    
    console.log('💸 Insufficient balance:', {
        required: requiredAmount,
        current: currentBalance
    });
}

// Global function for compatibility
window.showInsufficientBalanceDialog = showInsufficientBalanceDialog;
