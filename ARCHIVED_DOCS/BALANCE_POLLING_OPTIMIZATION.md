# Balance Polling Optimization Strategy

> **Related Documentation:**
> - 🚀 **Server Deployment & Sync**: [DEPLOYMENT_SYSTEM.md](DEPLOYMENT_SYSTEM.md) - Cross-server synchronization for staging/production
> - 📊 **Balance System Architecture**: [staging/BALANCE_SYSTEM_DOCS.md](staging/BALANCE_SYSTEM_DOCS.md) - File-based balance system details
> - 🔄 **Single-Site Smart Sync**: [SMART_SYNC_README.md](SMART_SYNC_README.md) - Client-side polling optimization and multi-tab sync
> - 🌐 **Cross-Site Sync Architecture**: [PURE_SYNC_ARCHITECTURE_2025-08-12.md](PURE_SYNC_ARCHITECTURE_2025-08-12.md) - Multi-site data synchronization system
>
> **Scope**: This document focuses on **single-site polling optimization**. For cross-site synchronization between multiple websites, see the Pure Sync Architecture document.

## Current Problem

The poker dice game (`scripts/poker-dice-game.js`) currently polls the server every 1000ms (1 second) to refresh balance and update UI components. This creates unnecessary server load and bandwidth usage.

**Current Implementation (Lines 125-128):**
```javascript
setInterval(() => {
    this.refreshBalance();
    this.updateMainButton();
}, 1000);
```

## Impact Analysis

- **Server Load**: Every active user hits the balance API endpoint once per second
- **Bandwidth**: Constant network requests even when user is idle
- **Scalability**: Does not scale well with increased user base
- **User Experience**: Minimal benefit since balance rarely changes outside of game actions

## Smart Polling Strategy

### Leveraging Existing Infrastructure

The `unified-balance.js` system already includes sophisticated smart sync capabilities:
- Event-driven polling on page visibility changes
- User activity tracking with inactivity fallback (5-minute timer)
- Smart sync system that only updates when needed

### Proposed Changes

1. **Remove Constant Polling**
   - Eliminate the `setInterval` that runs every second
   - Replace with event-driven updates

2. **Event-Driven Balance Updates**
   - **Game Start**: Refresh balance when user places bet
   - **Game End**: Refresh after win/loss processing
   - **User Activity**: Update on dice interactions, bet changes
   - **Page Focus**: Use existing visibility change handlers
   - **Periodic Fallback**: Only when game is active and user engaged

3. **Implementation Strategy**
   ```javascript
   // Instead of constant polling:
   // setInterval(() => this.refreshBalance(), 1000);
   
   // Use smart event-driven approach:
   async startGame() {
       await this.refreshBalance(); // Before bet validation
       // ... existing game logic
   }
   
   async determineWinner() {
       // ... existing win/loss logic
       await this.refreshBalance(); // After balance changes
   }
   
   // Activity-based fallback only when needed
   setupSmartBalanceRefresh() {
       // Light periodic check only during active gameplay
       // Leverage unified-balance.js smart sync system
   }
   ```

4. **Benefits**
   - **90%+ reduction** in server requests
   - Better scalability for multiple concurrent users
   - Maintains accurate balance display
   - Leverages existing smart sync infrastructure
   - Preserves responsive UI experience

## Integration Points

### Existing Smart Sync System
The `UnifiedBalanceSystem` class already provides:
- `setupSmartSync()` - Event listeners for page visibility, user activity
- `syncIfNeeded()` - Conditional sync based on triggers
- `resetInactivityTimer()` - Activity-based timing
- Activity event tracking: mousedown, mousemove, keypress, scroll, touchstart, click

### Recommended Approach
1. Remove the constant `setInterval` from poker-dice-game.js
2. Add balance refresh calls to key game events:
   - Before bet validation (`startGame()`)
   - After win/loss processing (`determineWinner()`)
   - On user interactions (bet changes, dice holds)
3. Let the existing smart sync system handle background updates
4. Add minimal periodic check only during active gameplay (e.g., 30-60 seconds, not 1 second)

## Implementation Considerations

### Multi-Tab Synchronization Strategy

The key insight: **Only users with multiple tabs open need special synchronization handling**. This is a small minority of users.

**Simple Approach:**
- **Single tab users** (99% of cases): No special handling needed
- **Multiple tab users**: Make them wait while we check file timestamps before any balance operation

**File-Based Sync Check:**
```javascript
// Check if balance file was modified by another tab
async checkIfSyncNeeded() {
    if (!this.isLoggedIn) return false;
    
    // Get current file timestamp from server
    const response = await fetch(`api/balance-timestamp.php?user_id=${this.userId}`);
    const serverTimestamp = await response.json();
    
    // Compare with our last known timestamp
    if (this.lastServerTimestamp && serverTimestamp > this.lastServerTimestamp) {
        console.log('🔄 Balance file modified by another tab - sync needed');
        return true;
    }
    
    return false;
}
```

**Benefits of this approach:**
- **No impact on single-tab users** (the vast majority)
- **Simple file timestamp check** - lightweight server operation
- **Multiple tabs handled gracefully** with brief wait during sync check
- **Leverages existing file-based architecture**
- **Minimal UX impact** - brief spinner/loading state for rare multi-tab scenarios

**User Experience for Multi-Tab Users:**
```javascript
// Show brief loading state during sync check (only for multi-tab users)
async performGameAction(action) {
    if (this.isLoggedIn) {
        // Quick timestamp check - typically <100ms
        showLoadingSpinner(); // Brief loading indicator
        const syncNeeded = await this.checkIfSyncNeeded();
        if (syncNeeded) {
            await this.getRealBalance(); // Sync if needed
        }
        hideLoadingSpinner();
    }
    
    // Continue with game action
    await action();
}
```

**Reality:** Most users won't even notice the sync check - it's just a few milliseconds for a file timestamp lookup. Only the rare multi-tab user who made changes in another tab will see a brief spinner.

### Edge Cases to Handle
- **Network failures**: Graceful degradation when balance refresh fails
- **Race conditions**: Ensure balance updates don't conflict with game state
- **User experience**: Maintain responsive feel without constant requests
- **File timestamp precision**: Handle cases where timestamps are identical

### Testing Strategy
- Verify balance accuracy after bet placement and game resolution
- Test with network throttling to ensure graceful handling
- Monitor server load reduction in production
- Validate UI responsiveness during extended play sessions

## Implementation Plan

### Phase 1: Create File Timestamp API

**Create `api/balance-timestamp.php`:**
```php
<?php
// Quick timestamp check for multi-tab synchronization
header('Content-Type: application/json');

$userId = $_GET['user_id'] ?? null;
if (!$userId) {
    echo json_encode(['error' => 'Missing user_id']);
    exit;
}

$balanceFile = "userdata/balances/{$userId}.txt";
if (file_exists($balanceFile)) {
    $timestamp = filemtime($balanceFile);
    echo json_encode(['timestamp' => $timestamp]);
} else {
    echo json_encode(['timestamp' => 0]);
}
?>
```

### Phase 2: Implement Smart Sync Check

**Update `checkIfSyncNeeded()` in unified-balance.js:**
```javascript
async checkIfSyncNeeded() {
    if (!this.isLoggedIn) return false;
    
    try {
        const response = await fetch(`api/balance-timestamp.php?user_id=${this.userId}`);
        const data = await response.json();
        
        if (this.lastServerTimestamp && data.timestamp > this.lastServerTimestamp) {
            console.log('🔄 Balance file modified elsewhere - sync needed');
            this.lastServerTimestamp = data.timestamp;
            return true;
        }
        
        this.lastServerTimestamp = data.timestamp;
        return false;
    } catch (error) {
        console.warn('⚠️ Sync check failed, assuming sync needed:', error);
        return true; // Fail safe - sync if check fails
    }
}
```

### Phase 3: Remove Constant Polling from Games

**Update poker-dice-game.js (lines 125-128):**
```javascript
// REMOVE THIS:
// setInterval(() => {
//     this.refreshBalance();
//     this.updateMainButton();
// }, 1000);

// REPLACE WITH EVENT-DRIVEN UPDATES:
setupEventDrivenBalance() {
    // Update balance before any game action
    const originalStartGame = this.startGame.bind(this);
    this.startGame = async () => {
        await this.smartBalanceRefresh('before_game');
        return originalStartGame();
    };
    
    // Update balance after game completion
    const originalDetermineWinner = this.determineWinner.bind(this);
    this.determineWinner = async () => {
        const result = originalDetermineWinner();
        await this.smartBalanceRefresh('after_game');
        return result;
    };
}

async smartBalanceRefresh(trigger) {
    if (!this.balanceSystem?.isLoggedIn) return;
    
    try {
        // Brief loading indicator for multi-tab users
        const needsSync = await this.balanceSystem.syncIfNeeded(trigger);
        if (needsSync) {
            await this.refreshBalance();
        }
    } catch (error) {
        console.warn('Smart balance refresh failed:', error);
        // Fallback to regular refresh
        await this.refreshBalance();
    }
}
```

### Phase 4: Add UI Feedback for Multi-Tab Sync

**Create loading indicator component:**
```javascript
// Add to poker-dice-game.js or unified system
showSyncIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'sync-indicator';
    indicator.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
        ">
            <div class="spinner"></div>
            Syncing balance...
        </div>
    `;
    document.body.appendChild(indicator);
}

hideSyncIndicator() {
    const indicator = document.getElementById('sync-indicator');
    if (indicator) indicator.remove();
}
```

## Testing Strategy

### 1. Single Tab Testing
- Verify no background polling occurs
- Confirm balance updates correctly on game actions
- Check server logs for reduced API calls

### 2. Multi-Tab Testing
- Open same game in multiple tabs
- Make balance changes in one tab
- Verify other tab syncs correctly on next action
- Confirm brief loading indicator appears

### 3. Performance Monitoring
- Monitor server load before/after implementation
- Track API request reduction (expect 95%+ decrease)
- Verify user experience remains smooth

### 4. Edge Case Testing
- Network failures during sync check
- Rapid multi-tab interactions
- Server timestamp precision issues

## Expected Results

**Server Load Reduction:**
- Before: 360,000 requests/hour (100 users)
- After: ~500 requests/hour (action-driven only)
- **Reduction: 99.9%**

**User Experience:**
- Single tab users: Identical experience, zero overhead
- Multi-tab users: Brief loading indicator (~50-100ms) occasionally
- All users: Faster response times due to reduced server load

## Next Steps

1. **Phase 1**: Create balance-timestamp.php API endpoint
2. **Phase 2**: Update checkIfSyncNeeded() in unified-balance.js
3. **Phase 3**: Remove setInterval from poker-dice-game.js
4. **Phase 4**: Add UI feedback for sync operations
5. **Testing**: Validate with single and multi-tab scenarios
6. **Monitoring**: Track server load reduction in production
7. **Rollout**: Apply same pattern to other games (slots, wheel, etc.)

---

**Priority**: High (Performance & Scalability Impact)
**Effort**: Medium (4 phases, can be done incrementally)
**Risk**: Low (Existing smart sync system provides fallback safety)
**Impact**: 99.9% reduction in server load, better user experience
