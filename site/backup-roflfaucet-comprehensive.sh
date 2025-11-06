#!/bin/bash

# ROFLFaucet Comprehensive Backup Script
# Backs up entire /var directory to Servarica backup server
# Future-proof: catches all data regardless of directory structure changes

# Configuration
SOURCE_DIR="/var/"
BACKUP_HOST="backup-server"  # Use SSH config alias
BACKUP_DIR="/backup/es7/daily/"
LOG_DIR="/var/log/backups"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/comprehensive-backup-$DATE.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to log messages
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $message" | tee -a "$LOG_FILE"
}

# Function to log colored messages to terminal and plain to log
log_colored() {
    local color="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Colored output to terminal
    echo -e "${color}[$timestamp] $message${NC}"
    
    # Plain output to log file
    echo "[$timestamp] $message" >> "$LOG_FILE"
}

# Start backup process
log_colored "$BLUE" "=========================================="
log_colored "$BLUE" "ROFLFaucet Comprehensive Backup Starting"
log_colored "$BLUE" "=========================================="

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    log_colored "$RED" "ERROR: Source directory $SOURCE_DIR does not exist!"
    exit 1
fi

# Test SSH connection to backup server
log_colored "$YELLOW" "Testing SSH connection to backup server..."
if ssh -o ConnectTimeout=10 -o BatchMode=yes "$BACKUP_HOST" "echo 'Connection test successful'" 2>/dev/null; then
    log_colored "$GREEN" "SSH connection test successful"
else
    log_colored "$RED" "SSH connection failed! Check backup-server SSH config."
    exit 1
fi

# Check available space on backup server
log_colored "$YELLOW" "Checking available space on backup server..."
AVAILABLE_SPACE=$(ssh "$BACKUP_HOST" "df -h /backup | tail -1 | awk '{print \$4}'" 2>/dev/null)
if [ $? -eq 0 ]; then
    log_colored "$GREEN" "Available space on backup server: $AVAILABLE_SPACE"
else
    log_colored "$YELLOW" "Could not check available space (backup will continue)"
fi

# Calculate source directory size
log_colored "$YELLOW" "Calculating source directory size..."
SOURCE_SIZE=$(du -sh "$SOURCE_DIR" 2>/dev/null | cut -f1)
if [ $? -eq 0 ]; then
    log_colored "$GREEN" "Source directory size: $SOURCE_SIZE"
else
    log_colored "$YELLOW" "Could not calculate source size"
fi

# Create timestamped backup directory name
BACKUP_TIMESTAMP_DIR="$BACKUP_DIR$DATE"

# Perform the backup with rsync
log_colored "$YELLOW" "Starting comprehensive rsync backup..."
log_colored "$BLUE" "Source: $SOURCE_DIR"
log_colored "$BLUE" "Destination: $BACKUP_HOST:$BACKUP_TIMESTAMP_DIR"

# Rsync options:
# -a: archive mode (recursive, preserves permissions, timestamps, etc.)
# -v: verbose
# -z: compress during transfer
# --progress: show progress
# --exclude: exclude problematic directories
RSYNC_OPTIONS="-avz --progress --exclude=/var/run --exclude=/var/lock --exclude=/var/tmp"

# Run rsync and capture output
rsync $RSYNC_OPTIONS -e "ssh" "$SOURCE_DIR" "$BACKUP_HOST:$BACKUP_TIMESTAMP_DIR" 2>&1 | tee -a "$LOG_FILE"
RSYNC_EXIT_CODE=${PIPESTATUS[0]}

if [ $RSYNC_EXIT_CODE -eq 0 ]; then
    BACKUP_STATUS="SUCCESS"
    log_colored "$GREEN" "✅ Backup completed successfully!"
else
    BACKUP_STATUS="FAILED"
    log_colored "$RED" "❌ Backup failed with exit code: $RSYNC_EXIT_CODE"
fi

# Verify backup if successful
if [ "$BACKUP_STATUS" = "SUCCESS" ]; then
    log_colored "$YELLOW" "Verifying backup..."
    REMOTE_FILES=$(ssh "$BACKUP_HOST" "find $BACKUP_TIMESTAMP_DIR -type f | wc -l" 2>/dev/null)
    if [ $? -eq 0 ] && [ "$REMOTE_FILES" -gt 0 ]; then
        log_colored "$GREEN" "Verification successful: $REMOTE_FILES files found on backup server"
    else
        log_colored "$YELLOW" "Could not verify backup (files may still be transferred successfully)"
    fi
fi

# Clean up old backups on backup server (keep last 30 days)
if [ "$BACKUP_STATUS" = "SUCCESS" ]; then
    log_colored "$YELLOW" "Cleaning up old backups (keeping last 30 days)..."
    ssh "$BACKUP_HOST" "find $BACKUP_DIR -maxdepth 1 -type d -name '202*' -mtime +30 -exec rm -rf {} \;" 2>/dev/null
    if [ $? -eq 0 ]; then
        log_colored "$GREEN" "Old backup cleanup completed"
    else
        log_colored "$YELLOW" "Could not clean up old backups"
    fi
fi

# Summary
log_colored "$BLUE" "=========================================="
log_colored "$BLUE" "Backup Summary"
log_colored "$BLUE" "=========================================="
log_message "Backup Date: $(date)"
log_message "Source: $SOURCE_DIR"
log_message "Destination: $BACKUP_HOST:$BACKUP_TIMESTAMP_DIR"
log_message "Source Size: $SOURCE_SIZE"
log_message "Available Space: $AVAILABLE_SPACE"
log_message "Status: $BACKUP_STATUS"
log_message "Log File: $LOG_FILE"

if [ "$BACKUP_STATUS" = "SUCCESS" ]; then
    log_colored "$GREEN" "🎉 Comprehensive backup process completed successfully!"
    exit 0
else
    log_colored "$RED" "💥 Backup process failed - check log for details"
    exit 1
fi