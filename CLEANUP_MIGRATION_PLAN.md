# ROFLFaucet Cleanup & Migration Plan

## Phase 1: Export Data (DO THIS FIRST!)

1. **Export email subscribers from Listmonk:**
   ```bash
   # On the server, run:
   cd /path/to/roflfaucet
   git pull
   php export_emails.php
   # This will create listmonk_subscribers_export.csv
   # Download/backup this file before proceeding!
   ```

2. **Backup any other important data if needed**

## Phase 2: Stop and Remove Services

1. **Stop Listmonk and PostgreSQL containers:**
   ```bash
   docker stop listmonk listmonk_db
   docker rm listmonk listmonk_db
   ```

2. **Remove Docker volumes (optional - contains all data):**
   ```bash
   docker volume ls
   # Remove listmonk-related volumes if you're sure you don't need them
   ```

3. **Remove Node.js if not needed:**
   ```bash
   # Check what's installed
   which node npm
   # Remove if installed via package manager
   sudo apt remove nodejs npm
   # Or remove via nvm if that was used
   ```

## Phase 3: Install MySQL

1. **Install MySQL server:**
   ```bash
   sudo apt update
   sudo apt install mysql-server php-mysql
   ```

2. **Secure MySQL installation:**
   ```bash
   sudo mysql_secure_installation
   ```

3. **Create database and user:**
   ```sql
   CREATE DATABASE roflfaucet;
   CREATE USER 'roflfaucet'@'localhost' IDENTIFIED BY 'secure_password_here';
   GRANT ALL PRIVILEGES ON roflfaucet.* TO 'roflfaucet'@'localhost';
   FLUSH PRIVILEGES;
   ```

## Phase 4: Update Application

1. **Update database connections in PHP files to use MySQL**
2. **Run MySQL migration scripts**
3. **Test chat system**
4. **Implement simple email system (if needed) or use external service**

## Files to Clean Up After Migration

- `chat_database_migration_postgres.sql` - PostgreSQL-specific
- `export_emails.php` - Only needed for migration
- Any Listmonk config files
- Node.js related files (if any)

## Benefits of This Approach

- ✅ Simpler setup (MySQL is more common on shared hosting)
- ✅ Better PHP integration
- ✅ Easier to manage and troubleshoot
- ✅ Reduced resource usage
- ✅ No Docker complexity
