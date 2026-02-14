const { Telegraf } = require("telegraf");
const User = require("./models/user");
const AdminSetting = require("./models/adminSettings");
require('dotenv').config();
const bot = new Telegraf(process.env.Bot_Token);
const bip39 = require("./helper/bip39");
const imagePath = "./stringarc.png";
const ReferralHistory = require("./models/Referralhistory");
const Bottleneck = require('bottleneck');

const limiter = new Bottleneck({
  maxConcurrent: 30, // Allow up to 30 concurrent requests
  minTime: 1000 / 30, // Enforce a minimum time between requests to match the 30 requests per second limit
});



const sendMessage = async (ctx, photoUrl, caption, options, retryCount = 0) => {
  try {
    await limiter.schedule(() => ctx.replyWithPhoto({ source: photoUrl }, { caption, ...options }));

  } catch (error) {
    console.error('Error sending photo:', error);
    if (error || error.response && error.response.body) {
      if (error.response.description === 'Too Many Requests: retry after 60' || error.response.description === "Gateway Time-out" || error.name === 'FetchError') {
        const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`Retrying in ${retryDelay / 1000} seconds...`);

        await new Promise((resolve) => setTimeout(resolve, retryDelay));

        if (retryCount < 5) { // Limit retries to prevent infinite loops
          await sendMessage(ctx, photoUrl, caption, options, retryCount + 1);
        } else {
          console.error('Max retry attempts reached.');
        }
      }
    }
  }
};

bot.start(async (ctx) => {
  try {

    const responseMessage = `<b>🕹Join String Arcade Modern and Start Earning String Tokens 🕹\n\nFirst Modern Arcade Games on Telegram with Instant Withdraw to TON (DEX Wallet)\n\nHow to Earn Tokens:\n\n Play Games💎\n Complete Daily Tasks 📝\nInvite Friends 👥\nUse Boosters to earn Double USDT ⚡️\n(1 Invite = $0.03 USDT)\n\n700000 Tickets = $1 USDT 💸\n\nJoin now and Start winning FREE USDT (TON Network)\n\nGames on String Arcade Modern 🕹:\nFlappybird 🐥 Stack 🧱 and Doodle Jump 🦖</b>`;

    const options = {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Community 🚨', url: 'https://t.me/stringarc8' }, { text: 'Chat 🗨️', url: 'https://t.me/stringarc8chat' }],
          [{ text: 'Twitter 𝕏', url: 'https://x.com/StringArc8' }, { text: 'About 📝', callback_data: 'about' }],
          [{ text: 'Play 🕹️', web_app: { url: 'https://tele-modfront.stringarc8.io' } }]
        ]
      }
    };

    const photoUrl = './stringarc.png';  // Local file path

    await sendMessage(ctx, photoUrl, responseMessage, options); // Use sendMessage with retry logic and rate limiting



    const profilePhotos = await ctx.telegram.getUserProfilePhotos(ctx.from.id);
    if (profilePhotos.total_count > 0) {
      // Get the file ID of the first profile photo
      const fileId = profilePhotos.photos[0][0].file_id;

      // Get the file URL using the file ID
      const file = await ctx.telegram.getFileLink(fileId);
      const userProfilePicUrl = file.href;


      if (userProfilePicUrl) {
        const profilepic = await User.findOneAndUpdate({ chatId: ctx.from.id }, { profilePic: userProfilePicUrl })

      }

    }

  } catch (error) {
    if (error.response && error.response.error_code === 403) {
      console.log(`User blocked the bot: ${ctx.from.id}`);
      // Handle the user blocking the bot
    } else {
      console.error('Error catch block:');
    }
  }
});

bot.launch();

bot.on('text', async (ctx) => {
  try {
    const responseMessage = `<b>Welcome to Stringarc8 Modern! 🎮\nClick 'Play' to start earning rewards!</b>`;
    const options = {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Play 🕹️', web_app: { url: 'https://tele-modfront.stringarc8.io' } }]
        ]
      }
    };
    await ctx.reply(responseMessage, options);
  } catch (error) {
    console.error("Error in default message handler:", error);
  }
});
bot.on('callback_query', async (ctx) => {
  try {
    const data = ctx.callbackQuery.data;



    if (data === 'about') {
      const responseMessage = `<b>🎮About String Arcade🎮\n
String Modern is a Telegram-based platform where users can earn Tokens by playing three mini-games: \nFlappybird 🐥 \nStack 🧱 \nDoodle Jump 🦖\n
Play Games, Complete Tasks and Invite friends to earn tokens 🎉
 String Modern is the only platform to offer instant withdraw into TON 💸\n🪙 100,000 Tickets = $1 USDT 💸\n👥 1 Invite = $0.03 USDT\n
Join now and Start Earning TON with Instant Withdrawal.</b>`;

      const options = {
        parse_mode: 'HTML'
      }
      await ctx.reply(responseMessage, options);

    }
  } catch (error) {
    if (error.response && error.response.error_code === 403) {
      console.log(`User blocked the bot: ${ctx.from.id}`);
    }
    console.error('Error handling callback query:');

  }
});






