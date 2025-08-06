# ROFLFaucet Project State Documentation
*Last Updated: 2025-08-06T00:48:00Z*

## 🚨 RECENT SECURITY FIX (August 6, 2025)
**GitGuardian Alert Resolved**: Fixed exposed database credentials in repository

### What Happened:
- GitGuardian detected hardcoded PostgreSQL password in `export_emails.php` (committed Aug 3, pushed Aug 4)
- Additional hardcoded credentials found in `chat-api.php` (MySQL password + JWT secret)
- Files were in public GitHub repository - security risk

### What Was Fixed:
✅ **Removed** `export_emails.php` entirely (obsolete after Listmonk removal)  
✅ **Implemented** secure configuration system with templates  
✅ **Updated** `chat-api.php` to use secure config file  
✅ **Added** `.gitignore` to prevent future credential exposure  
✅ **Created** `SECURITY_SETUP.md` documentation  

### New Security System:
- **`config.template.php`** - Safe template with placeholders (committed to Git)
- **`config.php`** - Real credentials (never committed, protected by .gitignore)
- **All PHP files** now use `require_once 'config.php'` instead of hardcoded passwords

### TODO: Check Other Projects
**Action Required**: Audit other projects for similar hardcoded credentials:
- Auth server (auth.directsponsor.org)
- Data API (data.directsponsor.org) 
- Any other repositories with database connections

**Search for**: Hardcoded passwords, API keys, JWT secrets, database credentials

## Current System Architecture

### Authentication Flow
- **Auth Server**: `auth.directsponsor.org` - Issues JWT tokens with secret `simple_secret_2025`
- **Data API**: `data.directsponsor.org` - Validates tokens and provides user data/balances
- **Frontend**: Uses unified balance system to handle both guest (localStorage) and member (API) modes

### Chat System
- **WebSocket Server**: Running on port 8082 via systemd service `chat-server`
- **Frontend Access**: `wss://roflfaucet.com/ws` (proxied through nginx)
- **Features**: Multi-room chat, rain system (hourly 20 contribution limit), tipping, "Anzar" bot
- **Rooms**: general, vip, help

## System Status (As of August 2, 2025 - 22:52 UTC)

### ✅ Authentication System - FULLY OPERATIONAL
**Status**: RESOLVED - Complete authentication system working perfectly

**What's Working**:
1. ✅ Login flow works - Redirects to auth server and back successfully
2. ✅ JWT tokens - Properly issued, stored, and validated
3. ✅ Username display - Shows correct username (e.g., "andytest1")
4. ✅ Currency terminology - "Useless Coins" for members, "Pointless Tokens" for guests
5. ✅ API integration - Profile and balance calls successful
6. ✅ CORS configuration - Clean, secure headers without conflicts
7. ✅ Member/guest mode switching - Unified balance system working

**Fix Summary**:
- Resolved malformed CORS headers on data server
- Removed insecure wildcard fallbacks
- Fixed username extraction from profile API
- Cleaned nginx/PHP CORS conflicts
- Complete documentation created

### Recent Backend Fix Attempt
**File Modified**: `/var/www/html/config.php` on data.directsponsor.org
**Change**: Replaced OAuth token validation with JWT validation using `simple_secret_2025`
**Status**: Syntax verified, but effectiveness unknown

## Key System Components

### Frontend Files (ROFLFaucet)
- `js/unified-balance.js` - Central balance/auth management
- `js/jwt-simple.js` - JWT token handling and login flows
- `js/chat-integration.js` - Chat system integration
- `js/chat-widget.js` - Chat UI components
- `templates/header.php` - Common header with auth scripts

### Backend Files (Data API)
- `config.php` - Contains validateToken() function (recently modified)
- JWT secret: `simple_secret_2025`

### Chat Server
- `chat-server-advanced.js` - Main WebSocket server
- Systemd service: `chat-server.service`
- Location: `/home/roflfaucet/chat-server-advanced.js`

## Deployment Infrastructure

### Production Server: roflfaucet.com
- **SSH Access**: `ssh roflfaucet@roflfaucet.com`
- **Web Root**: `/var/www/html/`
- **Deployment Script**: `deploy.sh` (handles git commits and file uploads)

### Build System
- `build.php` - Processes templates and generates HTML pages
- Must run after template changes to propagate updates

### Nginx Configuration
- Proxies `/ws` to `localhost:8082/chat` for WebSocket connections
- Serves static files and chat.html normally

## Recent Actions Taken

### Authentication Fixes (Last 24 hours)
1. Fixed JWT login URL to point to external auth server
2. Corrected login button DOM ID from "oauth-login-btn" to "login-btn"  
3. Fixed username extraction from JWT payload
4. Modified unified balance system fallback to not reset login status on API errors
5. Updated data API backend to use JWT validation instead of OAuth

### Chat System Enhancements
1. Added "Anzar" system bot for rain announcements
2. Changed rain contribution limits to 20 per hour (instead of per day)
3. Deployed via systemd for reliable process management

## Testing Status

### What's Working
- ✅ Login flow (redirects to auth, returns with token)
- ✅ JWT token storage in localStorage
- ✅ Username display in UI
- ✅ Chat system functionality
- ✅ Guest mode balance system

## What's Broken
- ❌ Member mode balance display (stuck on guest currency)
- ❌ Balance API authentication (401 errors)
- ❌ Faucet timer for logged-in users
- ❌ Persistent login state across page refreshes

## ⚠️ RECURRING ISSUE: "Username shows as undefined, claims don't work"

### Symptoms:
- User can create account and login in another browser
- Shows "0 Coins" (not "Tokens") indicating system recognizes member status
- Login button shows "👤 undefined" instead of actual username
- Faucet claims don't get credited to balance
- API calls return 401 errors despite having valid JWT token

### Root Causes (in order of likelihood):
1. **JWT Token Missing Username Field**: 
   - Auth server not including `username` field in JWT payload
   - Only includes `sub` (user ID) but frontend expects `username`
   - Profile API fallback failing with 401 errors

2. **Backend JWT Validation Failing**:
   - Data server not properly validating JWT tokens
   - Wrong secret key or validation logic
   - Recent changes to `/var/www/html/config.php` on data.directsponsor.org

3. **Token Format/Timing Issues**:
   - Expired tokens
   - Malformed JWT structure
   - Clock sync issues between servers

### Quick Diagnostic Steps:
1. Check JWT token in browser console: `localStorage.getItem('jwt_token')`
2. Decode JWT payload: `JSON.parse(atob(localStorage.getItem('jwt_token').split('.')[1]))`
3. Test API directly: `fetch('https://data.directsponsor.org/api/dashboard?site_id=roflfaucet', {headers: {'Authorization': 'Bearer ' + localStorage.getItem('jwt_token')}})`

### Common Fixes:
1. **Fix JWT Username Field**: Ensure auth server includes `username` in JWT payload
2. **Fix Backend Validation**: Update `validateToken()` function in data server config.php
3. **Use Fallback Username**: Modify frontend to use `User ${payload.sub}` when username missing
4. **Check Server Clocks**: Ensure auth and data servers have synchronized time

### Files to Check:
- `/var/www/html/config.php` on data.directsponsor.org (validateToken function)
- JWT generation code on auth.directsponsor.org
- `scripts/core/jwt-simple.js` lines 200-225 (username extraction)
- `scripts/core/unified-balance.js` line 37-63 (API calls)

## User's Next Request
User wants to:
1. **Backup** both ROFLFaucet project and auth server to current state
2. **Rollback** both systems to ~2 weeks ago (pre-problem state)
3. **Compare** and test the older working version
4. **Restore** current state after comparison

## Critical Files to Monitor
- `/home/andy/warp/projects/roflfaucet/js/unified-balance.js`
- `/home/andy/warp/projects/roflfaucet/js/jwt-simple.js`
- Data API: `/var/www/html/config.php`
- Chat server: `/home/roflfaucet/chat-server-advanced.js`

## Environment Details
- **Local Dev**: `/home/andy/warp/projects/roflfaucet` (Linux Mint, bash 5.1.16)
- **Production**: `roflfaucet@roflfaucet.com`
- **Auth Server**: `auth.directsponsor.org`
- **Data API**: `data.directsponsor.org`

## Debugging Commands Used
```bash
# Check JWT token in browser console
localStorage.getItem('jwtToken')

# Test unified balance system
unifiedBalance.isLoggedIn
unifiedBalance.refreshLoginStatus()

# Check chat server status
sudo systemctl status chat-server

# Deploy changes
./deploy.sh
```

## Backup and Rollback Safety Analysis

### What's SAFE from git restore (won't be lost):
**Production Server Files (roflfaucet.com):**
- ✅ Chat server: `/home/roflfaucet/chat-server-advanced.js` 
- ✅ Systemd service: `/etc/systemd/system/chat-server.service`
- ✅ Deployed HTML/CSS/JS files in `/var/www/html/`
- ✅ Nginx configuration
- ✅ Any server-side logs or data

**External Servers:**
- ✅ Auth server (auth.directsponsor.org) - completely separate
- ✅ Data API backend fix in `/var/www/html/config.php` on data.directsponsor.org

### What would be LOST with git restore (need backup):
**Local Development Files:**
- ⚠️ All uncommitted changes in `/home/andy/warp/projects/roflfaucet/`
- ⚠️ Recent commits (if rolling back ~2 weeks)
- ⚠️ This documentation file (`PROJECT_STATE_DOCUMENTATION.md`)
- ⚠️ Any local test files or notes

### Recommended Backup Strategy:
```bash
# 1. Create full warp directory backup
cd /home/andy
tar -czf roflfaucet-backup-$(date +%Y%m%d).tar.gz warp/

# 2. Note current git commit for restoration
cd /home/andy/warp/projects/roflfaucet
git log --oneline -5 > current-commit-info.txt

# 3. The chat server and production files will remain untouched
# 4. Backend API fix on data.directsponsor.org is separate from git
```

### What Happens During Rollback:
- ✅ Chat system continues working (server-side files untouched)
- ✅ Production site remains live (deployed files independent of local git)
- ✅ Backend API fix remains active (separate server)
- ⚠️ Local development reverts to older state
- ⚠️ You'll need to redeploy if you want production to match the older code

## Notes for Future Context
- The authentication system worked properly ~2 weeks ago
- Issues began after recent changes to both frontend and backend
- Backend JWT validation fix is unverified in practice
- Frontend may need `refreshLoginStatus()` timing or detection fixes
- User prefers clean rollback/restore approach over incremental debugging
