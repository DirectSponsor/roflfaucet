#!/bin/bash
# ROFL Faucet Chat Server Deployment with Systemd Management
set -e  # Exit on any error

# Configuration
VPS_HOST="es7-production"
CHAT_DIR="/root/roflfaucet"
SERVICE_NAME="roflfaucet-chat"

echo "🚀 Deploying ROFL Faucet Chat Server..."

# Step 1: Sync chat server files
echo ""
echo "=== Syncing Chat Server Files ==="
echo "📁 Source: $(pwd)"
echo "📂 Target: $VPS_HOST:$CHAT_DIR/"

timeout 60 rsync -avz --progress \
  --include='chat-server-advanced.js' \
  --include='roflfaucet-chat.service' \
  --include='package.json' \
  --exclude='*' \
  . $VPS_HOST:$CHAT_DIR/ || {
    echo "⚠️  Rsync timed out or failed"
    exit 1
}

echo "✅ Chat server files synced!"

# Step 2: Setup systemd service and restart
echo ""
echo "=== Setting up Systemd Service ==="

timeout 60 ssh $VPS_HOST "cd /root/roflfaucet && 
echo '📦 Installing dependencies if needed...' && 
if [ ! -d 'node_modules' ] || [ ! -f 'node_modules/.installed' ]; then npm install && touch node_modules/.installed; fi && 
echo '🛑 Stopping existing chat processes...' && 
systemctl stop roflfaucet-chat 2>/dev/null || true && 
pkill -f 'chat-server-advanced.js' || true && 
sleep 2 && 
echo '📋 Installing systemd service...' && 
cp roflfaucet-chat.service /etc/systemd/system/ && 
systemctl daemon-reload && 
systemctl enable roflfaucet-chat && 
echo '▶️  Starting chat service...' && 
systemctl start roflfaucet-chat && 
echo '📊 Service status:' && 
systemctl status roflfaucet-chat --no-pager || true" || {
    echo "⚠️  SSH deployment command failed"
    exit 1
}

# Step 3: Health check
echo ""
echo "=== Health Check ==="
sleep 3  # Give service time to start

ssh $VPS_HOST "
if systemctl is-active --quiet $SERVICE_NAME; then
    echo '✅ Chat service is running!'
    echo '📝 Recent logs:'
    journalctl -u $SERVICE_NAME --no-pager -n 5
else
    echo '❌ Chat service failed to start'
    echo '📝 Error logs:'
    journalctl -u $SERVICE_NAME --no-pager -n 10
    exit 1
fi
"

echo ""
echo "🎉 Chat server deployment complete!"
echo ""
echo "📋 Management commands:"
echo "  Status:  ssh $VPS_HOST 'systemctl status $SERVICE_NAME'"
echo "  Logs:    ssh $VPS_HOST 'journalctl -u $SERVICE_NAME -f'"
echo "  Restart: ssh $VPS_HOST 'systemctl restart $SERVICE_NAME'"
echo "  Stop:    ssh $VPS_HOST 'systemctl stop $SERVICE_NAME'"
