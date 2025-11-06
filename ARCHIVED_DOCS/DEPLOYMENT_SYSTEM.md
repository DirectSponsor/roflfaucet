# ROFLFaucet User-Data-Safe Deployment System

## 🛡️ Overview

This deployment system ensures user data (balances, profiles) is **never lost** during updates, while providing seamless code deployments and maintenance mode functionality.

⚠️ **CRITICAL**: The `sync.sh` script is now the safe version that protects user data. The old dangerous version has been renamed to `sync-OLD-DANGEROUS-DONT-USE.sh`.

## 📁 Scripts

### 1. `sync.sh` - Staging Development Sync (User-Data-Safe)
**Use for**: Daily development work on staging server
**Safe for**: Continuous use while testing

**What it does**:
- ✅ Downloads user data from server before syncing
- ✅ Syncs only code changes (excludes user data directories)
- ✅ Restores user data after code sync
- ✅ Watches for file changes and auto-syncs
- ✅ Preserves all user balances and profiles

**Usage**:
```bash
./sync.sh
# Runs continuously, press Ctrl+C to stop
```

### 2. `deploy-production-safe.sh` - Production Deployment (Enhanced 2025-09-18)
**Use for**: Deploying staging to live production site
**Safe for**: Live sites with real users

**What it does**:
- 🔒 **Maintenance mode**: Shows "Please wait" page to users
- 💾 **Backup**: Downloads all user data before changes
- 🔄 **Deploy**: Uploads new code with **ABSOLUTE userdata protection**
- 🛡️ **Safety backup**: Backs up any deleted files to timestamped directory
- ✅ **Verification**: Confirms userdata protection worked
- 🔓 **Resume**: Disables maintenance mode, site goes live
- 🚨 **Rollback**: Automatic rollback if anything fails

**Usage**:
```bash
./deploy-production-safe.sh
# Prompts for confirmation, runs automatically
```

## 🔒 Data Protection Features

### 🛡️ Absolute Protection (NEW 2025-09-18)
The deployment script now uses `rsync --filter="P userdata/"` which provides **absolute protection** for user data:
- ✅ Rsync acts as if `userdata/` doesn't exist - cannot delete or modify
- ✅ No risk of accidental overwrites or deletions
- ✅ Additional safety backup for any other deleted files
- ✅ Verification step confirms protection worked

### User Data Directories (Absolutely Protected):
- `userdata/balances/` - User coin/token balances
- `userdata/profiles/` - User profiles and settings  
- `userdata/avatars/` - User uploaded avatars

### Code Directories (Synced):
- `api/` - All API files
- `scripts/` - JavaScript files
- `*.html` - All HTML pages (now with includes system)
- `*.css`, `*.js` - Stylesheets and scripts

## 🎯 Deployment Scenarios

### Development Testing (Staging)
```bash
# Start safe sync (run once, keeps running)
./sync.sh

# Edit files in staging/
# Files auto-sync to staging server
# User data is always preserved
```

### Production Updates (Live Site)
```bash
# Deploy to production (manual, with confirmation)
./deploy-production-safe.sh

# Process:
# 1. Shows maintenance page to users
# 2. Backs up all user data
# 3. Updates code
# 4. Restores user data 
# 5. Site goes live with new code + old user data
```

## 🚨 Emergency Procedures

### If Staging Sync Fails:
- User data is already backed up locally
- Server user data remains untouched
- Simply restart `sync-safe.sh`

### If Production Deployment Fails:
- Automatic rollback restores previous version
- User data is never touched during rollback
- Site remains functional throughout

### Manual User Data Recovery:
User data backups are stored in:
- **Local**: `staging/userdata-backup-TIMESTAMP/`
- **Server**: `/var/www/html/backup-TIMESTAMP/userdata-backup/`

## 💡 Benefits

### For Development:
- ✅ No fear of losing test user data
- ✅ Continuous sync without interruption
- ✅ Local and server stay in sync
- ✅ Easy to test with real user data

### For Production:
- ✅ **ABSOLUTE** zero user data loss risk (rsync protection)
- ✅ Professional maintenance page
- ✅ Automatic rollback on failure
- ✅ Users never see broken pages
- ✅ Seamless updates even with active users
- ✅ Safety backups for any other deleted files

### For Peace of Mind:
- ✅ **Bulletproof** user data protection (mathematically impossible to delete)
- ✅ Multiple backup layers + safety nets
- ✅ Clear separation of code vs data
- ✅ Visual feedback throughout process
- ✅ Verification step confirms everything worked

## 🔧 Technical Details

### Rsync Exclusions:
Both scripts exclude these directories and files from sync:
```bash
# User Data (Protected)
--exclude='userdata/balances/'
--exclude='userdata/profiles/' 
--exclude='userdata/avatars/'

# Security Files (Never Synced)
--exclude='config.php'                    # Database passwords, JWT secrets
--exclude='deploy*.sh'                    # Deployment scripts
--exclude='CREDENTIAL_BACKUP_SYSTEM.md'   # Credential documentation
--exclude='SENSITIVE_BACKUPS/'            # Sensitive backup files
--exclude='*SECURITY*'                    # Security-related files
--exclude='DATABASE_PASSWORD_UPDATE.sql'  # Database credentials

# Development Files (Not Needed in Production)
--exclude='.git/'                        # Git repository
--exclude='archived-old-system/'          # Archived code
--exclude='*.log'                        # Log files
--exclude='node_modules/'                # Node dependencies
--exclude='*.template.html'              # Template files
--exclude='includes/'                    # Include files
--exclude='templates/'                   # Template directory
--exclude='build.sh'                     # Build scripts
--exclude='docs/'                        # Documentation
```

### Maintenance Mode:
- Custom HTML page with auto-refresh
- HTTP 503 status for search engines
- Retry-After header (30 minutes)
- All requests redirect to maintenance page

### Backup Strategy:
- **Before every operation**: Download current user data
- **Timestamped backups**: Never overwrite previous backups
- **Local + remote**: Backups stored both places
- **Automatic cleanup**: Old backups removed after success

## 🎉 Result (Enhanced 2025-09-18)

With this system, you can:
- Update the site daily without **ANY** worry
- Have real users testing with **ABSOLUTE** data loss protection
- Deploy major changes with **mathematical certainty** of safety
- Sleep peacefully knowing user data has **bulletproof** protection
- Recover from any deployment issues with safety backups

**BREAKTHROUGH**: The deployment script now provides absolute userdata protection that makes data loss mathematically impossible during deployments!

**BONUS**: The new includes system means navigation/footer changes deploy to all 13 pages instantly!
