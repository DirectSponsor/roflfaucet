/**
 * ROFLFaucet Roll Game - "Roll of Chance"
 * Intelligent roll game with dynamic probability calculations and High/Low mechanics
 */

class RollGame {
    constructor() {
        // Game state
        this.isRolling = false;
        this.isLowMode = true; // true = roll under to win, false = roll over to win
        // Game provides 100% RTP - no house edge in probability calculations
        
        // Game statistics
        this.gameStats = {
            totalRolls: 0,
            totalWagered: 0,
            totalWon: 0,
            wins: 0
        };
        
        // Recent rolls history
        this.recentRolls = [];
        this.maxRecentRolls = 10;
        
        // Audio elements
        this.sounds = {
            roll: document.getElementById('rollSound'),
            win: document.getElementById('winSound'),
            lose: document.getElementById('loseSound')
        };
        
        // Initialize game
        this.init();
    }
    
    init() {
        console.log('🎲 Initializing Roll Game...');
        
        // Wait for UnifiedBalanceSystem to be available
        const initBalance = () => {
            if (typeof UnifiedBalanceSystem !== 'undefined') {
                this.balanceSystem = new UnifiedBalanceSystem();
                this.setupEventListeners();
                this.loadGameStats();
                this.updateDisplay();
                this.updateProbability();
                console.log('✅ Roll Game initialized successfully');
            } else {
                console.log('⏳ Waiting for UnifiedBalanceSystem...');
                setTimeout(initBalance, 100);
            }
        };
        
        initBalance();
    }
    
    setupEventListeners() {
        // Bet amount controls
        document.getElementById('betUp')?.addEventListener('click', () => this.changeBet(1));
        document.getElementById('betDown')?.addEventListener('click', () => this.changeBet(-1));
        document.getElementById('betAmount')?.addEventListener('input', (e) => this.setBet(e.target.value));
        
        // Payout multiplier controls
        document.getElementById('payoutMultiplier')?.addEventListener('input', (e) => this.setPayout(e.target.value));
        
        // High/Low toggle
        document.getElementById('highlowToggle')?.addEventListener('click', () => this.toggleHighLow());
        
        // Roll button
        document.getElementById('rollButton')?.addEventListener('click', () => this.roll());
        
        // Set up periodic balance updates
        if (this.balanceSystem) {
            // Initial setup
            this.refreshBalance();
            
            // Update balance every 5 seconds or when bet amount changes
            this.balanceUpdateInterval = setInterval(() => {
                this.refreshBalance();
            }, 5000);
        }
    }
    
    changeBet(delta) {
        const betInput = document.getElementById('betAmount');
        if (!betInput) return;
        
        const currentBet = parseInt(betInput.value) || 1;
        const newBet = Math.max(1, Math.min(100, currentBet + delta));
        
        betInput.value = newBet;
        this.setBet(newBet);
    }
    
    setBet(amount) {
        let bet = Math.max(1, parseInt(amount) || 1);
        
        // Validate with levels system - no fallbacks, fail if not available
        if (!window.levelsSystem) {
            console.error('🎲 ❌ Levels system not available!');
            return;
        }
        
        const maxBet = window.levelsSystem.getMaxBet();
        if (bet > maxBet) {
            // Show level upgrade modal
            window.levelsSystem.showInsufficientLevelModal(bet, maxBet);
            bet = maxBet; // Cap to current max
        }
        
        document.getElementById('betAmount').value = bet;
        this.updateProbability();
    }
    
    changePayout(delta) {
        const payoutInput = document.getElementById('payoutMultiplier');
        if (!payoutInput) return;
        
        const currentPayout = parseInt(payoutInput.value) || 2;
        
        // Determine step size based on current range
        let stepSize = 1;
        if (currentPayout >= 500) {
            stepSize = 25;  // 500x-1000x: step by 25x
        } else if (currentPayout >= 200) {
            stepSize = 10;  // 200x-499x: step by 10x
        } else if (currentPayout >= 100) {
            stepSize = 5;   // 100x-199x: step by 5x
        } else {
            stepSize = 1;   // 2x-99x: step by 1x
        }
        
        // For transitions, handle them specially
        let newPayout;
        if (delta > 0) {
            // Going up
            if (currentPayout === 99) {
                newPayout = 100; // 99 -> 100
            } else if (currentPayout === 195) {
                newPayout = 200; // 195 -> 200
            } else if (currentPayout === 490) {
                newPayout = 500; // 490 -> 500
            } else {
                newPayout = currentPayout + stepSize;
            }
        } else {
            // Going down
            if (currentPayout === 100) {
                newPayout = 99; // 100 -> 99
            } else if (currentPayout === 200) {
                newPayout = 195; // 200 -> 195
            } else if (currentPayout === 500) {
                newPayout = 490; // 500 -> 490
            } else {
                newPayout = currentPayout - stepSize;
            }
        }
        
        // Apply min/max limits
        newPayout = Math.max(2, Math.min(1000, newPayout));
        
        // Update the input directly and recalculate
        payoutInput.value = newPayout;
        this.updateProbability();
        
        console.log(`🎲 Payout changed: ${currentPayout}x → ${newPayout}x (step: ${stepSize}x)`);
    }
    
    setPayout(amount) {
        let payout = Math.max(2, Math.min(1000, parseInt(amount) || 2));
        
        // Apply dynamic step boundaries - snap to valid multipliers for manual input
        if (payout >= 500) {
            // For 500+, snap to nearest 25
            payout = Math.round(payout / 25) * 25;
        } else if (payout >= 200) {
            // For 200-499, snap to nearest 10
            payout = Math.round(payout / 10) * 10;
        } else if (payout >= 100) {
            // For 100-199, snap to nearest 5
            payout = Math.round(payout / 5) * 5;
        }
        // 2x-99x stays as-is (1x stepping)
        
        const payoutInput = document.getElementById('payoutMultiplier');
        payoutInput.value = payout;
        
        this.updateProbability();
        
        console.log(`🎲 setPayout: ${amount} → ${payout}`);
    }
    
    updatePayoutStep(currentPayout) {
        const payoutInput = document.getElementById('payoutMultiplier');
        if (!payoutInput) return;
        
        // Set the step attribute based on the current range to match our snapping logic
        let stepSize = 1; // Default
        if (currentPayout >= 500) {
            stepSize = 25;  // 500x-1000x: step by 25x
        } else if (currentPayout >= 200) {
            stepSize = 10;  // 200x-499x: step by 10x
        } else if (currentPayout >= 100) {
            stepSize = 5;   // 100x-199x: step by 5x
        } else {
            stepSize = 1;   // 2x-99x: step by 1x
        }
        
        // Update the step attribute so native spinners work correctly
        payoutInput.setAttribute('step', stepSize.toString());
        
        console.log(`🎲 Updated payout step to ${stepSize}x for value ${currentPayout}x`);
    }
    
    toggleHighLow() {
        this.isLowMode = !this.isLowMode;
        this.updateProbability();
        
        const toggle = document.getElementById('highlowToggle');
        const condition = document.getElementById('rollCondition');
        
        if (this.isLowMode) {
            toggle.textContent = 'Switch to HIGH';
            condition.textContent = 'Roll UNDER';
        } else {
            toggle.textContent = 'Switch to LOW';
            condition.textContent = 'Roll OVER';
        }
        
        this.playSound('roll');
    }
    
    updateProbability() {
        const payoutMultiplier = parseInt(document.getElementById('payoutMultiplier')?.value) || 2;
        const betAmount = parseInt(document.getElementById('betAmount')?.value) || 1;
        
        // NEW INTEGER-BASED SYSTEM: Roll range 1-1000, no decimals, pure integer division
        // Simple and clean - no rounding to avoid duplicate multiplier issues
        const winningNumbers = Math.floor(1000 / payoutMultiplier);
        
        // Calculate exact win chance and thresholds
        const winChance = (winningNumbers / 1000) * 100;
        
        // Calculate roll thresholds for display
        let displayThreshold;
        if (this.isLowMode) {
            // Roll UNDER or EQUAL to winningNumbers to win
            displayThreshold = winningNumbers;
        } else {
            // Roll OVER (1000 - winningNumbers) to win
            displayThreshold = 1000 - winningNumbers;
        }
        
        // Store for roll processing
        this.currentWinningNumbers = winningNumbers;
        
        // Update display with integer precision
        document.getElementById('winChance').textContent = winChance.toFixed(1) + '%';
        document.getElementById('rollThreshold').textContent = displayThreshold.toString();
        document.getElementById('potentialPayout').textContent = (betAmount * payoutMultiplier).toString();
        
        // Update the step attribute for native spinners based on current multiplier
        this.updatePayoutStep(payoutMultiplier);
        
        // Update roll button state
        this.updateRollButton();
        
        // Debug logging
        const rtp = ((winningNumbers / 1000) * payoutMultiplier * 100).toFixed(1);
        console.log(`🎲 Integer System: ${payoutMultiplier}x → ${winningNumbers}/1000 winning numbers (${winChance.toFixed(1)}%, RTP: ${rtp}%)`);
        console.log(`🎲 Mode: ${this.isLowMode ? 'LOW' : 'HIGH'}, Threshold: ${displayThreshold}`);
    }
    
    
    async updateRollButton() {
        const rollButton = document.getElementById('rollButton');
        const betAmount = parseInt(document.getElementById('betAmount')?.value) || 1;
        
        if (!rollButton) {
            console.log('🎲 ❌ Roll button not found');
            return;
        }
        
        if (this.isRolling) {
            console.log('🎲 🎯 Button disabled: Rolling in progress');
            rollButton.disabled = true;
            rollButton.innerHTML = '<div class="spinner"></div> ROLLING...';
            rollButton.classList.add('rolling');
        } else {
            // Get balance - handle async properly
            let currentBalance = 0;
            if (this.balanceSystem) {
                try {
                    if (typeof this.balanceSystem.getBalance === 'function') {
                        const balanceResult = this.balanceSystem.getBalance();
                        // Handle both sync and async balance results
                        currentBalance = await Promise.resolve(balanceResult);
                    }
                } catch (error) {
                    console.error('🎲 ❌ Error getting balance for button:', error);
                    currentBalance = 0;
                }
            }
            
            const canAffordBet = currentBalance >= betAmount;
            
            console.log(`🎲 🎯 Button update: Balance=${currentBalance}, Bet=${betAmount}, CanAfford=${canAffordBet}`);
            
            rollButton.disabled = !canAffordBet;
            rollButton.innerHTML = '<i class="fas fa-dice"></i> ROLL DICE';
            rollButton.classList.remove('rolling');
            
            if (!canAffordBet) {
                rollButton.title = `Insufficient balance (need ${betAmount}, have ${currentBalance})`;
                rollButton.classList.add('insufficient-balance');
                console.log(`🎲 ❌ Button disabled: Insufficient balance (need ${betAmount}, have ${currentBalance})`);
            } else {
                rollButton.title = '';
                rollButton.classList.remove('insufficient-balance');
                console.log(`🎲 ✅ Button enabled: Sufficient balance (need ${betAmount}, have ${currentBalance})`);
            }
        }
    }
    
    async roll() {
        if (this.isRolling || !this.balanceSystem) return;
        
        const betAmount = parseInt(document.getElementById('betAmount')?.value) || 1;
        const payoutMultiplier = parseFloat(document.getElementById('payoutMultiplier')?.value) || 2;
        
        // Check if player has enough balance
        const currentBalance = this.balanceSystem.getBalance();
        if (currentBalance < betAmount) {
            this.showInsufficientBalanceDialog(betAmount, currentBalance);
            return;
        }
        
        this.isRolling = true;
        this.updateRollButton();
        
        // Play roll sound
        this.playSound('roll');
        
        // Animate the roll
        this.animateRoll();
        
        try {
            // Deduct bet amount
            await this.balanceSystem.subtractBalance(betAmount, 'dice_bet');
            
            // Calculate roll result after a delay for suspense
            setTimeout(() => {
                this.processRoll(betAmount, payoutMultiplier);
            }, 1500);
            
        } catch (error) {
            console.error('Error processing dice roll:', error);
            this.isRolling = false;
            this.updateRollButton();
            this.showMessage('Error processing roll. Please try again.', 'error');
        }
    }
    
    animateRoll() {
        const resultContainer = document.getElementById('rollResult');
        const rollValue = document.getElementById('rollValue');
        const rollStatus = document.getElementById('rollStatus');
        
        resultContainer.className = 'roll-result rolling';
        rollStatus.textContent = 'Rolling...';
        
        // Make the number element more prominent during animation
        rollValue.style.transform = 'scale(1.2)';
        rollValue.style.color = '#ffffff';
        rollValue.style.fontWeight = 'bold';
        rollValue.style.textShadow = '0 0 15px rgba(0, 0, 0, 0.8), 0 0 25px rgba(255, 255, 255, 0.6)';
        rollValue.style.transition = 'all 0.1s ease';
        
        // Animate rapidly changing numbers with varying speed
        let animationCount = 0;
        const totalAnimations = 20; // More iterations for better effect
        let currentSpeed = 50; // Start fast
        
        const animateNumbers = () => {
            if (animationCount < totalAnimations && this.isRolling) {
                // Generate random roll value from 1-1000 range
                const randomRoll = Math.floor(Math.random() * 1000) + 1;
                rollValue.textContent = randomRoll;
                
                // Add a slight bounce effect every few frames
                if (animationCount % 3 === 0) {
                    rollValue.style.transform = 'scale(1.3)';
                    setTimeout(() => {
                        if (this.isRolling) {
                            rollValue.style.transform = 'scale(1.2)';
                        }
                    }, 30);
                }
                
                // Gradually slow down the animation
                currentSpeed = Math.min(200, currentSpeed + (animationCount * 3));
                animationCount++;
                
                setTimeout(animateNumbers, currentSpeed);
            } else if (this.isRolling) {
                // Final dramatic pause before showing result
                rollValue.style.color = '#666';
                rollValue.textContent = '???';
                rollValue.style.transform = 'scale(1.4)';
                
                setTimeout(() => {
                    if (this.isRolling) {
                        // Flash effect before final result
                        rollValue.style.color = '#fff';
                        rollValue.style.background = '#007bff';
                        rollValue.style.borderRadius = '8px';
                        rollValue.style.padding = '5px 10px';
                        
                        setTimeout(() => {
                            // Reset styles for final result
                            rollValue.style.background = '';
                            rollValue.style.padding = '';
                            rollValue.style.borderRadius = '';
                            rollValue.style.transform = 'scale(1)';
                            rollValue.style.textShadow = '';
                            rollValue.style.transition = 'all 0.3s ease';
                        }, 200);
                    }
                }, 300);
            }
        };
        
        animateNumbers();
    }
    
    processRoll(betAmount, payoutMultiplier) {
        // Generate integer roll result from 1-1000 (no decimals!)
        const rollResult = Math.floor(Math.random() * 1000) + 1;
        
        // Use the pre-calculated winning numbers from updateProbability
        const winningNumbers = this.currentWinningNumbers;
        
        // Determine win based on integer thresholds
        let isWin = false;
        if (this.isLowMode) {
            // Roll UNDER or EQUAL to winningNumbers to win
            isWin = rollResult <= winningNumbers;
        } else {
            // Roll OVER (1000 - winningNumbers) to win
            isWin = rollResult > (1000 - winningNumbers);
        }
        
        // Calculate payout - ALWAYS INTEGER (bet × multiplier)
        const winAmount = isWin ? (betAmount * payoutMultiplier) : 0;
        
        // Update display with final result
        this.showRollResult(rollResult, isWin, winAmount, betAmount);
        
        // Update statistics
        this.updateGameStats(betAmount, winAmount, isWin);
        
        // Add to recent rolls
        this.addRecentRoll(rollResult, betAmount, winAmount, isWin);
        
        // Process payout if won
        if (isWin && winAmount > 0) {
            this.balanceSystem.addBalance(winAmount, 'dice_win');
        }
        
        this.isRolling = false;
        this.updateRollButton();
        
        // Debug logging for verification
        console.log(`🎲 Roll: ${rollResult}, WinningNumbers: ${winningNumbers}, Mode: ${this.isLowMode ? 'LOW' : 'HIGH'}, Win: ${isWin}`);
    }
    
    showRollResult(rollResult, isWin, winAmount, betAmount) {
        const resultContainer = document.getElementById('rollResult');
        const rollValue = document.getElementById('rollValue');
        const rollStatus = document.getElementById('rollStatus');
        const rollPayout = document.getElementById('rollPayout');
        
        // Set final roll value
        rollValue.textContent = Math.floor(rollResult);
        
        // Set win/lose status
        if (isWin) {
            resultContainer.className = 'roll-result win';
            rollStatus.textContent = 'YOU WIN! 🎉';
            rollPayout.textContent = `+${winAmount} tokens`;
            this.playSound('win');
        } else {
            resultContainer.className = 'roll-result lose';
            rollStatus.textContent = 'You lose 😢';
            rollPayout.textContent = `-${betAmount} tokens`;
            this.playSound('lose');
        }
        
        // Auto-clear result after 5 seconds
        setTimeout(() => {
            resultContainer.className = 'roll-result';
            rollValue.textContent = '0';
            rollStatus.textContent = 'Roll result';
            rollPayout.textContent = '';
        }, 5000);
    }
    
    updateGameStats(wagered, won, isWin) {
        this.gameStats.totalRolls++;
        this.gameStats.totalWagered += wagered;
        this.gameStats.totalWon += won;
        if (isWin) this.gameStats.wins++;
        
        // Save to localStorage
        this.saveGameStats();
        
        // Update display
        this.updateStatsDisplay();
    }
    
    updateStatsDisplay() {
        const winRate = this.gameStats.totalRolls > 0 
            ? ((this.gameStats.wins / this.gameStats.totalRolls) * 100).toFixed(1)
            : '0.0';
            
        document.getElementById('totalRolls').textContent = this.gameStats.totalRolls.toLocaleString();
        document.getElementById('totalWagered').textContent = this.gameStats.totalWagered.toLocaleString();
        document.getElementById('totalWon').textContent = this.gameStats.totalWon.toLocaleString();
        document.getElementById('winRate').textContent = winRate + '%';
    }
    
    addRecentRoll(rollValue, betAmount, winAmount, isWin) {
        const roll = {
            timestamp: Date.now(),
            rollValue: Math.floor(rollValue),
            betAmount,
            winAmount,
            isWin,
            time: new Date().toLocaleTimeString()
        };
        
        this.recentRolls.unshift(roll);
        
        // Keep only the most recent rolls
        if (this.recentRolls.length > this.maxRecentRolls) {
            this.recentRolls = this.recentRolls.slice(0, this.maxRecentRolls);
        }
        
        this.updateRecentRollsDisplay();
    }
    
    updateRecentRollsDisplay() {
        const container = document.getElementById('recentRollsList');
        if (!container) return;
        
        container.innerHTML = this.recentRolls.map(roll => {
            const resultClass = roll.isWin ? 'win' : 'lose';
            const resultAmount = roll.isWin ? `+${roll.winAmount}` : `-${roll.betAmount}`;
            
            return `
                <div class="roll-entry ${resultClass}">
                    <div>
                        <div>Roll: ${roll.rollValue}</div>
                        <div class="roll-time">${roll.time}</div>
                    </div>
                    <div class="roll-amount ${resultClass}">${resultAmount}</div>
                </div>
            `;
        }).join('');
    }
    
    updateBalanceDisplay(balance) {
        const balanceElement = document.getElementById('playerBalance');
        if (balanceElement) {
            balanceElement.textContent = balance.toLocaleString();
        }
        this.updateRollButton();
    }
    
    updateCurrencyDisplay(isLoggedIn) {
        const currencyElements = document.querySelectorAll('.currency-display');
        currencyElements.forEach(element => {
            element.textContent = isLoggedIn ? 'coins' : 'tokens';
        });
    }
    
    async refreshBalance() {
        if (!this.balanceSystem) return;
        
        try {
            const balance = await this.balanceSystem.getBalance();
            const isLoggedIn = this.balanceSystem.isLoggedIn;
            
            this.updateBalanceDisplay(balance);
            this.updateCurrencyDisplay(isLoggedIn);
            console.log(`🎲 Balance refreshed: ${balance} ${isLoggedIn ? 'coins' : 'tokens'}`);
        } catch (error) {
            console.error('Error refreshing balance:', error);
        }
    }
    
    updateDisplay() {
        // Update balance and currency
        if (this.balanceSystem) {
            this.refreshBalance();
        }
        
        // Update stats
        this.updateStatsDisplay();
        
        // Update recent rolls
        this.updateRecentRollsDisplay();
    }
    
    playSound(soundName) {
        if (this.sounds[soundName] && this.sounds[soundName].play) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(e => {
                console.log('Could not play sound:', e);
            });
        }
    }
    
    showMessage(message, type = 'info') {
        // You can implement a toast notification system here
        console.log(`${type.toUpperCase()}: ${message}`);
    }
    
    showInsufficientBalanceDialog(needed, current) {
        const isLoggedIn = this.balanceSystem ? this.balanceSystem.isLoggedIn : false;
        const currency = isLoggedIn ? 'coins' : 'tokens';
        
        const message = `🎲 Insufficient ${currency}!\n\n` +
                       `You need ${needed} ${currency} to roll, but you only have ${current}.\n\n` +
                       `💡 Use the faucet button below to claim free ${currency}!`;
        
        alert(message);
        
        // Highlight the faucet button to draw attention
        const faucetBtn = document.getElementById('faucet-countdown-btn');
        if (faucetBtn) {
            faucetBtn.style.animation = 'pulse 1s ease-in-out 3';
            faucetBtn.style.boxShadow = '0 0 15px #3CE74C';
            
            // Remove highlight after animation
            setTimeout(() => {
                faucetBtn.style.animation = '';
                faucetBtn.style.boxShadow = '';
            }, 3000);
        }
    }
    
    saveGameStats() {
        try {
            localStorage.setItem('diceGameStats', JSON.stringify(this.gameStats));
        } catch (error) {
            console.error('Error saving game stats:', error);
        }
    }
    
    loadGameStats() {
        try {
            const savedStats = localStorage.getItem('diceGameStats');
            if (savedStats) {
                this.gameStats = { ...this.gameStats, ...JSON.parse(savedStats) };
            }
        } catch (error) {
            console.error('Error loading game stats:', error);
        }
    }
    
    // Reset game stats (for testing/debugging)
    resetStats() {
        this.gameStats = {
            totalRolls: 0,
            totalWagered: 0,
            totalWon: 0,
            wins: 0
        };
        this.recentRolls = [];
        this.saveGameStats();
        this.updateDisplay();
        console.log('✅ Game stats reset');
    }
}

// Make RollGame available globally
window.RollGame = RollGame;

// Backward compatibility - can be removed later
window.DiceGame = RollGame;
