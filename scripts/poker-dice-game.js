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
        this.valueColors = { '9': 'red', '10': 'black', 'J': 'red', 'Q': 'black', 'K': 'red', 'A': 'black' };
        
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
        this.handRankings = {
            'High Card': 1,
            'One Pair': 2,
            'Two Pair': 3,
            'Three of a Kind': 4,
            'Straight': 5,
            'Flush': 6,
            'Full House': 7,
            'Four of a Kind': 8,
            'Five of a Kind': 9
        };
        
        // Animation settings
        this.animationDuration = 2000;
        this.staggerDelay = 100;
        
        // Dice face position mapping - matches what CSS .show-* transforms actually display
        this.facePositions = {
            '9': { x: 0, y: 0 },      // Shows 9 (Front)   - rotateY(0deg) rotateX(0deg)
            '10': { x: 0, y: 90 },    // Shows 10 (Right)  - rotateY(90deg) rotateX(0deg) 
            'J': { x: 0, y: 180 },    // Shows J (Back)    - rotateY(180deg) rotateX(0deg)
            'Q': { x: 0, y: -90 },    // Shows Q (Left)    - rotateY(-90deg) rotateX(0deg)
            'K': { x: 90, y: 0 },     // Shows K (Top)     - rotateY(0deg) rotateX(90deg) 
            'A': { x: -90, y: 0 }     // Shows A (Bottom)  - rotateY(0deg) rotateX(-90deg)
        };
        
        // Track current positions of each die (start with all showing King)
        this.currentDicePositions = [
            { x: 90, y: 0 }, // Die 1 - showing King
            { x: 90, y: 0 }, // Die 2 - showing King  
            { x: 90, y: 0 }, // Die 3 - showing King
            { x: 90, y: 0 }, // Die 4 - showing King
            { x: 90, y: 0 }  // Die 5 - showing King
        ];
        
        // Statistics
        this.gameStats = {
            totalGames: 0,
            totalWagered: 0,
            totalWon: 0,
            wins: 0,
            losses: 0,
            ties: 0
        };
        
        this.init();
        
        // Add to window for debugging
        window.testDiceFaces = () => this.testAllFaces();
    }
    
    init() {
        console.log('🎲 Initializing Player vs House Poker Dice Game - VERSION 2.1 (Fixed Mappings)...');
        console.log('📍 Face positions:', this.facePositions);
        
        const initBalance = () => {
            if (typeof UnifiedBalanceSystem !== 'undefined') {
                this.balanceSystem = new UnifiedBalanceSystem();
                this.setupEventListeners();
                this.loadGameStats();
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
        
        // Bet controls
        document.getElementById('betUp')?.addEventListener('click', () => this.changeBet(1));
        document.getElementById('betDown')?.addEventListener('click', () => this.changeBet(-1));
        document.getElementById('betAmount')?.addEventListener('input', (e) => this.setBet(e.target.value));
        
        // Update UI periodically
        if (this.balanceSystem) {
            this.refreshBalance();
            setInterval(() => {
                this.refreshBalance();
                this.updateMainButton();
            }, 1000);
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
            default:
                // Button should be disabled in other states
                break;
        }
    }
    
    async startGame() {
        const betAmount = parseInt(document.getElementById('betAmount')?.value) || 1;
        
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
        this.updateGameStatus('Rolling your dice...');
        this.updateMainButton();
        
        // Generate and animate player dice
        this.generatePlayerRoll();
        this.animatePlayerDice();
        
        // After animation, allow holds
        setTimeout(() => {
            this.gameState = 'player_hold';
            this.showHoldControls();
            this.updateGameStatus('Click dice to hold, then re-roll the rest');
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
            if (die) {
                // Add visual feedback for clickable state
                die.style.cursor = 'pointer';
                die.style.transition = 'filter 0.3s ease, transform 0.2s ease';
                
                // Remove any existing click listeners
                die.removeEventListener('click', die._holdClickHandler);
                
                // Add click handler
                die._holdClickHandler = () => this.toggleDieHold(i);
                die.addEventListener('click', die._holdClickHandler);
                
                // Reset visual state
                die.style.filter = 'none';
                die.style.transform = die.style.transform || '';
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
            const die = document.getElementById(`playerDie${i}`);
            if (die) {
                // Remove click handler
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
        
        const betAmount = parseInt(document.getElementById('betAmount')?.value) || 1;
        
        let result, payout = 0;
        
        if (playerHand.rank > houseHand.rank) {
            result = 'You Win!';
            payout = betAmount * 2; // 2:1 payout
            this.balanceSystem.addBalance(payout, 'poker_dice_win');
            this.gameStats.wins++;
        } else if (playerHand.rank < houseHand.rank) {
            result = 'House Wins';
            payout = 0;
            this.gameStats.losses++;
        } else {
            // Tie - compare high card or return bet
            if (this.compareHighCards(this.playerDice, this.houseDice) > 0) {
                result = 'You Win! (High Card)';
                payout = betAmount * 2;
                this.balanceSystem.addBalance(payout, 'poker_dice_win');
                this.gameStats.wins++;
            } else if (this.compareHighCards(this.playerDice, this.houseDice) < 0) {
                result = 'House Wins (High Card)';
                payout = 0;
                this.gameStats.losses++;
            } else {
                result = 'Tie - Push';
                payout = betAmount; // Return bet
                this.balanceSystem.addBalance(payout, 'poker_dice_push');
                this.gameStats.ties++;
            }
        }
        
        this.gameStats.totalGames++;
        this.gameStats.totalWagered += betAmount;
        this.gameStats.totalWon += payout;
        this.saveGameStats();
        
        this.showGameResult(result, payout, betAmount, playerHand.name, houseHand.name);
        
        this.gameState = 'complete';
        this.updateMainButton();
        this.updateGameStatus('Game complete! Ready for next round');
        
        // Auto-reset after 5 seconds
        setTimeout(() => {
            this.resetGame();
        }, 5000);
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
    
    showGameResult(result, payout, bet, playerHand, houseHand) {
        const resultDiv = document.getElementById('gameResult');
        const resultText = document.getElementById('resultText');
        const payoutText = document.getElementById('payoutText');
        
        if (resultDiv && resultText && payoutText) {
            resultDiv.style.display = 'block';
            resultText.textContent = result;
            
            if (payout > bet) {
                payoutText.textContent = `Won: ${payout} tokens!`;
                resultDiv.className = 'current-hand winning-hand';
            } else if (payout === bet) {
                payoutText.textContent = `Push: ${payout} tokens returned`;
                resultDiv.className = 'current-hand';
            } else {
                payoutText.textContent = `Lost: ${bet} tokens`;
                resultDiv.className = 'current-hand';
            }
            
            setTimeout(() => {
                resultDiv.style.display = 'none';
            }, 5000);
        }
        
        console.log(`Player: ${playerHand} vs House: ${houseHand} = ${result}`);
    }
    
    async updateMainButton() {
        const button = document.getElementById('pokerDiceRollButton');
        if (!button) return;
        
        const betAmount = parseInt(document.getElementById('betAmount')?.value) || 1;
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
        
        // Reset displays
        const playerHand = document.getElementById('playerHand');
        const houseHand = document.getElementById('houseHand');
        if (playerHand) playerHand.textContent = '-';
        if (houseHand) houseHand.textContent = '-';
        
        this.updateGameStatus('Place your bet and start playing!');
        this.updateMainButton();
    }
    
    // Hand evaluation logic (reuse from original)
    evaluateHand(dice) {
        const counts = {};
        const colors = {};
        
        dice.forEach(value => {
            counts[value] = (counts[value] || 0) + 1;
            const color = this.valueColors[value];
            colors[color] = (colors[color] || 0) + 1;
        });
        
        const countValues = Object.values(counts).sort((a, b) => b - a);
        const isFlush = Object.keys(colors).length === 1;
        const isStraight = this.isStraight(dice);
        
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
        if (isFlush) {
            return { name: 'Flush', rank: this.handRankings['Flush'] };
        }
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
        const betInput = document.getElementById('betAmount');
        if (!betInput) return;
        
        const currentBet = parseInt(betInput.value) || 1;
        const newBet = Math.max(1, Math.min(100, currentBet + delta));
        betInput.value = newBet;
        this.setBet(newBet);
    }
    
    setBet(amount) {
        const bet = Math.max(1, parseInt(amount) || 1);
        document.getElementById('betAmount').value = bet;
        this.updateMainButton();
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
        const message = `🎲 Insufficient tokens!\\n\\nYou need ${needed} tokens to play, but you only have ${current}.\\n\\n💡 Use the faucet button to claim free tokens!`;
        alert(message);
    }
    
    saveGameStats() {
        try {
            localStorage.setItem('pokerDiceVsHouseStats', JSON.stringify(this.gameStats));
        } catch (error) {
            console.error('Error saving game stats:', error);
        }
    }
    
    loadGameStats() {
        try {
            const savedStats = localStorage.getItem('pokerDiceVsHouseStats');
            if (savedStats) {
                this.gameStats = { ...this.gameStats, ...JSON.parse(savedStats) };
            }
        } catch (error) {
            console.error('Error loading game stats:', error);
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
}

// Make available globally
window.PokerDiceGame = PokerDiceGame;
