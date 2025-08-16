# Poker Dice Game Design Document

## Concept Overview
Transform the existing dice game from a bet/multiplier system into an engaging poker dice game with 5 animated 3D dice showing poker symbols (9, 10, J, Q, K, A).

## Game Mechanics

### Dice Configuration
- **5 dice** instead of traditional 2
- **6 faces per die**: 9, 10, J, Q, K, A (instead of 1-6)
- **3D animated dice** with realistic rolling physics
- **Simultaneous rolling** of all 5 dice with staggered completion

### Hand Rankings (from lowest to highest)
1. **One Pair** (two of same rank) - 1:1 payout  
2. **Two Pair** (two different pairs) - 2:1 payout
3. **Three of a Kind** (three of same rank) - 3:1 payout
4. **Flush** (all same color) - 6:1 payout
5. **Straight** (9-10-J-Q-K or 10-J-Q-K-A) - 15:1 payout
6. **Full House** (three of a kind + pair) - 10:1 payout
7. **Four of a Kind** (four of same rank) - 20:1 payout
8. **Five of a Kind** (all five same rank) - 400:1 payout

### Special Note: Royal Flush
**Royal Flush is IMPOSSIBLE** with the current color system!
- Royal straight requires: 10-J-Q-K-A
- Our colors: Red (9,J,K) and Black (10,Q,A) 
- This creates mixed colors, so no Royal Flush is possible
- The highest achievable hand with 10-J-Q-K-A is just a **Straight** (15:1)

### Flush Implementation
Since dice don't traditionally have suits, we'll implement "flush" as a special visual/color coding:
- Each face value has a designated color (9=red, 10=black, J=red, Q=black, K=red, A=black)
- A "flush" occurs when all 5 dice show the same color
- This maintains the poker theme while being visually clear

### Betting System
- **Simple bet amount** (no multipliers)
- **Fixed payouts** based on hand strength
- **Minimum bet**: 1 token/coin
- **Maximum bet**: Based on player level (existing system)
- **Auto-evaluate**: Game automatically finds best hand and pays accordingly

### Game Flow
1. Player sets bet amount
2. Click "ROLL DICE" to start animation
3. All 5 dice animate simultaneously with realistic physics
4. Animation completes showing final values
5. Hand is evaluated and displayed
6. Payout calculated and awarded
7. Hand added to recent rolls history

## Technical Implementation

### Animation System
- Based on CodePen example but extended to 5 dice
- Each die rotates randomly during animation
- Staggered completion (dice stop at slightly different times)
- Final face shown matches the predetermined roll result
- Smooth CSS3 transforms with realistic easing

### Hand Evaluation
```javascript
class PokerDiceEvaluator {
    evaluateHand(dice) {
        // Count occurrences of each value
        // Check for straights
        // Check for flush (color matching)
        // Return best hand type and payout multiplier
    }
}
```

### UI Changes
- Replace high/low controls with hand rankings table
- Show current hand prominently after each roll
- Display payout table for easy reference
- Keep recent rolls but show hand types instead of win/lose

## Advantages Over Current System
1. **More engaging** - Visual dice rolling is exciting
2. **Clearer outcomes** - Players understand poker hands
3. **Skill element** - Players learn to recognize good hands
4. **Better retention** - More satisfying than abstract number rolls
5. **Familiar concept** - Most players know poker basics

## Development Phases
1. **Prototype**: Basic 5-dice animation system
2. **Core Logic**: Hand evaluation and payout system  
3. **Polish**: Smooth animations and visual feedback
4. **Integration**: Connect to existing balance/stats system
5. **Testing**: Balance payouts and ensure fair gameplay

## Payout Balance
- Target 95-97% RTP (Return to Player)
- Probabilities calculated based on 6^5 = 7,776 possible outcomes
- Adjust payout multipliers to maintain house edge while being generous

## Future Enhancements
- Sound effects for different hand types
- Particle effects for big wins
- "Hold" dice feature (re-roll only some dice)
- Tournament mode with leaderboards

---

This design maintains the simplicity of the current system while adding much more visual appeal and player engagement through the familiar poker hand concepts.
