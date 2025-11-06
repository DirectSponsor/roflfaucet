# 🎯 ROFLFaucet Fundraiser System

## Role-Based Capabilities

### **Roles & Capabilities**
- `member` → Basic site features (default for all users)
- `recipient` → **Create fundraiser** capability 
- `fundraiser` → **Create fundraiser** capability (legacy support)
- `moderator` → **Manage fundraisers** capability
- `admin` → **All capabilities** (create + manage fundraisers)

*Note: All roles include member privileges - these are additive permissions*

### **One Active Fundraiser per Recipient**
- Recipients can have **one "current" active fundraiser** at a time
- All donations to a recipient automatically go to their active fundraiser
- Simplifies donation flow and transparency tracking
- **Overflow handling:** When fundraisers exceed their goal, excess funds are held for recipient's next fundraiser
- Full transparency: all funds tracked with complete audit trail
- Future: Support for fundraiser queuing/stacking

### **Overflow System**
Ensures every donation is accounted for:
- **Goal exceeded:** Fundraiser marked "completed", excess held in overflow
- **Next fundraiser:** Overflow automatically applied with full transparency
- **Audit trail:** Every transfer tracked with source fundraiser ID
- **Updates:** Recipients notified of overflow transfers via fundraiser updates

## API Endpoints

### **Public Endpoints**
- `GET /api/fundraiser-api.php?action=list` - List all fundraisers
- `GET /api/fundraiser-api.php?action=get&id={id}` - Get specific fundraiser
- `GET /api/fundraiser-api.php?action=current&recipient={user_id}` - Get recipient's current fundraiser

### **Authenticated Endpoints**
- `POST /api/fundraiser-api.php?action=create` - Create fundraiser (requires capability)
- `POST /api/fundraiser-api.php?action=update&id={id}` - Update fundraiser (owner/admin only)
- `POST /api/fundraiser-api.php?action=donate` - Process donation with overflow handling

## Integration Points

### **Donation Flow**
1. **Fundraiser page** → `payments/donate.html?recipient={user}&fundraiser={id}&title={title}`
2. **Donate page** automatically fetches recipient's current fundraiser if none specified
3. **Donation tracking** links to fundraiser for transparency

### **Profile Integration**
- Users with fundraiser capability see "My Fundraisers" section in profile
- Role-based UI showing/hiding fundraiser management features

### **Pages Created**
- `fundraiser.html` - Individual fundraiser display page (BTCPay-inspired design)
- `fundraisers.html` - List all fundraisers with filtering
- `test-integration.html` - Test system functionality

## Sample Data

### **LightningLova Ghana Hub** (`member-lightninglova-ghana`)
- **Roles:** `["member", "fundraiser", "recipient"]`
- **Active Fundraisers:**
  1. **Modem Funding** - One-time infrastructure ($500 goal)
  2. **Monthly Workshops** - Recurring education ($300/month goal)

### **Directory Structure**
```
/api/userdata/
├── profiles/
│   └── member-lightninglova-ghana.txt  # Profile with recipient role
└── fundraisers/
    ├── modem-funding.json              # Infrastructure fundraiser
    └── bitcoin-ghana-workshops.json   # Education fundraiser
```

## Testing

Visit `test-integration.html` to verify:
- ✅ API endpoints working
- ✅ Fundraiser pages loading
- ✅ Donation flow integration
- ✅ Role-capability system

## Next Steps

1. **Upload to server** for live testing
2. **Connect to transparency page** for donation tracking
3. **Add fundraiser creation UI** (currently shows placeholder)
4. **Integrate with existing payment system** 

## Benefits

✅ **Simplified role system** - clear capability-based permissions  
✅ **One fundraiser per recipient** - eliminates donation confusion  
✅ **Clean API integration** - works with existing flat-file architecture  
✅ **BTCPay-inspired UI** - professional fundraising pages  
✅ **Transparency-ready** - built for donation tracking integration  
✅ **Migration-ready** - easy to move to directsponsor.net later