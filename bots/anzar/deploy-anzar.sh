#!/bin/bash

# Anzar Rainbot Deployment Script for Orange Pi 5
# ================================================
# Deploys Anzar Rainbot from your development machine to orangepi5.local

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ORANGE_PI_HOST="orangepi5"
REMOTE_USER="andy"
REMOTE_PATH="/home/andy/roflbot"
LOCAL_PATH="/home/andy/warp/projects/roflfaucet/ai-chatbot"

echo -e "${BLUE}🌧️ Anzar Rainbot Orange Pi 5 Deployment Script${NC}"
echo -e "${BLUE}===============================================${NC}"
echo ""

# Check if we can connect to Orange Pi
echo -e "${YELLOW}📡 Testing connection to Orange Pi 5...${NC}"
if ! ssh -o ConnectTimeout=5 $ORANGE_PI_HOST "echo 'Connection successful'"; then
    echo -e "${RED}❌ Cannot connect to Orange Pi 5. Please check:${NC}"
    echo "   - Orange Pi is powered on and connected to network"
    echo "   - SSH service is running"
    echo "   - orangepi5.local resolves (try: ping orangepi5.local)"
    exit 1
fi
echo -e "${GREEN}✅ Connection successful${NC}"
echo ""

# Check if Anzar files exist locally
if [ ! -f "$LOCAL_PATH/anzar-rainbot.js" ]; then
    echo -e "${RED}❌ anzar-rainbot.js not found at $LOCAL_PATH/anzar-rainbot.js${NC}"
    echo "Please ensure you're in the correct directory with Anzar files."
    exit 1
fi

if [ ! -f "$LOCAL_PATH/start-anzar-rainbot.js" ]; then
    echo -e "${RED}❌ start-anzar-rainbot.js not found at $LOCAL_PATH/start-anzar-rainbot.js${NC}"
    echo "Please ensure you're in the correct directory with Anzar files."
    exit 1
fi

echo -e "${GREEN}✅ Anzar files found locally${NC}"
echo ""

# Create remote directory if it doesn't exist
echo -e "${YELLOW}📁 Ensuring remote directory exists...${NC}"
ssh $ORANGE_PI_HOST "mkdir -p $REMOTE_PATH/logs"
echo -e "${GREEN}✅ Remote directory ready${NC}"
echo ""

# Stop existing Anzar instance
echo -e "${YELLOW}🛑 Stopping existing Anzar instance...${NC}"
ssh $ORANGE_PI_HOST "cd $REMOTE_PATH && pm2 stop anzar 2>/dev/null || echo 'No existing Anzar instance found'"
echo ""

# Copy Anzar files to Orange Pi
echo -e "${YELLOW}📦 Copying Anzar files to Orange Pi 5...${NC}"
scp "$LOCAL_PATH/anzar-rainbot.js" $ORANGE_PI_HOST:$REMOTE_PATH/
scp "$LOCAL_PATH/start-anzar-rainbot.js" $ORANGE_PI_HOST:$REMOTE_PATH/

# Copy package.json if it exists (for dependencies)
if [ -f "$LOCAL_PATH/package.json" ]; then
    scp "$LOCAL_PATH/package.json" $ORANGE_PI_HOST:$REMOTE_PATH/
fi

echo -e "${GREEN}✅ Anzar files copied successfully${NC}"
echo ""

# Install dependencies if package.json exists
echo -e "${YELLOW}📚 Installing/updating dependencies...${NC}"
ssh $ORANGE_PI_HOST "cd $REMOTE_PATH && npm install 2>/dev/null || echo 'No package.json found, skipping npm install'"
echo -e "${GREEN}✅ Dependencies handled${NC}"
echo ""

# Start Anzar with PM2
echo -e "${YELLOW}🌧️ Starting Anzar Rainbot...${NC}"
ssh $ORANGE_PI_HOST "cd $REMOTE_PATH && pm2 start start-anzar-rainbot.js --name anzar"
echo -e "${GREEN}✅ Anzar Rainbot started${NC}"
echo ""

# Save PM2 process list
echo -e "${YELLOW}💾 Saving PM2 configuration...${NC}"
ssh $ORANGE_PI_HOST "pm2 save"
echo -e "${GREEN}✅ Configuration saved${NC}"
echo ""

# Check Anzar status
echo -e "${YELLOW}📊 Checking Anzar status...${NC}"
ssh $ORANGE_PI_HOST "cd $REMOTE_PATH && pm2 status anzar"
echo ""

# Show recent logs
echo -e "${YELLOW}📝 Recent Anzar logs:${NC}"
ssh $ORANGE_PI_HOST "cd $REMOTE_PATH && pm2 logs anzar --lines 10 --nostream"
echo ""

# Create Anzar management scripts if they don't exist
echo -e "${YELLOW}🔧 Creating Anzar management scripts...${NC}"

# Create Anzar status script
ssh $ORANGE_PI_HOST "cat > $REMOTE_PATH/anzar-status.sh << 'SCRIPT_END'
#!/bin/bash
echo '🌧️ Anzar Rainbot Status on Orange Pi 5'
echo '====================================='
echo ''
echo '📊 Process Status:'
pm2 status anzar
echo ''
echo '📝 Recent Logs (last 20 lines):'
pm2 logs anzar --lines 20 --nostream
echo ''
echo '🌧️ Next rain scheduled for: XX:30'
echo ''
echo '💡 Management Commands:'
echo '  pm2 restart anzar  # Restart Anzar'
echo '  pm2 logs anzar     # View live logs'  
echo '  pm2 stop anzar     # Stop Anzar'
SCRIPT_END"

# Create Anzar restart script
ssh $ORANGE_PI_HOST "cat > $REMOTE_PATH/anzar-restart.sh << 'SCRIPT_END'
#!/bin/bash
echo '🔄 Restarting Anzar Rainbot...'
pm2 restart anzar
echo '✅ Anzar restarted'
pm2 logs anzar --lines 5 --nostream
SCRIPT_END"

# Make scripts executable
ssh $ORANGE_PI_HOST "chmod +x $REMOTE_PATH/anzar-*.sh"

echo -e "${GREEN}✅ Anzar management scripts created${NC}"
echo ""

# Final status
echo -e "${BLUE}🎉 Anzar Rainbot Deployment Complete!${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo -e "${GREEN}✅ Anzar is now running on your Orange Pi 5${NC}"
echo ""
echo -e "${YELLOW}📡 Connection Details:${NC}"
echo "   Host: orangepi5.local"
echo "   User: andy"
echo "   Path: /home/andy/roflbot"
echo ""
echo -e "${YELLOW}🛠️  Anzar Management Commands (run from Orange Pi):${NC}"
echo "   ssh orangepi5"
echo "   cd /home/andy/roflbot"
echo "   ./anzar-status.sh       # Check Anzar status and logs"
echo "   ./anzar-restart.sh      # Restart Anzar"
echo "   pm2 logs anzar          # View live logs"
echo "   pm2 status anzar        # Quick status check"
echo ""
echo -e "${YELLOW}🔄 To Update Anzar (run from this computer):${NC}"
echo "   cd /home/andy/warp/projects/roflfaucet/ai-chatbot"
echo "   ./deploy-anzar.sh"
echo ""
echo -e "${YELLOW}📊 Current Status:${NC}"
ssh $ORANGE_PI_HOST "cd $REMOTE_PATH && pm2 status anzar | grep -E '(anzar|online|stopped)' || echo 'Checking status...'"
echo ""
echo -e "${GREEN}🌧️ Anzar should now be collecting coins and sending rain at :30 past each hour!${NC}"
echo -e "${GREEN}💰 Try sending messages in chat and tipping Anzar to build the rainpool.${NC}"
echo ""
echo -e "${BLUE}Deployment completed successfully! 🚀${NC}"