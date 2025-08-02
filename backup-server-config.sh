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
scp -r root@$SERVER:/etc/nginx/sites-available/ "$BACKUP_DIR/nginx-sites-available/"
scp -r root@$SERVER:/etc/nginx/sites-enabled/ "$BACKUP_DIR/nginx-sites-enabled/"
scp root@$SERVER:/etc/nginx/nginx.conf "$BACKUP_DIR/nginx.conf"

# Backup PHP configurations (if any custom configs)
echo "Backing up PHP config..."
scp root@$SERVER:/etc/php/*/fpm/php.ini "$BACKUP_DIR/php.ini" 2>/dev/null || echo "No custom PHP config found"

# Backup application files (API endpoints)
echo "Backing up application API files..."
scp -r root@$SERVER:/var/www/html/api/ "$BACKUP_DIR/api/"

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
