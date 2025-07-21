# ROFLFaucet Project Context - Current Status

## Project Directory Structure
- **Main working directory**: `/home/andy/Documents/websites/Warp/projects/rofl/roflfaucet/`
- **Old version preserved**: `/home/andy/Documents/websites/Warp/projects/rofl/roflfaucet-old/`

## Current Status
We have a working `slots.html` file with perfect layout and functionality. We're now creating a modular template system.

## What We've Accomplished
1. **Fixed flexbox margin issues** - Main content has `margin-left: 0.5em; margin-right: 0.5em;` to compensate for flex destroying child element margins
2. **Created responsive layout** with staggered collapse:
   - Right sidebar disappears at 64rem (~1024px)  
   - Left sidebar collapses to vertical stack at 48rem (~768px)
3. **Established utility classes**:
   - `.padded` - adds `padding: 0.5em` for text elements
   - `.full-width` - makes any element span full container width
4. **Sidebar widths**: 22% each, main content uses remaining space
5. **Working slot machine** integration in `slots.html`

## Files Created So Far
- `slots.html` - Main working file with complete layout and slot machine
- `includes/components/slot-machine.html` - Extracted slot machine content (SAVED)

## Next Steps (IN PROGRESS)
Creating modular includes following pattern from `/home/andy/Documents/websites/Warp/projects/rofl/roflfaucet-old/templates/basic-page.tmpl`:

### Need to Create:
1. **`includes/header.html`** - DOCTYPE, head, CSS, opening body/container
2. **`includes/left-sidebar.html`** - Left sidebar content 
3. **`includes/right-sidebar.html`** - Right sidebar content
4. **`includes/footer.html`** - Closing container, scripts, closing body/html

### CSS Strategy:
- **Base layout CSS** goes in `styles.css` (the flexbox layout, responsive, utility classes)
- **Game-specific CSS** (like slots.css) stays separate
- **Page-specific styles** can be added via #STYLES# placeholder in header

### Template Structure:
```
<!-- include header.html -->
<!-- include left-sidebar.html -->
<main class="main-content">
    <!-- PAGE CONTENT HERE -->
</main>
<!-- include right-sidebar.html -->  
<!-- include footer.html -->
```

## Working CSS (from slots.html):
```css
body { font-family: system-ui, -apple-system, sans-serif; }
.container { display: flex; height: 100vh; }
.left-sidebar, .right-sidebar { width: 22%; background: #f0f0f0; transition: width 0.3s ease; }
.padded { padding: 0.5em; }
.full-width { width: 100%; display: block; box-sizing: border-box; }
.main-content { flex: 1; background: white; margin-left: 0.5em; margin-right: 0.5em; }
/* Responsive breakpoints at 64rem and 48rem */
```

## Method to Cut/Paste from slots.html:
1. Cut slot machine section → `includes/components/slot-machine.html` ✅ DONE
2. Cut header section → `includes/header.html` 
3. Cut left sidebar → `includes/left-sidebar.html`
4. Cut right sidebar → `includes/right-sidebar.html` 
5. Cut footer scripts → `includes/footer.html`
6. What remains should be blank main content area

## Current Working Layout:
- **Left sidebar**: 22% width, contains navigation + A-Ads placeholder
- **Main content**: flex:1 with 0.5em margins, contains slot machine
- **Right sidebar**: 22% width, contains additional info + full-width image
- **Responsive**: Right sidebar disappears first, then vertical stack

## Key Files to Reference:
- `slots.html` - Current working version
- `/home/andy/Documents/websites/Warp/projects/rofl/roflfaucet-old/templates/basic-page.tmpl` - Template pattern
- `/home/andy/Documents/websites/Warp/projects/rofl/roflfaucet-old/includes/` - Old include examples

## Critical CSS Rules That Must Be Preserved:
```css
.main-content {
    flex: 1;
    background: white;
    margin-left: 0.5em;  /* CRITICAL for flexbox margin fix */
    margin-right: 0.5em; /* CRITICAL for flexbox margin fix */
}
```

This fixes the flexbox issue where child element margins get absorbed.
