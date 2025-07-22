import asyncio
import requests
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
import logging
import json
from datetime import datetime

# Enable detailed logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# CoinGecko API endpoint
API_URL = "https://api.coingecko.com/api/v3/coins/markets"
PARAMS = {
    "vs_currency": "usd",
    "order": "market_cap_desc",
    "per_page": 10,
    "page": 1,
    "sparkline": False
}

# Bot token
TOKEN = "8014754930:AAG3FxXaw4AAiJfP5dPmoV5HoqZirR6Qvwc"

def get_crypto_data():
    """Fetch cryptocurrency data from CoinGecko API"""
    try:
        logger.info("🔄 Fetching crypto data from CoinGecko...")
        response = requests.get(API_URL, params=PARAMS, timeout=15)
        
        logger.info(f"📡 API Response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            # Filter out USDT and get top 5
            filtered_data = [crypto for crypto in data if crypto.get('symbol', '').upper() != 'USDT']
            result = filtered_data[:5]
            logger.info(f"✅ Successfully fetched {len(result)} cryptocurrencies")
            return result
        else:
            logger.error(f"❌ API Error: {response.status_code} - {response.text}")
            return []
            
    except Exception as e:
        logger.error(f"❌ Exception in get_crypto_data: {e}")
        return []

def format_crypto_message(cryptos):
    """Format cryptocurrency data into a message"""
    if not cryptos:
        return "❌ Unable to fetch cryptocurrency data. Please try again later."
    
    message = "🚀 **Top 5 Cryptocurrencies** 🚀\n\n"
    
    for i, crypto in enumerate(cryptos, 1):
        name = crypto.get('name', 'Unknown')
        symbol = crypto.get('symbol', '').upper()
        price = crypto.get('current_price', 0)
        change_24h = crypto.get('price_change_percentage_24h', 0)
        
        # Format price
        if price >= 1:
            price_str = f"${price:,.2f}"
        else:
            price_str = f"${price:.6f}"
        
        # Format change with emoji
        if change_24h > 0:
            change_str = f"📈 +{change_24h:.2f}%"
        elif change_24h < 0:
            change_str = f"📉 {change_24h:.2f}%"
        else:
            change_str = f"➡️ {change_24h:.2f}%"
        
        message += f"{i}. **{name}** ({symbol})\n"
        message += f"   💰 {price_str}\n"
        message += f"   📊 {change_str}\n\n"
    
    message += f"🔄 Updated at {datetime.now().strftime('%H:%M:%S')}"
    return message

async def send_crypto_update(context: ContextTypes.DEFAULT_TYPE):
    """Send crypto update to chat"""
    try:
        logger.info("📊 Sending crypto update...")
        
        cryptos = get_crypto_data()
        message = format_crypto_message(cryptos)
        
        await context.bot.send_message(
            chat_id=context.job.chat_id,
            text=message,
            parse_mode='Markdown'
        )
        
        logger.info("✅ Crypto update sent successfully!")
        
    except Exception as e:
        logger.error(f"❌ Error sending crypto update: {e}")
        try:
            await context.bot.send_message(
                chat_id=context.job.chat_id,
                text="❌ Error updating crypto prices. Will retry soon."
            )
        except:
            pass

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    try:
        chat_id = update.effective_chat.id
        user_name = update.effective_user.first_name or "User"
        
        logger.info(f"🚀 /start command from {user_name} (chat_id: {chat_id})")
        
        # Remove existing jobs for this chat
        current_jobs = context.job_queue.get_jobs_by_name(str(chat_id))
        for job in current_jobs:
            job.schedule_removal()
            logger.info("🗑️ Removed existing job")
        
        # Schedule new job
        context.job_queue.run_repeating(
            send_crypto_update,
            interval=60,  # Every 60 seconds
            first=3,      # First update in 3 seconds
            chat_id=chat_id,
            name=str(chat_id)
        )
        
        welcome_msg = f"👋 Hello {user_name}!\n\n"
        welcome_msg += "🤖 **Crypto Price Bot** is now active!\n\n"
        welcome_msg += "📊 You'll receive top 5 crypto prices every minute\n"
        welcome_msg += "🔄 First update in 3 seconds...\n\n"
        welcome_msg += "**Commands:**\n"
        welcome_msg += "• `/start` - Start updates\n"
        welcome_msg += "• `/stop` - Stop updates\n"
        welcome_msg += "• `/prices` - Get prices now"
        
        await update.message.reply_text(welcome_msg, parse_mode='Markdown')
        logger.info("✅ Welcome message sent")
        
    except Exception as e:
        logger.error(f"❌ Error in start_command: {e}")
        await update.message.reply_text("❌ Error starting bot. Please try again.")

async def stop_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /stop command"""
    try:
        chat_id = update.effective_chat.id
        logger.info(f"🛑 /stop command from chat_id: {chat_id}")
        
        current_jobs = context.job_queue.get_jobs_by_name(str(chat_id))
        if current_jobs:
            for job in current_jobs:
                job.schedule_removal()
            await update.message.reply_text("🛑 **Updates stopped!** Use /start to resume.")
            logger.info("✅ Jobs stopped successfully")
        else:
            await update.message.reply_text("ℹ️ No active updates to stop.")
            
    except Exception as e:
        logger.error(f"❌ Error in stop_command: {e}")
        await update.message.reply_text("❌ Error stopping updates.")

async def prices_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /prices command - immediate update"""
    try:
        chat_id = update.effective_chat.id
        logger.info(f"💰 /prices command from chat_id: {chat_id}")
        
        await update.message.reply_text("🔄 Fetching current prices...")
        
        cryptos = get_crypto_data()
        message = format_crypto_message(cryptos)
        
        await update.message.reply_text(message, parse_mode='Markdown')
        logger.info("✅ Immediate prices sent")
        
    except Exception as e:
        logger.error(f"❌ Error in prices_command: {e}")
        await update.message.reply_text("❌ Error fetching prices.")

async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle errors"""
    logger.error(f"❌ Update {update} caused error: {context.error}")

def main():
    """Main function"""
    try:
        logger.info("🚀 Starting Telegram Crypto Bot...")
        
        # Fix for Python 3.14 - ensure event loop exists
        try:
            loop = asyncio.get_event_loop()
            if loop.is_closed():
                raise RuntimeError("Event loop is closed")
        except RuntimeError:
            # Create new event loop if none exists or current one is closed
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            logger.info("✅ Created new event loop")
        
        # Test API first
        logger.info("🧪 Testing CoinGecko API...")
        test_data = get_crypto_data()
        if test_data:
            logger.info(f"✅ API test successful - got {len(test_data)} cryptos")
        else:
            logger.warning("⚠️ API test failed, but continuing...")
        
        # Create application
        application = Application.builder().token(TOKEN).build()
        
        # Add handlers
        application.add_handler(CommandHandler("start", start_command))
        application.add_handler(CommandHandler("stop", stop_command))
        application.add_handler(CommandHandler("prices", prices_command))
        application.add_error_handler(error_handler)
        
        logger.info("✅ Bot handlers registered")
        logger.info("🔄 Starting polling...")
        
        # Start the bot
        application.run_polling(
            allowed_updates=Update.ALL_TYPES,
            drop_pending_updates=True
        )
        
    except Exception as e:
        logger.error(f"❌ Failed to start bot: {e}")
        raise

if __name__ == "__main__":
    main()