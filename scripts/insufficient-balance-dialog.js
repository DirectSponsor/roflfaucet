// Insufficient Balance Dialog - Minimal Version
// Simple alert-based insufficient balance notification

function showInsufficientBalanceDialog(requiredAmount, currentBalance) {
    const message = `Insufficient balance!\n\nRequired: ${requiredAmount} tokens\nCurrent: ${currentBalance} tokens\n\nClaim from the faucet to get more tokens.`;
    alert(message);
    
    console.log('💸 Insufficient balance:', {
        required: requiredAmount,
        current: currentBalance
    });
}

// Global function for compatibility
window.showInsufficientBalanceDialog = showInsufficientBalanceDialog;
