# Wheel Architecture - Separated Approach

## Problem
The original wheel implementation was causing layout warnings on page refresh: "Layout was forced before the page was fully loaded. If stylesheets are not yet loaded this may cause a flash of unstyled content."

This happened because:
1. JavaScript was accessing DOM elements and layout properties before CSS was fully loaded
2. The wheel code was inherited from slots and contained unnecessary 3D transforms
3. Layout calculations were happening during page initialization

## Solution: Separation of Concerns

We separated the wheel functionality into distinct, focused files to eliminate layout issues and reduce complexity.

### File Structure

```
wheel/
├── wheel-logic.js      # Pure calculations and game logic
├── wheel-animation.js  # DOM manipulation and visual effects
├── wheel-controller.js # Connects logic with animation
└── wheel-simple.html   # Clean HTML (to be created)
```

### 1. wheel-logic.js
**Purpose**: Pure mathematical calculations, no DOM access
**Responsibilities**:
- Implement the 9-step wheel calculation process
- Segment mapping (24 segments, 15° each)
- Outcome determination
- Payout calculations
- State management (current position)

**Key Methods**:
- `calculateSpin()` - Executes steps 1-5, 7-9 of the wheel process
- `createSegmentMap()` - Maps degrees to outcomes
- `calculatePayout()` - Determines winnings
- `getStatus()` - Returns current state

**Benefits**:
- No layout calculations
- Can be tested independently
- No timing dependencies

### 2. wheel-animation.js
**Purpose**: Visual effects and DOM manipulation only
**Responsibilities**:
- Rotate wheel image by given degrees (step 6)
- Update UI elements (bet, balance, results)
- Visual effects (win/lose/jackpot glows)
- Wait for DOM/CSS readiness

**Key Methods**:
- `animateRotation(degrees)` - Just spins wheel by X degrees
- `showResult()` - Updates UI with outcome
- `init()` - Waits for DOM/CSS before initializing

**Benefits**:
- Simple: just rotates by whatever number given
- No position knowledge needed
- Proper timing controls

### 3. wheel-controller.js
**Purpose**: Orchestrate logic and animation
**Responsibilities**:
- Initialize both systems when ready
- Coordinate between logic and animation
- Provide global functions for HTML buttons
- Handle timing and error cases

**Key Functions**:
- `spinWheel()` - Calls logic.calculateSpin() then animation.animateRotation()
- `increaseBet()`, `decreaseBet()` - Betting controls
- Test functions for debugging

## The 9-Step Process Implementation

1. **Get initial position** - wheel-logic.js tracks currentPosition
2. **Generate random 0-359°** - wheel-logic.js Math.random()
3. **Add to initial position** - wheel-logic.js calculation
4. **Add 1-5 full rotations** - wheel-logic.js calculation  
5. **Total spin degrees calculated** - wheel-logic.js returns totalSpinDegrees
6. **Animate wheel rotation** - wheel-animation.js animateRotation(totalSpinDegrees)
7. **Modulo 360 to get final position** - wheel-logic.js calculation
8. **Look up outcome in segment map** - wheel-logic.js segmentMap lookup
9. **Update currentPosition for next spin** - wheel-logic.js state update

## Benefits of This Approach

1. **No Layout Issues**: Animation waits for DOM/CSS readiness
2. **Simple Components**: Each file has one clear responsibility
3. **Easy Testing**: Logic can be tested without DOM
4. **No Context Loss**: Focused, simple code reduces AI context issues
5. **Clean Separation**: Animation never needs to know positions/outcomes

## Key Insight
The animation file doesn't need to know where the wheel is or what the outcome will be - it just spins forward by the number of degrees it's told to spin. This eliminates the need for complex state synchronization between visual and logical components.
