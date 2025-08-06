/**
 * Create Anzar Rainbot Member Account
 * Run this once to create the bot account
 */

async function createAnzarAccount() {
    console.log('🤖 Creating Anzar rainbot member account...');
    
    const botCredentials = {
        username: 'Anzar',
        password: 'RainMaster2025!', // Strong password for bot
        email: 'anzar@roflfaucet.com' // Bot email
    };
    
    try {
        // Sign up Anzar using your existing auth system
        const response = await fetch('auth/jwt-signup.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                username: botCredentials.username,
                password: botCredentials.password,
                email: botCredentials.email
            })
        });
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ Non-JSON response:', text.substring(0, 200));
            return {
                success: false,
                error: 'Server returned non-JSON response (possibly auth endpoint not found)'
            };
        }
        
        const data = await response.json();
        
        if (data.jwt_token || data.jwt) {
            const token = data.jwt_token || data.jwt;
            console.log('✅ Anzar account created successfully!');
            console.log('🔑 JWT Token:', token);
            
            // Set the token in the rainbot system
            if (window.anzarBot) {
                window.anzarBot.setBotToken(token);
                console.log('🤖 Anzar token set in rainbot system');
            }
            
            // Store token for future use
            localStorage.setItem('anzar_jwt_token', token);
            
            // Test the account by getting balance
            await testAnzarAccount(token);
            
            return {
                success: true,
                token: token,
                message: 'Anzar account created and configured!'
            };
            
        } else {
            console.error('❌ Account creation failed:', data.error);
            return {
                success: false,
                error: data.error || 'Account creation failed'
            };
        }
        
    } catch (error) {
        console.error('💥 Error creating Anzar account:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function testAnzarAccount(token) {
    console.log('🧪 Testing Anzar account...');
    
    try {
        // Test getting balance
        const response = await fetch('https://data.directsponsor.org/api/user/balance', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Anzar balance:', Math.floor(data.balance.current), 'coins');
            
            // Give Anzar some starting coins for the rainpool
            await addStartingCoins(token);
            
        } else {
            console.error('❌ Balance test failed');
        }
        
    } catch (error) {
        console.error('💥 Error testing account:', error);
    }
}

async function addStartingCoins(token) {
    console.log('💰 Adding starting coins to Anzar...');
    
    try {
        // Add 100 starting coins to Anzar's account
        const response = await fetch('https://data.directsponsor.org/api/user/transaction', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'earn',
                amount: 100,
                source: 'rainbot_initialization',
                site_id: 'roflfaucet',
                description: 'Initial rainpool funding for Anzar bot'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Added 100 starting coins! New balance:', Math.floor(data.balance.current));
        } else {
            console.log('⚠️ Could not add starting coins (account still works)');
        }
        
    } catch (error) {
        console.log('⚠️ Starting coins failed (account still works):', error.message);
    }
}

// Function to load existing Anzar token if already created
function loadAnzarToken() {
    const savedToken = localStorage.getItem('anzar_jwt_token');
    if (savedToken && window.anzarBot) {
        console.log('🔑 Loading saved Anzar token...');
        window.anzarBot.setBotToken(savedToken);
        return savedToken;
    }
    return null;
}

// Auto-load existing token on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        loadAnzarToken();
    }, 2000); // Wait for systems to load
});

// Global functions
window.createAnzarAccount = createAnzarAccount;
window.loadAnzarToken = loadAnzarToken;

console.log('🤖 Anzar account creation script loaded!');
console.log('Usage: createAnzarAccount() or loadAnzarToken()');
