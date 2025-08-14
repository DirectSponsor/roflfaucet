// Levels Page JavaScript - ROFLFaucet
// Handles the levels page UI, displaying all levels and upgrade functionality

// Initialize levels page when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏆 Initializing Levels Page...');
    
    // Wait for levels system to be available
    const initLevelsPage = () => {
        if (window.levelsSystem && window.levelsSystem.unifiedBalance) {
            renderLevelsPage();
            console.log('✅ Levels Page initialized');
        } else {
            console.log('⏳ Waiting for levels system...');
            setTimeout(initLevelsPage, 200);
        }
    };
    
    initLevelsPage();
});

// Render the entire levels page content
async function renderLevelsPage() {
    const levelsSystem = window.levelsSystem;
    const currentLevel = levelsSystem.getCurrentLevel();
    const nextLevel = levelsSystem.getNextLevel();
    const currency = levelsSystem.isLoggedIn ? 'coins' : 'tokens';
    
    // Update current status card
    document.getElementById('current-level-name').textContent = `Level ${currentLevel.id}: ${currentLevel.name}`;
    document.getElementById('current-level-description').textContent = currentLevel.description;
    document.getElementById('current-max-bet').textContent = `${currentLevel.maxBet} ${currency}`;
    
    // Get current balance
    try {
        const balance = await levelsSystem.unifiedBalance.getBalance();
        document.getElementById('current-balance').textContent = `${balance.toLocaleString()} ${currency}`;
    } catch (error) {
        document.getElementById('current-balance').textContent = 'Error loading';
    }
    
    // Render levels list
    const container = document.getElementById('levels-container');
    container.innerHTML = '';
    
    // Use appropriate levels list (member vs non-member)
    const levelsToShow = levelsSystem.getAvailableLevels();
    
    // If non-member, show signup encouragement
    if (!levelsSystem.isLoggedIn) {
        const signupCard = document.createElement('div');
        signupCard.style.cssText = `
            margin-bottom: 20px;
            padding: 20px;
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 4px 15px rgba(0,123,255,0.3);
        `;
        
        signupCard.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 10px;">🚀</div>
            <h3 style="margin: 0 0 10px 0; color: white;">Unlock All Levels!</h3>
            <p style="margin: 0 0 15px 0; opacity: 0.9;">Sign up for a free member account to access 12 different levels with betting limits up to 12 tokens!</p>
            <button onclick="window.location.href='profile.html'" 
                    style="background: white; color: #007bff; border: none; padding: 12px 25px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 16px;">
                Sign Up Now - It's Free!
            </button>
        `;
        
        container.appendChild(signupCard);
    }
    
    levelsToShow.forEach(level => {
        const isCurrent = level.id === levelsSystem.currentUserLevel;
        const isPurchased = level.id <= levelsSystem.currentUserLevel;
        const isNext = level.id === levelsSystem.currentUserLevel + 1;
        
        let bgColor = '#f9f9f9';
        let borderColor = '#ddd';
        let textColor = '#333';
        let statusBadge = '';
        let actionButton = '';
        
        if (isCurrent) {
            bgColor = '#e7f3ff';
            borderColor = '#007bff';
            textColor = '#007bff';
            statusBadge = '<span style="background: #007bff; color: white; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: bold;">CURRENT</span>';
        } else if (isPurchased) {
            bgColor = '#e8f5e8';
            borderColor = '#28a745';
            textColor = '#28a745';
            statusBadge = '<span style="background: #28a745; color: white; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: bold;">OWNED</span>';
        } else if (isNext) {
            bgColor = '#fff3cd';
            borderColor = '#ffc107';
            textColor = '#856404';
            statusBadge = '<span style="background: #ffc107; color: #856404; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: bold;">AVAILABLE</span>';
            actionButton = `
                <button onclick="upgradeToLevel(${level.id})" 
                        style="background: #ffc107; color: #856404; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 14px; margin-top: 10px;">
                    Upgrade (${level.cost.toLocaleString()} ${currency})
                </button>
            `;
        } else {
            statusBadge = '<span style="background: #6c757d; color: white; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: bold;">LOCKED</span>';
        }
        
        const levelCard = document.createElement('div');
        levelCard.style.cssText = `
            margin-bottom: 15px; 
            padding: 20px; 
            background: ${bgColor}; 
            border: 2px solid ${borderColor}; 
            border-radius: 12px;
            transition: all 0.3s ease;
        `;
        
        levelCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 15px;">
                <div style="flex: 1; min-width: 250px;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 8px;">
                        <h3 style="margin: 0; color: ${textColor}; font-size: 20px;">Level ${level.id}: ${level.name}</h3>
                        ${statusBadge}
                    </div>
                    <p style="margin: 8px 0; color: #666; font-size: 14px;">${level.description}</p>
                    ${actionButton}
                </div>
                <div style="text-align: right; min-width: 120px;">
                    <div style="font-weight: bold; color: ${textColor}; font-size: 18px; margin-bottom: 5px;">
                        Max Bet: ${level.maxBet}
                    </div>
                    <div style="font-size: 14px; color: #666;">
                        ${level.cost > 0 ? `Cost: ${level.cost.toLocaleString()} ${currency}` : 'Free'}
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(levelCard);
    });
}

// Handle level upgrade purchase
async function upgradeToLevel(levelId) {
    const levelsSystem = window.levelsSystem;
    const targetLevel = levelsSystem.levels.find(l => l.id === levelId);
    
    if (!targetLevel) return;
    
    const currentBalance = await levelsSystem.unifiedBalance.getBalance();
    const canAfford = currentBalance >= targetLevel.cost;
    const currency = levelsSystem.isLoggedIn ? 'coins' : 'tokens';
    
    if (!canAfford) {
        alert(`❌ Insufficient ${currency}!\n\nYou need ${targetLevel.cost.toLocaleString()} ${currency} but only have ${currentBalance.toLocaleString()} ${currency}.\n\nYou need ${(targetLevel.cost - currentBalance).toLocaleString()} more ${currency}.`);
        return;
    }
    
    const confirmed = confirm(`🏆 Upgrade to ${targetLevel.name}?\n\nCost: ${targetLevel.cost.toLocaleString()} ${currency}\nNew Max Bet: ${targetLevel.maxBet} ${currency}\n\n${targetLevel.description}\n\nProceed with upgrade?`);
    
    if (confirmed) {
        try {
            // Deduct the cost
            await levelsSystem.unifiedBalance.subtractBalance(targetLevel.cost, 'level_upgrade');
            
            // Upgrade the level
            levelsSystem.currentUserLevel = targetLevel.id;
            await levelsSystem.saveUserLevel();
            
            // Show success and refresh page
            alert(`🎉 Level Up Successful!\n\nYou are now a ${targetLevel.name}!\nMax bet increased to ${targetLevel.maxBet} ${currency}\n\n${targetLevel.description}`);
            
            // Refresh the page display
            renderLevelsPage();
            
            // Trigger level change event
            levelsSystem.onLevelChanged();
        } catch (error) {
            console.error('Upgrade failed:', error);
            alert('❌ Upgrade failed. Please try again.');
        }
    }
}
