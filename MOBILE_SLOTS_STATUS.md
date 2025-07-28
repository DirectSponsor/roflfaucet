# Slots Implementation - Current Architecture

## Overview
This document describes the current unified slots architecture with two presentation layers sharing a common game engine.

## Unified Architecture

### File Structure
- **slots.html** - Main web slots page (loads slots-minimal.html in iframe)
- **slots-minimal.html** - Web-optimized standalone slots implementation
- **slots-mobile.html** - Mobile-optimized version using shared component
- **includes/components/slot-machine.html** - Shared component (used by mobile)
- **slots/slots.css** - Main slots styling (shared between both versions)
- **slots/slots.js** - **UNIFIED** core slot machine JavaScript logic
- **mobile-layout.css** - Mobile-specific CSS overrides

### Architecture Benefits

#### ✅ **Unified Game Engine**
- **Single Source of Truth**: All game logic, symbols, payouts, and probabilities defined in `slots/slots.js`
- **Consistent Gameplay**: Both versions use identical game mechanics and rules
- **Easy Updates**: Change symbols, payouts, or game rules once - affects both versions
- **Maintainable Code**: No duplication of core game logic

#### ✅ **Optimized Presentation Layers**
- **Mobile Version** (`slots-mobile.html`): Uses shared component, mobile-optimized responsive system
- **Web Version** (`slots-minimal.html`): Standalone implementation with iframe support, custom responsive scaling
- **Flexible UI**: Each version can optimize for its specific use case and context
- **Separation of Concerns**: Game logic separated from presentation, following best practices

#### ✅ **Current Implementation Status**
- **Mobile Version**: Uses inline two-row table layout (already working)
- **Web Version**: Updated to match mobile's integrated button layout
- **Both Versions**: Now have consistent control panel design with integrated action buttons
- **JavaScript**: Single unified file shared between both implementations

### Key Features Implemented

#### 1. Responsive Scaling System
- **JavaScript Override**: The mobile page includes a JavaScript override that replaces the default responsive calculation
- **Breakpoints**:
  - `420px+`: Default 120px reel size
  - `350px-420px`: Reduced to 100px reels
  - `Below 350px`: Reduced to 80px reels
- **Scaling Factor**: Uses `reelWidth / 120` as base for scaling all UI elements

#### 2. Control Panel Enhancements
- **Two-row Table Layout**: 
  - First row: WIN, COINS, BET, arrow buttons, SPIN button
  - Second row: Payouts button (colspan 2), Faucet button (colspan 3)
- **Natural Table Sizing**: Removed artificial min/max width constraints to allow natural table behavior
- **Integrated Design**: Action buttons now part of the main control table instead of separate elements

#### 3. Mobile Optimizations
- **Sidebar Management**: Sidebars hidden on mobile (`display: none`)
- **Block Layout**: Container uses `display: block` instead of flex to allow JavaScript scaling
- **Centered Content**: All elements centered within available space
- **Progressive Scaling**: Control panel, fonts, and buttons scale proportionally with reel size

### Current Performance
- **Minimum Width**: Scales down to approximately **290px** before breaking
- **Responsive Range**: Works well from 290px to full desktop widths
- **Natural Behavior**: Table scales smoothly without artificial constraints

### CSS Architecture

#### Main Container Structure
```css
.container {
    display: block !important;  /* Allows JS scaling */
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
}
```

#### Reels Container
```css
.sprite-reels-container {
    display: flex;
    justify-content: center;
    gap: var(--reel-gap, 15px);
    width: fit-content;
    /* Scales with JavaScript CSS custom properties */
}
```

#### Control Panel
```css
.control-panel {
    width: fit-content;  /* Natural table sizing */
    max-width: 100%;
    margin: 0 auto;
    /* No artificial width constraints */
}
```

### JavaScript Scaling Logic
The mobile page overrides `slotMachine.calculateResponsiveDimensions()` with:

1. **Viewport Detection**: Determines appropriate reel size based on width
2. **CSS Custom Properties**: Updates `--reel-width`, `--reel-height`, etc.
3. **Element Scaling**: Applies scale factor to fonts, buttons, heights
4. **Proportional Scaling**: All elements scale together maintaining usability

### Issues Resolved
- ✅ Fixed table width matching with reels container
- ✅ Removed CSS min-width constraints preventing scaling
- ✅ Integrated action buttons into main control table
- ✅ Achieved 290px minimum width (covers all real devices)
- ✅ Natural table behavior without artificial overrides

### Abandoned Approaches
- **Unified Container**: Attempted to put control panel inside reels container but caused layout complexity
- **Fixed Table Layout**: Tried `table-layout: fixed` but caused button overflow
- **CSS !important Overrides**: Avoided complex override chains in favor of natural behavior

### Current State Summary
The unified slots architecture is in a **stable, working state** with:

#### ✅ **Game Engine (Unified)**
- Single `slots/slots.js` file powers both versions
- Consistent symbols, payouts, and probabilities across all platforms
- Easy maintenance - change game mechanics once, affects both versions

#### ✅ **Presentation Layers (Optimized)**
- **Mobile**: Responsive down to 290px width with shared component architecture
- **Web**: Iframe-embeddable with custom responsive scaling and standalone operation
- **Both**: Integrated two-row control panel design with natural table behavior

#### ✅ **Technical Benefits**
- Clean separation of concerns (game logic vs presentation)
- No code duplication in core game mechanics
- Flexible UI optimization for different contexts
- Proper scaling of all UI elements without CSS conflicts

#### ✅ **Maintenance Strategy**
- **Game Changes**: Edit only `slots/slots.js` (affects both versions)
- **UI Changes**: Edit individual HTML files as needed (mobile vs web specific)
- **Styling Changes**: Shared CSS in `slots/slots.css`, overrides in specific files

The system successfully achieves the optimal balance: **unified where it matters (game logic), separated only where necessary (presentation)**.
