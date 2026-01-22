# OpenGraph Meta Tags Implementation Guide

## Overview
OpenGraph meta tags control how your pages appear when shared on social media (Facebook, Twitter, LinkedIn, Discord, etc.). They're simple HTML meta tags added to the `<head>` section of each page.

## Why Manual Implementation?
For static sites, manually adding OG tags is the simplest approach:
- No build tools or dependencies required
- Full control per page
- Minimal overhead (~300 bytes per page)
- Works with any static hosting
- Aligns with frugal, static-first philosophy

## Required Meta Tags

### Basic OpenGraph Tags
Add these 5 tags to every page's `<head>` section:

```html
<!-- OpenGraph Meta Tags -->
<meta property="og:title" content="Page Title Here">
<meta property="og:description" content="Brief description of this page (150-200 chars)">
<meta property="og:image" content="https://yourdomain.com/images/og-image.png">
<meta property="og:url" content="https://yourdomain.com/current-page.html">
<meta property="og:type" content="website">
```

### Optional but Recommended
```html
<meta property="og:site_name" content="Your Site Name">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Page Title Here">
<meta name="twitter:description" content="Brief description">
<meta name="twitter:image" content="https://yourdomain.com/images/og-image.png">
```

## Image Requirements

### Optimal Dimensions
- **Recommended:** 1200×630 pixels (1.91:1 ratio)
- **Minimum:** 600×315 pixels
- **Format:** PNG or JPG
- **File size:** Keep under 1MB (ideally under 300KB)

### Image Guidelines
- Use clear, readable text if including text
- Ensure important content is centered (some platforms crop)
- Test on multiple platforms (Facebook, Twitter, LinkedIn, Discord)
- Use high contrast for readability
- Include your logo/branding

## Implementation Steps

### 1. Create Your OG Image
- Design a 1200×630px image
- Save as `og-image.png` or `og-image-[pagename].png`
- Place in `/images/` directory
- Optimize file size (use tools like TinyPNG)

### 2. Add Tags to Each Page
Insert the meta tags in the `<head>` section, after the existing meta tags but before CSS links:

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title</title>
    <meta name="description" content="Regular meta description">
    
    <!-- OpenGraph Meta Tags -->
    <meta property="og:title" content="Page Title">
    <meta property="og:description" content="Description for social sharing">
    <meta property="og:image" content="https://yourdomain.com/images/og-image.png">
    <meta property="og:url" content="https://yourdomain.com/page.html">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Site Name">
    
    <!-- Twitter Card Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Page Title">
    <meta name="twitter:description" content="Description for social sharing">
    <meta name="twitter:image" content="https://yourdomain.com/images/og-image.png">
    
    <link rel="stylesheet" href="main.css">
</head>
```

### 3. Customize Per Page
For each page, update:
- `og:title` - Unique page title
- `og:description` - Page-specific description
- `og:url` - Full URL to the current page
- `og:image` - Use page-specific image if available, or site-wide default

## Testing Your Implementation

### Online Validators
- **Facebook:** https://developers.facebook.com/tools/debug/
- **Twitter:** https://cards-validator.twitter.com/
- **LinkedIn:** https://www.linkedin.com/post-inspector/
- **General:** https://www.opengraph.xyz/url/ (ironic, but useful validator)

### Testing Process
1. Deploy your changes to production
2. Test each URL in the validators above
3. Click "Fetch new information" to clear cache
4. Verify image displays correctly
5. Check title and description appear as expected

## Common Issues & Solutions

### Image Not Showing
- Ensure image URL is absolute (full https:// path)
- Check image is publicly accessible (not behind auth)
- Verify image meets size requirements
- Clear social media cache using validators

### Wrong Content Showing
- Social platforms cache aggressively (24-48 hours)
- Use platform validators to force refresh
- Wait or use cache-busting query strings

### Image Cropped Incorrectly
- Use 1.91:1 aspect ratio (1200×630)
- Keep important content centered
- Test on multiple platforms

## Page-Specific vs. Site-Wide Images

### Site-Wide Default (Recommended for small sites)
- Create one high-quality OG image
- Use it across all pages
- Simpler maintenance
- Consistent branding

### Page-Specific Images (For larger sites)
- Create unique images per page/section
- Better engagement on social media
- More work to maintain
- Use naming convention: `og-image-[page].png`

## Example: ROFLFaucet Implementation

```html
<!-- Home Page -->
<meta property="og:title" content="ROFLFaucet - Earn UselessCoins">
<meta property="og:description" content="Earn UselessCoins every 5 minutes with our secure faucet system. Play games, support charities, and join our community.">
<meta property="og:image" content="https://roflfaucet.com/images/og-image.png">
<meta property="og:url" content="https://roflfaucet.com/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ROFLFaucet">

<!-- Games Page -->
<meta property="og:title" content="Games - ROFLFaucet">
<meta property="og:description" content="Play slots, dice, wheel, and poker dice games. Win UselessCoins and have fun!">
<meta property="og:image" content="https://roflfaucet.com/images/og-image-games.png">
<meta property="og:url" content="https://roflfaucet.com/games.html">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ROFLFaucet">
```

## Maintenance

### When to Update
- Site rebrand or logo change
- Major feature additions
- Seasonal campaigns
- Page content significantly changes

### Best Practices
- Keep descriptions concise (150-200 characters)
- Use action-oriented language
- Include key benefits or features
- Match your brand voice
- Test after any changes

## Alternative: PHP Include (Not Recommended)

If you absolutely need dynamic OG tags and are using PHP:

```php
<!-- og-tags.php -->
<?php
$og_title = $og_title ?? 'Default Site Title';
$og_description = $og_description ?? 'Default description';
$og_image = $og_image ?? '/images/og-image.png';
$og_url = $og_url ?? 'https://yourdomain.com/';
?>
<meta property="og:title" content="<?= htmlspecialchars($og_title) ?>">
<meta property="og:description" content="<?= htmlspecialchars($og_description) ?>">
<meta property="og:image" content="<?= htmlspecialchars($og_image) ?>">
<meta property="og:url" content="<?= htmlspecialchars($og_url) ?>">
<meta property="og:type" content="website">
```

**Why avoid this:**
- Adds server-side processing overhead
- Requires converting .html to .php
- More complex than static tags
- Violates static-first philosophy
- Minimal benefit for small sites

## Resources

### Documentation
- OpenGraph Protocol: https://ogp.me/
- Twitter Cards: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards
- Facebook Sharing: https://developers.facebook.com/docs/sharing/webmasters

### Tools
- Image optimization: TinyPNG, Squoosh
- OG image generators: Canva, Figma, GIMP
- Validators: See "Testing Your Implementation" section above

## Quick Reference Checklist

- [ ] Create OG image (1200×630px)
- [ ] Optimize image file size (<300KB)
- [ ] Upload image to `/images/` directory
- [ ] Add OG meta tags to each page
- [ ] Customize title, description, URL per page
- [ ] Test with Facebook debugger
- [ ] Test with Twitter validator
- [ ] Verify image displays correctly
- [ ] Check mobile preview
- [ ] Document any page-specific images

---

**Last Updated:** 2026-01-22  
**Applies To:** Static HTML sites, frugal web design philosophy
