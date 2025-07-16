# Balance Component System

A simple, reusable system for displaying user token balances consistently across all pages.

## Overview

The balance component system uses a single CSS class (`balance`) that can be applied to any HTML element. JavaScript automatically finds and updates all elements with this class, displaying the current user's balance.

## How It Works

### 1. CSS Class
Add the `balance` class to any `<span>` element:
```html
<span class="balance">0</span>
```

### 2. Automatic Updates
The JavaScript (`unified-balance.js`) automatically:
- Finds all `.balance` elements on page load
- Gets the current balance (from API for members, localStorage for guests)
- Updates the content with the actual balance
- Refreshes every 10 seconds
- Provides hover tooltips with full currency name

### 3. Styling
The `.balance` class provides minimal styling:
- **Font**: Monospace (Courier New) for consistent number display
- **Weight**: Bold
- **Color**: Dark blue-gray (#2c3e50)
- **Display**: Inline (works anywhere)

## Usage Examples

### Basic Usage
```html
<p>Your balance: <span class="balance">0</span> coins</p>
```

### In Styled Components
```html
<!-- Inherits existing styles + gets balance functionality -->
<div class="stats-display">
    <span class="stats-number balance">0</span>
    <span class="stats-label">UselessCoins</span>
</div>
```

### Multiple Classes
```html
<!-- Gets both control-value styling AND balance updating -->
<span class="control-value balance" id="current-balance">0</span>
```

### In Sentences
```html
<p>You have <span class="balance">0</span> tokens available to play slots.</p>
```

## Implementation Details

### JavaScript Functions
- `updateBalanceDisplays()` - Updates all balance elements
- `window.unifiedBalance.getBalance()` - Gets current balance
- `window.unifiedBalance.getTerminology()` - Gets currency info

### Automatic Updates
- **Initial**: 100ms after page load
- **Recurring**: Every 10 seconds
- **Manual**: Call `updateBalanceDisplays()` anytime

### Backward Compatibility
The system also updates legacy elements by ID:
- `#balance`
- `#current-balance` 
- `#current-balance-back`
- `#user-balance`
- `#balance-display`

## Benefits

1. **Consistency**: Same balance data everywhere
2. **Simplicity**: Just add one class
3. **Flexibility**: Works in any context
4. **Automatic**: No manual updates needed
5. **Styling**: Inherits parent styles while adding balance functionality

## Files

- `unified-balance.js` - Core balance system and auto-updater
- `styles.css` - CSS class definition
- Various HTML files - Usage examples

## Member vs Guest Display

- **Members**: Shows real balance from API + "UselessCoins"
- **Guests**: Shows calculated balance from localStorage + "Tokens"
- **Tooltips**: Hover to see full currency name

## Example Implementation

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="styles.css">
    <script src="unified-balance.js"></script>
</head>
<body>
    <h1>🚰 ROFLFaucet</h1>
    <p>Welcome! Your current balance is <span class="balance">0</span>.</p>
    
    <div class="stats-box">
        <span class="big-number balance">0</span>
        <span class="label">Tokens</span>
    </div>
    
    <p>You can spend <span class="balance">0</span> tokens in our slot machine!</p>
</body>
</html>
```

All three balance displays will show the same value and update automatically!
