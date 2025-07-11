# Content Security Policy (CSP) Configuration

## Overview
This document outlines the Content Security Policy requirements for ROFLFaucet, particularly when adding new media hosting platforms or iframe sources.

## Issue Description
When integrating external media platforms (like Giphy, Imgur, YouTube, etc.), their iframes or embeds can be blocked by the browser with a message like:
> "This content is blocked. Contact the site owner to fix the issue."

This happens because our CSP restricts which domains can be loaded in iframes for security reasons.

## Solution: Update CSP in TWO Places

### 1. Node.js Server CSP (`src/index.js`)
For development and when running the Node.js server:

```javascript
frameSrc: [
  "'self'", 
  "https://www.youtube.com", 
  "https://youtube.com", 
  "https://hcaptcha.com", 
  "https://*.hcaptcha.com", 
  "https://imgur.com", 
  "https://*.imgur.com", 
  "https://i.imgur.com", 
  "https://s.imgur.com", 
  "https://embed.imgur.com", 
  "https://giphy.com", 
  "https://*.giphy.com", 
  "https://embed.giphy.com"
],
scriptSrc: [
  "'self'", 
  "'unsafe-inline'", 
  "https://js.hcaptcha.com", 
  "https://s.imgur.com"  // Required for Imgur embed scripts
]
```

### 2. Apache .htaccess CSP (`.htaccess`)
For production deployment on Apache servers:

```apache
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.hcaptcha.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; frame-src https://hcaptcha.com https://*.hcaptcha.com https://giphy.com https://*.giphy.com https://embed.giphy.com;"
```

## Currently Supported Media Platforms

| Platform | Domains in CSP | Purpose |
|----------|----------------|---------|
| hCaptcha | `https://hcaptcha.com`, `https://*.hcaptcha.com` | Security verification |
| YouTube | `https://www.youtube.com`, `https://youtube.com` | Video content |
| Imgur | `https://imgur.com`, `https://*.imgur.com`, `https://i.imgur.com`, `https://s.imgur.com`, `https://embed.imgur.com` | Image galleries |
| Giphy | `https://giphy.com`, `https://*.giphy.com`, `https://embed.giphy.com` | Animated GIFs |

## Adding New Media Platforms

When adding a new media platform, follow these steps:

1. **Research the platform's embed domains:**
   - Check their developer documentation
   - Inspect the iframe src URLs they use
   - Look for both primary and CDN domains

2. **Update BOTH CSP configurations:**
   - Add domains to `frameSrc` array in `src/index.js`
   - Add domains to `frame-src` directive in `.htaccess`

3. **Test thoroughly:**
   - Test in development (Node.js server)
   - Test in production (Apache server)
   - Check browser console for CSP violations

4. **Document the change:**
   - Update this file with the new platform
   - Add entry to the "Currently Supported Media Platforms" table

## Types of CSP Requirements

Different media platforms require different CSP directives:

### 1. Simple Iframe Embeds (frame-src only)
**Example: Giphy**
- Only needs `frame-src` domains
- Embeds are self-contained iframes
- **Symptoms when blocked**: "This content is blocked" message

### 2. Dynamic Embeds with Scripts (frame-src + script-src)
**Example: Imgur albums**
- Needs both `frame-src` AND `script-src` domains
- Uses external JavaScript to render content
- **Symptoms when blocked**: 
  - First: "This content is blocked" (missing frame-src)
  - Then: "Media content is being updated" (missing script-src)

### 3. Video Players (frame-src + potentially others)
**Example: YouTube**
- Needs `frame-src` for the player iframe
- May need additional domains for thumbnails, APIs

## Common Domain Patterns

Most media platforms use these patterns:
- `https://platform.com` - Main domain
- `https://*.platform.com` - Subdomains (CDN, embed servers)
- `https://embed.platform.com` - Dedicated embed domain
- `https://player.platform.com` - Video player domain
- `https://s.platform.com` - Static assets and scripts

## Troubleshooting

### Symptoms of CSP Issues:
- Iframe shows sad face icon
- "This content is blocked" message
- Browser console shows CSP violation errors
- Content loads locally but not in production

### Debugging Steps:
1. Open browser developer tools
2. Check Console tab for CSP violation messages
3. Look for blocked iframe sources
4. Verify domains are in both CSP configurations
5. Clear browser cache after CSP updates
6. Restart Node.js server after changes

### Testing CSP Changes:
```bash
# Kill existing server
pkill -f "node src/index.js"

# Start fresh server
npm start

# Test in browser
# Check browser console for errors
```

## Security Considerations

- Only add domains you trust completely
- Use specific domains rather than wildcards when possible
- Regularly audit the CSP for unnecessary entries
- Consider subdomain wildcards carefully (they allow ALL subdomains)

## Notes

- **CRITICAL:** Both files must be updated or the iframe will be blocked
- Apache .htaccess overrides Node.js CSP in production
- Changes require server restart to take effect
- Browser caching may delay CSP updates - hard refresh may be needed

---

*Last updated: 2024-06-05*
*Platforms supported: hCaptcha, YouTube, Imgur, Giphy*

