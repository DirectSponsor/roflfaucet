/**
 * Modern Simple Gallery System 
 * Optimized for table layout with SEO-friendly linking
 * No iframes, just clean image display with proper attribution
 */

class ModernSimpleGallery {
    constructor() {
        // Simple gallery sources - can be local files or external URLs
        this.galleries = {
            giphy: 'data/giphy_gallery.txt',
            postimg: 'data/postimg_gallery.txt', 
            vgy: 'data/vgy_gallery.txt',
            flickr: 'data/flickr_gallery.txt'  // Future expansion
        };
        
        // Provider rate limiting (same as before)
        this.providers = {
            giphy: {
                name: 'Giphy',
                limit: 100,
                resetPeriod: 60 * 60 * 1000, // 1 hour
                currentCount: 0,
                lastReset: Date.now(),
                priority: 1
            },
            postimg: {
                name: 'PostImg',
                limit: 1000,
                resetPeriod: 24 * 60 * 60 * 1000, // 24 hours
                currentCount: 0,
                lastReset: Date.now(),
                priority: 2
            },
            vgy: {
                name: 'VGY.me',
                limit: 1000,
                resetPeriod: 24 * 60 * 60 * 1000, // 24 hours
                currentCount: 0,
                lastReset: Date.now(),
                priority: 3
            },
            flickr: {
                name: 'Flickr',
                limit: 3600,
                resetPeriod: 60 * 60 * 1000, // 1 hour
                currentCount: 0,
                lastReset: Date.now(),
                priority: 4
            }
        };
        
        this.currentGallery = this.getBestAvailableProvider();
        this.loadUsageFromStorage();
    }
    
    // Parse different content formats
    parseContentLine(line, provider) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('<!--') || trimmed.startsWith('[')) return null;
        
        // Handle different formats based on provider
        if (provider === 'giphy') {
            return this.parseGiphyContent(trimmed);
        } else if (provider === 'postimg') {
            return this.parsePostImgContent(trimmed);
        } else {
            return this.parseGenericContent(trimmed);
        }
    }
    
    parseGiphyContent(line) {
        // Extract Giphy ID from iframe or direct URL
        const giphyMatch = line.match(/giphy\.com\/embed\/([a-zA-Z0-9]+)/);
        if (giphyMatch) {
            const giphyId = giphyMatch[1];
            return {
                type: 'giphy',
                imageUrl: `https://media.giphy.com/media/${giphyId}/giphy.gif`,
                pageUrl: `https://giphy.com/gifs/${giphyId}`,
                altText: 'Funny GIF from Giphy'
            };
        }
        return null;
    }
    
    parsePostImgContent(line) {
        // Extract PostImg image and page URLs
        const imgMatch = line.match(/src="([^"]*postimg[^"]*)"/);
        const linkMatch = line.match(/href="([^"]*postimg[^"]*)"/);
        
        if (imgMatch) {
            return {
                type: 'postimg',
                imageUrl: imgMatch[1],
                pageUrl: linkMatch ? linkMatch[1] : imgMatch[1],
                altText: 'Image from PostImg'
            };
        }
        return null;
    }
    
    parseGenericContent(line) {
        // Handle direct image URLs or simple HTML
        if (line.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return {
                type: 'direct',
                imageUrl: line,
                pageUrl: line,
                altText: 'Gallery image'
            };
        }
        
        // Try to extract from HTML
        const imgMatch = line.match(/src="([^"]*)"/);
        const linkMatch = line.match(/href="([^"]*)"/);
        
        if (imgMatch) {
            return {
                type: 'html',
                imageUrl: imgMatch[1],
                pageUrl: linkMatch ? linkMatch[1] : imgMatch[1],
                altText: 'Gallery image'
            };
        }
        
        return null;
    }
    
    // Generate table-optimized HTML
    generateImageHTML(imageData, maxWidth = '100%') {
        if (!imageData) return '<div class="gallery-placeholder">Loading image...</div>';
        
        const attribution = this.getProviderAttribution(imageData.type);
        
        return `
            <div class="gallery-item" style="text-align: center; margin: 10px 0;">
                <a href="${imageData.pageUrl}" target="_blank" rel="noopener">
                    <img src="${imageData.imageUrl}" 
                         alt="${imageData.altText}"
                         style="max-width: ${maxWidth}; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
                         loading="lazy"
                         onerror="this.style.display='none';">
                </a>
                ${attribution ? `<div class="image-attribution" style="font-size: 0.8em; color: #666; margin-top: 5px;">${attribution}</div>` : ''}
            </div>
        `;
    }
    
    getProviderAttribution(type) {
        const attributions = {
            'giphy': 'via Giphy',
            'postimg': 'via PostImg', 
            'vgy': 'via VGY.me',
            'flickr': 'via Flickr'
        };
        return attributions[type] || '';
    }
    
    // Load file and parse content
    async loadLines(galleryName) {
        const fileName = this.galleries[galleryName];
        if (!fileName) return [];
        
        try {
            const response = await fetch(fileName);
            if (!response.ok) throw new Error(`Failed to load ${fileName}`);
            
            const text = await response.text();
            const lines = text.split('\\n')
                            .map(line => this.parseContentLine(line, galleryName))
                            .filter(item => item !== null);
            
            console.log(`🖼️ Loaded ${lines.length} images from ${fileName}`);
            return lines;
        } catch (error) {
            console.error(`🖼️ Failed to load ${fileName}:`, error);
            return [];
        }
    }
    
    // Get random image data
    async getRandomImageData(galleryName = null) {
        if (!galleryName) {
            galleryName = this.getBestAvailableProvider();
            this.currentGallery = galleryName;
        }
        
        const images = await this.loadLines(galleryName);
        if (!images || images.length === 0) {
            console.warn(`🖼️ No images available from ${galleryName}`);
            return null;
        }
        
        const randomIndex = Math.floor(Math.random() * images.length);
        const selectedImage = images[randomIndex];
        
        this.recordUsage(galleryName);
        console.log(`🖼️ Selected image from ${this.providers[galleryName].name}`);
        
        return selectedImage;
    }
    
    // Display image in element with table-optimized sizing
    async displayImageIn(elementId, maxWidth = '280px') {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn('🖼️ Element not found:', elementId);
            return false;
        }
        
        const imageData = await this.getRandomImageData();
        if (!imageData) {
            element.innerHTML = '<div class="gallery-error">No images available</div>';
            return false;
        }
        
        element.innerHTML = this.generateImageHTML(imageData, maxWidth);
        return true;
    }
    
    // Rate limiting methods (keep same as enhanced version)
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
    
    getBestAvailableProvider() {
        this.checkAndResetLimits();
        
        const availableProviders = Object.keys(this.providers)
            .filter(key => this.providers[key].currentCount < this.providers[key].limit)
            .sort((a, b) => this.providers[a].priority - this.providers[b].priority);
        
        if (availableProviders.length === 0) {
            console.warn('⚠️ All providers at rate limit, using first available');
            return Object.keys(this.providers)[0];
        }
        
        return availableProviders[0];
    }
    
    recordUsage(providerKey) {
        if (this.providers[providerKey]) {
            this.providers[providerKey].currentCount++;
            console.log(`📊 ${this.providers[providerKey].name}: ${this.providers[providerKey].currentCount}/${this.providers[providerKey].limit} requests used`);
            
            if (this.providers[providerKey].currentCount >= this.providers[providerKey].limit * 0.9) {
                console.log(`⚠️ ${this.providers[providerKey].name} approaching limit, switching providers...`);
                this.currentGallery = this.getBestAvailableProvider();
            }
            
            this.saveUsageToStorage();
        }
    }
    
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
                available: provider.currentCount < provider.limit
            };
        });
        
        return stats;
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Initializing Modern Gallery System...');
    window.modernGallery = new ModernSimpleGallery();
    
    setTimeout(() => {
        // Auto-populate gallery containers
        const galleryContainers = document.querySelectorAll('[data-gallery]');
        
        galleryContainers.forEach(async (container) => {
            const maxWidth = container.getAttribute('data-max-width') || '280px';
            await window.modernGallery.displayImageIn(container.id, maxWidth);
        });
    }, 500);
});

// Global monitoring functions
window.checkModernGalleryUsage = function() {
    if (window.modernGallery) {
        console.table(window.modernGallery.getUsageStats());
        return window.modernGallery.getUsageStats();
    }
    return null;
};

console.log('✅ Modern Gallery System ready!');