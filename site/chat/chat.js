/**
 * ROFLFaucet PHP Polling Chat Widget
 * Replaces WebSocket functionality with AJAX polling
 */

class ChatWidget {
    constructor() {
        this.currentRoom = 'general';
        this.rooms = {
            general: { id: 1, name: 'General', unread: 0, lastMessageId: 0 },
            help: { id: 2, name: 'Help', unread: 0, lastMessageId: 0 },
            notifications: { id: 'notifications', name: 'Notifications', unread: 0, lastMessageId: 0 }
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
        this.lastTimestamp = 0; // Track last message timestamp for bandwidth optimization
        
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
        
        // Check if we should open notifications tab directly
        if (window.location.hash === '#inbox') {
            setTimeout(() => {
                this.switchRoom('notifications');
            }, 500); // Small delay to ensure UI is ready
        }
        
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

    async getDisplayNameFromProfile(combinedUserId) {
        try {
            // Fetch user profile to check for display name
            const response = await fetch(`api/simple-profile.php?action=profile&user_id=${combinedUserId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.profile) {
                    // Check if user has set a custom display name (username field in profile)
                    const displayName = data.profile.username;
                    if (displayName && displayName.trim() && displayName !== combinedUserId) {
                        return displayName;
                    }
                }
            }
        } catch (error) {
            console.log('💬 Chat: Could not fetch display name from profile:', error.message);
        }
        return null; // No display name available
    }

    getUserFromAuth() {
        // Simple check: if user is logged in, unified balance system will have their info
        if (window.unifiedBalance && window.unifiedBalance.isLoggedIn) {
            // Use combined userID for consistency with file system
            const combinedUserId = window.unifiedBalance.getCombinedUserIdFromToken ? 
                window.unifiedBalance.getCombinedUserIdFromToken() : 
                window.unifiedBalance.userId;
            
            if (combinedUserId && combinedUserId !== 'guest') {
                // Get username and check for display name from profile
                let username = 'Member';
                
                // First try the unified balance system's getValidUsername method
                if (typeof window.unifiedBalance.getValidUsername === 'function') {
                    username = window.unifiedBalance.getValidUsername() || username;
                } else if (window.getValidUsername) {
                    // Fallback to global getValidUsername function from site-utils
                    username = window.getValidUsername() || username;
                } else {
                    // Last fallback: check localStorage directly
                    try {
                        const sessionData = localStorage.getItem('roflfaucet_session');
                        if (sessionData) {
                            const data = JSON.parse(sessionData);
                            if (data.expires && Date.now() > data.expires) {
                                return null; // Session expired
                            }
                            username = data.username || `User${combinedUserId}`;
                        } else {
                            username = localStorage.getItem('username') || `User${combinedUserId}`;
                        }
                    } catch (e) {
                        username = `User${combinedUserId}`;
                    }
                }
                
                // Try to get display name from profile if available
                this.getDisplayNameFromProfile(combinedUserId).then(displayName => {
                    if (displayName && displayName !== username) {
                        console.log(`🎭 Chat: Using display name "${displayName}" instead of "${username}"`);
                        this.username = displayName; // Update the chat username
                        
                        // Update any existing UI elements showing the username
                        const statusElement = document.querySelector('.chat-status');
                        if (statusElement && statusElement.textContent.includes(username)) {
                            statusElement.textContent = statusElement.textContent.replace(username, displayName);
                        }
                    }
                });
                
                console.log(`🔗 Chat: User is logged in as "${username}" (ID: ${combinedUserId})`);
                return {
                    username: username,
                    userId: combinedUserId
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
        // Support multiple container types - full page and sidebar
        const container = document.getElementById('chat-widget-container') || 
                         document.getElementById('sidebar-chat-widget-container');
        if (!container) return;
        
        // Determine widget type
        const isSidebarWidget = container.id === 'sidebar-chat-widget-container';

        // Create different templates for different widget types
        const showNotifications = !isSidebarWidget;
        const notificationsTab = showNotifications ? `
                    <div class="chat-tab" data-room="notifications">
                        <span class="tab-icon">🔔</span>
                        <span class="tab-name">Inbox</span>
                        <span class="unread-count" id="unread-notifications">0</span>
                    </div>` : '';
        
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
                    </div>${notificationsTab}
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
                    </div>${showNotifications ? `
                    
                    <!-- Notifications Room -->
                    <div class="chat-room" id="room-notifications">
                        <div class="notifications-content">
                            <div class="notifications-header">
                                <h4>🔔 Your Notifications</h4>
                                <button class="mark-all-read-btn" id="mark-all-read-btn">✓ Mark All Read</button>
                            </div>
                            <div class="notifications-list" id="notifications-list">
                                <div class="no-notifications">
                                    <span class="emoji">🔔</span>
                                    <h3>Notifications Coming Soon!</h3>
                                    <p>We're working on a notification system to alert you about tips, mentions, and other chat events.</p>
                                    <p><small>For now, keep an eye on the chat for important messages! 😊</small></p>
                                </div>
                            </div>
                        </div>
                    </div>` : ''}
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
        
        // Mark all read button
        const markAllReadBtn = document.getElementById('mark-all-read-btn');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => this.markAllNotificationsAsRead());
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

        // Hide/show chat input based on room
        const chatInputContainer = document.querySelector('.chat-input-container');
        if (chatInputContainer) {
            if (roomName === 'notifications') {
                chatInputContainer.style.visibility = 'hidden'; // Hidden but keeps space
            } else {
                chatInputContainer.style.visibility = 'visible';
            }
        }

        // Clear unread count
        this.rooms[roomName].unread = 0;
        this.updateUnreadCount(roomName);
        
        // Load notifications if switching to notifications room
        if (roomName === 'notifications' && this.userId && this.userId !== 'guest') {
            this.loadNotifications();
        }

        console.log(`🔄 Switched to room: ${roomName}`);
    }
    
    async loadNotifications() {
        console.log('🔔 Loading notifications...');
        const notificationsList = document.getElementById('notifications-list');
        if (!notificationsList) return;
        
        // Show loading state
        notificationsList.innerHTML = '<div class="loading-notifications">Loading notifications...</div>';
        
        try {
            const url = `api/simple-notifications.php?action=all&user_id=${this.userId}&username=${encodeURIComponent(this.username)}`;
            console.log(`🌐 Fetching notifications from: ${url}`);
            
            const response = await fetch(url);
            console.log(`📡 Response status: ${response.status} ${response.statusText}`);
            
            const data = await response.json();
            console.log(`📄 Response data:`, data);
            
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to load notifications');
            }
            
            // Data is already newest-first, so no need to reverse
            this.displayNotifications(data.notifications || []);
            
        } catch (error) {
            console.error('❌ Failed to load notifications:', error);
            notificationsList.innerHTML = `
                <div class="notification-error">
                    <span class="emoji">⚠️</span>
                    <p>Failed to load notifications</p>
                    <small>${error.message}</small>
                </div>
            `;
        }
    }
    
    displayNotifications(notifications) {
        const notificationsList = document.getElementById('notifications-list');
        if (!notificationsList) return;
        
        if (notifications.length === 0) {
            // Show empty state
            notificationsList.innerHTML = `
                <div class="no-notifications">
                    <span class="emoji">🔔</span>
                    <h3>No notifications yet</h3>
                    <p>You'll see notifications here when someone tips you or mentions your name in chat.</p>
                    <p><small>Start chatting to get some activity! 😊</small></p>
                </div>
            `;
            return;
        }
        
        // Set first notification that hasn't been replied to as active, or first one
        const activeNotification = notifications.find(n => !n.replied) || notifications[0];
        this.activeNotificationId = activeNotification.id;
        
        // Build notifications HTML with active/inactive states (now with inline reply sections)
        const notificationsHtml = notifications.map((notification, index) => 
            this.createNotificationCard(notification, notification.id === this.activeNotificationId)
        ).join('');
        
        // Add Clear All button
        const clearAllSection = `
            <div class="clear-all-section">
                <button id="clear-all-notifications" class="clear-all-btn">
                    🗑️ Clear All Notifications
                </button>
            </div>
        `;
        
        notificationsList.innerHTML = notificationsHtml + clearAllSection;
        
        // Bind notification events (only once per chat instance)
        this.bindNotificationEventsOnce();
        
        console.log(`🔔 Displayed ${notifications.length} notifications, active: ${activeNotification.from || 'System'}`);
    }
    
    createNotificationCard(notification, isActive = false) {
        const timeAgo = this.formatTimeAgo(notification.timestamp || notification.created_at);
        const hasFrom = notification.from && notification.from.trim();
        const hasReplied = notification.replied || false;
        
        let statusIndicator = '';
        if (isActive && !hasReplied) {
            statusIndicator = '<span class="active-indicator">← Active</span>';
        } else if (hasReplied) {
            statusIndicator = '<span class="replied-indicator">✓ Replied</span>';
        }
        
        // Create inline reply section for active notifications
        let inlineReplySection = '';
        if (isActive && hasFrom && !hasReplied) {
            const prefix = `@${notification.from} `;
            inlineReplySection = `
                <div class="inline-reply-section">
                    <div class="reply-info">
                        <span class="emoji">💬</span>
                        <span>Replying to <strong>${notification.from}</strong></span>
                    </div>
                    <div class="reply-input-container">
                        <span class="reply-prefix">${prefix}</span>
                        <input type="text" class="notification-reply-input" data-notification-id="${notification.id}"
                               placeholder="Type your reply..." maxlength="450">
                        <button class="send-notification-reply" data-notification-id="${notification.id}">Send</button>
                    </div>
                    <div class="reply-help">
                        <small>Your reply will be sent to the general chat with the @mention</small>
                    </div>
                </div>
            `;
        } else if (isActive && hasReplied) {
            inlineReplySection = `
                <div class="inline-reply-section disabled">
                    <div class="reply-info">
                        <span class="emoji">✓</span>
                        <span>You replied to <strong>${notification.from}</strong></span>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="notification-item ${isActive ? 'active' : 'inactive'} ${hasReplied ? 'replied' : ''}" 
                 data-notification-id="${notification.id}" data-from-user="${hasFrom ? notification.from : ''}">
                <div class="notification-header">
                    <div class="notification-type ${notification.type}">
                        ${this.getNotificationIcon(notification.type)} ${this.formatNotificationType(notification.type)}
                        ${statusIndicator}
                    </div>
                    <div class="notification-time">${timeAgo}</div>
                </div>
                <div class="notification-message">${notification.message}</div>
                ${hasFrom ? `<div class="notification-from">From: <strong>${notification.from}</strong></div>` : ''}
                <div class="notification-actions">
                    ${!isActive && hasFrom ? `<button class="activate-btn" data-notification-id="${notification.id}">Reply to This</button>` : ''}
                    <button class="dismiss-btn" data-notification-id="${notification.id}">Dismiss</button>
                </div>
                ${inlineReplySection}
            </div>
        `;
    }
    
    createReplySection(activeNotification) {
        const hasFrom = activeNotification.from && activeNotification.from.trim();
        const hasReplied = activeNotification.replied || false;
        
        if (!hasFrom) {
            return `
                <div class="reply-section disabled">
                    <div class="reply-info">
                        <span class="emoji">💬</span>
                        <span>This notification cannot be replied to</span>
                    </div>
                </div>
            `;
        }
        
        if (hasReplied) {
            return `
                <div class="reply-section disabled">
                    <div class="reply-info">
                        <span class="emoji">✓</span>
                        <span>You replied to <strong>${activeNotification.from}</strong></span>
                    </div>
                    <div class="reply-help">
                        <small>Click "Reply to This" on the notification to send another reply</small>
                    </div>
                </div>
            `;
        }
        
        const prefix = `@${activeNotification.from} `;
        
        return `
            <div class="reply-section">
                <div class="reply-info">
                    <span class="emoji">💬</span>
                    <span>Replying to <strong>${activeNotification.from}</strong></span>
                </div>
                <div class="reply-input-container">
                    <span class="reply-prefix">${prefix}</span>
                    <input type="text" id="notification-reply-input" class="reply-input-main" 
                           placeholder="Type your reply..." maxlength="450">
                    <button id="send-notification-reply" class="send-reply-main-btn">Send</button>
                </div>
                <div class="reply-help">
                    <small>Your reply will be sent to the general chat with the @mention</small>
                </div>
            </div>
        `;
    }
    
    getNotificationIcon(type) {
        switch(type) {
            case 'tip': return '💰';
            case 'rain': return '🌧️';
            case 'direct_message': return '💬';
            case 'mention': return '👀';
            default: return '🔔';
        }
    }
    
    formatNotificationType(type) {
        switch(type) {
            case 'tip': return 'Tip Received';
            case 'rain': return 'Rain Event';
            case 'direct_message': return 'Direct Message';
            case 'mention': return 'Mentioned';
            default: return 'Notification';
        }
    }
    
    formatTimeAgo(timestamp) {
        const now = new Date();
        let time;
        
        // Handle Unix timestamps (seconds) vs milliseconds
        if (typeof timestamp === 'number' && timestamp < 10000000000) {
            // Unix timestamp in seconds
            time = new Date(timestamp * 1000);
        } else {
            // Either milliseconds timestamp or date string
            time = new Date(timestamp);
        }
        
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    }
    
    bindNotificationEventsOnce() {
        // Only bind events once per chat instance to prevent duplicates
        if (this.notificationEventsBound) {
            return;
        }
        
        // Use the notifications room container as the event delegation root
        // This element doesn't get recreated, so we can safely attach events once
        const notificationsRoom = document.getElementById('room-notifications');
        if (!notificationsRoom) return;
        
        // Handle all notification interactions using event delegation
        notificationsRoom.addEventListener('click', (e) => {
            // Handle "Reply to This" button clicks
            if (e.target.classList.contains('activate-btn')) {
                e.preventDefault();
                const notificationId = e.target.dataset.notificationId;
                this.activateNotification(notificationId);
                return;
            }
            
            // Handle dismiss button clicks
            if (e.target.classList.contains('dismiss-btn')) {
                e.preventDefault();
                const notificationId = e.target.dataset.notificationId;
                this.dismissNotification(notificationId);
                return;
            }
            
            // Handle inline reply send buttons
            if (e.target.classList.contains('send-notification-reply')) {
                e.preventDefault();
                const notificationId = e.target.dataset.notificationId;
                this.sendInlineNotificationReply(notificationId);
                return;
            }
            
            // Handle clear all button
            if (e.target.id === 'clear-all-notifications') {
                e.preventDefault();
                this.clearAllNotifications();
                return;
            }
        });
        
        // Handle Enter key in inline reply inputs using event delegation
        notificationsRoom.addEventListener('keypress', (e) => {
            if (e.target.classList.contains('notification-reply-input') && e.key === 'Enter') {
                e.preventDefault();
                const notificationId = e.target.dataset.notificationId;
                this.sendInlineNotificationReply(notificationId);
            }
        });
        
        // Mark as bound to prevent duplicate event binding
        this.notificationEventsBound = true;
        console.log('✅ Notification events bound once using delegation');
    }
    
    activateNotification(notificationId) {
        console.log(`🎯 Activating notification: ${notificationId}`);
        
        // Update active notification ID
        this.activeNotificationId = notificationId;
        
        // Update visual states
        const notifications = document.querySelectorAll('.notification-item');
        notifications.forEach(item => {
            const isActive = item.dataset.notificationId === notificationId;
            item.classList.toggle('active', isActive);
            item.classList.toggle('inactive', !isActive);
            
            // Update active indicator
            const activeIndicator = item.querySelector('.active-indicator');
            if (activeIndicator) {
                activeIndicator.remove();
            }
            
            if (isActive) {
                const typeDiv = item.querySelector('.notification-type');
                typeDiv.innerHTML += '<span class="active-indicator">← Active</span>';
            }
            
            // Hide/show activate buttons
            const activateBtn = item.querySelector('.activate-btn');
            if (activateBtn) {
                activateBtn.style.display = isActive ? 'none' : 'inline-block';
            }
        });
        
        // Update reply section
        const activeNotificationElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
        const fromUser = activeNotificationElement.dataset.fromUser;
        
        if (fromUser) {
            const replySection = document.querySelector('.reply-section');
            const replyInfo = replySection.querySelector('.reply-info span:last-child');
            const replyPrefix = replySection.querySelector('.reply-prefix');
            const replyInput = replySection.querySelector('#notification-reply-input');
            
            replyInfo.innerHTML = `Replying to <strong>${fromUser}</strong>`;
            replyPrefix.textContent = `@${fromUser} `;
            
            // Clear and focus input
            replyInput.value = '';
            replyInput.focus();
        }
    }
    
    sendInlineNotificationReply(notificationId) {
        const replyInput = document.querySelector(`[data-notification-id="${notificationId}"].notification-reply-input`);
        const sendButton = document.querySelector(`[data-notification-id="${notificationId}"].send-notification-reply`);
        if (!replyInput) return;
        
        const message = replyInput.value.trim();
        if (!message) {
            this.showStatus('Please enter a reply message', 'warning');
            return;
        }
        
        // Get the notification's from user
        const notificationElement = document.querySelector(`[data-notification-id="${notificationId}"].notification-item`);
        const fromUser = notificationElement.dataset.fromUser;
        
        if (!fromUser) {
            this.showStatus('Cannot reply to this notification', 'error');
            return;
        }
        
        // Show sending state
        replyInput.disabled = true;
        sendButton.disabled = true;
        sendButton.textContent = 'Sending...';
        replyInput.style.background = '#f8f9fa';
        
        // Send the reply with @mention
        this.sendReply(fromUser, message).then((success) => {
            if (success) {
                // Mark notification as replied and update state
                this.markNotificationAsReplied(notificationId);
                
                // Show success state briefly
                replyInput.value = '';
                sendButton.textContent = 'Sent ✓';
                sendButton.style.background = '#28a745';
                
                // Refresh the notification display after 1 second to show replied state
                setTimeout(() => {
                    this.loadNotifications();
                }, 1000);
            } else {
                // Reset on failure
                replyInput.disabled = false;
                sendButton.disabled = false;
                replyInput.style.background = '';
                sendButton.textContent = 'Send';
            }
        });
    }
    
    sendActiveNotificationReply() {
        const replyInput = document.getElementById('notification-reply-input');
        const sendButton = document.getElementById('send-notification-reply');
        if (!replyInput) return;
        
        const message = replyInput.value.trim();
        if (!message) {
            this.showStatus('Please enter a reply message', 'warning');
            return;
        }
        
        // Get the active notification's from user
        const activeNotificationElement = document.querySelector(`[data-notification-id="${this.activeNotificationId}"]`);
        const fromUser = activeNotificationElement.dataset.fromUser;
        
        if (!fromUser) {
            this.showStatus('Cannot reply to this notification', 'error');
            return;
        }
        
        // Show sending state
        replyInput.disabled = true;
        sendButton.disabled = true;
        sendButton.textContent = 'Sending...';
        replyInput.style.background = '#f8f9fa';
        
        // Send the reply with @mention
        this.sendReply(fromUser, message).then((success) => {
            if (success) {
                // Mark notification as replied and update state
                this.markNotificationAsReplied(this.activeNotificationId);
                
                // Show success state briefly
                replyInput.value = '';
                sendButton.textContent = 'Sent ✓';
                sendButton.style.background = '#28a745';
                
                // Refresh the notification display after 1 second to show replied state
                setTimeout(() => {
                    this.loadNotifications();
                }, 1000);
            } else {
                // Reset on failure
                replyInput.disabled = false;
                sendButton.disabled = false;
                replyInput.style.background = '';
                sendButton.textContent = 'Send';
            }
        });
    }
    
    async sendReply(toUser, message) {
        console.log(`💬 Sending reply to ${toUser}: ${message}`);
        
        try {
            // Use the main chat sending method (same as regular chat messages)
            const fullMessage = `@${toUser} ${message}`;
            
            const response = await fetch('api/simple-chat.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: fullMessage,
                    room: 'general', // Send to general chat room
                    username: this.username,
                    user_id: this.userId
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success || data.message) {
                    console.log('✅ Reply sent successfully to chat');
                    this.showStatus(`Reply sent to ${toUser}`, 'success');
                    return true;
                } else {
                    throw new Error(data.error || 'Failed to send reply');
                }
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
        } catch (error) {
            console.error('❌ Failed to send reply:', error);
            this.showStatus(`Failed to send reply: ${error.message}`, 'error');
            return false;
        }
    }
    
    async markNotificationAsReplied(notificationId) {
        console.log(`💬 Marking notification ${notificationId} as replied`);
        
        try {
            // Update notification in backend to mark as replied
            const response = await fetch('api/simple-notifications.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'mark_replied',
                    notification_id: notificationId,
                    user_id: this.userId,
                    username: this.username
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Notification marked as replied');
            }
        } catch (error) {
            console.error('❌ Failed to mark notification as replied:', error);
        }
    }
    
    async dismissNotification(notificationId) {
        console.log(`🗑️ Dismissing notification ${notificationId}`);
        
        if (!confirm('Dismiss this notification? This action cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch('api/simple-notifications.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'dismiss',
                    notification_id: notificationId,
                    user_id: this.userId,
                    username: this.username
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Remove notification from UI immediately
                    const notificationElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
                    if (notificationElement) {
                        notificationElement.remove();
                    }
                    
                    // Refresh notifications to update active states
                    setTimeout(() => {
                        this.loadNotifications();
                    }, 500);
                    
                    this.showStatus('Notification dismissed', 'success');
                    console.log('✅ Notification dismissed successfully');
                } else {
                    throw new Error(data.error || 'Failed to dismiss notification');
                }
            }
        } catch (error) {
            console.error('❌ Failed to dismiss notification:', error);
            this.showStatus('Failed to dismiss notification', 'error');
        }
    }
    
    async clearAllNotifications() {
        console.log('🗑️ Clearing all notifications');
        
        if (!confirm('Clear all notifications? This action cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch('api/simple-notifications.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'clear_all',
                    user_id: this.userId,
                    username: this.username
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Clear notifications display
                    const notificationsList = document.getElementById('notifications-list');
                    if (notificationsList) {
                        notificationsList.innerHTML = `
                            <div class="no-notifications">
                                <span class="emoji">🔔</span>
                                <h3>All notifications cleared!</h3>
                                <p>You'll see new notifications here when someone tips you.</p>
                            </div>
                        `;
                    }
                    
                    this.showStatus('All notifications cleared', 'success');
                    console.log('✅ All notifications cleared successfully');
                } else {
                    throw new Error(data.error || 'Failed to clear notifications');
                }
            }
        } catch (error) {
            console.error('❌ Failed to clear notifications:', error);
            this.showStatus('Failed to clear notifications', 'error');
        }
    }
    
    async markNotificationAsRead(notificationId, buttonElement) {
        console.log(`✅ Marking notification ${notificationId} as read`);
        
        try {
            const response = await fetch('api/simple-notifications.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'mark_read',
                    notification_ids: [notificationId],
                    user_id: this.userId,
                    username: this.username
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Remove unread styling and hide button safely
                    const notificationItem = buttonElement ? buttonElement.closest('.notification-item') : 
                        document.querySelector(`[data-notification-id="${notificationId}"]`);
                    
                    if (notificationItem) {
                        notificationItem.classList.remove('unread');
                        
                        // Remove the mark read button
                        const markReadBtn = notificationItem.querySelector('.mark-read-btn');
                        if (markReadBtn) {
                            markReadBtn.remove();
                        }
                        
                        // If the buttonElement was passed and still exists, remove it too
                        if (buttonElement && buttonElement.parentNode) {
                            buttonElement.remove();
                        }
                    }
                    
                    console.log('✅ Notification marked as read');
                } else {
                    throw new Error(data.error || 'Failed to mark as read');
                }
            } else {
                throw new Error('Network response was not ok');
            }
            
        } catch (error) {
            console.error('❌ Failed to mark notification as read:', error);
            this.showStatus('Failed to mark as read', 'error');
        }
    }
    
    async markAllNotificationsAsRead() {
        console.log('✅ Marking all notifications as read');
        
        try {
            const response = await fetch('api/simple-notifications.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'mark_all_read',
                    user_id: this.userId,
                    username: this.username
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Remove all unread styling and hide all mark read buttons
                    const notificationItems = document.querySelectorAll('.notification-item.unread');
                    notificationItems.forEach(item => {
                        item.classList.remove('unread');
                        const markReadBtn = item.querySelector('.mark-read-btn');
                        if (markReadBtn) {
                            markReadBtn.remove();
                        }
                    });
                    
                    // Hide mark all read button if no more unread notifications
                    const markAllReadBtn = document.getElementById('mark-all-read-btn');
                    if (markAllReadBtn) {
                        markAllReadBtn.style.display = 'none';
                    }
                    
                    this.showStatus('All notifications marked as read', 'success');
                    console.log('✅ All notifications marked as read');
                } else {
                    throw new Error(data.error || 'Failed to mark all as read');
                }
            } else {
                throw new Error('Network response was not ok');
            }
            
        } catch (error) {
            console.error('❌ Failed to mark all notifications as read:', error);
            this.showStatus('Failed to mark all as read', 'error');
        }
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        if (!input || !input.value.trim()) return;

        let message = input.value.trim();
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
                    // Balance is handled above in the if statement, so this case is unreachable
                    // Keeping case for clarity but it won't execute
                    return;
                    
                case '/tip':
                    // Let the server handle tip processing completely
                    // Just send the command as a regular message to simple-chat.php
                    break;
                    
                case '/rain':
                    // Let the server handle rain processing completely (like /tip)
                    // Just send the command as a regular message to simple-chat.php
                    break;
                    
                default:
                    // Unknown command - let backend handle it (like /online)
                    break;
            }
        }

        try {
            console.log('🌐 SENDING POST to simple-chat.php with message:', message);
            const response = await fetch('api/simple-chat.php', {
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
            console.log('📡 POST Response status:', response.status, response.statusText);

            const result = await response.json();

            if (result.success) {
                // Message sent successfully - polling will pick it up within 3 seconds
                this.showStatus('Message sent', 'success');
                
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
            console.error('❌ Error sending chat message:', error);
            console.error('❌ Message being sent:', message);
            this.showStatus(`Chat error: ${error.message || error}`, 'error');
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
            
            // Poll for new messages since last timestamp
            const response = await fetch(`api/simple-chat.php?since=${this.lastTimestamp}&user_id=${encodeURIComponent(this.userId)}&username=${encodeURIComponent(this.username)}`, {
                method: 'GET'
            });

            const result = await response.json();

            if (result.success) {
                // Update online count
                this.onlineCount = result.online_count || 0;
                this.updateOnlineCount();
                
                // Process new messages (may be empty if no updates)
                if (result.messages && result.messages.length > 0) {
                    const roomName = 'general'; // Flat-file system uses general room
                    
                    if (this.isInitialLoad) {
                        // Initial load: show all messages immediately without stagger or scroll animation
                        result.messages.forEach((message) => {
                            this.displayMessage(message, roomName, false); // false = no scroll
                        });
                        
                        // Scroll to bottom once after all initial messages are loaded
                        const messagesContainer = document.getElementById(`messages-${roomName}`);
                        if (messagesContainer) {
                            // Use requestAnimationFrame to batch scroll operations
                            requestAnimationFrame(() => {
                                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                            });
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

                    // Update last timestamp from last message ONLY
                    // This ensures we don't skip messages due to server time drift
                    const lastMessage = result.messages[result.messages.length - 1];
                    if (lastMessage.timestamp) {
                        this.lastTimestamp = lastMessage.timestamp;
                    }
                    
                    // Check if any messages are tip-related and refresh balance if needed
                    const hasTipMessages = result.messages.some(msg => 
                        msg.type === 'tip' || 
                        (msg.message && msg.message.includes('tipped '))
                    );
                    
                    if (hasTipMessages && window.unifiedBalance) {
                        console.log('💰 Tip detected in messages, refreshing balance...');
                        setTimeout(() => {
                            if (window.unifiedBalance.syncIfNeeded) {
                                window.unifiedBalance.syncIfNeeded('chat_tip_detected');
                            }
                        }, 500); // Small delay to ensure server processing is complete
                    }
                } else if (result.current_timestamp && result.current_timestamp > this.lastTimestamp) {
                    // Only update timestamp if no messages but server timestamp is newer
                    // This handles the case where we're caught up
                    this.lastTimestamp = result.current_timestamp;
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
            const response = await fetch(`api/simple-chat.php?since=${this.lastTimestamp}&guest=1`, {
                method: 'GET'
            });

            const result = await response.json();

            if (result.success) {
                // Update online count
                this.onlineCount = result.online_count || 0;
                this.updateOnlineCount();

                // Process new messages
                if (result.messages && result.messages.length > 0) {
                    const roomName = 'general'; // Flat-file system uses general room
                    
                    if (this.isInitialLoad) {
                        // Initial load: show all messages immediately without stagger or scroll animation
                        result.messages.forEach((message) => {
                            this.displayMessage(message, roomName, false); // false = no scroll
                        });
                        
                        // Scroll to bottom once after all initial messages are loaded
                        const messagesContainer = document.getElementById(`messages-${roomName}`);
                        if (messagesContainer) {
                            // Use requestAnimationFrame to batch scroll operations
                            requestAnimationFrame(() => {
                                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                            });
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

                    // Update last timestamp from last message
                    const lastMessage = result.messages[result.messages.length - 1];
                    if (lastMessage.timestamp) {
                        this.lastTimestamp = lastMessage.timestamp;
                    }
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

        // Prevent duplicate messages from being displayed
        const existingMessage = messagesContainer.querySelector(`[data-message-id="${message.id}"]`);
        if (existingMessage) {
            console.log(`⚠️ Skipping duplicate message ID: ${message.id}`);
            return;
        }

        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${message.type === 'system' ? 'system-message' : ''}`;
        
        // Store message timestamp for cleanup/duplicate prevention
        // Use timestamp as ID since flat-file messages don't have database IDs
        messageEl.dataset.messageId = message.timestamp;
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
            
            // Set message content safely and handle mentions/images
            const contentEl = messageEl.querySelector('.message-content-text');
            const decodedMessage = this.decodeHtmlEntities(message.message);
            
            // Check for image URLs (gif, jpg, jpeg, png, webp)
            const imageUrlPattern = /(https?:\/\/[^\s]+\.(gif|jpe?g|png|webp)(\?[^\s]*)?)/gi;
            const hasImages = imageUrlPattern.test(decodedMessage);
            
            if (hasImages) {
                // Handle images with innerHTML
                const messageWithImages = decodedMessage.replace(imageUrlPattern, (url) => {
                    return `${url}<br><img src="${url}" style="max-width: 300px; max-height: 200px; border-radius: 5px; margin: 5px 0;" onerror="this.style.display='none'" loading="lazy">`;
                });
                contentEl.innerHTML = messageWithImages;
            } else if (this.username && decodedMessage && 
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
            // Use requestAnimationFrame to batch scroll updates and reduce scroll anchoring issues
            requestAnimationFrame(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            });
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

        // Set focus to input and add @username format (consistent with notifications)
        input.focus();
        input.value = `@${username} `;
        
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
