/**
 * AI Service Router for ROFLFaucet Chatbot
 * =======================================
 * Intelligent routing between multiple free AI services with failover,
 * rate limiting, and context-aware service selection.
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

class AIServiceRouter {
    constructor() {
        this.services = {
            gemini: {
                name: 'Google Gemini',
                endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
                apiKey: process.env.GEMINI_API_KEY,
                dailyLimit: 1500,
                minuteLimit: 15,
                cost: 0, // Free
                priority: 1, // Higher priority = preferred
                strengths: ['general', 'fast'],
                dailyUsage: 0,
                minuteUsage: 0,
                lastReset: new Date().toDateString(),
                lastMinuteReset: Date.now(),
                enabled: true
            },
            huggingface: {
                name: 'Hugging Face',
                endpoint: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
                apiKey: process.env.HUGGINGFACE_API_KEY,
                dailyLimit: 1000,
                minuteLimit: 10,
                cost: 0, // Free
                priority: 2,
                strengths: ['casual', 'open_source'],
                dailyUsage: 0,
                minuteUsage: 0,
                lastReset: new Date().toDateString(),
                lastMinuteReset: Date.now(),
                enabled: true
            },
            openai: {
                name: 'OpenAI GPT',
                endpoint: 'https://api.openai.com/v1/chat/completions',
                apiKey: process.env.OPENAI_API_KEY,
                dailyLimit: 200,
                minuteLimit: 3,
                cost: 0.002, // Per request estimate
                priority: 3,
                strengths: ['help', 'rules', 'complex'],
                dailyUsage: 0,
                minuteUsage: 0,
                lastReset: new Date().toDateString(),
                lastMinuteReset: Date.now(),
                enabled: true
            },
            cohere: {
                name: 'Cohere',
                endpoint: 'https://api.cohere.ai/v1/generate',
                apiKey: process.env.COHERE_API_KEY,
                dailyLimit: 100, // Conservative estimate
                minuteLimit: 5,
                cost: 0.001,
                priority: 4,
                strengths: ['reliable', 'simple'],
                dailyUsage: 0,
                minuteUsage: 0,
                lastReset: new Date().toDateString(),
                lastMinuteReset: Date.now(),
                enabled: false // Backup only
            }
        };
        
        this.responseCache = new Map();
        this.maxCacheSize = 1000;
        this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
        
        this.loadUsageStats();
        this.setupCleanupInterval();
    }
    
    /**
     * Select best AI service for the given context and query
     */
    async selectService(query, context = 'general') {
        // Check cache first
        const cacheKey = this.getCacheKey(query, context);
        const cached = this.responseCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            console.log('🎯 Using cached response');
            return { response: cached.response, fromCache: true };
        }
        
        // Reset usage counters if needed
        this.resetUsageCounters();
        
        // Get available services sorted by preference
        const availableServices = this.getAvailableServices(context);
        
        if (availableServices.length === 0) {
            throw new Error('No AI services available - all limits exceeded');
        }
        
        console.log(`🤖 Selected services for "${context}": ${availableServices.map(s => s.name).join(', ')}`);
        
        // Try services in order of preference
        for (const service of availableServices) {
            try {
                const response = await this.queryService(service, query, context);
                
                // Update usage stats
                service.dailyUsage++;
                service.minuteUsage++;
                
                // Cache successful response
                this.cacheResponse(cacheKey, response);
                
                // Save updated usage
                this.saveUsageStats();
                
                return { response, service: service.name, fromCache: false };
                
            } catch (error) {
                console.warn(`⚠️  Service ${service.name} failed: ${error.message}`);
                
                // If this was a rate limit error, disable temporarily
                if (error.message.includes('rate limit') || error.message.includes('quota')) {
                    service.enabled = false;
                    setTimeout(() => {
                        service.enabled = true;
                        console.log(`✅ Re-enabled service: ${service.name}`);
                    }, 60 * 1000); // Re-enable after 1 minute
                }
                
                continue; // Try next service
            }
        }
        
        throw new Error('All AI services failed or unavailable');
    }
    
    /**
     * Get available services sorted by context and priority
     */
    getAvailableServices(context) {
        const now = Date.now();
        
        return Object.values(this.services)
            .filter(service => {
                if (!service.enabled || !service.apiKey) return false;
                
                // Check daily limits
                if (service.dailyUsage >= service.dailyLimit) return false;
                
                // Check minute limits
                if (now - service.lastMinuteReset < 60000 && service.minuteUsage >= service.minuteLimit) {
                    return false;
                }
                
                return true;
            })
            .sort((a, b) => {
                // Prefer services that match context
                const aMatch = a.strengths.includes(context) ? 1 : 0;
                const bMatch = b.strengths.includes(context) ? 1 : 0;
                
                if (aMatch !== bMatch) return bMatch - aMatch;
                
                // Then by priority (lower number = higher priority)
                return a.priority - b.priority;
            });
    }
    
    /**
     * Query a specific AI service
     */
    async queryService(service, query, context) {
        const requestData = this.formatRequest(service, query, context);
        const options = this.getRequestOptions(service);
        
        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        if (res.statusCode !== 200) {
                            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                            return;
                        }
                        
                        const response = this.parseResponse(service, data);
                        resolve(response);
                        
                    } catch (error) {
                        reject(new Error(`Parse error: ${error.message}`));
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(new Error(`Network error: ${error.message}`));
            });
            
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.write(JSON.stringify(requestData));
            req.end();
        });
    }
    
    /**
     * Format request for specific service
     */
    formatRequest(service, query, context) {
        const systemPrompt = this.getSystemPrompt(context);
        
        switch (service.name) {
            case 'Google Gemini':
                return {
                    contents: [{
                        parts: [{
                            text: `${systemPrompt}\n\nUser: ${query}`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 200
                    }
                };
                
            case 'OpenAI GPT':
                return {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: query }
                    ],
                    max_tokens: 200,
                    temperature: 0.7
                };
                
            case 'Hugging Face':
                return {
                    inputs: query,
                    parameters: {
                        max_length: 100,
                        temperature: 0.7
                    }
                };
                
            case 'Cohere':
                return {
                    prompt: `${systemPrompt}\n\nUser: ${query}\nAssistant:`,
                    max_tokens: 200,
                    temperature: 0.7
                };
                
            default:
                throw new Error(`Unknown service: ${service.name}`);
        }
    }
    
    /**
     * Get request options for service
     */
    getRequestOptions(service) {
        const url = new URL(service.endpoint + (service.name === 'Google Gemini' ? `?key=${service.apiKey}` : ''));
        
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'ROFLFaucet-Chatbot/1.0'
            }
        };
        
        // Add authorization headers
        switch (service.name) {
            case 'OpenAI GPT':
                options.headers['Authorization'] = `Bearer ${service.apiKey}`;
                break;
            case 'Hugging Face':
                options.headers['Authorization'] = `Bearer ${service.apiKey}`;
                break;
            case 'Cohere':
                options.headers['Authorization'] = `Bearer ${service.apiKey}`;
                break;
        }
        
        return options;
    }
    
    /**
     * Parse response from service
     */
    parseResponse(service, data) {
        const response = JSON.parse(data);
        
        switch (service.name) {
            case 'Google Gemini':
                return response.candidates?.[0]?.content?.parts?.[0]?.text || 'No response available';
                
            case 'OpenAI GPT':
                return response.choices?.[0]?.message?.content || 'No response available';
                
            case 'Hugging Face':
                return response?.[0]?.generated_text || response?.generated_text || 'No response available';
                
            case 'Cohere':
                return response.generations?.[0]?.text || 'No response available';
                
            default:
                throw new Error(`Unknown service: ${service.name}`);
        }
    }
    
    /**
     * Get system prompt based on context
     */
    getSystemPrompt(context) {
        const basePrompt = `You are ROFLBot, a helpful assistant for ROFLFaucet, a crypto faucet and gaming site. 
        You're friendly, knowledgeable about the site, and keep responses concise (under 150 words).
        
        ROFLFaucet features:
        - Free crypto faucet with hourly claims
        - Dice games, slots, and other gambling games  
        - Coin tipping system between users
        - VIP system (1000+ coins for VIP room access)
        - Rain events where VIP users distribute coins
        - Chat commands: /tip, /rain, /balance, /online
        
        Chat rules:
        - Be respectful to all users
        - No spam or excessive caps
        - No begging or harassment  
        - Keep discussions gambling-related
        - Moderators have final say`;
        
        switch (context) {
            case 'help':
            case 'rules':
                return basePrompt + '\n\nFocus on providing clear, helpful information about site features and rules.';
                
            case 'general':
            default:
                return basePrompt + '\n\nBe conversational but helpful. Only respond when directly asked or mentioned.';
        }
    }
    
    /**
     * Cache management
     */
    getCacheKey(query, context) {
        return `${context}:${query.toLowerCase().trim()}`;
    }
    
    cacheResponse(key, response) {
        if (this.responseCache.size >= this.maxCacheSize) {
            // Remove oldest entries
            const entries = Array.from(this.responseCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            for (let i = 0; i < Math.floor(this.maxCacheSize * 0.2); i++) {
                this.responseCache.delete(entries[i][0]);
            }
        }
        
        this.responseCache.set(key, {
            response,
            timestamp: Date.now()
        });
    }
    
    /**
     * Usage tracking
     */
    resetUsageCounters() {
        const today = new Date().toDateString();
        const now = Date.now();
        
        Object.values(this.services).forEach(service => {
            // Reset daily counters
            if (service.lastReset !== today) {
                service.dailyUsage = 0;
                service.lastReset = today;
            }
            
            // Reset minute counters
            if (now - service.lastMinuteReset >= 60000) {
                service.minuteUsage = 0;
                service.lastMinuteReset = now;
            }
        });
    }
    
    async loadUsageStats() {
        try {
            const statsPath = path.join(__dirname, 'usage-stats.json');
            const data = await fs.readFile(statsPath, 'utf8');
            const stats = JSON.parse(data);
            
            // Merge with current services
            Object.keys(stats).forEach(serviceName => {
                if (this.services[serviceName]) {
                    Object.assign(this.services[serviceName], stats[serviceName]);
                }
            });
            
        } catch (error) {
            console.log('📊 No existing usage stats found, starting fresh');
        }
    }
    
    async saveUsageStats() {
        try {
            const statsPath = path.join(__dirname, 'usage-stats.json');
            await fs.writeFile(statsPath, JSON.stringify(this.services, null, 2));
        } catch (error) {
            console.warn('⚠️  Failed to save usage stats:', error.message);
        }
    }
    
    setupCleanupInterval() {
        // Clean cache every 30 minutes
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.responseCache.entries()) {
                if (now - value.timestamp > this.cacheExpiry) {
                    this.responseCache.delete(key);
                }
            }
        }, 30 * 60 * 1000);
        
        // Save usage stats every 5 minutes
        setInterval(() => {
            this.saveUsageStats();
        }, 5 * 60 * 1000);
    }
    
    /**
     * Get service status for monitoring
     */
    getServiceStatus() {
        this.resetUsageCounters();
        
        return Object.entries(this.services).map(([key, service]) => ({
            name: service.name,
            enabled: service.enabled,
            dailyUsage: service.dailyUsage,
            dailyLimit: service.dailyLimit,
            minuteUsage: service.minuteUsage,
            minuteLimit: service.minuteLimit,
            dailyRemaining: service.dailyLimit - service.dailyUsage,
            utilization: Math.round((service.dailyUsage / service.dailyLimit) * 100)
        }));
    }
}

module.exports = AIServiceRouter;