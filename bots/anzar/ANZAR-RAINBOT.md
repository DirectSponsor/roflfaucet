# Anzar Rainbot - Automated Rain System 🌧️

Anzar is an automated rainbot that provides scheduled rain events to ROFLFaucet users. It collects coins from user activity and tips, then redistributes them through automatic rain events.

## 🚀 Quick Start

### Local Testing
```bash
cd /home/andy/warp/projects/roflfaucet/ai-chatbot
node start-anzar-rainbot.js
```

### Orange Pi Deployment
```bash
# Deploy to Orange Pi 5
scp anzar-rainbot.js start-anzar-rainbot.js orangepi5:/home/andy/roflbot/
ssh orangepi5 "cd /home/andy/roflbot && pm2 start start-anzar-rainbot.js --name anzar"
```

## 🌧️ How It Works

### Rain Collection System
1. **Per Message**: Every user message adds 1 coin to Anzar's balance
2. **Tips**: Users can tip Anzar directly to boost the rainpool
3. **Automatic**: No manual intervention needed

### Rain Distribution
- **Schedule**: Every hour at :30 minutes (e.g., 1:30, 2:30, 3:30, etc.)
- **Amount**: Between 20-100 coins (based on available balance)
- **Recipients**: All active users in chat
- **Command**: Uses `/rain {amount}` to distribute coins

### Example Flow
```
12:25 - User messages add coins: Balance = 45 coins
12:28 - Someone tips Anzar 20 coins: Balance = 65 coins  
12:30 - RAIN TIME! Anzar sends `/rain 65`
12:31 - Balance resets to 0, starts collecting again
```

## ⚙️ Configuration

### Default Settings
```javascript
{
    rainMinute: 30,           // Rain at X:30 every hour
    minRainAmount: 20,        // Minimum coins needed to rain
    maxRainAmount: 100,       // Maximum rain amount per event
    coinsPerMessage: 1,       // Coins added per user message
    rainCooldown: 3600000,    // 1 hour between rains (ms)
    announceChance: 0.25,     // 25% chance of hourly announcement
}
```

### Environment Variables
Create `.env` file (if not exists):
```bash
NODE_ENV=production
CHAT_API_URL=https://roflfaucet.com/api/simple-chat.php
```

## 🎯 User Account Requirements

Anzar needs a proper user account in ROFLFaucet:

### Account Setup
1. **Username**: `Anzar`
2. **User ID**: `anzar` (in database)
3. **Display Name**: `🌧️ Anzar`
4. **Starting Balance**: 0 coins
5. **Permissions**: Must be able to send messages and use `/rain` command
6. **Avatar**: Weather/cloud themed image

### Verification Steps
1. Create user account in admin panel
2. Test manual login with Anzar credentials  
3. Verify `/rain` command works when logged in as Anzar
4. Grant any necessary permissions for bot operation

## 📊 Monitoring & Management

### Status Checking
```bash
# On Orange Pi
ssh orangepi5
cd /home/andy/roflbot

# Check if running
pm2 status anzar

# View logs
pm2 logs anzar

# Restart if needed
pm2 restart anzar
```

### Health Monitoring
The rainbot logs status every minute:
```
📊 Status - Running: true, Balance: 43, Next Rain: 14:30
```

### Log Output Examples
```
💬 john123: hello everyone
💧 Added 1 coins to rainpool from message by john123
💰 Received tip: 25 coins from alice456
⏰ Rain time check - initiating rain!
🌧️ Executing rain of 68 coins!
💬 Anzar [general]: /rain 68
💬 Anzar [general]: ⛈️ THE RAINS HAVE COME! 68 coins rained on active users! Next rain at XX:30! 💰
```

## 🛠️ Features

### Automatic Announcements
Anzar occasionally announces its status (25% chance per hour):
- Current rainpool balance
- Rain schedule information
- Encouragement to tip for bigger rains

### Smart Rain Logic
- **Minimum Balance Check**: Won't rain if balance < 20 coins
- **Cooldown Protection**: Prevents multiple rains per hour
- **Balance Management**: Tracks coins from messages and tips accurately
- **Error Handling**: Continues operation even if individual rain fails

### Message Processing
- **Deduplication**: Prevents processing duplicate messages
- **Command Filtering**: Ignores chat commands (messages starting with `/`)
- **Self-Message Filtering**: Doesn't process its own messages
- **Tip Detection**: Uses structured metadata for accurate tip parsing

## 🔧 Troubleshooting

### Common Issues

**Rainbot not responding:**
```bash
# Check if process is running
pm2 status anzar

# Check logs for errors
pm2 logs anzar --lines 50

# Restart if needed
pm2 restart anzar
```

**Balance not increasing:**
- Verify user messages are being processed (check logs)
- Ensure Anzar account exists and is active
- Check if message deduplication is working correctly

**Rain not happening:**
- Verify current time matches rain schedule (X:30)
- Check if balance meets minimum rain amount (20 coins)
- Ensure rain cooldown has passed (1 hour)
- Verify Anzar has permission to use `/rain` command

**Messages not sending:**
- Check Anzar user account authentication
- Verify API permissions for sending messages
- Check network connectivity to ROFLFaucet API

### Debug Mode
Enable verbose logging by modifying the startup script:
```javascript
// Add more detailed logging
console.log('🔍 Processing message from:', message.username);
console.log('🔍 Current balance:', this.botUser.balance);
```

## 📋 Deployment Checklist

### Pre-deployment
- [ ] Anzar user account created in ROFLFaucet
- [ ] Test manual login with Anzar credentials
- [ ] Verify `/rain` command works
- [ ] Environment variables configured
- [ ] Dependencies installed on Orange Pi

### Deployment
- [ ] Files copied to Orange Pi
- [ ] PM2 process started
- [ ] Initial status check shows "online"
- [ ] Test message processing (send a message, check logs)
- [ ] Test tip processing (tip Anzar, verify balance increases)

### Post-deployment
- [ ] Monitor for first scheduled rain event
- [ ] Verify rain actually distributes coins to users
- [ ] Check balance resets after rain
- [ ] Confirm message collection resumes after rain
- [ ] Set up log monitoring/alerts

## 🌟 Advanced Configuration

### Custom Rain Schedule
To change rain timing, modify the `rainMinute` option:
```javascript
rainMinute: 15, // Rain at X:15 every hour instead of X:30
```

### Adjusting Collection Rate
To change coins per message:
```javascript
coinsPerMessage: 2, // 2 coins per message instead of 1
```

### Rain Amount Limits
```javascript
minRainAmount: 50,  // Need 50 coins minimum to rain
maxRainAmount: 200, // Cap rain at 200 coins per event
```

This documentation covers the complete Anzar Rainbot system for future reference and troubleshooting.

