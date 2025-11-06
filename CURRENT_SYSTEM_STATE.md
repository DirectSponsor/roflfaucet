# ROFLFaucet Project Donations - Current System State
**Last Updated**: 2025-11-06 18:58 UTC

## 🎯 ARCHITECTURE OVERVIEW

### Core Principle
**ALL project data lives in the HTML file itself**. No separate databases, no ledger lookups for display data. The HTML file is the single source of truth.

### Directory Structure
```
/var/roflfaucet-data/
├── projects/
│   ├── {username}/                     # User-specific folder (e.g., evans, lightninglova)
│   │   ├── active/
│   │   │   ├── 001.html                # Active project HTML (standalone)
│   │   │   ├── 002.html                # Next active project
│   │   │   └── ...
│   │   ├── completed/
│   │   │   └── 001.html                # Completed projects moved here
│   │   ├── images/
│   │   │   ├── 001.jpg                 # Project images
│   │   │   └── 002.jpg
│   │   ├── 001-config.json             # Minimal config (just API key)
│   │   └── 002-config.json             # Config for each project
│   └── img/                            # Legacy shared images
├── data/
│   ├── project-donations-pending/
│   │   └── pending.json                # Pending invoices awaiting payment
│   └── transaction-ledger.json         # Append-only log (audit trail only)
└── logs/
    ├── project_payments.log
    └── webhook.log
```

## 📄 PROJECT HTML FILE STRUCTURE

Each project HTML contains all its data using comment tags:

```html
<!-- OWNER: username -->
<!-- title -->Project Title<!-- end title -->
<!-- description -->Full description<!-- end description -->
<!-- category -->General<!-- end category -->
<!-- target-amount -->60,000<!-- end target-amount -->
<!-- current-amount -->5,123<!-- end current-amount -->
<!-- recipient-name -->Full Name<!-- end recipient-name -->
<!-- lightning-address -->user@domain.com<!-- end lightning-address -->
<!-- location -->City, Country<!-- end location -->
<!-- website-url -->https://example.com<!-- end website-url -->
<!-- status -->active<!-- end status -->

<!-- recent_donations -->
<li>
    <strong>John</strong> donated <strong>100 sats</strong>
    <span class="donation-time">Oct 21, 2025</span>
</li>
<!-- end recent_donations -->
```

### Critical Tags for Webhook Updates
- `<!-- current-amount -->` - Updated by webhook with each donation
- `<!-- recent_donations -->` - Last 10 donations, updated by webhook

## 🔑 API KEY CONFIGURATION

### Per-Project Config Files
Each project has a minimal config file: `/var/roflfaucet-data/projects/{username}/{project_id}-config.json`

**Example**: `/var/roflfaucet-data/projects/lightninglova/001-config.json`
```json
{
    "project_id": "001",
    "recipient_wallet": {
        "type": "coinos",
        "api_key": "eyJhbGci...actual_key_here",
        "wallet_name": "Bitcoin4Ghana Connectivity"
    }
}
```

### How to Get User's Coinos API Key
**TODO**: Implement automatic API key retrieval from user profile

**Current Manual Process** (temporary):
1. User provides their Coinos read-only API key via profile settings
2. Store in user-specific location: `/var/roflfaucet-data/users/{username}/coinos-api-key.json`
3. When creating project config, copy from user profile to project config

**Future Automated Process**:
1. User adds Coinos API key once in profile settings
2. `createProjectHtmlFile()` automatically reads key from user profile
3. Creates `{project_id}-config.json` with user's key
4. No manual key management needed per-project

### Current Keys
- **Site Income (clickforcharity)**: Apache env var `COINOS_API_KEY` in `/etc/apache2/sites-available/env-staging.conf`
- **lightninglova 001**: `/var/roflfaucet-data/projects/lightninglova/001-config.json`
  - Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE2YTMxN2YzLTJhNjItNGYyOS1iZDhjLTc5ZTRhOTZlMGZjNC1ybyIsImlhdCI6MTc2MDEzMjc0OH0.d0FX4m6uLDwqH_EJPJaKawu4m13WzZhLGiI20nj42f8`
  - Wallet ID: `a6a317f3-2a62-4f29-bd8c-79e4a96e0fc4-ro`
- **evans 001**: ⚠️ TODO - Get Coinos API key from Evans and create config

### Quick Reference: Creating Config File for New User

When a user creates their first project, create their config file:

```bash
# Replace USER and API_KEY with actual values
ssh es7-roflfaucet 'cat > /var/roflfaucet-data/projects/USER/001-config.json << EOF
{
  "project_id": "001",
  "recipient_wallet": {
    "type": "coinos",
    "api_key": "COINOS_API_KEY_HERE",
    "wallet_name": "User Project Name"
  }
}
EOF'
```

**Example for evans**:
```bash
ssh es7-roflfaucet 'cat > /var/roflfaucet-data/projects/evans/001-config.json << EOF
{
  "project_id": "001",
  "recipient_wallet": {
    "type": "coinos",
    "api_key": "EVANS_KEY_HERE",
    "wallet_name": "Evans Reforestation"
  }
}
EOF'
```

## 🔄 DONATION FLOW

### 1. Create Invoice
- User clicks donate on project page (e.g., `/projects/lightninglova/active/001.html`)
- JavaScript calls `/api/project-donations-api.php` with project_id
- API reads `<!-- OWNER: username -->` from HTML to identify owner
- API loads API key from `/var/roflfaucet-data/projects/{username}/{project_id}-config.json`
- Creates Coinos invoice using project owner's wallet
- Stores in `pending.json` with donation metadata

### 2. Payment Webhook
- Coinos sends webhook to `/webhook.php` when paid
- Webhook finds matching pending donation in `pending.json`
- Reads project_id and owner from pending donation
- **Updates HTML file directly** at `/var/roflfaucet-data/projects/{username}/active/{project_id}.html`:
  - Increments `<!-- current-amount -->`
  - Adds to `<!-- recent_donations -->` (keeps last 10)
- Removes from pending.json
- Logs to transaction-ledger.json (audit only)

### 3. Display Balance
- Page JavaScript calls `/api/fundraiser-api.php?action=get&id=001`
- API reads HTML file and extracts `<!-- current-amount -->`
- Returns current balance to display on page

## 📁 KEY FILES

### Active Files (DO USE)
1. **`/var/www/html/api/project-donations-api.php`** - Creates invoices
2. **`/var/www/html/api/project-management-api-v2.php`** - Creates/updates projects
3. **`/var/www/html/webhook.php`** - Processes payments, updates HTML
4. **`/var/www/html/api/fundraiser-api.php`** - Reads project data from HTML
5. **`/var/roflfaucet-data/projects/{username}/active/{id}.html`** - Project HTML files
6. **`/var/roflfaucet-data/projects/{username}/{id}-config.json`** - Project API keys
7. **`/var/www/html/project-template.html`** - Template for new projects

### Files to IGNORE (Old systems)
- Anything with "ledger" in calculation logic (ledger is audit-only now)
- Old JSON project files (`001-bitcoin-education-ghana.json`)
- Any `accounts-ledger.json` balance lookups

## 🐛 CURRENT ISSUES

### Minor Console Warnings (Harmless)
- CSP "Report Only" warnings (informational only - no actual CSP policy enforced)

**Core donation system is fully operational!** 🎉
**001.html is now a clean, error-free template ready for reuse!** ✨

## ✅ COMPLETED RECENTLY

### 2025-11-06: Repository Cleanup Complete 🧹

**Achievement**: Removed ~150-200MB of outdated files, organized structure

**Removed**:
- 4 test scripts (old testing infrastructure)
- 7 migration scripts (one-time operations, no longer needed)
- 3 backup/template directories (redundant copies)
- 27 subdirectories in `old/` → archived to `old-archive-2025-10-31.tar.gz` (11MB)

**Organized**:
- 13 outdated docs → moved to `ARCHIVED_DOCS/`
- 16 relevant docs remain in root

**Result**: 
- Clean structure with 8 focused directories: `site/`, `bots/`, `scripts/`, `includes/`, etc.
- All changes reversible from backups or tar.gz archive
- See `CLEANUP_COMPLETED.md` for full details

### 2025-10-22: Per-User Project System Implemented

**Change**: Migrated from flat project structure to user-specific folders

**Old Structure**:
```
/var/roflfaucet-data/projects/
├── 001.html
├── 002.html
└── 003.html
```

**New Structure**:
```
/var/roflfaucet-data/projects/
├── lightninglova/
│   ├── active/
│   │   └── 001.html
│   ├── images/
│   │   └── 001.jpg
│   └── 001-config.json
└── evans/
    ├── active/
    │   └── 001.html
    ├── images/
    │   └── 001.jpg
    └── 001-config.json
```

**Benefits**:
- ✅ Project IDs are per-user (both users can have 001, 002, etc.)
- ✅ Clean organization - all user's projects in one folder
- ✅ Images stored per-user in `{username}/images/`
- ✅ Config files alongside projects
- ✅ Auto-creates folders when user creates first project

**Files Updated**:
- `/var/www/html/api/project-management-api-v2.php`
  - `getNextProjectIdForUser($username)` - finds next ID for specific user
  - `createProjectHtmlFile()` - creates in `{username}/active/` folder
  - `updateProjectHtmlFile()` - searches user directories
  - `getProjectLocation()` - returns `{username}/active/` path
- `/var/www/html/scripts/project-editor.js`
  - Removed `lightningAddress` field references
- `/var/www/html/project-template.html`
  - Updated to match working 001.html structure

**Testing**: ✅ Created project as evans, got 001 as expected. System working perfectly!

### 2025-10-22: Fixed Site Scripts for Subdirectory Support

**Issue**: Console errors when loading project pages from user subdirectories
**Root Cause**: `site-utils.js` and `unified-balance.js` used relative API paths like `api/...` which failed when called from subdirectories like `/projects/lightninglova/001.html`

**Fix Applied**:
- Changed all API fetch calls in both scripts from `api/...` to `/api/...` (absolute paths)
- Created backups: `site-utils.js.bak`, `unified-balance.js.bak`
- Now scripts work from any directory: root pages, subdirectories, user project folders

**Files Updated**:
- `/var/www/html/scripts/site-utils.js`
- `/var/www/html/scripts/unified-balance.js`

**Result**: ✅ No more 403 errors, scripts work site-wide, 001.html console is clean!

### 2025-10-22: Fixed Syntax Errors in Project HTML

**Issue**: Donate button not working on project 001 page
**Root Causes**:
1. Line 501: Invalid fetch syntax - `PROJECT_ID), {` instead of `PROJECT_ID, {`
2. Line 563: Misplaced quote - `PROJECT_ID', {` instead of `PROJECT_ID, {`
3. Wrong API endpoint - using `fundraiser-api.php` instead of `project-donations-api.php`

**Fix Applied**:
- Corrected both fetch() calls with proper syntax
- Changed API endpoint to `/api/project-donations-api.php` (correct donations API)
- Added proper POST method and headers to both create_invoice and check_payment calls

**Result**: ✅ Donations working perfectly, balance showing 200 sats with 2 donations visible

**Process Note**: Download → Edit Locally → Upload is more reliable than sed for complex edits

### 2025-10-21: End-to-End Donation Flow

### Major Achievement: End-to-End Donation Flow Working! 🚀

**What Works:**
1. Create invoice with correct wallet (Bitcoin4Ghana)
2. Payment webhook processes and updates HTML file
3. Balance increments automatically
4. Recent donations section shows latest supporters
5. Success modal shows "View Your Donation" button
6. Clicking button reloads page and scrolls to donations
7. Direct project URLs work from fundraisers listing

## ✅ RECENTLY FIXED

### Issue #1: Hardcoded Balance in HTML
**Status**: ✅ FIXED (2025-10-21 17:36)
**Fix**: Initialized project 001 balance to 0, webhook now maintains it automatically

### Issue #2: Webhook Comment Tag Mismatch
**Status**: ✅ FIXED (2025-10-21 17:35)
**Problem**: Webhook was looking for `<!-- current_amount -->` (underscore)
**Reality**: HTML uses `<!-- current-amount -->` (hyphen)
**Fix**: Updated webhook.php to use hyphen format and handle commas/formatting

### Issue #3: Payment Confirmation Not Showing
**Status**: ✅ FIXED (2025-10-21 17:46)
**Problem**: Success message stuck on "waiting for payment" after donation
**Root Cause**: checkPaymentStatus was searching old JSON files instead of checking pending list
**Fix**: Simplified to check only pending.json - if donation removed = paid (most efficient)

## ✅ WHAT'S WORKING

### Core Donation System
1. ✅ API key configuration per project (in `{id}-config.json`)
2. ✅ Invoice creation with correct wallet (Bitcoin4Ghana for project 001)
3. ✅ Webhook receives and processes payment confirmations
4. ✅ HTML files updated automatically with:
   - New balance (incremented correctly)
   - Recent donations list (last 10, newest first)
   - Atomic file operations with locking
5. ✅ Payment status checking (efficient pending-list only)
6. ✅ Success modal with "View Your Donation" link
7. ✅ Page reload and scroll to #recent-donations on success

### Project Display
8. ✅ Direct project URLs: `/projects/{username}/{id}.html`
9. ✅ Fundraisers listing links directly to project pages
10. ✅ Balance display from HTML comment tags (no ledger lookups)
11. ✅ Recent donations section visible on project pages

### Infrastructure
12. ✅ File structure is clean and organized
13. ✅ All data in HTML files (single source of truth)
14. ✅ Transaction ledger for audit trail only

## 🔧 NEXT STEPS

### Immediate (Before Nov 4th)
1. ✅ ~~Clean up console errors~~ - DONE! Scripts now work from subdirectories
2. ✅ ~~Per-user project system~~ - DONE! Working perfectly
3. ✅ ~~Update template~~ - DONE! Template matches working 001.html
4. **Get Evans' Coinos API key** - Need for testing his project donations
5. **Create evans config file** - Manual: `/var/roflfaucet-data/projects/evans/001-config.json`
6. **Test end-to-end** - Verify donations work for both users

### After Nov 4th (When Credits Renew)
7. **Update fundraisers.html** - Ensure project links use new direct URL format
8. **Admin interface** - Simple page to manage user Coinos API keys
9. **Completion workflow** - Move finished projects to `completed/` folder
10. **One-active-per-recipient** - Enforce single active fundraiser per user

### Notes on Innovation
This is **the first fully peer-to-peer charity system** with:
- ✅ Direct Lightning donations (no middleman)
- ✅ Transparent on-chain verification
- ✅ Community accountability (no central trust required)
- ✅ User-controlled wallets (recipients own their funds)

No existing system to copy from - we're pioneering this approach! Expect challenges and iterations.

## 📝 TEMPLATE STATUS

**Official Clean Template**: `site/project-template.html` (local repo)

✅ **UPDATED 2025-10-22**: Template now matches working 001.html structure!

**Key Features**:
- ✅ OWNER tag at top: `<!-- OWNER: username -->`
- ✅ Include comments for build.sh: `<!-- include nav.html -->`
- ✅ Recent donations section with proper tags: `<!-- recent_donations -->`
- ✅ "View Your Donation" button that reloads page
- ✅ All placeholder text ready for editing
- ✅ Compatible with webhook.php (hyphens not underscores)
- ✅ Compatible with page editor tools
- ✅ Working donation modal JavaScript

### When creating new projects from template:
1. Copy `site/project-template.html` to new project file (e.g., 002.html)
2. Update `<!-- OWNER: username -->` at top
3. Update `const PROJECT_ID = '000';` to match new project number
4. Update metadata comment tags:
   - `<!-- title -->New Project Title<!-- end title -->`
   - `<!-- description -->Short description<!-- end description -->`
   - `<!-- current-amount -->0<!-- end current-amount -->`
   - `<!-- target-amount -->50,000<!-- end target-amount -->`
   - `<!-- recipient-name -->username<!-- end recipient-name -->`
   - `<!-- location -->City, Country<!-- end location -->`
   - `<!-- category -->General<!-- end category -->`
   - Leave `<!-- recent_donations --><!-- end recent_donations -->` empty
5. Create matching `{project_id}-config.json` with API key
6. Run `build.sh` to populate nav includes
7. Upload to server and verify

## 🚀 DEPLOYMENT CHECKLIST

When deploying changes:
1. Update local files first
2. Test locally if possible
3. Deploy to server: `scp file.php es7-roflfaucet:/var/www/html/`
4. Verify with test donation
5. Check logs: `/var/roflfaucet-data/logs/webhook.log`

---

**Remember**: The HTML file is the source of truth. Everything reads from it, only the webhook writes to it.
