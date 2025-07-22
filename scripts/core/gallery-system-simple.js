// Super Simple Gallery System
// Just picks random lines from text files and inserts them
console.log('🖼️ Simple Gallery System loading...');

class SimpleGallery {
    constructor() {
        this.galleries = {
            postimg: 'postimg_gallery.txt',
            giphy: 'giphy_gallery.txt', 
            vgy: 'vgy_gallery.txt'
        };
        this.currentGallery = 'giphy';
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
    
    // Pick random line from gallery
    async getRandomLine(galleryName = this.currentGallery) {
        const lines = await this.loadLines(galleryName);
        if (!lines || lines.length === 0) {
            return null;
        }
        
        const randomIndex = Math.floor(Math.random() * lines.length);
        const selectedLine = lines[randomIndex];
        
        console.log('🖼️ Selected random line:', selectedLine);
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
        
        // Add gallery-specific CSS class to img tag (let CSS handle all sizing)
        let styledLine = randomLine;
        if (randomLine.includes('<img')) {
            const galleryClass = `gallery-${this.currentGallery}`;
            styledLine = randomLine.replace(
                /<img([^>]*)>/,
                `<img$1 class="${galleryClass}"`
            );
        }
        
        element.innerHTML = styledLine;
        console.log('🖼️ Line inserted into:', elementId);
        return true;
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Initializing Simple Gallery...');
    window.simpleGallery = new SimpleGallery();
    
    setTimeout(() => {
        // Find all containers with data-gallery attribute
        const galleryContainers = document.querySelectorAll('[data-gallery]');
        
        galleryContainers.forEach(async (container) => {
            const galleryType = container.getAttribute('data-gallery');
            const elementId = container.id;
            
            if (galleryType && elementId) {
                console.log(`🎯 Loading ${galleryType} gallery into #${elementId}`);
                window.simpleGallery.currentGallery = galleryType;
                await window.simpleGallery.displayRandomLineIn(elementId);
            }
        });
    }, 500);
});

console.log('✅ Simple Gallery System ready!');
