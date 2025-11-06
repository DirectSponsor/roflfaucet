# ROFLFaucet Accounts System Integration

## 🎯 **Overview**

This document captures the integration between ROFLFaucet's existing accounts system and the new Lightning donation system, demonstrating how member login status enhances the donation experience with automatic username detection and transparent contribution tracking.

## 🔐 **Login Detection System**

### **Core Function: `getValidUsername()`**
```javascript
function getValidUsername() {
    try {
        // Check main session data first
        const sessionData = localStorage.getItem('roflfaucet_session');
        if (sessionData) {
            const data = JSON.parse(sessionData);
            // Check if session has expired
            if (data.expires && Date.now() > data.expires) {
                return null; // Session expired
            }
            return data.username;
        }
        
        // Fallback to individual username item
        return localStorage.getItem('username');
    } catch (error) {
        return localStorage.getItem('username'); // Safe fallback
    }
}
```

### **Session Data Structure**
```javascript
// localStorage['roflfaucet_session']
{
    username: "member_name",
    user_id: 123,
    combined_user_id: "123-member_name", 
    expires: 1727123456789, // timestamp
    // ... other session data
}
```

## ⚡ **Smart Donation Name System**

### **Dynamic UI Based on Login Status**

#### **For Logged-In Members:**
- **Automatic username detection** using existing session
- **One-click donation** with username pre-filled
- **Option to customize** name or go anonymous
- **Clean UX** with username button: "Donating as: [username]"

#### **For Guests:**
- **Custom name input** with optional entry
- **Login prompt** with direct link to auth system
- **Anonymous option** by leaving field blank
- **Helpful guidance** about member benefits

### **Implementation in Donation System**

#### **HTML Structure:**
```html
<div class="donor-input" id="donorInput">
    <!-- For logged-in users -->
    <div id="loggedInDonor" style="display: none;">
        <div>Donating as:</div>
        <button id="usernameBtn" class="username-btn">
            <span id="currentUsername"></span>
        </button>
        <div>Click to use different name or donate anonymously</div>
    </div>
    
    <!-- For guests or custom input -->
    <div id="customDonor">
        <input type="text" id="donorName" placeholder="Your name (optional - leave blank for anonymous)">
        <div>💡 <strong>Members:</strong> <a href="#" onclick="handleLogin()">Login</a> to use your username automatically</div>
    </div>
</div>
```

#### **JavaScript Logic:**
```javascript
setupDonorInput() {
    const username = getValidUsername();
    const loggedInDiv = document.getElementById('loggedInDonor');
    const customDiv = document.getElementById('customDonor');
    
    if (username) {
        // Show username button for logged-in users
        document.getElementById('currentUsername').textContent = username;
        loggedInDiv.style.display = 'block';
        customDiv.style.display = 'none';
        this.useUsername = true;
    } else {
        // Show custom input for guests
        loggedInDiv.style.display = 'none';
        customDiv.style.display = 'block';
        this.useUsername = false;
    }
}
```

## 🏦 **Authentication Integration**

### **Login Redirect System**
```javascript
function handleLogin() {
    const currentUrl = window.location.origin + window.location.pathname;
    const authUrl = `https://auth.directsponsor.org/jwt-login.php?redirect_uri=${encodeURIComponent(currentUrl)}`;
    window.location.href = authUrl;
}
```

### **Seamless User Experience**
1. **Guest visits donation page** → Sees custom input with login hint
2. **Clicks login link** → Redirected to auth server
3. **Completes login** → Returns to donation page  
4. **Page refreshes** → Now sees username button ready to use
5. **Proceeds with donation** → Username automatically attached

## 💎 **Benefits Achieved**

### **For Members:**
- **Effortless donations** - Username pre-filled automatically
- **Recognition** - Contributions visible with their name
- **Flexibility** - Can still customize or go anonymous
- **Trust building** - Can verify their donations in transparency reports

### **For Guests:**
- **Easy anonymous donations** - No barriers to contribute
- **Clear login benefits** - Understand advantages of membership
- **Smooth conversion path** - One-click login from donation page

### **For ROFLFaucet:**
- **Enhanced transparency** - Real names attached to contributions
- **Member engagement** - Login system integrated with donations
- **Community building** - Members feel recognized for contributions
- **Conversion opportunity** - Guests encouraged to join

## 📊 **Data Flow Integration**

### **Donation Record Structure**
```json
{
    "id": "donate_abc123...",
    "donor_name": "member_username", // Auto-filled for logged-in users
    "amount_sats": 50000,
    "donor_message": "Donation of 50,000 sats ($35.00)",
    "created_at": "2025-09-25T13:45:00Z",
    "confirmed_at": "2025-09-25T13:45:30Z",
    "status": "paid"
}
```

### **Transparency Benefits**
- **Member contributions visible** in public donation records
- **Verifiable donations** - members can confirm their contributions
- **Community recognition** - supporters acknowledged publicly
- **Complete accountability** - every donation trackable

## 🎮 **User Experience Flow**

### **Logged-In Member Flow:**
1. **Visits donation page** → Username automatically detected
2. **Sees "Donating as: [username]"** → Confirms identity
3. **Uses calculator keypad** → Enters amount  
4. **Clicks Continue** → Username attached automatically
5. **Completes Lightning payment** → Donation recorded with name
6. **Views transparency reports** → Sees their contribution listed

### **Guest Flow:**
1. **Visits donation page** → Sees custom name input
2. **Notices login hint** → "Members: Login to use username automatically"
3. **Can donate anonymously** → Or click login for member benefits
4. **If logs in** → Returns to page with username ready
5. **Completes donation** → Either anonymous or with chosen name

## 🔧 **Technical Implementation Notes**

### **Key Integration Points:**
- **Session detection** using existing `roflfaucet_session` localStorage
- **Dynamic UI rendering** based on login status
- **Seamless auth integration** with return redirect
- **Fallback handling** for expired sessions or errors

### **Security Considerations:**
- **Client-side only** username detection (no sensitive data exposed)
- **Session expiry handled** gracefully with automatic logout
- **Fallback mechanisms** ensure system works even if session fails

### **Future Enhancement Opportunities:**
- **Donation history** in member profiles
- **Donation leaderboards** for community engagement  
- **Monthly/yearly contribution summaries** for members
- **Special recognition** for top contributors
- **Donation goals and progress tracking** for members

## 🚀 **Current Status**

✅ **Implemented and Live:**
- Smart donor name detection based on login status
- Seamless integration with existing auth system
- Dynamic UI adaptation for members vs guests
- Clean user experience with flexibility options

✅ **Working Components:**
- Login detection using existing session system
- Username auto-fill for logged-in members
- Custom name input for guests and flexibility
- Direct integration with Lightning donation system

This integration successfully bridges the accounts system with the donation system, creating a seamless and engaging experience that encourages both anonymous contributions and member recognition.

## 🏦 **Custodial Flow Financial System**

### **Operating Model: Pure Pass-Through**
ROFLFaucet operates as a **custodial service**, not a revenue business:
- **Donations received** → Held temporarily in hot wallet
- **Monthly distribution** → 100% sent to verified charity projects
- **Zero profit retention** → Complete pass-through model
- **Full transparency** → Every sat accounted for publicly

### **Legal/Philosophical Framework**
- **Not a business** → Charitable distribution mechanism
- **Custodial service** → Like Lightning routing or poker room
- **Hot wallet policy** → Minimize retention, distribute ASAP
- **DirectSponsor.net integration** → Future direct peer-to-peer connections

## 🛡️ **SECURITY UPGRADE: Read-Only JWT (PRIORITY)**

### **Critical Security Enhancement Available**
Coinos.io now provides **read-only JWT tokens** that eliminate withdrawal risk:

```bash
# Generate read-only JWT (invoice/payment access only)
curl -H "Authorization: Bearer YOUR_FULL_JWT" https://coinos.io/api/ro
```

### **Security Comparison:**

#### **Current Setup (Higher Risk):**
```
❌ Full API key stored on production server
❌ Can create invoices AND withdraw funds
❌ Server compromise = wallet drainage risk
```

#### **Upgraded Setup (Secure):**
```
✅ Read-only JWT on production server  
✅ Can create invoices and check payments
❌ CANNOT withdraw funds or update account
✅ Server compromise ≠ wallet loss
```

### **Implementation Steps:**
1. **Generate read-only JWT** using existing full JWT
2. **Update production environment** variables
3. **Test donation system** with read-only permissions
4. **Store full JWT offline** for emergency use only

### **Risk Mitigation:**
This upgrade **eliminates the primary attack vector** for custodial Lightning systems - even with full server access, attackers cannot drain the Lightning wallet.

**Status:** 🔥 **HIGH PRIORITY** - Deploy before significant donation volume

### **Accounts Structure**

#### **INFLOWS (Donations)**
```json
{
    "monthly_inflows": {
        "2025-09": {
            "donations": [
                {
                    "donor_name": "member_username",
                    "amount_sats": 50000,
                    "date": "2025-09-25T13:45:00Z",
                    "type": "donation"
                }
            ],
            "total_sats": 50000,
            "total_usd_equivalent": 35.00
        }
    }
}
```

#### **OUTFLOWS (Charitable Distributions)**
```json
{
    "monthly_distributions": {
        "2025-09": {
            "distributions": [
                {
                    "recipient": "Evans Food Forest Project",
                    "amount_sats": 25000,
                    "date": "2025-09-30T23:59:00Z",
                    "transaction_id": "abc123...",
                    "proof": "lightning_receipt_url"
                },
                {
                    "recipient": "Grant & Annegret Desert Farm",
                    "amount_sats": 25000,
                    "date": "2025-09-30T23:59:00Z",
                    "transaction_id": "def456...",
                    "proof": "lightning_receipt_url"
                }
            ],
            "total_distributed": 50000,
            "distribution_date": "2025-09-30"
        }
    }
}
```

#### **BALANCE (Hot Wallet Status)**
```json
{
    "current_balance": {
        "sats_available": 1500,
        "month_to_date_inflows": 51500,
        "month_to_date_outflows": 50000,
        "next_distribution_date": "2025-10-31",
        "days_until_distribution": 36
    }
}
```

### **Monthly Distribution Process**
1. **End of month** → Calculate total donations received
2. **Split distribution** → Send to verified charity projects
3. **Create receipts** → Record transaction proofs
4. **Update accounts** → Public transparency report
5. **Reset balance** → Start fresh month at near-zero

### **Future DirectSponsor.net Integration**
- **Member voting** → Choose which projects to support
- **Direct connections** → Members can contact project recipients
- **Verification system** → Projects verified through DirectSponsor
- **Impact tracking** → See real results from donations

## 🤝 **Future Direct Sponsorship Model**

### **Human-Scale Group Sponsorship**
Evolution from simple pass-through to **direct peer-to-peer sponsorship groups**:

#### **Group Structure:**
- **Small sponsorship circles** → 10 sponsors maximum per recipient
- **Meaningful contribution** → $10/month per sponsor ($100/month total)
- **Human connection** → Direct communication with recipient
- **Life-changing impact** → $100/month enables major life changes in developing regions

#### **Example: Kenya Permaculture Project**
```
👥 Sponsorship Group: "Evans Food Forest Supporters"
📍 Recipient: Evans (Kenya) - Permaculture blog with video updates
💰 Monthly Target: $100 (10 sponsors × $10 each)
📺 Updates: Regular video reports on DirectSponsor Nostr site
🎯 Goal: Enable full-time focus on sustainable farming project
```

### **Group Project Collaboration**
Sponsorship groups can **combine for larger initiatives**:

#### **Example: Artisan Workshop Collective**
```
👥 Combined Groups: 8 individual recipients
💰 Monthly Pool: $800 (80 sponsors × $10 each)
🎯 Shared Goal: Rent craft workshop space for artisan collective
📈 Impact: Enable 8 people to produce and sell crafts professionally
🏢 Facility: Shared workshop, tools, marketing support
```

### **Technical Implementation: Flat-File Evolution**

#### **Current Simple Model (ROFLFaucet):**
```json
// donations.json - Simple pass-through
{
    "donor_name": "member123",
    "amount_sats": 5000,
    "recipient": "charity_pool",
    "type": "donation"
}
```

#### **Future Direct Sponsorship Model:**
```json
// sponsorships.json - Direct P2P tracking
{
    "sponsor_member_id": "M#7842",         // Anonymous but verifiable
    "recipient_project_id": "Evans_Kenya_Permaculture",
    "amount_sats": 67000,                  // ~$10 USD equivalent
    "payment_hash": "lnbc123...",         // Lightning proof
    "sender_reported": "2025-10-15T12:00:00Z",
    "recipient_confirmed": "2025-10-15T12:30:00Z",
    "status": "confirmed",
    "group_commitment": {
        "group_id": "Evans_Food_Forest_Supporters",
        "total_sponsors": 10,
        "monthly_target_sats": 670000,     // $100 total
        "current_month_funded_sats": 670000,
        "funding_complete": true
    },
    "recipient_update": {
        "video_url": "nostr:note1abc...",
        "blog_post": "Progress report: 500 new seedlings planted",
        "impact_metrics": "Trees planted: 2,500 | Food produced: 50kg/week"
    }
}
```

#### **Group Projects Structure:**
```json
// group_projects.json - Collaborative initiatives
{
    "project_id": "Kenya_Artisan_Workshop_2025",
    "project_name": "Nakuru Craft Workshop Collective",
    "participating_recipients": [
        "Sarah_Ceramics_Kenya",
        "James_Woodwork_Kenya",
        "Mary_Textiles_Kenya"
        // ... 5 more artisans
    ],
    "monthly_requirement_sats": 5360000,   // $800 USD
    "participating_sponsor_groups": 8,
    "total_sponsors": 80,
    "shared_goals": {
        "workshop_rent": "$300/month",
        "shared_tools": "$200/month",
        "marketing_fund": "$150/month",
        "materials_fund": "$150/month"
    },
    "impact_tracking": {
        "artisans_employed": 8,
        "products_created_monthly": 150,
        "average_income_increase": "400%",
        "economic_multiplier": "Supporting 32 family members"
    }
}
```

### **Privacy & Transparency Model**

#### **Public Transparency Records:**
```json
// public_sponsorship_summary.json
{
    "month": "2025-10",
    "anonymous_contributions": [
        {
            "sponsor_id": "M#7842",        // Only you know this is you
            "amount": "$10.00",
            "recipient_project": "Evans_Kenya_Permaculture",
            "confirmation_status": "confirmed"
        }
    ],
    "project_summaries": {
        "total_projects_funded": 25,
        "total_monthly_impact": "$2,500",
        "countries_supported": ["Kenya", "Ghana", "Philippines"],
        "project_categories": {
            "permaculture": 8,
            "artisan_cooperatives": 6,
            "education_initiatives": 11
        }
    }
}
```

### **Advantages of Human-Scale Model**

#### **For Sponsors:**
- **Affordable commitment** → $10/month manageable for most people
- **Real relationship** → Direct contact with recipient
- **Verifiable impact** → See exactly how your $10 makes a difference
- **Community feeling** → Part of small, caring group
- **Privacy preserved** → Anonymous in public records, identifiable to yourself

#### **For Recipients:**
- **Life-changing amount** → $100/month transforms life in developing regions
- **Human connection** → Know your supporters personally
- **Reliable income** → Consistent monthly support enables long-term planning
- **Dignity preserved** → Peer-to-peer relationship, not charity dependency
- **Growth opportunity** → Can collaborate with other recipients for larger projects

#### **For System:**
- **Scalable simplicity** → Flat-file system handles thousands of $10 transactions
- **Cryptographic proof** → Lightning Network provides transaction verification
- **Full transparency** → Every sat tracked, every relationship visible
- **No middlemen** → Direct P2P transfers, zero administrative overhead
- **Community driven** → Members choose and verify projects together

### **Flat-File System Scalability**
The same simple JSON architecture scales beautifully:
- **1,000 sponsors** × $10 = $10,000/month impact
- **100 projects** supported simultaneously
- **File sizes remain manageable** → Even 10,000 records = ~5MB JSON files
- **Lightning fast processing** → Simple arithmetic, no complex database queries
- **Backup and sync friendly** → Entire system fits in a few megabytes

This evolution maintains the **pure simplicity** of the current custodial flow model while enabling **direct human connections** and **life-changing impact** at a completely manageable scale.

---

## 🔮 **Future Enhancements**

### **Transparency Page Improvements** (Planned: Early October 2024)

**Current Status:** ✅ Table-based layout complete, mobile-responsive down to 390px

**Next Phase:** Pagination and sorting for large datasets

#### **Planned Structure:**
- **Main transparency.html:** Quick summary + recent 10-20 items only  
- **New dedicated pages:**
  - `/transparency-donations.html` - Full donation history (no sidebars for more space)
  - `/transparency-distributions.html` - Full distribution history (no sidebars)

#### **Technical Approach:**
- **Keep lightweight:** HTML tables + vanilla JavaScript (no complex libraries)
- **API enhancements:** Add `?limit=20&sort=desc` parameters for recent-first display
- **Simple pagination:** Previous/Next buttons or page numbers
- **Column sorting:** Click table headers to sort client-side
- **Navigation:** "View Full History" links from main summary page

#### **User Experience Benefits:**
- **Fast main page:** Users can quickly find their recent donations
- **Complete transparency:** Full detailed history available when needed  
- **Mobile optimized:** Maintains accessibility and performance on all devices
- **Immediate gratification:** Contributors see their donation appear at top of recent list

#### **Implementation Priority:**
1. **API modifications** for limit/sort parameters
2. **Main page updates** to show recent-only with "View More" links
3. **Dedicated history pages** without sidebar clutter
4. **Simple JavaScript** for client-side sorting and pagination

*This enhancement will make the transparency system scale gracefully as donation volume grows while keeping the core user experience fast and accessible.*

---

## 📋 **MANUAL PAYMENT DISTRIBUTION SYSTEM** (NEW - End-of-Month 2025-09)

### **🚨 URGENT REQUIREMENT**
**Status:** Needs completion for September 2025 end-of-month distribution

### **System Overview**
Manual payment distribution system for end-of-month charitable distributions:
- **Recipients:** Like Evans (Kenya reforestation project)
- **Payment method:** Manual via Coinos wallet (external to site)
- **Verification:** Recipient confirmation + screenshot proof system

### **Required Components**

#### **1. Admin Payment Entry Interface**
```html
<!-- Admin interface for recording manual payments -->
<div class="admin-payment-entry">
    <h3>Record Manual Payment</h3>
    <form id="manual-payment-form">
        <select name="recipient" required>
            <option value="evans">Evans - Kenya Reforestation Project</option>
            <!-- Add more recipients -->
        </select>
        
        <input type="number" name="amount_sats" placeholder="Amount in sats" required>
        <input type="number" name="amount_usd" placeholder="USD equivalent" step="0.01" required>
        
        <input type="file" name="payment_screenshot" accept="image/*" required>
        <textarea name="admin_notes" placeholder="Payment notes/details"></textarea>
        
        <input type="datetime-local" name="payment_date" required>
        <button type="submit">Record Payment</button>
    </form>
</div>
```

#### **2. Recipient Confirmation Form**
```html
<!-- Public form for recipients to confirm payment receipt -->
<div class="recipient-confirmation">
    <h3>Confirm Payment Receipt</h3>
    <form id="confirmation-form">
        <input type="text" name="recipient_code" placeholder="Your recipient code" required>
        <input type="number" name="expected_amount" placeholder="Expected amount (USD)" step="0.01" required>
        
        <div class="confirmation-options">
            <label><input type="radio" name="status" value="received"> ✅ Payment Received</label>
            <label><input type="radio" name="status" value="partial"> ⚠️ Partial Amount Received</label>
            <label><input type="radio" name="status" value="not_received"> ❌ Payment Not Received</label>
        </div>
        
        <textarea name="recipient_notes" placeholder="Additional comments (optional)"></textarea>
        <button type="submit">Confirm Receipt</button>
    </form>
</div>
```

#### **3. Data Structure for Manual Payments**
```json
{
    "manual_distributions": {
        "2025-09": {
            "payments": [
                {
                    "payment_id": "manual_2025_09_001",
                    "recipient": "evans",
                    "recipient_name": "Evans - Kenya Reforestation Project",
                    "amount_sats": 67000,
                    "amount_usd": 45.00,
                    "payment_date": "2025-09-30T23:59:00Z",
                    "admin_recorded_at": "2025-09-30T14:30:00Z",
                    "payment_method": "coinos_manual",
                    "screenshot_path": "/uploads/payment_proof/manual_2025_09_001.png",
                    "admin_notes": "Monthly distribution for September 2025",
                    "status": "sent",
                    "recipient_confirmation": {
                        "confirmed_at": null,
                        "confirmation_status": "pending",
                        "recipient_notes": null
                    }
                }
            ],
            "total_sent": 67000,
            "total_usd": 45.00,
            "distribution_complete": false
        }
    }
}
```

#### **4. PHP Backend Implementation**
```php
<?php
// admin_record_payment.php
function recordManualPayment($data, $screenshot) {
    $paymentId = 'manual_' . date('Y_m') . '_' . str_pad(getNextPaymentNumber(), 3, '0', STR_PAD_LEFT);
    
    // Upload screenshot
    $screenshotPath = uploadPaymentProof($screenshot, $paymentId);
    
    // Create payment record
    $payment = [
        'payment_id' => $paymentId,
        'recipient' => $data['recipient'],
        'amount_sats' => intval($data['amount_sats']),
        'amount_usd' => floatval($data['amount_usd']),
        'payment_date' => $data['payment_date'],
        'admin_recorded_at' => date('c'),
        'screenshot_path' => $screenshotPath,
        'admin_notes' => $data['admin_notes'],
        'status' => 'sent',
        'recipient_confirmation' => [
            'confirmed_at' => null,
            'confirmation_status' => 'pending',
            'recipient_notes' => null
        ]
    ];
    
    // Save to JSON file
    saveManualPayment($payment);
    
    return $paymentId;
}

// recipient_confirm.php  
function confirmPaymentReceipt($recipientCode, $confirmationData) {
    $payment = findPaymentByRecipient($recipientCode);
    
    if ($payment) {
        $payment['recipient_confirmation'] = [
            'confirmed_at' => date('c'),
            'confirmation_status' => $confirmationData['status'],
            'recipient_notes' => $confirmationData['notes']
        ];
        
        updatePaymentConfirmation($payment);
        return true;
    }
    
    return false;
}
?>
```

#### **5. Integration with Transparency System**
```javascript
// Add manual payments to transparency display
function displayManualDistributions(distributions) {
    const container = document.getElementById('manual-distributions');
    
    distributions.forEach(payment => {
        const row = document.createElement('div');
        row.className = 'distribution-row';
        
        const confirmationIcon = getConfirmationIcon(payment.recipient_confirmation.confirmation_status);
        
        row.innerHTML = `
            <div class="recipient">${payment.recipient_name}</div>
            <div class="amount">$${payment.amount_usd.toFixed(2)} (${payment.amount_sats.toLocaleString()} sats)</div>
            <div class="date">${new Date(payment.payment_date).toLocaleDateString()}</div>
            <div class="status">${confirmationIcon} ${payment.recipient_confirmation.confirmation_status}</div>
        `;
        
        container.appendChild(row);
    });
}

function getConfirmationIcon(status) {
    switch(status) {
        case 'received': return '✅';
        case 'partial': return '⚠️';
        case 'not_received': return '❌';
        case 'pending': return '🔄';
        default: return '❓';
    }
}
```

### **Implementation Priority**
1. **Admin payment entry form** - Record Evans payment immediately
2. **Screenshot upload system** - Proof storage
3. **Recipient confirmation page** - Simple form for Evans to confirm
4. **Integration with transparency** - Show manual distributions publicly
5. **Testing with Evans** - Verify entire workflow

### **Security Considerations**
- **Screenshot storage** - Secure upload directory, validate file types
- **Recipient codes** - Simple but unique identifiers (not guessable)
- **Admin access** - Proper authentication for payment entry
- **Data validation** - Sanitize all inputs, validate amounts

### **User Experience Flow**
1. **Admin (Andy)** - Records manual payment with screenshot
2. **System** - Generates unique payment record
3. **Recipient (Evans)** - Visits confirmation page, enters details
4. **System** - Updates payment status, shows on transparency page
5. **Public** - Can see confirmed distributions in transparency reports

---

*Document updated: 2025-09-30 - Added manual payment distribution system for end-of-month processing*
