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

  // Persistent bottom button — opens Mini App
  bot.setChatMenuButton({
    menu_button: {
      type: "web_app",
      text: "Launch App",
      web_app: { url: APP_URL }
    }
  }).then(() => console.log("[Telegram] Menu button set"))
    .catch((e) => console.warn("[Telegram] Menu button warning:", e.message));

  // Only register /start
  bot.setMyCommands([
    { command: "start", description: "Start Tonic AI" }
  ]).catch(() => {});

  // /start handler
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from?.first_name || "there";

    await bot.sendMessage(
      chatId,
      `Hey ${name}! 👋\n\nTap below to open *Tonic AI* — manage tasks with GPT-4o and earn real *$TONIC* rewards on the TON blockchain.`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[
            { text: "🚀 Launch Tonic AI", web_app: { url: APP_URL } }
          ]]
        }
      }
    );
  });

  bot.on("polling_error", (err) => {
    console.error("[Telegram] Polling error:", err.message);
  });

  return bot;
}

export default initTelegramBot;
