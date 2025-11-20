# Cross-Site Sync System Work Prompt

**Use this prompt in a new window to avoid context problems**

## Current Status

The cross-site sync system is **IMPLEMENTED AND DEPLOYED**. This document tracks where we are and what might still need work.

## Architecture Overview

**Hub-and-Spoke File Sync Model:**
- **Hub**: auth.directsponsor.org
- **Spokes**: ROFLFaucet (roflfaucet.com), ClickForCharity (clickforcharity.net)
- **Technology**: `inotify + rsync` daemons (not JavaScript-based)
- **Data**: User balances, profiles, tokens synced via filesystem

## Source of Truth Documentation

All definitive documentation is in: `/home/andy/work/sync-system/`

Key files:
- `FILE_SYNC_STRATEGY.md` - Complete technical specification
- `DEPLOYMENT_GUIDE.md` - Step-by-step deployment instructions  
- `README_SYNC.md` - Quick reference guide
- `sync-to-hub.sh` - Spoke daemon (watches local files, syncs to hub)
- `hub-distribute.sh` - Hub daemon (redistributes changes to all spokes)
- `sync-to-hub.service` - systemd service for spokes
- `hub-distribute.service` - systemd service for hub

## Current Implementation Status

### ✅ What's Working

1. **Hub Infrastructure (auth.directsponsor.org)**
   - Sync API deployed at `/api/sync.php` (NO - this was API design, abandoned)
   - Actually: File sync via inotify + rsync instead
   - Data directories: `/var/directsponsor-data/userdata/balances/`, etc.
   - Hub daemon running: `hub-distribute.sh` redistributes changes to all spokes

2. **ROFLFaucet (roflfaucet.com)**
   - File watcher daemon running: `sync-to-hub.sh`
   - Real-time balance sync via inotify (detects file changes instantly)
   - Automatic rsync push to hub within ~1 second
   - Log: `/var/roflfaucet-data/logs/sync-daemon.log`
   - Systemd service: `sync-to-hub` (enabled and running)

3. **ClickForCharity (clickforcharity.net)**
   - File watcher daemon running: `sync-to-hub.sh` (configured for CFC data dir)
   - Same real-time sync as ROFLFaucet
   - Log: `/var/clickforcharity-data/logs/sync-daemon.log`
   - Systemd service: `sync-to-hub` (enabled and running)

4. **Unified Balance System**
   - ROFLFaucet: `unified-balance.js` reads from local cache, syncs via file system
   - ClickForCharity: `unified-balance.js` reads from local cache, syncs via file system
   - Both support guest (localStorage) and member (server file) modes
   - Auto-detects login status and routes appropriately

### ⏳ What Might Need Work

1. **JavaScript-to-Server Integration**
   - JavaScript balance functions need to write files (not API calls)
   - Check if `addBalance()`, `subtractBalance()`, `getBalance()` actually write to `/var/{site}-data/userdata/balances/`
   - File write should trigger inotify → rsync → hub distribution
   - **VERIFY**: Is this actually working or are we still using API calls?

2. **Guest Transaction Tracking**
   - Guests use `localStorage` key: `guest_transactions`
   - Members use files: `/var/{site}-data/userdata/balances/{user_id}.txt`
   - **VERIFY**: Is guest balance correctly being written to server when user logs in?

3. **Multi-Site Cross-Sync Verification**
   - Can earn coins on ROFLFaucet and see them on ClickForCharity?
   - Latency should be ~5-10 seconds (debounce + rsync)
   - **TEST**: Earn coins on one site, switch to other, verify balance updates

4. **Profile Sync (Lower Priority)**
   - Currently only balances are syncing
   - Profiles not yet implemented in new file sync system
   - Old `PROFILE_SYNC_SYSTEM.md` and `SMART_SYNC_README.md` removed (they were outdated)

5. **Rate Limiting & Error Handling**
   - Check if rsync failures are logged and handled gracefully
   - Check if services auto-restart on failure

## Data Directory Structure

Each server has this structure:

```
/var/{site}-data/userdata/
  ├── balances/
  │   ├── 1-andy.txt       # {user_id, balance}
  │   └── 2-bob.txt
  ├── profiles/            # (not yet implemented)
  │   ├── 1-andy.txt
  │   └── 2-bob.txt
  └── tokens/              # (not yet implemented)
      ├── 1-andy.txt
      └── 2-bob.txt
```

## How to Investigate Current Status

### 1. Check If Daemons Are Running

```bash
# On spokes (ROFLFaucet, ClickForCharity)
sudo systemctl status sync-to-hub
sudo journalctl -u sync-to-hub -n 20

# On hub (auth.directsponsor.org)
sudo systemctl status hub-distribute
sudo journalctl -u hub-distribute -n 20
```

### 2. Test Balance File Write & Sync

```bash
# On ROFLFaucet server
# Write a test balance file
echo '{"user_id": "999-test", "balance": 5000}' | sudo tee /var/roflfaucet-data/userdata/balances/test-999.txt

# Watch logs - should see sync within 5-10 seconds
sudo journalctl -u sync-to-hub -f

# Check if file made it to hub
ssh hub cat /var/directsponsor-data/userdata/balances/test-999.txt

# Check if file made it to ClickForCharity
ssh clickforcharity cat /var/clickforcharity-data/userdata/balances/test-999.txt
```

### 3. Test JavaScript Integration

```bash
# On ROFLFaucet, check if unified-balance.js writes files or makes API calls
grep -n "file_put_contents\|fopen\|fwrite" /var/roflfaucet/site/scripts/unified-balance.js
# Should find PHP code that writes to /var/roflfaucet-data/userdata/balances/

# OR check if it's still making API calls instead
grep -n "fetch\|XMLHttpRequest" /var/roflfaucet/site/scripts/unified-balance.js
```

### 4. Monitor Real-Time Sync

```bash
# Terminal 1: Watch ROFLFaucet sync logs
ssh roflfaucet
sudo journalctl -u sync-to-hub -f

# Terminal 2: Make a change
ssh roflfaucet
echo '{"balance": 6000}' | sudo tee /var/roflfaucet-data/userdata/balances/test-999.txt

# Terminal 3: Watch it appear on hub
ssh hub
sudo journalctl -u hub-distribute -f

# Should see messages about redistribution within 5-10 seconds
```

## Key Questions to Answer

1. **Are JavaScript balance functions writing to files or making API calls?**
   - If API calls: They need to write files instead (or API writes files server-side)
   - If files: Is the write path correct? `/var/{site}-data/userdata/balances/`

2. **Are the sync daemons actually running and syncing?**
   - Check systemctl status
   - Check recent logs
   - Do test file sync

3. **Is multi-site sync working?**
   - Earn coins on ROFL, see them on CFC
   - Should happen within 5-10 seconds

4. **What about profile sync?**
   - Currently not implemented in new file sync system
   - Lower priority than balance sync

5. **What about guest to member conversion?**
   - When guest logs in, should old guest transactions be migrated?
   - Currently just clears guest_transactions cache

## Debugging Checklist

- [ ] Verify sync daemons are running (`systemctl status`)
- [ ] Check recent sync logs (look for errors)
- [ ] Test file write from console (create test file manually)
- [ ] Verify rsync connectivity (SSH to hub works)
- [ ] Check file permissions (www-data can write to data dirs)
- [ ] Monitor bandwidth/performance impact
- [ ] Test cross-site sync (earn on one site, check another)
- [ ] Verify inotify is watching correct directories
- [ ] Check for any error logs or failed operations

## Next Steps (If Issues Found)

1. **If daemons not running**: Check why (`systemctl status` shows error), restart if needed
2. **If file sync failing**: Test rsync manually, check SSH keys, verify paths
3. **If JavaScript integration broken**: Update balance functions to write files
4. **If latency too high**: Reduce debounce time in sync scripts (currently 5 seconds)
5. **If performance issues**: Monitor inotify/rsync resource usage, optimize if needed

## Files Modified in Recent Work

Check these locations for recent changes relative to sync-system/ docs:
- `/home/andy/work/projects/roflfaucet/site/scripts/unified-balance.js`
- `/home/andy/work/projects/clickforcharity/site/js/unified-balance.js`
- `/home/andy/work/projects/roflfaucet/site/api/` (balance-related PHP)
- `/home/andy/work/projects/clickforcharity/site/api/` (balance-related PHP)

Any recent changes to these might not be reflected in the sync-system/ docs yet.

---

**Start with**: Check if daemons are running and test manual file sync to see where we actually are.
