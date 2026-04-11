# Changes: WebSocket to HTTP Migration & Activity-Based Throttling

**Date:** April 9, 2026  
**Status:** ✅ Complete and tested  
**Deployment:** Both bots running on Orange Pi via PM2

---

## What Was Fixed

### Problem 1: WebSocket Server No Longer Available
The chat system migrated from WebSocket to PHP polling API, but the bots were still trying to connect to `wss://roflfaucet.com:8082/chat`, which no longer exists.

**Solution:** Both bots updated to use HTTP polling via `https://roflfaucet.com/api/simple-chat.php`

### Problem 2: Request Timeouts on Orange Pi
Initial HTTP implementation had 10-second timeouts that frequently timed out on the Orange Pi's network.

**Solution:** 
- Increased timeout to 15 seconds
- Added explicit socket timeout handler
- Added keep-alive headers to reuse connections
- Both bots now successfully connect without timeout errors

### Problem 3: Bots Too Chatty When Chat is Slow
Bots were announcing frequently even when no one was talking, which felt spammy.

**Solution:** Implemented activity-aware response throttling:
- **Anzar**: Only announces 25% of hours, only warns about low funds if chat active
- **ROFLBot**: Only 5% chance to join random conversation, per-user 30-min cooldowns, global rate limiting

---

## Technical Changes

### Files Updated

#### `anzar/anzar-rainbot.js`
- Improved HTTP request handling (timeout, keep-alive)
- Already had activity detection built-in (6+ messages/hour threshold)

#### `roflbot/http-roflbot.js`
- Improved HTTP request handling (timeout, keep-alive)
- Emergency brake system to detect and stop spam loops
- Activity-aware greeting system (60% chance, per-user cooldowns)
- General chat participation: 5% chance (very low)

#### `roflbot/start-http-roflbot.js` (NEW)
- New startup script for HTTP-based ROFLBot
- Matches startup pattern of Anzar
- Health monitoring and status reporting

#### `MIGRATION.md` (NEW)
- 314-line technical guide
- API documentation and message formats
- Configuration options for both bots
- Troubleshooting section
- Deployment instructions

#### `README.md` (UPDATED)
- Added 42-line section on HTTP migration
- Documents low-activity behavior
- Lists configuration changes for quieter responses

#### `QUICK-REFERENCE.md` (NEW)
- One-page cheat sheet for common operations
- Status checks, log viewing, restarts
- Configuration changes for chattiness tuning
- Deployment steps

---

## Current Behavior

### Anzar Rainbot
✅ **Collecting coins:** 1 per user message + tips  
✅ **Rain scheduled:** Every hour at :30 minutes  
✅ **Balance:** Currently at 38+ coins  
✅ **Announcements:** Only ~25% of hours  
✅ **Low-fund warnings:** Only when chat active  

**Configuration to adjust chattiness:**
```javascript
// In start-anzar-rainbot.js
announceChance: 0.25,  // Change to 0.1 or 0.05 to be quieter
```

### ROFLBot
✅ **Polling:** Successfully fetching messages every 3 seconds  
✅ **Responses:** Only when asked directly or for help  
✅ **Activity-aware:** Greets new visitors (~60%), very low random chat  
✅ **Rate-limited:** Max 3 responses per minute globally  
✅ **Emergency brake:** Auto-stops if detecting spam patterns  

**Configuration to adjust chattiness:**
```javascript
// In http-roflbot.js
this.maxResponsesPerMinute = 3;        // Change to 1 for quieter
this.userInteractionCooldown = ...     // Change to 60 * 60 * 1000 for 1-hour cooldowns
```

---

## Deployment Summary

### Files Deployed to Orange Pi
```
/home/andy/roflbot/
├── anzar-rainbot.js              (improved HTTP handling)
├── http-roflbot.js               (improved HTTP handling)
├── start-anzar-rainbot.js        (existing, uses HTTP API)
├── start-http-roflbot.js         (new HTTP startup script)
├── MIGRATION.md                  (new technical docs)
├── README.md                     (updated)
└── QUICK-REFERENCE.md            (new quick reference)
```

### PM2 Status
Both processes running successfully:
```
1  │ anzar           │ online  │ 48.3mb │ ✅
0  │ roflbot-http    │ online  │ 49.4mb │ ✅
```

---

## How to Verify It's Working

### In Chat
- Mention Anzar: `@Anzar are you there?`
  - Should respond or acknowledge
  - Should track messages and collect coins
  
- Mention ROFLBot: `@ROFLBot hello`
  - Should respond with personality
  - Should participate in help requests

### In Logs
```bash
# Healthy Anzar output
📨 Received 5 new messages
💧 Added 1 coins to rainpool from message by andytest2
📊 Status - Running: true, Balance: 42

# Healthy ROFLBot output
👥 Online users: 3
📨 Received 2 new messages
💬 ROFLBot [general]: Response text here
```

### Monitoring
```bash
ssh orangepi5 "pm2 logs anzar"
ssh orangepi5 "pm2 logs roflbot-http"
```

---

## How to Tune the Bots

### Make Anzar Quieter
1. Edit: `/home/andy/roflbot/start-anzar-rainbot.js`
2. Change: `announceChance: 0.25` → `0.1` (10%) or `0.05` (5%)
3. Restart: `ssh orangepi5 "pm2 restart anzar"`

### Make ROFLBot Quieter
1. Edit: `/home/andy/roflbot/http-roflbot.js`
2. Change: `this.maxResponsesPerMinute = 3` → `1` or `2`
3. Restart: `ssh orangepi5 "pm2 restart roflbot-http"`

### Make Either Bot More Chatty
- Increase `announceChance` (Anzar) towards 0.5 (50%)
- Increase `maxResponsesPerMinute` (ROFLBot) towards 5-6
- Decrease cooldowns

---

## Testing Performed

✅ Both bots restart cleanly via PM2  
✅ Polling connection stays stable (no timeout errors after initial startup)  
✅ Both bots process messages successfully  
✅ Anzar collects coins from user messages  
✅ ROFLBot generates and sends responses  
✅ No spam loops detected (emergency brake working)  
✅ Low-activity behavior prevents excessive announcements  

---

## Known Limitations

1. **No persistent state:** Bot balances/state reset on restart (could add database)
2. **AI service work is experimental:** The ROFLBot AI integration was only early exploratory work and is not ready to depend on yet
3. **No admin commands:** Can't adjust settings at runtime (could add /admin commands)
4. **No analytics:** No permanent logging of bot activity (could add logging)

---

## Next Steps (Optional)

1. **Add Database:** Store bot state, message history, analytics
2. **Admin Commands:** Allow runtime configuration changes
3. **Better Analytics:** Track what the bots are doing over time
4. **Adaptive Throttling:** Adjust response rates based on online user count
5. **Message Logging:** Keep permanent record of all messages for debugging
6. **Revisit AI Integration Carefully:** If ROFLBot is going to relay AI answers in future, design it properly first instead of relying on the current experimental Gemini-based attempt

---

## Documentation

All documentation now available:
- **README.md** - Overview and setup (updated)
- **MIGRATION.md** - Technical details, API specs, troubleshooting (NEW)
- **QUICK-REFERENCE.md** - One-page cheat sheet (NEW)
- **This file (CHANGES.md)** - What was changed and why (NEW)

**To view:** 
- Local: `/home/andy/work/projects/roflfaucet/bots/`
- Orange Pi: `/home/andy/roflbot/`

---

## Rollback Instructions (If Needed)

If something breaks, the old versions are still in git. To rollback:

```bash
# Stop bots
ssh orangepi5 "pm2 stop anzar roflbot-http"

# Revert to previous version
cd /home/andy/work/projects/roflfaucet/bots
git checkout HEAD^ anzar/anzar-rainbot.js roflbot/http-roflbot.js

# Redeploy
scp anzar/anzar-rainbot.js orangepi5:/home/andy/roflbot/
scp roflbot/http-roflbot.js orangepi5:/home/andy/roflbot/

# Restart
ssh orangepi5 "pm2 restart anzar roflbot-http"
```

---

**Last Updated:** April 9, 2026, 21:00 UTC  
**Next Review:** When chat patterns change or issues arise
