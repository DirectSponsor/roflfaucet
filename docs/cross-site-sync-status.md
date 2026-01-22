# Cross-Site Sync Detection - Implementation Status

**Date:** 2026-01-22  
**Status:** ✅ Working - Balance updates persist correctly

## What Was Implemented

### Server-Side Cross-Site Detection
- **Files Created:**
  - `/api/mark_recent_change.php` - Marks user balance changes in a tracking file
  - `/api/recent_changes.txt` - Public text file listing user IDs with recent changes (last 30s)
  - `/api/check_cross_site_changes.php` - Server-side API that checks other sites for recent changes
  - `/api/.htaccess` - CORS headers to allow cross-site requests

### How It Works
1. When user updates balance on Site A, `mark_recent_change.php` adds their user ID to `recent_changes.txt`
2. When user focuses tab on Site B, JavaScript calls local `check_cross_site_changes.php`
3. Server-side PHP fetches `recent_changes.txt` from other sites (no CORS issues)
4. If user ID found, shows banner: "⚠️ Balance updated on [Site] Xs ago [Sync Now] [Dismiss]"
5. User clicks "Sync Now" → waits 10 seconds → reloads balance → shows success

### Sites Deployed
- ✅ ROFLFaucet
- ✅ ClickForCharity
- ⏳ Auth server (skipped - SSL/CORS issues, not critical)

## Issues Fixed Today

### Issue 1: CORS Errors
**Problem:** Browser blocked cross-site requests to `recent_changes.txt`  
**Solution:** Moved detection to server-side PHP + added `.htaccess` CORS headers

### Issue 2: Balance Not Persisting
**Problem:** Balance updates showed briefly then reverted to old value  
**Root Cause:** Stale netChange detection was clearing localStorage too aggressively  
**Solution:** Removed the 5-minute staleness check - it was interfering with normal operations

### Issue 3: Wrong Document Root (ClickForCharity)
**Problem:** Files deployed to `/var/www/html/` but site uses `/var/www/clickforcharity.net/public_html/`  
**Solution:** Moved files to correct location with proper permissions

## Current State

### Working Features
- ✅ Balance updates persist correctly across page loads and games
- ✅ Cross-site detection API endpoints deployed and functional
- ✅ Server-side checking avoids all CORS issues
- ✅ Lightweight tracking (just user IDs in text file, auto-expires after 30s)

### Pending Testing
- ⏳ Cross-site sync banner display (need to test switching between sites quickly)
- ⏳ Verify sync banner shows correct site name and timing
- ⏳ Test "Sync Now" button functionality

## Files Modified

### ROFLFaucet
```
site/api/mark_recent_change.php          (new)
site/api/recent_changes.txt              (new)
site/api/check_cross_site_changes.php    (new)
site/api/.htaccess                       (new)
site/scripts/unified-balance.js          (modified)
```

### ClickForCharity
```
api/mark_recent_change.php               (new)
api/recent_changes.txt                   (new)
api/check_cross_site_changes.php         (new)
api/.htaccess                            (new)
js/unified-balance.js                    (modified)
```

## Git Commits (Most Recent First)
```
f0e8d29 - Remove stale netChange detection - was clearing balances too aggressively
8428f99 - Add stale netChange detection - clears localStorage older than 5 minutes (REVERTED)
d569dcd - Switch to server-side cross-site change detection - no CORS issues
316922d - Add CORS headers for cross-site recent changes tracking
6103c67 - Add cross-site recent changes tracking - lightweight sync detection via public txt files
19fe131 - Revert all sync protection changes - back to simple system
```

## Next Steps

1. **Test cross-site switching:**
   - Play on ROFLFaucet (claim faucet or game)
   - Wait 2 seconds for flush
   - Switch to ClickForCharity tab
   - Verify banner appears with correct info

2. **Test sync button:**
   - Click "Sync Now" on banner
   - Verify 10-second wait message
   - Verify balance updates correctly
   - Verify success message appears

3. **Monitor for conflicts:**
   ```bash
   ssh es3-auth "find /var/directsponsor-data/userdata/balances -name '*.sync-conflict*' -mmin -10"
   ```

4. **Update main documentation:**
   - Update `/docs/cross-site-sync-implementation.md` with final server-side approach
   - Document the removal of stale detection and why

## Known Issues

### Syncthing Not Running on ROFLFaucet
- Syncthing service is inactive on ROFLFaucet server
- Files are still syncing via auth server as hub
- Not critical but should be investigated

### Old Sync Conflicts
- User `2-andytest2` has 14+ old sync conflicts
- These are archived but should be cleaned up
- Conflict resolver not running on auth server

## Performance Notes

- **Overhead:** Minimal - only 3 small text file fetches when focusing tab
- **Frequency:** Only checks when user focuses tab (not on every action)
- **File Size:** `recent_changes.txt` stays tiny (auto-expires entries after 30s)
- **Server Load:** Negligible - simple file reads, no database queries

## Architecture

```
User plays on ROFLFaucet
  ↓
Balance flush writes to file
  ↓
Calls mark_recent_change.php
  ↓
Adds user ID to recent_changes.txt (timestamp:userId)
  ↓
User switches to ClickForCharity
  ↓
Tab focus event triggers checkForCrossSiteChanges()
  ↓
Calls local check_cross_site_changes.php
  ↓
Server fetches recent_changes.txt from ROFLFaucet
  ↓
Finds user ID → Shows banner
  ↓
User clicks "Sync Now" → Waits 10s → Reloads balance
```

## Lessons Learned

1. **Server-side is simpler** - Avoids all CORS complexity
2. **Don't over-optimize** - Stale detection seemed smart but broke normal flow
3. **Test incrementally** - Many iterations to get right approach
4. **Document root matters** - ClickForCharity uses non-standard path
5. **Permissions critical** - Files must be writable by www-data

---

**For tomorrow:** Start fresh conversation, test cross-site banner, verify everything works end-to-end.
