# ROFLFaucet Project URL System - Complete Context

## Current Status (October 13, 2025)

### ✅ What's Working Now
1. **Apache Alias Configuration**: Successfully configured Apache to serve project files from `/var/roflfaucet-data/projects/` at `/projects/` URL
2. **Security**: Only HTML files are accessible, JSON/backup files are blocked (403 Forbidden)
3. **No Symlinks**: Eliminated symlink dependency entirely
4. **Clean URLs**: Project URLs work as `https://roflfaucet.com/projects/project-001.html`
5. **Updated Forms**: Edit form and API return correct `/projects/` URLs
6. **Deployment Safe**: User project files stay on server, never overwritten by deployments

### 🔄 Next Enhancement: SEO-Friendly URLs

**Current**: `project-001.html`
**Proposed**: `001-bitcoin-education-ghana.html` (auto-generated from title + user editable)

## Technical Implementation Plan

### 1. URL Slug Generation Function
```php
function generateSlug($title, $projectId) {
    // Remove punctuation, convert to lowercase
    $slug = strtolower(preg_replace('/[^a-zA-Z0-9\s]/', '', $title));
    
    // Remove common short words
    $stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an'];
    $words = explode(' ', $slug);
    $words = array_filter($words, function($word) use ($stopWords) {
        return strlen($word) > 2 && !in_array($word, $stopWords);
    });
    
    // Take first 4-5 meaningful words, join with hyphens
    $keywords = array_slice($words, 0, 5);
    return $projectId . '-' . implode('-', $keywords) . '.html';
}
```

### 2. Database/File Structure Changes Needed

#### Add to Project Data Structure:
```php
$projectData = [
    'id' => $projectId,
    'title' => 'Bitcoin Education in Ghana',
    'url_slug' => '001-bitcoin-education-ghana.html', // NEW FIELD
    'description' => '...',
    // ... other fields
];
```

#### Update HTML Template:
Add comment marker for URL slug in `project-template.html`:
```html
<!-- url-slug -->001-bitcoin-education-ghana.html<!-- end url-slug -->
```

### 3. Form Changes Required

#### Create Project Form (`create-project.html`):
Add new field after title:
```html
<div class="form-group">
    <label for="projectUrl">Project URL *</label>
    <div class="url-preview">https://roflfaucet.com/projects/<span id="urlPreview">001-your-project-title.html</span></div>
    <input type="text" id="projectUrl" name="project_url" required pattern="^[0-9]{3}-[a-z0-9-]+\.html$">
    <div class="form-help">SEO-friendly URL (auto-generated from title, but you can customize it)</div>
</div>
```

#### Edit Project Form (`edit-project-v2.html`):
Add URL editing capability:
```html
<div class="form-group">
    <label for="projectUrl">Project URL</label>
    <div class="url-preview">https://roflfaucet.com/projects/<span id="urlPreview"></span></div>
    <input type="text" id="projectUrl" class="form-input" required>
    <div class="form-help">⚠️ Changing URL will break existing links. Update carefully.</div>
</div>
```

### 4. API Changes Required (`project-management-api-v2.php`)

#### Create Project Function:
```php
function createProject($data) {
    // ... existing validation ...
    
    $projectId = getNextProjectId();
    $autoSlug = generateSlug($data['title'], $projectId);
    $userSlug = $data['project_url'] ?? $autoSlug;
    
    // Validate user slug
    if (!preg_match('/^[0-9]{3}-[a-z0-9-]+\.html$/', $userSlug)) {
        return ['success' => false, 'error' => 'Invalid URL format'];
    }
    
    // Check if slug already exists
    if (file_exists("/var/roflfaucet-data/projects/$userSlug")) {
        return ['success' => false, 'error' => 'URL already exists'];
    }
    
    $projectData = [
        // ... existing fields ...
        'url_slug' => $userSlug
    ];
    
    $success = createProjectHtmlFile($projectId, $projectData, $username, $userSlug);
    
    if ($success) {
        return [
            'success' => true,
            'project_id' => $projectId,
            'project_url' => "/projects/$userSlug"
        ];
    }
}
```

#### Update Project Function:
Handle URL changes carefully (rename files, update references):
```php
function updateProject($data) {
    // ... existing validation ...
    
    $oldSlug = extractByComments($html, 'url-slug');
    $newSlug = $data['project_url'] ?? $oldSlug;
    
    if ($newSlug !== $oldSlug) {
        // Rename file
        $oldFile = "/var/roflfaucet-data/projects/$oldSlug";
        $newFile = "/var/roflfaucet-data/projects/$newSlug";
        
        if (file_exists($newFile)) {
            return ['success' => false, 'error' => 'URL already exists'];
        }
        
        rename($oldFile, $newFile);
    }
    
    // Update slug in HTML
    $html = updateByComments($html, 'url-slug', $newSlug);
}
```

### 5. JavaScript Changes Required

#### Auto-generate URL in Create Form:
```javascript
document.getElementById('projectTitle').addEventListener('input', function(e) {
    const title = e.target.value;
    const slug = generateClientSlug(title, projectId);
    document.getElementById('projectUrl').value = slug;
    document.getElementById('urlPreview').textContent = slug;
});

function generateClientSlug(title, projectId) {
    // Mirror the PHP function in JavaScript
    const slug = title.toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(' ')
        .filter(word => word.length > 2)
        .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word))
        .slice(0, 5)
        .join('-');
    
    return `${projectId}-${slug}.html`;
}
```

## Current File Locations

### Configuration Files:
- **Apache Config**: `/etc/apache2/sites-enabled/roflfaucet-ssl.conf` (updated with alias)
- **Project Template**: `/var/www/html/project-template.html`
- **API**: `/var/www/html/api/project-management-api-v2.php`

### Forms:
- **Create**: `/var/www/html/create-project.html`
- **Edit**: `/var/www/html/edit-project-v2.html`

### Data Directory:
- **Projects**: `/var/roflfaucet-data/projects/` (contains HTML files and JSON backups)

## Migration Strategy for Existing Projects

### Current Projects:
- `project-001.html` → `001-bitcoin-education-ghana.html`
- `project-002.html` → `002-lightning-lova.html`
- `project-003.html` → `003-test-project.html`

### Migration Steps:
1. Add URL slug extraction to existing project files
2. Rename files to SEO-friendly names
3. Update any existing links/references
4. Add Apache redirects for old URLs (temporary)

## Testing Checklist

### Before Implementation:
- [ ] Test current system works (`/projects/project-001.html`)
- [ ] Backup current project files
- [ ] Test Apache alias security (JSON files blocked)

### After Implementation:
- [ ] Test slug generation function
- [ ] Test project creation with auto-generated URLs
- [ ] Test project editing with URL changes
- [ ] Test URL validation
- [ ] Test duplicate URL prevention
- [ ] Verify old URLs redirect to new URLs
- [ ] Test deployment doesn't affect project files

## Security Considerations

1. **URL Validation**: Strict regex pattern `^[0-9]{3}-[a-z0-9-]+\.html$`
2. **File System Safety**: No directory traversal, only alphanumeric + hyphens
3. **Duplicate Prevention**: Check file existence before creation
4. **Apache Security**: Maintains existing security (only HTML files served)

## Performance Notes

- **File Naming**: SEO-friendly names don't affect Apache alias performance
- **Database**: Still file-based system, no database changes needed
- **Caching**: Apache serves static files efficiently

## Future Enhancements

1. **URL History**: Track old URLs for 301 redirects
2. **Custom Domains**: Allow projects to have custom domains
3. **URL Analytics**: Track which URLs perform better for SEO
4. **Bulk URL Updates**: Admin tool for mass URL updates

---

**Next Session Tasks:**
1. Implement slug generation function
2. Update create project form with URL field
3. Update API to handle URL slugs
4. Test complete workflow
5. Migrate existing projects to new URL format

**Files to Edit Next Session:**
- `site/api/project-management-api-v2.php` (add slug generation)
- `site/create-project.html` (add URL field)
- `site/edit-project-v2.html` (add URL editing)
- `site/project-template.html` (add URL slug comment)

**Current Status**: ✅ Basic URL system working, ready for SEO enhancement