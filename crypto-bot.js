const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// PID file for instance management
const PID_FILE = path.join(__dirname, 'bot.pid');

// Store bot instance globally
let botInstance = null;

// Bot configuration
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8014754930:AAG3FxXaw4AAiJfP5dPmoV5HoqZirR6Qvwc';
const PORT = process.env.PORT || 3000;
const CHANNEL = process.env.TELEGRAM_CHANNEL || '@cryptoprices254';
const PROMOTED_CHANNEL = process.env.PROMOTED_CHANNEL || '@legitairdropsfb';
const CMC_API_KEY = process.env.CMC_API_KEY || 'b54bcf4d-1bca-4e8e-9a24-22ff2c3d462c'; // Demo key

// Auto-posting interval (5 minutes to avoid rate limits)
let channelPostingInterval = null;

// CoinMarketCap API configuration
const API_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest";
const API_PARAMS = {
    start: 1,
    limit: 10,
    convert: 'USD'
};

// Check for existing instance
function checkExistingInstance() {
    if (fs.existsSync(PID_FILE)) {
        try {
            const existingPid = fs.readFileSync(PID_FILE, 'utf8').trim();
            // Check if process is still running
            process.kill(existingPid, 0);
            log(`❌ Another bot instance is already running (PID: ${existingPid})`);
            log('🛑 Please stop the existing instance first or wait for it to finish');
            process.exit(1);
        } catch (e) {
            // Process doesn't exist, remove stale PID file
            fs.unlinkSync(PID_FILE);
            log('🗑️ Removed stale PID file');
        }
    }
}

// Create PID file
function createPidFile() {
    fs.writeFileSync(PID_FILE, process.pid.toString());
    log(`📝 Created PID file: ${process.pid}`);
}

// Remove PID file
function removePidFile() {
    if (fs.existsSync(PID_FILE)) {
        fs.unlinkSync(PID_FILE);
        log('🗑️ Removed PID file');
    }
}

// Create bot instance with error handling
function createBot() {
    try {
        if (botInstance) {
            log('🛑 Stopping existing bot instance...');
            botInstance.stopPolling();
            botInstance = null;
        }
        
        botInstance = new TelegramBot(TOKEN, { 
            polling: {
                interval: 1000,
                autoStart: false,
                params: {
                    timeout: 10
                }
            }
        });
        
        // Add error handlers immediately
        botInstance.on('error', (error) => {
            log(`❌ Bot error: ${error.message}`);
        });

        botInstance.on('polling_error', (error) => {
            log(`❌ Polling error: ${error.message}`);
            if (error.message.includes('409') || error.message.includes('Conflict')) {
                log('🔄 Attempting to restart polling...');
                setTimeout(() => {
                    if (botInstance) {
                        botInstance.stopPolling();
                        setTimeout(() => {
                            if (botInstance) {
                                botInstance.startPolling();
                            }
                        }, 2000);
                    }
                }, 1000);
            }
        });
        
        return botInstance;
    } catch (error) {
        log(`❌ Failed to create bot: ${error.message}`);
        throw error;
    }
}

// Store active jobs
const activeJobs = new Map();

// Logging function
function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

// Fetch cryptocurrency data from CoinMarketCap API
async function getCryptoData() {
    try {
        log('🔄 Fetching crypto data from CoinMarketCap...');
        
        const response = await axios.get(API_URL, {
            params: API_PARAMS,
            timeout: 15000,
            headers: {
                'X-CMC_PRO_API_KEY': CMC_API_KEY,
                'Accept': 'application/json'
            }
        });
        
        log(`📡 API Response: ${response.status}`);
        
        if (response.status === 200) {
            const data = response.data.data;
            // Filter out USDT and get top 5
            const filteredData = data.filter(crypto => 
                crypto.symbol && crypto.symbol !== 'USDT'
            );
            const result = filteredData.slice(0, 5);
            log(`✅ Successfully fetched ${result.length} cryptocurrencies`);
            return result;
        } else {
            log(`❌ API Error: ${response.status}`);
            return [];
        }
    } catch (error) {
        log(`❌ Exception in getCryptoData: ${error.message}`);
        return [];
    }
}

// Format cryptocurrency data into a message
function formatCryptoMessage(cryptos) {
    if (!cryptos || cryptos.length === 0) {
        return "❌ Unable to fetch cryptocurrency data. Please try again later.";
    }
    
    let message = "🚀 **Top 5 Cryptocurrencies** 🚀\n\n";
    
    cryptos.forEach((crypto, index) => {
        const name = crypto.name || 'Unknown';
        const symbol = crypto.symbol || '';
        const price = crypto.quote?.USD?.price || 0;
        const change24h = crypto.quote?.USD?.percent_change_24h || 0;
        
        // Format price
        let priceStr;
        if (price >= 1) {
            priceStr = `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else {
            priceStr = `$${price.toFixed(6)}`;
        }
        
        // Format change with emoji
        let changeStr;
        if (change24h > 0) {
            changeStr = `📈 +${change24h.toFixed(2)}%`;
        } else if (change24h < 0) {
            changeStr = `📉 ${change24h.toFixed(2)}%`;
        } else {
            changeStr = `➡️ ${change24h.toFixed(2)}%`;
        }
        
        message += `${index + 1}. **${name}** (${symbol})\n`;
        message += `   💰 ${priceStr}\n`;
        message += `   📊 ${changeStr}\n\n`;
    });
    
    const now = new Date();
    message += `🔄 Updated at ${now.toLocaleTimeString()}`;
    message += `\n\n💎 Join ${PROMOTED_CHANNEL} for exclusive airdrops and crypto signals!`;
    message += `\n🚀 Follow us for daily crypto updates and opportunities!`;
    
    return message;
}

// Send crypto update to channel
async function sendCryptoUpdate(chatId) {
    try {
        log('📊 Sending crypto update...');
        
        const cryptos = await getCryptoData();
        const message = formatCryptoMessage(cryptos);
        
        await botInstance.sendMessage(chatId, message, { 
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        });
        
        log('✅ Crypto update sent successfully!');
        
    } catch (error) {
        log(`❌ Error sending crypto update: ${error.message}`);
        try {
            await botInstance.sendMessage(chatId, "❌ Error updating crypto prices. Will retry soon.");
        } catch (e) {
            log(`❌ Failed to send error message: ${e.message}`);
        }
    }
}

// Auto-post to channel function
async function autoPostToChannel() {
    try {
        log(`📢 Auto-posting to ${CHANNEL}...`);
        
        const cryptos = await getCryptoData();
        const message = formatCryptoMessage(cryptos);
        
        // Post to the channel
        await botInstance.sendMessage(CHANNEL, message, { 
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        });
        
        log(`✅ Auto-posted to ${CHANNEL} successfully`);
        
    } catch (error) {
        log(`❌ Error auto-posting to channel: ${error.message}`);
    }
}

// Start auto-posting to channel
function startChannelPosting() {
    if (channelPostingInterval) {
        clearInterval(channelPostingInterval);
    }
    
    // Post immediately, then every 2 minutes
    autoPostToChannel();
    channelPostingInterval = setInterval(autoPostToChannel, 120000); // 2 minutes
    log(`📢 Auto-posting to ${CHANNEL} every 2 minutes...`);
}

// Stop auto-posting to channel
function stopChannelPosting() {
    if (channelPostingInterval) {
        clearInterval(channelPostingInterval);
        channelPostingInterval = null;
        log('🛑 Stopped auto-posting to channel');
    }
}
// Start command handler
function setupHandlers() {
    if (!botInstance) return;
    
    botInstance.onText(/\/start/, async (msg) => {
    try {
        const chatId = msg.chat.id;
        const userName = msg.from.first_name || "User";
        
        log(`🚀 /start command from ${userName} (chat_id: ${chatId})`);
        
        // Clear existing interval if any
        if (activeJobs.has(chatId)) {
            clearInterval(activeJobs.get(chatId));
            log('🗑️ Removed existing job');
        }
        
        // Schedule new job - every 60 seconds
        const intervalId = setInterval(() => {
            sendCryptoUpdate(chatId);
        }, 120000); // 2 minutes
        
        activeJobs.set(chatId, intervalId);
        
        const welcomeMsg = `👋 Hello ${userName}!\n\n` +
            `🤖 **Crypto Price Bot** is now active!\n\n` +
            `📊 You'll receive top 5 crypto prices every 2 minutes\n` +
            `🔄 First update in 3 seconds...\n\n` +
            `**Commands:**\n` +
            `• /start - Start updates\n` +
            `• /stop - Stop updates\n` +
            `• /prices - Get prices now\n` +
            `• /channel - Post to ${CHANNEL}\n\n` +
            `💎 Join ${PROMOTED_CHANNEL} for exclusive airdrops and crypto signals!`;
        
        await botInstance.sendMessage(chatId, welcomeMsg, { parse_mode: 'Markdown' });
        
        // Send first update after 3 seconds
        setTimeout(() => {
            sendCryptoUpdate(chatId);
        }, 3000);
        
        log('✅ Welcome message sent');
        
    } catch (error) {
        log(`❌ Error in start command: ${error.message}`);
        botInstance.sendMessage(msg.chat.id, "❌ Error starting bot. Please try again.");
    }
    });

    // Stop command handler
    botInstance.onText(/\/stop/, async (msg) => {
    try {
        const chatId = msg.chat.id;
        log(`🛑 /stop command from chat_id: ${chatId}`);
        
        if (activeJobs.has(chatId)) {
            clearInterval(activeJobs.get(chatId));
            activeJobs.delete(chatId);
            await botInstance.sendMessage(chatId, "🛑 **Updates stopped!** Use /start to resume.");
            log('✅ Jobs stopped successfully');
        } else {
            await botInstance.sendMessage(chatId, "ℹ️ No active updates to stop.");
        }
        
    } catch (error) {
        log(`❌ Error in stop command: ${error.message}`);
        botInstance.sendMessage(msg.chat.id, "❌ Error stopping updates.");
    }
    });

    // Prices command handler - immediate update
    botInstance.onText(/\/prices/, async (msg) => {
    try {
        const chatId = msg.chat.id;
        log(`💰 /prices command from chat_id: ${chatId}`);
        
        await botInstance.sendMessage(chatId, "🔄 Fetching current prices...");
        await sendCryptoUpdate(chatId);
        
        log('✅ Immediate prices sent');
        
    } catch (error) {
        log(`❌ Error in prices command: ${error.message}`);
        botInstance.sendMessage(msg.chat.id, "❌ Error fetching prices.");
    }
    });

    // Channel command handler - post to @legitairdropsfb
    botInstance.onText(/\/channel/, async (msg) => {
    try {
        const chatId = msg.chat.id;
        log(`📢 /channel command from chat_id: ${chatId}`);
        
        await botInstance.sendMessage(chatId, `🔄 Posting to ${CHANNEL}...`);
        
        const cryptos = await getCryptoData();
        const message = formatCryptoMessage(cryptos);
        
        // Post to the channel
        await botInstance.sendMessage(CHANNEL, message, { 
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        });
        
        await botInstance.sendMessage(chatId, `✅ Successfully posted to ${CHANNEL}!`);
        log(`✅ Posted to ${CHANNEL} successfully`);
        
    } catch (error) {
        log(`❌ Error posting to channel: ${error.message}`);
        botInstance.sendMessage(msg.chat.id, `❌ Error posting to ${CHANNEL}. Make sure the bot is an admin in the channel.`);
    }
    });
}

// Test API and start bot
async function main() {
    try {
        // Check for existing instance
        checkExistingInstance();
        
        // Create PID file
        createPidFile();
        
        log('🚀 Starting Telegram Crypto Bot...');
        
        // Create bot instance
        createBot();
        
        // Setup command handlers
        setupHandlers();
        
        // Test API first
        log('🧪 Testing CoinMarketCap API...');
        const testData = await getCryptoData();
        if (testData && testData.length > 0) {
            log(`✅ API test successful - got ${testData.length} cryptos`);
        } else {
            log('⚠️ API test failed, but continuing...');
        }
        
        // Test bot token
        const me = await botInstance.getMe();
        log(`✅ Bot connected: @${me.username}`);
        
        // Start auto-posting to channel
        startChannelPosting();
        
        // Start polling
        await botInstance.startPolling();
        
        // Keep-alive server for Railway
        const http = require('http');
        const server = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Crypto Bot is running! 🚀\n');
        });
        server.listen(PORT, () => {
            log(`🌐 Keep-alive server running on port ${PORT}`);
        });
        
        log(`📢 Target channel: ${CHANNEL}`);
        log(`🎯 Promoted channel: ${PROMOTED_CHANNEL}`);
        log('🔄 Bot is now running and listening for commands...');
        log(`🌐 Server ready on port ${PORT}`);
        log('');
        log('Available commands:');
        log('• /start - Start receiving crypto updates');
        log('• /stop - Stop updates');
        log('• /prices - Get current prices');
        log(`• /channel - Post update to ${CHANNEL}`);
        log('');
        log(`📢 Auto-posting to ${CHANNEL} every 2 minutes promoting ${PROMOTED_CHANNEL}`);
        
    } catch (error) {
        log(`❌ Failed to start bot: ${error.message}`);
        removePidFile();
        process.exit(1);
    }
}

// Graceful shutdown
function gracefulShutdown(signal) {
    log('🛑 Shutting down bot...');
    
    // Stop channel posting
    stopChannelPosting();
    
    // Clear all active jobs
    activeJobs.forEach((intervalId) => {
        clearInterval(intervalId);
    });
    activeJobs.clear();
    
    // Stop bot polling
    if (botInstance) {
        botInstance.stopPolling();
        botInstance = null;
    }
    
    // Remove PID file
    removePidFile();
    
    log(`✅ Bot shutdown complete (${signal})`);
    process.exit(0);
}

// Handle various shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    log(`❌ Uncaught Exception: ${error.message}`);
    removePidFile();
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    log(`❌ Unhandled Rejection at: ${promise}, reason: ${reason}`);
    removePidFile();
    process.exit(1);
});

// Start the bot
main();