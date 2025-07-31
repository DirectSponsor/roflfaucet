// Wheel Simple System - Pure Rotation Approach
// Just spins the wheel by degrees - no segment logic

class SimpleWheelGame {
    constructor() {
        this.currentBet = 1;
        this.maxBet = 10;
        this.minBet = 1;
        this.spinning = false;
        
        // Current wheel position (0-359 degrees) - this is the ONLY state we track
        this.currentPosition = 0;
        
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
    
    // PURE ROTATION FUNCTION - Just rotates wheel by specified degrees
    rotateWheel(degrees) {
        if (this.spinning) {
            console.log('Already spinning, ignoring request');
            return;
        }
        
        console.log(`=== ROTATING WHEEL ===`);
        console.log(`Rotation: ${degrees}°`);
        console.log(`Starting position: ${this.currentPosition}°`);
        
        // Add minimum 3 full rotations for visual effect
        const fullRotations = 3 + Math.floor(Math.random() * 3); // 3-5 rotations
        const totalRotation = degrees + (fullRotations * 360);
        
        console.log(`Full rotations added: ${fullRotations} (${fullRotations * 360}°)`);
        console.log(`Total rotation: ${totalRotation}°`);
        
        // Update position (normalize to 0-359)
        this.currentPosition = (this.currentPosition + degrees) % 360;
        if (this.currentPosition < 0) this.currentPosition += 360;
        
        console.log(`Final position: ${this.currentPosition}°`);
        
        // Animate wheel
        this.animateWheel(totalRotation);
        
        // Mark as spinning
        this.spinning = true;
        setTimeout(() => {
            console.log(`✅ Wheel stopped at ${this.currentPosition}°`);
            this.updateStatus(`Wheel at ${this.currentPosition}°`);
            this.updateDebugInfo();
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
    
    // Test function - spin by random degrees (for testing)
    testRandomSpin() {
        const testDegrees = [0, 45, 90, 135, 180, 225, 270, 315]; // 8 test positions
        const randomIndex = Math.floor(Math.random() * testDegrees.length);
        const targetDegree = testDegrees[randomIndex];
        const rotationNeeded = (targetDegree - this.currentPosition + 360) % 360;
        console.log(`🎲 Testing random rotation to ${targetDegree}° (rotate ${rotationNeeded}°)`);
        this.rotateWheel(rotationNeeded);
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
    
    updateDebugInfo() {
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
            <strong>🎯 PURE ROTATION DEBUG</strong><br>
            Current Position: ${this.currentPosition}°<br>
            Position Name: ${this.getPositionName(this.currentPosition)}<br>
            <em>(External logic determines outcome)</em>
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

// PURE ROTATION TEST FUNCTIONS (call from console)
function testRotation(degrees) {
    if (window.simpleWheelGame) {
        console.log(`Testing rotation by ${degrees}°`);
        window.simpleWheelGame.rotateWheel(degrees);
    }
}

function testPosition(targetDegree) {
    if (window.simpleWheelGame) {
        const currentPos = window.simpleWheelGame.currentPosition;
        const rotationNeeded = (targetDegree - currentPos + 360) % 360;
        console.log(`Testing move to ${targetDegree}° (rotate ${rotationNeeded}° from ${currentPos}°)`);
        window.simpleWheelGame.rotateWheel(rotationNeeded);
    }
}

function testEightPositions() {
    console.log('Pure Rotation Testing - 8 key positions:');
    console.log('testPosition(0)   - 12 o\'clock');
    console.log('testPosition(45)  - 1:30 position');
    console.log('testPosition(90)  - 3 o\'clock');
    console.log('testPosition(135) - 4:30 position');
    console.log('testPosition(180) - 6 o\'clock');
    console.log('testPosition(225) - 7:30 position');
    console.log('testPosition(270) - 9 o\'clock');
    console.log('testPosition(315) - 10:30 position');
    console.log('Or use: testRotation(degrees) for exact degree rotation');
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.simpleWheelGame = new SimpleWheelGame();
        console.log('🎯 Pure Rotation Wheel loaded!');
        console.log('Test with: testPosition(degrees), testRotation(degrees), testEightPositions(), or spinWheel()');
    }, 100);
});
