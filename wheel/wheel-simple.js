// Wheel Simple System - Phase 1: Basic Structure
// 24 segments, center-point targeting, no complex ranges

class SimpleWheelGame {
    constructor() {
        this.currentBet = 1;
        this.maxBet = 10;
        this.minBet = 1;
        this.spinning = false;
        
        // Current wheel position (0-359 degrees)
        this.currentPosition = 0;
        
        // PHASE 3: Expanded to 8 segments (every 45°) with varied outcomes
        // Direct degree-to-outcome mapping - no arrow logic needed
        this.segments = [
            { id: 0, centerDegree: 0, outcome: 'DOUBLE' },     // 12 o'clock - confirmed
            { id: 1, centerDegree: 45, outcome: '3X' },        // 1:30 position
            { id: 2, centerDegree: 90, outcome: 'DOUBLE' },    // 3 o'clock - confirmed
            { id: 3, centerDegree: 135, outcome: '4X' },       // 4:30 position
            { id: 4, centerDegree: 180, outcome: 'LOSE' },     // 6 o'clock - confirmed
            { id: 5, centerDegree: 225, outcome: '5X' },       // 7:30 position
            { id: 6, centerDegree: 270, outcome: 'REFUND' },   // 9 o'clock - confirmed
            { id: 7, centerDegree: 315, outcome: 'JACKPOT' }   // 10:30 position
        ];
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.updateBalance();
        this.updateBetDisplay();
        this.updateLastWin(0);
        this.updateStatus('Simple Wheel Ready!');
        
        console.log('Simple Wheel Game initialized');
        console.log('24 segments loaded, current position:', this.currentPosition);
        console.log('Arrow points at 270° (segment 0)');
    }
    
    // Core rotation function - spin to specific segment
    spinToSegment(segmentId) {
        if (this.spinning) {
            console.log('Already spinning, ignoring request');
            return;
        }
        
        // Find segment by ID
        const targetSegment = this.segments.find(segment => segment.id === segmentId);
        if (!targetSegment) {
            console.log('Segment not found. Available segments: 0-7 (8 segments total)');
            return;
        }
        const targetDegree = targetSegment.centerDegree;
        
        console.log(`=== SPINNING TO SEGMENT ${segmentId} ===`);
        console.log(`Target: ${targetSegment.outcome} at ${targetDegree}°`);
        console.log(`Current position: ${this.currentPosition}°`);
        
        // Calculate forward rotation distance
        let rotationDistance = targetDegree - this.currentPosition;
        if (rotationDistance < 0) {
            rotationDistance += 360; // Always spin forward
        }
        
        // Add minimum 3 full rotations for visual effect
        const fullRotations = 3 + Math.floor(Math.random() * 3); // 3-5 rotations
        const totalRotation = rotationDistance + (fullRotations * 360);
        
        console.log(`Rotation distance: ${rotationDistance}°`);
        console.log(`Full rotations: ${fullRotations} (${fullRotations * 360}°)`);
        console.log(`Total rotation: ${totalRotation}°`);
        
        // Update position and animate
        this.currentPosition = targetDegree;
        this.animateWheel(totalRotation);
        
        // Process result after animation
        this.spinning = true;
        setTimeout(() => {
            console.log(`✅ Landed on segment ${segmentId}: ${targetSegment.outcome}`);
            this.updateStatus(`Result: ${targetSegment.outcome}`);
            this.updateDebugInfo(segmentId, targetSegment);
            this.spinning = false;
        }, 3000);
    }
    
    // Simple animation function
    animateWheel(rotationAmount) {
        const wheelImage = document.getElementById('wheel-image');
        if (!wheelImage) {
            console.log('Wheel image not found!');
            return;
        }
        
        // Get current rotation
        const currentTransform = wheelImage.style.transform || 'rotate(0deg)';
        const currentRotation = parseFloat(currentTransform.match(/rotate\(([^)]+)deg\)/) ? 
            currentTransform.match(/rotate\(([^)]+)deg\)/)[1] : '0');
        
        // Calculate new rotation
        const newRotation = currentRotation + rotationAmount;
        
        // Apply smooth transition
        wheelImage.style.transition = 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
        wheelImage.style.transform = `rotate(${newRotation}deg)`;
        
        console.log(`🎡 Animating: ${rotationAmount}° (${currentRotation}° → ${newRotation}°)`);
    }
    
    // Test function - spin to random segment (from available test segments)
    testRandomSpin() {
        const availableSegmentIds = this.segments.map(s => s.id); // [0, 1, 2, 3, 4, 5, 6, 7]
        const randomIndex = Math.floor(Math.random() * availableSegmentIds.length);
        const randomSegment = availableSegmentIds[randomIndex];
        console.log('🎲 Testing random spin to segment:', randomSegment);
        this.spinToSegment(randomSegment);
    }
    
    // UI update functions
    updateBalance() {
        const balance = window.unifiedBalance ? 100 : 100; // Placeholder for now
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
    
    updateDebugInfo(segmentId, targetSegment) {
        // Create or update debug display
        let debugDiv = document.getElementById('wheel-debug-info');
        if (!debugDiv) {
            debugDiv = document.createElement('div');
            debugDiv.id = 'wheel-debug-info';
            debugDiv.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 12px;
                z-index: 1000;
                max-width: 250px;
            `;
            document.body.appendChild(debugDiv);
        }
        
        debugDiv.innerHTML = `
            <strong>🎯 WHEEL DEBUG INFO</strong><br>
            Segment ID: ${segmentId}<br>
            Target Angle: ${targetSegment.centerDegree}°<br>
            Result: <strong>${targetSegment.outcome}</strong><br>
            Position: ${this.getPositionName(targetSegment.centerDegree)}<br>
            Current Wheel Pos: ${this.currentPosition}°
        `;
    }
    
    getPositionName(degree) {
        switch(degree) {
            case 0: return '12 o\'clock';
            case 90: return '3 o\'clock';
            case 180: return '6 o\'clock';
            case 270: return '9 o\'clock';
            default: return `${degree}°`;
        }
    }
    
    // Bet controls
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
}

// Global functions for button handlers
function increaseBet() {
    if (window.simpleWheelGame) {
        window.simpleWheelGame.increaseBet();
    }
}

function decreaseBet() {
    if (window.simpleWheelGame) {
        window.simpleWheelGame.decreaseBet();
    }
}

function spinWheel() {
    if (window.simpleWheelGame) {
        // For now, just test with random spins
        window.simpleWheelGame.testRandomSpin();
    }
}

// Manual test functions (call from console)
function testSegment(segmentId) {
    if (window.simpleWheelGame) {
        window.simpleWheelGame.spinToSegment(segmentId);
    }
}

function testEights() {
    console.log('Testing 8 positions (every 45°): 0, 1, 2, 3, 4, 5, 6, 7');
    console.log('Confirmed positions: 0(DOUBLE), 2(DOUBLE), 4(LOSE), 6(REFUND)');
    console.log('New positions: 1(3X), 3(4X), 5(5X), 7(JACKPOT)');
    console.log('Use: testSegment(0-7)');
}

// Legacy function for backward compatibility
function testQuarters() {
    console.log('Legacy: Testing original 4 quarter positions...');
    console.log('Use: testSegment(0), testSegment(2), testSegment(4), testSegment(6)');
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.simpleWheelGame = new SimpleWheelGame();
        console.log('🎯 Simple Wheel loaded! 8 segments active.');
        console.log('Test with: testSegment(0-7), testEights(), or spinWheel()');
    }, 100);
});
