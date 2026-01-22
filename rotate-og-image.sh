#!/bin/bash

# Rotate OpenGraph image daily
# Place numbered images (01.jpg, 02.jpg, etc.) in the og-images folder
# This script renames one to og-image.jpg each day

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OG_DIR="$SCRIPT_DIR/site/images/og-images"
TARGET="$SCRIPT_DIR/site/images/og-image.jpg"

# Create og-images directory if it doesn't exist
mkdir -p "$OG_DIR"

# Find which image is currently active (missing from og-images folder)
current_active=""
for img in "$OG_DIR"/*.jpg; do
    [ -f "$img" ] || continue
    basename=$(basename "$img")
    # Check if this numbered image exists
    if [ ! -f "$OG_DIR/$basename" ]; then
        current_active="$basename"
        break
    fi
done

# If og-image.jpg exists, find which number it came from by checking what's missing
if [ -f "$TARGET" ]; then
    # Find the missing numbered file
    for num in {01..99}; do
        if [ ! -f "$OG_DIR/${num}.jpg" ]; then
            current_active="${num}.jpg"
            break
        fi
    done
    
    # Restore the current og-image back to its numbered name
    if [ -n "$current_active" ]; then
        echo "Restoring $TARGET to $OG_DIR/$current_active"
        mv "$TARGET" "$OG_DIR/$current_active"
    fi
fi

# Find the next image in sequence
next_image=""
found_current=false

for num in {01..99}; do
    img="$OG_DIR/${num}.jpg"
    [ -f "$img" ] || continue
    
    if [ "$found_current" = true ]; then
        next_image="$img"
        break
    fi
    
    if [ "$(basename "$img")" = "$current_active" ]; then
        found_current=true
    fi
done

# If no next image found (we're at the end), wrap to first image
if [ -z "$next_image" ]; then
    next_image=$(find "$OG_DIR" -name "*.jpg" | sort | head -n1)
fi

# If we found an image to use, move it to og-image.jpg
if [ -n "$next_image" ] && [ -f "$next_image" ]; then
    echo "Activating $(basename "$next_image") as og-image.jpg"
    mv "$next_image" "$TARGET"
    echo "✅ OG image rotated successfully"
else
    echo "❌ No images found in $OG_DIR"
    exit 1
fi
