# ROFLFaucet Context Summary - July 15, 2025

## 🎉 Major Breakthrough Today: Unified Balance System

### What We Achieved
- **Created `unified-balance.js`** - Single balance system for both guests and members
- **Same interface everywhere** - `addBalance()`, `subtractBalance()`, `getBalance()` for all users
- **Automatic user detection** - System routes to localStorage (guests) or API (members) automatically
- **Transaction-based design** - Both user types use same transaction pattern
- **Global availability** - Added to header include, available on all pages

### Key Benefits
- **Eliminates complexity** - No more separate balance systems
- **Scalable** - Ready for 6+ games with same functions
- **Seamless experience** - Same balance across all games and pages
- **Easy migration** - Guest transactions can convert to real balance on signup

### Technical Implementation
```javascript
// Same functions for everyone:
await addBalance(10, 'faucet_claim', 'Claimed tokens');
await subtractBalance(5, 'slots_bet', 'Slot machine bet');
const balance = await getBalance();
```

### Current Status
- ✅ **System deployed** - Available on all pages
- ✅ **Documentation complete** - Full docs in `UNIFIED_BALANCE_BREAKTHROUGH_2025-07-15.md`
- 🎯 **Next step** - Migrate existing games to use unified system

## Project Architecture

### File Structure
```
/includes/           - Shared HTML components (header, footer, etc.)
/templates/          - Page templates for new pages
/docs/               - All project documentation
/archived-pages/     - Old versions and unused files
/backups/            - Build script backups
/*.html              - Main pages (built from includes)
```

### Build System
- **`./build.sh`** - Builds all HTML files with includes
- **`./build.sh filename.html`** - Builds specific file only
- **Template system** - Uses linear single-pass processing with include tags
- **Meta placeholders** - SEO-ready with proper meta tag system

### Pages Status
- ✅ All main pages working: `index.html`, `about.html`, `illusions.html`, `progress.html`, `slots.html`, `slots-mobile.html`
- ✅ Proper meta placeholders restored to all pages
- ✅ Template system working perfectly

## Current Development Focus

### Immediate Priorities
1. **Fix footer positioning bug** - Mobile version issue
2. **Header accessibility improvements** - Remove collapse, make narrower
3. **Mobile responsiveness review** - Test all pages on mobile

### Medium-term Goals
- **Member/Guest experience differentiation** - Different UI for logged-in vs guest users
- **Mobile/Desktop optimization** - Device-specific enhancements
- **Game integration** - Migrate existing games to unified balance system

## Development Philosophy
- **Accessibility First** - Minimal scrolling, maximum usability
- **Clean Structure** - Separation of content and layout
- **Maintainable** - Easy to update shared components
- **Fast Loading** - Lightweight, static architecture
- **SEO Ready** - Proper meta tags and structure

## Server Access
- **Live site**: http://satoshihost.ddns.net/warp/projects/rofl/roflfaucet/index.html
- **Development server**: Running on satoshihost.ddns.net
- **Document root**: /var/www/html/

## Key Documentation Files
- `PROJECT_STATUS.md` - Current project status and priorities
- `UNIFIED_BALANCE_BREAKTHROUGH_2025-07-15.md` - Today's major breakthrough
- `MEMBER_GUEST_EXPERIENCE_PLAN.md` - Plan for user experience differentiation
- `UNIFIED_TOKEN_SYSTEM.md` - Previous token system documentation (now superseded)

---

**Last Updated**: July 15, 2025  
**Major Achievement**: Unified Balance System  
**Next Session Focus**: Game migration and mobile bug fixes  
**Working URL**: http://satoshihost.ddns.net/warp/projects/rofl/roflfaucet/index.html
