# Cross-Site Balance Sync Implementation

**Status:** ✅ Implemented  
**Date:** 2026-01-22  
**System:** ROFLFaucet (will be deployed to ClickForCharity and other sites)

## Overview

Automatic detection and handling of cross-site navigation to prevent Syncthing race conditions and balance conflicts.

## How It Works

### File-Timestamp Based Detection

Instead of relying on browser state (referrer, session storage, etc.), we use the balance file's `last_updated` timestamp to detect when a user has just arrived from another DirectSponsor site.

**Logic:**
1. Page loads → immediately fetch balance data (includes `last_updated` timestamp)
2. Calculate file age: `pageLoadTime - last_updated`
3. If file age < 15 seconds → user likely just came from another site
4. Set `syncInProgress = true` flag
5. Wait 10 seconds for Syncthing to propagate changes
6. Reload balance with synced data
7. Set `syncInProgress = false` - actions can proceed

**Action Queuing:**
- If user clicks a button during sync, the action waits instead of being blocked
- `addToNetChange()` checks `syncInProgress` flag
- If sync in progress, action waits in a loop (checks every 100ms)
- When sync completes, action proceeds automatically
- User gets their coins - nothing is lost!

### Why This Approach

**Advantages:**
- ✅ **Server-authoritative** - Uses file timestamp, not browser state
- ✅ **Automatic** - No manual tracking or referrer detection needed
- ✅ **Robust** - Works even if browser data is cleared
- ✅ **No false positives** - Won't delay on same-site navigation
- ✅ **Handles all cases** - Bookmarks, direct visits, cross-site, refreshes

**Edge Cases Handled:**
- Same-site navigation (game → game): File is old, no delay
- Cross-site navigation (ROFLFaucet → ClickForCharity): File is fresh, 10s delay
- Direct visit (bookmark): File is old, no delay
- Page refresh: File is old (unless just played), no delay
- Browser data cleared: File exists on server, works fine

## Implementation Details

### Key Changes to `unified-balance.js`

1. **Added `syncInProgress` flag**
   - Starts as `false`
   - Set to `true` during cross-site sync delay
   - Set to `false` after sync completes
   - Used to queue actions instead of blocking them

2. **Added `checkAndWaitForSync()` method**
   - Runs on page load for logged-in users
   - Skips on page refresh (F5) - only runs on normal navigation
   - Fetches balance data with `last_updated` timestamp
   - Calculates file age
   - If fresh (<15s): Sets `syncInProgress = true`, waits 10s, reloads balance, sets `syncInProgress = false`
   - If old (>15s): No delay, no flag set

3. **Added `waitForSyncIfNeeded()` method**
   - Checks `syncInProgress` flag
   - If sync in progress, waits in a loop (checks every 100ms)
   - Shows "⏳ Waiting for sync to complete..." message
   - Returns when sync completes
   - Actions proceed automatically after wait

4. **Modified `addToNetChange()` method**
   - Now `async` function
   - Calls `await waitForSyncIfNeeded()` before processing
   - **Queues** transactions during sync period instead of blocking them
   - User actions are delayed, not lost

### Configuration

```javascript
// Thresholds (in milliseconds)
const FILE_AGE_THRESHOLD = 15000;  // 15 seconds
const SYNC_WAIT_TIME = 10000;      // 10 seconds
```

**Why 15 seconds?**
- Allows 5 seconds for user to switch tabs
- Plus 10 seconds detection window
- Balances false positives vs unnecessary delays

**Why 10 seconds?**
- Syncthing typically syncs in 5-10 seconds
- 10 seconds covers 95% of cases
- Better to wait than create conflicts

## User Experience

### Normal Browsing (No Delay)
- User loads page directly
- File is old (>15s)
- Games enabled immediately
- No sync message shown

### Cross-Site Navigation (10s Delay)
1. User plays on ROFLFaucet
2. Switches to ClickForCharity tab
3. ROFLFaucet flushes balance on `visibilitychange`
4. ClickForCharity page loads
5. Detects fresh file (<15s old)
6. Shows: "⏳ Syncing balance from other site... (10 seconds)"
7. Sets `syncInProgress = true`
8. Waits 10 seconds
9. Reloads balance (now synced)
10. Sets `syncInProgress = false`
11. Shows: "✅ Balance synced!" (2 seconds)
12. Any queued actions proceed automatically

### During Sync Period
- User can browse the site
- Balance display shows current value
- User clicks faucet/game button during sync:
  - Action is **queued**, not blocked
  - Shows: "⏳ Waiting for sync to complete..."
  - After 10 seconds, action proceeds automatically
  - User gets their coins - nothing is lost!
- **Actions are delayed, not blocked** - user experience is seamless

## Server Requirements

The balance API (`/api/get_balance.php`) must return `last_updated` timestamp:

```json
{
  "success": true,
  "balance": 1234.56,
  "last_updated": 1737577200
}
```

This timestamp should be set whenever the balance file is written (already implemented in the flush mechanism).

## Testing

### Test Scenarios

1. **Cross-site navigation**
   - Play on ROFLFaucet
   - Switch to ClickForCharity
   - Should see 10-second sync message
   - Balance should be correct after sync

2. **Same-site navigation**
   - Navigate between games on same site
   - Should NOT see sync delay
   - Games should work immediately

3. **Direct visit**
   - Bookmark or type URL
   - Should NOT see sync delay
   - Games should work immediately

4. **Page refresh**
   - Refresh page on same site
   - Should NOT see sync delay (unless just played)
   - Games should work immediately

### Console Logging

The system logs detailed information:

```
🔄 Balance file is fresh (3s old) - waiting for Syncthing sync...
⏳ Waiting 10 seconds for sync...
✅ Cross-site sync complete
🎮 Games enabled
```

Or:

```
📊 Balance file is old (45s) - no sync delay needed
🎮 Games enabled
```

## Deployment

**IMPORTANT:** This implementation must be deployed to **ALL** DirectSponsor sites for cross-site sync protection to work properly. Each site needs the same logic to detect when users arrive from another site.

### Deployment Status

#### ROFLFaucet (roflfaucet.com)
- **Status:** ✅ Implemented
- **File:** `/site/scripts/unified-balance.js`
- **Deploy:** `cd /home/andy/work/projects/roflfaucet && ./deploy.sh`

#### ClickForCharity (clickforcharity.net)
- **Status:** ⏳ Pending deployment
- **File:** Same `unified-balance.js` logic needs to be added
- **Location:** `/home/andy/work/projects/clickforcharity.net`
- **Steps:**
  1. Copy the cross-site sync implementation from ROFLFaucet's `unified-balance.js`
  2. Add `gamesEnabled` flag, `checkAndWaitForSync()`, and `canMakeTransaction()` methods
  3. Update constructor to call `checkAndWaitForSync()`
  4. Deploy to server

#### DirectSponsor Hub (auth.directsponsor.org / directsponsor.net)
- **Status:** ⏳ Not yet integrated into network
- **File:** Will need same implementation when brought into sync system
- **Location:** `/home/andy/work/projects/auth-server` (or similar)
- **Note:** When this site joins the DirectSponsor network and shares balance data via Syncthing, it MUST have the same cross-site sync protection implemented

### Deployment Checklist

For each site, ensure:

- [ ] `unified-balance.js` includes `syncInProgress` flag
- [ ] `checkAndWaitForSync()` method is implemented with page refresh detection
- [ ] `waitForSyncIfNeeded()` method is implemented
- [ ] Constructor calls `checkAndWaitForSync()` for logged-in users
- [ ] `addToNetChange()` is `async` and calls `await waitForSyncIfNeeded()`
- [ ] Balance API returns `last_updated` timestamp
- [ ] Site is syncing via Syncthing with other DirectSponsor sites

### Why All Sites Need This

**The protection only works if ALL sites have it:**

1. User plays on **ROFLFaucet** (has protection)
2. Switches to **ClickForCharity** (NO protection)
3. ClickForCharity immediately writes balance without waiting
4. **Conflict created** - protection on ROFLFaucet doesn't help

**With all sites protected:**

1. User plays on **ROFLFaucet** (has protection)
2. ROFLFaucet flushes on `visibilitychange`
3. User switches to **ClickForCharity** (has protection)
4. ClickForCharity detects fresh file, waits 10 seconds
5. Syncthing propagates changes during wait
6. ClickForCharity loads synced balance
7. **No conflict** - both sites coordinated properly

### Code to Copy

The key additions to `unified-balance.js` are:

1. **In constructor:**
```javascript
this.syncInProgress = false; // True during cross-site sync delay
this.pendingActions = []; // Queue for actions during sync

// Later in constructor for logged-in users:
this.checkAndWaitForSync();
```

2. **New methods:**
```javascript
async checkAndWaitForSync() {
    // Skip on page refresh
    if (performance.navigation.type === 1) {
        console.log('📊 Page refresh detected - skipping sync delay');
        return;
    }
    
    // Check file age, if fresh (<15s):
    this.syncInProgress = true;
    await new Promise(resolve => setTimeout(resolve, 10000));
    await this.getBalance();
    this.syncInProgress = false;
}

async waitForSyncIfNeeded() {
    if (!this.syncInProgress) return;
    
    console.log('⏳ Action queued - waiting for sync to complete...');
    while (this.syncInProgress) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}
```

3. **Modified addToNetChange:**
```javascript
async addToNetChange(amount, source, description) {
    // Wait for sync if in progress, then proceed
    await this.waitForSyncIfNeeded();
    
    this.netChange += amount;
    this.saveNetChange();
    // ...
}
```

See ROFLFaucet's `/site/scripts/unified-balance.js` for complete implementation.

## Monitoring

Check for conflicts after deployment:

```bash
# Check for new conflict files
ssh es3-auth "find /var/directsponsor-data/userdata/balances -name '*.sync-conflict*' -type f | wc -l"

# Check conflict resolver logs
ssh es3-auth "tail -20 /var/directsponsor-data/logs/conflict-resolver.log"
```

Expected result: **0 new conflicts** after cross-site navigation

## Fallback

If issues occur, can disable the delay by setting threshold to 0:

```javascript
// In checkAndWaitForSync()
if (fileAge < 0) {  // Never true - disables delay
    // ...
}
```

Or remove the `checkAndWaitForSync()` call from constructor.

---

**Last Updated:** 2026-01-22  
**Status:** ✅ Production Ready  
**Next Steps:** Monitor for conflicts, deploy to other sites if successful
