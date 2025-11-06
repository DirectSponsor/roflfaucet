/**
 * Anzar Rainbot - Automated Timed Rain System for ROFLFaucet
 * ===========================================================
 * A dedicated bot that automatically sends rains at regular intervals
 * and collects coins from user messages and tips to fund the rains.
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class AnzarRainbot extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Bot user info
        this.botUser = {
            user_id: options.userId || 'anzar',
            username: options.username || 'Anzar',
            displayName: options.displayName || '🌧️ Anzar',
            balance: 0,
            isBot: true
        };
        
        // API endpoints
        this.config = {
            chatApiUrl: options.chatApiUrl || 'https://roflfaucet.com/api/simple-chat.php',
            pollInterval: options.pollInterval || 3000, // 3 seconds
            maxRetries: options.maxRetries || 10,
            userAgent: 'AnzarRainbot/1.0 (ROFLFaucet Rain System)'
        };
        
        // Rainbot config
        this.rainConfig = {
            rainScheduleMinute: options.rainMinute || 30, // Rain at X:30 every hour
            minRainAmount: options.minRainAmount || 20, // Minimum rain amount
            maxRainAmount: options.maxRainAmount || 100, // Maximum rain amount
            coinsPerMessage: options.coinsPerMessage || 1, // How many coins added per user message
            rainCooldown: options.rainCooldown || 60 * 60 * 1000, // 1 hour between rains
            announceChance: options.announceChance || 0.25, // 25% chance of announcement per hour
        };
        
        // State tracking
        this.isRunning = false;
        this.lastMessageTimestamp = 0;
        this.currentRoom = 'general';
        this.pollTimer = null;
        this.reconnectAttempts = 0;
        this.lastRainTime = 0;
        
        // Message deduplication
        this.processedMessages = new Set();
        this.messageCache = new Map();
        
        // Internal state
        this.lastRainHour = -1;
        this.rainMessageQueue = [];
        
        // Track recent messages for activity checking
        this.recentMessages = []; // Store timestamps of recent messages
        this.lastLowFundsWarning = 0; // Track when we last sent low funds warning
        
        console.log('🌧️ Anzar Rainbot initialized');
    }
    
    /**
     * Start the rainbot
     */
    async start() {
        console.log('🚀 Starting Anzar Rainbot...');
        this.isRunning = true;
        this.reconnectAttempts = 0;
        
        // Send initial presence message
        await this.sendChatMessage("Anzar has awakened! The rain clouds are gathering! ☔");
        
        // Get initial balance
        // TODO: Implement balance fetching from API
        
        // Start periodic jobs
        this.rainTimer = setInterval(() => this.checkRainTime(), 60 * 1000); // Check every minute
        this.announceTimer = setInterval(() => this.maybeAnnounce(), 60 * 60 * 1000); // Check every hour
        this.cleanupTimer = setInterval(() => this.cleanupOldEntries(), 60 * 60 * 1000); // Cleanup every hour
        
        // Start polling
        this.startPolling();
        this.emit('started');
        
        console.log('✅ Anzar Rainbot started successfully');
    }
    
    /**
     * Stop the rainbot
     */
    async stop() {
        console.log('👋 Stopping Anzar Rainbot...');
        this.isRunning = false;
        
        // Clear all timers
        if (this.pollTimer) clearTimeout(this.pollTimer);
        if (this.rainTimer) clearInterval(this.rainTimer);
        if (this.announceTimer) clearInterval(this.announceTimer);
        if (this.cleanupTimer) clearInterval(this.cleanupTimer);
        
        // Send goodbye message
        await this.sendChatMessage("The rain clouds are dispersing. Anzar is going offline for now! ☁️");
        
        this.emit('stopped');
        console.log('✅ Anzar Rainbot stopped');
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
        
        // Process message for rain collection (each user message = 1 coin)
        await this.processMessageForRainpool(message);
    }
    
    /**
     * Process message to add coins to the rainpool
     */
    async processMessageForRainpool(message) {
        // Ignore command messages
        if (message.message.startsWith('/')) {
            return;
        }
        
        // Process this as a regular message
        console.log(`💬 ${message.username}: ${message.message}`);
        
        // Check if this is a tip message to Anzar
        const parsedMessage = this.parseSpecialMessage(message);
        
        if (parsedMessage.type === 'tip' && 
            parsedMessage.to && 
            parsedMessage.to.toLowerCase() === this.botUser.username.toLowerCase()) {
            
            console.log(`💰 Received tip: ${parsedMessage.amount} coins from ${parsedMessage.from}`);
            // Update balance
            this.botUser.balance += parsedMessage.amount;
            
            // Thank the tipper
            const responses = [
                `Thanks for the ${parsedMessage.amount} coin tip, ${parsedMessage.from}! The rainpool is growing! ☔`,
                `${parsedMessage.from} added ${parsedMessage.amount} coins to the rainpool! Rain coming at :${this.rainConfig.rainScheduleMinute}! 🌧️`,
                `Your ${parsedMessage.amount} coins will make it rain harder, ${parsedMessage.from}! ⛈️`
            ];
            
            const response = responses[Math.floor(Math.random() * responses.length)];
            await this.sendChatMessage(response);
            
            return;
        } else {
            // Regular message, add coins to the balance
            this.botUser.balance += this.rainConfig.coinsPerMessage;
            console.log(`💧 Added ${this.rainConfig.coinsPerMessage} coins to rainpool from message by ${message.username}`);
        }
        
        // Track this message for activity monitoring
        this.trackMessageActivity(message);
    }
    
    /**
     * Track message activity for chat activity monitoring
     */
    trackMessageActivity(message) {
        // Don't track command messages or bot messages
        if (message.message.startsWith('/') || 
            message.username.toLowerCase() === this.botUser.username.toLowerCase()) {
            return;
        }
        
        const now = Date.now();
        this.recentMessages.push(now);
        
        // Clean up messages older than 1 hour
        const oneHourAgo = now - (60 * 60 * 1000);
        this.recentMessages = this.recentMessages.filter(timestamp => timestamp > oneHourAgo);
    }
    
    /**
     * Get count of messages in the last hour
     */
    getRecentMessageCount() {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        return this.recentMessages.filter(timestamp => timestamp > oneHourAgo).length;
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
        
        // Return original message if no special type detected
        return {
            type: 'regular',
            originalMessage: message
        };
    }
    
    /**
     * Check if it's time for a rain or pre-rain warning
     */
    checkRainTime() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Check for pre-rain warning (10 minutes before rain time)
        const warningMinute = (this.rainConfig.rainScheduleMinute - 10 + 60) % 60;
        if (currentMinute === warningMinute && currentHour !== this.lastRainHour) {
            this.checkPreRainWarning();
        }
        
        // Check if it's rain time and we haven't rained this hour
        if (currentMinute === this.rainConfig.rainScheduleMinute && currentHour !== this.lastRainHour) {
            this.lastRainHour = currentHour;
            console.log('⏰ Rain time check - initiating rain!');
            this.executeRain();
        }
    }
    
    /**
     * Check if we should send a pre-rain warning for low funds
     */
    async checkPreRainWarning() {
        // Only warn if we don't have enough coins for rain
        if (this.botUser.balance >= this.rainConfig.minRainAmount) {
            return;
        }
        
        // Check chat activity - only warn if there have been at least 6 messages in the last hour
        const recentMessageCount = this.getRecentMessageCount();
        if (recentMessageCount < 6) {
            console.log(`🔇 Skipping low funds warning - only ${recentMessageCount} messages in last hour (need 6+)`);
            return;
        }
        
        // Don't send warning too frequently (max once every 30 minutes)
        const now = Date.now();
        if (now - this.lastLowFundsWarning < 30 * 60 * 1000) {
            return;
        }
        
        this.lastLowFundsWarning = now;
        
        const warningMessages = [
            `⛈️ Rain in 10 minutes but only ${this.botUser.balance} coins in the pool! Need ${this.rainConfig.minRainAmount - this.botUser.balance} more coins from chat activity and tips! 🗨️💬`,
            `🌧️ Rain timer: 10 minutes! Current pool: ${this.botUser.balance}/${this.rainConfig.minRainAmount} coins. Every message and tip counts! Keep chatting! 💰`,
            `⏰ 10 minutes to rain time! Pool at ${this.botUser.balance} coins (need ${this.rainConfig.minRainAmount}). More chat = bigger rain! 💬⛅`,
            `🌩️ Rain alert! ${this.rainConfig.minRainAmount - this.botUser.balance} coins needed in 10 minutes. Chat activity builds the rainpool! 🗨️✨`
        ];
        
        const message = warningMessages[Math.floor(Math.random() * warningMessages.length)];
        console.log(`⚠️ Sending pre-rain low funds warning (${recentMessageCount} messages in last hour)`);
        await this.sendChatMessage(message);
    }
    
    /**
     * Execute a rain event
     */
    async executeRain() {
        const now = Date.now();
        
        // Don't rain if we've rained recently (respects cooldown)
        if (now - this.lastRainTime < this.rainConfig.rainCooldown) {
            console.log('⏳ Rain cooldown active, skipping this rain');
            return;
        }
        
        // Don't rain if the balance is too low
        if (this.botUser.balance < this.rainConfig.minRainAmount) {
            console.log(`💰 Not enough coins for rain (${this.botUser.balance} < ${this.rainConfig.minRainAmount})`);
            // We already sent a warning 10 minutes ago if chat was active enough
            // Only send a quiet message now if chat is active
            const recentMessageCount = this.getRecentMessageCount();
            if (recentMessageCount >= 6) {
                await this.sendChatMessage("☁️ No rain this hour... the rainpool ran dry! Keep chatting to build it up! ☁️");
            }
            return;
        }
        
        // Calculate rain amount - either balance or max rain amount, whichever is smaller
        const rainAmount = Math.min(this.botUser.balance, this.rainConfig.maxRainAmount);
        
        console.log(`🌧️ Executing rain of ${rainAmount} coins!`);
        this.lastRainTime = now;
        
        // Send rain command
        await this.sendChatMessage(`/rain ${rainAmount}`);
        
        // Deduct from balance
        this.botUser.balance -= rainAmount;
        
        // Send announcement with rain GIF
        setTimeout(async () => {
            await this.sendChatMessage(`⛈️ THE RAINS HAVE COME! ${rainAmount} coins rained on active users! Next rain at XX:${this.rainConfig.rainScheduleMinute}! 💰\n\nhttps://media.giphy.com/media/3o6fIUZTTDl0IDjbZS/giphy.gif\n\n🌧️ *Rain clouds dispersing...* 🌧️`);
        }, 2000);
    }
    
    /**
     * Maybe make an announcement about the rainbot
     */
    async maybeAnnounce() {
        if (Math.random() > this.rainConfig.announceChance) {
            return;
        }
        
        const announcements = [
            `☔ Rain clouds gathering... tip me to boost the rainpool! Current balance: ${this.botUser.balance} coins`,
            `🌩️ Every message adds ${this.rainConfig.coinsPerMessage} coin to the rainpool! Current balance: ${this.botUser.balance} coins`,
            `⏰ Rain falls at :${this.rainConfig.rainScheduleMinute} past each hour! Current rainpool: ${this.botUser.balance} coins`,
            `💰 Tip me and I'll make it rain on everyone! Current balance: ${this.botUser.balance} coins 🌧️`
        ];
        
        const msg = announcements[Math.floor(Math.random() * announcements.length)];
        await this.sendChatMessage(msg);
    }
    
    /**
     * Clean up old entries to prevent memory leaks
     */
    cleanupOldEntries() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        // Clean up message deduplication caches
        if (this.processedMessages.size > 1000) {
            this.processedMessages.clear(); // Reset if getting too large
        }
        
        // Clean up content cache
        for (const [contentKey, timestamp] of this.messageCache.entries()) {
            if (now - timestamp > 60 * 60 * 1000) { // 1 hour
                this.messageCache.delete(contentKey);
            }
        }
        
        // Clean up recent message tracking (keep only last hour)
        const oneHourAgo = now - (60 * 60 * 1000);
        this.recentMessages = this.recentMessages.filter(timestamp => timestamp > oneHourAgo);
    }
    
    /**
     * Send a message to the chat
     */
    async sendChatMessage(message, room = 'general') {
        try {
            const postData = {
                action: 'send_message',
                user_id: this.botUser.user_id,
                username: this.botUser.username,
                room: room,
                message: message
            };
            
            await this.makeRequest('POST', this.config.chatApiUrl, postData);
            console.log(`💬 Anzar [${room}]: ${message}`);
            
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
     * Handle poll error with exponential backoff
     */
    handlePollError() {
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.config.maxRetries) {
            console.error('🚨 Max reconnection attempts reached. Stopping rainbot.');
            this.stop();
            return;
        }
        
        console.log(`🔄 Reconnect attempt ${this.reconnectAttempts}/${this.config.maxRetries}`);
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        this.config.pollInterval = Math.max(this.config.pollInterval, delay);
    }
    
    /**
     * Get rainbot status for monitoring
     */
    getStatus() {
        return {
            running: this.isRunning,
            balance: this.botUser.balance,
            lastMessageTimestamp: this.lastMessageTimestamp,
            reconnectAttempts: this.reconnectAttempts,
            lastRainTime: this.lastRainTime,
            nextRainMinute: this.rainConfig.rainScheduleMinute,
            nextRainHour: this.lastRainHour === new Date().getHours() ? (new Date().getHours() + 1) % 24 : new Date().getHours(),
            recentMessageCount: this.getRecentMessageCount(),
            lastLowFundsWarning: this.lastLowFundsWarning
        };
    }
}

module.exports = AnzarRainbot;