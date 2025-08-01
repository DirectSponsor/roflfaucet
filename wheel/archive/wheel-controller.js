// Wheel Controller - Connects logic with animation
// Provides the global functions that HTML buttons call

let wheelLogic = null;
let wheelAnimation = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize logic immediately (no DOM needed)
    wheelLogic = new WheelLogic();
    
    // Initialize animation after a small delay to ensure CSS is loaded
    setTimeout(() => {
        wheelAnimation = new WheelAnimation();
        wheelAnimation.init();
        console.log('🎮 Wheel Controller ready!');
    }, 100);
});

// Global function for SPIN button
async function spinWheel() {
    if (!wheelLogic || !wheelAnimation) {
        console.log('Systems not ready yet');
        return;
    }
    
    if (wheelAnimation.isSpinning()) {
        console.log('Already spinning!');
        return;
    }
    
    // Step 1-5 & 7-9: Calculate the spin (pure logic)
    const spinResult = wheelLogic.calculateSpin();
    
    // Step 6: Animate the wheel (just spin by the number given)
    try {
        await wheelAnimation.animateRotation(spinResult.totalSpinDegrees);
        
        // Show the result
        const payout = wheelLogic.calculatePayout(spinResult.outcome, wheelAnimation.currentBet);
        wheelAnimation.showResult(spinResult.outcome, spinResult.finalPosition, payout);
        
    } catch (error) {
        console.log('Animation error:', error);
    }
}

// Global functions for bet controls
function increaseBet() {
    if (wheelAnimation) {
        wheelAnimation.increaseBet();
    }
}

function decreaseBet() {
    if (wheelAnimation) {
        wheelAnimation.decreaseBet();
    }
}

// Global function for flip machine
function flipMachine() {
    if (wheelAnimation) {
        wheelAnimation.flipMachine();
    }
}

// Test functions
function testWheelPosition(degree) {
    if (!wheelLogic || !wheelAnimation) {
        console.log('Systems not ready yet');
        return;
    }
    
    if (wheelAnimation.isSpinning()) {
        console.log('Already spinning!');
        return;
    }
    
    // Calculate test spin
    const testResult = wheelLogic.calculateTestSpin(degree);
    
    // Animate it
    wheelAnimation.animateRotation(testResult.totalSpinDegrees).then(() => {
        const payout = wheelLogic.calculatePayout(testResult.outcome, wheelAnimation.currentBet);
        wheelAnimation.showResult(testResult.outcome, testResult.finalPosition, payout);
    });
}

function wheelStatus() {
    if (wheelLogic) {
        const status = wheelLogic.getStatus();
        console.log('\n📊 WHEEL STATUS:');
        console.log(`Current Position: ${status.currentPosition}°`);
        console.log(`Current Outcome: ${status.currentOutcome}`);
        console.log(`Spinning: ${wheelAnimation ? wheelAnimation.isSpinning() : 'Animation not ready'}`);
    }
}

// Manual rotation for testing
function manualRotate(degrees) {
    if (!wheelAnimation) {
        console.log('Animation system not ready yet');
        return;
    }
    
    if (wheelAnimation.isSpinning()) {
        console.log('Already spinning!');
        return;
    }
    
    console.log(`\n🔧 MANUAL ROTATE: ${degrees}°`);
    wheelAnimation.animateRotation(degrees);
}

// Test commands
function testQuarters() {
    console.log('\n🧪 Test commands:');
    console.log('manualRotate(15)   - Rotate 15° (one segment)');
    console.log('manualRotate(90)   - Rotate 90° (quarter turn)');
    console.log('testWheelPosition(194) - Test specific position');
    console.log('wheelStatus()      - Show current state');
    console.log('spinWheel()        - Full random spin');
}
