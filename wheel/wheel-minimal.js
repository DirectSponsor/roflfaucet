// Minimal Wheel JS - Only essential DOM manipulation

// Initialize wheel logic and animation
let wheelLogic, wheelAnimation;

document.addEventListener('DOMContentLoaded', function() {
    wheelLogic = new WheelLogic();
    wheelAnimation = new WheelAnimation();
    wheelAnimation.init();
    console.log('🎮 Minimal Wheel Ready');
});

// Spin the wheel
function spinWheel() {
    const spinResult = wheelLogic.calculateSpin();
    const totalSpinDegrees = spinResult.totalSpinDegrees;

    wheelAnimation.animateRotation(totalSpinDegrees).then(() => {
        wheelAnimation.showResult(
            spinResult.outcome,
            spinResult.finalPosition,
            wheelLogic.calculatePayout(spinResult.outcome, wheelAnimation.currentBet)
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

// Handle faucet claim
function handleFaucetClaim() {
    alert('Faucet claim placeholder');
}

// Simple Wheel Logic class
class WheelLogic {
    constructor() {
        this.currentPosition = 0;
        this.segmentMap = this.createSegmentMap();
    }

calculateSpin() {
        const stepDegrees = 15; // Testing: always advance by 15 degrees
        const total = this.currentPosition + stepDegrees;
        const finalPosition = total % 360;

        this.currentPosition = finalPosition;

return {
            totalSpinDegrees: stepDegrees,  // Always rotate by 15 degrees for testing
            finalPosition,
            outcome: this.segmentMap[finalPosition]
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
