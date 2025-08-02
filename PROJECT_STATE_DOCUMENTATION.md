# ROFLFaucet Project State Documentation
*Last Updated: 2025-08-02T19:17:45Z*

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

## Current Issues (As of August 2, 2025)

### Primary Authentication Problem
**Status**: CRITICAL - Login appears successful but balance/currency system remains in guest mode

**Symptoms**:
1. Login button works, redirects to auth server, returns with JWT token
2. UI shows logged-in username correctly  
3. Currency display remains "Pointless Tokens" (guest) instead of "Useless Coins" (member)
4. Faucet timer shows "ready" but claims revert to zero after refresh
5. Balance API calls return 401 Unauthorized errors

**Root Cause Analysis**:
- Auth server issues valid JWT tokens
- Data API was using legacy OAuth validation instead of JWT validation
- Recently attempted to fix data API's `validateToken()` function to use JWT validation
- Frontend unified balance system may not be properly detecting JWT or refreshing login status

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

### What's Broken
- ❌ Member mode balance display (stuck on guest currency)
- ❌ Balance API authentication (401 errors)
- ❌ Faucet timer for logged-in users
- ❌ Persistent login state across page refreshes

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
