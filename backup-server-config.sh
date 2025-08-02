#!/bin/bash

# Backup script for ROFLFaucet server configurations
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="server-backups/$DATE"
SERVER="86.38.200.119"

echo "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

echo "Backing up server configurations from $SERVER..."

# Backup nginx configurations
echo "Backing up nginx config..."
scp root@$SERVER:/etc/nginx/nginx.conf "$BACKUP_DIR/nginx.conf" 2>/dev/null || echo "Main nginx.conf not found"
scp -r root@$SERVER:/etc/nginx/sites-available/ "$BACKUP_DIR/nginx-sites-available/" 2>/dev/null || echo "sites-available not found"
scp -r root@$SERVER:/etc/nginx/sites-enabled/ "$BACKUP_DIR/nginx-sites-enabled/" 2>/dev/null || echo "sites-enabled not found"
scp -r root@$SERVER:/etc/nginx/conf.d/ "$BACKUP_DIR/nginx-conf.d/" 2>/dev/null || echo "conf.d not found"

# Backup the specific site config we modified
echo "Backing up specific site config..."
ssh root@$SERVER "find /etc/nginx -name '*directsponsor*' -type f" > "$BACKUP_DIR/nginx-files-found.txt" 2>/dev/null
if [ -s "$BACKUP_DIR/nginx-files-found.txt" ]; then
    while read -r file; do
        echo "Backing up: $file"
        scp "root@$SERVER:$file" "$BACKUP_DIR/$(basename $file)" 2>/dev/null
    done < "$BACKUP_DIR/nginx-files-found.txt"
fi

# Backup PHP configurations (if any custom configs)
echo "Backing up PHP config..."
scp root@$SERVER:/etc/php/*/fpm/php.ini "$BACKUP_DIR/php.ini" 2>/dev/null || echo "No custom PHP config found"

# Backup application files (API endpoints)
echo "Backing up application API files..."
scp -r root@$SERVER:/var/www/html/api/ "$BACKUP_DIR/api/" 2>/dev/null || echo "API directory not found"
scp -r root@$SERVER:/var/www/html/*.php "$BACKUP_DIR/" 2>/dev/null || echo "No PHP files in web root"

# Find and backup any PHP files we modified
echo "Finding PHP files we modified..."
ssh root@$SERVER "find /var/www -name '*.php' -type f | head -20" > "$BACKUP_DIR/php-files-found.txt" 2>/dev/null
echo "PHP files found:"
cat "$BACKUP_DIR/php-files-found.txt" 2>/dev/null || echo "No PHP files listed"

# Create a summary file
cat > "$BACKUP_DIR/backup-summary.txt" << EOF
Backup created: $(date)
Server: $SERVER
Contents:
- nginx configurations (sites-available, sites-enabled, nginx.conf)
- PHP configuration (if custom)
- API application files
- This backup includes the CORS fixes and transaction endpoint routing

Recent fixes applied:
1. Removed duplicate CORS headers from PHP and nginx
2. Added /api/user/transaction endpoint routing
3. Secured CORS to specific origins only
4. Fixed faucet balance updates for logged-in users
EOF

echo "Backup completed in: $BACKUP_DIR"
echo "Summary:"
cat "$BACKUP_DIR/backup-summary.txt"
