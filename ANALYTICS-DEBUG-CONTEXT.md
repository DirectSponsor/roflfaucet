# Analytics System Debugging - Complete Context

**Date:** September 23, 2025
**Status:** DEBUGGING WEB SERVER FILE PERMISSIONS ISSUE
**Priority:** HIGH - System functional but files not being created via web requests

## 🎯 CURRENT SITUATION

### ✅ WORKING CORRECTLY:
1. **Username Detection:** Fixed - now correctly detects "andytest2" instead of "guest"
2. **Browser Requests:** Successfully reaching our analytics.php file
3. **Response Format:** Correct JSON response with unique identifiers
4. **Command Line Execution:** PHP script works perfectly when run via SSH
5. **File Permissions:** www-data has correct ownership of stats directory

### ❌ CURRENT PROBLEM:
**Web server requests return success but don't create files**
- Browser gets: `{"success":true,"message":"Game logged","server_time":"2025-09-23 19:00:40","file_version":"2.0"}`
- But NO files are created in `/var/www/staging/userdata/stats/`
- No debug.log, no game log files, nothing

## 🔍 DEBUGGING PROGRESS

### Phase 1: System Cleanup (COMPLETED)
- ✅ Removed old analytics files to avoid conflicts
- ✅ Renamed analytics-simple → analytics for cleaner naming
- ✅ Updated all file references to use `userdata/stats/` instead of `userdata/stats-simple/`
- ✅ Verified only our analytics system remains

### Phase 2: Username Detection Fix (COMPLETED)
- ❌ Initial problem: Games logged as "guest" instead of actual username
- ✅ Solution: Updated to use `getValidUsername()` function from site-utils.js
- ✅ Fallback: Direct localStorage access using same method as site-utils
- ✅ Result: Now correctly detects "andytest2"

### Phase 3: Request Routing Investigation (COMPLETED)
- ❌ Initial suspicion: Browser requests going to wrong endpoint
- ✅ Added debug logging to confirm browser reaches our file
- ✅ Added unique response identifiers (server_time, file_version)
- ✅ Confirmed: Browser IS reaching our analytics.php file

### Phase 4: File Creation Mystery (IN PROGRESS)
- 🔍 **Current Issue:** Web server can't write files despite:
  - Correct response from PHP script
  - Proper directory permissions (www-data:www-data)
  - Command line execution works perfectly
  - No web server errors in logs

## 📁 FILE STRUCTURE

### Current Analytics Files:
```
/var/www/staging/
├── analytics.html                    # Dashboard (renamed from analytics-simple.html)
├── scripts/analytics.php             # API backend (renamed from analytics-simple.php)
└── userdata/stats/                   # Data directory (renamed from userdata/stats-simple/)
    └── (should contain game logs but empty due to bug)
```

### Expected Files When Working:
```
userdata/stats/
├── debug.log                         # Debug logging from web requests
├── aggregate_2025-09-23.log          # All games aggregated
├── daily_summary_2025-09-23.json     # Daily summary stats
└── user_andytest2_2025-09-23.log     # Per-user game logs
```

## 🧪 TESTING RESULTS

### Command Line Tests (WORKING):
```bash
# Direct PHP execution - WORKS
cd /var/www/staging && sudo -u www-data php -r "..."
# Result: All files created correctly

# Curl POST tests - WORKS  
curl -s -X POST 'https://staging.roflfaucet.com/scripts/analytics.php' -d 'action=log_game&...'
# Result: Success response but NO files created (same as browser!)
```

### Browser Tests (PARTIAL):
```javascript
// Console output shows:
📊 Analytics: Logging game for user "andytest2" (hybrid: user + aggregate)
🌐 Making analytics request to: /scripts/analytics.php
📊 Response status: 200, text: {"success":true,"message":"Game logged","server_time":"2025-09-23 19:00:40","file_version":"2.0"}
✅ Analytics: Game logged successfully (hybrid mode)
```

## 🔧 CURRENT DEBUG MODIFICATIONS

### Latest Changes to analytics.php:
1. **Enhanced Debug Logging:**
   ```php
   $debugLog = "DEBUG: POST request received at " . date('Y-m-d H:i:s') . " with data: " . json_encode($_POST) . " from " . ($_SERVER['HTTP_USER_AGENT'] ?? 'unknown') . "\n";
   ```

2. **Permission Testing:**
   ```php
   if ($result === false) {
       file_put_contents('/tmp/analytics_debug.log', "FAILED: Could not write to userdata/stats/debug.log at " . date('Y-m-d H:i:s') . "\n", FILE_APPEND);
   } else {
       file_put_contents('userdata/stats/test_web.txt', 'Web server can write: ' . date('Y-m-d H:i:s'), LOCK_EX);
   }
   ```

3. **Unique Response Identifiers:**
   ```php
   echo json_encode(['success' => true, 'message' => 'Game logged', 'server_time' => date('Y-m-d H:i:s'), 'file_version' => '2.0']);
   ```

## 🎲 GAME INTEGRATION

### Poker Dice Game Integration:
- ✅ File: `scripts/poker-dice-game.js`
- ✅ Function: `logToAnalytics()` on line ~1692
- ✅ URL: `/scripts/analytics.php` 
- ✅ Method: POST with form data
- ✅ Data: `action=log_game&user_id=andytest2&game_type=poker-dice&bet_amount=5&payout=0`

## 🏗️ SERVER ENVIRONMENT

### Server Details:
- **Server:** VPS (not using CDN/caching)
- **Web Server:** Apache/2.4.41 (Ubuntu) 
- **PHP Version:** (needs verification)
- **Directory Owner:** www-data:www-data
- **Directory Permissions:** 755

### Recent Issues Noted:
- Browser performance degradation (possibly system-related)
- Need for system reboot mentioned
- Possible dashboard widget causing resource issues

## 🎯 NEXT STEPS

### Immediate Actions Needed:
1. **Test Latest Changes:** Play one more game to check if new debug modifications work
2. **Check File Creation:** Look for:
   - `/var/www/staging/userdata/stats/debug.log`
   - `/var/www/staging/userdata/stats/test_web.txt`
   - `/tmp/analytics_debug.log`

### Possible Solutions to Investigate:
1. **PHP Configuration:** Check if web server PHP has different settings than CLI
2. **Working Directory:** PHP might be running from different directory via web
3. **File Locking:** LOCK_EX might be causing issues in web context
4. **Error Suppression:** Errors might be suppressed in web context

### Testing Commands for After Reboot:
```bash
# Check what files exist
ssh es7-roflfaucet "ls -la /var/www/staging/userdata/stats/"

# Check for debug logs
ssh es7-roflfaucet "cat /var/www/staging/userdata/stats/debug.log 2>/dev/null || echo 'No debug log'"

# Check for temp debug log
ssh es7-roflfaucet "cat /tmp/analytics_debug.log 2>/dev/null || echo 'No temp debug log'"

# Check for test file
ssh es7-roflfaucet "cat /var/www/staging/userdata/stats/test_web.txt 2>/dev/null || echo 'No test file'"
```

## 📊 ANALYTICS DASHBOARD

### Dashboard Status:
- ✅ URL: `/analytics.html` (clean URL)
- ✅ File exists and loads correctly
- ❌ Shows no data (expected since no files are being created)
- ✅ API endpoints work when data exists

### Dashboard API Endpoints:
- `GET /scripts/analytics.php?action=dashboard&days=7` - Summary stats
- `GET /scripts/analytics.php?action=leaderboard&days=7` - User rankings

## 💡 KEY INSIGHTS

1. **The PHP script IS being executed** (proven by unique response identifiers)
2. **The logic IS running** (success response indicates code execution)
3. **File write operations ARE failing silently** (no files created, no errors shown)
4. **Command line execution works perfectly** (different context issue)

This suggests a **web server context issue** rather than a code logic problem.

---

**Status:** Ready for post-reboot testing to determine if it's a system resource issue or a deeper web server configuration problem.