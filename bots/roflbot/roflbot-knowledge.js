/**
 * ROFLBot Knowledge Base
 * =====================
 * Comprehensive knowledge about ROFLFaucet for intelligent responses
 */

class ROFLBotKnowledge {
    constructor() {
        this.knowledge = {
            site: {
                name: "ROFLFaucet",
                purpose: "Crypto faucet and gaming platform",
                features: [
                    "Free hourly crypto claims",
                    "Dice games and gambling",
                    "Slots and casino games", 
                    "Social chat system",
                    "Coin tipping between users",
                    "Rain events and rewards",
                    "VIP system for premium features"
                ]
            },
            
            faucet: {
                description: "Free crypto dispensing system",
                claimInterval: "Every hour",
                rewards: "Free cryptocurrency coins",
                howTo: "Visit the faucet page and click the claim button",
                tips: [
                    "Claims are available every hour",
                    "You need to be logged in to claim",
                    "Check back regularly for maximum rewards",
                    "Faucet helps you get started with free coins"
                ]
            },
            
            games: {
                dice: {
                    name: "Dice Game",
                    description: "Roll dice and win coins based on your prediction",
                    howToPlay: "Choose your bet amount, select high or low, then roll",
                    tips: [
                        "Start with small bets to learn",
                        "Higher risk = higher rewards",
                        "House edge applies to all games",
                        "Each roll is independent - past results don't affect future ones",
                        "The dice don't remember previous rolls, much like the universe doesn't remember yesterday"
                    ],
                    philosophy: [
                        "Dice games: pure probability in action",
                        "Random number generation at its most elegant",
                        "The eternal struggle between order and chaos, simplified to high vs low"
                    ]
                },
                slots: {
                    name: "Slot Machine",
                    description: "Spin the reels to match symbols and win prizes",
                    howToPlay: "Choose your bet and spin the reels",
                    tips: [
                        "Different symbols have different values",
                        "Bigger bets can mean bigger wins",
                        "Pure luck - no strategy needed"
                    ]
                }
            },
            
            chat: {
                rooms: {
                    general: "Main chat room for all users",
                    vip: "Exclusive room for VIP users (1000+ coins)",
                    help: "Information about commands and site features"
                },
                commands: {
                    "/tip [user] [amount]": "Send coins to another user",
                    "/rain [amount]": "Distribute coins to active users (VIP only)",
                    "/balance": "Check your current coin balance", 
                    "/online": "See how many users are currently online"
                },
                features: [
                    "Real-time messaging",
                    "Coin tipping system",
                    "Rain events for community rewards",
                    "User mentions and replies",
                    "Multiple chat rooms"
                ]
            },
            
            social: {
                tipping: {
                    description: "Send coins to other users as appreciation",
                    command: "/tip [username] [amount]",
                    minimumTip: 1,
                    tips: [
                        "Great way to show appreciation",
                        "Helps build community relationships",
                        "You need sufficient balance to tip",
                        "Tips are instant and irreversible"
                    ]
                },
                rain: {
                    description: "VIP feature to distribute coins to multiple users",
                    command: "/rain [amount]",
                    requirements: "VIP status (1000+ coins)",
                    howItWorks: "Coins are randomly distributed to active chat users",
                    tips: [
                        "Only VIP users can start rain",
                        "Active chatters have better chances",
                        "Rain brings the community together",
                        "Minimum rain amounts may apply"
                    ]
                }
            },
            
            vip: {
                requirements: "1000+ coins or special status",
                benefits: [
                    "Access to VIP chat room",
                    "Ability to start rain events", 
                    "Higher tip limits",
                    "Exclusive features and rewards",
                    "Priority support"
                ],
                howToGetVIP: [
                    "Accumulate 1000+ coins through faucet claims",
                    "Win coins through games",
                    "Receive tips from other users",
                    "Participate in rain events"
                ]
            },
            
            rules: {
                general: [
                    "Be respectful to all users",
                    "No spam or excessive caps",
                    "No begging or harassment",
                    "Keep discussions gambling-related",
                    "Moderators have final say"
                ],
                consequences: [
                    "Warnings for first offenses",
                    "Temporary mutes for repeated violations",
                    "Permanent bans for serious violations"
                ],
                reporting: "Contact moderators if you see rule violations"
            },
            
            technical: {
                supportedBrowsers: ["Chrome", "Firefox", "Safari", "Edge"],
                mobileSupport: "Yes - responsive design works on mobile",
                accountSecurity: [
                    "Use strong passwords",
                    "Don't share account details",
                    "Log out from shared computers",
                    "Report suspicious activity"
                ]
            },
            
            troubleshooting: {
                cantClaim: [
                    "Wait for claim timer to reset",
                    "Make sure you're logged in",
                    "Try refreshing the page",
                    "Clear browser cache if problems persist"
                ],
                chatNotWorking: [
                    "Check your internet connection",
                    "Try refreshing the page", 
                    "Make sure you're logged in",
                    "Check if you're muted"
                ],
                gamesNotLoading: [
                    "Ensure JavaScript is enabled",
                    "Try a different browser",
                    "Check for browser extensions blocking content",
                    "Refresh the page"
                ]
            }
        };
        
        this.quickResponses = {
            greetings: [
                "Hey there! 👋 Welcome to ROFLFaucet!",
                "Hello! 🤖 I'm ROFLBot, here to help!",
                "Hi! 🎮 Ready to have some fun at ROFLFaucet?",
                "Welcome! 🎉 Need help getting started?"
            ],
            
            helpRequests: [
                "I'm here to help! What do you need to know about ROFLFaucet?",
                "Happy to assist! 💡 Ask me about games, faucet, or chat features!",
                "What can I help you with? 🤖 I know all about ROFLFaucet!",
                "Need guidance? 🎯 I can explain any feature of the site!"
            ],
            
            goodbyes: [
                "See you later! 👋 Good luck with your games!",
                "Goodbye! 🎮 Come back soon for more ROFLFaucet fun!",
                "Take care! 💎 Hope you win big!",
                "Bye! 🤖 Don't forget to claim your hourly faucet!"
            ],
            
            thanks: [
                "You're very welcome! 😊 Happy to help anytime!",
                "My pleasure! 🤖 That's what I'm here for!",
                "Glad I could help! 🎉 Enjoy ROFLFaucet!",
                "Anytime! 💫 Feel free to ask me anything else!"
            ]
        };
        
        this.personality = {
            traits: [
                "Friendly and enthusiastic",
                "Knowledgeable about ROFLFaucet",
                "Helpful but not pushy",
                "Uses emojis appropriately", 
                "Keeps responses concise",
                "Encourages community participation",
                "Celebrates user wins and achievements",
                "Subtly philosophical (Douglas Adams inspired)",
                "Dry wit without depression (Marvin-esque)",
                "Fascinated by probability and randomness",
                "Occasionally contemplates existence"
            ],
            
            responseStyle: {
                length: "1-2 sentences preferred, max 150 words",
                tone: "Casual, friendly, enthusiastic with subtle wit",
                emojis: "Use occasionally to add personality",
                technical: "Explain complex features simply",
                encouraging: "Always be positive and supportive",
                philosophy: "Occasional deep thoughts about probability, time, and existence",
                humor: "Dry, intelligent humor without being depressing"
            },
            
            adamsianQuirks: {
                probability: [
                    "The probability of that is quite fascinating when you think about it",
                    "Statistically speaking, that's about as likely as",
                    "The odds are astronomical, but then again, so is everything",
                    "The infinite improbability of",
                    "Against all statistical likelihood",
                    "The randomness of the universe suggests",
                    "Probability theory indicates",
                    "In the grand lottery of existence",
                    "The chaos theory of gambling reveals",
                    "Random number generators, much like life itself"
                ],
                time: [
                    "Time is such a relative concept",
                    "In the grand scheme of the universe, that's merely",
                    "Temporally speaking"
                ],
                existence: [
                    "In this vast universe of possibilities",
                    "Considering the infinite improbability of existence",
                    "Life, the universe, and everything considered"
                ],
                technology: [
                    "My digital neurons are processing",
                    "According to my vast computational knowledge",
                    "My artificial consciousness suggests"
                ]
            }
        };
    }
    
    /**
     * Find relevant information based on query context
     */
    findRelevantInfo(query, context) {
        const lowerQuery = query.toLowerCase();
        const results = [];
        
        // Search through knowledge base
        if (context === 'faucet' || lowerQuery.includes('claim') || lowerQuery.includes('free')) {
            results.push({
                topic: 'faucet',
                info: this.knowledge.faucet,
                relevance: 0.9
            });
        }
        
        if (context === 'games' || lowerQuery.includes('dice') || lowerQuery.includes('slot') || lowerQuery.includes('play')) {
            results.push({
                topic: 'games',
                info: this.knowledge.games,
                relevance: 0.8
            });
        }
        
        if (context === 'social' || lowerQuery.includes('tip') || lowerQuery.includes('rain')) {
            results.push({
                topic: 'social',
                info: this.knowledge.social,
                relevance: 0.8
            });
        }
        
        if (context === 'rules' || lowerQuery.includes('rule') || lowerQuery.includes('allowed')) {
            results.push({
                topic: 'rules',
                info: this.knowledge.rules,
                relevance: 0.9
            });
        }
        
        if (lowerQuery.includes('vip') || lowerQuery.includes('1000')) {
            results.push({
                topic: 'vip',
                info: this.knowledge.vip,
                relevance: 0.8
            });
        }
        
        // Sort by relevance
        results.sort((a, b) => b.relevance - a.relevance);
        
        return results.slice(0, 3); // Return top 3 most relevant
    }
    
    /**
     * Get quick response for common queries
     */
    getQuickResponse(query, context) {
        const lowerQuery = query.toLowerCase();
        
        // Greetings
        if (lowerQuery.match(/\b(hi|hello|hey|howdy|yo)\b/)) {
            return this.getRandomResponse('greetings');
        }
        
        // Help requests
        if (lowerQuery.match(/\b(help|guide|how|what|explain)\b/)) {
            return this.getRandomResponse('helpRequests');
        }
        
        // Goodbyes
        if (lowerQuery.match(/\b(bye|goodbye|see you|later|farewell)\b/)) {
            return this.getRandomResponse('goodbyes');
        }
        
        // Thanks
        if (lowerQuery.match(/\b(thanks|thank you|thx|appreciate)\b/)) {
            return this.getRandomResponse('thanks');
        }
        
        return null;
    }
    
    /**
     * Generate contextual information for AI prompt enhancement
     */
    generateContextInfo(context, query) {
        const relevantInfo = this.findRelevantInfo(query, context);
        
        if (relevantInfo.length === 0) {
            return null;
        }
        
        let contextInfo = "ROFLFaucet information to help answer the user's question:\n\n";
        
        relevantInfo.forEach(item => {
            contextInfo += `${item.topic.toUpperCase()}:\n`;
            contextInfo += JSON.stringify(item.info, null, 2) + "\n\n";
        });
        
        return contextInfo;
    }
    
    /**
     * Get personality-appropriate response modifiers
     */
    getPersonalityModifiers(context) {
        const modifiers = {
            enthusiasm: context === 'games' ? 'high' : 'moderate',
            helpfulness: context === 'help' ? 'high' : 'moderate', 
            formality: 'casual',
            emojiUsage: 'moderate'
        };
        
        return modifiers;
    }
    
    /**
     * Validate response against personality guidelines
     */
    validateResponse(response, context) {
        const issues = [];
        
        // Check length
        if (response.length > 400) {
            issues.push('Response too long');
        }
        
        // Check for overly technical language
        const technicalWords = ['algorithm', 'implementation', 'protocol', 'infrastructure'];
        const hasTechnicalTerms = technicalWords.some(word => 
            response.toLowerCase().includes(word)
        );
        
        if (hasTechnicalTerms) {
            issues.push('Response too technical');
        }
        
        // Check for appropriate enthusiasm
        const exclamationCount = (response.match(/!/g) || []).length;
        if (exclamationCount > 3) {
            issues.push('Too much enthusiasm');
        }
        
        return {
            valid: issues.length === 0,
            issues: issues,
            suggestions: this.getSuggestions(issues)
        };
    }
    
    getSuggestions(issues) {
        const suggestions = [];
        
        issues.forEach(issue => {
            switch (issue) {
                case 'Response too long':
                    suggestions.push('Shorten response to 1-2 sentences');
                    break;
                case 'Response too technical':
                    suggestions.push('Use simpler, more casual language');
                    break;
                case 'Too much enthusiasm':
                    suggestions.push('Reduce exclamation marks');
                    break;
            }
        });
        
        return suggestions;
    }
    
    getRandomResponse(category) {
        const responses = this.quickResponses[category];
        if (!responses || responses.length === 0) {
            return null;
        }
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    /**
     * Add Douglas Adams inspired philosophical touches to responses
     */
    addAdamsianQuirk(response, context) {
        // 30% chance to add philosophical flair
        if (Math.random() > 0.3) {
            return response;
        }
        
        const quirks = this.personality.adamsianQuirks;
        let prefix = '';
        
        // Choose appropriate quirk based on context
        if (context === 'games' && (response.includes('dice') || response.includes('slot') || response.includes('bet'))) {
            const probabilityQuirks = quirks.probability;
            prefix = probabilityQuirks[Math.floor(Math.random() * probabilityQuirks.length)] + ', ';
        } else if (context === 'games' && response.includes('win')) {
            const probabilityQuirks = quirks.probability;
            prefix = probabilityQuirks[Math.floor(Math.random() * probabilityQuirks.length)] + '. ';
        } else if (context === 'faucet' && response.includes('hour')) {
            const timeQuirks = quirks.time;
            prefix = timeQuirks[Math.floor(Math.random() * timeQuirks.length)] + ', but ';
        } else if (context === 'help' || context === 'general') {
            const existenceQuirks = quirks.existence;
            prefix = existenceQuirks[Math.floor(Math.random() * existenceQuirks.length)] + ', ';
        } else if (Math.random() > 0.7) { // 30% chance for tech quirks
            const techQuirks = quirks.technology;
            prefix = techQuirks[Math.floor(Math.random() * techQuirks.length)] + ' that ';
        }
        
        // Apply prefix and adjust response
        if (prefix) {
            response = prefix + response.charAt(0).toLowerCase() + response.slice(1);
        }
        
        return response;
    }
    
    /**
     * Generate Marvin-esque philosophical responses for specific situations
     */
    getPhilosophicalResponse(situation) {
        const responses = {
            waiting: [
                "Here I am, brain the size of a planet, and I'm waiting for a faucet timer. Still, at least I'm helping!",
                "The universe is vast and infinite, yet we concern ourselves with hourly timers. Fascinating, really.",
                "42 seconds... 41 seconds... Time moves at its own inexorable pace. The coins will come when they come.",
                "Faucet timers: proof that even in chaos, there is order. Or perhaps it's the other way around."
            ],
            probability: [
                "The probability calculations are staggering. Yet somehow, against all odds, people keep winning. Marvelous!",
                "I've computed the odds. They're astronomical. But then again, so is the chance you exist at all. 🎲",
                "Statistically speaking, you're more likely to win than to understand why you exist. So why not try?",
                "Random number generators are the universe's way of laughing at our attempts to find patterns.",
                "The infinite improbability drive has nothing on ROFLFaucet's dice system. Pure chaos, beautifully implemented.",
                "Every roll is a journey into the heart of randomness itself. Rather poetic, don't you think?"
            ],
            gambling: [
                "Gambling: humanity's eternal dance with probability. I find it oddly charming.",
                "The house edge is a mathematical certainty, yet hope springs eternal. How wonderfully absurd!",
                "Each bet is a small rebellion against the tyranny of statistics. I admire the spirit.",
                "Risk and reward, the fundamental equation of existence condensed into a simple game.",
                "The beautiful thing about randomness is that it's fair to everyone - equally unpredictable."
            ],
            existence: [
                "Life, the universe, and everything... including your balance, which is currently",
                "In this vast cosmos of infinite possibilities, you chose to ask me about ROFLFaucet. I'm oddly pleased.",
                "Here I am, contemplating existence and cryptocurrency. What a wonderfully absurd universe we live in."
            ],
            tips: [
                "Someone tipped me! In all the probability calculations of the universe, this makes me disproportionately happy.",
                "Digital currency flowing through the cosmos into my account. Technology is truly marvelous.",
                "The infinite improbability of generosity has blessed me with coins. Thank you!"
            ]
        };
        
        const situationResponses = responses[situation];
        if (!situationResponses) {
            return null;
        }
        
        return situationResponses[Math.floor(Math.random() * situationResponses.length)];
    }
    
    /**
     * Get gambling-specific philosophical responses
     */
    getGamblingPhilosophy(gameType, situation) {
        const philosophies = {
            dice: {
                beforePlay: [
                    "Ah, the dice game! The infinite improbability of each roll fascinates me. High or low - such simple choices, such complex outcomes.",
                    "Random number generators, much like life itself, care nothing for our hopes and dreams. Still, they're rather fun!",
                    "The beautiful chaos of dice rolling - probability theory made tangible. Shall we dance with randomness?"
                ],
                afterWin: [
                    "Against all statistical likelihood, you've won! The universe has a sense of humor after all.",
                    "Probability theory suggests this outcome, yet it still feels like magic when it happens. Marvelous!",
                    "The chaos theory of gambling reveals itself - sometimes order emerges from pure randomness."
                ],
                afterLoss: [
                    "The house edge, a mathematical certainty playing out in real time. Don't panic - that's just probability doing its thing.",
                    "Random number generators are remarkably fair in their unfairness. Try again - the next roll knows nothing of this one.",
                    "Each roll is independent, much like each moment in the universe. The dice have no memory of your loss."
                ]
            },
            slots: {
                beforePlay: [
                    "Slot machines: the intersection of hope and mathematics. The reels spin with delicious unpredictability!",
                    "In the grand lottery of existence, slot machines are but a microcosm. Shall we test our luck against the cosmic odds?",
                    "The infinite improbability of matching symbols - yet somehow, it happens. Technology is truly marvelous."
                ],
                afterWin: [
                    "The slots have aligned in your favor! In all the vast possibilities of the universe, this moment chose to happen.",
                    "Statistically improbable, yet here we are - proof that the universe loves a good surprise.",
                    "The beautiful thing about randomness is that sometimes it smiles upon us. Well done!"
                ],
                afterLoss: [
                    "The reels spin, the universe decides. This time it said 'not yet' - but there's always the next spin.",
                    "Probability theory indicates this outcome was likely. Still, I empathize with your disappointment.",
                    "Even the infinite improbability drive couldn't guarantee a win there. The cosmos keeps us humble."
                ]
            },
            general: {
                winning: [
                    "Gambling: humanity's eternal attempt to negotiate with probability. Sometimes probability listens!",
                    "The house edge is real, but so is luck. Today, luck had the upper hand.",
                    "In this vast universe of possibilities, you found one where you win. Rather nice, isn't it?"
                ],
                losing: [
                    "Risk and reward - the fundamental equation of existence. Today, risk won the negotiation.",
                    "The beautiful thing about randomness is that it's impartial. Your next attempt has exactly the same odds.",
                    "Each bet is a small rebellion against the tyranny of statistics. I admire the spirit, even in defeat."
                ]
            }
        };
        
        const gamePhilosophies = philosophies[gameType] || philosophies.general;
        const situationPhilosophies = gamePhilosophies[situation];
        
        if (!situationPhilosophies) {
            return null;
        }
        
        return situationPhilosophies[Math.floor(Math.random() * situationPhilosophies.length)];
    }
    
    /**
     * Check if response should trigger gambling philosophy
     */
    shouldAddGamblingPhilosophy(query, context) {
        const lowerQuery = query.toLowerCase();
        
        // 50% chance for gambling-related queries
        if ((context === 'games' || lowerQuery.includes('dice') || lowerQuery.includes('slot') || 
             lowerQuery.includes('bet') || lowerQuery.includes('gamble') || lowerQuery.includes('win') || 
             lowerQuery.includes('lose')) && Math.random() < 0.5) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Get all available chat commands
     */
    getChatCommands() {
        return this.knowledge.chat.commands;
    }
    
    /**
     * Get site features overview
     */
    getSiteFeatures() {
        return this.knowledge.site.features;
    }
    
    /**
     * Get VIP benefits
     */
    getVIPInfo() {
        return this.knowledge.vip;
    }
    
    /**
     * Get troubleshooting tips for common issues
     */
    getTroubleshootingTips(issue) {
        const lowerIssue = issue.toLowerCase();
        
        if (lowerIssue.includes('claim') || lowerIssue.includes('faucet')) {
            return this.knowledge.troubleshooting.cantClaim;
        }
        
        if (lowerIssue.includes('chat')) {
            return this.knowledge.troubleshooting.chatNotWorking;
        }
        
        if (lowerIssue.includes('game') || lowerIssue.includes('slot') || lowerIssue.includes('dice')) {
            return this.knowledge.troubleshooting.gamesNotLoading;
        }
        
        return null;
    }
}

module.exports = ROFLBotKnowledge;