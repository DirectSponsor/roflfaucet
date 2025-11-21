# Cross-Site Sync - Clean Implementation (2025-11-21)

## The Problem
Users switching between ClickForCharity and ROFLFaucet need balance to sync via Syncthing (~10 seconds).
Without waiting, they might play games with stale balance data.

## The Solution
**Only delay users who are switching BETWEEN sites, not navigating within same site.**

## Implementation

### On Page Load (constructor)
```javascript
localStorage.setItem('last_active_site', this.siteId);
```
Set initial site marker.

### On Visibility Hidden (leaving tab)
```javascript
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        this.flushNetChange('visibility-hidden');
        // DON'T update last_active_site here!
    }
});
```
Just flush balance. Don't touch last_active_site.

### On Focus (arriving at tab)
```javascript
window.addEventListener('focus', async () => {
    const lastActiveSite = localStorage.getItem('last_active_site');
    const currentSite = this.siteId;
    
    if (lastActiveSite && lastActiveSite !== currentSite) {
        // CROSS-SITE SWITCH
        localStorage.setItem('last_active_site', currentSite);  // Update NOW
        await this.syncFromOtherSite();  // Lock + wait 10s
    } else {
        // SAME SITE
        localStorage.setItem('last_active_site', currentSite);  // Update
        await this.getBalance();  // Just refresh, no lock
        this.updateBalanceDisplaysSync();
    }
});
```

### Key Points
1. **Update last_active_site ON ARRIVAL (focus), not on departure (blur)**
   - This avoids race conditions between sites
   - The arriving site always sees where user was last

2. **For ROFLFaucet: syncFromOtherSite()**
   - Show green "Syncing..." banner
   - Lock balance operations (isBalanceLocked = true)
   - Wait 10 seconds for Syncthing
   - Check file timestamp
   - Unlock and refresh

3. **For ClickForCharity: syncFromOtherSite()**
   - No banner (tasks take 10+ seconds anyway)
   - No lock (users can start tasks during sync)
   - Just wait 10 seconds and refresh

## User Experience
- **Normal user (stays on one site)**: No delays, instant ✅
- **Power user (switches sites)**: 10-second wait with banner ⚠️
- **Tab refresher**: No delay (same site) ✅

## Testing
1. Play 10 spins on ROFL → no delays
2. Complete CFC task → switch to ROFL → see banner, 10s lock
3. Navigate within ROFL (slots→dice→faucet) → no delays
4. Refresh ROFL page → no delays

## Files Modified
- `/site/scripts/unified-balance.js` (ROFLFaucet)
- `/js/unified-balance.js` (ClickForCharity)

## Deployment
1. Deploy ROFL: `rsync -av site/scripts/unified-balance.js roflfaucet:/var/www/html/scripts/`
2. Deploy CFC: `rsync -av js/unified-balance.js clickforcharity:/var/www/clickforcharity.net/public_html/js/`
3. Test with cleared localStorage
