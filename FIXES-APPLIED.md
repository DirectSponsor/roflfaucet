# ROFLFaucet Authentication & Balance System Fixes

## Date: August 2-3, 2025

### Issues Resolved

#### 1. CORS Header Conflicts
**Problem:** Users could log in but appeared logged out due to CORS errors blocking API calls.
- Multiple conflicting `Access-Control-Allow-Origin` headers from both PHP and nginx
- Duplicated headers causing browser rejection

**Solution:**
- Removed fallback wildcard CORS header from PHP (`Access-Control-Allow-Origin: *`)
- Removed nginx wildcard CORS injection
- Fixed nginx `if` block that was improperly adding headers
- Let PHP handle all CORS headers properly

#### 2. Username Display Issue
**Problem:** Username showed as "undefined" after login
- Frontend expected username at root level of API response
- API returned username nested in `profile` object

**Solution:**
- Updated `jwt-simple.js` to extract username from `profileData.profile.username`
- Deployed fix and verified username displays correctly

#### 3. Balance Updates for Logged-in Users
**Problem:** Faucet claims increased balance for guests but not logged-in users
**Root Causes:**
1. Faucet bridge had separate logic paths for guests vs members instead of unified system
2. Missing nginx route for `/api/user/transaction` endpoint used by member transactions

**Solutions:**
1. Updated faucet bridge to always use unified `addBalance()` function
2. Added nginx location block for `/api/user/transaction` endpoint
3. Verified endpoint accessibility and CORS headers

### Server Configuration Changes

#### Data Server (data.directsponsor.org)
**Files Modified:**
- `/var/www/html/api/profile.php` - Removed fallback CORS header
- `/etc/nginx/sites-available/data.directsponsor.org` - Fixed CORS and added transaction route
- `/var/www/html/bridge.php` - Updated to use unified balance system

**Nginx Configuration Added:**
```nginx
location /api/user/transaction {
    try_files $uri $uri/ /api/user/transaction.php;
}
```

#### Frontend Changes
**Files Modified:**
- `jwt-simple.js` - Fixed username extraction from profile API response

### Verification Steps
1. ✅ Login flow works correctly
2. ✅ Username displays properly after login  
3. ✅ Balance updates for both guests and logged-in users
4. ✅ Slots game properly adds/subtracts balance
5. ✅ CORS headers are singular and correct
6. ✅ No authentication errors in browser console

### Backup Recommendations
- Use `backup-server-config.sh` to backup server configurations
- Consider automated daily backups of critical config files
- Document any future server changes in this file

### System Architecture Notes
- Auth server and data server have separate nginx configs
- Unified balance system handles both guest (localStorage) and member (API) transactions
- JWT tokens properly validated and profile data accessible
- CORS configured securely for specific origins only
