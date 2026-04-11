# Python Bot Conversion Checklist

Use this checklist when converting a new bot from Node.js to Python.

---

## Pre-Conversion (Analysis Phase)

- [ ] Identify the Node.js bot to convert (e.g., `http-roflbot.js`)
- [ ] Review current functionality:
  - [ ] What API endpoints does it call?
  - [ ] What data does it manage internally?
  - [ ] What external libraries does it use?
  - [ ] What environment variables does it need?
- [ ] Document all phrases, responses, or configuration
- [ ] Check current PM2 configuration for the bot
- [ ] Review error handling and logging patterns

---

## Basic Structure (Reference `anzar_rainbot.py`)

- [ ] Create new Python file: `{botname}_http.py`
- [ ] Add Python shebang: `#!/usr/bin/env python3`
- [ ] Import standard library modules:
  - [ ] `import urllib.request` (for HTTP)
  - [ ] `import json` (for parsing)
  - [ ] `import logging` (for output)
  - [ ] `import time` (for delays)
  - [ ] `import datetime` (for scheduling)
  - [ ] `from collections import deque` (if tracking activity)

---

## HTTP Requests Section

- [ ] Replace Node.js `axios` or `fetch` with `urllib`:
  ```python
  from urllib.request import urlopen, Request
  from urllib.error import URLError
  
  try:
      response = urlopen(url, timeout=15)
      data = json.load(response)
  except URLError as e:
      logging.error(f"Request failed: {e}")
  ```
- [ ] Add proper timeout handling (15 seconds recommended)
- [ ] Add keep-alive headers:
  ```python
  headers = {'Connection': 'keep-alive'}
  req = Request(url, headers=headers)
  ```
- [ ] Handle JSON parsing errors gracefully
- [ ] Add request logging/debugging

---

## Configuration & Initialization

- [ ] Replace Node.js `.env` with hardcoded values or dict:
  ```python
  CONFIG = {
      'api_url': 'https://roflfaucet.com/api/simple-chat.php',
      'poll_interval': 2,  # seconds
      'timeout': 15,
  }
  ```
- [ ] Create `__init__()` equivalent to initialize bot state
- [ ] Set up logging:
  ```python
  logging.basicConfig(
      level=logging.INFO,
      format='%(asctime)s - %(levelname)s - %(message)s'
  )
  ```
- [ ] Initialize data structures (lists, dicts, deques)

---

## Message Processing Logic

- [ ] Convert message deduplication:
  ```python
  # Node.js: messageCache.has(msg.id)
  # Python:
  if msg_id in message_cache:
      continue
  ```
- [ ] Convert phrase/response selection:
  ```python
  # Node.js: responses[Math.floor(Math.random() * responses.length)]
  # Python:
  import random
  response = random.choice(responses)
  ```
- [ ] Replace string formatting:
  ```python
  # Node.js: `Hello ${name}`
  # Python: f"Hello {name}"
  ```
- [ ] Implement filtering logic (e.g., ignore own messages):
  ```python
  if message.get('author') == 'anzar':
      continue  # Skip own messages
  ```

---

## Scheduling & Timers

- [ ] Convert `setInterval` to main loop:
  ```python
  while True:
      # Do work
      time.sleep(interval)
  ```
- [ ] Replace `setTimeout` with `time.sleep()` before action
- [ ] Implement periodic cleanup:
  ```python
  last_cleanup = time.time()
  while True:
      now = time.time()
      if now - last_cleanup > 3600:  # Every hour
          cleanup_old_entries()
          last_cleanup = now
  ```

---

## Activity Tracking (if needed)

- [ ] Use `collections.deque` for bounded tracking:
  ```python
  from collections import deque
  recent_activity = deque(maxlen=100)
  recent_activity.append(timestamp)
  ```
- [ ] Implement cleanup for old entries:
  ```python
  def cleanup_old_entries():
      cutoff = time.time() - (24 * 3600)  # 24 hours
      while recent_activity and recent_activity[0] < cutoff:
          recent_activity.popleft()
  ```

---

## Coin/Balance Management (if applicable)

- [ ] Replace object/dict structure:
  ```python
  # Node.js: users[username].coins = 100
  # Python:
  if username not in users:
      users[username] = {'coins': 0, 'last_rain': None}
  users[username]['coins'] = 100
  ```
- [ ] Implement save/restore if needed:
  ```python
  import json
  
  def save_users():
      with open('users.json', 'w') as f:
          json.dump(users, f)
  ```

---

## Error Handling

- [ ] Replace `try/catch` with `try/except`:
  ```python
  # Node.js: catch (error) {}
  # Python: except Exception as e:
  ```
- [ ] Handle specific errors:
  - [ ] `URLError` (network issues)
  - [ ] `json.JSONDecodeError` (parsing)
  - [ ] `KeyError` (missing dict keys)
  - [ ] `IndexError` (list access)
- [ ] Log errors with context
- [ ] Gracefully continue on non-fatal errors

---

## Main Function

- [ ] Create `main()` function:
  ```python
  def main():
      logging.info("Starting bot...")
      try:
          while True:
              # Main bot loop
              pass
      except KeyboardInterrupt:
          logging.info("Shutting down...")
  
  if __name__ == '__main__':
      main()
  ```

---

## Testing (Local)

- [ ] Run directly: `python3 {botname}_http.py`
- [ ] Check for immediate errors
- [ ] Verify logging output is clear
- [ ] Test API connectivity:
  ```bash
  curl 'https://roflfaucet.com/api/simple-chat.php?method=messages&after=0'
  ```
- [ ] Watch for message polling (every 2 seconds)
- [ ] Check memory usage: `top` or `ps aux | grep python`
- [ ] Press Ctrl+C and verify clean shutdown

---

## PM2 Deployment

- [ ] Make script executable:
  ```bash
  chmod +x /home/andy/roflbot/{botname}_http.py
  ```
- [ ] Stop old Node.js version (if still running):
  ```bash
  pm2 stop {botname}
  pm2 delete {botname}
  ```
- [ ] Start new Python version:
  ```bash
  pm2 start python3 --name {botname} -- /home/andy/roflbot/{botname}_http.py
  ```
- [ ] Or update `ecosystem.config.js` and restart all:
  ```bash
  pm2 restart ecosystem.config.js
  ```
- [ ] Verify it's running:
  ```bash
  pm2 status
  pm2 logs {botname}
  ```
- [ ] Save PM2 config:
  ```bash
  pm2 save
  ```

---

## Orange Pi Deployment

- [ ] Copy Python bot to Orange Pi:
  ```bash
  scp /home/andy/roflbot/{botname}_http.py orange-pi:/home/andy/roflbot/
  ```
- [ ] SSH into Orange Pi:
  ```bash
  ssh orange-pi
  ```
- [ ] Verify Python is installed:
  ```bash
  python3 --version
  ```
- [ ] Test bot on Orange Pi:
  ```bash
  cd /home/andy/roflbot
  python3 {botname}_http.py
  ```
- [ ] Monitor for at least 5 minutes (check for polling, etc.)
- [ ] Stop test run (Ctrl+C)
- [ ] Start via PM2:
  ```bash
  pm2 start python3 --name {botname} -- /home/andy/roflbot/{botname}_http.py
  pm2 save
  ```
- [ ] Monitor logs for 10+ minutes:
  ```bash
  pm2 logs {botname}
  ```

---

## Verification

- [ ] Bot appears in `pm2 status`
- [ ] Bot is sending messages to chat
- [ ] Bot is receiving/processing messages
- [ ] No error messages in `pm2 logs`
- [ ] No memory leaks (check `pm2 monit`)
- [ ] Both bots running together (Anzar + ROFLBot) without conflicts
- [ ] Bots ignore each other's messages (if configured)

---

## Cleanup (After Success)

- [ ] Delete/backup old Node.js files:
  ```bash
  # Backup first!
  tar -czf ~/old-node-bots.tar.gz /home/andy/roflbot/*-rainbot.js
  rm /home/andy/roflbot/*-rainbot.js  # Or keep as reference
  ```
- [ ] Update documentation if needed
- [ ] Verify no Node.js dependencies remain

---

## Rollback Plan (If Issues)

If the Python version has problems:

1. Stop Python version:
   ```bash
   pm2 stop {botname}
   ```

2. Restore old Node.js files:
   ```bash
   # Copy from backup if deleted
   ```

3. Start Node.js version:
   ```bash
   pm2 start /home/andy/roflbot/start-{botname}.js --name {botname}
   ```

4. Investigate issue and try again

---

## Summary

**Total Conversion Time:** ~30 minutes per bot (once you understand the pattern)

**Key Files to Reference:**
- `anzar_rainbot.py` - Working example
- `PYTHON-MIGRATION-GUIDE.md` - Detailed explanations
- Original Node.js bot file - Logic reference

**Next Bot to Convert:** ROFLBot (`roflbot_http.py`)

Good luck! The pattern is proven with Anzar.
