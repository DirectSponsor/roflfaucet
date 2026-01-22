# Shooter Game Development Progress

**Date:** December 17, 2024  
**Status:** In Development - Paused  
**Files:** `/site/shooter.html`, `/site/shooter.css`, `/site/shooter.js`

## Project Overview

Bubble shooter-style game where players shoot colored balls at coin bags. Matched bags fall and award points that convert to coins for charity allocation. Designed for low-resource environments.

## Completed Features

### Core Gameplay
- ✅ **Hexagonal grid system** - 11 columns, 14 total rows, 9 starting rows
- ✅ **Portrait orientation** - 2:3 aspect ratio (taller canvas)
- ✅ **Responsive design** - Scales to container, max 600px width
- ✅ **Ball shooting mechanics** - Click/tap to shoot, wall bounces
- ✅ **Aiming system** - Mouse/touch aim with trajectory preview
- ✅ **Match-3+ detection** - Flood-fill algorithm for color matching
- ✅ **Falling animations** - Gravity-based bag drops with physics

### Visual Design
- ✅ **Grid proportions** - Balloons fill ~50% of screen height
- ✅ **Full-width grid** - Bags extend edge-to-edge
- ✅ **Larger balloons** - 27px radius (was 18px)
- ✅ **Grid positioning** - Starts near top, extends down properly
- ✅ **Trajectory line** - 75% visibility, fades based on level
- ✅ **Simple graphics** - Colored circles with shine effect
- ✅ **Power-up indicators** - Emoji overlays (💣 bomb, ⚡ row clear)

### Power-Up System
- ✅ **Bomb balls** - 5% spawn chance in cannon, clears 2.5 radius
- ✅ **Row clear balls** - 5% spawn chance in cannon, clears row + all below
- ✅ **Bomb bags** - 3% spawn in grid, activate on match
- ✅ **Row clear bags** - 3% spawn in grid, activate on match
- ✅ **Visual indicators** - Emojis show power-up type

### Game Mechanics
- ✅ **40 shots per game** - Starts with 40, tracks maxShots
- ✅ **Points system** - 10 points/bag at level 1, increases per level
- ✅ **Level progression** - 4-7 colors based on level
- ✅ **Shot counter** - Visual warning when < 5 shots
- ✅ **Collect button** - Converts points to coins (10:1 ratio)
- ✅ **Game over modal** - Shows final score and shots used
- ✅ **Tutorial overlay** - First-time help, stored in localStorage

### UI Elements
- ✅ **Header stats** - Level, shots, points display
- ✅ **Help button** - Reopens tutorial
- ✅ **Responsive controls** - Desktop (mouse) and mobile (touch)
- ✅ **Game modals** - Tutorial, game over, level up (placeholder)

## Known Issues

### Critical Bugs
- ❌ **Orphan detection over-aggressive** - Dropping bags that should stay
- ❌ **Grid stability issues** - Bags falling incorrectly after matches
- ❌ **Orphan algorithm needs debugging** - May be checking wrong connections

### Issue Details

The `removeOrphans()` function was added to detect bags disconnected from the top row, but it's causing problems:

```javascript
// Location: shooter.js, line ~425
function removeOrphans() {
    // Flood-fill from top row to find connected bags
    // Problem: May be incorrectly identifying orphans
}
```

**Symptoms:**
- Bags falling when they shouldn't
- Grid becoming unstable after clearing matches
- Possible issues with hexagonal neighbor detection

**Potential Causes:**
1. Hexagonal grid neighbor calculation may be wrong for orphan detection
2. Timing issue - orphans checked before grid updates positions
3. Edge cases with even/odd row offsets not handled correctly

## Configuration

### Constants (shooter.js)
```javascript
GRID_COLS: 11
GRID_ROWS: 14
ASPECT_RATIO: 2/3
POWER_UP_CHANCE: 0.05 (5%)
SPECIAL_BAG_CHANCE: 0.03 (3%)
```

### Game State
```javascript
level: 1
shots: 40
maxShots: 40
points: 0
```

### Visual Settings
```javascript
bagRadius: 27 * canvasScale
cannonY: canvas.height - 50 * canvasScale
gridStartY: bagRadius * 0.5
trajectoryFade: 75% (decreases 5% per level)
```

## Reference Implementation

Based on Arkadium's Bubble Shooter at games.greatergood.com:
- 9 starting rows of balloons
- Grid extends to ~300px (~50% of 550-600px height)
- Full-width balloon layout
- Trajectory line extends well into grid
- No time pressure (grid doesn't descend)
- Power-ups in both cannon and grid

## Remaining Work

### High Priority
1. **Fix orphan detection** - Debug why bags are falling incorrectly
2. **Test grid stability** - Ensure bags stay when they should
3. **Verify neighbor calculation** - Check hexagonal offsets are correct

### Medium Priority
4. **Graphics upgrade** - Replace circles with coin bag sprites
5. **Sound effects** - Shoot, match, fall, power-up sounds
6. **Level progression** - Implement level-up system with rewards
7. **Row addition** - Add new rows at top when existing cleared
8. **Bonus shots** - Award extra shots for large combos

### Low Priority
9. **Polish animations** - Smooth transitions, particle effects
10. **Server integration** - Connect collect button to backend
11. **Mobile optimization** - Test on various devices
12. **Accessibility** - Color blind modes, keyboard controls

## Technical Notes

### Grid System
- Uses hexagonal offset pattern
- Even rows: 11 bags, odd rows: 10 bags (offset by bagRadius)
- Neighbors calculated differently for even/odd rows
- Grid positions updated after every change

### Collision Detection
- Simple distance-based (not pixel-perfect)
- Ball sticks when within `bagRadius * 1.8` of existing bag
- Checks all grid positions each frame

### Performance
- RequestAnimationFrame game loop
- Limits falling animations to 10 visible bags
- Canvas clears and redraws each frame
- Scales well on tested devices

## Files Structure

```
/site/
  shooter.html       - Main game page with UI structure
  shooter.css        - Responsive styling, modals, buttons
  shooter.js         - Game logic, rendering, physics
```

## Next Steps When Resuming

1. **Debug orphan detection:**
   - Add console logging to `removeOrphans()`
   - Verify which bags are being marked as orphans
   - Check if `getNeighbors()` works correctly for all positions
   - Test with simple scenarios (clear one bag, check what falls)

2. **Consider simpler approach:**
   - Maybe disable orphan detection temporarily
   - Or use a more conservative algorithm
   - Only drop bags that are CLEARLY disconnected

3. **Add debug visualization:**
   - Draw grid coordinates on bags
   - Highlight connected vs orphaned bags
   - Show neighbor connections

4. **Test systematically:**
   - Clear top row - nothing should fall
   - Clear middle - only disconnected should fall
   - Clear bottom - nothing should fall
   - Test even/odd row differences

## Design Document

Full game design specification: `/coin-bag-shooter.md`

## Notes

- Game is playable but has stability issues
- Core mechanics work well
- Visual proportions match reference game
- Power-up system functional
- Main blocker is orphan detection bug

---

**Resume Point:** Fix `removeOrphans()` function in `shooter.js` around line 425. The algorithm is dropping bags incorrectly. May need to revisit hexagonal neighbor logic or add more conservative checks.
