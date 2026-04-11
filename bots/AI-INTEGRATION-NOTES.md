# ROFLBot AI Integration - Project Notes

**Status:** ⛔ **DISABLED** - Not ready for production use  
**Last Updated:** April 9, 2026

---

## What Was Attempted

Someone (earlier development) started building an AI relay system for ROFLBot using:
- **AI Service Router** - Intelligent fallback between multiple AI services
- **Google Gemini** - Primary service (now disabled)
- **Hugging Face** - Fallback service
- **OpenAI/Cohere** - Additional backups

The idea was: ROFLBot would relay user questions to AI services and return answers.

---

## Why It's Disabled Now

### 1. **Gemini Free Tier Was Too Restrictive**
- Limit: Only 50 requests/day (3 responses/hour max)
- ROFLBot needs much higher throughput
- Code had wrong limits: set to 1500/day instead of actual 50/day
- Result: Rate limit errors (HTTP 429) constantly

### 2. **No Real Prompting or Context**
- Bot was just sending raw user messages to APIs
- No system prompt to guide behavior
- No context window management
- No handling of what makes good faucet-related answers

### 3. **Fallback Was Always Triggered**
- Gemini kept failing → fallback to Hugging Face/knowledge base
- Hugging Face likely had similar issues or no API key
- So bot always ended up returning hardcoded Hitchhiker's Guide phrases
- User sees: Generic philosophy quotes, not actual help

### 4. **No Rate Limiting or Cost Control**
- If you scaled it up, API costs would spiral
- No budget management
- No per-user rate limits

### 5. **Incomplete Design**
- Mixing Hitchhiker's Guide personality with actual answer relaying felt wrong
- No moderation of AI answers before sending to chat
- No fallback strategy if APIs go down
- No caching of common questions

---

## Current Behavior

ROFLBot now:
1. Listens to chat messages
2. Decides if it should respond (based on mention/help/activity)
3. Returns a philosophical phrase from the Hitchhiker's Guide knowledge base
4. **Does NOT call any AI services** (they're disabled)

This is intentional - we're not pretending to have AI-powered answers when we don't.

---

## If You Want to Revisit AI Integration

Do NOT try to extend this code. Instead:

### 1. **Define Requirements First**
- What questions should ROFLBot answer?
- What's in scope (faucet help, game rules, etc.)?
- What's out of scope?
- How often will it be asked?
- Budget: how much API spend can we afford?

### 2. **Design the System**
- Create a **system prompt** that defines ROFLBot's role in faucet chat
- Plan **prompt templates** for different question types
- Design **answer validation** - filter bad/unsafe responses
- Plan **fallbacks** - what to say if AI fails or doesn't know
- Add **rate limiting** per user to prevent abuse

### 3. **Choose the Right Service**
- **ChatGPT Web (free)**: Browser-based, no API key needed, slow, possible TOS issues
- **Gemini Pro ($)**: Better than free tier, still rate limited, needs payment
- **OpenAI API ($)**: Industry standard, reliable, predictable costs
- **Open Source LLM (local)**: Run on Orange Pi, slow but free
- **Hugging Face (free/paid)**: Many models, variable quality

### 4. **Implement Carefully**
- Start with a basic implementation
- Test thoroughly with real faucet questions
- Monitor costs and response times
- Add moderation/filtering for answers
- Plan graceful degradation if service fails

### 5. **Consider the UX**
- Don't relay raw AI answers - they're often wrong or unhelpful
- Better: Use AI to provide suggestions, then have a human review
- Or: Build a curated knowledge base of common Q&A and only relay for edge cases
- Or: Use AI for suggestions, human confirms before chatting

---

## Technical Debt Left Behind

These files contain AI service wiring that's now disabled:

```
roflbot/
├── ai-service-router.js        (Gemini disabled, others available but untested)
├── roflbot-knowledge.js        (Hitchhiker's Guide phrases - still used)
└── http-roflbot.js            (generateResponse() now just returns fallback)
```

**Safe to delete:**
- `GEMINI_API_KEY` from .env (no longer used)
- The Gemini configuration block in ai-service-router.js (mark as historical comment)

**Safe to keep:**
- The fallback phrase system (roflbot-knowledge.js)
- The service router architecture (could be extended someday)
- The conversation history tracking

---

## Why This Happened

This is a classic case of:
1. ✅ **Experiment** - "Let's try AI with Gemini"
2. ✅ **Hit Limits** - "Oh, free tier is too limited"
3. ❌ **Moved On** - Instead of fixing, just fell back to phrases
4. ❌ **Never Documented** - So later we forgot it even existed

The solution: **Disable it explicitly and document why** ← You're reading this now!

---

## Future Options

### Option A: Use Curated Knowledge Base Instead of AI
- Build a Q&A database of common faucet questions
- ROFLBot looks up answers from local database
- Much faster, cheaper, more reliable
- Downside: Manual curation work

### Option B: Use Free ChatGPT via Puppeteer
- Use browser automation to ask ChatGPT
- No API key needed (uses web interface)
- Much slower (browser overhead)
- Possible TOS issues (not API usage)
- Worth prototyping to see if it even helps

### Option C: Paid API (OpenAI/Gemini)
- Get monthly API budget ($10-20)
- Set hard cost limits
- Implement proper prompt engineering
- Monitor quality and cost carefully
- Best quality but actual expense

### Option D: Local LLM on Orange Pi
- Run a small model like Llama 2 or Mistral locally
- No API costs or rate limits
- Very slow responses (might timeout)
- Needs more resources
- Worth trying if you have time

### Option E: Hybrid Approach
- Use local knowledge base for common questions
- Fall back to API for uncommon ones
- Best of both worlds
- Most complex to implement

---

## What NOT to Do

❌ Don't try to fix the Gemini integration by paying for it - the design is still wrong  
❌ Don't just increase AI response rate without limits - costs will spiral  
❌ Don't relay raw AI answers without review - they're often wrong  
❌ Don't build more on top of this code - it's a dead end  

---

## Recommended Next Steps

1. **Leave it disabled** - For now, weird Hitchhiker phrases are fine
2. **Document this decision** ← Done (you're reading it)
3. **When you want to revisit:**
   - Start with a design document, not code
   - Pick one specific approach
   - Prototype and test thoroughly
   - Monitor costs and quality
4. **Consider the human factor**
   - Would answers actually help users?
   - Is moderation needed?
   - What's the cost/benefit?

---

## Files to Read for More Context

- `GEMINI-STATUS.md` - Technical details of the Gemini rate limit issue
- `CHANGES.md` - Known limitations section
- `MIGRATION.md` - Future improvements section
- `ai-service-router.js` - The service architecture (disabled but intact)

---

## Questions to Ask Before Restarting AI Work

- **Why?** What problem does AI actually solve?
- **For whom?** Will users actually use this feature?
- **What answers?** Which types of questions should ROFLBot answer?
- **How much?** What's the budget and throughput needed?
- **Fallback?** What happens when AI fails or doesn't know?
- **Quality?** How do we know answers are accurate?
- **Cost?** Can we afford ongoing API usage?

If you can answer these well, you'll have a better foundation than the first attempt.
