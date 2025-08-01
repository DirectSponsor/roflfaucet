// Minimal Wheel JS - Only essential DOM manipulation

// ====== SIMPLE PROBABILITY SYSTEM ======
// Array of segment numbers - 75% LOSE segments, 25% others
const SEGMENTS = [
    // LOSE segments (75 total)
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,  // 15 × segment 5
    12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,  // 15 × segment 12
    15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,  // 15 × segment 15
    19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,  // 15 × segment 19
    23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,  // 15 × segment 23
    // Win segments (25 total)
    0,0,0,0,3,3,3,3,6,6,6,6,9,9,9,9,17,17,17,17,  // 20 × 2X wins
    22,  // 1 × JACKPOT
    13,  // 1 × 20X
    10,10,  // 2 × 6X
    18  // 1 × REFUND
];
// Total: 100 segments = easy percentage control
// ============================================

// Initialize wheel logic and animation
let wheelLogic, wheelAnimation, balanceSystem;

document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Initialize the unified balance system
        balanceSystem = new UnifiedBalanceSystem();
        
        // Load initial balance and update display
        const initialBalance = await balanceSystem.getBalance();
        console.log('🎮 Initial balance loaded:', initialBalance);
        
        // Update balance display
        const balanceEl = document.getElementById('current-balance');
        if (balanceEl) balanceEl.textContent = initialBalance;
        
    } catch (error) {
        console.error('💥 Failed to initialize balance system:', error);
        // Fallback to simple guest mode if unified system fails
        balanceSystem = {
            balance: 100,
            async getBalance() { return this.balance; },
            async addBalance(amount, source, description) {
                this.balance += amount;
                return { success: true, balance: this.balance };
            },
            async subtractBalance(amount, source, description) {
                if (this.balance >= amount) {
                    this.balance -= amount;
                    return { success: true, balance: this.balance };
                }
                return { success: false, error: 'Insufficient balance', balance: this.balance };
            }
        };
    }
    
    wheelLogic = new WheelLogic();
    wheelAnimation = new WheelAnimation();
    wheelAnimation.init();
    console.log('🎮 Minimal Wheel Ready');
});

// Spin the wheel
async function spinWheel() {
    if (!balanceSystem) {
        console.error('Balance system not ready');
        return;
    }
    
    const currentBet = wheelAnimation.currentBet;
    
    // Check if player has enough balance
    const currentBalance = await balanceSystem.getBalance();
    if (currentBalance < currentBet) {
        showInsufficientBalanceDialog('wheel');
        return;
    }
    
    // Subtract bet amount
    const betResult = await balanceSystem.subtractBalance(currentBet, 'wheel_bet', `Wheel spin bet: ${currentBet}`);
    if (!betResult.success) {
        alert('Failed to place bet: ' + betResult.error);
        return;
    }
    
    // Update balance display
    const balanceEl = document.getElementById('current-balance');
    if (balanceEl) balanceEl.textContent = betResult.balance;
    
    const spinResult = wheelLogic.calculateSpin();
    const totalSpinDegrees = spinResult.totalSpinDegrees;
    const payout = wheelLogic.calculatePayout(spinResult.outcome, currentBet);

    wheelAnimation.animateRotation(totalSpinDegrees).then(async () => {
        // Handle winnings
        if (payout > 0) {
            const winResult = await balanceSystem.addBalance(payout, 'wheel_win', `Wheel win: ${spinResult.outcome} × ${currentBet} = ${payout}`);
            if (winResult.success) {
                // Update balance display
                if (balanceEl) balanceEl.textContent = winResult.balance;
            }
        }
        
        wheelAnimation.showResult(
            spinResult.outcome,
            spinResult.finalPosition,
            payout
        );
    });
}

// Increase bet function
function increaseBet() {
    if (wheelAnimation) {
        wheelAnimation.increaseBet();
    }
}

// Decrease bet function
function decreaseBet() {
    if (wheelAnimation) {
        wheelAnimation.decreaseBet();
    }
}

// Handle faucet claim - uses site-utils function
// The handleFaucetClaim function is provided by site-utils.js

// Simple Wheel Logic class
class WheelLogic {
    constructor() {
        this.currentPosition = 0;
        // No segmentMap needed - using direct segment outcomes
    }

    calculateSpin() {
        // Pick random segment from weighted SEGMENTS array
        const randomIndex = Math.floor(Math.random() * SEGMENTS.length);
        const segment = SEGMENTS[randomIndex]; // Direct segment number

        // Get the outcome directly from segment number
        const segmentOutcomes = {
            0: '2X', 1: '4X', 2: '5X', 3: '2X', 4: '3X', 5: 'LOSE',
            6: '2X', 7: '4X', 8: '3X', 9: '2X', 10: '6X', 11: '5X',
            12: 'LOSE', 13: '20X', 14: '3X', 15: 'LOSE', 16: '5X', 17: '2X',
            18: 'REFUND', 19: 'LOSE', 20: '3X', 21: '4X', 22: 'JACKPOT', 23: 'LOSE'
        };
        const finalOutcome = segmentOutcomes[segment];

        // Pick random degree within that segment for visual spinning
        // Segment center is at (segment * 15), range is ±7° around center (avoid boundaries)
        const segmentCenter = segment * 15;
        const randomOffset = Math.floor(Math.random() * 15) - 7; // -7 to +7 (integer degrees only)
        const targetDegree = (segmentCenter + randomOffset + 360) % 360; // Handle negative wrap

        // Add extra rotations for visual effect (at least 1 full rotation)
        const extraRotations = Math.floor(Math.random() * 3) + 1;
        const totalSpinDegrees = (targetDegree - this.currentPosition) + (extraRotations * 360);
        
        // Update current position to the target for next spin
        this.currentPosition = targetDegree;

        console.log(`🎯 Segment ${segment} at ${targetDegree}° → ${finalOutcome}, spinning ${totalSpinDegrees}° total`);
        console.log(`📊 Selected from SEGMENTS[${randomIndex}] = ${segment}, isLoseSegment: ${[5,12,15,19,23].includes(segment)}`);

        return {
            totalSpinDegrees,
            finalPosition: targetDegree,
            outcome: finalOutcome
        };
    }

    createSegmentMap() {
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

    calculatePayout(outcome, bet) {
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

        return (payouts[outcome] || 0) * bet;
    }
}

// Very Simple Wheel Animation class
class WheelAnimation {
    constructor() {
        this.spinning = false;
        this.currentBet = 1;
    }

    init() {
        const betElement = document.getElementById('current-bet');
        if (betElement) {
            betElement.textContent = this.currentBet;
        }
    }

    animateRotation(degrees) {
        return new Promise((resolve) => {
            const wheel = document.getElementById('wheel-image');
            if (!wheel) return resolve();

            // Get current rotation and add the new degrees
            const currentTransform = wheel.style.transform || 'rotate(0deg)';
            const currentRotation = parseFloat(currentTransform.match(/rotate\(([^)]+)deg\)/)[1] || '0');
            const newRotation = currentRotation + degrees;

            // Just rotate by the degrees given - no other logic
            wheel.style.transition = 'transform 1s ease';
            wheel.style.transform = `rotate(${newRotation}deg)`;

            setTimeout(resolve, 1000);
        });
    }

    showResult(outcome, finalPosition, payout) {
        const statusElement = document.getElementById('status-text');
        if (statusElement) {
            statusElement.textContent = `Result: ${outcome} (${finalPosition}°)`;
        }

        const lastWinElement = document.getElementById('last-win');
        if (lastWinElement) {
            lastWinElement.textContent = payout;
        }
    }

    increaseBet() {
        if (this.currentBet < 10) {
            this.currentBet += 1;
            this.updateBetDisplay();
        }
    }

    decreaseBet() {
        if (this.currentBet > 1) {
            this.currentBet -= 1;
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
