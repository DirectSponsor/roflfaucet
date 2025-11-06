# Free AI Services Research for ROFLFaucet Chatbot

## Available Free AI APIs (2024)

### 1. **OpenAI ChatGPT** (Free Tier)
- **Free Credits**: $5 worth for 3 months (new accounts)
- **Rate Limits**: 3 requests/minute, 200 requests/day
- **Models**: gpt-3.5-turbo (cheapest), gpt-4o-mini
- **Cost per request**: ~$0.0015-0.002 for typical chat messages
- **Strengths**: Excellent reasoning, good context understanding
- **API Documentation**: https://platform.openai.com/docs

### 2. **Google Gemini** (Free Tier)
- **Free Quota**: 15 requests/minute, 1,500 requests/day
- **Models**: gemini-1.5-flash (free), gemini-1.5-pro (limited free)
- **Cost**: Completely free within limits
- **Strengths**: Good general knowledge, fast responses
- **API Documentation**: https://ai.google.dev/docs

### 3. **Anthropic Claude** (Free Tier) 
- **Free Credits**: $5 worth (new accounts)
- **Rate Limits**: Varies by model
- **Models**: claude-3-haiku (cheapest), claude-3-sonnet
- **Cost per request**: ~$0.001-0.003
- **Strengths**: Excellent safety, good at following instructions
- **API Documentation**: https://docs.anthropic.com/

### 4. **Cohere** (Free Tier)
- **Free Trial**: $25 worth of credits
- **Rate Limits**: 5 requests/minute (trial)
- **Models**: command, command-light
- **Cost per request**: ~$0.001-0.002
- **Strengths**: Good for simple chat, reliable
- **API Documentation**: https://docs.cohere.com/

### 5. **Hugging Face Inference API** (Free)
- **Free Quota**: 1,000 requests/month per model
- **Rate Limits**: 10 requests/minute
- **Models**: Many open-source models (Llama, Mistral, etc.)
- **Cost**: Free within limits
- **Strengths**: Multiple model options, truly free
- **API Documentation**: https://huggingface.co/docs/api-inference

### 6. **Perplexity AI** (Free Tier)
- **Free Quota**: 5 searches/day
- **Rate Limits**: Limited but suitable for occasional use
- **Models**: Multiple LLMs
- **Strengths**: Good for fact-checking, research queries
- **API Documentation**: https://docs.perplexity.ai/

## Recommended Multi-Service Strategy

### Primary Services (Best Free Options)
1. **Google Gemini** - Most generous free tier
2. **Hugging Face** - Completely free, multiple models
3. **OpenAI** - High quality but limited

### Fallback Services 
1. **Cohere** - Reliable backup
2. **Anthropic Claude** - High-quality responses
3. **Perplexity** - For specific fact-based queries

## Service Rotation Logic

### Smart Routing Strategy:
1. **Context-based routing**: Different services for different query types
   - General chat → Gemini or Hugging Face
   - Help/Rules questions → OpenAI (better instruction following)
   - Factual queries → Perplexity
   - Safety-critical responses → Claude

2. **Load balancing**: Track usage across services
   - Monitor rate limits and daily quotas
   - Automatically fail over when limits reached
   - Reset counters daily/hourly as appropriate

3. **Quality fallback**: If primary service fails or gives poor response
   - Retry with secondary service
   - Log failures for optimization

## Implementation Recommendations

### For Orange Pi Deployment:
- **Node.js** lightweight service
- **SQLite** for logging and quota tracking
- **PM2** for process management
- **Minimal memory footprint** (~50-100MB)
- **Efficient caching** to reduce API calls

### Cost Management:
- **Daily budget limits** per service
- **Response caching** for common questions
- **Rate limiting** to prevent abuse
- **Usage analytics** to optimize service selection

### Bot Personality Design:
- **Helpful but not intrusive** - only respond when directly asked or mentioned
- **ROFLFaucet expert** - knows all features, rules, commands
- **Friendly and engaging** - matches your site's fun personality
- **Respectful of chat flow** - doesn't dominate conversations

## Estimated Monthly Costs

With smart usage and free tiers:
- **Google Gemini**: $0 (within free limits)
- **Hugging Face**: $0 (completely free)
- **OpenAI**: $0-5 (free credits)
- **Others**: $0-10 total

**Total estimated cost**: $0-15/month with moderate usage

## Next Steps

1. Set up API keys for top 3 services
2. Build service rotation system
3. Integrate with existing ROFLFaucet chat WebSocket
4. Test bot responses and personality
5. Deploy to Orange Pi for testing
6. Monitor usage and optimize

---
*Last Updated: 2025-01-27*