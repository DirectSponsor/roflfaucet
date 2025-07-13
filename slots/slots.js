// =======================================
// CASINO SLOT MACHINE SPRITE ENGINE
// =======================================
//
// 🎯 PROVABLY FAIR READY ARCHITECTURE 🎯
//
// This system is designed with provably fair gaming in mind - a revolutionary
// breakthrough that allows players to cryptographically verify that every 
// game outcome is truly random and not manipulated by the house.
//
// CURRENT STATE: Pure probability-based system using Math.random()
// - Virtual reel list controls probabilities transparently
// - No outcome fixing or manipulation
// - Deterministic position mapping
// - Perfect foundation for provably fair implementation
//
// FUTURE ENHANCEMENT: Replace Math.random() with seeded randomness
// - Client seed + Server seed + Nonce → Verifiable outcomes
// - Players can verify every spin result independently
// - Industry-standard cryptographic fairness
// - Trust through mathematics, not reputation
//
// "Provably fair gaming represents the evolution from 'trust us' to 'verify yourself'"
// - Every outcome becomes mathematically verifiable
// - Eliminates house manipulation concerns entirely
// - Promotes true fairness in online gaming
//
// TODO: Implement provably fair system (high priority future feature)
// =======================================

class CasinoSlotMachine {
    constructor() {
        // Game State
        this.isSpinning = false;
        this.currentBet = 1;
        this.userLevel = 1;
        this.credits = 0;

        // Statistics
        this.totalSpins = 0;
        this.totalWagered = 0;
        this.totalWon = 0;
        
        // Game Economy (local storage for testing)
        this.loadGameState();
        
        // Payout table based on virtual reel list design
        this.payoutTable = {
            // Special combinations
            'three_blanks': 2,        // All in-between stops
            'any_fruit': 5,           // Any 3 matching fruits
            'three_watermelon': 8,    // 3 watermelons
            'three_banana': 10,       // 3 bananas  
            'three_cherries': 12,     // 3 cherries
            'three_combo': 15,        // 3 combo pieces
            'three_seven': 35,        // 3 sevens
            'three_bar': 75,          // 3 bars
            'three_bigwin': 400,      // 3 bigwins (jackpot!)
            
            // Partial matches (2 of 3)
            'two_watermelon': 2,
            'two_banana': 3,
            'two_cherries': 4,
            'two_seven': 8,
            'two_bar': 15,
            'two_bigwin': 50
        };

        // Initialize game components
        this.reels = [
            document.getElementById('reel-1'),
            document.getElementById('reel-2'),
            document.getElementById('reel-3'),
        ];
        
        // Each reel has 10 symbols (150px each = 1500px total)
        // But we use 20 positions (10 symbols + 10 in-between = 75px each)
        this.totalSymbolsPerReel = 10;
        this.symbolHeight = 150;
        this.totalSpriteHeight = this.totalSymbolsPerReel * this.symbolHeight; // 1500px
        
        // 20 positions: 10 symbols + 10 in-between (75px increments)
        this.totalPositions = 20;
        this.positionHeight = 75; // 150px / 2 = 75px per position
        
        // Current background positions for each reel (0-19)
        this.currentPositions = [0, 0, 0];

        // Simple unified position-based system
        // All reels use the same sprite and same virtual list
        // Positions 0,2,4,6,8,10,12,14,16,18 = on-symbol (even positions)
        // Positions 1,3,5,7,9,11,13,15,17,19 = in-between (odd positions)
        
        // Position-based mapping - what's actually at each position in the sprite
        this.positionMap = {
            0: 'watermelon',    // Position 0 (what we see at top)
            1: 'blank',         // Between watermelon and banana
            2: 'banana',        // Position 2
            3: 'blank',         // Between banana and cherries  
            4: 'cherries',      // Position 4 (center in your screenshot)
            5: 'blank',         // Between cherries and seven
            6: 'seven',         // Position 6 (bottom visible)
            7: 'blank',         // Between seven and bar
            8: 'bar',           // Position 8
            9: 'blank',         // Between bar and bigwin
            10: 'bigwin',       // Position 10
            11: 'blank',        // Between bigwin and next symbol
            12: 'watermelon',   // Position 12 (second watermelon)
            13: 'blank',        // Between symbols
            14: 'banana',       // Position 14 (second banana)
            15: 'blank',        // Between symbols
            16: 'cherries',     // Position 16 (second cherries)
            17: 'blank',        // Between symbols
            18: 'seven',        // Position 18 (second seven)
            19: 'blank'         // Between symbols
        };
        
        // Simple virtual reel list - just position numbers
        this.virtualReelList = [
            // High frequency positions (common symbols)
            0, 0, 0, 0,        // Watermelon (position 0) - 4 entries
            2, 2, 2, 2, 2,     // Banana (position 2) - 5 entries  
            4, 4, 4, 4,        // Cherries (position 4) - 4 entries
            12, 12, 12,        // Watermelon (position 12) - 3 entries
            14, 14, 14,        // Banana (position 14) - 3 entries
            16, 16,            // Cherries (position 16) - 2 entries
            
            // Medium frequency positions
            6, 6,              // Seven (position 6) - 2 entries
            18,                // Seven (position 18) - 1 entry
            8,                 // Bar (position 8) - 1 entry
            
            // Low frequency positions  
            10, 10,            // BigWin (position 10) - 2 entries
            
            // Blank positions (in-between stops)
            1, 3, 5, 7, 9      // Various blank positions - 5 entries
        ];
        

        // Setup event listeners
        this.setupEventListeners();
        
        // Set initial positions for all reels to show 3 symbols
        this.initializeReelPositions();
        
        // Initialize display with loaded state
        this.updateDisplay();
        
        // Initialize audio system
        this.setupAudio();

        console.log('🎰 Casino Slot Machine with Sprite Background initialized!');
    }
    
    setupAudio() {
        // Create audio context and sound system
        this.audioContext = null;
        this.sounds = {};
        
        // Initialize audio context on first user interaction
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.loadSounds();
            }
        }, { once: true });
    }
    
    loadSounds() {
        // Sound stubs - to be replaced with actual audio files
        this.sounds = {
            reelThump: this.createTone(120, 0.1, 'square'),
            coinDrop: this.createTone(800, 0.05, 'sine'),
            win: this.createTone(440, 0.2, 'sine'),
            jackpot: this.createTone(660, 0.5, 'sine')
        };
    }
    
    createTone(frequency, duration, type = 'sine') {
        // Create a simple synthetic sound
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }
    
    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
    
    animateWinPayout(totalPayout, winResult) {
        // Play win sound
        if (winResult.type === 'three_bigwin') {
            this.playSound('jackpot');
        } else {
            this.playSound('win');
        }
        
        // Animate the payout counter
        const lastWinElement = document.getElementById('last-win');
        if (lastWinElement) {
            lastWinElement.classList.add('win-animation');
            
            // Animate the number from 0 to totalPayout
            this.animateCounter(lastWinElement, 0, totalPayout, 1000);
            
            // Remove animation class after animation completes
            setTimeout(() => {
                lastWinElement.classList.remove('win-animation');
            }, 1500);
        }
        
        // Animate coin drops
        this.animateCoins(totalPayout);
        
        // Update credits gradually
        this.animateCreditsIncrease(totalPayout);
        
        // Update total won
        this.totalWon += totalPayout;
        
        // Log the win
        console.log(`🎉 WIN! ${winResult.type} - Payout: ${winResult.payout}x bet = ${totalPayout} credits`);
        
        // Special jackpot message
        if (winResult.type === 'three_bigwin') {
            console.log('🎰💰 JACKPOT! THREE BIG WINS! 💰🎰');
        }
    }
    
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
        // Create coin drop animation
        const coinDrops = Math.min(totalPayout, 20); // Max 20 coins for performance
        
        for (let i = 0; i < coinDrops; i++) {
            setTimeout(() => {
                this.playSound('coinDrop');
                this.createCoinEffect();
            }, i * 50); // Stagger coin drops
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
                duration: 1000,
                easing: 'ease-in'
            }).onfinish = () => {
                coin.remove();
            };
        }
    }
    
    async animateCreditsIncrease(totalPayout) {
        const currentBalanceElement = document.getElementById('current-balance');
        const startCredits = this.credits;
        const endCredits = this.credits + totalPayout;
        
        // For logged-in users, process win transaction via API
        if (this.isLoggedIn && totalPayout > 0) {
            await this.processWinTransaction(totalPayout);
        } else {
            // For demo users, just update local balance
            this.credits = endCredits;
        }
        
        // Animate the credits counter
        this.animateCounter(currentBalanceElement, startCredits, endCredits, 800);
        
        // Save state
        this.saveGameState();
    }
    
    async processBetTransaction(amount) {
        try {
            const response = await fetch('https://data.directsponsor.org/api/user/transaction', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'spend',
                    amount: amount,
                    source: 'slots_bet',
                    site_id: 'roflfaucet',
                    description: `Slot machine bet: ${amount} credits`
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.credits = data.balance.current;
                console.log('✅ Bet transaction processed:', amount, 'New balance:', this.credits);
                return true;
            } else {
                console.log('⚠️ Bet transaction failed, falling back to demo mode');
                this.fallbackToDemoMode();
                return false;
            }
        } catch (error) {
            console.error('💥 Bet transaction error:', error);
            this.fallbackToDemoMode();
            return false;
        }
    }
    
    async processWinTransaction(amount) {
        try {
            const response = await fetch('https://data.directsponsor.org/api/user/transaction', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'gaming_win',
                    amount: amount,
                    source: 'slots_win',
                    site_id: 'roflfaucet',
                    description: `Slot machine win: ${amount} credits`
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.credits = data.balance.current;
                console.log('✅ Win transaction processed:', amount, 'New balance:', this.credits);
                return true;
            } else {
                console.log('⚠️ Win transaction failed, using local fallback');
                this.credits += amount;
                return false;
            }
        } catch (error) {
            console.error('💥 Win transaction error:', error);
            this.credits += amount;
            return false;
        }
    }
    
    showDemoCreditsPrompt() {
        const promptText = `🎰 Out of demo credits!\n\n` +
                          `💡 Get 50 free demo credits to keep playing?\n\n` +
                          `🔐 Sign up with JWT to play with real UselessCoins that work across all sites!`;
        
        if (confirm(promptText)) {
            this.addDemoCredits(50);
        }
    }
    
    addDemoCredits(amount) {
        this.credits += amount;
        this.updateDisplay();
        console.log(`🎁 Added ${amount} demo credits! New balance: ${this.credits}`);
        
        // No nagging - just let them play!
    }
    
    initializeReelPositions() {
        // Set initial positions for each reel
        this.reels.forEach((reel, index) => {
            // Start at position 0 (cherries)
            this.currentPositions[index] = 0;
            // Position sprite to show cherries in center
            reel.style.backgroundPosition = `0 0px`;
            
            console.log(`Reel ${index + 1} initialized at position 0`);
        });
    }

    setupEventListeners() {
        // Bind to the actual spin button in the HTML
        const spinButton = document.getElementById('spin-btn');
        if (spinButton) {
            spinButton.addEventListener('click', () => this.spinReels());
        }
    }

    async spinReels() {
        if (this.isSpinning) return;
        
        // Check if player has enough credits
        if (this.credits < this.currentBet) {
            console.log('❌ Not enough credits to spin!');
            if (!this.isLoggedIn && this.credits === 0) {
                this.showDemoCreditsPrompt();
            }
            return;
        }
        
        // For logged-in users, process bet transaction via API
        if (this.isLoggedIn) {
            const betSuccess = await this.processBetTransaction(this.currentBet);
            if (!betSuccess) {
                console.log('❌ Bet transaction failed!');
                return;
            }
        } else {
            // For demo users, deduct from local balance
            this.credits -= this.currentBet;
        }
        
        this.totalSpins++;
        this.totalWagered += this.currentBet;
        
        this.isSpinning = true;
        console.log(`🎰 Spinning with bet: ${this.currentBet} credits...`);
        
        // Update display immediately
        this.updateDisplay();
        
        // Start all reels spinning with CSS animation
        this.reels.forEach((reel, index) => {
            reel.classList.add('spinning');
        });

        // Stop reels sequentially like real slot machines
        this.stopReelsSequentially();
    }

    async stopReelsSequentially() {
        const delays = [2000, 2800, 3600]; // Staggered stopping like real slots
        const selectedSymbols = [];
        
        // Pre-calculate outcomes for all reels
        const outcomes = [];
        console.log('Virtual reel list size:', this.virtualReelList.length);
        console.log('Current positions before:', this.currentPositions);
        
        for (let i = 0; i < 3; i++) {
            // Pick from virtual reel list - now contains just position numbers
            const randomIndex = Math.floor(Math.random() * this.virtualReelList.length);
            const position = this.virtualReelList[randomIndex];
            
            // Look up what symbol is at this position
            const symbol = this.positionMap[position];
            
            // Calculate sprite positioning based on position
            const isInBetween = position % 2 === 1; // Odd positions are in-between
            const symbolIndex = Math.floor(position / 2); // Which symbol (0-9)
            
            outcomes.push({
                position: position,
                symbolIndex: symbolIndex,
                symbolName: symbol,
                virtualSymbol: symbol,
                isInBetween: isInBetween
            });
            
            console.log(`Reel ${i + 1}: position=${position}, symbol=${symbol}, symbolIndex=${symbolIndex}`);
        }
        
        // Stop each reel at different times
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.stopSingleReel(i, outcomes[i]);
                selectedSymbols.push(outcomes[i]);
                
                // If this is the last reel, finish up
                if (i === 2) {
                    setTimeout(() => {
                        this.isSpinning = false;
                        console.log(`Stopped on: ${selectedSymbols.join(', ')}`);
                        
                        // Process the spin result
                        this.processSpinResult(outcomes);
                    }, 600); // Wait for last reel animation
                }
            }, delays[i]);
        }
    }
    
    stopSingleReel(reelIndex, outcome) {
        const reel = this.reels[reelIndex];
        const position = outcome.position;
        
        // Stop the spinning animation
        reel.classList.remove('spinning');
        
        // Force a reflow
        reel.offsetHeight;
        
        // Position-based approach: use position directly
        // Each position is 75px apart (position 0 = 0px, position 1 = -75px, etc.)
        // We need to center the position in the middle of the 3-symbol window
        // Window height is 450px (3 symbols × 150px), so center is at 225px
        // Position the sprite so the selected position appears in the center
        
        const backgroundPositionY = -(position * this.positionHeight) + 150; // Center the position in middle slot
        
        reel.style.backgroundPosition = `0 ${backgroundPositionY}px`;
        
        // Update the stored position
        this.currentPositions[reelIndex] = position;
        
        // Play reel stop sound slightly after visual stop for better sync
        setTimeout(() => {
            this.playSound('reelThump');
        }, 70); // 70ms delay for audio to come after visual
        
        const isInBetween = position % 2 === 1;
        console.log(`Reel ${reelIndex + 1} stopped on position ${position} (${outcome.symbolName})`);
        console.log(`  In-between: ${isInBetween}`);
        console.log(`  Background position: 0 ${backgroundPositionY}px`);
    }

    loadGameState() {
        // Check if user is logged in via JWT
        this.accessToken = localStorage.getItem('jwt_simple_token');
        this.isLoggedIn = !!this.accessToken;
        
        if (this.isLoggedIn) {
            console.log('🔐 User logged in - loading real balance from API');
            this.loadRealBalance();
        } else {
            console.log('👤 Anonymous user - using demo credits');
            this.loadDemoCredits();
        }
    }
    
    loadDemoCredits() {
        // Load demo credits from localStorage for anonymous users
        const saved = localStorage.getItem('roflfaucet_slots_demo_state');
        if (saved) {
            const state = JSON.parse(saved);
            this.credits = state.credits || 0;
            this.totalSpins = state.totalSpins || 0;
            this.totalWagered = state.totalWagered || 0;
            this.totalWon = state.totalWon || 0;
        } else {
            // New demo user starts with 0 credits
            this.credits = 0;
        }
        this.updateDisplay();
    }
    
    async loadRealBalance() {
        try {
            const response = await fetch('https://data.directsponsor.org/api/dashboard?site_id=roflfaucet&_t=' + Date.now(), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.credits = parseFloat(data.dashboard.balance.useless_coins);
                console.log('✅ Real balance loaded:', this.credits);
            } else {
                console.log('⚠️ API unavailable, using demo mode');
                this.fallbackToDemoMode();
            }
        } catch (error) {
            console.error('💥 Balance loading error:', error);
            this.fallbackToDemoMode();
        }
        this.updateDisplay();
    }
    
    fallbackToDemoMode() {
        this.isLoggedIn = false;
        this.loadDemoCredits();
    }
    
    saveGameState() {
        if (!this.isLoggedIn) {
            // Only save demo state to localStorage for anonymous users
            const state = {
                credits: this.credits,
                totalSpins: this.totalSpins,
                totalWagered: this.totalWagered,
                totalWon: this.totalWon,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem('roflfaucet_slots_demo_state', JSON.stringify(state));
        }
        // For logged-in users, balance is managed via API transactions
    }
    
    checkWinConditions(outcomes) {
        // Extract final symbols from outcomes
        const symbols = outcomes.map(outcome => {
            if (outcome.isInBetween) {
                return 'blank'; // In-between = blank for win calculation
            } else {
                // Map combo symbols to their physical equivalents
                if (outcome.virtualSymbol.startsWith('combo')) {
                    return outcome.symbolName; // Use the mapped physical symbol
                }
                return outcome.virtualSymbol;
            }
        });
        
        console.log('🎲 Win check outcomes:', outcomes);
        console.log('🎲 Win check symbols:', symbols);
        console.log('🎲 Symbol comparison:', symbols[0], '===', symbols[1], '===', symbols[2]);
        console.log('🎲 All equal?', symbols[0] === symbols[1] && symbols[1] === symbols[2]);
        
        // Check for exact matches first
        if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
            // Three of a kind
            const symbol = symbols[0];
            if (symbol === 'blank') return { type: 'three_blanks', payout: this.payoutTable.three_blanks };
            if (symbol === 'watermelon') return { type: 'three_watermelon', payout: this.payoutTable.three_watermelon };
            if (symbol === 'banana') return { type: 'three_banana', payout: this.payoutTable.three_banana };
            if (symbol === 'cherries') return { type: 'three_cherries', payout: this.payoutTable.three_cherries };
            if (symbol === 'seven') return { type: 'three_seven', payout: this.payoutTable.three_seven };
            if (symbol === 'bar') return { type: 'three_bar', payout: this.payoutTable.three_bar };
            if (symbol === 'bigwin') return { type: 'three_bigwin', payout: this.payoutTable.three_bigwin };
        }
        
        // Check for "any fruit" combination (any 3 fruits)
        const fruits = ['watermelon', 'banana', 'cherries'];
        const allFruits = symbols.every(symbol => fruits.includes(symbol));
        if (allFruits && symbols.length === 3) {
            return { type: 'any_fruit', payout: this.payoutTable.any_fruit };
        }
        
        // Check for two of a kind
        const counts = {};
        symbols.forEach(symbol => {
            counts[symbol] = (counts[symbol] || 0) + 1;
        });
        
        for (const [symbol, count] of Object.entries(counts)) {
            if (count === 2) {
                const payoutKey = `two_${symbol}`;
                if (this.payoutTable[payoutKey]) {
                    return { type: payoutKey, payout: this.payoutTable[payoutKey] };
                }
            }
        }
        
        // No win
        return { type: 'no_win', payout: 0 };
    }
    
    processWin(winResult, bet) {
        const totalPayout = winResult.payout * bet;
        
        // If there's a win, animate the payout
        if (totalPayout > 0) {
            this.animateWinPayout(totalPayout, winResult);
        } else {
            // No win - just update normally
            this.credits += totalPayout;
            this.totalWon += totalPayout;
            console.log('💸 No win this time');
        }
        
        return totalPayout;
    }
    
    processSpinResult(outcomes) {
        // Check for wins
        const winResult = this.checkWinConditions(outcomes);
        
        // Process any winnings
        const totalPayout = this.processWin(winResult, this.currentBet);
        
        // Update display with final results
        this.updateDisplay();
        
        console.log(`🎰 Spin complete! Result: ${winResult.type}, Payout: ${totalPayout}`);
    }
    
    updateDisplay() {
        // Update all display elements
        const currentBalanceElement = document.getElementById('current-balance');
        const currentBetElement = document.getElementById('current-bet');
        
        if (currentBalanceElement) currentBalanceElement.textContent = this.credits;
        if (currentBetElement) currentBetElement.textContent = this.currentBet;
        
        // Save state to localStorage
        this.saveGameState();
        
        console.log(`💰 Balance: ${this.credits}, Bet: ${this.currentBet}, Spins: ${this.totalSpins}`);
    }
}

// Global instance for onclick handlers
let slotMachine;

// Global functions for inline onclick handlers
function spinReels() {
    console.log('Global spinReels() function called!');
    if (slotMachine) {
        console.log('Calling slotMachine.spinReels()');
        slotMachine.spinReels();
    } else {
        console.error('slotMachine instance not found!');
    }
}

function flipMachine() {
    const slotMachineElement = document.getElementById('slot-machine');
    if (slotMachineElement) {
        slotMachineElement.classList.toggle('flipped');
        console.log('🎰 Machine flipped!');
    } else {
        console.error('Slot machine element not found!');
    }
}

function decreaseBet() {
    if (slotMachine && !slotMachine.isSpinning) {
        if (slotMachine.currentBet > 1) {
            slotMachine.currentBet--;
            slotMachine.updateDisplay();
            console.log(`🎰 Bet decreased to ${slotMachine.currentBet}`);
        }
    }
}

function increaseBet() {
    if (slotMachine && !slotMachine.isSpinning) {
        const maxBet = Math.min(10, slotMachine.credits); // Max bet is 10 or current credits
        if (slotMachine.currentBet < maxBet) {
            slotMachine.currentBet++;
            slotMachine.updateDisplay();
            console.log(`🎰 Bet increased to ${slotMachine.currentBet}`);
        }
    }
}

function claimWinnings() {
    if (slotMachine) {
        // Add claim winnings logic
        console.log('Claim winnings');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    slotMachine = new CasinoSlotMachine();
    // Make slotMachine globally accessible for console debugging
    window.slotMachine = slotMachine;
});

