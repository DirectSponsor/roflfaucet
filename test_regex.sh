#!/bin/bash

# Test line from the file
line='<!-- #TITLE#=@@ROFLFaucet - Earn UselessCoins@@ -->'
echo "Testing line: $line"

# Test the regex
if [[ "$line" =~ \<!--[[:space:]]*#([A-Z]+)#=@@(.*)@@[[:space:]]*--\> ]]; then
    echo "✅ Regex matched!"
    echo "Name: ${BASH_REMATCH[1]}"
    echo "Value: ${BASH_REMATCH[2]}"
else
    echo "❌ Regex did not match"
fi

echo "Trying simpler pattern..."
if [[ "$line" =~ #([A-Z]+)#=@@(.*)@@ ]]; then
    echo "✅ Simple regex matched!"
    echo "Name: ${BASH_REMATCH[1]}"
    echo "Value: ${BASH_REMATCH[2]}"
else
    echo "❌ Simple regex did not match"
fi
