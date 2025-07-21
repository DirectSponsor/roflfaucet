# ROFLFaucet Technical Implementation Guide

## Quick Resume Checklist
When resuming development, start here:

1. **Verify Environment**: `cd /home/andy/Documents/websites/Warp/projects/rofl/roflfaucet/`
2. **Check Current State**: Review `PROJECT_STATUS.md` for latest context
3. **Priority Task**: Set up image hosting for ad system
4. **Next Feature**: Implement laughing animation integration

## Image Hosting Solution Options

### Option 1: Local Project Assets (Recommended for Development)
```bash
# Create images directory structure
mkdir -p assets/images/ads
mkdir -p assets/images/animations
```

### Option 2: External CDN Integration
- Use free image hosting services (Imgur, Unsplash API, etc.)
- Implement image URL validation for DDNS deployment
- Add fallback images for offline/failed loads

### Option 3: Relative Path Fix
Current problematic path:
```
/home/andy/Documents/websites/-%20archived_sites/directsponsor/...
```
Should be relative to web root:
```
./assets/images/sample-ad.jpg
```

## Animation Integration Plan

### 1. Animation File Structure
```
assets/
├── animations/
│   ├── laughing-animals/
│   │   ├── cat-laugh.gif
│   │   ├── dog-laugh.gif
│   │   └── monkey-laugh.gif
│   └── cartoon-characters/
│       ├── character1.gif
│       └── character2.gif
```

### 2. JavaScript Implementation
```javascript
// Add to slots.js
const laughingAnimations = [
    './assets/animations/laughing-animals/cat-laugh.gif',
    './assets/animations/laughing-animals/dog-laugh.gif',
    './assets/animations/cartoon-characters/character1.gif'
    // ... more animations
];

function getRandomLaughingAnimation() {
    const randomIndex = Math.floor(Math.random() * laughingAnimations.length);
    return laughingAnimations[randomIndex];
}

function displayLaughingAnimation() {
    const animationElement = document.getElementById('laughing-animation');
    if (animationElement) {
        animationElement.src = getRandomLaughingAnimation();
        animationElement.style.display = 'block';
        // Hide after animation duration
        setTimeout(() => {
            animationElement.style.display = 'none';
        }, 3000); // 3 seconds
    }
}
```

### 3. HTML Structure Addition
```html
<!-- Add to appropriate location in index.html -->
<div id="animation-container" class="animation-container">
    <img id="laughing-animation" class="laughing-animation" style="display: none;" alt="Laughing animation">
</div>
```

### 4. CSS Styling
```css
.animation-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    pointer-events: none;
}

.laughing-animation {
    max-width: 200px;
    max-height: 200px;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

@media (max-width: 768px) {
    .laughing-animation {
        max-width: 150px;
        max-height: 150px;
    }
}
```

## Ad System Implementation

### Current Sidebar Integration Points
```css
/* In slots.css */
.sidebar {
    width: 25%; /* Standard 300px ad size */
    /* ... existing styles ... */
}
```

### Dynamic Ad Loading
```javascript
const adSources = [
    './assets/images/ads/ad1.jpg',
    './assets/images/ads/ad2.jpg',
    './assets/images/ads/ad3.jpg'
];

function loadRandomAd(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        const randomAd = adSources[Math.floor(Math.random() * adSources.length)];
        container.innerHTML = `<img src="${randomAd}" alt="Advertisement" style="width: 100%; height: auto;">`;
    }
}

// Call on page load and periodically
document.addEventListener('DOMContentLoaded', () => {
    loadRandomAd('left-sidebar');
    loadRandomAd('right-sidebar');
    
    // Rotate ads every 30 seconds
    setInterval(() => {
        loadRandomAd('left-sidebar');
        loadRandomAd('right-sidebar');
    }, 30000);
});
```

## Responsive Design Current State

### Key Breakpoints (Already Implemented)
- **320px**: iPhone SE and small mobile
- **480px**: Mobile landscape
- **768px**: Tablet portrait
- **1024px**: Desktop/laptop
- **1200px+**: Large desktop

### Reel Sizing Logic (Already Working)
```javascript
// In slots.js - calculateResponsiveDimensions()
const viewportWidth = window.innerWidth;
let reelWidth;

if (viewportWidth <= 480) {
    reelWidth = Math.max(60, viewportWidth * 0.18); // Min 60px
} else if (viewportWidth <= 768) {
    reelWidth = Math.max(80, viewportWidth * 0.15);
} else {
    reelWidth = Math.min(110, viewportWidth * 0.1); // Max 110px
}
```

## Testing Commands

### Local Development Server
```bash
# If using Python
python3 -m http.server 8000

# Or using Node.js
npx serve .

# Or using PHP
php -S localhost:8000
```

### Responsive Testing Tools
```bash
# Launch Firefox with responsive mode
firefox --new-window http://localhost:8000

# Use gruler for pixel measurements
gruler &
```

## Debugging DDNS Image Issues

### Check File Permissions
```bash
ls -la /home/andy/Documents/websites/-%20archived_sites/directsponsor/
```

### Test Web Server Configuration
```bash
# Check what web server is running
ps aux | grep -E "(apache|nginx|lighttpd)"

# Test direct file access
curl -I http://satoshihost.ddns.net/path/to/test/image.jpg
```

### Alternative Image Paths to Test
```
# Relative to web root
./assets/images/test.jpg

# Absolute from server root
/var/www/html/images/test.jpg

# Within project directory
/home/andy/Documents/websites/Warp/projects/rofl/roflfaucet/assets/images/test.jpg
```

## File Locations Quick Reference
- **Main HTML**: `index.html`
- **Game Logic**: `slots/slots.js`
- **Styles**: `slots/slots.css`
- **Project Root**: `/home/andy/Documents/websites/Warp/projects/rofl/roflfaucet/`
- **DDNS URL**: `http://satoshihost.ddns.net`

---
*Ready to implement image hosting and animation features upon resume*
