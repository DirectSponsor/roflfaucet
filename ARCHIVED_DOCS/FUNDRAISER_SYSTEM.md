# 🎯 ROFLFaucet Fundraiser System
*Updated: October 2025 - HTML-Based Architecture with Lifecycle Management*

## Role-Based Capabilities

### **Roles & Capabilities**
- `member` → Basic site features (default for all users)
- `recipient` → **Create fundraiser** capability (profile-based, no username suffix required)
- `admin` → **All capabilities** (create + manage + approve fundraisers)

*Note: Role system uses localStorage caching from session bridge for instant detection*

### **One Active Fundraiser per Recipient**
- Recipients can have **one "current" active fundraiser** at a time
- **Queued fundraisers:** Recipients can create multiple projects that await approval in `pending/`
- **Seamless transitions:** When active fundraiser completes, next approved fundraiser becomes active
- All donations to a recipient automatically go to their active fundraiser
- Simplifies donation flow and keeps overview pages clean

### **Project Lifecycle Management**
```
NEW PROJECT → pending/ → [admin approval] → active/ → completed/
```
- **Pending:** New projects await admin review (`/projects/pending/`)
- **Active:** Live fundraisers visible to donors (main `/projects/` folder)
- **Completed:** Archived successful projects (`/projects/completed/`)
- **One active per recipient:** Ensures focused donations and clean UI

## Technical Architecture

### **HTML-First System**
- **Data Storage:** Each project is an HTML file with `<!-- tag -->content<!-- end tag -->` structure
- **Direct Serving:** Project pages served directly from `/var/roflfaucet-data/projects/001-project-name.html`
- **Easy Updates:** Donation amounts updated directly in HTML via comment tag replacement
- **Grep-Friendly:** `grep "<!-- title -->" *.html` easily finds any project data

### **Server Build System**
- **Include System:** Local files use `<!-- include nav.html -->` and `<!-- include footer.html -->` 
- **Server Processing:** Server has `build.sh` that processes includes for server-generated files
- **Manual Sync Required:** When updating nav/footer locally, must manually update server copies
- **User Data Protection:** Server files not deployed automatically to avoid overwriting user data
- **Files Affected:** Project HTML files in `/var/roflfaucet-data/projects/` use server includes
- **⚠️ Reminder File:** See `REMEMBER-UPDATE-SERVER-INCLUDES.md` for sync instructions

### **API Endpoints**

#### **Public Endpoints**
- `GET /api/fundraiser-api.php?action=list` - List all active fundraisers (reads HTML files)
- `GET /api/fundraiser-api.php?action=get&id={id}` - Get specific fundraiser (parses HTML comment tags)

#### **Creation & Management**
- `POST /api/project-management-api-v2.php` - Create project (goes to pending/, uses HTML template)
- **Admin Tools:** Move projects between pending/active/completed folders
- **Profile Integration:** "My Projects" section shows user's active fundraisers

## Dual Donation Architecture

### **Two Donation Paths:**

#### **1. Direct P2P Donations (New System)**
- **Fundraiser pages** → Direct to recipient's Lightning address
- **True peer-to-peer** - Donors send directly to project recipients
- **Instant settlement** - No monthly distribution delays
- **Full transparency** - Recipients control their own funds
- **Project-specific** - Donations tied to specific fundraisers

#### **2. Site Income Pool (Legacy System)**
- **Simple donation** → Site income fund (monthly distribution)
- **Easy option** - For donors who just want to "support the site"
- **Monthly distribution** - Pooled funds distributed to active recipients
- **Fallback option** - Available via main "⚡ Donate" navigation

### **Evolution Benefits:**
- **Recipient empowerment** - Direct control over project funds
- **Reduced admin overhead** - No monthly distribution management
- **Real-time funding** - Projects can receive funds immediately
- **Choice for donors** - Simple site support OR targeted project funding

### **Directory Structure**
```
/var/roflfaucet-data/projects/
├── pending/
│   └── 003-new-project.html           # Awaiting admin approval
├── 001-bitcoin4ghana-internet-connectivity.html  # Active: Bitcoin4Ghana
├── 002-tree-nursery-tools-kenya.html             # Active: Evans' Reforestation
└── completed/
    └── (completed projects moved here)
```

### **Current Live Projects**
- **Project 001:** Bitcoin4Ghana Internet Connectivity (Owner: lightninglova)
- **Project 002:** Tree Nursery Tools for Kenya Reforestation (Owner: evans)
- **Next ID:** 003 (will be assigned to next approved project)

## Current Implementation Status

### ✅ **Completed Features**
- ✅ **HTML comment tag system** - All data stored in grep-friendly HTML files
- ✅ **Role-based access** - Recipients can create, admins can approve
- ✅ **Profile integration** - "My Projects" section with working project display
- ✅ **Fundraiser display** - Individual pages at `/fundraiser.html?id=001`
- ✅ **Project lifecycle** - New projects go to pending/ folder for approval
- ✅ **API endpoints** - List and get actions working with HTML files
- ✅ **Mobile optimization** - Responsive design with proper padding

### 🔄 **Next Steps**
1. **Admin approval tools** - UI to move projects from pending/ to active
2. **Fundraisers overview page** - List all active projects (fundraisers.html)
3. **Completion workflow** - Move finished projects to completed/ folder
4. **One-active-per-recipient rule** - Enforce single active fundraiser per user
5. **Integration with donation system** - Link fundraiser context to payment flow

## Benefits Achieved

✅ **Clean lifecycle management** - Pending → Active → Completed workflow  
✅ **Consistent data format** - All projects use HTML comment tag system  
✅ **Instant role detection** - localStorage caching from session bridge  
✅ **Mobile-friendly** - Responsive design works on 290px+ screens  
✅ **Future-proof** - Easy to extend with new project types and features
