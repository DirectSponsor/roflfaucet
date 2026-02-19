#!/bin/bash

# ROFLFaucet Comprehensive Backup Script
# Backs up entire /var directory to both backup servers
# Destinations: servarica1 (primary), dr4 (secondary/DR)
#
# SSH config required on ES7 (/root/.ssh/config):
#   Host backup-server   -> 209.209.10.41 port 5829 warp key
#   Host backup-server-2 -> 198.23.194.19 port 22   warp key

set -uo pipefail

SOURCE_DIR="/var/"
BACKUP_HOST="backup-server"
BACKUP_HOST2="backup-server-2"
BACKUP_DIR="/backup/es7/daily/"
LOG_DIR="/var/log/backups"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/comprehensive-backup-$DATE.log"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

mkdir -p "$LOG_DIR"

log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $message" | tee -a "$LOG_FILE"
}

log_colored() {
    local color="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${color}[$timestamp] $message${NC}"
    echo "[$timestamp] $message" >> "$LOG_FILE"
}

log_colored "$BLUE" "=========================================="
log_colored "$BLUE" "ROFLFaucet Comprehensive Backup Starting"
log_colored "$BLUE" "=========================================="

if [ ! -d "$SOURCE_DIR" ]; then
    log_colored "$RED" "ERROR: Source directory $SOURCE_DIR does not exist!"
    exit 1
fi

SOURCE_SIZE=$(du -sh "$SOURCE_DIR" 2>/dev/null | cut -f1 || echo "unknown")
log_message "Source size: $SOURCE_SIZE"

BACKUP_TIMESTAMP_DIR="${BACKUP_DIR}${DATE}"
RSYNC_OPTIONS="-az --exclude=/var/run --exclude=/var/lock --exclude=/var/tmp"

backup_to_host() {
    local host="$1"
    log_colored "$YELLOW" "Testing SSH connection to ${host}..."
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$host" "echo ok" > /dev/null 2>&1; then
        log_colored "$RED" "SSH connection to ${host} failed!"
        return 1
    fi
    log_colored "$GREEN" "Connected to ${host}"

    ssh "$host" "mkdir -p ${BACKUP_TIMESTAMP_DIR}" 2>/dev/null
    rsync $RSYNC_OPTIONS -e "ssh" "$SOURCE_DIR" "${host}:${BACKUP_TIMESTAMP_DIR}" >> "$LOG_FILE" 2>&1
    local rc=$?
    if [ $rc -eq 0 ]; then
        log_colored "$GREEN" "[OK] rsync to ${host} succeeded"
        ssh "$host" "find ${BACKUP_DIR} -maxdepth 1 -type d -name '202*' -mtime +30 -exec rm -rf {} \;" 2>/dev/null
        log_colored "$GREEN" "[OK] Old backups pruned on ${host}"
    else
        log_colored "$RED" "[FAIL] rsync to ${host} failed (exit ${rc})"
        return 1
    fi
    return 0
}

STATUS1="FAILED"
STATUS2="FAILED"

backup_to_host "$BACKUP_HOST"  && STATUS1="OK"
backup_to_host "$BACKUP_HOST2" && STATUS2="OK"

log_colored "$BLUE" "=========================================="
log_colored "$BLUE" "Backup Summary"
log_colored "$BLUE" "=========================================="
log_message "Date:        $(date)"
log_message "Source:      $SOURCE_DIR ($SOURCE_SIZE)"
log_message "servarica1:  $STATUS1"
log_message "dr4:         $STATUS2"
log_message "Log:         $LOG_FILE"

if [ "$STATUS1" = "OK" ] || [ "$STATUS2" = "OK" ]; then
    log_colored "$GREEN" "Backup complete (at least one destination succeeded)"
    exit 0
else
    log_colored "$RED" "Backup FAILED on all destinations"
    exit 1
fi