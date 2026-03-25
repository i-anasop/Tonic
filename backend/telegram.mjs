import TelegramBot from "node-telegram-bot-api";

const APP_URL = "https://tonic-ai.replit.app";

let bot = null;

export function initTelegramBot({ db, openai, domain }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log("[Telegram] TELEGRAM_BOT_TOKEN not set — bot disabled");
    return null;
  }

  bot = new TelegramBot(token, { polling: true });
  console.log("[Telegram] Mini App bot started — app URL:", APP_URL);

  const openAppButton = {
    inline_keyboard: [[
      { text: "🚀 Open Tonic AI", web_app: { url: APP_URL } }
    ]]
  };

  // Set persistent menu button (bottom-left in chat) pointing to the Mini App
  bot.setChatMenuButton({
    menu_button: {
      type: "web_app",
      text: "Open App",
      web_app: { url: APP_URL }
    }
  }).catch(() => {
    // Fallback: set as default for all chats
    bot.setMyDefaultAdministratorRights().catch(() => {});
  });

  // Set clean command list
  bot.setMyCommands([
    { command: "start", description: "Open Tonic AI" }
  ]).catch(() => {});

  // /start — launch the Mini App
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from?.first_name || "there";

    await bot.sendMessage(
      chatId,
      `Hey ${name}! 👋\n\nTap below to open *Tonic AI* — your GPT-4o productivity agent on the TON blockchain.\n\n✅ Create tasks with AI\n💰 Earn real *$TONIC* rewards on-chain\n🏆 Unlock achievements & rank up`,
      {
        parse_mode: "Markdown",
        reply_markup: openAppButton
      }
    );
  });

  // Any other message — show the open button
  bot.on("message", async (msg) => {
    if (!msg.text || msg.text.startsWith("/")) return;
    const chatId = msg.chat.id;

    await bot.sendMessage(
      chatId,
      "Tap below to open the full Tonic AI app 👇",
      {
        parse_mode: "Markdown",
        reply_markup: openAppButton
      }
    );
  });

  bot.on("polling_error", (err) => {
    console.error("[Telegram] Polling error:", err.message);
  });

  return bot;
}

export default initTelegramBot;
