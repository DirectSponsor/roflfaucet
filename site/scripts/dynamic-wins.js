/**
 * Dynamic Win Display System
 * Updates win amounts based on current bet levels across all games
 */

class DynamicWinSystem {
    constructor() {
        this.currentBet = 1;
        this.lastWinMultiplier = 0;
        this.unifiedBalance = null;
        
        this.init();
    }
    
    init() {
        console.log('🎯 Initializing Dynamic Win System...');
        
        // Wait for other systems to load
        const initSystems = () => {
            if (window.unifiedBalance) {
                this.unifiedBalance = window.unifiedBalance;
                this.setupBetTracking();
                console.log('✅ Dynamic Win System initialized');
            } else {
                setTimeout(initSystems, 100);
            }
        };
        
        initSystems();
    }
    
    setupBetTracking() {
        // Track bet changes across all games
        this.trackBetChanges();
        
        // Update display when bet changes
        document.addEventListener('betChanged', (event) => {
            this.currentBet = event.detail.newBet;
            this.updateWinDisplays();
        });
        
        // Update display when level changes
        document.addEventListener('levelChanged', () => {
            this.updateWinDisplays();
        });
    }
    
    trackBetChanges() {
        // Monitor bet input changes across games
        const betElements = ['#betAmount', '#current-bet', '#bet-display'];
        
        betElements.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                // For input elements
                if (element.tagName === 'INPUT') {
                    element.addEventListener('input', (e) => {
                        this.currentBet = parseInt(e.target.value) || 1;
                        this.updateWinDisplays();
                    });
                }
                
                // For display elements, use MutationObserver
                const observer = new MutationObserver(() => {
                    const newBet = parseInt(element.textContent) || 1;
                    if (newBet !== this.currentBet) {
                        this.currentBet = newBet;
                        this.updateWinDisplays();
                    }
                });
                
                observer.observe(element, { 
                    childList: true, 
                    characterData: true, 
                    subtree: true 
                });
            }
        });
    }
    
    updateWinDisplays() {
        // Update different win displays based on game
        this.updateWheelWins();
        this.updateSlotsWins();
        // Dice game shows actual payout amounts already, so less critical
    }
    
    updateWheelWins() {
        const lastWinElement = document.getElementById('last-win');
        if (!lastWinElement) return;
        
        // Only update if it's currently showing a static multiplier
        const currentText = lastWinElement.textContent.trim();
        if (currentText === '0' || currentText.includes('x') || !isNaN(parseInt(currentText))) {
            // Show potential 3x win based on current bet
            const potentialWin = this.currentBet * 3; // Example: 3x multiplier
            lastWinElement.textContent = potentialWin;
        }
    }
    
    updateSlotsWins() {
        // Update slots payout table on the back
        this.updateSlotPayoutTable();
        
        // Update last win display
        const lastWinElement = document.getElementById('last-win');
        if (!lastWinElement) return;
        
        const currentText = lastWinElement.textContent.trim();
        if (currentText === '0') {
            // Show potential win
            const potentialWin = this.currentBet * 12; // Example: cherries 12x
            lastWinElement.textContent = potentialWin;
        }
    }
    
    updateSlotPayoutTable() {
        // Update the payout table on slots machine back
        const payoutCells = document.querySelectorAll('.prize-payout');
        
        payoutCells.forEach(cell => {
            const currentText = cell.textContent.trim();
            if (currentText.includes('x')) {
                const multiplier = parseInt(currentText.replace('x', ''));
                const actualWin = multiplier * this.currentBet;
                
                // Show both multiplier and actual amount
                cell.innerHTML = `${multiplier}x<br><small>(${actualWin} <span class="currency">coins</span>)</small>`;
            }
        });
    }
    
    // Method for games to report actual wins
    reportWin(multiplier, amount) {
        this.lastWinMultiplier = multiplier;
        
        // Update the appropriate win display
        const lastWinElement = document.getElementById('last-win');
        if (lastWinElement) {
            lastWinElement.textContent = amount;
        }
        
        // Update rollPayout for dice game
        const rollPayoutElement = document.getElementById('rollPayout');
        if (rollPayoutElement) {
            const currency = this.unifiedBalance?.isLoggedIn ? 'coins' : 'tokens';
            rollPayoutElement.textContent = `+${amount} ${currency}`;
        }
    }
    
    // Method to get current bet for games
    getCurrentBet() {
        return this.currentBet;
    }
}

// Create global instance
window.dynamicWinSystem = new DynamicWinSystem();

console.log('🎯 Dynamic Win System loaded!');
