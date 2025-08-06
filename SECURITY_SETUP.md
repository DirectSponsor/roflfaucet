# Security Setup Guide

## Configuration System

This project uses a secure configuration system to prevent credentials from being committed to version control.

### How It Works

1. **`config.template.php`** - Template with placeholder values (safe to commit)
2. **`config.php`** - Real configuration with actual passwords (never committed)
3. **`.gitignore`** - Prevents `config.php` from being tracked by Git

### Initial Setup

When setting up the project on a new server:

```bash
# Copy the template to create your config file
cp config.template.php config.php

# Edit config.php with your real passwords
nano config.php
```

### What's Protected

- Database passwords
- JWT secret keys
- API keys
- Any other sensitive configuration

### Backup Strategy

**✅ Safe to backup:**
- `config.template.php` (no real passwords)
- All other code files
- Database structure (without sensitive data)

**❌ Never backup to public repos:**
- `config.php` (contains real passwords)
- Database dumps with user data
- Log files with sensitive information

### For New Team Members

1. Get a copy of `config.php` through secure means (encrypted email, secure file share)
2. Or copy `config.template.php` to `config.php` and ask admin for the real values
3. Never commit `config.php` changes

### Server Migrations

When moving to a new server:

1. Code deployment: Use Git (automatically excludes `config.php`)
2. Configuration: Manually copy or recreate `config.php` 
3. Database: Use proper database migration tools

This way your code is backed up safely without exposing credentials!
