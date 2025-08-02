# Clean Server Rebuild Plan - August 2, 2025

## Current Situation
- Auth and data servers have accumulated too many changes and are not working correctly
- Users can login (username shows) but unified balance system doesn't recognize login properly
- API calls failing, terminology stuck on "Tokens" instead of "Coins"
- Fresh browsers and cleared data show same issues - indicates server-side problems

## Servers Backed Up
- ✅ Auth server: `/tmp/auth-server-backup-20250802-2139.tar.gz` (11KB)
- ✅ Data server: `/tmp/userdata-server-backup-20250802-2139.tar.gz` (15KB)

---

## Server Infrastructure

### Auth Server: `es3-auth` (auth.directsponsor.org)
**Purpose**: JWT token generation and user authentication
**SSH**: `ssh es3-auth`
**Location**: `/var/www/auth.directsponsor.org/public_html/`

### Data Server: `es3-userdata` (data.directsponsor.org)  
**Purpose**: User data, balances, and API endpoints
**SSH**: `ssh es3-userdata`
**Location**: `/var/www/data.directsponsor.org/public_html/`

---

## Required Functionality

### Auth Server Must Provide:
1. **JWT Login**: `POST /jwt-login.php`
   - Accepts username/password
   - Returns redirect with `?jwt=TOKEN` parameter
   - Token valid for 15-60 minutes

2. **JWT Signup**: `POST /jwt-signup.php`
   - Creates new user accounts
   - Returns redirect with `?jwt=TOKEN` parameter

3. **JWT Refresh**: `POST /jwt-refresh.php`
   - Extends token expiration
   - Accepts Bearer token, returns new token

### Data Server Must Provide:
1. **Dashboard API**: `GET /api/dashboard?site_id=roflfaucet`
   - Returns user balance and claim status
   - Must validate JWT tokens properly
   - Response format:
   ```json
   {
     "success": true,
     "dashboard": {
       "balance": {"useless_coins": 123},
       "claim_statuses": {
         "roflfaucet": {"can_claim": true, "coin_award": 5}
       }
     }
   }
   ```

2. **Profile API**: `GET /api/profile`
   - Returns user profile information
   - Must validate JWT tokens

3. **Transaction API**: `POST /api/user/transaction`
   - Processes balance changes (earn/spend)
   - Must validate JWT tokens
   - Updates user balance in database

---

## JWT Token Specification

### Token Structure:
```json
{
  "iss": "roflfaucet",
  "iat": 1754166XXX,  // Current Unix timestamp
  "exp": 1754170XXX,  // Expiration (iat + 3600 seconds)
  "sub": "1262",      // User ID
  "username": "Anzar" // Username
}
```

### Shared Secret:
- **Value**: `simple_secret_2025`
- **Algorithm**: HS256
- **CRITICAL**: Both servers MUST use identical secret

---

## Database Requirements

### Users Table:
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- password_hash()
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Balances/Transactions:
- User balance tracking
- Transaction history
- Site-specific data (roflfaucet, clickforcharity, etc.)

---

## Frontend Integration Points

### Unified Balance System (`scripts/core/unified-balance.js`):
- Checks `localStorage.getItem('jwt_token')` for login status
- Calls `https://data.directsponsor.org/api/dashboard?site_id=roflfaucet`
- Expects 200 response for logged-in users, 401 for invalid tokens
- Updates terminology: `isLoggedIn ? 'Coins' : 'Tokens'`

### JWT Authentication (`scripts/core/jwt-simple.js`):
- Redirects to `https://auth.directsponsor.org/jwt-login.php?redirect_uri=...`
- Handles callback with JWT token in URL parameter
- Stores token in `localStorage.setItem('jwt_token', token)`

---

## Critical Success Criteria

### Authentication Flow:
1. ✅ Fresh browser → Click login → Redirect to auth server
2. ✅ Enter credentials → Successful login → Redirect back with JWT
3. ✅ JWT stored in localStorage
4. ✅ Username appears in top-right corner

### Balance Integration:
1. ✅ API call to `/api/dashboard` returns 200 (not 401)
2. ✅ Terminology switches from "Tokens" to "Coins"
3. ✅ Balance displays real value from API
4. ✅ Faucet claims update balance via API
5. ✅ Timer/cooldown system works correctly

### Token Validation:
1. ✅ Fresh tokens have current timestamps (August 2025)
2. ✅ Tokens validate successfully on data server
3. ✅ Expired tokens properly rejected with 401
4. ✅ Token refresh works to extend sessions

---

## Deployment Strategy

### Phase 1: Clean Auth Server
1. Reset `/var/www/auth.directsponsor.org/public_html/`
2. Deploy minimal JWT login/signup system
3. Test token generation with current timestamps
4. Verify redirect flow works

### Phase 2: Clean Data Server  
1. Reset `/var/www/data.directsponsor.org/public_html/`
2. Deploy minimal API endpoints
3. Test JWT validation with fresh tokens
4. Verify balance operations work

### Phase 3: Integration Testing
1. End-to-end login flow
2. Balance API calls
3. Faucet claim operations
4. Cross-browser testing

---

## Simplified Server Files Needed

### Auth Server (`auth.directsponsor.org`):
- `jwt-login.php` - Login form and token generation
- `jwt-signup.php` - User registration
- `jwt-refresh.php` - Token refresh
- `config.php` - Database connection and JWT secret
- `.htaccess` - URL routing if needed

### Data Server (`data.directsponsor.org`):
- `api/dashboard.php` - User dashboard data
- `api/profile.php` - User profile
- `api/user/transaction.php` - Balance operations
- `config.php` - Database connection and JWT validation
- `.htaccess` - API routing

---

## Rollback Plan
If clean rebuild fails:
1. Extract backups: `tar -xzf /tmp/*backup*.tar.gz`
2. Restore files to original locations
3. Restart web servers
4. Test basic functionality

---

## Database Connection Details

### Auth Server Database:
- **Host**: localhost (on es3-auth)
- **Database**: `directsponsor_oauth`
- **Username**: `directsponsor_oauth`
- **Password**: `ds9Hj#k2P9*mN`
- **Table**: `users` (id, username, password, email, created_at)

### Data Server Database:
- **Location**: TBD (may need to be created or use existing)
- **Purpose**: User balances, transactions, site data

---

## Current Working Test Token
For testing purposes, this token validates correctly:
```
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJyb2ZsZmF1Y2V0IiwiaWF0IjoxNzU0MTY2NTY4LCJleHAiOjE3NTQxNzAxNjgsInN1YiI6MTI2MiwidXNlcm5hbWUiOiJBbnphciJ9.WX3409HWzWMvJS__xjMr4SCXPTWi0TVP0P3_XLKcEMs
```

---

## Key Commands for Server Access
- **Auth server**: `ssh es3-auth`
- **Data server**: `ssh es3-userdata`
- **Test auth health**: `./test-auth.sh` (in project root)
- **Check server time**: `ssh es3-auth "date"` and `ssh es3-auth "php -r 'echo time();'"`

---

## Frontend Files That Must Work
- `scripts/core/unified-balance.js` - Balance system (checks jwt_token, calls API)
- `scripts/core/jwt-simple.js` - Auth redirects (line 465 has auth URL)
- `index.html` - Main faucet page
- All must show "Coins" not "Tokens" when logged in

---

## Exact API Endpoints Required
1. `https://data.directsponsor.org/api/dashboard?site_id=roflfaucet` (GET)
2. `https://data.directsponsor.org/api/profile` (GET)
3. `https://data.directsponsor.org/api/user/transaction` (POST)
4. `https://auth.directsponsor.org/jwt-login.php?redirect_uri=...` (GET/POST)

---

## Next Steps
1. ✅ Backups completed
2. Deploy clean auth server with minimal functionality
3. Test token generation and login flow
4. Deploy clean data server with minimal API
5. Test end-to-end integration
6. Verify all frontend functionality works

This approach eliminates accumulated cruft and ensures a working foundation.

---

## For New Conversation Context
This document contains everything needed to rebuild the auth/data servers from scratch. The core issue: users can login (username shows) but API calls return 401, causing the unified balance system to stay in guest mode ("Tokens" instead of "Coins"). Fresh browsers have same issue = server problem, not browser cache.
