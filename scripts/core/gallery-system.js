// Simple Line-Based Gallery System
console.log('🖼️ Gallery System loading...');

class GallerySystem {
    constructor() {
        // Gallery configuration - just file paths and names
        this.galleries = {
            postimg: {
                name: 'PostImg Gallery',
                file: 'postimg_gallery.txt'
            },
            giphy: {
                name: 'GIPHY Gallery', 
                file: 'giphy_gallery.txt'
            },
            vgy: {
                name: 'VGY.me Gallery',
                file: 'vgy_gallery.txt'
            }
        };
        
        this.currentGallery = 'giphy';
        this.lastShownUrl = null;
        this.galleryCache = {}; // Cache loaded gallery contents
    }
    
    // Load gallery file and return array of URLs
    async loadGallery(galleryName) {
        const gallery = this.galleries[galleryName];
        if (!gallery) {
            console.warn('🖼️ Gallery not found:', galleryName);
            return [];
        }
        
        // Return cached version if available
        if (this.galleryCache[galleryName]) {
            return this.galleryCache[galleryName];
        }
        
        try {
            const response = await fetch(gallery.file);
            if (!response.ok) {
                throw new Error(`Failed to load ${gallery.file}`);
            }
            
            const text = await response.text();
            const urls = text.split('\n')
                            .map(line => line.trim())
                            .filter(line => line.length > 0); // Remove empty lines
            
            // Cache the results
            this.galleryCache[galleryName] = urls;
            console.log(`🖼️ Loaded ${urls.length} images from ${gallery.name}`);
            return urls;
        } catch (error) {
            console.error(`🖼️ Failed to load gallery ${galleryName}:`, error);
            return [];
        }
    }
    
    // Get a random image URL from the specified gallery
    async getRandomImage(galleryName = this.currentGallery) {
        const urls = await this.loadGallery(galleryName);
        if (!urls || urls.length === 0) {
            console.warn('🖼️ Gallery not found or empty:', galleryName);
            return null;
        }
        
        let randomIndex;
        
        // Avoid showing the same image twice in a row if there are multiple images
        if (urls.length > 1) {
            do {
                randomIndex = Math.floor(Math.random() * urls.length);
            } while (randomIndex === this.lastShownIndex);
        } else {
            randomIndex = 0;
        }
        
        this.lastShownIndex = randomIndex;
        const selectedUrl = urls[randomIndex];
        
        console.log('🖼️ Selected random image:', selectedUrl);
        return {
            url: selectedUrl,
            alt: `Image from ${this.galleries[galleryName]?.name || galleryName}`,
            id: selectedUrl.split('/').pop()?.split('.')[0] || 'unknown'
        };
    }
    
    // Create HTML for displaying an image with proper styling
    createImageHTML(image, options = {}) {
        if (!image) return '';
        
        const {
            maxWidth = '300px',
            className = 'gallery-image',
            linkToOriginal = true,
            showCaption = false
        } = options;
        
        const imageElement = `<img src="${image.url}" alt="${image.alt}" class="${className}" style="max-width: ${maxWidth}; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">`;
        
        let html = '';
        if (linkToOriginal) {
            // Determine the correct page URL based on image source
            let pageUrl;
            if (image.pageUrl) {
                // Use provided pageUrl (for GIPHY)
                pageUrl = image.pageUrl;
            } else if (image.url.includes('postimg.cc')) {
                // PostImg page URL
                pageUrl = `https://postimg.cc/${image.id}`;
            } else {
                // Fallback to image URL
                pageUrl = image.url;
            }
            
            html = `<a href="${pageUrl}" target="_blank" style="display: inline-block; text-decoration: none;">${imageElement}</a>`;
        } else {
            html = imageElement;
        }
        
        if (showCaption) {
            html += `<p style="text-align: center; margin-top: 10px; font-size: 14px; color: #666;">${image.alt}</p>`;
        }
        
        return html;
    }
    
    // Insert a random image into a specific DOM element
    async displayRandomImageIn(elementId, options = {}) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn('🖼️ Element not found:', elementId);
            return false;
        }
        
        const image = await this.getRandomImage();
        if (!image) {
            console.warn('🖼️ No image available to display');
            return false;
        }
        
        const imageHTML = this.createImageHTML(image, options);
        element.innerHTML = imageHTML;
        
        console.log('🖼️ Image displayed in element:', elementId);
        return true;
    }
    
    // Create a new div with a random image and return it
    async createRandomImageDiv(options = {}) {
        const image = await this.getRandomImage();
        if (!image) return null;
        
        const div = document.createElement('div');
        div.className = 'gallery-container';
        div.style.textAlign = 'center';
        div.style.margin = '20px 0';
        
        const imageHTML = this.createImageHTML(image, options);
        div.innerHTML = imageHTML;
        
        return div;
    }
    
    // Get gallery stats
    async getGalleryInfo() {
        const info = {};
        for (const [name, gallery] of Object.entries(this.galleries)) {
            const urls = await this.loadGallery(name);
            info[name] = {
                name: gallery.name,
                file: gallery.file,
                imageCount: urls.length
            };
        }
        return info;
    }
}

// Initialize gallery system when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 DOM loaded, initializing Gallery System...');
    window.gallerySystem = new GallerySystem();
    console.log('✅ Gallery System ready! Available galleries:', Object.keys(window.gallerySystem.galleries));
    
    // Load and display gallery stats
    try {
        const galleryInfo = await window.gallerySystem.getGalleryInfo();
        console.log('📊 Gallery stats:', galleryInfo);
    } catch (error) {
        console.warn('📊 Could not load gallery stats:', error);
    }
    
    // Auto-load sidebar GIPHY gallery if container exists
    setTimeout(() => {
        const sidebarContainer = document.getElementById('sidebar-giphy-gallery');
        if (sidebarContainer) {
            console.log('🖼️ Loading initial sidebar GIPHY image...');
            loadSidebarGiphyImage();
        }
    }, 500); // Small delay to ensure DOM is fully ready
});

// Sidebar GIPHY Gallery Function - separate from faucet rewards
function loadSidebarGiphyImage() {
    if (window.gallerySystem) {
        const targetElement = document.getElementById('sidebar-giphy-gallery');
        if (targetElement) {
            return window.gallerySystem.displayRandomImageIn('sidebar-giphy-gallery', {
                maxWidth: '100%',
                showCaption: false,
                linkToOriginal: true
            });
        }
    }
    console.warn('🖼️ Sidebar GIPHY gallery container not found');
    return false;
}

// Function for "New GIF" button in sidebar
function loadNewSidebarGif() {
    loadSidebarGiphyImage();
}

// Helper function for easy integration with existing faucet system
function showRandomImageAfterClaim() {
    if (window.gallerySystem) {
        // Try to display in a specific element first
        const targetElement = document.getElementById('claim-reward-image');
        if (targetElement) {
            return window.gallerySystem.displayRandomImageIn('claim-reward-image', {
                maxWidth: '280px',
                showCaption: false,
                linkToOriginal: true
            });
        }
        
        // Otherwise, find the result step and add an image container
        const resultStep = document.getElementById('result-step');
        if (resultStep) {
            // Check if we already have an image container
            let imageContainer = resultStep.querySelector('.claim-reward-image-container');
            if (!imageContainer) {
                // Create container
                imageContainer = document.createElement('div');
                imageContainer.className = 'claim-reward-image-container';
                imageContainer.id = 'claim-reward-image';
                imageContainer.style.textAlign = 'center';
                imageContainer.style.margin = '20px 0';
                
                // Insert after the result display but before action buttons
                const resultDisplay = resultStep.querySelector('.result-display');
                const actionButtons = resultStep.querySelector('[style*="text-align: center; margin: 30px 0;"]');
                
                if (resultDisplay && actionButtons) {
                    resultStep.insertBefore(imageContainer, actionButtons);
                } else {
                    // Fallback: just append it
                    resultStep.appendChild(imageContainer);
                }
            }
            
            return window.gallerySystem.displayRandomImageIn('claim-reward-image', {
                maxWidth: '280px',
                showCaption: false,
                linkToOriginal: true
            });
        }
    }
    
    console.warn('🖼️ Could not show image - gallery system not ready or no suitable container found');
    return false;
}
