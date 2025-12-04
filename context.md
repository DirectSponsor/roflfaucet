# ROFLFaucet Project Context

## Current Status
- Faucet/gaming website with multiple games and features
- Role-based admin system implemented
- Bitcoin Lightning payment integration
- File-based user profile storage

## Key Components
- Games: Poker Dice, Slots, Wheel, Roll games
- Admin interface: /admin/ with role management
- User profiles: Stored in /var/roflfaucet-data/userdata/profiles/
- Auth: Session-based with role checking

## Current Files in Focus
- `/site/admin/manage-roles.php` - Role management API
- `/site/admin/role-management.html` - Admin interface
- Role system supports: admin, moderator, recipient, member

## Data Storage
- User profiles as JSON files
- Temporary solution until auth server migration
- Syncthing for data propagation

## Recent Work
- Role management API development
- Admin access controls with allowlist fallback
- Profile loading/saving functions

## Architecture
- Apache/PHP server
- File-based storage (no database)
- Session management
- CORS-enabled APIs

## Important Notes
- Context should be stored in .md files, not Windsurf memory system
- Use this file for project status and important information
