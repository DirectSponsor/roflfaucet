/**
 * CHAT INTEGRATION FOR ROFLFAUCET
 * ===============================
 * Connects the chat widget to ROFLFaucet's existing systems:
 * - Unified balance system
 * - JWT authentication
 * - Site utilities
 */

class ROFLChatIntegration {
    constructor() {
        console.log('🔧 ROFLChatIntegration constructor called');
        this.chatWidget = null;
        this.isInitialized = false;
        this.connectionStatus = document.getElementById('connection-status');
        
        console.log('🔧 Connection status element:', this.connectionStatus);
        
        // Wait for DOM and dependencies to load
        if (document.readyState === 'loading') {
            console.log('🔧 DOM still loading, waiting...');
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            console.log('🔧 DOM ready, initializing immediately');
            this.init();
        }
    }
    
    async init() {
        console.log('🎮 Initializing ROFLChat integration...');
        
        try {
            // Wait for dependencies
            await this.waitForDependencies();
            
            // Initialize chat widget
            this.initializeChatWidget();
            
            // Connect to existing systems
            this.connectToBalance();
            this.connectToAuth();
            this.setupEventListeners();
            
            // Initialize with current authentication state
            this.initializeAuthState();
            
            this.isInitialized = true;
            this.updateConnectionStatus('Connected to ROFLFaucet systems', 'success');
            
            console.log('✅ ROFLChat integration complete');
            
        } catch (error) {
            console.error('❌ Failed to initialize chat:', error);
            this.updateConnectionStatus('Failed to initialize chat system', 'error');
        }
    }
    
    async waitForDependencies() {
        const maxWait = 5000; // 5 seconds
        const startTime = Date.now();
        
        return new Promise((resolve, reject) => {
            const checkDependencies = () => {
                // Check if ChatWidget is available (required)
                const hasChatWidget = typeof window.ChatWidget !== 'undefined';
                
                if (hasChatWidget) {
                    console.log('✅ ChatWidget found, proceeding with initialization');
                    resolve();
                    return;
                }
                
                if (Date.now() - startTime > maxWait) {
                    console.warn('⚠️ ChatWidget not found, trying to proceed anyway');
                    reject(new Error('ChatWidget not available'));
                    return;
                }
                
                setTimeout(checkDependencies, 100);
            };
            
            checkDependencies();
        });
    }
    
    initializeChatWidget() {
        const container = document.getElementById('chat-widget-container');
        if (!container) {
            throw new Error('Chat widget container not found');
        }
        
        // Configure chat widget for fullpage mode
        this.chatWidget = new ChatWidget(container, {
            mode: 'fullpage',
            rooms: ['general', 'vip', 'help'],
            defaultRoom: 'general',
            wsUrl: this.getWebSocketUrl(),
            maxMessages: 100
        });
        
        console.log('📱 Chat widget initialized in fullpage mode');
    }
    
    getWebSocketUrl() {
        // Always use the production server for chat
        return 'wss://roflfaucet.com:8081/chat';
    }
    
    connectToBalance() {
        if (!window.unifiedBalance) {
            console.warn('⚠️ Unified balance system not available');
            return;
        }
        
        // Update chat widget when balance changes (if onBalanceUpdate exists)
        if (typeof window.unifiedBalance.onBalanceUpdate === 'function') {
            window.unifiedBalance.onBalanceUpdate((newBalance) => {
                if (this.chatWidget) {
                    this.chatWidget.updateBalanceFromAPI(newBalance);
                }
            });
        }
        
        // Set initial balance (async)
        this.updateChatBalance();
        
        console.log('💰 Connected to unified balance system');
    }
    
    connectToAuth() {
        // Check for existing authentication
        const authData = this.getCurrentAuthData();
        if (authData) {
            this.handleAuthUpdate(authData);
        }
        
        // Listen for auth changes
        document.addEventListener('authStateChanged', (event) => {
            this.handleAuthUpdate(event.detail);
        });
        
        // Listen for login button clicks
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.updateConnectionStatus('Authentication required for chat', 'warning');
            });
        }
        
        console.log('🔐 Connected to authentication system');
    }
    
    getCurrentAuthData() {
        // Try to get auth data from various sources
        
        // From localStorage (JWT token)
        const token = localStorage.getItem('jwt_token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return {
                    user: {
                        id: payload.sub || payload.userId || payload.id,
                        username: payload.username || payload.name || payload.user,
                        email: payload.email,
                        balance: 0 // Balance will be loaded from unified balance system
                    },
                    token: token
                };
            } catch (error) {
                console.warn('Failed to parse JWT token:', error);
            }
        }
        
        // Check if JWT Simple Faucet has user data
        if (window.jwtSimpleFaucet && window.jwtSimpleFaucet.userProfile) {
            return {
                user: {
                    id: window.jwtSimpleFaucet.userProfile.id || 'jwt_user',
                    username: window.jwtSimpleFaucet.userProfile.username,
                    email: window.jwtSimpleFaucet.userProfile.email,
                    balance: 0 // Balance will be loaded from unified balance system
                },
                token: window.jwtSimpleFaucet.jwtToken
            };
        }
        
        return null;
    }

    async initializeAuthState() {
        // Initialize with current authentication state
        const authData = this.getCurrentAuthData();
        if (authData) {
            await this.handleAuthUpdate(authData);
        } else {
            this.updateConnectionStatus('Sign in to participate in chat', 'warning');
        }
    }
    
    async updateChatBalance() {
        if (!this.chatWidget || !window.unifiedBalance) return;
        
        try {
            const currentBalance = await window.unifiedBalance.getBalance();
            this.chatWidget.updateBalanceFromAPI(currentBalance);
            console.log('💰 Chat balance updated:', currentBalance);
        } catch (error) {
            console.warn('⚠️ Failed to update chat balance:', error);
        }
    }

    handleAuthUpdate(authData) {
        if (!this.chatWidget) return;
        
        if (authData && authData.user) {
            // User is authenticated
            this.chatWidget.setUser(authData.user);
            this.updateConnectionStatus(`Signed in as ${authData.user.username}`, 'success');
            
            // Update balance if available - note: unified balance manages its own state
            // No need to manually set balance as it's loaded from API/localStorage
            
        } else {
            // User is not authenticated
            this.chatWidget.setUser(null);
            this.updateConnectionStatus('Sign in to participate in chat', 'warning');
        }
    }
    
    setupEventListeners() {
        // Listen for balance updates from faucet/slots
        document.addEventListener('balanceUpdated', (event) => {
            const newBalance = event.detail.balance;
            if (this.chatWidget) {
                this.chatWidget.updateBalanceFromAPI(newBalance);
            }
        });
        
        // Listen for chat-specific events
        document.addEventListener('chatTipReceived', (event) => {
            const { from, amount } = event.detail;
            
            // Update balance
            const currentBalance = window.unifiedBalance?.getBalance() || 0;
            const newBalance = currentBalance + amount;
            window.unifiedBalance?.setBalance(newBalance);
            
            // Show notification
            this.showNotification(`💰 You received ${amount} coins from ${from}!`, 'success');
        });
        
        document.addEventListener('chatRainReceived', (event) => {
            const { amount } = event.detail;
            
            // Update balance
            const currentBalance = window.unifiedBalance?.getBalance() || 0;
            const newBalance = currentBalance + amount;
            window.unifiedBalance?.setBalance(newBalance);
            
            // Show notification
            this.showNotification(`🌧️ You caught ${amount} coins in the rain!`, 'success');
        });
        
        // Handle page visibility changes (pause/resume chat)
        document.addEventListener('visibilitychange', () => {
            if (this.chatWidget) {
                if (document.hidden) {
                    console.log('📱 Chat paused (page hidden)');
                } else {
                    console.log('📱 Chat resumed (page visible)');
                }
            }
        });
        
        console.log('📡 Event listeners configured');
    }
    
    updateConnectionStatus(message, type = 'info') {
        if (!this.connectionStatus) return;
        
        const colors = {
            success: '#2ecc71',
            error: '#e74c3c',
            warning: '#f1c40f',
            info: '#3498db'
        };
        
        this.connectionStatus.textContent = message;
        this.connectionStatus.style.color = colors[type] || colors.info;
        
        // Update the parent container background
        const statusContainer = document.getElementById('chat-status');
        if (statusContainer) {
            const bgColors = {
                success: 'rgba(46, 204, 113, 0.1)',
                error: 'rgba(231, 76, 60, 0.1)',
                warning: 'rgba(241, 196, 15, 0.1)',
                info: 'rgba(52, 152, 219, 0.1)'
            };
            
            const borderColors = {
                success: '#2ecc71',
                error: '#e74c3c',
                warning: '#f1c40f',
                info: '#3498db'
            };
            
            statusContainer.style.background = bgColors[type] || bgColors.info;
            statusContainer.style.borderLeftColor = borderColors[type] || borderColors.info;
        }
    }
    
    showNotification(message, type = 'info') {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#2ecc71' : '#3498db'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-size: 14px;
            max-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
    
    // Public API methods
    getChatWidget() {
        return this.chatWidget;
    }
    
    isReady() {
        return this.isInitialized && this.chatWidget;
    }
    
    sendSystemMessage(message, room = 'general') {
        if (this.chatWidget) {
            this.chatWidget.addMessageFromAPI({
                type: 'system',
                text: message,
                room: room,
                timestamp: Date.now()
            });
        }
    }
    
    simulateTip(from, to, amount) {
        if (this.chatWidget) {
            this.chatWidget.addMessageFromAPI({
                type: 'tip',
                from: from,
                to: to,
                amount: amount,
                room: 'general',
                timestamp: Date.now()
            });
        }
    }
    
    simulateRain(amount, recipients) {
        if (this.chatWidget) {
            this.chatWidget.addMessageFromAPI({
                type: 'rain',
                message: `🌧️ Rain event! ${amount} coins distributed to ${recipients} users!`,
                amount: amount,
                room: 'general',
                timestamp: Date.now()
            });
        }
    }
}

// Add CSS for notifications
const notificationCSS = `
@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOutRight {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}
`;

const style = document.createElement('style');
style.textContent = notificationCSS;
document.head.appendChild(style);

// Initialize the integration
const roflChatIntegration = new ROFLChatIntegration();

// Make it globally available for debugging
window.roflChatIntegration = roflChatIntegration;

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ROFLChatIntegration;
}
