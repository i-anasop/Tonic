import TelegramBot from "node-telegram-bot-api";

let bot = null;

export function initTelegramBot({ db, openai, domain }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log("[Telegram] TELEGRAM_BOT_TOKEN not set — bot disabled");
    return null;
  }

  bot = new TelegramBot(token, { polling: true });

  console.log("[Telegram] Bot started in polling mode");

  const ensureUser = async (chatId, from) => {
    const userId = `tg_${chatId}`;
    try {
      await db.query(
        `INSERT INTO users (id, name, is_guest) VALUES ($1, $2, true)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
        [userId, from?.first_name || "Telegram User"]
      );
    } catch {}
    return userId;
  };

  const fetchPendingTasks = async (userId) => {
    const res = await db.query(
      "SELECT * FROM tasks WHERE user_id = $1 AND status != 'completed' ORDER BY due_date ASC LIMIT 10",
      [userId]
    );
    return res.rows;
  };

  const awardTonic = async (userId, amount) => {
    try {
      await db.query(
        "UPDATE users SET tonic_tokens = tonic_tokens + $1 WHERE id = $2",
        [amount, userId]
      );
      const res = await db.query("SELECT tonic_tokens FROM users WHERE id = $1", [userId]);
      return res.rows[0]?.tonic_tokens ?? amount;
    } catch { return null; }
  };

  // /start — welcome
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await ensureUser(chatId, msg.from);
    const appUrl = domain ? `https://${domain}` : "https://tonic-ai.app";
    await bot.sendMessage(
      chatId,
      `*Welcome to Tonic AI!* 🚀\n\nI'm your AI productivity agent powered by *GPT-4o* and the *TON blockchain*.\n\n*Commands:*\n/tasks — All pending tasks\n/today — Tasks due today\n/add <task> — Add a task (AI-parsed)\n/done <number> — Complete a task (+$TONIC)\n/stats — Your productivity stats\n/ai <message> — Chat with me naturally\n\n💡 You can also just type naturally — I understand plain English!\n\n[Open Tonic AI App](${appUrl})`,
      { parse_mode: "Markdown", disable_web_page_preview: true }
    );
  });

  // /tasks — all pending tasks
  bot.onText(/\/tasks/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = await ensureUser(chatId, msg.from);
    const tasks  = await fetchPendingTasks(userId);

    if (tasks.length === 0) {
      await bot.sendMessage(chatId, "✅ No pending tasks! Add one with `/add <task>`", { parse_mode: "Markdown" });
      return;
    }

    let text = "*Pending Tasks:*\n\n";
    tasks.forEach((t, i) => {
      const pri = t.priority === "high" ? "🔴" : t.priority === "medium" ? "🟡" : "🟢";
      const due = new Date(t.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      text += `${i + 1}. ${pri} *${t.title}*\n   📅 ${due} · ${t.category}\n\n`;
    });
    text += `_Use /done <number> to complete a task_`;

    await bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
  });

  // /today — tasks due today or overdue
  bot.onText(/\/today/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = await ensureUser(chatId, msg.from);

    const res = await db.query(
      `SELECT * FROM tasks
       WHERE user_id = $1
         AND status != 'completed'
         AND due_date <= NOW()::date
       ORDER BY due_date ASC
       LIMIT 10`,
      [userId]
    );
    const tasks = res.rows;

    if (tasks.length === 0) {
      await bot.sendMessage(chatId, "✅ Nothing due today! Check /tasks for the full list.", { parse_mode: "Markdown" });
      return;
    }

    const today = new Date().toDateString();
    let text = `*Today's Focus (${new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}):*\n\n`;
    tasks.forEach((t, i) => {
      const pri = t.priority === "high" ? "🔴" : t.priority === "medium" ? "🟡" : "🟢";
      const dueDate = new Date(t.due_date);
      const isOverdue = dueDate.toDateString() !== today && dueDate < new Date();
      const label = isOverdue ? "⚠️ overdue" : "📅 today";
      text += `${i + 1}. ${pri} *${t.title}*\n   ${label} · ${t.category}\n\n`;
    });
    text += `_Use /done <number> to complete a task_`;

    await bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
  });

  // /add <task> — AI-parsed task creation
  bot.onText(/\/add (.+)/, async (msg, match) => {
    const chatId  = msg.chat.id;
    const userId  = await ensureUser(chatId, msg.from);
    const taskText = match[1];

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Extract task details from the user's text and return JSON: { title, category (work/personal/health/learning), priority (high/medium/low), dueDate (ISO string, default to today+1 if not specified) }. Current date: ${new Date().toISOString()}`
          },
          { role: "user", content: taskText }
        ],
        response_format: { type: "json_object" }
      });

      const parsed  = JSON.parse(completion.choices[0].message.content);
      const taskId  = `tg_${chatId}_${Date.now()}`;
      const dueDate = parsed.dueDate || new Date(Date.now() + 86400000).toISOString();

      await db.query(
        `INSERT INTO tasks (id, user_id, title, category, priority, status, due_date, created_at)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6, NOW())`,
        [taskId, userId, parsed.title || taskText, parsed.category || "work", parsed.priority || "medium", dueDate]
      );

      await bot.sendMessage(
        chatId,
        `✅ *Task added!*\n\n*${parsed.title || taskText}*\n📅 Due: ${new Date(dueDate).toLocaleDateString()}\n⚡ Priority: ${parsed.priority || "medium"}\n🏷️ ${parsed.category || "work"}`,
        { parse_mode: "Markdown" }
      );
    } catch {
      await bot.sendMessage(chatId, "❌ Could not add task. Try again!");
    }
  });

  // /done <number> — complete task and award TONIC
  bot.onText(/\/done (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = await ensureUser(chatId, msg.from);
    const idx    = parseInt(match[1]) - 1;
    const tasks  = await fetchPendingTasks(userId);

    if (idx < 0 || idx >= tasks.length) {
      await bot.sendMessage(chatId, "❌ Invalid task number. Use `/tasks` to see your list.", { parse_mode: "Markdown" });
      return;
    }

    const task = tasks[idx];
    await db.query(
      "UPDATE tasks SET status = 'completed', completed_at = NOW() WHERE id = $1",
      [task.id]
    );

    const TONIC_REWARD = 15;
    const newBalance   = await awardTonic(userId, TONIC_REWARD);
    const balText      = newBalance !== null ? `\n💰 *+${TONIC_REWARD} $TONIC* earned! (Balance: ${newBalance})` : "";

    await bot.sendMessage(
      chatId,
      `🎉 *Completed:* ${task.title}\n${balText}\n\nKeep the momentum going! 🔥`,
      { parse_mode: "Markdown" }
    );
  });

  // /stats — productivity stats
  bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = await ensureUser(chatId, msg.from);

    const [taskRes, userRes] = await Promise.all([
      db.query(
        `SELECT
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status != 'completed') as pending
         FROM tasks WHERE user_id = $1`,
        [userId]
      ),
      db.query("SELECT tonic_tokens FROM users WHERE id = $1", [userId]),
    ]);

    const s    = taskRes.rows[0];
    const rate = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
    const tonic = userRes.rows[0]?.tonic_tokens ?? 0;

    await bot.sendMessage(
      chatId,
      `📊 *Your Stats*\n\n✅ Completed: ${s.completed}\n⏳ Pending: ${s.pending}\n📈 Completion Rate: ${rate}%\n💰 $TONIC Balance: ${tonic}\n\nOpen the Tonic AI app for the full leaderboard & achievements!`,
      { parse_mode: "Markdown" }
    );
  });

  // /ai <message> — explicit AI chat command
  bot.onText(/\/ai (.+)/, async (msg, match) => {
    await handleAIMessage(msg, match[1], db, openai);
  });

  // Natural language fallback — any non-command message
  bot.on("message", async (msg) => {
    if (msg.text && !msg.text.startsWith("/")) {
      await handleAIMessage(msg, msg.text, db, openai);
    }
  });

  return bot;
}

async function handleAIMessage(msg, text, db, openai) {
  const chatId = msg.chat.id;
  const userId = `tg_${chatId}`;

  try {
    await db.query(
      `INSERT INTO users (id, name, is_guest) VALUES ($1, $2, true) ON CONFLICT (id) DO NOTHING`,
      [userId, msg.from?.first_name || "Telegram User"]
    );

    const [tasksRes, userRes] = await Promise.all([
      db.query("SELECT * FROM tasks WHERE user_id = $1 ORDER BY due_date ASC LIMIT 10", [userId]),
      db.query("SELECT tonic_tokens FROM users WHERE id = $1", [userId]),
    ]);

    const tonic  = userRes.rows[0]?.tonic_tokens ?? 0;
    const thinking = await bot.sendMessage(chatId, "🤔 Thinking...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are Tonic, an AI productivity bot in Telegram. Be VERY concise — max 2-3 short sentences or bullets. No filler. Tasks: ${JSON.stringify(tasksRes.rows.map(t => ({ title: t.title, priority: t.priority, status: t.status })))}. $TONIC balance: ${tonic}. Date: ${new Date().toDateString()}. Use Telegram markdown. For adding tasks mention: /add <task>.`
        },
        { role: "user", content: text }
      ]
    });

    const reply = completion.choices[0].message.content;
    await bot.editMessageText(reply, {
      chat_id: chatId, message_id: thinking.message_id, parse_mode: "Markdown",
    });
  } catch (err) {
    console.error("[Telegram] AI error:", err.message);
    if (bot) await bot.sendMessage(chatId, "❌ AI is unavailable right now. Try again in a moment!");
  }
}

export default initTelegramBot;
