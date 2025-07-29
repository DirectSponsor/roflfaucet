# TODO: Optimize Slots Game with Embedded Outcomes

## Current Issue
The slots game currently uses large arrays in memory for reel symbols, which can be resource-heavy on users' devices.

## Proposed Solution: Embedded Comment Lines Approach
Similar to what we implemented for the wheel game, use embedded comments in the JavaScript file instead of arrays.

### Option 1: Single Shared Symbol List (Simpler)
If all 3 reels can use the same symbol distribution:

```javascript
/*
SLOT_SYMBOLS - Count: 40
CHERRY
CHERRY
LEMON
LEMON
BAR
...
SYMBOLS_END
*/
```

Then pick 3 random line numbers from the same list for each reel.

### Option 2: Three Separate Reel Lists (More Control)
If reels need different odds/symbols:

```javascript
/*
REEL1_SYMBOLS - Count: 40
CHERRY
CHERRY
...
REEL1_END

REEL2_SYMBOLS - Count: 40  
CHERRY
ORANGE
...
REEL2_END

REEL3_SYMBOLS - Count: 40
CHERRY
BAR
...
REEL3_END
*/
```

## Benefits
- **Memory efficient**: No large arrays loaded into memory
- **Device friendly**: Better for accessibility and low-end devices
- **Easy to modify**: Just edit the comment lines to change odds
- **Same performance**: Pick random line numbers instead of array indexes

## Implementation
Use the same `fetchRandomOutcome()` pattern from wheel.js but adapted for slots reels.

## Decision Needed
- Can all 3 reels use identical symbol distributions? (Option 1 is simpler)
- Or do we need different odds per reel? (Option 2 gives more control)
