# Clean Wheel Game System Documentation

**Date Created:** July 29, 2025  
**Version:** 2.0 - Clean Integer-Based System  
**File:** `wheel/wheel-clean.js`

## Overview

This is a complete rewrite of the wheel game system using a simplified, integer-based approach that separates game logic from visual mechanics.

## Core Principles

### 1. **Integer-Only System**
- No fractional degrees (no .5 calculations)
- All positions are integers 0-359
- 24 segments × 15 degrees each = 360 degrees exactly

### 2. **Probability-First Selection**
- Select outcome from weighted probability list first
- Then calculate where to spin to achieve that outcome
- No complex angle-to-outcome mapping

### 3. **Simple Position Tracking**
- Track only one number: `currentPosition` (0-359)
- Each spin starts from previous spin's end position
- New page load starts at position 0

## System Architecture

### Segment Mapping
24 segments based on actual wheel image positions from `docs/wheel_segment_positions.txt`:

```javascript
// Each segment covers exactly 15 degrees
{ segment: 0, startDegree: 248, endDegree: 262, outcome: '4X' },    // Center: 255°
{ segment: 1, startDegree: 233, endDegree: 247, outcome: '5X' },    // Center: 240°
// ... etc for all 24 segments
```

### Probability Distribution
Compressed probability list with correct game percentages:
- **LOSE:** 84% (302 entries) - segments 4, 11, 14, 18, 22
- **2X:** 5% (18 entries) - segments 2, 5, 8, 16, 23  
- **3X:** 4% (14 entries) - segments 3, 7, 13, 19
- **4X:** 2% (7 entries) - segments 0, 6, 20
- **5X:** 3% (11 entries) - segments 1, 10, 15
- **6X:** 1 entry - segment 9
- **REFUND:** 1 entry - segment 17
- **20X:** 1 entry - segment 12
- **50X:** 1 entry - segment 21

**Total:** 356 entries (shuffled for randomness)

## CSS Conflict Issue

While implementing the clean wheel system logic, a conflict arose between the JavaScript and CSS controls of the rotation. This caused inconsistent behavior due to both styles attempting to manage the `transform` property.

**Solution: Only use JavaScript control for transformations, removing CSS dependence.**

## Game Flow

### 1. Spin Initiation
```javascript
async spinWheel() {
    // Validate bet, deduct from balance
    // Start spin process
}
```

### 2. Outcome Selection
```javascript
// Pick random index from probability list
const randomIndex = Math.floor(Math.random() * this.probabilityList.length);
const selectedSegment = this.probabilityList[randomIndex];
const segmentInfo = this.segmentRanges[selectedSegment];
```

### 3. Target Calculation
```javascript
// Pick random degree within selected segment (15-degree range)
let targetDegree = Math.floor(Math.random() * 15) + segmentInfo.startDegree;

// Handle wrap-around for segments crossing 0°
if (targetDegree > 359) {
    targetDegree = targetDegree - 360;
}
```

### 4. Spin Distance Calculation
```javascript
// Always spin forward (clockwise)
let spinDistance = targetDegree - this.currentPosition;
if (spinDistance <= 0) {
    spinDistance += 360; // Handle wrap-around
}

// Add extra rotations for visual effect (3-6 full spins)
const extraRotations = 3 + Math.floor(Math.random() * 4);
const totalSpin = spinDistance + (extraRotations * 360);
```

### 5. Animation & Result Processing
```javascript
// Animate wheel with total spin amount
this.animateWheel(totalSpin);

// Update position for next spin
this.currentPosition = targetDegree;

// Process winnings after animation completes
setTimeout(() => this.processResult(segmentInfo), 3000);
```

## Key Advantages

### ✅ **Deterministic Results**
- Outcome is selected first, then wheel spins to match
- No discrepancy between visual and actual results
- Guaranteed probability distribution

### ✅ **Simple Math**
- Only integer arithmetic
- No complex angle calculations
- No segment-to-outcome mapping confusion

### ✅ **Position Persistence**  
- Each spin continues from previous position
- No arbitrary resets or drift
- Maintains visual continuity

### ✅ **Forward-Only Spinning**
- Always spins clockwise (natural direction)
- Minimum 3 full rotations for visual appeal
- No backwards or minimal spins

## Technical Implementation

### Files
- **Main Script:** `wheel/wheel-clean.js`
- **HTML Integration:** `wheel.html` (uses `wheel-clean.js`)
- **Documentation:** `wheel/CLEAN_WHEEL_SYSTEM_DOCS.md`

### Dependencies
- `window.unifiedBalance` - For balance management
- Standard DOM methods - For wheel animation
- CSS transforms - For smooth wheel rotation

### Global Functions
```javascript
function increaseBet() - Increase bet amount
function decreaseBet() - Decrease bet amount  
function spinWheel() - Trigger wheel spin
```

### Console Logging
Detailed logging for debugging:
```
=== CLEAN WHEEL SPIN ===
Current position: 0 degrees
Random index: 289/356
Selected segment: 13 (3X)
Segment range: 53-67 degrees
Target degree: 57
Spin distance: 57 degrees
Extra rotations: 4 (1440 degrees)
Total spin: 1497 degrees
✅ Spin complete! Landed at 57° (3X)
```

## Migration Notes

### From Previous System
- **Removed:** Complex angle targeting logic
- **Removed:** Arrow position calculations  
- **Removed:** Segment drift detection
- **Simplified:** Single position tracking variable
- **Added:** Probability-first selection method

### Backward Compatibility
- Same HTML structure and CSS classes
- Same global function names
- Same balance integration points
- Drop-in replacement for previous system

## Testing Validation

### Expected Behavior
1. **Visual-Logic Alignment:** What player sees matches actual outcome
2. **Probability Distribution:** Long-term results match configured percentages
3. **Position Continuity:** Each spin starts where previous ended
4. **Forward Spinning:** Always clockwise rotation with multiple full turns

### Debug Commands
```javascript
// Check current position
window.cleanWheelGame.currentPosition

// View probability list
window.cleanWheelGame.probabilityList

// View segment mappings  
window.cleanWheelGame.segmentRanges
```

## Future Enhancements

### Potential Improvements
- Dynamic probability adjustment
- Configurable rotation counts
- Sound effects integration
- Animation speed controls
- Mobile-optimized touch controls

### Maintenance Notes
- Segment mappings based on actual wheel image
- Probability percentages easily adjustable
- All calculations use integers only
- No external dependencies beyond balance system

---

**Status:** ✅ Production Ready  
**Last Updated:** July 29, 2025  
**Next Review:** When wheel image changes or probability adjustments needed
