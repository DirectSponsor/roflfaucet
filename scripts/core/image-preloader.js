/**
 * ROFLFaucet Image Preloader System
 * 
 * Intelligently preloads game images to improve user experience:
 * - Critical images: Load immediately on all pages
 * - Game-specific images: Load on page visit or link hover
 * - Uses intersection observer for efficient loading
 */

class ImagePreloader {
    constructor() {
        this.preloadedImages = new Set();
        this.preloadQueue = new Map();
        this.isPreloading = false;
        
        // Define image groups
        this.imageGroups = {
            // Critical images that should load on all pages
            critical: [],
            
            // Slots game images - load when visiting slots or hovering slots links
            slots: [
                'slots/images/cherries_40px.png',
                'slots/images/banana_40px.png',
                'slots/images/watermelon_40px.png',
                'slots/images/seven_40px.png',
                'slots/images/bar_40px.png',
                'slots/images/bigwin_40px.png',
                'slots/images/3fruits_40px.png',
                'slots/images/sprite_reel_vertical_120px.png'
            ],
            
            // Wheel game images - load when visiting wheel or hovering wheel links
            wheel: [
                'wheel/images/wofbase.png',
                'wheel/images/arrow.png'
            ]
        };
        
        this.init();
    }
    
    init() {
        // Preload critical images immediately
        this.preloadGroup('critical');
        
        // Set up game-specific preloading
        this.setupGamePreloading();
        
        // Preload current page's images immediately
        this.preloadCurrentPageImages();
        
        console.log('🖼️ Image preloader initialized');
    }
    
    setupGamePreloading() {
        // Preload slots images on hover over slots links
        this.setupHoverPreloading('slots.html', 'slots');
        this.setupHoverPreloading('slot', 'slots'); // For any link containing "slot"
        
        // Preload wheel images on hover over wheel links
        this.setupHoverPreloading('wheel.html', 'wheel');
        this.setupHoverPreloading('wheel', 'wheel'); // For any link containing "wheel"
        
        // Also preload when visiting games page (shows all games)
        if (window.location.pathname.includes('games.html')) {
            // Small delay to let page load, then preload all game assets
            setTimeout(() => {
                this.preloadGroup('slots');
                this.preloadGroup('wheel');
            }, 1000);
        }
    }
    
    setupHoverPreloading(linkPattern, imageGroup) {
        // Find all links that match the pattern
        const links = Array.from(document.querySelectorAll('a')).filter(link => 
            link.href.includes(linkPattern) || 
            link.textContent.toLowerCase().includes(linkPattern.toLowerCase())
        );
        
        links.forEach(link => {
            let hoverTimeout;
            
            link.addEventListener('mouseenter', () => {
                // Delay preloading slightly to avoid preloading on accidental hovers
                hoverTimeout = setTimeout(() => {
                    this.preloadGroup(imageGroup);
                }, 200);
            });
            
            link.addEventListener('mouseleave', () => {
                clearTimeout(hoverTimeout);
            });
        });
    }
    
    preloadCurrentPageImages() {
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('slots.html')) {
            this.preloadGroup('slots');
        } else if (currentPath.includes('wheel.html')) {
            this.preloadGroup('wheel');
        }
    }
    
    async preloadGroup(groupName) {
        if (!this.imageGroups[groupName]) {
            console.warn(`⚠️ Unknown image group: ${groupName}`);
            return;
        }
        
        const images = this.imageGroups[groupName];
        const newImages = images.filter(src => !this.preloadedImages.has(src));
        
        if (newImages.length === 0) {
            console.log(`✅ All ${groupName} images already preloaded`);
            return;
        }
        
        console.log(`🚀 Preloading ${newImages.length} ${groupName} images...`);
        
        // Add to queue and start preloading
        newImages.forEach(src => this.preloadQueue.set(src, groupName));
        
        if (!this.isPreloading) {
            this.processQueue();
        }
    }
    
    async processQueue() {
        if (this.preloadQueue.size === 0) {
            this.isPreloading = false;
            return;
        }
        
        this.isPreloading = true;
        const [src, groupName] = this.preloadQueue.entries().next().value;
        this.preloadQueue.delete(src);
        
        try {
            await this.preloadImage(src);
            this.preloadedImages.add(src);
            console.log(`✅ Preloaded: ${src}`);
        } catch (error) {
            console.warn(`❌ Failed to preload: ${src}`, error);
        }
        
        // Continue with next image (small delay to avoid overwhelming the browser)
        setTimeout(() => this.processQueue(), 50);
    }
    
    preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => resolve(img);
            img.onerror = (error) => reject(error);
            
            // Set source to start loading
            img.src = src;
            
            // Timeout after 10 seconds
            setTimeout(() => reject(new Error('Preload timeout')), 10000);
        });
    }
    
    // Public method to manually preload specific images
    preloadImages(imagePaths) {
        if (!Array.isArray(imagePaths)) {
            imagePaths = [imagePaths];
        }
        
        imagePaths.forEach(src => {
            if (!this.preloadedImages.has(src)) {
                this.preloadQueue.set(src, 'manual');
            }
        });
        
        if (!this.isPreloading) {
            this.processQueue();
        }
    }
    
    // Get preloading status for debugging
    getStatus() {
        return {
            preloaded: Array.from(this.preloadedImages),
            queued: Array.from(this.preloadQueue.keys()),
            isPreloading: this.isPreloading
        };
    }
}

// Initialize preloader when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.imagePreloader = new ImagePreloader();
    });
} else {
    // DOM already loaded
    window.imagePreloader = new ImagePreloader();
}

// Make it available globally for debugging
window.ImagePreloader = ImagePreloader;
