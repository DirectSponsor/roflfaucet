# Site Utilities Documentation

**Created:** July 25, 2025  
**Version:** 2.0  
**Status:** ✅ Implemented  
**File:** `scripts/core/site-utils.js`

## 🎯 Overview

The Site Utilities system provides centralized management for site-wide functionality including faucet countdown buttons, color theming, and progress indicators. This system ensures consistency across all pages and provides a single source of truth for common behaviors.

## 🎨 Centralized Color Management

### **FAUCET_COLORS Configuration**

All faucet-related colors are managed through a single configuration object:

```javascript
const FAUCET_COLORS = {
    primary: '#3CE74C',        // Main green color
    secondary: '#2DD93C',      // Darker green for gradients
    ready: 'linear-gradient(90deg, #3CE74C 0%, #2DD93C 50%, #3CE74C 100%)',
    progress: '#3CE74C',       // Progress fill color
    disabled: '#95a5a6'        // Gray for disabled states
};
```

### **What Gets Updated Automatically**

When you change colors in `FAUCET_COLORS`, it automatically affects:

- ✅ **Faucet countdown buttons** (`faucet-countdown-btn`, `faucet-countdown-btn-back`)
- ✅ **Start claim buttons** (`start-claim-btn`)
- ✅ **Slot machine progress bars** (`progress-fill`, `progress-fill-back`)
- ✅ **Faucet progress indicators** (`faucet-progress-fill`)
- ✅ **All button progress gradients**

### **How to Change Site Colors**

To update all green colors across the site:

1. **Edit `scripts/core/site-utils.js`**
2. **Modify the `FAUCET_COLORS` object**
3. **Save the file** - changes take effect immediately

```javascript
// Example: Change to blue theme
const FAUCET_COLORS = {
    primary: '#3498db',        // Blue
    secondary: '#2980b9',      // Darker blue
    ready: 'linear-gradient(90deg, #3498db 0%, #2980b9 50%, #3498db 100%)',
    progress: '#3498db',
    disabled: '#95a5a6'
};
```

## ⏱️ Faucet Countdown System

### **Core Functions**

#### **`getRemainingCooldownTime()`**
```javascript
// Returns remaining cooldown time in milliseconds
const remaining = getRemainingCooldownTime();
if (remaining === 0) {
    // Faucet is ready to claim
}
```

#### **`canClaim()`**
```javascript
// Returns boolean - whether faucet can be claimed
if (canClaim()) {
    // Show claim button as active
}
```

#### **`updateFaucetCountdownButton()`**
- Updates all faucet-related UI elements
- Called automatically every second
- Handles button states, progress bars, and text

#### **`startFaucetCountdown()`**
- Initializes countdown system
- Sets up automatic updates
- Called on page load

### **Supported Elements**

The system automatically manages these element IDs:

#### **Faucet Countdown Buttons**
- `faucet-countdown-btn` - Main faucet button
- `faucet-countdown-btn-back` - Back panel version
- Requires `.btn-text` span for text content

#### **Start Claim Buttons**
- `start-claim-btn` - Main claim process button
- Direct text content (no span needed)

#### **Progress Indicators**
- `faucet-progress-indicator` / `faucet-progress-indicator-back`
- `faucet-progress-fill` / `faucet-progress-fill-back`

#### **Slot Machine Progress Bars**
- `progress-fill` - Main slot machine progress bar
- `progress-fill-back` - Back panel version

## 🔧 Button States

### **Ready State** (Cooldown = 0)
```javascript
// Button becomes:
btn.disabled = false;
btn.classList.add('ready');
btnText.textContent = 'Faucet: Ready';
btn.style.background = FAUCET_COLORS.ready;

// Progress bars become:
progressBar.style.width = '100%';
progressBar.style.background = FAUCET_COLORS.ready;
```

### **Countdown State** (Cooldown > 0)
```javascript
// Button becomes:
btn.disabled = true;
btn.classList.remove('ready');
btnText.textContent = `Faucet: ${seconds}s`;
btn.style.background = `linear-gradient(to right, ${FAUCET_COLORS.progress} ${percent}%, ${FAUCET_COLORS.disabled} ${percent}%)`;

// Progress bars become:
progressBar.style.width = `${percent}%`;
```

## 📊 Progress Calculation

### **Time-based Progress**
```javascript
const totalCooldown = 5 * 60 * 1000; // 5 minutes
const elapsed = totalCooldown - remaining;
const progressPercent = (elapsed / totalCooldown) * 100;
```

### **Visual Progress Effects**
- **Buttons:** Green gradient fills from left to right
- **Progress bars:** Width increases as time progresses
- **Ready state:** Full green gradient/100% width

## 🎮 Integration with Games

### **Slot Machine Integration**
The slots page (`slots-minimal.html`) automatically gets:
- Synchronized progress bars
- Consistent button styling
- Real-time countdown updates

### **Adding New Games**
To add faucet integration to new game pages:

1. **Include the script:**
```html
<script src="scripts/core/site-utils.js"></script>
```

2. **Add faucet button with correct ID:**
```html
<button id="faucet-countdown-btn" class="faucet-countdown-btn" onclick="handleFaucetClaim()">
    <span class="btn-text">Faucet: 300</span>
</button>
```

3. **Add progress bar (optional):**
```html
<div id="progress-indicator">
    <div id="progress-fill"></div>
</div>
```

4. **The system handles the rest automatically!**

## 🛠️ Maintenance

### **Adding New Color Properties**
```javascript
const FAUCET_COLORS = {
    primary: '#3CE74C',
    secondary: '#2DD93C',
    ready: 'linear-gradient(90deg, #3CE74C 0%, #2DD93C 50%, #3CE74C 100%)',
    progress: '#3CE74C',
    disabled: '#95a5a6',
    // Add new properties here:
    hover: '#4FED5C',      // New hover color
    border: '#2ABB38'      // New border color
};
```

### **Updating Color Usage**
Replace hardcoded colors in the code with `FAUCET_COLORS` references:
```javascript
// Before:
btn.style.background = '#3CE74C';

// After:
btn.style.background = FAUCET_COLORS.primary;
```

## 📱 Cross-Page Consistency

### **Automatic Initialization**
The system automatically starts on any page that has faucet elements:
```javascript
document.addEventListener('DOMContentLoaded', function() {
    const faucetBtn = document.getElementById('faucet-countdown-btn');
    const startClaimBtn = document.getElementById('start-claim-btn');
    if (faucetBtn || startClaimBtn) {
        startFaucetCountdown();
    }
});
```

### **Supported Pages**
- ✅ **Main faucet page** (`index.html`)
- ✅ **Slot machine** (`slots-minimal.html`, `slots-standalone.html`)
- ✅ **Claim process** (`faucet-claim.html`)
- ✅ **Result pages** (`faucet-result.html`)
- ✅ **Any future pages** with faucet elements

## 🎯 Benefits

### **Single Source of Truth**
- ✅ Change colors once, affect entire site
- ✅ Consistent timing across all pages
- ✅ Unified button behavior

### **Developer Experience**
- ✅ Easy to maintain
- ✅ Self-documenting code
- ✅ Automatic initialization

### **User Experience**
- ✅ Consistent visual feedback
- ✅ Synchronized progress indicators
- ✅ Reliable countdown behavior

## 🔮 Future Enhancements

### **Planned Features**
- Theme switching (light/dark modes)
- Custom cooldown durations per game
- Sound effects for state changes
- Animation preferences

### **Extensibility**
The system is designed to easily accommodate:
- Additional color themes
- New button types
- Custom progress indicators
- Enhanced animations

---

## 🚀 Quick Reference

**File Location:** `scripts/core/site-utils.js`  
**Main Color Config:** `FAUCET_COLORS` object  
**Key Function:** `updateFaucetCountdownButton()`  
**Initialization:** Automatic on `DOMContentLoaded`  
**Cooldown Duration:** 5 minutes (300 seconds)  

**Need to change site colors?** → Edit `FAUCET_COLORS` in `site-utils.js`  
**Adding new page?** → Include script + use correct element IDs  
**Custom behavior?** → Extend the `updateFaucetCountdownButton()` function
