/**
 * Anzar Rainbot System - Simple bot using real user account
 */
class AnzarRainbot {
    constructor() {
        this.botUsername = 'Anzar';
        this.botUserId = 'anzar_bot';
        this.botJwtToken = null;
        this.rainScheduleMinute = 30;
        this.lastRainHour = -1;
        this.minRainBalance = 10;
        this.coinsPerMessage = 1;
        this.currentRainpoolBalance = 0;
        
        this.init();
    }
    
    async init() {
        console.log('🤖 Anzar Rainbot: Ready for rain! ⛈️');
        
        // Initial rainpool balance update
        this.updateRainpoolDisplay();
        
        // Check for rain time every minute
        setInterval(() => this.checkRainTime(), 60000);
        
        // Update rainpool display every 30 seconds
        setInterval(() => this.updateRainpoolDisplay(), 30000);
        
        // Random announcements
        setInterval(() => this.maybeAnnounce(), 3600000);
    }
    
    checkRainTime() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        if (currentMinute === this.rainScheduleMinute && currentHour !== this.lastRainHour) {
            this.lastRainHour = currentHour;
            this.executeRain();
        }
    }
    
    async executeRain() {
        console.log('🌧️ Anzar: Rain time!');
        
        // For now, send a test rain command
        await this.sendBotMessage('/rain 20');
        
        setTimeout(() => {
            this.sendBotMessage('⛈️ THE RAINS HAVE COME! Check your balance! 🪙');
        }, 2000);
    }
    
    async sendBotMessage(message) {
        console.log('🤖 Anzar says:', message);
        
        try {
            await fetch('/chat-api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    room: 1,
                    username: this.botUsername,
                    user_id: this.botUserId
                })
            });
        } catch (error) {
            console.error('❌ Bot message error:', error);
        }
    }
    
    maybeAnnounce() {
        if (Math.random() > 0.25) return;
        
        const announcements = [
            "☔ Rain clouds gathering... tip me to boost the rainpool! 🌧️",
            "🌩️ Every message adds 1 coin to the rainpool!",
            "⏰ Rain falls at :30 past each hour!",
            "💰 Tip me and I'll make it rain on everyone! 🌧️"
        ];
        
        const msg = announcements[Math.floor(Math.random() * announcements.length)];
        this.sendBotMessage(msg);
    }
    
    // Called when users send messages
    onUserMessage(username, message) {
        if (username === this.botUsername || message.startsWith('/')) return;
        
        console.log('🪙 Message from', username, '- adding coin to Anzar');
        // Simulate adding coin to rainpool for now
        this.currentRainpoolBalance += this.coinsPerMessage;
        this.updateRainpoolDisplay();
        // TODO: Add 1 coin to Anzar's balance via API
    }
    
    // Update the rainpool display in chat UI
    updateRainpoolDisplay() {
        const rainpoolElement = document.getElementById('rainpool-amount');
        if (rainpoolElement) {
            rainpoolElement.textContent = Math.floor(this.currentRainpoolBalance);
            console.log('💰 Rainpool display updated:', Math.floor(this.currentRainpoolBalance));
        }
        
        // Also update any other elements with rainpool-balance class
        const rainpoolElements = document.querySelectorAll('.rainpool-balance');
        rainpoolElements.forEach(element => {
            element.textContent = Math.floor(this.currentRainpoolBalance);
        });
    }
    
    // Get Anzar's actual balance from DirectSponsor API
    async getAnzarBalance() {
        if (!this.botJwtToken) {
            console.log('⚠️ Anzar: No JWT token set, using simulated balance');
            return this.currentRainpoolBalance;
        }
        
        try {
            const response = await fetch('https://data.directsponsor.org/api/user/balance', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.botJwtToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const balance = Math.floor(data.balance.current);
                this.currentRainpoolBalance = balance;
                this.updateRainpoolDisplay();
                console.log('✅ Anzar balance loaded:', balance);
                return balance;
            } else {
                console.error('❌ Failed to get Anzar balance from API');
                return this.currentRainpoolBalance;
            }
        } catch (error) {
            console.error('❌ Error fetching Anzar balance:', error);
            return this.currentRainpoolBalance;
        }
    }
    
    // Set Anzar's JWT token
    setBotToken(token) {
        this.botJwtToken = token;
        console.log('🔑 Anzar bot token set');
        // Immediately fetch real balance
        this.getAnzarBalance();
    }
    
    // Get current rainpool balance
    getRainpoolBalance() {
        return Math.floor(this.currentRainpoolBalance);
    }
}

// Global instance
window.anzarBot = new AnzarRainbot();

// Global convenience functions
window.setAnzarToken = (token) => window.anzarBot.setBotToken(token);
window.getRainpoolBalance = () => window.anzarBot.getRainpoolBalance();
window.updateRainpoolDisplay = () => window.anzarBot.updateRainpoolDisplay();

console.log('🤖 Anzar Rainbot loaded! ⛈️');
