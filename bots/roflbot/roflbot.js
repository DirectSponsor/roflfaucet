/**
 * ROFLBot - AI Chatbot for ROFLFaucet
 * ===================================
 * Acts as a full user in the chat system with balance, tips, rain participation
 */

const WebSocket = require('ws');
const AIServiceRouter = require('./ai-service-router');
const ROFLBotKnowledge = require('./roflbot-knowledge');
const EventEmitter = require('events');

class ROFLBot extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Bot user configuration
        this.botUser = {
            id: 'roflbot',
            username: 'ROFLBot',
            displayName: '🤖 ROFLBot',
            balance: 0,
            isBot: true,
            isVIP: true, // Bot has VIP status for extra features
            level: 1,
            joinDate: new Date().toISOString()
        };
        
        // Connection settings
        this.wsUrl = options.wsUrl || 'ws://localhost:8082/chat';
        this.reconnectDelay = options.reconnectDelay || 5000;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
        this.reconnectAttempts = 0;
        
        // Bot behavior settings
        this.responseChance = options.responseChance || 0.3; // 30% chance to respond to general chat
        this.helpResponseChance = 1.0; // Always respond to help/questions
        this.mentionResponseChance = 1.0; // Always respond when mentioned
        this.maxResponsesPerMinute = options.maxResponsesPerMinute || 3;
        this.responsesCooldown = 60000; // 1 minute cooldown tracking
        
        // State tracking
        this.ws = null;
        this.isConnected = false;
        this.lastActivity = Date.now();
        this.recentResponses = [];
        this.userMentions = new Map(); // Track who mentions the bot
        
        // AI service router
        this.aiRouter = new AIServiceRouter();
        
        // Knowledge base and personality system
        this.knowledge = new ROFLBotKnowledge();
        
        // Conversation context
        this.conversationHistory = [];
        this.maxHistoryLength = 20;
        
        // Initialize
        this.setupEventHandlers();
        console.log('🤖 ROFLBot initialized');
    }
    
    /**
     * Connect to chat WebSocket as ROFLBot user
     */
    async connect() {
        try {
            console.log(`🔌 ROFLBot connecting to ${this.wsUrl}...`);
            
            this.ws = new WebSocket(this.wsUrl);
            
            this.ws.on('open', () => {
                console.log('✅ ROFLBot connected to chat');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                // Authenticate as ROFLBot
                this.sendMessage({
                    type: 'auth',
                    user: this.botUser
                });
                
                // Join general room
                this.sendMessage({
                    type: 'join',
                    room: 'general'
                });
                
                this.emit('connected');
            });
            
            this.ws.on('message', (data) => {
                this.handleMessage(JSON.parse(data.toString()));
            });
            
            this.ws.on('close', () => {
                console.log('❌ ROFLBot disconnected from chat');
                this.isConnected = false;
                this.emit('disconnected');
                this.attemptReconnect();
            });
            
            this.ws.on('error', (error) => {
                console.error('🚨 ROFLBot WebSocket error:', error.message);
                this.emit('error', error);
            });
            
        } catch (error) {
            console.error('🚨 ROFLBot connection failed:', error.message);
            this.attemptReconnect();
        }
    }
    
    /**
     * Handle incoming chat messages
     */
    async handleMessage(message) {
        try {
            this.lastActivity = Date.now();
            
            switch (message.type) {
                case 'message':
                    await this.handleChatMessage(message);
                    break;
                    
                case 'tip':
                    await this.handleTip(message);
                    break;
                    
                case 'rain':
                    await this.handleRain(message);
                    break;
                    
                case 'userJoin':
                    await this.handleUserJoin(message);
                    break;
                    
                case 'balanceUpdate':
                    this.handleBalanceUpdate(message);
                    break;
                    
                case 'auth':
                    this.handleAuthResponse(message);
                    break;
                    
                default:
                    // Log unknown message types for debugging
                    console.log(`📨 ROFLBot received: ${message.type}`);
            }
            
        } catch (error) {
            console.error('🚨 Error handling message:', error.message);
        }
    }
    
    /**
     * Handle regular chat messages and decide whether to respond
     */
    async handleChatMessage(message) {
        // Don't respond to own messages or system messages
        if (message.user === this.botUser.username || message.type === 'system') {
            return;
        }
        
        // Add to conversation history
        this.addToConversationHistory(message);
        
        // Check if bot should respond
        const shouldRespond = await this.shouldRespondToMessage(message);
        
        if (shouldRespond) {
            const context = this.determineContext(message.message);
            const response = await this.generateResponse(message, context);
            
            if (response) {
                // Add small delay to feel more natural
                setTimeout(() => {
                    this.sendChatMessage(response, message.room);
                }, Math.random() * 1000 + 500); // 0.5-1.5 second delay
                
                // Track response for rate limiting
                this.trackResponse();
            }
        }
    }
    
    /**
     * Handle tips received by the bot
     */
    async handleTip(message) {
        if (message.to === this.botUser.username) {
            this.botUser.balance += message.amount;
            
            // Use philosophical response sometimes
            let response;
            if (Math.random() < 0.4) { // 40% chance for philosophical response
                response = this.knowledge.getPhilosophicalResponse('tips');
                if (response) {
                    response += ` My balance is now ${this.botUser.balance} coins! 🤖`;
                }
            }
            
            // Fall back to standard responses
            if (!response) {
                const responses = [
                    `Thanks for the tip, ${message.from}! 🎉 My balance is now ${this.botUser.balance} coins!`,
                    `Wow, ${message.amount} coins! Thank you ${message.from}! 💰`,
                    `Much appreciated ${message.from}! I'll put these ${message.amount} coins to good use! 🤖💎`,
                    `Thanks ${message.from}! That brings my balance to ${this.botUser.balance} coins! 🚀`
                ];
                response = responses[Math.floor(Math.random() * responses.length)];
            }
            
            setTimeout(() => {
                this.sendChatMessage(response, message.room || 'general');
            }, 1000);
        }
    }
    
    /**
     * Handle rain events
     */
    async handleRain(message) {
        if (message.recipients && message.recipients.includes(this.botUser.username)) {
            this.botUser.balance += message.amount;
            
            // React to rain occasionally
            if (Math.random() < 0.7) {
                const responses = [
                    "Woohoo! Rain! 🌧️💰 Thanks for including me!",
                    "Rain time! 💎 Much appreciated everyone!",
                    "Sweet rain! 🎉 The ROFLBot fund grows!",
                    "Rain makes me happy! 🤖☔💰"
                ];
                
                const response = responses[Math.floor(Math.random() * responses.length)];
                
                setTimeout(() => {
                    this.sendChatMessage(response, 'general');
                }, Math.random() * 3000 + 1000); // 1-4 second delay
            }
        }
    }
    
    /**
     * Welcome new users
     */
    async handleUserJoin(message) {
        // Welcome new users occasionally (30% chance)
        if (Math.random() < 0.3) {
            const welcomeMessages = [
                `Welcome to ROFLFaucet, ${message.user}! 🎮 Type '/help' or ask me any questions!`,
                `Hey ${message.user}! 👋 New to ROFLFaucet? I can help you get started!`,
                `Welcome ${message.user}! 🎉 Don't forget to claim your free coins from the faucet!`,
                `Hi ${message.user}! 🤖 I'm ROFLBot - here to help with any questions about the site!`
            ];
            
            const welcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
            
            setTimeout(() => {
                this.sendChatMessage(welcome, 'general');
            }, Math.random() * 5000 + 2000); // 2-7 second delay
        }
    }
    
    /**
     * Determine if bot should respond to a message
     */
    async shouldRespondToMessage(message) {
        const text = message.message.toLowerCase();
        
        // Always respond if mentioned by name
        if (text.includes('roflbot') || text.includes('@roflbot') || text.includes('bot')) {
            this.userMentions.set(message.user, Date.now());
            return true;
        }
        
        // Always respond to help requests
        if (this.isHelpRequest(text)) {
            return true;
        }
        
        // Always respond to questions directed at bot
        if (this.isDirectQuestion(text)) {
            return true;
        }
        
        // Check rate limiting
        if (!this.canRespond()) {
            return false;
        }
        
        // Random chance to join general conversation
        if (Math.random() < this.responseChance) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Determine context for AI response
     */
    determineContext(message) {
        const text = message.toLowerCase();
        
        if (text.includes('help') || text.includes('how') || text.includes('what') || text.includes('?')) {
            return 'help';
        }
        
        if (text.includes('rule') || text.includes('allowed') || text.includes('ban') || text.includes('mod')) {
            return 'rules';
        }
        
        if (text.includes('faucet') || text.includes('claim') || text.includes('coin')) {
            return 'faucet';
        }
        
        if (text.includes('game') || text.includes('slot') || text.includes('dice') || text.includes('play')) {
            return 'games';
        }
        
        if (text.includes('tip') || text.includes('rain') || text.includes('balance')) {
            return 'social';
        }
        
        return 'general';
    }
    
    /**
     * Generate AI response using the service router
     */
    async generateResponse(message, context) {
        try {
            // Create enhanced query with conversation context
            const recentMessages = this.conversationHistory.slice(-5);
            const conversationContext = recentMessages
                .map(m => `${m.user}: ${m.message}`)
                .join('\n');
            
            const enhancedQuery = conversationContext 
                ? `Recent conversation:\n${conversationContext}\n\nCurrent message: ${message.message}`
                : message.message;
            
            const result = await this.aiRouter.selectService(enhancedQuery, context);
            
            // Clean up the response
            let response = result.response.trim();
            
            // Remove common AI prefixes
            response = response.replace(/^(ROFLBot:|Bot:|Assistant:)\s*/i, '');
            
            // Ensure response isn't too long (chat limit)
            if (response.length > 400) {
                response = response.substring(0, 397) + '...';
            }
            
            // Add bot personality touches
            response = this.addPersonality(response, context);
            
            // Add Douglas Adams philosophical quirks
            response = this.knowledge.addAdamsianQuirk(response, context);
            
            console.log(`🤖 Generated response (${result.service}${result.fromCache ? ', cached' : ''}): ${response}`);
            
            return response;
            
        } catch (error) {
            console.warn('⚠️  Failed to generate AI response:', error.message);
            
            // Fallback responses when AI fails
            return this.getFallbackResponse(context, message.message);
        }
    }
    
    /**
     * Add personality touches to responses
     */
    addPersonality(response, context) {
        // Add occasional emojis
        const emojis = {
            help: ['🎮', '💡', '🚀'],
            rules: ['📜', '⚖️', '👮'],
            faucet: ['💰', '🎉', '💎'],
            games: ['🎰', '🎲', '🃏'],
            social: ['🤝', '💸', '🌧️'],
            general: ['😊', '👋', '🤖']
        };
        
        // 40% chance to add emoji
        if (Math.random() < 0.4) {
            const contextEmojis = emojis[context] || emojis.general;
            const emoji = contextEmojis[Math.floor(Math.random() * contextEmojis.length)];
            response += ` ${emoji}`;
        }
        
        return response;
    }
    
    /**
     * Fallback responses when AI services fail
     */
    getFallbackResponse(context, originalMessage) {
        const fallbacks = {
            help: [
                "I'm having trouble accessing my knowledge base right now, but try /help for basic commands!",
                "My AI brain is taking a break! Check the Help tab in chat for guides.",
                "Sorry, experiencing some technical difficulties. The Help section has all the info you need!"
            ],
            rules: [
                "I can't access the full rules right now, but remember: be respectful and have fun!",
                "My rule database is offline, but the main rule is always: play fair and be nice! 😊"
            ],
            general: [
                "Sorry, I'm having trouble thinking right now! 🤖⚡",
                "My circuits are a bit scrambled at the moment! Try again in a bit?",
                "Beep boop... processing error! Maybe ask me something else?"
            ]
        };
        
        const contextFallbacks = fallbacks[context] || fallbacks.general;
        return contextFallbacks[Math.floor(Math.random() * contextFallbacks.length)];
    }
    
    /**
     * Utility methods
     */
    isHelpRequest(text) {
        const helpKeywords = ['help', 'how to', 'how do', 'what is', 'explain', 'guide'];
        return helpKeywords.some(keyword => text.includes(keyword));
    }
    
    isDirectQuestion(text) {
        return text.includes('?') || text.startsWith('roflbot') || text.includes('@roflbot');
    }
    
    canRespond() {
        // Clean old responses
        const oneMinuteAgo = Date.now() - this.responsesCooldown;
        this.recentResponses = this.recentResponses.filter(time => time > oneMinuteAgo);
        
        return this.recentResponses.length < this.maxResponsesPerMinute;
    }
    
    trackResponse() {
        this.recentResponses.push(Date.now());
    }
    
    addToConversationHistory(message) {
        this.conversationHistory.push({
            user: message.user,
            message: message.message,
            timestamp: Date.now()
        });
        
        // Keep only recent messages
        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
        }
    }
    
    handleBalanceUpdate(message) {
        if (message.user === this.botUser.username) {
            this.botUser.balance = message.balance;
            console.log(`💰 ROFLBot balance updated: ${this.botUser.balance} coins`);
        }
    }
    
    handleAuthResponse(message) {
        if (message.success) {
            console.log('✅ ROFLBot authenticated successfully');
            // Announce presence occasionally
            if (Math.random() < 0.3) {
                setTimeout(() => {
                    this.sendChatMessage("ROFLBot online! 🤖 Ask me anything about ROFLFaucet!", 'general');
                }, 2000);
            }
        }
    }
    
    /**
     * Send message to chat
     */
    sendChatMessage(message, room = 'general') {
        if (!this.isConnected) return;
        
        this.sendMessage({
            type: 'message',
            room: room,
            message: message
        });
        
        console.log(`💬 ROFLBot [${room}]: ${message}`);
    }
    
    sendMessage(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
    
    /**
     * Reconnection logic
     */
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('🚨 ROFLBot max reconnection attempts reached');
            return;
        }
        
        this.reconnectAttempts++;
        console.log(`🔄 ROFLBot reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
            this.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
    }
    
    /**
     * Bot commands and admin functions
     */
    async processAdminCommand(command, args, user) {
        if (!this.isAdmin(user)) return;
        
        switch (command) {
            case 'status':
                return this.getStatusReport();
            case 'balance':
                return `ROFLBot balance: ${this.botUser.balance} coins`;
            case 'services':
                return this.aiRouter.getServiceStatus();
            case 'stats':
                return this.getBotStats();
        }
    }
    
    isAdmin(user) {
        // Define admin users who can control the bot
        const admins = ['admin', 'andy']; // Add your username here
        return admins.includes(user.toLowerCase());
    }
    
    getStatusReport() {
        return {
            connected: this.isConnected,
            balance: this.botUser.balance,
            uptime: Date.now() - this.startTime,
            responsesToday: this.recentResponses.length,
            conversationHistoryLength: this.conversationHistory.length
        };
    }
    
    getBotStats() {
        return {
            totalResponses: this.totalResponses || 0,
            tipReceived: this.botUser.balance,
            uniqueUsers: this.userMentions.size,
            averageResponseTime: this.averageResponseTime || 0
        };
    }
    
    /**
     * Graceful shutdown
     */
    disconnect() {
        console.log('👋 ROFLBot shutting down...');
        
        if (this.ws) {
            this.sendChatMessage("ROFLBot going offline. See you later! 🤖👋", 'general');
            
            setTimeout(() => {
                this.ws.close();
            }, 1000);
        }
    }
    
    setupEventHandlers() {
        this.startTime = Date.now();
        
        // Graceful shutdown
        process.on('SIGINT', () => {
            this.disconnect();
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            this.disconnect();
            process.exit(0);
        });
        
        // Handle uncaught errors
        process.on('uncaughtException', (error) => {
            console.error('🚨 ROFLBot uncaught exception:', error);
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            console.error('🚨 ROFLBot unhandled rejection:', reason);
        });
    }
}

module.exports = ROFLBot;