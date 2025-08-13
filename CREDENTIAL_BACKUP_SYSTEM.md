# ROFLFaucet Secure Credential Management System

**⚠️ NEVER COMMIT THIS FILE TO PUBLIC REPOSITORIES ⚠️**

This document contains the actual production credentials for ROFLFaucet. It should be stored securely and never committed to git.

## Quick Setup

1. Copy `config.template.php` to `config.php`
2. Replace placeholder values with the real credentials below
3. Run `./deploy-roflfaucet-secure.sh` for secure deployment

## Production Database Credentials

```
DB_HOST: localhost
DB_NAME: roflfaucet
DB_USER: roflfaucet
DB_PASS: IcCSWX5FubzKzgOr9lWjSecureDB2025!
```

## JWT Configuration

```
JWT_SECRET: Qmt+vbRvJoMB7DSZgHBIYJ/v7ctbRG6VHMYCFW2LMhg=
```

## Legacy Listmonk Credentials

```
LISTMONK_DB_HOST: localhost
LISTMONK_DB_PORT: 9432
LISTMONK_DB_NAME: listmonk
LISTMONK_DB_USER: listmonk
LISTMONK_DB_PASS: NewListmonkSecurePass2025!
```

## Security Notes

- The `config.php` file is automatically excluded from git commits
- Production credentials are deployed with 600 permissions (owner read-only)
- The secure deployment script handles all sensitive file operations
- This document should be stored in encrypted storage or secure notes

## Getting Current Production Credentials

To get the current production database credentials, run on the production server:

```bash
# Check current database configuration
grep -r "DB_" /var/www/html/ | head -10
```

Or check the server backups in the `server-backups/` directory.

## Generating Secure JWT Secret

```bash
# Generate a secure JWT secret
openssl rand -base64 32
```

## Security Checklist

- [ ] config.php has 600 permissions
- [ ] config.php is owned by www-data:www-data
- [ ] All sensitive files excluded from git
- [ ] JWT secret is cryptographically secure
- [ ] Database passwords are strong
- [ ] This document is stored securely offline

## Emergency Recovery

If credentials are lost:
1. Check server backups in `server-backups/` directory
2. Access production server and check `/var/www/html/config.php`
3. Contact hosting provider for database credential recovery
4. Regenerate JWT secret if compromised

## File Structure

```
/project-root/
├── config.template.php     ← Safe template (commit to git)
├── config.php             ← Real credentials (NEVER commit)
├── CREDENTIAL_BACKUP_SYSTEM.md ← This file (NEVER commit)
└── deploy-roflfaucet-secure.sh ← Secure deployment script
```

---

**Last Updated:** 2025-08-12  
**Next Review:** Check credentials monthly for security
