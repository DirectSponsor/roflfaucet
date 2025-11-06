# ROFLFaucet - Image Upload & Project Creation System Context

to add in an appropriate place, to-do: 
❌ Location is required appears on the edit page now but the location field has gone. 

## ✅ COMPLETED - Full Working System (2025-10-18)

### 🎯 Major Achievements
1. **Complete image upload system working** - Both create and edit forms handle images perfectly
2. **Unified project creation flow** - No more separate "draft" system, just immediate project creation
3. **Lightning address persistence** - Addresses properly stored and retrieved for editing
4. **Validation improvements** - Location required, @coinos.io address validation
5. **Clean UI** - Removed unnecessary remove buttons, centered images, proper height constraints
6. **Error message cleanup** - Removed "(Check console for details)" text

### 🔧 Technical Implementation Details
- **Immediate project ID allocation** using first-available-slot algorithm (003, not next sequential)
- **Template system** with comment tags for all fields including `<!-- lightning-address -->`
- **Placeholder image copying** for projects without custom images
- **Image constraints**: max-height 500px, centered, object-fit contain
- **Cleanup mechanism** for abandoned projects (1 hour timeout)

## ✅ SOLUTION IMPLEMENTED: Option A - Immediate Project ID Assignment

### 🎯 How It Works
1. **Page loads** → Creates real project file (003-project-in-progress.html) with placeholder content
2. **Image upload** → Saves directly as project-003.jpg using reserved project ID  
3. **Form submission** → Updates same project file with real data via `update_project` API
4. **Cleanup** → Automated script removes abandoned placeholder projects after 1 hour

### 🏗️ System Architecture
- **No "draft" concept** - just real projects with placeholder content initially
- **First-available-slot allocation** - deleted project 003 gets reused, not skipped
- **Unified template system** - both create and edit use same HTML template with comment tags
- **Automatic placeholder images** - copied on project creation if no custom image uploaded

## Technical Implementation Details

### Files Modified Today
- `site/create-project.html` - Added image upload UI and CSS, standardized lightning address field
- Deployed successfully to live site

### Current Form JavaScript Structure
- Create page: Uses JSON submission to `project-management-api-v2.php`
- Edit page: Uses FormData, handles image upload first, then updates project
- Image upload API: `site/api/upload-project-image.php` - expects project_id, creates `project-{id}.jpg`

### Next Steps Required
1. **Design decision** on draft system approach
2. Implement draft project creation on page load
3. Modify image upload to work with draft/real project IDs
4. Add cleanup mechanism for abandoned drafts
5. Test full create → image upload → save flow

## 📋 Current System Status
- ✅ **Create page**: Full functionality with image uploads, validation, and persistence
- ✅ **Edit page**: Simplified interface, lightning address persistence, proper image display
- ✅ **Image system**: Placeholder + custom images, proper constraints (500px height, centered)
- ✅ **Validation**: Location required, @coinos.io addresses only, clean error messages
- ✅ **Template system**: All fields supported including lightning-address comment tags

## 📝 Next Steps / Minor Improvements
1. **Improve placeholder image** - Make it more encouraging for custom uploads
2. **Recreate projects 001-002** - With new template system for lightning address support
3. **Test cleanup script** - Ensure 1-hour cleanup works properly
4. **Consider placeholder messaging** - Text overlay encouraging custom images

## 📁 File Locations
- **Create form**: `site/create-project.html` - Full image upload + validation
- **Edit form**: `site/edit-project-v2.html` - Simplified interface without remove buttons  
- **Template**: `site/project-template.html` - With lightning-address comment tags
- **Image upload API**: `site/api/upload-project-image.php` - Handles project-{id}.jpg files
- **Project API**: `site/api/project-management-api-v2.php` - Unified create/update system
- **Cleanup script**: `cleanup-abandoned-projects.php` - 1-hour timeout cleanup
- **Projects stored**: `/var/roflfaucet-data/projects/pending/{id}-{slug}.html`
- **Images stored**: `/var/www/html/images/projects/project-{id}.jpg`
