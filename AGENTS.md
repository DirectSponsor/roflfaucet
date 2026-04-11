# ROFLFaucet - AI Agent Guide

This file documents important system information for AI agents working on ROFLFaucet.

## Project Overview

**ROFLFaucet** is a faucet and gaming site where players earn UselessCoins for charity. The site combines browser-based games, Lightning Network payments, and a social chat system.

- **Live Site**: [roflfaucet.com](https://roflfaucet.com/)
- **Tech Stack**: PHP/Apache, file-based storage, Lightning Network integration
- **Data Directory**: `/var/roflfaucet-data/` (user data, separate from site code)
- **Web Root**: `/home/andy/work/projects/roflfaucet/site/`

## Key Systems

### Bots (Active Automation)
- **Location**: `/home/andy/work/projects/roflfaucet/bots/`
- **Anzar Rainbot**: Distributes hourly rain events, collects coins from messages/tips
  - Python version deployed ✅
  - Runs via PM2 on Orange Pi 5
  - File: `/home/andy/roflbot/anzar_rainbot.py`
- **ROFLBot**: Philosophical chat bot, responds to user queries
  - Python version deployed ✅
  - Runs via PM2 on Orange Pi 5
  - File: `/home/andy/roflbot/roflbot_http.py`

**Bot Details**:
- Both use HTTP polling (no dependencies beyond Python stdlib)
- Located on Orange Pi 5 (local network)
- Managed via PM2: `pm2 status` to check
- Chat API endpoint: `https://roflfaucet.com/api/simple-chat.php`

### Chat System
- **API**: RESTful HTTP polling (no WebSocket)
- **Endpoint**: `/api/simple-chat.php`
- **Features**: Real-time messaging, tips, rain events, user balance tracking

### Content Management
- **Include System**: Uses special HTML comments for auto-updated content
  - Format: `<!-- include file.html -->` and `<!-- end include file.html -->`
  - Updated via `build.sh` script to maintain consistency across pages
- **Build Script**: `/home/andy/work/projects/roflfaucet/build.sh`

### Changelog Tracking
- **Location**: `/home/andy/work/projects/roflfaucet/site/changelog.html`
- **Format**: Embeds dynamic entries in `<!-- EMBED:changelog -->` block
- **Instructions**: See CHANGELOG-INSTRUCTIONS.md or bottom of this file

## Important Rules

1. **Data Protection**: User data in `/var/roflfaucet-data/` must never be exposed or accidentally committed
2. **Build Process**: After content changes, run `build.sh` to update included files
3. **Deployment**: Use `deploy.sh` for proper permission handling during deployment
4. **Changelog**: Update `/home/andy/work/projects/roflfaucet/site/changelog.html` after significant work

## Changelog Instructions

**File**: `/home/andy/work/projects/roflfaucet/site/changelog.html`

After completing significant work, prepend a new entry to the changelog:

```html
<!-- EMBED:changelog -->
<ul>
  <li><strong>YYYY-MM-DD</strong> · ROFLFaucet — Description of what changed and why</li>
  ... existing entries ...
</ul>
<!-- /EMBED:changelog -->
```

**What counts as significant**:
- New features or UI changes
- Bug fixes with user-visible impact
- System/config changes
- Bot migrations or integrations
- Breaking changes (mark clearly)

**What to skip**:
- Typo fixes
- Minor refactors
- Work-in-progress

**Rules**:
- One entry per task/session
- Write for non-technical readers
- Keep entries to one line
- Most recent at top
- Never remove old entries

## Quick Reference

### Common Commands

```bash
# Check bots status
ssh orangepi5 "pm2 status"

# View bot logs
ssh orangepi5 "pm2 logs anzar"
ssh orangepi5 "pm2 logs roflbot"

# Restart a bot
ssh orangepi5 "pm2 restart anzar"

# Build and deploy changes
./build.sh      # Update included files
./deploy.sh     # Deploy with correct permissions
```

### Project Directories

| Path | Purpose |
|------|---------|
| `/home/andy/work/projects/roflfaucet/site/` | Web root (HTML, PHP, assets) |
| `/home/andy/work/projects/roflfaucet/bots/` | Bot source code (archived) |
| `/home/andy/work/projects/roflfaucet/docs/` | Documentation |
| `/var/roflfaucet-data/` | Live user data (not in repo) |
| `/home/andy/roflbot/` | Running bot instances on Orange Pi |

### Important Files

- `build.sh` - Updates included content across pages
- `deploy.sh` - Handles deployment with permissions
- `site/changelog.html` - Public changelog (update after work)
- `site/api/simple-chat.php` - Chat API endpoint
- `AGENTS.md` - This file (agent guide)

## Recent Changes (Bot Migration - April 2026)

**Both bots migrated from Node.js to Python** to eliminate dependency issues and prepare for ChatGPT integration.

- **Anzar Rainbot**: 460-line Python version, handles rain distribution and coin collection
- **ROFLBot**: 575-line Python version, philosophical chat responses with context awareness
- **Status**: Both running stably on Orange Pi 5, processing messages normally
- **Next**: Monitor for 24+ hours then remove Node.js

See `site/changelog.html` for full change history.
