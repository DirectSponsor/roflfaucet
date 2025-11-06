// Minimal Wheel JS - Only essential DOM manipulation

// ====== PROBABILITY SYSTEM - ENGAGEMENT FOCUSED ======
// Array of segment numbers - balanced for slow balance growth and engagement
const SEGMENTS = [
    // LOSE segments (226 total - 56.5%) - Further reduced by 16 for better player experience
    5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5, // 55 × segment 5 (LOSE) - reduced by 4
    12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12, // 55 × segment 12 (LOSE) - reduced by 4
    15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15, // 55 × segment 15 (LOSE) - reduced by 4
    19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19, // 60 × segment 19 (LOSE) - reduced by 4
    23, // 1 × segment 23 (LOSE)

    // REFUND wins (20 total - 5%) - Increased to reduce loss streaks
    18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18, // 20 × segment 18 (REFUND/1X) - increased by 10

    // 1X/2X wins (25 total - 6.25%) - Note: segment 6 actually maps to 2X in outcomes
    6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6, // 20 × segment 6 (maps to 2X, not 1X!)

    // 2X wins (95 total - 23.75%) - Increased by 5
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, // 95 × segment 0 (2X) - increased by 5

    // 3X wins (14 total - 3.5%)
    4,4,4,4,4,4,4,  // 7 × segment 4 (3X) - increased by 1
    14,14,14,14,14,14,14,  // 7 × segment 14 (3X) - increased by 1

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
// Total: 400 segments = 56.5% LOSE, 43.5% WIN (~109% RTP for better engagement)
// 174 winning outcomes out of 400 spins = improved win rate from 39.5% to 43.5%
// Expected: Players win roughly 2 out of 5 spins with better positive RTP
// RTP: ~109% means players get back 109 tokens for every 100 tokens bet
// Changes: -16 losses (4 each from segments 5,12,15,19), +10 REFUND (1X), +2 more 3X wins
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
    
    // Initialize sound button appearance
    const soundBtn = document.getElementById('sound-btn');
    if (soundBtn && wheelAnimation) {
        soundBtn.textContent = wheelAnimation.soundEnabled ? '🔊' : '🔇';
        soundBtn.title = wheelAnimation.soundEnabled ? 'Sound On (Click to Mute)' : 'Sound Off (Click to Enable)';
    }
    
    console.log('🎡 Minimal Wheel Ready');
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
    
    // Update status to show spinning with animated dots
    const statusElement = document.getElementById('status-text');
    if (statusElement) {
        statusElement.innerHTML = '<span class="spinning-dots"><span>•</span><span>•</span><span>•</span></span>';
    }
    
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

// Toggle wheel sound function - called by HTML button
function toggleWheelSound() {
    if (wheelAnimation) {
        const soundEnabled = wheelAnimation.toggleSound();
        
        // Update button appearance
        const soundBtn = document.getElementById('sound-btn');
        if (soundBtn) {
            soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
            soundBtn.title = soundEnabled ? 'Sound On (Click to Mute)' : 'Sound Off (Click to Enable)';
        }
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
        this.currentBet = this.loadLastBet(); // Load saved bet amount
        this.soundEnabled = true; // Default sound enabled
        this.initSound(); // Initialize sound system
    }
    
    initSound() {
        // Check localStorage for sound preference
        const soundDisabled = localStorage.getItem('wheel_sound_disabled');
        if (soundDisabled === 'true') {
            this.soundEnabled = false;
        }
        
        // Get audio element reference for spinning (keep existing system)
        this.spinningAudio = document.getElementById('audio-spinning');
        if (this.spinningAudio) {
            this.spinningAudio.loop = false; // Don't loop - we'll adjust speed instead
            this.spinningAudio.volume = 0.6; // Set comfortable volume
            this.originalSoundDuration = 5.224; // Duration of spinning.mp3 in seconds
        }
        
        // Initialize Web Audio API for reliable payout sounds (new)
        this.audioContext = null;
        this.payoutSounds = {};
        
        // Initialize audio context on first user interaction
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.loadPayoutSounds();
            }
        }, { once: true });
    }
    
    loadPayoutSounds() {
        // Load reliable slot-style procedural sounds for payouts only
        this.payoutSounds = {
            coinDrop: this.createTone(800, 0.05, 'sine'),   // Coin drop sound 
            win: this.createTone(440, 0.3, 'sine'),         // Win sound
            jackpot: this.createTone(660, 0.8, 'sine')      // Jackpot sound
        };
    }
    
    createTone(frequency, duration, type = 'sine') {
        // Create a simple synthetic sound (adapted from slots)
        return () => {
            if (!this.audioContext || !this.soundEnabled) return;
            
            try {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = type;
                
                gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + duration);
            } catch (error) {
                console.log('🔊 Payout sound generation error:', error);
            }
        };
    }
    
    playPayoutSound(soundName) {
        if (this.payoutSounds[soundName]) {
            this.payoutSounds[soundName]();
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('wheel_sound_disabled', !this.soundEnabled);
        
        if (!this.soundEnabled) {
            this.stopSpinningSound();
        }
        
        console.log(`🔊 Wheel sound ${this.soundEnabled ? 'enabled' : 'disabled'}`);
        return this.soundEnabled;
    }
    
    playSpinningSound(duration) {
        if (!this.soundEnabled || !this.spinningAudio || !this.originalSoundDuration) return;
        
        try {
            // Calculate playback rate to match spin duration
            // If spin is longer than sound: slow down (rate < 1.0)
            // If spin is shorter than sound: speed up (rate > 1.0)
            const playbackRate = this.originalSoundDuration / duration;
            
            // Clamp playback rate to reasonable limits (0.5x to 2.0x)
            const clampedRate = Math.max(0.5, Math.min(2.0, playbackRate));
            
            // Reset audio and set playback rate
            this.spinningAudio.currentTime = 0;
            this.spinningAudio.playbackRate = clampedRate;
            
            console.log(`🔊 Spin duration: ${duration}s, Sound duration: ${this.originalSoundDuration}s, Playback rate: ${clampedRate.toFixed(2)}x`);
            
            // Start playing
            const playPromise = this.spinningAudio.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('🔊 Audio autoplay blocked:', error);
                });
            }
            
            // The audio will naturally end at the right time due to playback rate
            // But set a safety timeout in case of issues
            this.soundTimeout = setTimeout(() => {
                this.stopSpinningSound();
            }, (duration + 0.5) * 1000); // Add 0.5s buffer
            
        } catch (error) {
            console.log('🔊 Audio play error:', error);
        }
    }
    
    stopSpinningSound() {
        if (this.spinningAudio) {
            if (!this.spinningAudio.paused) {
                this.spinningAudio.pause();
            }
            this.spinningAudio.currentTime = 0;
            this.spinningAudio.playbackRate = 1.0; // Reset to normal speed
        }
        
        if (this.soundTimeout) {
            clearTimeout(this.soundTimeout);
            this.soundTimeout = null;
        }
    }

    init() {
        const betElement = document.getElementById('current-bet');
        if (betElement) {
            betElement.textContent = this.currentBet;
        }
    }
    
    loadLastBet() {
        // Load the last bet amount from localStorage, default to 1
        const savedBet = localStorage.getItem('wheelLastBet');
        const lastBet = savedBet ? parseInt(savedBet) : 1;
        console.log(`🎡 Loaded last bet: ${lastBet}`);
        return Math.max(1, lastBet); // Ensure minimum bet is 1
    }
    
    saveLastBet() {
        // Save current bet amount to localStorage
        localStorage.setItem('wheelLastBet', this.currentBet.toString());
        console.log(`🎡 Saved bet amount: ${this.currentBet}`);
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
            
            // 🔊 Start spinning sound for exact duration
            this.playSpinningSound(duration);
            
            wheel.style.transition = `transform ${duration}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
            wheel.style.transform = `rotate(${newRotation}deg)`;

            // Wait for animation to complete
            setTimeout(() => {
                // Ensure sound is stopped when animation ends
                this.stopSpinningSound();
                resolve();
            }, duration * 1000);
        });
    }

    showResult(outcome, finalPosition, payout) {
        const statusElement = document.getElementById('status-text');
        if (statusElement) {
            statusElement.textContent = `Result: ${outcome} (${finalPosition}°)`;
        }

        // Use the animated payout system
        this.animateWinPayout(payout, outcome);
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
            this.saveLastBet(); // Save the new bet amount
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
            this.saveLastBet(); // Save the new bet amount
            this.updateBetDisplay();
        }
    }

    updateBetDisplay() {
        const betElement = document.getElementById('current-bet');
        if (betElement) {
            betElement.textContent = this.currentBet;
        }
    }
    
    // Payout animation system (exactly like slots - simple and fast)
    animateWinPayout(totalPayout, outcome) {
        // Skip animation for non-wins
        if (totalPayout <= 0) {
            const lastWinElement = document.getElementById('last-win');
            if (lastWinElement) {
                lastWinElement.textContent = '0';
            }
            return;
        }
        
        // Play win sounds (single sound, not repeated)
        this.playWinSound(outcome, totalPayout);
        
        // Animate the payout counter with fixed short duration like slots
        const lastWinElement = document.getElementById('last-win');
        if (lastWinElement) {
            lastWinElement.classList.add('win-animation');
            
            // Use fixed 1000ms duration like slots (not variable)
            this.animateCounter(lastWinElement, 0, totalPayout, 1000);
            
            // Remove animation class after animation completes
            setTimeout(() => {
                lastWinElement.classList.remove('win-animation');
            }, 1500); // Match slots timing exactly
        }
        
        // Use simple slots-style coin animation
        this.animateCoins(totalPayout);
        
        console.log(`🎉 WHEEL WIN! ${outcome} - Payout: ${totalPayout} coins`);
        
        // Special jackpot message
        if (outcome === 'JACKPOT') {
            console.log('🎡💰 JACKPOT! MAXIMUM PAYOUT! 💰🎡');
        }
    }
    
    playWinSound(outcome, totalPayout) {
        // Use reliable payout sounds instead of problematic Web Audio generation
        if (!this.soundEnabled) return;
        
        // Different sounds for different win types using reliable system
        if (outcome === 'JACKPOT') {
            this.playPayoutSound('jackpot');
        } else if (totalPayout >= 20) {
            this.playPayoutSound('jackpot'); // Use jackpot sound for big wins
        } else if (totalPayout > 0) {
            this.playPayoutSound('win');
        }
        // No sound for losses or refunds
    }
    
    // Removed complex calculateAnimationDuration - now using fixed slots-style timing
    
    // Removed playCoinDropSound - now calling playPayoutSound('coinDrop') directly
    
    animateCounter(element, start, end, duration) {
        const startTime = performance.now();
        const range = end - start;
        
        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use easing function for smooth animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(start + (range * easeOut));
            
            element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = end; // Ensure final value is exact
            }
        };
        
        requestAnimationFrame(updateCounter);
    }
    
    animateCoins(totalPayout) {
        // Simple coin drop animation exactly like slots
        const coinDrops = Math.min(totalPayout, 20); // Max 20 coins for performance (same as slots)
        
        for (let i = 0; i < coinDrops; i++) {
            setTimeout(() => {
                this.playPayoutSound('coinDrop'); // Use reliable coin drop sound
                this.createCoinEffect();
            }, i * 50); // Fixed 50ms interval like slots
        }
    }
    
    createCoinEffect() {
        const coin = document.createElement('div');
        coin.className = 'coin-effect';
        coin.innerHTML = '🪙';
        
        // Position randomly around the last win display
        const lastWinElement = document.getElementById('last-win');
        if (lastWinElement) {
            const rect = lastWinElement.getBoundingClientRect();
            coin.style.position = 'fixed';
            coin.style.left = (rect.left + Math.random() * rect.width) + 'px';
            coin.style.top = (rect.top - 20) + 'px';
            coin.style.zIndex = '1000';
            coin.style.fontSize = '20px';
            coin.style.pointerEvents = 'none';
            
            document.body.appendChild(coin);
            
            // Animate coin falling
            coin.animate([
                { transform: 'translateY(0px) rotate(0deg)', opacity: 1 },
                { transform: 'translateY(100px) rotate(360deg)', opacity: 0 }
            ], {
                duration: 1200,
                easing: 'ease-in'
            }).onfinish = () => {
                coin.remove();
            };
        }
    }
}
