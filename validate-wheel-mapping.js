// Wheel Mapping Validation Script
// Checks if segmentOutcomes mapping matches the visual createSegmentMap

// Copy the segmentOutcomes from wheel-minimal.js
const segmentOutcomes = {
    0: '2X', 1: '4X', 2: '5X', 3: '2X', 4: '3X', 5: 'LOSE',
    6: '2X', 7: '4X', 8: '3X', 9: '2X', 10: '6X', 11: '5X',
    12: 'LOSE', 13: '20X', 14: '3X', 15: 'LOSE', 16: '5X', 17: '2X',
    18: 'REFUND', 19: 'LOSE', 20: '3X', 21: '4X', 22: 'JACKPOT', 23: 'LOSE',
    24: '2X'  // Added missing segment 24
};

// Copy the createSegmentMap logic from wheel-minimal.js
function createSegmentMap() {
    // Correct wheel order discovered through testing
    const segments = ['2X', '4X', '5X', '2X', '3X', 'LOSE',
        '2X', '4X', '3X', '2X', '6X', '5X',
        'LOSE', '20X', '3X', 'LOSE', '5X', '2X',
        'REFUND', 'LOSE', '3X', '4X', 'JACKPOT', 'LOSE'
    ];

    const map = {};
    for (let degree = 0; degree < 360; degree++) {
        const adjusted = (degree + 7.5) % 360;
        const index = Math.floor(adjusted / 15);
        map[degree] = segments[index];
    }

    return map;
}

// Validate the mappings
console.log('🔍 Validating Wheel Segment Mappings...\n');

const visualMap = createSegmentMap();
const mismatches = [];

// Check each degree
for (let degree = 0; degree < 360; degree++) {
    const segment = Math.floor((degree + 7.5) / 15);
    const logicResult = segmentOutcomes[segment];
    const visualResult = visualMap[degree];
    
    if (logicResult !== visualResult) {
        mismatches.push({
            degree: degree,
            segment: segment,
            logic: logicResult,
            visual: visualResult
        });
    }
}

// Report results
if (mismatches.length === 0) {
    console.log('✅ All mappings are correct!');
} else {
    console.log(`❌ Found ${mismatches.length} mismatches:\n`);
    
    // Group mismatches by segment for easier reading
    const segmentMismatches = {};
    mismatches.forEach(m => {
        if (!segmentMismatches[m.segment]) {
            segmentMismatches[m.segment] = [];
        }
        segmentMismatches[m.segment].push(m);
    });
    
    Object.keys(segmentMismatches).forEach(segment => {
        const matches = segmentMismatches[segment];
        const first = matches[0];
        const degreeRange = `${matches[0].degree}°-${matches[matches.length-1].degree}°`;
        
        console.log(`Segment ${segment} (${degreeRange}):`);
        console.log(`  Logic says: "${first.logic}"`);
        console.log(`  Visual shows: "${first.visual}"`);
        console.log(`  Affected degrees: ${matches.length}`);
        console.log('');
    });
    
    // Show the fix needed
    console.log('🔧 To fix, update segmentOutcomes in wheel-minimal.js:');
    Object.keys(segmentMismatches).forEach(segment => {
        const visual = segmentMismatches[segment][0].visual;
        console.log(`  ${segment}: '${visual}',  // Change from '${segmentMismatches[segment][0].logic}' to '${visual}'`);
    });
}
