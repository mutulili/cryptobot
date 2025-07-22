# 🚀 Deploy Crypto Bot to Railway (24/7 Hosting)

## Step 1: Prepare Your Code

1. **Create a GitHub Repository**
   - Go to [GitHub.com](https://github.com) and create a new repository
   - Name it something like `telegram-crypto-bot`
   - Make it **public** (required for Railway free tier)

2. **Upload Your Code**
   - Download all files from this project
   - Upload them to your GitHub repository
   - Make sure to include: `crypto-bot.js`, `package.json`, `railway.json`, `Procfile`

## Step 2: Deploy to Railway

1. **Sign up for Railway**
   - Go to [Railway.app](https://railway.app)
   - Sign up with your GitHub account (free)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `telegram-crypto-bot` repository

3. **Add Environment Variables**
   - In Railway dashboard, go to your project
   - Click "Variables" tab
   - Add: `TELEGRAM_BOT_TOKEN` = `8014754930:AAG3FxXaw4AAiJfP5dPmoV5HoqZirR6Qvwc`

4. **Deploy**
   - Railway will automatically build and deploy your bot
   - Check the "Deployments" tab for progress
   - Look for "Build successful" and "Deploy successful"

## Step 3: Verify It's Working

1. **Check Logs**
   - In Railway dashboard, click "View Logs"
   - Look for: `🚀 Starting Telegram Crypto Bot...`
   - Should see: `✅ Bot connected: @your_bot_username`
   - Should see: `📢 Auto-posting to @legitairdropsfb...`

2. **Test Your Channel**
   - Check @legitairdropsfb for new posts every 2 minutes
   - Posts should continue even when your computer is off

## ✅ Success!

Your bot is now running 24/7 in the cloud! It will:
- ✅ Post to @legitairdropsfb every 2 minutes
- ✅ Work even when you're offline
- ✅ Automatically restart if it crashes
- ✅ Handle multiple users simultaneously

## 📊 Railway Free Tier Limits

- **500 execution hours per month** (about 16 hours per day)
- **1GB RAM**
- **1GB disk space**
- Perfect for a Telegram bot!

## 🆘 Troubleshooting

**Bot not posting to channel?**
- Make sure bot is admin in @legitairdropsfb
- Check Railway logs for error messages

**Deployment failed?**
- Check that all files are in GitHub repo
- Verify TELEGRAM_BOT_TOKEN is set correctly

**Need help?**
- Check Railway logs first
- Verify bot permissions in Telegram channel

---

## Alternative: Render.com

If Railway doesn't work, try [Render.com](https://render.com):
1. Connect GitHub repo
2. Choose "Web Service"
3. Set start command: `npm start`
4. Add environment variable: `TELEGRAM_BOT_TOKEN`