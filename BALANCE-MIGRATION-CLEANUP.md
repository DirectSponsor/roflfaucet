# ROFLFaucet Balance Migration Cleanup

The balance system has been centralized on the auth server (`auth.directsponsor.org`). The core balance read/write flow works correctly across sites. However, several files on the roflfaucet VPS still reference the local `/var/roflfaucet-data/userdata/balances/` directory and need updating or removing.

## What was already fixed (2026-02-25)

**File:** `site/api/simple-chat.php`

- `updateUserBalance()` — fixed wrong Hub API URL (`balance-update.php` → `update_balance.php`) and wrong payload format
- `loadUserBalance()` — now queries auth server instead of local files, no fallback
- All user lookup functions — switched from `/balances/` to `/profiles/` directory
- Added Syncthing conflict file filtering for profile lookups
- Deployed to VPS at `/var/www/html/api/simple-chat.php` (backup created)

## Remaining cleanup tasks

### 1. `coins-balance.php` — profile page balance API

**Path:** `site/api/coins-balance.php`
**VPS:** `/var/www/html/api/coins-balance.php`
**Called by:** `scripts/profile.js` (lines 205 and 230) for balance display and recent transaction history on the profile page.
**Issue:** Reads/writes local balance files in `/balances/`. Has a lazy-loading fallback to auth server, so balance display works, but transaction history is local-only and likely stale.
**Action:** Migrate to use auth server directly for balance. Decide what to do about transaction history (the auth server may already track this).

### 2. `session-bridge.php` — balance file check on login

**Path:** `site/session-bridge.php`
**VPS:** `/var/www/html/session-bridge.php`
**Issue:** `ensureBalanceFileExists()` (line 214) checks for local balance files and logs warnings. Already disabled from creating files. References `coins-balance.php` in comments.
**Action:** Remove the `ensureBalanceFileExists()` method and its call from `ensureUserFilesExist()`. Update comments referencing `coins-balance.php`.

### 3. `daily-balance-rollup.php` — cron job for transaction cleanup

**Path:** `site/scripts/daily-balance-rollup.php`
**VPS:** likely in `/var/www/html/scripts/` or cron
**Issue:** Processes transaction history in local balance files. If no new transactions are being written locally, this is doing nothing.
**Action:** Check if cron job is active (`crontab -l` on VPS). Disable/remove if local balance files are no longer being written to.

### 4. Syncthing configuration

**Issue:** The `/balances/` directory may still be synced by Syncthing unnecessarily. Profiles directory has many sync-conflict files that should be cleaned up.
**Action:** Review Syncthing config on VPS. Remove `/balances/` from sync if no longer needed. Clean up `*sync-conflict*` files from `/profiles/`.

### 5. Consider removing `/balances/` directory

Once all the above are done, the local `/balances/` directory can be archived and removed.

## Architecture reference

- **Auth server:** `auth.directsponsor.org` — single source of truth for balances
- **Balance read:** `GET https://auth.directsponsor.org/api/get_balance.php?user_id={id-username}`
- **Balance write:** `POST https://auth.directsponsor.org/api/update_balance.php` with `{user_id, amount, source, server_id}`
- **User profiles:** local at `/var/roflfaucet-data/userdata/profiles/{id}-{username}.txt` (synced by Syncthing)
- **VPS SSH:** `ssh roflfaucet` (host `es7-roflfaucet` also works, same server `89.116.44.206`)
