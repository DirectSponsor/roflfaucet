#!/bin/bash
# Test script for lazy loading from auth server
# This tests that new users created on auth server are automatically synced to ROFLFaucet

echo "🧪 Testing Lazy Loading Sync System"
echo "===================================="
echo ""

# Test user ID (use an existing test user that has files on auth but not locally)
TEST_USER="3-lightninglova"

echo "Test: Fetching profile for user: $TEST_USER"
echo "This should work even if local file doesn't exist..."
echo ""

# Test profile API
echo "1️⃣ Testing Profile API (GET):"
PROFILE_RESPONSE=$(curl -s "https://roflfaucet.com/api/simple-profile.php?action=profile&user_id=$TEST_USER")
echo "$PROFILE_RESPONSE" | jq '.'

if echo "$PROFILE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Profile API returned successfully"
else
    echo "❌ Profile API failed"
fi

echo ""
echo "2️⃣ Testing Balance API (GET):"
BALANCE_RESPONSE=$(curl -s "https://roflfaucet.com/api/coins-balance.php?action=balance&user_id=$TEST_USER")
echo "$BALANCE_RESPONSE" | jq '.'

if echo "$BALANCE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Balance API returned successfully"
else
    echo "❌ Balance API failed"
fi

echo ""
echo "3️⃣ Verifying auth server has this user's data:"
AUTH_PROFILE=$(curl -s "https://auth.directsponsor.org/api/sync.php?action=get&user_id=$TEST_USER&data_type=profile")
echo "Auth server profile:"
echo "$AUTH_PROFILE" | jq '.'

AUTH_BALANCE=$(curl -s "https://auth.directsponsor.org/api/sync.php?action=get&user_id=$TEST_USER&data_type=balance")
echo "Auth server balance:"
echo "$AUTH_BALANCE" | jq '.'

echo ""
echo "✅ Test complete!"
echo ""
echo "Expected behavior:"
echo "- If local files don't exist, APIs should fetch from auth server"
echo "- Data should be cached locally after first request"
echo "- Subsequent requests should use local cache"
