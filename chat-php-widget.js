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
                <div class="chat-header">
                    <div class="chat-title">
                        <i class="chat-icon">💬</i>
                        <span class="chat-title-text">Community Chat</span>
                        <span class="chat-user-count" id="chat-user-count">0 online</span>
                    </div>
                </div>

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
                    <div class="chat-status" id="chat-status-widget">
                        <span class="status-text">Connecting...</span>
                        <span class="online-users">Online: <span id="online-count">0</span></span>
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
                    
                    result.messages.forEach((message, index) => {
                        // Stagger message display for better UX
                        setTimeout(() => {
                            this.displayMessage(message, roomName);
                        }, index * 200); // 200ms delay between messages
                    });

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
                    
                    result.messages.forEach((message, index) => {
                        // Stagger message display for better UX
                        setTimeout(() => {
                            this.displayMessage(message, roomName);
                        }, index * 200); // 200ms delay between messages
                    });

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

    displayMessage(message, roomName = null) {
        const targetRoom = roomName || this.currentRoom;
        const messagesContainer = document.getElementById(`messages-${targetRoom}`);
        if (!messagesContainer) return;

        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${message.type === 'system' ? 'system-message' : ''}`;
        
        const timeStr = this.formatTime(message.timestamp);
        const isOwnMessage = message.user_id === this.userId;

        // Use FaucetGame's simple inline structure
        if (message.type === 'system') {
            messageEl.innerHTML = `
                <div class="message-content system-message">
                    <p class="message-text">${this.escapeHtml(message.message)}</p>
                </div>
            `;
        } else {
            messageEl.innerHTML = `
                <div class="message-header">
                    <strong class="message-username clickable-username" data-username="${message.username}">${message.username}</strong>
                    <small class="message-time">${timeStr}</small>
                </div>
                <p class="message-text">${this.escapeHtml(message.message)}</p>
            `;
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

        // Auto-scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Limit message history (keep last 100 messages)
        const messages = messagesContainer.querySelectorAll('.chat-message:not(.system-message)');
        if (messages.length > 100) {
            messages[0].remove();
        }
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
        const statusEl = document.getElementById('chat-status-widget');
        if (!statusEl) return;

        const statusText = statusEl.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = message;
            statusText.className = `status-text ${type}`;
        }

        // Also update main page status
        const mainStatus = document.getElementById('connection-status');
        if (mainStatus) {
            mainStatus.textContent = message;
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
