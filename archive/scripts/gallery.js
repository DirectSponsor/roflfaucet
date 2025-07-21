// Dynamic Gallery System for ROFLFaucet
// Auto-updates from PostImg Gallery daily

const POSTIMG_GALLERY = {
    galleryUrl: 'https://postimg.cc/gallery/RJrzGL1',
    images: [
        // Fallback images in case fetch fails
        'https://i.postimg.cc/3JBvQqJt/anim-laughing-faucet-1.gif',
        'https://i.postimg.cc/j5nqvQw4/animal-muppet-laughing.gif',
        'https://i.postimg.cc/3RNcjKGv/baby.gif'
    ],
    lastUpdated: null,
    updateInterval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    
    // Fetch gallery page and extract hotlink URLs
    async fetchGalleryImages() {
        try {
            console.log('Gallery: Fetching latest images from PostImg...');
            const response = await fetch(this.galleryUrl);
            const html = await response.text();
            
            // Parse HTML to find hotlink URLs
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Look for direct image URLs (hotlink format)
            const imageUrls = [];
            const links = doc.querySelectorAll('a');
            
            links.forEach(link => {
                const href = link.href;
                // Match PostImg direct image URLs
                if (href && href.match(/https:\/\/i\.postimg\.cc\/[\w\d]+\/(.*\.(gif|jpg|jpeg|png))/i)) {
                    imageUrls.push(href);
                }
            });
            
            // Also check for URLs in text content
            const textContent = doc.body.textContent || '';
            const urlMatches = textContent.match(/https:\/\/i\.postimg\.cc\/[\w\d]+\/[\w\d\-_]+\.(gif|jpg|jpeg|png)/gi);
            if (urlMatches) {
                urlMatches.forEach(url => {
                    if (!imageUrls.includes(url)) {
                        imageUrls.push(url);
                    }
                });
            }
            
            if (imageUrls.length > 0) {
                this.images = imageUrls;
                this.lastUpdated = Date.now();
                console.log(`Gallery: Updated with ${imageUrls.length} images`);
                return true;
            } else {
                console.warn('Gallery: No images found, using fallback list');
                return false;
            }
            
        } catch (error) {
            console.error('Gallery: Failed to fetch images:', error);
            return false;
        }
    },
    
    // Check if we need to update the image list
    async ensureFreshImages() {
        const now = Date.now();
        const needsUpdate = !this.lastUpdated || (now - this.lastUpdated) > this.updateInterval;
        
        if (needsUpdate) {
            await this.fetchGalleryImages();
        }
    },
    
    // Display a random image in the specified container
    async displayRandom(containerId) {
        await this.ensureFreshImages();
        
        const randomIndex = Math.floor(Math.random() * this.images.length);
        const imgElement = document.getElementById(containerId);
        if (imgElement) {
            imgElement.src = this.images[randomIndex];
            console.log(`Gallery: Displaying image ${randomIndex + 1} of ${this.images.length}`);
            console.log(`Gallery: URL: ${this.images[randomIndex]}`);
        }
    },
    
    // Future-ready: Display with priority/weight (for later enhancement)
    async displayWithPriority(containerId, priority = 'normal') {
        // For now, just display random
        // TODO: Implement weighted selection based on priority
        await this.displayRandom(containerId);
    },
    
    // Manual refresh function (for testing)
    async forceRefresh() {
        this.lastUpdated = null;
        return await this.fetchGalleryImages();
    }
};

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const galleryImage = document.getElementById('gallery-image');
    if (galleryImage) {
        POSTIMG_GALLERY.displayRandom('gallery-image');
    }
});

// For debugging: expose gallery refresh function globally
window.refreshGallery = () => POSTIMG_GALLERY.forceRefresh();
