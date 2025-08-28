// Minimal Wheel JS - Only essential DOM manipulation

// ====== PROBABILITY SYSTEM - ENGAGEMENT FOCUSED ======
// Array of segment numbers - balanced for slow balance growth and engagement
const SEGMENTS = [
    // LOSE segments (257 total - 64.25%)
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5, // 64 × segment 5 (LOSE)
    12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12, // 64 × segment 12 (LOSE)
    15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15, // 64 × segment 15 (LOSE)
    19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19, // 64 × segment 19 (LOSE)
    23, // 1 × segment 23 (LOSE)

    // 1X wins (20 total - 5%)
    6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6, // 20 × segment 6 (1X)

    // 2X wins (90 total - 22.5%)
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, // 90 × segment 0 (2X)

    // 3X wins (12 total - 3%)
    4,4,4,4,4,4,  // 6 × segment 4 (3X)
    14,14,14,14,14,14,  // 6 × segment 14 (3X)

    // 4X wins (8 total - 2%)
    1,1,1,1,  // 4 × segment 1 (4X)
    7,7,7,7,  // 4 × segment 7 (4X)

    // 5X wins (6 total - 1.5%)
    2,2,2,  // 3 × segment 2 (5X)
    11,11,11,  // 3 × segment 11 (5X)

    // 6X wins (4 total - 1%)
    10,10,  // 2 × segment 10 (6X)
    21,21, // 2 × segment 21 (6X)

    // Special wins (3 total - 0.75%)
    22,  // 1 × JACKPOT (50X)
    13,  // 1 × 20X
    17   // 1 × 20X
];
// Total: 400 segments = 64.25% LOSE, 35.75% WIN (103% RTP for better engagement)
// 143 winning outcomes out of 400 spins = improved win rate from 33.75%
// Expected: Players win roughly 1 out of 3 spins with slight positive RTP
// RTP: 103% means players get back 103 tokens for every 100 tokens bet
// ==============================================================

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
    
    // Prevent multiple spins
    if (wheelAnimation && wheelAnimation.spinning) {
        console.log('🎡 Wheel is already spinning, ignoring click');
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
    
    // Set spinning state and disable spin button
    wheelAnimation.spinning = true;
    updateSpinButton();
    
    const spinResult = wheelLogic.calculateSpin();
    const totalSpinDegrees = spinResult.totalSpinDegrees;
    const payout = wheelLogic.calculatePayout(spinResult.outcome, currentBet);

    wheelAnimation.animateRotation(totalSpinDegrees, spinResult.extraRotations).then(async () => {
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
        
        // Re-enable spin button
        wheelAnimation.spinning = false;
        updateSpinButton();
    });
}

// Increase bet function
async function increaseBet() {
    if (wheelAnimation) {
        await wheelAnimation.increaseBet();
    }
}

// Decrease bet function
function decreaseBet() {
    if (wheelAnimation) {
        wheelAnimation.decreaseBet();
    }
}

// Update spin button state
function updateSpinButton() {
    const spinButton = document.getElementById('spin-btn');
    if (!spinButton) return;
    
    if (wheelAnimation && wheelAnimation.spinning) {
        spinButton.disabled = true;
        // Keep same text and icon to prevent table shifting
        spinButton.textContent = '🎡 SPIN';
    } else {
        spinButton.disabled = false;
        spinButton.textContent = '🎡 SPIN';
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
            18: 'REFUND', 19: 'LOSE', 20: '3X', 21: '4X', 22: 'JACKPOT', 23: 'LOSE',
            24: '2X'  // Added missing segment 24
        };
        const finalOutcome = segmentOutcomes[segment];

        // Pick random degree within that segment for visual spinning
        // Segment center is at (segment * 15), range is ±7° around center (avoid boundaries)
        const segmentCenter = segment * 15;
        const randomOffset = Math.floor(Math.random() * 15) - 7; // -7 to +7 (integer degrees only)
        const targetDegree = (segmentCenter + randomOffset + 360) % 360; // Handle negative wrap

        // Add extra rotations for visual effect (at least 1 full rotation)
        const extraRotations = Math.floor(Math.random() * 3) + 3; // 3 to 5 rotations
        const totalSpinDegrees = (targetDegree - this.currentPosition) + (extraRotations * 360);
        
        // Update current position to the target for next spin
        this.currentPosition = targetDegree;

        console.log(`🎯 Segment ${segment} at ${targetDegree}° → ${finalOutcome}, spinning ${totalSpinDegrees}° total`);
        console.log(`📊 Selected from SEGMENTS[${randomIndex}] = ${segment}, isLoseSegment: ${[5,12,15,19,23].includes(segment)}`);

        return {
            totalSpinDegrees,
            finalPosition: targetDegree,
            outcome: finalOutcome,
            extraRotations: extraRotations
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
            '1X': 1,
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

    animateRotation(degrees, extraRotations = 2) {
        return new Promise((resolve) => {
            const wheel = document.getElementById('wheel-image');
            if (!wheel) return resolve();

            // Get current rotation and add the new degrees
            const currentTransform = wheel.style.transform || 'rotate(0deg)';
            const currentRotation = parseFloat(currentTransform.match(/rotate\(([^)]+)deg\)/)[1] || '0');
            const newRotation = currentRotation + degrees;

            // Calculate animation duration based on rotations (3-6 seconds)
            const duration = 3 + (extraRotations * 0.8); // Base 3s + 0.8s per extra rotation
            wheel.style.transition = `transform ${duration}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
            wheel.style.transform = `rotate(${newRotation}deg)`;

            // Wait for animation to complete
            setTimeout(resolve, duration * 1000);
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

    async increaseBet() {
        // Require levels system - fail clearly if not available
        if (!window.levelsSystem) {
            throw new Error('🎡 ❌ Levels system not available - wheel bet controls broken!');
        }
        
        const maxBet = window.levelsSystem.getMaxBet();
        const newBet = this.currentBet + 1;
        
        if (newBet <= maxBet) {
            this.currentBet = newBet;
            this.updateBetDisplay();
            console.log(`🎡 Bet increased to ${this.currentBet}`);
        } else {
            // Show level restriction modal
            window.levelsSystem.showInsufficientLevelModal(newBet, maxBet);
            console.log(`🎡 Bet blocked: ${newBet} exceeds max bet ${maxBet}`);
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
