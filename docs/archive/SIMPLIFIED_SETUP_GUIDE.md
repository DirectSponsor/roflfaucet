# ROFLFaucet Simplified Architecture Setup Guide

## Overview

This guide will help you set up the new **simplified centralized database architecture** that replaces complex OAuth API calls with direct database operations. 

**What changed:**
- ❌ Complex OAuth APIs for data operations
- ✅ Simple direct database calls
- ❌ Unreliable external API dependencies  
- ✅ Reliable local database operations
- ❌ HTML-returning broken endpoints
- ✅ Clean JSON responses

## Architecture Summary

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ROFLFaucet    │────│  Database API   │────│     MySQL       │
│   Frontend      │    │   (Port 3001)   │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐               │
         └──────────────│  OAuth Server   │───────────────┘
                        │ (Auth Only)     │
                        └─────────────────┘
```

**OAuth Role:** Authentication and login only
**Database Role:** All user data, balances, activities, leaderboards, stats

## Step-by-Step Setup

### 1. Install Database Dependencies

```bash
cd /home/andy/Documents/websites/Warp/projects/rofl/roflfaucet/database
npm install
```

### 2. Configure Environment Variables

Create/update your `.env` file:

```bash
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=gamification_db
DB_API_PORT=3001

# ROFLFaucet Configuration  
PORT=3000
DB_API_BASE_URL=http://localhost:3001

# Existing OAuth (for authentication only)
SITE_URL=https://roflfaucet.com
HCAPTCHA_SECRET_KEY=your_hcaptcha_key
```

### 3. Setup the Database

```bash
cd /home/andy/Documents/websites/Warp/projects/rofl/roflfaucet/database
node setup.js
```

This will:
- Create the `gamification_db` database
- Set up all required tables
- Insert default achievements and tasks
- Create a test user (username: `testuser`, password: `test123`)

### 4. Start the Database API Server

```bash
cd /home/andy/Documents/websites/Warp/projects/rofl/roflfaucet/database
npm start
```

The database API will be available at `http://localhost:3001`

### 5. Update ROFLFaucet Backend

Replace your current backend with the simplified version:

```bash
cd /home/andy/Documents/websites/Warp/projects/rofl/roflfaucet
cp src/index.js src/index-original.js  # Backup original
cp src/index-simplified.js src/index.js  # Use simplified version
```

### 6. Start ROFLFaucet

```bash
cd /home/andy/Documents/websites/Warp/projects/rofl/roflfaucet
npm start
```

## Testing the New System

### 1. Check Database API Health

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-06-18T14:46:11.000Z",
  "service": "Centralized Database API"
}
```

### 2. Check ROFLFaucet Health

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-06-18T14:46:11.000Z",
  "uptime": 42.5,
  "architecture": "simplified-direct-database"
}
```

### 3. Test Stats Endpoint

```bash
curl http://localhost:3000/api/stats
```

Expected response:
```json
{
  "activeGameUsers": 1,
  "totalClaims": 0,
  "totalTokensDistributed": 0,
  "averageBalance": 0,
  "topUserBalance": 0,
  "lastUpdated": "2025-06-18T14:46:11.000Z",
  "_source": "Centralized Database (direct)"
}
```

### 4. Test User Data

```bash
curl http://localhost:3000/api/user/1
```

Expected response:
```json
{
  "userId": 1,
  "username": "testuser",
  "email": "test@example.com",
  "coinBalance": 0,
  "tokenBalance": 0,
  "totalEarned": 0,
  "lastClaim": null,
  "nextClaimAvailable": null,
  "canClaim": true,
  "_source": "Centralized Database (direct)"
}
```

## Key Database API Endpoints

### User Management
- `GET /api/users/:id` - Get user data
- `POST /api/users` - Create new user
- `POST /api/users/:id/balances` - Update user balances

### Activity Tracking
- `POST /api/activities` - Record an activity (with automatic balance updates)
- `GET /api/users/:id/activities` - Get user's activity history

### Leaderboards & Stats
- `GET /api/leaderboard?site_id=roflfaucet&type=tokens` - Get leaderboard
- `GET /api/stats/:site_id` - Get site statistics

### Session Management
- `POST /api/sessions` - Update user session
- `GET /api/sessions/:user_id/:site_id` - Get session data

## Database Schema Overview

### Core Tables
- **users** - User accounts and profiles
- **balances** - Token and coin balances per user
- **activities** - All user activities across sites
- **sessions** - Session and timing data

### Gamification Tables
- **tasks** - Available tasks/goals
- **user_tasks** - User progress on tasks
- **achievements** - Available achievements
- **user_achievements** - Earned achievements
- **system_stats** - System-wide statistics

## Benefits of This Architecture

### ✅ Reliability
- No more HTML responses from broken APIs
- Direct database access ensures data consistency
- Fallback responses for graceful degradation

### ✅ Performance
- Fast local database queries
- No external API dependencies
- Efficient connection pooling

### ✅ Scalability
- Easy to add new sites to the ecosystem
- Cross-site gamification built-in
- Flexible activity tracking

### ✅ Maintainability
- Simple, clear API structure
- Well-documented database schema
- Easy to debug and monitor

## Migration from Current System

The new system is designed to coexist with your current OAuth setup:

1. **Authentication** remains through OAuth (for SSO)
2. **Data operations** move to direct database
3. **Frontend** gets cleaner, more reliable responses
4. **Gradual migration** possible - test with new endpoints first

## Production Deployment

For production, you'll want to:

1. **Deploy Database API** on your auth server (auth.directsponsor.org)
2. **Update ROFLFaucet** to use the simplified backend
3. **Configure environment variables** for production URLs
4. **Set up database backups** as discussed earlier
5. **Monitor both services** with health checks

## Troubleshooting

### Database Connection Issues
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u root -p
```

### API Server Issues
```bash
# Check if ports are available
netstat -tulpn | grep :3001
netstat -tulpn | grep :3000

# View logs
cd database && npm run dev  # Shows detailed logs
```

### Missing Dependencies
```bash
cd database && npm install
npm install mysql2 bcrypt  # Core dependencies
```

## Next Steps

Once this is working locally:

1. **Deploy to production** (auth server + roflfaucet server)
2. **Add more gamification features** (achievements, tasks, etc.)
3. **Expand to other sites** (ClickForCharity, etc.)
4. **Implement browser plugins** for cross-site activity tracking
5. **Add automated backup strategies**

---

**🎉 You now have a robust, simplified architecture that replaces complex OAuth APIs with reliable direct database operations!**

