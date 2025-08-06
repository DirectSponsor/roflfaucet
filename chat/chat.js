/**
 * ROFLFaucet PHP Polling Chat Widget
 * Replaces WebSocket functionality with AJAX polling
 */

class ChatWidget {
    constructor() {
        this.currentRoom = 'general';
        this.rooms = {
            general: { id: 1, name: 'General', unread: 0, lastMessageId: 0 },
            help: { id: 2, name: 'Help', unread: 0, lastMessageId: 0 }
        };
        this.isConnected = false;
        this.authToken = null;
        this.username = null;
        this.userId = null;
        this.pollInterval = null;
        this.pollDelay = 3000; // 3 seconds polling
        this.isPolling = false;
        this.onlineCount = 0;
        this.isInitialLoad = true; // Track if we're loading initial messages
        this.minMessages = 50; // Always keep at least this many messages (never empty)
        this.maxMessages = 100; // Comfortable viewing limit
        this.cleanupThreshold = 200; // Only cleanup when we exceed this many messages
        this.messageAgeLimit = 7200; // 2 hours in seconds (generous time limit)
        this.lastCleanupTime = 0; // Track when we last did cleanup
        this.cleanupInterval = 300; // Run cleanup every 5 minutes
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing PHP Chat Widget...');
        
        // Get user info from existing authentication system
        const userInfo = this.getUserFromAuth();
        
        if (!userInfo) {
            // Allow guests to view chat but not participate
            console.log('🔗 Chat: Guest user - showing read-only chat');
            this.username = null;
            this.userId = null;
            this.initializeGuestUI();
            this.showStatus('Sign in to chat', 'warning');
            return;
        }
        
        this.username = userInfo.username;
        this.userId = userInfo.userId;
        
        console.log(`👤 Chat user: ${this.username} (ID: ${this.userId})`);
        
        // Initialize UI for logged-in users
        this.initializeUI();
        
        // Start polling
        this.startPolling();
        
        console.log('✅ Chat widget initialized');
    }

    getAuthToken() {
        // Integration with unified JWT system
        // First check if SimpleFaucet is available and has a token
        if (window.simpleFaucet && window.simpleFaucet.jwtToken) {
            console.log('🔗 Chat: Using token from SimpleFaucet system');
            return window.simpleFaucet.jwtToken;
        }
        
        // Fallback to storage locations
        const token = localStorage.getItem('jwt_token') || 
                     sessionStorage.getItem('jwt_token') || 
                     this.getCookie('jwt_token');
        
        if (token) {
            console.log('🔗 Chat: Found token in storage');
        } else {
            console.log('🔗 Chat: No token found anywhere');
        }
        
        return token;
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    getUserFromAuth() {
        // Simple check: if user is logged in, unified balance system will have their info
        if (window.unifiedBalance && window.unifiedBalance.isLoggedIn) {
            const userId = window.unifiedBalance.userId;
            
            if (userId && userId !== 'guest') {
                // Try to get username from SimpleFaucet profile if available
                let username = 'Member';
                
                if (window.simpleFaucet && window.simpleFaucet.userProfile) {
                    username = window.simpleFaucet.userProfile.username;
                } else {
                    // Fallback: try to get from JWT if available
                    const token = localStorage.getItem('jwt_token');
                    if (token) {
                        try {
                            const payload = token.split('.')[1];
                            const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
                            username = decoded.username || `User${userId}`;
                        } catch (e) {
                            username = `User${userId}`;
                        }
                    } else {
                        username = `User${userId}`;
                    }
                }
                
                console.log('🔗 Chat: User is logged in via unified balance system');
                return {
                    username: username,
                    userId: userId
                };
            }
        }
        
        console.log('🔗 Chat: User not logged in (guests cannot use chat)');
        return null;
    }

    getUserInfo() {
        if (!this.authToken) return;
        
        try {
            // Decode JWT payload (basic decode for username)
            const payload = this.authToken.split('.')[1];
            const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
            this.username = decoded.username;
            this.userId = decoded.sub;
            console.log(`👤 Logged in as: ${this.username}`);
        } catch (e) {
            console.error('❌ Error decoding token:', e);
            this.showStatus('Invalid authentication token', 'error');
        }
    }

    initializeUI() {
        // Create chat widget HTML
        this.createChatWidget();
        
        // Bind event listeners
        this.bindEvents();
        
        // Show connected status
        this.showStatus(`Connected as ${this.username}`, 'connected');
        
        // Enable input
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send-btn');
        if (input && sendBtn) {
            input.disabled = false;
            sendBtn.disabled = false;
            input.placeholder = 'Type a message...';
        }
    }

    initializeGuestUI() {
        // Create chat widget HTML for guests (read-only)
        this.createChatWidget();
        
        // Bind event listeners (limited for guests)
        this.bindGuestEvents();
        
        // Keep input disabled for guests
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send-btn');
        if (input && sendBtn) {
            input.disabled = true;
            sendBtn.disabled = true;
            input.placeholder = 'Sign in to chat...';
        }
        
        // Start polling for guest to see messages
        this.startGuestPolling();
    }

    createChatWidget() {
        const container = document.getElementById('chat-widget-container');
        if (!container) return;

        container.innerHTML = `
            <div class="chat-widget" id="chat-widget">
                <div class="chat-tabs">
                    <div class="chat-tab active" data-room="general">
                        <span class="tab-icon">🌟</span>
                        <span class="tab-name">General</span>
                        <span class="unread-count" id="unread-general">0</span>
                    </div>
                    <div class="chat-tab" data-room="help">
                        <span class="tab-icon">❓</span>
                        <span class="tab-name">Help</span>
                    </div>
                </div>

                <div class="chat-content">
                    <!-- General Chat Room -->
                    <div class="chat-room active" id="room-general">
                        <div class="chat-messages" id="messages-general">
                            <div class="chat-message system-message">
                                <div class="message-content">
                                    <span class="message-text">Welcome to ROFLFaucet Community Chat! 🎉</span>
                                    <span class="message-time">now</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Help Room -->
                    <div class="chat-room" id="room-help">
                        <div class="chat-help-content">
                            <h4>Chat Commands</h4>
                            <div class="help-section">
                                <strong>/tip [user] [amount]</strong> - Tip coins to another user<br>
                                <strong>/rain [amount]</strong> - Make it rain coins for everyone!<br>
                                <strong>/balance</strong> - Check your coin balance<br>
                                <strong>/online</strong> - See how many users are online
                            </div>
                            
                            <h4>Chat Rules</h4>
                            <div class="help-section">
                                • Keep it friendly and respectful<br>
                                • No spam or excessive caps<br>
                                • No begging for tips or coins<br>
                                • Have fun and help others! 🚀
                            </div>

                            <h4>Features</h4>
                            <div class="help-section">
                                Tip other users and participate in rain events!<br>
                                All users can participate - no VIP required! 🌧️
                            </div>
                        </div>
                    </div>
                </div>

                <div class="chat-footer">
                    <div class="chat-input-container">
                        <input type="text" 
                               class="chat-input" 
                               id="chat-input" 
                               placeholder="Type a message..."
                               maxlength="500"
                               disabled>
                        <button class="chat-send-btn" id="chat-send-btn" disabled>
                            <span class="send-icon">📤</span>
                        </button>
                    </div>
                    <div class="chat-bottom-status">
                        <div class="status-item">
                            <span class="status-label">💰 Pool:</span>
                            <span class="rainpool-amount" id="rainpool-amount">0</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">👥 Online:</span>
                            <span id="online-count">0</span>
                        </div>
                        <div class="status-item status-connection">
                            <span class="status-text" id="chat-status-text">Connecting...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchRoom(tab.dataset.room));
        });

        // Send message
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send-btn');

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
    }

    bindGuestEvents() {
        // Only allow tab switching for guests - no message sending
        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchRoom(tab.dataset.room));
        });

        // Disable input events for guests
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send-btn');

        if (input) {
            input.addEventListener('click', () => {
                // Show friendly reminder to sign in when guest clicks input
                this.showStatus('Sign in to participate in chat', 'warning');
            });
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                // Show friendly reminder to sign in when guest clicks send
                this.showStatus('Sign in to participate in chat', 'warning');
            });
        }
    }

    switchRoom(roomName) {
        if (!this.rooms[roomName]) return;

        this.currentRoom = roomName;

        // Update tabs
        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.room === roomName);
        });

        // Update rooms
        document.querySelectorAll('.chat-room').forEach(room => {
            room.classList.toggle('active', room.id === `room-${roomName}`);
        });

        // Clear unread count
        this.rooms[roomName].unread = 0;
        this.updateUnreadCount(roomName);

        console.log(`🔄 Switched to room: ${roomName}`);
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        if (!input || !input.value.trim()) return;

        const message = input.value.trim();
        input.value = '';

        console.log('🔄 Chat: Sending message:', message);

        // Handle all coin commands locally using unified balance system
        if (message.startsWith('/')) {
            console.log('💡 Chat: Command detected:', message);
            const parts = message.split(' ');
            const command = parts[0].toLowerCase();
            console.log('💡 Chat: Parsed command:', command);
            
            // Handle /balance command completely on frontend - never send to backend
            if (command === '/balance') {
                console.log('💡 Chat: Processing /balance command...');
                
                try {
                    // Check if unified balance system is available
                    if (!window.unifiedBalance) {
                        this.displayMessage({
                            username: 'System',
                            message: 'Please log in to check your balance',
                            type: 'system',
                            timestamp: Date.now() / 1000
                        }, this.currentRoom);
                        return;
                    }
                    
                    console.log('🔍 Chat: Fetching balance via unified system...');
                    const balance = await window.unifiedBalance.getBalance();
                    const terminology = window.unifiedBalance.getTerminology();
                    const formattedBalance = Math.floor(balance);
                    
                    console.log('💰 Chat: Balance fetched:', formattedBalance, terminology.currency);
                    
                    this.displayMessage({
                        username: 'System',
                        message: `Your balance: ${formattedBalance} ${terminology.currency.toLowerCase()}`,
                        type: 'system',
                        timestamp: Date.now() / 1000
                    }, this.currentRoom);
                    return;
                } catch (error) {
                    console.error('❌ Chat: Balance fetch error:', error);
                    this.displayMessage({
                        username: 'System',
                        message: `Unable to fetch balance: ${error.message || 'Unknown error'}`,
                        type: 'system',
                        timestamp: Date.now() / 1000
                    }, this.currentRoom);
                    return;
                }
            }
            
            switch (command) {
                case '/balance':
                    // This case should never be reached now
                    return;
                    try {
                        // Check if unified balance system is available
                        if (!window.unifiedBalance) {
                            this.displayMessage({
                                username: 'System',
                                message: 'Balance system not loaded yet, please try again',
                                type: 'system',
                                timestamp: Date.now() / 1000
                            }, this.currentRoom);
                            return;
                        }
                        
                        console.log('🔍 Chat: Fetching balance via unified system...');
                        const balance = await window.unifiedBalance.getBalance();
                        const terminology = window.unifiedBalance.getTerminology();
                        const formattedBalance = Math.floor(balance);
                        
                        console.log('💰 Chat: Balance fetched:', formattedBalance, terminology.currency);
                        
                        this.displayMessage({
                            username: 'System',
                            message: `Your balance: ${formattedBalance} ${terminology.currency.toLowerCase()}`,
                            type: 'system',
                            timestamp: Date.now() / 1000
                        }, this.currentRoom);
                        return;
                    } catch (error) {
                        console.error('❌ Chat: Balance fetch error:', error);
                        this.displayMessage({
                            username: 'System',
                            message: `Unable to fetch balance: ${error.message || 'Unknown error'}`,
                            type: 'system',
                            timestamp: Date.now() / 1000
                        }, this.currentRoom);
                        return;
                    }
                    
                case '/tip':
                    if (parts.length < 3) {
                        this.displayMessage({
                            username: 'System',
                            message: 'Usage: /tip username amount',
                            type: 'system',
                            timestamp: Date.now() / 1000
                        }, this.currentRoom);
                        return;
                    }
                    
                    const tipUser = parts[1];
                    const tipAmount = parseFloat(parts[2]);
                    
                    if (isNaN(tipAmount) || tipAmount <= 0 || tipAmount > 1000) {
                        this.displayMessage({
                            username: 'System',
                            message: 'Invalid tip amount (1-1000 coins)',
                            type: 'system',
                            timestamp: Date.now() / 1000
                        }, this.currentRoom);
                        return;
                    }
                    
                    try {
                        const result = await window.unifiedBalance.subtractBalance(
                            tipAmount, 
                            'chat_tip', 
                            `Tipped ${tipUser} ${tipAmount} coins`
                        );
                        
                        if (result.success) {
                            // Send tip message to backend for other users to see
                            // Don't return here - let it fall through to send the message
                            break;
                        } else {
                            this.displayMessage({
                                username: 'System',
                                message: result.error || 'Insufficient balance for tip',
                                type: 'system',
                                timestamp: Date.now() / 1000
                            }, this.currentRoom);
                            return;
                        }
                    } catch (error) {
                        this.displayMessage({
                            username: 'System',
                            message: 'Error processing tip',
                            type: 'system',
                            timestamp: Date.now() / 1000
                        }, this.currentRoom);
                        return;
                    }
                    
                case '/rain':
                    if (parts.length < 2) {
                        this.displayMessage({
                            username: 'System',
                            message: 'Usage: /rain amount',
                            type: 'system',
                            timestamp: Date.now() / 1000
                        }, this.currentRoom);
                        return;
                    }
                    
                    const rainAmount = parseFloat(parts[1]);
                    
                    if (isNaN(rainAmount) || rainAmount < 10) {
                        this.displayMessage({
                            username: 'System',
                            message: 'Rain minimum is 10 coins',
                            type: 'system',
                            timestamp: Date.now() / 1000
                        }, this.currentRoom);
                        return;
                    }
                    
                    try {
                        const result = await window.unifiedBalance.subtractBalance(
                            rainAmount, 
                            'chat_rain', 
                            `Started rain of ${rainAmount} coins`
                        );
                        
                        if (result.success) {
                            // Send rain message to backend for distribution
                            // Don't return here - let it fall through to send the message
                            break;
                        } else {
                            this.displayMessage({
                                username: 'System',
                                message: result.error || 'Insufficient balance for rain',
                                type: 'system',
                                timestamp: Date.now() / 1000
                            }, this.currentRoom);
                            return;
                        }
                    } catch (error) {
                        this.displayMessage({
                            username: 'System',
                            message: 'Error processing rain',
                            type: 'system',
                            timestamp: Date.now() / 1000
                        }, this.currentRoom);
                        return;
                    }
                    
                default:
                    // Unknown command - let backend handle it (like /online)
                    break;
            }
        }

        try {
            const response = await fetch('/chat-api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    room: this.rooms[this.currentRoom].id,
                    username: this.username,
                    user_id: this.userId
                })
            });

            const result = await response.json();

            if (result.success) {
                // Show message immediately in current room
                this.displayMessage({
                    username: this.username,
                    message: result.message,
                    type: result.type || 'message',
                    timestamp: Date.now() / 1000,
                    user_id: this.userId
                }, this.currentRoom);

                // Update last message ID to prevent duplicate
                this.rooms[this.currentRoom].lastMessageId = result.message_id;
                
                // Notify Anzar bot about the message (for rainpool accumulation)
                if (window.anzarBot && this.username) {
                    window.anzarBot.onUserMessage(this.username, message);
                }
            } else if (result.type === 'system') {
                // Show system response (like /balance command)
                this.displayMessage({
                    username: 'System',
                    message: result.message,
                    type: 'system',
                    timestamp: Date.now() / 1000
                }, this.currentRoom);
            } else {
                this.showStatus(result.error || 'Failed to send message', 'error');
            }
        } catch (error) {
            console.error('❌ Error sending message:', error);
            this.showStatus('Connection error', 'error');
        }
    }

    async startPolling() {
        if (this.isPolling) return;
        
        this.isPolling = true;
        console.log('🔄 Starting chat polling...');

        this.pollInterval = setInterval(async () => {
            await this.pollMessages();
        }, this.pollDelay);

        // Initial poll
        await this.pollMessages();
    }

    async startGuestPolling() {
        if (this.isPolling) return;
        
        this.isPolling = true;
        console.log('🔄 Starting guest chat polling (read-only)...');

        this.pollInterval = setInterval(async () => {
            await this.pollGuestMessages();
        }, this.pollDelay);

        // Initial poll
        await this.pollGuestMessages();
    }

    async pollMessages() {
        try {
            const currentRoomData = this.rooms[this.currentRoom];
            // Simple polling - just get messages, no user info needed
            const response = await fetch(`/chat-api.php?room=${currentRoomData.id}&last_id=${currentRoomData.lastMessageId}&action=poll`, {
                method: 'GET'
            });

            const result = await response.json();

            if (result.success) {
                // Update online count
                this.onlineCount = result.online_count || 0;
                this.updateOnlineCount();

                // Process new messages
                if (result.messages && result.messages.length > 0) {
                    const roomName = this.getRoomNameById(result.room_id);
                    
                    if (this.isInitialLoad) {
                        // Initial load: show all messages immediately without stagger or scroll animation
                        result.messages.forEach((message) => {
                            this.displayMessage(message, roomName, false); // false = no scroll
                        });
                        
                        // Scroll to bottom once after all initial messages are loaded
                        const messagesContainer = document.getElementById(`messages-${roomName}`);
                        if (messagesContainer) {
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        }
                        
                        this.isInitialLoad = false;
                    } else {
                        // Live messages: stagger display for better UX
                        result.messages.forEach((message, index) => {
                            setTimeout(() => {
                                this.displayMessage(message, roomName, true); // true = with scroll
                            }, index * 200); // 200ms delay between messages
                        });
                    }

                    // Update last message ID
                    const lastMessage = result.messages[result.messages.length - 1];
                    this.rooms[roomName].lastMessageId = lastMessage.id;
                }

                if (!this.isConnected) {
                    this.isConnected = true;
                    this.showStatus(`Connected as ${this.username}`, 'connected');
                }
            } else {
                throw new Error(result.error || 'Polling failed');
            }
        } catch (error) {
            console.error('❌ Polling error:', error);
            if (this.isConnected) {
                this.isConnected = false;
                this.showStatus('Connection lost, retrying...', 'error');
            }
        }
    }

    async pollGuestMessages() {
        try {
            const currentRoomData = this.rooms[this.currentRoom];
            // For guests, don't send username/user_id to avoid auth issues
            const response = await fetch(`/chat-api.php?room=${currentRoomData.id}&last_id=${currentRoomData.lastMessageId}&guest=1`, {
                method: 'GET'
            });

            const result = await response.json();

            if (result.success) {
                // Update online count
                this.onlineCount = result.online_count || 0;
                this.updateOnlineCount();

                // Process new messages
                if (result.messages && result.messages.length > 0) {
                    const roomName = this.getRoomNameById(result.room_id);
                    
                    if (this.isInitialLoad) {
                        // Initial load: show all messages immediately without stagger or scroll animation
                        result.messages.forEach((message) => {
                            this.displayMessage(message, roomName, false); // false = no scroll
                        });
                        
                        // Scroll to bottom once after all initial messages are loaded
                        const messagesContainer = document.getElementById(`messages-${roomName}`);
                        if (messagesContainer) {
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        }
                        
                        this.isInitialLoad = false;
                    } else {
                        // Live messages: stagger display for better UX
                        result.messages.forEach((message, index) => {
                            setTimeout(() => {
                                this.displayMessage(message, roomName, true); // true = with scroll
                            }, index * 200); // 200ms delay between messages
                        });
                    }

                    // Update last message ID
                    const lastMessage = result.messages[result.messages.length - 1];
                    this.rooms[roomName].lastMessageId = lastMessage.id;
                }

                if (!this.isConnected) {
                    this.isConnected = true;
                    this.showStatus('Sign in to chat', 'warning');
                }
            } else {
                throw new Error(result.error || 'Guest polling failed');
            }
        } catch (error) {
            console.error('❌ Guest polling error:', error);
            if (this.isConnected) {
                this.isConnected = false;
                this.showStatus('Connection lost, retrying...', 'error');
            }
        }
    }

    getRoomNameById(roomId) {
        for (const [name, data] of Object.entries(this.rooms)) {
            if (data.id === roomId) return name;
        }
        return 'general';
    }

    displayMessage(message, roomName = null, shouldScroll = true) {
        const targetRoom = roomName || this.currentRoom;
        const messagesContainer = document.getElementById(`messages-${targetRoom}`);
        if (!messagesContainer) return;

        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${message.type === 'system' ? 'system-message' : ''}`;
        
        // Store timestamp for cleanup purposes
        messageEl.dataset.timestamp = message.timestamp;
        
        const timeStr = this.formatTime(message.timestamp);
        const isOwnMessage = message.user_id === this.userId;
        
        // Check if message mentions current user (only for logged-in users)
        const mentionsMe = this.username && message.message && 
                          message.message.toLowerCase().includes(this.username.toLowerCase()) &&
                          !isOwnMessage; // Don't highlight own messages

        // Add mention highlight class if user is mentioned
        if (mentionsMe) {
            messageEl.classList.add('mentions-me');
        }

        // Compact inline format: username: message (single line)
        if (message.type === 'system') {
            messageEl.innerHTML = `
                <div class="message-content system-message">
                    <p class="message-text"></p>
                </div>
            `;
            // Set text content safely
            const textEl = messageEl.querySelector('.message-text');
            textEl.textContent = this.decodeHtmlEntities(message.message);
        } else {
            // Single line format: username: message text
            messageEl.innerHTML = `
                <p class="message-text">
                    <span class="message-username clickable-username" data-username="${this.escapeHtml(message.username)}">${this.escapeHtml(message.username)}:</span>
                    <span class="message-content-text"></span>
                    <small class="message-time-inline">${timeStr}</small>
                </p>
            `;
            
            // Set message content safely and handle mentions
            const contentEl = messageEl.querySelector('.message-content-text');
            const decodedMessage = this.decodeHtmlEntities(message.message);
            
            if (this.username && decodedMessage && 
                decodedMessage.toLowerCase().includes(this.username.toLowerCase()) && 
                !isOwnMessage) {
                // Handle mentions with innerHTML (safe because we control the highlighting)
                contentEl.innerHTML = this.highlightMentions(decodedMessage);
            } else {
                // Regular message - use textContent for safety
                contentEl.textContent = decodedMessage;
            }
        }

        // Add message with animation
        messageEl.style.opacity = '0';
        messageEl.style.transform = 'translateY(20px)';
        messagesContainer.appendChild(messageEl);

        // Animate in
        setTimeout(() => {
            messageEl.style.transition = 'opacity 0.3s, transform 0.3s';
            messageEl.style.opacity = '1';
            messageEl.style.transform = 'translateY(0)';
        }, 10);

        // Update unread count if not current room
        if (targetRoom !== this.currentRoom) {
            this.rooms[targetRoom].unread++;
            this.updateUnreadCount(targetRoom);
        }

        // Add click event for username reply (only for non-system messages)
        if (message.type !== 'system') {
            const usernameEl = messageEl.querySelector('.clickable-username');
            if (usernameEl) {
                usernameEl.addEventListener('click', () => this.replyToUser(message.username));
            }
        }

        // Auto-scroll to bottom (only for live messages or when explicitly requested)
        if (shouldScroll) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // Enhanced message cleanup: limit by count AND age (throttled)
        this.throttledCleanup(messagesContainer);
    }

    updateOnlineCount() {
        const countEl = document.getElementById('chat-user-count');
        const onlineEl = document.getElementById('online-count');
        
        if (countEl) countEl.textContent = `${this.onlineCount} online`;
        if (onlineEl) onlineEl.textContent = this.onlineCount;
    }

    updateUnreadCount(roomName) {
        const unreadEl = document.getElementById(`unread-${roomName}`);
        if (!unreadEl) return;

        const count = this.rooms[roomName].unread;
        unreadEl.textContent = count;
        unreadEl.style.display = count > 0 ? 'inline' : 'none';
    }

    showStatus(message, type = 'info') {
        // Update the new bottom status text
        const statusTextEl = document.getElementById('chat-status-text');
        if (statusTextEl) {
            statusTextEl.textContent = message;
            statusTextEl.className = `status-text ${type}`;
        }

        // Also update main page status
        const mainStatus = document.getElementById('connection-status');
        const mainStatusContainer = document.getElementById('chat-status');
        
        if (mainStatus) {
            mainStatus.textContent = message;
        }
        
        // Update main status container class based on type
        if (mainStatusContainer) {
            // Remove all status classes
            mainStatusContainer.classList.remove('status-connecting', 'status-connected', 'status-error', 'status-warning');
            
            // Add appropriate class based on type
            switch (type) {
                case 'connected':
                    mainStatusContainer.classList.add('status-connected');
                    break;
                case 'error':
                    mainStatusContainer.classList.add('status-error');
                    break;
                case 'warning':
                    mainStatusContainer.classList.add('status-warning');
                    break;
                default:
                    mainStatusContainer.classList.add('status-connecting');
                    break;
            }
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    decodeHtmlEntities(text) {
        // Create a temporary DOM element to decode HTML entities
        const div = document.createElement('div');
        div.innerHTML = text;
        return div.textContent || div.innerText || '';
    }

    highlightMentions(text) {
        // Only highlight mentions for logged-in users
        if (!this.username) {
            return this.escapeHtml(text);
        }
        
        // Escape HTML first
        let escapedText = this.escapeHtml(text);
        
        // Create regex to match username (case insensitive, word boundaries)
        const usernameRegex = new RegExp(
            `\\b(${this.username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 
            'gi'
        );
        
        // Replace username with highlighted version
        escapedText = escapedText.replace(usernameRegex, '<span class="username-mention">$1</span>');
        
        return escapedText;
    }

    throttledCleanup(messagesContainer) {
        const messages = messagesContainer.querySelectorAll('.chat-message:not(.system-message)');
        const messageCount = messages.length;
        
        // Smart cleanup strategy: only cleanup when we have way too many messages
        if (messageCount >= this.cleanupThreshold) {
            // Only cleanup if we haven't done it recently
            const currentTime = Date.now() / 1000;
            if (currentTime - this.lastCleanupTime > this.cleanupInterval) {
                this.cleanupOldMessages(messagesContainer);
                this.lastCleanupTime = currentTime;
            }
        }
        // If we have fewer than 200 messages, do nothing - let the chat stay populated!
    }

    cleanupOldMessages(messagesContainer) {
        const messages = messagesContainer.querySelectorAll('.chat-message:not(.system-message)');
        const currentTime = Date.now() / 1000;
        const messageCount = messages.length;
        
        console.log(`🔍 Smart cleanup check: ${messageCount} messages (threshold: ${this.cleanupThreshold})`);
        
        // First: Remove very old messages (older than 2 hours) but only if we have plenty
        let removedByAge = 0;
        if (messageCount > this.minMessages + 20) { // Only remove old messages if we have enough buffer
            messages.forEach(messageEl => {
                const messageTimestamp = messageEl.dataset.timestamp;
                if (messageTimestamp && (currentTime - parseFloat(messageTimestamp)) > this.messageAgeLimit) {
                    messageEl.remove();
                    removedByAge++;
                }
            });
        }
        
        if (removedByAge > 0) {
            console.log(`🕐 Cleaned up ${removedByAge} messages older than 2 hours`);
        }
        
        // Second: Smart count-based cleanup - only if we still have too many after age cleanup
        const remainingMessages = messagesContainer.querySelectorAll('.chat-message:not(.system-message)');
        const remainingCount = remainingMessages.length;
        
        if (remainingCount > this.cleanupThreshold) {
            // Remove oldest messages but ALWAYS keep at least minMessages (50)
            const targetCount = this.maxMessages; // Keep 100 messages
            const messagesToRemove = Math.max(0, remainingCount - targetCount);
            
            if (messagesToRemove > 0) {
                // Make sure we never go below minMessages
                const safeRemovalCount = Math.min(messagesToRemove, remainingCount - this.minMessages);
                
                for (let i = 0; i < safeRemovalCount; i++) {
                    remainingMessages[i].remove();
                }
                
                console.log(`🧹 Smart cleanup: removed ${safeRemovalCount} oldest messages (${remainingCount} → ${remainingCount - safeRemovalCount})`);
            }
        } else {
            console.log(`✅ No cleanup needed: ${remainingCount} messages is within healthy limits`);
        }
    }

    replyToUser(username) {
        // Don't allow replying to yourself
        if (username === this.username) {
            return;
        }

        const input = document.getElementById('chat-input');
        if (!input) return;

        // Set focus to input and add username with colon and space
        input.focus();
        input.value = `${username}: `;
        
        // Move cursor to end
        input.setSelectionRange(input.value.length, input.value.length);
        
        console.log(`💬 Replying to user: ${username}`);
    }

    destroy() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        this.isPolling = false;
        console.log('🔄 Chat widget destroyed');
    }
}

// Initialize chat widget when DOM is ready, with delay for JWT system
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for JWT system to load
    setTimeout(() => {
        console.log('🔄 Initializing chat widget (after JWT delay)...');
        window.chatWidget = new ChatWidget();
    }, 1000); // 1 second delay
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (window.chatWidget) {
        window.chatWidget.destroy();
    }
});
