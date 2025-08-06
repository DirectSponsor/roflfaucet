// RTP Calculator for Slot Machine
// This calculates the theoretical Return to Player percentage based on the actual reel structure

// Virtual reel lists from slots.js
const virtualReelList1 = [
    // High frequency positions (common symbols)
    0, 0, 0,           // Watermelon (position 0) - 3 entries
    2, 2, 2, 2, 2,     // Banana (position 2) - 5 entries  
    4, 4, 4, 4,        // Cherries (position 4) - 4 entries
    12, 12, 12,        // Watermelon (position 12) - 3 entries
    14, 14, 14,        // Banana (position 14) - 3 entries
    16, 16,            // Cherries (position 16) - 2 entries
    
    // Medium frequency positions
    6, 6, 6,           // Seven (position 6) - 3 entries
    18,                // Seven (position 18) - 1 entry
    8,                 // Bar (position 8) - 1 entry
    
    // Low frequency positions  
    10, 10,            // BigWin (position 10) - 2 entries
    
    // Blank positions (in-between stops)
    1, 3, 5, 7, 9, 11  // Various blank positions - 6 entries
];

const virtualReelList2 = [
    // High frequency positions (common symbols)
    0, 0, 0, 0,        // Watermelon (position 0) - 4 entries
    2, 2, 2, 2,        // Banana (position 2) - 4 entries
    4, 4, 4, 4,        // Cherries (position 4) - 4 entries
    12, 12, 12,        // Watermelon (position 12) - 3 entries
    14, 14, 14,        // Banana (position 14) - 3 entries
    16, 16,            // Cherries (position 16) - 2 entries
    
    // Medium frequency positions
    6, 6,              // Seven (position 6) - 2 entries
    18,                // Seven (position 18) - 1 entry
    8, 8,              // Bar (position 8) - 2 entries
    
    // Low frequency positions  
    10, 10,            // BigWin (position 10) - 2 entries
    
    // Blank positions (in-between stops)
    1, 3, 5, 7, 9, 11  // Various blank positions - 6 entries
];

const virtualReelList3 = [
    // High frequency positions (common symbols)
    0, 0, 0, 0,        // Watermelon (position 0) - 4 entries
    2, 2, 2, 2, 2,     // Banana (position 2) - 5 entries  
    4, 4, 4,           // Cherries (position 4) - 3 entries
    12, 12, 12,        // Watermelon (position 12) - 3 entries
    14, 14, 14,        // Banana (position 14) - 3 entries
    16, 16,            // Cherries (position 16) - 2 entries
    
    // Medium frequency positions
    6, 6,              // Seven (position 6) - 2 entries
    18, 18,            // Seven (position 18) - 2 entries
    8,                 // Bar (position 8) - 1 entry
    
    // Low frequency positions  
    10, 10,            // BigWin (position 10) - 2 entries
    
    // Blank positions (in-between stops)
    1, 3, 5, 7, 9, 11  // Various blank positions - 6 entries
];

// Position to symbol mapping
const positionMap = {
    0: 'watermelon',    
    1: 'blank',         
    2: 'banana',        
    3: 'blank',         
    4: 'cherries',      
    5: 'blank',         
    6: 'seven',         
    7: 'blank',         
    8: 'bar',           
    9: 'blank',         
    10: 'bigwin',       
    11: 'blank',        
    12: 'watermelon',   
    13: 'blank',        
    14: 'banana',       
    15: 'blank',        
    16: 'cherries',     
    17: 'blank',        
    18: 'seven',        
    19: 'blank'         
};

// Payout table
const payoutTable = {
    'three_cherries': 12,     
    'three_bigwin': 400,      
    'three_banana': 10,       
    'three_bar': 75,          
    'three_watermelon': 8,    
    'three_seven': 35,        
    'any_fruit': 4,           
    'bar_bigwin_combo': 15,   
    'three_blanks': 2         
};

// Calculate symbol probabilities for each reel
function calculateSymbolProbabilities() {
    const reels = [virtualReelList1, virtualReelList2, virtualReelList3];
    const probabilities = [];
    
    for (let reelIndex = 0; reelIndex < 3; reelIndex++) {
        const reel = reels[reelIndex];
        const symbolCounts = {};
        
        // Count occurrences of each symbol
        reel.forEach(position => {
            const symbol = positionMap[position];
            symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
        });
        
        // Convert to probabilities
        const total = reel.length;
        const symbolProbs = {};
        for (const [symbol, count] of Object.entries(symbolCounts)) {
            symbolProbs[symbol] = count / total;
        }
        
        probabilities.push(symbolProbs);
        
        console.log(`Reel ${reelIndex + 1} (${total} total entries):`);
        for (const [symbol, prob] of Object.entries(symbolProbs)) {
            console.log(`  ${symbol}: ${symbolCounts[symbol]} entries (${(prob * 100).toFixed(2)}%)`);
        }
        console.log('');
    }
    
    return probabilities;
}

// Check if combination is a winning one and return win details
function checkWin(symbols) {
    // Check for exact matches first
    if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
        const symbol = symbols[0];
        if (symbol === 'blank') return { type: 'three_blanks', payout: payoutTable.three_blanks };
        if (symbol === 'watermelon') return { type: 'three_watermelon', payout: payoutTable.three_watermelon };
        if (symbol === 'banana') return { type: 'three_banana', payout: payoutTable.three_banana };
        if (symbol === 'cherries') return { type: 'three_cherries', payout: payoutTable.three_cherries };
        if (symbol === 'seven') return { type: 'three_seven', payout: payoutTable.three_seven };
        if (symbol === 'bar') return { type: 'three_bar', payout: payoutTable.three_bar };
        if (symbol === 'bigwin') return { type: 'three_bigwin', payout: payoutTable.three_bigwin };
    }
    
    // Check for bar-bigwin combo
    const reel1BarBigwin = (symbols[0] === 'bar' || symbols[0] === 'bigwin');
    const reel2BarBigwin = (symbols[1] === 'bar' || symbols[1] === 'bigwin');
    
    if (reel1BarBigwin && reel2BarBigwin) {
        return { type: 'bar_bigwin_combo', payout: payoutTable.bar_bigwin_combo };
    }
    
    // Check for any fruit combination
    const fruits = ['watermelon', 'banana', 'cherries'];
    const allFruits = symbols.every(symbol => fruits.includes(symbol));
    if (allFruits && symbols.length === 3) {
        const allSame = symbols[0] === symbols[1] && symbols[1] === symbols[2];
        if (!allSame) {
            return { type: 'any_fruit', payout: payoutTable.any_fruit };
        }
    }
    
    return { type: 'no_win', payout: 0 };
}

// Calculate theoretical RTP
function calculateRTP() {
    const probabilities = calculateSymbolProbabilities();
    let totalExpectedPayout = 0;
    let totalCombinations = 0;
    
    const symbols = ['watermelon', 'banana', 'cherries', 'seven', 'bar', 'bigwin', 'blank'];
    
    // Check all possible combinations
    for (const symbol1 of symbols) {
        for (const symbol2 of symbols) {
            for (const symbol3 of symbols) {
                const prob1 = probabilities[0][symbol1] || 0;
                const prob2 = probabilities[1][symbol2] || 0;
                const prob3 = probabilities[2][symbol3] || 0;
                
                const combinationProbability = prob1 * prob2 * prob3;
                
                if (combinationProbability > 0) {
                    const win = checkWin([symbol1, symbol2, symbol3]);
                    const expectedPayout = win.payout * combinationProbability;
                    totalExpectedPayout += expectedPayout;
                    totalCombinations++;
                    
                    if (win.payout > 0) {
                        console.log(`${symbol1}-${symbol2}-${symbol3}: ${win.type}, payout ${win.payout}x, prob ${(combinationProbability * 100).toFixed(6)}%, expected: ${expectedPayout.toFixed(6)}`);
                    }
                }
            }
        }
    }
    
    // RTP is expected payout divided by bet (1 credit)
    const rtp = totalExpectedPayout / 1;
    
    console.log(`\n=== RTP CALCULATION RESULTS ===`);
    console.log(`Total combinations checked: ${totalCombinations}`);
    console.log(`Total expected payout per spin: ${totalExpectedPayout.toFixed(6)} credits`);
    console.log(`Theoretical RTP: ${(rtp * 100).toFixed(2)}%`);
    
    return rtp;
}

// Run the calculation
console.log('=== SLOT MACHINE RTP ANALYSIS ===\n');
const rtp = calculateRTP();
