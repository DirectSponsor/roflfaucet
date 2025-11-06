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
    
    // Show/hide guest notice
    const guestNotice = document.getElementById('guest-notice-levels');
    if (guestNotice) {
        if (!levelsSystem.isLoggedIn) {
            guestNotice.style.display = 'block';
        } else {
            guestNotice.style.display = 'none';
        }
    }
    
    // Render levels list
    const container = document.getElementById('levels-container');
    container.innerHTML = '';
    
    // Use appropriate levels list (member vs non-member)
    const levelsToShow = levelsSystem.getAvailableLevels();
    
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
    
    // Use global unified balance functions
    const currentBalance = await getBalance();
    const canAfford = currentBalance >= targetLevel.cost;
    const currency = levelsSystem.isLoggedIn ? 'coins' : 'tokens';
    
    if (!canAfford) {
        const shortfall = targetLevel.cost - currentBalance;
        showInsufficientBalanceDialog(targetLevel.cost, currentBalance);
        return;
    }
    
    // Use levels system modal instead of confirm
    levelsSystem.createUpgradeConfirmModal(targetLevel, currentBalance, currency, () => {
        // This callback will be called if user confirms upgrade
        performUpgrade(levelsSystem, targetLevel, currency);
    });
}

// Separate function to perform the actual upgrade
async function performUpgrade(levelsSystem, targetLevel, currency) {
    try {
        // Use unified balance system to deduct the cost
        const subtractResult = await subtractBalance(targetLevel.cost, 'level_upgrade', `Upgraded to level ${targetLevel.id}: ${targetLevel.name}`);
        
        if (!subtractResult.success) {
            console.error('Failed to subtract balance:', subtractResult.error);
            if (subtractResult.error === 'Insufficient balance') {
                const currentBalance = await getBalance();
                showInsufficientBalanceDialog(targetLevel.cost, currentBalance);
            }
            return;
        }
        
        // Use simple-profile API to update level
        const userId = localStorage.getItem('user_id');
        const response = await fetch('api/simple-profile.php?action=update_level', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                level: targetLevel.id
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                // Update levels system
                levelsSystem.currentUserLevel = targetLevel.id;
                
                // Use custom success modal instead of alert
                levelsSystem.createSuccessModal(targetLevel, currency);
                
                // Refresh the page display
                renderLevelsPage();
                
                // Trigger level change event
                levelsSystem.onLevelChanged();
            } else {
                console.error('Level update failed:', result.error);
                levelsSystem.createErrorModal('❌ Level upgrade failed. Please try again.');
            }
        } else {
            console.error('API call failed:', response.status);
            levelsSystem.createErrorModal('❌ Level upgrade failed. Please try again.');
        }
    } catch (error) {
        console.error('Upgrade failed:', error);
        levelsSystem.createErrorModal('❌ Upgrade failed. Please try again.');
    }
}
