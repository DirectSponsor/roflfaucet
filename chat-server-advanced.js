const WebSocket = require('ws');
const crypto = require('crypto');

class ChatServer {
    constructor(port = 8082) {
        this.port = port;
        this.users = new Map(); // userId -> user data
        this.connections = new Map(); // ws -> user data
        this.rooms = {
            general: { users: new Set(), messages: [] },
            vip: { users: new Set(), messages: [] },
            help: { users: new Set(), messages: [] }
        };
        this.rainPool = 0;
        this.userBalances = new Map(); // userId -> balance
        this.messageHistory = [];
        this.hourlyMessageContributions = new Map(); // userId -> {count, hour}
        this.maxHourlyContributions = 20;
        this.systemBots = new Map(); // Bot management
        
        this.wss = new WebSocket.Server({ 
            port: this.port, 
            path: '/chat',
            verifyClient: (info) => {
                console.log('WebSocket connection attempt from:', info.origin);
                return true; // Allow all connections for now
            }
        });
        
        this.setupEventHandlers();
        this.createSystemBots();
        this.startPeriodicTasks();
        
        console.log(`🚀 Advanced Chat Server running on port ${this.port}`);
        console.log(`📡 WebSocket path: /chat`);
    }
    
    setupEventHandlers() {
        this.wss.on('connection', (ws, request) => {
            console.log('💬 New WebSocket connection established');
            
            // Generate temporary user if none provided
            const tempUser = {
                id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                username: `User${Math.floor(Math.random() * 1000)}`,
                balance: Math.floor(Math.random() * 500) + 100,
                isVip: false,
                joinedAt: Date.now()
            };
            
            this.connections.set(ws, tempUser);
            this.users.set(tempUser.id, tempUser);
            this.userBalances.set(tempUser.id, tempUser.balance);
            
            // Add to general room by default
            this.rooms.general.users.add(tempUser.id);
            
            // Send welcome messages
            this.sendToUser(ws, {
                type: 'welcome',
                user: tempUser,
                message: 'Connected to ROFLFaucet Chat!'
            });
            
            this.sendToUser(ws, {
                type: 'userCount',
                count: this.getOnlineUserCount()
            });
            
            this.sendToUser(ws, {
                type: 'rainPool',
                amount: this.rainPool
            });
            
            // Send recent message history
            this.sendRecentHistory(ws);
            
            // Broadcast user join
            this.broadcastToRoom('general', {
                type: 'userJoin',
                user: tempUser.username,
                userCount: this.getOnlineUserCount()
            }, ws);
            
            // Handle incoming messages
            ws.on('message', (data) => {
                this.handleMessage(ws, data);
            });
            
            // Handle disconnection
            ws.on('close', () => {
                this.handleDisconnection(ws);
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.handleDisconnection(ws);
            });
        });
    }
    
    handleMessage(ws, data) {
        try {
            const message = JSON.parse(data);
            const user = this.connections.get(ws);
            
            if (!user) {
                console.log('Message from unknown user, ignoring');
                return;
            }
            
            console.log(`📨 Message from ${user.username}:`, message);
            
            switch (message.type) {
                case 'message':
                    this.handleChatMessage(ws, user, message);
                    break;
                case 'tip':
                    this.handleTip(ws, user, message);
                    break;
                case 'rain':
                    this.handleRain(ws, user, message);
                    break;
                case 'balance':
                    this.handleBalanceRequest(ws, user);
                    break;
                case 'online':
                    this.handleOnlineRequest(ws);
                    break;
                case 'auth':
                    this.handleAuth(ws, message);
                    break;
                case 'joinRoom':
                    this.handleJoinRoom(ws, user, message);
                    break;
                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }
    
    handleChatMessage(ws, user, message) {
        const room = message.room || 'general';
        
        // Check if user has access to room (removed VIP room check since we removed it)
        
        const chatMessage = {
            type: 'message',
            user: user.username,
            message: message.message,
            room: room,
            timestamp: Date.now(),
            userId: user.id
        };
        
        // Store message
        this.messageHistory.push(chatMessage);
        if (this.messageHistory.length > 1000) {
            this.messageHistory = this.messageHistory.slice(-1000);
        }
        
        // Auto-contribute to rain pool (1 coin per message, max 20 per user per day)
        this.processMessageRainContribution(user);
        
        // Broadcast to room
        this.broadcastToRoom(room, chatMessage);
        
        // Update user activity
        user.lastActivity = Date.now();
    }
    
    handleTip(ws, user, message) {
        const targetUsername = message.target;
        const amount = parseInt(message.amount);
        
        // Validation
        if (!targetUsername || !amount || amount <= 0) {
            this.sendToUser(ws, {
                type: 'error',
                message: 'Invalid tip format. Use: /tip username amount'
            });
            return;
        }
        
        if (amount > user.balance) {
            this.sendToUser(ws, {
                type: 'error',
                message: `Insufficient balance. You have ${user.balance} coins`
            });
            return;
        }
        
        // Find target user
        const targetUser = Array.from(this.users.values())
            .find(u => u.username.toLowerCase() === targetUsername.toLowerCase());
        
        if (!targetUser) {
            this.sendToUser(ws, {
                type: 'error',
                message: `User ${targetUsername} not found or offline`
            });
            return;
        }
        
        if (targetUser.id === user.id) {
            this.sendToUser(ws, {
                type: 'error',
                message: 'You cannot tip yourself'
            });
            return;
        }
        
        // Special handling for tipping Anzar - goes to rain pool
        if (targetUser.isBot && targetUser.username === 'Anzar') {
            user.balance -= amount;
            this.rainPool += amount;
            this.userBalances.set(user.id, user.balance);
            
            this.sendToUser(ws, {
                type: 'tipSent',
                to: targetUser.username,
                amount: amount,
                newBalance: user.balance
            });
            
            // Anzar acknowledges the tip
            setTimeout(() => {
                this.sendBotMessage('anzar', `🌧️ ${user.username} blessed the rain pool with ${amount} coins! The clouds grow stronger! (Pool: ${this.rainPool})`);
            }, 1000);
            
            // Broadcast rain pool update
            this.broadcastToAll({
                type: 'rainPool',
                amount: this.rainPool
            });
            
            // Check for immediate rain
            if (this.rainPool >= 100) {
                this.triggerRainEvent();
            }
            
            return;
        }
        
        // Process tip
        user.balance -= amount;
        targetUser.balance += amount;
        this.userBalances.set(user.id, user.balance);
        this.userBalances.set(targetUser.id, targetUser.balance);
        
        // Notify users
        this.sendToUser(ws, {
            type: 'tipSent',
            to: targetUser.username,
            amount: amount,
            newBalance: user.balance
        });
        
        // Find target user's connection
        const targetWs = Array.from(this.connections.entries())
            .find(([, u]) => u.id === targetUser.id)?.[0];
        
        if (targetWs) {
            this.sendToUser(targetWs, {
                type: 'tipReceived',
                from: user.username,
                amount: amount,
                newBalance: targetUser.balance
            });
        }
        
        // Broadcast tip event
        this.broadcastToRoom('general', {
            type: 'tip',
            from: user.username,
            to: targetUser.username,
            amount: amount,
            timestamp: Date.now()
        });
    }
    
    handleRain(ws, user, message) {
        const amount = parseInt(message.amount);
        
        // Allow all users to contribute to rain now (not just VIP)
        if (!amount || amount <= 0 || amount > user.balance) {
            this.sendToUser(ws, {
                type: 'error',
                message: 'Invalid rain amount or insufficient balance'
            });
            return;
        }
        
        if (amount < 5) {
            this.sendToUser(ws, {
                type: 'error',
                message: 'Minimum rain contribution is 5 coins'
            });
            return;
        }
        
        // Add to rain pool
        user.balance -= amount;
        this.rainPool += amount;
        this.userBalances.set(user.id, user.balance);
        
        this.sendToUser(ws, {
            type: 'rainContributed',
            amount: amount,
            newBalance: user.balance,
            rainPool: this.rainPool
        });
        
        // Broadcast rain contribution message
        this.broadcastToRoom('general', {
            type: 'system',
            text: `${user.username} contributed ${amount} coins to rain pool! (Total: ${this.rainPool})`,
            timestamp: Date.now()
        });
        
        // Broadcast rain pool update
        this.broadcastToAll({
            type: 'rainPool',
            amount: this.rainPool
        });
        
        // Trigger rain if pool is large enough
        if (this.rainPool >= 100) {
            this.triggerRainEvent();
        }
    }
    
    triggerRainEvent() {
        const activeUsers = Array.from(this.users.values())
            .filter(user => {
                // Exclude bots from rain events
                if (user.isBot) return false;
                const lastActivity = user.lastActivity || user.joinedAt;
                return Date.now() - lastActivity < 300000; // Active in last 5 minutes
            });
        
        if (activeUsers.length === 0) {
            console.log('🌧️ No active users for rain event');
            return;
        }
        
        const winners = this.selectRandomUsers(activeUsers, Math.min(activeUsers.length, 10));
        const perUserAmount = Math.floor(this.rainPool / winners.length);
        const totalRainAmount = this.rainPool;
        
        // Anzar announces the rain event
        this.sendBotMessage('anzar', `🌧️ RAIN TIME! ${totalRainAmount} coins falling from the sky! ${winners.length} lucky users will be blessed!`);
        
        // Distribute coins to winners
        winners.forEach(winner => {
            winner.balance += perUserAmount;
            this.userBalances.set(winner.id, winner.balance);
            
            // Notify winner
            const winnerWs = Array.from(this.connections.entries())
                .find(([, u]) => u.id === winner.id)?.[0];
            
            if (winnerWs) {
                this.sendToUser(winnerWs, {
                    type: 'rainReceived',
                    amount: perUserAmount,
                    newBalance: winner.balance
                });
            }
        });
        
        // Broadcast rain event
        this.broadcastToAll({
            type: 'rain',
            message: `🌧️ Rain event! ${totalRainAmount} coins distributed to ${winners.length} users!`,
            amount: totalRainAmount,
            winners: winners.map(w => w.username),
            timestamp: Date.now()
        });
        
        // Reset rain pool
        this.rainPool = 0;
        
        // Anzar celebrates the rain
        setTimeout(() => {
            this.sendBotMessage('anzar', `🎉 Congratulations to the rain winners: ${winners.map(w => w.username).join(', ')}! Each received ${perUserAmount} coins!`);
        }, 2000);
        
        // Update rain pool display
        this.broadcastToAll({
            type: 'rainPool',
            amount: this.rainPool
        });
    }
    
    handleBalanceRequest(ws, user) {
        this.sendToUser(ws, {
            type: 'balance',
            balance: user.balance,
            message: `Your balance: ${user.balance} coins`
        });
    }
    
    handleOnlineRequest(ws) {
        const count = this.getOnlineUserCount();
        this.sendToUser(ws, {
            type: 'online',
            count: count,
            message: `${count} users online`
        });
    }
    
    handleAuth(ws, message) {
        const user = this.connections.get(ws);
        if (!user) return;
        
        // Update user data with auth info
        if (message.user) {
            user.username = message.user.username || user.username;
            user.balance = message.user.balance || user.balance;
            user.isVip = message.user.balance >= 1000 || message.user.isVip;
            
            this.users.set(user.id, user);
            this.userBalances.set(user.id, user.balance);
            
            this.sendToUser(ws, {
                type: 'authSuccess',
                user: user
            });
        }
    }
    
    handleJoinRoom(ws, user, message) {
        const room = message.room;
        if (!this.rooms[room]) return;
        
        // Check VIP access
        if (room === 'vip' && !this.isUserVip(user)) {
            this.sendToUser(ws, {
                type: 'error',
                message: 'VIP room requires 1000+ coins or special status'
            });
            return;
        }
        
        // Remove from all rooms and add to new room
        Object.values(this.rooms).forEach(r => r.users.delete(user.id));
        this.rooms[room].users.add(user.id);
        
        this.sendToUser(ws, {
            type: 'roomJoined',
            room: room
        });
    }
    
    handleDisconnection(ws) {
        const user = this.connections.get(ws);
        if (!user) return;
        
        console.log(`👋 User ${user.username} disconnected`);
        
        // Remove from all data structures
        this.connections.delete(ws);
        this.users.delete(user.id);
        this.userBalances.delete(user.id);
        
        Object.values(this.rooms).forEach(room => {
            room.users.delete(user.id);
        });
        
        // Broadcast user leave
        this.broadcastToRoom('general', {
            type: 'userLeave',
            user: user.username,
            userCount: this.getOnlineUserCount()
        });
    }
    
    sendRecentHistory(ws) {
        const recentMessages = this.messageHistory.slice(-20);
        recentMessages.forEach(msg => {
            this.sendToUser(ws, msg);
        });
    }
    
    sendToUser(ws, data) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }
    
    broadcastToRoom(room, data, excludeWs = null) {
        if (!this.rooms[room]) return;
        
        this.rooms[room].users.forEach(userId => {
            const userWs = Array.from(this.connections.entries())
                .find(([, user]) => user.id === userId)?.[0];
            
            if (userWs && userWs !== excludeWs && userWs.readyState === WebSocket.OPEN) {
                this.sendToUser(userWs, data);
            }
        });
    }
    
    broadcastToAll(data, excludeWs = null) {
        this.connections.forEach((user, ws) => {
            if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
                this.sendToUser(ws, data);
            }
        });
    }
    
    getOnlineUserCount() {
        return this.connections.size;
    }
    
    isUserVip(user) {
        return user.balance >= 1000 || user.isVip;
    }
    
    selectRandomUsers(users, count) {
        const shuffled = [...users].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    
    startPeriodicTasks() {
        // Auto rain every 10 minutes if pool is big enough
        setInterval(() => {
            if (this.rainPool >= 200) {
                this.triggerRainEvent();
            }
        }, 600000); // 10 minutes
        
        // Send periodic stats
        setInterval(() => {
            this.broadcastToAll({
                type: 'userCount',
                count: this.getOnlineUserCount()
            });
        }, 30000); // 30 seconds
        
        // Clean old messages
        setInterval(() => {
            if (this.messageHistory.length > 1000) {
                this.messageHistory = this.messageHistory.slice(-500);
            }
        }, 3600000); // 1 hour
        
        // Schedule hourly rain at :30 past each hour
        this.scheduleHourlyRain();
    }
    
    // Schedule rain to happen at :30 past each hour if pool >= 100
    scheduleHourlyRain() {
        const now = new Date();
        const currentMinute = now.getMinutes();
        const targetMinute = 30;
        
        let msUntilNext;
        if (currentMinute < targetMinute) {
            // Next :30 is this hour
            msUntilNext = (targetMinute - currentMinute) * 60 * 1000;
        } else {
            // Next :30 is next hour
            msUntilNext = (60 - currentMinute + targetMinute) * 60 * 1000;
        }
        
        console.log(`⏰ Next scheduled rain check in ${Math.round(msUntilNext / 60000)} minutes`);
        
        setTimeout(() => {
            this.checkScheduledRain();
            // Schedule the next hourly check
            setInterval(() => {
                this.checkScheduledRain();
            }, 60 * 60 * 1000); // Every hour
        }, msUntilNext);
    }
    
    // Check if rain should happen at scheduled time
    checkScheduledRain() {
        const now = new Date();
        console.log(`⏰ Scheduled rain check at ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`);
        
        if (this.rainPool >= 100) {
            this.sendBotMessage('anzar', `⏰ Hourly rain time! The clouds have gathered ${this.rainPool} coins!`);
            setTimeout(() => {
                this.triggerRainEvent();
            }, 2000);
        } else {
            this.sendBotMessage('anzar', `⏰ Hourly rain check: Only ${this.rainPool} coins in the pool. Need ${100 - this.rainPool} more coins for rain!`);
        }
    }
    
    // Get next rain time as formatted string
    getNextRainTime() {
        const now = new Date();
        const currentMinute = now.getMinutes();
        const targetMinute = 30;
        
        let nextHour = now.getHours();
        if (currentMinute >= targetMinute) {
            nextHour = (nextHour + 1) % 24;
        }
        
        return `${nextHour.toString().padStart(2, '0')}:30`;
    }

    // Create system bots
    createSystemBots() {
        // Create Anzar - the rain bot
        const anzar = {
            id: 'bot_anzar',
            username: 'Anzar',
            balance: 999999,
            isBot: true,
            isVip: true,
            joinedAt: Date.now(),
            lastActivity: Date.now()
        };
        
        this.systemBots.set('anzar', anzar);
        this.users.set(anzar.id, anzar);
        this.userBalances.set(anzar.id, anzar.balance);
        
        console.log('🤖 System bot Anzar created for rain events');
    }

    // Sends a message from a system bot
    sendBotMessage(botName, message, room = 'general') {
        const bot = this.systemBots.get(botName);
        if (!bot) return;
        
        const chatMessage = {
            type: 'message',
            user: bot.username,
            message: message,
            room: room,
            timestamp: Date.now(),
            userId: bot.id,
            isBot: true
        };
        
        // Store message
        this.messageHistory.push(chatMessage);
        if (this.messageHistory.length > 1000) {
            this.messageHistory = this.messageHistory.slice(-1000);
        }
        
        // Broadcast to room
        this.broadcastToRoom(room, chatMessage);
        
        console.log(`🤖 ${bot.username} sent message: ${message}`);
    }

    // Adds message-based contributions to the rain pool (hourly limit)
    processMessageRainContribution(user) {
        // Skip contribution for system bots
        if (user.isBot) return;
        
        const currentHour = new Date().getHours();
        const currentDate = new Date().toDateString();
        const userKey = user.id;
        const userContrib = this.hourlyMessageContributions.get(userKey) || { count: 0, hour: -1, date: '' };
        
        // Reset if hour has changed or date has changed
        if (userContrib.hour !== currentHour || userContrib.date !== currentDate) {
            userContrib.count = 0;
            userContrib.hour = currentHour;
            userContrib.date = currentDate;
        }
        
        if (userContrib.count < this.maxHourlyContributions) {
            this.rainPool += 1; // Add 1 coin to the rain pool
            userContrib.count++;
            this.hourlyMessageContributions.set(userKey, userContrib);
            
            console.log(`🌧️ ${user.username} contributed to rain pool via message. Total contributions this hour: ${userContrib.count}`);
            
            // Notify user of their contribution
            const userWs = Array.from(this.connections.entries())
                .find(([, u]) => u.id === user.id)?.[0];
            if (userWs) {
                this.sendToUser(userWs, {
                    type: 'rainContribution',
                    contributionCount: userContrib.count,
                    message: `You've contributed ${userContrib.count} out of 20 possible rain coins this hour by chatting!`
                });
            }

            // Broadcast rain pool update
            this.broadcastToAll({
                type: 'rainPool',
                amount: this.rainPool
            });
        }
    }
}
// Start the server
const server = new ChatServer(8082);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down chat server...');
    server.wss.close(() => {
        console.log('✅ Chat server shut down gracefully');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    server.wss.close(() => {
        console.log('✅ Chat server shut down gracefully');
        process.exit(0);
    });
});

module.exports = ChatServer;
