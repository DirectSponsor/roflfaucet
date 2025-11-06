# ROFLFaucet Balance System - Low-Resource Design Analysis

## Current System Overview

### Two APIs Working Together (Efficient Design!)

#### 1. **project-donations-api.php** (JSON-based, ~8KB)
- **Purpose**: Handles payment creation and invoice generation
- **Data Source**: Reads JSON files from `/var/roflfaucet-data/projects/`
- **Key Feature**: Pre-calculated balances stored in JSON (`current_amount` field)
- **Performance**: Very fast - single file read, no calculation needed
- **Bandwidth**: Minimal - returns only necessary data

**JSON Structure (1.7KB per project):**
```json
{
    "project_id": "001",
    "title": "Project Name",
    "current_amount": 0,        // Pre-calculated balance
    "target_amount": 60000,
    "recipient_wallet": {...},
    "donations": []              // Full donation history
}
```

#### 2. **fundraiser-api.php** (HTML comment parsing, ~6KB)
- **Purpose**: Lists projects for public display
- **Data Source**: Reads HTML files from `/var/roflfaucet-data/projects/`
- **Key Feature**: Calculates live balance from accounts-ledger.json
- **Performance**: Slightly heavier - parses HTML + calculates from ledger
- **Use Case**: Public fundraiser list page

**Balance Calculation:**
```php
function calculateProjectBalance($projectId) {
    // Reads accounts-ledger.json
    // Sums all 'project_donation' transactions for this project
    return $total;
}
```

## Why This Design is Low-Resource ✅

### 1. **Separation of Concerns**
- Payment API uses fast JSON reads (no HTML parsing)
- Display API calculates live balances only when listing projects
- Each API optimized for its specific use case

### 2. **Minimal Database Overhead**
- No SQL database needed (saves memory/CPU)
- Simple file reads with locking
- JSON parsing is very fast in PHP

### 3. **Efficient Data Storage**
- JSON files: ~1.7KB per project
- HTML files: ~7-40KB (includes full page layout)
- accounts-ledger.json: Central transaction log
- Total per project: < 50KB on disk

### 4. **Mobile-Friendly Response Sizes**
- Project info API: ~500 bytes JSON response
- Fundraiser list: ~2KB for all projects
- Invoice creation: ~300 bytes response
- Perfect for slow/expensive mobile connections!

### 5. **Caching-Ready**
- Static HTML files can be cached by CDN/browser
- JSON responses can have cache headers
- accounts-ledger updates trigger cache invalidation

## Data Flow

```
USER REQUEST (project page)
    ↓
project-donations-api.php
    ↓
Reads: /var/roflfaucet-data/projects/001-name.json (1.7KB)
    ↓
Returns: {current_amount, target_amount, donations_count} (500 bytes)
    ↓
Page displays balance (fast!)
```

```
DONATION CONFIRMED (webhook)
    ↓
1. Adds transaction to accounts-ledger.json
2. Updates project JSON current_amount
3. Appends to donations array
    ↓
Next page load shows new balance (no recalculation needed)
```

## Transition to User Directory Structure

### Proposed Layout
```
/var/roflfaucet-data/
  ├── data/
  │   ├── accounts-ledger.json          # Central transaction log
  │   └── project-donations-pending/
  └── projects/
      ├── username1/
      │   ├── 001-project-name.json     # Balance & metadata
      │   └── 002-another.json
      └── username2/
          └── 003-their-project.json

/var/www/html/projects/
  ├── username1/
  │   ├── active/
  │   │   ├── 001.html                  # Display page
  │   │   └── 002.html
  │   ├── completed/
  │   └── images/
  │       ├── 001.jpg
  │       └── 002.jpg
  └── username2/
      └── active/
          └── 003.html
```

### Key Principles for Transition ✅

1. **Keep JSON files in `/var/roflfaucet-data/projects/username/`**
   - Fast access
   - Outside web root (secure)
   - Organized by owner

2. **Keep HTML files in `/var/www/html/projects/username/active/`**
   - Web-accessible
   - User-organized
   - Easy navigation

3. **Keep accounts-ledger.json centralized**
   - Single source of truth
   - Easier to aggregate site-wide stats
   - Atomic writes with locking

4. **Update APIs to scan user directories**
   - `glob('/var/roflfaucet-data/projects/*/*.json')`
   - Minimal performance impact (Linux directory scans are fast)
   - Cache directory listing if needed

### Performance Impact: MINIMAL ✅

- Scanning 100 users × 10 projects = 1000 files
- Directory scan: ~5-10ms on cheap VPS
- Can add simple file cache if needed later
- Still way faster than any database query!

### Migration Steps (Safe & Reversible)

1. **Create user directories** (non-destructive)
   ```bash
   mkdir -p /var/roflfaucet-data/projects/username/
   mkdir -p /var/www/html/projects/username/active/
   ```

2. **Copy (not move) existing projects** (keeps backup)
   ```bash
   cp 001-name.json /var/roflfaucet-data/projects/username/
   cp 001.html /var/www/html/projects/username/active/
   ```

3. **Update API glob patterns** (backward compatible)
   ```php
   // Old: glob(PROJECTS_DIR . '/*.json')
   // New: glob(PROJECTS_DIR . '/*/*.json')  // Finds both!
   ```

4. **Test thoroughly** before removing old files

5. **Remove old flat structure** only after 100% confirmed working

## Low-Resource Best Practices We're Already Following ✅

1. **No unnecessary database** - File-based storage is lighter
2. **Pre-calculated balances** - No expensive aggregation on every page load
3. **Small API responses** - Only essential data returned
4. **Static HTML** - Most content cacheable
5. **Minimal dependencies** - Pure PHP, no heavy frameworks
6. **Efficient file operations** - Direct reads, atomic writes
7. **Mobile-first sizing** - Sub-10KB responses

## Risks to Avoid ❌

1. **DON'T** recalculate balances on every API call
2. **DON'T** parse HTML for balance data in payment flow
3. **DON'T** load full project arrays when only count needed
4. **DON'T** add heavy frameworks or dependencies
5. **DON'T** break the accounts-ledger.json structure
6. **DON'T** add unnecessary database queries

## Next Steps

1. ✅ Understand current system (DONE)
2. Design glob pattern updates for APIs
3. Test API performance with user directory structure
4. Create migration script
5. Deploy and verify balances still work
6. Monitor performance on cheap VPS

## Hosting Target Specs

Should work smoothly on:
- 512MB RAM VPS ($3-5/month)
- Shared hosting with 128MB PHP memory limit
- 2G mobile connections (sub-second page loads)
- High-latency networks (minimal round trips)

**Current system already achieves this!** Transition just needs to maintain it.
