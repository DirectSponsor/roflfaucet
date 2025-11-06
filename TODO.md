# ROFLFAUCET - Master TODO List

*Last updated: 2025-10-13*  
*Auto-managed by AI assistant based on notes from: `aa-new-issues-requests`*

## 🎉 MAJOR ACHIEVEMENT: DATA MIGRATION COMPLETE (2025-10-12)

**✅ COMPLETED: Full Data Directory Separation**
- Live data moved to `/var/roflfaucet-data/` (secure, separate from deployments)
- All APIs updated with new data directory paths
- Webhook system fully operational with proper logging
- Payment confirmations working end-to-end
- Deployment script created with backup rotation
- System architecture now production-ready and maintainable

**Current Priority: User Roles System Implementation**

## 🔥 NEW PRIORITY ISSUES

### ISSUE-012: User Roles System Implementation
**Priority: CRITICAL (Prerequisite for Project Creation)**  
**Status: READY TO START**  
**Source: Yesterday's planning discussion**

**Goal:**
Implement comprehensive user role system to enable Recipients to create and manage their own projects.

**Roles Required:**
- **Admin** - Full access, user management, approve projects
- **Moderator** - Chat moderation, limited admin functions  
- **Recipient** - Can create/manage their own projects via forms
- **Member** - Standard user access, can donate/participate
- **Guest** - Limited access (current default)

**Implementation Tasks:**
- [ ] Add role management to user profiles/session data
- [ ] Create role-based authentication checks throughout site
- [ ] Update UI elements to show/hide based on user roles
- [ ] Secure API endpoints with role validation
- [ ] Create project creation forms for Recipients
- [ ] Add admin project approval workflow

### ISSUE-013: Chat System Restoration
**Priority: HIGH (User Experience)**  
**Status: ✅ COMPLETED (2025-10-13)**  
**Source: aa-new-issues-requests (line 26)**

**Problem:**
Chat system had disappeared and stopped working due to hardcoded paths in API after data directory migration.

**Solution Implemented:**
- [✅] **Fixed hardcoded paths** in `simple-chat.php` API
- [✅] **Added data directory constants** pointing to `/var/roflfaucet-data/userdata`
- [✅] **Updated all file references** to use new USERDATA_DIR constant
- [✅] **Deployed fix** and verified chat API returning messages correctly
- [✅] **Confirmed chat functionality restored** - API working, messages loading

### ISSUE-014: IDrive Scheduled Backup Setup
**Priority: MEDIUM (Data Protection)**  
**Status: NEEDS TROUBLESHOOTING**  
**Source: aa-new-issues-requests (lines 20-22)**

**Problem:**
IDrive scheduled backup not retaining settings, manual backup working but automation failing.

**Requirements:**
- Investigate why scheduled backup settings don't persist
- Possibly file permissions issue preventing settings write
- Reference: https://www.idrive.com/help/linux-help/scheduler

**Tasks:**
- [ ] Check IDrive settings file permissions
- [ ] Test scheduled backup configuration persistence
- [ ] Implement reliable automated backup schedule
- [ ] Verify backup is running and storing correctly

### ISSUE-015: Remove Lightning Method Column
**Priority: LOW (UI Cleanup)**  
**Status: ✅ COMPLETED (2025-10-13)**  
**Source: aa-new-issues-requests (line 30)**

**Goal:**
Remove redundant "Method" column from accounts.html and accounts system since Lightning is the only payment method used.

**Solution Implemented:**
- [✅] **Removed Method column** from accounts.html table header
- [✅] **Updated JavaScript** to remove method field from table row generation
- [✅] **Deployed changes** and verified accounts page loads correctly
- [✅] **Confirmed table layout** - clean 7-column layout without redundant method column
- ⚪ **API unchanged** - payment_method still stored in data but not displayed (no impact)

## 🚨 CRITICAL SECURITY ISSUES

### ISSUE-002: Accounts System - Manual Payment Distribution
**Priority: HIGH (End-of-Month Deadline)**  
**Status: ✅ COMPLETED & TESTED**
**Source: aa-new-issues-requests (lines 10-16)**

**Requirement:**
- Monthly fund distribution to recipients (like Evans - Kenya reforestation)
- Manual payments via Coinos wallet (external to site)
- Need confirmation system for recipients
- Screenshot attachment capability for payment proof

**Components Needed:**
1. **Payment Confirmation Form** - for recipients to confirm receipt
2. **Admin Payment Entry** - for you to record manual payments
3. **Screenshot Upload** - attach payment proof
4. **Recipient Verification** - simple confirmation workflow

**Completed Tasks:**
- [✅] Design payment confirmation form UI
- [✅] Create admin payment entry interface (`site/admin-payment-entry.html`)
- [✅] Implement screenshot upload functionality
- [✅] Set up recipient confirmation workflow (`site/confirm-payment.html`)
- [✅] Complete PHP backend APIs (`site/api/`)
- [✅] Integrate with transparency page
- [✅] Organize all files in `site/` directory

**Ready for Deployment:**
- [ ] Deploy to production using `./deploy-simple.sh`
- [ ] Test admin payment entry
- [ ] Test Evans confirmation workflow

---

## 🚨 CRITICAL SECURITY ISSUES

### ISSUE-001: Slots Game Balance Exploit
**Priority: CRITICAL**  
**Status: ✅ COMPLETED 2025-10-05**  
**Source: aa-new-issues-requests (lines 1-11)**

**Problem Identified:**
- Users could play slots with 0 balance due to race condition during page load
- Spin button was enabled before balance finished loading asynchronously
- Game initialized with `this.credits = 0`, then loaded real balance after delay
- Users could click spin during this window before balance validation had correct data

**Root Cause:**
- HTML had spin button enabled by default: `<button onclick="spinReels()">SPIN</button>`
- JavaScript loaded balance asynchronously: `this.credits = await getBalance()`
- No synchronization between balance loading and button enablement

**Solution Implemented:**
- [✅] **Fixed race condition** - Spin button now disabled by default in HTML
- [✅] **Added balance loading sync** - Button only enables after `loadGameState()` completes
- [✅] **Enhanced button control** - Bet buttons also disabled until balance loads
- [✅] **Deployed fix to production** - Both `slots.html` and `slots-simplified.js` updated
- [✅] **Verified fix works** - Users now get "insufficient balance" popup correctly

**Technical Details:**
- Modified `slots.html` line 203: Added `disabled` attribute to spin button
- Added `enableSpinButton()` function to enable controls after balance loads
- Called `enableSpinButton()` in `loadGameState()` after balance is retrieved
- Fixed both front and back side spin buttons for consistency

**Security Impact:**
- Eliminated gambling exploit that allowed free play with 0 balance
- Ensures balance validation always has correct data before game actions
- Maintains game integrity and fairness for all users

---

## 🎨 ENHANCEMENT PROJECTS

### ISSUE-003: Comprehensive Revenue Reporting System
**Priority: HIGH (Business Intelligence)**  
**Status: PLANNED**  
**Source: aa-new-issues-requests (lines 52-58)**

**Goal:**
Expand beyond donation transparency to full revenue reporting covering all income sources with spreadsheet-like presentation.

**Requirements:**
- **Full-width reporting page** with spreadsheet layout
- **Multiple income categories**: Donations, Ad Revenue (own ads + ad networks), Other sources
- **Category linking**: Each row links to detailed category page
- **Manual entry system**: All income manually added to maintain Lightning wallet balance sync
- **Invoice-based system**: Use same donation invoice system but with different labels
- **Flat-file backend**: Use existing text file system, no database needed

**Implementation Tasks:**
- [ ] Design full-width spreadsheet layout
- [ ] Create income category system (donations, ads, other)
- [ ] Extend donation invoice system for all income types
- [ ] Build category detail pages
- [ ] Integrate with existing financial reporting API
- [ ] Add manual income entry interface

### ISSUE-004: Game Statistics & Balance System
**Priority: MEDIUM (Game Optimization)**  
**Status: NEEDS DEFINITION**  
**Source: aa-new-issues-requests (line 61)**

**Goal:**
Track and optimize game payout rates to make games interesting but sustainable.

**Requirements:**
- **Payout tracking**: Monitor payouts per 100/1000 plays for each game
- **Game balancing**: Adjust games to be engaging without excessive payouts
- **Performance analytics**: Track which games are too generous or too stingy
- **Admin interface**: Easy game parameter adjustment based on statistics

**Implementation Tasks:**
- [ ] Design game statistics tracking system
- [ ] Implement payout rate monitoring
- [ ] Create game balance analytics dashboard
- [ ] Add game parameter adjustment interface
- [ ] Set target payout rates per game

### ISSUE-005: Mobile UX Improvements
**Priority: MEDIUM (User Experience)**  
**Status: NEEDS RESEARCH**  
**Source: aa-new-issues-requests (lines 65-70)**

**Goal:**
Improve mobile experience by showing ads and enabling chat access on mobile devices.

**Requirements:**
- **Mobile ads solution**: Show sidebar content as table below main content instead of hiding
- **Chat tab system**: Implement swipe/tab system for mobile chat access (previously documented)
- **Responsive design**: Maintain functionality across all screen sizes

**Implementation Tasks:**
- [ ] Research mobile sidebar alternatives
- [ ] Locate previous mobile chat tab documentation
- [ ] Design mobile ads display system
- [ ] Implement swipe/tab chat interface
- [ ] Test mobile UX improvements

### User Profile System Enhancement
**Priority: LOW (Future Enhancement)**  
**Status: PLANNED**

**Goal:**
Make user profiles publicly accessible presentation pages that can be linked from transparency tables, donor lists, and other areas for better UX while preserving privacy options.

**Benefits:**
- **Compact Tables**: Show just "Evans" instead of "Evans - Kenya Reforestation Project"
- **Rich Details**: Full project information via clickable profile links
- **Privacy Controls**: Users choose what information to share publicly
- **Better Engagement**: Recipients can showcase projects with photos/progress

**Components Needed:**
1. **Public Profile Pages** - `/profile/{username}` routes
2. **Privacy Controls** - Toggle public visibility settings
3. **Project Showcase** - Rich content for recipients (photos, updates, metrics)
4. **Profile Linking** - Update transparency tables to link names to profiles
5. **Contact Options** - Optional contact methods for direct communication

**Implementation Tasks:**
- [ ] Design public profile page layout
- [ ] Add privacy toggle to profile settings
- [ ] Create profile content management interface
- [ ] Update transparency page to link recipient names
- [ ] Add profile photo/project image upload
- [ ] Implement `/profile/{username}` routing

---

## ✅ COMPLETED CRITICAL DATA RECOVERY

### ISSUE-006: Coins Balance System Data Loss Bug Fixed
**Priority: CRITICAL (Data Loss)**  
**Status: ✅ COMPLETED 2025-10-05**  
**Source: aa-new-issues-requests + investigation**

**Problem Identified:**
- Users andytest1 and andytest2 had coins balances reset to 0 due to dangerous `ensureBalanceFileExists()` functions
- Functions in `session-bridge.php` and `ensure-user-files.php` would "helpfully" create new coins balance files with 0 coins during authentication
- Silent data destruction occurred when files appeared missing (path issues, permissions, etc.)

**Root Cause:**
- Authentication system would call file creation functions during login
- Instead of failing safely, system would overwrite existing coins balance data with fresh 0-balance files
- No warning or error - silent data loss

**Solution Implemented:**
- [✅] **Deployed new `coins-balance.php` API** - Clean, safe coins balance system with "fail fast" philosophy
- [✅] **Updated `unified-balance.js`** - Uses new API with confusion-avoiding naming
- [✅] **Disabled dangerous coins balance creation** - Modified `session-bridge.php` to log warnings instead of creating files
- [✅] **Created production backup** - `userdata-backup-20251005-172414.tar.gz` before deployment
- [✅] **Verified data recovery** - Both users have correct coins balances (andytest1: 200 coins, andytest2: 1000 coins)
- [✅] **Implemented path fixes** - Corrected API directory structure issues

**Prevention Measures:**
- System now fails visibly if coins balance files are missing (except for legitimate new account creation)
- No more silent coins balance resets to 0
- Clear error messages direct users to contact support
- Proper logging of coins balance file issues for investigation

## 🚨 REMAINING URGENT DATA PROTECTION TASKS

### ISSUE-007: Deploy Script Backup Enhancement
**Priority: HIGH (Data Protection)**  
**Status: NEEDS IMPLEMENTATION**  
**Source: aa-new-issues-requests (lines 49-50)**

**Requirements:**
- **Pre-deployment backups**: Create tar archive before each deployment
- **Multiple backup retention**: Keep 3-4 most recent deployment backups
- **Quick recovery**: Enable fast rollback for immediate issues
- **Avoid permissions issues**: Use tar instead of zip

**Implementation Tasks:**
- [ ] Modify deploy script to create tar backups
- [ ] Add timestamp-based backup naming
- [ ] Implement backup rotation (keep latest 4)
- [ ] Test backup and restore process
- [ ] Document backup locations and restore procedures

### ISSUE-008: Manus Bot Session Issue
**Priority: MEDIUM (Bot Maintenance)**  
**Status: NEEDS TROUBLESHOOTING**  
**Source: aa-new-issues-requests (lines 73-86)**

**Problem:**
- Manus.im bot authentication succeeds but session doesn't persist
- Login shows success but roflfaucet site still shows "login" instead of username
- Browser console investigation needed
- Issue specific to automated browser, not manual login

**Troubleshooting Plan:**
- [ ] Get browser console output during login process
- [ ] Check cookie domain and secure flag settings
- [ ] Verify session management for automated browsers
- [ ] Test session persistence across redirects
- [ ] Document findings and implement fix

## 📋 PENDING TASKS

### Documentation Updates
- [ ] Update SECURITY_UPGRADE_TODO.md with exploit details
- [ ] Create incident response documentation
- [ ] Update game validation procedures

### Development Tasks  
- [ ] Fix slots balance validation
- [ ] Implement proper session management
- [ ] Add server-side game state validation
- [ ] Make sidebar reporting widget clickable link to transparency page

### Testing Tasks
- [ ] Create test cases for balance validation
- [ ] Test localStorage clearing solution
- [ ] Verify fix across all games

---

### ISSUE-009: Payment Screenshot Addition to Accounts
**Priority: LOW (Administrative)**  
**Status: NEEDS IMPLEMENTATION**  
**Source: aa-new-issues-requests (lines 10-11)**

**Goal:**
Add missing payment screenshot for September payment in accounts system transparency page.

**Requirements:**
- Image file location: `/home/andy/Desktop/coinos.png`
- Upload to payment record without changing existing system architecture
- Add link to image in transparency.html presentation

**Implementation Tasks:**
- [ ] Copy payment screenshot to appropriate web directory
- [ ] Update payment record to include image reference
- [ ] Add image display link in transparency.html
- [ ] Test image display and linking functionality

### ISSUE-010: Browser Automation Testing Tool Research
**Priority: MEDIUM (Development Tools)**  
**Status: RESEARCH NEEDED**  
**Source: aa-new-issues-requests (lines 14-22)**

**Goal:**
Investigate browser-use/web-ui tool for automated testing and checking of roflfaucet sites.

**Tool Details:**
- **Repository**: https://github.com/browser-use/web-ui
- **Features**: Gradio-based WebUI, expanded LLM support (Google, OpenAI, Azure, Anthropic, DeepSeek, Ollama)
- **Benefits**: Custom browser support, persistent sessions, high-definition recording
- **Use Case**: External API-based testing (suitable for low-power local machines)

**Research Tasks:**
- [ ] Install and test browser-use/web-ui locally
- [ ] Evaluate automated testing capabilities for roflfaucet
- [ ] Test integration with various LLM APIs
- [ ] Assess suitability for continuous site monitoring
- [ ] Document findings and implementation recommendations

### ISSUE-011: LightningLova Funding System with User Roles
**Priority: HIGH (Community Support)**  
**Status: NEEDS USER ROLE SYSTEM FIRST**  
**Source: aa-new-issues-requests (lines 26-27)**

**Goal:**
Create funding request system for LightningLova member to request modem funding and monthly package payments for Bitcoin$Ghana project.

**Requirements:**
- **User roles system**: Implement before funding pages (prerequisite)
- **Modem funding page**: One-time request for modem to enable landline
- **Monthly payment page**: $10/month for basic package
- **Recipient verification**: Ensure only authorized members can request funding

**Implementation Tasks:**
- [ ] Design and implement user roles system
- [ ] Create LightningLova member role
- [ ] Build modem funding request page
- [ ] Build monthly payment request page  
- [ ] Integrate with existing payment/transparency system
- [ ] Add admin approval workflow for funding requests
- [ ] Test complete funding request and approval process

---

## 📝 NOTES PROCESSING STATUS

**Last processed note:** Line 30 (Remove Lightning method column)  
**Next unprocessed:** None (all current notes processed)  
**Processing date:** 2025-10-13

**Recently Added to TODO:**
- ISSUE-012: User Roles System Implementation (CRITICAL)
- ISSUE-013: Chat System Restoration (HIGH)
- ISSUE-014: IDrive Scheduled Backup Setup (MEDIUM)
- ISSUE-015: Remove Lightning Method Column (LOW)

**Major Update:** Data migration completed (2025-10-12) - All systems operational

---

## 🎯 WORKFLOW

1. **Add notes** to `aa-new-issues-requests`
2. **AI processes** notes into structured todos
3. **Documentation updated** automatically
4. **Progress tracked** in this file

*This file is automatically maintained. Manual edits may be overwritten.*