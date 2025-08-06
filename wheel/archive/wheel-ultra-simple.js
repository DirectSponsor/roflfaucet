// Ultra Simple Wheel System
// Follows the exact 9-step process Andy outlined

class UltraSimpleWheel {
    constructor() {
        // Step 1: Initial position (default 0 on first load)
        this.currentPosition = 0;
        
        // Load the segment map (24 segments, 15° each)
        this.segmentMap = this.createSegmentMap();
        
        this.spinning = false;
        
        // Bet controls
        this.currentBet = 1;
        this.maxBet = 10;
        this.minBet = 1;
        
        console.log('🎯 Ultra Simple Wheel loaded');
        console.log(`Starting position: ${this.currentPosition}°`);
        this.updateBetDisplay();
    }
    
    // Create the 24-segment wheel map with proper centering
    createSegmentMap() {
        // 24 segments in clockwise order - but what should be at 0°?
        // Andy said 0° is "2X", so let's start with that
        const segments = [
            '2X', '5X', 'LOSE', '3X', '20X', 'LOSE', '4X', '6X',
            '5X', '3X', '4X', '2X', 'LOSE', '3X', '2X', '5X', 
            '4X', '2X', 'LOSE', '50X', '4X', '3X', 'LOSE', 'REFUND'
        ];
        
        const map = {};
        
        // If 0° is the CENTER of a segment, then:
        // - Segment 0 spans from 352.5° to 7.5° (centered on 0°)
        // - Segment 1 spans from 7.5° to 22.5° (centered on 15°)
        // - etc.
        for (let degree = 0; degree < 360; degree++) {
            // Shift by 7.5° so segments are centered on 0°, 15°, 30°, etc.
            const adjustedDegree = (degree + 7.5) % 360;
            const segmentIndex = Math.floor(adjustedDegree / 15);
            map[degree] = segments[segmentIndex];
        }
        
        return map;
    }
    
    // Main spin function - follows the 9 steps exactly
    spin() {
        if (this.spinning) {
            console.log('Already spinning!');
            return;
        }
        
        console.log('\n🎲 === NEW SPIN ===');
        
        // Step 1: Get initial position
        console.log(`Step 1: Initial position = ${this.currentPosition}°`);
        
        // Step 2: Generate random number between 0-359
        const randomDegrees = Math.floor(Math.random() * 360);
        console.log(`Step 2: Random degrees = ${randomDegrees}°`);
        
        // Step 3: Add random to initial
        const subtotal = this.currentPosition + randomDegrees;
        console.log(`Step 3: ${this.currentPosition}° + ${randomDegrees}° = ${subtotal}°`);
        
        // Step 4: Choose full rotations (1-5)
        const fullRotations = Math.floor(Math.random() * 5) + 1;
        const fullRotationDegrees = fullRotations * 360;
        console.log(`Step 4: Full rotations = ${fullRotations} (${fullRotationDegrees}°)`);
        
        // Step 5: Add full rotations to total
        const totalSpinDegrees = subtotal + fullRotationDegrees;
        console.log(`Step 5: ${subtotal}° + ${fullRotationDegrees}° = ${totalSpinDegrees}°`);
        
        // Step 6: Tell wheel to spin this amount
        console.log(`Step 6: Spinning wheel ${totalSpinDegrees}°...`);
        this.rotateWheelAnimation(totalSpinDegrees);
        
        // Step 7: Calculate final position using modulo
        const finalPosition = totalSpinDegrees % 360;
        console.log(`Step 7: ${totalSpinDegrees}° % 360 = ${finalPosition}°`);
        
        // Step 8: Look up outcome in segment map
        const outcome = this.segmentMap[finalPosition];
        console.log(`Step 8: ${finalPosition}° = ${outcome}`);
        
        // Step 9: Update current position for next spin
        this.currentPosition = finalPosition;
        console.log(`Step 9: Updated position to ${this.currentPosition}° for next spin`);
        
        // Show result and handle payout
        this.showResult(outcome, finalPosition);
    }
    
    // Animate the wheel rotation
    rotateWheelAnimation(totalDegrees) {
        this.spinning = true;
        
        const wheelImage = document.getElementById('wheel-image');
        if (!wheelImage) {
            console.log('⚠️ Wheel image not found');
            this.spinning = false;
            return;
        }
        
        // Get current CSS rotation
        const currentTransform = wheelImage.style.transform || 'rotate(0deg)';
        const currentCSSRotation = parseFloat(
            currentTransform.match(/rotate\(([^)]+)deg\)/) ? 
            currentTransform.match(/rotate\(([^)]+)deg\)/)[1] : '0'
        );
        
        // Calculate new CSS rotation
        const newCSSRotation = currentCSSRotation + totalDegrees;
        
        // Apply animation
        wheelImage.style.transition = 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
        wheelImage.style.transform = `rotate(${newCSSRotation}deg)`;
        
        console.log(`🎡 CSS: ${currentCSSRotation}° → ${newCSSRotation}°`);
        
        // Mark as not spinning after animation
        setTimeout(() => {
            this.spinning = false;
            console.log('✅ Wheel stopped');
        }, 3000);
    }
    
    // Show the result to user
    showResult(outcome, finalPosition) {
        console.log(`\n🏆 RESULT: ${outcome} at ${finalPosition}°`);
        
        // Update UI status
        const statusElement = document.querySelector('.status-text');
        if (statusElement) {
            statusElement.textContent = `Result: ${outcome}`;
        }
        
        // Calculate payout
        const payouts = {
            'LOSE': 0,
            'REFUND': 1,
            '2X': 2,
            '3X': 3,
            '4X': 4,
            '5X': 5,
            '6X': 6,
            '20X': 20,
            '50X': 50
        };
        
        const payout = payouts[outcome] || 0;
        console.log(`💰 Payout: ${payout}x`);
        
        // TODO: Integrate with balance system
        // const bet = this.currentBet || 1;
        // const winAmount = bet * payout;
        // window.unifiedBalance.addBalance(winAmount - bet);
    }
    
    // Test function - spin to exact position
    testSpin(targetDegree) {
        console.log(`\n🧪 TEST SPIN to ${targetDegree}°`);
        
        // Calculate how much to spin to reach target
        const rotationNeeded = (targetDegree - this.currentPosition + 360) % 360;
        const totalSpin = rotationNeeded + (3 * 360); // Add 3 full rotations
        
        console.log(`Current: ${this.currentPosition}°, Target: ${targetDegree}°`);
        console.log(`Rotation needed: ${rotationNeeded}°, Total spin: ${totalSpin}°`);
        
        this.rotateWheelAnimation(totalSpin);
        
        // Update position and show result
        this.currentPosition = targetDegree;
        const outcome = this.segmentMap[targetDegree];
        this.showResult(outcome, targetDegree);
    }
    
    // Debug: Show current state
    getStatus() {
        console.log(`\n📊 WHEEL STATUS:`);
        console.log(`Current Position: ${this.currentPosition}°`);
        console.log(`Current Outcome: ${this.segmentMap[this.currentPosition]}`);
        console.log(`Spinning: ${this.spinning}`);
    }
    
    // Bet control methods
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
    
    updateBetDisplay() {
        const betElement = document.getElementById('current-bet');
        if (betElement) {
            betElement.textContent = this.currentBet;
        }
    }
}

// Global functions for buttons and testing
function spinWheel() {
    if (window.ultraWheel) {
        window.ultraWheel.spin();
    }
}

function increaseBet() {
    if (window.ultraWheel) {
        window.ultraWheel.increaseBet();
    }
}

function decreaseBet() {
    if (window.ultraWheel) {
        window.ultraWheel.decreaseBet();
    }
}

function flipMachine() {
    // Simple flip functionality for payouts display
    const machine = document.getElementById('wheel-machine');
    if (machine) {
        machine.classList.toggle('flipped');
    }
}

function testWheelPosition(degree) {
    if (window.ultraWheel) {
        window.ultraWheel.testSpin(degree);
    }
}

function wheelStatus() {
    if (window.ultraWheel) {
        window.ultraWheel.getStatus();
    }
}

// Manual degree test function - just rotate by exact degrees
function manualRotate(degrees) {
    if (window.ultraWheel) {
        console.log(`\n🔧 MANUAL ROTATE: ${degrees}°`);
        console.log(`Current position: ${window.ultraWheel.currentPosition}°`);
        
        // Calculate where we should end up
        const newPosition = (window.ultraWheel.currentPosition + degrees) % 360;
        const outcome = window.ultraWheel.segmentMap[newPosition];
        
        console.log(`Should end up at: ${newPosition}°`);
        console.log(`Map says: ${outcome}`);
        console.log(`👁️ Check visually what the wheel actually shows!`);
        
        // Rotate the wheel visually
        window.ultraWheel.rotateWheelAnimation(degrees);
        
        // Update position and show result after animation (like normal spins)
        setTimeout(() => {
            window.ultraWheel.currentPosition = newPosition;
            console.log(`✅ Position updated to ${newPosition}°`);
            
            // Show the result with payout info like normal spins
            window.ultraWheel.showResult(outcome, newPosition);
        }, 3100);
    }
}

// Quick test functions
function testQuarters() {
    console.log('\n🧪 Manual test commands:');
    console.log('manualRotate(0)    - Stay at current position');
    console.log('manualRotate(15)   - Rotate 15° (one segment)');
    console.log('manualRotate(90)   - Rotate 90° (quarter turn)');
    console.log('manualRotate(194)  - Test the problem position');
    console.log('wheelStatus()      - Show current state');
    console.log('spinWheel()        - Full random spin (game logic)');
}

// Initialize when page loads - wait for both DOM and CSS
function initializeWheel() {
    // Check if CSS is loaded by testing if our styles are applied
    const testElement = document.querySelector('.wheel-display');
    if (!testElement) {
        setTimeout(initializeWheel, 50);
        return;
    }
    
    const computedStyle = getComputedStyle(testElement);
    const hasStyles = computedStyle.width !== '' && computedStyle.width !== 'auto';
    
    if (!hasStyles) {
        setTimeout(initializeWheel, 50);
        return;
    }
    
    // Now safe to initialize
    window.ultraWheel = new UltraSimpleWheel();
    console.log('\n🎯 Ultra Simple Wheel ready!');
    console.log('Type testQuarters() for test commands');
}

document.addEventListener('DOMContentLoaded', function() {
    // Small delay then check for CSS
    setTimeout(initializeWheel, 100);
});
