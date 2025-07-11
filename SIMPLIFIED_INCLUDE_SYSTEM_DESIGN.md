# SatoshiHost CMS Integration Design
*Current System Architecture & Future CMS Implementation*  
*Date: June 21, 2025*

## Overview

This document outlines the current include system architecture for ROFLFaucet and how it integrates with the future **SatoshiHost CMS**. The system uses a master template approach with modular includes, providing consistent layout across all pages while keeping only the center content unique.

## Current System Status

### **Active Implementation**
ROFLFaucet currently uses a **master template approach** with modular includes:

- **Master template structure**: All pages use identical layout with includes
- **Consistent layout**: Header, sidebars, footer identical across all pages
- **Unique center content**: Only the main content area differs per page
- **Generic CSS classes**: Reusable styles (`.content-header`, `.content-container`, `.content-entry`)
- **Linear build process**: Simple include replacement without complexity

### **Layout Consistency Principle**
> **"All pages should come out the same except for the center section. If one is different, something is wrong."**

This ensures:
- Uniform user experience across the site
- Easy maintenance and updates
- Clear debugging (differences indicate issues)
- Future SatoshiHost CMS integration readiness

## Future SatoshiHost CMS Concept

### **HTML Files with Include Markers**
The future SatoshiHost CMS will use **regular HTML files** with visible include markers:

```html
<!DOCTYPE html>
<html lang="en">

<!-- INCLUDE START: head.html -->
<head>
    <meta charset="UTF-8">
    <!-- Head content gets inserted here by build script -->
</head>
<!-- INCLUDE END: head.html -->

<body>

<!-- INCLUDE START: header.html -->
<!-- Header content gets inserted here by build script -->
<!-- INCLUDE END: header.html -->

<!-- ========================================= -->
<!-- CMS EDITABLE CONTENT ZONE                -->
<!-- ========================================= -->
<main class="main">
    <h1>User-editable page title</h1>
    <p>User-editable content goes here.</p>
    <p>CMS only touches content between include markers.</p>
</main>
<!-- ========================================= -->
<!-- END CMS EDITABLE CONTENT                 -->
<!-- ========================================= -->

<!-- INCLUDE START: footer.html -->
<!-- Footer content gets inserted here by build script -->
<!-- INCLUDE END: footer.html -->

</body>
</html>
```

## Key Benefits

### **1. CMS Integration Ready**
- **Clear boundaries**: Include markers define non-editable zones
- **Content isolation**: CMS only modifies content between markers
- **Visible structure**: Developers can see exactly what's happening

### **2. Developer Friendly**
- **No template confusion**: Everything is standard HTML
- **Complete visibility**: All content and structure visible in source
- **Standard tools**: HTML editors, syntax highlighting, validation all work
- **Easy debugging**: Can see exactly what content comes from where

### **3. Simple Workflow**
- **Edit HTML directly**: No separate template files to manage
- **Build script handles includes**: Shared components updated automatically
- **Browser ignores comments**: Include markers invisible to users

## Build System Architecture

### **Include Marker Syntax**
```html
<!-- INCLUDE START: filename.html -->
[Content gets inserted here during build]
<!-- INCLUDE END: filename.html -->
```

### **Build Process**
1. **Scan HTML files** for `INCLUDE START` markers
2. **Find matching END markers** for each include
3. **Replace content between markers** with include file content
4. **Preserve markers** for future builds and debugging
5. **Skip content outside markers** - CMS editable zones untouched

### **Algorithm Outline**
```bash
for each HTML file:
    while file contains "INCLUDE START":
        find next INCLUDE START marker
        extract filename from marker
        find matching INCLUDE END marker
        replace content between markers with include file content
        preserve START and END markers
```

## CMS Integration Strategy

### **Content Zone Detection**
```javascript
// CMS scans HTML file
function findEditableContent(htmlFile) {
    const content = readFile(htmlFile);
    const editableZones = [];
    
    // Extract all content NOT between include markers
    let currentPos = 0;
    while (currentPos < content.length) {
        const nextInclude = findNextIncludeMarker(content, currentPos);
        
        if (nextInclude) {
            // Content before include is editable
            editableZones.push({
                start: currentPos,
                end: nextInclude.start,
                content: content.substring(currentPos, nextInclude.start)
            });
            
            // Skip past the include block
            currentPos = nextInclude.end;
        } else {
            // Rest of file is editable
            editableZones.push({
                start: currentPos,
                end: content.length,
                content: content.substring(currentPos)
            });
            break;
        }
    }
    
    return editableZones;
}
```

### **CMS Editor Interface**
```html
<!-- CMS presents user with clean editor -->
<div class="cms-editor">
    <h2>Edit Page Content</h2>
    <p>Shared components (header, footer, sidebars) are managed separately.</p>
    
    <textarea id="page-content">
        <h1>User-editable page title</h1>
        <p>User-editable content goes here.</p>
        <!-- Only content between include markers shown -->
    </textarea>
    
    <button onclick="saveContent()">Save Changes</button>
</div>
```

### **Content Saving Process**
```javascript
function saveContent(htmlFile, newContent) {
    const originalFile = readFile(htmlFile);
    const editableZones = findEditableContent(originalFile);
    
    // Replace editable zones with new content
    let updatedFile = originalFile;
    editableZones.forEach(zone => {
        updatedFile = replaceZone(updatedFile, zone, newContent);
    });
    
    // Write back to file - include markers preserved
    writeFile(htmlFile, updatedFile);
    
    // Trigger build process to update includes
    runBuildScript();
}
```

## File Structure

### **Development Structure**
```
/site-root/
├── index.html              # Regular HTML with include markers
├── about.html              # Regular HTML with include markers  
├── contact.html            # Regular HTML with include markers
├── includes/
│   ├── head.html           # Shared head content
│   ├── header.html         # Shared header/navigation
│   ├── sidebar-left.html   # Shared left sidebar
│   ├── sidebar-right.html  # Shared right sidebar
│   └── footer.html         # Shared footer
├── build-simple.sh         # Include processing script
└── styles.css              # Site styles
```

### **Generated Files**
- Same HTML files with include content inserted
- Include markers preserved for future builds
- No separate template or build directories needed

## Implementation Phases

### **Phase 1: Build Script Development**
- [x] Design algorithm and syntax ✅
- [ ] Implement robust parsing (avoid infinite loops)
- [ ] Add error handling for missing includes
- [ ] Test with multiple include files

### **Phase 2: CMS Content Detection**
- [ ] Implement content zone scanning
- [ ] Build editable content extraction
- [ ] Test with complex HTML structures

### **Phase 3: CMS Editor Interface**
- [ ] Create user-friendly content editor
- [ ] Implement content saving and rebuilding
- [ ] Add preview functionality

### **Phase 4: Advanced Features**
- [ ] Multi-user editing support
- [ ] Version control integration
- [ ] Content validation and backup

## Comparison with Current System

### **Current Template System**
```
✅ Working now
✅ Consistent site structure
✅ Easy site-wide updates
❌ Separate template files
❌ Complex for CMS integration
```

### **Simplified Include System**
```
✅ All current benefits maintained
✅ No separate template files  
✅ CMS integration ready
✅ Developer friendly
✅ Standard HTML throughout
```

## Migration Strategy

### **From Current to Simplified**
1. **Convert templates to HTML files** with include markers
2. **Test build script** with existing includes
3. **Verify identical output** to current system
4. **Implement CMS interface** using new approach
5. **Gradual migration** of existing content

### **Backward Compatibility**
- Current template system continues working
- New simplified system developed in parallel
- Migration on per-page basis as needed

## Security Considerations

### **Include File Protection**
- Include files should be outside web root or protected by server config
- Build script should validate include file paths
- CMS should not allow editing of include files directly

### **Content Validation**
- CMS should sanitize user input before saving
- HTML validation before saving to prevent broken markup
- Backup system for content recovery

## Performance Benefits

### **Build Time**
- Faster than complex template systems
- No compilation or complex preprocessing
- Simple file operations only

### **Runtime Performance**
- Static HTML files served directly
- No server-side template processing
- Standard browser caching works perfectly

## Future Enhancements

### **Advanced Include Features**
- Conditional includes based on page type
- Include parameters for customization
- Nested includes with proper dependency handling

### **CMS Features**
- WYSIWYG editor for rich content
- Media library integration
- SEO optimization tools
- Multi-language support

## Conclusion

The simplified include system provides all benefits of the current template system while being perfectly suited for future **SatoshiHost CMS** development. The approach eliminates complexity while maintaining transparency and developer productivity.

**Key Advantage**: When we build the **SatoshiHost CMS** interface, it will work seamlessly with this system because the editable content boundaries are clearly defined and easily detectable.

**SatoshiHost CMS Benefits**:
- Clean separation between layout and content
- No complex template dependencies
- Developer-friendly HTML-based approach
- Ready for multi-site deployment across SatoshiHost network
- Consistent with SatoshiHost ecosystem standards

---

**Status**: Design Complete ✅  
**Next Step**: Implement when ready for CMS development  
**Current System**: Continue using existing template system  
**Documentation Date**: June 21, 2025

