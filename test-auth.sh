#!/bin/bash
# Auth System Health Check
# Run this before deploying changes to ensure auth is working

echo "🔍 Testing Authentication System Health..."

# Test 1: Check if auth server is responding
echo "1. Testing auth server..."
if curl -s -o /dev/null -w "%{http_code}" https://auth.directsponsor.org/jwt-login.php | grep -q "200\|302"; then
    echo "✅ Auth server responding"
else
    echo "❌ Auth server not responding"
    exit 1
fi

# Test 2: Check if data API is responding
echo "2. Testing data API server..."
if curl -s -o /dev/null -w "%{http_code}" https://data.directsponsor.org/api/dashboard | grep -q "401\|400"; then
    echo "✅ Data API responding (401/400 expected without token)"
else
    echo "❌ Data API not responding properly"
    exit 1
fi

# Test 3: Check if JWT validation functions exist
echo "3. Testing JWT validation..."
if ssh es3-userdata "grep -q 'base64url_decode' /var/www/data.directsponsor.org/public_html/config.php"; then
    echo "✅ JWT helper functions found"
else
    echo "❌ JWT helper functions missing"
    exit 1
fi

# Test 4: Check JWT secret consistency
echo "4. Testing JWT secret consistency..."
AUTH_SECRET=$(ssh es3-auth "grep 'client_secret' /var/www/auth.directsponsor.org/public_html/config.php | cut -d\"'\" -f2")
DATA_SECRET=$(ssh es3-userdata "grep 'jwt_secret' /var/www/data.directsponsor.org/public_html/config.php | cut -d\"'\" -f2")

if [ "$AUTH_SECRET" = "$DATA_SECRET" ]; then
    echo "✅ JWT secrets match: $AUTH_SECRET"
else
    echo "❌ JWT secrets don't match!"
    echo "   Auth: $AUTH_SECRET"  
    echo "   Data: $DATA_SECRET"
    exit 1
fi

echo ""
echo "🎉 All auth system tests passed!"
echo "✅ Safe to deploy changes"
