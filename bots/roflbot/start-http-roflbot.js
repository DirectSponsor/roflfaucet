#!/usr/bin/env node

/**
 * HTTP ROFLBot Startup Script
 * ===========================
 * Launches ROFLBot with HTTP polling for chat system
 */

const HTTPROFLBot = require('./http-roflbot');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({
    path: path.join(__dirname, '.env')
});

console.log('\n' + '='.repeat(60));
console.log('🤖 HTTP ROFLBot Starting Up');
console.log('='.repeat(60));
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Chat API URL: https://roflfaucet.com/api/simple-chat.php`);
console.log(`Polling Interval: 3 seconds`);
console.log('='.repeat(60) + '\n');

// Initialize HTTP ROFLBot
const botOptions = {
    chatApiUrl: 'https://roflfaucet.com/api/simple-chat.php',
    pollInterval: 3000, // 3 seconds like the web client
    maxRetries: 15,
};

const bot = new HTTPROFLBot(botOptions);

// Event handlers
bot.on('started', () => {
    console.log('✅ HTTP ROFLBot started successfully');
    console.log('🤖 Monitoring chat for messages');
    console.log('💬 Ready to respond to chat messages');
});

bot.on('stopped', () => {
    console.log('✅ HTTP ROFLBot stopped gracefully');
});

bot.on('error', (error) => {
    console.error('🚨 ROFLBot error:', error.message);
});

// Health monitoring
setInterval(() => {
    const status = bot.getStatus();
    console.log(`📊 Status - Running: ${status.running}, Balance: ${status.balance}, Reconnect Attempts: ${status.reconnectAttempts}`);
}, 60000); // Every minute

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutdown signal received...');
    await bot.stop();
    setTimeout(() => {
        console.log('👋 HTTP ROFLBot shutdown complete');
        process.exit(0);
    }, 2000);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM received...');
    await bot.stop();
    setTimeout(() => {
        process.exit(0);
    }, 2000);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the bot
async function startBot() {
    try {
        console.log('🚀 Launching HTTP ROFLBot...');
        await bot.start();
        
        console.log('\n🤖 ROFLBot is now active in ROFLFaucet chat!');
        console.log('💬 Ready to answer questions and chat with users');
        console.log('🎮 Responding to mentions and help requests\n');
        
    } catch (error) {
        console.error('🚨 Failed to start HTTP ROFLBot:', error.message);
        process.exit(1);
    }
}

// Start with a small delay
setTimeout(startBot, 1000);

// Export for monitoring
module.exports = { bot };
