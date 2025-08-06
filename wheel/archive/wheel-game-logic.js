// Wheel Game Logic - External system that controls wheel and handles prizes
// Separates game logic from wheel rotation mechanics

class WheelGameLogic {
    constructor() {
        this.wheelMap = this.createWheelMap();
        this.probabilityArray = this.createProbabilityArray();
        this.spinning = false;
        
        console.log('🎮 Wheel Game Logic initialized');
        console.log(`📊 Probability array: ${this.probabilityArray.length} entries`);
        console.log(`🗺️ Wheel map: ${Object.keys(this.wheelMap).length} degree positions`);
    }
    
    // SIMPLE WHEEL MAP - Visual order starting from 0° (REFUND) going clockwise
    // Based on actual wheel image, not documentation
    createWheelMap() {
        /*
        WHEEL MAP - 24 segments, 15° each, starting at 0° (arrow position)
        Visual inspection of wheel image, clockwise from REFUND:
        
        Segment 0:  0-14°   = REFUND  (only one, easy reference)
        Segment 1:  15-29°  = 2X      (double)
        Segment 2:  30-44°  = 5X      (5x)
        Segment 3:  45-59°  = LOSE    (lose)
        Segment 4:  60-74°  = 3X      (triple) 
        Segment 5:  75-89°  = 20X     (20x)
        Segment 6:  90-104° = LOSE    (lose)
        Segment 7:  105-119° = ?      (NEED TO VERIFY)
        Segment 8:  120-134° = ?      (NEED TO VERIFY) 
        Segment 9:  135-149° = ?      (NEED TO VERIFY)
        ... (continue mapping based on visual inspection)
        */
        
        const map = {};
        
        // Simple approach: define the 24 segments in clockwise order
        // Starting from 0° (REFUND) as confirmed by Andy
        const wheelSegments = [
            'REFUND',  // 0-14°   - confirmed correct
            '2X',      // 15-29°  - double (need to verify)
            '5X',      // 30-44°  - 5x (need to verify) 
            'LOSE',    // 45-59°  - lose (need to verify)
            '3X',      // 60-74°  - triple (need to verify)
            '20X',     // 75-89°  - 20x (need to verify)
            'LOSE',    // 90-104° - lose (need to verify)
            '4X',      // 105-119° - CHANGED: was 5X, should be 4X based on test
            '6X',      // 120-134° - 6x (need to verify)
            '5X',      // 135-149° - CORRECTED: was 2X, should be 5X
            '3X',      // 150-164° - triple (need to verify)
            '4X',      // 165-179° - 4x (need to verify)
            '2X',      // 180-194° - double (need to verify)
            'LOSE',    // 195-209° - lose (need to verify)
            '3X',      // 210-224° - triple (need to verify)
            '2X',      // 225-239° - double (need to verify)
            '5X',      // 240-254° - 5x (need to verify)
            '4X',      // 255-269° - 4x (need to verify)
            '2X',      // 270-284° - double (need to verify)
            'LOSE',    // 285-299° - lose (need to verify)
            '50X',     // 300-314° - 50x (need to verify)
            '4X',      // 315-329° - 4x - confirmed correct by Andy
            '3X',      // 330-344° - triple (need to verify)
            'LOSE'     // 345-359° - lose (need to verify)
        ];
        
        // Map each degree to its segment outcome
        // Segments are CENTERED on degree markers (0°, 15°, 30°, etc.)
        // So segment 0 spans 353-7°, segment 1 spans 8-22°, etc.
        for (let degree = 0; degree < 360; degree++) {
            // Shift by 7.5° to center segments on degree markers
            const adjustedDegree = (degree + 7.5) % 360;
            const segmentIndex = Math.floor(adjustedDegree / 15);
            map[degree] = wheelSegments[segmentIndex];
        }
        
        return map;
    }
    
    // Create probability array - 360 entries, each containing a degree (0-359)
    // This allows us to weight outcomes by having some degrees appear more often
    createProbabilityArray() {
        const array = [];
        
        // For now, create uniform distribution (each degree appears once)
        // Later we can modify this to weight certain outcomes
        for (let degree = 0; degree < 360; degree++) {
            array.push(degree);
        }
        
        // Shuffle the array to randomize order
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        
        return array;
    }
    
    // Main game function - spin the wheel!
    spin() {
        if (this.spinning) {
            console.log('Already spinning, please wait...');
            return;
        }
        
        if (!window.simpleWheelGame) {
            console.log('Wheel system not found!');
            return;
        }
        
        console.log('🎲 === STARTING WHEEL GAME ===');
        
        // 1. Generate random number (0-359)
        const randomIndex = Math.floor(Math.random() * this.probabilityArray.length);
        const targetDegree = this.probabilityArray[randomIndex];
        
        console.log(`🎯 Random selection: index ${randomIndex} → ${targetDegree}°`);
        
        // 2. Look up the outcome for this degree
        const outcome = this.wheelMap[targetDegree];
        const payout = this.calculatePayout(outcome);
        
        console.log(`💰 Outcome: ${outcome} (${payout}x payout)`);
        
        // 3. Calculate rotation needed and tell wheel to spin
        const currentPosition = window.simpleWheelGame.currentPosition;
        const rotationNeeded = (targetDegree - currentPosition + 360) % 360;
        
        console.log(`🎡 Wheel rotation: ${currentPosition}° → ${targetDegree}° (rotate ${rotationNeeded}°)`);
        
        // 4. Start spinning
        this.spinning = true;
        window.simpleWheelGame.rotateWheel(rotationNeeded);
        
        // 5. Handle result after wheel stops (3 seconds)
        setTimeout(() => {
            console.log(`✅ Wheel stopped! Result: ${outcome}`);
            this.processResult(outcome, payout, targetDegree);
            this.spinning = false;
        }, 3100); // Slightly longer than wheel animation
    }
    
    // Calculate payout multiplier based on outcome
    calculatePayout(outcome) {
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
        
        return payouts[outcome] || 0;
    }
    
    // Process the result - update balance, show win message, etc.
    processResult(outcome, payout, degree) {
        const bet = window.simpleWheelGame?.currentBet || 1;
        const winAmount = bet * payout;
        
        console.log(`📊 Game Result:`);
        console.log(`   Outcome: ${outcome}`);
        console.log(`   Bet: ${bet} coins`);
        console.log(`   Payout: ${payout}x`);
        console.log(`   Win Amount: ${winAmount} coins`);
        
        // Update UI
        if (window.simpleWheelGame) {
            window.simpleWheelGame.updateLastWin(winAmount);
            
            // Update status message
            if (outcome === 'LOSE') {
                window.simpleWheelGame.updateStatus(`Lost ${bet} coins`);
            } else if (outcome === 'REFUND') {
                window.simpleWheelGame.updateStatus(`Refunded ${bet} coins`);
            } else {
                window.simpleWheelGame.updateStatus(`Won ${winAmount} coins! (${outcome})`);
            }
        }
        
        // TODO: Integrate with unified balance system
        // window.unifiedBalance.addBalance(winAmount - bet);
    }
    
    // Test function - show what outcome would occur at a specific degree
    testDegree(degree) {
        const outcome = this.wheelMap[degree];
        const payout = this.calculatePayout(outcome);
        console.log(`🔍 Degree ${degree}°: ${outcome} (${payout}x payout)`);
        return { degree, outcome, payout };
    }
    
    // Show probability distribution
    showProbabilities() {
        const outcomeCount = {};
        
        // Count how many times each outcome appears
        for (let degree = 0; degree < 360; degree++) {
            const outcome = this.wheelMap[degree];
            outcomeCount[outcome] = (outcomeCount[outcome] || 0) + 1;
        }
        
        console.log('📊 Current Probability Distribution:');
        Object.entries(outcomeCount)
            .sort((a, b) => b[1] - a[1])
            .forEach(([outcome, count]) => {
                const percentage = ((count / 360) * 100).toFixed(1);
                console.log(`   ${outcome}: ${count}/360 (${percentage}%)`);
            });
    }
}

// MANUAL TESTING FUNCTIONS - for wheel calibration

// Manual spin to exact degree for calibration
function manualSpin(targetDegree) {
    if (!window.simpleWheelGame) {
        console.log('Wheel system not found!');
        return;
    }
    
    console.log(`🎯 MANUAL CALIBRATION TEST`);
    console.log(`Target degree: ${targetDegree}°`);
    
    // Calculate rotation needed
    const currentPosition = window.simpleWheelGame.currentPosition;
    const rotationNeeded = (targetDegree - currentPosition + 360) % 360;
    
    console.log(`Current position: ${currentPosition}°`);
    console.log(`Rotation needed: ${rotationNeeded}°`);
    console.log(`Final position will be: ${targetDegree}°`);
    
    // Tell wheel to spin there
    window.simpleWheelGame.rotateWheel(rotationNeeded);
    
    // Show what our map THINKS should be there
    const mapOutcome = window.wheelGameLogic.wheelMap[targetDegree];
    console.log(`📋 Our map says: ${mapOutcome}`);
    console.log(`👁️ Now check visually what the wheel actually shows!`);
    
    return {
        targetDegree,
        currentPosition,
        rotationNeeded,
        mapSays: mapOutcome
    };
}

// Quick test for key positions
function testKeyPositions() {
    console.log('🎯 Testing key positions:');
    console.log('manualSpin(0)   - Test REFUND position');
    console.log('manualSpin(75)  - Test where 20X should be');
    console.log('manualSpin(194) - Test the problem position');
    console.log('manualSpin(315) - Test confirmed 4X position');
}

// Global functions for easy testing
function spinWheel() {
    if (window.wheelGameLogic) {
        window.wheelGameLogic.spin();
    }
}

function testDegree(degree) {
    if (window.wheelGameLogic) {
        return window.wheelGameLogic.testDegree(degree);
    }
}

function showProbabilities() {
    if (window.wheelGameLogic) {
        window.wheelGameLogic.showProbabilities();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.wheelGameLogic = new WheelGameLogic();
        console.log('🎮 Game Logic ready! Use: spinWheel(), testDegree(X), showProbabilities()');
    }, 200); // Load after wheel system
});
