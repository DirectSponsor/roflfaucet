#!/bin/bash

# ROFLBot Deployment Script for Orange Pi 5
# ==========================================
# Copies the Python bot to the Orange Pi and restarts it via PM2.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ORANGE_PI_HOST="orangepi5"
REMOTE_PATH="/home/andy/roflbot"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_FILE="$(dirname "$SCRIPT_DIR")/roflbot/roflbot_http.py"

echo -e "${BLUE}🤖 ROFLBot — Deploy to Orange Pi 5${NC}"
echo ""

# Check local file exists
if [ ! -f "$LOCAL_FILE" ]; then
    echo -e "${RED}❌ Not found: $LOCAL_FILE${NC}"
    exit 1
fi

# Check connection
echo -e "${YELLOW}� Connecting to $ORANGE_PI_HOST...${NC}"
if ! ssh -o ConnectTimeout=5 "$ORANGE_PI_HOST" "echo ok" &>/dev/null; then
    echo -e "${RED}❌ Cannot reach $ORANGE_PI_HOST${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Connected${NC}"

# Copy file
echo -e "${YELLOW}📦 Copying roflbot_http.py...${NC}"
scp "$LOCAL_FILE" "$ORANGE_PI_HOST:$REMOTE_PATH/roflbot_http.py"
echo -e "${GREEN}✅ Copied${NC}"

# Restart via PM2
echo -e "${YELLOW}� Restarting roflbot via PM2...${NC}"
ssh "$ORANGE_PI_HOST" "pm2 restart roflbot && pm2 save"
echo -e "${GREEN}✅ Restarted${NC}"

# Show status + recent logs
echo ""
ssh "$ORANGE_PI_HOST" "pm2 status roflbot"
echo ""
echo -e "${YELLOW}� Recent logs:${NC}"
ssh "$ORANGE_PI_HOST" "pm2 logs roflbot --lines 10 --nostream"
echo ""
echo -e "${BLUE}🎉 Done! ROFLBot is running at $ORANGE_PI_HOST:$REMOTE_PATH${NC}"