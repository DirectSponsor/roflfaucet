# ROFLFAUCET - Master TODO List

*Last updated: 2025-11-09*  
*Auto-managed by AI assistant based on notes from: `aa-new-issues-requests`*

## 🎉 RECENT COMPLETION: Project Image System Migration (2025-11-09)

**✅ COMPLETED: Protected Image Storage with Apache Alias**
- Project images moved to `/var/roflfaucet-data/projects/{username}/images/` (protected from deployments)
- Avatar directory created at `/var/roflfaucet-data/avatars/` (protected from deployments)
- Apache Alias configured to serve protected images via public URLs
- Image upload API updated to save to user-specific directories
- Project API updated to search user directories and return correct Apache Alias paths
- Fundraiser page image display fixed with responsive sizing (max-height: 500px)
- PHP 8.1 configuration fixed in Apache (was still referencing dead PHP 7.4)
- Apache config management improved (proper symlinks from sites-enabled to sites-available)
- All project creation, editing, and public viewing working correctly

**Architecture:**
- **Protected data**: `/var/roflfaucet-data/` - never touched by deployments
- **Apache Aliases**: 
  - `/project-images/` → `/var/roflfaucet-data/projects/`
  - `/images/avatars/` → `/var/roflfaucet-data/avatars/`
- **User directories**: Projects organized by username in `projects/{username}/active/` and `completed/`

---

## 🔥 NEW PRIORITY ISSUES

### ISSUE-020: Syncthing Conflict Files Investigation & Sync Cleanup
**Priority: CRITICAL (System Architecture)**  
**Status: DOCUMENTED - MIGRATION PLAN CREATED**  
**Updated: 2025-12-07**

**✅ INVESTIGATION COMPLETE - CURRENT STATE DOCUMENTED**

**ACTUAL WORKING SYNC ARCHITECTURE (2025-12-07):**

**Method: Syncthing file-based sync (flat files, no database, no constant API auth) ✅**

**ROFLFaucet (89.116.44.206):**
- ✅ **ACTIVE SYNC**: Manual syncthing process (www-data user, started via nohup)
  - Process: `/usr/bin/syncthing serve --no-browser --no-restart --logflags=0 --home=/var/roflfaucet-data/.config/syncthing`
  - Port 22000: Connected to hub (86.38.200.119:22000)
- ❌ REDUNDANT: `roflfaucet-sync.service` (inotify + API daemon) - RUNNING but FAILING
- ❌ DEAD: `syncthing-roflfaucet.service`, `syncthing@root.service` (masked), `syncthing@www-data.service` (failed)

**Hub - es3-auth (86.38.200.119):**
- ✅ **ACTIVE SYNC**: Manual syncthing process (apache user, started via sudo nohup)
  - Process: `sudo -u apache nohup syncthing serve --no-browser --home=/var/directsponsor-data/.config/syncthing`
  - Port 22000: Connected to both ROFLFaucet and ClickForCharity
- ❌ DEAD: `syncthing-hub.service` (failed - port conflict), `syncthing@root.service` (stopped)

**ClickForCharity (89.116.173.103):**
- ✅ **ACTIVE SYNC**: Manual syncthing process (www-data user, started via sudo nohup)
  - Process: `sudo -u www-data nohup syncthing serve --no-browser --home=/var/clickforcharity-data/.config/syncthing`
  - Port 22000: Connected to hub (86.38.200.119:22000)
- ❌ DEAD: `syncthing-clickforcharity.service` (stopped), `syncthing@root.service` (stopped)

**Conflict Files:**
- 40 legacy conflict files on each server from Nov 16 transition (syncthing shutdown/restart)
- Additional conflicts on Nov 25 at 02:00:01 (likely cron job during sync)
- No new conflicts since migration to manual processes

**MIGRATION PLAN - Consolidate to Single Sync Method:**

**Goal: One syncthing systemd service per server, remove all redundant processes**

**Phase 1: Prepare systemd services**
- [ ] Create/verify proper systemd service files on all 3 servers
- [ ] Ensure services use same config paths as manual processes:
  - ROFLFaucet: `/var/roflfaucet-data/.config/syncthing` (www-data user)
  - Hub: `/var/directsponsor-data/.config/syncthing` (apache user)
  - ClickForCharity: `/var/clickforcharity-data/.config/syncthing` (www-data user)
- [ ] Configure services to auto-restart and enable on boot

**Phase 2: Stop manual processes**
- [ ] Find PIDs of manual syncthing processes on all servers
- [ ] Stop manual syncthing processes gracefully (let sync complete first)
- [ ] Verify no nohup processes remain

**Phase 3: Start systemd services**
- [ ] Start systemd syncthing services on all 3 servers
- [ ] Verify connectivity (all 3 should connect via port 22000)
- [ ] Test sync by making changes on each site
- [ ] Monitor for 24 hours to ensure stability

**Phase 4: Remove redundant services**
- [ ] Stop and disable `roflfaucet-sync.service` (API daemon)
- [ ] Remove `/root/sync-daemon.sh` on ROFLFaucet
- [ ] Unmask and permanently disable old `syncthing@root` services
- [ ] Remove failed systemd service configs for old services

**Phase 5: Clean up conflict files**
- [ ] Archive conflict files to backup location (zip with timestamp)
- [ ] Delete conflict files from all 3 servers (40 files each)
- [ ] Verify original files are intact and current

**Phase 6: Documentation**
- [ ] Document final syncthing configuration
- [ ] Create systemd service restart/troubleshooting guide
- [ ] Update deployment scripts to be aware of systemd services

### ISSUE-021: Admin Panel on Profile Page
**Priority: HIGH (Admin Feature)**  
**Status: NEW**  
**Updated: 2025-12-07**

**Problem:**
Profile page has an admin panel section with non-functional links. This was likely planned for future implementation.

**Requirements:**
- Make admin panel links functional
- Move user roles management link from user menu (admin) into this panel
- Consolidate admin functions in one location

**Action items:**
- [ ] Review profile page admin panel section
- [ ] Identify all intended admin panel links
- [ ] Implement missing functionality for each link
- [ ] Move user roles management from user menu to admin panel
- [ ] Test admin panel access and permissions
- [ ] Update navigation structure

### ✅ ISSUE-018: Balance Manipulation Detection System
**Priority: MEDIUM (Fraud Detection)**  
**Status: PHASE 1 COMPLETED - SIMPLE ANALYTICS IMPLEMENTED**  
**Updated: 2025-11-27**

**✅ Phase 1 Complete: Simple Analytics-Based Detection**
- **Simplified approach**: Focus on low-level users with rapid balance growth
- **Detection triggers**:
  - Level 1-3 users earning >200 coins/hour
  - Level 1-3 users exceeding daily earning limits (500/800/1200 coins)
  - Balance mismatches >50 coins (lower priority)
- **Implementation**: Integrated with existing analytics system
- **Dashboard**: Real-time admin interface at `/manipulation-dashboard.html`
- **Game integration**: Simple `checkManipulation(gameCost)` function for games

### ISSUE-016: Time-on-Site Leaderboard System
**Priority: MEDIUM (Engagement Feature)**  
**Status: PLANNING**  
**Source: aa-new-issues-requests (lines 10-16)**

**Goal:**
Implement time-on-site tracking with monthly leaderboards to increase engagement and provide SEO/advertiser value.

**Requirements:**
- **Time tracking**: Points per second spent on site (like jigsaw.build)
- **Monthly reset**: Leaderboards start fresh each month so new users can compete
- **Unobtrusive UI**: Small counter in user menu with link to leaderboard page
- **Rewards system**: Badges, coins, or bonus % multipliers for activities
- **Point sources**: Could aggregate from multiple activities (coins earned, games played, sites visited)

**Technical Considerations:**
- **Guest tracking**: Use localStorage for visitors
- **Member tracking**: Need efficient server-side updates without constant polling
  - Option 1: Update on page unload/tab close events
  - Option 2: Use existing page stats that track time-per-page
  - Option 3: 10-second polling interval (evaluate performance impact)
- **Data efficiency**: Leverage existing analytics rather than new constant connections

**Related Features:**
- Existing leaderboard documentation (needs to be located)
- Real-time update system for leaderboards (previously documented)
- Multi-site point aggregation (ClickForCharity, WRC, ROFLFaucet)
- Point breakdown by source (which game, which site, etc.)

**Implementation Tasks:**
- [ ] Research existing leaderboard documentation
- [ ] Design point calculation system (time + activity aggregation)
- [ ] Choose efficient server update mechanism (evaluate polling vs. event-based)
- [ ] Create monthly leaderboard with auto-reset
- [ ] Add unobtrusive counter to user menu
- [ ] Implement reward system (badges/coins/multipliers)
- [ ] Build leaderboard display page with real-time updates
- [ ] Test performance impact of chosen tracking method

### ✅ ISSUE-017: Profile & Sync System Documentation Consolidation
**Priority: MEDIUM (Documentation)**  
**Status: RESOLVED (2025-11-14)**  
**Source: aa-new-issues-requests (lines 19-24)**

**Resolution:**
Sync system implementation is complete and documented in `/home/andy/work/sync-system/`:
- `FILE_SYNC_STRATEGY.md` - Complete technical specification
- `DEPLOYMENT_GUIDE.md` - Step-by-step deployment instructions
- `README_SYNC.md` - Quick reference guide
- Live implementation with `inotify + rsync` daemons
- Active systemd services on all servers

Outdated documentation files removed:
- ❌ `PROFILE_SYNC_SYSTEM.md` (archived, implementation superseded)
- ❌ `SMART_SYNC_README.md` (archived, implementation superseded)
- ❌ `UNIFIED_SYNC_SYSTEM.md` (archived, API design abandoned)

**Source of Truth:** `/home/andy/work/sync-system/` - Hub-and-spoke file sync with inotify + rsync

---

## 🎉 MAJOR ACHIEVEMENT: DATA MIGRATION COMPLETE (2025-10-12)

**✅ COMPLETED: Full Data Directory Separation**
- Live data moved to `/var/roflfaucet-data/` (secure, separate from deployments)
- All APIs updated with new data directory paths
- Webhook system fully operational with proper logging
- Payment confirmations working end-to-end
- Deployment script created with backup rotation
- System architecture now production-ready and maintainable

**Next Steps:** Continue with issue list below

### ISSUE-019: Nostr Bridge for Community Content
**Priority: LOW (Strategic Community Feature)**  
**Status: PLANNING**  
**Source: aa-new-issues-requests (lines 25-27)**

**Goal:**
Leverage Nostr's native social features (replies, likes, zaps/tips) instead of building a custom forum. Nostr user "roflfaucet" posts community memes/GIFs/videos to Nostr, and DirectSponsor.net bridges those posts back to display on the site. This gives us social functionality for free while reaching the broader Nostr audience.

**Why Nostr Bridge (vs custom forum)?**
- **Less code**: Nostr already has replies, likes, zaps (tips) - no custom implementation needed
- **Wider reach**: Posts on Nostr reach crypto community naturally (viral memes)
- **Dual presence**: Content appears on both DirectSponsor.net AND Nostr natively
- **User economy**: Zaps provide direct creator rewards (not limited to coin rewards)
- **Network effect**: All relays carry the content - decentralized discovery
- **SEO/traffic**: Quality UGC spreads organically across Nostr clients

**How It Works:**
1. Users submit meme/GIF/video via DirectSponsor.net interface
2. Content posted to Nostr via "roflfaucet" user account (our node)
3. Bridge displays Nostr posts on DirectSponsor.net gallery
4. Community replies, zaps, and likes happen natively on Nostr
5. Featured/trending posts drive traffic back to site

**Requirements:**
- **Nostr user**: "roflfaucet" account on our node
- **DirectSponsor.net interface**: Simple submit page (image/GIF/video upload)
- **Bridge display**: Show Nostr posts (with replies/zaps/likes) on directsponsor.net
- **Content themes**: Funny, amazing, charity-related "Like Us" (animals doing human things)
- **Incentives**: Optional DirectSponsor coins for community participation, but primary reward is Nostr zaps
- **Moderation**: Filter low-quality content before posting to Nostr

**Strategic Benefits:**
- **Massive reach**: Memes naturally viral on Nostr (organic growth)
- **Zero maintenance**: Nostr handles all social features
- **Revenue friendly**: Zaps flow directly to creators (no coin cost to us)
- **Community building**: Unified identity across DirectSponsor ecosystem + Nostr
- **Brand awareness**: "roflfaucet" memes become recognizable in crypto community
- **Low dev cost**: Bridge is simpler than building forum from scratch

**Implementation Tasks:**
- [ ] Set up "roflfaucet" Nostr user account on our node
- [ ] Create Nostr event publisher (post content to relays)
- [ ] Build content submission interface on DirectSponsor.net
- [ ] Implement content filtering/moderation before Nostr posting
- [ ] Create Nostr event fetcher (retrieve posts, replies, zaps, likes)
- [ ] Design gallery view to display Nostr posts on directsponsor.net
- [ ] Add sorting by engagement (zaps, replies, likes)
- [ ] Implement link to full Nostr post (let users interact on any Nostr client)
- [ ] Optional: Add DirectSponsor coin rewards for featured content
- [ ] Set up moderation tools (block spammers, remove inappropriate content)
- [ ] Test with beta posters
- [ ] Monitor trending content and Nostr reach metrics

**Notes:**
- This is essentially a smart curation + amplification play
- Users can still tip/zap through Nostr (primary reward mechanism)
- DirectSponsor coins are optional bonus, not required
- Potential for viral growth - meme appeal = natural Nostr engagement
- Track Nostr reach as key metric (how many zaps, reposts, etc.)

---

*This file is automatically maintained. Manual edits may be overwritten.*
