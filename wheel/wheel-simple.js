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
        
        // SIMPLIFIED: Direct degree-to-outcome mapping based on actual wheel image
        // No arrow logic - just wheel rotation degrees to results
        this.segments = [
            { id: 0, centerDegree: 0, outcome: 'DOUBLE' },     // 12 o'clock - you saw DOUBLE
            { id: 1, centerDegree: 90, outcome: 'DOUBLE' },    // 3 o'clock - you saw DOUBLE  
            { id: 2, centerDegree: 180, outcome: 'LOSE' },     // 6 o'clock - you saw LOSE
            { id: 3, centerDegree: 270, outcome: 'REFUND' }    // 9 o'clock - you saw REFUND
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
            console.log('Segment not found in test mode. Available segments: 0, 1, 2, 3');
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
        const availableSegmentIds = this.segments.map(s => s.id); // [0, 1, 2, 3]
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

function testQuarters() {
    console.log('Testing quarter positions: 0, 1, 2, 3');
    // Call these manually one at a time to test
    console.log('Use: testSegment(0), testSegment(1), testSegment(2), testSegment(3)');
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.simpleWheelGame = new SimpleWheelGame();
        console.log('🎯 Simple Wheel loaded! Test with: testSegment(0-23) or testQuarters()');
    }, 100);
});
