// =======================================
// CASINO SLOT MACHINE GAME ENGINE
// =======================================

class CasinoSlotMachine {
    constructor() {
        // Game State
        this.isSpinning = false;
        this.currentBet = 1;
        this.userLevel = 1;
        this.credits = 0;
        this.lastWin = 0;
        
        // Statistics
        this.totalSpins = 0;
        this.totalWagered = 0;
        this.totalWon = 0;
        
        // Current reel positions (starting positions)
        this.reelPositions = [0, 0, 0];
        
        // Stop positions (24 symbol positions matching the video exactly)
        this.totalStopPositions = 24;
        
        // Map positions to symbols (exact pattern from video generation script)
        // "cherries banana cherries watermelon cherries banana seven cherries watermelon cherries banana watermelon seven cherries watermelon banana cherries seven bar cherries banana watermelon cherries bigwin"
        this.positionToSymbol = [
            1, 2, 1, 3, 1, 2, 4, 1, 3, 1, 2, 3, 4, 1, 3, 2, 1, 4, 5, 1, 2, 3, 1, 6
        ];
        // 1=cherries, 2=banana, 3=watermelon, 4=seven, 5=bar, 6=bigwin
        
        // Symbol definitions for display and payouts (updated with new payout table)
        this.symbols = {
            'blank1': { emoji: '⚫', name: 'blank', value: 0 },
            'blank2': { emoji: '⚫', name: 'blank', value: 0 },
            'blank3': { emoji: '⚫', name: 'blank', value: 0 },
            'blank4': { emoji: '⚫', name: 'blank', value: 0 },
            'blank5': { emoji: '⚫', name: 'blank', value: 0 },
            'melon': { emoji: '🍉', name: 'melon', value: 8 },
            'banana': { emoji: '🍌', name: 'banana', value: 10 },
            'cherry': { emoji: '🍒', name: 'cherry', value: 12 },
            'combo1': { emoji: '🎰', name: 'combo1', value: 15 },
            'combo2': { emoji: '🎰', name: 'combo2', value: 15 },
            'combo3': { emoji: '🎰', name: 'combo3', value: 15 },
            'seven': { emoji: '🔴', name: 'seven', value: 35 },
            'bar': { emoji: '📊', name: 'bar', value: 75 },
            'bigwin': { emoji: '💎', name: 'bigwin', value: 400 }
        };
        
        // Win combinations and payouts (updated with new payout table)
        this.winTable = {
            // All blanks
            'blank1,blank1,blank1': 2, 'blank1,blank1,blank2': 2, 'blank1,blank1,blank3': 2,
            'blank1,blank1,blank4': 2, 'blank1,blank1,blank5': 2, 'blank1,blank2,blank1': 2,
            'blank1,blank2,blank2': 2, 'blank1,blank2,blank3': 2, 'blank1,blank2,blank4': 2,
            'blank1,blank2,blank5': 2, 'blank1,blank3,blank1': 2, 'blank1,blank3,blank2': 2,
            'blank1,blank3,blank3': 2, 'blank1,blank3,blank4': 2, 'blank1,blank3,blank5': 2,
            'blank1,blank4,blank1': 2, 'blank1,blank4,blank2': 2, 'blank1,blank4,blank3': 2,
            'blank1,blank4,blank4': 2, 'blank1,blank4,blank5': 2, 'blank1,blank5,blank1': 2,
            'blank1,blank5,blank2': 2, 'blank1,blank5,blank3': 2, 'blank1,blank5,blank4': 2,
            'blank1,blank5,blank5': 2, 'blank2,blank1,blank1': 2, 'blank2,blank1,blank2': 2,
            'blank2,blank1,blank3': 2, 'blank2,blank1,blank4': 2, 'blank2,blank1,blank5': 2,
            'blank2,blank2,blank1': 2, 'blank2,blank2,blank2': 2, 'blank2,blank2,blank3': 2,
            'blank2,blank2,blank4': 2, 'blank2,blank2,blank5': 2, 'blank2,blank3,blank1': 2,
            'blank2,blank3,blank2': 2, 'blank2,blank3,blank3': 2, 'blank2,blank3,blank4': 2,
            'blank2,blank3,blank5': 2, 'blank2,blank4,blank1': 2, 'blank2,blank4,blank2': 2,
            'blank2,blank4,blank3': 2, 'blank2,blank4,blank4': 2, 'blank2,blank4,blank5': 2,
            'blank2,blank5,blank1': 2, 'blank2,blank5,blank2': 2, 'blank2,blank5,blank3': 2,
            'blank2,blank5,blank4': 2, 'blank2,blank5,blank5': 2, 'blank3,blank1,blank1': 2,
            'blank3,blank1,blank2': 2, 'blank3,blank1,blank3': 2, 'blank3,blank1,blank4': 2,
            'blank3,blank1,blank5': 2, 'blank3,blank2,blank1': 2, 'blank3,blank2,blank2': 2,
            'blank3,blank2,blank3': 2, 'blank3,blank2,blank4': 2, 'blank3,blank2,blank5': 2,
            'blank3,blank3,blank1': 2, 'blank3,blank3,blank2': 2, 'blank3,blank3,blank3': 2,
            'blank3,blank3,blank4': 2, 'blank3,blank3,blank5': 2, 'blank3,blank4,blank1': 2,
            'blank3,blank4,blank2': 2, 'blank3,blank4,blank3': 2, 'blank3,blank4,blank4': 2,
            'blank3,blank4,blank5': 2, 'blank3,blank5,blank1': 2, 'blank3,blank5,blank2': 2,
            'blank3,blank5,blank3': 2, 'blank3,blank5,blank4': 2, 'blank3,blank5,blank5': 2,
            'blank4,blank1,blank1': 2, 'blank4,blank1,blank2': 2, 'blank4,blank1,blank3': 2,
            'blank4,blank1,blank4': 2, 'blank4,blank1,blank5': 2, 'blank4,blank2,blank1': 2,
            'blank4,blank2,blank2': 2, 'blank4,blank2,blank3': 2, 'blank4,blank2,blank4': 2,
            'blank4,blank2,blank5': 2, 'blank4,blank3,blank1': 2, 'blank4,blank3,blank2': 2,
            'blank4,blank3,blank3': 2, 'blank4,blank3,blank4': 2, 'blank4,blank3,blank5': 2,
            'blank4,blank4,blank1': 2, 'blank4,blank4,blank2': 2, 'blank4,blank4,blank3': 2,
            'blank4,blank4,blank4': 2, 'blank4,blank4,blank5': 2, 'blank4,blank5,blank1': 2,
            'blank4,blank5,blank2': 2, 'blank4,blank5,blank3': 2, 'blank4,blank5,blank4': 2,
            'blank4,blank5,blank5': 2, 'blank5,blank1,blank1': 2, 'blank5,blank1,blank2': 2,
            'blank5,blank1,blank3': 2, 'blank5,blank1,blank4': 2, 'blank5,blank1,blank5': 2,
            'blank5,blank2,blank1': 2, 'blank5,blank2,blank2': 2, 'blank5,blank2,blank3': 2,
            'blank5,blank2,blank4': 2, 'blank5,blank2,blank5': 2, 'blank5,blank3,blank1': 2,
            'blank5,blank3,blank2': 2, 'blank5,blank3,blank3': 2, 'blank5,blank3,blank4': 2,
            'blank5,blank3,blank5': 2, 'blank5,blank4,blank1': 2, 'blank5,blank4,blank2': 2,
            'blank5,blank4,blank3': 2, 'blank5,blank4,blank4': 2, 'blank5,blank4,blank5': 2,
            'blank5,blank5,blank1': 2, 'blank5,blank5,blank2': 2, 'blank5,blank5,blank3': 2,
            'blank5,blank5,blank4': 2, 'blank5,blank5,blank5': 2,
            // Any fruits combination (simplified - will need to expand)
            'melon,banana,cherry': 5, 'melon,cherry,banana': 5, 'banana,melon,cherry': 5,
            'banana,cherry,melon': 5, 'cherry,melon,banana': 5, 'cherry,banana,melon': 5,
            // Matching symbols
            'melon,melon,melon': 8,
            'banana,banana,banana': 10,
            'cherry,cherry,cherry': 12,
            // Combo 1,2,3 (will need to implement combo logic)
            'combo1,combo2,combo3': 15,
            // High value matches
            'seven,seven,seven': 35,
            'bar,bar,bar': 75,
            'bigwin,bigwin,bigwin': 400
        };
        
        // Create fixed reel strips that loop infinitely
        this.reelStrips = this.createReelStrips();
        
        // Level system (Andy's progression economics)
        this.levels = {
            1: { cost: 0, multiplier: 1.0, maxBet: 1 },
            2: { cost: 50, multiplier: 1.2, maxBet: 2 },
            3: { cost: 150, multiplier: 1.5, maxBet: 3 },
            4: { cost: 300, multiplier: 1.8, maxBet: 4 },
            5: { cost: 500, multiplier: 2.0, maxBet: 5 }
        };
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.loadUserData();
        this.setupEventListeners();
        this.updateDisplay();
        this.populateReels();
        console.log('🎰 Casino Slot Machine initialized!');
    }
    
    loadUserData() {
        // Load from your existing OAuth/balance system
        // For now, using localStorage for demo
        const saved = localStorage.getItem('slotMachineData');
        if (saved) {
            const data = JSON.parse(saved);
            this.credits = data.credits || 0;
            this.userLevel = data.userLevel || 1;
            this.totalSpins = data.totalSpins || 0;
            this.totalWagered = data.totalWagered || 0;
            this.totalWon = data.totalWon || 0;
            this.bigWinPool = data.bigWinPool || 0;
        } else {
            // New user gets starting credits
            this.credits = 100;
        }
    }
    
    saveUserData() {
        const data = {
            credits: this.credits,
            userLevel: this.userLevel,
            totalSpins: this.totalSpins,
            totalWagered: this.totalWagered,
            totalWon: this.totalWon,
            bigWinPool: this.bigWinPool
        };
        localStorage.setItem('slotMachineData', JSON.stringify(data));
    }
    
    createReelStrips() {
        // NEW: List-based approach with player-favorable distribution
        // Each reel uses the same virtual list with proper symbol frequencies
        const virtualReelList = [
            // Very high frequency (small wins keep players engaged)
            'blank1', 'blank2', 'blank3', 'blank4', 'blank5',           // 5 blanks (17%)
            'melon', 'melon', 'melon', 'melon', 'melon', 'melon', 'melon', 'melon',  // 8 melons (27%)
            'banana', 'banana', 'banana', 'banana', 'banana', 'banana', 'banana',    // 7 bananas (23%)
            'cherry', 'cherry', 'cherry', 'cherry', 'cherry', 'cherry',              // 6 cherries (20%)
            
            // Medium frequency (good wins)
            'combo1', 'combo2', 'combo3',                               // 3 combo pieces (10%)
            
            // Rare but not impossible (exciting wins)
            'seven',                                                    // 1 seven (3%)
            'bar',                                                     // 1 bar (rare)
            'bigwin'                                                   // 1 bigwin (jackpot)
        ];
        
        // Each reel gets its own copy of the list for independent outcomes
        return {
            reel1: [...virtualReelList],
            reel2: [...virtualReelList],
            reel3: [...virtualReelList]
        };
    }
    
    setupEventListeners() {
        // Make functions globally accessible
        window.spinReels = () => this.spin();
        window.increaseBet = () => this.adjustBet(1);
        window.decreaseBet = () => this.adjustBet(-1);
        window.claimWinnings = () => this.claimWinnings();
        window.toggleMachineView = () => this.toggleMachineView();
    }
    
    toggleMachineView() {
        const machine = document.getElementById('slot-machine');
        machine.classList.toggle('flipped');
    }
    
    populateReels() {
        // OLD DOM-BASED REELS DISABLED - NOW USING VIDEO REELS
        console.log('🎰 Using video reels instead of DOM elements');
        // Video reels are loaded directly in HTML
        // No need to populate DOM elements anymore
    }
    
    getRandomSymbol() {
        // Simple random symbol selection from object
        const symbolKeys = Object.keys(this.symbols);
        const randomKey = symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
        return this.symbols[randomKey];
    }
    
    async spin() {
        if (this.isSpinning || this.credits < this.currentBet) {
            return;
        }
        
        this.isSpinning = true;
        this.credits -= this.currentBet;
        this.totalSpins++;
        this.totalWagered += this.currentBet;
        
        // Add to big win pool (Andy's system)
        this.bigWinPool += this.currentBet * 0.1; // 10% goes to big win pool
        
        this.updateDisplay();
        this.disableControls();
        
        // Start reel animations
        this.startReelSpinning();
        
        // Determine win result BEFORE stopping (fair but feels authentic)
        const result = this.calculateWinResult();
        
        // Stop reels with staggered timing (like real slots)
        await this.stopReelsSequentially(result);
        
        // Process win
        if (result.isWin) {
            await this.showWinAnimation(result);
        }
        
        this.isSpinning = false;
        this.enableControls();
        this.saveUserData();
    }
    
    startReelSpinning() {
        for (let i = 1; i <= 3; i++) {
            const reel = document.getElementById(`reel${i}`);
            const video = reel.querySelector('video');
            
            reel.classList.add('spinning');
            
            // Make sure video is playing and speed up for spinning effect
            if (video) {
                video.play();
                video.playbackRate = 3.0; // Speed up during spin (increased from 2x)
                console.log(`🎰 Reel ${i} spinning at 3x speed`);
            }
        }
        
        document.getElementById('spin-btn').classList.add('spinning');
    }
    
    async stopReelsSequentially(result) {
        const delays = [1000, 1500, 2000]; // Staggered stopping
        
        for (let i = 0; i < 3; i++) {
            await new Promise(resolve => {
                setTimeout(() => {
                    this.stopReel(i + 1, result.symbols[i]);
                    resolve();
                }, delays[i]);
            });
        }
        
        // Now check the actual win result based on where the reels stopped
        const actualResult = this.checkWinAfterStop();
        
        // Process win if there is one
        if (actualResult.isWin) {
            await this.showWinAnimation(actualResult);
        }
        
        document.getElementById('spin-btn').classList.remove('spinning');
    }
    
    stopReel(reelNumber, targetSymbol) {
        const reel = document.getElementById(`reel${reelNumber}`);
        const video = reel.querySelector('video');
        
        if (video) {
            // NEW: Get the predetermined outcome from calculateWinResult
            const targetSymbolName = this.selectedOutcomes[reelNumber - 1];
            
            // NEW: Map symbol names to exact frame numbers in our 12-symbol video
            // Video: 3.6 seconds at 60fps = 216 frames total
            // Strip: 6 symbols (900px) scrolled in window = 216/6 = 36 frames per symbol
const symbolToFrame = {
    // 10 symbols with perfect 12-frame spacing
    'watermelon': 12,    // Symbol 1: center at frame 12 (0.2s)
    'banana': 24,        // Symbol 2: center at frame 24 (0.4s) 
    'cherry': 36,        // Symbol 3: center at frame 36 (0.6s)
    'seven': 48,         // Symbol 4: center at frame 48 (0.8s)
    'bar': 60,           // Symbol 5: center at frame 60 (1.0s)
    'bigwin': 72,        // Symbol 6: center at frame 72 (1.2s)
    'watermelon2': 84,   // Symbol 7: repeat watermelon
    'banana2': 96,       // Symbol 8: repeat banana
    'cherry2': 108,      // Symbol 9: repeat cherry
    'seven2': 120,       // Symbol 10: repeat seven
    
    // Gap positions (perfect 12-frame spacing)
    'gap1': 6,           // Between start and symbol 1
    'gap2': 18,          // Between symbols 1-2
    'gap3': 30,          // Between symbols 2-3
    'gap4': 42,          // Between symbols 3-4
    'gap5': 54,          // Between symbols 4-5
    'gap6': 66,          // Between symbols 5-6
    'gap7': 78,          // Between symbols 6-7
    'gap8': 90,          // Between symbols 7-8
    'gap9': 102,         // Between symbols 8-9
    'gap10': 114,        // Between symbols 9-10
    
    // Aliases for list-based system
    'melon': 12,         // watermelon
    'blank1': 6,         // gap1
    'blank2': 18,        // gap2
    'blank3': 30,        // gap3
    'blank4': 42,        // gap4
    'blank5': 54         // gap5
};
            
            // Get target frame for this symbol
            const targetFrame = symbolToFrame[targetSymbolName] || 10; // Default to blank1
            
            // Convert frame to time for video.currentTime
            const frameRate = 60;
            const stopTime = targetFrame / frameRate;
            
            // Add some randomness to spin duration for natural feel
            const spinDuration = 1000 + Math.random() * 500; // 1-1.5 seconds
            
            // Animate to the target frame after spin duration
            setTimeout(() => {
                video.pause();
                video.currentTime = stopTime;
                video.playbackRate = 1.0; // Reset to normal speed
                
                console.log(`🎰 Reel ${reelNumber} stopped at ${targetSymbolName} (frame: ${targetFrame}, time: ${stopTime.toFixed(3)}s)`);
            }, spinDuration);
        }
        
        // Remove spinning class after animation
        setTimeout(() => {
            reel.classList.remove('spinning');
        }, 1200); // Slight delay after stopping
    }
    
    
    calculateWinResult() {
        // NEW: Use list-based selection for each reel
        const selectedSymbols = [];
        
        for (let i = 0; i < 3; i++) {
            const reelList = this.reelStrips[`reel${i + 1}`];
            const randomIndex = Math.floor(Math.random() * reelList.length);
            const selectedSymbol = reelList[randomIndex];
            selectedSymbols.push(selectedSymbol);
            
            console.log(`🎰 Reel ${i + 1} selected: ${selectedSymbol} (index ${randomIndex}/${reelList.length})`);
        }
        
        // Store selected symbols for stopReel to use
        this.selectedOutcomes = selectedSymbols;
        
        // Calculate win based on selected symbols
        const winKey = selectedSymbols.join(',');
        const winAmount = this.winTable[winKey] || 0;
        
        // Apply level multiplier
        const levelMultiplier = this.levels[this.userLevel].multiplier;
        const finalWinAmount = Math.floor(winAmount * this.currentBet * levelMultiplier);
        
        return {
            isWin: winAmount > 0,
            isBigWin: winAmount >= 100, // Lowered threshold for more excitement
            symbols: selectedSymbols,
            winAmount: finalWinAmount
        };
    }
    
    checkWinAfterStop() {
        // Get the symbols at the final reel positions
        const finalSymbols = [
            this.positionToSymbol[this.reelPositions[0]],
            this.positionToSymbol[this.reelPositions[1]],
            this.positionToSymbol[this.reelPositions[2]]
        ];
        
        // Check for winning combinations
        const winKey = finalSymbols.join(',');
        const winAmount = this.winTable[winKey] || 0;
        
        // Apply level multiplier
        const levelMultiplier = this.levels[this.userLevel].multiplier;
        const finalWinAmount = Math.floor(winAmount * this.currentBet * levelMultiplier);
        
        return {
            isWin: winAmount > 0,
            isBigWin: winAmount >= 1000,
            symbols: finalSymbols,
            winAmount: finalWinAmount
        };
    }
    
    shouldTriggerBigWin() {
        // Andy's big win algorithm
        const poolThreshold = this.bigWinThreshold;
        const timeBonus = this.totalSpins > 10; // Engagement reward
        const randomChance = Math.random() < 0.02; // 2% chance
        
        return this.bigWinPool >= poolThreshold && timeBonus && randomChance;
    }
    
    createBigWin() {
        const bigWinAmount = Math.floor(this.bigWinPool * 0.8); // Use 80% of pool
        this.bigWinPool *= 0.2; // Keep 20% for next big win
        
        // Create special big win symbols
        const bigWinSymbol = { emoji: '💎', name: 'bigwin', value: 50 };
        const symbols = [bigWinSymbol, bigWinSymbol, bigWinSymbol];
        
        return {
            isWin: true,
            isBigWin: true,
            symbols: symbols,
            winAmount: bigWinAmount
        };
    }
    
    async showWinAnimation(result) {
        if (result.isBigWin) {
            // Big win celebration
            const overlay = document.getElementById('win-overlay');
            const amountEl = document.getElementById('win-amount');
            
            amountEl.textContent = `${result.winAmount} Credits!`;
            overlay.classList.add('show');
            
            // Wait for animation
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            overlay.classList.remove('show');
        } else if (result.isWin) {
            // Regular win - just wait a moment
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Add winnings and enable claim
        this.credits += result.winAmount;
        this.lastWin = result.winAmount;
        this.totalWon += result.winAmount;
        
        if (result.winAmount > 0) {
            this.enableClaimButton();
        }
        
        this.updateDisplay();
    }
    
    
    enableClaimButton() {
        const claimBtn = document.getElementById('claim-btn');
        claimBtn.disabled = false;
        claimBtn.classList.add('pulsing');
    }
    
    claimWinnings() {
        // Integration point with your existing balance API
        if (this.lastWin > 0) {
            // Here you would call your existing claimTokens() function
            console.log(`🎰 Claiming ${this.lastWin} credits from slot machine!`);
            
            // For now, just disable the button
            const claimBtn = document.getElementById('claim-btn');
            claimBtn.disabled = true;
            claimBtn.classList.remove('pulsing');
            claimBtn.textContent = 'Credits Claimed!';
            
            setTimeout(() => {
                claimBtn.textContent = 'Click to claim Free Credits!';
            }, 2000);
            
            this.lastWin = 0;
            this.updateDisplay();
        }
    }
    
    adjustBet(change) {
        const maxBet = this.levels[this.userLevel].maxBet;
        const newBet = this.currentBet + change;
        
        if (newBet >= 1 && newBet <= maxBet && newBet <= this.credits) {
            this.currentBet = newBet;
            this.updateDisplay();
        }
    }
    
    disableControls() {
        document.getElementById('spin-btn').disabled = true;
        document.querySelectorAll('.bet-btn').forEach(btn => btn.disabled = true);
    }
    
    enableControls() {
        document.getElementById('spin-btn').disabled = false;
        document.querySelectorAll('.bet-btn').forEach(btn => btn.disabled = false);
    }
    
    updateDisplay() {
        // Update stats bar
        document.getElementById('total-spins').textContent = this.totalSpins.toLocaleString();
        document.getElementById('total-wagered').textContent = this.totalWagered.toLocaleString();
        document.getElementById('total-won').textContent = this.totalWon.toLocaleString();
        
        // Update control panel
        document.getElementById('last-win').textContent = this.lastWin;
        document.getElementById('current-balance').textContent = this.credits;
        document.getElementById('current-bet').textContent = this.currentBet;
        
        // Update spin button state
        const spinBtn = document.getElementById('spin-btn');
        spinBtn.disabled = this.credits < this.currentBet || this.isSpinning;
    }
}

// Initialize the slot machine when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎰 Initializing slot machine...');
    try {
        window.slotMachine = new CasinoSlotMachine();
        console.log('✅ Slot machine initialized successfully!');
    } catch (error) {
        console.error('❌ Error initializing slot machine:', error);
    }
});

