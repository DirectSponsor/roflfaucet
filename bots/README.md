# ROFLFaucet Bot Ecosystem 🤖

**Central hub for all ROFLFaucet bot systems and automated features**

## ⚡ Recent Change: Chat Migration to HTTP Polling
**Status:** ✅ Complete

The ROFLFaucet chat backend no longer uses the old WebSocket endpoint. Both active bots were updated to use the PHP polling API instead:

- Old chat transport: `wss://roflfaucet.com:8082/chat`
- New chat API: `https://roflfaucet.com/api/simple-chat.php`
- Polling interval: 3 seconds

### What was fixed
- Replaced WebSocket dependency with HTTP polling
- Added client-side filtering so bots only process new messages
- Improved request stability on the Orange Pi with a longer HTTP timeout
- Added keep-alive HTTP connections
- Restarted both bots under PM2 on the Orange Pi

### Current live processes
- `anzar`
- `roflbot-http`

### Low-activity chat behavior
One issue after the migration was that the bots could feel too chatty when the room was quiet. The current behavior now reduces that in a few ways:

#### Anzar
- Hourly announcements are probabilistic instead of constant
- Low-funds warnings only happen if chat has been active recently
- Rain warnings are suppressed if the room is quiet

#### ROFLBot
- General conversation participation is intentionally low
- Per-user cooldowns reduce repeated replies to the same person
- Global response-per-minute limits prevent bursts
- An emergency brake prevents runaway reply loops

### If you want them quieter later
- Lower Anzar `announceChance`
- Lower ROFLBot `maxResponsesPerMinute`
- Increase ROFLBot `userInteractionCooldown`
- Lower ROFLBot random general chat response chance in `http-roflbot.js`

See `MIGRATION.md` for the detailed technical notes and troubleshooting steps.

## 🏗️ **Bot System Architecture**

### Current Active Bots
- **Anzar Rainbot** 🌧️ - Automated rain distribution system
- **ROFLBot** 🎯 - Chat moderation and user interaction bot

### Planned/Future Bots
- **Winner Announcer** 🏆 - Celebrates big wins and achievements  
- **VIP Browser Bots** 💎 - Premium member automation (browser-based)
- **Achievement Bot** 🏅 - Tracks and announces user milestones

---

## 🌧️ **Anzar Rainbot**
**Location:** `/bots/anzar/`  
**Status:** ✅ Active on Orange Pi 5  
**Purpose:** Automated rain distribution to encourage chat activity

### Features
- **Smart Activity Detection** - Only sends warnings when chat is active (6+ messages/hour)
- **Scheduled Rains** - Every hour at :30 minutes
- **Tip Collection** - Users can tip Anzar to boost rainpool
- **Message-Based Collection** - Each user message adds 1 coin to rainpool

### Management
```bash
# Deploy updates
cd /home/andy/warp/projects/roflfaucet/bots/anzar
./deploy-anzar.sh

# Check status on Orange Pi
ssh orangepi5
cd /home/andy/roflbot
./anzar-status.sh
```

---

## 🎯 **ROFLBot**
**Location:** `/bots/roflbot/`  
**Status:** ✅ Active on Orange Pi 5  
**Purpose:** Chat moderation, user assistance, and community engagement

### Features
- **Chat Moderation** - Enforces chat rules and guidelines
- **User Assistance** - Helps with common questions
- **Game Tips** - Provides strategy advice
- **Community Interaction** - Engages users in conversation

### AI Status
- ROFLBot's AI response generation is currently **DISABLED**
- The bot will respond with philosophical/witty fallback phrases from the Hitchhiker's Guide
- Early experimental Gemini integration was attempted but proved unreliable
- Any future AI relay feature (ChatGPT, Gemini, etc.) should be a deliberate new design, not extending this experiment
- See `GEMINI-STATUS.md` and `AI-INTEGRATION-NOTES.md` for details

---

## 👼 **VIP Browser Bot System** (Planned)
**Location:** `/bots/vip-system/`  
**Status:** 🚧 Planning/Development Phase  
**Purpose:** Premium automation for VIP subscribers ($5/month)
**VIP Symbol:** 😇 Halo emoji (appears on profiles, not next to chat names)

### Concept
VIP members can run a **client-side JavaScript bot** that plays games automatically while keeping a browser tab open. This provides value to both users and the site:

#### For Users (VIP Members):
- **Automated Gameplay** - Bot plays one game continuously in browser tab
- **Passive Income** - Earn coins while away from computer (but tab stays open)
- **Customizable Strategy** - Set betting amounts, risk levels, game types
- **Session Persistence** - Works in background tabs, pauses when tab closes

#### For Site (ROFLFaucet):
- **Increased Session Duration** ⏰ - VIP members keep tabs open longer
- **More Ad Impressions** 📈 - Longer sessions = more ad revenue potential  
- **Premium Revenue** 💰 - $5/month subscription via BTC payments
- **User Engagement** 🎯 - Incentivizes staying connected to the site

### Technical Requirements
```javascript
// VIP Bot Features (Browser-based JavaScript)
- Tab visibility detection (pauses when tab not open)
- Customizable game selection (dice, slots, etc.)
- Betting strategy configuration
- Session duration tracking
- Connection status monitoring
- Automatic balance management
```

### VIP Subscription Integration
- **Payment Method:** Bitcoin via Coinos.io (primary) or BTCPay Server (future)
- **Subscription:** $5/month recurring  
- **Benefits:** 
  - Browser bot access
  - Higher faucet claims
  - 😇 Halo on profile (not in chat)
  - Priority support
  - Exclusive features

---

## 🏆 **Winner Announcer Bot** (Planned)
**Location:** `/bots/winner-announcer/`  
**Status:** 🚧 Planning Phase  
**Purpose:** Celebrate big wins and create excitement

### Features
- **Big Win Detection** - Monitors for significant wins across all games
- **Celebratory Messages** - Announces wins in chat with excitement
- **Achievement Tracking** - Celebrates milestones (1000th game, big streaks)
- **Leaderboard Updates** - Announces new high scores

### Example Messages
```
🎉 HUGE WIN! @username just won 1,247 coins on Poker Dice! 🃏💰
🏆 NEW RECORD! @username hit a 15-game winning streak on Dice! 🎲🔥
⭐ MILESTONE! @username just played their 1,000th game! 🎮🎊
```

---

## 🏅 **Achievement Bot** (Future)
**Location:** `/bots/achievement-system/`  
**Status:** 💭 Future Concept  
**Purpose:** Gamification and user retention

### Potential Features
- **Streak Tracking** - Login streaks, winning streaks, play streaks
- **Game Mastery** - Achievements for different games
- **Community Milestones** - Site-wide achievements
- **Badge System** - Visual achievement display

---

## 💰 **VIP Subscription & Payment System**

### Payment Options
1. **Coinos.io** (Primary) - Simple Lightning/Bitcoin API, "just show the QR" philosophy
2. **Manual Processing** (Alternative) - Direct Bitcoin payments
3. **BTCPay Server** (Future) - Self-hosted node when ready for complexity

### VIP Benefits Structure
```
🥉 Regular User (Free)
- Basic faucet claims
- Standard game access
- Community chat

😇 VIP Member ($5/month)
- Browser bot automation
- Higher faucet multipliers  
- Halo emoji on profile
- Priority support
- Exclusive game features
- Advanced analytics
```

---

## 📊 **Business Value: Session Duration**

### Why Browser-Based Bots Matter
**Session duration is crucial for advertising revenue:**

- **Ad Impression Volume** - Longer sessions = more ad views
- **User Engagement Metrics** - Shows active, engaged userbase
- **Premium Positioning** - Justifies higher ad rates
- **Stickiness Factor** - VIP users become long-term members

### Projected Impact
```
Regular User: ~15 minutes/session
VIP Bot User: ~2-4 hours/session (bot running)

Potential Revenue Increase:
- 8x longer session duration
- 8x more ad impressions per VIP user
- Premium subscription revenue
- Higher advertiser value proposition
```

---

## 🛠️ **Development Roadmap**

### Phase 1: Current (Complete)
- ✅ Anzar Rainbot active and optimized
- ✅ ROFLBot moderation system
- ✅ Organized bot ecosystem structure

### Phase 2: VIP System (Next)
- 🚧 Design VIP browser bot architecture (client-side JS)
- 🚧 Research and implement Coinos.io API integration
- 🚧 Create subscription management system
- 🚧 Develop browser-based bot interface with tab visibility detection

### Phase 3: Enhancement (Future)
- 💭 Winner announcer bot
- 💭 Achievement system
- 💭 Advanced analytics for VIP users
- 💭 Additional VIP perks

---

## 📁 **Directory Structure**
```
/bots/
├── README.md                 # This overview document
├── anzar/                    # Anzar Rainbot (active)
│   ├── anzar-rainbot.js
│   ├── deploy-anzar.sh
│   └── ANZAR-RAINBOT.md
├── roflbot/                  # ROFLBot system (active)  
│   ├── roflbot.js
│   ├── http-roflbot.js
│   └── README.md
├── vip-system/               # VIP browser bots (planned)
│   ├── vip-bot.js           # Browser-based automation
│   ├── payment-integration/ # BTCPay/Coinos integration
│   └── subscription-manager/# VIP subscription handling
├── winner-announcer/         # Big win celebrations (planned)
└── achievement-system/       # Future gamification (concept)
```

---

## 🚀 **Getting Started**

### For Development
```bash
cd /home/andy/warp/projects/roflfaucet/bots
# Each bot has its own README with specific instructions
```

### For Deployment
```bash
# Anzar (to Orange Pi)
cd anzar && ./deploy-anzar.sh

# ROFLBot (to Orange Pi)  
cd roflbot && ./deploy-roflbot.sh
```

---

**Last Updated:** September 24, 2025  
**Next Priority:** VIP browser bot system design and BTCPay integration