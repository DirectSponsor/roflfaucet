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
        
        this.init();
    }
    
    async init() {
        console.log('🤖 Anzar Rainbot: Ready for rain! ⛈️');
        
        // Check for rain time every minute
        setInterval(() => this.checkRainTime(), 60000);
        
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
        // TODO: Add 1 coin to Anzar's balance via API
    }
}

// Global instance
window.anzarBot = new AnzarRainbot();
console.log('🤖 Anzar Rainbot loaded! ⛈️');
