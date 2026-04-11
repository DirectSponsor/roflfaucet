#!/usr/bin/env python3
"""
Anzar Rainbot - Python Version
==============================
Automated rain distribution system for ROFLFaucet chat.
Uses HTTP polling instead of WebSocket.

No external dependencies - uses only Python standard library!
"""

import json
import time
import sys
import logging
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


class AnzarRainbot:
    def __init__(self, options=None):
        """Initialize Anzar Rainbot with configuration."""
        options = options or {}
        
        # Bot identity
        self.bot_user = {
            'user_id': options.get('userId', 'anzar'),
            'username': options.get('username', 'Anzar'),
            'display_name': options.get('displayName', '🌧️ Anzar'),
            'balance': 0,
            'is_bot': True
        }
        
        # API configuration
        self.config = {
            'chat_api_url': options.get('chatApiUrl', 'https://roflfaucet.com/api/simple-chat.php'),
            'poll_interval': options.get('pollInterval', 3),  # seconds
            'max_retries': options.get('maxRetries', 15),
            'user_agent': 'AnzarRainbot/2.0 (Python HTTP Polling)'
        }
        
        # Rain configuration
        self.rain_config = {
            'rain_schedule_minute': options.get('rainMinute', 30),
            'min_rain_amount': options.get('minRainAmount', 20),
            'max_rain_amount': options.get('maxRainAmount', 100),
            'coins_per_message': options.get('coinsPerMessage', 1),
            'rain_cooldown': options.get('rainCooldown', 60 * 60),  # 1 hour in seconds
            'announce_chance': options.get('announceChance', 0.25),
        }
        
        # State tracking
        self.is_running = False
        self.last_message_timestamp = 0
        self.current_room = 'general'
        self.reconnect_attempts = 0
        self.last_rain_time = 0
        self.last_rain_hour = -1
        self.last_low_funds_warning = 0
        
        # Message deduplication
        self.processed_messages = set()
        self.message_cache = {}  # {content_key: timestamp}
        
        # Activity tracking
        self.recent_messages = deque()  # timestamps of recent messages
        
        logger.info('🌧️ Anzar Rainbot initialized (Python)')
    
    def start(self):
        """Start the rainbot polling loop."""
        logger.info('🚀 Starting Anzar Rainbot...')
        self.is_running = True
        self.reconnect_attempts = 0
        
        try:
            # Send startup message
            self.send_chat_message("Anzar has awakened! The rain clouds are gathering! ☔")
            
            logger.info('✅ Anzar Rainbot started successfully')
            logger.info('☔ Monitoring chat for messages and tips')
            logger.info('💰 Each user message adds 1 coin to rainpool')
            logger.info(f'⏰ Rain scheduled for every hour at :{self.rain_config["rain_schedule_minute"]:02d}')
            
            # Main polling loop
            self.run_polling_loop()
            
        except KeyboardInterrupt:
            logger.info('\n🛑 Shutdown signal received...')
            self.stop()
        except Exception as e:
            logger.error(f'🚨 Error: {e}')
            sys.exit(1)
    
    def run_polling_loop(self):
        """Main polling loop - fetches messages at regular intervals."""
        import random
        
        status_check_interval = 60  # seconds
        last_status_check = 0
        last_cleanup = 0
        
        while self.is_running:
            try:
                current_time = time.time()
                
                # Poll for messages
                self.poll_for_messages()
                self.reconnect_attempts = 0
                
                # Check rain time every minute
                if current_time - last_status_check >= 60:
                    self.check_rain_time()
                    self.maybe_announce()
                    last_status_check = current_time
                
                # Cleanup every hour
                if current_time - last_cleanup >= 3600:
                    self.cleanup_old_entries()
                    last_cleanup = current_time
                
                # Log status occasionally
                if random.random() < 0.1:
                    status = self.get_status()
                    logger.info(f"📊 Status - Balance: {status['balance']}, Next Rain: {status['next_rain_hour']}:{status['next_rain_minute']:02d}")
                
                # Wait before next poll
                time.sleep(self.config['poll_interval'])
                
            except Exception as e:
                logger.error(f'🚨 Polling error: {e}')
                self.handle_poll_error()
    
    def poll_for_messages(self):
        """Fetch new messages from the chat API."""
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
        if message.get('username', '').lower() == 'roflbot':
            logger.info('🤐 Ignoring message from ROFLBot')
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
        
        # Process message for rain collection
        self.process_message_for_rainpool(message)
    
    def process_message_for_rainpool(self, message):
        """Add coins to rainpool from user messages."""
        # Ignore command messages
        if message.get('message', '').startswith('/'):
            return
        
        logger.info(f"💬 {message.get('username')}: {message.get('message')}")
        
        # Check for tips
        parsed = self.parse_special_message(message)
        
        if parsed['type'] == 'tip' and parsed.get('to', '').lower() == self.bot_user['username'].lower():
            logger.info(f"💰 Received tip: {parsed.get('amount')} coins from {parsed.get('from')}")
            self.bot_user['balance'] += parsed.get('amount', 0)
            
            responses = [
                f"Thanks for the {parsed.get('amount')} coin tip, {parsed.get('from')}! The rainpool is growing! ☔",
                f"{parsed.get('from')} added {parsed.get('amount')} coins to the rainpool! Rain coming at :{self.rain_config['rain_schedule_minute']:02d}! 🌧️",
                f"Your {parsed.get('amount')} coins will make it rain harder, {parsed.get('from')}! ⛈️"
            ]
            
            import random
            self.send_chat_message(random.choice(responses))
        else:
            # Regular message - add coin to balance
            self.bot_user['balance'] += self.rain_config['coins_per_message']
            logger.info(f"💧 Added {self.rain_config['coins_per_message']} coins to rainpool from {message.get('username')}")
        
        # Track activity
        self.track_message_activity(message)
    
    def parse_special_message(self, message):
        """Detect tips, rain, and other special message types."""
        if message.get('type') == 'tip' and message.get('metadata'):
            metadata = message['metadata']
            return {
                'type': 'tip',
                'from': message.get('username'),
                'to': metadata.get('target'),
                'amount': metadata.get('amount', 0)
            }
        
        return {'type': 'regular'}
    
    def track_message_activity(self, message):
        """Track message timestamps for activity detection."""
        if message.get('message', '').startswith('/'):
            return
        
        now = time.time()
        self.recent_messages.append(now)
        
        # Clean old entries (older than 1 hour)
        one_hour_ago = now - 3600
        self.recent_messages = deque([t for t in self.recent_messages if t > one_hour_ago])
    
    def get_recent_message_count(self):
        """Get number of messages in the last hour."""
        now = time.time()
        one_hour_ago = now - 3600
        return len([t for t in self.recent_messages if t > one_hour_ago])
    
    def check_rain_time(self):
        """Check if it's time to rain or send pre-rain warning."""
        now = datetime.now()
        current_hour = now.hour
        current_minute = now.minute
        
        # Check for pre-rain warning (10 minutes before)
        warning_minute = (self.rain_config['rain_schedule_minute'] - 10 + 60) % 60
        if current_minute == warning_minute and current_hour != self.last_rain_hour:
            self.check_pre_rain_warning()
        
        # Check for rain time
        if current_minute == self.rain_config['rain_schedule_minute'] and current_hour != self.last_rain_hour:
            self.last_rain_hour = current_hour
            logger.info('⏰ Rain time check - initiating rain!')
            self.execute_rain()
    
    def check_pre_rain_warning(self):
        """Send low funds warning before rain time if needed."""
        if self.bot_user['balance'] >= self.rain_config['min_rain_amount']:
            return
        
        recent_count = self.get_recent_message_count()
        if recent_count < 6:
            logger.info(f'🔇 Skipping low funds warning - only {recent_count} messages in last hour')
            return
        
        now = time.time()
        if now - self.last_low_funds_warning < 30 * 60:  # 30 minutes
            return
        
        self.last_low_funds_warning = now
        
        warnings = [
            f"⛈️ Rain in 10 minutes but only {self.bot_user['balance']} coins in the pool! Need {self.rain_config['min_rain_amount'] - self.bot_user['balance']} more coins!",
            f"🌧️ Rain timer: 10 minutes! Current pool: {self.bot_user['balance']}/{self.rain_config['min_rain_amount']} coins. Keep chatting!",
            f"⏰ 10 minutes to rain! Pool at {self.bot_user['balance']} coins (need {self.rain_config['min_rain_amount']}). More chat = bigger rain! 💬⛅",
        ]
        
        import random
        logger.info(f"⚠️ Sending pre-rain warning ({recent_count} messages in last hour)")
        self.send_chat_message(random.choice(warnings))
    
    def execute_rain(self):
        """Execute a rain event."""
        now = time.time()
        
        # Check cooldown
        if now - self.last_rain_time < self.rain_config['rain_cooldown']:
            logger.info('⏳ Rain cooldown active, skipping this rain')
            return
        
        # Check balance
        if self.bot_user['balance'] < self.rain_config['min_rain_amount']:
            logger.info(f"💰 Not enough coins ({self.bot_user['balance']} < {self.rain_config['min_rain_amount']})")
            recent_count = self.get_recent_message_count()
            if recent_count >= 6:
                self.send_chat_message("☁️ No rain this hour... the rainpool ran dry! Keep chatting to build it up! ☁️")
            return
        
        # Calculate rain amount
        rain_amount = min(self.bot_user['balance'], self.rain_config['max_rain_amount'])
        
        logger.info(f"🌧️ Executing rain of {rain_amount} coins!")
        self.last_rain_time = now
        
        # Send rain command
        self.send_chat_message(f'/rain {rain_amount}')
        
        # Deduct from balance
        self.bot_user['balance'] -= rain_amount
        
        # Send celebration message
        time.sleep(2)
        self.send_chat_message(
            f"⛈️ THE RAINS HAVE COME! {rain_amount} coins rained on active users! "
            f"Next rain at XX:{self.rain_config['rain_schedule_minute']:02d}! 💰\n"
            f"🌧️ *Rain clouds dispersing...* 🌧️"
        )
    
    def maybe_announce(self):
        """Maybe send an announcement about the rainbot."""
        import random
        
        if random.random() > self.rain_config['announce_chance']:
            return
        
        announcements = [
            f"☔ Rain clouds gathering... tip me to boost the rainpool! Current balance: {self.bot_user['balance']} coins",
            f"🌩️ Every message adds {self.rain_config['coins_per_message']} coin to the rainpool! Current balance: {self.bot_user['balance']} coins",
            f"⏰ Rain falls at :{self.rain_config['rain_schedule_minute']:02d} past each hour! Current rainpool: {self.bot_user['balance']} coins",
            f"💰 Tip me and I'll make it rain on everyone! Current balance: {self.bot_user['balance']} coins 🌧️",
        ]
        
        self.send_chat_message(random.choice(announcements))
    
    def cleanup_old_entries(self):
        """Clean up old message cache entries."""
        now = time.time()
        
        # Clean up message cache
        keys_to_delete = [k for k, v in self.message_cache.items() if now - v > 3600]
        for k in keys_to_delete:
            del self.message_cache[k]
        
        # Clear processed messages if too large
        if len(self.processed_messages) > 1000:
            self.processed_messages.clear()
    
    def send_chat_message(self, message, room='general'):
        """Send a message to the chat."""
        try:
            post_data = {
                'action': 'send_message',
                'user_id': self.bot_user['user_id'],
                'username': self.bot_user['username'],
                'room': room,
                'message': message
            }
            
            self.make_request('POST', self.config['chat_api_url'], post_data)
            logger.info(f"💬 Anzar [{room}]: {message}")
            
        except Exception as e:
            logger.error(f"🚨 Failed to send message: {e}")
    
    def make_request(self, method, url, data=None):
        """Make HTTP request to the chat API."""
        try:
            if method == 'POST' and data:
                json_data = json.dumps(data).encode('utf-8')
                req = Request(url, data=json_data, method='POST')
                req.add_header('Content-Type', 'application/json')
            else:
                req = Request(url, method=method)
            
            req.add_header('User-Agent', self.config['user_agent'])
            req.add_header('Accept', 'application/json')
            
            with urlopen(req, timeout=15) as response:
                response_data = response.read().decode('utf-8')
                return json.loads(response_data) if response_data else {}
        
        except (URLError, HTTPError) as e:
            raise Exception(f"Request failed: {e}")
    
    def handle_poll_error(self):
        """Handle polling errors with exponential backoff."""
        self.reconnect_attempts += 1
        
        if self.reconnect_attempts >= self.config['max_retries']:
            logger.error('🚨 Max reconnection attempts reached. Stopping rainbot.')
            self.stop()
            return
        
        logger.info(f"🔄 Reconnect attempt {self.reconnect_attempts}/{self.config['max_retries']}")
        
        # Exponential backoff
        import random
        delay = min(1000 * (2 ** self.reconnect_attempts), 30000) / 1000  # Convert ms to seconds
        time.sleep(delay)
    
    def get_status(self):
        """Get current bot status."""
        now = datetime.now()
        return {
            'running': self.is_running,
            'balance': self.bot_user['balance'],
            'reconnect_attempts': self.reconnect_attempts,
            'last_rain_time': self.last_rain_time,
            'next_rain_minute': self.rain_config['rain_schedule_minute'],
            'next_rain_hour': now.hour if now.minute < self.rain_config['rain_schedule_minute'] else (now.hour + 1) % 24,
        }
    
    def stop(self):
        """Stop the rainbot."""
        logger.info('👋 Stopping Anzar Rainbot...')
        self.is_running = False
        
        try:
            self.send_chat_message("The rain clouds are dispersing. Anzar is going offline for now! ☁️")
        except:
            pass
        
        logger.info('✅ Anzar Rainbot stopped')


if __name__ == '__main__':
    import sys
    
    # Check for test mode
    if len(sys.argv) > 1 and sys.argv[1] == '--test':
        # Test mode: just send a message and exit
        options = {
            'username': 'Anzar',
            'userId': 'anzar',
        }
        bot = AnzarRainbot(options)
        try:
            bot.send_chat_message("✨ Testing: Python Anzar Rainbot is online and working! ✨")
            logger.info('✅ Test message sent successfully')
        except Exception as e:
            logger.error(f'❌ Test failed: {e}')
            sys.exit(1)
    else:
        # Production mode: start the bot
        options = {
            'username': 'Anzar',
            'userId': 'anzar',
            'rainMinute': 30,
            'minRainAmount': 20,
            'maxRainAmount': 100,
        }
        bot = AnzarRainbot(options)
        bot.start()
    bot = AnzarRainbot(options)
    bot.start()
