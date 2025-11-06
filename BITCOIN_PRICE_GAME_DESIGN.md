# Bitcoin Price Prediction Game

*Future expansion concept - Price movement betting without expensive APIs*

## 🎯 **Core Concept**

**The Game:** Bet on whether Bitcoin price will go UP or DOWN in the next 1-5 minutes

**The Challenge:** Getting real-time price data without paying for expensive API calls

**The Solution:** Server-side price scraping with cached data

## 💡 **Technical Approach: Synchronized Betting Rounds**

### 🎯 **Key Insight: Only Need 1 API Call Per Minute!**

**The Solution:** All bets synchronized to the minute - everyone bets on the same price movement, resolved at the exact same time.

### **Enhanced Timeline with Live Updates:**
```
12:34:00 - Round starts: $43,247.82 (baseline price)
12:34:06 - Update 1: $43,248.15 ↗️ (+$0.33) [Trend emerging?]
12:34:12 - Update 2: $43,246.90 ↘️ (-$1.25) [Reversal!]
12:34:18 - Update 3: $43,248.45 ↗️ (+$1.55) [Back up]
12:34:24 - Update 4: $43,249.20 ↗️ (+$0.75) [Uptrend?]
12:34:30 - Update 5: $43,247.50 ↘️ (-$1.70) [Volatile!]
12:34:36 - Update 6: $43,250.10 ↗️ (+$2.60) [Big move]
12:34:42 - Update 7: $43,251.20 ↗️ (+$1.10) [15 secs left!]
12:34:45 - 🔒 BETTING CLOSES! No more bets accepted
12:34:48 - Update 8: $43,250.85 ↘️ (-$0.35) [Drama builds...]
12:34:54 - Update 9: $43,252.10 ↗️ (+$1.25) [Final clue...]
12:35:00 - 🎯 FINAL RESOLUTION: Compare to $43,247.82
12:35:00 - Next round starts with $43,252.10 as baseline
```

**🎮 Game Psychology:** Users see the trend developing and must decide:
- **Bet early** based on limited data (safer timing)
- **Wait for more updates** to see the trend (risk missing cutoff)

### **API Methods (All Work With This System)**

#### **Method 1: CoinGecko Free API with Live Updates (Recommended)**
```php
// 10 calls per minute = 14,400 calls per day
// CoinGecko free limit = 10,000+ calls per month
// Still massively under the limit!

function fetchLivePrice() {
    $url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";
    $response = file_get_contents($url);
    $data = json_decode($response, true);
    return [
        'price' => $data['bitcoin']['usd'],
        'timestamp' => time()
    ];
}

// Cache price updates for the round
function cachePriceUpdate($price) {
    $roundId = getCurrentRoundId();
    $cacheFile = "/var/cache/btc-round-{$roundId}.json";
    
    $updates = [];
    if (file_exists($cacheFile)) {
        $updates = json_decode(file_get_contents($cacheFile), true);
    }
    
    $updates[] = [
        'price' => $price['price'],
        'timestamp' => $price['timestamp'],
        'seconds' => date('s')
    ];
    
    file_put_contents($cacheFile, json_encode($updates), LOCK_EX);
}
```

#### **Method 2: Fallback Scraping**
```php
// If API fails, scrape as backup
$html = file_get_contents('https://coinmarketcap.com/currencies/bitcoin/');
preg_match('/data-test="text-cdp-price-display">([^<]+)/', $html, $matches);
$price = $matches[1];
```

#### **Method 3: Multiple Sources for Reliability**
```php
$sources = [
    'coingecko' => function() { return fetchCoinGeckoPrice(); },
    'coinbase' => function() { return fetchCoinbasePrice(); },
    'scrape' => function() { return scrapeCMCPrice(); }
];

// Try each until one works
foreach ($sources as $name => $fetcher) {
    $price = $fetcher();
    if ($price !== false) {
        logPriceSource($name);
        return $price;
    }
}
```

## 🎮 **Game Mechanics: Synchronized Rounds**

### **Revolutionary Game Flow**
1. **Round Start** - Price locked at beginning of minute (e.g., $43,247.82)
2. **Betting Window** - 45 seconds to place UP/DOWN bets
3. **Betting Closes** - 15 seconds before minute ends
4. **Countdown Drama** - 15-second animation building suspense
5. **Price Reveal** - New price fetched at exact minute mark
6. **Instant Resolution** - ALL bets resolved simultaneously
7. **Next Round** - Immediately starts with new baseline price

### **Simple Payout Structure**
```
Prediction Result    | Payout
--------------------|--------
Correct (UP/DOWN)   | 1.9x
Exact Same Price    | 20x (extremely rare)
Wrong Direction     | 0x (lose bet)
```

*Higher payouts possible since API costs are minimal!*

### **Live Update Gaming Elements**
- **Real-time price feed** - Updates every 6 seconds
- **Mini price chart** - Visual trend during the round
- **Strategic timing** - Early bet vs late bet with more data
- **Trend indicators** - "🔥 Hot streak: 3 ups in a row!"
- **Volatility warnings** - "⚡ High volatility detected!"
- **Final countdown drama** - 2 updates after betting closes

### **Social Gaming Elements**
- **Community Countdown** - Everyone watching same timer
- **Betting Statistics** - See how many chose UP vs DOWN
- **Live Reactions** - "Price just jumped! Still betting UP!"
- **Shared Excitement** - Multiple winners/losers announced together
- **Chat Integration** - "That trend looks bullish!" during updates

## 🖥️ **User Interface: Synchronized Round Display**

### **Live Updates Betting Layout**
```
┌─────────────────────────────────────┐
│        🪙 Bitcoin Predictor         │
│                                     │
│  📈 LIVE: $43,248.45 ↗️ (+$0.63)     │
│  Started: $43,247.82  Next: 0:04    │
│                                     │
│  ┌── Mini Chart (Last 6 updates) ──┐ │
│  │    ╱╲                          │ │
│  │   ╱  ╲   ╱                     │ │
│  │  ╱    ╲ ╱                      │ │
│  │ ╱      ╲                       │ │
│  └─────────────────────────────────┘ │
│                                     │
│  🔥 Trend: 3 UP, 2 DOWN (Bullish?)  │
│  ⏰ Betting closes in: 0:18          │
│                                     │
│  ┌─────────────┐ ┌─────────────┐    │
│  │     UP      │ │    DOWN     │    │
│  │   📈 1.9x   │ │   📉 1.9x   │    │
│  │  (28 bets)  │ │  (15 bets)  │    │
│  └─────────────┘ └─────────────┘    │
│                                     │
│  Your Bet: [5] coins  Balance: 150  │
│   [PREDICT UP] [PREDICT DOWN]       │
│                                     │
│  📊 65% betting UP (trend following) │
└─────────────────────────────────────┘
```

### **Final 15 Seconds - Countdown Phase**
```
┌─────────────────────────────────────┐
│        🪙 Bitcoin Predictor         │
│                                     │
│   🔒 BETTING CLOSED                 │
│   Round Price: $43,247.82           │
│                                     │
│        ⏰ RESOLVING IN: 08          │
│                                     │
│  Your Prediction: UP (5 coins) 📈   │
│                                     │
│  Waiting for new price...           │
│                                     │
│  🎯 This Round: 41 players          │
│  💰 Total Wagered: 195 coins        │
│  📈 UP: 23 bets (56%)               │
│  📉 DOWN: 18 bets (44%)             │
└─────────────────────────────────────┘
```

### **Results Phase**
```
┌─────────────────────────────────────┐
│        🪙 Bitcoin Predictor         │
│                                     │
│  🎉 ROUND COMPLETE! 🎉              │
│                                     │
│  Start: $43,247.82                  │
│  Final: $43,251.15 📈               │
│  Change: +$3.33 (UP WINS!)          │
│                                     │
│  Your Result: ✅ WON 9.5 coins!     │
│  New Balance: 154.5 coins           │
│                                     │
│  Round Results:                     │
│  📈 UP Winners: 23 players          │
│  📉 DOWN Losers: 18 players         │
│                                     │
│  🚀 Next Round Starting Now...      │
└─────────────────────────────────────┘
```

## 🔧 **Technical Implementation**

### Server Architecture
```
┌─────────────────┐    ┌─────────────────┐
│  Price Scraper  │    │   Game Server   │
│   (Background)  │───▶│   (ROFLFaucet)  │
└─────────────────┘    └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  Price Cache    │    │ Active Bets DB  │
│  (Redis/File)   │    │  (Text Files)   │
└─────────────────┘    └─────────────────┘
```

### **Live Updates Cron System**

#### **Price Update Script (Every 6 Seconds)**
```php
#!/usr/bin/env php
<?php
// bitcoin-live-updater.php - Runs every 6 seconds

// Only run during active rounds (not between :00-:05 of each minute)
$seconds = (int)date('s');
if ($seconds >= 0 && $seconds <= 5) {
    exit(); // Round transition period
}

// Fetch current Bitcoin price
$priceUrl = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";
$response = file_get_contents($priceUrl);
$data = json_decode($response, true);
$currentPrice = $data['bitcoin']['usd'];

// Cache the update
cachePriceUpdate([
    'price' => $currentPrice,
    'timestamp' => time(),
    'seconds' => $seconds
]);

// Calculate trend
analyzePriceTrend($currentPrice);

echo "Price update: $" . number_format($currentPrice, 2) . " at :" . str_pad($seconds, 2, '0', STR_PAD_LEFT) . "\n";
?>
```

#### **Round Resolution Script (Every Minute)**
```php
#!/usr/bin/env php
<?php
// bitcoin-round-resolver.php - Runs every minute at :00 seconds

// Only execute at the start of each minute
if (date('s') != '00') {
    exit(); // Not the right time
}

// Get the final price (same as live updater)
$priceUrl = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";
$response = file_get_contents($priceUrl);
$data = json_decode($response, true);
$finalPrice = $data['bitcoin']['usd'];

// Resolve all active bets from previous round
$activeBets = getActiveBets();
foreach ($activeBets as $bet) {
    $won = ($bet['direction'] == 'up' && $newPrice > $bet['start_price']) || 
           ($bet['direction'] == 'down' && $newPrice < $bet['start_price']);
    
    if ($won) {
        addBalance($bet['user_id'], $bet['amount'] * 1.9); // 1.9x payout
    }
    // If same price (extremely rare), 20x payout
    elseif ($newPrice == $bet['start_price']) {
        addBalance($bet['user_id'], $bet['amount'] * 20);
    }
    
    markBetResolved($bet['id'], $won, $newPrice);
}

// Start new round with current price
startNewRound($newPrice);

// Log the round
logRound([
    'timestamp' => time(),
    'price' => $newPrice,
    'total_bets' => count($activeBets),
    'api_source' => 'coingecko'
]);

echo "Round resolved at " . date('H:i:s') . " - Price: $" . number_format($newPrice, 2) . "\n";
?>
```

### **Enhanced Cron Job Setup**
```bash
# Price updates every 6 seconds (during active rounds)
*/1 * * * * sleep 6  && /usr/bin/php /path/to/bitcoin-live-updater.php
*/1 * * * * sleep 12 && /usr/bin/php /path/to/bitcoin-live-updater.php
*/1 * * * * sleep 18 && /usr/bin/php /path/to/bitcoin-live-updater.php
*/1 * * * * sleep 24 && /usr/bin/php /path/to/bitcoin-live-updater.php
*/1 * * * * sleep 30 && /usr/bin/php /path/to/bitcoin-live-updater.php
*/1 * * * * sleep 36 && /usr/bin/php /path/to/bitcoin-live-updater.php
*/1 * * * * sleep 42 && /usr/bin/php /path/to/bitcoin-live-updater.php
*/1 * * * * sleep 48 && /usr/bin/php /path/to/bitcoin-live-updater.php
*/1 * * * * sleep 54 && /usr/bin/php /path/to/bitcoin-live-updater.php

# Round resolution exactly at the start of every minute
* * * * * /usr/bin/php /path/to/bitcoin-round-resolver.php
```

**Result:** 10 price updates per minute + 1 final resolution = Perfect API usage!

### **Simplified Game Logic**
```php
// api/bitcoin-game.php
function placeBet($userId, $direction, $amount) {
    $currentRound = getCurrentRound();
    
    // Check if betting is still open (45 seconds into the minute)
    if (date('s') >= 45) {
        return ['error' => 'Betting closed for this round'];
    }
    
    $bet = [
        'user_id' => $userId,
        'direction' => $direction, // 'up' or 'down'
        'amount' => $amount,
        'round_id' => $currentRound['id'],
        'start_price' => $currentRound['price'],
        'timestamp' => time(),
        'status' => 'active'
    ];
    
    saveBet($bet);
    deductBalance($userId, $amount);
    
    return ['success' => true, 'bet_id' => $bet['id']];
}

function getCurrentRoundStatus() {
    $secondsIntoMinute = (int)date('s');
    
    if ($secondsIntoMinute < 45) {
        return [
            'phase' => 'betting',
            'seconds_left' => 45 - $secondsIntoMinute,
            'can_bet' => true,
            'next_update' => 6 - ($secondsIntoMinute % 6), // Next price update
            'updates_remaining' => floor((45 - $secondsIntoMinute) / 6)
        ];
    } else {
        return [
            'phase' => 'countdown',
            'seconds_left' => 60 - $secondsIntoMinute,
            'can_bet' => false,
            'next_update' => 6 - ($secondsIntoMinute % 6), // Drama updates continue
            'updates_remaining' => floor((60 - $secondsIntoMinute) / 6)
        ];
    }
}

function getRoundStats() {
    $currentRound = getCurrentRound();
    $bets = getBetsForRound($currentRound['id']);
    
    $upBets = array_filter($bets, function($bet) { return $bet['direction'] == 'up'; });
    $downBets = array_filter($bets, function($bet) { return $bet['direction'] == 'down'; });
    
    return [
        'total_players' => count($bets),
        'total_wagered' => array_sum(array_column($bets, 'amount')),
        'up_bets' => count($upBets),
        'down_bets' => count($downBets),
        'up_percentage' => count($bets) > 0 ? round(count($upBets) / count($bets) * 100) : 0
    ];
}
```

## ⚡ **Massive Advantages of Synchronized Rounds**

### **🚀 Cost Efficiency (Still Amazing!)**
- ✅ **10 live updates per minute** - 14,400 calls per day
- ✅ **CoinGecko free tier** - 10,000+ calls per month  
- ✅ **Still well under limits** - Could run for months free
- ✅ **Predictable costs** - Never worry about usage spikes
- ✅ **No per-user scaling costs** - Same cost for 10 or 10,000 users
- ✅ **Maximum engagement** - Using API budget for dramatic effect

### **🎮 Dramatically Enhanced User Experience**
- ✅ **Live price action** - Updates every 6 seconds create real drama
- ✅ **Strategic depth** - Early bet (safe) vs late bet (more info)
- ✅ **Visual engagement** - Mini charts and trend indicators
- ✅ **Psychological tension** - "Should I bet now or wait?"
- ✅ **Community excitement** - Everyone watching same live feed
- ✅ **Social gaming** - "Price is spiking! Still going UP!"
- ✅ **Trend following** - Users chase momentum (classic behavior)
- ✅ **Final countdown drama** - 2 updates after betting closes
- ✅ **Higher payouts** - 1.9x vs typical 1.5x (due to reasonable costs)
- ✅ **Fair timing** - Everyone sees same updates simultaneously

### **💻 Technical Brilliance**
- ✅ **Incredibly simple** - One cron job handles everything
- ✅ **Perfect reliability** - Multiple fallback price sources
- ✅ **Zero race conditions** - All resolved at same time
- ✅ **Scales infinitely** - Same resources for any user count
- ✅ **Easy to debug** - All events happen at predictable times
- ✅ **Database friendly** - Batch operations only

### **📈 Business Model Benefits**
- ✅ **High engagement** - Users wait for "their" minute
- ✅ **Viral potential** - "Everyone's watching the countdown!"
- ✅ **Retention** - Regular minute-by-minute gameplay loop
- ✅ **Social features** - Chat integration natural fit
- ✅ **Tournament potential** - "Who can predict 5 in a row?"

## 🚨 **Potential Challenges**

### Technical Risks
- **Price feed failure** - Need backup sources
- **Scraping detection** - Sites may block automated access
- **Rate limiting** - Free APIs have usage caps
- **Precision** - Ensure consistent price across users

### Solutions
```php
// Multiple price sources for reliability
$sources = [
    'coingecko' => 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    'coinbase' => 'https://api.coinbase.com/v2/exchange-rates?currency=BTC',
    'scrape_cmc' => 'https://coinmarketcap.com/currencies/bitcoin/'
];

// Try each source until one works
foreach ($sources as $name => $url) {
    $price = tryGetPrice($url);
    if ($price !== false) break;
}
```

## 🎯 **Integration Strategy**

### Phase 1: Basic Live Updates
- Implement 6-second price updates
- Add mini chart display
- Test API reliability and user engagement
- Keep simple UP/DOWN betting

### Phase 2: Enhanced Visuals
- **Animated price graph** - Smooth transitions between updates
- **Trend indicators** - "🔥 3 UPs in a row!", "⚡ High volatility!"
- **Sound effects** - Optional price tick sounds
- **Mobile animations** - Haptic feedback on price moves

### Phase 3: Multi-Crypto Racing
- **5-crypto racing** - BTC, ETH, SOL, ADA, DOGE
- **Bet on winner** - Which gains most % in 1 minute?
- **Single API call** - CoinGecko supports multiple coins
- **Horse race UI** - Visual representation of crypto "racing"

### Phase 4: Advanced Features
- **Streak bonuses** - Reward consecutive correct predictions
- **Volatility betting** - Bet on price stability vs movement
- **Tournament mode** - Weekly prediction championships
- **Social features** - Leaderboards, achievements, chat integration

## 💰 **Business Model**

### House Edge
- **Slight house advantage** - Payouts slightly under 2x
- **Volume play** - Many small bets add up
- **Engagement** - Keeps users on site longer

### Fair Play
- **Transparent pricing** - Show price source
- **Audit trail** - All bets logged
- **No manipulation** - External price feeds

---

## 🎲 **Why This Could Work**

**High Engagement:** People are fascinated by Bitcoin price movements

**Simple Concept:** Everyone understands "will it go up or down?"

**Quick Games:** Perfect for mobile, short attention spans  

**Viral Potential:** "I just predicted Bitcoin perfectly!" is very shareable

**Technical Feasibility:** Solvable problems with creative server-side approaches

**Low Cost:** Free price data + clever caching = minimal operating costs

---

*"Turn Bitcoin volatility into entertainment"*

### **🏎️ Future: Multi-Crypto Racing Game**
```php
// Get 5 cryptos in one API call - still within free limits!
$url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,cardano,dogecoin&vs_currencies=usd";

// Racing game: Bet on which crypto gains most % in 1 minute
// Visual: 5 "horses" racing across the screen based on % gains
```

**🎮 Multi-Crypto Race UI:**
```
🏁 Crypto Racing - 1 Minute Race

🥇 Bitcoin:   +0.8% |████████████████░░░░| Leading!
🥈 Ethereum:  +0.6% |██████████████░░░░░░| Close!
🥉 Solana:    +0.4% |██████████░░░░░░░░░░| Chasing
4️⃣ Cardano:   +0.1% |███░░░░░░░░░░░░░░░░░| Struggling
5️⃣ Dogecoin: -0.2% |█░░░░░░░░░░░░░░░░░░░| Behind

Bet on winner: 3x payout | 2nd place: 1.5x
```

---

**Status:** 📋 Ready for implementation - Live updates create compelling gameplay with free API usage!
