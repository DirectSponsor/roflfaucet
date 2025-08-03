# ROFLFaucet Chat System

## 🎯 Features
- **Real-time messaging** with WebSocket connection
- **Three chat rooms**: General, VIP, Help
- **Mock user testing** for development
- **Tip system** - Send coins to other users with `/tip username amount`
- **Rain events** - VIP users can create rain events to reward active chatters
- **Balance integration** - Integrated with unified balance system
- **Modern responsive UI** - Works on desktop, tablet, and mobile
- **Testing mode** - Automatically creates test users for multi-browser testing
- **SSL/TLS Support** - Secure WebSocket connections via nginx proxy

## 🏗️ Architecture

### Frontend Components
- `chat-widget.js` - Main chat widget with WebSocket connection
- `chat-integration.js` - Integration with ROFLFaucet systems (auth, balance)
- `chat-widget.css` - Complete styling system with modern gradients

### Backend (Production Setup)
- `chat-server-advanced.js` - Advanced Node.js WebSocket server 
- **Server Port**: 8082 (internal)
- **WebSocket Path**: `/chat` (server-side)
- **Public Access**: `wss://roflfaucet.com/ws` (via nginx proxy)
- **Features**: Multi-room support, user management, tips, rain events, VIP rooms

## 🚀 Quick Start

### Local Testing
1. Install dependencies:
   ```bash
   npm install ws
   ```

2. Start WebSocket server:
   ```bash
   node websocket-server.js
   ```

3. Open multiple browsers to test:
   - Each browser gets a random test user (TestUser##)
   - Messages sync in real-time between browsers
   - Test commands like `/tip TestUser12 50`

### Production Deployment
1. Deploy files to server using the deploy script
2. Install Node.js on server: `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs`
3. Install WebSocket package: `npm install ws`
4. Start server: `nohup node websocket-server.js > websocket.log 2>&1 &`

## 🎮 Chat Commands
- `/tip [user] [amount]` - Send coins to another user
- `/rain [amount]` - Add coins to rain pool (VIP only)
- `/balance` - Check your coin balance
- `/online` - Show online users count

## 🔧 Configuration
- **WebSocket URL**: `wss://roflfaucet.com:8081/chat` (production)
- **WebSocket URL**: `ws://localhost:8081/chat` (development)
- **Max Messages**: 100 per room
- **Reconnection**: 5 attempts with exponential backoff

## 📱 UI Features
- **Responsive design** for all screen sizes
- **Dark theme** with smooth animations
- **Unread message counters** on tabs
- **Auto-scroll** to latest messages
- **Typing indicators** and user join/leave notifications
- **Connection status** indicators

## 🧪 Testing Mode
When no authentication is found, the system automatically:
- Creates random test users (`TestUser##`)
- Assigns random coin balances (0-1000)
- Enables full chat functionality for testing
- Works across multiple browsers simultaneously

## 📁 File Structure
```
chat/
├── styles/
│   └── chat-widget.css          # Complete styling system
├── scripts/
│   ├── chat-widget.js           # Main chat widget logic
│   ├── chat-integration.js      # ROFLFaucet system integration
│   └── mock-websocket.js        # Testing without server
├── setup-instructions.md        # Setup documentation
└── README.md                    # This file
```

## 🔒 Security
- JWT-based authentication integration
- User session management
- Rate limiting prevention (planned)
- Message filtering and moderation (planned)

## 🚧 Future Enhancements
- Message reactions with emoji
- Private messaging between users
- Chat games and mini-games
- Leaderboards for active chatters
- Advanced moderation tools
- Message search and archives

---
*Last Updated: 2025-08-02*  
*Status: Production Ready ✅*
