// Clean Wheel Game - Simple Integer-Based System
class CleanWheelGame {
    constructor() {
        this.currentBet = 1;
        this.maxBet = 10;
        this.minBet = 1;
        this.spinning = false;
        
        // Current wheel position (0-359 degrees)
        this.currentPosition = 0;
        
        // 24 segments, each covering 15 degrees (360 ÷ 24 = 15)
        // Arrow always points at 9 o'clock. When wheel position = 0°, arrow points to "2X" (DOUBLE)
        // So 0° = 2X segment. Map all other segments relative to this.
        this.segmentRanges = [
            { segment: 0, startDegree: 353, endDegree: 7, outcome: '2X' },       // Center: 0° - DOUBLE (where arrow points when wheel at 0°)
            { segment: 1, startDegree: 8, endDegree: 22, outcome: 'LOSE' },      // Center: 15°
            { segment: 2, startDegree: 23, endDegree: 37, outcome: '4X' },       // Center: 30°
            { segment: 3, startDegree: 38, endDegree: 52, outcome: '5X' },       // Center: 45°
            { segment: 4, startDegree: 53, endDegree: 67, outcome: '2X' },       // Center: 60°
            { segment: 5, startDegree: 68, endDegree: 82, outcome: '3X' },       // Center: 75°
            { segment: 6, startDegree: 83, endDegree: 97, outcome: 'LOSE' },     // Center: 90°
            { segment: 7, startDegree: 98, endDegree: 112, outcome: '2X' },      // Center: 105°
            { segment: 8, startDegree: 113, endDegree: 127, outcome: '4X' },     // Center: 120°
            { segment: 9, startDegree: 128, endDegree: 142, outcome: '3X' },     // Center: 135°
            { segment: 10, startDegree: 143, endDegree: 157, outcome: '2X' },    // Center: 150°
            { segment: 11, startDegree: 158, endDegree: 172, outcome: '6X' },    // Center: 165°
            { segment: 12, startDegree: 173, endDegree: 187, outcome: '5X' },    // Center: 180°
            { segment: 13, startDegree: 188, endDegree: 202, outcome: 'LOSE' },  // Center: 195°
            { segment: 14, startDegree: 203, endDegree: 217, outcome: '20X' },   // Center: 210°
            { segment: 15, startDegree: 218, endDegree: 232, outcome: '3X' },    // Center: 225°
            { segment: 16, startDegree: 233, endDegree: 247, outcome: 'LOSE' },  // Center: 240°
            { segment: 17, startDegree: 248, endDegree: 262, outcome: '5X' },    // Center: 255°
            { segment: 18, startDegree: 263, endDegree: 277, outcome: '2X' },    // Center: 270°
            { segment: 19, startDegree: 278, endDegree: 292, outcome: 'REFUND' }, // Center: 285°
            { segment: 20, startDegree: 293, endDegree: 307, outcome: 'LOSE' },  // Center: 300°
            { segment: 21, startDegree: 308, endDegree: 322, outcome: '3X' },    // Center: 315°
            { segment: 22, startDegree: 323, endDegree: 337, outcome: '4X' },    // Center: 330°
            { segment: 23, startDegree: 338, endDegree: 352, outcome: '50X' }    // Center: 345°
        ];
        
        // Compressed probability list (360 entries)
        // Each entry is a segment number (0-23)
        this.probabilityList = this.createProbabilityList();
        
        this.initializeGame();
    }
    
    createProbabilityList() {
        const list = [];
        
        // LOSE segments (84% - 302 entries): segments 1, 6, 13, 16, 20
        const loseSegments = [1, 6, 13, 16, 20];
        for (let i = 0; i < 302; i++) {
            list.push(loseSegments[i % loseSegments.length]);
        }
        
        // 2X segments (5% - 18 entries): segments 0, 4, 7, 10, 18
        const twoXSegments = [0, 4, 7, 10, 18];
        for (let i = 0; i < 18; i++) {
            list.push(twoXSegments[i % twoXSegments.length]);
        }
        
        // 3X segments (4% - 14 entries): segments 5, 9, 15, 21
        const threeXSegments = [5, 9, 15, 21];
        for (let i = 0; i < 14; i++) {
            list.push(threeXSegments[i % threeXSegments.length]);
        }
        
        // 4X segments (2% - 7 entries): segments 2, 8, 22
        const fourXSegments = [2, 8, 22];
        for (let i = 0; i < 7; i++) {
            list.push(fourXSegments[i % fourXSegments.length]);
        }
        
        // 5X segments (3% - 11 entries): segments 3, 12, 17
        const fiveXSegments = [3, 12, 17];
        for (let i = 0; i < 11; i++) {
            list.push(fiveXSegments[i % fiveXSegments.length]);
        }
        
        // Single entries (1 each)
        list.push(11); // 6X
        list.push(19); // REFUND
        list.push(14); // 20X
        list.push(23); // 50X
        
        // Shuffle the list to randomize distribution
        for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [list[i], list[j]] = [list[j], list[i]];
        }
        
        return list;
    }
    
    initializeGame() {
        this.updateBalance();
        this.updateBetDisplay();
        this.updateLastWin(0);
        this.updateStatus('Ready to Spin!');
        
        console.log('Clean Wheel Game initialized');
        console.log('Starting position:', this.currentPosition, 'degrees');
        console.log('Probability list length:', this.probabilityList.length);
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
        
        // Check if player can afford bet
        if (!(await this.canSpin())) {
            this.updateStatus('Insufficient balance!');
            return;
        }
        
        this.spinning = true;
        const spinButton = document.getElementById('spin-btn');
        spinButton.disabled = true;
        
        // Deduct bet from balance
        if (window.unifiedBalance) {
            await window.unifiedBalance.addBalance(-this.currentBet, 'wheel_bet', `Wheel bet: ${this.currentBet} coins`);
            await this.updateBalance();
        }
        
        console.log('=== CLEAN WHEEL SPIN ===');
        console.log('Current position:', this.currentPosition, 'degrees');
        
        // 1. Pick random entry from probability list
        const randomIndex = Math.floor(Math.random() * this.probabilityList.length);
        const selectedSegment = this.probabilityList[randomIndex];
        const segmentInfo = this.segmentRanges[selectedSegment];
        
        console.log(`Random index: ${randomIndex}/${this.probabilityList.length}`);
        console.log(`Selected segment: ${selectedSegment} (${segmentInfo.outcome})`);
        console.log(`Segment range: ${segmentInfo.startDegree}-${segmentInfo.endDegree} degrees`);
        
        // 2. Pick random degree within that segment
        let targetDegree = Math.floor(Math.random() * 15) + segmentInfo.startDegree;
        // Handle wrap-around for segment 5 (345-359) going into segment 6 (0-14)
        if (targetDegree > 359) {
            targetDegree = targetDegree - 360;
        }
        
        console.log(`Target degree: ${targetDegree}`);
        
        // 3. Calculate spin distance (always forward/clockwise)
        let spinDistance = targetDegree - this.currentPosition;
        if (spinDistance < 0) {
            spinDistance += 360; // Always spin forward, handle wrap-around
        }
        
        // 4. Ensure minimum spin distance and add extra rotations
        const minSpin = 90; // Minimum 90 degrees even if target is close
        if (spinDistance < minSpin) {
            spinDistance += 360; // Add full rotation if too close
        }
        
        const extraRotations = 3 + Math.floor(Math.random() * 4); // 3, 4, 5, or 6 rotations
        const totalSpin = spinDistance + (extraRotations * 360);
        
        console.log(`Spin distance: ${spinDistance} degrees`);
        console.log(`Extra rotations: ${extraRotations} (${extraRotations * 360} degrees)`);
        console.log(`Total spin: ${totalSpin} degrees`);
        
        // 5. Update current position for next spin
        this.currentPosition = targetDegree;
        
        // 6. Animate wheel
        this.animateWheel(totalSpin);
        
        // 7. Process result after animation
        setTimeout(async () => {
            console.log(`✅ Spin complete! Landed at ${this.currentPosition}° (${segmentInfo.outcome})`);
            
            // DEBUG: Show expected outcome in permanent display
            this.showDebugInfo(segmentInfo, targetDegree);
            
            console.log(`🔴 SYSTEM EXPECTS: ${segmentInfo.outcome} at ${targetDegree}° (segment ${segmentInfo.segment})`);
            console.log(`🔴 WHAT DO YOU SEE ON THE WHEEL?`);
            
            // Process the result
            await this.processResult(segmentInfo);
            
            this.spinning = false;
            spinButton.disabled = false;
        }, 3000);
    }
    
    animateWheel(spinAmount) {
        const wheelImage = document.getElementById('wheel-image');
        if (!wheelImage) return;
        
        // Get current CSS rotation
        const currentTransform = wheelImage.style.transform || 'rotate(0deg)';
        const currentRotation = parseFloat(currentTransform.match(/rotate\\(([^)]+)deg\\)/) ? 
            currentTransform.match(/rotate\\(([^)]+)deg\\)/)[1] : '0');
        
        // Calculate new total rotation
        const newRotation = currentRotation + spinAmount;
        
        wheelImage.style.transition = 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
        wheelImage.style.transform = `rotate(${newRotation}deg)`;
        
        console.log(`🎡 Wheel spinning ${spinAmount}° (from ${currentRotation}° to ${newRotation}°)`);
    }
    
    async processResult(segmentInfo) {
        const multiplier = this.parseMultiplier(segmentInfo.outcome);
        const winAmount = this.currentBet * multiplier;
        const isWin = multiplier > 0;
        
        // Update display
        this.updateLastWin(winAmount);
        
        // Update status
        if (segmentInfo.outcome === '50X') {
            this.updateStatus('🎉 JACKPOT! 🎉');
        } else if (isWin) {
            this.updateStatus(`You won ${multiplier}x!`);
        } else {
            this.updateStatus('Try again!');
        }
        
        // Add winnings
        if (isWin && window.unifiedBalance) {
            await window.unifiedBalance.addBalance(winAmount, 'wheel_win', `Wheel win: ${segmentInfo.outcome} = ${winAmount} coins`);
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
    
    showDebugInfo(segmentInfo, targetDegree) {
        console.log('🔴 DEBUG: Creating debug display...');
        
        // Remove any existing debug div
        const existingDiv = document.getElementById('wheel-debug-info');
        if (existingDiv) {
            existingDiv.remove();
        }
        
        // Create debug display
        const debugDiv = document.createElement('div');
        debugDiv.id = 'wheel-debug-info';
        debugDiv.style.position = 'fixed';
        debugDiv.style.top = '20px';
        debugDiv.style.right = '20px';
        debugDiv.style.background = '#ff0000';
        debugDiv.style.color = 'white';
        debugDiv.style.padding = '15px';
        debugDiv.style.borderRadius = '8px';
        debugDiv.style.fontSize = '18px';
        debugDiv.style.fontWeight = 'bold';
        debugDiv.style.zIndex = '9999';
        debugDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        debugDiv.style.maxWidth = '300px';
        
        debugDiv.innerHTML = `
            SYSTEM EXPECTS: <span style="font-size: 24px;">${segmentInfo.outcome}</span><br>
            Position: ${targetDegree}° (Segment ${segmentInfo.segment})<br>
            What do YOU see on wheel?
        `;
        
        document.body.appendChild(debugDiv);
        console.log('🔴 DEBUG: Debug display created and added to body');
        
        // Auto-hide after 15 seconds
        setTimeout(() => {
            if (debugDiv && debugDiv.parentNode) {
                debugDiv.remove();
                console.log('🔴 DEBUG: Debug display removed');
            }
        }, 15000);
    }
}

// Global functions for button handlers
function increaseBet() {
    if (window.cleanWheelGame) {
        window.cleanWheelGame.increaseBet();
    }
}

function decreaseBet() {
    if (window.cleanWheelGame) {
        window.cleanWheelGame.decreaseBet();
    }
}

function spinWheel() {
    if (window.cleanWheelGame) {
        window.cleanWheelGame.spinWheel();
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.cleanWheelGame = new CleanWheelGame();
    }, 100);
});
