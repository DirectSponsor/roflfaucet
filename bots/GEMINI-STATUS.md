# AI Integration Status

**Date:** April 9, 2026  
**Status:** ⛔ **DISABLED** - AI response generation is turned off

## Summary
ROFLBot's AI response system is currently disabled. The bot will respond with Hitchhiker's Guide philosophical phrases instead of attempting to call AI services. This is intentional and temporary until proper AI integration is designed.

## Current Issue

### Error Details
```
HTTP 429 RESOURCE_EXHAUSTED
Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests
Limit: 50 requests per day
```

**Problem:** The Gemini free tier has a **50-request-per-day limit** and we've exceeded it. Each time ROFLBot responds to a message, it uses one request.

## Analysis

### Why It's Hitting the Limit

1. **ROFLBot is configured to respond frequently** (even after recent quieting)
2. **Gemini is first in the priority list** - gets attempted first for every response
3. **No request caching** - even identical questions make fresh API calls
4. **Free tier is very limited** - 50 requests/day = only ~3 responses/hour

### Current Configuration

In `roflbot/ai-service-router.js`:
```javascript
gemini: {
    name: 'Google Gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
    apiKey: process.env.GEMINI_API_KEY,
    dailyLimit: 1500,    // ← WRONG! Should be 50
    minuteLimit: 15,     // ← WRONG! Should be much lower
    cost: 0,
    priority: 1,         // ← High priority, attempted first
    enabled: true
}
```

**The limits in code (1500/day) don't match the actual API limits (50/day)!**

## Solutions

### Option 1: Disable Gemini (Recommended for now)
Since you said this was experimental and we should work on it more:

```javascript
// In ai-service-router.js, line 28:
enabled: false  // Disable until we have a paid plan or better fallback
```

This will make the router skip Gemini and try Hugging Face or other services instead.

### Option 2: Fix the Limits (If keeping it enabled)
```javascript
gemini: {
    // ... other config
    dailyLimit: 40,      // Conservative estimate (actual is 50)
    minuteLimit: 2,      // Max 2 requests per minute
    priority: 3,         // Lower priority, try after other services
    enabled: true
}
```

### Option 3: Pay for a Gemini API Plan
- **Cost:** Usually $10-20/month for generous quotas
- **Benefit:** No rate limiting issues
- **Downside:** Monthly expense for uncertain benefit

## Recommendation

**Disable Gemini for now** (Option 1):
1. It's experimental and causing issues
2. We have other AI fallbacks (Hugging Face, OpenAI)
3. No paid subscription = limited to 50 req/day = not practical
4. We can revisit this later with a proper plan

## Important Note

This Gemini integration should be considered **early exploratory work only**.

- It shows that some initial experimentation happened
- It does **not** mean ROFLBot has a finished AI relay system
- It should not be treated as a complete or reliable user-facing feature
- Future AI work should be designed deliberately rather than extended from assumptions about this experiment

## How to Implement

### Option A: Disable in Code
Edit `/home/andy/roflbot/ai-service-router.js` line 28:
```javascript
enabled: false
```

Then restart: `pm2 restart roflbot-http`

### Option B: Disable via Environment Variable
In `.env`:
```bash
DISABLE_GEMINI=true
```

Then check for this in the router.

## What Happens if Disabled

ROFLBot will fall back to the next available service in priority order:
1. ~~Gemini~~ (disabled)
2. **Hugging Face** - Free tier, usually works
3. OpenAI - Paid but could work if you have credits
4. Cohere - Backup

## Future Options

1. **Wait for better free models** - LLaMA 2, Mistral, etc.
2. **Use local LLM** - Run a small model on Orange Pi (might be slow)
3. **Implement ChatGPT web scraping** - Puppeteer approach (no API needed)
4. **Get paid API credits** - Use budget for OpenAI or Gemini Pro

## Files Affected
- `roflbot/ai-service-router.js` - Contains Gemini configuration
- `.env` - Contains GEMINI_API_KEY (can be removed/disabled)
- Documentation already notes this as "experimental"

## References
- Gemini Free Tier Limits: https://ai.google.dev/gemini-api/docs/rate-limits
- Current Error: HTTP 429 RESOURCE_EXHAUSTED
- Quota: 50 free requests/day
