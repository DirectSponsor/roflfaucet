/**
 * MODERN CHAT WIDGET SYSTEM
 * ========================
 * Inspired by FaucetGame's chat but modernized for ROFLFaucet
 * Features: Real-time messaging, multiple rooms, user management
 */

class ChatWidget {
    constructor(container, options = {}) {
        console.log('💬 ChatWidget constructor called with:', { container, options });
        this.container = container;
        this.options = {
            mode: 'sidebar', // 'sidebar', 'floating', 'fullpage'
            rooms: ['general', 'vip', 'help'],
            defaultRoom: 'general',
            wsUrl: options.wsUrl || 'wss://roflfaucet.com:8081/chat',
            maxMessages: options.maxMessages || 100,
            ...options
        };
        console.log('💬 ChatWidget options configured:', this.options);
        
        this.state = {
            currentRoom: this.options.defaultRoom,
            isConnected: false,
            isMinimized: false,
            user: null,
            unreadCounts: {},
            messages: {},
            typingUsers: {}
        };
        
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        this.init();
    }
    
    init() {
        this.createWidget();
        this.bindEvents();
        this.initializeRooms();
        this.connectWebSocket();
        
        // Auto-focus input if not mobile
        if (!this.isMobile() && this.elements.chatInput) {
            this.elements.chatInput.focus();
        }
    }
    
    createWidget() {
        const widget = document.createElement('div');
        widget.className = `chat-widget ${this.options.mode}-mode`;
        widget.innerHTML = this.getWidgetHTML();
        
        this.container.appendChild(widget);
        this.elements = this.getElements(widget);
        
        // Create floating toggle if in floating mode
        if (this.options.mode === 'floating') {
            this.createFloatingToggle();
        }
    }
    
    getWidgetHTML() {
        return `
            <div class="chat-header">
                <div class="chat-title">
                    <span class="chat-icon">💬</span>
                    <span class="chat-title-text">ROFLChat</span>
                </div>
                <div class="connection-status"></div>
                <div class="chat-user-count">0 online</div>
                <div class="chat-controls">
                    <button class="chat-control-btn minimize-btn" title="Minimize">−</button>
                    <button class="chat-control-btn close-btn" title="Close">×</button>
                </div>
            </div>
            
            <div class="chat-tabs">
                ${this.options.rooms.map(room => `
                    <div class="chat-tab" data-room="${room}">
                        <span class="tab-icon">${this.getRoomIcon(room)}</span>
                        <span class="tab-name">${this.getRoomName(room)}</span>
                        <span class="unread-count">0</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="chat-content">
                ${this.options.rooms.map(room => `
                    <div class="chat-room" data-room="${room}">
                        ${room === 'help' ? this.getHelpContent() : `
                            <div class="chat-messages" id="messages-${room}"></div>
                        `}
                    </div>
                `).join('')}
            </div>
            
            <div class="chat-footer">
                <div class="chat-input-container">
                    <input type="text" 
                           class="chat-input" 
                           placeholder="Sign in to chat..." 
                           disabled
                           maxlength="500">
                    <button class="chat-send-btn" disabled>
                        <span class="send-icon">▶</span>
                    </button>
                </div>
                <div class="chat-status">
                    <span class="status-text">Please sign in to chat</span>
                    <span class="rain-pool">Rain Pool: 0 coins</span>
                </div>
            </div>
        `;
    }
    
    getHelpContent() {
        return `
            <div class="chat-help-content">
                <h4>🎮 ROFLChat Commands</h4>
                <div class="help-section">
                    <strong>/tip [user] [amount]</strong> - Send coins to another user<br>
                    <strong>/rain [amount]</strong> - Add coins to rain pool (VIP only)<br>
                    <strong>/balance</strong> - Check your coin balance<br>
                    <strong>/online</strong> - Show online users count
                </div>
                
                <h4>🏆 VIP Room Access</h4>
                <div class="help-section">
                    VIP room requires 1000+ coins or special status.<br>
                    Enjoy exclusive features and higher tip limits!
                </div>
                
                <h4>🌧️ Rain System</h4>
                <div class="help-section">
                    VIP users can contribute to the rain pool.<br>
                    When pool reaches 100+ coins, random users get rewards!<br>
                    Active chatters have higher rain chances.
                </div>
                
                <h4>📜 Chat Rules</h4>
                <div class="help-section">
                    • Be respectful to all users<br>
                    • No spam or excessive caps<br>
                    • No begging or harassment<br>
                    • Keep discussions gambling-related<br>
                    • Moderators have final say
                </div>
            </div>
        `;
    }
    
    createFloatingToggle() {
        const toggle = document.createElement('div');
        toggle.className = 'chat-float-toggle';
        toggle.innerHTML = `
            <span class="float-icon">💬</span>
            <div class="float-notification">0</div>
        `;
        
        document.body.appendChild(toggle);
        this.elements.floatingToggle = toggle;
        
        toggle.addEventListener('click', () => {
            this.toggleFloatingWidget();
        });
    }
    
    getElements(widget) {
        return {
            widget,
            header: widget.querySelector('.chat-header'),
            tabs: widget.querySelectorAll('.chat-tab'),
            rooms: widget.querySelectorAll('.chat-room'),
            chatInput: widget.querySelector('.chat-input'),
            sendButton: widget.querySelector('.chat-send-btn'),
            userCount: widget.querySelector('.chat-user-count'),
            statusText: widget.querySelector('.status-text'),
            rainPool: widget.querySelector('.rain-pool'),
            connectionStatus: widget.querySelector('.connection-status'),
            minimizeBtn: widget.querySelector('.minimize-btn'),
            closeBtn: widget.querySelector('.close-btn')
        };
    }
    
    bindEvents() {
        // Tab switching
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchRoom(tab.dataset.room);
            });
        });
        
        // Input handling
        this.elements.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.elements.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Control buttons
        this.elements.minimizeBtn.addEventListener('click', () => {
            this.toggleMinimize();
        });
        
        this.elements.closeBtn.addEventListener('click', () => {
            this.closeWidget();
        });
        
        // Auto-scroll message containers
        this.elements.rooms.forEach(room => {
            const messages = room.querySelector('.chat-messages');
            if (messages) {
                messages.addEventListener('scroll', () => {
                    this.handleScroll(messages);
                });
            }
        });
    }
    
    initializeRooms() {
        this.options.rooms.forEach(room => {
            this.state.messages[room] = [];
            this.state.unreadCounts[room] = 0;
            this.state.typingUsers[room] = new Set();
            
            // Add welcome messages
            if (room !== 'help') {
                this.addSystemMessage(`Welcome to ${this.getRoomName(room)}!`, room);
            }
        });
        
        this.switchRoom(this.state.currentRoom);
    }
    
    connectWebSocket() {
        if (this.ws) {
            this.ws.close();
        }
        
        try {
            this.ws = new WebSocket(this.options.wsUrl);
            
            this.ws.onopen = () => {
                console.log('Chat WebSocket connected');
                this.state.isConnected = true;
                this.reconnectAttempts = 0;
                this.updateConnectionStatus();
                this.addSystemMessage('Connected to chat server', 'general');
            };
            
            this.ws.onmessage = (event) => {
                this.handleWebSocketMessage(JSON.parse(event.data));
            };
            
            this.ws.onclose = () => {
                console.log('Chat WebSocket disconnected');
                this.state.isConnected = false;
                this.updateConnectionStatus();
                this.attemptReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('Chat WebSocket error:', error);
                this.addSystemMessage('Connection error occurred', 'general');
            };
            
        } catch (error) {
            console.error('Failed to connect to chat WebSocket:', error);
            this.addSystemMessage('Failed to connect to chat server', 'general');
        }
    }
    
    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'message':
                this.addMessage(data);
                break;
            case 'userJoin':
                this.addSystemMessage(`${data.user} joined the chat`, data.room);
                this.updateUserCount(data.userCount);
                break;
            case 'userLeave':
                this.addSystemMessage(`${data.user} left the chat`, data.room);
                this.updateUserCount(data.userCount);
                break;
            case 'tip':
                this.addTipMessage(data);
                break;
            case 'rain':
                this.addRainMessage(data);
                break;
            case 'typing':
                this.handleTypingIndicator(data);
                break;
            case 'userCount':
                this.updateUserCount(data.count);
                break;
            case 'rainPool':
                this.updateRainPool(data.amount);
                break;
            case 'auth':
                this.handleAuthUpdate(data);
                break;
        }
    }
    
    sendMessage() {
        const message = this.elements.chatInput.value.trim();
        if (!message || !this.state.user) return;
        
        // Handle commands
        if (message.startsWith('/')) {
            this.handleCommand(message);
        } else {
            // Send regular message
            this.sendWebSocketMessage({
                type: 'message',
                room: this.state.currentRoom,
                message: message
            });
        }
        
        this.elements.chatInput.value = '';
    }
    
    handleCommand(command) {
        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase();
        
        switch (cmd) {
            case '/tip':
                if (parts.length >= 3) {
                    const user = parts[1];
                    const amount = parseInt(parts[2]);
                    if (amount > 0) {
                        this.sendWebSocketMessage({
                            type: 'tip',
                            target: user,
                            amount: amount
                        });
                    }
                }
                break;
                
            case '/rain':
                if (parts.length >= 2) {
                    const amount = parseInt(parts[1]);
                    if (amount > 0) {
                        this.sendWebSocketMessage({
                            type: 'rain',
                            amount: amount
                        });
                    }
                }
                break;
                
            case '/balance':
                this.sendWebSocketMessage({ type: 'balance' });
                break;
                
            case '/online':
                this.sendWebSocketMessage({ type: 'online' });
                break;
                
            default:
                this.addSystemMessage(`Unknown command: ${cmd}`, this.state.currentRoom);
        }
    }
    
    addMessage(data) {
        const room = data.room || this.state.currentRoom;
        const messageElement = this.createMessageElement(data);
        
        this.appendMessageToRoom(messageElement, room);
        this.updateUnreadCount(room);
        
        // Store message
        this.state.messages[room].push(data);
        this.trimMessages(room);
    }
    
    addSystemMessage(text, room) {
        this.addMessage({
            type: 'system',
            text: text,
            room: room,
            timestamp: Date.now()
        });
    }
    
    addTipMessage(data) {
        const message = `${data.from} tipped ${data.to} ${data.amount} coins!`;
        this.addMessage({
            type: 'tip',
            text: message,
            room: data.room || this.state.currentRoom,
            timestamp: Date.now()
        });
    }
    
    addRainMessage(data) {
        const message = data.message || `Rain incoming! ${data.amount} coins distributed!`;
        this.addMessage({
            type: 'rain',
            text: message,
            room: 'general',
            timestamp: Date.now()
        });
    }
    
    createMessageElement(data) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${data.type}-message`;
        
        const time = new Date(data.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        if (data.type === 'system' || data.type === 'tip' || data.type === 'rain') {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${this.escapeHtml(data.text)}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-header">
                    <span class="message-author">${this.escapeHtml(data.user)}</span>
                </div>
                <div class="message-content">
                    <div class="message-text">${this.escapeHtml(data.message)}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
        }
        
        return messageDiv;
    }
    
    appendMessageToRoom(messageElement, room) {
        const messagesContainer = document.getElementById(`messages-${room}`);
        if (!messagesContainer) return;
        
        messagesContainer.appendChild(messageElement);
        
        // Auto-scroll if user is at bottom
        if (this.isScrolledToBottom(messagesContainer)) {
            this.scrollToBottom(messagesContainer);
        }
    }
    
    switchRoom(roomName) {
        if (roomName === this.state.currentRoom) return;
        
        // Update tab states
        this.elements.tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.room === roomName);
        });
        
        // Update room states
        this.elements.rooms.forEach(room => {
            room.classList.toggle('active', room.dataset.room === roomName);
        });
        
        // Clear unread count for new room
        this.state.unreadCounts[roomName] = 0;
        this.updateUnreadDisplay(roomName);
        
        this.state.currentRoom = roomName;
        
        // Focus input if not mobile and not help room
        if (!this.isMobile() && roomName !== 'help') {
            setTimeout(() => {
                this.elements.chatInput.focus();
            }, 100);
        }
    }
    
    updateUnreadCount(room) {
        if (room !== this.state.currentRoom) {
            this.state.unreadCounts[room]++;
            this.updateUnreadDisplay(room);
            this.updateFloatingNotification();
        }
    }
    
    updateUnreadDisplay(room) {
        const tab = document.querySelector(`[data-room="${room}"]`);
        const badge = tab?.querySelector('.unread-count');
        
        if (badge) {
            const count = this.state.unreadCounts[room];
            badge.textContent = count;
            badge.classList.toggle('show', count > 0);
        }
    }
    
    updateFloatingNotification() {
        if (!this.elements.floatingToggle) return;
        
        const totalUnread = Object.values(this.state.unreadCounts)
            .reduce((sum, count) => sum + count, 0);
        
        const notification = this.elements.floatingToggle.querySelector('.float-notification');
        notification.textContent = totalUnread;
        notification.classList.toggle('show', totalUnread > 0);
    }
    
    updateUserCount(count) {
        this.elements.userCount.textContent = `${count} online`;
    }
    
    updateRainPool(amount) {
        this.elements.rainPool.textContent = `Rain Pool: ${amount} coins`;
    }
    
    updateConnectionStatus() {
        this.elements.connectionStatus.classList.toggle('disconnected', !this.state.isConnected);
    }
    
    handleAuthUpdate(data) {
        this.state.user = data.user;
        
        if (data.user) {
            this.elements.chatInput.placeholder = 'Type a message...';
            this.elements.chatInput.disabled = false;
            this.elements.sendButton.disabled = false;
            this.elements.statusText.textContent = `Signed in as ${data.user.username}`;
        } else {
            this.elements.chatInput.placeholder = 'Sign in to chat...';
            this.elements.chatInput.disabled = true;
            this.elements.sendButton.disabled = true;
            this.elements.statusText.textContent = 'Please sign in to chat';
        }
    }
    
    sendWebSocketMessage(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            
            setTimeout(() => {
                this.addSystemMessage(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'general');
                this.connectWebSocket();
            }, delay);
        } else {
            this.addSystemMessage('Connection failed. Please refresh the page.', 'general');
        }
    }
    
    toggleMinimize() {
        this.state.isMinimized = !this.state.isMinimized;
        this.elements.widget.classList.toggle('minimized', this.state.isMinimized);
    }
    
    toggleFloatingWidget() {
        if (this.elements.widget.style.display === 'none') {
            this.elements.widget.style.display = 'flex';
            this.elements.floatingToggle.style.display = 'none';
        } else {
            this.elements.widget.style.display = 'none';
            this.elements.floatingToggle.style.display = 'flex';
        }
    }
    
    closeWidget() {
        if (this.options.mode === 'floating') {
            this.toggleFloatingWidget();
        } else {
            this.elements.widget.style.display = 'none';
        }
    }
    
    // Utility methods
    getRoomIcon(room) {
        const icons = {
            general: '🌐',
            vip: '👑',
            help: '❓'
        };
        return icons[room] || '💬';
    }
    
    getRoomName(room) {
        const names = {
            general: 'General',
            vip: 'VIP',
            help: 'Help'
        };
        return names[room] || room.charAt(0).toUpperCase() + room.slice(1);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    isScrolledToBottom(element) {
        return element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    }
    
    scrollToBottom(element) {
        element.scrollTop = element.scrollHeight;
    }
    
    handleScroll(element) {
        // Could implement "new messages" indicator here
    }
    
    trimMessages(room) {
        if (this.state.messages[room].length > this.options.maxMessages) {
            this.state.messages[room] = this.state.messages[room].slice(-this.options.maxMessages);
            
            // Remove old DOM elements
            const container = document.getElementById(`messages-${room}`);
            while (container.children.length > this.options.maxMessages) {
                container.removeChild(container.firstChild);
            }
        }
    }
    
    isMobile() {
        return window.innerWidth <= 768;
    }
    
    // Public API methods
    setUser(user) {
        this.handleAuthUpdate({ user });
    }
    
    addMessageFromAPI(message) {
        this.addMessage(message);
    }
    
    updateBalanceFromAPI(balance) {
        this.elements.statusText.textContent = `Balance: ${balance} coins`;
    }
    
    destroy() {
        if (this.ws) {
            this.ws.close();
        }
        
        if (this.elements.floatingToggle) {
            this.elements.floatingToggle.remove();
        }
        
        this.elements.widget.remove();
    }
}

// Export for use
window.ChatWidget = ChatWidget;
