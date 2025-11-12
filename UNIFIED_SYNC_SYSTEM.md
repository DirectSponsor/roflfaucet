# 🔄 Unified Multi-Site Sync System

**Status**: Design Complete - Ready for Implementation  
**Last Updated**: 2025-11-09  
**Supersedes**: PROFILE_SYNC_SYSTEM.md, SMART_SYNC_README.md

---

## Core Philosophy

**Minimize bandwidth, maximize responsiveness** through intelligent event-driven sync that only fetches data when needed.

### Key Principles:
1. **Push when changed** - Sites update hub immediately when local data changes
2. **Pull when needed** - Sites check hub only when user returns/logs in
3. **Timestamp first** - Lightweight checks before fetching full data
4. **No polling** - Eliminate constant background requests
5. **No file locks** - Brief wait periods prevent conflicts without locking

---

## Architecture: Hub-and-Spoke Model

```
┌──────────────────────────────────────────────┐
│   auth.directsponsor.org (Hub)               │
│   - Canonical user data                      │
│   - Timestamp tracking per user/data type    │
│   - Push notifications (optional future)     │
└────────────┬─────────────────────────────────┘
             │
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ ROFL    │ │  CFC    │ │  WRC    │
│ Faucet  │ │  .net   │ │  .org   │
└─────────┘ └─────────┘ └─────────┘
 Local       Local       Local
 Cache       Cache       Cache
```

**Benefits:**
- **Efficient**: n sites = n connections (not n²)
- **Fast**: Local reads, async writes
- **Resilient**: Sites work offline if hub temporarily down
- **Scalable**: Easy to add new sites

---

## Data Classification

### 🏃 Frequent Data (Fast Changing)
**Examples**: Coins balance, points, game stats  
**Sync Strategy**: Aggressive - check before every operation

| Data Type | Triggers | Method |
|-----------|----------|--------|
| Coins Balance | Before game/task, on tab return, on login | Timestamp → Full fetch if changed |
| Points | Before spending, on tab return | Timestamp → Full fetch if changed |
| Active Session | On page load, tab return | Full fetch (lightweight) |

**Sync Triggers:**
- ✅ Before any balance-changing operation (game, claim, purchase)
- ✅ On tab becomes visible (user returns to tab)
- ✅ On login
- ✅ On page unload (save final state)
- ✅ Inactivity fallback (5-min safety net)

### 🐌 Infrequent Data (Slow Changing)
**Examples**: Profile info, roles, settings  
**Sync Strategy**: Conservative - check only when needed

| Data Type | Triggers | Method |
|-----------|----------|--------|
| Profile | On login, before edit, on tab return | Timestamp → Full fetch if changed |
| Roles | On login, before permission check | Timestamp → Full fetch if changed |
| Settings | On login, before edit | Timestamp → Full fetch if changed |

**Sync Triggers:**
- ✅ On login (always check)
- ✅ On tab becomes visible (timestamp check only)
- ✅ Before opening profile editor (must have latest data)
- ✅ On role change (immediate push to hub)
- ✅ After profile save (immediate push to hub)

---

## Sync Workflow

### Pull: Checking for Updates

```
User Returns to Tab
      ↓
Show brief spinner (0.5s)
      ↓
Check timestamp on hub (< 1KB request)
      ↓
  Changed?
   ↙    ↘
 YES    NO
  ↓      ↓
Fetch   Use cached
full    data
data    ↓
  ↓     ↓
Update local cache
      ↓
Hide spinner, proceed
```

**Example API Call:**
```javascript
// Lightweight timestamp check
const response = await fetch(
  `https://auth.directsponsor.org/api/sync.php?action=timestamp&user_id=${userId}&data_type=profile`
);
const data = await response.json();
// { "last_updated": "2025-11-09T18:45:30Z" }

if (data.last_updated > this.localTimestamp) {
  // Fetch full profile
  await this.fetchFullProfile();
}
```

### Push: Sending Updates

```
User Saves Profile
      ↓
Validate changes
      ↓
Update local cache
      ↓
Push to hub (async, non-blocking)
      ↓
Hub updates timestamp
      ↓
Other sites will see change on next check
```

**Example API Call:**
```javascript
// Push profile changes to hub
await fetch('https://auth.directsponsor.org/api/sync.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'push',
    user_id: userId,
    site_id: 'roflfaucet',
    data_type: 'profile',
    data: {
      display_name: 'New Name',
      bio: 'Updated bio'
    }
  })
});
```

---

## Conflict Prevention (Lock-Free)

### The 0.5-Second Rule

**Problem**: User has multiple tabs open, makes changes in Tab A, switches to Tab B
**Solution**: Brief mandatory wait on tab activation

```javascript
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    // Show spinner
    showSyncIndicator('Checking for updates...');
    
    // Check hub for changes (0.5s typical)
    await this.checkForUpdates();
    
    // Hide spinner, user can proceed
    hideSyncIndicator();
  }
});
```

**Why This Works:**
- 99% of users have only one tab/site open
- Those with multiple tabs experience minor 0.5s delay
- Catches ALL changes from other tabs/sites
- No file locking needed
- No race conditions possible

**Edge Case - Rapid Tab Switching:**
```
Tab A: Save profile → Push to hub
       ↓
Tab B: Becomes visible → 0.5s wait → Checks hub → Gets latest
       ↓
Tab A: Becomes visible → 0.5s wait → Checks hub → Sees own changes
```
Still safe! Each activation checks the hub.

---

## Hub API Specification

### Endpoint: `/api/sync.php`

#### 1. Check Timestamp (Lightweight)
```http
GET /api/sync.php?action=timestamp&user_id=8-evans&data_type=profile

Response:
{
  "success": true,
  "last_updated": "2025-11-09T18:45:30Z",
  "data_type": "profile"
}
```

#### 2. Fetch Full Data
```http
GET /api/sync.php?action=get&user_id=8-evans&data_type=profile

Response:
{
  "success": true,
  "data": {
    "display_name": "Evans",
    "bio": "Kenya reforestation",
    ...
  },
  "last_updated": "2025-11-09T18:45:30Z"
}
```

#### 3. Push Changes
```http
POST /api/sync.php
Body: {
  "action": "push",
  "user_id": "8-evans",
  "site_id": "roflfaucet",
  "data_type": "profile",
  "data": { ... }
}

Response:
{
  "success": true,
  "timestamp": "2025-11-09T18:46:00Z"
}
```

### Data Types Supported:
- `profile` - Display name, bio, avatar, location, website
- `balance` - Coins balance (frequent)
- `points` - Points balance (frequent, future)
- `roles` - Global and site-specific roles
- `settings` - User preferences

---

## Profile Data Structure

### Universal Profile Format
```json
{
  "user_id": "8-evans",
  "username": "evans",
  "email": "user@example.com",
  
  "global_roles": ["verified"],
  
  "site_roles": {
    "roflfaucet": ["recipient"],
    "clickforcharity": [],
    "wrc": []
  },
  
  "profile": {
    "display_name": "Evans",
    "avatar": "👤",
    "bio": "Kenya reforestation project",
    "location": "Kenya",
    "website": ""
  },
  
  "balance": {
    "coins": 199,
    "points": 0
  },
  
  "last_profile_update": "2025-11-09T18:45:30Z",
  "last_balance_update": "2025-11-09T18:50:00Z",
  "last_sync": "2025-11-09T18:50:05Z"
}
```

### What Syncs Where

| Field | Synced Across Sites? | Push Trigger | Pull Trigger |
|-------|---------------------|--------------|--------------|
| `username`, `email` | ✅ Always | Account change | Login |
| `global_roles` | ✅ Always | Admin assigns | Login |
| `site_roles.{site}` | ⚙️ Site-specific only | Role change | Login, tab return |
| `profile.*` | ✅ Always | Profile save | Login, before edit, tab return |
| `balance.coins` | ✅ Always | Every change | Before operation, tab return |
| `balance.points` | ✅ Always (future) | Every change | Before operation, tab return |
| Site-specific data (levels, stats) | ❌ Never | - | - |

---

## Current Implementation Status

### ✅ COMPLETED: Full Multi-Site Sync System (2025-11-09)

**Status**: 🎉 **PRODUCTION READY AND WORKING**

#### Hub (auth.directsponsor.org)
- ✅ Sync API deployed at `/api/sync.php`
- ✅ All 3 endpoints working (timestamp, get, push)
- ✅ Standardized directory structure: `/var/directsponsor-data/userdata/`
- ✅ Balance files migrated from all sites
- ✅ Rate limiting active (100 req/user/min)
- ✅ Logging to `/var/directsponsor-data/sync.log`

#### ROFLFaucet (roflfaucet.com)
- ✅ **File watcher daemon** syncing balance changes in real-time
- ✅ `unified-balance.js` reading from hub
- ✅ Changes detected via inotifywait
- ✅ Automatic push to hub within 1 second
- ✅ Log: `/var/roflfaucet-data/logs/sync-daemon.log`
- ✅ All user balances synced to hub

**How It Works:**
1. User earns/spends coins on ROFLFaucet
2. Local balance file updated
3. File watcher detects change instantly
4. Daemon pushes to hub API
5. Hub updates central balance file
6. Other sites can now see updated balance

---

## Implementation Checklist

### Phase 1: Hub Infrastructure ✅ COMPLETED
**Location**: auth.directsponsor.org  
**Deployed**: 2025-11-09

- [x] ✅ Create `/api/sync.php` on auth.directsponsor.org
- [x] ✅ Implement timestamp endpoint (lightweight)
- [x] ✅ Implement get endpoint (full data fetch)
- [x] ✅ Implement push endpoint (receive updates)
- [x] ✅ Set up data storage: `/var/directsponsor-data/userdata/balances/`
- [x] ✅ Add timestamp tracking per data type (balance, profile, roles)
- [x] ✅ Test API endpoints with curl
- [x] ✅ Add rate limiting (100 requests/user/minute)
- [ ] ⏳ Add authentication (JWT validation from sites) - Future enhancement

### Phase 2: ROFLFaucet Hub Integration ✅ COMPLETED
**Location**: roflfaucet.com  
**Deployed**: 2025-11-09

- [x] ✅ Create sync system infrastructure (`unified-balance.js`)
- [x] ✅ Implement tab visibility detection
- [x] ✅ Add sync spinner
- [x] ✅ Update API endpoint to read from hub
- [x] ✅ Deploy file watcher daemon (`sync-daemon.sh`)
- [x] ✅ Test with hub (balance sync working perfectly)
- [x] ✅ Migrate all user balance data to hub
- [x] ✅ Real-time sync confirmed working
- [ ] ⏳ Add profile sync (balance only for now)
- [ ] ⏳ Add role sync (future)
- [x] ✅ Test multi-tab scenarios with hub

### Phase 3: ClickForCharity Integration (Testing Site)
**Location**: clickforcharity.net  
**Priority**: MEDIUM - Prove multi-site sync works

**Why ClickForCharity First:**
- Simple PTC site (fewer features = easier testing)
- Members already exist (auth.directsponsor.org accounts)
- Perfect sandbox for testing cross-site sync

**Tasks:**
- [ ] Copy `unified-balance.js` from ROFLFaucet to ClickForCharity
- [ ] Update site_id to 'clickforcharity'
- [ ] Ensure login/auth works (already uses auth.directsponsor.org)
- [ ] Test earning coins on CFC, viewing on ROFL
- [ ] Test earning coins on ROFL, viewing on CFC
- [ ] Verify multi-tab safety across both sites
- [ ] Add profile display (currently CFC has no profiles)
- [ ] Monitor sync performance

### Phase 4: Additional Sites (Future)
**Location**: WRC.org and others  
**Priority**: LOW - Expand once proven

- [ ] Deploy sync to WRC.org (when ready)
- [ ] Deploy sync to any new DirectSponsor sites
- [ ] Test cross-site synchronization across all sites
- [ ] Monitor aggregate bandwidth usage
- [ ] Optimize based on real-world usage patterns

### Phase 4: Advanced Features
- [ ] Push notifications from hub (webhook-style)
- [ ] Sync status indicators in UI
- [ ] Manual "Force Sync" button
- [ ] Conflict resolution UI (if last-write-wins fails)
- [ ] Monitoring dashboard

---

## Code Example: SyncManager Class

```javascript
class SyncManager {
  constructor() {
    this.hubUrl = 'https://auth.directsponsor.org/api/sync.php';
    this.userId = localStorage.getItem('user_id');
    this.timestamps = {}; // Cache of known timestamps
    this.syncInProgress = false;
    
    this.setupTabVisibilitySync();
  }
  
  setupTabVisibilitySync() {
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible') {
        await this.syncOnTabReturn();
      }
    });
  }
  
  async syncOnTabReturn() {
    if (!this.userId) return;
    
    // Show spinner
    this.showSyncIndicator('Checking for updates...');
    
    try {
      // Check all data types
      await Promise.all([
        this.checkAndSync('balance'),
        this.checkAndSync('profile'),
        this.checkAndSync('roles')
      ]);
    } finally {
      // Hide spinner
      this.hideSyncIndicator();
    }
  }
  
  async checkAndSync(dataType) {
    // Step 1: Check timestamp (lightweight)
    const response = await fetch(
      `${this.hubUrl}?action=timestamp&user_id=${this.userId}&data_type=${dataType}`
    );
    const data = await response.json();
    
    // Step 2: Compare with local cache
    if (data.last_updated > this.timestamps[dataType]) {
      // Step 3: Fetch full data if changed
      await this.fetchFullData(dataType);
      this.timestamps[dataType] = data.last_updated;
    }
  }
  
  async fetchFullData(dataType) {
    const response = await fetch(
      `${this.hubUrl}?action=get&user_id=${this.userId}&data_type=${dataType}`
    );
    const data = await response.json();
    
    // Update local cache
    this.updateLocalCache(dataType, data.data);
  }
  
  async pushChanges(dataType, changes) {
    // Push to hub asynchronously (non-blocking)
    fetch(this.hubUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'push',
        user_id: this.userId,
        site_id: 'roflfaucet',
        data_type: dataType,
        data: changes
      })
    });
    // Don't wait for response, let it complete in background
  }
  
  showSyncIndicator(message) {
    // Show small spinner with message
    const indicator = document.createElement('div');
    indicator.id = 'sync-indicator';
    indicator.innerHTML = `<span class="spinner">⟳</span> ${message}`;
    indicator.style.cssText = 'position:fixed;top:10px;right:10px;background:#4CAF50;color:white;padding:8px 12px;border-radius:4px;z-index:9999;';
    document.body.appendChild(indicator);
  }
  
  hideSyncIndicator() {
    const indicator = document.getElementById('sync-indicator');
    if (indicator) indicator.remove();
  }
}

// Initialize on all pages
const syncManager = new SyncManager();
```

---

## Performance Characteristics

### Bandwidth Usage

**Old System (10-second polling):**
- 6 requests/minute × 60 minutes = 360 requests/hour
- ~2KB per request = 720KB/hour per user
- Constant background load

**New System (event-driven):**
- Login: 3 requests (timestamp × 3 data types)
- Tab returns: ~3 requests per return
- Operations: ~1 request per balance check
- **Typical usage**: ~20-50 requests/hour (95% reduction!)
- **Heavy multi-tab user**: ~100 requests/hour (still 70% reduction)

### Response Times
- Timestamp check: < 100ms (tiny request)
- Full data fetch: < 300ms (only when needed)
- User-perceived delay: 0.5s spinner on tab return (acceptable)

---

## Security Considerations

### Authentication
- All hub requests require valid JWT from originating site
- Hub validates site identity before accepting pushes
- Users can only sync their own data (enforced by hub)

### Data Validation
- Hub validates all incoming data against schema
- Reject invalid role assignments (e.g., non-admin assigning admin role)
- Sanitize all user-generated content before storage

### Rate Limiting
- Maximum 100 requests per user per minute
- Prevent abuse of sync system
- Graceful degradation if limit exceeded

---

## Monitoring & Debugging

### Logging
```php
// Hub logs all sync operations
error_log("[SYNC] User {$userId}: {$dataType} updated by {$siteId} at {$timestamp}");
```

### Console Debug Mode
```javascript
// Enable verbose sync logging
localStorage.setItem('sync_debug', 'true');

// Console output:
// [SYNC] Tab visible - checking timestamps
// [SYNC] balance: server=18:50:00, local=18:45:30 → FETCH
// [SYNC] profile: server=18:40:00, local=18:40:00 → SKIP
// [SYNC] Sync complete in 0.45s
```

---

## Future Enhancements

### Push Notifications (Optional)
Instead of sites polling hub, hub could push updates:
- Hub maintains WebSocket connections to active sites
- When data changes, hub pushes to all connected sites
- Further reduces latency for multi-tab users
- **Not required for v1** - current design is sufficient

### Delta Updates (Optional - Race Condition Prevention)
Send balance deltas instead of absolute values to eliminate race conditions:
- **Current**: Site sends `{balance: 120}` (absolute value)
- **With deltas**: Site sends `{delta: +10}` (relative change)
- Hub applies math: `new_balance = old_balance + delta`
- **Benefits**:
  - Eliminates multi-tab/multi-site race conditions completely
  - If two operations happen simultaneously, both deltas are applied correctly
  - Example: User on ROFL adds 10, on CFC adds 20 → both succeed, balance increases by 30
- **Tradeoffs**:
  - More complex hub logic (must read current value, apply delta, save)
  - Requires atomic file operations or database
  - Precludes periodic sync optimization (see below) - deltas require immediate sync
- **When to implement**: Only if race conditions become a real problem in practice

### Periodic Sync (Optional - Resource Optimization)
Batch balance updates to reduce server load:
- **Current**: Every balance change syncs immediately to hub
- **With periodic**: Local changes accumulate, sync every 10-20 seconds
- **Benefits**:
  - Drastically reduces server requests during heavy gameplay
  - Example: User plays game 20 times in 60 seconds → 1 sync instead of 20
- **Implementation**:
  - JavaScript debounces sync calls
  - `beforeunload` event ensures final sync before tab closes
  - Prompt user "You have unsaved changes" if they close within sync window
  - Could simplify to "Save" button instead of "OK"/"Cancel" dialog
- **Tradeoffs**:
  - Incompatible with delta updates (requires absolute values at sync time)
  - Slight delay before balance appears on other sites/tabs
  - User must wait 0-20 seconds before switching tabs to see updated balance
- **When to implement**: Only if server load becomes an issue with high traffic
- **Note**: These two optimizations are mutually exclusive - choose based on whether race conditions or server load is the bigger concern

### Smart Caching
- Cache frequently accessed data with TTL
- Reduce hub database load
- Edge caching for global read-only data

---

## Migration Path

### Step 1: Hub Setup ⚠️ CURRENT PRIORITY
**Goal**: Deploy sync API to auth.directsponsor.org  
**Status**: Not started - this is the blocker for multi-site sync

**What to do:**
1. Create `/var/directsponsor-data/users/` directory on auth server
2. Create `/api/sync.php` with timestamp, get, and push endpoints
3. Test with curl to verify endpoints work
4. No site changes needed yet - hub can exist independently

### Step 2: ROFLFaucet Hub Connection
**Goal**: Point existing local sync to hub instead  
**Status**: Local sync working, just needs endpoint change

**What to do:**
1. Modify `unified-balance.js` line ~97:
   ```javascript
   // OLD:
   const response = await fetch(`api/coins-balance.php?action=timestamp&user_id=${combinedUserId}`);
   
   // NEW:
   const response = await fetch(`https://auth.directsponsor.org/api/sync.php?action=timestamp&user_id=${combinedUserId}&data_type=balance&site_id=roflfaucet`);
   ```
2. Update getRealBalance() to use hub's get endpoint
3. Add pushChanges() calls after balance updates
4. Test thoroughly - should work exactly as before but via hub

### Step 3: ClickForCharity Testing
**Goal**: Prove multi-site sync works  
**Status**: Waiting for Steps 1 & 2

**What to do:**
1. Copy `unified-balance.js` to ClickForCharity project
2. Change site_id from 'roflfaucet' to 'clickforcharity'
3. Deploy to clickforcharity.net
4. Test: Earn coins on CFC → See them on ROFL immediately!
5. Test: Earn coins on ROFL → See them on CFC immediately!

### Step 4: Expand to Other Sites
**Goal**: Add WRC and future sites  
**Status**: Future - after proving CFC/ROFL sync works

**What to do:**
- Same process as ClickForCharity
- Copy sync code, update site_id, deploy
- Members are already shared (same auth system)
- Balance/profile automatically syncs across all sites

---

## Quick Start: Deploying Sync to a New Site

**Prerequisites:**
- Hub API is running on auth.directsponsor.org
- Site uses auth.directsponsor.org for authentication
- Site has member accounts

**Steps:**
1. Copy `unified-balance.js` from ROFLFaucet to new site
2. Update `site_id` constant in the file
3. Include script in all pages: `<script src="scripts/unified-balance.js"></script>`
4. Test login → balance should sync from hub
5. Test earning coins → should push to hub and appear on other sites

**That's it!** The sync system handles everything else automatically.

---

## Related Documentation
- `TODO.md` - ISSUE-017: Profile & Sync System Documentation Consolidation
- `PROFILE_SYNC_SYSTEM.md` - Original profile sync design (superseded)
- `SMART_SYNC_README.md` - Original balance sync design (superseded)

---

**This is the canonical sync system documentation. Refer to this document for all implementation decisions.**
