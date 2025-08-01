// RTP Calculator for Wheel of Wealth
// This calculates what probability distribution gives exactly 100% RTP

// Current wheel segments (24 segments, 0-23)
const segments = ['2X', '4X', '5X', '2X', '3X', 'LOSE',
    '2X', '4X', '3X', '2X', '6X', '5X',
    'LOSE', '20X', '3X', 'LOSE', '5X', '2X',
    'REFUND', 'LOSE', '3X', '4X', 'JACKPOT', 'LOSE'
];

// Payout multipliers
const payouts = {
    'LOSE': 0,
    'REFUND': 1,
    '2X': 2,
    '3X': 3,
    '4X': 4,
    '5X': 5,
    '6X': 6,
    '20X': 20,
    '50X': 50,
    'JACKPOT': 50
};

// Count occurrences of each outcome on the wheel
const outcomeCounts = {};
segments.forEach(outcome => {
    outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;
});

console.log('=== WHEEL ANALYSIS ===');
console.log('Segments on wheel:', segments.length);
console.log('Outcome counts:', outcomeCounts);

// Calculate what each outcome would contribute to RTP if all segments were equally likely
console.log('\n=== EQUAL PROBABILITY RTP CALCULATION ===');
let totalRTP = 0;
Object.keys(outcomeCounts).forEach(outcome => {
    const count = outcomeCounts[outcome];
    const payout = payouts[outcome];
    const probability = count / 24; // out of 24 segments
    const contribution = probability * payout;
    totalRTP += contribution;
    console.log(`${outcome}: ${count}/24 (${(probability * 100).toFixed(1)}%) × ${payout}x = ${contribution.toFixed(3)} RTP`);
});

console.log(`\nTotal RTP with equal probabilities: ${(totalRTP * 100).toFixed(1)}%`);

// Now calculate what distribution we need for exactly 100% RTP
console.log('\n=== 100% RTP CALCULATION ===');
console.log('Target: 100 characters representing 100% probability');

// We need to solve: sum(probability_i * payout_i) = 1.0
// Where sum(probability_i) = 1.0 (100 characters total)

// Let's use a simple approach: start with equal distribution and adjust
const targetRTP = 1.0; // 100%
let distribution = {}; // How many of each segment (out of 100 characters)

// Start with equal distribution based on wheel layout
Object.keys(outcomeCounts).forEach(outcome => {
    distribution[outcome] = Math.round((outcomeCounts[outcome] / 24) * 100);
});

// Calculate current RTP with this distribution
function calculateRTP(dist) {
    let rtp = 0;
    Object.keys(dist).forEach(outcome => {
        const probability = dist[outcome] / 100;
        const payout = payouts[outcome];
        rtp += probability * payout;
    });
    return rtp;
}

// Adjust distribution to hit exactly 100% RTP
console.log('\nInitial distribution (out of 100):');
Object.keys(distribution).forEach(outcome => {
    console.log(`${outcome}: ${distribution[outcome]} (${distribution[outcome]}%)`);
});

let currentRTP = calculateRTP(distribution);
console.log(`Initial RTP: ${(currentRTP * 100).toFixed(2)}%`);

// Simple adjustment: if RTP is too low, reduce LOSE and increase wins
// If RTP is too high, increase LOSE and reduce wins
let iterations = 0;
while (Math.abs(currentRTP - targetRTP) > 0.001 && iterations < 1000) {
    if (currentRTP < targetRTP) {
        // Need more wins - move 1 from LOSE to 2X (lowest win)
        if (distribution['LOSE'] > 0) {
            distribution['LOSE']--;
            distribution['2X']++;
        }
    } else {
        // Need fewer wins - move 1 from 2X to LOSE
        if (distribution['2X'] > 0) {
            distribution['2X']--;
            distribution['LOSE']++;
        }
    }
    currentRTP = calculateRTP(distribution);
    iterations++;
}

console.log(`\nAfter ${iterations} iterations:`);
console.log(`Final RTP: ${(currentRTP * 100).toFixed(3)}%`);

console.log('\nFinal distribution for 100% RTP:');
let totalCount = 0;
Object.keys(distribution).forEach(outcome => {
    console.log(`${outcome}: ${distribution[outcome]} characters (${distribution[outcome]}%)`);
    totalCount += distribution[outcome];
});
console.log(`Total characters: ${totalCount}`);

// Generate the actual SEGMENTS string
function generateSegmentsString(dist) {
    let segmentString = '';
    let segmentIndex = 0;
    
    // Map outcomes to segment numbers
    const outcomeToSegments = {};
    segments.forEach((outcome, index) => {
        if (!outcomeToSegments[outcome]) {
            outcomeToSegments[outcome] = [];
        }
        outcomeToSegments[outcome].push(index);
    });
    
    // For each outcome, add the required number of characters
    Object.keys(dist).forEach(outcome => {
        const count = dist[outcome];
        const segmentNumbers = outcomeToSegments[outcome];
        
        for (let i = 0; i < count; i++) {
            const segmentNum = segmentNumbers[i % segmentNumbers.length];
            if (segmentNum < 10) {
                segmentString += segmentNum.toString();
            } else {
                segmentString += String.fromCharCode(65 + segmentNum - 10); // A=10, B=11, etc.
            }
        }
    });
    
    return segmentString;
}

const segmentsString = generateSegmentsString(distribution);
console.log(`\nGenerated SEGMENTS string (${segmentsString.length} chars):`);
console.log(`"${segmentsString}"`);

// Verify the string
console.log('\nVerification:');
const charCounts = {};
for (let char of segmentsString) {
    charCounts[char] = (charCounts[char] || 0) + 1;
}
console.log('Character counts:', charCounts);
