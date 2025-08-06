/**
 * MOCK WEBSOCKET FOR CHAT TESTING
 * ================================ 
 * Simulates WebSocket behavior for testing chat without backend server
 */

class MockWebSocket {
    constructor(url) {
        this.url = url;
        this.readyState = MockWebSocket.CONNECTING;
        this.onopen = null;
        this.onmessage = null;
        this.onclose = null;
        this.onerror = null;
        
        // Simulate connection after short delay
        setTimeout(() => {
            this.readyState = MockWebSocket.OPEN;
            if (this.onopen) {
                this.onopen({ type: 'open' });
            }
            
            // Send initial system messages
            this.simulateWelcomeMessages();
            
            // Start simulation loops
            this.startSimulation();
        }, 500);
    }
    
    send(data) {
        if (this.readyState !== MockWebSocket.OPEN) {
            console.warn('WebSocket not open, cannot send:', data);
            return;
        }
        
        try {
            const message = JSON.parse(data);
            this.handleOutgoingMessage(message);
        } catch (error) {
            console.error('Failed to parse message:', error);
        }
    }
    
    close() {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onclose) {
            this.onclose({ type: 'close' });
        }
    }
    
    simulateWelcomeMessages() {
        // User count
        this.sendMessage({
            type: 'userCount',
            count: Math.floor(Math.random() * 50) + 10
        });
        
        // Rain pool
        this.sendMessage({
            type: 'rainPool',
            amount: Math.floor(Math.random() * 500) + 100
        });
        
        // Welcome to general
        this.sendMessage({
            type: 'message',
            user: 'ROFLBot',
            message: 'Welcome to ROFLChat! Type /help for commands.',
            room: 'general',
            timestamp: Date.now()
        });
        
        // Simulate some chat history
        const users = ['Alice29', 'CryptoKing', 'LuckyDice', 'Hodler2023', 'FaucetFan'];
        const messages = [
            'Hey everyone! 👋',
            'Just hit a 100x multiplier on slots! 🎰',
            'Anyone know when the next rain event is?',
            'Thanks for the tip @Alice29! 💰',
            'VIP room is active tonight',
            'Good luck everyone!'
        ];
        
        users.forEach((user, i) => {
            setTimeout(() => {
                this.sendMessage({
                    type: 'message',
                    user: user,
                    message: messages[i] || `Hello from ${user}!`,
                    room: 'general',
                    timestamp: Date.now() - (300000 - i * 30000) // 5 min ago to now
                });
            }, i * 200);
        });
    }
    
    startSimulation() {
        // Random user joins/leaves
        setInterval(() => {
            if (Math.random() < 0.3) {
                const users = ['NewUser' + Math.floor(Math.random() * 100), 'Visitor' + Math.floor(Math.random() * 100)];
                const user = users[Math.floor(Math.random() * users.length)];
                
                if (Math.random() < 0.7) {
                    this.sendMessage({
                        type: 'userJoin',
                        user: user,
                        room: 'general',
                        userCount: Math.floor(Math.random() * 50) + 10
                    });
                } else {
                    this.sendMessage({
                        type: 'userLeave', 
                        user: user,
                        room: 'general',
                        userCount: Math.floor(Math.random() * 50) + 10
                    });
                }
            }
        }, 15000);
        
        // Random chat messages
        setInterval(() => {
            if (Math.random() < 0.4) {
                const users = ['RegularUser', 'ChattyMcChat', 'SilentBob', 'ActiveUser'];
                const messages = [
                    'How is everyone doing?',
                    'Just claimed from the faucet! 🚰',
                    'Anyone playing slots tonight?',
                    'Nice weather today ☀️',
                    'Good luck to all!',
                    'Rain coming soon? 🌧️'
                ];
                
                this.sendMessage({
                    type: 'message',
                    user: users[Math.floor(Math.random() * users.length)],
                    message: messages[Math.floor(Math.random() * messages.length)],
                    room: 'general',
                    timestamp: Date.now()
                });
            }
        }, 8000);
        
        // Random tips
        setInterval(() => {
            if (Math.random() < 0.2) {
                const users = ['TipperMcTip', 'GenerousUser', 'CoinSharer'];
                const recipients = ['LuckyUser', 'NewPlayer', 'ActiveChatter'];
                
                this.sendMessage({
                    type: 'tip',
                    from: users[Math.floor(Math.random() * users.length)],
                    to: recipients[Math.floor(Math.random() * recipients.length)],
                    amount: Math.floor(Math.random() * 50) + 10,
                    room: 'general'
                });
            }
        }, 25000);
        
        // Random rain events
        setInterval(() => {
            if (Math.random() < 0.1) {
                this.sendMessage({
                    type: 'rain',
                    message: `🌧️ Rain event! ${Math.floor(Math.random() * 200) + 50} coins distributed to ${Math.floor(Math.random() * 10) + 5} lucky users!`,
                    amount: Math.floor(Math.random() * 200) + 50,
                    room: 'general'
                });
                
                // Update rain pool
                setTimeout(() => {
                    this.sendMessage({
                        type: 'rainPool',
                        amount: Math.floor(Math.random() * 300) + 50
                    });
                }, 1000);
            }
        }, 45000);
    }
    
    handleOutgoingMessage(message) {
        console.log('Mock: Handling outgoing message:', message);
        
        switch (message.type) {
            case 'message':
                // Echo back user's message
                setTimeout(() => {
                    this.sendMessage({
                        type: 'message',
                        user: 'TestUser',
                        message: message.message,
                        room: message.room,
                        timestamp: Date.now()
                    });
                }, 200);
                break;
                
            case 'tip':
                setTimeout(() => {
                    this.sendMessage({
                        type: 'tip',
                        from: 'TestUser',
                        to: message.target,
                        amount: message.amount,
                        room: 'general'
                    });
                }, 500);
                break;
                
            case 'rain':
                setTimeout(() => {
                    this.sendMessage({
                        type: 'rain',
                        message: `🌧️ TestUser started a rain event! ${message.amount} coins distributed!`,
                        amount: message.amount,
                        room: 'general'
                    });
                }, 500);
                break;
                
            case 'balance':
                setTimeout(() => {
                    this.sendMessage({
                        type: 'message',
                        user: 'ROFLBot',
                        message: `💰 Your balance: ${Math.floor(Math.random() * 1000) + 100} coins`,
                        room: message.room || 'general',
                        timestamp: Date.now()
                    });
                }, 300);
                break;
                
            case 'online':
                setTimeout(() => {
                    this.sendMessage({
                        type: 'message',
                        user: 'ROFLBot', 
                        message: `👥 Currently ${Math.floor(Math.random() * 50) + 10} users online`,
                        room: message.room || 'general',
                        timestamp: Date.now()
                    });
                }, 300);
                break;
        }
    }
    
    sendMessage(data) {
        if (this.onmessage) {
            this.onmessage({
                type: 'message',
                data: JSON.stringify(data)
            });
        }
    }
    
    // WebSocket constants
    static get CONNECTING() { return 0; }
    static get OPEN() { return 1; }
    static get CLOSING() { return 2; }
    static get CLOSED() { return 3; }
}

// Override WebSocket for testing
window.MockWebSocket = MockWebSocket;

// Auto-enable mock mode if WebSocket connection fails
const originalWebSocket = window.WebSocket;
window.WebSocket = function(url) {
    console.log('🔌 Attempting WebSocket connection to:', url);
    
    try {
        const ws = new originalWebSocket(url);
        
        // If connection fails, fall back to mock
        ws.addEventListener('error', () => {
            console.log('⚠️ WebSocket failed, using mock mode');
        });
        
        return ws;
    } catch (error) {
        console.log('⚠️ WebSocket not available, using mock mode');
        return new MockWebSocket(url);
    }
};

console.log('🧪 Mock WebSocket initialized for chat testing');
