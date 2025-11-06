#!/usr/bin/env node

/**
 * Anzar Rainbot Startup Script
 * =============================
 * Launches Anzar Rainbot for automatic rain system
 */

const AnzarRainbot = require('./anzar-rainbot');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({
    path: path.join(__dirname, '.env')
});

console.log('\n' + '='.repeat(60));
console.log('🌧️ Anzar Rainbot Starting Up');
console.log('='.repeat(60));
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Chat API URL: https://roflfaucet.com/api/simple-chat.php`);
console.log(`Polling Interval: 3 seconds`);
console.log(`Rain Schedule: Every hour at :30 minutes`);
console.log('='.repeat(60) + '\n');

// Initialize Anzar Rainbot
const rainbotOptions = {
    chatApiUrl: 'https://roflfaucet.com/api/simple-chat.php',
    pollInterval: 3000, // 3 seconds like the web client
    maxRetries: 15,
    
    // Rainbot specific config
    username: 'Anzar',
    userId: 'anzar',
    displayName: '🌧️ Anzar',
    
    // Rain configuration
    rainMinute: 30, // Rain at X:30 every hour
    minRainAmount: 20, // Minimum rain amount
    maxRainAmount: 100, // Maximum rain amount  
    coinsPerMessage: 1, // How many coins added per user message
    rainCooldown: 60 * 60 * 1000, // 1 hour between rains
    announceChance: 0.25, // 25% chance of announcement per hour
};

const rainbot = new AnzarRainbot(rainbotOptions);

// Event handlers
rainbot.on('started', () => {
    console.log('✅ Anzar Rainbot started successfully');
    console.log('☔ Monitoring chat for messages and tips');
    console.log('⏰ Rain scheduled for every hour at :30 minutes');
    console.log('💰 Each user message adds 1 coin to rainpool');
});

rainbot.on('stopped', () => {
    console.log('✅ Anzar Rainbot stopped gracefully');
});

rainbot.on('error', (error) => {
    console.error('🚨 Rainbot error:', error.message);
});

// Health monitoring
setInterval(() => {
    const status = rainbot.getStatus();
    console.log(`📊 Status - Running: ${status.running}, Balance: ${status.balance}, Next Rain: ${status.nextRainHour}:${String(status.nextRainMinute).padStart(2, '0')}`);
    
    // Log status occasionally
    if (Math.random() < 0.1) { // 10% chance per check
        console.log('🌧️ Rainbot Status:');
        console.log(`   Balance: ${status.balance} coins`);
        console.log(`   Last Rain: ${status.lastRainTime ? new Date(status.lastRainTime).toLocaleString() : 'Never'}`);
        console.log(`   Messages Processed: ${status.lastMessageTimestamp}`);
    }
}, 60000); // Every minute

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutdown signal received...');
    await rainbot.stop();
    setTimeout(() => {
        console.log('👋 Anzar Rainbot shutdown complete');
        process.exit(0);
    }, 2000);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 SIGTERM received...');
    await rainbot.stop();
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

// Start the rainbot
async function startRainbot() {
    try {
        console.log('🚀 Launching Anzar Rainbot...');
        await rainbot.start();
        
        console.log('\n🌧️ Anzar is now active in ROFLFaucet chat!');
        console.log('💬 Every user message adds coins to the rainpool');
        console.log('💰 Tips to Anzar boost the rainpool even more');
        console.log('⏰ Rain falls automatically every hour at :30 minutes');
        console.log('☔ Watch the rain clouds gather!\n');
        
    } catch (error) {
        console.error('🚨 Failed to start Anzar Rainbot:', error.message);
        process.exit(1);
    }
}

// Start with a small delay
setTimeout(startRainbot, 1000);

// Export for monitoring
module.exports = { rainbot };