# Poker Game Design - Traditional & Calm

*Future expansion for ROFLFaucet - When ready to move beyond the optimal 4-game foundation*

## 🎯 **Core Philosophy: Anti-Casino**

**What we DON'T want:**
- ❌ Flashing lights and sensory overload
- ❌ Pressure tactics and urgency timers  
- ❌ Loud sounds and distracting animations
- ❌ Neon colors and Vegas-style chaos
- ❌ Complex multi-table interfaces

**What we DO want:**
- ✅ **Green felt background** - Classic, instantly recognizable
- ✅ **Calm, unhurried pace** - No artificial time pressure
- ✅ **Traditional card designs** - Timeless rather than trendy
- ✅ **Soft, natural colors** - Easy on the eyes
- ✅ **Clean typography** - Readable, professional
- ✅ **Gentle animations** - Smooth, not jarring

## 🃏 **Game Variant: Video Poker (Single Player)**

**Why Video Poker:**
- ✅ **Simple to implement** - No AI opponents or multiplayer complexity
- ✅ **Familiar rules** - Everyone knows poker hands
- ✅ **Quick games** - Perfect for casual play
- ✅ **Mobile friendly** - Works great on touchscreens
- ✅ **Fair odds** - Standard poker probabilities

**Basic Flow:**
1. **Bet** - Choose coin amount (1-20 coins)
2. **Deal** - Receive 5 cards face up
3. **Hold** - Click cards you want to keep
4. **Draw** - Replace unwanted cards  
5. **Evaluate** - Check winning hand, pay out accordingly

## 🎨 **Visual Design**

### Color Palette
```css
/* Calming Green Felt Theme */
--felt-green: #2d5016;          /* Main background */
--felt-light: #4a7c59;          /* Accent green */
--card-white: #f8f6f0;          /* Card background */
--text-gold: #d4af37;           /* Elegant text */
--button-brown: #8b4513;        /* Wooden button look */
--shadow-soft: rgba(0,0,0,0.15); /* Subtle shadows */
```

### Layout
```
┌─────────────────────────────────────┐
│           🃏 Video Poker            │
│                                     │
│  Balance: 150 coins    Bet: 5 coins │
│                                     │
│   🂡  🂢  🂣  🂤  🂥                  │
│  Hold Hold      Hold                │
│                                     │
│         [DEAL/DRAW CARDS]           │
│                                     │
│    Current Hand: Pair of Kings      │
│         Payout: 10 coins            │
└─────────────────────────────────────┘
```

## 🏆 **Payout Table (Standard Jacks or Better)**

| Hand              | Payout (per coin bet) |
|-------------------|-----------------------|
| Royal Flush       | 800x (jackpot!)      |
| Straight Flush    | 50x                  |
| Four of a Kind    | 25x                  |
| Full House        | 9x                   |
| Flush             | 6x                   |
| Straight          | 4x                   |
| Three of a Kind   | 3x                   |
| Two Pair          | 2x                   |
| Jacks or Better   | 1x (break even)      |

## 💡 **UX Features**

### Calm Experience
- **No countdown timers** - Take your time to decide
- **Soft card flip animations** - 300ms gentle transitions
- **Quiet success sounds** - Subtle audio cues (optional)
- **Breathing room** - Generous spacing, not cramped

### Smart Defaults
- **Auto-hold suggestions** - Highlight obvious holds for beginners
- **Undo hold** - Change your mind before drawing
- **Hand evaluation** - Always show what you currently have
- **Strategy hints** - Optional tips for better play

### Mobile Optimized
- **Large touch targets** - Easy to tap cards and buttons
- **Swipe to hold** - Alternative to tapping
- **Portrait layout** - Works great on phone screens
- **Haptic feedback** - Gentle vibration on card selection

## 🔧 **Technical Implementation**

### File Structure
```
poker/
├── poker.html              # Main game page
├── poker.css              # Green felt styling  
├── poker.js               # Game logic
└── cards/                 # Card image assets
    ├── traditional-deck/   # Classic card designs
    └── backs/             # Card back designs
```

### Key Functions
```javascript
// Core game logic
dealCards()           // Initial 5-card deal
evaluateHand()        // Determine poker hand rank
calculatePayout()     // Apply payout table
animateCardFlip()     // Smooth card animations
saveGameState()       // Preserve game across sessions
```

## 🎯 **Integration with ROFLFaucet**

### Balance System
- ✅ **Uses unified balance** - Same coins across all games
- ✅ **Transaction logging** - All bets/wins recorded
- ✅ **Minimum bet: 1 coin** - Accessible to all users
- ✅ **Maximum bet: 20 coins** - Reasonable limit

### UI Integration
- ✅ **Matches site theme** - Consistent with other games
- ✅ **Mobile navigation** - Same hamburger menu
- ✅ **Chat integration** - Chat widget available
- ✅ **Notification support** - Tips/mentions work

## 🚀 **Future Enhancements**

### Advanced Features (v2)
- **Multi-hand poker** - Play 3-5 hands simultaneously
- **Different variants** - Deuces Wild, Bonus Poker, etc.
- **Progressive jackpot** - Accumulating royal flush bonus
- **Tournament mode** - Compete with other players

### Social Features
- **Hand sharing** - "I just hit a royal flush!" 
- **Leaderboards** - Best hands of the day/week
- **Achievement badges** - Royal flush, straight flush, etc.

---

## 🎲 **Why This Approach Works**

**Differentiation:** Every other poker site is loud and chaotic - ours is an oasis of calm

**Accessibility:** Appeals to people intimidated by traditional online poker

**Retention:** Relaxing experience encourages longer, more frequent play

**Brand consistency:** Matches ROFLFaucet's clean, user-friendly philosophy

**Technical simplicity:** Single-player keeps implementation manageable

---

*"Like a friendly neighborhood poker game, not a Vegas casino floor"*

**Status:** 📝 Design phase - Ready for implementation when 4-game foundation is perfected