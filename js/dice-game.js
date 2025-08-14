/**
 * ROFLFaucet Dice Game - "Roll of Chance"
 * Intelligent dice game with dynamic probability calculations and High/Low mechanics
 */

class DiceGame {
    constructor() {
        // Game state
        this.isRolling = false;
        this.isLowMode = true; // true = roll under to win, false = roll over to win
        this.houseEdge = 0.5; // 0.5% house edge (very fair)
        
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
        console.log('🎲 Initializing Dice Game...');
        
        // Wait for UnifiedBalanceSystem to be available
        const initBalance = () => {
            if (typeof UnifiedBalanceSystem !== 'undefined') {
                this.balanceSystem = new UnifiedBalanceSystem();
                this.setupEventListeners();
                this.loadGameStats();
                this.updateDisplay();
                this.updateProbability();
                console.log('✅ Dice Game initialized successfully');
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
        document.getElementById('payoutUp')?.addEventListener('click', () => this.changePayout(0.1));
        document.getElementById('payoutDown')?.addEventListener('click', () => this.changePayout(-0.1));
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
        const bet = Math.max(1, Math.min(100, parseInt(amount) || 1));
        document.getElementById('betAmount').value = bet;
        this.updateProbability();
    }
    
    changePayout(delta) {
        const payoutInput = document.getElementById('payoutMultiplier');
        if (!payoutInput) return;
        
        const currentPayout = parseFloat(payoutInput.value) || 2;
        const newPayout = Math.max(1.01, Math.min(100, currentPayout + delta));
        
        payoutInput.value = newPayout.toFixed(2);
        this.setPayout(newPayout);
    }
    
    setPayout(amount) {
        const payout = Math.max(1.01, Math.min(100, parseFloat(amount) || 2));
        document.getElementById('payoutMultiplier').value = payout.toFixed(2);
        this.updateProbability();
    }
    
    toggleHighLow() {
        this.isLowMode = !this.isLowMode;
        this.updateProbability();
        
        const toggle = document.getElementById('highlowToggle');
        const condition = document.getElementById('rollCondition');
        
        if (this.isLowMode) {
            toggle.innerHTML = '<i class="fas fa-exchange-alt"></i> Switch to HIGH';
            condition.textContent = 'Roll UNDER to win';
        } else {
            toggle.innerHTML = '<i class="fas fa-exchange-alt"></i> Switch to LOW';
            condition.textContent = 'Roll OVER to win';
        }
        
        this.playSound('roll');
    }
    
    updateProbability() {
        const payoutMultiplier = parseFloat(document.getElementById('payoutMultiplier')?.value) || 2;
        const betAmount = parseInt(document.getElementById('betAmount')?.value) || 1;
        
        // Calculate win chance based on payout multiplier and house edge
        // Formula: winChance = (100 - houseEdge) / payoutMultiplier
        const winChance = (100 - this.houseEdge) / payoutMultiplier;
        
        // Calculate the correct roll threshold based on mode
        let rollThreshold;
        if (this.isLowMode) {
            // LOW mode: roll UNDER this number to win
            rollThreshold = winChance;
        } else {
            // HIGH mode: roll OVER this number to win
            rollThreshold = 100 - winChance;
        }
        
        // Update display
        document.getElementById('winChance').textContent = winChance.toFixed(2) + '%';
        document.getElementById('rollThreshold').textContent = rollThreshold.toFixed(2);
        document.getElementById('potentialPayout').textContent = (betAmount * payoutMultiplier).toFixed(0);
        
        // Update roll button state
        this.updateRollButton();
        
        // Debug logging
        console.log(`🎲 Mode: ${this.isLowMode ? 'LOW' : 'HIGH'}, WinChance: ${winChance.toFixed(2)}%, Threshold: ${rollThreshold.toFixed(2)}, Balance: ${this.balanceSystem ? this.balanceSystem.getBalance() : 'N/A'}`);
    }
    
    
    updateRollButton() {
        const rollButton = document.getElementById('rollButton');
        const betAmount = parseInt(document.getElementById('betAmount')?.value) || 1;
        
        if (!rollButton) return;
        
        if (this.isRolling) {
            rollButton.disabled = true;
            rollButton.innerHTML = '<div class="spinner"></div> ROLLING...';
            rollButton.classList.add('rolling');
        } else {
            const currentBalance = this.balanceSystem ? this.balanceSystem.getBalance() : 0;
            const canAffordBet = currentBalance >= betAmount;
            
            rollButton.disabled = !canAffordBet;
            rollButton.innerHTML = '<i class="fas fa-dice"></i> ROLL DICE';
            rollButton.classList.remove('rolling');
            
            if (!canAffordBet) {
                rollButton.title = 'Insufficient balance';
            } else {
                rollButton.title = '';
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
            this.showMessage('Insufficient balance!', 'error');
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
        
        // Animate random numbers
        let animationCount = 0;
        const maxAnimations = 10;
        
        const animateNumbers = () => {
            if (animationCount < maxAnimations && this.isRolling) {
                const randomRoll = (Math.random() * 99.99 + 0.01).toFixed(2);
                rollValue.textContent = randomRoll;
                animationCount++;
                setTimeout(animateNumbers, 150);
            }
        };
        
        animateNumbers();
    }
    
    processRoll(betAmount, payoutMultiplier) {
        // Generate the actual roll result (0.01 to 99.99)
        const rollResult = Math.random() * 99.98 + 0.01;
        
        // Calculate win threshold
        const winChance = (100 - this.houseEdge) / payoutMultiplier;
        
        // Determine if it's a win
        let isWin = false;
        if (this.isLowMode) {
            // Roll under to win
            isWin = rollResult <= winChance;
        } else {
            // Roll over to win
            isWin = rollResult >= (100 - winChance);
        }
        
        // Calculate payout
        const winAmount = isWin ? Math.floor(betAmount * payoutMultiplier) : 0;
        
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
    }
    
    showRollResult(rollResult, isWin, winAmount, betAmount) {
        const resultContainer = document.getElementById('rollResult');
        const rollValue = document.getElementById('rollValue');
        const rollStatus = document.getElementById('rollStatus');
        const rollPayout = document.getElementById('rollPayout');
        
        // Set final roll value
        rollValue.textContent = rollResult.toFixed(2);
        
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
            rollValue.textContent = '0.00';
            rollStatus.textContent = 'Ready to roll!';
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
            rollValue: rollValue.toFixed(2),
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
        const container = document.getElementById('recentRolls');
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

// Make DiceGame available globally
window.DiceGame = DiceGame;
