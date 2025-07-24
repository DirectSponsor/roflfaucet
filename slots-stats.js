// Slots Statistics System
// Reads data from localStorage that the slot machine saves

let currentChart = null; // Store chart instance for updates
let selectedChartRange = 50; // Default chart range

document.addEventListener('DOMContentLoaded', function () {
    
    // Load stats from localStorage
    const loadStats = () => {
        const slotsStats = JSON.parse(localStorage.getItem('slotsStats') || '{}');
        const balanceHistory = JSON.parse(localStorage.getItem('balanceHistory') || '[]');
        const recentActivity = JSON.parse(localStorage.getItem('slotsActivity') || '[]');
        const winBreakdown = JSON.parse(localStorage.getItem('winBreakdown') || '{}');
        
        return {
            totalSpins: slotsStats.totalSpins || 0,
            totalWagered: slotsStats.totalWagered || 0,
            totalWon: slotsStats.totalWon || 0,
            winCount: slotsStats.winCount || 0,
            balanceHistory: balanceHistory,
            recentActivity: recentActivity,
            winBreakdown: winBreakdown
        };
    };
    
    // Get current balance from unified balance system (if available)
    const getCurrentBalance = () => {
        try {
            // Try to get from unified balance localStorage
            const guestTransactions = JSON.parse(localStorage.getItem('guest_transactions') || '[]');
            const balance = guestTransactions.reduce((total, tx) => {
                return total + (tx.type === 'spend' ? -tx.amount : tx.amount);
            }, 0);
            return balance;
        } catch (e) {
            return 0;
        }
    };

    const updateStatsDisplay = () => {
        const stats = loadStats();
        const currentBalance = getCurrentBalance();
        
        document.getElementById('total-spins').textContent = stats.totalSpins;
        document.getElementById('total-wagered').textContent = stats.totalWagered;
        document.getElementById('total-won').textContent = stats.totalWon;
        
        const netProfit = stats.totalWon - stats.totalWagered;
        document.getElementById('net-profit').textContent = netProfit >= 0 ? `+${netProfit}` : `${netProfit}`;
        document.getElementById('net-profit').style.color = netProfit >= 0 ? '#28a745' : '#dc3545';
        
        const winRate = stats.totalSpins > 0 ? ((stats.winCount / stats.totalSpins) * 100).toFixed(1) : 0;
        document.getElementById('win-rate').textContent = `${winRate}%`;
        
        document.getElementById('current-balance').textContent = currentBalance;
        
        updateBalanceChart(stats.balanceHistory);
        updateRecentActivity(stats.recentActivity);
        updateWinBreakdown(stats.winBreakdown);
        updateRiskAnalysis(stats.recentActivity, stats.balanceHistory);
    };

    const updateBalanceChart = (balanceHistory) => {
        const ctx = document.getElementById('balance-chart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (currentChart) {
            currentChart.destroy();
        }
        
        // Show last N data points based on selected range
        const displayData = balanceHistory.slice(-selectedChartRange);
        
        // Update the info text
        const actualDataPoints = Math.min(balanceHistory.length, selectedChartRange);
        document.getElementById('chart-info').textContent = 
            balanceHistory.length === 0 
                ? 'No balance data yet' 
                : `Chart shows last ${actualDataPoints} balance changes (of ${balanceHistory.length} total)`;
        
        currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: displayData.map((_, index) => {
                    // Calculate the actual spin number based on position in full history
                    const startIndex = Math.max(0, balanceHistory.length - selectedChartRange);
                    return startIndex + index + 1;
                }),
                datasets: [{
                    label: 'Balance',
                    data: displayData,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Spin Number'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Balance'
                        },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: displayData.length === 0,
                        text: 'No balance history yet - start playing to see your balance changes!'
                    }
                }
            }
        });
    };
    
    const updateRecentActivity = (activity) => {
        const container = document.getElementById('recent-activity');
        
        if (activity.length === 0) {
            container.innerHTML = '<p style="color: #666; font-style: italic;">No recent activity</p>';
            return;
        }
        
        // Show last 10 activities
        const recentActivities = activity.slice(-10).reverse();
        
        container.innerHTML = recentActivities.map(item => {
            const amountClass = item.type === 'win' ? 'positive' : 'negative';
            const amountText = item.type === 'win' ? `+${item.amount}` : `-${item.amount}`;
            const time = new Date(item.timestamp).toLocaleTimeString();
            
            return `
                <div class="activity-item">
                    <div class="activity-description">${item.description}</div>
                    <div class="activity-amount ${amountClass}">${amountText}</div>
                    <div class="activity-time">${time}</div>
                </div>
            `;
        }).join('');
    };
    
    const updateWinBreakdown = (winBreakdown) => {
        const container = document.getElementById('win-breakdown');
        
        if (Object.keys(winBreakdown).length === 0) {
            container.innerHTML = '<p style="color: #666; font-style: italic;">No wins recorded yet</p>';
            return;
        }
        
        container.innerHTML = Object.entries(winBreakdown).map(([winType, data]) => {
            const displayName = winType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `
                <div class="win-type">
                    <div class="win-type-name">${displayName}</div>
                    <div class="win-type-count">${data.count}x</div>
                    <div class="win-type-total">+${data.totalWon}</div>
                </div>
            `;
        }).join('');
    };
    
    const updateRiskAnalysis = (activity, balanceHistory) => {
        if (activity.length === 0) {
            document.getElementById('wipeout-probability').textContent = '0%';
            document.getElementById('longest-streak').textContent = '0';
            document.getElementById('avg-streak').textContent = '0';
            document.getElementById('balance-drop-risk').textContent = '0%';
            document.getElementById('streak-distribution').innerHTML = '<p style="color: #666; font-style: italic;">No streak data yet</p>';
            document.getElementById('balance-drop-distribution').innerHTML = '<p style="color: #666; font-style: italic;">No balance drop data yet</p>';
            return;
        }
        
        // Analyze losing streaks from activity data
        const streakData = analyzeLossingStreaks(activity);
        
        // Analyze balance drops from balance history
        const balanceDropData = analyzeBalanceDrops(balanceHistory);
        
        // Update risk metrics
        document.getElementById('wipeout-probability').textContent = `${streakData.wipeoutProbability}%`;
        document.getElementById('longest-streak').textContent = streakData.longestStreak;
        document.getElementById('avg-streak').textContent = streakData.averageStreak.toFixed(1);
        document.getElementById('balance-drop-risk').textContent = `${balanceDropData.wipeoutProbability}%`;
        
        // Update distributions
        updateStreakDistribution(streakData.distribution, streakData.totalSequences);
        updateBalanceDropDistribution(balanceDropData.drops, balanceDropData.totalDrops, balanceDropData.totalPeaks, balanceDropData.peakRiskRatio);
    };
    
    const analyzeLossingStreaks = (activity) => {
        // Filter only bet activities (losses) - we want consecutive losses
        const bets = activity.filter(item => item.type === 'bet');
        
        if (bets.length === 0) {
            return {
                wipeoutProbability: 0,
                longestStreak: 0,
                averageStreak: 0,
                distribution: {},
                totalSequences: 0
            };
        }
        
        // Find consecutive losing streaks
        const streaks = [];
        let currentStreak = 0;
        let inStreak = false;
        
        // Go through all activity to find when bets are followed by wins or more bets
        for (let i = 0; i < activity.length; i++) {
            const current = activity[i];
            
            if (current.type === 'bet') {
                currentStreak++;
                inStreak = true;
            } else if (current.type === 'win' && inStreak) {
                // End of losing streak
                if (currentStreak > 0) {
                    streaks.push(currentStreak);
                }
                currentStreak = 0;
                inStreak = false;
            }
        }
        
        // If we end on a losing streak, count it
        if (inStreak && currentStreak > 0) {
            streaks.push(currentStreak);
        }
        
        if (streaks.length === 0) {
            return {
                wipeoutProbability: 0,
                longestStreak: 0,
                averageStreak: 0,
                distribution: {},
                totalSequences: 0
            };
        }
        
        // Calculate statistics
        const longestStreak = Math.max(...streaks);
        const averageStreak = streaks.reduce((sum, streak) => sum + streak, 0) / streaks.length;
        
        // Count streaks of different lengths
        const distribution = {};
        streaks.forEach(streak => {
            distribution[streak] = (distribution[streak] || 0) + 1;
        });
        
        // Calculate wipeout probability (10+ consecutive losses)
        const wipeoutStreaks = streaks.filter(streak => streak >= 10).length;
        const wipeoutProbability = ((wipeoutStreaks / streaks.length) * 100).toFixed(1);
        
        return {
            wipeoutProbability: parseFloat(wipeoutProbability),
            longestStreak,
            averageStreak,
            distribution,
            totalSequences: streaks.length
        };
    };
    
    const updateStreakDistribution = (distribution, totalSequences) => {
        const container = document.getElementById('streak-distribution');
        
        if (Object.keys(distribution).length === 0) {
            container.innerHTML = '<p style="color: #666; font-style: italic;">No streak data yet</p>';
            return;
        }
        
        // Sort by streak length
        const sortedEntries = Object.entries(distribution)
            .map(([length, count]) => [parseInt(length), count])
            .sort((a, b) => a[0] - b[0]);
        
        container.innerHTML = sortedEntries.map(([length, count]) => {
            const percentage = ((count / totalSequences) * 100).toFixed(1);
            const isHighRisk = length >= 10;
            
            return `
                <div class="streak-item ${isHighRisk ? 'high-risk' : ''}">
                    <div class="streak-length">${length} consecutive losses</div>
                    <div class="streak-count">${count} times</div>
                    <div class="streak-percentage" style="color: ${isHighRisk ? '#dc3545' : '#6c757d'};">${percentage}%</div>
                </div>
            `;
        }).join('');
        
        // Add summary info
        const wipeoutEntries = sortedEntries.filter(([length]) => length >= 10);
        if (wipeoutEntries.length > 0) {
            const wipeoutCount = wipeoutEntries.reduce((sum, [, count]) => sum + count, 0);
            const wipeoutPercentage = ((wipeoutCount / totalSequences) * 100).toFixed(1);
            
            container.innerHTML += `
                <div style="margin-top: 1em; padding: 1em; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">
                    <strong>⚠️ New User Risk:</strong> ${wipeoutPercentage}% chance of losing 10+ credits in a row<br>
                    <small>This would wipe out a new user's initial 10 credits from the faucet</small>
                </div>
            `;
        }
    };
    
    const analyzeBalanceDrops = (balanceHistory) => {
        if (balanceHistory.length < 2) {
            return {
                wipeoutProbability: 0,
                drops: {},
                totalDrops: 0,
                totalPeaks: 0,
                peakRiskRatio: 0
            };
        }
        
        const balanceDrops = [];
        const peaks = [];
        let currentPeak = balanceHistory[0];
        let peakIndex = 0;
        
        // Find all peaks and drops from peaks
        for (let i = 1; i < balanceHistory.length; i++) {
            const currentBalance = balanceHistory[i];
            
            // Update peak if we found a higher balance
            if (currentBalance > currentPeak) {
                currentPeak = currentBalance;
                peakIndex = i;
            } else if (currentBalance < currentPeak) {
                // We've moved away from the peak, so the previous peak is confirmed
                // Check if we have a significant drop from this peak
                const drop = currentPeak - currentBalance;
                if (drop >= 10) {
                    balanceDrops.push({
                        amount: drop,
                        peakValue: currentPeak,
                        peakIndex: peakIndex,
                        dropIndex: i
                    });
                }
                
                // Only count this as a confirmed peak if we haven't already counted it
                // and it's actually a local maximum (not just the starting point)
                if (peakIndex > 0 || currentPeak > balanceHistory[0]) {
                    peaks.push({
                        value: currentPeak,
                        index: peakIndex,
                        hasDangerousDrop: drop >= 10
                    });
                }
                
                // Reset peak tracking
                currentPeak = currentBalance;
                peakIndex = i;
            }
        }
        
        // Handle the final peak if we end on one
        if (currentPeak > (peaks.length > 0 ? peaks[peaks.length - 1].value : balanceHistory[0])) {
            peaks.push({
                value: currentPeak,
                index: peakIndex,
                hasDangerousDrop: false // Can't have a drop from the final peak
            });
        }
        
        // Group drops by ranges for display
        const dropRanges = {};
        balanceDrops.forEach(drop => {
            let range;
            const amount = drop.amount;
            if (amount >= 10 && amount < 15) range = '10-14';
            else if (amount >= 15 && amount < 20) range = '15-19';
            else if (amount >= 20 && amount < 25) range = '20-24';
            else if (amount >= 25 && amount < 30) range = '25-29';
            else if (amount >= 30) range = '30+';
            
            if (range) {
                dropRanges[range] = (dropRanges[range] || 0) + 1;
            }
        });
        
        // Calculate meaningful probability: dangerous drops per peak
        const peakRiskRatio = peaks.length > 0 ? ((balanceDrops.length / peaks.length) * 100).toFixed(1) : 0;
        
        return {
            wipeoutProbability: parseFloat(peakRiskRatio), // This is now the meaningful ratio
            drops: dropRanges,
            totalDrops: balanceDrops.length,
            totalPeaks: peaks.length,
            peakRiskRatio: parseFloat(peakRiskRatio)
        };
    };
    
    const updateBalanceDropDistribution = (drops, totalDrops, totalPeaks, peakRiskRatio) => {
        const container = document.getElementById('balance-drop-distribution');
        
        if (Object.keys(drops).length === 0) {
            container.innerHTML = '<p style="color: #666; font-style: italic;">No balance drop data yet</p>';
            return;
        }
        
        // Sort ranges in logical order
        const rangeOrder = ['10-14', '15-19', '20-24', '25-29', '30+'];
        const sortedEntries = rangeOrder
            .filter(range => drops[range])
            .map(range => [range, drops[range]]);
        
        container.innerHTML = sortedEntries.map(([range, count]) => {
            const percentage = ((count / totalDrops) * 100).toFixed(1);
            
            return `
                <div class="streak-item high-risk">
                    <div class="streak-length">${range} credit drops</div>
                    <div class="streak-count">${count} times</div>
                    <div class="streak-percentage" style="color: #dc3545;">${percentage}%</div>
                </div>
            `;
        }).join('');
        
        // Add meaningful peak analysis
        container.innerHTML += `
            <div style="margin-top: 1em; padding: 1em; background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 4px; color: #0c5460;">
                <strong>📊 Peak Analysis:</strong><br>
                • Total balance peaks detected: <strong>${totalPeaks}</strong><br>
                • Peaks with dangerous drops (10+ credits): <strong>${totalDrops}</strong><br>
                • Risk ratio: <strong>${peakRiskRatio}%</strong> of peaks lead to wipeout-level drops
            </div>
        `;
        
        // Add summary info
        container.innerHTML += `
            <div style="margin-top: 1em; padding: 1em; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; color: #856404;">
                <strong>💔 New User Risk:</strong> ${peakRiskRatio}% chance that reaching a balance peak leads to a 10+ credit drop<br>
                <small>This means a new user has a ${peakRiskRatio}% chance of being wiped out whenever they reach a high point</small>
            </div>
        `;
    };
    
    // Clear chart data
    document.getElementById('clear-chart-btn').addEventListener('click', () => {
        if (confirm('Clear all statistics data? This cannot be undone.')) {
            localStorage.removeItem('slotsStats');
            localStorage.removeItem('balanceHistory');
            localStorage.removeItem('slotsActivity');
            localStorage.removeItem('winBreakdown');
            updateStatsDisplay();
        }
    });

    // Refresh stats
    document.getElementById('refresh-stats-btn').addEventListener('click', updateStatsDisplay);
    
    // Chart range selection buttons
    const updateRangeButtonStyles = () => {
        document.querySelectorAll('.range-btn').forEach(btn => {
            const range = parseInt(btn.getAttribute('data-range'));
            if (range === selectedChartRange) {
                btn.style.background = '#007bff';
                btn.style.color = 'white';
            } else {
                btn.style.background = '#6c757d';
                btn.style.color = 'white';
            }
        });
    };
    
    document.querySelectorAll('.range-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedChartRange = parseInt(btn.getAttribute('data-range'));
            updateRangeButtonStyles();
            
            // Update chart with new range
            const stats = loadStats();
            updateBalanceChart(stats.balanceHistory);
        });
    });

    // Initial load
    updateStatsDisplay();
    updateRangeButtonStyles();
    
    // Auto-refresh every 5 seconds when page is visible
    setInterval(() => {
        if (!document.hidden) {
            updateStatsDisplay();
        }
    }, 5000);
});
