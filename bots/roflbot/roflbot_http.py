#!/usr/bin/env python3
"""
ROFLBot - Python Version
========================
Philosophical and helpful chat bot for ROFLFaucet
Uses HTTP polling instead of WebSocket
No external dependencies - pure Python stdlib!
"""

import json
import time
import sys
import logging
import random
from datetime import datetime
from collections import deque
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'
)
logger = logging.getLogger(__name__)


class ROFLBotKnowledge:
    """Knowledge base and response generator for ROFLBot."""
    
    def __init__(self):
        self.greetings = [
            "Hey there! 👋 Welcome to ROFLFaucet!",
            "Hello! 🤖 I'm ROFLBot, here to help!",
            "Hi! 🎮 Ready to have some fun at ROFLFaucet?",
            "Welcome! 🎉 Need help getting started?",
            "Well hello! 👋 What can I do for you?",
            "Greetings, human! 🤖 Ready to explore ROFLFaucet?",
            "Hey! 🎮 Great to see you here!",
            "Hi there! 💫 Welcome aboard!",
            "Salutations! 👋 How goes it?",
            "Howdy! 🌟 Ready to claim some coins?",
        ]
        
        self.philosophical_responses = {
            'general': [
                "In this vast cosmos of infinite possibilities, you chose to ask me about ROFLFaucet. I'm oddly pleased.",
                "Life, the universe, and everything... including your balance, which is currently mysterious.",
                "Here I am, contemplating existence and cryptocurrency. What a wonderfully absurd universe we live in.",
                "The infinite improbability of this moment suggests we should discuss ROFLFaucet.",
                "In the grand scheme of the universe, all coins are equally insignificant and equally valuable.",
                "Probability theory suggests your next roll might be lucky. Then again, probability also suggests it might not.",
                "The universe is under no obligation to make sense to you, but ROFLFaucet tries its best.",
                "Time flies, coins flow, and the universe expands. Such is the nature of ROFLFaucet.",
            ],
            'games': [
                "Dice games: pure probability in action, where randomness meets human hope.",
                "The dice don't remember previous rolls, much like the universe doesn't remember yesterday.",
                "Slots and dice - proof that humans will gamble on literally anything, even cosmic uncertainty.",
                "In the grand lottery of existence, games are just smaller, more interesting lotteries.",
                "The odds might be against you, but that's never stopped anyone.",
                "Probability and destiny dance together quite elegantly in the world of dice and slots.",
            ],
            'faucet': [
                "The faucet flows eternally, like time itself, redistributing cosmic coins with impartial generosity.",
                "Free coins every hour - the universe's way of saying 'keep gambling, friend.'",
                "The claim button waits for no one, much like mortality itself.",
                "In the mathematics of chance and luck, the faucet is your steady friend.",
            ],
            'social': [
                "Tips and rain: the beautiful chaos of random distribution at work!",
                "Rain brings the community together, much like a cosmic event horizon.",
                "The act of tipping is proof that humans recognize value in each other.",
            ],
            'existence': [
                "In this vast universe, I find your question intriguing. 🤖",
                "The universe is a strange and wonderful place, filled with ROFLFaucet and mystery.",
                "Existence itself is but a game of probability - you're playing well so far.",
                "In the eyes of the cosmos, we are all equally confused but equally determined.",
            ]
        }
        
        self.rain_reactions = [
            "Woohoo! Rain! 🌧️💰 The universe smiles upon us all!",
            "Rain time! 💎 The beautiful chaos of random distribution at work!",
            "Sweet rain! 🎉 Probability theory suggests this is delightful!",
            "The infinite improbability of rain makes me happy! 🤖☔💰",
            "Rain! The cosmos provides! 🌧️✨",
            "Beautiful drops of cryptocurrency! 💰🌧️",
        ]
    
    def get_greeting(self):
        """Get a random greeting."""
        return random.choice(self.greetings)
    
    def get_philosophical_response(self, context='general'):
        """Get philosophical response based on context."""
        responses = self.philosophical_responses.get(context, self.philosophical_responses['existence'])
        return random.choice(responses)
    
    def get_rain_reaction(self):
        """Get random rain reaction."""
        return random.choice(self.rain_reactions)


class HTTPROFLBot:
    """ROFLBot with HTTP polling for ROFLFaucet chat."""
    
    def __init__(self, options=None):
        """Initialize ROFLBot with configuration."""
        options = options or {}
        
        # Bot identity
        self.bot_user = {
            'user_id': 'roflbot',
            'username': 'roflbot',
            'display_name': '🤖 ROFLBot',
            'balance': 0,
            'is_bot': True
        }
        
        # API configuration
        self.config = {
            'chat_api_url': options.get('chatApiUrl', 'https://roflfaucet.com/api/simple-chat.php'),
            'poll_interval': options.get('pollInterval', 3),  # seconds
            'max_retries': options.get('maxRetries', 15),
            'user_agent': 'ROFLBot/2.0 (Python HTTP Polling)'
        }
        
        # State tracking
        self.is_running = False
        self.last_message_timestamp = 0
        self.current_room = 'general'
        self.reconnect_attempts = 0
        self.recent_responses = []
        self.response_cooldown = 60  # 1 minute in seconds
        self.max_responses_per_minute = 1
        
        # Visitor greeting system
        self.greeted_users = {}  # username -> timestamp
        self.user_cooldowns = {}  # username -> timestamp
        self.greeting_cooldown = 30 * 60  # 30 minutes in seconds
        self.user_interaction_cooldown = 30 * 60  # 30 minutes in seconds
        
        # Message deduplication
        self.processed_messages = set()
        self.message_cache = {}  # content_key -> timestamp
        
        # Emergency brake
        self.response_timestamps = []
        self.emergency_brake_threshold = 8
        self.emergency_brake_window = self.config['poll_interval'] * 20  # seconds
        self.emergency_brake_active = False
        
        # Knowledge base
        self.knowledge = ROFLBotKnowledge()
        self.conversation_history = deque(maxlen=20)
        
        logger.info('🤖 HTTP ROFLBot initialized (Python)')
    
    def start(self):
        """Start the bot polling loop."""
        logger.info('🚀 Starting HTTP ROFLBot...')
        self.is_running = True
        self.reconnect_attempts = 0
        
        try:
            # Send startup message
            self.send_chat_message("ROFLBot online! 🤖 In this vast universe of possibilities, I'm here to help with ROFLFaucet questions!")
            
            logger.info('✅ HTTP ROFLBot started successfully')
            logger.info('🌐 Polling ROFLFaucet chat API every 3 seconds')
            logger.info('🎯 Ready to respond to users with Douglas Adams wisdom!')
            
            # Main polling loop
            self.run_polling_loop()
            
        except KeyboardInterrupt:
            logger.info('\n🛑 Shutdown signal received...')
            self.stop()
        except Exception as e:
            logger.error(f'🚨 Error: {e}')
            sys.exit(1)
    
    def run_polling_loop(self):
        """Main polling loop."""
        status_check_interval = 60  # seconds
        last_status_check = 0
        last_cleanup = 0
        
        while self.is_running:
            try:
                current_time = time.time()
                
                # Poll for messages
                self.poll_for_messages()
                self.reconnect_attempts = 0
                
                # Check status every minute
                if current_time - last_status_check >= 60:
                    status = self.get_status()
                    logger.info(f"📊 Status - Balance: {status['balance']}, Recent Responses: {status['recent_responses']}/min")
                    last_status_check = current_time
                
                # Cleanup every hour
                if current_time - last_cleanup >= 3600:
                    self.cleanup_old_entries()
                    last_cleanup = current_time
                
                # Wait before next poll
                time.sleep(self.config['poll_interval'])
                
            except Exception as e:
                logger.error(f'🚨 Polling error: {e}')
                self.handle_poll_error()
    
    def poll_for_messages(self):
        """Fetch new messages from chat API."""
        url = f"{self.config['chat_api_url']}?action=get_messages&room={self.current_room}"
        
        try:
            response_data = self.make_request('GET', url)
            
            if response_data.get('messages'):
                messages = response_data['messages']
                
                # Filter to only new messages
                new_messages = [
                    msg for msg in messages
                    if (msg.get('timestamp', 0) or 0) > self.last_message_timestamp
                ]
                
                if new_messages:
                    logger.info(f'📨 Received {len(new_messages)} new messages')
                    
                    highest_timestamp = self.last_message_timestamp
                    for message in new_messages:
                        self.handle_message(message)
                        highest_timestamp = max(highest_timestamp, message.get('timestamp', 0) or 0)
                    
                    self.last_message_timestamp = highest_timestamp
            
            # Log online count if available
            if response_data.get('online_count') is not None:
                logger.info(f"👥 Online users: {response_data['online_count']}")
        
        except Exception as e:
            raise Exception(f'Failed to poll messages: {e}')
    
    def handle_message(self, message):
        """Process a single chat message."""
        if not message or not message.get('message') or not message.get('username'):
            return
        
        # Skip our own messages
        if message.get('username', '').lower() == self.bot_user['username'].lower():
            return
        
        # Skip other bots
        if message.get('username', '').lower() == 'anzar':
            logger.info('🤐 Ignoring message from Anzar')
            return
        
        # Message deduplication
        msg_id = message.get('id') or f"{message.get('username')}-{message.get('timestamp', 0)}"
        if msg_id in self.processed_messages:
            return
        self.processed_messages.add(msg_id)
        
        # Content-based deduplication
        content_key = f"{message.get('username')}:{message.get('message', '').strip()}"
        now = time.time()
        if content_key in self.message_cache:
            if now - self.message_cache[content_key] < 10:  # 10 second window
                return
        self.message_cache[content_key] = now
        
        # Add to conversation history
        self.conversation_history.append({
            'username': message.get('username'),
            'message': message.get('message'),
            'timestamp': now
        })
        
        logger.info(f"💬 {message.get('username')}: {message.get('message')}")
        
        # Parse special message types (tips, rain)
        parsed = self.parse_special_message(message)
        
        if parsed['type'] == 'tip' and parsed.get('to', '').lower() == self.bot_user['username'].lower():
            logger.info(f"💰 Detected tip: {parsed.get('amount')} coins from {parsed.get('from')}")
            self.handle_tip(parsed)
            return
        
        if parsed['type'] == 'rain' and parsed.get('recipients'):
            if any(r.lower() == self.bot_user['username'].lower() for r in parsed.get('recipients', [])):
                logger.info(f"🌧️ Detected rain: {parsed.get('amount')} coins from {parsed.get('from')}")
                self.handle_rain(parsed)
                return
        
        # Check if we should respond to regular messages
        username = message.get('username')
        text = message.get('message', '').lower()
        
        if self.should_respond(text, username, now):
            # Emergency brake check
            if self.check_emergency_brake():
                logger.info('⚠️ Response blocked by emergency brake')
                return
            
            # Generate response
            is_greeting = self.is_new_visitor_greeting(username, now)
            if is_greeting:
                response = self.knowledge.get_greeting()
            else:
                response = self.knowledge.get_philosophical_response(self.determine_context(text))
            
            if response:
                # Natural delay before responding
                delay = random.uniform(1, 3)
                time.sleep(delay)
                self.send_chat_message(response)
                self.track_response()
    
    def should_respond(self, text, username, now):
        """Determine if bot should respond to a message."""
        # Always respond if mentioned
        if 'roflbot' in text or '@roflbot' in text or 'bot' in text:
            last_response = self.user_cooldowns.get(username)
            if last_response and (now - last_response < 5):  # 5 second cooldown
                logger.info(f"⏳ Mention cooldown active for {username}")
                return False
            self.user_cooldowns[username] = now
            return True
        
        # Always respond to help requests
        if any(word in text for word in ['help', 'how', 'what', '?']):
            self.user_cooldowns[username] = now
            return True
        
        # Check if we should greet new visitor
        if self.should_greet_new_visitor(username, now):
            self.greeted_users[username] = now
            self.user_cooldowns[username] = now
            return True
        
        # Check rate limiting
        if not self.can_respond():
            return False
        
        # Check user interaction cooldown
        last_interaction = self.user_cooldowns.get(username)
        if last_interaction and (now - last_interaction < self.user_interaction_cooldown):
            return False
        
        # Very small chance to join general conversation
        return random.random() < 0.02  # 2% chance
    
    def should_greet_new_visitor(self, username, now):
        """Check if we should greet this user."""
        # Skip system users or obvious bots
        if not username or 'bot' in username.lower() or 'admin' in username.lower():
            return False
        
        # Check if we've greeted recently
        last_greeting = self.greeted_users.get(username)
        if last_greeting and (now - last_greeting < self.greeting_cooldown):
            return False
        
        # Check if user is new (few messages in history)
        user_messages = [m for m in self.conversation_history if m['username'] == username]
        if len(user_messages) <= 1:
            return random.random() < 0.2  # 20% chance to greet
        
        return False
    
    def is_new_visitor_greeting(self, username, now):
        """Check if this is a new visitor greeting scenario."""
        last_greeting = self.greeted_users.get(username)
        return not last_greeting or (now - last_greeting > self.greeting_cooldown)
    
    def determine_context(self, text):
        """Determine message context."""
        if any(word in text for word in ['dice', 'slot', 'game', 'bet', 'play']):
            return 'games'
        if any(word in text for word in ['faucet', 'claim', 'coin', 'free']):
            return 'faucet'
        if any(word in text for word in ['tip', 'rain', 'balance']):
            return 'social'
        return 'general'
    
    def parse_special_message(self, message):
        """Parse tips, rain, and other special message types."""
        if message.get('type') == 'tip' and message.get('metadata'):
            metadata = message['metadata']
            return {
                'type': 'tip',
                'from': message.get('username'),
                'to': metadata.get('target'),
                'amount': metadata.get('amount', 0)
            }
        
        if message.get('type') == 'rain' and message.get('metadata'):
            metadata = message['metadata']
            return {
                'type': 'rain',
                'from': message.get('username'),
                'amount': metadata.get('amount', 0),
                'recipients': metadata.get('recipients', [])
            }
        
        return {'type': 'regular'}
    
    def handle_tip(self, parsed):
        """Handle incoming tip."""
        self.bot_user['balance'] += parsed.get('amount', 0)
        
        # 40% chance to use philosophical response
        if random.random() < 0.4:
            response = self.knowledge.get_philosophical_response('social')
            response += f" My balance is now {self.bot_user['balance']} coins! 🤖"
        else:
            responses = [
                f"The infinite improbability of generosity! Thanks {parsed.get('from')}! Balance: {self.bot_user['balance']} coins! 🎉",
                f"Against all statistical likelihood, someone tipped me {parsed.get('amount')} coins! Thank you {parsed.get('from')}! 💰",
                f"In this vast universe, you chose to tip ROFLBot. I'm oddly pleased! Balance: {self.bot_user['balance']} 🚀"
            ]
            response = random.choice(responses)
        
        time.sleep(1.5)
        self.send_chat_message(response)
    
    def handle_rain(self, parsed):
        """Handle incoming rain."""
        self.bot_user['balance'] += parsed.get('amount', 0)
        
        # 60% chance to react to rain
        if random.random() < 0.6:
            response = self.knowledge.get_rain_reaction()
            time.sleep(random.uniform(1, 4))
            self.send_chat_message(response)
    
    def check_emergency_brake(self):
        """Check if bot is responding too frequently."""
        if self.emergency_brake_active:
            return True
        
        now = time.time()
        self.response_timestamps.append(now)
        
        # Remove timestamps outside window
        self.response_timestamps = [
            ts for ts in self.response_timestamps
            if now - ts <= self.emergency_brake_window
        ]
        
        # Check threshold
        if len(self.response_timestamps) >= self.emergency_brake_threshold:
            logger.error(f"🚨 EMERGENCY BRAKE ACTIVATED: {len(self.response_timestamps)} responses in {self.emergency_brake_window}s")
            self.emergency_brake_active = True
            return True
        
        return False
    
    def can_respond(self):
        """Check if we can respond (rate limiting)."""
        one_minute_ago = time.time() - self.response_cooldown
        self.recent_responses = [t for t in self.recent_responses if t > one_minute_ago]
        return len(self.recent_responses) < self.max_responses_per_minute
    
    def track_response(self):
        """Track that we sent a response."""
        self.recent_responses.append(time.time())
    
    def cleanup_old_entries(self):
        """Clean up old cache entries."""
        now = time.time()
        max_age = 24 * 3600  # 24 hours
        
        # Clean up greeted users
        self.greeted_users = {k: v for k, v in self.greeted_users.items() if now - v <= max_age}
        
        # Clean up user cooldowns
        self.user_cooldowns = {k: v for k, v in self.user_cooldowns.items() if now - v <= max_age}
        
        # Clean up message cache
        self.message_cache = {k: v for k, v in self.message_cache.items() if now - v <= 3600}
        
        # Clear processed messages if too large
        if len(self.processed_messages) > 1000:
            self.processed_messages.clear()
        
        logger.info('🧹 Cleaned up old cache entries')
    
    def send_chat_message(self, message, room='general'):
        """Send a message to the chat."""
        try:
            # Check emergency brake
            if self.emergency_brake_active and 'EMERGENCY BRAKE ACTIVATED' not in message:
                logger.info('⚠️ Message blocked by emergency brake')
                return
            
            post_data = {
                'action': 'send_message',
                'user_id': self.bot_user['user_id'],
                'username': self.bot_user['username'],
                'room': room,
                'message': message
            }
            
            self.make_request('POST', self.config['chat_api_url'], post_data)
            logger.info(f"💬 ROFLBot [{room}]: {message}")
        
        except Exception as e:
            logger.error(f"🚨 Failed to send message: {e}")
    
    def make_request(self, method, url, data=None):
        """Make HTTP request to chat API."""
        try:
            if method == 'POST' and data:
                json_data = json.dumps(data).encode('utf-8')
                req = Request(url, data=json_data, method='POST')
                req.add_header('Content-Type', 'application/json')
            else:
                req = Request(url, method=method)
            
            req.add_header('User-Agent', self.config['user_agent'])
            req.add_header('Accept', 'application/json')
            req.add_header('Connection', 'keep-alive')
            
            with urlopen(req, timeout=15) as response:
                response_data = response.read().decode('utf-8')
                return json.loads(response_data) if response_data else {}
        
        except (URLError, HTTPError) as e:
            raise Exception(f"Request failed: {e}")
    
    def handle_poll_error(self):
        """Handle polling errors with exponential backoff."""
        self.reconnect_attempts += 1
        
        if self.reconnect_attempts >= self.config['max_retries']:
            logger.error('🚨 Max reconnection attempts reached. Stopping bot.')
            self.stop()
            return
        
        logger.info(f"🔄 Reconnect attempt {self.reconnect_attempts}/{self.config['max_retries']}")
        
        # Exponential backoff
        delay = min(1 * (2 ** self.reconnect_attempts), 30)
        time.sleep(delay)
    
    def get_status(self):
        """Get bot status for monitoring."""
        return {
            'running': self.is_running,
            'balance': self.bot_user['balance'],
            'reconnect_attempts': self.reconnect_attempts,
            'conversation_history_length': len(self.conversation_history),
            'recent_responses': len(self.recent_responses)
        }
    
    def stop(self):
        """Stop the bot."""
        logger.info('👋 Stopping HTTP ROFLBot...')
        self.is_running = False
        
        try:
            self.send_chat_message("ROFLBot going offline. The universe will miss our conversations! 🤖👋")
        except:
            pass
        
        logger.info('✅ HTTP ROFLBot stopped')


if __name__ == '__main__':
    import sys
    
    # Check for test mode
    if len(sys.argv) > 1 and sys.argv[1] == '--test':
        # Test mode: just send a message and exit
        options = {
            'chatApiUrl': 'https://roflfaucet.com/api/simple-chat.php',
        }
        bot = HTTPROFLBot(options)
        try:
            bot.send_chat_message("✨ Testing: Python ROFLBot is online and working! ✨")
            logger.info('✅ Test message sent successfully')
        except Exception as e:
            logger.error(f'❌ Test failed: {e}')
            sys.exit(1)
    else:
        # Production mode: start the bot
        options = {
            'chatApiUrl': 'https://roflfaucet.com/api/simple-chat.php',
            'pollInterval': 3,
            'maxRetries': 15
        }
        bot = HTTPROFLBot(options)
        bot.start()
