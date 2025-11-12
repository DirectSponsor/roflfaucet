#!/bin/bash
# ROFLFaucet to Hub Sync Daemon
# Watches balance and profile files and syncs changes to hub automatically

BALANCE_DIR="/var/roflfaucet-data/userdata/balances"
PROFILE_DIR="/var/roflfaucet-data/userdata/profiles"
HUB_API="https://auth.directsponsor.org/api/sync.php"
SITE_ID="roflfaucet"
LOG_FILE="/var/roflfaucet-data/logs/sync-daemon.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

sync_balance() {
    local file="$1"
    local filename=$(basename "$file")
    local user_id="${filename%.txt}"
    
    if [ ! -f "$file" ]; then
        log "ERROR: Balance file not found: $file"
        return 1
    fi
    
    local balance=$(grep -oP '"balance"\s*:\s*\K[0-9.]+' "$file" | head -1)
    
    if [ -z "$balance" ]; then
        log "ERROR: Could not read balance from $filename"
        return 1
    fi
    
    log "Syncing balance $user_id: $balance coins"
    
    response=$(curl -s -X POST "$HUB_API" \
        -H "Content-Type: application/json" \
        -d "{\"action\":\"push\",\"user_id\":\"$user_id\",\"site_id\":\"$SITE_ID\",\"data_type\":\"balance\",\"data\":{\"coins\":$balance}}")
    
    if echo "$response" | grep -q '"success":true'; then
        log "✅ Synced balance $user_id"
    else
        log "❌ Failed to sync balance $user_id: $response"
    fi
}

sync_profile() {
    local file="$1"
    local filename=$(basename "$file")
    local user_id="${filename%.txt}"
    
    if [ ! -f "$file" ]; then
        log "ERROR: Profile file not found: $file"
        return 1
    fi
    
    # Extract profile fields
    local display_name=$(grep -oP '"display_name"\s*:\s*"\K[^"]+' "$file" | head -1)
    local avatar=$(grep -oP '"avatar"\s*:\s*"\K[^"]+' "$file" | head -1)
    local bio=$(grep -oP '"bio"\s*:\s*"\K[^"]+' "$file" | head -1 | sed 's/\\\\/\\/g')
    local location=$(grep -oP '"location"\s*:\s*"\K[^"]+' "$file" | head -1)
    local website=$(grep -oP '"website"\s*:\s*"\K[^"]+' "$file" | head -1)
    
    log "Syncing profile $user_id: $display_name"
    
    # Build JSON (escape quotes in bio)
    local profile_json="{\"display_name\":\"${display_name}\",\"avatar\":\"${avatar}\",\"bio\":\"${bio}\",\"location\":\"${location}\",\"website\":\"${website}\"}"
    
    response=$(curl -s -X POST "$HUB_API" \
        -H "Content-Type: application/json" \
        -d "{\"action\":\"push\",\"user_id\":\"$user_id\",\"site_id\":\"$SITE_ID\",\"data_type\":\"profile\",\"data\":$profile_json}")
    
    if echo "$response" | grep -q '"success":true'; then
        log "✅ Synced profile $user_id"
    else
        log "❌ Failed to sync profile $user_id: $response"
    fi
}

# Initial sync of all files
log "🚀 Sync daemon starting - initial sync"

log "Syncing all balances..."
for file in "$BALANCE_DIR"/*.txt; do
    [ -f "$file" ] || continue
    [[ "$file" == *".backup"* ]] && continue
    sync_balance "$file"
done

log "Syncing all profiles..."
for file in "$PROFILE_DIR"/*.txt; do
    [ -f "$file" ] || continue
    [[ "$file" == *".backup"* ]] && continue
    sync_profile "$file"
done

log "👁️ Watching for changes in $BALANCE_DIR and $PROFILE_DIR"

# Watch both directories for changes
inotifywait -m -e close_write -e moved_to "$BALANCE_DIR" "$PROFILE_DIR" --format '%w%f' |
while read file; do
    # Skip backup files
    [[ "$file" == *".backup"* ]] && continue
    [[ "$file" == *.txt ]] || continue
    
    log "📝 Change detected: $(basename "$file")"
    
    # Determine which type of file
    if [[ "$file" == "$BALANCE_DIR"* ]]; then
        sync_balance "$file"
    elif [[ "$file" == "$PROFILE_DIR"* ]]; then
        sync_profile "$file"
    fi
done
