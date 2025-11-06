/**
 * ROFLFaucet Poker Dice Game - Player vs House
 * Complete rewrite for hold-and-reroll mechanics
 */

class PokerDiceGame {
    constructor() {
        // Game state
        this.gameState = 'waiting'; // waiting, player_first_roll, player_hold, house_turn, complete
        this.isAnimating = false;
        
        // Current hands
        this.playerDice = [null, null, null, null, null];
        this.houseDice = [null, null, null, null, null];
        this.playerHolds = [false, false, false, false, false]; // Which dice player is holding
        this.houseHolds = [false, false, false, false, false]; // Which dice house is holding
        
        // Direct index-to-value mapping for perfect sync
        this.indexToValue = ['9', '10', 'J', 'Q', 'K', 'A'];
        this.indexToClass = ['show-9', 'show-10', 'show-jack', 'show-queen', 'show-king', 'show-ace'];
        this.valueNumbers = { '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
        // valueColors removed - flush is not valid in poker dice
        
        // Even distribution dice faces
        this.DICE_FACES = [
            0, 0, 0, 0, 0, 0,  // '9' 
            1, 1, 1, 1, 1, 1,  // '10'
            2, 2, 2, 2, 2, 2,  // 'J'
            3, 3, 3, 3, 3, 3,  // 'Q'
            4, 4, 4, 4, 4, 4,  // 'K'
            5, 5, 5, 5, 5, 5   // 'A'
        ];
        
        // Hand rankings for comparison (higher rank = better hand)
        // Note: Flush removed - not valid in poker dice (dice don't have consistent suits)
        this.handRankings = {
            'High Card': 1,
            'One Pair': 2,
            'Two Pair': 3,
            'Three of a Kind': 4,
            'Straight': 5,
            'Full House': 6,
            'Four of a Kind': 7,
            'Five of a Kind': 8
        };
        
        // Animation settings
        this.animationDuration = 2000;
        this.staggerDelay = 100;
        
        // Dice face position mapping - matches CORRECTED CSS face positions
        this.facePositions = {
            '9': { x: 0, y: 0 },      // Shows 9 (Front)   - rotateY(0deg) rotateX(0deg)
            '10': { x: 0, y: -90 },   // Shows 10 (Left)   - rotateY(-90deg) rotateX(0deg) 
            'J': { x: 0, y: 180 },    // Shows J (Back)    - rotateY(180deg) rotateX(0deg)
            'Q': { x: 0, y: 90 },     // Shows Q (Right)   - rotateY(90deg) rotateX(0deg)
            'K': { x: 90, y: 0 },     // Shows K (Bottom)  - rotateX(90deg) rotateY(0deg) 
            'A': { x: -90, y: 0 }     // Shows A (Top)     - rotateX(-90deg) rotateY(0deg)
        };
        
        // Track current positions of each die (start with all showing King)
        this.currentDicePositions = [
            { x: 90, y: 0 }, // Die 1 - showing King
            { x: 90, y: 0 }, // Die 2 - showing King  
            { x: 90, y: 0 }, // Die 3 - showing King
            { x: 90, y: 0 }, // Die 4 - showing King
            { x: 90, y: 0 }  // Die 5 - showing King
        ];
        
        // Strategic choice state
        this.playerStrategy = null; // 'continue', 'double', or 'stand'
        this.originalBet = 0; // Store original bet for doubling
        
        // Current bet amount (stored internally since no input field)
        this.currentBet = 1;
        
        // Statistics
        this.gameStats = {
            totalGames: 0,
            totalWagered: 0,
            totalWon: 0,
            wins: 0,
            losses: 0,
            ties: 0
        };
        
        // Recent games history
        this.recentGames = [];
        this.maxRecentGames = 15;
        
        this.init();
        this.loadLastBet(); // Load saved bet amount and sync displays
        
        // Add to window for debugging
        window.testDiceFaces = () => this.testAllFaces();
    }
    
    setPlayerActive() {
        document.body.classList.add('player-active');
        document.body.classList.remove('house-active');
    }
    
    setHouseActive() {
        document.body.classList.add('house-active');
        document.body.classList.remove('player-active');
    }
    
    init() {
        console.log('🎲 Initializing Player vs House Poker Dice Game - VERSION 2.2 (NO MORE CONSTANT POLLING - Event Driven Balance)...');
        console.log('🚀 BALANCE OPTIMIZATION ACTIVE: No more setInterval polling!');
        console.log('📊 Balance will only update on game actions, not every second');
        console.log('📍 Face positions:', this.facePositions);
        
        const initBalance = () => {
            if (typeof UnifiedBalanceSystem !== 'undefined') {
                this.balanceSystem = new UnifiedBalanceSystem();
        this.setupEventListeners();
        this.loadGameStats();
                this.updateLastResultNotice(); // Load any previous result
                this.updateRecentGamesDisplay(); // Load recent games display
                this.updateStatsDisplay(); // Load stats display
                this.resetGame();
                console.log('✅ Poker Dice Game initialized successfully');
            } else {
                console.log('⏳ Waiting for UnifiedBalanceSystem...');
                setTimeout(initBalance, 100);
            }
        };
        
        initBalance();
    }
    
    setupEventListeners() {
        // Main roll button
        const rollButton = document.getElementById('pokerDiceRollButton');
        if (rollButton) {
            rollButton.addEventListener('click', () => this.handleMainButton());
        }
        
        // Bet controls (no input field, just buttons)
        document.getElementById('betUp')?.addEventListener('click', () => this.changeBet(1));
        document.getElementById('betDown')?.addEventListener('click', () => this.changeBet(-1));
        
        // Strategy choice controls - immediate selection
        document.querySelectorAll('input[name="playerStrategy"]').forEach(radio => {
            radio.addEventListener('click', () => this.handleStrategyChoice());
        });
        
        // Setup event-driven balance updates (no more constant polling)
        if (this.balanceSystem) {
            this.refreshBalance(); // Initial refresh
            this.setupEventDrivenBalance();
        }
    }
    
    setupEventDrivenBalance() {
        console.log('🔄 Setting up event-driven balance system (no constant polling)');
        
        // Update balance on bet changes
        const originalChangeBet = this.changeBet.bind(this);
        this.changeBet = async (delta) => {
            originalChangeBet(delta);
            await this.smartBalanceRefresh('bet_change');
        };
    }
    
    async smartBalanceRefresh(trigger) {
        if (!this.balanceSystem?.isLoggedIn) return;
        
        try {
            console.log(`🔄 Smart balance refresh triggered: ${trigger}`);
            // Check if sync is needed (multi-tab scenario)
            const needsSync = await this.balanceSystem.syncIfNeeded(trigger);
            if (needsSync || trigger === 'before_game' || trigger === 'after_game') {
                await this.refreshBalance();
                this.updateMainButton();
            }
        } catch (error) {
            console.warn('Smart balance refresh failed:', error);
            // Fallback to regular refresh
            await this.refreshBalance();
            this.updateMainButton();
        }
    }
    
    handleMainButton() {
        if (this.isAnimating) return;
        
        switch (this.gameState) {
            case 'waiting':
                this.startGame();
                break;
            case 'player_hold':
                this.playerReroll();
                break;
            case 'complete':
                this.resetGame(); // Reset when clicking PLAY AGAIN
                break;
            default:
                // Button should be disabled in other states
                break;
        }
    }
    
    showStrategyChoice() {
        const strategyDiv = document.getElementById('strategyChoice');
        if (strategyDiv) {
            strategyDiv.style.display = 'block';
            // Clear any previous selection
            document.querySelectorAll('input[name="playerStrategy"]').forEach(radio => {
                radio.checked = false;
            });
        }
    }
    
    hideStrategyChoice() {
        const strategyDiv = document.getElementById('strategyChoice');
        if (strategyDiv) {
            strategyDiv.style.display = 'none';
        }
    }
    
    handleStrategyChoice() {
        const selectedStrategy = document.querySelector('input[name="playerStrategy"]:checked')?.value;
        if (!selectedStrategy) return;
        
        this.playerStrategy = selectedStrategy;
        this.hideStrategyChoice();
        
        console.log(`Player chose strategy: ${selectedStrategy}`);
        
        switch (selectedStrategy) {
            case 'continue':
                this.executeNormalPlay();
                break;
            case 'double':
                this.executeDoublePlay();
                break;
            case 'stand':
                this.executeStandPlay();
                break;
        }
    }
    
    executeNormalPlay() {
        // Standard flow - allow re-roll
        this.gameState = 'player_hold';
        this.updateGameStatus('Click dice to hold, then re-roll the rest');
        this.updateMainButton();
    }
    
    async executeDoublePlay() {
        // Double the bet and proceed with re-roll
        const additionalBet = this.currentBet;
        
        // Check if player has enough balance for the double
        const currentBalance = await this.balanceSystem.getBalance();
        if (currentBalance < additionalBet) {
            this.showInsufficientBalanceDialog(additionalBet, currentBalance);
            this.showStrategyChoice(); // Show choice again
            return;
        }
        
        // Store original bet and mark as doubled
        this.originalBet = this.currentBet;
        
        // Deduct additional bet
        await this.balanceSystem.subtractBalance(additionalBet, 'poker_dice_double');
        // Don't modify this.currentBet - we'll handle doubling in payout calculation
        
        this.gameState = 'player_hold';
        this.updateGameStatus(`🔥 DOUBLED BET (${this.originalBet * 2})! Click dice to hold, then re-roll`);
        this.updateMainButton();
        
        console.log(`Bet doubled: original ${this.originalBet}, total risked ${this.originalBet * 2}`);
    }
    
    executeStandPlay() {
        // Player stands with current hand - house gets only one roll
        this.gameState = 'house_single_roll';
        this.hideHoldControls();
        this.updateGameStatus('Standing with current hand - House gets one roll');
        this.startHouseSingleRoll();
    }
    
    startHouseSingleRoll() {
        this.setHouseActive();
        this.updateGameStatus('House rolling (single roll only)...');
        
        // House gets only one roll - no re-roll opportunity
        this.generateHouseRoll();
        this.animateHouseDice();
        
        setTimeout(() => {
            this.showHouseHand();
            this.determineWinner();
        }, this.animationDuration + 500);
    }
    
    async startGame() {
        const betAmount = this.currentBet;
        
        // Smart balance refresh before game starts
        await this.smartBalanceRefresh('before_game');
        
        // Check balance (await the async call)
        const currentBalance = await this.balanceSystem.getBalance();
        if (currentBalance < betAmount) {
            this.showInsufficientBalanceDialog(betAmount, currentBalance);
            return;
        }
        
        // Deduct bet
        await this.balanceSystem.subtractBalance(betAmount, 'poker_dice_bet');
        
        // Start player's first roll
        this.gameState = 'player_first_roll';
        this.setPlayerActive(); // Set player as active for UI sizing
        this.updateGameStatus('Rolling your dice...');
        this.updateMainButton();
        
        // Generate and animate player dice
        this.generatePlayerRoll();
        this.animatePlayerDice();
        
        // After animation, show strategic choice
        setTimeout(() => {
            this.gameState = 'player_strategy_choice';
            this.showHoldControls();
            this.showStrategyChoice();
            this.updateGameStatus('Choose your strategy');
            this.updateMainButton();
            this.showPlayerHand();
        }, this.animationDuration + 500);
    }
    
    playerReroll() {
        this.gameState = 'player_reroll';
        this.updateGameStatus('Re-rolling your dice...');
        this.updateMainButton();
        this.hideHoldControls();
        
        // Generate new values only for non-held dice
        this.generatePlayerReroll();
        this.animatePlayerReroll();
        
        // After animation, start house turn
        setTimeout(() => {
            this.showPlayerHand();
            this.startHouseTurn();
        }, this.animationDuration + 500);
    }
    
    startHouseTurn() {
        this.gameState = 'house_turn';
        this.setHouseActive(); // Set house as active for UI sizing
        this.updateGameStatus('House is playing...');
        this.updateMainButton();
        
        // House first roll
        this.generateHouseRoll();
        this.animateHouseDice();
        
        setTimeout(() => {
            this.showHouseHand();
            
            // House decides what to hold (optimal strategy)
            this.houseDecideHolds();
            
            // House re-roll
            setTimeout(() => {
                this.updateGameStatus('House is re-rolling...');
                this.generateHouseReroll();
                this.animateHouseReroll();
                
                setTimeout(() => {
                    this.showHouseHand();
                    this.determineWinner();
                }, this.animationDuration + 500);
                
            }, 1000); // Brief pause to show house's first hand
            
        }, this.animationDuration + 500);
    }
    
    generatePlayerRoll() {
        for (let i = 0; i < 5; i++) {
            const randomIndex = Math.floor(Math.random() * this.DICE_FACES.length);
            const faceIndex = this.DICE_FACES[randomIndex];
            this.playerDice[i] = this.indexToValue[faceIndex];
        }
        console.log('Player rolled:', this.playerDice);
    }
    
    generatePlayerReroll() {
        for (let i = 0; i < 5; i++) {
            if (!this.playerHolds[i]) { // Only re-roll non-held dice
                const randomIndex = Math.floor(Math.random() * this.DICE_FACES.length);
                const faceIndex = this.DICE_FACES[randomIndex];
                this.playerDice[i] = this.indexToValue[faceIndex];
            }
        }
        console.log('Player re-rolled:', this.playerDice);
    }
    
    generateHouseRoll() {
        for (let i = 0; i < 5; i++) {
            const randomIndex = Math.floor(Math.random() * this.DICE_FACES.length);
            const faceIndex = this.DICE_FACES[randomIndex];
            this.houseDice[i] = this.indexToValue[faceIndex];
        }
        console.log('House rolled:', this.houseDice);
    }
    
    generateHouseReroll() {
        for (let i = 0; i < 5; i++) {
            if (!this.houseHolds[i]) { // Only re-roll non-held dice
                const randomIndex = Math.floor(Math.random() * this.DICE_FACES.length);
                const faceIndex = this.DICE_FACES[randomIndex];
                this.houseDice[i] = this.indexToValue[faceIndex];
            }
        }
        console.log('House re-rolled:', this.houseDice);
    }
    
    animatePlayerDice() {
        this.isAnimating = true;
        for (let i = 1; i <= 5; i++) {
            const die = document.getElementById(`playerDie${i}`);
            if (die) {
                // Use realistic rolling animation that lands exactly on target
                setTimeout(() => {
                    this.createRealisticRoll(die, i, this.playerDice[i - 1], true);
                }, i * this.staggerDelay);
            }
        }
        setTimeout(() => { this.isAnimating = false; }, this.animationDuration + 1100);
    }
    
    animatePlayerReroll() {
        this.isAnimating = true;
        for (let i = 1; i <= 5; i++) {
            if (!this.playerHolds[i - 1]) { // Only animate non-held dice
                const die = document.getElementById(`playerDie${i}`);
                if (die) {
                    setTimeout(() => {
                        this.createRealisticRoll(die, i, this.playerDice[i - 1], true);
                    }, i * this.staggerDelay);
                }
            }
        }
        setTimeout(() => { this.isAnimating = false; }, this.animationDuration + 600);
    }
    
    animateHouseDice() {
        for (let i = 1; i <= 5; i++) {
            const die = document.getElementById(`houseDie${i}`);
            if (die) {
                setTimeout(() => {
                    this.createRealisticRoll(die, i, this.houseDice[i - 1], false);
                }, i * this.staggerDelay);
            }
        }
    }
    
    animateHouseReroll() {
        for (let i = 1; i <= 5; i++) {
            if (!this.houseHolds[i - 1]) { // Only animate non-held dice
                const die = document.getElementById(`houseDie${i}`);
                if (die) {
                    setTimeout(() => {
                        this.createRealisticRoll(die, i, this.houseDice[i - 1], false);
                    }, i * this.staggerDelay);
                }
            }
        }
    }
    
    showPlayerDieFinalValue(dieIndex, value) {
        const die = document.getElementById(`playerDie${dieIndex}`);
        if (!die) return;
        
        const valueIndex = this.indexToValue.indexOf(value);
        const cssClass = this.indexToClass[valueIndex];
        die.className = `die ${cssClass}`;
    }
    
    showHouseDieFinalValue(dieIndex, value) {
        const die = document.getElementById(`houseDie${dieIndex}`);
        if (!die) return;
        
        const valueIndex = this.indexToValue.indexOf(value);
        const cssClass = this.indexToClass[valueIndex];
        die.className = `die ${cssClass}`;
    }
    
    // Calculate the shortest rotation path from current position to target face
    calculateRotationPath(currentPos, targetFace) {
        const target = this.facePositions[targetFace];
        
        // Calculate the difference, accounting for 360-degree wrapping
        let deltaX = target.x - currentPos.x;
        let deltaY = target.y - currentPos.y;
        
        // Find shortest path (considering 360-degree wrapping)
        if (Math.abs(deltaX) > 180) {
            deltaX = deltaX > 0 ? deltaX - 360 : deltaX + 360;
        }
        if (Math.abs(deltaY) > 180) {
            deltaY = deltaY > 0 ? deltaY - 360 : deltaY + 360;
        }
        
        return { deltaX, deltaY, finalX: target.x, finalY: target.y };
    }
    
    // Generate a random intermediate position during rolling animation
    generateRandomIntermediate() {
        // Generate random rotations that look natural
        const x = (Math.floor(Math.random() * 8) + 2) * 90; // 2-9 full rotations
        const y = (Math.floor(Math.random() * 8) + 2) * 90; // 2-9 full rotations
        return { x, y };
    }
    
    // Create a realistic rolling animation that ends precisely on the target
    createRealisticRoll(dieElement, dieIndex, targetValue, isPlayer = true) {
        const currentPos = isPlayer ? this.currentDicePositions[dieIndex - 1] : { x: 90, y: 0 };
        const path = this.calculateRotationPath(currentPos, targetValue);
        const intermediate = this.generateRandomIntermediate();
        
        console.log(`🎲 Die ${dieIndex}: Rolling to ${targetValue}, Final position: x=${path.finalX}, y=${path.finalY}`);
        
        // Create custom keyframe animation that ends exactly where we need
        const animationName = `realisticRoll_${dieIndex}_${Date.now()}`;
        const keyframes = `
            @keyframes ${animationName} {
                0% { transform: rotateX(${currentPos.x}deg) rotateY(${currentPos.y}deg); }
                25% { transform: rotateX(${currentPos.x + intermediate.x * 0.25}deg) rotateY(${currentPos.y + intermediate.y * 0.25}deg); }
                50% { transform: rotateX(${currentPos.x + intermediate.x * 0.5}deg) rotateY(${currentPos.y + intermediate.y * 0.5}deg); }
                75% { transform: rotateX(${currentPos.x + intermediate.x * 0.75}deg) rotateY(${currentPos.y + intermediate.y * 0.75}deg); }
                90% { transform: rotateX(${currentPos.x + intermediate.x}deg) rotateY(${currentPos.y + intermediate.y}deg); }
                100% { transform: rotateX(${path.finalX}deg) rotateY(${path.finalY}deg); }
            }
        `;
        
        // Inject the keyframe animation
        if (!document.getElementById('dynamic-dice-styles')) {
            const style = document.createElement('style');
            style.id = 'dynamic-dice-styles';
            document.head.appendChild(style);
        }
        const styleSheet = document.getElementById('dynamic-dice-styles');
        styleSheet.textContent += keyframes;
        
        // Apply the animation
        dieElement.style.animation = `${animationName} ${this.animationDuration}ms ease-out`;
        
        // Update our position tracking
        if (isPlayer) {
            this.currentDicePositions[dieIndex - 1] = { x: path.finalX, y: path.finalY };
        }
        
        // Clean up the animation after it completes
        setTimeout(() => {
            dieElement.style.animation = '';
            // Apply final position via CSS class for consistency
            const valueIndex = this.indexToValue.indexOf(targetValue);
            const cssClass = this.indexToClass[valueIndex];
            dieElement.className = `die ${cssClass}`;
            
            console.log(`✅ Die ${dieIndex}: Animation complete, CSS class: ${cssClass}, Target: ${targetValue}`);
            console.log(`   Current position tracking: x=${path.finalX}, y=${path.finalY}`);
        }, this.animationDuration + 50);
    }
    
    showHoldControls() {
        // Hide the old checkbox controls
        this.hideHoldControls();
        
        // Reset all holds and enable click functionality
        for (let i = 1; i <= 5; i++) {
            this.playerHolds[i - 1] = false;
            const die = document.getElementById(`playerDie${i}`);
            if (die && die.parentElement) {
                // Create reliable click overlay
                let clickOverlay = document.getElementById(`clickOverlay${i}`);
                if (!clickOverlay) {
                    clickOverlay = document.createElement('div');
                    clickOverlay.id = `clickOverlay${i}`;
                    clickOverlay.style.cssText = `
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        cursor: pointer;
                        z-index: 50;
                        background: transparent;
                    `;
                    
                    // Ensure parent is positioned
                    die.parentElement.style.position = 'relative';
                    die.parentElement.appendChild(clickOverlay);
                }
                
                // Remove any existing click listeners
                clickOverlay.removeEventListener('click', clickOverlay._holdClickHandler);
                
                // Add reliable click handler to overlay
                clickOverlay._holdClickHandler = (e) => {
                    e.stopPropagation();
                    this.toggleDieHold(i);
                };
                clickOverlay.addEventListener('click', clickOverlay._holdClickHandler);
                
                // Visual feedback for the actual die
                die.style.transition = 'filter 0.3s ease';
                die.style.filter = 'none';
            }
        }
    }
    
    hideHoldControls() {
        // Hide old checkbox controls
        for (let i = 1; i <= 5; i++) {
            const checkbox = document.getElementById(`holdPlayer${i}`);
            const label = document.querySelector(`label[for="holdPlayer${i}"]`);
            if (checkbox && label) {
                checkbox.style.display = 'none';
                label.style.display = 'none';
            }
        }
        
        // Remove click handlers from dice and reset visual state
        this.disableDiceClickHandlers();
        
        // Clean up held indicators
        this.clearAllHeldIndicators();
    }
    
    disableDiceClickHandlers() {
        for (let i = 1; i <= 5; i++) {
            // Remove click overlay
            const clickOverlay = document.getElementById(`clickOverlay${i}`);
            if (clickOverlay) {
                clickOverlay.remove();
            }
            
            const die = document.getElementById(`playerDie${i}`);
            if (die) {
                // Remove old click handler (if any)
                die.removeEventListener('click', die._holdClickHandler);
                die._holdClickHandler = null;
                
                // Reset visual state
                die.style.cursor = 'default';
                die.style.filter = 'none';
                die.style.opacity = '1';
                die.style.transform = die.style.transform || '';
            }
        }
    }
    
    clearAllHeldIndicators() {
        for (let i = 1; i <= 5; i++) {
            const indicator = document.getElementById(`heldIndicator${i}`);
            if (indicator) {
                indicator.remove();
            }
        }
    }
    
    toggleDieHold(dieIndex) {
        console.log(`🖱️ CLICK DEBUG: Die ${dieIndex} clicked`);
        console.log(`   Current value: ${this.playerDice[dieIndex - 1]}`);
        console.log(`   Current CSS class: ${document.getElementById(`playerDie${dieIndex}`)?.className}`);
        
        const arrayIndex = dieIndex - 1;
        this.playerHolds[arrayIndex] = !this.playerHolds[arrayIndex];
        
        // Show/hide "HELD" text indicator
        this.updateHeldIndicator(dieIndex);
        
        // Update status message to show current hold count
        const heldCount = this.playerHolds.filter(h => h).length;
        if (heldCount === 0) {
            this.updateGameStatus('Click dice to hold, then re-roll the rest');
        } else if (heldCount === 5) {
            this.updateGameStatus(`All dice held - click 🎯 RE-ROLL to continue with same hand`);
        } else {
            this.updateGameStatus(`${heldCount} dice held - click 🎯 RE-ROLL to roll the others`);
        }
        
        console.log(`Die ${dieIndex} ${this.playerHolds[arrayIndex] ? 'held' : 'released'}`);
    }
    
    updateHeldIndicator(dieIndex) {
        const arrayIndex = dieIndex - 1;
        const indicatorId = `heldIndicator${dieIndex}`;
        let indicator = document.getElementById(indicatorId);
        
        if (this.playerHolds[arrayIndex]) {
            // Create or show "HELD" indicator
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = indicatorId;
                indicator.textContent = 'HELD';
                indicator.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(255, 68, 68, 0.9);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    z-index: 100;
                    pointer-events: none;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                    border: 1px solid rgba(255,255,255,0.3);
                `;
                
                // Find the die's container and add the indicator
                const die = document.getElementById(`playerDie${dieIndex}`);
                if (die && die.parentElement) {
                    die.parentElement.style.position = 'relative';
                    die.parentElement.appendChild(indicator);
                }
            } else {
                indicator.style.display = 'block';
            }
        } else {
            // Hide indicator
            if (indicator) {
                indicator.style.display = 'none';
            }
        }
    }
    
    houseDecideHolds() {
        // Advanced house strategy - knows player's hand and plays optimally
        const playerHand = this.evaluateHand(this.playerDice);
        const houseHand = this.evaluateHand(this.houseDice);
        
        console.log(`🏠 House strategy: Player has ${playerHand.name} (rank ${playerHand.rank}), House has ${houseHand.name} (rank ${houseHand.rank})`);
        
        this.houseHolds = [false, false, false, false, false];
        
        // If house already beats player, hold everything
        if (houseHand.rank > playerHand.rank || 
            (houseHand.rank === playerHand.rank && this.compareHighCards(this.houseDice, this.playerDice) > 0)) {
            console.log('🏠 House already wins - holding all dice');
            this.houseHolds.fill(true);
            return;
        }
        
        // Calculate what house needs to win
        const targetRank = playerHand.rank + 1; // Need to beat player by at least 1 rank
        const strategy = this.calculateOptimalHouseStrategy(targetRank, playerHand);
        
        console.log(`🏠 House strategy: ${strategy.description}`);
        strategy.holds.forEach((hold, index) => {
            this.houseHolds[index] = hold;
        });
        
        console.log('House holds:', this.houseHolds);
    }
    
    calculateOptimalHouseStrategy(targetRank, playerHand) {
        const counts = {};
        this.houseDice.forEach(value => {
            counts[value] = (counts[value] || 0) + 1;
        });
        
        const countValues = Object.values(counts).sort((a, b) => b - a);
        const strategies = [];
        
        // Strategy 1: Keep highest multiples (pairs, trips, etc.)
        if (countValues[0] >= 2) {
            const bestValue = Object.keys(counts).reduce((a, b) => {
                if (counts[a] !== counts[b]) return counts[a] > counts[b] ? a : b;
                return this.valueNumbers[a] > this.valueNumbers[b] ? a : b;
            });
            
            const holds = this.houseDice.map(value => value === bestValue);
            const probability = this.estimateWinProbability(holds, targetRank, playerHand);
            
            strategies.push({
                holds,
                probability,
                description: `Keep ${counts[bestValue]} ${bestValue}s (${(probability * 100).toFixed(1)}% win chance)`
            });
            
            // Strategy 2: Keep best pair but try to improve with others if we have 2 pairs
            if (countValues[0] === 2 && countValues[1] === 2) {
                const values = Object.keys(counts).filter(v => counts[v] === 2);
                const higherPair = values.reduce((a, b) => this.valueNumbers[a] > this.valueNumbers[b] ? a : b);
                
                const altHolds = this.houseDice.map(value => value === higherPair);
                const altProb = this.estimateWinProbability(altHolds, targetRank, playerHand);
                
                strategies.push({
                    holds: altHolds,
                    probability: altProb,
                    description: `Keep only ${higherPair} pair, roll for trips/quads (${(altProb * 100).toFixed(1)}% win chance)`
                });
            }
        }
        
        // Strategy 3: Keep highest cards if no pairs
        if (countValues[0] === 1) {
            const sortedIndices = this.houseDice
                .map((value, index) => ({ value, index }))
                .sort((a, b) => this.valueNumbers[b.value] - this.valueNumbers[a.value]);
            
            // Try keeping 2, 3, or 4 highest cards
            for (let keepCount = 2; keepCount <= 4; keepCount++) {
                const holds = new Array(5).fill(false);
                sortedIndices.slice(0, keepCount).forEach(item => {
                    holds[item.index] = true;
                });
                
                const probability = this.estimateWinProbability(holds, targetRank, playerHand);
                strategies.push({
                    holds,
                    probability,
                    description: `Keep ${keepCount} highest cards (${(probability * 100).toFixed(1)}% win chance)`
                });
            }
        }
        
        // Strategy 4: All-or-nothing - roll all dice if chances are very low
        const rollAllProb = this.estimateWinProbability(new Array(5).fill(false), targetRank, playerHand);
        strategies.push({
            holds: new Array(5).fill(false),
            probability: rollAllProb,
            description: `Roll all dice for miracle hand (${(rollAllProb * 100).toFixed(1)}% win chance)`
        });
        
        // Choose best strategy
        return strategies.reduce((best, current) => 
            current.probability > best.probability ? current : best
        );
    }
    
    estimateWinProbability(holds, targetRank, playerHand) {
        // Simplified probability estimation
        // In a real implementation, this would be much more sophisticated
        
        const rollCount = holds.filter(h => !h).length; // How many dice to roll
        const keepCount = 5 - rollCount;
        
        if (rollCount === 0) return 0; // Not rolling anything
        
        // Count what we're keeping
        const keptDice = this.houseDice.filter((_, i) => holds[i]);
        const keptCounts = {};
        keptDice.forEach(value => {
            keptCounts[value] = (keptCounts[value] || 0) + 1;
        });
        
        const maxKept = Math.max(...Object.values(keptCounts), 0);
        
        // Rough probability estimates based on what we need
        if (targetRank >= 8) { // Need Four of a Kind or better
            if (maxKept >= 3) return 0.15; // Have trips, roll for quads
            if (maxKept >= 2) return 0.05; // Have pair, roll for quads
            return 0.01; // Roll all dice for miracle
        }
        
        if (targetRank >= 7) { // Need Full House or better
            if (maxKept >= 3) return 0.35; // Have trips
            if (maxKept >= 2) return 0.15; // Have pair
            return 0.03;
        }
        
        if (targetRank >= 4) { // Need Three of a Kind or better
            if (maxKept >= 2) return 0.45; // Have pair, roll for trips+
            return 0.15; // Roll for pair/trips
        }
        
        // For lower ranks, pretty good chances
        if (keepCount >= 2) return 0.65;
        return 0.40;
    }
    
    showPlayerHand() {
        const handEval = this.evaluateHand(this.playerDice);
        const handDisplay = document.getElementById('playerHand');
        if (handDisplay) {
            handDisplay.textContent = handEval.name;
        }
        this.updateDiceDebugDisplay();
    }
    
    showHouseHand() {
        const handEval = this.evaluateHand(this.houseDice);
        const handDisplay = document.getElementById('houseHand');
        if (handDisplay) {
            handDisplay.textContent = handEval.name;
        }
        this.updateDiceDebugDisplay();
    }
    
    // Debug display to verify dice values match visual appearance
    updateDiceDebugDisplay() {
        let debugElement = document.getElementById('dice-debug-display');
        if (!debugElement) {
            // Create debug display element
            debugElement = document.createElement('div');
            debugElement.id = 'dice-debug-display';
            debugElement.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 14px;
                z-index: 1000;
                border: 1px solid #333;
            `;
            document.body.appendChild(debugElement);
        }
        
        const playerValues = this.playerDice.filter(d => d !== null);
        const houseValues = this.houseDice.filter(d => d !== null);
        
        let debugText = '';
        if (playerValues.length > 0) {
            debugText += `Player: ${playerValues.join(' ')}\n`;
        }
        if (houseValues.length > 0) {
            debugText += `House:  ${houseValues.join(' ')}\n`;
        }
        
        if (debugText === '') {
            debugText = 'No dice rolled yet';
        }
        
        debugElement.textContent = debugText;
    }
    
    determineWinner() {
        const playerHand = this.evaluateHand(this.playerDice);
        const houseHand = this.evaluateHand(this.houseDice);
        
        // Calculate correct bet amount for payout
        const totalBetAmount = this.playerStrategy === 'double' ? this.originalBet * 2 : this.currentBet;
        const baseBetAmount = this.playerStrategy === 'double' ? this.originalBet : this.currentBet;
        
        let result, payout = 0;
        
        if (playerHand.rank > houseHand.rank) {
            result = 'You Win!';
            payout = totalBetAmount * 2; // 2:1 payout on total bet
            this.balanceSystem.addBalance(payout, 'poker_dice_win');
            this.gameStats.wins++;
        } else if (playerHand.rank < houseHand.rank) {
            result = 'House Wins';
            payout = 0;
            this.gameStats.losses++;
        } else {
            // Same hand rank - need to compare the actual hand values
            const comparison = this.compareEqualRankHands(playerHand.name, this.playerDice, this.houseDice);
            
            if (comparison > 0) {
                result = `You Win! (${playerHand.name})`;
                payout = totalBetAmount * 2;
                this.balanceSystem.addBalance(payout, 'poker_dice_win');
                this.gameStats.wins++;
            } else if (comparison < 0) {
                result = `House Wins (${houseHand.name})`;
                payout = 0;
                this.gameStats.losses++;
            } else {
                result = 'Tie - Push';
                payout = totalBetAmount; // Return total bet
                this.balanceSystem.addBalance(payout, 'poker_dice_push');
                this.gameStats.ties++;
            }
        }
        
        this.gameStats.totalGames++;
        this.gameStats.totalWagered += totalBetAmount;
        this.gameStats.totalWon += payout;
        this.saveGameStats();
        
        // Add to recent games history  
        this.addRecentGame(result, payout, totalBetAmount, playerHand.name, houseHand.name);
        
        this.showGameResult(result, payout, totalBetAmount, playerHand.name, houseHand.name);
        
        this.gameState = 'complete';
        this.setPlayerActive(); // Reset to player active state for UI sizing
        this.updateMainButton();
        this.updateGameStatus('Game complete! Click to play again');
        
        // Smart balance refresh after game completes
        this.smartBalanceRefresh('after_game');
    }
    
    compareHighCards(dice1, dice2) {
        const sorted1 = dice1.map(v => this.valueNumbers[v]).sort((a, b) => b - a);
        const sorted2 = dice2.map(v => this.valueNumbers[v]).sort((a, b) => b - a);
        
        for (let i = 0; i < 5; i++) {
            if (sorted1[i] > sorted2[i]) return 1;
            if (sorted1[i] < sorted2[i]) return -1;
        }
        return 0; // Perfect tie
    }
    
    compareEqualRankHands(handType, dice1, dice2) {
        switch (handType) {
            case 'Three of a Kind':
                return this.compareThreeOfAKind(dice1, dice2);
            case 'Four of a Kind':
                return this.compareFourOfAKind(dice1, dice2);
            case 'Full House':
                return this.compareFullHouse(dice1, dice2);
            case 'Two Pair':
                return this.compareTwoPair(dice1, dice2);
            case 'One Pair':
                return this.compareOnePair(dice1, dice2);
            default:
                // High Card, Straight, Five of a Kind - use high card comparison
                return this.compareHighCards(dice1, dice2);
        }
    }
    
    compareThreeOfAKind(dice1, dice2) {
        // Find the triplet value in each hand - THIS IS THE KEY FIX
        const triplet1 = this.findTripletValue(dice1);
        const triplet2 = this.findTripletValue(dice2);
        
        console.log(`🎲 Comparing Three of a Kind: ${triplet1} vs ${triplet2}`);
        
        // Compare triplet values directly - higher triplet wins
        if (triplet1 > triplet2) return 1;
        if (triplet1 < triplet2) return -1;
        
        // Only if triplets are identical, compare kickers
        const remaining1 = dice1.filter(v => this.valueNumbers[v] !== triplet1)
            .map(v => this.valueNumbers[v]).sort((a, b) => b - a);
        const remaining2 = dice2.filter(v => this.valueNumbers[v] !== triplet2)
            .map(v => this.valueNumbers[v]).sort((a, b) => b - a);
            
        for (let i = 0; i < remaining1.length; i++) {
            if (remaining1[i] > remaining2[i]) return 1;
            if (remaining1[i] < remaining2[i]) return -1;
        }
        
        return 0; // Perfect tie
    }
    
    findTripletValue(dice) {
        const counts = {};
        dice.forEach(value => {
            const numValue = this.valueNumbers[value];
            counts[numValue] = (counts[numValue] || 0) + 1;
        });
        
        // Find the value that appears 3 times
        for (const [value, count] of Object.entries(counts)) {
            if (count >= 3) { // >= 3 to handle Four/Five of a kind too
                return parseInt(value);
            }
        }
        console.error('🎲 ERROR: No triplet found in dice:', dice);
        return 0; // Should never happen for Three of a Kind
    }
    
    compareFourOfAKind(dice1, dice2) {
        const quad1 = this.findQuadValue(dice1);
        const quad2 = this.findQuadValue(dice2);
        
        if (quad1 > quad2) return 1;
        if (quad1 < quad2) return -1;
        
        // Compare kicker if quads are equal
        const kicker1 = dice1.find(v => this.valueNumbers[v] !== quad1);
        const kicker2 = dice2.find(v => this.valueNumbers[v] !== quad2);
        
        if (this.valueNumbers[kicker1] > this.valueNumbers[kicker2]) return 1;
        if (this.valueNumbers[kicker1] < this.valueNumbers[kicker2]) return -1;
        
        return 0;
    }
    
    findQuadValue(dice) {
        const counts = {};
        dice.forEach(value => {
            const numValue = this.valueNumbers[value];
            counts[numValue] = (counts[numValue] || 0) + 1;
        });
        
        for (const [value, count] of Object.entries(counts)) {
            if (count >= 4) {
                return parseInt(value);
            }
        }
        return 0;
    }
    
    compareFullHouse(dice1, dice2) {
        // Full House: compare triplet first, then pair
        const trips1 = this.findTripletValue(dice1);
        const trips2 = this.findTripletValue(dice2);
        
        if (trips1 > trips2) return 1;
        if (trips1 < trips2) return -1;
        
        // If triplets equal, compare pairs
        const pair1 = this.findPairValue(dice1, trips1);
        const pair2 = this.findPairValue(dice2, trips2);
        
        if (pair1 > pair2) return 1;
        if (pair1 < pair2) return -1;
        
        return 0;
    }
    
    compareTwoPair(dice1, dice2) {
        const pairs1 = this.findTwoPairValues(dice1).sort((a, b) => b - a);
        const pairs2 = this.findTwoPairValues(dice2).sort((a, b) => b - a);
        
        // Compare higher pair first, then lower pair
        for (let i = 0; i < 2; i++) {
            if (pairs1[i] > pairs2[i]) return 1;
            if (pairs1[i] < pairs2[i]) return -1;
        }
        
        // Compare kicker
        const kicker1 = dice1.find(v => !pairs1.includes(this.valueNumbers[v]));
        const kicker2 = dice2.find(v => !pairs2.includes(this.valueNumbers[v]));
        
        if (this.valueNumbers[kicker1] > this.valueNumbers[kicker2]) return 1;
        if (this.valueNumbers[kicker1] < this.valueNumbers[kicker2]) return -1;
        
        return 0;
    }
    
    compareOnePair(dice1, dice2) {
        const pair1 = this.findPairValue(dice1);
        const pair2 = this.findPairValue(dice2);
        
        if (pair1 > pair2) return 1;
        if (pair1 < pair2) return -1;
        
        // Compare remaining cards
        const remaining1 = dice1.filter(v => this.valueNumbers[v] !== pair1)
            .map(v => this.valueNumbers[v]).sort((a, b) => b - a);
        const remaining2 = dice2.filter(v => this.valueNumbers[v] !== pair2)
            .map(v => this.valueNumbers[v]).sort((a, b) => b - a);
            
        for (let i = 0; i < remaining1.length; i++) {
            if (remaining1[i] > remaining2[i]) return 1;
            if (remaining1[i] < remaining2[i]) return -1;
        }
        
        return 0;
    }
    
    findPairValue(dice, exclude = null) {
        const counts = {};
        dice.forEach(value => {
            const numValue = this.valueNumbers[value];
            if (numValue !== exclude) {
                counts[numValue] = (counts[numValue] || 0) + 1;
            }
        });
        
        for (const [value, count] of Object.entries(counts)) {
            if (count === 2) {
                return parseInt(value);
            }
        }
        return 0;
    }
    
    findTwoPairValues(dice) {
        const counts = {};
        dice.forEach(value => {
            const numValue = this.valueNumbers[value];
            counts[numValue] = (counts[numValue] || 0) + 1;
        });
        
        const pairs = [];
        for (const [value, count] of Object.entries(counts)) {
            if (count === 2) {
                pairs.push(parseInt(value));
            }
        }
        return pairs;
    }
    
    showGameResult(result, payout, bet, playerHand, houseHand) {
        const resultDiv = document.getElementById('gameResult');
        const resultText = document.getElementById('resultText');
        const payoutText = document.getElementById('payoutText');
        
        // Get currency type based on login status
        const currency = this.balanceSystem && this.balanceSystem.isLoggedIn ? 'coins' : 'tokens';
        
        if (resultDiv && resultText && payoutText) {
            resultDiv.style.display = 'block';
            resultText.textContent = result;
            
            if (payout > bet) {
                payoutText.textContent = `Won: ${payout} ${currency}!`;
                resultDiv.className = 'current-hand winning-hand';
            } else if (payout === bet) {
                payoutText.textContent = `Push: ${payout} ${currency} returned`;
                resultDiv.className = 'current-hand';
            } else {
                payoutText.textContent = `Lost: ${bet} ${currency}`;
                resultDiv.className = 'current-hand';
            }
            
            setTimeout(() => {
                resultDiv.style.display = 'none';
            }, 5000);
        }
        
        // Save and display last result
        this.saveLastResult(result, payout, bet, playerHand, houseHand);
        this.updateLastResultNotice();
        
        console.log(`Player: ${playerHand} vs House: ${houseHand} = ${result}`);
    }
    
    async updateMainButton() {
        const button = document.getElementById('pokerDiceRollButton');
        if (!button) return;
        
        const betAmount = this.currentBet;
        let currentBalance = 0;
        
        if (this.balanceSystem) {
            try {
                currentBalance = await this.balanceSystem.getBalance();
            } catch (error) {
                console.error('Error getting balance in updateMainButton:', error);
            }
        }
        
        switch (this.gameState) {
            case 'waiting':
                if (currentBalance >= betAmount && !this.isAnimating) {
                    button.disabled = false;
                    button.innerHTML = '🎲 START GAME';
                    button.classList.remove('rolling');
                } else {
                    button.disabled = true;
                    button.innerHTML = '🎲 INSUFFICIENT BALANCE';
                }
                break;
                
            case 'player_strategy_choice':
                button.disabled = true;
                button.innerHTML = '⚡ CHOOSE STRATEGY';
                button.classList.remove('rolling');
                break;
                
            case 'player_hold':
                button.disabled = false;
                button.innerHTML = '🎯 RE-ROLL DICE';
                button.classList.remove('rolling');
                break;
                
            case 'complete':
                button.disabled = false;
                button.innerHTML = '🎲 PLAY AGAIN';
                button.classList.remove('rolling');
                break;
                
            default:
                button.disabled = true;
                button.innerHTML = '🎲 PLAYING...';
                button.classList.add('rolling');
                break;
        }
    }
    
    updateGameStatus(message) {
        const status = document.getElementById('gameStatus');
        if (status) {
            status.textContent = message;
        }
    }
    
    resetGame() {
        this.gameState = 'waiting';
        this.setPlayerActive(); // Reset to player active state for UI sizing
        this.playerDice = [null, null, null, null, null];
        this.houseDice = [null, null, null, null, null];
        this.playerHolds = [false, false, false, false, false];
        this.houseHolds = [false, false, false, false, false];
        
        // Reset dice to default positions (King)
        for (let i = 1; i <= 5; i++) {
            const playerDie = document.getElementById(`playerDie${i}`);
            const houseDie = document.getElementById(`houseDie${i}`);
            if (playerDie) playerDie.className = 'die show-king';
            if (houseDie) houseDie.className = 'die show-king';
        }
        
        // Reset position tracking to Kings
        this.currentDicePositions = [
            { x: 90, y: 0 }, // Die 1 - showing King
            { x: 90, y: 0 }, // Die 2 - showing King  
            { x: 90, y: 0 }, // Die 3 - showing King
            { x: 90, y: 0 }, // Die 4 - showing King
            { x: 90, y: 0 }  // Die 5 - showing King
        ];
        
        // Hide controls and clean up indicators
        this.hideHoldControls();
        this.hideStrategyChoice();
        
        // Reset strategic choice state
        this.playerStrategy = null;
        this.originalBet = 0;
        
        // Reset displays
        const playerHand = document.getElementById('playerHand');
        const houseHand = document.getElementById('houseHand');
        if (playerHand) playerHand.textContent = '-';
        if (houseHand) houseHand.textContent = '-';
        
        this.updateGameStatus('Place your bet and start playing!');
        this.updateMainButton();
    }
    
    // Hand evaluation logic (fixed for poker dice - no flush)
    evaluateHand(dice) {
        const counts = {};
        
        // Count occurrences of each value
        dice.forEach(value => {
            counts[value] = (counts[value] || 0) + 1;
        });
        
        const countValues = Object.values(counts).sort((a, b) => b - a);
        const isStraight = this.isStraight(dice);
        
        // Check for hands in order of rank (highest to lowest)
        if (countValues[0] === 5) {
            return { name: 'Five of a Kind', rank: this.handRankings['Five of a Kind'] };
        }
        if (countValues[0] === 4) {
            return { name: 'Four of a Kind', rank: this.handRankings['Four of a Kind'] };
        }
        if (countValues[0] === 3 && countValues[1] === 2) {
            return { name: 'Full House', rank: this.handRankings['Full House'] };
        }
        if (isStraight) {
            return { name: 'Straight', rank: this.handRankings['Straight'] };
        }
        // Note: Flush removed - poker dice don't have consistent suits like playing cards
        if (countValues[0] === 3) {
            return { name: 'Three of a Kind', rank: this.handRankings['Three of a Kind'] };
        }
        if (countValues[0] === 2 && countValues[1] === 2) {
            return { name: 'Two Pair', rank: this.handRankings['Two Pair'] };
        }
        if (countValues[0] === 2) {
            return { name: 'One Pair', rank: this.handRankings['One Pair'] };
        }
        
        return { name: 'High Card', rank: this.handRankings['High Card'] };
    }
    
    isStraight(dice) {
        const numbers = dice.map(value => this.valueNumbers[value]).sort((a, b) => a - b);
        const lowStraight = numbers.join(',') === '9,10,11,12,13';
        const highStraight = numbers.join(',') === '10,11,12,13,14';
        return lowStraight || highStraight;
    }
    
    // Utility methods (simplified versions of originals)
    changeBet(delta) {
        // Check if levels system is available
        if (!window.levelsSystem) {
            console.warn('🎲 Level system not available - using default max bet');
            const newBet = Math.max(1, Math.min(100, this.currentBet + delta));
            this.setBet(newBet);
            return;
        }
        
        const maxBet = window.levelsSystem.getMaxBet();
        const newBet = Math.max(1, this.currentBet + delta);
        
        if (newBet <= maxBet) {
            this.setBet(newBet);
        } else if (delta > 0) {
            // Trying to increase bet beyond level limit
            window.levelsSystem.showInsufficientLevelModal(newBet, maxBet);
            console.log(`🎲 Bet blocked: ${newBet} exceeds max bet ${maxBet} for current level`);
        }
        // If delta < 0 (decreasing), always allow it
    }
    
    setBet(amount) {
        const bet = Math.max(1, parseInt(amount) || 1);
        
        // Store internally and update display
        this.currentBet = bet;
        const betDisplay = document.getElementById('currentBet');
        if (betDisplay) betDisplay.textContent = bet;
        
        this.saveLastBet(); // Save the new bet amount
        this.updateMainButton();
    }
    
    loadLastBet() {
        // Load the last bet amount from localStorage, default to 1
        const savedBet = localStorage.getItem('pokerDiceLastBet');
        const lastBet = savedBet ? parseInt(savedBet) : 1;
        console.log(`🎲 Loaded last bet: ${lastBet}`);
        
        // Store internally and update display
        const finalBet = Math.max(1, lastBet); // Ensure minimum bet is 1
        this.currentBet = finalBet;
        
        const betDisplay = document.getElementById('currentBet');
        if (betDisplay) betDisplay.textContent = finalBet;
        
        return finalBet;
    }
    
    saveLastBet() {
        // Save current bet amount to localStorage
        localStorage.setItem('pokerDiceLastBet', this.currentBet.toString());
        console.log(`🎲 Saved bet amount: ${this.currentBet}`);
    }
    
    async refreshBalance() {
        if (!this.balanceSystem) return;
        
        try {
            const balance = await this.balanceSystem.getBalance();
            const balanceElement = document.getElementById('playerBalance');
            if (balanceElement) {
                balanceElement.textContent = balance.toLocaleString();
            }
        } catch (error) {
            console.error('Error refreshing balance:', error);
        }
    }
    
    showInsufficientBalanceDialog(needed, current) {
        const currency = this.balanceSystem && this.balanceSystem.isLoggedIn ? 'coins' : 'tokens';
        const message = `🎲 Insufficient ${currency}!\\n\\nYou need ${needed} ${currency} to play, but you only have ${current}.\\n\\n💡 Use the faucet button to claim free ${currency}!`;
        alert(message);
    }
    
    addRecentGame(result, payout, betAmount, playerHand, houseHand) {
        const game = {
            timestamp: Date.now(),
            result,
            payout,
            betAmount,
            playerHand,
            houseHand,
            time: new Date().toLocaleTimeString()
        };
        
        this.recentGames.unshift(game);
        
        // Keep only the most recent games
        if (this.recentGames.length > this.maxRecentGames) {
            this.recentGames = this.recentGames.slice(0, this.maxRecentGames);
        }
        
        // Save to localStorage
        this.saveRecentGames();
        
        // Log to Enhanced Analytics API for server-side aggregation
        this.logToAnalytics(result, payout, betAmount, playerHand, houseHand);
        
        this.updateRecentGamesDisplay();
    }
    
    updateStatsDisplay() {
        const winRate = this.gameStats.totalGames > 0 
            ? ((this.gameStats.wins / this.gameStats.totalGames) * 100).toFixed(1)
            : '0.0';
        
        // Update elements if they exist
        const totalGamesEl = document.getElementById('totalPokerDiceGames');
        const totalWageredEl = document.getElementById('totalPokerDiceWagered');
        const totalWonEl = document.getElementById('totalPokerDiceWon');
        const winRateEl = document.getElementById('pokerDiceWinRate');
        
        if (totalGamesEl) totalGamesEl.textContent = this.gameStats.totalGames.toLocaleString();
        if (totalWageredEl) totalWageredEl.textContent = this.gameStats.totalWagered.toLocaleString();
        if (totalWonEl) totalWonEl.textContent = this.gameStats.totalWon.toLocaleString();
        if (winRateEl) winRateEl.textContent = winRate + '%';
    }
    
    updateRecentGamesDisplay() {
        const container = document.getElementById('recentGamesList');
        if (!container) return;
        
        if (this.recentGames.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">🎲</div>
                    <div>No recent games yet!</div>
                    <div style="font-size: 0.9rem; margin-top: 0.5rem;">Play a few games to see your history here.</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.recentGames.map(game => {
            // Determine result class for styling
            let resultClass = 'neutral';
            let resultIcon = '🤝';
            if (game.payout > game.betAmount) {
                resultClass = 'win';
                resultIcon = '🎉';
            } else if (game.payout < game.betAmount) {
                resultClass = 'lose';
                resultIcon = '😢';
            }
            
            const currency = this.balanceSystem && this.balanceSystem.isLoggedIn ? 'coins' : 'tokens';
            const resultAmount = game.payout > game.betAmount ? 
                `+${game.payout - game.betAmount} ${currency}` : 
                game.payout === game.betAmount ? 
                    `Push (${game.payout} ${currency})` : 
                    `-${game.betAmount} ${currency}`;
            
            return `
                <div class="game-entry ${resultClass}" style="margin-bottom: 12px; padding: 12px; border-radius: 8px; border: 1px solid #dee2e6; background: ${resultClass === 'win' ? '#f8fff8' : resultClass === 'lose' ? '#fff8f8' : '#f8f9fa'};">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1;">
                            <div style="font-weight: bold; color: ${resultClass === 'win' ? '#28a745' : resultClass === 'lose' ? '#dc3545' : '#6c757d'};">${resultIcon} ${game.result}</div>
                            <div style="font-size: 0.9rem; color: #666; margin-top: 4px;">
                                You: <strong>${game.playerHand}</strong> vs House: <strong>${game.houseHand}</strong>
                            </div>
                            <div style="font-size: 0.8rem; color: #999; margin-top: 2px;">${game.time}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 0.9rem; color: #666;">Bet: ${game.betAmount}</div>
                            <div style="font-weight: bold; color: ${resultClass === 'win' ? '#28a745' : resultClass === 'lose' ? '#dc3545' : '#6c757d'};">${resultAmount}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    saveRecentGames() {
        try {
            localStorage.setItem('pokerDiceRecentGames', JSON.stringify(this.recentGames));
        } catch (error) {
            console.error('Error saving recent games:', error);
        }
    }
    
    saveGameStats() {
        try {
            localStorage.setItem('pokerDiceVsHouseStats', JSON.stringify(this.gameStats));
        } catch (error) {
            console.error('Error saving game stats:', error);
        }
        
        // Update display
        this.updateStatsDisplay();
    }
    
    loadGameStats() {
        try {
            const savedStats = localStorage.getItem('pokerDiceVsHouseStats');
            if (savedStats) {
                this.gameStats = { ...this.gameStats, ...JSON.parse(savedStats) };
            }
            
            const savedGames = localStorage.getItem('pokerDiceRecentGames');
            if (savedGames) {
                this.recentGames = JSON.parse(savedGames);
                console.log(`🎲 Loaded ${this.recentGames.length} recent games from localStorage`);
            }
        } catch (error) {
            console.error('Error loading game stats:', error);
        }
    }
    
    saveLastResult(result, payout, bet, playerHand, houseHand) {
        const lastResult = {
            result,
            payout,
            bet,
            playerHand,
            houseHand,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('pokerDiceLastResult', JSON.stringify(lastResult));
        } catch (error) {
            console.error('Error saving last result:', error);
        }
    }
    
    updateLastResultNotice() {
        try {
            const savedResult = localStorage.getItem('pokerDiceLastResult');
            if (!savedResult) return;
            
            const lastResult = JSON.parse(savedResult);
            const notice = document.getElementById('lastResultNotice');
            const content = document.getElementById('lastResultContent');
            
            if (!notice || !content) return;
            
            // Determine result class for styling
            let resultClass = '';
            if (lastResult.payout > lastResult.bet) {
                resultClass = 'result-win';
            } else if (lastResult.payout === lastResult.bet) {
                resultClass = 'result-tie';
            } else {
                resultClass = 'result-lose';
            }
            
            // Get currency type based on login status
            const currency = this.balanceSystem && this.balanceSystem.isLoggedIn ? 'coins' : 'tokens';
            
            // Format the content
            content.innerHTML = `
                <div class="${resultClass}">${lastResult.result}</div>
                <div style="margin-top: 5px; font-size: 12px; color: #ccc;">
                    You: ${lastResult.playerHand} vs House: ${lastResult.houseHand}<br>
                    Bet: ${lastResult.bet} • ${lastResult.payout > lastResult.bet ? 'Won' : lastResult.payout === lastResult.bet ? 'Push' : 'Lost'}: ${lastResult.payout} ${currency}
                </div>
            `;
            
            // Show the notice
            notice.style.display = 'block';
        } catch (error) {
            console.error('Error updating last result notice:', error);
        }
    }
    
    // Ultra-Efficient Analytics Integration
    async logToAnalytics(result, payout, betAmount, playerHand, houseHand) {
        try {
            // Get username for per-user analytics (leaderboards, personal stats, etc.)
            // Falls back to 'guest' for non-logged-in users
            let userId = 'guest';
            
            // Use the proper site-utils function to get username
            if (typeof getValidUsername === 'function') {
                const username = getValidUsername();
                if (username && username !== 'guest') {
                    userId = username;
                }
            }
            // Fallback methods if site-utils isn't available yet
            else {
                // Try localStorage directly (same method as site-utils)
                const sessionData = localStorage.getItem('roflfaucet_session');
                if (sessionData) {
                    try {
                        const data = JSON.parse(sessionData);
                        if (data.username && (!data.expires || Date.now() <= data.expires)) {
                            userId = data.username;
                        }
                    } catch (e) {
                        // Fall back to simple localStorage
                        const fallbackUser = localStorage.getItem('username');
                        if (fallbackUser) {
                            userId = fallbackUser;
                        }
                    }
                } else {
                    const fallbackUser = localStorage.getItem('username');
                    if (fallbackUser) {
                        userId = fallbackUser;
                    }
                }
            }
            
            console.log(`📊 Analytics: Logging game for user "${userId}" (hybrid: user + aggregate)`);
            console.log(`🔍 Debug: Balance system logged in: ${this.balanceSystem?.isLoggedIn}, getUsername available: ${!!this.balanceSystem?.getUsername}, username property: ${this.balanceSystem?.username}, session username: ${sessionStorage.getItem('username')}`);
            
            // Single PHP call - handles both user and aggregate logging internally
            const url = '/scripts/analytics.php';
            console.log(`🌐 Making analytics request to: ${url}`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    action: 'log_game',
                    user_id: userId,
                    game_type: 'poker-dice',
                    bet_amount: betAmount,
                    payout: payout
                })
            });
            
            const responseText = await response.text();
            console.log(`📊 Response status: ${response.status}, text: ${responseText}`);
            
            if (response.ok) {
                console.log('✅ Analytics: Game logged successfully (hybrid mode)');
            } else {
                console.warn(`⚠️ Analytics: Failed to log game result. Status: ${response.status}`);
            }
        } catch (error) {
            console.warn('⚠️ Analytics: Error logging game result:', error);
            // Don't throw - analytics logging shouldn't break the game
        }
    }
    
    // Debug function to test all face classes
    testAllFaces() {
        console.log('🧪 Testing all dice face classes...');
        const die = document.getElementById('playerDie1');
        if (!die) {
            console.error('❌ Could not find playerDie1 element');
            return;
        }
        
        const faces = ['show-9', 'show-10', 'show-jack', 'show-queen', 'show-king', 'show-ace'];
        const values = ['9', '10', 'J', 'Q', 'K', 'A'];
        
        faces.forEach((cssClass, index) => {
            setTimeout(() => {
                die.className = `die ${cssClass}`;
                console.log(`🎲 Applied class: ${cssClass}, Expected: ${values[index]}`);
                console.log(`   Visual check: What do you see on the first player die?`);
            }, index * 2000);
        });
        
        // Reset back to King
        setTimeout(() => {
            die.className = 'die show-king';
            console.log('🔄 Reset to King');
        }, faces.length * 2000);
    }
    
    // Active/Inactive state management for space optimization
    setPlayerActive() {
        const playerSection = document.getElementById('playerSection');
        const houseSection = document.getElementById('houseSection');
        
        if (playerSection && houseSection) {
            playerSection.className = 'dice-section active';
            houseSection.className = 'dice-section inactive';
            console.log('🎲 Player section activated, house section minimized');
        }
    }
    
    setHouseActive() {
        const playerSection = document.getElementById('playerSection');
        const houseSection = document.getElementById('houseSection');
        
        if (playerSection && houseSection) {
            playerSection.className = 'dice-section inactive';
            houseSection.className = 'dice-section active';
            console.log('🎲 House section activated, player section minimized');
        }
    }
    
    setBothActive() {
        const playerSection = document.getElementById('playerSection');
        const houseSection = document.getElementById('houseSection');
        
        if (playerSection && houseSection) {
            playerSection.className = 'dice-section active';
            houseSection.className = 'dice-section active';
            console.log('🎲 Both sections activated (game result state)');
        }
    }
}

// Make available globally
window.PokerDiceGame = PokerDiceGame;
/* Test sync trigger */
