/**
 * ROFLFaucet Poker Dice Game
 * 5-die poker game with animated 3D dice and poker hand evaluation
 */

class PokerDiceGame {
    constructor() {
        // Game state
        this.isRolling = false;
        this.currentDice = [null, null, null, null, null];
        this.currentHand = null;
        this.currentPayout = 0;
        
        // Direct index-to-value mapping for perfect sync between logic and animation
        // Index maps directly to CSS class: show-9, show-10, show-jack, show-queen, show-king, show-ace
        this.indexToValue = ['9', '10', 'J', 'Q', 'K', 'A'];
        this.indexToClass = ['show-9', 'show-10', 'show-jack', 'show-queen', 'show-king', 'show-ace'];
        this.valueNumbers = { '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
        this.valueColors = { '9': 'red', '10': 'black', 'J': 'red', 'Q': 'black', 'K': 'red', 'A': 'black' };
        
        // =======================================
        // WEIGHTED DICE ARRAYS (similar to wheel SEGMENTS and slots virtualReelLists)
        // =======================================
        // Each die uses the same distribution for simplicity (can be tuned later)
        // Values correspond to indices 0-5 for ['9', '10', 'J', 'Q', 'K', 'A']
        // This ensures perfect sync between logical outcome and animation stop
        this.DICE_FACES = [
            // Even distribution for now - 6 entries per face (36 total per die)
            0, 0, 0, 0, 0, 0,  // Index 0 = '9' face (6 entries)
            1, 1, 1, 1, 1, 1,  // Index 1 = '10' face (6 entries) 
            2, 2, 2, 2, 2, 2,  // Index 2 = 'J' face (6 entries)
            3, 3, 3, 3, 3, 3,  // Index 3 = 'Q' face (6 entries)
            4, 4, 4, 4, 4, 4,  // Index 4 = 'K' face (6 entries)
            5, 5, 5, 5, 5, 5   // Index 5 = 'A' face (6 entries)
        ];
        // Total: 36 entries = perfectly even 1/6 probability for each face
        // Can be adjusted later for different probabilities while maintaining sync
        
        // Hand rankings and payouts
        // NOTE: Royal Flush is impossible with current color system (10-J-Q-K-A contains mixed colors)
        this.handRankings = {
            'Five of a Kind': { rank: 1, payout: 400, description: 'All five dice same value' },
            'Four of a Kind': { rank: 2, payout: 20, description: 'Four dice same value' },
            'Full House': { rank: 3, payout: 10, description: 'Three of a kind + pair' },
            'Straight': { rank: 4, payout: 15, description: 'Five consecutive values' },
            'Flush': { rank: 5, payout: 6, description: 'All same color' },
            'Three of a Kind': { rank: 6, payout: 3, description: 'Three dice same value' },
            'Two Pair': { rank: 7, payout: 2, description: 'Two different pairs' },
            'One Pair': { rank: 8, payout: 1, description: 'Two dice same value' }
        };
        
        // Animation settings
        this.animationDuration = 2000; // 2 seconds
        this.staggerDelay = 100; // 100ms between dice stopping
        
        // Game statistics
        this.gameStats = {
            totalRolls: 0,
            totalWagered: 0,
            totalWon: 0,
            handFrequency: {}
        };
        
        // Initialize
        this.init();
    }
    
    init() {
        console.log('🎲 Initializing Poker Dice Game...');
        
        // Wait for UnifiedBalanceSystem
        const initBalance = () => {
            if (typeof UnifiedBalanceSystem !== 'undefined') {
                this.balanceSystem = new UnifiedBalanceSystem();
                this.setupEventListeners();
                this.loadGameStats();
                this.resetDiceToDefault();
                console.log('✅ Poker Dice Game initialized successfully');
            } else {
                console.log('⏳ Waiting for UnifiedBalanceSystem...');
                setTimeout(initBalance, 100);
            }
        };
        
        initBalance();
    }
    
    setupEventListeners() {
        // Poker dice roll button
        const rollButton = document.getElementById('pokerDiceRollButton');
        if (rollButton) {
            rollButton.addEventListener('click', () => this.rollDice());
        }
        
        // Bet amount controls (reuse existing)
        document.getElementById('betUp')?.addEventListener('click', () => this.changeBet(1));
        document.getElementById('betDown')?.addEventListener('click', () => this.changeBet(-1));
        document.getElementById('betAmount')?.addEventListener('input', (e) => this.setBet(e.target.value));
        
        // Update roll button state periodically
        if (this.balanceSystem) {
            this.refreshBalance();
            this.balanceUpdateInterval = setInterval(() => {
                this.refreshBalance();
                this.updateRollButton();
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
        
        // Validate with levels system
        if (window.levelsSystem) {
            const maxBet = window.levelsSystem.getMaxBet();
            if (bet > maxBet) {
                window.levelsSystem.showInsufficientLevelModal(bet, maxBet);
                bet = maxBet;
            }
        }
        
        document.getElementById('betAmount').value = bet;
        this.updateRollButton();
    }
    
    async updateRollButton() {
        const rollButton = document.getElementById('pokerDiceRollButton');
        const betAmount = parseInt(document.getElementById('betAmount')?.value) || 1;
        
        if (!rollButton) return;
        
        if (this.isRolling) {
            rollButton.disabled = true;
            rollButton.innerHTML = '<div class="spinner"></div> ROLLING...';
            rollButton.classList.add('rolling');
        } else {
            let currentBalance = 0;
            if (this.balanceSystem) {
                try {
                    const balanceResult = this.balanceSystem.getBalance();
                    currentBalance = await Promise.resolve(balanceResult);
                } catch (error) {
                    console.error('Error getting balance:', error);
                }
            }
            
            const canAffordBet = currentBalance >= betAmount;
            rollButton.disabled = !canAffordBet;
            rollButton.innerHTML = '🎲 ROLL POKER DICE';
            rollButton.classList.remove('rolling');
            
            if (!canAffordBet) {
                rollButton.title = `Insufficient balance (need ${betAmount}, have ${currentBalance})`;
                rollButton.classList.add('insufficient-balance');
            } else {
                rollButton.title = '';
                rollButton.classList.remove('insufficient-balance');
            }
        }
    }
    
    async rollDice() {
        if (this.isRolling || !this.balanceSystem) return;
        
        const betAmount = parseInt(document.getElementById('betAmount')?.value) || 1;
        
        // Check balance
        const currentBalance = this.balanceSystem.getBalance();
        if (currentBalance < betAmount) {
            this.showInsufficientBalanceDialog(betAmount, currentBalance);
            return;
        }
        
        this.isRolling = true;
        this.updateRollButton();
        
        try {
            // Deduct bet
            await this.balanceSystem.subtractBalance(betAmount, 'poker_dice_bet');
            
            // Generate roll results
            this.generateRollResults();
            
            // Start animations
            this.animateDice();
            
            // Process results after animation
            setTimeout(() => {
                this.processRollResults(betAmount);
            }, this.animationDuration + 500);
            
        } catch (error) {
            console.error('Error processing poker dice roll:', error);
            this.isRolling = false;
            this.updateRollButton();
        }
    }
    
    generateRollResults() {
        // =======================================
        // WHEEL/SLOTS APPROACH - INDEXED SELECTION
        // =======================================
        // For each die, pick random index from DICE_FACES weighted array
        // This ensures perfect sync between logical outcome and animation
        this.currentDiceIndices = []; // Store indices for animation
        
        for (let i = 0; i < 5; i++) {
            // Pick random index from weighted DICE_FACES array (like wheel SEGMENTS)
            const randomArrayIndex = Math.floor(Math.random() * this.DICE_FACES.length);
            const faceIndex = this.DICE_FACES[randomArrayIndex]; // Get the face index (0-5)
            
            // Store both the face index and the corresponding value
            this.currentDiceIndices[i] = faceIndex;
            this.currentDice[i] = this.indexToValue[faceIndex];
            
            console.log(`🎲 Die ${i+1}: array[${randomArrayIndex}] = index ${faceIndex} = '${this.currentDice[i]}'`);
        }
        
        console.log('🎲 Generated dice indices:', this.currentDiceIndices);
        console.log('🎲 Generated dice values:', this.currentDice);
    }
    
    animateDice() {
        // Start all dice rolling with different animations
        for (let i = 1; i <= 5; i++) {
            const die = document.getElementById(`die${i}`);
            if (die) {
                die.className = `die roll-${i}`;
                
                // Stop animation at staggered times and show final result
                setTimeout(() => {
                    this.showFinalValue(i, this.currentDiceIndices[i - 1]);
                }, this.animationDuration + (i * this.staggerDelay));
            }
        }
    }
    
    showFinalValue(dieIndex, faceIndex) {
        const die = document.getElementById(`die${dieIndex}`);
        if (!die) return;
        
        // =======================================
        // DIRECT INDEX-TO-CSS MAPPING
        // =======================================
        // Use stored face index directly for perfect sync
        // No conversion needed - index maps directly to CSS class
        const cssClass = this.indexToClass[faceIndex]; // Direct mapping: 0->show-9, 1->show-10, etc.
        const faceValue = this.indexToValue[faceIndex]; // For logging
        
        // Remove animation class and show final face
        die.className = `die ${cssClass}`;
        
        console.log(`🎲 Die ${dieIndex} shows: index ${faceIndex} -> ${cssClass} -> '${faceValue}'`);
    }
    
    processRollResults(betAmount) {
        // Evaluate the poker hand
        const handResult = this.evaluateHand(this.currentDice);
        this.currentHand = handResult.name;
        this.currentPayout = handResult.payout;
        
        // Calculate winnings
        const winAmount = betAmount * handResult.payout;
        
        // Update display
        this.showHandResult(handResult, winAmount, betAmount);
        
        // Update statistics
        this.updateGameStats(betAmount, winAmount, handResult.name);
        
        // Process payout
        if (winAmount > 0) {
            this.balanceSystem.addBalance(winAmount, 'poker_dice_win');
        }
        
        this.isRolling = false;
        this.updateRollButton();
    }
    
    evaluateHand(dice) {
        const sortedDice = [...dice].sort();
        const counts = {};
        const colors = {};
        
        // Count values and colors
        dice.forEach(value => {
            counts[value] = (counts[value] || 0) + 1;
            const color = this.valueColors[value];
            colors[color] = (colors[color] || 0) + 1;
            console.log(`🎲 ${value} = ${color} color`);
        });
        
        const countValues = Object.values(counts).sort((a, b) => b - a);
        const uniqueValues = Object.keys(counts);
        const isFlush = Object.keys(colors).length === 1;
        const isStraight = this.isStraight(sortedDice);
        
        // Debug logging
        console.log('🎲 Hand evaluation for:', dice);
        console.log('🎲 Counts:', counts);
        console.log('🎲 Colors:', colors);
        console.log('🎲 CountValues:', countValues);
        console.log('🎲 IsFlush:', isFlush, '(unique colors:', Object.keys(colors).length, ')');
        console.log('🎲 IsStraight:', isStraight);
        // NOTE: Royal Flush removed - impossible with current color system
        
        // Evaluate hand type (highest first)
        if (countValues[0] === 5) {
            return { name: 'Five of a Kind', payout: this.handRankings['Five of a Kind'].payout };
        }
        
        if (countValues[0] === 4) {
            return { name: 'Four of a Kind', payout: this.handRankings['Four of a Kind'].payout };
        }
        
        if (countValues[0] === 3 && countValues[1] === 2) {
            return { name: 'Full House', payout: this.handRankings['Full House'].payout };
        }
        
        if (isStraight) {
            return { name: 'Straight', payout: this.handRankings['Straight'].payout };
        }
        
        if (isFlush) {
            return { name: 'Flush', payout: this.handRankings['Flush'].payout };
        }
        
        if (countValues[0] === 3) {
            return { name: 'Three of a Kind', payout: this.handRankings['Three of a Kind'].payout };
        }
        
        if (countValues[0] === 2 && countValues[1] === 2) {
            return { name: 'Two Pair', payout: this.handRankings['Two Pair'].payout };
        }
        
        if (countValues[0] === 2) {
            return { name: 'One Pair', payout: this.handRankings['One Pair'].payout };
        }
        
        // This shouldn't happen with 5 dice and 6 values, but just in case
        return { name: 'High Card', payout: 0 };
    }
    
    isStraight(sortedDice) {
        const numbers = sortedDice.map(value => this.valueNumbers[value]).sort((a, b) => a - b);
        
        // Check for 9-10-J-Q-K (9,10,11,12,13)
        const lowStraight = numbers.join(',') === '9,10,11,12,13';
        
        // Check for 10-J-Q-K-A (10,11,12,13,14)
        const highStraight = numbers.join(',') === '10,11,12,13,14';
        
        return lowStraight || highStraight;
    }
    
    isRoyalStraight(sortedDice) {
        const numbers = sortedDice.map(value => this.valueNumbers[value]).sort((a, b) => a - b);
        return numbers.join(',') === '10,11,12,13,14'; // 10-J-Q-K-A
    }
    
    showHandResult(handResult, winAmount, betAmount) {
        const currentHandDiv = document.getElementById('currentHand');
        const handNameDiv = document.getElementById('handName');
        const handPayoutDiv = document.getElementById('handPayout');
        
        if (currentHandDiv && handNameDiv && handPayoutDiv) {
            currentHandDiv.style.display = 'block';
            handNameDiv.textContent = handResult.name;
            
            if (winAmount > 0) {
                handPayoutDiv.textContent = `Win: ${winAmount} tokens (${handResult.payout}:1)`;
                currentHandDiv.className = 'current-hand winning-hand';
            } else {
                handPayoutDiv.textContent = `Better luck next time!`;
                currentHandDiv.className = 'current-hand';
            }
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                currentHandDiv.style.display = 'none';
            }, 5000);
        }
        
        console.log(`🎲 Hand: ${handResult.name}, Payout: ${handResult.payout}:1, Won: ${winAmount}`);
    }
    
    resetDiceToDefault() {
        // Set all dice to show 'A' face initially
        for (let i = 1; i <= 5; i++) {
            const die = document.getElementById(`die${i}`);
            if (die) {
                die.className = 'die show-ace';
            }
        }
    }
    
    updateGameStats(wagered, won, handName) {
        this.gameStats.totalRolls++;
        this.gameStats.totalWagered += wagered;
        this.gameStats.totalWon += won;
        
        // Track hand frequency
        if (!this.gameStats.handFrequency[handName]) {
            this.gameStats.handFrequency[handName] = 0;
        }
        this.gameStats.handFrequency[handName]++;
        
        this.saveGameStats();
    }
    
    async refreshBalance() {
        if (!this.balanceSystem) return;
        
        try {
            const balance = await this.balanceSystem.getBalance();
            const isLoggedIn = this.balanceSystem.isLoggedIn;
            
            // Update balance display
            const balanceElement = document.getElementById('playerBalance');
            if (balanceElement) {
                balanceElement.textContent = balance.toLocaleString();
            }
            
            // Update currency display
            const currencyElements = document.querySelectorAll('.currency-display');
            currencyElements.forEach(element => {
                element.textContent = isLoggedIn ? 'coins' : 'tokens';
            });
            
        } catch (error) {
            console.error('Error refreshing balance:', error);
        }
    }
    
    showInsufficientBalanceDialog(needed, current) {
        const isLoggedIn = this.balanceSystem ? this.balanceSystem.isLoggedIn : false;
        const currency = isLoggedIn ? 'coins' : 'tokens';
        
        const message = `🎲 Insufficient ${currency}!\\n\\n` +
                       `You need ${needed} ${currency} to play, but you only have ${current}.\\n\\n` +
                       `💡 Use the faucet button to claim free ${currency}!`;
        
        alert(message);
        
        // Highlight faucet button
        const faucetBtn = document.getElementById('faucet-countdown-btn');
        if (faucetBtn) {
            faucetBtn.style.animation = 'pulse 1s ease-in-out 3';
            faucetBtn.style.boxShadow = '0 0 15px #3CE74C';
            
            setTimeout(() => {
                faucetBtn.style.animation = '';
                faucetBtn.style.boxShadow = '';
            }, 3000);
        }
    }
    
    saveGameStats() {
        try {
            localStorage.setItem('pokerDiceGameStats', JSON.stringify(this.gameStats));
        } catch (error) {
            console.error('Error saving game stats:', error);
        }
    }
    
    loadGameStats() {
        try {
            const savedStats = localStorage.getItem('pokerDiceGameStats');
            if (savedStats) {
                this.gameStats = { ...this.gameStats, ...JSON.parse(savedStats) };
            }
        } catch (error) {
            console.error('Error loading game stats:', error);
        }
    }
    
    // Debug method to test hand evaluation
    testHand(testDice) {
        console.log('Testing hand:', testDice);
        const result = this.evaluateHand(testDice);
        console.log('Result:', result);
        return result;
    }
}

// Make PokerDiceGame available globally
window.PokerDiceGame = PokerDiceGame;
