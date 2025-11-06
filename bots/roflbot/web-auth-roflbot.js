/**
 * Enhanced ROFLBot with Web Authentication
 * =======================================
 * Handles web-based login before WebSocket connection
 */

const WebSocket = require('ws');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const AIServiceRouter = require('./ai-service-router');
const ROFLBotKnowledge = require('./roflbot-knowledge');
const EventEmitter = require('events');

class WebAuthROFLBot extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Bot credentials
        this.credentials = {
            username: 'ROFLBot',
            password: '9IrBSpSi5ZHbTNft',
            email: 'roflbot@roflfaucet.com'
        };
        
        // Authentication state
        this.authState = {
            loggedIn: false,
            sessionCookie: null,
            authToken: null,
            userId: null
        };
        
        // Connection settings
        this.config = {
            loginUrl: options.loginUrl || 'https://auth.directsponsor.org/login',
            websocketUrl: options.websocketUrl || 'wss://roflfaucet.com:8082/chat',
            chatUrl: options.chatUrl || 'https://roflfaucet.com/chat',
            retryDelay: options.retryDelay || 10000,
            maxRetries: options.maxRetries || 20
        };
        
        // Bot setup (same as original)
        this.botUser = {
            id: 'roflbot',
            username: 'ROFLBot',
            displayName: '🤖 ROFLBot',
            balance: 0,
            isBot: true,
            isVIP: true,
            level: 1,
            joinDate: new Date().toISOString()
        };
        
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.aiRouter = new AIServiceRouter();
        this.knowledge = new ROFLBotKnowledge();
        this.conversationHistory = [];
        this.recentResponses = [];
        
        console.log('🤖 WebAuth ROFLBot initialized');
    }
    
    /**
     * Main connection flow: Login → WebSocket
     */
    async connect() {
        try {
            console.log('🔐 Starting authentication flow...');
            
            // Step 1: Web authentication
            const loginSuccess = await this.performWebLogin();
            
            if (!loginSuccess) {
                console.error('❌ Web authentication failed');
                this.scheduleReconnect();
                return;
            }
            
            console.log('✅ Web authentication successful');
            
            // Step 2: Connect to WebSocket with auth
            await this.connectWebSocket();
            
        } catch (error) {
            console.error('🚨 Connection flow failed:', error.message);
            this.scheduleReconnect();
        }
    }
    
    /**
     * Perform web-based login to get session
     */
    async performWebLogin() {
        return new Promise((resolve) => {
            console.log(`🌐 Attempting login to ${this.config.loginUrl}...`);
            
            // Prepare login data
            const loginData = JSON.stringify({
                username: this.credentials.username,
                password: this.credentials.password,
                email: this.credentials.email
            });
            
            const url = new URL(this.config.loginUrl);
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(loginData),
                    'User-Agent': 'ROFLBot/1.0 (Automated Chat Assistant)',
                    'Accept': 'application/json'
                }
            };
            
            const client = url.protocol === 'https:' ? https : http;
            
            const req = client.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    console.log(`📡 Login response: ${res.statusCode}`);
                    
                    if (res.statusCode === 200 || res.statusCode === 302) {
                        // Extract session information
                        this.extractAuthInfo(res.headers, responseData);
                        this.authState.loggedIn = true;
                        resolve(true);
                    } else {
                        console.error(`❌ Login failed: ${res.statusCode} ${responseData}`);
                        resolve(false);
                    }
                });
            });
            
            req.on('error', (error) => {
                console.error('🚨 Login request error:', error.message);
                resolve(false);
            });
            
            req.setTimeout(15000, () => {
                req.destroy();
                console.error('⏰ Login request timeout');
                resolve(false);
            });
            
            req.write(loginData);
            req.end();
        });
    }
    
    /**
     * Extract authentication info from login response
     */
    extractAuthInfo(headers, body) {
        // Extract session cookies
        const cookies = headers['set-cookie'];
        if (cookies) {
            this.authState.sessionCookie = cookies.join('; ');
            console.log('🍪 Session cookies extracted');
        }
        
        // Try to extract auth token from response body
        try {
            const response = JSON.parse(body);
            if (response.token) {
                this.authState.authToken = response.token;
                console.log('🔑 Auth token extracted');
            }
            if (response.userId || response.user_id) {
                this.authState.userId = response.userId || response.user_id;
                console.log(`👤 User ID: ${this.authState.userId}`);
            }
        } catch (error) {
            // Body might not be JSON, that's okay
            console.log('📄 Response body is not JSON, continuing...');
        }
    }
    
    /**
     * Connect to WebSocket with authentication
     */
    async connectWebSocket() {
        try {
            console.log(`🔌 Connecting to WebSocket: ${this.config.websocketUrl}`);
            
            // Prepare WebSocket headers with authentication
            const wsHeaders = {
                'User-Agent': 'ROFLBot/1.0 (Automated Chat Assistant)'
            };
            
            // Add authentication info to headers
            if (this.authState.sessionCookie) {
                wsHeaders['Cookie'] = this.authState.sessionCookie;
            }
            
            if (this.authState.authToken) {
                wsHeaders['Authorization'] = `Bearer ${this.authState.authToken}`;
            }
            
            // Create WebSocket connection
            this.ws = new WebSocket(this.config.websocketUrl, {
                headers: wsHeaders
            });
            
            this.ws.on('open', () => {
                console.log('✅ WebSocket connected successfully');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.emit('connected');
                
                // Send authentication message if needed
                this.sendAuthMessage();
            });
            
            this.ws.on('message', (data) => {
                this.handleWebSocketMessage(JSON.parse(data.toString()));
            });
            
            this.ws.on('close', (code, reason) => {
                console.log(`❌ WebSocket disconnected: ${code} ${reason}`);
                this.isConnected = false;
                this.emit('disconnected');
                this.scheduleReconnect();
            });
            
            this.ws.on('error', (error) => {
                console.error('🚨 WebSocket error:', error.message);
                this.emit('error', error);
            });
            
        } catch (error) {
            console.error('🚨 WebSocket connection failed:', error.message);
            this.scheduleReconnect();
        }
    }
    
    /**
     * Send authentication message to WebSocket
     */
    sendAuthMessage() {
        const authMessage = {
            type: 'auth',
            user: this.botUser,
            credentials: {
                username: this.credentials.username,
                token: this.authState.authToken,
                userId: this.authState.userId
            }
        };
        
        this.sendWebSocketMessage(authMessage);
        console.log('🔐 Authentication message sent');
    }
    
    /**
     * Handle incoming WebSocket messages
     */
    async handleWebSocketMessage(message) {
        console.log(`📨 Received: ${message.type}`);
        
        switch (message.type) {
            case 'auth_success':
                console.log('✅ Chat authentication successful');
                this.sendChatMessage("ROFLBot online! 🤖 In this vast universe of possibilities, I'm here to help with ROFLFaucet questions!", 'general');
                break;
                
            case 'auth_failed':
                console.error('❌ Chat authentication failed:', message.reason);
                this.scheduleReconnect();
                break;
                
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
                
            default:
                console.log(`📝 Unhandled message type: ${message.type}`);
        }
    }
    
    /**
     * Handle chat messages (same as original ROFLBot)
     */
    async handleChatMessage(message) {
        if (message.user === this.botUser.username || message.type === 'system') {
            return;
        }
        
        // Check if should respond
        if (await this.shouldRespond(message)) {
            const context = this.determineContext(message.message);
            const response = await this.generateResponse(message, context);
            
            if (response) {
                setTimeout(() => {
                    this.sendChatMessage(response, message.room);
                }, Math.random() * 1000 + 500);
            }
        }
    }
    
    async handleTip(message) {
        if (message.to === this.botUser.username) {
            this.botUser.balance += message.amount;
            
            // Use philosophical tip response
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
            
            setTimeout(() => {
                this.sendChatMessage(response, message.room || 'general');
            }, 1000);
        }
    }
    
    async shouldRespond(message) {
        const text = message.message.toLowerCase();
        
        // Always respond to mentions
        if (text.includes('roflbot') || text.includes('bot')) {
            return true;
        }
        
        // Always respond to help requests
        if (text.includes('help') || text.includes('how') || text.includes('what') || text.includes('?')) {
            return true;
        }
        
        // Random chance for general chat
        return Math.random() < 0.2; // 20% chance
    }
    
    determineContext(message) {
        const text = message.toLowerCase();
        
        if (text.includes('dice') || text.includes('slot') || text.includes('game') || text.includes('bet')) {
            return 'games';
        }
        if (text.includes('faucet') || text.includes('claim') || text.includes('coin')) {
            return 'faucet';
        }
        if (text.includes('tip') || text.includes('rain') || text.includes('balance')) {
            return 'social';
        }
        if (text.includes('rule') || text.includes('help')) {
            return 'rules';
        }
        
        return 'general';
    }
    
    async generateResponse(message, context) {
        try {
            // Use AI service router for response
            const result = await this.aiRouter.selectService(message.message, context);
            let response = result.response.trim();
            
            // Add Douglas Adams philosophical touches
            response = this.knowledge.addAdamsianQuirk(response, context);
            
            // Limit length
            if (response.length > 400) {
                response = response.substring(0, 397) + '...';
            }
            
            return response;
            
        } catch (error) {
            console.warn('⚠️ AI response failed:', error.message);
            return this.knowledge.getPhilosophicalResponse('existence') || 
                   "My digital neurons are processing... try asking me something else! 🤖";
        }
    }
    
    sendChatMessage(message, room = 'general') {
        if (!this.isConnected) return;
        
        this.sendWebSocketMessage({
            type: 'message',
            room: room,
            message: message
        });
        
        console.log(`💬 ROFLBot [${room}]: ${message}`);
    }
    
    sendWebSocketMessage(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
    
    /**
     * Reconnection logic
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.config.maxRetries) {
            console.error('🚨 Max reconnection attempts reached');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.config.retryDelay * this.reconnectAttempts;
        
        console.log(`🔄 Reconnecting in ${delay/1000}s (${this.reconnectAttempts}/${this.config.maxRetries})...`);
        
        setTimeout(() => {
            this.connect();
        }, delay);
    }
    
    /**
     * Graceful shutdown
     */
    disconnect() {
        console.log('👋 WebAuth ROFLBot shutting down...');
        
        if (this.ws) {
            this.sendChatMessage("ROFLBot going offline. The universe will miss our conversations! 🤖👋", 'general');
            
            setTimeout(() => {
                this.ws.close();
            }, 1000);
        }
    }
}

module.exports = WebAuthROFLBot;