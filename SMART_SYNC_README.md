# 🔄 Smart Sync System

## Overview

The Smart Sync System replaces the old 10-second polling mechanism with an intelligent, event-driven approach that minimizes bandwidth usage while ensuring balance consistency across multiple tabs and sessions.

## Key Features

### ✅ **Eliminated 10-Second Polling**
- No more constant background requests every 10 seconds
- Dramatically reduces bandwidth usage
- Improves performance on slow connections

### 🎯 **Check-on-Action Sync**
- Syncs **before** any balance-changing operation
- Uses lightweight timestamp API (`balance_timestamp`) to check if server data changed
- Only fetches full balance if server timestamp is newer than local cache

### 👁️ **Page Visibility Sync**
- Automatically syncs when switching away from the tab
- Catches changes made in other tabs or external sources
- Uses Page Visibility API for accurate tab switching detection

### 🚪 **Page Unload Sync**
- Syncs when leaving the page or closing the tab
- Ensures no data is lost when user navigates away

### ⏰ **Inactivity Fallback**
- Gentle 5-minute inactivity timer as a safety net
- Only triggers if user is logged in and page is visible
- Resets on any user activity (mouse, keyboard, scroll, touch)

## API Endpoints

### New Lightweight Endpoint
```php
GET api/user-data.php?action=balance_timestamp
```
Returns only the `last_updated` timestamp for efficient sync checking:
```json
{
  "success": true,
  "last_updated": "2024-01-15T10:30:45"
}
```

### Existing Endpoints Enhanced
- Balance operations now include timestamp tracking
- All balance-changing operations update the server timestamp

## How It Works

### For Logged-in Members:

1. **On Balance Operation:**
   ```javascript
   // Before any balance change:
   await this.syncIfNeeded('before_balance_change');
   ```
   - Checks timestamp with minimal API call
   - Only fetches full balance if data changed elsewhere
   - Proceeds with operation using current/synced data

2. **On Tab Switch/Hide:**
   ```javascript
   document.addEventListener('visibilitychange', () => {
     if (!this.isPageVisible) {
       this.syncIfNeeded('visibility_change');
     }
   });
   ```

3. **On Page Unload:**
   ```javascript
   window.addEventListener('beforeunload', () => {
     this.syncIfNeeded('page_unload');
   });
   ```

4. **Inactivity Fallback:**
   - Resets 5-minute timer on any user activity
   - Only syncs if page is visible and user is logged in

### For Guest Users:
- No sync needed - all data stored in localStorage
- Maintains full compatibility with existing guest system

## Multi-Tab Safety

The system prevents conflicts when using multiple tabs:

1. **Tab A** makes a balance change → syncs before operation
2. **Tab B** later makes a change → detects Tab A's timestamp change → syncs fresh data first
3. Both tabs stay consistent without constant polling

## Testing

Use `sync-test.html` to test the system:

1. **Single Tab Test:**
   - Open the test page
   - Perform balance operations
   - Watch console for sync events

2. **Multi-Tab Test:**
   - Open multiple tabs of the test page
   - Switch between tabs (watch for visibility sync)
   - Perform balance operations in different tabs
   - Observe smart sync coordination

3. **Bandwidth Test:**
   - Open browser dev tools → Network tab
   - Compare requests: old system (constant polling) vs new (event-driven)

## Benefits

### 🌐 **Bandwidth Optimized**
- Perfect for users with poor internet connections
- Minimal API calls only when needed
- Lightweight timestamp checks (< 1KB) instead of full balance data

### 🔋 **Battery Friendly**
- No constant background polling
- Event-driven approach uses less CPU
- Inactivity timer respects device resources

### 🔄 **Multi-Tab Consistent**
- Safe operation across multiple browser tabs
- Prevents balance conflicts and sync confusion
- Maintains data integrity

### ⚡ **Responsive**
- Immediate sync when needed
- No waiting for next polling interval
- Real-time balance accuracy for operations

## Implementation Details

### Core Class Properties
```javascript
// Smart sync system properties
this.lastServerTimestamp = null;  // Track server balance timestamp
this.lastSyncTime = null;         // Track when we last synced
this.syncInProgress = false;      // Prevent concurrent syncs
this.inactivityTimer = null;      // 5-minute fallback timer
this.isPageVisible = true;        // Track page visibility
```

### Sync Logic Flow
```
User Action → Check Timestamp → Changed? → Fetch Balance → Proceed
                     ↓              ↓
                  Unchanged    Continue with cached balance
```

This system ensures optimal performance while maintaining perfect balance consistency across all usage scenarios.
