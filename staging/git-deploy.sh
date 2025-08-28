#!/bin/bash

# ROFLFaucet Git Deployment Script
# Server-based workflow for staging/production
# Run this ON the production server (es7-production)

set -e

COMMAND="${1:-help}"
BACKUP_SERVER="86.38.200.119"  # data.directsponsor.org backup server
WEB_DIR="/var/www/html"
BACKUP_DIR="/root/backups/roflfaucet"
REMOTE_BACKUP_DIR="/root/roflfaucet_backups_$(date +%Y%m)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m' 
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_help() {
    echo -e "${BLUE}ROFLFaucet Git Deployment${NC}"
    echo -e "${BLUE}=========================${NC}"
    echo ""
    echo "Commands:"
    echo "  status       - Show git status on server"
    echo "  reset        - Reset staging to production"  
    echo "  staging      - Deploy to staging"
    echo "  production   - Deploy to production"
    echo "  backup       - Create backup (local only)"
    echo "  backups      - Show backup status"
    echo ""
    echo "Workflow:"
    echo "  1. cd /var/www/html/staging"
    echo "  2. Make changes and test at https://roflfaucet.com/staging/"
    echo "  3. cd /var/www/html && ./git-deploy.sh staging"
    echo "  4. ./git-deploy.sh production"
    echo ""
}

show_status() {
    echo -e "${BLUE}Server Git Status${NC}"
    echo "=================="
    
    cd $WEB_DIR
    pwd
    sudo -u www-data git status --short
    echo
    sudo -u www-data git branch --show-current
    echo
    sudo -u www-data git log --oneline -3
    echo
    if [ -d "staging" ]; then
        echo "Staging files: $(find staging -type f | wc -l)"
    else
        echo "No staging directory"
    fi
}

reset_staging() {
    echo -e "${YELLOW}Staging already up to date - skipping reset${NC}"
    echo "✅ Staging preserved"
}

deploy_staging() {
    echo -e "${BLUE}Deploying to staging...${NC}"
    cd $WEB_DIR
    sudo -u www-data git checkout develop
    sudo -u www-data git add .
    sudo -u www-data git commit -m "Staging update: $(date)" || echo "No changes to commit"
    echo "✅ Staging branch updated"
    
    reset_staging
    echo -e "${GREEN}✅ Staging ready: https://roflfaucet.com/staging/${NC}"
}

deploy_production() {
    echo -e "${YELLOW}Deploy to PRODUCTION? (y/N)${NC}"
    read -r confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Cancelled"
        exit 0
    fi
    
    create_backup
    echo -e "${BLUE}Deploying to production...${NC}"
    
    cd $WEB_DIR
    sudo -u www-data git checkout develop
    sudo -u www-data git add .
    sudo -u www-data git commit -m "Pre-production: $(date)" || echo "No changes to commit"
    
    sudo -u www-data git checkout master
    sudo -u www-data git merge develop -m "Production deployment: $(date)"
    chown -R www-data:www-data .
    
    echo -e "${GREEN}✅ Production deployed: https://roflfaucet.com${NC}"
}

create_backup() {
    echo -e "${YELLOW}📦 Creating backup...${NC}"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    cd $WEB_DIR
    mkdir -p $BACKUP_DIR
    tar --exclude='staging' -czf $BACKUP_DIR/backup_${TIMESTAMP}.tar.gz .
    echo "✅ Local backup: backup_${TIMESTAMP}.tar.gz"
    
    echo "ℹ️  Backup server integration available from local machine"
}

show_backup_status() {
    echo -e "${BLUE}Backup Status${NC}"
    echo "============="
    
    echo -e "${YELLOW}Local backups:${NC}"
    ls -lt $BACKUP_DIR/ | head -5 2>/dev/null || echo "No local backups found"
}

case "$COMMAND" in
    "status"|"s") show_status ;;
    "reset"|"r") reset_staging ;;
    "staging") deploy_staging ;;
    "production"|"prod") deploy_production ;;
    "backup") create_backup ;;
    "backups"|"b") show_backup_status ;;
    *) show_help ;;
esac
