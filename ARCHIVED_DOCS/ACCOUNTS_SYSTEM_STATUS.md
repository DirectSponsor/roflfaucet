# ROFLFaucet Accounts System Status
**Created**: 2025-10-22 14:20 UTC

## 🚨 CRITICAL ISSUE

The accounts system is showing incomplete data. We have 2 months of transaction history that's not displaying properly.

### Current State
- **accounts.html** shows only 19 transactions (should show complete history)
- **Charity Pot Widget** shows: 
  - Current: 33,451 sats
  - Total Received: 54,253 sats
  - Distributed: 20,802 sats
- **Project 001 (lightninglova)** shows 200 sats but should be over 20,000 sats

## 📊 SYSTEM ARCHITECTURE (As It Should Work)

### Three Independent Systems

#### 1. Project Donations System ✅ WORKING
**Purpose**: Direct donations to specific fundraising projects

**Flow**:
- User donates to project (e.g., 001.html)
- Payment goes directly to project's wallet (recipient's Coinos wallet)
- Webhook updates project HTML file (`<!-- current-amount -->`)
- Transaction logged to `transaction-ledger.json`

**Files**:
- `/var/roflfaucet-data/projects/{username}/{id}.html` - Project pages
- `/var/roflfaucet-data/projects/{username}/{id}-config.json` - API keys
- `/var/www/html/api/project-donations-api.php` - Creates invoices
- `/var/www/html/webhook.php` - Processes payments
- `/var/roflfaucet-data/data/transaction-ledger.json` - Audit trail

**Status**: ✅ Working perfectly for NEW donations (since Oct 21)

---

#### 2. Site Income System ⚠️ UNKNOWN STATUS
**Purpose**: Donations to site operations ("charity pot"/"kitty")

**Flow**:
- User donates to site income
- Payment goes to site's main wallet
- Funds accumulate in "charity pot"
- Monthly distributions to recipients from pot

**Data Source**:
- Charity Pot Widget reads from `/api/financial-totals.php`
- Shows current pot, total received, total distributed

**Status**: ⚠️ Widget shows numbers, but unclear if all transactions tracked

---

#### 3. Accounts/Transparency System 🔴 BROKEN
**Purpose**: Complete public accounting of ALL transactions

**Should Display**:
- ✅ All project donations (direct to recipients)
- ✅ All site income donations (to charity pot)
- ✅ All monthly distributions (pot → recipients)
- ✅ Complete transaction history with timestamps

**Current Problem**:
- Only shows 19 transactions
- Missing 2 months of historical data
- accounts.html says "No Recipient Transactions Yet"

**Data Source**:
- `/var/roflfaucet-data/data/accounts-ledger.json` - 19 entries for lightninglova
- Something is limiting the display or data is incomplete

---

## 📁 DATA FILES AUDIT

### Transaction Ledger
**File**: `/var/roflfaucet-data/data/transaction-ledger.json`
**Size**: 4.1K (Oct 22 13:59)
**Contents**: Only 6 project 001 donations (since Oct 21 when new system started)
**Issue**: Missing historical transactions from before Oct 21

### Accounts Ledger  
**File**: `/var/roflfaucet-data/data/accounts-ledger.json`
**Size**: 12K (Oct 19 19:41)
**Contents**: Has lightninglova entries (grep shows 19 matches)
**Issue**: accounts.html not displaying them properly

### Financial Totals API
**File**: `/var/www/html/api/financial-totals.php`
**Status**: Returns data to Charity Pot widget successfully
**Issue**: Need to check what data sources it uses

---

## 🔍 INVESTIGATION NEEDED

1. **Why is accounts.html showing "No Recipient Transactions Yet"?**
   - Check `/var/www/html/accounts.html` JavaScript
   - Check what API endpoint it calls
   - Verify it's reading `accounts-ledger.json` correctly

2. **Where is the historical project 001 data?**
   - Should be over 20k sats total
   - New system only has 6 donations (301 sats)
   - Old data must be somewhere (check backups, old JSON files)

3. **What happened between Oct 19-21?**
   - `accounts-ledger.json` last modified Oct 19
   - `transaction-ledger.json` only has entries from Oct 21+
   - Something changed in this window

4. **Are new donations being logged to BOTH ledgers?**
   - Test: Make donation, check if it appears in both:
     - `transaction-ledger.json` (project donations)
     - `accounts-ledger.json` (transparency system)

---

## 🎯 RECOVERY PLAN

### Phase 1: Understand Current State
1. Test donation to see what gets logged where
2. Check financial-totals.php to see its data sources
3. Map complete data flow for each system
4. Identify what's broken vs what's just disconnected

### Phase 2: Find Missing Data
1. Search for backup files with old transaction data
2. Check old JSON project files (001-bitcoin-education-ghana.json.backup*)
3. Look for archived ledgers or exports
4. Check if Coinos wallet has complete transaction history

### Phase 3: Restore & Reconnect
1. Restore historical transaction data to proper ledger
2. Fix accounts.html display issue
3. Ensure new transactions flow to all proper places
4. Verify totals add up correctly

### Phase 4: Document & Prevent
1. Document complete architecture clearly
2. Add monitoring/alerts for data inconsistencies
3. Regular backups of all ledger files
4. Test suite to verify all systems stay in sync

---

## 💾 BACKUP LOCATIONS TO CHECK

```
/var/roflfaucet-data/projects/001-bitcoin-education-ghana.json.backup
/var/roflfaucet-data/projects/001-bitcoin-education-ghana.json.backup2
/var/roflfaucet-data/projects/001-bitcoin-education-ghana.json.backup3
```

These might have the old project 001 balance/transaction data.

---

## 🧪 TEST PLAN

Make a small test donation and track it through:
1. ✅ Project HTML file updates (`<!-- current-amount -->`)
2. ⚠️ Appears in `transaction-ledger.json`
3. ⚠️ Appears in `accounts-ledger.json`
4. ⚠️ Shows on accounts.html
5. ⚠️ Charity pot totals update (if applicable)

---

## 📝 NOTES

- Project donations system (new) is working perfectly for its purpose
- The issue is with historical data and the transparency/accounts display
- Systems may have been refactored and old data left behind
- Need to either recover old data or accept starting fresh (but that loses 2 months of history)

---

**Next Steps**: 
1. ✅ Test donation completed - 70 sats, charity pot widget updated correctly
2. Reconstruct full accounts.html from available data
3. Consider deprecating manual recipient verification system (replaced by Coinos API)

---

## 🔄 UPDATE: Test Donation Results (Oct 22 14:26)

### What's Working ✅
- **Site Income System**: Test donation of 70 sats updated charity pot widget immediately
- **Project Donations**: Frontend working, donations processing correctly

### What Needs Work 🔧

#### Priority 1: Reconstruct Full Accounts Display
**Goal**: Get accounts.html showing complete transaction history

**Approach**:
1. Gather data from all available sources:
   - Site income transactions (working system)
   - Project donation records (transaction-ledger.json)
   - Old accounts-ledger.json entries (19 lightninglova transactions)
   - Historical data from backup JSON files if available

2. Create starting balance entry if needed:
   - "Starting Balance: XX,XXX sats (historical transactions prior to [date])"
   - Then show all tracked transactions from that date forward
   - Maintains transparency while acknowledging gap

3. Fix accounts.html display:
   - Investigate why it shows "No Recipient Transactions Yet"
   - Ensure it reads from correct data source
   - Display both site income and project donations

#### Priority 2: Deprecate Manual Recipient Verification System
**Reason**: Coinos API provides automatic verification

**Old System** (manual):
- Recipients had to manually confirm receipt of monthly distributions
- Required separate verification pages/system
- More admin overhead

**New System** (automatic):
- Coinos API shows payment status automatically
- Can detect monthly distributions by sender/metadata
- Already implemented (need to verify)

**Action**: 
- Check if automated monthly distribution detection exists
- Remove old manual verification pages if automated system works
- Update documentation

#### Priority 3: Project Frontend Polish
- Fundraisers listing links
- Template finalization
- Any remaining UI tweaks

---

## 📋 ACCOUNTS RECONSTRUCTION PLAN

### Step 1: Inventory All Data Sources
```bash
# Site income transactions (working)
/api/financial-totals.php → current pot balance
/api/site-income-api.php → transaction history?

# Project donations
/var/roflfaucet-data/data/transaction-ledger.json (6 recent)
/var/roflfaucet-data/data/accounts-ledger.json (19 older entries)

# Backups to check
/var/roflfaucet-data/projects/001-bitcoin-education-ghana.json.backup*
```

### Step 2: Determine Starting Point
- If we can recover most historical data → full reconstruction
- If too much data lost → use starting balance approach

### Step 3: Create Unified Accounts View
- Merge all available transaction sources
- Sort chronologically
- Display with clear categories (project donation, site income, distribution)
- Show running totals

### Step 4: Ensure Future Completeness
- Verify all new transactions appear in accounts.html
- Both project donations AND site income
- Automatic updates via webhooks/APIs
