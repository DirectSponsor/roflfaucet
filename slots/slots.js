// =======================================
// CASINO SLOT MACHINE SPRITE ENGINE
// =======================================

class CasinoSlotMachine {
    constructor() {
        // Game State
        this.isSpinning = false;
        this.currentBet = 1;
        this.userLevel = 1;
        this.credits = 0;

        // Statistics
        this.totalSpins = 0;
        this.totalWagered = 0;
        this.totalWon = 0;

        // Initialize game components
        this.reels = [
            document.getElementById('reel-1'),
            document.getElementById('reel-2'),
            document.getElementById('reel-3'),
        ];
        
        // Each reel has 10 symbols (150px each = 1500px total)
        // Background position goes from 0 to -1500px
        this.totalSymbolsPerReel = 10;
        this.symbolHeight = 150;
        this.totalSpriteHeight = this.totalSymbolsPerReel * this.symbolHeight; // 1500px
        
        // Current background positions for each reel
        this.currentPositions = [0, 0, 0];

        // Define the actual symbol distribution in each reel (10 symbols total)
        // Each reel has different symbol order for variety
        this.reelSymbols = [
            // Reel 1: watermelon(3x), banana(2x), cherries(2x), seven(1x), bar(1x), bigwin(1x)
            ['watermelon', 'banana', 'cherries', 'watermelon', 'seven', 'banana', 'bar', 'cherries', 'bigwin', 'watermelon'],
            // Reel 2: banana(3x), cherries(2x), watermelon(2x), bar(1x), seven(1x), bigwin(1x)
            ['banana', 'cherries', 'watermelon', 'bar', 'banana', 'seven', 'cherries', 'watermelon', 'bigwin', 'banana'],
            // Reel 3: cherries(3x), watermelon(2x), banana(2x), bigwin(1x), seven(1x), bar(1x)
            ['cherries', 'watermelon', 'banana', 'cherries', 'bigwin', 'watermelon', 'seven', 'banana', 'bar', 'cherries']
        ];

        // Setup event listeners
        this.setupEventListeners();
        
        // Set initial positions for all reels to show 3 symbols
        this.initializeReelPositions();

        console.log('🎰 Casino Slot Machine with Sprite Background initialized!');
    }
    
    initializeReelPositions() {
        // Set initial positions for each reel to show the first 3 symbols
        this.reels.forEach((reel, index) => {
            // Show symbols 0, 1, 2 initially (symbol 1 in center)
            this.currentPositions[index] = 1; // Start with symbol 1 in center
            const prevSymbolIndex = 0; // Symbol 0 at top
            // Use exact pixels: each symbol is 150px tall
            const backgroundPositionY = -(prevSymbolIndex * this.symbolHeight); // 0px, -150px, -300px, etc.
            reel.style.backgroundPosition = `0 ${backgroundPositionY}px`;
            
            console.log(`Reel ${index + 1} initialized: showing symbols ${this.reelSymbols[index][0]} (top), ${this.reelSymbols[index][1]} (center), ${this.reelSymbols[index][2]} (bottom)`);
        });
    }

    setupEventListeners() {
        // Bind to the actual spin button in the HTML
        const spinButton = document.getElementById('spin-btn');
        if (spinButton) {
            spinButton.addEventListener('click', () => this.spinReels());
        }
    }

    spinReels() {
        if (this.isSpinning) return;
        this.isSpinning = true;
        console.log('Spinning...');
        
        // Start all reels spinning with CSS animation
        this.reels.forEach((reel, index) => {
            reel.classList.add('spinning');
        });

        // Stop reels sequentially like real slot machines
        this.stopReelsSequentially();
    }

    async stopReelsSequentially() {
        const delays = [2000, 2800, 3600]; // Staggered stopping like real slots
        const selectedSymbols = [];
        
        // Pre-calculate outcomes for all reels
        const outcomes = [];
        console.log('Symbols available:', this.symbolNames);
        console.log('Current positions before:', this.currentPositions);
        
        for (let i = 0; i < 3; i++) {
            const randomSteps = Math.floor(Math.random() * this.totalSymbolsPerReel);
            const oldPosition = this.currentPositions[i];
            this.currentPositions[i] = (this.currentPositions[i] + randomSteps) % this.totalSymbolsPerReel;
            const selectedSymbolName = this.reelSymbols[i][this.currentPositions[i]];
            
            console.log(`Reel ${i + 1}: random steps=${randomSteps}, old pos=${oldPosition}, new pos=${this.currentPositions[i]}, symbol=${selectedSymbolName}`);
            outcomes.push(selectedSymbolName);
        }
        
        // Stop each reel at different times
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.stopSingleReel(i, outcomes[i]);
                selectedSymbols.push(outcomes[i]);
                
                // If this is the last reel, finish up
                if (i === 2) {
                    setTimeout(() => {
                        this.isSpinning = false;
                        console.log(`Stopped on: ${selectedSymbols.join(', ')}`);
                        this.updateDisplay();
                    }, 600); // Wait for last reel animation
                }
            }, delays[i]);
        }
    }
    
    stopSingleReel(reelIndex, selectedSymbol) {
        const reel = this.reels[reelIndex];
        const symbolIndex = this.currentPositions[reelIndex];
        
        // Stop the spinning animation
        reel.classList.remove('spinning');
        
        // Force a reflow
        reel.offsetHeight;
        
        // Position the sprite to show 3 symbols in the window with the selected symbol in the center
        // The sprite is 1500px tall (10 symbols × 150px each)
        // The reel window is 450px tall (3 symbols × 150px each)
        // We need to position the sprite so that 3 consecutive symbols are visible
        // and the selected symbol is in the center position
        
        // Calculate which 3 symbols to show (previous, current, next)
        const prevSymbolIndex = (symbolIndex - 1 + this.totalSymbolsPerReel) % this.totalSymbolsPerReel;
        const nextSymbolIndex = (symbolIndex + 1) % this.totalSymbolsPerReel;
        
        // Position the sprite so the previous symbol is at the top of the window
        // This means the current symbol will be in the center, and next symbol at bottom
        // Use exact pixels: each symbol is 150px tall
        const backgroundPositionY = -(prevSymbolIndex * this.symbolHeight); // 0px, -150px, -300px, etc.
        reel.style.backgroundPosition = `0 ${backgroundPositionY}px`;
        
        console.log(`Reel ${reelIndex + 1} stopped on ${selectedSymbol} at position ${symbolIndex}`);
        console.log(`  Showing symbols: ${this.reelSymbols[reelIndex][prevSymbolIndex]} (top), ${selectedSymbol} (center), ${this.reelSymbols[reelIndex][nextSymbolIndex]} (bottom)`);
        console.log(`  Background position: 0 ${backgroundPositionY}px`);
    }

    updateDisplay() {
        // Update credits, wins, etc.
        console.log('Display Updated');
    }
}

// Global instance for onclick handlers
let slotMachine;

// Global functions for inline onclick handlers
function spinReels() {
    console.log('Global spinReels() function called!');
    if (slotMachine) {
        console.log('Calling slotMachine.spinReels()');
        slotMachine.spinReels();
    } else {
        console.error('slotMachine instance not found!');
    }
}

function toggleMachineView() {
    // Add this function if needed for the flip button
    console.log('Toggle machine view');
}

function decreaseBet() {
    if (slotMachine) {
        // Add bet decrease logic
        console.log('Decrease bet');
    }
}

function increaseBet() {
    if (slotMachine) {
        // Add bet increase logic
        console.log('Increase bet');
    }
}

function claimWinnings() {
    if (slotMachine) {
        // Add claim winnings logic
        console.log('Claim winnings');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    slotMachine = new CasinoSlotMachine();
});

