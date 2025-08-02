# ROFLFaucet Server Backup Script Guide

## Overview
The `backup-server-config.sh` script creates comprehensive backups of your ROFLFaucet server configurations and critical files from the data server at `data.directsponsor.org` (86.38.200.119).

## Quick Usage
```bash
# Run backup (creates timestamped directory)
./backup-server-config.sh

# View latest backup
ls -la server-backups/$(ls -t server-backups/ | head -1)/
```

## What Gets Backed Up

### 🔧 Nginx Configurations
- **Main nginx.conf** - Core nginx configuration
- **All directsponsor.org configs** - Including auth, data, and users subdomains
- **Config backups** - Historical backup files already on server
- **conf.d directory** - All configuration fragments

### 🐘 PHP Application Files
- **Authentication scripts** - jwt-auth.php, userinfo.php, token.php, etc.
- **API endpoints** - All PHP files in web root
- **File inventory** - Complete list of PHP files found on server

### 📝 Documentation
- **nginx-files-found.txt** - List of all nginx config files discovered
- **php-files-found.txt** - List of all PHP files on server (first 20)
- **backup-summary.txt** - Human-readable summary with timestamp

## Backup Directory Structure
```
server-backups/
└── 2025-08-03_00-16-55/          # Timestamped backup
    ├── backup-summary.txt         # Summary and metadata
    ├── nginx.conf                 # Main nginx config
    ├── nginx-conf.d/              # Config fragments directory
    ├── data.directsponsor.org.conf # Data server config (CRITICAL)
    ├── auth.directsponsor.org.conf # Auth server config
    ├── users.directsponsor.org.conf # Users server config
    ├── *.conf.backup              # Historical backups
    ├── jwt-auth.php               # JWT authentication
    ├── userinfo.php               # User profile API
    ├── token.php                  # Token management
    ├── status.php                 # Server status
    └── ...                        # Other PHP files
```

## Critical Files Explanation

### `data.directsponsor.org.conf`
**MOST IMPORTANT** - Contains:
- CORS configuration fixes
- `/api/user/transaction` endpoint routing (added during fixes)
- API endpoint mappings
- SSL configuration
- Security headers

### `auth.directsponsor.org.conf`
- JWT authentication server configuration
- Separate from data server (important for CORS isolation)

### PHP Files
- `jwt-auth.php` - JWT token generation
- `userinfo.php` - User profile API (fixed CORS headers)
- Backend scripts for balance, voting, etc.

## When to Run Backups

### 🚨 Always Before Changes
```bash
./backup-server-config.sh  # Before any server modifications
```

### 📅 Regular Schedule
- **Daily**: For active development
- **Weekly**: For stable systems
- **Before updates**: OS updates, nginx updates, PHP updates

### 🔧 After Major Changes
- Configuration changes
- New endpoint additions
- CORS policy updates
- SSL certificate renewals

## Restore Process

### 1. Identify Backup
```bash
ls -la server-backups/
# Choose the backup timestamp you want to restore from
```

### 2. Copy Files Back to Server
```bash
# Example restore of nginx config
scp server-backups/2025-08-03_00-16-55/data.directsponsor.org.conf root@86.38.200.119:/etc/nginx/conf.d/

# Test nginx config before reloading
ssh root@86.38.200.119 "nginx -t"

# Reload if test passes
ssh root@86.38.200.119 "systemctl reload nginx"
```

### 3. Verify Restoration
```bash
# Test endpoints
curl -I https://data.directsponsor.org/api/profile
# Should return proper CORS headers and 200/405 status
```

## Troubleshooting

### Permission Denied
```bash
chmod +x backup-server-config.sh
```

### SSH Connection Issues
```bash
# Verify SSH access
ssh root@86.38.200.119 "echo 'Connection works'"
```

### Missing Files in Backup
- Some directories may not exist on server (normal)
- Script handles missing paths gracefully
- Check `backup-summary.txt` for what was actually backed up

## Advanced Usage

### Custom Backup Location
```bash
# Modify BACKUP_DIR in script if needed
BACKUP_DIR="custom-backups/$DATE"
```

### Selective Restore
```bash
# Restore only nginx config
scp server-backups/TIMESTAMP/data.directsponsor.org.conf root@86.38.200.119:/etc/nginx/conf.d/

# Restore only PHP file
scp server-backups/TIMESTAMP/userinfo.php root@86.38.200.119:/var/www/html/
```

## Security Notes

- Backups contain server configurations but not sensitive data
- Private keys and certificates are NOT backed up (managed by Certbot)
- Database credentials may be in PHP files - secure backup directory appropriately
- Regular cleanup of old backups recommended

## Related Files
- `FIXES-APPLIED.md` - Documentation of all fixes applied to system
- `backup-server-config.sh` - The actual backup script
- `server-backups/` - Directory containing all timestamped backups

## Quick Reference Commands

```bash
# Create backup
./backup-server-config.sh

# List all backups
ls -t server-backups/

# View latest backup contents
ls -la server-backups/$(ls -t server-backups/ | head -1)/

# View backup summary
cat server-backups/$(ls -t server-backups/ | head -1)/backup-summary.txt

# Find specific config in latest backup
find server-backups/$(ls -t server-backups/ | head -1)/ -name "*data.directsponsor*"
```

---

**Last Updated**: August 3, 2025  
**Script Version**: Supports conf.d directory structure  
**Server**: data.directsponsor.org (86.38.200.119)
