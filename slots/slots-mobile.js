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

        // Statistics - enhanced tracking
        this.totalSpins = 0;
        this.totalWagered = 0;
        this.totalWon = 0;
        this.winCount = 0; // Track number of winning spins
        
        // Load existing stats from localStorage
        this.loadStatsFromStorage();
        
        // Game Economy (local storage for testing)
        this.loadGameState();
        
        // Payout table based on visual payout display
        this.payoutTable = {
            // Main winning combinations (matching visual table)
            'three_cherries': 12,     // 3 cherries
            'three_bigwin': 400,      // 3 bigwins (jackpot!)
            'three_banana': 10,       // 3 bananas  
            'three_bar': 75,          // 3 bars
            'three_watermelon': 8,    // 3 watermelons
            'three_seven': 35,        // 3 sevens
            'any_fruit': 4,           // Any 3 different fruits (mixed) - good profit
            'bar_bigwin_combo': 15,   // Bar or Bigwin in first 2 reels, any in third
            
            // Hidden bonus (not shown in visual table)
            'three_blanks': 2         // All in-between stops (bonus)
        };

        // Initialize game components
        this.reels = [
            document.getElementById('reel-1'),
            document.getElementById('reel-2'),
            document.getElementById('reel-3'),
        ];
        
        // Simple dimensions - read actual CSS-rendered sizes
        this.updateSpriteDimensions();
        
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
        
        // =======================================
        // SEPARATE VIRTUAL REEL LISTS (43 entries each)
        // =======================================
        // Each reel has its own distribution for fine-tuned odds control
        // This allows asymmetric adjustments without adding more symbols
        //
        // REEL 1: Reduced watermelon, added seven (better seven starts)
        this.virtualReelList1 = [
            // High frequency positions (common symbols)
            0, 0, 0,           // Watermelon (position 0) - 3 entries (was 4)
            2, 2, 2, 2, 2,     // Banana (position 2) - 5 entries  
            4, 4, 4, 4,        // Cherries (position 4) - 4 entries
            12, 12, 12,        // Watermelon (position 12) - 3 entries
            14, 14, 14,        // Banana (position 14) - 3 entries
            16, 16,            // Cherries (position 16) - 2 entries
            
            // Medium frequency positions
            6, 6, 6,           // Seven (position 6) - 3 entries (was 2, +1)
            18,                // Seven (position 18) - 1 entry
            8,                 // Bar (position 8) - 1 entry
            
            // Low frequency positions  
            10, 10,            // BigWin (position 10) - 2 entries
            
            // Blank positions (in-between stops)
            1, 3, 5, 7, 9, 11  // Various blank positions - 6 entries
        ];
        
        // REEL 2: Reduced banana, added bar (better bar in middle)
        this.virtualReelList2 = [
            // High frequency positions (common symbols)
            0, 0, 0, 0,        // Watermelon (position 0) - 4 entries
            2, 2, 2, 2,        // Banana (position 2) - 4 entries (was 5, -1)
            4, 4, 4, 4,        // Cherries (position 4) - 4 entries
            12, 12, 12,        // Watermelon (position 12) - 3 entries
            14, 14, 14,        // Banana (position 14) - 3 entries
            16, 16,            // Cherries (position 16) - 2 entries
            
            // Medium frequency positions
            6, 6,              // Seven (position 6) - 2 entries
            18,                // Seven (position 18) - 1 entry
            8, 8,              // Bar (position 8) - 2 entries (was 1, +1)
            
            // Low frequency positions  
            10, 10,            // BigWin (position 10) - 2 entries
            
            // Blank positions (in-between stops)
            1, 3, 5, 7, 9, 11  // Various blank positions - 6 entries
        ];
        
        // REEL 3: Reduced cherries, added seven (better seven finishes)
        this.virtualReelList3 = [
            // High frequency positions (common symbols)
            0, 0, 0, 0,        // Watermelon (position 0) - 4 entries
            2, 2, 2, 2, 2,     // Banana (position 2) - 5 entries  
            4, 4, 4,           // Cherries (position 4) - 3 entries (was 4, -1)
            12, 12, 12,        // Watermelon (position 12) - 3 entries
            14, 14, 14,        // Banana (position 14) - 3 entries
            16, 16,            // Cherries (position 16) - 2 entries
            
            // Medium frequency positions
            6, 6,              // Seven (position 6) - 2 entries
            18, 18,            // Seven (position 18) - 2 entries (was 1, +1)
            8,                 // Bar (position 8) - 1 entry
            
            // Low frequency positions  
            10, 10,            // BigWin (position 10) - 2 entries
            
            // Blank positions (in-between stops)
            1, 3, 5, 7, 9, 11  // Various blank positions - 6 entries
        ];
        
        // Combined lists for easy reference
        this.virtualReelLists = [this.virtualReelList1, this.virtualReelList2, this.virtualReelList3];
        

        // Setup event listeners
        this.setupEventListeners();
        
        // Set initial positions for all reels to show 3 symbols
        this.initializeReelPositions();
        
        // Initialize display with loaded state
        this.updateDisplay();
        
        // Initialize audio system
        this.setupAudio();
        
        // Listen for window resize to update sprite dimensions
        window.addEventListener('resize', () => this.updateSpriteDimensions());
        
        // Also update on orientation change (mobile)
        window.addEventListener('orientationchange', () => {
            // Short delay for orientation change
            setTimeout(() => this.updateSpriteDimensions(), 100);
        });

        // Ensure dimensions are updated on initialization
        this.updateSpriteDimensions();
        
        console.log('🎰 Casino Slot Machine with Sprite Background initialized!');
    }
    
    updateSpriteDimensions() {
        // Calculate responsive dimensions first
        this.calculateResponsiveDimensions();
        
        // Apply the calculated dimensions to the reels
        this.reels.forEach(reel => {
            reel.style.width = `${this.reelWidth}px`;
            reel.style.height = `${this.reelHeight}px`;
            reel.style.backgroundSize = `${this.reelWidth}px ${this.totalSpriteHeight}px`;
        });
        
        // Update CSS custom property for reels container width (for progress indicator)
        const gap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--reel-gap')) || 15;
        const padding = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--container-padding')) || 15;
        const reelsContainerWidth = (3 * this.reelWidth) + (2 * gap) + (2 * 2) + (2 * padding); // 3 reels + gaps + borders + padding
        document.documentElement.style.setProperty('--reels-container-width', `${reelsContainerWidth}px`);
        
        console.log(`🎰 Sprite dimensions updated:`);
        console.log(`  Rendered reel width: ${this.reelWidth}px`);
        console.log(`  Rendered reel height: ${this.reelHeight}px`);
        console.log(`  Symbol height: ${this.symbolHeight}px`);
        console.log(`  Total sprite height: ${this.totalSpriteHeight}px`);
        console.log(`  Position height: ${this.positionHeight}px`);
        console.log(`  Reels container width: ${reelsContainerWidth}px`);
    }
    
    calculateResponsiveDimensions() {
        // MOBILE-ONLY VERSION: Simple responsive logic
        const viewportWidth = window.innerWidth;
        
        // Mobile layout: no sidebars, centered content
        const containerWidth = viewportWidth - 20; // 10px margin on each side
        const gap = 12;
        const padding = 12;
        
        // Calculate available width for reels
        const usedSpace = (2 * gap) + (3 * 4) + (2 * padding); // gaps + borders + padding
        const availableWidth = containerWidth - usedSpace;
        
        // Calculate ideal reel width (1/3 of available space)
        const calculatedReelWidth = Math.floor(availableWidth / 3);
        
        // Simple responsive sizing for mobile
        let reelWidth;
        if (calculatedReelWidth >= 120) {
            // Plenty of space: use full desktop size
            reelWidth = 120;
        } else if (calculatedReelWidth >= 100) {
            // Good space: scale down a bit
            reelWidth = 100;
        } else if (calculatedReelWidth >= 80) {
            // Medium space: scale down more
            reelWidth = 80;
        } else if (calculatedReelWidth >= 65) {
            // Limited space: small reels
            reelWidth = 65;
        } else {
            // Very tight: minimum viable size
            reelWidth = 55;
        }
        
        // Maintain 3:1 aspect ratio (3 symbols high)
        const reelHeight = reelWidth * 3;
        
        // Calculate sprite height (10 symbols × symbol height)
        const spriteHeight = reelWidth * 10;
        
        // Calculate position height (sprite height / 20 positions)
        const positionHeight = spriteHeight / 20;
        
        // Update CSS custom properties
        const root = document.documentElement;
        root.style.setProperty('--reel-width', `${reelWidth}px`);
        root.style.setProperty('--reel-height', `${reelHeight}px`);
        root.style.setProperty('--sprite-height', `${spriteHeight}px`);
        root.style.setProperty('--reel-gap', `${gap}px`);
        root.style.setProperty('--container-padding', `${padding}px`);
        
        // Update instance variables for positioning calculations
        this.reelWidth = reelWidth;
        this.symbolHeight = reelWidth; // Each symbol is square
        this.reelHeight = reelHeight;
        this.totalSpriteHeight = spriteHeight;
        this.totalPositions = 20;
        this.positionHeight = positionHeight;
        
        console.log(`🎰 Responsive dimensions calculated:`);
        console.log(`  Viewport width: ${viewportWidth}px`);
        console.log(`  Container width: ${containerWidth}px`);
        console.log(`  Available width: ${availableWidth}px`);
        console.log(`  Calculated reel width: ${calculatedReelWidth}px`);
        console.log(`  Final reel width: ${reelWidth}px`);
        console.log(`  Reel height: ${reelHeight}px`);
        console.log(`  Position height: ${positionHeight}px`);
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
        
        // Use unified balance system to add winnings
        if (totalPayout > 0) {
            const winResult = await addBalance(totalPayout, 'slots_win', `Slot machine win: ${totalPayout} credits`);
            this.credits = winResult.balance;
        }
        
        const endCredits = this.credits;
        
        // Animate the credits counter
        this.animateCounter(currentBalanceElement, startCredits, endCredits, 800);
    }
    
    showDemoCreditsPrompt() {
        const promptText = `🎰 Out of tokens!\n\n` +
                          `💡 Claim free tokens from the faucet to keep playing!\n\n` +
                          `Click OK to go to the faucet page.`;
        
        if (confirm(promptText)) {
            // Navigate parent window if in iframe, otherwise navigate normally
            if (window.parent !== window) {
                window.parent.postMessage({type: 'navigate', url: 'index.html'}, '*');
            } else {
                window.location.href = 'index.html';
            }
        }
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
        // Spin button uses onclick="spinReels()" in HTML
        // No additional event listeners needed
        console.log('🎰 Event listeners setup complete');
    }

    async spinReels() {
        if (this.isSpinning) return;
        
        // Use unified balance system to subtract bet amount
        const betResult = await subtractBalance(this.currentBet, 'slots_bet', `Slot machine bet: ${this.currentBet} credits`);
        if (!betResult.success) {
            console.log('❌ Insufficient balance for bet!');
            if (betResult.error === 'Insufficient balance') {
                showInsufficientBalanceDialog('slots');
            }
            return;
        }
        
        // Update local credits to match the new balance
        this.credits = betResult.balance;
        
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
        console.log('Virtual reel list sizes:', this.virtualReelLists.map(list => list.length));
        console.log('Current positions before:', this.currentPositions);
        
        for (let i = 0; i < 3; i++) {
            // Pick from the appropriate virtual reel list for this reel
            const currentList = this.virtualReelLists[i];
            const randomIndex = Math.floor(Math.random() * currentList.length);
            const position = currentList[randomIndex];
            
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
        // Each position is this.positionHeight apart (calculated dynamically)
        // We need to center the position in the middle of the 3-symbol window
        // The middle slot is at 1 symbol height from the top (showing 3 symbols total)
        // Position the sprite so the selected position appears in the center slot
        
        const backgroundPositionY = -(position * this.positionHeight) + this.symbolHeight; // Center the position in middle slot
        
        // Add subtle bounce effect
        this.addReelBounce(reel, backgroundPositionY);
        
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
    
    addReelBounce(reel, finalPositionY) {
        // Create a bounce effect when reel stops
        // Use 10% of symbol height (150px) = 15px overshoot
        const bounceHeight = this.symbolHeight * 0.1; // 15px (10% of 150px symbol)
        const bounceSpeed = 250; // Medium bounce, 250ms
        
        // Overshoot past the final position (reel goes too far down, then bounces back up)
        const overshootY = finalPositionY + bounceHeight;
        
        // Start at final position
        reel.style.backgroundPosition = `0 ${finalPositionY}px`;
        
        // Animate overshoot, then bounce back
        setTimeout(() => {
            // First: overshoot past target
            reel.style.transition = `background-position ${bounceSpeed * 0.6}ms ease-out`;
            reel.style.backgroundPosition = `0 ${overshootY}px`;
            
            // Then: bounce back to final position
            setTimeout(() => {
                reel.style.transition = `background-position ${bounceSpeed * 0.4}ms cubic-bezier(0.68, -0.55, 0.265, 1.55)`;
                reel.style.backgroundPosition = `0 ${finalPositionY}px`;
                
                // Reset transition after bounce completes
                setTimeout(() => {
                    reel.style.transition = '';
                }, bounceSpeed * 0.4 + 50);
            }, bounceSpeed * 0.6);
        }, 10); // Small delay to ensure position is set before animation
    }

    async loadGameState() {
        // Use unified balance system
        console.log('🎰 Loading game state using unified balance system...');
        this.credits = await getBalance();
        this.totalSpins = 0;
        this.totalWagered = 0;
        this.totalWon = 0;
        
        console.log('💰 Unified balance loaded:', this.credits);
        this.updateDisplay();
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
        
        // Check for specific combo patterns (positional requirements)
        // Bar-Bigwin combo: (bar OR bigwin) in reel 1, (bar OR bigwin) in reel 2, any symbol in reel 3
        const reel1BarBigwin = (symbols[0] === 'bar' || symbols[0] === 'bigwin');
        const reel2BarBigwin = (symbols[1] === 'bar' || symbols[1] === 'bigwin');
        // Reel 3 can be any symbol (wildcard)
        
        if (reel1BarBigwin && reel2BarBigwin) {
            return { type: 'bar_bigwin_combo', payout: this.payoutTable.bar_bigwin_combo };
        }
        
        // Check for "any fruit" combination (any 3 different fruits mixed)
        const fruits = ['watermelon', 'banana', 'cherries'];
        const allFruits = symbols.every(symbol => fruits.includes(symbol));
        if (allFruits && symbols.length === 3) {
            // Only trigger "any fruit" if it's not already covered by three-of-a-kind above
            const allSame = symbols[0] === symbols[1] && symbols[1] === symbols[2];
            if (!allSame) {
                return { type: 'any_fruit', payout: this.payoutTable.any_fruit };
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
        
        // Track statistics
        this.trackSpinStats(winResult, totalPayout);
        
        // Update display with final results
        this.updateDisplay();
        
        console.log(`🎰 Spin complete! Result: ${winResult.type}, Payout: ${totalPayout}`);
    }
    
    // Statistics tracking methods
    loadStatsFromStorage() {
        const slotsStats = JSON.parse(localStorage.getItem('slotsStats') || '{}');
        this.totalSpins = slotsStats.totalSpins || 0;
        this.totalWagered = slotsStats.totalWagered || 0;
        this.totalWon = slotsStats.totalWon || 0;
        this.winCount = slotsStats.winCount || 0;
    }
    
    saveStatsToStorage() {
        const slotsStats = {
            totalSpins: this.totalSpins,
            totalWagered: this.totalWagered,
            totalWon: this.totalWon,
            winCount: this.winCount
        };
        localStorage.setItem('slotsStats', JSON.stringify(slotsStats));
    }
    
    trackSpinStats(winResult, totalPayout) {
        // Track win count
        if (totalPayout > 0) {
            this.winCount++;
        }
        
        // INDEPENDENT STATS SYSTEM: Track balance changes separately from unified balance
        // This creates a complete historical record of slot machine gameplay
        const balanceHistory = JSON.parse(localStorage.getItem('balanceHistory') || '[]');
        
        // Record the current balance AFTER this spin (post bet + post win)
        // This gives us the actual balance progression through gameplay
        balanceHistory.push({
            balance: this.credits,
            spinNumber: this.totalSpins,
            bet: this.currentBet,
            won: totalPayout,
            netChange: totalPayout - this.currentBet,
            timestamp: new Date().toISOString(),
            winType: winResult.type
        });
        
        // Keep extensive history for detailed analysis (no artificial limits)
        // Storage is cheap, insights are valuable
        if (balanceHistory.length > 5000) {
            balanceHistory.splice(0, 1000); // Remove oldest 1000 when we hit 5000
        }
        localStorage.setItem('balanceHistory', JSON.stringify(balanceHistory));
        
        // Save recent activity
        const activity = JSON.parse(localStorage.getItem('slotsActivity') || '[]');
        
        // Add bet activity
        activity.push({
            type: 'bet',
            amount: this.currentBet,
            description: `Bet ${this.currentBet} credits`,
            timestamp: new Date().toISOString()
        });
        
        // Add win activity if applicable
        if (totalPayout > 0) {
            activity.push({
                type: 'win',
                amount: totalPayout,
                description: `Won ${totalPayout} credits (${winResult.type})`,
                timestamp: new Date().toISOString()
            });
        }
        
        // Keep only last 50 activities
        if (activity.length > 50) {
            activity.splice(0, activity.length - 50);
        }
        localStorage.setItem('slotsActivity', JSON.stringify(activity));
        
        // Track win breakdown
        if (totalPayout > 0) {
            const winBreakdown = JSON.parse(localStorage.getItem('winBreakdown') || '{}');
            if (!winBreakdown[winResult.type]) {
                winBreakdown[winResult.type] = { count: 0, totalWon: 0 };
            }
            winBreakdown[winResult.type].count++;
            winBreakdown[winResult.type].totalWon += totalPayout;
            localStorage.setItem('winBreakdown', JSON.stringify(winBreakdown));
        }
        
        // Save updated stats
        this.saveStatsToStorage();
    }

    updateDisplay() {
        // Update all display elements
        const currentBalanceElement = document.getElementById('current-balance');
        const currentBetElement = document.getElementById('current-bet');
        
        if (currentBalanceElement) currentBalanceElement.textContent = Math.floor(this.credits);
        if (currentBetElement) currentBetElement.textContent = this.currentBet;
        
        console.log(`💰 Balance: ${this.credits}, Bet: ${this.currentBet}, Spins: ${this.totalSpins}`);
    }
}

// Global instance for onclick handlers
let slotMachine;

// Global functions for inline onclick handlers
function spinReels() {
    console.log('🎰 Global spinReels() function called!');
    console.log('🎰 Current slotMachine instance:', slotMachine);
    console.log('🎰 Is slotMachine truthy?', !!slotMachine);
    
    if (slotMachine) {
        console.log('🎰 Calling slotMachine.spinReels()...');
        console.log('🎰 isSpinning?', slotMachine.isSpinning);
        console.log('🎰 currentBet:', slotMachine.currentBet);
        console.log('🎰 credits:', slotMachine.credits);
        slotMachine.spinReels();
    } else {
        console.error('🎰 ERROR: slotMachine instance not found!');
        console.error('🎰 Available in window.slotMachine?', !!window.slotMachine);
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
    console.log('🎰 DOM loaded, initializing slot machine...');
    console.log('🎰 Checking global functions availability...');
    console.log('  - getBalance:', typeof getBalance);
    console.log('  - addBalance:', typeof addBalance);
    console.log('  - subtractBalance:', typeof subtractBalance);
    
    try {
        slotMachine = new CasinoSlotMachine();
        console.log('🎰 Slot machine instance created successfully!');
        
        // Make slotMachine globally accessible for console debugging
        window.slotMachine = slotMachine;
        console.log('🎰 Global functions should now work!');
    } catch (error) {
        console.error('🎰 Failed to create slot machine:', error);
        console.error('🎰 Error stack:', error.stack);
    }
    
});

