# Project Donations System

## Overview
The project donations system enables direct peer-to-peer fundraising for specific projects using recipients' read-only Coinos API keys, while maintaining full transparency and verification through our existing systems.

### Direct Payment Model
- Recipients provide their read-only Coinos API key
- Donations go directly to recipient's wallet
- System tracks donations via read-only API access
- No custodial holdings - pure P2P payments
- Monthly ad revenue distributed separately

## Core Components

### 1. Project Pages
- Located in `/site/projects/` directory
- HTML format with standard site layout
- Includes progress visualization (see PROJECT_ALLOCATION_SYSTEM.md)
- Links to verification details
- Connection to accounts system for tracking
- Pre-filled donation links with project allocation

### 2. Recipient Wallet Integration
```typescript
interface RecipientWallet {
    recipientId: string;
    coinosReadOnlyKey: string;  // Can only generate invoices and check balances
    projectIds: string[];      // Projects this wallet is associated with
    lastChecked: number;       // Timestamp
    status: 'active' | 'inactive';
}
```

### 3. Donation Progress Visualization
- Real-time progress bar/graph showing:
  - Total amount needed
  - Amount raised so far
  - Number of contributors
- Updates automatically through accounts system integration
- Mobile-responsive design

### 3. Project Allocation System
Enhancement to existing donations interface:
```typescript
interface ProjectDonation {
  amount: number;
  projectId?: string;  // Optional - if not set, goes to general fund
  donorId: string;
  timestamp: number;
  verificationStatus: 'pending' | 'verified';
}
```

### 4. User Roles & Permissions
New role-based access control system:
```typescript
interface UserRole {
  type: 'admin' | 'moderator' | 'recipient' | 'donor';
  permissions: string[];
  projectAccess?: string[];  // For recipients - which projects they can manage
}

interface UserProfile {
  // Existing fields...
  roles: UserRole[];
  verificationStatus: 'unverified' | 'pending' | 'verified';
}
```

#### Role Types
1. **Admin**
   - Full system access
   - Manage user roles
   - Verify projects & recipients

2. **Moderator**
   - Chat moderation
   - Content moderation
   - Report handling

3. **Recipient**
   - Create/edit own project pages
   - Post project updates
   - Access project funds (through verification)

4. **Donor**
   - Basic user role
   - Can donate to projects
   - View project details & updates

## Implementation Plan

### Phase 1: Foundation
1. Add project allocation field to donation system
2. Create progress visualization component
3. Implement user roles schema

### Phase 2: UI/UX
1. Project page templates
2. Donation allocation interface
3. Progress visualization integration

### Phase 3: Administration
1. Role management interface
2. Project verification system
3. Recipient verification workflow

## Security Considerations
- Role-based access control (RBAC) implementation
- Project fund allocation verification
- Two-factor authentication for sensitive operations
- Audit logging for all role changes

## Migration Notes
- Existing verified users (like lightninglova) will be mapped to appropriate roles
- Current donation system will be extended, not replaced
- Backwards compatibility maintained for non-allocated donations