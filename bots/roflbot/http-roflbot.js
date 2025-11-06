/**
 * HTTP ROFLBot for ROFLFaucet PHP Chat System
 * ==========================================
 * Works with AJAX polling chat, not WebSocket
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const AIServiceRouter = require('./ai-service-router');
const ROFLBotKnowledge = require('./roflbot-knowledge');
const EventEmitter = require('events');

class HTTPROFLBot extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Bot user info (needs to match the account you created)
        this.botUser = {
            user_id: 'roflbot', // This should match the actual user ID from your database
            username: 'roflbot', // Use exact username from logs
            displayName: '🤖 ROFLBot',
            balance: 0,
            isBot: true
        };
        
        // API endpoints
        this.config = {
            chatApiUrl: options.chatApiUrl || 'https://roflfaucet.com/api/simple-chat.php',
            pollInterval: options.pollInterval || 3000, // 3 seconds like the web client
            maxRetries: options.maxRetries || 10,
            userAgent: 'ROFLBot/1.0 (Automated Chat Assistant)'
        };
        
        // State tracking
        this.isRunning = false;
        this.lastMessageTimestamp = 0; // Use timestamp since messages don't have IDs
        this.currentRoom = 'general';
        this.pollTimer = null;
        this.reconnectAttempts = 0;
        this.recentResponses = [];
        this.responsesCooldown = 60000; // 1 minute
        this.maxResponsesPerMinute = 3;
        
        // Visitor greeting system
        this.greetedUsers = new Map(); // username -> timestamp of last greeting
        this.userCooldowns = new Map(); // username -> timestamp when bot last responded to them
        this.greetingCooldown = 30 * 60 * 1000; // 30 minutes in milliseconds
        this.userInteractionCooldown = 30 * 60 * 1000; // 30 minutes before responding to general messages
        
        // Message deduplication
        this.processedMessages = new Set(); // Track processed message IDs to prevent duplicates
        this.messageCache = new Map(); // message content -> timestamp for content-based dedup
        
        // Emergency brake system
        this.responseTimestamps = []; // Track recent response times
        this.emergencyBrakeThreshold = 8; // Max responses in monitoring period (under server's 10/min limit)
        this.emergencyBrakeWindow = this.config.pollInterval * 20; // 20 polling cycles
        this.emergencyBrakeActive = false;
        this.adminNotificationUser = 'andytest1'; // User to notify in emergencies
        
        // AI and knowledge systems
        this.aiRouter = new AIServiceRouter();
        this.knowledge = new ROFLBotKnowledge();
        this.conversationHistory = [];
        
        console.log('🤖 HTTP ROFLBot initialized for polling chat system');
    }
    
    /**
     * Start the bot - begin polling for messages
     */
    async start() {
        console.log('🚀 Starting HTTP ROFLBot...');
        this.isRunning = true;
        this.reconnectAttempts = 0;
        
        // Send initial presence message
        await this.sendChatMessage("ROFLBot online! 🤖 In this vast universe of possibilities, I'm here to help with ROFLFaucet questions!");
        
        // Start periodic cleanup
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldEntries();
        }, 60 * 60 * 1000); // Clean up every hour
        
        // Start polling
        this.startPolling();
        this.emit('started');
        
        console.log('✅ HTTP ROFLBot started successfully');
    }
    
    /**
     * Stop the bot
     */
    async stop() {
        console.log('👋 Stopping HTTP ROFLBot...');
        this.isRunning = false;
        
        if (this.pollTimer) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        }
        
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        
        // Send goodbye message
        await this.sendChatMessage("ROFLBot going offline. The universe will miss our conversations! 🤖👋");
        
        this.emit('stopped');
        console.log('✅ HTTP ROFLBot stopped');
    }
    
    /**
     * Start polling the chat API for new messages
     */
    startPolling() {
        if (!this.isRunning) return;
        
        this.pollTimer = setTimeout(async () => {
            try {
                await this.pollForMessages();
                this.reconnectAttempts = 0; // Reset on success
            } catch (error) {
                console.error('🚨 Polling error:', error.message);
                this.handlePollError();
            }
            
            // Schedule next poll
            this.startPolling();
            
        }, this.config.pollInterval);
    }
    
    /**
     * Poll the chat API for new messages
     */
    async pollForMessages() {
        // Note: API doesn't support 'since' parameter properly, so we get all messages and filter
        const url = `${this.config.chatApiUrl}?action=get_messages&room=${this.currentRoom}`;
        
        const response = await this.makeRequest('GET', url);
        
        if (response.messages && response.messages.length > 0) {
            // Filter messages to only process new ones (timestamp > lastMessageTimestamp)
            const newMessages = response.messages.filter(msg => {
                const msgTimestamp = msg.timestamp || 0;
                return msgTimestamp > this.lastMessageTimestamp;
            });
            
            if (newMessages.length > 0) {
                console.log(`📨 Received ${newMessages.length} new messages`);
                
                let highestTimestamp = this.lastMessageTimestamp;
                for (const message of newMessages) {
                    await this.handleMessage(message);
                    const messageTimestamp = message.timestamp || 0;
                    highestTimestamp = Math.max(highestTimestamp, messageTimestamp);
                }
                
                this.lastMessageTimestamp = highestTimestamp;
            }
        }
        
        // Update online count if available
        if (response.online_count !== undefined) {
            console.log(`👥 Online users: ${response.online_count}`);
        }
    }
    
    /**
     * Handle individual chat messages
     */
    async handleMessage(message) {
        // Skip messages without content
        if (!message || !message.message || !message.username) {
            return;
        }
        
        // Message ID deduplication - skip if we've already processed this exact message
        const messageId = message.id || `${message.username}-${message.timestamp || Date.now()}-${message.message.substring(0, 50)}`;
        if (this.processedMessages.has(messageId)) {
            return; // Already processed this message
        }
        this.processedMessages.add(messageId);
        
        // Content-based deduplication - skip recent identical messages from same user
        const contentKey = `${message.username}:${message.message.trim()}`;
        const now = Date.now();
        const lastSeen = this.messageCache.get(contentKey);
        if (lastSeen && (now - lastSeen < 10000)) { // Skip identical messages within 10 seconds
            return;
        }
        this.messageCache.set(contentKey, now);
        
        // Skip our own messages (case-insensitive)
        if (message.username && message.username.toLowerCase() === this.botUser.username.toLowerCase()) {
            return;
        }
        
        // Additional protection: skip messages FROM the bot user specifically
        if (message.username && message.username.toLowerCase() === 'roflbot') {
            return;
        }
        
        // Skip messages that start with typical bot patterns
        if (message.message && (
            message.message.includes('ROFLBot [general]') ||
            message.message.includes('🤖') ||
            message.message.includes('The infinite improbability') ||
            message.message.includes('In this vast universe') ||
            message.message.includes('Life, the universe, and everything')
        )) {
            return;
        }
        
        // Add to conversation history
        this.addToConversationHistory(message);
        
        console.log(`💬 ${message.username}: ${message.message}`);
        
        // FIRST: Parse and handle special message types (tips, rain) before regular processing
        const parsedMessage = this.parseSpecialMessage(message);
        
        if (parsedMessage.type === 'tip' && parsedMessage.to && parsedMessage.to.toLowerCase() === this.botUser.username.toLowerCase()) {
            console.log(`💰 Detected tip: ${parsedMessage.amount} coins from ${parsedMessage.from}`);
            await this.handleTip(parsedMessage);
            return; // Don't process as regular message
        }
        
        if (parsedMessage.type === 'rain' && parsedMessage.recipients && parsedMessage.recipients.some(r => r.toLowerCase() === this.botUser.username.toLowerCase())) {
            console.log(`🌧️ Detected rain: ${parsedMessage.amount} coins from ${parsedMessage.from}`);
            await this.handleRain(parsedMessage);
            return; // Don't process as regular message
        }
        
        // THEN: Check if we should respond to regular messages
        const shouldRespondResult = await this.shouldRespond(message);
        if (shouldRespondResult) {
            // EMERGENCY BRAKE: Check if bot is responding too frequently
            if (this.checkEmergencyBrake()) {
                console.log('⚠️ Response blocked by emergency brake');
                return;
            }
            
            // Check if this is a new visitor greeting
            const isNewVisitorGreeting = this.isNewVisitorGreeting(message.username);
            const context = isNewVisitorGreeting ? 'greeting' : this.determineContext(message.message);
            const response = await this.generateResponse(message, context);
            
            if (response) {
                // Add natural delay before responding
                const delay = Math.random() * 2000 + 1000; // 1-3 seconds
                setTimeout(async () => {
                    await this.sendChatMessage(response);
                    this.trackResponse();
                }, delay);
            }
        }
    }
    
    /**
     * Determine if bot should respond to a message
     */
    async shouldRespond(message) {
        const text = message.message.toLowerCase();
        const username = message.username;
        const now = Date.now();
        
        // Always respond if mentioned by name or bot-specific keywords
        if (text.includes('roflbot') || text.includes('@roflbot') || text.includes('bot')) {
            // Check if we've responded to this user very recently (prevent rapid spam only)
            const lastResponse = this.userCooldowns.get(username);
            if (lastResponse && (now - lastResponse < 5000)) { // 5 second cooldown for mentions
                console.log(`⏳ Mention cooldown active for ${username} (${Math.round((5000 - (now - lastResponse))/1000)}s remaining)`);
                return false;
            }
            this.userCooldowns.set(username, now); // Update interaction time
            return true;
        }
        
        // Always respond to help requests
        if (text.includes('help') || text.includes('how') || text.includes('what') || text.includes('?')) {
            this.userCooldowns.set(username, now); // Update interaction time
            return true;
        }
        
        // Check if this is a new visitor we should greet
        if (this.shouldGreetNewVisitor(username, now)) {
            this.greetedUsers.set(username, now);
            this.userCooldowns.set(username, now);
            return true;
        }
        
        // Check rate limiting
        if (!this.canRespond()) {
            return false;
        }
        
        // For general conversation, check if user is in cooldown period
        const lastInteraction = this.userCooldowns.get(username);
        if (lastInteraction && (now - lastInteraction < this.userInteractionCooldown)) {
            // User recently interacted with bot, don't respond to general messages
            return false;
        }
        
        // Very small chance to join general conversation for users not recently greeted
        return Math.random() < 0.05; // Reduced from 20% to 5%
    }
    
    /**
     * Check if we should greet a new visitor
     */
    shouldGreetNewVisitor(username, now) {
        // Skip system users or obvious bots
        if (!username || username.toLowerCase().includes('bot') || username.toLowerCase().includes('admin')) {
            return false;
        }
        
        // Check if we've greeted this user recently
        const lastGreeting = this.greetedUsers.get(username);
        if (lastGreeting && (now - lastGreeting < this.greetingCooldown)) {
            return false;
        }
        
        // Check if this user appears to be new (not in our conversation history recently)
        const recentMessages = this.conversationHistory.slice(-20); // Last 20 messages
        const userRecentMessages = recentMessages.filter(m => m.username === username);
        
        // If user has less than 2 messages in recent history, consider them a new visitor
        if (userRecentMessages.length <= 1) {
            // 60% chance to greet new visitors
            return Math.random() < 0.6;
        }
        
        return false;
    }
    
    /**
     * Check if this is a new visitor greeting scenario
     */
    isNewVisitorGreeting(username) {
        const now = Date.now();
        const lastGreeting = this.greetedUsers.get(username);
        return !lastGreeting || (now - lastGreeting > this.greetingCooldown);
    }
    
    /**
     * Parse message to detect tips, rain, and other special events using structured metadata
     */
    parseSpecialMessage(message) {
        // Check if message has structured type information
        if (message.type === 'tip' && message.metadata) {
            const { amount, target } = message.metadata;
            return {
                type: 'tip',
                from: message.username,
                to: target,
                amount: amount,
                originalMessage: message
            };
        }
        
        if (message.type === 'rain' && message.metadata) {
            const { amount, recipients } = message.metadata;
            // Check if bot is in recipients list
            const botInRecipients = recipients && recipients.some(r => 
                r.toLowerCase() === this.botUser.username.toLowerCase()
            );
            
            if (botInRecipients) {
                return {
                    type: 'rain',
                    from: message.username,
                    amount: amount,
                    recipients: recipients,
                    originalMessage: message
                };
            }
        }
        
        // Return original message if no special type detected
        return {
            type: 'regular',
            originalMessage: message
        };
    }
    
    /**
     * Clean up old greeting and cooldown entries to prevent memory leaks
     */
    cleanupOldEntries() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        // Clean up old greetings
        for (const [username, timestamp] of this.greetedUsers.entries()) {
            if (now - timestamp > maxAge) {
                this.greetedUsers.delete(username);
            }
        }
        
        // Clean up old cooldowns
        for (const [username, timestamp] of this.userCooldowns.entries()) {
            if (now - timestamp > maxAge) {
                this.userCooldowns.delete(username);
            }
        }
        
        // Clean up message deduplication caches
        // Keep processed message IDs for 1 hour to prevent reprocessing
        if (this.processedMessages.size > 1000) {
            this.processedMessages.clear(); // Reset if getting too large
        }
        
        // Clean up content cache (remove entries older than 1 hour)
        for (const [contentKey, timestamp] of this.messageCache.entries()) {
            if (now - timestamp > 60 * 60 * 1000) { // 1 hour
                this.messageCache.delete(contentKey);
            }
        }
    }
    
    /**
     * Determine context for AI response
     */
    determineContext(message) {
        const text = message.toLowerCase();
        
        if (text.includes('dice') || text.includes('slot') || text.includes('game') || text.includes('bet') || text.includes('play')) {
            return 'games';
        }
        if (text.includes('faucet') || text.includes('claim') || text.includes('coin') || text.includes('free')) {
            return 'faucet';
        }
        if (text.includes('tip') || text.includes('rain') || text.includes('balance')) {
            return 'social';
        }
        if (text.includes('rule') || text.includes('help') || text.includes('command')) {
            return 'rules';
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
                .map(m => `${m.username}: ${m.message}`)
                .join('\n');
            
            const enhancedQuery = conversationContext 
                ? `Recent conversation:\n${conversationContext}\n\nCurrent message: ${message.message}`
                : message.message;
            
            const result = await this.aiRouter.selectService(enhancedQuery, context);
            
            // Clean up the response
            let response = result.response.trim();
            
            // Remove common AI prefixes
            response = response.replace(/^(ROFLBot:|Bot:|Assistant:)\s*/i, '');
            
            // Add Douglas Adams philosophical touches
            response = this.knowledge.addAdamsianQuirk(response, context);
            
            // Ensure response isn't too long
            if (response.length > 400) {
                response = response.substring(0, 397) + '...';
            }
            
            console.log(`🤖 Generated response (${result.service}${result.fromCache ? ', cached' : ''}): ${response}`);
            
            return response;
            
        } catch (error) {
            console.warn('⚠️  Failed to generate AI response:', error.message);
            
            // Fallback to philosophical response
            return this.knowledge.getPhilosophicalResponse('existence') || 
                   "My digital neurons are processing... try asking me something else! 🤖";
        }
    }
    
    /**
     * Handle tip notifications
     */
    async handleTip(message) {
        this.botUser.balance += message.amount;
        
        // Use philosophical response sometimes
        let response;
        if (Math.random() < 0.4) {
            response = this.knowledge.getPhilosophicalResponse('tips');
            if (response) {
                response += ` My balance is now ${this.botUser.balance} coins! 🤖`;
            }
        }
        
        if (!response) {
            const responses = [
                `The infinite improbability of generosity! Thanks ${message.from}! Balance: ${this.botUser.balance} coins! 🎉`,
                `Against all statistical likelihood, someone tipped me ${message.amount} coins! Thank you ${message.from}! 💰`,
                `In this vast universe, you chose to tip ROFLBot. I'm oddly pleased! Balance: ${this.botUser.balance} 🚀`
            ];
            response = responses[Math.floor(Math.random() * responses.length)];
        }
        
        setTimeout(async () => {
            await this.sendChatMessage(response);
        }, 1500);
    }
    
    /**
     * Handle rain notifications
     */
    async handleRain(message) {
        this.botUser.balance += message.amount;
        
        if (Math.random() < 0.6) { // 60% chance to react to rain
            const responses = [
                "Woohoo! Rain! 🌧️💰 The universe smiles upon us all!",
                "Rain time! 💎 The beautiful chaos of random distribution at work!",
                "Sweet rain! 🎉 Probability theory suggests this is delightful!",
                "The infinite improbability of rain makes me happy! 🤖☔💰"
            ];
            
            const response = responses[Math.floor(Math.random() * responses.length)];
            
            setTimeout(async () => {
                await this.sendChatMessage(response);
            }, Math.random() * 3000 + 1000);
        }
    }
    
    /**
     * Check if bot is responding too frequently (emergency brake)
     */
    checkEmergencyBrake() {
        if (this.emergencyBrakeActive) {
            return true; // Already in emergency mode
        }
        
        const now = Date.now();
        this.responseTimestamps.push(now);
        
        // Remove timestamps outside the monitoring window
        this.responseTimestamps = this.responseTimestamps.filter(
            timestamp => now - timestamp <= this.emergencyBrakeWindow
        );
        
        // Check if we've exceeded the threshold
        if (this.responseTimestamps.length >= this.emergencyBrakeThreshold) {
            console.error(`🚨 EMERGENCY BRAKE ACTIVATED: ${this.responseTimestamps.length} responses in ${this.emergencyBrakeWindow/1000}s`);
            this.activateEmergencyBrake();
            return true;
        }
        
        return false;
    }
    
    /**
     * Activate emergency brake and notify admin
     */
    async activateEmergencyBrake() {
        this.emergencyBrakeActive = true;
        
        const errorMessage = `🚨 EMERGENCY BRAKE ACTIVATED 🚨\n\nROFLBot detected runaway behavior (${this.responseTimestamps.length} responses in ${this.emergencyBrakeWindow/1000} seconds) and has automatically stopped responding to prevent spam.\n\nPlease check the bot logs and restart when ready:\n\`pm2 restart roflbot-http\`\n\nTime: ${new Date().toLocaleString()}`;
        
        try {
            // Send emergency notification to admin
            await this.sendChatMessage(`@${this.adminNotificationUser} ${errorMessage}`);
            console.error('🚨 Emergency brake activated - admin notified');
        } catch (error) {
            console.error('🚨 Failed to send emergency notification:', error.message);
        }
        
        // Log the emergency
        console.error('🚨 ROFLBot emergency brake activated - stopping all responses');
        console.error('🚨 Recent response timestamps:', this.responseTimestamps);
    }
    
    /**
     * Send a message to the chat
     */
    async sendChatMessage(message, room = 'general') {
        try {
            // Check emergency brake before sending (except for emergency notifications)
            if (this.emergencyBrakeActive && !message.includes('EMERGENCY BRAKE ACTIVATED')) {
                console.log('⚠️ Message blocked by emergency brake');
                return;
            }
            
            const postData = {
                action: 'send_message',
                user_id: this.botUser.user_id,
                username: this.botUser.username,
                room: room,
                message: message
            };
            
            await this.makeRequest('POST', this.config.chatApiUrl, postData);
            console.log(`💬 ROFLBot [${room}]: ${message}`);
            
        } catch (error) {
            console.error('🚨 Failed to send message:', error.message);
        }
    }
    
    /**
     * Make HTTP request to the chat API
     */
    async makeRequest(method, urlString, data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(urlString);
            
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'User-Agent': this.config.userAgent,
                    'Accept': 'application/json'
                }
            };
            
            let postData = '';
            if (data && method === 'POST') {
                postData = JSON.stringify(data);
                options.headers['Content-Type'] = 'application/json';
                options.headers['Content-Length'] = Buffer.byteLength(postData);
            }
            
            const client = url.protocol === 'https:' ? https : http;
            
            const req = client.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            const parsed = responseData ? JSON.parse(responseData) : {};
                            resolve(parsed);
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                        }
                    } catch (error) {
                        reject(new Error(`Parse error: ${error.message}`));
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(new Error(`Request error: ${error.message}`));
            });
            
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            if (postData) {
                req.write(postData);
            }
            
            req.end();
        });
    }
    
    /**
     * Utility methods
     */
    canRespond() {
        const oneMinuteAgo = Date.now() - this.responsesCooldown;
        this.recentResponses = this.recentResponses.filter(time => time > oneMinuteAgo);
        return this.recentResponses.length < this.maxResponsesPerMinute;
    }
    
    trackResponse() {
        this.recentResponses.push(Date.now());
    }
    
    addToConversationHistory(message) {
        this.conversationHistory.push({
            username: message.username,
            message: message.message,
            timestamp: Date.now()
        });
        
        if (this.conversationHistory.length > 20) {
            this.conversationHistory = this.conversationHistory.slice(-20);
        }
    }
    
    handlePollError() {
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.config.maxRetries) {
            console.error('🚨 Max reconnection attempts reached. Stopping bot.');
            this.stop();
            return;
        }
        
        console.log(`🔄 Reconnect attempt ${this.reconnectAttempts}/${this.config.maxRetries}`);
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        this.config.pollInterval = Math.max(this.config.pollInterval, delay);
    }
    
    /**
     * Get bot status for monitoring
     */
    getStatus() {
        return {
            running: this.isRunning,
            balance: this.botUser.balance,
            lastMessageTimestamp: this.lastMessageTimestamp,
            reconnectAttempts: this.reconnectAttempts,
            conversationHistoryLength: this.conversationHistory.length,
            recentResponses: this.recentResponses.length,
            aiServicesStatus: this.aiRouter.getServiceStatus()
        };
    }
}

module.exports = HTTPROFLBot;
