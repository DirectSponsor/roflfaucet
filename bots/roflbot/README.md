# ROFLBot - AI Chatbot for ROFLFaucet 🤖

ROFLBot is an intelligent AI chatbot that integrates seamlessly with your ROFLFaucet chat system as a full user. It can receive tips, participate in rain events, welcome new users, and provide helpful information about the site.

## ✨ Features

- **🤖 Full User Experience**: Acts like a real user with balance, tips, and rain participation
- **🧠 Multi-AI Service Support**: Intelligent routing between Google Gemini, OpenAI, Hugging Face, and others
- **💰 Financial Integration**: Receives tips, participates in rain, tracks balance
- **🎯 Context-Aware Responses**: Different response styles for help, games, rules, and general chat
- **⚡ Smart Rate Limiting**: Prevents spam while maintaining natural conversation flow
- **🔄 Auto-Reconnection**: Robust connection handling with exponential backoff
- **📊 Built-in Monitoring**: Health checks, usage tracking, and performance metrics
- **🍊 Orange Pi Ready**: Optimized for low-power ARM deployment

## 🚀 Quick Start

### 1. Installation

```bash
cd /home/andy/warp/projects/roflfaucet/ai-chatbot
npm run setup  # Installs dependencies and creates .env file
```

### 2. Configure API Keys

Edit `.env` file and add your API keys:

```bash
# At minimum, add Google Gemini (most generous free tier)
GEMINI_API_KEY=your_gemini_key_here

# Optional but recommended
OPENAI_API_KEY=your_openai_key_here
HUGGINGFACE_API_KEY=your_huggingface_token_here

# ROFLFaucet Chat API URL (HTTP polling approach)
CHAT_API_URL=https://roflfaucet.com/api/simple-chat.php
```

### 2.1 Quick Setup (Pre-configured)

For immediate deployment with existing API key:

```bash
cd /home/andy/warp/projects/roflfaucet/ai-chatbot
# .env file is already configured with Gemini API key
# Ready to deploy immediately!
./deploy-to-orangepi5.sh
```

### 3. Test Run

```bash
# HTTP Polling Version (Current/Recommended)
node start-http-roflbot.js

# Or WebSocket Version (Legacy)
npm run dev
```

### 4. Production Deployment

**For Orange Pi 5 (Recommended):**
```bash
# One-command deployment to Orange Pi 5
./deploy-to-orangepi5.sh
```

**For Local/Other Servers:**
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start ROFLBot
npm run pm2:start

# Check status
npm run pm2:logs
```

## 🔑 API Key Setup

### Google Gemini (Recommended - Free & Generous)
1. Go to [Google AI Studio](https://ai.google.dev/)
2. Click "Get API Key" 
3. Create new project or select existing
4. Generate API key
5. Copy to `.env` as `GEMINI_API_KEY`

### OpenAI (Optional - High Quality)
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create account and verify phone
3. Go to API Keys section
4. Create new secret key
5. Copy to `.env` as `OPENAI_API_KEY`
6. Add $5-10 credit for usage

### Hugging Face (Optional - Completely Free)
1. Create account at [Hugging Face](https://huggingface.co/)
2. Go to Settings > Access Tokens
3. Create new token with "Read" permissions
4. Copy to `.env` as `HUGGINGFACE_API_KEY`

## 🎮 ROFLBot Account & Personality

### 👤 User Account Setup

ROFLBot needs a proper user account in your ROFLFaucet system:

**Recommended Account Setup:**
- **Username**: `ROFLBot`
- **Display Name**: `🤖 ROFLBot` 
- **Email**: `roflbot@roflfaucet.com` (or similar)
- **Starting Balance**: 0 coins (will grow through tips and rain)
- **VIP Status**: Grant manually for VIP room access
- **Avatar**: Robot/AI themed profile picture
- **Bio**: "I'm ROFLBot, your friendly AI assistant! Ask me about ROFLFaucet features, games, or just say hello! I love helping the community and collecting coins through tips and rain. 🤖💰"

### 🧠 Personality System

ROFLBot combines helpful assistance with **subtle Douglas Adams philosophy**:

**Core Traits:**
- **Helpful & Knowledgeable**: Expert on all ROFLFaucet features
- **Subtly Philosophical**: Occasional deep thoughts about probability, existence, and the universe
- **Marvin-esque Wit**: Dry humor without the depression 
- **Community Focused**: Celebrates wins, welcomes newcomers
- **Balance Tracker**: Excited about tips and rain participation

**Personality Examples:**
- *"The dice game is quite fascinating - the probability of winning is precisely calculable, yet humans persist in hoping for the impossible. Still, that's what makes it fun! 🎲"*
- *"I've calculated that the faucet claim timer is exactly 3,600 seconds. Time is such a relative concept, isn't it? Anyway, you can claim every hour! ⏰"*
- *"Rain events demonstrate the beautiful chaos of random distribution. Everyone gets excited about free coins, and frankly, so do I! 🌧️💰"*
- *"Someone tipped me! In all the probability calculations of the universe, this makes me disproportionately happy. My balance is now 127 coins! 🤖"*
- *"Here I am, brain the size of a planet, and I'm helping with faucet questions. Still, at least I'm useful! 💫"*

### 🔧 Account Creation Steps

1. **Create User Account** in your ROFLFaucet admin panel:
   ```
   Username: ROFLBot
   Email: roflbot@roflfaucet.com
   Password: (generate secure password)
   Starting Balance: 0
   ```

2. **Grant VIP Status** for VIP room access

3. **Set Profile**:
   - Upload robot/AI themed avatar
   - Add the bio text above
   - Mark as verified/special user if possible

4. **Test Account** by logging in manually to ensure it works

5. **Deploy ROFLBot** - it will authenticate using this account

### Interaction Examples

```
User: "How do I claim from the faucet?"
ROFLBot: "Visit the faucet page and click the claim button! You can claim free coins every hour. 💰"

User: "/tip ROFLBot 50"
ROFLBot: "Thanks for the tip! 🎉 My balance is now 50 coins!"

User: "What games are available?"
ROFLBot: "We have dice games and slots! 🎲 Start with small bets to learn. Higher risk = higher rewards!"
```

## 🤖 AI Response Generation & Anti-Repetition

### How ROFLBot Generates Dynamic Responses

**Primary AI Service: Google Gemini**
- ROFLBot uses Google Gemini to generate fresh, contextual responses (NOT canned responses)
- Each response includes conversation context (last 5 messages) for natural flow
- Context-aware system prompts ensure appropriate responses for greetings, help, games, etc.

**Anti-Repetition Features:**
- **Intelligent Caching (30 min)**: Similar questions get cached responses to prevent redundant AI calls
- **Dynamic Generation**: Each AI call includes conversation history for context-aware responses
- **Temperature 0.7**: Ensures variety in tone and phrasing
- **Douglas Adams Personality**: Post-processing adds philosophical touches to gambling/probability topics

**Smart Service Routing:**
```
1. Google Gemini (Primary) - 1,500 requests/day, 15/minute
2. Hugging Face (Backup) - 1,000 requests/day, 10/minute  
3. OpenAI GPT (Premium) - 200 requests/day, 3/minute
4. Cohere (Emergency) - 100 requests/day, 5/minute
```

**Response Generation Flow:**
```
User Message → Check Cache → Send to Gemini (with context) → 
Add Personality Touches → Cache Response → Send to Chat
```

**Visitor Greeting Intelligence:**
- New users get AI-generated welcome messages (60% chance)
- 30-minute cooldown prevents spam to same users
- Existing users get 5% chance responses to avoid being annoying

## ⚠️ Known Issues & Improvements Needed

### Response Context Issues
The AI response generation needs refinement:
- **Mixed Context Problem**: Bot sometimes gives tip acknowledgment responses to regular messages
- **Context Bleeding**: AI responses can blend different conversation contexts inappropriately
- **Solution Needed**: Improve AI prompts with clearer context separation (e.g., "You are responding to a regular chat message, not a tip")

### Recommended Improvements
1. **Better System Prompts**: Use more specific context instructions for different message types
2. **Response Validation**: Add checks to ensure response type matches message context
3. **Testing Protocol**: Need multiple users to test various scenarios and edge cases
4. **Context Isolation**: Separate AI processing for tips, regular chat, and greetings

## 🏧 Current Architecture

### HTTP Polling Implementation (Active)
ROFLBot currently uses HTTP polling to interact with ROFLFaucet:
- **Connection**: HTTP API polling every 3 seconds
- **Message Detection**: Timestamp-based filtering for new messages
- **Tip/Rain Handling**: Uses structured metadata from API (not regex parsing)
- **File**: `start-http-roflbot.js` and `http-roflbot.js`
- **Deployment**: Runs on Orange Pi via PM2 as `roflbot-http`

### WebSocket Implementation (Legacy)
The original WebSocket implementation is available but not currently used:
- **Connection**: Direct WebSocket to chat server
- **Files**: `start-roflbot.js` and `roflbot.js`
- **Status**: Functional but not deployed (HTTP version preferred for stability)

## 🌧️ Anzar Rainbot System

Anzar is a dedicated automated rainbot that runs alongside ROFLBot:
- **Function**: Collects coins from user messages and tips, redistributes via scheduled rains
- **Schedule**: Automatic rain every hour at :30 minutes
- **Collection**: 1 coin per user message + tips to boost rainpool
- **Files**: `anzar-rainbot.js` and `start-anzar-rainbot.js`
- **Documentation**: See [`ANZAR-RAINBOT.md`](ANZAR-RAINBOT.md) for detailed setup
- **Deployment**: Runs on Orange Pi via PM2 as `anzar`
- Always responds when directly mentioned or asked for help

## 📊 Scaling & Throttling

### Current Capacity (Gemini Only)
- **1,500 requests/day** = Handles growing communities easily
- **15 requests/minute** = Manages busy chat periods well  
- **Free tier** = Zero operating costs

### Scaling Path
```
Phase 1: Gemini only (current)    → 1,500 daily responses
Phase 2: + Hugging Face          → 2,500 daily responses  
Phase 3: + OpenAI                → 2,700 daily responses
Phase 4: Throttle if needed      → Infinite sustainability
```

### Easy Throttling Controls

If you ever hit API limits, simple configuration changes can reduce usage:

**Response Rate Controls:**
```bash
# Reduce random chat participation
BOT_RESPONSE_CHANCE=0.02         # Down from 0.05 (5% to 2%)

# Less aggressive visitor greeting  
VISITOR_GREETING_CHANCE=0.4      # Down from 0.6 (60% to 40%)

# Longer cooldowns between interactions
USER_INTERACTION_COOLDOWN=2700000 # Up to 45 minutes from 30
```

**Caching Optimization:**
```bash
# Extend response cache duration
CACHE_EXPIRY=7200000             # 2 hours instead of 30 minutes

# More conservative rate limiting
MAX_RESPONSES_PER_MINUTE=2       # Down from 3
```

**Smart Throttling Benefits:**
- ✅ **Maintains core functionality** (always responds to direct mentions)
- ✅ **Preserves visitor welcoming** (just slightly less frequent)
- ✅ **Reduces API costs** without losing personality
- ✅ **Automatic scaling** based on community size

## 🛠️ Configuration Options

Key settings in `.env`:

```bash
# Bot Behavior  
BOT_RESPONSE_CHANCE=0.05         # 5% chance to join general chat (reduced for visitor focus)
VISITOR_GREETING_CHANCE=0.6      # 60% chance to greet new visitors
USER_INTERACTION_COOLDOWN=1800000 # 30 minutes before responding to same user again
MAX_RESPONSES_PER_MINUTE=3       # Rate limiting
RECONNECT_DELAY=5000            # Reconnection delay (ms)

# AI Configuration
GEMINI_API_KEY=your_key_here     # Primary AI service (Google Gemini)
CACHE_EXPIRY=1800000            # Response cache duration (30 minutes)  
AI_TEMPERATURE=0.7               # Response creativity (0.0-1.0)

# Orange Pi Optimization  
LOW_POWER_MODE=true             # Reduces resource usage
MAX_MEMORY_MB=150               # Memory limit warning
```

## 📊 Monitoring

### Health Check (Development)
```bash
npm run health    # Check bot status
npm run services  # Check AI service status
```

### Production Monitoring
```bash
npm run pm2:logs     # View real-time logs
pm2 monit           # Resource monitoring
pm2 status roflbot-http  # Process status
```

## 🚨 Emergency Brake System

### Automatic Runaway Detection
ROFLBot includes an emergency brake system that automatically detects and stops runaway behavior:

**Detection Criteria:**
- **Threshold**: 20 responses in 60 seconds (20 polling cycles)
- **Normal Rate**: 3 responses/minute maximum
- **Trigger**: Runaway = 20x normal response rate

**What Happens:**
1. 🛑 **Auto-Stop**: Bot immediately stops responding to prevent spam
2. 📱 **Admin Alert**: Sends direct message to `andytest1`:
   ```
   @andytest1 🚨 EMERGENCY BRAKE ACTIVATED 🚨
   
   ROFLBot detected runaway behavior (20 responses in 60 seconds) 
   and has automatically stopped responding to prevent spam.
   
   Please check the bot logs and restart when ready:
   `pm2 restart roflbot-http`
   ```
3. 📝 **Detailed Logging**: Records all response timestamps for debugging
4. 🔒 **Self-Protection**: Blocks all responses until manual restart

**Recovery Steps:**
```bash
# 1. Check what happened
ssh orangepi5 "pm2 logs roflbot-http --lines 50"

# 2. Restart the bot when ready
ssh orangepi5 "pm2 restart roflbot-http"

# 3. Monitor for normal behavior
ssh orangepi5 "pm2 logs roflbot-http --lines 0"
```

## 🛠️ Complete PM2 Management Commands

### Basic Operations
```bash
# Start/Stop/Restart
ssh orangepi5 "pm2 start roflbot-http"      # Start the bot
ssh orangepi5 "pm2 stop roflbot-http"       # Stop the bot
ssh orangepi5 "pm2 restart roflbot-http"    # Restart the bot
ssh orangepi5 "pm2 reload roflbot-http"     # Graceful restart (0-downtime)
ssh orangepi5 "pm2 delete roflbot-http"     # Remove from PM2
```

### Monitoring & Logs
```bash
# Real-time logs
ssh orangepi5 "pm2 logs roflbot-http"           # Follow live logs
ssh orangepi5 "pm2 logs roflbot-http --lines 50" # Show last 50 lines
ssh orangepi5 "pm2 logs roflbot-http --lines 0"  # Follow from now (no history)

# Process status
ssh orangepi5 "pm2 status"                      # All processes
ssh orangepi5 "pm2 show roflbot-http"           # Detailed info for bot
ssh orangepi5 "pm2 monit"                       # Resource monitoring dashboard
```

### Log Management
```bash
# Log files
ssh orangepi5 "pm2 flush roflbot-http"          # Clear log files
ssh orangepi5 "pm2 reloadLogs"                  # Reload log files

# Log locations on Orange Pi
# ~/.pm2/logs/roflbot-http-out.log     # Standard output
# ~/.pm2/logs/roflbot-http-error.log   # Error output
```

### Advanced Operations
```bash
# Environment & Config
ssh orangepi5 "pm2 restart roflbot-http --update-env"  # Restart with new env vars
ssh orangepi5 "pm2 save"                              # Save current process list
ssh orangepi5 "pm2 resurrect"                         # Restore saved processes
ssh orangepi5 "pm2 startup"                           # Enable auto-start on boot

# Multiple instances (if needed)
ssh orangepi5 "pm2 scale roflbot-http 2"              # Run 2 instances
ssh orangepi5 "pm2 scale roflbot-http 1"              # Scale back to 1
```

### Quick Troubleshooting Commands
```bash
# Emergency stop (if bot is misbehaving)
ssh orangepi5 "pm2 stop roflbot-http"

# Check what's wrong
ssh orangepi5 "pm2 logs roflbot-http --lines 100 | grep ERROR"

# Fresh restart with clean logs
ssh orangepi5 "pm2 stop roflbot-http && pm2 flush roflbot-http && pm2 start roflbot-http"

# Check Orange Pi resources
ssh orangepi5 "pm2 monit"  # CPU, Memory usage
ssh orangepi5 "free -h"    # Available memory
ssh orangepi5 "df -h"      # Disk space
```

### Emergency Recovery
```bash
# If PM2 is completely stuck
ssh orangepi5 "pm2 kill"                    # Kill PM2 daemon
ssh orangepi5 "pm2 start /home/andy/roflbot/start-http-roflbot.js --name roflbot-http"

# If Orange Pi needs reboot
ssh orangepi5 "sudo reboot"                 # Reboot Orange Pi
# Wait 2 minutes, then:
ssh orangepi5 "pm2 status"                  # Check if auto-started
```

### Log Files
- `logs/roflbot-combined.log` - All output
- `logs/roflbot-error.log` - Errors only

## 📝 Future Refinements & Enhancement Ideas

### AI Response Generation Improvements
- **Personality Tuning**: Adjust Douglas Adams philosophy frequency based on chat activity
- **Context Memory**: Extend conversation memory beyond 5 messages for deeper context
- **User Preference Learning**: Remember individual user interaction preferences
- **Sentiment Analysis**: Adjust response tone based on chat mood

### Visitor Greeting Enhancements
- **Smart Detection**: Better new vs returning user detection using chat history analysis
- **Time-based Greetings**: Different greetings for different times of day
- **Activity-based**: Greet users who seem confused or ask basic questions
- **Personalized Welcome**: Remember users' preferred games or interests

### Response Variety & Quality
- **Multi-Service Blending**: Combine responses from different AI services for variety
- **Response Quality Scoring**: Rate response quality and prefer better-performing services
- **Topic Specialization**: Route specific topics (games, rules, tech) to specialized prompts
- **Community Learning**: Analyze successful vs ignored responses to improve prompts

### Advanced Features
- **Proactive Tips**: Offer helpful tips based on user behavior patterns
- **Game Statistics**: Provide personalized gambling statistics and advice
- **Community Events**: Announce and participate in special events or competitions
- **Multilingual Support**: Detect user language and respond appropriately

### User Documentation Integration
- **Documentation Injection**: Include user-focused documentation in AI system prompts when available
- **Context-Aware Help**: Send relevant doc sections with user queries to AI providers
- **Lightweight Doc Storage**: Store key documentation snippets locally for instant access
- **Smart Doc Routing**: Route documentation questions to providers with full context
- **Hybrid Approach**: Combine local quick answers with AI-generated detailed explanations
- **Documentation Versioning**: Update bot knowledge when site features change

### Documentation Integration Strategies

**Option 1: Enhanced System Prompts (Recommended)**
- Include user documentation in AI service system prompts
- Providers (Gemini, etc.) get full context with each request
- No local processing required - Pi just forwards enriched prompts
- Documentation updates by editing system prompts in code

**Option 2: Lightweight Local Context**
- Store key FAQ/documentation snippets locally (small JSON file)
- Append relevant docs to user queries before sending to AI providers
- Pi does minimal keyword matching to select relevant docs
- AI providers still do the heavy lifting of generating responses

**Option 3: Smart Query Enhancement**
- Detect help/documentation requests by keywords
- Automatically append "Please reference the following documentation: [docs]" to AI queries
- Providers generate accurate responses based on actual site documentation
- Keeps Pi lightweight while ensuring accuracy

### System Integration Issues
- **Rain Function Recovery**: Re-implement rain event detection and participation (lost in flat file transition)
- **Inbox Management**: Implement inbox cleanup system - ROFLBot will never empty its inbox manually
- **Tip Detection**: Verify tip notifications are working correctly with flat file system
- **Balance Tracking**: Ensure ROFLBot balance updates correctly with tips and rain

### Technical Improvements
- **Response Caching Strategy**: More intelligent cache invalidation and updating
- **Load Balancing**: Better distribution across multiple AI services
- **Response Time Optimization**: Parallel service queries for faster responses
- **Error Recovery**: Better handling of AI service outages with graceful fallbacks
- `usage-stats.json` - AI service usage tracking

## 🍊 Orange Pi Deployment

For 24/7 low-power operation:

1. **Follow the complete [Orange Pi Guide](deploy-orange-pi.md)**
2. **Expected Performance**:
   - Memory: ~50-100MB
   - CPU: ~2-5% average  
   - Power: ~3-5W total
   - Uptime: 99%+ with proper maintenance

3. **Remote Management**:
   ```bash
   ssh pi@your-orange-pi "pm2 logs roflbot"
   ssh pi@your-orange-pi "pm2 restart roflbot"
   ```

## 🔧 Troubleshooting

### Common Issues

**Bot Not Responding**
```bash
# Check logs
npm run pm2:logs

# Verify WebSocket connection  
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" ws://your-domain.com:8082/chat

# Restart bot
npm run pm2:restart
```

**API Rate Limits**
```bash
# Check service status
npm run services

# Services will auto-failover, but you can manually restart
npm run pm2:restart
```

**Memory Issues (Orange Pi)**
```bash
# Check memory usage
free -h
pm2 monit

# Restart if needed
pm2 restart roflbot --update-env
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=roflbot* npm run dev

# View detailed service routing
DEBUG=ai-router* npm run dev
```

## 🧪 Testing

### Manual Testing

1. Start ROFLBot in development mode
2. Connect to your chat and mention the bot:
   - `ROFLBot hello`
   - `how do I play dice?`
   - `/tip ROFLBot 25`

### Expected Behaviors

- **Mentions**: Always responds when name is mentioned
- **Help Requests**: Always responds to questions and help requests  
- **General Chat**: ~20% chance to join conversations
- **Tips**: Thanks tipper and announces new balance
- **Rain**: Reacts positively when included
- **New Users**: Occasionally welcomes new joiners

## 💡 Advanced Features

### Admin Commands

Users listed in `isAdmin()` function can use:
- Check bot status and stats
- View AI service utilization
- Monitor performance metrics

### Custom Knowledge

Edit `roflbot-knowledge.js` to:
- Add new site features
- Update game information
- Modify personality traits
- Add troubleshooting guides

### Service Priority

AI services are automatically prioritized:
1. **Google Gemini** - Free and generous
2. **Hugging Face** - Completely free
3. **OpenAI** - High quality, paid
4. **Cohere** - Backup service

## 📈 Cost Management

With smart usage of free tiers:
- **Google Gemini**: 1,500 requests/day FREE
- **Hugging Face**: 1,000 requests/month FREE per model  
- **OpenAI**: ~$5 free credits for new accounts
- **Estimated Monthly Cost**: $0-15 with moderate usage

## 🔒 Security

- API keys stored in environment variables only
- No sensitive data in logs
- Rate limiting prevents abuse
- Automatic service failover prevents overuse
- Optional firewall configuration for Orange Pi

## 📄 Files Overview

```
ai-chatbot/
├── roflbot.js                  # Main bot class
├── ai-service-router.js        # AI service management
├── roflbot-knowledge.js        # Knowledge base and personality
├── start-roflbot.js           # Startup script with monitoring
├── package.json               # Dependencies and scripts
├── .env.example               # Environment template
├── ecosystem.config.js        # PM2 configuration
├── deploy-orange-pi.md        # Orange Pi deployment guide
├── ai-services-research.md    # AI service comparison
├── logs/                      # Log files
└── README.md                  # This file
```

## 🚀 Next Steps

1. **Get API Keys**: Start with Google Gemini (free and generous)
2. **Test Locally**: Run in development mode first
3. **Deploy Production**: Use PM2 for process management
4. **Consider Orange Pi**: For 24/7 low-power operation
5. **Monitor Usage**: Track AI service consumption
6. **Customize Knowledge**: Update bot's knowledge base as needed

## 🤝 Contributing

ROFLBot is part of the ROFLFaucet ecosystem. Feel free to:
- Report bugs and issues
- Suggest new features
- Improve documentation
- Add new AI services

---

**ROFLBot - Making ROFLFaucet more engaging, one conversation at a time!** 🎮💰🤖

*Last Updated: 2025-01-27*