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

// Simple Wheel of Wealth - Fresh Start
class WheelOfWealth {
    constructor() {
        this.currentBet = 1;
        this.maxBet = 10;
        this.minBet = 1;
        this.spinning = false;
        
        // Track two separate positions:
        // 1. CSS animation position (can be any large number for smooth animation)
        this.totalRotation = 0;
        // 2. Logical wheel position (0-359 for game calculations)
        this.logicalPosition = 0;
        
        // 24 segments, 15 degrees each
        // Arrow points at 270 degrees (9 o'clock position)
        this.wheelSegments = [
            { pos: 0, angle: 270, outcome: '2X' },
            { pos: 1, angle: 285, outcome: 'LOSE' },
            { pos: 2, angle: 300, outcome: '50X' },
            { pos: 3, angle: 315, outcome: '4X' },
            { pos: 4, angle: 330, outcome: '3X' },
            { pos: 5, angle: 345, outcome: 'LOSE' },
            { pos: 6, angle: 0, outcome: 'REFUND' },
            { pos: 7, angle: 15, outcome: '2X' },
            { pos: 8, angle: 30, outcome: '5X' },
            { pos: 9, angle: 45, outcome: 'LOSE' },
            { pos: 10, angle: 60, outcome: '3X' },
            { pos: 11, angle: 75, outcome: '20X' },
            { pos: 12, angle: 90, outcome: 'LOSE' },
            { pos: 13, angle: 105, outcome: '5X' },
            { pos: 14, angle: 120, outcome: '6X' },
            { pos: 15, angle: 135, outcome: 'LOSE' },
            { pos: 16, angle: 150, outcome: '3X' },
            { pos: 17, angle: 165, outcome: '4X' },
            { pos: 18, angle: 180, outcome: '2X' },
            { pos: 19, angle: 195, outcome: '2X' },
            { pos: 20, angle: 210, outcome: '3X' },
            { pos: 21, angle: 225, outcome: '3X' },
            { pos: 22, angle: 240, outcome: '4X' },
            { pos: 23, angle: 255, outcome: 'LOSE' }
        ];
        
        // Weighted outcomes for random selection
        this.weightedOutcomes = this.createWeightedList();
        
        this.initializeGame();
    }
    
    createWeightedList() {
        const outcomes = [];
        
        // Add weighted outcomes based on embedded list
        // LOSE (84 times)
        const losePositions = [1, 5, 9, 12, 15, 23];
        for (let i = 0; i < 84; i++) {
            outcomes.push(losePositions[i % losePositions.length]);
        }
        
        // 2X (5 times)
        const twoXPositions = [0, 7, 18, 19];
        for (let i = 0; i < 5; i++) {
            outcomes.push(twoXPositions[i % twoXPositions.length]);
        }
        
        // 3X (4 times)
        const threeXPositions = [4, 10, 16, 20, 21];
        for (let i = 0; i < 4; i++) {
            outcomes.push(threeXPositions[i % threeXPositions.length]);
        }
        
        // 4X (2 times)
        const fourXPositions = [3, 17, 22];
        for (let i = 0; i < 2; i++) {
            outcomes.push(fourXPositions[i % fourXPositions.length]);
        }
        
        // 5X (3 times)
        const fiveXPositions = [8, 13];
        for (let i = 0; i < 3; i++) {
            outcomes.push(fiveXPositions[i % fiveXPositions.length]);
        }
        
        // Single outcomes (1 each)
        outcomes.push(14); // 6X
        outcomes.push(6);  // REFUND
        outcomes.push(11); // 20X
        outcomes.push(2);  // 50X
        
        return outcomes;
    }
    
    initializeGame() {
        this.updateBalance();
        this.updateBetDisplay();
        this.updateLastWin(0);
        this.updateStatus('Ready to Spin!');
        
        console.log('Fresh Wheel of Wealth initialized');
        console.log('Logical position:', this.logicalPosition, 'degrees');
        console.log('Total CSS rotation:', this.totalRotation, 'degrees');
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
        if (this.spinning) return;
        
        this.spinning = true;
        const spinButton = document.getElementById('spin-btn');
        spinButton.disabled = true;
        
        // MANUAL TEST MODE - No game logic, just rotation testing
        console.log('=== MANUAL ROTATION TEST ===');
        console.log('Current logical position:', this.logicalPosition, 'degrees');
        console.log('Current CSS rotation:', this.totalRotation, 'degrees');
        
        // Test rotation: Always +90 degrees to check for drift
        const rotationToAdd = 90;
        const currentTest = this.testCounter || 0;
        
        console.log(`Test ${currentTest + 1}: Adding ${rotationToAdd} degrees (90° = quarter turn)`);
        
        // Update both positions
        this.totalRotation += rotationToAdd; // For CSS animation
        this.logicalPosition = (this.logicalPosition + rotationToAdd) % 360; // For game logic
        
        console.log(`CSS animation will rotate to: ${this.totalRotation} degrees`);
        console.log(`Logical position will be: ${this.logicalPosition} degrees`);
        
        // Animate wheel using total rotation for smooth animation
        this.animateWheel(this.totalRotation);
        
        // Update test counter
        this.testCounter = (currentTest + 1);
        
        // Re-enable spin button after animation
        setTimeout(() => {
            // Check what's actually at the arrow position (270° from wheel's perspective)
            // Since wheel rotates clockwise, subtract our rotation from the arrow position
            const arrowPosition = (270 - this.logicalPosition + 360) % 360;
            const expectedSegment = this.findSegmentAtAngle(arrowPosition);
            
            console.log(`✅ Animation complete. Wheel logical position: ${this.logicalPosition}°`);
            console.log(`🎯 Arrow should be pointing at: ${arrowPosition}° = ${expectedSegment.outcome}`);
            console.log(`📍 Expected segment angle: ${expectedSegment.angle}°`);
            console.log(`🎯 Drift check: ${Math.abs(arrowPosition - expectedSegment.angle)} degrees off center`);
            
            this.updateStatus(`Test ${currentTest + 1} complete. Expected: ${expectedSegment.outcome} (arrow at ${arrowPosition}°)`);
            this.spinning = false;
            spinButton.disabled = false;
        }, 3000);
    }
    
    animateWheel(finalAngle) {
        const wheelImage = document.getElementById('wheel-image');
        if (!wheelImage) return;
        
        wheelImage.style.transition = 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
        wheelImage.style.transform = `rotate(${finalAngle}deg)`;
        
        console.log('🎡 Wheel animated to:', finalAngle, 'degrees');
    }
    
    async processResult(segment) {
        const multiplier = this.parseMultiplier(segment.outcome);
        const winAmount = this.currentBet * multiplier;
        const isWin = multiplier > 0;
        
        // Update display
        this.updateLastWin(winAmount);
        
        // Update status
        if (segment.outcome === '50X') {
            this.updateStatus('🎉 JACKPOT! 🎉');
        } else if (isWin) {
            this.updateStatus(`You won ${multiplier}x!`);
        } else {
            this.updateStatus('Try again!');
        }
        
        // Add winnings
        if (isWin && window.unifiedBalance) {
            await window.unifiedBalance.addBalance(winAmount, 'wheel_win', `Wheel win: ${segment.outcome} = ${winAmount} coins`);
        }
        
        await this.updateBalance();
        
        // Reset status after delay
        setTimeout(() => {
            this.updateStatus('Ready to Spin!');
        }, 3000);
    }
    
    parseMultiplier(outcome) {
        if (outcome === 'LOSE') return 0;
        if (outcome === 'REFUND') return 1;
        
        const match = outcome.match(/(\\d+)X?/);
        return match ? parseInt(match[1]) : 0;
    }
    
    // Helper function to find which segment is at a given angle
    findSegmentAtAngle(angle) {
        // Normalize angle to 0-359
        const normalizedAngle = ((angle % 360) + 360) % 360;
        
        // Find the closest segment
        let closestSegment = this.wheelSegments[0];
        let smallestDiff = Math.abs(normalizedAngle - closestSegment.angle);
        
        for (let segment of this.wheelSegments) {
            let diff = Math.abs(normalizedAngle - segment.angle);
            // Handle wrap-around (e.g., difference between 350 and 10)
            if (diff > 180) {
                diff = 360 - diff;
            }
            
            if (diff < smallestDiff) {
                smallestDiff = diff;
                closestSegment = segment;
            }
        }
        
        return closestSegment;
    }
}

// Global functions for button handlers
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

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.wheelGame = new WheelOfWealth();
    }, 100);
});
