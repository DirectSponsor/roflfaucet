// Wheel Logic - Pure calculations, no DOM manipulation
// Implements the 9-step process Andy outlined

class WheelLogic {
    constructor() {
        // Step 1: Initial position (starts at 0°)
        this.currentPosition = 0;
        
        // Create the 24-segment wheel map
        this.segmentMap = this.createSegmentMap();
        
        console.log('🎯 Wheel Logic loaded');
        console.log(`Starting position: ${this.currentPosition}°`);
    }
    
    // Create the 24-segment wheel map with proper centering
    createSegmentMap() {
        // 24 segments in clockwise order - 0° is "2X"
        const segments = [
            '2X', '5X', 'LOSE', '3X', '20X', 'LOSE', '4X', '6X',
            '5X', '3X', '4X', '2X', 'LOSE', '3X', '2X', '5X', 
            '4X', '2X', 'LOSE', '50X', '4X', '3X', 'LOSE', 'REFUND'
        ];
        
        const map = {};
        
        // If 0° is the CENTER of a segment, then:
        // - Segment 0 spans from 352.5° to 7.5° (centered on 0°)
        // - Segment 1 spans from 7.5° to 22.5° (centered on 15°)
        for (let degree = 0; degree < 360; degree++) {
            // Shift by 7.5° so segments are centered on 0°, 15°, 30°, etc.
            const adjustedDegree = (degree + 7.5) % 360;
            const segmentIndex = Math.floor(adjustedDegree / 15);
            map[degree] = segments[segmentIndex];
        }
        
        return map;
    }
    
    // Main calculation function - follows the 9 steps exactly
    calculateSpin() {
        console.log('\n🎲 === NEW SPIN CALCULATION ===');
        
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
        
        // Step 7: Calculate final position using modulo
        const finalPosition = totalSpinDegrees % 360;
        console.log(`Step 7: ${totalSpinDegrees}° % 360 = ${finalPosition}°`);
        
        // Step 8: Look up outcome in segment map
        const outcome = this.segmentMap[finalPosition];
        console.log(`Step 8: ${finalPosition}° = ${outcome}`);
        
        // Step 9: Update current position for next spin
        this.currentPosition = finalPosition;
        console.log(`Step 9: Updated position to ${this.currentPosition}° for next spin`);
        
        // Return all the calculation results
        return {
            totalSpinDegrees,
            finalPosition,
            outcome,
            steps: {
                initial: this.currentPosition,
                random: randomDegrees,
                subtotal,
                fullRotations,
                fullRotationDegrees,
                total: totalSpinDegrees,
                final: finalPosition
            }
        };
    }
    
    // Test function - calculate spin to exact position
    calculateTestSpin(targetDegree) {
        console.log(`\n🧪 TEST SPIN CALCULATION to ${targetDegree}°`);
        
        // Calculate how much to spin to reach target
        const rotationNeeded = (targetDegree - this.currentPosition + 360) % 360;
        const totalSpin = rotationNeeded + (3 * 360); // Add 3 full rotations
        
        console.log(`Current: ${this.currentPosition}°, Target: ${targetDegree}°`);
        console.log(`Rotation needed: ${rotationNeeded}°, Total spin: ${totalSpin}°`);
        
        // Update position and get outcome
        this.currentPosition = targetDegree;
        const outcome = this.segmentMap[targetDegree];
        
        return {
            totalSpinDegrees: totalSpin,
            finalPosition: targetDegree,
            outcome
        };
    }
    
    // Look up outcome for any degree
    getOutcomeForDegree(degree) {
        return this.segmentMap[degree] || 'UNKNOWN';
    }
    
    // Get current state info
    getStatus() {
        return {
            currentPosition: this.currentPosition,
            currentOutcome: this.segmentMap[this.currentPosition],
            totalSegments: 24
        };
    }
    
    // Calculate payout for outcome
    calculatePayout(outcome, betAmount = 1) {
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
        
        const multiplier = payouts[outcome] || 0;
        return betAmount * multiplier;
    }
}

// Export for use in other files
window.WheelLogic = WheelLogic;
