# Lightweight HTML Include System

**BBEdit-Style Includes for Modern Web Development**

A simple, lightweight alternative to WordPress and complex frameworks that brings back the simplicity of BBEdit's include system while maintaining modern deployment workflows.

## 🎯 Overview

This system allows you to:
- Maintain shared components (header, footer, sidebars) in one place
- Create new pages quickly using templates
- See exactly which includes are used when editing
- Deploy static files with no server-side dependencies
- Avoid the bloat of WordPress while keeping maintainability

## 📁 Directory Structure

```
your-site/
├── templates/                  # Source files with includes
│   ├── page.template.html     # Your editable templates
│   ├── blog.template.html
│   └── docs.template.html
├── includes/                   # Shared components
│   ├── head.html              # <head> section with CSS/meta
│   ├── header.html            # Site header with navigation
│   ├── sidebar-left.html      # Left sidebar with ads/content
│   ├── sidebar-right.html     # Right sidebar with ads/content
│   └── footer.html            # Site footer
├── build.sh                   # Include processor script
├── styles.css                 # Single comprehensive CSS file
├── page.html                  # Generated output files
├── blog.html
└── docs.html
```

## 🔧 Setup Instructions

### 1. Create Directory Structure
```bash
mkdir -p templates includes
```

### 2. Create the Build Script
Copy `build.sh` from the ROFLFaucet implementation:

```bash
#!/bin/bash
# Lightweight HTML Include Processor
# Similar to BBEdit's include system

set -e

echo "🔨 Building HTML files with includes..."

# Function to process includes in a file
process_includes() {
    local input_file="$1"
    local output_file="$2"
    local temp_file=$(mktemp)
    
    echo "📄 Processing: $input_file → $output_file"
    
    # Copy input to temp file
    cp "$input_file" "$temp_file"
    
    # Process all include directives
    while grep -q '<!--#include file=".*" -->' "$temp_file"; do
        # Find the first include
        include_line=$(grep -n '<!--#include file=".*" -->' "$temp_file" | head -1)
        line_num=$(echo "$include_line" | cut -d: -f1)
        include_path=$(echo "$include_line" | sed 's/.*file="\([^"]*\)".*/\1/' | tr -d ' \t')
        
        if [[ -f "$include_path" ]]; then
            echo "  📎 Including: $include_path"
            
            # Create new temp file with include replaced
            new_temp=$(mktemp)
            
            # Copy lines before the include
            head -n $((line_num - 1)) "$temp_file" > "$new_temp"
            
            # Add the included content
            cat "$include_path" >> "$new_temp"
            
            # Copy lines after the include
            tail -n +$((line_num + 1)) "$temp_file" >> "$new_temp"
            
            # Replace temp file
            mv "$new_temp" "$temp_file"
        else
            echo "  ⚠️  Include file not found: $include_path"
            # Remove the include line to prevent infinite loop
            sed -i "${line_num}d" "$temp_file"
        fi
    done
    
    # Move final result to output
    mv "$temp_file" "$output_file"
    echo "  ✅ Built: $output_file"
}

# Build all template files
template_count=0

for template in templates/*.template.html; do
    if [[ -f "$template" ]]; then
        # Extract filename without .template.html extension
        basename=$(basename "$template" .template.html)
        output_file="${basename}.html"
        
        process_includes "$template" "$output_file"
        ((template_count++))
    fi
done

if [[ $template_count -eq 0 ]]; then
    echo "📁 No template files found in templates/ directory"
    echo "💡 Create files like templates/page.template.html to get started"
else
    echo ""
    echo "🎉 Build complete! Processed $template_count template(s)"
    echo ""
    echo "📝 Template syntax:"
    echo "   <!--#include file=\"includes/header.html\" -->"
    echo ""
    echo "📂 Directory structure:"
    echo "   templates/           - Your .template.html source files"
    echo "   includes/           - Shared HTML snippets"
    echo "   *.html              - Generated output files"
fi
```

Make it executable: `chmod +x build.sh`

### 3. Create Include Components

**includes/head.html:**
```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="keywords" content="your, site, keywords">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://yoursite.com">
    
    <!-- Favicon -->
    <link rel="icon" href="favicon.ico">
    
    <!-- Styles -->
    <link rel="stylesheet" href="styles.css">
</head>
```

**includes/header.html:**
```html
<header class="header">
    <div class="container">
        <div class="logo">
            <h1>Your Site</h1>
            <span class="tagline">Your tagline here</span>
        </div>
        
        <nav class="nav">
            <a href="index.html" class="nav-link">Home</a>
            <a href="about.html" class="nav-link">About</a>
            <a href="blog.html" class="nav-link">Blog</a>
            <a href="contact.html" class="nav-link">Contact</a>
        </nav>
    </div>
</header>
```

## 🎨 CSS Architecture

### One Comprehensive CSS File
Keep all styles in a single `styles.css` file organized with clear sections:

```css
/* ========================================
   Base Styles & Variables
   ======================================== */

/* ========================================
   Header & Navigation
   ======================================== */

/* ========================================
   Main Content Area Styles
   Generic styles for center column content
   ======================================== */

/* ========================================
   Sidebar Styles
   ======================================== */

/* ========================================
   Footer Styles
   ======================================== */

/* ========================================
   Responsive Design
   ======================================== */
```

### Generic Class Names for Reusability
Use generic class names that work across all content types:

- `.main-content` - Main content wrapper
- `.content-header` - Page header section
- `.content-container` - Content body wrapper
- `.content-entry` - Individual content blocks
- `.entry-title`, `.entry-content`, `.entry-date` - Content components
- `.entry-tags` - Tag system
- `.highlight-box` - Alert/info boxes
- `.content-summary` - Stats/overview sections

## 📝 Template Creation

### Basic Template Structure
```html
<!DOCTYPE html>
<html lang="en">
<!--#include file="includes/head.html" -->
<body>
<!--#include file="includes/header.html" -->

    <main class="main">
        <div class="container">
            <div class="content-grid">
<!--#include file="includes/sidebar-left.html" -->

                <!-- Main Content -->
                <section class="main-content">
                    <div class="content-header">
                        <h1>Page Title</h1>
                        <p>Page description</p>
                    </div>
                    
                    <div class="content-container">
                        <!-- Your unique content here -->
                        <div class="content-entry">
                            <h2 class="entry-title">Your Content Title</h2>
                            <div class="entry-content">
                                <p>Your content here...</p>
                            </div>
                        </div>
                    </div>
                </section>

<!--#include file="includes/sidebar-right.html" -->
            </div>
        </div>
    </main>

<!--#include file="includes/footer.html" -->
</body>
</html>
```

### Creating New Pages
1. Copy an existing template: `cp templates/existing.template.html templates/newpage.template.html`
2. Edit the center content between the sidebar includes
3. Run `./build.sh`
4. Deploy the generated `.html` files

## 🚀 Workflow

### Daily Development
1. **Edit templates** - Work in `templates/*.template.html` files
2. **See includes clearly** - BBEdit-style `<!--#include file="path" -->` syntax
3. **Build** - Run `./build.sh` to generate final `.html` files
4. **Deploy** - Upload generated files to your web server

### Updating Shared Components
1. Edit `includes/header.html` (or any include file)
2. Run `./build.sh`
3. Deploy - ALL pages using that include are automatically updated

### Adding New Content Types
1. Create a new template: `templates/newtype.template.html`
2. Use the same include structure
3. Focus only on the unique center content
4. Build and deploy

## ✅ Benefits

### vs WordPress
- ✅ **No bloat** - Static files, no database, no plugins
- ✅ **Fast loading** - Single CSS file, minimal JavaScript
- ✅ **Security** - No admin interface to hack
- ✅ **Maintainable** - Clear separation of components
- ✅ **Version control friendly** - Text files in git

### vs Complex Frameworks
- ✅ **Simple** - Bash script, no build pipeline complexity
- ✅ **Transparent** - You see exactly what includes are used
- ✅ **Fast development** - No compilation steps
- ✅ **Easy debugging** - Generated HTML is exactly what you see

### vs Manual HTML
- ✅ **DRY principle** - Edit header once, affects all pages
- ✅ **Consistent structure** - All pages use same components
- ✅ **Easy maintenance** - Change navigation in one file

## 🔧 Deployment Integration

### With Existing Deploy Scripts
Add build step to your deployment:

```bash
# In your deploy script
echo "🔨 Building includes..."
./build.sh

echo "📦 Deploying files..."
rsync -avz --exclude 'templates/' --exclude 'includes/' *.html styles.css user@server:/path/to/site/
```

### Git Workflow
```bash
# Work on templates
git add templates/ includes/ styles.css
git commit -m "Update site content"

# Build and deploy
./build.sh
./deploy.sh
```

## 🌐 Multi-Site Usage

### Shared Include Library
Create a shared includes library for common components:

```
shared-includes/
├── generic-head.html
├── analytics.html
└── common-footer.html

site1/
├── includes/
│   ├── head.html          # Site-specific
│   └── header.html        # Site-specific
├── shared -> ../shared-includes/  # Symlink
└── templates/

site2/
├── includes/
└── shared -> ../shared-includes/  # Symlink
```

### Site-Specific Customization
Each site can have:
- Unique header/navigation in `includes/header.html`
- Shared analytics/tracking in `shared/analytics.html`
- Site-specific styles in individual `styles.css`

## 🎯 Best Practices

### File Organization
- Keep includes focused and atomic
- Use descriptive filenames (`sidebar-ads.html` not `sidebar.html`)
- Organize CSS with clear section comments
- Name templates by content type (`blog.template.html`)

### Content Strategy
- Sidebars should have dynamic/rotating content anyway
- Focus template edits on the center column content
- Use generic CSS classes for consistency
- Plan for mobile-responsive design

### Maintenance
- Regular builds ensure all includes are working
- Version control both templates and generated files
- Test builds locally before deployment
- Keep documentation updated

## 📚 Example Implementations

- **ROFLFaucet**: Progress diary, main faucet page
- **ClickForCharity**: Blog posts, project pages
- **DirectSponsor**: Documentation, marketing pages

Each implementation shows how the same system adapts to different content types while maintaining consistency.

---

**This system brings back the simplicity of BBEdit's includes while providing modern deployment capabilities. Perfect for sites that need maintainability without WordPress bloat.**

