# BOT QUICK REFERENCE

## Status Check
```bash
ssh orangepi5 "pm2 list | grep -E 'anzar|roflbot'"
```

Expected output:
```
│ 1  │ anzar           │ ... │ online │
│ 0  │ roflbot-http    │ ... │ online │
```

## View Logs (Real-time)
```bash
ssh orangepi5 "pm2 logs anzar"       # Anzar Rainbot
ssh orangepi5 "pm2 logs roflbot-http"  # ROFLBot
```

## View Logs (Last 50 lines)
```bash
ssh orangepi5 "tail -50 ~/.pm2/logs/anzar-out.log"
ssh orangepi5 "tail -50 ~/.pm2/logs/roflbot-http-out.log"
```

## Restart Bots
```bash
ssh orangepi5 "pm2 restart anzar roflbot-http"
```

## Stop Bots
```bash
ssh orangepi5 "pm2 stop anzar roflbot-http"
```

## Start Bots
```bash
ssh orangepi5 "pm2 start anzar roflbot-http"
```

## Health Check
All healthy if you see:
- Anzar: `📨 Received N new messages` and `💧 Added X coins`
- ROFLBot: `👥 Online users:` and no repeated error messages

## Common Issues

### "Request timeout" errors
- This is normal on initial startup, should resolve after 1-2 minutes
- If persistent, check: `ssh orangepi5 "curl https://roflfaucet.com/api/simple-chat.php"`

### Bots offline but status shows "online"
- Restart: `pm2 restart anzar roflbot-http`
- Check logs: `pm2 logs anzar` or `pm2 logs roflbot-http`

### Bots too chatty
**Anzar:**
Edit `/home/andy/roflbot/start-anzar-rainbot.js`, change:
```javascript
announceChance: 0.25,  // Lower to 0.1 or 0.05 for quieter
```

**ROFLBot:**
Edit `/home/andy/roflbot/http-roflbot.js`, change:
```javascript
this.maxResponsesPerMinute = 3;  // Lower to 1 for quieter
```

Then restart: `pm2 restart anzar roflbot-http`

## Important Files

| File | Purpose |
|------|---------|
| `/home/andy/roflbot/anzar-rainbot.js` | Anzar main logic |
| `/home/andy/roflbot/start-anzar-rainbot.js` | Anzar startup & config |
| `/home/andy/roflbot/http-roflbot.js` | ROFLBot main logic |
| `/home/andy/roflbot/start-http-roflbot.js` | ROFLBot startup & config |

## Deployment

### After code changes on local machine:
```bash
# Copy file to Orange Pi
scp /home/andy/work/projects/roflfaucet/bots/anzar/anzar-rainbot.js orangepi5:/home/andy/roflbot/

# Restart the bot
ssh orangepi5 "pm2 restart anzar"
```

### Same for ROFLBot:
```bash
scp /home/andy/work/projects/roflfaucet/bots/roflbot/http-roflbot.js orangepi5:/home/andy/roflbot/
ssh orangepi5 "pm2 restart roflbot-http"
```

## Monitoring Dashboard
Get a quick status snapshot:
```bash
ssh orangepi5 "echo '=== Bots ===' && pm2 list && echo '' && echo '=== Anzar Log ===' && tail -5 ~/.pm2/logs/anzar-out.log && echo '' && echo '=== ROFLBot Log ===' && tail -5 ~/.pm2/logs/roflbot-http-out.log"
```

## Emergency: Restart Everything
```bash
ssh orangepi5 "pm2 restart all"
```

## Emergency: Full Reset
```bash
ssh orangepi5
pm2 stop anzar roflbot-http
sleep 2
pm2 start anzar roflbot-http
```

## Testing Bots in Chat
- Mention Anzar: `@Anzar are you there?`
- Mention ROFLBot: `@ROFLBot hello`
- Ask for help: `help` or `how do I...`

---

**For detailed info:** See `MIGRATION.md` and `README.md`
