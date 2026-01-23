# Cross-Site Balance Sync - Status

**Date:** 2026-01-23  
**Status:** ⚠️ Simplified - Removed automatic detection, manual sync only

## Current Approach (Simplified)

### What Works Now
- ✅ Balance updates persist correctly on each site
- ✅ Syncthing syncs balance files between servers every 5-10 seconds
- ✅ Manual sync button available for users who switch sites
- ✅ Flush-on-blur ensures changes are saved when leaving a tab

### How It Works
1. User plays on Site A → balance changes accumulate in `netChange`
2. User switches tabs → blur event triggers flush to balance file
3. Syncthing syncs the file to other servers (5-10 seconds)
4. User switches to Site B → balance loads from synced file
5. If user wants immediate sync, they click the manual sync button

### Known Limitation
**Edge case:** If a user actively uses both sites simultaneously (within the same 5-10 second Syncthing window), one transaction may be lost because:
- Site A writes balance file with transaction 1
- Site B writes balance file with transaction 2
- Syncthing syncs → one file overwrites the other
- One transaction is lost

**Frequency:** Rare - requires user to be actively clicking/playing on both sites at the exact same time.

**Mitigation:** Manual sync button available. Users can sync if they notice a discrepancy.

## Files Removed (2026-01-23)

The following cross-site detection files were removed as they added complexity without solving the root problem:

### ROFLFaucet
```
site/api/mark_recent_change.php          (removed)
site/api/recent_changes.txt              (removed)
site/api/check_user_recent.php           (removed)
site/api/check_cross_site_changes.php    (removed)
```

### ClickForCharity
```
api/mark_recent_change.php               (removed)
api/recent_changes.txt                   (removed)
api/check_user_recent.php                (removed)
api/check_cross_site_changes.php         (removed)
```

### JavaScript Changes
Removed from `unified-balance.js` on both sites:
- `checkForCrossSiteChanges()` function
- `showCrossSiteSyncBanner()` function
- `cleanupOldChangeTracking()` function
- `markRecentChange()` function
- Cross-site check on focus event (kept basic balance refresh)
- localStorage tracking for shown banners

## Future Solution: Transaction-Log Approach

**Problem:** Current balance files store absolute values. When Syncthing syncs, one file overwrites the other, losing transactions that happened on the overwritten server.

**Solution:** Store a transaction log instead of absolute balance. When files sync, merge the transactions from both servers.

### Proposed Architecture

#### Balance File Format (New)
```json
{
  "user_id": "2-andytest2",
  "balance": 13190,
  "last_updated": 1769147125,
  "pending_transactions": [
    {
      "id": "roflfaucet_1769147100_abc123",
      "timestamp": 1769147100,
      "server": "roflfaucet",
      "amount": 20,
      "source": "faucet_claim",
      "confirmed": false
    },
    {
      "id": "clickforcharity_1769147110_def456",
      "timestamp": 1769147110,
      "server": "clickforcharity",
      "amount": 10,
      "source": "ptc_task",
      "confirmed": false
    }
  ]
}
```

#### Server-Side Merge Script
Create `/api/merge_balance_transactions.php` that runs via inotify when Syncthing modifies a balance file:

1. Detect when balance file is modified by Syncthing (not by local write)
2. Read incoming `pending_transactions` array
3. Merge with any local pending transactions (by unique ID)
4. Recalculate balance from all transactions
5. Mark old transactions as confirmed
6. Write merged result back to file

#### Benefits
- **No polling:** Event-driven via inotify (Linux file watcher)
- **No conflicts:** Transaction log is append-only, merges automatically
- **Eventually consistent:** All servers converge to same balance within seconds
- **No client changes:** JavaScript stays simple, just reads balance
- **Scales well:** Only processes files that actually changed
- **No lost transactions:** Even if user uses both sites simultaneously

#### Implementation Steps (Future)
1. Update balance file format to include `pending_transactions` array
2. Modify `write_balance.php` to append transactions instead of overwriting balance
3. Create `merge_balance_transactions.php` merge script
4. Set up inotify watcher or cron job (every 5 seconds) to trigger merge
5. Test with simultaneous transactions on both sites
6. Deploy to all servers

#### Syncthing Compatibility
- ✅ No changes needed to Syncthing configuration
- ✅ Still syncs files every 5-10 seconds
- ✅ Still uses last-modified conflict resolution
- ✅ Merge script handles the "overwrite" gracefully by merging transaction logs

### Why Not Implement Now?
- Adds complexity while other features are being stabilized
- Requires testing to ensure merge logic is correct
- Edge case (simultaneous use) is rare for current user base
- Manual sync button provides adequate workaround

## Lessons Learned

1. **Simplicity wins** - Complex detection systems added overhead without solving root problem
2. **Solve at the right level** - Client-side detection can't fix server-side merge conflicts
3. **Accept trade-offs** - Rare edge cases don't always need immediate solutions
4. **Document for later** - Capture the solution design when you have clarity, implement when ready

---

**Next:** Focus on stabilizing core balance system, then revisit transaction-log approach when ready to handle simultaneous-use edge case.
