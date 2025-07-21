# Line-Based Gallery System

## 🎯 **CURRENT IMPLEMENTATION**

The ROFLFaucet now uses a simplified line-based gallery system that makes image management incredibly easy and flexible.

## ✅ **How It Works**

### **Simple Text Files**
- Each image host has its own text file (one URL per line)
- `postimg_gallery.txt` - PostImg hosted images
- `giphy_gallery.txt` - GIPHY hosted images
- Easy to add new hosts by creating new `.txt` files

### **Random Selection Process**
1. **Load file** - Script fetches the text file for the selected gallery
2. **Count lines** - Automatically counts how many URLs are available
3. **Pick random line** - Generates random number from 1 to line count
4. **Display image** - Shows the selected URL as an image

### **Display Strategy**
- **One image per host displayed at a time** on the page
- Multiple URLs available per host for variety
- Each page load/refresh shows different random selections
- Clean, uncluttered display with content rotation

## 🛠️ **File Structure**

```
roflfaucet/
├── postimg_gallery.txt          # PostImg URLs (16 images)
├── giphy_gallery.txt            # GIPHY URLs (17 images)
├── vgy_gallery.txt              # VGY.me URLs (19 images)
├── scripts/core/gallery-system.js  # Simplified JavaScript handler
└── docs/
    ├── LINE_BASED_GALLERY_SYSTEM.md  # This document
    └── IMAGE_AUTO_DISCOVERY.md       # Previous system (reference)
```

## 📝 **Content Management**

### **Adding Images**
```bash
# Add new PostImg image
echo "https://i.postimg.cc/NEW_IMAGE_ID/new-funny.gif" >> postimg_gallery.txt

# Add new GIPHY image  
echo "https://media.giphy.com/media/NEW_GIF_ID/giphy.gif" >> giphy_gallery.txt
```

### **Replacing Images**
```bash
# Edit any line in the file to replace that specific image
nano postimg_gallery.txt
nano giphy_gallery.txt
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

```javascript
// Gallery configuration in gallery-system.js
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
    // Easy to add more hosts here
};
```

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

---

*This system replaces the previous complex auto-discovery approach documented in `IMAGE_AUTO_DISCOVERY.md`*
