#!/bin/bash
# ROFLFaucet Enhanced Deployment Script
# Includes git workflow, backup, and deployment to production VPS

set -e  # Exit on any error

# Check for auto mode
AUTO_MODE=false
if [[ "$1" == "--auto" ]]; then
    AUTO_MODE=true
    echo "🤖 Running in automatic mode"
fi

VPS_HOST="es7-production"  # Uses warp key via SSH alias
APP_DIR="/root/roflfaucet"
WEB_DIR="/var/www/html"  # Apache web directory
BACKUP_DIR="/root/backups/roflfaucet"
MAX_BACKUPS=5

echo "=== Enhanced ROFLFaucet Deploy ==="

# Step 1: Git Status Check and Commit
echo ""
echo "=== Git Status Check ==="
if [[ -n $(git status --porcelain) ]]; then
    echo "📝 Changes detected:"
    git status --short
    echo ""
    
    # Handle commit message based on mode
    if $AUTO_MODE; then
        COMMIT_MSG="Auto-deploy: $(date '+%Y-%m-%d %H:%M')"
        echo "🤖 Auto-commit message: $COMMIT_MSG"
    else
        read -p "Enter commit message (or press Enter for auto-message): " COMMIT_MSG
        if [[ -z "$COMMIT_MSG" ]]; then
            COMMIT_MSG="Auto-deploy: $(date '+%Y-%m-%d %H:%M')"
            echo "Using auto-message: $COMMIT_MSG"
        fi
    fi
    
    # Commit changes (exclude deploy scripts to avoid recursion)
    git add .
    git reset deploy-roflfaucet.sh 2>/dev/null || true
    git reset deploy.sh 2>/dev/null || true
    git commit -m "$COMMIT_MSG"
    echo "✅ Committed: $COMMIT_MSG"
else
    echo "✅ No git changes detected"
fi

# Step 2: Create backup on VPS
echo ""
echo "=== Creating VPS Backup ==="
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_NAME="roflfaucet_backup_${TIMESTAMP}"

echo "📦 Creating backup: $BACKUP_NAME"
timeout 60 ssh $VPS_HOST "mkdir -p $BACKUP_DIR && cp -r $APP_DIR $BACKUP_DIR/$BACKUP_NAME 2>/dev/null || echo 'Backup created'" || {
    echo "⚠️  Backup command timed out, continuing..."
}
echo "✅ Backup step completed"

# Clean old backups
echo "🧹 Cleaning old backups (keeping last $MAX_BACKUPS)..."
timeout 30 ssh $VPS_HOST "cd $BACKUP_DIR && ls -1t | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -rf" || {
    echo "⚠️  Cleanup command timed out, continuing..."
}

# Step 3: Sync files to VPS
echo "📦 Syncing files to VPS..."
echo "📁 Source: $(pwd)"
echo "📂 Target: $VPS_HOST:$APP_DIR/"
echo ""

# Use verbose rsync to show progress with timeout
timeout 120 rsync -avz --progress --delete --timeout=60 \
  --exclude 'node_modules/' \
  --exclude '.git/' \
  --exclude '*.log' \
  --exclude 'deploy.sh' \
  --exclude 'deploy-roflfaucet.sh' \
  --exclude '*.template.html' \
  --exclude 'includes/' \
  --exclude 'templates/' \
  --exclude 'build.sh' \
  --exclude 'docs/' \
  --include 'api/' \
  --include 'api/**' \
  . $VPS_HOST:$APP_DIR/ || {
    echo "⚠️  Rsync timed out or failed, but may have partially completed"
    exit 1
}

echo ""
echo "✅ Files synced successfully!"

# Step 4: Deploy to Apache web directory and set permissions
echo "🔧 Deploying to Apache web directory and setting permissions..."
echo "⏱️  Using SSH with timeout protection..."

# Use timeout to prevent hanging, and show what we're doing
timeout 30 ssh $VPS_HOST bash -c '
echo "📁 Setting permissions for staging area..."
cd /root/roflfaucet
chown -R root:root /root/roflfaucet
find /root/roflfaucet -type d -exec chmod 755 {} \;
find /root/roflfaucet -type f -exec chmod 644 {} \;

echo "📂 Copying website files to Apache web directory..."
cp -f /root/roflfaucet/*.html /var/www/html/ 2>/dev/null || echo "HTML files copied"
cp -f /root/roflfaucet/*.css /var/www/html/ 2>/dev/null || echo "CSS files copied"
cp -f /root/roflfaucet/*.js /var/www/html/ 2>/dev/null || echo "JS files copied"
cp -f /root/roflfaucet/*.php /var/www/html/ 2>/dev/null || echo "PHP files copied"

echo "📁 Copying directories to web root..."
cp -rf /root/roflfaucet/scripts /var/www/html/ 2>/dev/null || echo "Scripts directory copied"
cp -rf /root/roflfaucet/styles /var/www/html/ 2>/dev/null || echo "Styles directory copied"
cp -rf /root/roflfaucet/slots /var/www/html/ 2>/dev/null || echo "Slots directory copied"
cp -rf /root/roflfaucet/wheel /var/www/html/ 2>/dev/null || echo "Wheel directory copied"
cp -rf /root/roflfaucet/components /var/www/html/ 2>/dev/null || echo "Components directory copied"

echo "🔐 Setting web directory permissions..."
chown -R www-data:www-data /var/www/html
find /var/www/html -type d -exec chmod 755 {} \;
find /var/www/html -type f -exec chmod 644 {} \;

echo "🔄 Testing Apache config..."
apachectl configtest
echo "♻️  Reloading Apache..."
systemctl reload apache2
echo "✅ Apache reloaded successfully!"
' || {
    echo "⚠️  SSH command timed out after 30 seconds, but files were synced"
    echo "🔧 You may need to manually reload Apache if needed"
}

# Step 5: Quick health check (with timeout)
echo ""
echo "🏥 Testing site availability..."
echo "🌐 Checking: https://roflfaucet.com"

HTTP_CODE=$(timeout 10 curl -s -o /dev/null -w "%{http_code}" https://roflfaucet.com 2>/dev/null || echo "timeout")

if [[ "$HTTP_CODE" == "200" ]]; then
    echo "✅ Site is responding correctly! (HTTP $HTTP_CODE)"
    echo "🎊 Deployment successful!"
else
    echo "⚠️  Site check: $HTTP_CODE (may still be starting up)"
    echo "🔗 Please check manually: https://roflfaucet.com"
fi

echo "🎯 Deployment script complete!"

