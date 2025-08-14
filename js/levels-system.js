/**
 * ROFLFaucet Levels System
 * Players can buy level upgrades using their tokens/coins to unlock higher betting limits
 */

class LevelsSystem {
    constructor() {
        // Level definitions with exponential pricing (halved for better balance with 10 token faucet)
        this.levels = [
            { id: 1, name: "Worker", title: "Worker", cost: 0, maxBet: 1, description: "Starting level - learn the ropes" },
            { id: 2, name: "Chancellor", title: "Chancellor", cost: 1000, maxBet: 2, description: "First step up the ladder" },
            { id: 3, name: "Dictator", title: "Dictator", cost: 1500, maxBet: 3, description: "Take control of your destiny" },
            { id: 4, name: "Mage", title: "Mage", cost: 4000, maxBet: 4, description: "Harness magical betting powers" },
            { id: 5, name: "Royal Mentor", title: "Royal Mentor", cost: 7500, maxBet: 5, description: "Guide others to victory" },
            { id: 6, name: "Archseer", title: "Archseer", cost: 12500, maxBet: 6, description: "See the future of fortune" },
            { id: 7, name: "Beta", title: "Beta", cost: 25000, maxBet: 7, description: "Elite testing grounds" },
            { id: 8, name: "Congressman", title: "Congressman", cost: 50000, maxBet: 8, description: "Political power player" },
            { id: 9, name: "Hand of the King", title: "Hand of the King", cost: 100000, maxBet: 9, description: "Right hand of royalty" },
            { id: 10, name: "Ranger", title: "Ranger", cost: 175000, maxBet: 10, description: "Master of the wilderness" },
            { id: 11, name: "King", title: "King", cost: 250000, maxBet: 11, description: "Rule your domain" },
            { id: 12, name: "Emperor", title: "Emperor", cost: 500000, maxBet: 12, description: "Ultimate power achieved" }
        ];
        
        // Non-member restrictions
        this.nonMemberLevels = [
            { id: 1, name: "Guest", title: "Guest", cost: 0, maxBet: 1, description: "Sign up for member account to unlock higher levels!" }
        ];
        
        this.currentUserLevel = 1;
        this.unifiedBalance = null;
        this.isLoggedIn = false;
        
        this.init();
    }
    
    async init() {
        console.log('🏆 Initializing Levels System...');
        
        // Wait for UnifiedBalanceSystem
        const initBalance = () => {
            if (typeof UnifiedBalanceSystem !== 'undefined') {
                this.unifiedBalance = new UnifiedBalanceSystem();
                this.isLoggedIn = this.unifiedBalance.isLoggedIn;
                this.loadUserLevel();
                console.log('✅ Levels System initialized');
            } else {
                console.log('⏳ Waiting for UnifiedBalanceSystem...');
                setTimeout(initBalance, 100);
            }
        };
        
        initBalance();
    }
    
    async loadUserLevel() {
        if (!this.unifiedBalance) return;
        
        try {
            // Get user data from the unified balance system
            if (this.isLoggedIn) {
                // For logged-in users, fetch from server
                const response = await fetch('/api/user-data.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
                    },
                    body: JSON.stringify({
                        action: 'get_profile'
                    })
                });
                
                if (response.ok) {
                    const userData = await response.json();
                    this.currentUserLevel = userData.profile?.level || 1;
                }
            } else {
                // For guests, use localStorage
                this.currentUserLevel = parseInt(localStorage.getItem('guest_level')) || 1;
            }
            
            console.log(`🏆 User level loaded: ${this.currentUserLevel} (${this.getCurrentLevel().name})`);
        } catch (error) {
            console.error('Error loading user level:', error);
            this.currentUserLevel = 1;
        }
    }
    
    async saveUserLevel() {
        if (!this.unifiedBalance) return;
        
        try {
            if (this.isLoggedIn) {
                // For logged-in users, save to server
                const response = await fetch('/api/user-data.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
                    },
                    body: JSON.stringify({
                        action: 'update_profile',
                        profile: {
                            level: this.currentUserLevel
                        }
                    })
                });
                
                if (!response.ok) {
                    console.error('Failed to save level to server');
                }
            } else {
                // For guests, save to localStorage
                localStorage.setItem('guest_level', this.currentUserLevel.toString());
            }
            
            console.log(`🏆 User level saved: ${this.currentUserLevel}`);
        } catch (error) {
            console.error('Error saving user level:', error);
        }
    }
    
    getCurrentLevel() {
        // Non-members are restricted to level 1 only
        if (!this.isLoggedIn) {
            return this.nonMemberLevels[0];
        }
        return this.levels.find(level => level.id === this.currentUserLevel) || this.levels[0];
    }
    
    getNextLevel() {
        // Non-members can't upgrade - encourage signup
        if (!this.isLoggedIn) {
            return null;
        }
        return this.levels.find(level => level.id === this.currentUserLevel + 1) || null;
    }
    
    getMaxBet() {
        return this.getCurrentLevel().maxBet;
    }
    
    // Get available levels list (different for members vs non-members)
    getAvailableLevels() {
        if (!this.isLoggedIn) {
            return this.nonMemberLevels;
        }
        return this.levels;
    }
    
    canBet(amount) {
        return amount <= this.getMaxBet();
    }
    
    async canAffordUpgrade() {
        const nextLevel = this.getNextLevel();
        if (!nextLevel) return false;
        
        const currentBalance = await this.unifiedBalance.getBalance();
        return currentBalance >= nextLevel.cost;
    }
    
    async upgradeLevelModal() {
        const nextLevel = this.getNextLevel();
        if (!nextLevel) {
            alert('🏆 Congratulations! You\'re already at the maximum level!');
            return;
        }
        
        const currentBalance = await this.unifiedBalance.getBalance();
        const canAfford = currentBalance >= nextLevel.cost;
        const currency = this.isLoggedIn ? 'coins' : 'tokens';
        
        const message = `🏆 Level Up Available!\\n\\n` +
                       `Current Level: ${this.getCurrentLevel().name} (Max bet: ${this.getMaxBet()})\\n` +
                       `Next Level: ${nextLevel.name} (Max bet: ${nextLevel.maxBet})\\n\\n` +
                       `Cost: ${nextLevel.cost.toLocaleString()} ${currency}\\n` +
                       `Your Balance: ${currentBalance.toLocaleString()} ${currency}\\n\\n` +
                       `${nextLevel.description}\\n\\n` +
                       (canAfford 
                           ? 'Do you want to upgrade to the next level?' 
                           : `You need ${(nextLevel.cost - currentBalance).toLocaleString()} more ${currency} to upgrade.`);
        
        if (canAfford && confirm(message)) {
            await this.purchaseUpgrade();
        } else if (!canAfford) {
            alert(message);
        }
    }
    
    async purchaseUpgrade() {
        const nextLevel = this.getNextLevel();
        if (!nextLevel) return false;
        
        try {
            // Deduct the cost
            await this.unifiedBalance.subtractBalance(nextLevel.cost, 'level_upgrade');
            
            // Upgrade the level
            this.currentUserLevel = nextLevel.id;
            await this.saveUserLevel();
            
            // Show success message
            const currency = this.isLoggedIn ? 'coins' : 'tokens';
            alert(`🎉 Level Up Successful!\\n\\nYou are now a ${nextLevel.name}!\\nMax bet increased to ${nextLevel.maxBet} ${currency}\\n\\n${nextLevel.description}`);
            
            // Trigger any UI updates
            this.onLevelChanged();
            
            return true;
        } catch (error) {
            console.error('Error purchasing upgrade:', error);
            alert('❌ Upgrade failed. Please try again.');
            return false;
        }
    }
    
    showInsufficientLevelModal(attemptedBet, currentMaxBet) {
        const nextLevel = this.getNextLevel();
        const currency = this.isLoggedIn ? 'coins' : 'tokens';
        
        this.createInsufficientLevelModal(attemptedBet, currentMaxBet, currency, nextLevel);
    }
    
    createInsufficientLevelModal(attemptedBet, currentMaxBet, currency, nextLevel) {
        // Remove existing modal if present
        const existingModal = document.getElementById('insufficient-level-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'insufficient-level-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 15px;
            padding: 30px;
            max-width: 500px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            text-align: center;
        `;
        
        let content = `
            <div style="margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">🚫</div>
                <h2 style="color: #dc3545; margin-bottom: 10px;">Bet Too High!</h2>
                <p style="color: #666; margin-bottom: 20px;">You tried to bet <strong>${attemptedBet} ${currency}</strong><br>
                Your current max bet is <strong>${currentMaxBet} ${currency}</strong></p>
                
                <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; margin-bottom: 20px;">
                    <strong>Current Level: ${this.getCurrentLevel().name}</strong>
                </div>
            </div>
        `;
        
        if (nextLevel) {
            content += `
                <div style="padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
                    <p style="margin: 0;"><strong>Upgrade to ${nextLevel.name}</strong></p>
                    <p style="margin: 5px 0 0 0; color: #856404;">Max bet: ${nextLevel.maxBet} ${currency} • Cost: ${nextLevel.cost.toLocaleString()} ${currency}</p>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="document.getElementById('insufficient-level-modal').remove()" 
                            style="background: #6c757d; color: white; border: none; padding: 12px 20px; border-radius: 5px; cursor: pointer;">Close</button>
                    <button onclick="window.levelsSystem.showLevelsPage(); document.getElementById('insufficient-level-modal').remove();" 
                            style="background: #ffc107; color: #856404; border: none; padding: 12px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">View Levels</button>
                </div>
            `;
        } else if (!this.isLoggedIn) {
            // Non-member encouragement to sign up
            content += `
                <div style="padding: 15px; background: #e7f3ff; border-radius: 8px; border-left: 4px solid #007bff; margin-bottom: 20px;">
                    <p style="margin: 0; color: #0056b3;"><strong>🚀 Sign up to unlock higher levels!</strong></p>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Free member accounts can access 12 levels with betting limits up to 12 ${currency}!</p>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="document.getElementById('insufficient-level-modal').remove()" 
                            style="background: #6c757d; color: white; border: none; padding: 12px 20px; border-radius: 5px; cursor: pointer;">Close</button>
                    <button onclick="window.location.href='profile.html'" 
                            style="background: #007bff; color: white; border: none; padding: 12px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">Sign Up Free</button>
                </div>
            `;
        } else {
            content += `
                <div style="padding: 15px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745; margin-bottom: 20px;">
                    <p style="margin: 0; color: #155724;"><strong>You are at the maximum level!</strong></p>
                </div>
                
                <button onclick="document.getElementById('insufficient-level-modal').remove()" 
                        style="background: #28a745; color: white; border: none; padding: 12px 20px; border-radius: 5px; cursor: pointer;">Close</button>
            `;
        }
        
        modalContent.innerHTML = content;
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    showLevelsPage() {
        // Create and show levels modal/page
        this.createLevelsModal();
    }
    
    createLevelsModal() {
        // Remove existing modal if present
        const existingModal = document.getElementById('levels-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'levels-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 15px;
            padding: 30px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        `;
        
        modalContent.innerHTML = this.generateLevelsHTML();
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    generateLevelsHTML() {
        const currency = this.isLoggedIn ? 'coins' : 'tokens';
        let html = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #333; margin-bottom: 10px;">🏆 ROFLFaucet Levels</h2>
                <p style="color: #666;">Upgrade your level to unlock higher betting limits!</p>
                <button onclick="document.getElementById('levels-modal').remove()" 
                        style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
            </div>
            
            <div style="margin-bottom: 20px; padding: 15px; background: #f0f8ff; border-radius: 10px; border-left: 4px solid #007bff;">
                <strong>Current Level: ${this.getCurrentLevel().name}</strong><br>
                <span style="color: #666;">Max Bet: ${this.getMaxBet()} ${currency}</span>
            </div>
            
            <div style="max-height: 400px; overflow-y: auto;">
        `;
        
        this.levels.forEach(level => {
            const isCurrent = level.id === this.currentUserLevel;
            const isPurchased = level.id <= this.currentUserLevel;
            const isNext = level.id === this.currentUserLevel + 1;
            
            let bgColor = '#f9f9f9';
            let borderColor = '#ddd';
            let textColor = '#333';
            
            if (isCurrent) {
                bgColor = '#e7f3ff';
                borderColor = '#007bff';
                textColor = '#007bff';
            } else if (isPurchased) {
                bgColor = '#e8f5e8';
                borderColor = '#28a745';
                textColor = '#28a745';
            } else if (isNext) {
                bgColor = '#fff3cd';
                borderColor = '#ffc107';
                textColor = '#856404';
            }
            
            html += `
                <div style="margin-bottom: 10px; padding: 15px; background: ${bgColor}; border: 2px solid ${borderColor}; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: ${textColor};">Level ${level.id}: ${level.name}</strong>
                            ${isCurrent ? '<span style="background: #007bff; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px;">CURRENT</span>' : ''}
                            ${isPurchased && !isCurrent ? '<span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px;">OWNED</span>' : ''}
                            <br>
                            <span style="color: #666; font-size: 14px;">${level.description}</span>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: bold; color: ${textColor};">Max Bet: ${level.maxBet}</div>
                            ${level.cost > 0 ? `<div style="font-size: 14px; color: #666;">Cost: ${level.cost.toLocaleString()} ${currency}</div>` : '<div style="font-size: 14px; color: #666;">Free</div>'}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="document.getElementById('levels-modal').remove()" 
                        style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-right: 10px;">Close</button>
        `;
        
        // Add upgrade button if next level is available
        const nextLevel = this.getNextLevel();
        if (nextLevel) {
            html += `
                <button onclick="window.levelsSystem.upgradeLevelModal(); document.getElementById('levels-modal').remove();" 
                        style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    Upgrade to ${nextLevel.name}
                </button>
            `;
        }
        
        html += `
            </div>
        `;
        
        return html;
    }
    
    onLevelChanged() {
        // Emit custom event that games can listen to
        const event = new CustomEvent('levelChanged', {
            detail: {
                newLevel: this.currentUserLevel,
                levelData: this.getCurrentLevel()
            }
        });
        
        document.dispatchEvent(event);
        
        // Update any existing level displays
        this.updateLevelDisplays();
    }
    
    updateLevelDisplays() {
        // Update any level display elements on the page
        const levelDisplays = document.querySelectorAll('.level-display');
        levelDisplays.forEach(display => {
            const currentLevel = this.getCurrentLevel();
            display.textContent = `Level ${currentLevel.id}: ${currentLevel.name}`;
        });
        
        const maxBetDisplays = document.querySelectorAll('.max-bet-display');
        maxBetDisplays.forEach(display => {
            display.textContent = `Max Bet: ${this.getMaxBet()}`;
        });
    }
    
    // Helper method for games to validate bets
    validateBet(amount, gameName = 'game') {
        if (!this.canBet(amount)) {
            this.showInsufficientLevelModal(amount, this.getMaxBet());
            return false;
        }
        return true;
    }
}

// Create global instance
window.levelsSystem = new LevelsSystem();

console.log('🏆 Levels System loaded!');
