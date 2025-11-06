#!/bin/bash

# ROFLFAUCET - File Change Detection Script
# Checks timestamps of all tracked files and reports what's changed

PROJECT_DIR="/home/andy/warp/projects/roflfaucet"
TIMESTAMP_FILE="$PROJECT_DIR/.file-timestamps"
CHANGES_LOG="$PROJECT_DIR/.recent-changes.log"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📊 ROFLFAUCET - File Change Detection${NC}"
echo "Scanning for modified files..."
echo "----------------------------------------"

# Function to get file modification timestamp
get_file_timestamp() {
    if [ -f "$PROJECT_DIR/$1" ]; then
        # Linux/GNU stat
        stat -c %Y "$PROJECT_DIR/$1" 2>/dev/null || \
        # macOS stat  
        stat -f %m "$PROJECT_DIR/$1" 2>/dev/null || \
        echo "0"
    else
        echo "0"
    fi
}

# Function to convert timestamp to readable format
timestamp_to_date() {
    date -d "@$1" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || \
    date -r "$1" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || \
    echo "unknown"
}

# Initialize changes log
echo "# Recent Changes - $(date)" > "$CHANGES_LOG"
echo "# Files that have been modified since last check" >> "$CHANGES_LOG"
echo "" >> "$CHANGES_LOG"

changed_files=0
new_files=0

# Read current timestamp file and check each file
while IFS='|' read -r filename stored_timestamp size last_checked || [ -n "$filename" ]; do
    # Skip comments and empty lines
    [[ "$filename" =~ ^#.*$ ]] || [[ -z "$filename" ]] && continue
    
    current_timestamp=$(get_file_timestamp "$filename")
    
    if [ -f "$PROJECT_DIR/$filename" ]; then
        if [ "$stored_timestamp" = "unknown" ]; then
            echo -e "${GREEN}📄 NEW: $filename${NC}"
            echo "NEW|$filename|$(timestamp_to_date $current_timestamp)" >> "$CHANGES_LOG"
            ((new_files++))
        elif [ "$current_timestamp" != "$stored_timestamp" ]; then
            echo -e "${YELLOW}📝 CHANGED: $filename${NC}"
            echo "   Previous: $(timestamp_to_date $stored_timestamp)"
            echo "   Current:  $(timestamp_to_date $current_timestamp)"
            echo "CHANGED|$filename|$(timestamp_to_date $current_timestamp)|$(timestamp_to_date $stored_timestamp)" >> "$CHANGES_LOG"
            ((changed_files++))
        fi
    else
        if [ "$stored_timestamp" != "unknown" ]; then
            echo -e "${RED}❌ DELETED: $filename${NC}"
            echo "DELETED|$filename|was $(timestamp_to_date $stored_timestamp)" >> "$CHANGES_LOG"
        fi
    fi
done < "$TIMESTAMP_FILE"

echo "----------------------------------------"
echo -e "${BLUE}📈 Summary:${NC}"
echo "  New files: $new_files"
echo "  Changed files: $changed_files"
echo ""

if [ $((changed_files + new_files)) -gt 0 ]; then
    echo -e "${YELLOW}💡 Suggested Actions:${NC}"
    echo "1. Run: 'Process my notes and check what's changed'"
    echo "2. AI will read only the modified files"
    echo "3. Context will be updated efficiently"
    echo ""
    echo -e "${GREEN}✓ Changes logged to: .recent-changes.log${NC}"
else
    echo -e "${GREEN}✓ No changes detected${NC}"
fi