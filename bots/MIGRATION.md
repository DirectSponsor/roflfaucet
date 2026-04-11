# Bot Migration: WebSocket to HTTP Polling

## Overview

Both **Anzar Rainbot** and **ROFLBot** have been successfully migrated from WebSocket-based chat (wss://roflfaucet.com:8082/chat) to HTTP polling using the new PHP API.

## What Changed

### API Migration

**Old System (WebSocket)**
- Connected via: `wss://roflfaucet.com:8082/chat`
- Real-time bidirectional communication
- WebSocket server no longer available

**New System (HTTP Polling)**
- API Endpoint: `https://roflfaucet.com/api/simple-chat.php`
- GET requests to fetch messages: `?action=get_messages&room=general`
- POST requests to send messages with user credentials
- Messages filtered by timestamp (client-side) to avoid reprocessing
- Polling interval: 3 seconds (matching web client behavior)

### File Changes

#### Anzar Rainbot (`anzar/`)
- **anzar-rainbot.js**: Updated HTTP request handling
  - Increased timeout from 10s to 15s for Orange Pi network conditions
  - Added explicit socket timeout event handler
  - Keep-alive connections for better stability
  - Improved error recovery and logging

#### ROFLBot (`roflbot/`)
- **http-roflbot.js**: Enhanced polling implementation
  - Same timeout improvements as Anzar
  - Emergency brake system to prevent response spam during issues
  - Activity-aware greeting system for new visitors
  - Rate limiting per user (30-minute cooldown after interaction)

- **start-http-roflbot.js**: New startup script
  - Proper initialization of HTTP polling
  - Health monitoring and status reporting
  - Graceful shutdown handling

### Activity-Based Chat Throttling

To address the chattiness issue when traffic is low, both bots now include intelligent response limitations:

#### Anzar Rainbot
- **Announcements**: Only 25% chance to announce per hour (configurable via `announceChance`)
- **Rain warnings**: Only sent 10 minutes before rain if:
  - Chat has been active (6+ messages in last hour)
  - Admin hasn't been warned in the last 30 minutes
- **Low-fund messages**: Only sent if chat is active (silent rain skip if chat is quiet)

**Configuration in start-anzar-rainbot.js:**
```javascript
announceChance: 0.25,  // 25% chance per hour
```

#### ROFLBot
- **Greeting system**: Only greets new visitors 60% of the time
- **General chat**: Only 5% chance to join random conversation (reduced from 20%)
- **Per-user cooldown**: Won't respond to same user more than once per 30 minutes
- **Rate limiting**: Max 3 responses per minute across all users
- **Emergency brake**: Auto-stops responding if >8 messages in 60 seconds detected

**Configuration in http-roflbot.js:**
```javascript
greetingCooldown: 30 * 60 * 1000,          // 30 minutes before re-greeting user
userInteractionCooldown: 30 * 60 * 1000,   // 30 minutes cooldown after interaction
maxResponsesPerMinute: 3,                  // Max 3 responses per minute
emergencyBrakeThreshold: 8,                // Trigger at 8 responses in window
```

## Deployment

### Files Deployed to Orange Pi

All files are deployed to `/home/andy/roflbot/` on the Orange Pi:

```
/home/andy/roflbot/
├── anzar-rainbot.js          (updated with improved HTTP)
├── http-roflbot.js            (updated with improved HTTP)
├── start-anzar-rainbot.js     (existing, uses HTTP API)
├── start-http-roflbot.js      (new, HTTP polling startup)
├── ai-service-router.js       (unchanged)
├── roflbot-knowledge.js       (unchanged)
└── package.json               (unchanged)
```

### PM2 Process Management

Both bots are managed via PM2:

```bash
# Check status
pm2 list

# View logs
pm2 logs anzar
pm2 logs roflbot-http

# Restart
pm2 restart anzar roflbot-http

# Stop
pm2 stop anzar roflbot-http
```

## How It Works Now

### Message Processing Flow

1. **Poll API** (every 3 seconds)
   - GET request to fetch all recent messages
   - Server returns: `{ success: true, messages: [...], online_count: N, current_timestamp: ... }`

2. **Filter New Messages**
   - Client-side timestamp tracking prevents reprocessing
   - Each bot maintains `lastMessageTimestamp` to identify new messages only

3. **Process Message**
   - Extract metadata (username, message content, type)
   - Detect special message types (tip, rain) via `message.type` and `message.metadata`
   - Apply deduplication (by message ID or content hash)

4. **Generate Response** (if applicable)
   - Check response rate limiting
   - Check user interaction cooldowns
   - Generate AI response (if AI services available)
   - Send via POST to API

5. **Send Message**
   - POST to API with: `{ action: 'send_message', user_id, username, room, message }`
   - Server acknowledges receipt

### Activity-Based Behavior

**Anzar Rainbot Activity Detection:**
```javascript
// Tracks message timestamps in last hour
recentMessages = [timestamp1, timestamp2, ...]

// Only warns about low funds if there's been chat activity
if (recentMessageCount >= 6) {
    // Send warning 10 minutes before rain
}
```

**ROFLBot Activity Detection:**
```javascript
// New visitors: only greet 60% of the time
if (userRecentMessages.length <= 1) {
    return Math.random() < 0.6;  // 60% chance
}

// General chat: very low chance (5%)
return Math.random() < 0.05;  // 5% chance
```

## Monitoring

### Check Bot Health

```bash
# Watch logs in real-time
ssh orangepi5 "tail -f ~/.pm2/logs/anzar-out.log"
ssh orangepi5 "tail -f ~/.pm2/logs/roflbot-http-out.log"

# Check for errors
ssh orangepi5 "tail ~/.pm2/logs/anzar-error.log"
ssh orangepi5 "tail ~/.pm2/logs/roflbot-http-error.log"
```

### Expected Log Output

**Anzar (healthy):**
```
📨 Received 5 new messages
💬 andytest2: some message here
💧 Added 1 coins to rainpool from message by andytest2
📊 Status - Running: true, Balance: 42, Next Rain: 20:30
```

**ROFLBot (healthy):**
```
👥 Online users: 3
📨 Received 2 new messages
🤖 Generated response (Google Gemini): ...
💬 ROFLBot [general]: Response text here
```

### Signs of Issues

- `🚨 Polling error: Request timeout` - Network connectivity issue
- `🚨 Max reconnection attempts reached` - API unavailable or persistent network issue
- `⚠️ Failed to generate AI response` - AI service failure (expected if API keys invalid)

## Configuration

### Anzar Rainbot Options

Edit `start-anzar-rainbot.js` to adjust:

```javascript
const rainbotOptions = {
    // API settings
    chatApiUrl: 'https://roflfaucet.com/api/simple-chat.php',
    pollInterval: 3000,        // 3 seconds
    maxRetries: 15,            // Attempts before giving up
    
    // Bot identity
    username: 'Anzar',
    userId: 'anzar',
    
    // Rain configuration
    rainMinute: 30,            // Rain at X:30 every hour
    minRainAmount: 20,         // Minimum coins needed to rain
    maxRainAmount: 100,        // Cap rain at this amount
    coinsPerMessage: 1,        // 1 coin per message to rainpool
    rainCooldown: 3600000,     // 1 hour between rains
    announceChance: 0.25,      // 25% chance to announce per hour
};
```

### ROFLBot Options

Edit `start-http-roflbot.js` to adjust:

```javascript
const botOptions = {
    // API settings
    chatApiUrl: 'https://roflfaucet.com/api/simple-chat.php',
    pollInterval: 3000,        // 3 seconds
    maxRetries: 15,
};

// In http-roflbot.js constructor:
this.greetingCooldown = 30 * 60 * 1000;        // 30 min before re-greeting
this.userInteractionCooldown = 30 * 60 * 1000; // 30 min after interaction
this.maxResponsesPerMinute = 3;                // Rate limit
this.emergencyBrakeThreshold = 8;              // Spam detection threshold
```

## Troubleshooting

### Bots Stop Responding

**Problem:** Bots show "online" but no responses to messages

**Solutions:**
1. Check Orange Pi connectivity: `ssh orangepi5 "curl https://roflfaucet.com/api/simple-chat.php"`
2. Check logs for errors: `pm2 logs anzar`
3. Restart bots: `pm2 restart anzar roflbot-http`

### Too Many Messages (Spam)

**Problem:** Bots responding too frequently even in low-activity chat

**Solutions:**
1. Reduce `announceChance` for Anzar (default 0.25 = 25% per hour)
2. Reduce `maxResponsesPerMinute` for ROFLBot (default 3, try 1-2)
3. Increase `userInteractionCooldown` (default 30 min, try 60 min)

### Not Enough Activity Detection

**Problem:** Bots not responding even when chat is active

**Solutions:**
1. Check `recentMessageCount` thresholds in Anzar (currently 6 min for warnings)
2. Increase `greetingCooldown` to allow more frequent greetings
3. Increase general chat response chance from 5% (in `shouldRespond()`)

## Technical Details

### HTTP Request Timeouts

Both bots now use **15-second timeouts** for API requests (increased from 10s) to accommodate:
- Orange Pi's slower network
- HTTPS/TLS handshake overhead
- Potential server delays

```javascript
const options = {
    timeout: 15000,  // 15 seconds
    headers: {
        'Connection': 'keep-alive'
    }
};
```

### Message Deduplication

Three-layer deduplication prevents processing the same message multiple times:

1. **Timestamp-based**: `message.timestamp > lastMessageTimestamp`
2. **ID-based**: Check `message.id` in `processedMessages` Set
3. **Content-based**: Hash of `username:message` content

## Future Improvements

### Planned
1. **Database Storage**: Cache bot state (balance, last rain time) in database
2. **Admin Commands**: Add `/admin` commands for runtime configuration changes
3. **Metrics Dashboard**: Track messages processed, responses sent, AI service performance
4. **Adaptive Throttling**: Adjust response rates based on online user count
5. **Message Persistence**: Log all messages for analytics and debugging

### Experimental / Early Work
1. **ROFLBot AI Relay Integration**: Early experimental work only
   - The current AI service wiring was exploratory and should be treated as unfinished
   - Gemini was tested experimentally and is now disabled because the free tier is too limited for chat usage
   - The current setup should not be considered production-ready or relied on for consistent answers
   - Any future AI relay approach needs proper design work around prompts, rate limits, moderation, fallbacks, and cost
   - See `GEMINI-STATUS.md` for the current status of the Gemini experiment

## References

- API Endpoint: `https://roflfaucet.com/api/simple-chat.php`
- Notification API: `https://roflfaucet.com/api/simple-notifications.php`
- Orange Pi SSH: `ssh orangepi5`
- PM2 Docs: `pm2 --help`
