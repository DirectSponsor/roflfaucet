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
        
        // Big Win Pool (Andy's system)
        this.bigWinPool = 0;
        this.bigWinThreshold = 1000; // "4 figures to look big"
        
        // Symbol definitions (classic casino fruits + specials)
        this.symbols = [
            { emoji: '🍒', name: 'cherry', value: 35, weight: 35 },      // Cherry - most common
            { emoji: '🍌', name: 'banana', value: 15, weight: 25 },      // Banana  
            { emoji: '🍉', name: 'watermelon', value: 12, weight: 20 },  // Watermelon
            { emoji: '🍊', name: 'orange', value: 8, weight: 15 },       // Orange (extra variety)
            { emoji: '🔴', name: 'seven', value: 400, weight: 3 },       // Lucky 7 - Jackpot!
            { emoji: '📊', name: 'bar', value: 75, weight: 2 }          // BAR symbol - rarest
        ];
        
        // Payout combinations (player-favored economics)
        this.payouts = {
            // Triple matches - generous payouts
            '🔴🔴🔴': 400,    // Triple 7s - Jackpot
            '📊📊📊': 75,     // Triple BARs
            '🍒🍒🍒': 35,     // Triple Cherries
            '🍌🍌🍌': 15,     // Triple Bananas
            '🍉🍉🍉': 12,     // Triple Watermelons
            '🍊🍊🍊': 10,     // Triple Oranges
            
            // Partial matches - frequent smaller wins
            '🔴🍒_': 15,      // 7 + Cherry + Any
            '🍒🍒_': 8,       // Two Cherries + Any
            '🍒__': 5,        // One Cherry + Any + Any
            '🍌🍌_': 6,       // Two Bananas + Any
            '🍉🍉_': 5,       // Two Watermelons + Any
            '🍊🍊_': 4,       // Two Oranges + Any
            
            // Loss (but with long-term player advantage built into weights)
            'no_match': 0     // Real loss, but rare due to generous symbol weights
        };
        
        // Player advantage system - returns 105% over time (house edge = -5%)
        this.playerAdvantage = 1.05;
        
        // Level system (Andy's progression economics)
        this.levels = {
            1: { cost: 0, multiplier: 1.0, maxBet: 1 },
            2: { cost: 50, multiplier: 1.2, maxBet: 2 },
            3: { cost: 150, multiplier: 1.5, maxBet: 3 },
            4: { cost: 300, multiplier: 1.8, maxBet: 4 },
            5: { cost: 500, multiplier: 2.0, maxBet: 5 }
        };
        
        // Ensure bet is compatible with demo balance
        this.currentBet = 1; // Default bet for demo
    }
    
    async initializeGame() {
        await this.loadUserData();
        this.setupEventListeners();
        this.updateDisplay();
        this.populateReels();
        console.log('🎰 Casino Slot Machine initialized!');
    }
    
    async loadUserData() {
        console.log('🎰 Starting loadUserData()');
        // Check if user is logged in (using your OAuth system)
        this.isLoggedIn = await this.checkLoginStatus();
        console.log('🎰 Login status checked, isLoggedIn:', this.isLoggedIn);
        
        if (this.isLoggedIn) {
            // Logged-in users: Load real balance from API
            console.log('🎰 Loading real user data...');
            await this.loadRealUserData();
        } else {
            // Anonymous users: Use localStorage for demo play
            console.log('🎰 Loading demo user data...');
            this.loadDemoUserData();
        }
        console.log('🎰 loadUserData() completed, credits:', this.credits);
    }
    
    async checkLoginStatus() {
        // Integration with your existing OAuth system
        console.log('🎰 Checking login status...');
        try {
            const token = localStorage.getItem('oauth_simple_token');
            console.log('🎰 Token check:', token ? 'Token found' : 'No token');
            if (!token) {
                console.log('🎰 No token found, returning false');
                return false;
            }
            
            // You can expand this to validate token with your auth API
            console.log('🎰 Token found, returning true');
            return true;
        } catch (error) {
            console.log('🎰 Error in checkLoginStatus:', error);
            console.log('🎰 Not logged in, using demo mode');
            return false;
        }
    }
    
    async loadRealUserData() {
        try {
            // Call your existing balance API
            const response = await fetch('/api/user/balance', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('oauth_simple_token')}`
                }
            });
            const data = await response.json();
            
            this.credits = data.spendableBalance || 100;
            this.userLevel = data.level || 1;
            
            // Load slot-specific stats from localStorage as backup
            const slotStats = localStorage.getItem('slotMachineStats');
            if (slotStats) {
                const stats = JSON.parse(slotStats);
                this.totalSpins = stats.totalSpins || 0;
                this.totalWagered = stats.totalWagered || 0;
                this.totalWon = stats.totalWon || 0;
                this.bigWinPool = stats.bigWinPool || 0;
            }
        } catch (error) {
            console.error('Failed to load real user data:', error);
            // Fallback to demo mode
            this.isLoggedIn = false;
            this.loadDemoUserData();
        }
    }
    
    loadDemoUserData() {
        // Anonymous users: Use localStorage for demo
        const saved = localStorage.getItem('slotMachineDemo');
        console.log('🎰 Loading demo user data, saved data:', saved);
        if (saved) {
            const data = JSON.parse(saved);
            this.credits = data.credits || 0; // Load exact balance, no minimum
            this.userLevel = data.userLevel || 1;
            this.totalSpins = data.totalSpins || 0;
            this.totalWagered = data.totalWagered || 0;
            this.totalWon = data.totalWon || 0;
            this.bigWinPool = data.bigWinPool || 0;
            console.log('🎰 Returning demo user loaded with credits:', this.credits);
        } else {
            // New demo users start with 0 - must claim free credits
            this.credits = 0; // Start at 0, encourage using free credits button
            console.log('🎰 New demo user created with credits:', this.credits);
        }
    }
    
    async saveUserData() {
        if (this.isLoggedIn) {
            // Logged-in users: Save to API with transaction tracking
            await this.saveRealUserData();
        } else {
            // Anonymous users: Save to localStorage for demo
            this.saveDemoUserData();
        }
    }
    
    async saveRealUserData() {
        try {
            // Save slot-specific stats to localStorage
            const slotStats = {
                totalSpins: this.totalSpins,
                totalWagered: this.totalWagered,
                totalWon: this.totalWon,
                bigWinPool: this.bigWinPool
            };
            localStorage.setItem('slotMachineStats', JSON.stringify(slotStats));
            
            // Balance is managed by API calls during gameplay
            // No need to save credits here as they're handled in real-time
        } catch (error) {
            console.error('Failed to save real user data:', error);
        }
    }
    
    saveDemoUserData() {
        const data = {
            credits: this.credits,
            userLevel: this.userLevel,
            totalSpins: this.totalSpins,
            totalWagered: this.totalWagered,
            totalWon: this.totalWon,
            bigWinPool: this.bigWinPool
        };
        localStorage.setItem('slotMachineDemo', JSON.stringify(data));
    }
    
    setupEventListeners() {
        // Make functions globally accessible
        window.spinReels = () => this.spin();
        window.increaseBet = () => this.adjustBet(1);
        window.decreaseBet = () => this.adjustBet(-1);
        window.claimWinnings = () => this.claimWinnings();
        window.toggleMachineView = () => this.toggleMachineView();
    }
    
    populateReels() {
        for (let i = 1; i <= 3; i++) {
            const reel = document.getElementById(`reel${i}`);
            reel.innerHTML = '';
            
            // Create symbols container for smooth scrolling
            const symbolsContainer = document.createElement('div');
            symbolsContainer.className = 'symbols-container';
            
            // Create many symbols for continuous spinning effect
            // Need enough symbols to cover the animation distance
            for (let j = 0; j < 15; j++) {
                const symbol = this.getRandomSymbol();
                const symbolDiv = document.createElement('div');
                symbolDiv.className = 'symbol';
                symbolDiv.textContent = symbol.emoji;
                symbolDiv.dataset.name = symbol.name;
                symbolDiv.dataset.value = symbol.value;
                symbolsContainer.appendChild(symbolDiv);
            }
            
            reel.appendChild(symbolsContainer);
        }
    }
    
    getRandomSymbol() {
        const totalWeight = this.symbols.reduce((sum, s) => sum + s.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const symbol of this.symbols) {
            random -= symbol.weight;
            if (random <= 0) {
                return symbol;
            }
        }
        return this.symbols[0]; // Fallback
    }
    
    async spin() {
        if (this.isSpinning || this.credits < this.currentBet) {
            return;
        }
        
        this.isSpinning = true;
        
        // Process bet deduction based on user type
        if (this.isLoggedIn) {
            await this.processBet(this.currentBet);
        } else {
            this.credits -= this.currentBet;
        }
        
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
            reel.classList.remove('stopping', 'bounce', 'spinning');
            reel.classList.add('accelerating');
            
            // Transition to full speed after acceleration
            setTimeout(() => {
                reel.classList.remove('accelerating');
                reel.classList.add('spinning');
            }, 800); // Match acceleration duration
        }
        
        document.getElementById('spin-btn').classList.add('spinning');
    }
    
    async stopReelsSequentially(result) {
        // Wait for acceleration to complete before starting to stop reels
        const baseDelay = 800; // Wait for acceleration
        const delays = [baseDelay + 400, baseDelay + 800, baseDelay + 1200]; // Staggered stopping
        
        for (let i = 0; i < 3; i++) {
            await new Promise(resolve => {
                setTimeout(() => {
                    this.stopReel(i + 1, result.symbols[i]);
                    resolve();
                }, delays[i]);
            });
        }
        
        // Wait for all animations to complete before removing spinning state
        setTimeout(() => {
            document.getElementById('spin-btn').classList.remove('spinning');
        }, 500);
    }
    
    stopReel(reelNumber, targetSymbol) {
        const reel = document.getElementById(`reel${reelNumber}`);
        reel.classList.remove('spinning', 'accelerating');
        reel.classList.add('stopping');
        
        // After animation completes, update the visible symbols without breaking animation
        setTimeout(() => {
            const symbolsContainer = reel.querySelector('.symbols-container');
            const symbols = symbolsContainer.querySelectorAll('.symbol');
            
            // Reset any previous transform and find the symbols in the visible area
            symbolsContainer.style.transform = '';
            
            // Update the first 3 symbols (which should be visible after the animation)
            // Symbol 0: top visible
            // Symbol 1: center visible (main target) 
            // Symbol 2: bottom visible
            if (symbols[0]) {
                const randomTop = this.getRandomSymbol();
                symbols[0].textContent = randomTop.emoji;
                symbols[0].dataset.name = randomTop.name;
                symbols[0].dataset.value = randomTop.value;
            }
            
            if (symbols[1]) {
                symbols[1].textContent = targetSymbol.emoji;
                symbols[1].dataset.name = targetSymbol.name;
                symbols[1].dataset.value = targetSymbol.value;
            }
            
            if (symbols[2]) {
                const randomBottom = this.getRandomSymbol();
                symbols[2].textContent = randomBottom.emoji;
                symbols[2].dataset.name = randomBottom.name;
                symbols[2].dataset.value = randomBottom.value;
            }
            
            reel.classList.remove('stopping');
            reel.classList.add('bounce');
            
            setTimeout(() => {
                reel.classList.remove('bounce');
            }, 600);
        }, 1200);
    }
    
    calculateWinResult() {
        const levelMultiplier = this.levels[this.userLevel].multiplier;
        
        // Check for big win opportunity first
        const shouldGiveBigWin = this.shouldTriggerBigWin();
        
        if (shouldGiveBigWin) {
            return this.createBigWin();
        }
        
        // Generate three random symbols
        const symbol1 = this.getRandomSymbol();
        const symbol2 = this.getRandomSymbol();
        const symbol3 = this.getRandomSymbol();
        const symbols = [symbol1, symbol2, symbol3];
        
        // Check for winning combinations
        let winAmount = this.calculatePayoutAmount(symbols, levelMultiplier);
        
        return {
            isWin: winAmount > 0,
            isBigWin: false,
            symbols: symbols,
            winAmount: winAmount
        };
    }
    
    calculatePayoutAmount(symbols, multiplier = 1) {
        const [s1, s2, s3] = symbols;
        const combo = s1.emoji + s2.emoji + s3.emoji;
        
        // Check for exact triple matches first
        if (this.payouts[combo]) {
            return Math.floor(this.payouts[combo] * this.currentBet * multiplier);
        }
        
        // Check for partial matches (generous system)
        if (s1.emoji === '🔴' && s2.emoji === '🍒') {
            return Math.floor(this.payouts['🔴🍒_'] * this.currentBet * multiplier);
        }
        
        if (s1.emoji === '🍒' && s2.emoji === '🍒') {
            return Math.floor(this.payouts['🍒🍒_'] * this.currentBet * multiplier);
        }
        
        if (s1.emoji === '🍌' && s2.emoji === '🍌') {
            return Math.floor(this.payouts['🍌🍌_'] * this.currentBet * multiplier);
        }
        
        if (s1.emoji === '🍉' && s2.emoji === '🍉') {
            return Math.floor(this.payouts['🍉🍉_'] * this.currentBet * multiplier);
        }
        
        if (s1.emoji === '🍊' && s2.emoji === '🍊') {
            return Math.floor(this.payouts['🍊🍊_'] * this.currentBet * multiplier);
        }
        
        if (s1.emoji === '🍒') {
            return Math.floor(this.payouts['🍒__'] * this.currentBet * multiplier);
        }
        
        // True loss - but weighted to be uncommon (anti-casino economics)
        return this.payouts.no_match;
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
            
            // Highlight winning symbols
            this.highlightWinningSymbols();
            
            // Wait for animation
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            overlay.classList.remove('show');
        } else if (result.isWin) {
            // Regular win highlight
            this.highlightWinningSymbols();
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        // Process winnings based on user type
        if (result.winAmount > 0) {
            await this.processWin(result.winAmount);
            this.lastWin = result.winAmount;
            this.totalWon += result.winAmount;
            this.enableClaimButton();
        }
        
        this.updateDisplay();
    }
    
    highlightWinningSymbols() {
        for (let i = 1; i <= 3; i++) {
            const reel = document.getElementById(`reel${i}`);
            const symbolsContainer = reel.querySelector('.symbols-container');
            const symbols = symbolsContainer.querySelectorAll('.symbol');
            
            // Find the symbol that should be in the middle of the visible area
            const targetIndex = Math.floor(symbols.length / 2) + 1;
            const middleSymbol = symbols[targetIndex];
            
            if (middleSymbol) {
                middleSymbol.classList.add('winning');
                
                setTimeout(() => {
                    middleSymbol.classList.remove('winning');
                }, 2000);
            }
        }
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
    
    toggleMachineView() {
        const machine = document.getElementById('slot-machine');
        machine.classList.toggle('flipped');
    }
    
    async processWin(amount) {
        if (this.isLoggedIn) {
            // Logged-in users: Add to real balance via API with transaction tracking
            await this.addToRealBalance(amount, 'gaming_temp');
        } else {
            // Anonymous users: Just add to localStorage balance
            this.credits += amount;
        }
    }
    
    async processBet(amount) {
        if (this.isLoggedIn) {
            // Logged-in users: Deduct from real balance via API with transaction tracking
            await this.subtractFromRealBalance(amount, 'gaming_temp');
        }
        // Anonymous users: Already deducted in spin() method
    }
    
    async addToRealBalance(amount, transactionType = 'gaming_temp') {
        try {
            const response = await fetch('/api/user/balance/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('oauth_simple_token')}`
                },
                body: JSON.stringify({
                    amount: amount,
                    source: transactionType,
                    description: `Slot machine win: ${amount} credits`
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.credits = data.newBalance;
            } else {
                console.error('Failed to add to real balance');
                // Fallback to local addition
                this.credits += amount;
            }
        } catch (error) {
            console.error('Error adding to real balance:', error);
            // Fallback to local addition
            this.credits += amount;
        }
    }
    
    async subtractFromRealBalance(amount, transactionType = 'gaming_temp') {
        try {
            const response = await fetch('/api/user/balance/subtract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('oauth_simple_token')}`
                },
                body: JSON.stringify({
                    amount: amount,
                    source: transactionType,
                    description: `Slot machine bet: ${amount} credits`
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.credits = data.newBalance;
            } else {
                console.error('Failed to subtract from real balance');
            }
        } catch (error) {
            console.error('Error subtracting from real balance:', error);
        }
    }
    
    showLoginPrompt() {
        // Show a notice to anonymous users about signing up
        const promptDiv = document.createElement('div');
        promptDiv.className = 'login-prompt';
        promptDiv.innerHTML = `
            <div class="login-prompt-content">
                <h3>🎰 Sign Up to Keep Your Winnings!</h3>
                <p>You've won <strong>${this.totalWon} demo credits</strong>!</p>
                <p>Create an account to convert them to real UselessCoins.</p>
                <button onclick="window.location.href='/auth'">Sign Up Now</button>
                <button onclick="this.parentElement.parentElement.remove()">Continue Demo</button>
            </div>
        `;
        document.body.appendChild(promptDiv);
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

        // Show different text for demo vs real mode
        const balanceLabel = document.querySelector('.control-label[for="current-balance"]');
        if (balanceLabel) {
            balanceLabel.textContent = this.isLoggedIn ? 'CREDITS' : 'DEMO CREDITS';
        }

        // Show login prompt for demo users with big wins
        if (!this.isLoggedIn && this.totalWon > 100 && this.totalSpins % 20 === 0) {
            this.showLoginPrompt();
        }

        // Toggle Free Credits or Faucet button based on user status
        const freeCreditsBtn = document.getElementById('claim-btn');
        if (this.isLoggedIn) {
            freeCreditsBtn.textContent = 'Go to Faucet';
            freeCreditsBtn.onclick = () => window.location.href = '/faucet';
            freeCreditsBtn.disabled = false;
        } else if (this.credits <= 1) {
            freeCreditsBtn.textContent = 'Claim Free Credits';
            freeCreditsBtn.onclick = () => {
                this.credits += 50;
                this.saveDemoUserData();
                this.updateDisplay();
            };
            freeCreditsBtn.disabled = false;
        } else {
            freeCreditsBtn.disabled = true;
        }

        // Update spin button state
        const spinBtn = document.getElementById('spin-btn');
        spinBtn.disabled = this.credits < this.currentBet || this.isSpinning;
    }
}

// Initialize the slot machine when page loads
document.addEventListener('DOMContentLoaded', async () => {
    window.slotMachine = new CasinoSlotMachine();
    await window.slotMachine.initializeGame();
});

