#!/bin/bash
# ROFLFaucet Project Cleanup Script
# Removes identified obsolete files while preserving docs and important files

echo "🧹 Starting ROFLFaucet project cleanup..."
echo "This will remove obsolete files identified during analysis"
echo ""

# Function to safely remove files/directories
safe_remove() {
    local target="$1"
    if [ -e "$target" ]; then
        echo "  🗑️  Removing: $target"
        rm -rf "$target"
    else
        echo "  ⚠️  Not found (already removed?): $target"
    fi
}

# Function to show disk space saved
show_space_before() {
    echo "📊 Calculating space usage before cleanup..."
    SPACE_BEFORE=$(du -sh . | cut -f1)
    echo "Current directory size: $SPACE_BEFORE"
    echo ""
}

show_space_after() {
    echo ""
    echo "📊 Cleanup complete!"
    SPACE_AFTER=$(du -sh . | cut -f1)
    echo "Directory size after cleanup: $SPACE_AFTER (was $SPACE_BEFORE)"
}

# Check current directory
if [[ ! -f "build.sh" ]] || [[ ! -d "includes" ]]; then
    echo "❌ Error: This doesn't appear to be the roflfaucet project directory"
    echo "Please run this script from the roflfaucet root directory"
    exit 1
fi

show_space_before

echo "🗑️  PHASE 1: Removing backup files created by build script..."
safe_remove "./backups/*.bak"

echo ""
echo "🗑️  PHASE 2: Removing old server backups..."
safe_remove "./server-backups"

echo ""
echo "🗑️  PHASE 3: Removing Node.js chat system archive..."
safe_remove "./archives/nodejs-chat-system-complete"

echo ""
echo "🗑️  PHASE 4: Removing explicitly redundant PHP files..."
safe_remove "./archives/php-redundant"

echo ""
echo "🗑️  PHASE 5: Removing old template archives..."
safe_remove "./archives/includes_templates"

echo ""
echo "🗑️  PHASE 6: Removing old slot implementations..."
safe_remove "./archives/slots-minimal.html"
safe_remove "./archives/slots-old-direct.html"

echo ""
echo "🗑️  PHASE 7: Removing temporary and test files..."
safe_remove "./wget-log"
safe_remove "./dice-content-backup.txt"
safe_remove "./test-auth.sh"
safe_remove "./test-flat-file-system.html"
safe_remove "./test-integer-dice-system.js"

echo ""
echo "🗑️  PHASE 8: Removing backup from live (if you confirmed current is working)..."
safe_remove "./backup-from-live"

echo ""
echo "🗑️  PHASE 9: Removing sensitive backups (keeping them - you may need to review these manually)..."
echo "  ℹ️  Keeping ./SENSITIVE_BACKUPS/ - please review these manually"

echo ""
echo "🗑️  PHASE 10: Removing old archive files and other obsolete items..."
safe_remove "./profile-standalone-backup.html"
safe_remove "./original-dice-replica.html"

# Clean up any empty directories in archives
echo ""
echo "🧹 Cleaning up empty archive directories..."
if [ -d "./archives" ]; then
    find ./archives -type d -empty -delete 2>/dev/null
    # If archives directory is now empty, remove it too
    if [ -z "$(ls -A ./archives 2>/dev/null)" ]; then
        safe_remove "./archives"
    fi
fi

show_space_after

echo ""
echo "✅ Cleanup completed successfully!"
echo ""
echo "📋 SUMMARY OF WHAT WAS REMOVED:"
echo "  • Build script backup files (*.bak)"
echo "  • Old server configuration backups"  
echo "  • Node.js chat system archive"
echo "  • Redundant PHP files"
echo "  • Old template system"
echo "  • Obsolete slot machine implementations"
echo "  • Temporary and test files"
echo "  • Backup from live site"
echo "  • Various obsolete files and empty directories"
echo ""
echo "📋 WHAT WAS PRESERVED:"
echo "  • All documentation in /docs"
echo "  • Current working files"
echo "  • Active include templates"
echo "  • SENSITIVE_BACKUPS (for manual review)"
echo ""
echo "🔍 NEXT STEPS:"
echo "  1. Test your site to ensure everything works"
echo "  2. Review ./SENSITIVE_BACKUPS/ manually if needed"
echo "  3. Run your build script to ensure it still works: ./build.sh"
echo ""
echo "If anything broke, you can restore from git if this is a git repository."
