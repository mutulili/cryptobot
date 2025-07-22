# Telegram Crypto Bot for @legitairdropsfb

A Node.js Telegram bot that fetches and posts cryptocurrency prices to the @legitairdropsfb channel.

## Features

- 🚀 Fetches top 5 cryptocurrencies (excluding USDT)
- 📊 Shows current prices and 24h price changes
- 🔄 Automatic updates every minute
- 📢 Can post directly to @legitairdropsfb channel
- 💎 Clean, formatted messages with emojis

## Commands

- `/start` - Start receiving crypto updates
- `/stop` - Stop updates
- `/prices` - Get current prices immediately
- `/channel` - Post update to @legitairdropsfb channel

## Setup

1. Make sure your bot token is set in the `.env` file
2. Add the bot as an administrator to the @legitairdropsfb channel
3. Run the bot with `npm start`

## Environment Variables

- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- `TELEGRAM_CHANNEL` - Target channel (default: @legitairdropsfb)

## Usage

1. Start the bot: `npm start`
2. Send `/start` to begin receiving updates
3. Use `/channel` to post to the @legitairdropsfb channel
4. Use `/stop` to stop updates

The bot will automatically fetch crypto data from CoinGecko API and format it nicely for Telegram.

## Hosting Options

### Current Setup (Local)
- Bot runs on your computer
- Stops when computer is offline/sleeping
- Good for testing and development

### For 24/7 Operation
To keep the bot running when you're offline, you need to host it on a server:

#### Free Options:
1. **Railway** - Free tier with 500 hours/month
2. **Render** - Free tier with some limitations
3. **Heroku** - Free tier discontinued, but paid plans available
4. **Replit** - Can run Node.js bots (with Always On for paid plans)

#### VPS Options:
1. **DigitalOcean** - $5/month droplet
2. **Linode** - $5/month VPS
3. **AWS EC2** - Free tier for 12 months

#### Quick Deploy to Railway:
1. Push code to GitHub repository
2. Connect Railway to your GitHub
3. Deploy the bot
4. Add environment variables (TELEGRAM_BOT_TOKEN)
5. Bot runs 24/7 automatically

### Local Persistence (Partial Solution)
For better local reliability, you can:
- Run bot as a system service
- Use PM2 process manager
- Set up auto-restart on system boot