# ROFLFaucet Financial Reporting System

## Overview
A **financial reporting system** (not accounting) that tracks and displays financial flows through ROFLFaucet. This is pure reporting - we're custodial pass-through, not a business. Reports on donations received and distributions made, provides real-time balance display throughout the site.

## Philosophy: Reporting, Not Accounting
- **We don't "own" the money** - Pure custodial pass-through service
- **Reporting inflows/outflows** - Like a router reports packet flows  
- **Temporary custody only** - Hot wallet holds funds briefly for distribution
- **100% transparency** - Every sat tracked and publicly reported
- **Future Direct Sponsor ready** - Foundation for P2P direct payments

## Current State Analysis ✅

### What We Already Have (Working Great):
- **Donations**: `data/donations/donations.json` - Individual donation records
- **User Coins**: `userdata/balances/{userId}.txt` - Game/activity coin balances
- **Distributions**: `payments/data/accounts/distributions.json` - Charity distributions  
- **Manual Payments**: `data/manual_distributions.json` - Manual payment tracking
- **Login Integration**: Users can donate with usernames attached
- **Transparency Page**: Public display of all financial flows

### What We Need to Add:
- **Master Report File**: Single source of truth for current balances
- **Balance Display System**: Show balances anywhere on site with CSS classes
- **User Activity Tracking**: When users donate, record to their profile

## Master Report File (`data/financial_report.json`)

**Single source of truth** - all other systems read from this:

```json
{
    "timestamp": "2025-09-30T18:00:00Z",
    "charity_fund": {
        "current_balance_sats": 0,
        "total_received_sats": 20802,
        "total_distributed_sats": 20802,
        "last_updated": "2025-09-30T17:34:00Z",
        "status": "balanced"
    },
    "user_coins": {
        "total_active_coins": 1250000,
        "active_users": 45,
        "last_activity": "2025-09-30T17:55:00Z"
    },
    "monthly_summary": {
        "current_month": "2025-09",
        "donations_this_month": 20802,
        "distributions_this_month": 20802,
        "active_donors_this_month": 3
    },
    "data_sources": {
        "donations_file": "data/donations/donations.json",
        "distributions_file": "payments/data/accounts/distributions.json", 
        "manual_payments_file": "data/manual_distributions.json"
    }
}
```

## Balance Display System

### Universal Balance Injection (`scripts/balance-reporter.js`)

```javascript
class FinancialReporter {
    constructor() {
        this.reportData = null;
        this.updateInterval = 30000; // 30 seconds
        this.init();
    }

    async init() {
        if (this.hasBalanceElements()) {
            await this.fetchReport();
            this.displayBalances();
            this.setupAutoUpdate();
        }
    }

    hasBalanceElements() {
        return document.querySelector('.charity-balance, .charity-received, .charity-distributed, .user-coins-total');
    }

    async fetchReport() {
        try {
            const response = await fetch('/api/financial-report.php');
            this.reportData = await response.json();
        } catch (error) {
            console.warn('Balance reporter: Could not fetch financial report');
        }
    }

    displayBalances() {
        if (!this.reportData) return;

        const { charity_fund, user_coins, monthly_summary } = this.reportData;

        // Charity fund balances
        this.updateElements('.charity-balance', this.formatSats(charity_fund.current_balance_sats));
        this.updateElements('.charity-received', this.formatSats(charity_fund.total_received_sats));
        this.updateElements('.charity-distributed', this.formatSats(charity_fund.total_distributed_sats));
        
        // Monthly stats
        this.updateElements('.charity-month-donations', this.formatSats(monthly_summary.donations_this_month));
        this.updateElements('.charity-month-distributions', this.formatSats(monthly_summary.distributions_this_month));
        
        // User coin stats
        this.updateElements('.user-coins-total', this.formatCoins(user_coins.total_active_coins));
        this.updateElements('.active-users-count', user_coins.active_users.toString());
    }

    updateElements(selector, text) {
        document.querySelectorAll(selector).forEach(el => {
            el.textContent = text;
            el.classList.add('balance-loaded');
        });
    }

    formatSats(sats) {
        return new Intl.NumberFormat().format(sats) + ' sats';
    }

    formatCoins(coins) {
        return new Intl.NumberFormat().format(coins) + ' coins';
    }

    setupAutoUpdate() {
        setInterval(() => {
            this.fetchReport().then(() => this.displayBalances());
        }, this.updateInterval);
    }
}

// Auto-start if page has balance elements
document.addEventListener('DOMContentLoaded', () => {
    new FinancialReporter();
});
```

### CSS Classes for Balance Display

```css
/* Balance loading state */
.charity-balance, .charity-received, .charity-distributed,
.charity-month-donations, .charity-month-distributions,
.user-coins-total, .active-users-count {
    color: #666;
    font-style: italic;
}

/* Balance loaded state */
.balance-loaded {
    color: inherit;
    font-style: normal;
    font-weight: 500;
}

/* Special styling for zero balance */
.charity-balance:not(.balance-loaded)::after {
    content: ' (updating...)';
    font-size: 0.8em;
    opacity: 0.7;
}
```

## HTML Usage Examples

```html
<!-- Inline in any page -->
<p>Current charity fund: <span class="charity-balance">0 sats</span></p>

<!-- Dashboard widget -->
<div class="stats-widget">
    <h3>Charity Impact</h3>
    <div class="stat">
        <label>Current Balance:</label>
        <span class="charity-balance">0 sats</span>
    </div>
    <div class="stat">
        <label>Total Received:</label>
        <span class="charity-received">20,802 sats</span>
    </div>
    <div class="stat">
        <label>Total Distributed:</label>
        <span class="charity-distributed">20,802 sats</span>
    </div>
</div>

<!-- Monthly summary -->
<div class="monthly-report">
    <h4>September 2025</h4>
    <p>Donations: <span class="charity-month-donations">20,802 sats</span></p>
    <p>Distributions: <span class="charity-month-distributions">20,802 sats</span></p>
</div>

<!-- User community stats -->
<div class="community-stats">
    <span class="active-users-count">45</span> active members holding 
    <span class="user-coins-total">1,250,000 coins</span>
</div>
```

## API Endpoints

### Financial Report API (`api/financial-report.php`)

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Calculate current financial status
function generateFinancialReport() {
    // Get charity fund status (existing logic)
    $balance = calculateCurrentBalance(); // From existing accounts.php
    
    // Get user coins total
    $userCoinsTotal = calculateTotalUserCoins();
    
    // Generate monthly summary
    $monthlySummary = calculateMonthlySummary();
    
    $report = [
        'timestamp' => date('c'),
        'charity_fund' => [
            'current_balance_sats' => $balance['current_balance_sats'],
            'total_received_sats' => $balance['total_inflows_sats'],
            'total_distributed_sats' => $balance['total_outflows_sats'],
            'last_updated' => date('c'),
            'status' => $balance['current_balance_sats'] == 0 ? 'balanced' : 'holding'
        ],
        'user_coins' => [
            'total_active_coins' => $userCoinsTotal['total'],
            'active_users' => $userCoinsTotal['user_count'],
            'last_activity' => $userCoinsTotal['last_activity']
        ],
        'monthly_summary' => $monthlySummary,
        'data_sources' => [
            'donations_file' => 'data/donations/donations.json',
            'distributions_file' => 'payments/data/accounts/distributions.json',
            'manual_payments_file' => 'data/manual_distributions.json'
        ]
    ];
    
    // Save report to file for caching
    file_put_contents('data/financial_report.json', json_encode($report, JSON_PRETTY_PRINT));
    
    return $report;
}

function calculateTotalUserCoins() {
    $total = 0;
    $userCount = 0;
    $lastActivity = null;
    
    $balanceDir = 'userdata/balances/';
    if (is_dir($balanceDir)) {
        foreach (glob($balanceDir . '*.txt') as $file) {
            $data = json_decode(file_get_contents($file), true);
            if ($data && isset($data['balance'])) {
                $total += $data['balance'];
                $userCount++;
                
                $fileTime = $data['last_updated'] ?? filemtime($file);
                if (!$lastActivity || $fileTime > strtotime($lastActivity)) {
                    $lastActivity = date('c', $fileTime);
                }
            }
        }
    }
    
    return [
        'total' => $total,
        'user_count' => $userCount,
        'last_activity' => $lastActivity
    ];
}

function calculateMonthlySummary() {
    $currentMonth = date('Y-m');
    
    // Get current month donations
    $donations = getDonations(); // From existing system
    $monthDonations = 0;
    $uniqueDonors = [];
    
    foreach ($donations as $donation) {
        $donationMonth = date('Y-m', strtotime($donation['confirmed_at'] ?? $donation['created_at']));
        if ($donationMonth === $currentMonth) {
            $monthDonations += $donation['amount_sats'];
            if (!empty($donation['donor_name'])) {
                $uniqueDonors[$donation['donor_name']] = true;
            }
        }
    }
    
    // Get current month distributions
    $distributions = getDistributions(); // From existing system  
    $monthDistributions = 0;
    
    foreach ($distributions as $dist) {
        $distMonth = date('Y-m', strtotime($dist['distribution_date']));
        if ($distMonth === $currentMonth && isset($dist['distributions'])) {
            foreach ($dist['distributions'] as $payment) {
                $monthDistributions += $payment['amount_sats'];
            }
        }
    }
    
    return [
        'current_month' => $currentMonth,
        'donations_this_month' => $monthDonations,
        'distributions_this_month' => $monthDistributions,
        'active_donors_this_month' => count($uniqueDonors)
    ];
}

// Main endpoint
$action = $_GET['action'] ?? 'current';

switch ($action) {
    case 'current':
    default:
        $report = generateFinancialReport();
        echo json_encode($report, JSON_PRETTY_PRINT);
        break;
}
?>
```

## User Donation Tracking

### Record User Donations (`userdata/donations/{userId}.json`)

When a user makes a donation with their username:

```json
{
    "user_id": "8-evans",
    "username": "evans",
    "donations": [
        {
            "donation_id": "donate_abc123",
            "amount_sats": 5000,
            "amount_usd": 3.50,
            "donation_date": "2025-09-30T15:30:00Z",
            "message": "Great work on the transparency!",
            "confirmed_at": "2025-09-30T15:30:30Z",
            "status": "confirmed"
        }
    ],
    "summary": {
        "total_donations": 1,
        "total_amount_sats": 5000,
        "total_amount_usd": 3.50,
        "first_donation": "2025-09-30T15:30:00Z",
        "last_donation": "2025-09-30T15:30:00Z"
    }
}
```

### Integration with Existing Donation System

```php
// Modify existing donation confirmation to also record user donation
function confirmDonation($donationData) {
    // Existing donation recording...
    
    // If donation has username, record to user profile
    if (!empty($donationData['donor_name'])) {
        recordUserDonation($donationData['donor_name'], $donationData);
    }
    
    // Update financial report
    generateFinancialReport();
}

function recordUserDonation($username, $donationData) {
    // Find user ID from session data or username
    $userId = findUserIdByUsername($username);
    if (!$userId) return;
    
    $userDonationFile = "userdata/donations/{$userId}.json";
    
    // Load existing donations
    $userData = file_exists($userDonationFile) 
        ? json_decode(file_get_contents($userDonationFile), true)
        : ['user_id' => $userId, 'username' => $username, 'donations' => [], 'summary' => []];
    
    // Add new donation
    $userData['donations'][] = [
        'donation_id' => $donationData['id'],
        'amount_sats' => $donationData['amount_sats'],
        'amount_usd' => calculateUSDEquivalent($donationData['amount_sats']),
        'donation_date' => $donationData['created_at'],
        'message' => $donationData['donor_message'] ?? '',
        'confirmed_at' => $donationData['confirmed_at'],
        'status' => 'confirmed'
    ];
    
    // Update summary
    $userData['summary'] = calculateUserDonationSummary($userData['donations']);
    
    // Save
    file_put_contents($userDonationFile, json_encode($userData, JSON_PRETTY_PRINT));
}
```

## Benefits of This Approach

1. **Simple to Start**: No rollups, no complex aggregation - just direct reporting
2. **Real-time Balance Display**: Any page can show current balances with CSS classes
3. **User Tracking**: When users donate with usernames, it's recorded to their profile
4. **Performance**: Single report file means fast loading, no complex calculations
5. **Transparency**: Complete reporting without claiming to "own" the money
6. **Scalable**: Can add rollups later if files get large (they probably won't)
7. **DirectSponsor Ready**: Foundation for future P2P direct sponsorship

## File Structure
```
data/
├── financial_report.json          # Master report file
├── donations/ (existing)
├── manual_distributions.json (existing)
└── accounts/ (existing)

userdata/
├── balances/ (existing)           # User coin balances  
└── donations/                     # User donation history
    └── {userId}.json

api/
└── financial-report.php           # Report generation API

scripts/
└── balance-reporter.js            # Auto-updating balance display
```

## Implementation Plan

### Phase 1: Master Report (Week 1)
1. Create `financial-report.php` API
2. Generate initial `financial_report.json` file  
3. Test with current data (should show 0 balance, 20802 received/distributed)

### Phase 2: Balance Display (Week 1)
1. Create `balance-reporter.js`
2. Add to transparency page as test
3. Add CSS classes to other key pages
4. Test auto-updating functionality

### Phase 3: User Integration (Week 2) 
1. Modify donation system to record user donations
2. Create user donation history files
3. Add donation history to user profiles
4. Test with user donations

## Current Implementation Status ✅

**COMPLETED (2025-09-30):**
- ✅ **Financial Totals API** (`api/financial-totals.php`) - Clean, self-contained API
- ✅ **Universal Balance Display** - Added to `site-utils.js`, shows on all pages
- ✅ **Charity Pot Widget** - Real-time display in sidebar above chat
- ✅ **Transparency Page Integration** - Updated to use new API
- ✅ **Individual Transaction Lists** - Donations and distributions display
- ✅ **Clean Architecture** - Removed conflicting old `accounts.php`

**Current Display:**
- Charity pot shows: Current: 100 sats • Total: 20,902 sats • Distributed: 20,802 sats
- Updates every 30 seconds across all pages
- Compact recipient names in distributions table

## Future Enhancements

### Phase 1: Enhanced User Profiles (Planned)
**Goal:** Make user profiles publicly accessible presentation pages that can be linked from transparency tables.

#### **Benefits:**
- **Compact Tables**: Show just "Evans" instead of "Evans - Kenya Reforestation Project"
- **Rich Details**: Full project information available via profile links
- **Privacy Options**: Users can choose minimal profiles, recipients can showcase projects
- **Better UX**: Click recipient name → detailed profile with project photos, progress, etc.

#### **Implementation Approach:**
```html
<!-- Current (compact) -->
<td><strong>Evans</strong></td>

<!-- Future (linked) -->
<td><strong><a href="/profile/evans">Evans</a></strong></td>
```

#### **Profile Enhancement Features:**
- **Public Profile Pages**: `/profile/{username}` accessible to all
- **Project Showcases**: Recipients can add photos, progress updates, impact metrics
- **Privacy Controls**: Toggle public visibility, choose what information to share
- **Donation History**: Show user's contribution history (if they opt in)
- **Contact Information**: Optional contact methods for direct communication

### Phase 2: Advanced Reporting Features
- **Export Capabilities**: CSV/PDF export of financial data
- **Date Range Filtering**: Custom period reports
- **Rollup Implementation**: If transaction volume grows significantly
- **API Extensions**: Additional endpoints for specific reporting needs

This system provides a solid foundation for transparent financial reporting while maintaining the flat-file simplicity and preparing for future direct sponsorship models.
