# 🎯 ROFLFAUCET - Master Context File

*Always reference this file first - it contains everything currently relevant*

**Last Updated:** 2025-10-13 11:30  
**Status:** Major Migration Complete - Data Separation Achieved, User Roles System Next Priority

---

## 📋 CURRENT PRIORITY FILES

### 🚨 **CRITICAL - Review Immediately**
- `TODO.md` - Master todo list with active tasks
- **PRIORITY**: User Roles System - Enable Recipients to create projects via forms
- **COMPLETED**: Major data directory migration (2025-10-12) - All systems operational

### 📝 **Active Work Files**  
- `aa-new-issues-requests` - Your notes (AI processes and clears these)
- `AI_WORKFLOW.md` - How the automated system works

### 🔍 **Monitoring & Efficiency**
- `monitor-notes.sh` - Script to watch for new notes
- `check-changes.sh` - Script to detect file timestamp changes
- `.file-timestamps` - Tracks modification times for smart context loading
- `.recent-changes.log` - Log of what files changed since last check

---

## 🎯 CURRENT PROJECT STATE

### **New Features & Enhancements in Progress:**
1. **User Roles System** - Add Admin/Moderator/Recipient/Member/Guest roles with proper access control
2. **Project Creation Forms** - Enable Recipients to create and manage their own projects
3. **Role-Based UI** - Show/hide features based on user permissions

### **Recent Achievements:**
1. ✅ **MAJOR: Data Directory Migration Complete** (2025-10-12) - Live data separated to `/var/roflfaucet-data/`, code in `/var/www/html/`
2. ✅ **All APIs Updated** - Financial totals, project donations, webhooks, accounts - all using new data paths
3. ✅ **Webhook System Fully Functional** - Payment confirmations working end-to-end with proper logging
4. ✅ **Deployment Script Created** - Safe deployments with backup rotation and verification
5. ✅ **Project Donations Working** - Complete flow from creation to webhook confirmation
6. ✅ **Payment Dialog Fixed** - Confirmation showing properly after webhook processing

### **Recent Changes:**
- 🆕 Processed 3 new requests: payment screenshot, browser automation, LightningLova funding (2025-10-07)
- ✅ All critical security issues resolved and deployed in production (2025-10-05)
- ✅ Slots balance exploit fixed and user data loss issue resolved (2025-10-05)
- 📝 Added comprehensive revenue reporting system to roadmap (2025-10-05)
- ✅ Completed manual payment & financial reporting system (2025-09-30)

### **Next Expected Actions:**
- **CRITICAL: User Roles Implementation** - Add Admin/Moderator/Recipient/Member/Guest role system
- **HIGH: Project Creation Forms** - Enable Recipients to create/manage projects via web forms
- **HIGH: Role-Based Access Control** - Secure APIs and UI elements based on user roles
- **MEDIUM: Admin Project Management** - Approve/reject project proposals, manage recipients

### **Current System Architecture (Post-Migration):**
**Server Data Locations:**
- **Live Data**: `/var/roflfaucet-data/` (userdata, projects, payments, data, logs)
- **Web Code**: `/var/www/html/` (PHP, HTML, CSS, JS files)
- **Backup System**: Local `~/backups/roflfaucet-deploys/` (6 recent + daily for 30 days)

**Key Working Systems:**
- ✅ Balance system with new data paths
- ✅ Project donations (creation → webhook → confirmation)
- ✅ Site income donations
- ✅ Financial APIs (totals, accounts, site-income)
- ✅ Webhook processing with proper logging
- ✅ Payment confirmation dialogs
- ✅ Deployment script (`./deploy.sh`)

**Development Workflow:**
- Local: `/home/andy/work/projects/roflfaucet/site`
- Deploy: `./deploy.sh` (creates backups, syncs, verifies)
- Monitor: Webhook logs at `/var/roflfaucet-data/logs/webhook.log`

---

## 📁 ALL RELEVANT FILES BY CATEGORY

### **Documentation (AI-Managed)**
- `TODO.md` - Master todo list ⭐
- `SECURITY_UPGRADE_TODO.md` - Security issues ⭐
- `CONTEXT.md` - This file (always reference first) ⭐
- `FINANCIAL_REPORTING_SYSTEM.md` - New financial system docs ⭐
- `AI_WORKFLOW.md` - System instructions

### **Project Documentation (Existing)**
- `ACCOUNTS_SYSTEM_INTEGRATION.md`
- `ANALYTICS-DEBUG-CONTEXT.md`
- `BALANCE_POLLING_OPTIMIZATION.md`
- `BITCOIN_LIGHTNING_PAYMENT_SYSTEM.md`
- `BITCOIN_PRICE_GAME_DESIGN.md`
- `DEPLOYMENT_SYSTEM.md`
- `GAME-STATS-PROGRESS.md`
- `INCLUDES_SYSTEM.md`
- `POKER_GAME_DESIGN.md`
- `WORKFLOW_SUMMARY.md`
- `ai-services-research.md`

### **Bot Systems**
- `bots/README.md`
- `bots/anzar/ANZAR-RAINBOT.md`
- `bots/anzar/deploy-orange-pi.md`
- `bots/roflbot/README.md`

### **Archive/Reference**
- `old/` directory - Historical context if needed

---

## 🤖 AI INSTRUCTIONS

**When Andy starts a conversation:**

1. **Always read CONTEXT.md first** (this file)
2. **Check .recent-changes.log** to see what files have been modified
3. **Read only changed files** (timestamp-based efficiency)
4. **Check aa-new-issues-requests** for new notes to process
5. **Reference specialized docs only when their timestamps indicate changes**

**When processing Andy's notes:**

1. **Extract and structure** new items into appropriate docs
2. **Clear processed items** from aa-new-issues-requests
3. **Update TODO.md** with new tasks
4. **Update this CONTEXT.md** with any new priority files or state changes
5. **Maintain context freshness** - remove outdated items, archive completed work
6. **Update specialized docs** - if notes relate to accounts/deployment/games, update those docs
7. **Keep Andy informed** of what was processed and cleared

**Context Management & Maintenance:**
- **Check timestamps first** - only read files that have actually changed
- Use `.recent-changes.log` to see what's been modified
- Add files to "Current Priority Files" when they become relevant
- **Remove files when no longer actively needed** - keep context lean
- **Archive completed work** - move finished items to historical sections
- **Update specialized docs** - when Andy works on specific systems, update those docs
- **Clean up redundancy** - merge duplicate info, remove stale content
- Update "Current Project State" after each session
- **Update .file-timestamps** after processing changes
- Maintain "Next Expected Actions" for continuity

---


---

## 📋 FILE OWNERSHIP & RESPONSIBILITIES

### **Andy's Domain (You Control):**
- `aa-new-issues-requests` - Your notes file (add anything here)
- Source code files (not managed by AI)
- Configuration files (you decide when to change)

### **AI's Domain (AI Manages Automatically):**
- **ALL .md documentation files** (including this one)
- `TODO.md` - Master todo list
- `SECURITY_UPGRADE_TODO.md` - Security documentation  
- `CONTEXT.md` - This master context file
- All specialized docs (`ACCOUNTS_SYSTEM_INTEGRATION.md`, etc.)
- Timestamp tracking files (`.file-timestamps`, `.recent-changes.log`)

### **🤖 AI Auto-Maintenance Promise:**
- **Keep context docs current** - remove outdated info, add new insights
- **Maintain cross-references** - link related issues and solutions
- **Archive completed items** - move finished work to historical sections
- **Update priorities** - elevate critical issues, demote resolved ones
- **Sync specialized docs** - update `ACCOUNTS_SYSTEM_INTEGRATION.md` when you work on accounts
- **Clean up redundancy** - merge duplicate information, eliminate stale content

---

## 🔄 WORKFLOW SUMMARY

**Andy's Part (Super Simple):**
- Add notes to `aa-new-issues-requests` (just write naturally)
- Say "process my notes" when ready
- Read any .md file for current info (all kept up-to-date automatically)

**AI's Part (Fully Automated):**  
- Read CONTEXT.md and check timestamps for changes
- Process notes from aa-new-issues-requests
- Update ALL relevant documentation automatically
- Clear processed notes from Andy's file
- **Maintain context freshness** - remove old info, add new insights
- **Keep specialized docs current** - update when you work on those systems
- Maintain perfect continuity across sessions

---

*This file is the single source of truth for what's currently relevant in the project*  
*All .md files are AI-managed and kept automatically up-to-date*
