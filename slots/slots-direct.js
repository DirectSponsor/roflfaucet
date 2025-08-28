// Direct Slots JavaScript - No iframe implementation

// Initialize unified balance system
let balanceSystem;

// Initialize balance system when DOM loads
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Initialize the unified balance system
        balanceSystem = new UnifiedBalanceSystem();
        
        // Load initial balance and update display
        const initialBalance = await balanceSystem.getBalance();
        console.log('🎰 Initial balance loaded:', initialBalance);
        
        // Update balance display
        const balanceEl = document.getElementById('current-balance');
        const balanceBackEl = document.getElementById('current-balance-back');
        if (balanceEl) balanceEl.textContent = initialBalance;
        if (balanceBackEl) balanceBackEl.textContent = initialBalance;
        
    } catch (error) {
        console.error('💥 Failed to initialize balance system:', error);
        // Fallback to simple guest mode if unified system fails
        balanceSystem = {
            balance: 100,
            async getBalance() { return this.balance; },
            async addBalance(amount, source, description) {
                this.balance += amount;
                return { success: true, balance: this.balance };
            },
            async subtractBalance(amount, source, description) {
                if (this.balance >= amount) {
                    this.balance -= amount;
                    return { success: true, balance: this.balance };
                }
                return { success: false, error: 'Insufficient balance', balance: this.balance };
            }
        };
    }
});

// Global functions that the slots system expects
async function getBalance() {
    if (!balanceSystem) return 100; // Default fallback
    return await balanceSystem.getBalance();
}

async function addBalance(amount, source, description) {
    if (!balanceSystem) return { success: true, balance: 100 };
    return await balanceSystem.addBalance(amount, source, description);
}

async function subtractBalance(amount, source, description) {
    if (!balanceSystem) return { success: false, error: 'System not ready' };
    return await balanceSystem.subtractBalance(amount, source, description);
}

// Override the calculateResponsiveDimensions function for direct implementation
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎰 DOM loaded, attempting to setup direct slots...');
    
    // Wait for slot machine to be created
    setTimeout(() => {
        console.log('🎰 Checking for slotMachine instance:', !!window.slotMachine);
        if (window.slotMachine) {
            console.log('🎰 Overriding calculateResponsiveDimensions function for direct implementation!');
            // Replace the complex responsive logic with enhanced flexible logic
            window.slotMachine.calculateResponsiveDimensions = function() {
                console.log('🎰 DIRECT PAGE CALCULATION RUNNING!');
                const mainContent = document.querySelector('.main-content');
                const slotDirect = document.querySelector('.slot-direct');
                
                if (!mainContent || !slotDirect) {
                    console.warn('🎰 Could not find main content or slot-direct container');
                    return;
                }
                
                // Get available width from main content area
                const mainContentWidth = mainContent.offsetWidth;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                console.log('🎰 Available dimensions:', {
                    mainContentWidth,
                    viewportWidth,
                    viewportHeight
                });
                
                // Use main content width but with reasonable limits
                let containerWidth = mainContentWidth - 40; // 20px margin each side
                
                // Set maximum and minimum widths
                const maxWidth = 700;
                const minWidth = 280;
                
                containerWidth = Math.min(maxWidth, Math.max(minWidth, containerWidth));
                
                // Simple fixed gaps and padding
                const gap = 15;
                const padding = 15;
                
                // Calculate available width for reels
                const usedSpace = (2 * gap) + (3 * 4) + (2 * padding); // gaps + borders + padding
                const availableWidth = containerWidth - usedSpace;
                
                // Calculate reel width - simple division
                let reelWidth = Math.floor(availableWidth / 3);
                
                // Set reasonable bounds
                reelWidth = Math.max(60, Math.min(120, reelWidth));
                
                // Maintain 3:1 aspect ratio (3 symbols high)
                const reelHeight = reelWidth * 3;
                
                // Calculate sprite height (10 symbols × symbol height)
                const spriteHeight = reelWidth * 10;
                
                // Calculate position height (sprite height / 20 positions)
                const positionHeight = spriteHeight / 20;
                
                // Calculate scale factor for other elements (based on reel width)
                const scaleFactor = reelWidth / 120; // 120px is full size
                
                // Scale control panel elements
                const controlFontSize = Math.max(0.8, 1.4 * scaleFactor);
                const controlLabelSize = Math.max(0.6, 0.8 * scaleFactor);
                const controlHeight = Math.max(60, 80 * scaleFactor);
                const buttonHeight = Math.max(45, 56 * scaleFactor);
                const buttonWidth = Math.max(70, 80 * scaleFactor);
                
                // Update CSS custom properties
                const root = document.documentElement;
                root.style.setProperty('--reel-width', `${reelWidth}px`);
                root.style.setProperty('--reel-height', `${reelHeight}px`);
                root.style.setProperty('--sprite-height', `${spriteHeight}px`);
                root.style.setProperty('--reel-gap', `${gap}px`);
                root.style.setProperty('--container-padding', `${padding}px`);
                
                // Add scaling properties for other elements
                root.style.setProperty('--control-font-size', `${controlFontSize}rem`);
                root.style.setProperty('--control-label-size', `${controlLabelSize}rem`);
                root.style.setProperty('--control-height', `${controlHeight}px`);
                root.style.setProperty('--button-height', `${buttonHeight}px`);
                root.style.setProperty('--button-width', `${buttonWidth}px`);
                root.style.setProperty('--scale-factor', scaleFactor);
                
                // Update instance variables for positioning calculations
                this.reelWidth = reelWidth;
                this.symbolHeight = reelWidth; // Each symbol is square
                this.reelHeight = reelHeight;
                this.totalSpriteHeight = spriteHeight;
                this.totalPositions = 20;
                this.positionHeight = positionHeight;
                
                console.log(`🎰 Direct page responsive dimensions:`, {
                    mainContentWidth,
                    containerWidth,
                    reelWidth,
                    reelHeight,
                    scaleFactor
                });
            };
            
            // Trigger initial calculation
            window.slotMachine.updateSpriteDimensions();
            
            // Add resize event handling
            let resizeTimeout;
            window.addEventListener('resize', () => {
                console.log('🎰 RESIZE EVENT FIRED! Window size:', window.innerWidth, 'x', window.innerHeight);
                
                // Debounce resize events
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    console.log('🎰 Triggering recalculation after resize...');
                    window.slotMachine.updateSpriteDimensions();
                }, 100);
            });
            
            console.log('🎰 Direct slots setup complete. Current window size:', window.innerWidth, 'x', window.innerHeight);
        }
    }, 100);
});

// Faucet claim handler for direct page
function handleFaucetClaim() {
    // Check if faucet is ready using site-utils function if available
    if (typeof canClaim === 'function' && !canClaim()) {
        alert('Faucet is not ready yet!');
        return;
    }
    
    // Navigate to faucet page
    window.location.href = 'index.html';
}

// Flip machine function
function flipMachine() {
    const machine = document.getElementById('slot-machine');
    machine.classList.toggle('flipped');
    
    // Sync the back panel with front panel values
    setTimeout(() => {
        syncBackPanelValues();
    }, 400); // Half way through the flip animation
}

// Sync back panel values with front panel
function syncBackPanelValues() {
    const frontWin = document.getElementById('last-win');
    const frontBalance = document.getElementById('current-balance');
    const frontBet = document.getElementById('current-bet');
    
    const backWin = document.getElementById('last-win-back');
    const backBalance = document.getElementById('current-balance-back');
    const backBet = document.getElementById('current-bet-back');
    
    if (frontWin && backWin) backWin.textContent = frontWin.textContent;
    if (frontBalance && backBalance) backBalance.textContent = frontBalance.textContent;
    if (frontBet && backBet) backBet.textContent = frontBet.textContent;
    
    // Sync progress bars
    const frontProgress = document.getElementById('progress-fill');
    const backProgress = document.getElementById('progress-fill-back');
    if (frontProgress && backProgress) {
        backProgress.style.width = frontProgress.style.width;
    }
    
    // Sync faucet buttons
    const frontFaucet = document.getElementById('faucet-countdown-btn');
    const backFaucet = document.getElementById('faucet-countdown-btn-back');
    if (frontFaucet && backFaucet) {
        backFaucet.disabled = frontFaucet.disabled;
        const frontText = frontFaucet.querySelector('.btn-text');
        const backText = backFaucet.querySelector('.btn-text');
        if (frontText && backText) {
            backText.textContent = frontText.textContent;
        }
    }
}
