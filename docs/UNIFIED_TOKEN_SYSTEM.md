# Unified Token System Documentation

## Overview

The ROFLFaucet unified token system provides a seamless experience for both guest and member users, with consistent terminology, shared balances across games, and smooth authentication transitions.

## System Architecture

### Two-Tier Token System

#### 1. Guest Users (Demo Tokens)
- **Storage**: `roflfaucet_demo_state` in localStorage
- **Terminology**: "Tokens" 
- **Source**: Faucet claims (10 tokens per claim)
- **Scope**: Cross-game balance shared between faucet and all games
- **Persistence**: Client-side localStorage only

#### 2. Member Users (Real Balance)
- **Storage**: Server-side database via JWT API
- **Terminology**: "Coins" (UselessCoins)
- **Source**: Faucet claims + game winnings + future surveys/tasks
- **Scope**: Cross-site ecosystem balance
- **Persistence**: Centralized database with full transaction history

## Updated Implementation Details

### localStorage Structure

```javascript
// Key: 'roflfaucet_demo_state'
{
  credits: 10,                    // Current token balance
  totalSpins: 0,                  // Game statistics
  totalWagered: 0,                // Lifetime amount wagered
  totalWon: 0,                    // Lifetime amount won
  lastSaved: "2025-07-15T20:20:35Z"  // Last update timestamp
}
```

### Token Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GUEST USER FLOW                         │
├─────────────────────────────────────────────────────────────┤
│  1. Visit Faucet → Claim 10 Tokens                        │
│  2. Tokens stored in roflfaucet_demo_state                 │
│  3. Play Games → Tokens deducted from same storage         │
│  4. Win Games → Tokens added to same storage               │
│  5. Run out → Directed back to faucet                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   MEMBER USER FLOW                         │
├─────────────────────────────────────────────────────────────┤
│  1. Login → JWT token stored                               │
│  2. Real balance loaded from API                           │
│  3. Faucet claims → API call to add coins                  │
│  4. Game actions → API calls for balance changes           │
│  5. Cross-site balance → Same API across all sites         │
└─────────────────────────────────────────────────────────────┘
```

## File Integration

### Core Files

#### `faucet-bridge.js`
- **Purpose**: Connects faucet claims to unified token system
- **Key Function**: `addTokensToSlotsSystem(amount)` 
- **Integration**: Updates `roflfaucet_demo_state` on guest claims
- **Terminology**: Dynamically switches between "Tokens" and "Coins"

```javascript
// Dynamic terminology based on login status
const isLoggedIn = localStorage.getItem('jwt_token') !== null;
const terminology = isLoggedIn ? 'Coins' : 'Tokens';
```

#### `slots/slots.js`
- **Purpose**: Game logic with unified balance integration
- **Key Functions**: `loadDemoCredits()`, `saveGameState()`
- **Integration**: Reads/writes from `roflfaucet_demo_state`
- **Fallback**: Switches to demo mode if API fails

```javascript
// Unified balance loading
loadDemoCredits() {
    const saved = localStorage.getItem('roflfaucet_demo_state');
    if (saved) {
        const state = JSON.parse(saved);
        this.credits = state.credits || 0;
        this.totalSpins = state.totalSpins || 0;
        this.totalWagered = state.totalWagered || 0;
        this.totalWon = state.totalWon || 0;
    }
}
```

## User Experience Design

### Terminology Strategy

| User Type | Balance Display | Claim Button | Game Currency |
|-----------|----------------|--------------|---------------|
| Guest     | "X Tokens"     | "Claim Tokens" | "Demo Tokens" |
| Member    | "X Coins"      | "Claim Coins"  | "UselessCoins" |

### User Flow Optimization

#### New Guest User Journey
1. **Arrive** → See 0 token balance
2. **Claim** → Receive 10 tokens from faucet
3. **Play** → Use tokens in slots or other games
4. **Win/Lose** → Balance updates in real-time
5. **Empty** → Prompted to claim more from faucet
6. **Convert** → Encouraged to sign up after good experience

#### Returning Member Journey
1. **Arrive** → Auto-login with JWT token
2. **Balance** → Real balance loaded from API
3. **Claim** → Real coins added to account
4. **Play** → Real balance used across all games
5. **Progress** → Persistent stats and achievements

## Technical Implementation

### Balance Synchronization

```javascript
// Guest balance update (client-side)
function updateGuestBalance(amount) {
    const saved = localStorage.getItem('roflfaucet_demo_state');
    let state = saved ? JSON.parse(saved) : { credits: 0, totalSpins: 0, totalWagered: 0, totalWon: 0 };
    state.credits += amount;
    state.lastSaved = new Date().toISOString();
    localStorage.setItem('roflfaucet_demo_state', JSON.stringify(state));
}

// Member balance update (API call)
async function updateMemberBalance(amount, source, description) {
    const response = await fetch('/api/user/balance/add', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${jwt_token}` },
        body: JSON.stringify({ amount, source, description })
    });
    return response.json();
}
```

### Cross-Game Integration

```javascript
// Unified balance access for any game
function getUnifiedBalance() {
    const isLoggedIn = localStorage.getItem('jwt_token') !== null;
    
    if (isLoggedIn) {
        return loadRealBalanceFromAPI();
    } else {
        const saved = localStorage.getItem('roflfaucet_demo_state');
        return saved ? JSON.parse(saved).credits : 0;
    }
}
```

## Security Considerations

### Guest Token Security
- **Acceptable Risk**: Client-side storage acceptable for demo tokens
- **No Real Value**: Demo tokens have no monetary value
- **Isolated System**: Demo balance separate from real balance
- **Limited Scope**: Only affects client-side experience

### Member Token Security
- **Server-Side Balance**: All real balance managed via API
- **JWT Authentication**: Secure token-based authentication
- **Transaction Validation**: All balance changes validated server-side
- **Rate Limiting**: API calls protected against abuse

## Future Expansion

### Additional Games Integration

```javascript
// Template for new game integration
class NewGame {
    constructor() {
        this.loadUnifiedBalance();
    }
    
    loadUnifiedBalance() {
        const isLoggedIn = localStorage.getItem('jwt_token') !== null;
        
        if (isLoggedIn) {
            this.loadRealBalance();
        } else {
            this.loadDemoBalance();
        }
    }
    
    loadDemoBalance() {
        const saved = localStorage.getItem('roflfaucet_demo_state');
        if (saved) {
            const state = JSON.parse(saved);
            this.credits = state.credits || 0;
        }
    }
    
    saveGameState() {
        if (!this.isLoggedIn) {
            const state = {
                credits: this.credits,
                totalSpins: this.totalSpins,
                totalWagered: this.totalWagered,
                totalWon: this.totalWon,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem('roflfaucet_demo_state', JSON.stringify(state));
        }
    }
}
```

### Survey/Task Integration

```javascript
// Future survey reward integration
function addSurveyReward(amount, surveyId) {
    const isLoggedIn = localStorage.getItem('jwt_token') !== null;
    
    if (isLoggedIn) {
        // Add to real balance via API
        updateMemberBalance(amount, 'survey_reward', `Survey ${surveyId} completion`);
    } else {
        // Add to demo balance with conversion prompt
        updateGuestBalance(amount);
        showConversionPrompt('Sign up to keep your survey rewards!');
    }
}
```

## Testing Guidelines

### Test Scenarios

#### Guest User Testing
- [ ] Start with 0 tokens
- [ ] Claim 10 tokens from faucet
- [ ] Verify balance updates in localStorage
- [ ] Play games and verify balance changes
- [ ] Clear localStorage and verify reset

#### Member User Testing
- [ ] Login flow with JWT
- [ ] Real balance loaded from API
- [ ] Faucet claims update real balance
- [ ] Games use real balance
- [ ] Logout preserves demo balance

#### Cross-System Testing
- [ ] Switch between guest and member modes
- [ ] Verify terminology changes
- [ ] Test balance transitions
- [ ] Verify game compatibility

## Migration Path

### From Old System
1. **Identify** existing localStorage keys
2. **Migrate** data to unified `roflfaucet_demo_state`
3. **Update** all games to use unified system
4. **Test** cross-game balance sharing
5. **Remove** old localStorage keys

### To New Games
1. **Implement** unified balance loading
2. **Use** consistent terminology
3. **Follow** save/load patterns
4. **Test** with both user types

## Performance Optimization

### localStorage Management
- **Minimize** write operations
- **Batch** updates when possible
- **Validate** data integrity
- **Handle** storage quota limits

### API Optimization
- **Cache** balance data when appropriate
- **Implement** retry logic for failed calls
- **Use** websockets for real-time updates
- **Optimize** payload sizes

## Monitoring and Analytics

### Key Metrics
- **Guest Conversion Rate**: Demo → Member signup rate
- **Token Engagement**: Claims per session
- **Cross-Game Usage**: Balance sharing between games
- **API Performance**: Response times and error rates

### Data Collection
```javascript
// Analytics tracking
function trackTokenEvent(event, data) {
    const isLoggedIn = localStorage.getItem('jwt_token') !== null;
    
    analytics.track(event, {
        userType: isLoggedIn ? 'member' : 'guest',
        balance: getCurrentBalance(),
        timestamp: new Date().toISOString(),
        ...data
    });
}
```

## Troubleshooting

### Common Issues

#### Balance Not Updating
- **Check**: localStorage permissions
- **Verify**: Key name consistency
- **Test**: JSON parsing/stringifying

#### API Failures
- **Fallback**: Switch to demo mode
- **Retry**: Implement exponential backoff
- **Monitor**: Error rates and types

#### Cross-Game Sync Issues
- **Verify**: All games use same localStorage key
- **Check**: Save/load timing
- **Test**: Rapid switching between games

---

## Conclusion

The unified token system provides a seamless, scalable foundation for ROFLFaucet's token economy. It successfully bridges the gap between guest and member experiences while maintaining security and enabling future expansion.

The system's strength lies in its simplicity, consistency, and flexibility - allowing for easy integration of new games and features while providing a smooth user experience that encourages conversion from guest to member users.
