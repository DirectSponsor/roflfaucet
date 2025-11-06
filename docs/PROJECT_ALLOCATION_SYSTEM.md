# Project Allocation System Documentation

## Overview
The project allocation system enables direct peer-to-peer donations to specific projects using recipients' read-only Coinos API keys. This provides immediate value transfer while maintaining transparency through read-only tracking. The system separates direct project donations (P2P) from general site revenue (monthly distribution).

### Coinos API Integration

```typescript
interface CoinosReadOnlyAPI {
    // Generate invoice for donation
    generateInvoice(amount: number): Promise<string>;
    
    // Check if payment was received
    checkPayment(paymentHash: string): Promise<boolean>;
    
    // Get recent transactions (for verification)
    getTransactions(limit: number): Promise<Transaction[]>;
}

interface RecipientWallet {
    id: string;
    name: string;
    readOnlyKey: string;
    projects: string[];
    status: 'active' | 'inactive';
    lastChecked: number;
}

// Example usage
async function handleProjectDonation(projectId: string, amount: number) {
    const project = await getProject(projectId);
    const recipient = await getRecipient(project.recipientId);
    
    // Initialize API with read-only key
    const api = new CoinosAPI(recipient.readOnlyKey);
    
    // Generate invoice
    const invoice = await api.generateInvoice(amount);
    
    // Wait for payment
    const paid = await waitForPayment(invoice.paymentHash);
    if (paid) {
        await updateProjectProgress(projectId, amount);
    }
}
```

### Security & API Key Management

#### Read-Only Key Security
```typescript
// Even if compromised, read-only keys can only:
// 1. Generate new invoices (receive money)
// 2. Check payment status
// 3. View transaction history

interface APIKeySecurityLimits {
    canGenerateInvoices: true;      // Can receive money
    canViewTransactions: true;       // Can see payment history
    canWithdraw: false;             // Cannot send/withdraw funds
    canModifySettings: false;        // Cannot change account settings
    canDeleteAccount: false;         // Cannot delete account
}

interface APIKeyStorage {
    key: string;
    keyHash: string;                 // Store hash instead of raw key
    lastUsed: number;
    activeProjects: string[];
    // Never store the master key or any withdrawal capabilities
}
```

#### Key Storage Best Practices
- Store key hashes rather than raw keys where possible
- Rotate keys periodically (e.g., every 6 months)
- Monitor for unusual activity (high volume of invoice generation)
- Allow recipients to invalidate and replace keys
- Keep backup contact methods for each recipient

### Recipient Onboarding Process

1. **Initial Verification**
```typescript
interface RecipientVerification {
    recipientId: string;
    name: string;
    project: string;
    contactMethods: {
        primary: string;      // Main contact method
        backup: string[];     // Backup contacts
        nostr?: string;       // Optional Nostr pubkey
    };
    verification: {
        status: 'pending' | 'verified' | 'rejected';
        documents: string[];  // List of verification documents
        verifiedBy: string;   // Admin who verified
        verifiedAt: number;   // Timestamp
    };
}
```

2. **Coinos Setup Guide for Recipients**
```markdown
# Coinos Setup Steps
1. Create Coinos account at coinos.io
2. Enable API access in settings
3. Generate READ-ONLY API key:
   ```bash
   curl -H "Authorization: Bearer YOUR_FULL_JWT" \
        https://coinos.io/api/ro
   ```
4. Provide read-only key to ROFLFaucet admin
5. Test with small verification payment
6. Begin receiving direct donations
```

3. **Automatic Verification System**
```typescript
interface VerificationCheck {
    async verifyApiKey(key: string): Promise<{
        isValid: boolean;
        isReadOnly: boolean;
        canGenerateInvoices: boolean;
        error?: string;
    }>;
    
    async testPayment(key: string): Promise<{
        success: boolean;
        paymentHash?: string;
        error?: string;
    }>;
}
```

4. **Monitoring & Alerts**
```typescript
interface RecipientMonitoring {
    // Monitor for potential issues
    alerts: {
        noActivity: number;        // Days without activity
        failedPayments: number;     // Failed payment count
        apiErrors: number;          // API error count
        lastChecked: number;        // Last monitoring timestamp
    };
    
    // Auto-detection of issues
    async checkRecipientHealth(recipientId: string): Promise<{
        status: 'healthy' | 'warning' | 'error';
        issues: string[];
        recommendations: string[];
    }>;
}
```

5. **Recovery Procedures**
```typescript
interface RecoveryOptions {
    // If API key issues occur
    async regenerateApiKey(recipientId: string): Promise<{
        newKey: string;
        oldKeyInvalidated: boolean;
        backupContactsNotified: boolean;
    }>;
    
    // If recipient loses access
    async initiateRecovery(recipientId: string): Promise<{
        recoveryId: string;
        backupContacts: string[];
        temporaryAccess: {
            key: string;
            expiresIn: number;
        };
    }>;
}
```

### Regular Maintenance

1. **Key Rotation Schedule**
- Prompt recipients for key rotation every 6 months
- Automated reminders via multiple contact methods
- Grace period for key updates (30 days)
- Fallback procedures if key not updated

2. **Health Checks**
```typescript
interface HealthCheck {
    // Daily automatic checks
    daily: {
        verifyApiAccess: boolean;
        checkRecentTransactions: boolean;
        monitorErrorRates: boolean;
    };
    
    // Weekly deep checks
    weekly: {
        fullTransactionReconciliation: boolean;
        contactMethodsVerification: boolean;
        backupSystemsTest: boolean;
    };
}
```

3. **Documentation Updates**
- Maintain guides for recipients
- Update security recommendations
- Track system changes and updates
- Keep contact information current

### Emergency Procedures

1. **API Issues**
```typescript
interface EmergencyResponse {
    // If Coinos API has issues
    async handleApiOutage(): Promise<{
        notifiedRecipients: boolean;
        temporaryMeasures: string[];
        estimatedResolution: number;
    }>;
    
    // If key compromise suspected
    async handleKeyCompromise(recipientId: string): Promise<{
        keyInvalidated: boolean;
        recipientNotified: boolean;
        newKeyGenerated: boolean;
    }>;
}
```

2. **Communication Plan**
- Multiple contact methods for each recipient
- Emergency contact hierarchy
- Public status page for system issues
- Automated notification system

### Payment Models

#### 1. Direct Project Donations (P2P)
- Recipient provides read-only Coinos API key
- Donations go straight to recipient's wallet
- System tracks via read-only API access
- Immediate value transfer
- Full transparency through API monitoring

#### 2. General Site Revenue
- Ad revenue and unallocated donations
- Held in site wallet
- Distributed monthly to projects
- Transparent reporting and tracking

## Components

### 1. Project Pages System
Located in `/site/projects/`

#### Directory Structure
```
/site/projects/
├── img/                    # Project images
│   └── project-images.jpg
├── project1.html          # Individual project pages
├── project2.html
└── index.html            # Projects listing page
```

#### Project Page Requirements
- Must include progress tracking component
- Standard layout matching site theme
- Donation button with project pre-selected
- Updates section for project status
- Verification details

### 2. Donation Allocation System

#### URL Parameter System
```javascript
// Example URL structure
/payments/donate.html?project=project-id
```

#### Flat-File Project System
Following our established flat-file architecture, each project uses individual JSON files integrated with the existing recipient accounts system.

**Project File Structure:**
```
/data/projects/
├── project-kenya-reforestation.json    # Evans' Kenya project
├── project-education-fund.json         # Future project example
└── index.json                          # Projects listing
```

**Individual Project File Format (`/data/projects/{project-id}.json`):**
```json
{
    "project_id": "project-kenya-reforestation",
    "title": "Kenya Reforestation Project", 
    "recipient_id": "evans",
    "coinos_readonly_key": "ro_key_from_evans",
    "goal_amount_sats": 100000,
    "current_amount_sats": 0,
    "status": "active",
    "created_at": "2025-09-30T18:00:00Z",
    "updated_at": "2025-09-30T18:00:00Z",
    "description": "Reforestation project in Kenya",
    "verification_status": "verified",
    "last_payment_check": "2025-09-30T17:55:00Z"
}
```

**Integration with Existing Accounts System:**
- Projects link to existing recipient accounts (like Evans in `/data/accounts/`)
- Donations with `project_id` parameter get tracked both in donations.json and project file
- No database changes needed - pure flat-file JSON system
- Maintains compatibility with current transparency and payment systems

#### API Endpoints
```typescript
interface ProjectAPI {
    // Get project details
    GET /api/projects/:id
    
    // List all projects
    GET /api/projects
    
    // Get project progress
    GET /api/projects/:id/progress
    
    // Create donation with project allocation
    POST /api/donations
    {
        amount: number,
        project_id?: string,
        donor_id: string
    }
}
```

### 3. Real-time Progress Tracking

#### Progress Bar Component
```html
<div class="project-progress">
    <div class="progress-bar">
        <div class="progress-fill" id="progress-fill-${projectId}"></div>
    </div>
    <div class="progress-stats">
        <span class="goal">Goal: $${goal}</span>
        <span class="raised">Raised: $<span id="amount-${projectId}">0</span></span>
    </div>
</div>
```

#### WebSocket Updates
```javascript
// Subscribe to project updates
socket.subscribe(`project:${projectId}:progress`);

// Handle updates
socket.on('projectProgress', (data) => {
    updateProgress(data.projectId, data.current, data.goal);
});
```

#### Progress Calculation
```javascript
function updateProgress(projectId, current, goal) {
    const percentage = Math.min((current / goal) * 100, 100);
    document.getElementById(`progress-fill-${projectId}`).style.width = `${percentage}%`;
    document.getElementById(`amount-${projectId}`).textContent = current;
}
```

### 4. Integration Points

#### 1. Donation Form
- Add project selection dropdown
- Pre-fill from URL parameter
- Show project details in form
- Update confirmation message

```javascript
// Donation form enhancement
function initDonationForm() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project');
    
    if (projectId) {
        selectProject(projectId);
        updateFormForProject(projectId);
    }
}
```

#### 2. Payment Processing
- Update payment processing to handle project allocation
- Add project verification steps
- Update project progress after payment

```javascript
async function processPayment(paymentData) {
    // Existing payment processing
    const payment = await processLightningPayment(paymentData);
    
    // If project specified, allocate payment
    if (paymentData.projectId) {
        await allocateToProject(payment.id, paymentData.projectId);
        await updateProjectProgress(paymentData.projectId);
        emitProgressUpdate(paymentData.projectId);
    }
}
```

#### 3. Verification System
- Verify project legitimacy
- Track fund distribution
- Maintain transparency

```javascript
interface ProjectVerification {
    project_id: string;
    verification_status: 'pending' | 'verified' | 'completed';
    verification_steps: {
        identity_verified: boolean;
        goal_validated: boolean;
        updates_provided: boolean;
    };
}
```

## Implementation Phases

### Phase 1: Foundation (Current)
- [x] Project page template created
- [x] Basic progress visualization
- [ ] Project database schema
- [ ] Donation form enhancement

### Phase 2: Integration
- [ ] Connect donation system
- [ ] Implement progress tracking
- [ ] Add WebSocket updates
- [ ] Create project admin interface

### Phase 3: Enhancement
- [ ] Add project categories
- [ ] Implement search/filter
- [ ] Add update notifications
- [ ] Create project analytics

## Security Considerations

### 1. Donation Verification
- Verify payment before allocation
- Check project status before accepting donations
- Validate allocation amounts

### 2. Project Verification
- Verify project creator identity
- Validate project goals and timeline
- Monitor project updates

### 3. Fund Management
- Track allocated vs unallocated funds
- Ensure proper fund distribution
- Maintain allocation history

## Testing Requirements

### Unit Tests
```javascript
describe('Project Allocation', () => {
    it('should allocate donation to correct project', async () => {
        // Test allocation logic
    });
    
    it('should update progress correctly', async () => {
        // Test progress calculation
    });
    
    it('should handle multiple simultaneous donations', async () => {
        // Test concurrency
    });
});
```

### Integration Tests
- Donation flow with allocation
- Progress update system
- WebSocket notifications
- Form pre-filling

## Deployment Considerations

### 1. Database Updates
- Add new tables
- Migrate existing data
- Update indexes

### 2. Frontend Updates
- Deploy new components
- Update donation form
- Add project pages

### 3. Monitoring
- Track allocation success rate
- Monitor progress updates
- Watch for system errors

## Future Enhancements

### Planned Features
1. Project categories and tags
2. Advanced search/filter
3. Project updates notifications
4. Donor recognition system
5. Project milestones
6. Social sharing integration

## Migration Notes
- Existing donations remain unallocated
- New donations can optionally specify project
- Project pages deployed incrementally
- Progress tracking added to active projects
