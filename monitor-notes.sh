#!/bin/bash

# ROFLFAUCET - Notes Monitor Script
# Watches aa-new-issues-requests for changes and alerts when new content is added

NOTES_FILE="/home/andy/warp/projects/roflfaucet/aa-new-issues-requests"
LAST_SIZE_FILE="/home/andy/warp/projects/roflfaucet/.notes-last-size"
TODO_FILE="/home/andy/warp/projects/roflfaucet/TODO.md"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📝 ROFLFAUCET Notes Monitor${NC}"
echo "Watching: $NOTES_FILE"
echo "Press Ctrl+C to stop monitoring"
echo "----------------------------------------"

# Function to get file size
get_file_size() {
    if [ -f "$1" ]; then
        stat -f%z "$1" 2>/dev/null || stat -c%s "$1" 2>/dev/null || wc -c < "$1"
    else
        echo "0"
    fi
}

# Function to get last recorded size
get_last_size() {
    if [ -f "$LAST_SIZE_FILE" ]; then
        cat "$LAST_SIZE_FILE"
    else
        echo "0"
    fi
}

# Function to save current size
save_current_size() {
    echo "$1" > "$LAST_SIZE_FILE"
}

# Function to show new content
show_new_content() {
    local last_size=$1
    local current_size=$2
    
    if [ "$current_size" -gt "$last_size" ]; then
        echo -e "${GREEN}📋 NEW CONTENT DETECTED!${NC}"
        echo -e "${YELLOW}Size changed: $last_size → $current_size bytes${NC}"
        echo "----------------------------------------"
        
        # Show the new content (everything after the last recorded size)
        if [ "$last_size" -gt 0 ]; then
            tail -c +$((last_size + 1)) "$NOTES_FILE" | head -20
        else
            echo "File created or first run - showing last 10 lines:"
            tail -10 "$NOTES_FILE"
        fi
        
        echo "----------------------------------------"
        echo -e "${BLUE}💡 Next steps:${NC}"
        echo "1. Run Warp AI to process these notes"
        echo "2. Updates will be made to $TODO_FILE"
        echo "3. Relevant documentation will be updated"
        echo ""
    fi
}

# Initialize if first run
if [ ! -f "$LAST_SIZE_FILE" ]; then
    initial_size=$(get_file_size "$NOTES_FILE")
    save_current_size "$initial_size"
    echo -e "${GREEN}✓ Initialized monitoring (file size: $initial_size bytes)${NC}"
fi

# Monitor loop
while true; do
    if [ -f "$NOTES_FILE" ]; then
        current_size=$(get_file_size "$NOTES_FILE")
        last_size=$(get_last_size)
        
        if [ "$current_size" -ne "$last_size" ]; then
            show_new_content "$last_size" "$current_size"
            save_current_size "$current_size"
            
            # Optional: Play a notification sound (uncomment if desired)
            # echo -e "\a"
            
            # Optional: Send desktop notification (uncomment if desired)
            # notify-send "ROFLFAUCET" "New notes detected! Check terminal for details."
        fi
    else
        echo -e "${RED}⚠️  Notes file not found: $NOTES_FILE${NC}"
    fi
    
    sleep 5  # Check every 5 seconds
done