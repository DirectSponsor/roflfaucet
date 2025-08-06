<?php
/**
 * Configuration Template
 * 
 * To use this:
 * 1. Copy this file to config.php
 * 2. Replace the placeholder values with your real passwords
 * 3. Never commit config.php to Git (it's already in .gitignore)
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'roflfaucet');
define('DB_USER', 'roflfaucet');
define('DB_PASS', 'YOUR_DATABASE_PASSWORD_HERE');

// JWT Configuration
define('JWT_SECRET', 'YOUR_JWT_SECRET_HERE');

// Listmonk Configuration (if you ever need it again)
define('LISTMONK_DB_HOST', 'localhost');
define('LISTMONK_DB_PORT', '9432');
define('LISTMONK_DB_NAME', 'listmonk');
define('LISTMONK_DB_USER', 'listmonk');
define('LISTMONK_DB_PASS', 'YOUR_LISTMONK_PASSWORD_HERE');
?>
