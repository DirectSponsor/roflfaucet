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
        this.currentPositions = [0, 0, 0];

// Virtual reel list to match our sprite sequence
        this.virtualReelList = [
            'watermelon', 'banana', 'cherries', 'seven', 'bar', 'bigwin',
            'watermelon', 'banana', 'cherries', 'seven'
        ];

        // Setup event listeners
        this.setupEventListeners();

        console.log('🎰 Casino Slot Machine with Sprite initialized!');
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
        
        // Start all reels spinning at different speeds
        this.reels.forEach((reel, index) => {
            const durations = ['0.5s', '0.7s', '0.9s']; // Different speeds for independence
            reel.style.animation = `spinReelVertical ${durations[index]} linear infinite`;
        });

        // Stop reels sequentially like real slot machines
        this.stopReelsSequentially();
    }

    async stopReelsSequentially() {
        const delays = [2000, 2800, 3600]; // Staggered stopping like real slots
        const selectedSymbols = [];
        
        // Pre-calculate outcomes for all reels
        const outcomes = [];
        for (let i = 0; i < 3; i++) {
            const randomSteps = Math.floor(Math.random() * this.virtualReelList.length);
            this.currentPositions[i] = (this.currentPositions[i] + randomSteps) % this.virtualReelList.length;
            const selectedSymbol = this.virtualReelList[this.currentPositions[i]];
            outcomes.push(selectedSymbol);
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
        const offset = this.virtualReelList.indexOf(selectedSymbol) * 150;
        
        // Immediately stop the animation and clear all styles
        reel.style.animation = 'none';
        reel.style.transition = '';
        
        // Set the final position directly
        reel.style.backgroundPosition = `center -${offset}px`;
        
        console.log(`Reel ${reelIndex + 1} stopped on ${selectedSymbol}`);
    }

    updateDisplay() {
        // Update credits, wins, etc.
        console.log('Display Updated');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CasinoSlotMachine();
});

