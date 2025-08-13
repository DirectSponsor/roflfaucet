<?php
/**
 * ROFLFaucet Production Configuration
 * 
 * ⚠️ THIS FILE CONTAINS REAL CREDENTIALS - NEVER COMMIT TO GIT ⚠️
 * 
 * Automatically excluded from git commits by deploy-roflfaucet-secure.sh
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'roflfaucet');
define('DB_USER', 'roflfaucet');
define('DB_PASS', 'IcCSWX5FubzKzgOr9lWjSecureDB2025!');

// JWT Configuration
define('JWT_SECRET', 'Qmt+vbRvJoMB7DSZgHBIYJ/v7ctbRG6VHMYCFW2LMhg=');

// Site Configuration
define('SITE_ID', 'roflfaucet');
define('SITE_URL', 'https://roflfaucet.com');

// OAuth Server Configuration
define('AUTH_SERVER', 'http://auth.directsponsor.org');
define('DATA_SERVER', 'http://data.directsponsor.org');

// Security Settings
define('SESSION_TIMEOUT', 3600); // 1 hour
define('CLAIM_COOLDOWN', 300);   // 5 minutes

// Debug mode (false in production)
define('DEBUG_MODE', false);

// Listmonk Configuration (legacy - if needed)
define('LISTMONK_DB_HOST', 'localhost');
define('LISTMONK_DB_PORT', '9432');
define('LISTMONK_DB_NAME', 'listmonk');
define('LISTMONK_DB_USER', 'listmonk');
define('LISTMONK_DB_PASS', 'NewListmonkSecurePass2025!');

?>
