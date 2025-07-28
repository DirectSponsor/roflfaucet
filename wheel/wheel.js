// Wheel of Wealth Game Logic
class WheelOfWealth {
    constructor() {
        this.currentBet = 1;
        this.maxBet = 10;
        this.minBet = 1;
        this.spinning = false;
        this.isFlipped = false;
        
        // Map outcome text to visual wheel positions (degrees)
        // 24 segments = 15° each (360/24 = 15)
        this.segmentPositions = {
            'LOSE': [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315], // Multiple LOSE segments
            'REFUND': [15], 
            '2X': [75, 195], 
            '3X': [105, 285],
            '4X': [165], 
            '5X': [255, 345],
            '6X': [330],
            '7X': [35],
            '8X': [125, 275],
            '20X': [185],
            '50X': [155] // Jackpot position
        };
        
        this.initializeGame();
    }
    
    initializeGame() {
        // Initialize balance display
        this.updateBalance();
        this.updateBetDisplay();
        this.updateLastWin(0);
        
        // Initialize faucet countdown
        if (typeof window.initializeFaucetCountdown === 'function') {
            window.initializeFaucetCountdown();
        }
        
        console.log('Wheel of Wealth initialized');
    }
    
    updateBalance() {
        const balance = window.UnifiedBalance ? window.UnifiedBalance.getBalance() : 100;
        document.getElementById('current-balance').textContent = Math.floor(balance);
    }
    
    updateBetDisplay() {
        document.getElementById('current-bet').textContent = this.currentBet;
    }
    
    updateLastWin(amount) {
        document.getElementById('last-win').textContent = Math.floor(amount);
    }
    
    updateStatus(message) {
        const statusElement = document.querySelector('.status-text');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }
    
    updateProgress(percentage) {
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }
    }
    
    increaseBet() {
        if (this.spinning) return;
        
        if (this.currentBet < this.maxBet) {
            this.currentBet++;
            this.updateBetDisplay();
        }
    }
    
    decreaseBet() {
        if (this.spinning) return;
        
        if (this.currentBet > this.minBet) {
            this.currentBet--;
            this.updateBetDisplay();
        }
    }
    
    canSpin() {
        const balance = window.UnifiedBalance ? window.UnifiedBalance.getBalance() : 100;
        return balance >= this.currentBet && !this.spinning;
    }
    
    async spinWheel() {
        if (!this.canSpin()) {
            this.updateStatus('Insufficient balance!');
            return;
        }
        
        // Prevent multiple spins
        this.spinning = true;
        const spinButton = document.getElementById('spin-btn');
        spinButton.disabled = true;
        
        // Deduct bet from balance
        if (window.UnifiedBalance) {
            window.UnifiedBalance.deductBalance(this.currentBet);
        }
        this.updateBalance();
        
        // Start spinning animation
        this.updateStatus('Spinning...');
        this.updateProgress(0);
        
        try {
            // Simulate progress during spin
            for (let i = 0; i <= 100; i += 2) {
                this.updateProgress(i);
                await new Promise(resolve => setTimeout(resolve, 30));
            }
            
            // Determine winning segment
            const result = await this.getSpinResult();
            
            // Calculate rotation angle
            const rotations = 3 + Math.random() * 2; // 3-5 full rotations
            const finalAngle = result.segment.angle + (rotations * 360);
            
            // Apply spinning animation
            await this.animateWheelSpin(finalAngle);
            
            // Process result
            await this.processSpinResult(result);
            
        } catch (error) {
            console.error('Spin error:', error);
            this.updateStatus('Spin failed!');
        } finally {
            // Re-enable spinning
            this.spinning = false;
            spinButton.disabled = false;
            this.updateProgress(0);
        }
    }
    
    async getSpinResult() {
        try {
            // Load outcomes from file
            const response = await fetch('wheel/outcomes.txt');
            const text = await response.text();
            const outcomes = text.trim().split('\n');
            
            // Simple random selection (like slots)
            const randomIndex = Math.floor(Math.random() * outcomes.length);
            const outcome = outcomes[randomIndex];
            
            console.log(`Selected outcome: ${outcome} (line ${randomIndex + 1} of ${outcomes.length})`);
            
            // Parse multiplier from outcome text
            const multiplier = this.parseMultiplier(outcome);
            
            // Get visual angle for this outcome
            const visualAngle = this.getVisualAngle(outcome);
            
            const winAmount = this.currentBet * multiplier;
            const isWin = multiplier > 0;
            
            return {
                segment: { name: outcome, multiplier: multiplier, angle: visualAngle },
                winAmount,
                isWin,
                multiplier
            };
            
        } catch (error) {
            console.error('Error loading outcomes:', error);
            // Fallback to LOSE
            return {
                segment: { name: 'LOSE', multiplier: 0, angle: 0 },
                winAmount: 0,
                isWin: false,
                multiplier: 0
            };
        }
    }
    
    parseMultiplier(outcome) {
        // Parse multiplier from outcome text
        if (outcome === 'LOSE') return 0;
        if (outcome === 'REFUND') return 1;
        
        // Extract number from text like "2X", "50X", etc.
        const match = outcome.match(/(\d+)X?/);
        return match ? parseInt(match[1]) : 0;
    }
    
    getVisualAngle(outcome) {
        // Get possible positions for this outcome
        const positions = this.segmentPositions[outcome];
        if (!positions || positions.length === 0) {
            console.warn(`No positions defined for outcome: ${outcome}`);
            return 0; // Default to 0 degrees
        }
        
        // Pick random position for this outcome type
        const randomPos = positions[Math.floor(Math.random() * positions.length)];
        console.log(`Outcome ${outcome} mapped to ${randomPos}°`);
        return randomPos;
    }
    
    async animateWheelSpin(finalAngle) {
        const wheelImage = document.getElementById('wheel-image');
        if (!wheelImage) return;
        
        // Set CSS custom property for final rotation
        wheelImage.style.setProperty('--final-rotation', finalAngle + 'deg');
        
        // Add spinning class to trigger animation
        wheelImage.classList.add('spinning');
        
        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Remove spinning class and set permanent rotation
        wheelImage.classList.remove('spinning');
        wheelImage.style.transform = `rotate(${finalAngle}deg)`;
    }
    
    async processSpinResult(result) {
        const { segment, winAmount, isWin, multiplier } = result;
        
        // Update last win display
        this.updateLastWin(winAmount);
        
        // Add result classes for visual feedback
        const wheelImage = document.getElementById('wheel-image');
        if (wheelImage) {
            // Remove previous result classes
            wheelImage.classList.remove('result-win', 'result-lose', 'result-jackpot');
            
            if (segment.name === 'JACKPOT') {
                wheelImage.classList.add('result-jackpot');
            } else if (isWin) {
                wheelImage.classList.add('result-win');
            } else {
                wheelImage.classList.add('result-lose');
            }
        }
        
        // Update status message
        if (segment.name === 'JACKPOT') {
            this.updateStatus('🎉 JACKPOT! 🎉');
        } else if (isWin) {
            this.updateStatus(`You won ${multiplier}x!`);
        } else {
            this.updateStatus('Try again!');
        }
        
        // Add winnings to balance
        if (isWin && window.UnifiedBalance) {
            window.UnifiedBalance.addBalance(winAmount);
        }
        
        // Update balance display
        this.updateBalance();
        
        // Clear result classes after delay
        setTimeout(() => {
            if (wheelImage) {
                wheelImage.classList.remove('result-win', 'result-lose', 'result-jackpot');
            }
            this.updateStatus('Ready to Spin!');
        }, 3000);
    }
    
    flipMachine() {
        if (this.spinning) return;
        
        const machine = document.getElementById('wheel-machine');
        if (machine) {
            machine.classList.toggle('flipped');
            this.isFlipped = !this.isFlipped;
        }
    }
}

// Global functions for button onclick handlers
function increaseBet() {
    if (window.wheelGame) {
        window.wheelGame.increaseBet();
    }
}

function decreaseBet() {
    if (window.wheelGame) {
        window.wheelGame.decreaseBet();
    }
}

function spinWheel() {
    if (window.wheelGame) {
        window.wheelGame.spinWheel();
    }
}

function flipMachine() {
    if (window.wheelGame) {
        window.wheelGame.flipMachine();
    }
}

function handleFaucetClaim() {
    if (typeof window.handleFaucetClaim === 'function') {
        window.handleFaucetClaim();
    } else {
        console.log('Faucet claim not available');
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        window.wheelGame = new WheelOfWealth();
    }, 100);
});

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WheelOfWealth;
}
