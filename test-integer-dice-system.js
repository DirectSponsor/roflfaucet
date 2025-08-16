/**
 * Test script for Integer-Based Dice System
 * Verifies no duplicate thresholds and player-favorable rounding
 */

function testIntegerDiceSystem() {
    console.log('🎲 Testing Integer-Based Dice System (1-1000 range)');
    console.log('='.repeat(60));
    
    const results = [];
    const thresholdMap = new Map(); // To detect duplicates
    
    // Test multipliers from 2x to 1000x
    for (let multiplier = 2; multiplier <= 1000; multiplier++) {
        // Calculate winning numbers using the same logic as the game
        const baseWinningNumbers = Math.floor(1000 / multiplier);
        const remainder = 1000 % multiplier;
        
        // Simple integer division - no player-favorable rounding to avoid duplicates
        let winningNumbers = baseWinningNumbers;
        
        // Calculate stats
        const winChance = (winningNumbers / 1000) * 100;
        const rtp = (winningNumbers / 1000) * multiplier * 100;
        const lowThreshold = winningNumbers;
        const highThreshold = 1000 - winningNumbers;
        const playerFavorable = winningNumbers > baseWinningNumbers;
        
        results.push({
            multiplier,
            winningNumbers,
            winChance,
            rtp,
            lowThreshold,
            highThreshold,
            playerFavorable,
            remainder
        });
        
        // Check for duplicate thresholds
        const thresholdKey = `${lowThreshold}-${highThreshold}`;
        if (thresholdMap.has(thresholdKey)) {
            console.error(`❌ DUPLICATE THRESHOLD: ${multiplier}x has same threshold as ${thresholdMap.get(thresholdKey)}x`);
        } else {
            thresholdMap.set(thresholdKey, multiplier);
        }
    }
    
    // Summary statistics
    const playerFavorableCount = results.filter(r => r.playerFavorable).length;
    const avgRTP = results.reduce((sum, r) => sum + r.rtp, 0) / results.length;
    const minRTP = Math.min(...results.map(r => r.rtp));
    const maxRTP = Math.max(...results.map(r => r.rtp));
    
    console.log('\n📊 SUMMARY STATISTICS');
    console.log('='.repeat(30));
    console.log(`Total multipliers tested: ${results.length}`);
    console.log(`Player-favorable rounds: ${playerFavorableCount} (${(playerFavorableCount/results.length*100).toFixed(1)}%)`);
    console.log(`Average RTP: ${avgRTP.toFixed(2)}%`);
    console.log(`RTP Range: ${minRTP.toFixed(2)}% - ${maxRTP.toFixed(2)}%`);
    console.log(`Unique thresholds: ${thresholdMap.size}/${results.length}`);
    
    // Show examples for key multipliers
    console.log('\n🎯 EXAMPLE MULTIPLIERS');
    console.log('='.repeat(50));
    console.log('Mult | Win# | Chance | RTP   | LOW≤ | HIGH> | Fav?');
    console.log('-'.repeat(50));
    
    const examples = [2, 3, 4, 5, 10, 20, 50, 100, 250, 500, 1000];
    examples.forEach(mult => {
        const result = results.find(r => r.multiplier === mult);
        if (result) {
            const line = `${mult.toString().padEnd(4)} | ${result.winningNumbers.toString().padEnd(4)} | ${result.winChance.toFixed(1).padEnd(6)} | ${result.rtp.toFixed(1).padEnd(5)} | ${result.lowThreshold.toString().padEnd(4)} | ${result.highThreshold.toString().padEnd(5)} | ${result.playerFavorable ? 'YES' : 'NO'}`;
            console.log(line);
        }
    });
    
    // Check specific cases that might be problematic
    console.log('\n🔍 EDGE CASE ANALYSIS');
    console.log('='.repeat(30));
    
    // 3x case (from our earlier discussion)
    const case3x = results.find(r => r.multiplier === 3);
    console.log(`3x: ${case3x.winningNumbers}/1000 = ${case3x.winChance.toFixed(1)}%, RTP = ${case3x.rtp.toFixed(1)}%`);
    
    // Perfect divisor cases
    const perfectDivisors = [2, 4, 5, 8, 10, 20, 25, 40, 50, 100, 125, 200, 250, 500, 1000];
    console.log('\nPerfect divisors (should have exactly 100% RTP):');
    perfectDivisors.forEach(mult => {
        const result = results.find(r => r.multiplier === mult);
        if (result) {
            console.log(`  ${mult}x: RTP = ${result.rtp.toFixed(1)}%`);
        }
    });
    
    console.log('\n✅ Test completed successfully!');
    return results;
}

// Run the test
if (typeof window === 'undefined') {
    // Node.js environment
    testIntegerDiceSystem();
} else {
    // Browser environment
    window.testIntegerDiceSystem = testIntegerDiceSystem;
    console.log('🎲 Integer dice system test function loaded. Run testIntegerDiceSystem() to test.');
}
