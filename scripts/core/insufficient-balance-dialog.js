// Insufficient Balance Dialog - Reusable across all games
// Provides consistent UX for handling insufficient balance scenarios

function showInsufficientBalanceDialog(gameName = 'game') {
    const promptText = `🎰 Out of tokens!\n\n` +
                      `💡 Claim free tokens from the faucet to keep playing!\n\n` +
                      `Click OK to go to the faucet page.`;
    
    if (confirm(promptText)) {
        // Navigate parent window if in iframe, otherwise navigate normally
        if (window.parent !== window) {
            window.parent.postMessage({type: 'navigate', url: 'index.html'}, '*');
        } else {
            window.location.href = 'index.html';
        }
    }
}

console.log('💰 Insufficient balance dialog ready!');
