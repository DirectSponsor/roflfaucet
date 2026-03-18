#!/bin/bash
# Deploy analytics to roflfaucet

set -e

REMOTE="es7-roflfaucet"
WEBROOT="/var/www/html"
DATA="$WEBROOT/data/analytics"
LOG="/var/log/apache2/roflfaucet_ssl_access.log"
SHARED="$(dirname "$0")/../shared-tools/access-logger"

echo "Deploying analytics to roflfaucet..."

echo "1. Copying files..."
scp "$SHARED/analytics.py" "$REMOTE:/tmp/"
scp "$SHARED/stats.html" "$REMOTE:/tmp/stats-template.html"

echo "2. Deploying parser..."
ssh "$REMOTE" "cp /tmp/analytics.py /usr/local/bin/analytics.py && chmod +x /usr/local/bin/analytics.py"

echo "3. Creating data directory..."
ssh "$REMOTE" "mkdir -p $DATA && chown www-data:www-data $DATA && chmod 755 $DATA"

echo "4. Deploying dashboard..."
ssh "$REMOTE" "sed 's/var SITE_NAME = .*/var SITE_NAME = \x27roflfaucet\x27;/' /tmp/stats-template.html > $WEBROOT/stats.html && chown www-data:www-data $WEBROOT/stats.html && chmod 644 $WEBROOT/stats.html"

echo "5. Running initial parse..."
ssh "$REMOTE" "python3 /usr/local/bin/analytics.py $LOG -d $DATA"

echo ""
echo "Done!"
echo "Dashboard: https://roflfaucet.com/stats.html"
echo "Data dir:  $DATA"
echo ""
echo "Next: set up cron and backfill historical logs"
