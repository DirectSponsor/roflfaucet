starts with 40 then +20 for next level, so if you do well in 1 you have more shots.


# Coin Bag Shooter - Game Design Specification

## Project Overview

A bubble shooter-style game for a charity website where players shoot colored balls at hanging coin bags. Matched bags fall and award points that convert to coins for charity allocation. Designed for low-resource environments (3rd world users with limited bandwidth and older devices).

## Core Gameplay Mechanics

### Grid Layout
- **Dimensions**: 11 columns wide × 9 rows tall (initial)
- **Pattern**: Hexagonal offset (odd rows: 11 bags, even rows: 10 bags offset by 0.5)
- **Maximum capacity**: ~100 bags on screen at game start
- **Bag placement**: Bags appear to hang on invisible hooks
- **Grid behavior**: NO time pressure - grid does NOT descend automatically
- **Row addition**: New rows added at top when existing rows are cleared (skill-based progression, not time-based)

### Game Elements

#### Shooting Projectiles
- **Visual**: Colored balls/cannonballs (smooth, shiny spheres)
- **Colors**: 4 colors at Level 1, increasing with difficulty (up to 7 colors)
- **Size**: 32-48px diameter
- **Behavior**: Travel in straight lines, bounce off walls, stick to grid as bags

#### Target Bags
- **Visual**: Bulging coin bags with drawstring tops
- **Texture**: Burlap-style with fullness indicated by bulge
- **Colors**: Match ball colors exactly
- **Size**: Fit hexagonal grid spacing

#### Special Bags (appear randomly in grid)
- **Bomb Bag**: Clears 2-3 bags radius in all directions (icon overlay)
- **Row Clear Bag**: Eliminates entire horizontal row AND all rows below it (arrow icon overlay)
- Hit these bags to activate their effects
- **Frequency**: Appear occasionally in the grid as game progresses

### Shooting Mechanism

#### Launcher Setup
- **Cannon**: Bottom center, pointing upward
- **Current ball**: Visible in cannon, ready to fire
- **Next ball preview**: Visible in tube/chute beside cannon
- **Transition animation**: When shot fired, next ball rolls smoothly into cannon (~0.3s)

#### Aiming System
- **Desktop**: Mouse position (X-axis only, Y-position ignored)
- **Mobile**: 
  - Drag anywhere on screen to aim
  - Small dead zone (20-30px) prevents accidental shots
  - Must drag minimum distance to arm
  - Release after dragging = shoots immediately
- **Trajectory preview**: Dotted/dashed line with gradient fade
  - Shows path including wall bounces
  - Line color matches current ball color
  - Updates in real-time as aim changes

#### Trajectory Visibility (by difficulty level)
- **Level 1**: Fades from 220px to 180px from bottom (60% of 500px height)
- **Level 2**: 50% of screen height
- **Level 3+**: 40% of screen height
- **Fade logic**: Based on vertical Y-position, not path length traveled

#### Shooting Action
- **Desktop**: Click anywhere to shoot
- **Mobile**: Release drag gesture to shoot
- **Visual feedback**: 
  - Cannon glows/pulses when armed
  - Trajectory line becomes solid when ready
- **Re-aiming**: Immediate after shot (even while previous ball traveling)

### Matching & Falling Logic

#### Match Detection
- Match 3+ adjacent bags of same color
- Check after each ball sticks to grid
- Process special bags within matched groups

#### Ball Behavior When Fired
- **Hits matching color**: Sticks and becomes a bag, triggers match check
- **Hits non-matching color**: Sticks and becomes a bag of that color (joins grid)
- **Hits nothing/top**: Becomes bag at top row

#### Falling Animation
When bags are matched:
1. **Jolt effect**: Small upward bump (2-3px) + slight rotation
2. **Brief pause**: 0.1 seconds
3. **Gravity fall**: Natural drop with physics
4. **Visual limit**: Maximum 10 bags animated simultaneously
5. **Actual count**: Display true number in popup ("20 bags! +200 points!")

### Scoring System

#### Points Per Bag
- **Level 1**: 10 points
- **Level 2**: 11 points
- **Level 3**: 12 points
- **Level 4+**: 13, 14, 15... (incremental)

#### Bonus Scoring
- Combo multipliers for large matches (5+ bags)
- Special bag bonuses
- Accuracy bonuses (optional)

#### Points to Coins Conversion
- Points accumulate during game session (in-memory)
- **"Collect" button**: Converts points → coins at preset rate
- Conversion rate configurable (e.g., 100 points = 10 coins)
- Display shows: "Collect 450 points = 45 coins"
- **Server sync**: Only occurs when Collect button pressed
- Failed sync: Retry mechanism, store locally until successful

### Shot Management

#### Shot Limits
- **Level 1**: 40 shots to start
- **Level progression**: +20 shots for next level if you complete current level successfully
- Display clearly: "Shots: 25" or "25 shots remaining"
- Visual warning when low (< 5 shots remaining) - orange/red color
- **Bonus shots**: Award for large combos (e.g., 5+ bags matched = +2 shots)
- **Reward system**: Doing well = more shots for next level (skill-based progression)

#### Game Over Conditions
- No shots remaining
- Grid fills completely (bags reach bottom)
- Board cleared (success state)

### Power-ups

#### Shooter Power-ups (ball itself has ability)
- **Bomb Ball**: Clears 2-3 bags radius in all directions on impact
- **Row Clear Ball**: Eliminates entire horizontal row and all rows below it
- **Acquisition**: Appear randomly in the cannon (replacing normal ball)
- **Visual**: Special icon/effect on ball in cannon to indicate power-up type
- **Frequency**: Occasional appearance to help player progress

#### Grid Special Bags (already covered above)
- Bomb bags and row clear bags appearing in grid
- Hit them to activate
- Same effects as shooter power-ups but triggered by hitting them in the grid

### Level Progression

#### Opt-in Difficulty System
- Player **chooses** when to level up (not forced)
- **Prompt after completing level**: 
  - "Level 2 unlocked!"
  - Show incentive: "Level 2: 11 points per bag (vs 10 on Level 1)"
  - Options: [Level Up] or [Stay on Level 1]
- Players can practice at comfortable difficulty
- Skilled players can progress immediately

#### Difficulty Increases by Level
- **Number of colors**: 4 → 5 → 6 → 7
- **Points per bag**: 10 → 11 → 12 → 13...
- **Trajectory visibility**: 60% → 50% → 40%
- **Special bag frequency**: Could increase
- **Grid complexity**: Could add more rows at higher levels

## Visual Design

### Asset Requirements

#### Sprites Needed
- Colored balls (4-7 variations): 32-48px, smooth spheres, shiny finish
- Colored coin bags (4-7 variations): Bulging burlap texture, drawstring top
- Special bag icons: Bomb symbol, row-clear arrows (overlay on bags)
- Cannon graphic: Simple tube/barrel pointing upward
- Tube/chute graphic: Angled pipe for next ball
- Background: Minimal, non-distracting

#### Total Asset Size Target
- All sprites combined: < 50KB
- Optimized PNGs with compression
- Minimal animation frames

### Animation List

#### Essential Animations
- **Ball launch**: Smooth constant-speed travel
- **Ball roll**: Next → Current transition (0.3s)
- **Bag jolt**: 2-3px upward + slight rotation (0.1s)
- **Bag fall**: Gravity-based natural drop
- **Trajectory line**: Real-time drawing with fade

#### Optional Polish Animations
- Match highlight: Brief glow/pulse before bags fall
- Cannon ready pulse: Indicates armed state
- Collect button: Satisfying coin collection effect
- Score popup: Brief number display when bags collected

### UI Elements

#### HUD Components
- **Shot counter**: Top right or near cannon
- **Points display**: Updates in real-time during play
- **Level indicator**: Current level number
- **Collect button**: Prominent, shows point→coin conversion
- **Help button**: ? icon, opens tutorial overlay

#### Overlays/Modals
- **Tutorial/Help**: 
  - Dismissible overlay
  - Instructions: "Drag to aim, release to shoot", "Match 3+ same color"
  - Show on first play, can reopen via ? button
  - Store "seen" state in localStorage
- **Level Up prompt**: Modal with choice to progress or stay
- **Game Over screen**: Final score, shots used, [Collect] button
- **Pause menu**: Resume/Quit options

### Color Scheme
- Vibrant colors for balls/bags (red, blue, green, yellow, orange, purple, pink)
- Clear visual distinction between colors
- Maintain readability on various screen qualities
- Special bags: Distinct icon overlays (not just color)

## Technical Implementation

### Canvas Rendering

#### Performance Requirements
- Target: 60fps on modern devices
- Graceful degradation on older/slower devices
- Efficient redraw strategy (only changed elements)
- Sprite-based rendering for all game objects

#### Optimization Strategies
- Limit simultaneous falling animations (max 10 bags)
- Use requestAnimationFrame with delta time
- Minimal particle effects
- Simple collision detection (grid-based, not pixel-perfect)
- No heavy physics libraries

### Game State Management

#### In-Memory During Play
- Current grid state (bag positions, colors, types)
- Active animations queue
- Current/next ball colors
- Points accumulated this session
- Shots remaining
- Power-ups available

#### Local Storage (persistent)
- Current level unlocked
- High scores (optional)
- Tutorial seen flag
- User preferences (sound on/off, etc.)
- Pending coin collection (if server sync failed)

#### Server Sync
- **Only on "Collect" action**
- Send: Points earned, conversion rate, resulting coins
- Receive: Confirmation, updated total balance
- Retry mechanism on failure
- Store locally until successful sync

### Mobile Optimization

#### Touch Controls
- Touch-friendly hit areas (minimum 44×44px)
- Drag-to-aim with dead zone
- Clear visual feedback for all interactions
- No precision touching required

#### Responsive Design
- Canvas scales to screen size
- Maintain aspect ratio
- UI elements scale proportionally
- Test on various screen sizes (320px to 1920px wide)

#### Performance Considerations
- Limit animations on lower-end devices
- Reduce particle effects if needed
- Monitor frame rate, adjust quality dynamically

### Code Structure Suggestions

#### Main Game Loop
```
1. Handle input (mouse/touch position)
2. Update game state
   - Ball position if in flight
   - Falling bag physics
   - Animation timers
3. Check collisions
4. Detect matches
5. Update score
6. Render frame
```

#### Key Components
- **GridManager**: Handles bag positions, match detection
- **BallShooter**: Manages aiming, trajectory, launching
- **AnimationQueue**: Limits and manages falling animations
- **ScoreManager**: Tracks points, handles collection
- **UIController**: HUD, overlays, buttons

### Asset Loading
- Preload all sprites before game start
- Show loading indicator
- Fallback graphics if assets fail to load
- Cache in browser for subsequent plays

## Game Flow States

### 1. Menu/Start Screen
- Level selection (if multiple levels unlocked)
- Start button
- Help/Tutorial access
- Display current coin balance (optional)

### 2. Active Gameplay
- Player aiming and shooting
- Bags falling, animations playing
- Score incrementing
- Shot counter decreasing

### 3. Paused
- Overlay with Resume/Quit buttons
- Game state frozen
- Accessible via pause button or mobile app switching

### 4. Game Over
- Display final score
- Show shots used
- Prominent "Collect" button if points > 0
- Options: Collect & Exit, Play Again (forfeit points)

### 5. Level Up Prompt
- Modal overlay with choice
- Show current vs next level stats
- [Level Up] [Stay] buttons
- Can be declined, prompt returns after next completion

### 6. Collecting Points
- Show conversion: "450 points = 45 coins"
- Loading indicator during server sync
- Success: Confirmation message
- Failure: "Sync failed, will retry" with manual retry button

## Edge Cases & Solutions

### Gameplay Edge Cases

**Grid fills completely**
- Solution: Game over, award points for bags knocked down

**No valid matches possible**
- Solution: Game over (or optional: shuffle grid, costs shots)

**Shot misses all bags**
- Solution: Ball sticks at top row, becomes new bag

**Special bag matches with regular bags**
- Solution: Process both effects (match points + special ability)

**Multiple matches from one shot (chain reaction)**
- Solution: Process sequentially, award combo multiplier

### Technical Edge Cases

**Network failure during collect**
- Solution: Store points locally, show "pending" indicator, retry on next attempt

**Browser tab loses focus mid-game**
- Solution: Auto-pause game, resume when tab regains focus

**LocalStorage full/unavailable**
- Solution: Graceful degradation, game still playable without saving progress

**Canvas not supported**
- Solution: Show message: "Please use a modern browser" (unlikely in 2024+)

**Very slow device**
- Solution: Reduce animation quality, lower frame rate target, disable particles

## Integration with Existing Site

### Authentication
- Use existing site auth system
- User must be logged in to earn coins
- Guest play possible but no coin earning

### Server API Endpoints Needed
- `POST /games/coin-shooter/collect` - Convert points to coins
- `GET /games/coin-shooter/stats` - Retrieve user's progress (optional)
- `POST /games/coin-shooter/level-up` - Record level progression (optional)

### UI Consistency
- Match site's color scheme for UI elements (buttons, text)
- Use site's fonts and styling
- Consistent header/navigation if game embedded in page

### Charity Allocation Flow
- After collecting coins, link to charity allocation page
- Or show balance increment: "You now have 145 coins to allocate"
- Outside of game scope, but provide clear next step

## Configuration & Tuning

### Adjustable Parameters
- Points per bag per level
- Shot count per round
- Bonus shot threshold
- Power-up frequency
- Special bag spawn rate
- Points to coins conversion rate
- Trajectory fade distances by level
- Number of colors by level

### A/B Testing Opportunities
- Starting difficulty (4 vs 5 colors)
- Shot counts (25 vs 30 vs 35)
- Point values (addictiveness vs fairness)
- Level up prompt timing

## Launch Checklist

### Testing Requirements
- [ ] Test on low-end devices (Africa testers)
- [ ] Test on slow/expensive mobile data
- [ ] Test on various screen sizes (320px - 1920px)
- [ ] Verify server sync reliability
- [ ] Test offline → online recovery
- [ ] Confirm localStorage limits
- [ ] Verify mobile touch controls
- [ ] Test battery drain on extended play
- [ ] Accessibility check (color blind modes?)

### Performance Targets
- < 50KB total asset size
- < 5 second load time on 3G connection
- Steady 30fps minimum on low-end devices
- < 5% battery drain per 10 minutes play (mobile)
- Works on devices from 2015+

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Future Enhancement Ideas

*(Not for initial launch)*

- Daily challenges with special rewards
- Leaderboards (if competitive element desired)
- Sound effects and music (optional, toggleable)
- More power-up types (color bomb, wild ball, etc.)
- Seasonal themes (visual only, not gameplay)
- Multiplayer mode (probably too complex)
- Achievement system
- Streak bonuses for daily play

## Notes & Reminders

- **Priority**: Performance over visual flair (for target audience)
- **Philosophy**: Fun and accessible, not competitive or punishing
- **Monetization**: None - this is for charity engagement
- **Cheating prevention**: Not critical since coins only allocate charity revenue
- **User feedback**: Collect via existing site feedback mechanisms
- **Iteration**: Plan to adjust based on real-world usage data

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Implementation Platform**: Windsurf + Claude Sonnet 4.5  
**Target Completion**: TBD
