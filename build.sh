#!/bin/bash

# Simple HTML Include Build Script
# Replaces content between <!-- include filename --> and <!-- end include filename -->

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INCLUDES_DIR="$SCRIPT_DIR/includes"
SITE_DIR="$SCRIPT_DIR/site"

echo "🏗️  Processing HTML includes..."

# Process each HTML file in site
for html_file in "$SITE_DIR"/*.html; do
    [ -f "$html_file" ] || continue
    
    echo "Processing $(basename "$html_file")..."
    
    # Create temp file
    temp_file=$(mktemp)
    
    # Process the file
    in_include=false
    while IFS= read -r line; do
        if [[ $line =~ \<!--\ include\ ([^\ ]+)\ --\> ]]; then
            # Found include start marker
            include_file="${BASH_REMATCH[1]}"
            include_path="$INCLUDES_DIR/$include_file"
            
            echo "  Including $include_file"
            
            # Write the include marker
            echo "$line" >> "$temp_file"
            
            # Insert the include content if file exists
            if [ -f "$include_path" ]; then
                cat "$include_path" >> "$temp_file"
            else
                echo "  Warning: $include_file not found"
            fi
            
            # Set flag to skip content until end marker
            in_include=true
        elif [[ $line =~ .*\<!--\ end\ include\ ([^\ ]+)\ --\>.* ]]; then
            # Found end marker, write it and stop skipping
            echo "$line" >> "$temp_file"
            in_include=false
        elif [[ $in_include == false ]]; then
            # Regular line (not inside include block), copy it
            echo "$line" >> "$temp_file"
        fi
        # If in_include is true, we skip the line (this replaces old content)
    done < "$html_file"
    
    # Replace original with processed version using mv for better inotifywait detection
    mv "$temp_file" "$html_file"
    
    # Force inotifywait to detect the change by updating the timestamp
    touch "$html_file"
done

echo "✅ Build completed!"
