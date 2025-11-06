/**
 * Diagnostic script to check Anzar's current status and debug the activity checking
 */

const https = require('https');

async function checkChatActivity() {
    console.log('🔍 Checking current chat activity...');
    
    try {
        // Get recent messages from chat API
        const response = await makeRequest('https://roflfaucet.com/api/simple-chat.php?action=get_messages&room=general');
        
        if (!response.messages) {
            console.log('❌ No messages found in response');
            return;
        }
        
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        
        // Filter messages from last hour (excluding bot messages and commands)
        const recentUserMessages = response.messages.filter(msg => {
            const msgTime = msg.timestamp || 0;
            const isRecent = msgTime > oneHourAgo;
            const isNotBot = msg.username && !msg.username.toLowerCase().includes('anzar');
            const isNotCommand = msg.message && !msg.message.startsWith('/');
            
            return isRecent && isNotBot && isNotCommand;
        });
        
        console.log(`📊 Messages in last hour: ${recentUserMessages.length}`);
        console.log(`📊 Threshold for warnings: 6 messages`);
        console.log(`📊 Should warn: ${recentUserMessages.length >= 6 ? 'YES' : 'NO'}`);
        
        if (recentUserMessages.length > 0) {
            console.log(`\n📝 Recent messages (showing last 5):`);
            recentUserMessages.slice(-5).forEach(msg => {
                const time = new Date(msg.timestamp).toLocaleTimeString();
                console.log(`   ${time} - ${msg.username}: ${msg.message.substring(0, 50)}...`);
            });
        }
        
        // Check for recent Anzar messages
        const anzarMessages = response.messages.filter(msg => {
            const msgTime = msg.timestamp || 0;
            const isRecent = msgTime > oneHourAgo;
            const isAnzar = msg.username && msg.username.toLowerCase().includes('anzar');
            
            return isRecent && isAnzar;
        });
        
        console.log(`\n🤖 Anzar messages in last hour: ${anzarMessages.length}`);
        if (anzarMessages.length > 0) {
            console.log(`\n🤖 Recent Anzar messages:`);
            anzarMessages.forEach(msg => {
                const time = new Date(msg.timestamp).toLocaleTimeString();
                console.log(`   ${time} - ${msg.username}: ${msg.message}`);
            });
        }
        
        // Check current time and next rain schedule
        const now_date = new Date();
        const currentMinute = now_date.getMinutes();
        const currentHour = now_date.getHours();
        const nextRain = `${currentHour}:30`;
        const warningTime = `${currentHour}:20`;
        
        console.log(`\n⏰ Current time: ${now_date.toLocaleTimeString()}`);
        console.log(`⏰ Next rain scheduled: ${nextRain}`);
        console.log(`⏰ Warning time: ${warningTime}`);
        console.log(`⏰ Minutes until rain: ${(30 - currentMinute + 60) % 60}`);
        
    } catch (error) {
        console.error('❌ Error checking chat activity:', error.message);
    }
}

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Run the check
checkChatActivity().then(() => {
    console.log('\n✅ Diagnostic complete');
}).catch(error => {
    console.error('❌ Diagnostic failed:', error);
});