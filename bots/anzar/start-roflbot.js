#!/usr/bin/env node

/**
 * ROFLBot Startup Script
 * ======================
 * Launches ROFLBot with proper configuration and monitoring
 */

const ROFLBot = require('./roflbot');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({
    path: path.join(__dirname, '.env')
});

// Configuration
const config = {
    // WebSocket connection
    wsUrl: process.env.CHAT_WEBSOCKET_URL || 'ws://localhost:8082/chat',
    
    // Bot behavior
    responseChance: parseFloat(process.env.BOT_RESPONSE_CHANCE) || 0.2, // 20% chance for general chat
    maxResponsesPerMinute: parseInt(process.env.MAX_RESPONSES_PER_MINUTE) || 3,
    
    // Reconnection settings
    reconnectDelay: parseInt(process.env.RECONNECT_DELAY) || 5000,
    maxReconnectAttempts: parseInt(process.env.MAX_RECONNECT_ATTEMPTS) || 10,
    
    // Development mode
    isDevelopment: process.env.NODE_ENV !== 'production'
};

// Validate required environment variables
const requiredEnvVars = [
    'GEMINI_API_KEY',
    // 'OPENAI_API_KEY', // Optional
    // 'HUGGINGFACE_API_KEY' // Optional
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.error('🚨 Missing required environment variables:');
    missingVars.forEach(varName => {
        console.error(`   - ${varName}`);
    });
    console.error('\nPlease create a .env file with the required API keys.');
    console.error('See .env.example for the template.');
    process.exit(1);
}

// Create logs directory
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Setup logging
const logFile = path.join(logsDir, `roflbot-${new Date().toISOString().split('T')[0]}.log`);
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

function logToFile(level, ...args) {
    const timestamp = new Date().toISOString();
    const message = args.join(' ');
    const logEntry = `${timestamp} [${level}] ${message}\n`;
    
    try {
        fs.appendFileSync(logFile, logEntry);
    } catch (error) {
        // If logging fails, just continue without it
    }
}

console.log = (...args) => {
    originalConsoleLog(...args);
    if (!config.isDevelopment) {
        logToFile('INFO', ...args);
    }
};

console.error = (...args) => {
    originalConsoleError(...args);
    logToFile('ERROR', ...args);
};

console.warn = (...args) => {
    originalConsoleWarn(...args);
    logToFile('WARN', ...args);
};

// Print startup banner
console.log('\n' + '='.repeat(50));
console.log('🤖 ROFLBot Starting Up');
console.log('='.repeat(50));
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`WebSocket URL: ${config.wsUrl}`);
console.log(`Response Chance: ${config.responseChance * 100}%`);
console.log(`Max Responses/Min: ${config.maxResponsesPerMinute}`);
console.log(`Log File: ${logFile}`);
console.log('='.repeat(50) + '\n');

// Initialize ROFLBot
const bot = new ROFLBot(config);

// Event handlers
bot.on('connected', () => {
    console.log('✅ ROFLBot successfully connected to chat');
});

bot.on('disconnected', () => {
    console.log('❌ ROFLBot disconnected from chat');
});

bot.on('error', (error) => {
    console.error('🚨 ROFLBot error:', error.message);
});

// Health check endpoint (if we want to monitor the bot)
if (config.isDevelopment) {
    const express = require('express');
    const app = express();
    const port = process.env.HEALTH_CHECK_PORT || 3001;
    
    app.get('/health', (req, res) => {
        const status = bot.getStatusReport ? bot.getStatusReport() : { status: 'unknown' };
        res.json({
            status: 'ok',
            bot: status,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        });
    });
    
    app.get('/services', (req, res) => {
        try {
            const serviceStatus = bot.aiRouter.getServiceStatus();
            res.json(serviceStatus);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    
    app.listen(port, () => {
        console.log(`🩺 Health check server running on port ${port}`);
        console.log(`   Health: http://localhost:${port}/health`);
        console.log(`   Services: http://localhost:${port}/services`);
    });
}

// Performance monitoring
let messageCount = 0;
let responseCount = 0;
const startTime = Date.now();

// Monitor bot performance
setInterval(() => {
    const uptime = Date.now() - startTime;
    const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    
    console.log(`📊 ROFLBot Stats - Uptime: ${uptimeHours}h ${uptimeMinutes}m, Messages: ${messageCount}, Responses: ${responseCount}`);
    
    // Log memory usage
    const memUsage = process.memoryUsage();
    const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    console.log(`💾 Memory Usage: ${memMB}MB`);
    
    // If memory usage is too high, suggest restart
    if (memMB > 200) {
        console.warn('⚠️  High memory usage detected. Consider restarting ROFLBot.');
    }
    
}, 30 * 60 * 1000); // Every 30 minutes

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n🛑 ROFLBot shutdown requested...');
    
    if (bot.disconnect) {
        bot.disconnect();
    }
    
    setTimeout(() => {
        console.log('👋 ROFLBot shutdown complete');
        process.exit(0);
    }, 2000);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 ROFLBot received SIGTERM, shutting down...');
    
    if (bot.disconnect) {
        bot.disconnect();
    }
    
    setTimeout(() => {
        process.exit(0);
    }, 2000);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    console.error('Stack:', error.stack);
    
    // Try to disconnect gracefully
    if (bot.disconnect) {
        bot.disconnect();
    }
    
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the bot
async function startBot() {
    try {
        console.log('🚀 Launching ROFLBot...');
        await bot.connect();
    } catch (error) {
        console.error('🚨 Failed to start ROFLBot:', error.message);
        process.exit(1);
    }
}

// Start with a small delay to ensure everything is initialized
setTimeout(startBot, 1000);

// Export for testing
module.exports = { bot, config };