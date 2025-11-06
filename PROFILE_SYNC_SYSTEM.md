# 🔄 Profile & Role Sync System

**Status**: Phase 1 (Local Roles) - In Development  
**Last Updated**: 2025-11-06

## Overview

A multi-site profile synchronization system that allows selective sharing of user data (roles, profiles, stats) across the DirectSponsor ecosystem while maintaining site autonomy and performance.

## Architecture: Hub-and-Spoke Model

```
┌─────────────────────────────────────────┐
│   auth.directsponsor.org (Hub)          │
│   - Canonical user profiles             │
│   - Merge conflict resolution           │
│   - Profile distribution                │
└────────────┬────────────────────────────┘
             │
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
┌────────┐ ┌────────┐ ┌────────┐
│ ROFL   │ │  CFC   │ │  WRC   │
│ Faucet │ │  .net  │ │  .org  │
└────────┘ └────────┘ └────────┘
  Local      Local      Local
  Cache      Cache      Cache
```

### Benefits:
- **Centralized**: One source of truth (auth server)
- **Efficient**: n sites = n connections (not n²)
- **Fast**: Local reads, async sync
- **Resilient**: Sites work offline if hub is down

---

## Profile Data Structure

### Universal Profile Format
```json
{
  "user_id": "123-username",
  "username": "username",
  "email": "user@example.com",
  
  "global_roles": ["admin", "verified"],
  
  "site_roles": {
    "roflfaucet": ["recipient"],
    "clickforcharity": ["sponsor"],
    "wrc": ["moderator"]
  },
  
  "profile": {
    "display_name": "User Name",
    "avatar": "👤",
    "bio": "",
    "location": "",
    "website": "",
    "joined_date": 1699334400
  },
  
  "site_data": {
    "roflfaucet": {
      "level": 5,
      "stats": {
        "total_claims": 45,
        "total_games_played": 128
      }
    },
    "clickforcharity": {
      "tasks_completed": 42,
      "ads_viewed": 156
    }
  },
  
  "last_profile_update": 1699334500,
  "last_sync": 1699334510
}
```

### Field Categories

| Category | Fields | Synced? | Description |
|----------|--------|---------|-------------|
| **Identity** | `user_id`, `username`, `email` | ✅ Always | Core user identity |
| **Global Roles** | `global_roles` | ✅ Always | Admin, verified, etc. |
| **Site Roles** | `site_roles.{site}` | ✅ Selective | Site-specific permissions |
| **Profile** | `profile.*` | ⚙️ Optional | Display name, avatar, bio |
| **Site Data** | `site_data.{site}.*` | ❌ Never | Level, stats, local-only |
| **Balance** | Not in profile | ❌ Never | Handled by balance API |

---

## Implementation Phases

### ✅ Phase 1: Local Roles (Current)
**Goal**: Get role system working on ROFLFaucet without sync

**Tasks**:
- [x] Database/file structure for roles (simple-profile.php)
- [ ] Add role scripts site-wide (user-roles.js, user-roles.css)
- [ ] Create admin interface for role assignment
- [ ] Enable recipient project creation workflow
- [ ] Test role permissions and UI elements

**Files**:
- `site/scripts/user-roles.js` - Role management class
- `site/css/user-roles.css` - Role badge styling
- `site/api/simple-profile.php` - Profile & role API
- `/var/roflfaucet-data/userdata/profiles/{user_id}.txt` - Profile storage

---

### 🔄 Phase 2: Hub Setup (Next)
**Goal**: Create profile sync infrastructure on auth server

**Tasks**:
- [ ] Create profile sync API on auth.directsponsor.org
- [ ] Store canonical profiles: `/var/directsponsor-data/profiles/{user_id}.json`
- [ ] Implement merge logic for conflicting updates
- [ ] Create sync endpoint: `GET/POST /api/profile-sync.php`
- [ ] Document sync protocol and API

**API Endpoints**:
```php
// Hub endpoints (auth.directsponsor.org)
GET  /api/profile-sync.php?action=get&user_id={id}
POST /api/profile-sync.php?action=push&user_id={id}
POST /api/profile-sync.php?action=merge&user_id={id}
GET  /api/profile-sync.php?action=timestamp&user_id={id}
```

---

### 🔗 Phase 3: Bidirectional Sync (Future)
**Goal**: Enable automatic profile sync between sites and hub

**Tasks**:
- [ ] Create `sync-profile.php` for each site
- [ ] Implement sync-on-login (fetch from hub)
- [ ] Implement sync-on-role-change (push to hub)
- [ ] Implement periodic sync (every 5 min or on profile update)
- [ ] Handle sync conflicts intelligently
- [ ] Add sync status indicators to UI

**Sync Triggers**:
1. **On Login**: Always fetch fresh roles from hub
2. **On Role Change**: Immediate push to hub
3. **On Profile Edit**: Async sync (debounced 30s)
4. **Periodic**: Every 5 minutes if profile changed
5. **On Demand**: Manual "Refresh Profile" button

---

### 🧪 Phase 4: Multi-Site Testing (Future)
**Goal**: Test profile sync between ROFLFaucet and ClickForCharity

**Tasks**:
- [ ] Deploy sync system to clickforcharity.net
- [ ] Test global role propagation
- [ ] Test site-specific role isolation
- [ ] Verify profile updates sync correctly
- [ ] Test conflict resolution (simultaneous edits)
- [ ] Measure sync performance and bandwidth

**Test Scenarios**:
1. Assign `admin` on hub → verify appears on both sites
2. Assign `recipient` on ROFL → verify isolated to ROFL
3. Edit profile on CFC → verify syncs to ROFL
4. Edit profile on both simultaneously → verify merge works
5. Hub offline → verify sites continue working

---

## Sync Strategy Details

### Sync Configuration (Per Site)
```php
// In each site's sync-config.php
$SYNC_CONFIG = [
    'site_id' => 'roflfaucet',  // or 'clickforcharity', 'wrc', etc.
    'hub_url' => 'https://auth.directsponsor.org/api/profile-sync.php',
    
    // What to pull from hub
    'sync_from_hub' => [
        'global_roles',
        'site_roles.roflfaucet',  // Only our site's roles
        'username',
        'email',
        'profile.avatar',
        'profile.display_name'
    ],
    
    // What to push to hub
    'sync_to_hub' => [
        'site_roles.roflfaucet',  // Our site's role changes
        'profile.avatar',          // If user updates
        'profile.display_name',
        'profile.bio'
    ],
    
    // Never sync (local-only)
    'local_only' => [
        'site_data.roflfaucet.*',  // All site-specific data
        'stats.*',
        'balance',
        'level'
    ],
    
    // Sync frequency
    'sync_on_login' => true,
    'sync_on_role_change' => true,
    'periodic_sync_interval' => 300,  // 5 minutes
];
```

### Timestamp-Based Sync (Bandwidth Efficient)

Similar to the balance sync system, we use lightweight timestamp checks:

```javascript
// Before syncing full profile, check if server has newer data
async checkIfSyncNeeded() {
    const response = await fetch(`/api/profile-sync.php?action=timestamp&user_id=${userId}`);
    const data = await response.json();
    
    // Only fetch full profile if server timestamp is newer
    if (data.last_profile_update > this.lastLocalUpdate) {
        await this.syncProfile();  // Full sync
    }
}
```

**Benefits**:
- Minimal bandwidth (< 500 bytes for timestamp check)
- Fast operation (no full profile transfer if unchanged)
- Perfect for slow connections

---

## Role Types

### Global Roles (Synced Everywhere)
- `admin` - Site administration access
- `verified` - Verified user (email confirmed, trusted)
- `beta_tester` - Access to beta features
- `supporter` - Financial supporter

### Site-Specific Roles (Isolated)

**ROFLFaucet**:
- `recipient` - Can create fundraising projects
- `moderator` - Content moderation

**ClickForCharity**:
- `sponsor` - Can create ad campaigns
- `volunteer` - Completes tasks

**WRC** (Future):
- `moderator` - Community moderation
- `contributor` - Content creator

---

## Security Considerations

### Role Assignment (Admin Only)
```php
// Only admins can assign roles
if (!in_array('admin', $adminProfile['roles'] ?? [])) {
    http_response_code(403);
    echo json_encode(['error' => 'Admin access required']);
    exit;
}
```

### Profile Update (Self or Admin)
```php
// Users can update their own profile, admins can update anyone's
if ($userId !== $targetUserId && !isAdmin($userId)) {
    http_response_code(403);
    echo json_encode(['error' => 'Permission denied']);
    exit;
}
```

### Sync Authentication
```php
// Hub requires valid JWT from originating site
$jwt = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$siteId = validateSiteJWT($jwt);  // Returns site ID if valid
```

---

## API Reference

### simple-profile.php (Local - Each Site)

```php
// Get user profile
GET /api/simple-profile.php?action=profile&user_id={id}

// Update profile (self only)
POST /api/simple-profile.php?action=update_profile
Body: { "user_id": "...", "display_name": "...", "bio": "..." }

// Manage roles (admin only)
POST /api/simple-profile.php?action=manage_roles
Body: { "user_id": "...", "target_user_id": "...", "operation": "add|remove", "role": "recipient" }

// Check roles
GET /api/simple-profile.php?action=check_roles&user_id={id}&roles=admin,recipient
```

### profile-sync.php (Hub - Auth Server)

```php
// Get canonical profile from hub
GET /api/profile-sync.php?action=get&user_id={id}

// Push local changes to hub
POST /api/profile-sync.php?action=push
Body: { "user_id": "...", "site_id": "roflfaucet", "changes": {...} }

// Check if sync needed (timestamp only)
GET /api/profile-sync.php?action=timestamp&user_id={id}

// Merge conflict resolution
POST /api/profile-sync.php?action=merge
Body: { "user_id": "...", "local": {...}, "remote": {...} }
```

---

## File Structure

### ROFLFaucet
```
/var/roflfaucet-data/
├── userdata/
│   └── profiles/
│       └── {user_id}.txt          # Local profile cache
```

### Auth Server (Hub)
```
/var/directsponsor-data/
├── profiles/
│   └── {user_id}.json             # Canonical profiles
├── sync-log/
│   └── {user_id}-sync.log         # Sync history
```

### ClickForCharity
```
/var/clickforcharity-data/
├── userdata/
│   └── profiles/
│       └── {user_id}.txt          # Local profile cache
```

---

## Testing & Monitoring

### Sync Status Indicators (UI)
```javascript
// Show user their sync status
<div class="sync-status">
  <span class="sync-indicator">🔄</span>
  Last synced: 2 minutes ago
  <button onclick="forceSyncNow()">Sync Now</button>
</div>
```

### Logging
```php
// Log all sync operations
error_log("[PROFILE_SYNC] User {$userId}: Synced {$changedFields} from {$siteId}");
```

### Monitoring Dashboard (Future)
- Sync success rate per site
- Average sync latency
- Conflict resolution frequency
- Bandwidth usage per sync operation

---

## Migration Path

### From Old System to New
1. ✅ No breaking changes - roles system is new
2. ✅ Existing profile API already supports roles
3. ⚙️ Add sync layer on top of existing system
4. ⚙️ Gradual rollout: ROFL → CFC → WRC

### Backward Compatibility
- Sites without sync continue working independently
- Sync is opt-in via config flag
- No sync = no dependency on auth server

---

## Open Questions / Decisions Needed

1. **Admin Role**: Should `admin` be global or site-specific?
   - Recommendation: Global, but sites can check `global_roles` + `site_roles.{site}`

2. **Conflict Resolution**: How to handle simultaneous edits on different sites?
   - Recommendation: Last-write-wins with timestamp, user can force-overwrite

3. **Sync Frequency**: Balance between real-time and bandwidth
   - Recommendation: On-login (immediate) + 5-min periodic (async)

4. **Hub Fallback**: What if auth server is down?
   - Recommendation: Sites continue with cached data, queue sync for later

---

## Next Steps

**Immediate (Phase 1)**:
1. Add user-roles.js and CSS site-wide on ROFLFaucet
2. Create admin role management interface
3. Enable recipient project creation workflow
4. Test local role system thoroughly

**After Phase 1 Complete**:
5. Design hub API specification
6. Deploy profile-sync.php to auth server
7. Test sync between ROFL and CFC
8. Document findings and iterate

---

## Related Documentation
- `CURRENT_SYSTEM_STATE.md` - Overall project state
- `TODO.md` - Task tracking (ISSUE-012: User Roles System)
- `site/scripts/user-roles.js` - Role management implementation
- `site/api/simple-profile.php` - Profile API code

---

**Note**: This is a living document. Update as implementation progresses and architecture evolves.
