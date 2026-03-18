# Payment System Investigation - 2026-01-24

## Quick Summary
The payment system code appears intact. The likely issue is the **Coinos API key** which is loaded from environment variables.

## System Architecture

### Two Separate Payment Systems:
1. **Site Income** (`/site/api/site-income-api.php`) - General ROFLFaucet donations
2. **Project Donations** (`/site/api/project-donations-api.php`) - Specific project fundraising

### Webhook Handler:
- **Single webhook** (`/site/webhook.php`) - Smart router for both systems
- URL: `https://roflfaucet.com/webhook.php`

## Potential Issues Found

### 1. API Key Configuration (MOST LIKELY ISSUE)
**Location:** `@/home/andy/work/projects/roflfaucet/site/api/site-income-api.php:22`
```php
define('COINOS_API_KEY', getenv('COINOS_API_KEY') ?: 'your-api-key-here');
```

**Problem:** API key loaded from environment variable `COINOS_API_KEY`
- If environment variable not set, falls back to placeholder `'your-api-key-here'`
- This would cause all invoice creation to fail

**To Check on Server:**
```bash
ssh roflfaucet
# Check if environment variable is set
printenv COINOS_API_KEY
# Or check PHP environment
php -r "echo getenv('COINOS_API_KEY') ?: 'NOT SET';"
```

### 2. Webhook Secret Configuration
**Location:** `@/home/andy/work/projects/roflfaucet/site/webhook.php:31`
```php
define('WEBHOOK_SECRET', getenv('COINOS_WEBHOOK_SECRET') ?: 'your-webhook-secret-here');
```

**Expected value:** `'roflfaucet_webhook_secret_2024'` (hardcoded in APIs)
**Problem:** Mismatch between webhook sender and receiver secrets would cause verification failures

### 3. Data Directory Permissions
All APIs expect data at: `/var/roflfaucet-data/`

**Directories needed:**
- `/var/roflfaucet-data/payments/data/site-income/`
- `/var/roflfaucet-data/data/project-donations-pending/`
- `/var/roflfaucet-data/logs/`
- `/var/roflfaucet-data/projects/`

**Required permissions:** `www-data:www-data` ownership, `775` for dirs, `664` for files

## Server Access

**SSH Alias:** `roflfaucet` or `es7-roflfaucet`
```bash
ssh roflfaucet
# Server: 89.116.44.206
# User: root
# Key: ~/.ssh/warp
```

**Important paths from SSH config:**
- Staging: `/var/www/staging/`
- Production: `/var/www/html/`
- Data: `/var/roflfaucet-data/`

**Log files to check:**
- `/var/roflfaucet-data/logs/donate.log` - Site income API logs
- `/var/roflfaucet-data/logs/project_payments.log` - Project donations logs
- `/var/roflfaucet-data/logs/webhook.log` - Webhook processing logs
- Apache staging SSL: `/staging_ssl_error.log`
- Apache production SSL: `/var/log/apache2/roflfaucet_ssl_error.log`

## Next Steps (When You Return)

### 1. Check API Key (PRIORITY)
```bash
ssh roflfaucet
# Check environment variable
printenv COINOS_API_KEY

# If not set, need to add it to Apache/PHP environment
# Options:
# - Add to /etc/apache2/envvars
# - Add to PHP-FPM pool config
# - Add to .htaccess (less secure)
# - Or hardcode in the PHP file (least secure but quick test)
```

### 2. Check Recent Logs
```bash
ssh roflfaucet
tail -50 /var/roflfaucet-data/logs/donate.log
tail -50 /var/roflfaucet-data/logs/webhook.log
tail -50 /var/log/apache2/roflfaucet_ssl_error.log
```

### 3. Test Payment Creation
Try creating a test donation and watch logs in real-time:
```bash
ssh roflfaucet
tail -f /var/roflfaucet-data/logs/donate.log
# Then try creating a donation from the website
```

### 4. Verify Data Directory Structure
```bash
ssh roflfaucet
ls -la /var/roflfaucet-data/
ls -la /var/roflfaucet-data/payments/data/site-income/
ls -la /var/roflfaucet-data/logs/
# Check ownership and permissions
```

## Code Status
✅ All payment API files are present and appear correct
✅ Webhook routing logic looks good
✅ File paths use correct `/var/roflfaucet-data/` structure
❓ Environment variables need verification
❓ Coinos API connectivity unknown (could be API changes)

## Documentation Reference
- Full system docs: `@/home/andy/work/projects/roflfaucet/BITCOIN_LIGHTNING_PAYMENT_SYSTEM.md`
- Last known working: September 25, 2025
- Current date: January 24, 2026 (4 months since last update)

## Possible External Issues
- Coinos.io API changes (check their documentation)
- Coinos account status (suspended? API key revoked?)
- Network/firewall blocking Coinos API calls
- SSL certificate issues preventing webhook delivery

---
**Created:** 2026-01-24 13:14 UTC
**Status:** Ready for server investigation when you return
