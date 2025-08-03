# Archived Redundant PHP Files

These PHP files were archived on 2025-08-03 because they are no longer in use.

## Gallery System Files
- **Why archived**: Replaced with JavaScript-based gallery system using text files
- **Location**: `gallery-system/`
- **Files**:
  - `gallery-system.php` - Main gallery system (from includes/)
  - `gallery-system-template.php` - Template version (from includes_templates/)
  - `fetch-giphy-gallery.php` - GIPHY API fetcher (from scripts/)
  - `update-gallery.php` - Cron job updater (from scripts/)

## Reason for Switch
The API-based gallery system was abandoned in favor of a simpler JavaScript system that reads from text files (`data/giphy_gallery.txt`, `data/vgy_gallery.txt`, etc.) because:
- APIs were unreliable or problematic
- Simple text-file approach works better for the use case
- No server-side processing needed

## Active System
Current gallery system: `scripts/core/gallery-system-simple.js`
