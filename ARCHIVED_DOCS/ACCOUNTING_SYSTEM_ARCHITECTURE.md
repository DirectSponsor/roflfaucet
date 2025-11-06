# ROFLFaucet Comprehensive Accounting System Architecture

## Overview
A flat-file based accounting system with rollup aggregation for performance and long-term statistics. Designed to handle all financial flows through the site with complete transparency and audit trails.

## Current State Analysis

### Existing Components ✅
- **Donations System**: `data/donations/donations.json` - Individual donation records
- **User Balances**: `userdata/balances/{userId}.txt` - Individual user coin balances  
- **Distributions**: `payments/data/accounts/distributions.json` - Charity distributions
- **Manual Payments**: `data/manual_distributions.json` - Manual payment tracking
- **Balance APIs**: Various APIs for reading/updating balances
- **Transaction Logging**: Basic transaction recording in user files

### Missing Components 🔧
- **Master Balance File**: Centralized balance tracking with rollups
- **Transaction Journal**: Complete transaction history with references
- **Balance Display System**: Universal balance injection for UI
- **User Transaction History**: User-specific transaction records
- **Automated Rollup System**: Hourly/daily/monthly aggregation
- **Audit Trail System**: Complete financial audit capabilities

## Architecture Design

### 1. Master Balance File (`data/master_balance.json`)

```json
{
    "current_timestamp": "2025-09-30T17:46:00Z",
    "charity_fund": {
        "current_balance_sats": 0,
        "total_inflows_sats": 20802,
        "total_outflows_sats": 20802,
        "last_transaction_id": "txn_20250930_001",
        "last_updated": "2025-09-30T17:34:00Z"
    },
    "user_balances": {
        "total_user_coins": 1250000,
        "total_active_users": 45,
        "last_user_transaction_id": "user_txn_20250930_155",
        "last_updated": "2025-09-30T17:45:30Z"
    },
    "rollups": {
        "hourly": "data/rollups/2025/09/30/17.json",
        "daily": "data/rollups/2025/09/30.json", 
        "monthly": "data/rollups/2025/09.json"
    },
    "metadata": {
        "version": "2.0",
        "created": "2025-09-30T17:46:00Z",
        "system": "ROFLFaucet Comprehensive Accounting"
    }
}
```

### 2. Transaction Journal (`data/transactions/journal_{YYYY-MM}.json`)

```json
{
    "month": "2025-09",
    "transactions": [
        {
            "id": "txn_20250930_001",
            "timestamp": "2025-09-30T17:34:00Z",
            "type": "charity_distribution",
            "category": "outflow",
            "amount_sats": 20802,
            "from_system": "charity_fund",
            "to_external": "Evans - Kenya Reforestation",
            "reference_id": "dist_2025_09_evans",
            "user_id": null,
            "description": "Monthly charity distribution",
            "metadata": {
                "distribution_file": "payments/data/accounts/distributions.json",
                "manual_payment_file": "data/manual_distributions.json",
                "admin_user": "andy"
            }
        },
        {
            "id": "user_txn_20250930_155",
            "timestamp": "2025-09-30T17:45:30Z", 
            "type": "user_activity_reward",
            "category": "user_credit",
            "amount_coins": 50,
            "from_system": "faucet_pool",
            "to_user": "evans",
            "reference_id": "activity_20250930_155",
            "user_id": "8-evans",
            "description": "Daily activity bonus",
            "metadata": {
                "activity_type": "chat_participation",
                "balance_file": "userdata/balances/8-evans.txt"
            }
        }
    ],
    "summary": {
        "total_transactions": 2,
        "charity_inflows": 0,
        "charity_outflows": 20802,
        "user_credits": 50,
        "user_debits": 0
    }
}
```

### 3. Rollup System Architecture

#### Hourly Rollups (`data/rollups/{YYYY}/{MM}/{DD}/{HH}.json`)
```json
{
    "hour": "2025-09-30T17",
    "charity_fund": {
        "opening_balance": 20802,
        "closing_balance": 0,
        "inflows": 0,
        "outflows": 20802,
        "transaction_count": 1
    },
    "user_activity": {
        "total_credits": 2500,
        "total_debits": 1200,
        "net_change": 1300,
        "active_users": 12,
        "transaction_count": 67
    },
    "transaction_ids": [
        "txn_20250930_001",
        "user_txn_20250930_155"
    ]
}
```

#### Daily Rollups (`data/rollups/{YYYY}/{MM}/{DD}.json`)
Aggregates all hourly rollups for the day.

#### Monthly Rollups (`data/rollups/{YYYY}/{MM}.json`)
Aggregates all daily rollups for the month.

### 4. Balance Display System

#### Universal Balance Injection
```javascript
// scripts/balance-injector.js
class BalanceInjector {
    constructor() {
        this.balanceData = null;
        this.updateInterval = 30000; // 30 seconds
        this.init();
    }

    async init() {
        await this.fetchBalances();
        this.injectBalances();
        this.setupAutoUpdate();
    }

    async fetchBalances() {
        const response = await fetch('/api/master-balance.php');
        this.balanceData = await response.json();
    }

    injectBalances() {
        // Inject charity fund balance
        document.querySelectorAll('.charity-balance').forEach(el => {
            el.textContent = this.formatSats(this.balanceData.charity_fund.current_balance_sats);
        });

        // Inject total received
        document.querySelectorAll('.charity-total-received').forEach(el => {
            el.textContent = this.formatSats(this.balanceData.charity_fund.total_inflows_sats);
        });

        // Inject total distributed  
        document.querySelectorAll('.charity-total-distributed').forEach(el => {
            el.textContent = this.formatSats(this.balanceData.charity_fund.total_outflows_sats);
        });

        // Inject user stats
        document.querySelectorAll('.total-user-coins').forEach(el => {
            el.textContent = this.formatCoins(this.balanceData.user_balances.total_user_coins);
        });
    }

    formatSats(sats) {
        return new Intl.NumberFormat().format(sats) + ' sats';
    }

    formatCoins(coins) {
        return new Intl.NumberFormat().format(coins) + ' coins';
    }
}

// Auto-initialize on pages with balance elements
if (document.querySelector('.charity-balance, .charity-total-received, .charity-total-distributed, .total-user-coins')) {
    new BalanceInjector();
}
```

#### HTML Usage Examples
```html
<!-- Inline balance display -->
<p>Current charity fund: <span class="charity-balance">Loading...</span></p>

<!-- Total stats -->
<div class="stats">
    <div>Total Received: <span class="charity-total-received">Loading...</span></div>
    <div>Total Distributed: <span class="charity-total-distributed">Loading...</span></div>
    <div>Active User Coins: <span class="total-user-coins">Loading...</span></div>
</div>

<!-- Dashboard widget -->
<div class="balance-widget">
    <h3>Charity Fund Status</h3>
    <div class="balance-amount charity-balance">Loading...</div>
</div>
```

### 5. User Transaction History (`userdata/transactions/{userId}.json`)

```json
{
    "user_id": "8-evans",
    "username": "evans", 
    "transactions": [
        {
            "id": "user_txn_20250930_155",
            "timestamp": "2025-09-30T17:45:30Z",
            "type": "activity_reward",
            "amount_coins": 50,
            "balance_before": 1200,
            "balance_after": 1250,
            "description": "Daily activity bonus",
            "reference_id": "activity_20250930_155"
        }
    ],
    "summary": {
        "total_transactions": 156,
        "total_earned": 12500,
        "total_spent": 8750,
        "current_balance": 3750,
        "first_transaction": "2025-08-15T10:30:00Z",
        "last_transaction": "2025-09-30T17:45:30Z"
    }
}
```

### 6. API Endpoints

#### Master Balance API (`api/master-balance.php`)
- `GET ?action=current` - Current balances
- `GET ?action=rollup&period=hourly|daily|monthly&date=YYYY-MM-DD` - Rollup data
- `POST ?action=record_transaction` - Record new transaction

#### Transaction API (`api/transactions.php`)
- `GET ?action=journal&month=YYYY-MM` - Transaction journal
- `GET ?action=user_history&user_id=X` - User transaction history
- `POST ?action=record` - Record transaction

#### Balance Injection API (`api/balance-inject.php`)
- `GET` - Returns JSON for balance injection system

### 7. Integration Points

#### Donation System Integration
```php
// When donation is confirmed
function recordDonation($donationData) {
    // Existing donation recording...
    
    // Record in transaction journal
    $transaction = [
        'id' => 'txn_' . date('Ymd_His'),
        'timestamp' => date('c'),
        'type' => 'charity_donation',
        'category' => 'inflow',
        'amount_sats' => $donationData['amount_sats'],
        'from_external' => $donationData['donor_name'],
        'to_system' => 'charity_fund',
        'reference_id' => $donationData['id'],
        'user_id' => $donationData['user_id'] ?? null,
        'description' => 'Charity donation',
        'metadata' => [
            'donation_file' => 'data/donations/donations.json',
            'donor_message' => $donationData['donor_message'] ?? ''
        ]
    ];
    
    recordTransaction($transaction);
    updateMasterBalance();
    
    // If user provided username, record to their transaction history
    if ($donationData['user_id']) {
        recordUserTransaction($donationData['user_id'], [
            'type' => 'donation_made',
            'amount_sats' => $donationData['amount_sats'],
            'description' => 'Donation to charity fund'
        ]);
    }
}
```

#### User Balance Integration
```php
// When user balance changes
function updateUserBalance($userId, $amount, $source, $description) {
    // Existing balance update...
    
    // Record transaction
    $transaction = [
        'id' => 'user_txn_' . date('Ymd_His'),
        'timestamp' => date('c'),
        'type' => $source,
        'category' => $amount > 0 ? 'user_credit' : 'user_debit',
        'amount_coins' => abs($amount),
        'from_system' => $amount > 0 ? 'faucet_pool' : 'user_balance',
        'to_system' => $amount > 0 ? 'user_balance' : 'system_pool',
        'user_id' => $userId,
        'description' => $description
    ];
    
    recordTransaction($transaction);
    updateMasterBalance();
    recordUserTransaction($userId, $transaction);
}
```

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
1. Create master balance file structure
2. Build transaction journal system  
3. Create basic rollup structure
4. Build master balance API

### Phase 2: Balance Display System (Week 2)
1. Create balance injection JavaScript
2. Update existing pages with balance classes
3. Test auto-updating balance display
4. Add balance widgets to key pages

### Phase 3: Integration (Week 3)
1. Integrate donation system with transaction journal
2. Integrate user balance system
3. Add user transaction history tracking
4. Build user transaction history API

### Phase 4: Rollups & Analytics (Week 4)
1. Build automated rollup system
2. Create rollup maintenance scripts
3. Add analytics endpoints
4. Build admin dashboard for financial overview

## File Structure
```
data/
├── master_balance.json
├── transactions/
│   └── journal_{YYYY-MM}.json
├── rollups/
│   └── {YYYY}/
│       └── {MM}/
│           ├── {DD}.json (daily)
│           └── {DD}/
│               └── {HH}.json (hourly)
├── donations/ (existing)
├── manual_distributions.json (existing)
└── accounts/ (existing)

userdata/
├── balances/ (existing)
└── transactions/
    └── {userId}.json

api/
├── master-balance.php
├── transactions.php
└── balance-inject.php

scripts/
└── balance-injector.js
```

## Benefits

1. **Single Source of Truth**: Master balance file eliminates calculation inconsistencies
2. **Performance**: Rollups prevent scanning large files for statistics
3. **Audit Trail**: Complete transaction history with references
4. **User Experience**: Real-time balance updates throughout site
5. **Scalability**: System handles growth without performance degradation
6. **Transparency**: Complete financial transparency with audit capabilities
7. **Integration**: Easy integration with existing and future systems

## Maintenance

- **Hourly**: Automated rollup generation
- **Daily**: Balance reconciliation checks
- **Monthly**: Archive old transaction journals
- **Quarterly**: System health checks and optimization

This system provides a robust foundation for all financial operations while maintaining the flat-file approach and ensuring complete transparency.