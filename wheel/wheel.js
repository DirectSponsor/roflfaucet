/*
OUTCOMES_START - Total: 100
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
LOSE
2X
2X
2X
2X
2X
3X
3X
3X
4X
4X
5X
5X
5X
6X
REFUND
20X
50X
OUTCOMES_END
*/

// Wheel of Wealth Game Logic
class WheelOfWealth {
    constructor() {
        this.currentBet = 1;
        this.maxBet = 10;
        this.minBet = 1;
        this.spinning = false;
        this.isFlipped = false;
        
        // Map outcome text to visual wheel positions (degrees)
        // 24 segments = 15° each, starting from arrow at 9 o'clock (270°)
        // Based on wheel.txt: 0=2X, 1=LOSE, 2=50X, 3=4X, 4=3X, 5=LOSE, 6=REFUND, etc.
        this.segmentPositions = {
            '2X': [270, 360, 45, 225, 315], // positions 0, 7, 15, 18, 21
            'LOSE': [285, 75, 135, 285, 345], // positions 1, 5, 9, 12, 19
            '50X': [300], // position 2 - Jackpot
            '4X': [315, 345], // positions 3, 17, 23
            '3X': [330, 150, 240], // positions 4, 10, 16, 20
            'REFUND': [105], // position 6
            '5X': [120, 195, 330], // positions 8, 13, 22
            '20X': [165], // position 11
            '6X': [210], // position 14
        };
        
        this.initializeGame();
    }
    
    initializeGame() {
        // Initialize balance display (async call for balance not needed)
        this.updateBalance();
        this.updateBetDisplay();
        this.updateLastWin(0);
        
        // Initialize faucet countdown
        if (typeof window.initializeFaucetCountdown === 'function') {
            window.initializeFaucetCountdown();
        }
        
        console.log('Wheel of Wealth initialized');
    }
    
    async updateBalance() {
        const balance = window.unifiedBalance ? await window.unifiedBalance.getBalance() : 100;
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
    
    async canSpin() {
        const balance = window.unifiedBalance ? await window.unifiedBalance.getBalance() : 100;
        return balance >= this.currentBet && !this.spinning;
    }
    
    async spinWheel() {
        if (!(await this.canSpin())) {
            this.updateStatus('Insufficient balance!');
            return;
        }
        
        // Prevent multiple spins
        this.spinning = true;
        const spinButton = document.getElementById('spin-btn');
        spinButton.disabled = true;
        
        // Deduct bet from balance
        if (window.unifiedBalance) {
            const result = await window.unifiedBalance.subtractBalance(this.currentBet, 'wheel_bet', `Wheel of Wealth bet: ${this.currentBet}`);
            if (!result.success) {
                this.updateStatus('Insufficient balance!');
                this.spinning = false;
                spinButton.disabled = false;
                return;
            }
        }
        await this.updateBalance();
        
        // Start spinning animation
        this.updateStatus('Spinning...');
        this.updateProgress(0);
        
        try {
            // Determine winning segment
            const result = this.getSpinResult();
            
            // Calculate rotation angle
            const rotations = 3 + Math.random() * 2; // 3-5 full rotations
            const finalAngle = result.segment.angle + (rotations * 360);
            
            // Apply spinning animation (don't wait)
            this.animateWheelSpin(finalAngle);
            
            // Process result immediately
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
    
    getSpinResult() {
        // Get embedded outcomes from comment at top of this file
        const scriptSource = this.constructor.toString();
        const startMarker = 'OUTCOMES_START - Total: ';
        const endMarker = 'OUTCOMES_END';
        
        const startIndex = scriptSource.indexOf(startMarker);
        const endIndex = scriptSource.indexOf(endMarker);
        
        if (startIndex === -1 || endIndex === -1) {
            console.warn('Could not find outcomes in script, falling back to LOSE');
            return {
                segment: { name: 'LOSE', multiplier: 0, angle: 0 },
                winAmount: 0,
                isWin: false,
                multiplier: 0
            };
        }
        
        // Extract total count and outcomes
        const headerLine = scriptSource.substring(startIndex, scriptSource.indexOf('\n', startIndex));
        const totalMatch = headerLine.match(/Total: (\d+)/);
        const totalOutcomes = totalMatch ? parseInt(totalMatch[1]) : 100;
        
        const outcomesSection = scriptSource.substring(
            scriptSource.indexOf('\n', startIndex) + 1, 
            endIndex
        );
        const outcomeLines = outcomesSection.trim().split('\n');
        
        // Simple random selection - pick random line
        const randomIndex = Math.floor(Math.random() * totalOutcomes);
        const outcome = outcomeLines[randomIndex] || 'LOSE';
        
        console.log(`Selected outcome: ${outcome} (line ${randomIndex + 1} of ${totalOutcomes})`);
        
        // Parse multiplier and get visual angle
        const multiplier = this.parseMultiplier(outcome);
        const visualAngle = this.getVisualAngle(outcome);
        const winAmount = this.currentBet * multiplier;
        const isWin = multiplier > 0;
        
        return {
            segment: { name: outcome, multiplier: multiplier, angle: visualAngle },
            winAmount,
            isWin,
            multiplier
        };
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
    
    animateWheelSpin(finalAngle) {
        const wheelImage = document.getElementById('wheel-image');
        if (!wheelImage) return;
        
        // Reset to 0 and then spin to final angle for consistent animation
        wheelImage.style.transition = 'none';
        wheelImage.style.transform = 'rotate(0deg)';
        
        // Force reflow then apply smooth transition
        wheelImage.offsetHeight;
        wheelImage.style.transition = 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
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
        if (isWin && window.unifiedBalance) {
            await window.unifiedBalance.addBalance(winAmount, 'wheel_win', `Wheel of Wealth win: ${segment.name} = ${winAmount} coins`);
        }
        
        // Update balance display
        await this.updateBalance();
        
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
