# Wheel of Wealth Game Documentation

## Project Overview
ROFLFaucet Wheel of Wealth game - a casino-style spinning wheel game that matches the visual consistency of the existing slots game while providing slightly favorable odds to players (101-102% return rate).

## Current Implementation Status

### ✅ Completed
- **Visual Design**: Wheel game now matches slots game container styling
  - Same dark blue-grey gradient outer container
  - Same dark semi-transparent inner container with rounded corners
  - Consistent with slots visual theme
- **File Structure**: Proper organization following slots pattern
  - `wheel.html` - Main game page (processed by build system)
  - `wheel/wheel.css` - Game-specific styles
  - `wheel/wheel.js` - Game logic (needs work)
  - `wheel/images/wofbase.png` - Original wheel image (512x512, 24 segments)
  - `wheel/images/arrow.png` - Pointer arrow
- **Build Integration**: Uses same build system as slots
  - Site-wide header, footer, sidebars injected via build.sh
  - Proper includes for unified balance system and core scripts

### 🔨 Current Issues to Fix
1. **Spinning Logic Broken**: 
   - Currently spins clockwise, stops, then spins backward
   - Always lands on same position
   - Need to implement proper random landing logic

2. **Visual Segment Mapping**:
   - Current segment positions don't match actual wheel.txt positions
   - Need to update `segmentPositions` to match your wheel.txt layout
   - Wheel starts at arrow (9 o'clock position)

3. **Code Still Uses External File**:
   - Current code still tries to fetch 'wheel/outcomes.txt'
   - Need to update `getSpinResult()` to use embedded outcomes list instead
   - Embedded list already added to top of wheel.js file

## Desired Implementation Approach

### Wheel Mechanics (Following Slots Pattern)
- **Virtual Segments List**: Create expanded list of outcomes (not limited to 24 visual segments)
- **Weighted Random Selection**: Each outcome has probability weight
- **Visual Mapping**: Map selected outcome to nearest visual segment for animation
- **Simple Client-Side**: All logic client-side like slots (no server dependency)

### Proposed Segment Structure
```javascript
const wheelOutcomes = [
    // LOSE outcomes (most common)
    {result: 'LOSE', multiplier: 0, weight: 45},
    {result: 'LOSE', multiplier: 0, weight: 45},
    // ... more LOSE entries for proper odds
    
    // Small wins
    {result: '2X', multiplier: 2, weight: 25},
    {result: '3X', multiplier: 3, weight: 15},
    {result: '4X', multiplier: 4, weight: 10},
    {result: '5X', multiplier: 5, weight: 8},
    
    // Medium wins
    {result: 'SUPER 8', multiplier: 8, weight: 4},
    {result: 'LUCKY 20', multiplier: 20, weight: 2},
    
    // Rare jackpot
    {result: 'JACKPOT', multiplier: 100, weight: 1}
];
```

### Target Odds Calculation
- **Total Weight**: Sum of all weights = 155
- **Expected Return**: (Sum of multiplier * weight) / total weight = ~1.01-1.02
- **Player Advantage**: Slightly over 100% for faucet game appeal

## Technical Requirements

### Animation System
1. **Spin Duration**: 3-4 seconds realistic spin
2. **Easing**: Smooth deceleration curve
3. **Visual Feedback**: Map outcome to closest visual segment
4. **Result Display**: Show winning segment clearly

### Integration Points
- **Unified Balance System**: `scripts/core/unified-balance.js`
- **Site Utils**: `scripts/core/site-utils.js`
- **Build System**: Processed by `build.sh` like other pages

## File Locations
```
/home/andy/warp/projects/roflfaucet/
├── wheel.html                    # Main page (build processed)
├── wheel/
│   ├── wheel.css                # Game styles (updated to match slots)
│   ├── wheel.js                 # Game logic (needs major revision)
│   ├── WHEEL_GAME_DOCS.md       # This documentation
│   └── images/
│       ├── wofbase.png          # Original wheel image (24 segments)
│       └── arrow.png            # Pointer arrow
```

## Next Steps Priority
1. **Fix Spinning Animation**: Implement proper one-direction spin with correct landing
2. **Implement Weighted Outcome System**: Replace current logic with slots-style random selection
3. **Calculate Proper Odds**: Design outcome weights for 101-102% return rate
4. **Test Balance Integration**: Ensure proper coin deduction/addition
5. **Visual Polish**: Ensure winner highlighting works correctly

## Original Wheel Image Analysis
- **File**: `wheel/images/wofbase.png`
- **Size**: 512x512 pixels
- **Segments**: 24 total segments visible
- **Content**: Mix of LOSE, multipliers (2X, 3X, 4X, 5X), SUPER 8, LUCKY 20, JACKPOT
- **Usage**: Visual reference only - actual outcomes determined by weighted list

## Slots Game Reference
The slots game provides the perfect template:
- Simple weighted random selection from symbol list
- Client-side payout calculation
- Smooth visual feedback
- Integrated balance management
- Similar container styling (now matched)

## Slots Game Analysis (Reference Implementation)

### How Slots Random Selection Works
```javascript
// Slots uses separate virtual lists for each reel (43 entries each)
const virtualReelList1 = [
    0, 0, 0,           // Watermelon (position 0) - 3 entries
    2, 2, 2, 2, 2,     // Banana (position 2) - 5 entries  
    4, 4, 4, 4,        // Cherries (position 4) - 4 entries
    // ... more entries
];

// Random selection:
const randomIndex = Math.floor(Math.random() * currentList.length);
const position = currentList[randomIndex];
```

### Key Slots Principles
1. **Virtual Lists**: Much longer than physical symbols (43 vs 10)
2. **Weighted Selection**: Duplicate entries create probability weights
3. **Simple Random**: `Math.floor(Math.random() * list.length)`
4. **Position Mapping**: Virtual position maps to physical sprite position
5. **Client-Side**: All logic runs in browser, no server calls

## Proposed Wheel Implementation

### Step 1: Create Weighted Outcome List
```javascript
const wheelOutcomes = [
    // LOSE outcomes (most common) - 50 entries
    ...Array(50).fill({segment: 'LOSE', multiplier: 0}),
    
    // Small wins - 35 entries total
    ...Array(20).fill({segment: '2X', multiplier: 2}),
    ...Array(10).fill({segment: '3X', multiplier: 3}),
    ...Array(5).fill({segment: '4X', multiplier: 4}),
    
    // Medium wins - 10 entries total  
    ...Array(6).fill({segment: '5X', multiplier: 5}),
    ...Array(3).fill({segment: 'SUPER 8', multiplier: 8}),
    ...Array(1).fill({segment: 'LUCKY 20', multiplier: 20}),
    
    // Jackpot - very rare
    ...Array(1).fill({segment: 'JACKPOT', multiplier: 100})
];
// Total: 96 entries, Expected return: ~101.2%
```

### Step 2: Visual Segment Mapping
```javascript
// Map outcome names to approximate wheel positions (degrees)
const segmentPositions = {
    'LOSE': [0, 30, 60, 120, 150, 210, 240, 300, 330], // Multiple LOSE segments
    '2X': [15, 195], 
    '3X': [45, 225],
    '4X': [75, 255],
    '5X': [105, 285],
    'SUPER 8': [135],
    'LUCKY 20': [165],
    'JACKPOT': [315]
};
```

### Step 2.5: Embedded Outcomes List
The outcomes list is now embedded within the `wheel.js` file as a comment block:
```
/*
OUTCOMES_START - Total: 100
LOSE
... // Over 90 LOSE outcomes
2X
2X
2X
2X
2X
3X
3X
3X
4X
4X
5X
5X
5X
6X
REFUND
20X
50X
OUTCOMES_END
*/

This is used for random selection in the client-side, eliminating the need for an external file.

### Step 3: Fix Spinning Logic
```javascript
function getSpinResult() {
    // Simple random selection like slots
    const randomIndex = Math.floor(Math.random() * wheelOutcomes.length);
    const outcome = wheelOutcomes[randomIndex];
    
    // Pick random visual position for this outcome type
    const positions = segmentPositions[outcome.segment];
    const randomPos = positions[Math.floor(Math.random() * positions.length)];
    
    return {
        outcome: outcome,
        visualAngle: randomPos,
        winAmount: currentBet * outcome.multiplier
    };
}

function animateWheelSpin(targetAngle) {
    // Multiple rotations + target position
    const spins = 3 + Math.random() * 2; // 3-5 full rotations
    const finalAngle = (spins * 360) + targetAngle;
    
    // Single smooth animation (no backward spinning)
    wheelImage.style.transform = `rotate(${finalAngle}deg)`;
}
```

### Step 4: Odds Calculation
- **Total Entries**: 96
- **LOSE**: 50/96 = 52.1%
- **Wins**: 46/96 = 47.9% 
- **Expected Return**: (Sum of all multiplier × count) / 96 ≈ 101.2%
- **House Edge**: -1.2% (player favorable)

## Current Issues in wheel.js
1. **Line 121**: `finalAngle = result.segment.angle + (rotations * 360)` - Uses fixed segment angles
2. **Line 188**: CSS animation approach causes backward spin
3. **Lines 141-170**: Complex probability system instead of simple weighted list
4. **Line 184**: Animation waits full duration, doesn't map to visual properly

## Implementation Priority
1. **Replace getSpinResult()** with simple weighted array selection
2. **Fix animateWheelSpin()** to use single forward rotation
3. **Add visual segment mapping** for realistic wheel landing
4. **Test balance integration** with existing UnifiedBalance system
5. **Verify 101-102% return rate** through simulation

## Session Continuity Notes
- Visual styling completed and matches slots
- Core file structure in place
- Original wheel images copied and integrated
- **CRITICAL**: Current wheel.js has backwards spinning bug and fixed segment system
- **NEXT**: Implement slots-style weighted selection with 101% return rate
- All changes are CSS/JS only - no rebuilds needed for testing

## Current Status (2025-07-28 - Session End)

### ✅ Recently Completed
1. **Embedded Outcomes List**: Added 100-line outcomes list to top of `wheel.js` as comment block
   - Format: `OUTCOMES_START` to `OUTCOMES_END` markers
   - Distribution: ~90 LOSE, multiple 2X/3X/4X/5X, single 6X/REFUND/20X/50X
   - Using `this.constructor.toString()` to parse embedded list

2. **Fixed Spin Delays**: Removed both progress bar and animation waiting
   - Removed 3-second progress bar simulation loop
   - Removed `await` from `animateWheelSpin()` call
   - Results show immediately while wheel spins in background

3. **Fixed Wheel Reset**: Each spin now starts from 0° for consistent animation
   - Resets to 0° with no transition
   - Then applies full 3-5 rotation spin every time
   - No more "barely moving" on subsequent spins

### ❌ Current Broken Issues (After git restore)
1. **Visual/Outcome Mismatch**: 
   - Wheel lands on segments that don't match the actual outcome
   - Visual angle calculation not working correctly
   - Segment positions may be wrong degrees

2. **Unified Balance System Disconnected**:
   - Code references `window.UnifiedBalance` (old system)
   - Should be `window.unifiedBalance` (new unified system)
   - Balance updates not working
   - No proper async/await for balance operations

3. **Missing Integration**: Lost previous work on:
   - Proper balance deduction/addition
   - JWT integration references
   - Error handling improvements

### 🚨 Critical Fixes Needed
1. **Fix Balance System Integration**:
   ```javascript
   // WRONG (current):
   window.UnifiedBalance.deductBalance(this.currentBet);
   
   // CORRECT (needed):
   await window.unifiedBalance.subtractBalance(this.currentBet, 'wheel_bet', `Wheel bet: ${this.currentBet}`);
   ```

2. **Fix Visual Landing**:
   - Debug why wheel visual doesn't match outcome
   - Check if segment positions in degrees are correct
   - Verify angle calculation in `getVisualAngle()`

3. **Update Balance References Throughout**:
   - Change all `UnifiedBalance` → `unifiedBalance`
   - Add proper async/await for balance operations
   - Use correct method names (subtractBalance, addBalance, getBalance)

### Key Insights (Preserved)
- **Virtual vs Physical**: Outcomes list doesn't need to match wheel proportions
- **Odds Control**: Frequency in outcomes list controls probability, not visual wheel
- **Visual Mapping**: Physical wheel is just cosmetic - outcomes map to nearest matching segment
- **Client-Side**: No server calls needed - all logic in browser like slots game
- **Delay Fix**: Animation runs in parallel, results show immediately

### Context Preservation Notes
- **What We Lost**: git restore overwrote months of balance system integration work
- **What We Kept**: HTML file still has all improvements (no progress bar elements)
- **Current State**: Embedded outcomes work, delays fixed, but balance system broken
- **Next Session Priority**: Fix unified balance integration first, then visual landing
