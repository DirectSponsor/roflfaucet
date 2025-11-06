/**
 * Simple Mobile Chat Navigation
 * Shows a mobile chat button that navigates to chat.html
 * Chat page can navigate back using browser history
 */

class MobileChatNavigation {
    constructor() {
        this.init();
    }
    
    init() {
        // Only show on mobile devices
        if (!this.isMobile()) {
            return;
        }
        
        // Don't show the button on the chat page itself
        if (window.location.pathname.includes('chat.html')) {
            this.setupChatPageBackButton();
            return;
        }
        
        this.createMobileChatButton();
        this.setupNotificationCheck();
    }
    
    isMobile() {
        return window.innerWidth <= 768;
    }
    
    createMobileChatButton() {
        // Check if button already exists to prevent duplicates
        if (document.getElementById('mobile-chat-nav-button')) {
            console.log('📱 Mobile chat button already exists, skipping creation');
            return;
        }
        
        // Create the mobile chat button
        const button = document.createElement('button');
        button.className = 'mobile-chat-nav-button';
        button.id = 'mobile-chat-nav-button';
        button.innerHTML = `
            💬
            <span class="mobile-chat-nav-badge" id="mobile-chat-nav-badge">0</span>
        `;
        
        // Add click handler
        button.addEventListener('click', () => {
            // Navigate to chat page
            window.location.href = 'chat.html';
        });
        
        // Add to page
        document.body.appendChild(button);
        
        console.log('📱 Mobile chat navigation button created');
    }
    
    setupChatPageBackButton() {
        // Only show back button if user came from our site
        const referrer = document.referrer;
        const currentDomain = window.location.hostname;
        
        // Check if referrer is from our domain or if there's browser history
        const cameFromOurSite = referrer && new URL(referrer).hostname === currentDomain;
        const hasHistory = window.history.length > 1;
        
        if (!cameFromOurSite && !hasHistory) {
            console.log('📱 User came from external site or direct visit - hiding back button');
            return; // Don't show back button
        }
        
        // Add a back button to the chat page for mobile - styled like the chat button
        const chatContainer = document.querySelector('.padded');
        if (chatContainer) {
            const backButton = document.createElement('button');
            backButton.className = 'mobile-chat-back-button';
            backButton.innerHTML = '←';
            backButton.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                width: 65px;
                height: 65px;
                background: linear-gradient(135deg, #4A90E2 0%, #357abd 100%);
                border: none;
                border-radius: 50%;
                box-shadow: 0 6px 25px rgba(74, 144, 226, 0.4);
                cursor: pointer;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
                color: white;
                transition: all 0.3s ease;
                filter: drop-shadow(0 0 8px rgba(74, 144, 226, 0.3));
            `;
            
            backButton.addEventListener('click', () => {
                // Use browser back if there's history, otherwise go to index
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = 'index.html';
                }
            });
            
            backButton.addEventListener('mouseover', () => {
                backButton.style.transform = 'scale(1.1)';
                backButton.style.boxShadow = '0 8px 30px rgba(74, 144, 226, 0.5)';
            });
            
            backButton.addEventListener('mouseout', () => {
                backButton.style.transform = 'scale(1)';
                backButton.style.boxShadow = '0 6px 25px rgba(74, 144, 226, 0.4)';
            });
            
            backButton.addEventListener('mousedown', () => {
                backButton.style.transform = 'scale(0.95)';
            });
            
            backButton.addEventListener('mouseup', () => {
                backButton.style.transform = 'scale(1.1)';
            });
            
            document.body.appendChild(backButton);
            
            console.log('📱 Mobile chat back button created');
        }
    }
    
    async setupNotificationCheck() {
        // Check for unread notifications and update badge
        const userId = this.getValidUserId();
        if (!userId || userId === 'guest') return;
        
        const checkNotifications = async () => {
            try {
                const username = this.getValidUsername();
                const response = await fetch(`api/simple-notifications.php?action=summary&user_id=${userId}&username=${username}`);
                const data = await response.json();
                
                if (data.success) {
                    this.updateNotificationBadge(data.data.unread_count);
                }
            } catch (error) {
                console.error('Failed to check mobile notifications:', error);
            }
        };
        
        // Initial check
        await checkNotifications();
        
        // Check every 2 minutes
        setInterval(checkNotifications, 2 * 60 * 1000);
    }
    
    updateNotificationBadge(count) {
        const badge = document.getElementById('mobile-chat-nav-badge');
        const button = document.getElementById('mobile-chat-nav-button');
        
        if (badge && button) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.classList.add('show');
                
                // Brief animation when new notifications arrive
                button.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    button.style.transform = '';
                }, 200);
            } else {
                badge.classList.remove('show');
            }
        }
    }
    
    getValidUserId() {
        // Use same logic as site-utils.js - get combined userID for API calls
        try {
            const sessionData = localStorage.getItem('roflfaucet_session');
            if (sessionData) {
                const data = JSON.parse(sessionData);
                if (data.expires && Date.now() > data.expires) {
                    return 'guest';
                }
                return data.combined_user_id || 'guest';
            }
            return localStorage.getItem('combined_user_id') || 'guest';
        } catch (error) {
            return localStorage.getItem('combined_user_id') || 'guest';
        }
    }
    
    getValidUsername() {
        // Get username from session data
        try {
            const sessionData = localStorage.getItem('roflfaucet_session');
            if (sessionData) {
                const data = JSON.parse(sessionData);
                if (data.expires && Date.now() > data.expires) {
                    return 'guest';
                }
                return data.username || 'guest';
            }
            return localStorage.getItem('username') || 'guest';
        } catch (error) {
            return localStorage.getItem('username') || 'guest';
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Only on mobile
    if (window.innerWidth <= 768) {
        window.mobileChatNav = new MobileChatNavigation();
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    if (window.innerWidth > 768 && window.mobileChatNav) {
        // Hide mobile chat button if switching to desktop
        const button = document.getElementById('mobile-chat-nav-button');
        if (button) {
            button.style.display = 'none';
        }
    } else if (window.innerWidth <= 768 && !window.mobileChatNav) {
        // Show mobile chat if switching to mobile
        window.mobileChatNav = new MobileChatNavigation();
    }
});
