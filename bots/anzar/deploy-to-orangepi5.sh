#!/bin/bash

# ROFLBot Deployment Script for Orange Pi 5 (Debian 12)
# =====================================================
# Deploys ROFLBot from your development machine to orangepi5.local

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

echo -e "${BLUE}🤖 ROFLBot Orange Pi 5 Deployment Script${NC}"
echo -e "${BLUE}=========================================${NC}"
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

# Check if .env file exists locally
if [ ! -f "$LOCAL_PATH/.env" ]; then
    echo -e "${RED}❌ .env file not found at $LOCAL_PATH/.env${NC}"
    echo "Please create your .env file first:"
    echo "   cd $LOCAL_PATH"
    echo "   cp .env.example .env"
    echo "   nano .env  # Add your API keys"
    exit 1
fi

echo -e "${YELLOW}🔐 Checking API keys in .env file...${NC}"
# Check for uncommented placeholder values only
if grep -E "^[^#]*your_.*_key_here" "$LOCAL_PATH/.env" > /dev/null; then
    echo -e "${RED}❌ Please configure your API keys in .env file${NC}"
    echo "Found placeholder values. Edit $LOCAL_PATH/.env and add real API keys."
    exit 1
fi
echo -e "${GREEN}✅ API keys appear to be configured${NC}"
echo ""

# Create remote directory
echo -e "${YELLOW}📁 Creating remote directory structure...${NC}"
ssh $ORANGE_PI_HOST "mkdir -p $REMOTE_PATH/logs"
echo -e "${GREEN}✅ Remote directories created${NC}"
echo ""

# Copy files to Orange Pi
echo -e "${YELLOW}📦 Copying ROFLBot files to Orange Pi 5...${NC}"
scp -r "$LOCAL_PATH"/* $ORANGE_PI_HOST:$REMOTE_PATH/
echo -e "${GREEN}✅ Files copied successfully${NC}"
echo ""

# Install dependencies and PM2
echo -e "${YELLOW}📚 Installing dependencies on Orange Pi 5...${NC}"
ssh $ORANGE_PI_HOST "cd $REMOTE_PATH && npm install"

echo -e "${YELLOW}🔧 Installing PM2 globally...${NC}"
ssh $ORANGE_PI_HOST "sudo npm install -g pm2"
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Create PM2 ecosystem config for Orange Pi
echo -e "${YELLOW}⚙️  Creating PM2 configuration for Orange Pi 5...${NC}"
cat > /tmp/orangepi-ecosystem.config.js << 'EOF'
module.exports = {
    apps: [{
        name: 'roflbot',
        script: './start-roflbot.js',
        instances: 1,
        exec_mode: 'fork',
        autorestart: true,
        watch: false,
        max_memory_restart: '200M',  // Orange Pi 5 has plenty of RAM
        env: {
            NODE_ENV: 'production',
            LOW_POWER_MODE: 'false'  // Orange Pi 5 is powerful enough
        },
        env_production: {
            NODE_ENV: 'production'
        },
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        error_file: './logs/roflbot-error.log',
        out_file: './logs/roflbot-out.log',
        log_file: './logs/roflbot-combined.log',
        merge_logs: true,
        
        // Orange Pi 5 optimizations (generous since it has good specs)
        node_args: '--max_old_space_size=256',
        min_uptime: '10s',
        max_restarts: 10,
        
        // Daily restart at 4 AM to prevent any memory leaks
        cron_restart: '0 4 * * *'
    }]
};
EOF

scp /tmp/orangepi-ecosystem.config.js $ORANGE_PI_HOST:$REMOTE_PATH/ecosystem.config.js
rm /tmp/orangepi-ecosystem.config.js
echo -e "${GREEN}✅ PM2 configuration created${NC}"
echo ""

# Stop any existing ROFLBot instance
echo -e "${YELLOW}🛑 Stopping any existing ROFLBot instance...${NC}"
ssh $ORANGE_PI_HOST "cd $REMOTE_PATH && pm2 stop roflbot 2>/dev/null || echo 'No existing instance found'"
ssh $ORANGE_PI_HOST "cd $REMOTE_PATH && pm2 delete roflbot 2>/dev/null || echo 'Nothing to delete'"
echo ""

# Start ROFLBot
echo -e "${YELLOW}🚀 Starting ROFLBot on Orange Pi 5...${NC}"
ssh $ORANGE_PI_HOST "cd $REMOTE_PATH && pm2 start ecosystem.config.js --env production"

# Save PM2 process list and setup startup script
echo -e "${YELLOW}💾 Saving PM2 configuration and setting up auto-start...${NC}"
ssh $ORANGE_PI_HOST "pm2 save && pm2 startup | tail -1 | sudo bash || echo 'PM2 startup already configured'"
echo -e "${GREEN}✅ ROFLBot configured to start automatically on boot${NC}"
echo ""

# Check status
echo -e "${YELLOW}📊 Checking ROFLBot status...${NC}"
ssh $ORANGE_PI_HOST "cd $REMOTE_PATH && pm2 status roflbot"
echo ""

# Show recent logs
echo -e "${YELLOW}📝 Recent ROFLBot logs:${NC}"
ssh $ORANGE_PI_HOST "cd $REMOTE_PATH && pm2 logs roflbot --lines 10 --nostream"
echo ""

# Create useful management scripts on Orange Pi
echo -e "${YELLOW}🔧 Creating management scripts...${NC}"

# Create status check script
ssh $ORANGE_PI_HOST "cat > $REMOTE_PATH/status.sh << 'SCRIPT_END'
#!/bin/bash
echo '🤖 ROFLBot Status on Orange Pi 5'
echo '================================='
echo ''
echo '📊 Process Status:'
pm2 status roflbot
echo ''
echo '💾 Memory Usage:'
free -h
echo ''
echo '💽 Disk Usage:'
df -h /home
echo ''
echo '🌡️  Temperature:'
if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
    temp=\$(cat /sys/class/thermal/thermal_zone0/temp)
    temp_c=\$((temp/1000))
    echo \"CPU: \${temp_c}°C\"
else
    echo 'Temperature monitoring not available'
fi
echo ''
echo '📝 Recent Logs (last 20 lines):'
pm2 logs roflbot --lines 20 --nostream
SCRIPT_END"

# Create restart script
ssh $ORANGE_PI_HOST "cat > $REMOTE_PATH/restart.sh << 'SCRIPT_END'
#!/bin/bash
echo '🔄 Restarting ROFLBot...'
pm2 restart roflbot
echo '✅ ROFLBot restarted'
pm2 logs roflbot --lines 5 --nostream
SCRIPT_END"

# Create update script
ssh $ORANGE_PI_HOST "cat > $REMOTE_PATH/update.sh << 'SCRIPT_END'
#!/bin/bash
echo '📦 Updating ROFLBot from development machine...'
echo 'Note: Run this script from your main computer:'
echo ''
echo 'cd /home/andy/warp/projects/roflfaucet/ai-chatbot'
echo './deploy-to-orangepi5.sh'
echo ''
echo 'This will automatically:'
echo '- Copy latest code'
echo '- Install any new dependencies' 
echo '- Restart ROFLBot'
SCRIPT_END"

# Make scripts executable
ssh $ORANGE_PI_HOST "chmod +x $REMOTE_PATH/*.sh"

echo -e "${GREEN}✅ Management scripts created${NC}"
echo ""

# Final setup verification
echo -e "${BLUE}🎉 ROFLBot Deployment Complete!${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo -e "${GREEN}✅ ROFLBot is now running on your Orange Pi 5${NC}"
echo ""
echo -e "${YELLOW}📡 Connection Details:${NC}"
echo "   Host: orangepi5.local"
echo "   User: andy"
echo "   Path: /home/andy/roflbot"
echo ""
echo -e "${YELLOW}🛠️  Management Commands (run from Orange Pi):${NC}"
echo "   ssh orangepi5"
echo "   cd /home/andy/roflbot"
echo "   ./status.sh          # Check status and logs"
echo "   ./restart.sh         # Restart ROFLBot"
echo "   pm2 logs roflbot     # View live logs"
echo "   pm2 monit           # Resource monitoring"
echo ""
echo -e "${YELLOW}🔄 To Update ROFLBot (run from this computer):${NC}"
echo "   cd /home/andy/warp/projects/roflfaucet/ai-chatbot"
echo "   ./deploy-to-orangepi5.sh"
echo ""
echo -e "${YELLOW}📊 Current Status:${NC}"
ssh $ORANGE_PI_HOST "cd $REMOTE_PATH && pm2 status roflbot | grep -E '(roflbot|online|stopped)' || echo 'Checking status...'"
echo ""
echo -e "${GREEN}🎮 ROFLBot should now be active in your ROFLFaucet chat!${NC}"
echo -e "${GREEN}Try mentioning '@ROFLBot' or asking a question in chat.${NC}"
echo ""

# Optional: Test WebSocket connection if chat server details are available
echo -e "${YELLOW}💡 Next Steps:${NC}"
echo "1. Check your ROFLFaucet chat to see ROFLBot online"
echo "2. Test by mentioning 'ROFLBot hello' in chat"
echo "3. Try asking 'how do I claim from faucet?' "
echo "4. Send a tip to ROFLBot to see balance tracking"
echo ""
echo -e "${BLUE}Deployment completed successfully! 🚀${NC}"