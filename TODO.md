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

### ✅ ISSUE-018: Balance Manipulation Detection System
**Priority: MEDIUM (Fraud Detection)**  
**Status: STRATEGY DEFINED - SEE DOCUMENTATION**  
**Updated: 2025-11-24**

**Strategic Decision:**
Rather than "fixing" the balance caching issue, implement manipulation detection to catch dishonest actors.

**Rationale:**
- Low real-world risk (coins, not real money)
- LocalStorage manipulation always possible for technical users
- Better to detect and remove bad actors than prevent all users
- Turn security "bug" into fraud detection feature

**Implementation:**
- Documented in `MANIPULATION_DETECTION_STRATEGY.md`
- Phase 1: Add client-server discrepancy logging
- Phase 2: Build analytics dashboard for pattern detection  
- Phase 3: Automated flagging and tiered response system
- Phase 4: Honeypot strategy to catch manipulators before payout

**Benefits:**
- Catches truly dishonest users rather than inconveniencing everyone
- Builds evidence for decisive action
- Minimal performance impact on honest users
- Strong deterrent when manipulators get caught

**Next Action:** Implement Phase 1 discrepancy logging (low effort, high value)

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
