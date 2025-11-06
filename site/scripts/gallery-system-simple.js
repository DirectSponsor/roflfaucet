// Enhanced Simple Gallery System with Rate Limiting
// Handles multiple providers and rotates when rate limits are hit
console.log('🖼️ Enhanced Gallery System loading...');

class SimpleGallery {
    constructor() {
        this.galleries = {
            postimg: 'data/postimg_gallery.txt',
            giphy: 'data/giphy_gallery.txt', 
            vgy: 'data/vgy_gallery.txt'
        };
        
        // Provider configuration with rate limits
        this.providers = {
            giphy: {
                name: 'Giphy',
                limit: 100, // requests per hour
                resetPeriod: 60 * 60 * 1000, // 1 hour in milliseconds
                currentCount: 0,
                lastReset: Date.now(),
                priority: 1 // Lower = higher priority
            },
            postimg: {
                name: 'PostImg',
                limit: 1000, // generous estimate
                resetPeriod: 24 * 60 * 60 * 1000, // 24 hours
                currentCount: 0,
                lastReset: Date.now(),
                priority: 2
            },
            vgy: {
                name: 'VGY.me',
                limit: 1000, // generous estimate
                resetPeriod: 24 * 60 * 60 * 1000, // 24 hours
                currentCount: 0,
                lastReset: Date.now(),
                priority: 3
            }
        };
        
        this.currentGallery = this.getBestAvailableProvider();
        this.loadUsageFromStorage();
        
        // SEO and attribution settings
        this.seoConfig = {
            siteName: 'ROFLFaucet',
            siteUrl: 'https://roflfaucet.com',
            attribution: true, // Add attribution links when appropriate
            watermark: false, // Set to true if using watermarked images
            trackReferrals: true // Track which images drive traffic
        };
    }
    
    // Load file and return array of lines
    async loadLines(galleryName) {
        const fileName = this.galleries[galleryName];
        if (!fileName) {
            console.warn('🖼️ Gallery not found:', galleryName);
            return [];
        }
        
        try {
            const response = await fetch(fileName);
            if (!response.ok) {
                throw new Error(`Failed to load ${fileName}`);
            }
            
            const text = await response.text();
            const lines = text.split('\n')
                            .map(line => line.trim())
                            .filter(line => line.length > 0); // Remove empty lines
            
            console.log(`🖼️ Loaded ${lines.length} lines from ${fileName}`);
            return lines;
        } catch (error) {
            console.error(`🖼️ Failed to load ${fileName}:`, error);
            return [];
        }
    }
    
    // Load and save usage data from localStorage
    loadUsageFromStorage() {
        try {
            const saved = localStorage.getItem('galleryProviderUsage');
            if (saved) {
                const data = JSON.parse(saved);
                Object.keys(this.providers).forEach(key => {
                    if (data[key]) {
                        this.providers[key].currentCount = data[key].currentCount || 0;
                        this.providers[key].lastReset = data[key].lastReset || Date.now();
                    }
                });
            }
        } catch (e) {
            console.log('📊 Could not load gallery usage data');
        }
        this.checkAndResetLimits();
    }
    
    saveUsageToStorage() {
        try {
            const data = {};
            Object.keys(this.providers).forEach(key => {
                data[key] = {
                    currentCount: this.providers[key].currentCount,
                    lastReset: this.providers[key].lastReset
                };
            });
            localStorage.setItem('galleryProviderUsage', JSON.stringify(data));
        } catch (e) {
            console.log('📊 Could not save gallery usage data');
        }
    }
    
    // Reset counts for providers whose reset period has elapsed
    checkAndResetLimits() {
        const now = Date.now();
        Object.keys(this.providers).forEach(key => {
            const provider = this.providers[key];
            if ((now - provider.lastReset) >= provider.resetPeriod) {
                provider.currentCount = 0;
                provider.lastReset = now;
                console.log(`🔄 Reset ${provider.name} usage count`);
            }
        });
        this.saveUsageToStorage();
    }
    
    // Get the best available provider based on limits and priority
    getBestAvailableProvider() {
        this.checkAndResetLimits();
        
        const availableProviders = Object.keys(this.providers)
            .filter(key => this.providers[key].currentCount < this.providers[key].limit)
            .sort((a, b) => this.providers[a].priority - this.providers[b].priority);
        
        if (availableProviders.length === 0) {
            console.warn('⚠️ All providers at rate limit, using first available');
            return Object.keys(this.providers)[0];
        }
        
        console.log(`🎯 Best provider: ${this.providers[availableProviders[0]].name}`);
        return availableProviders[0];
    }
    
    // Record usage and switch provider if needed
    recordUsage(providerKey) {
        if (this.providers[providerKey]) {
            this.providers[providerKey].currentCount++;
            console.log(`📊 ${this.providers[providerKey].name}: ${this.providers[providerKey].currentCount}/${this.providers[providerKey].limit} requests used`);
            
            // Switch to next best provider if current one is getting close to limit
            const provider = this.providers[providerKey];
            if (provider.currentCount >= provider.limit * 0.9) { // 90% threshold
                console.log(`⚠️ ${provider.name} approaching limit, switching providers...`);
                this.currentGallery = this.getBestAvailableProvider();
            }
            
            this.saveUsageToStorage();
        }
    }
    
    // Track image usage for SEO and analytics
    trackImageUsage(provider, imageData) {
        if (!this.seoConfig.trackReferrals) return;
        
        try {
            const usage = JSON.parse(localStorage.getItem('galleryImageTracking') || '{}');
            const today = new Date().toISOString().split('T')[0];
            
            if (!usage[today]) usage[today] = {};
            if (!usage[today][provider]) usage[today][provider] = 0;
            
            usage[today][provider]++;
            
            // Keep only last 30 days of data
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            Object.keys(usage).forEach(date => {
                if (new Date(date) < thirtyDaysAgo) {
                    delete usage[date];
                }
            });
            
            localStorage.setItem('galleryImageTracking', JSON.stringify(usage));
            console.log(`📊 Tracked image usage: ${provider} (${usage[today][provider]} today)`);
        } catch (e) {
            console.log('📊 Could not track image usage');
        }
    }
    
    // Get usage statistics for monitoring
    getUsageStats() {
        this.checkAndResetLimits();
        const stats = {};
        
        Object.keys(this.providers).forEach(key => {
            const provider = this.providers[key];
            stats[key] = {
                name: provider.name,
                used: provider.currentCount,
                limit: provider.limit,
                percentage: Math.round((provider.currentCount / provider.limit) * 100),
                available: provider.currentCount < provider.limit,
                timeToReset: Math.max(0, provider.resetPeriod - (Date.now() - provider.lastReset))
            };
        });
        
        return stats;
    }
    
    // Get SEO/referral tracking statistics
    getTrackingStats() {
        try {
            const usage = JSON.parse(localStorage.getItem('galleryImageTracking') || '{}');
            const today = new Date().toISOString().split('T')[0];
            const stats = {
                today: usage[today] || {},
                total: {}
            };
            
            // Calculate totals
            Object.keys(usage).forEach(date => {
                Object.keys(usage[date]).forEach(provider => {
                    stats.total[provider] = (stats.total[provider] || 0) + usage[date][provider];
                });
            });
            
            return stats;
        } catch (e) {
            return { today: {}, total: {} };
        }
    }
    
    // Pick random line from gallery with automatic provider switching
    async getRandomLine(galleryName = null) {
        // Auto-select best provider if none specified
        if (!galleryName) {
            galleryName = this.getBestAvailableProvider();
            this.currentGallery = galleryName;
        }
        
        const lines = await this.loadLines(galleryName);
        if (!lines || lines.length === 0) {
            console.warn(`🖼️ No lines available from ${galleryName}, trying fallback...`);
            // Try next best provider as fallback
            const fallbackProvider = this.getBestAvailableProvider();
            if (fallbackProvider !== galleryName) {
                return this.getRandomLine(fallbackProvider);
            }
            return null;
        }
        
        const randomIndex = Math.floor(Math.random() * lines.length);
        const selectedLine = lines[randomIndex];
        
        // Record usage for this provider
        this.recordUsage(galleryName);
        
        console.log(`🖼️ Selected random line from ${this.providers[galleryName].name}:`, selectedLine);
        
        // Track usage for SEO analytics
        this.trackImageUsage(galleryName, selectedLine);
        
        return selectedLine;
    }
    
    // Insert random line into DOM element
    async displayRandomLineIn(elementId) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn('🖼️ Element not found:', elementId);
            return false;
        }
        
        const randomLine = await this.getRandomLine();
        if (!randomLine) {
            console.warn('🖼️ No line available');
            return false;
        }
        
        // Directly insert the line as received
        const styledLine = randomLine;
        
        element.innerHTML = styledLine;
        console.log('🖼️ Line inserted into:', elementId);
        return true;
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Initializing Enhanced Gallery...');
    window.simpleGallery = new SimpleGallery();
    
    // Add usage stats to console for monitoring
    console.log('📊 Gallery Provider Status:', window.simpleGallery.getUsageStats());
    
    setTimeout(() => {
        // Find all containers with data-gallery attribute
        const galleryContainers = document.querySelectorAll('[data-gallery]');
        
        galleryContainers.forEach(async (container) => {
            const galleryType = container.getAttribute('data-gallery');
            const elementId = container.id;
            
            if (galleryType && elementId) {
                console.log(`🎯 Loading ${galleryType} gallery into #${elementId}`);
                // Let the system auto-select best provider instead of forcing galleryType
                if (window.simpleGallery.providers[galleryType]) {
                    window.simpleGallery.currentGallery = galleryType;
                }
                await window.simpleGallery.displayRandomLineIn(elementId);
            }
        });
    }, 500);
});

// Add global function to check gallery usage (for debugging)
window.checkGalleryUsage = function() {
    if (window.simpleGallery) {
        console.table(window.simpleGallery.getUsageStats());
        return window.simpleGallery.getUsageStats();
    }
    console.log('Gallery system not initialized yet');
    return null;
};

// Add global function to check SEO/referral tracking
window.checkGalleryTracking = function() {
    if (window.simpleGallery) {
        const stats = window.simpleGallery.getTrackingStats();
        console.log('📊 Image Usage Tracking:');
        console.log('Today:', stats.today);
        console.log('Total (30 days):', stats.total);
        return stats;
    }
    console.log('Gallery system not initialized yet');
    return null;
};

// Helper function to generate attribution HTML for images
window.getImageAttribution = function(provider, imageUrl) {
    if (!window.simpleGallery) return '';
    
    const config = window.simpleGallery.seoConfig;
    if (!config.attribution) return '';
    
    const attributions = {
        'flickr': `<small>Image shared from <a href="${imageUrl}" target="_blank">Flickr</a> | More content at <a href="${config.siteUrl}" target="_blank">${config.siteName}</a></small>`,
        'imgur': `<small>Hosted on <a href="${imageUrl}" target="_blank">Imgur</a> | Created for <a href="${config.siteUrl}" target="_blank">${config.siteName}</a></small>`,
        'postimg': `<small>Source: <a href="${imageUrl}" target="_blank">PostImg</a> | Find more at <a href="${config.siteUrl}" target="_blank">${config.siteName}</a></small>`
    };
    
    return attributions[provider] || '';
};

console.log('✅ Enhanced Gallery System ready! Use checkGalleryUsage() to monitor usage.');
