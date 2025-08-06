# Line-Based Gallery System

## 🎯 **CURRENT IMPLEMENTATION (Updated 2025-07-21)**

The ROFLFaucet uses a unified, declarative line-based gallery system that makes image management incredibly easy and flexible.

## ✅ **How It Works**

### **Unified Single Script System**
- **One script controls everything**: `gallery-system-simple.js`
- **No page detection**: Uses declarative HTML data attributes
- **No duplicate scripts**: Removed all conflicting gallery systems
- **Automatic discovery**: Finds containers via `data-gallery` attributes

### **Simple Text Files (HTML Format)**
- Each image host has its own text file (one complete HTML tag per line)
- `postimg_gallery.txt` - PostImg hosted images with attribution links
- `giphy_gallery.txt` - GIPHY hosted images with attribution links
- `vgy_gallery.txt` - VGY.me hosted images with attribution links
- Easy to add new hosts by creating new `.txt` files

### **Declarative Container System**
```html
<!-- Index page uses VGY gallery -->
<div id="gallery-image" data-gallery="vgy"><!-- Auto-populated --></div>

<!-- Faucet result page uses PostImg gallery -->
<div id="gallery-image" data-gallery="postimg"><!-- Auto-populated --></div>

<!-- All sidebars use GIPHY gallery -->
<div id="sidebar-giphy-gallery" data-gallery="giphy"><!-- Auto-populated --></div>
```

### **Random Selection Process**
1. **Find containers** - Script searches for all `[data-gallery]` elements
2. **Load files** - Fetches the appropriate text file for each gallery type
3. **Parse lines** - Splits file content into individual HTML lines
4. **Pick random line** - Generates random number from available lines
5. **Insert HTML** - Places the complete HTML tag into the container

### **Display Strategy**
- **Page-specific galleries**: Different galleries per page type
- **Multiple containers**: Sidebars + main content areas
- **Random refresh**: Each page load shows different random selections
- **Clean attribution**: All images include proper source links

## 🛠️ **File Structure**

```
roflfaucet/
├── postimg_gallery.txt                    # PostImg complete HTML tags (16 images)
├── giphy_gallery.txt                      # GIPHY complete HTML tags (17 images)
├── vgy_gallery.txt                        # VGY.me complete HTML tags (19 images)
├── scripts/core/gallery-system-simple.js  # Unified gallery handler
├── includes/
│   ├── right-sidebar.html                 # Contains data-gallery="giphy"
│   └── header.html                        # Loads gallery script globally
└── docs/
    ├── LINE_BASED_GALLERY_SYSTEM.md       # This document
    └── IMAGE_AUTO_DISCOVERY.md            # Previous system (reference)
```

## 📝 **Content Management**

### **File Format Requirements**
All gallery files must contain **complete HTML tags** (not just URLs):

```html
<!-- PostImg format (with attribution links) -->
<a href="https://postimg.cc/JGcDCrHD" target="_blank"><img src="https://i.postimg.cc/JGcDCrHD/animal-muppet-laughing.gif" alt="animal-muppet-laughing"/></a>

<!-- GIPHY format (with attribution links) -->
<a href="https://giphy.com/gifs/VEeh928onskB4H7QzU" target="_blank"><img src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExYXAxZ2htanNpaWNwd2tueGQ1ZmR0emR0OXh4ZmN4aGsxNm0xdDhnYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/VEeh928onskB4H7QzU/giphy.gif" alt="gif-1"/></a>

<!-- VGY format (with attribution links) -->
<a href="https://vgy.me/u/wdeyZd"><img src="https://i.vgy.me/wdeyZd.png" alt="wdeyZd.png"/></a>
```

### **Adding Images**
```bash
# Add new PostImg image (complete HTML tag)
echo '<a href="https://postimg.cc/NEW_ID" target="_blank"><img src="https://i.postimg.cc/NEW_ID/new-funny.gif" alt="new-funny"/></a>' >> postimg_gallery.txt

# Add new GIPHY image (complete HTML tag)
echo '<a href="https://giphy.com/gifs/NEW_ID" target="_blank"><img src="https://media.giphy.com/media/NEW_ID/giphy.gif" alt="gif-new"/></a>' >> giphy_gallery.txt

# Add new VGY image (complete HTML tag)
echo '<a href="https://vgy.me/u/NEW_ID"><img src="https://i.vgy.me/NEW_ID.png" alt="NEW_ID.png"/></a>' >> vgy_gallery.txt
```

### **Replacing Images**
```bash
# Edit any line in the file to replace that specific image
nano postimg_gallery.txt
nano giphy_gallery.txt
nano vgy_gallery.txt
```

### **Removing Images**
- Simply delete the line from the text file
- Script automatically adapts to new line count

## 🚀 **Key Benefits**

### **Maximum Simplicity**
- No complex JavaScript objects or metadata
- No line number ranges to maintain in code
- Just plain text files with URLs

### **Easy Updates**
- Edit text files directly - no code changes needed
- Add/remove images instantly
- Test different images by swapping lines

### **Flexible Expansion**
- Add new image hosts by creating new `.txt` files
- Add gallery to JavaScript config
- No architectural changes needed

## 🔧 **JavaScript Integration**

### **Simplified Configuration**
```javascript
// Current implementation in gallery-system-simple.js
class SimpleGallery {
    constructor() {
        this.galleries = {
            postimg: 'postimg_gallery.txt',
            giphy: 'giphy_gallery.txt', 
            vgy: 'vgy_gallery.txt'
        };
    }
}

// Automatic discovery via data attributes
document.addEventListener('DOMContentLoaded', async () => {
    const galleryContainers = document.querySelectorAll('[data-gallery]');
    
    galleryContainers.forEach(async (container) => {
        const galleryType = container.getAttribute('data-gallery');
        const elementId = container.id;
        
        if (galleryType && elementId) {
            window.simpleGallery.currentGallery = galleryType;
            await window.simpleGallery.displayRandomLineIn(elementId);
        }
    });
});

// Gallery-specific CSS class injection
displayRandomLineIn(elementId) {
    // Add gallery-specific CSS class to img tag
    if (randomLine.includes('<img')) {
        const galleryClass = `gallery-${this.currentGallery}`;
        styledLine = randomLine.replace(
            /<img([^>]*)>/,
            `<img$1 class="${galleryClass}"`
        );
    }
}
```

### **CSS Class System & Sizing Strategy**

The system automatically adds **gallery-specific CSS classes** to images for flexible styling:

```css
/* Base styling for all gallery images */
.gallery-postimg, .gallery-vgy, .gallery-giphy {
    height: auto;
    display: block;
    margin: 0 auto;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

/* PostImg & VGY - Main content areas (450px max) */
.gallery-postimg, .gallery-vgy {
    max-width: 450px;
    width: 100%;
}

/* GIPHY - Sidebars (100% of container) */
.gallery-giphy {
    max-width: 100%;
    width: auto;
}

/* Responsive scaling */
@media (max-width: 768px) {
    .gallery-postimg, .gallery-vgy { max-width: 300px; }
}
@media (max-width: 480px) {
    .gallery-postimg, .gallery-vgy { max-width: 250px; }
}
```

**Generated Classes:**
- VGY images → `class="gallery-vgy"`
- PostImg images → `class="gallery-postimg"`
- GIPHY images → `class="gallery-giphy"`

### **Page Assignment Strategy**
- **Index page** (`index.html`) → **VGY gallery** (`data-gallery="vgy"`)
- **Faucet result page** (`faucet-result.html`) → **PostImg gallery** (`data-gallery="postimg"`)
- **All sidebars** → **GIPHY gallery** (`data-gallery="giphy"`)
- **Other pages** → **PostImg gallery** (default)

## 📊 **Current Content**

- **PostImg**: 16 laughing/funny themed animations
- **GIPHY**: 17 laughing GIFs from various sources
- **VGY.me**: 19 mixed funny images and GIFs
- **Total**: 52 images across 3 hosts
- **Display**: Multiple images shown from different hosts for variety

## 🎯 **Future: Ad Rotation Integration**

This line-based approach will extend to ad rotation system with:

### **Ad Slot Priority System**
- **Importance ranking** (1-100) determines page placement:
  - 80-100: Header/top slots (high visibility)
  - 40-79: Sidebar slots (medium visibility)  
  - 1-39: Footer slots (low visibility)

- **Frequency controls** (1-100) determine rotation speed:
  - High frequency: Every 30 seconds
  - Medium frequency: Every 60 seconds
  - Low frequency: Every 120 seconds

### **Text File Structure**
```
ads/
├── high_importance_ads.txt     # Importance 80-100
├── medium_importance_ads.txt   # Importance 40-79
├── low_importance_ads.txt      # Importance 1-39
└── test_ads.txt               # Your own test content
```

### **Ad Entry Format**
```html
<!-- Simple HTML per line -->
<a href="https://advertiser.com"><img src="https://banner.jpg" alt="Ad"></a>

<!-- Or with metadata (pipe-separated) -->
https://banner.jpg|https://advertiser.com|Client Name|85|75
```

### **JavaScript Integration**
```javascript
this.adSlots = {
    header: {
        file: 'high_importance_ads.txt',
        importance: '80-100',
        frequency: 30000  // 30 seconds
    },
    sidebar: {
        file: 'medium_importance_ads.txt', 
        importance: '40-79',
        frequency: 60000  // 60 seconds
    },
    footer: {
        file: 'low_importance_ads.txt',
        importance: '1-39',
        frequency: 120000  // 120 seconds
    }
};
```

### **Benefits**
- **Same simplicity** as image gallery system
- **Easy testing** with your own placeholder ads
- **Gradual scaling** - start with few slots, expand later
- **No complex database** needed initially
- **Quick updates** by editing text files directly

## 📋 **Recent Improvements (2025-07-21)**

### **✅ Major Updates Completed Today**

**1. Unified Script System**
- ✅ **Consolidated all gallery scripts** into single `gallery-system-simple.js`
- ✅ **Removed conflicting scripts** (`gallery-postimg-RJrzGL1.js`)
- ✅ **Fixed header template** script reference
- ✅ **Applied via build system** to all pages

**2. Declarative Container System**
- ✅ **Replaced page detection** with `data-gallery` attributes
- ✅ **Updated index page** container: `data-gallery="vgy"`
- ✅ **Updated faucet result page** container: `data-gallery="postimg"`
- ✅ **Updated sidebar template** container: `data-gallery="giphy"`
- ✅ **Applied via build system** to all pages

**3. VGY Gallery Format Fix**
- ✅ **Converted raw URLs** to complete HTML tags with links
- ✅ **Added attribution links** following VGY.me format
- ✅ **Maintained alt text** for accessibility
- ✅ **Fixed display issues** on index page

**4. Index Page Layout Improvements**
- ✅ **Removed duplicate heading** (🚰 roflfaucet)
- ✅ **Centered content** to match other faucet pages
- ✅ **Added gallery image** at top of content container
- ✅ **Removed test content** (PostImg URL comparison section)
- ✅ **Improved visual hierarchy** and spacing

**5. Build System Integration**
- ✅ **Updated header include** template
- ✅ **Updated sidebar include** templates
- ✅ **Rebuilt all pages** to apply changes
- ✅ **Verified script references** across all pages

**6. Gallery-Specific CSS Class System**
- ✅ **Added automatic CSS class injection** (`gallery-vgy`, `gallery-postimg`, `gallery-giphy`)
- ✅ **Created flexible sizing rules** based on gallery type and placement
- ✅ **Fixed VGY image sizing** (was showing at full original size)
- ✅ **Maintained responsive scaling** for mobile devices
- ✅ **Separated concerns** - JavaScript handles logic, CSS handles presentation

### **🎯 Current Gallery Assignment**
- **Index page**: VGY gallery (19 images)
- **Faucet result page**: PostImg gallery (16 images)
- **All page sidebars**: GIPHY gallery (17 images)
- **Total**: 52 images across 3 different hosts

### **🚀 System Benefits Achieved**
- **Single source of truth**: One script handles all galleries
- **Declarative approach**: HTML tells script what to do
- **No page detection**: More reliable than URL-based logic
- **Easy maintenance**: Add containers anywhere with `data-gallery`
- **Clean separation**: Each page type gets unique image set

---

*This system replaces the previous complex auto-discovery approach documented in `IMAGE_AUTO_DISCOVERY.md`*
