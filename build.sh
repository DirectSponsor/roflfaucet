#!/bin/bash
# Linear Include Processor with Placeholder Support
# Processes <!-- include start xxx --> and <!-- include end xxx --> tags
# Also processes #TITLE#, #DESC#, #KEYWORDS#, #STYLES#, #SCRIPTS# placeholders
# Clean, fast template system for SatoshiHost network sites

echo "🔨 Building HTML files with includes and placeholders..."

# Function to process placeholders in a file
process_placeholders() {
    local input_file="$1"
    local output_file="$2"
    local temp_file=$(mktemp)
    
    echo "  🔄 Processing placeholders in: $input_file"
    
    # Copy input to temp file
    cp "$input_file" "$temp_file"
    
    # Extract placeholder values from comment lines
    while IFS= read -r line; do
        # Check if line contains placeholder pattern
        if [[ "$line" == *"TITLE=_"* ]]; then
            local placeholder_name="TITLE"
            local placeholder_value="${line#*TITLE=_}"
            placeholder_value="${placeholder_value%_*}"
        elif [[ "$line" == *"DESC=_"* ]]; then
            local placeholder_name="DESC"
            local placeholder_value="${line#*DESC=_}"
            placeholder_value="${placeholder_value%_*}"
        elif [[ "$line" == *"KEYWORDS=_"* ]]; then
            local placeholder_name="KEYWORDS"
            local placeholder_value="${line#*KEYWORDS=_}"
            placeholder_value="${placeholder_value%_*}"
        elif [[ "$line" == *"STYLES=_"* ]]; then
            local placeholder_name="STYLES"
            local placeholder_value="${line#*STYLES=_}"
            placeholder_value="${placeholder_value%_*}"
        elif [[ "$line" == *"SCRIPTS=_"* ]]; then
            local placeholder_name="SCRIPTS"
            local placeholder_value="${line#*SCRIPTS=_}"
            placeholder_value="${placeholder_value%_*}"
        else
            continue
        fi
        
        echo "    📝 $placeholder_name = '$placeholder_value'"
        
        # Handle special processing for STYLES and SCRIPTS
        if [[ "$placeholder_name" == "STYLES" ]]; then
            # Convert comma-separated styles to link tags
            local styles_html=""
            if [[ -n "$placeholder_value" ]]; then
                IFS=',' read -ra STYLES <<< "$placeholder_value"
                for style in "${STYLES[@]}"; do
                    style=$(echo "$style" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')  # trim whitespace
                    if [[ -n "$style" ]]; then
                        styles_html="$styles_html    <link rel=\"stylesheet\" href=\"$style\">\n"
                    fi
                done
            fi
            # Replace #STYLES# with generated HTML
            sed -i "s|#STYLES#|$styles_html|g" "$temp_file"
            
        elif [[ "$placeholder_name" == "SCRIPTS" ]]; then
            # Convert comma-separated scripts to script tags
            local scripts_html=""
            if [[ -n "$placeholder_value" ]]; then
                IFS=',' read -ra SCRIPTS <<< "$placeholder_value"
                for script in "${SCRIPTS[@]}"; do
                    script=$(echo "$script" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')  # trim whitespace
                    if [[ -n "$script" ]]; then
                        scripts_html="$scripts_html    <script src=\"$script\"></script>\n"
                    fi
                done
            fi
            # Replace #SCRIPTS# with generated HTML
            sed -i "s|#SCRIPTS#|$scripts_html|g" "$temp_file"
            
        else
            # Regular placeholder replacement
            sed -i "s|#$placeholder_name#|$placeholder_value|g" "$temp_file"
        fi
    done < "$input_file"
    
    # Move processed file to output
    mv "$temp_file" "$output_file"
    echo "  ✅ Placeholders processed"
}

# Function to process includes in a file - linear single pass
process_includes() {
    local input_file="$1"
    local output_file="$2"
    local temp_file=$(mktemp)
    
    echo "📄 Processing: $input_file → $output_file"
    
    # Process file line by line
    local in_include=false
    local include_name=""
    
    while IFS= read -r line; do
        # Check for include start tag
        if [[ "$line" =~ \<\!--[[:space:]]*include[[:space:]]+start[[:space:]]+([^[:space:]]+)[[:space:]]*--\> ]]; then
            include_name="${BASH_REMATCH[1]}"
            in_include=true
            echo "  📎 Including: $include_name"
            
            # Add the start comment
            echo "$line" >> "$temp_file"
            
            # Add the include file content
            include_path="includes/$include_name"
            
            if [[ -f "$include_path" ]]; then
                cat "$include_path" >> "$temp_file"
            else
                echo "  ⚠️  Include file not found: $include_path"
                echo "<!-- ERROR: Include file not found: $include_path -->" >> "$temp_file"
            fi
            
        # Check for include end tag
        elif [[ "$line" =~ \<\!--[[:space:]]*include[[:space:]]+end[[:space:]]+([^[:space:]]+)[[:space:]]*--\> ]]; then
            end_include_name="${BASH_REMATCH[1]}"
            
            if [[ "$end_include_name" == "$include_name" ]]; then
                # Add the end comment
                echo "$line" >> "$temp_file"
                in_include=false
                include_name=""
            else
                echo "  ⚠️  Mismatched include tags: started with '$include_name' but ended with '$end_include_name'"
                echo "$line" >> "$temp_file"
            fi
            
        # Regular line - only add if we're not inside an include block
        elif [[ "$in_include" == false ]]; then
            echo "$line" >> "$temp_file"
        fi
        # If we're inside an include block, skip the line (it gets replaced by include content)
        
    done < "$input_file"
    
    # Move final result to output
    mv "$temp_file" "$output_file"
    echo "  ✅ Built: $output_file"
}

# Process HTML files with include tags
processed_count=0

# Check if a specific file was provided as argument
if [[ -n "$1" ]]; then
    # Process single file
    htmlfile="$1"
    if [[ -f "$htmlfile" ]] && grep -q "include start" "$htmlfile"; then
        # Create backup in backups folder
        mkdir -p backups
        cp "$htmlfile" "backups/${htmlfile}.bak"
        
        # Process includes in place  
        process_includes "$htmlfile" "$htmlfile"
        
        # Process placeholders after includes
        process_placeholders "$htmlfile" "$htmlfile"
        ((processed_count++))
    elif [[ -f "$htmlfile" ]]; then
        echo "📁 File '$htmlfile' found but contains no include tags"
    else
        echo "❌ File '$htmlfile' not found"
        exit 1
    fi
else
    # Process all HTML files that contain include tags
    for htmlfile in *.html; do
        if [[ -f "$htmlfile" ]] && grep -q "include start" "$htmlfile"; then
            # Create backup in backups folder
            mkdir -p backups
            cp "$htmlfile" "backups/${htmlfile}.bak"
            
            # Process includes in place  
            process_includes "$htmlfile" "$htmlfile"
            
            # Process placeholders after includes
            process_placeholders "$htmlfile" "$htmlfile"
            ((processed_count++))
        fi
    done
fi

if [[ $processed_count -eq 0 ]]; then
    echo "📁 No HTML files with includes found"
    echo "💡 Add include tags to HTML files like: \u003c!-- include start header.html --\u003e"
else
    echo ""
    echo "🎉 Build complete! Updated $processed_count HTML file(s)"
    
    # Fix permissions for web server access
    echo "🔧 Setting web server permissions..."
    chmod 644 *.html
    echo "✅ Permissions set to 644 (web server readable)"
    
    echo ""
    echo "📝 Include syntax:"
    echo "   \u003c!-- include start header.html --\u003e"
    echo "   \u003c!-- include end header.html --\u003e"
    echo ""
    echo "📂 Directory structure:"
    echo "   includes/           - Shared HTML snippets (header, footer, sidebars)"
    echo "   *.html              - Your pages (edit these directly)"
    echo "   backups/*.html.bak  - Automatic backups created during build"
fi

# Ensure script exits with success
exit 0

