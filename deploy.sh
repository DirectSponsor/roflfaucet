#!/bin/bash

# ROFLFaucet Deployment Script
# Safe deployment with data separation and backup rotation
# Updated: 2025-10-12

set -e  # Exit on any error

# Configuration
REMOTE_HOST="es7-roflfaucet"
REMOTE_PATH="/var/www/html"
LOCAL_PATH="$(pwd)"
BACKUP_DIR="$HOME/backups/roflfaucet-deploys"
REMOTE_BACKUP_DIR="/home/roflfaucet-backups/deploy-backup-$(date +%Y%m%d-%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
    exit 1
}

# Pre-deployment checks
pre_deploy_checks() {
    log "Running pre-deployment checks..."
    
    # Check if we're in the right directory
    if [[ ! -f "index.html" ]] || [[ ! -d "api" ]]; then
        error "Not in ROFLFaucet site directory. Please run from /home/andy/work/projects/roflfaucet (parent directory)"
    fi
    
    # Check server connectivity
    if ! ssh "$REMOTE_HOST" "echo 'Connection test'" >/dev/null 2>&1; then
        error "Cannot connect to $REMOTE_HOST"
    fi
    
    # Check critical files exist
    local critical_files=("api/coins-balance.php" "api/project-donations-api.php" "main.css")
    for file in "${critical_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            error "Critical file missing: $file"
        fi
    done
    
    success "Pre-deployment checks passed"
}

# Create local backup with rotation
create_local_backup() {
    log "Creating local backup..."
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="$BACKUP_DIR/roflfaucet-local-$timestamp.tar.gz"
    
    # Create backup archive
    tar -czf "$backup_file" \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='*.tmp' \
        --exclude='*.log' \
        --exclude='deploy.sh' \
        -C "$(dirname "$LOCAL_PATH")" \
        "$(basename "$LOCAL_PATH")"
    
    success "Local backup created: $backup_file"
    
    # Backup rotation - keep 6 most recent
    log "Rotating local backups (keeping 6 most recent)..."
    cd "$BACKUP_DIR"
    ls -t roflfaucet-local-*.tar.gz | tail -n +7 | xargs -r rm -f
    
    # Daily backup retention (keep one per day for longer)
    local today=$(date +%Y%m%d)
    local daily_backup="$BACKUP_DIR/roflfaucet-daily-$today.tar.gz"
    
    # If no daily backup exists for today, create one
    if [[ ! -f "$daily_backup" ]]; then
        cp "$backup_file" "$daily_backup"
        success "Daily backup created: $daily_backup"
        
        # Rotate daily backups (keep 30 days)
        ls -t roflfaucet-daily-*.tar.gz | tail -n +31 | xargs -r rm -f
    fi
    
    cd "$LOCAL_PATH"
}

# Create remote backup before deployment
create_remote_backup() {
    log "Creating remote backup..."
    
    ssh "$REMOTE_HOST" "
        if [ -d '$REMOTE_PATH' ]; then
            tar -czf '$REMOTE_BACKUP_DIR.tar.gz' -C '$(dirname "$REMOTE_PATH")' '$(basename "$REMOTE_PATH")' 2>/dev/null || true
            echo 'Remote backup created: $REMOTE_BACKUP_DIR.tar.gz'
        else
            echo 'No remote directory to backup'
        fi
    "
    
    success "Remote backup completed"
}

# Deploy files to remote server
deploy_files() {
    log "Deploying files to $REMOTE_HOST:$REMOTE_PATH..."
    
    # Rsync with careful exclusions - --delete is safe now that LOCAL_PATH points to site/ directory
    # Deletes server files that don't exist in local site/ directory (prevents old file buildup)
    rsync -avz --delete \
        --exclude='.git/' \
        --exclude='node_modules/' \
        --exclude='*.tmp' \
        --exclude='*.log' \
        --exclude='deploy.sh' \
        --exclude='.DS_Store' \
        --exclude='Thumbs.db' \
        --progress \
        "$LOCAL_PATH/" "$REMOTE_HOST:$REMOTE_PATH/"
    
    success "Files deployed successfully"
}

# Fix permissions on remote server
fix_permissions() {
    log "Fixing file permissions on remote server..."
    
    ssh "$REMOTE_HOST" "
        # Set proper ownership
        sudo chown -R www-data:www-data '$REMOTE_PATH'
        
        # Set directory permissions
        find '$REMOTE_PATH' -type d -exec chmod 755 {} \;
        
        # Set file permissions
        find '$REMOTE_PATH' -type f -exec chmod 644 {} \;
        
        # Make specific files executable if needed
        if [ -f '$REMOTE_PATH/api/webhook.php' ]; then
            chmod 644 '$REMOTE_PATH/api/webhook.php'
        fi
        
        echo 'Permissions fixed'
    "
    
    success "Permissions updated"
}

# Post-deployment verification
verify_deployment() {
    log "Verifying deployment..."
    
    # Check if main page loads
    if curl -s -o /dev/null -w "%{http_code}" "https://roflfaucet.com/" | grep -q "200"; then
        success "Main page responding correctly"
    else
        warning "Main page may have issues - check manually"
    fi
    
    # Check if API endpoints respond
    if curl -s -o /dev/null -w "%{http_code}" "https://roflfaucet.com/api/coins-balance.php" | grep -q "400\|405\|200"; then
        success "Balance API responding correctly"
    else
        warning "Balance API may have issues - check manually"
    fi
    
    success "Deployment verification completed"
}

# Cleanup old remote backups
cleanup_remote_backups() {
    log "Cleaning up old remote backups..."
    
    ssh "$REMOTE_HOST" "
        # Keep only last 3 remote deploy backups
        cd /home/roflfaucet-backups
        ls -t deploy-backup-*.tar.gz 2>/dev/null | tail -n +4 | xargs -r rm -f || true
        echo 'Remote backup cleanup completed'
    "
}

# Rollback function (in case of issues)
rollback() {
    error "Deployment failed! Use this command to rollback:"
    echo "ssh $REMOTE_HOST \"sudo tar -xzf $REMOTE_BACKUP_DIR.tar.gz -C $(dirname "$REMOTE_PATH")\""
}

# Change to site directory and update LOCAL_PATH
cd "$(dirname "$0")/site" || error "Cannot find site directory"
LOCAL_PATH="$(pwd)"  # Update LOCAL_PATH to point to site directory after cd
# Main deployment process
main() {
    log "🚀 Starting ROFLFaucet deployment..."
    echo "Local: $LOCAL_PATH"
    echo "Remote: $REMOTE_HOST:$REMOTE_PATH"
    echo ""
    
    # Ask for confirmation
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Deployment cancelled"
        exit 0
    fi
    
    # Run deployment steps
    trap rollback ERR  # Show rollback info on error
    
    pre_deploy_checks
    create_local_backup
    create_remote_backup
    deploy_files
    fix_permissions
    verify_deployment
    cleanup_remote_backups
    
    success "🎉 Deployment completed successfully!"
    log "Local backup: $BACKUP_DIR"
    log "Remote backup: $REMOTE_HOST:$REMOTE_BACKUP_DIR.tar.gz"
    log ""
    log "Site: https://roflfaucet.com/"
    log "Test: Make a small donation to verify everything works"
}

# Run main function
main "$@"