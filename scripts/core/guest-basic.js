// Guest Basic JavaScript
// Limited functionality for non-logged-in users

console.log('Guest mode activated');

// Initialize guest experience
document.addEventListener('DOMContentLoaded', function() {
    // Add guest-mode class to body
    document.body.classList.add('guest-mode');
    
    // Initialize basic guest features
    initGuestInterface();
    initGuestCallToAction();
    
    console.log('Guest interface initialized');
});

// Initialize guest interface
function initGuestInterface() {
    // Set up basic UI elements
    const authBtn = document.getElementById('oauth-login-btn');
    if (authBtn) {
        authBtn.textContent = 'Login to Earn More';
        authBtn.addEventListener('click', function() {
            // Redirect to login
            window.location.href = 'https://auth.directsponsor.org/oauth/authorize?client_id=roflfaucet&redirect_uri=' + encodeURIComponent(window.location.origin + '/auth/callback');
        });
    }
    
    // Show guest-specific messages
    const loginNotice = document.getElementById('login-notice');
    if (loginNotice) {
        loginNotice.style.display = 'block';
    }
    
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
        welcomeMessage.style.display = 'none';
    }
}

// Initialize call-to-action elements
function initGuestCallToAction() {
    // Add signup prompts where appropriate
    const ctaContainer = document.createElement('div');
    ctaContainer.className = 'cta-signup';
    ctaContainer.innerHTML = `
        <h3>🚀 Join ROFLFaucet Today!</h3>
        <p>Sign up to earn more tokens, access exclusive games, and track your progress!</p>
        <button onclick="redirectToSignup()" style="margin-top: 10px; padding: 8px 16px; background: white; color: #ff6b6b; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Sign Up Now</button>
    `;
    
    // Insert after the main faucet container
    const faucetContainer = document.querySelector('.faucet-container');
    if (faucetContainer) {
        faucetContainer.parentNode.insertBefore(ctaContainer, faucetContainer.nextSibling);
    }
}

// Redirect to signup
function redirectToSignup() {
    window.location.href = 'https://auth.directsponsor.org/oauth/authorize?client_id=roflfaucet&redirect_uri=' + encodeURIComponent(window.location.origin + '/auth/callback');
}

// Basic guest faucet functionality
function initGuestFaucet() {
    const claimBtn = document.getElementById('start-claim-btn');
    if (claimBtn) {
        claimBtn.addEventListener('click', function() {
            // Basic demo functionality
            showGuestDemo();
        });
    }
}

// Show demo functionality for guests
function showGuestDemo() {
    alert('🎮 Demo Mode\n\nThis is a preview of the faucet. Sign up to earn real UselessCoins!');
    
    // Simulate basic claim process
    const balanceElement = document.getElementById('oauth-balance');
    if (balanceElement) {
        const currentBalance = parseInt(balanceElement.textContent) || 0;
        balanceElement.textContent = currentBalance + 5;
        
        // Show temporary message
        const message = document.createElement('div');
        message.textContent = '🎉 Demo: +5 tokens! Sign up to keep your earnings!';
        message.style.cssText = 'background: #ff6b6b; color: white; padding: 10px; border-radius: 4px; margin: 10px 0; text-align: center;';
        
        const container = document.querySelector('.content-container');
        if (container) {
            container.insertBefore(message, container.firstChild);
            
            // Remove message after 5 seconds
            setTimeout(() => {
                message.remove();
            }, 5000);
        }
    }
}

// Initialize guest faucet when page loads
document.addEventListener('DOMContentLoaded', function() {
    initGuestFaucet();
});

// Guest-specific utility functions
const GuestUtils = {
    // Show member-only feature prompt
    showMemberPrompt: function(featureName) {
        const prompt = document.createElement('div');
        prompt.className = 'member-feature-prompt';
        prompt.innerHTML = `
            <div style="background: #4a90e2; color: white; padding: 15px; border-radius: 8px; margin: 10px 0; text-align: center; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <strong>🎯 Member Feature</strong><br>
                ${featureName || 'This feature'} requires a member account<br><br>
                <button onclick="redirectToSignup()" style="background: #ff6b6b; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-right: 10px;">Sign Up</button>
                <button onclick="this.parentElement.parentElement.remove()" style="background: transparent; color: white; border: 1px solid white; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Continue as Guest</button>
            </div>
        `;
        
        document.body.appendChild(prompt);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (prompt.parentElement) {
                prompt.remove();
            }
        }, 8000);
    },
    
    // Check if user is in guest mode
    isGuestMode: function() {
        return document.body.classList.contains('guest-mode');
    },
    
    // Block member-only features
    blockMemberFeature: function(element, featureName) {
        if (element) {
            element.addEventListener('click', function(e) {
                e.preventDefault();
                GuestUtils.showMemberPrompt(featureName);
            });
        }
    }
};

// Initialize member-only feature blocking
document.addEventListener('DOMContentLoaded', function() {
    // Block member-only elements
    const memberOnlyElements = document.querySelectorAll('.member-only');
    memberOnlyElements.forEach(element => {
        const featureName = element.getAttribute('data-feature-name') || 'This feature';
        GuestUtils.blockMemberFeature(element, featureName);
    });
});
