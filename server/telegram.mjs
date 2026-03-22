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
         ON CONFLICT (id) DO UPDATE SET name = $2`,
        [userId, from?.first_name || "Telegram User"]
      );
    } catch {}
    return userId;
  };

  const fetchTasks = async (userId) => {
    const res = await db.query(
      "SELECT * FROM tasks WHERE user_id = $1 AND status != 'completed' ORDER BY due_date ASC LIMIT 10",
      [userId]
    );
    return res.rows;
  };

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(
      chatId,
      `*Welcome to Tonic AI!* 🚀\n\nI'm your AI productivity agent powered by GPT-5.2 and the TON blockchain.\n\n*Commands:*\n/tasks — View your pending tasks\n/add <task> — Add a new task\n/done <task number> — Complete a task\n/stats — Your productivity stats\n/ai <message> — Chat with me naturally\n\nYou can also just send me a message and I'll understand! Try: *"add a high priority task to submit project by Friday"*`,
      { parse_mode: "Markdown" }
    );
  });

  bot.onText(/\/tasks/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = await ensureUser(chatId, msg.from);
    const tasks = await fetchTasks(userId);

    if (tasks.length === 0) {
      await bot.sendMessage(chatId, "✅ You have no pending tasks! Add one with /add <task>");
      return;
    }

    let text = "*Your Pending Tasks:*\n\n";
    tasks.forEach((t, i) => {
      const priority = t.priority === "high" ? "🔴" : t.priority === "medium" ? "🟡" : "🟢";
      const due = new Date(t.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      text += `${i + 1}. ${priority} *${t.title}*\n   📅 ${due} · ${t.category}\n\n`;
    });

    await bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
  });

  bot.onText(/\/add (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = await ensureUser(chatId, msg.from);
    const taskText = match[1];

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `Extract task details from the user's text and return JSON: { title, category (work/personal/health/learning), priority (high/medium/low), dueDate (ISO string, default to today+1 if not specified) }. Current date: ${new Date().toISOString()}`
          },
          { role: "user", content: taskText }
        ],
        response_format: { type: "json_object" }
      });

      const parsed = JSON.parse(completion.choices[0].message.content);
      const taskId = `tg_${chatId}_${Date.now()}`;
      const dueDate = parsed.dueDate || new Date(Date.now() + 86400000).toISOString();

      await db.query(
        `INSERT INTO tasks (id, user_id, title, category, priority, status, due_date, created_at)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6, NOW())`,
        [taskId, userId, parsed.title || taskText, parsed.category || "work", parsed.priority || "medium", dueDate]
      );

      await bot.sendMessage(
        chatId,
        `✅ Task added!\n\n*${parsed.title || taskText}*\n📅 Due: ${new Date(dueDate).toLocaleDateString()}\n⚡ Priority: ${parsed.priority || "medium"}\n🏷️ ${parsed.category || "work"}`,
        { parse_mode: "Markdown" }
      );
    } catch (err) {
      await bot.sendMessage(chatId, "❌ Could not add task. Try again!");
    }
  });

  bot.onText(/\/done (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = await ensureUser(chatId, msg.from);
    const idx = parseInt(match[1]) - 1;
    const tasks = await fetchTasks(userId);

    if (idx < 0 || idx >= tasks.length) {
      await bot.sendMessage(chatId, "❌ Invalid task number. Use /tasks to see your list.");
      return;
    }

    const task = tasks[idx];
    await db.query(
      "UPDATE tasks SET status = 'completed', completed_at = NOW() WHERE id = $1",
      [task.id]
    );

    await bot.sendMessage(chatId, `🎉 Completed: *${task.title}*\n\nKeep the momentum going!`, { parse_mode: "Markdown" });
  });

  bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = await ensureUser(chatId, msg.from);

    const res = await db.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status != 'completed') as pending
       FROM tasks WHERE user_id = $1`,
      [userId]
    );

    const s = res.rows[0];
    const rate = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;

    await bot.sendMessage(
      chatId,
      `📊 *Your Stats*\n\n✅ Completed: ${s.completed}\n⏳ Pending: ${s.pending}\n📈 Completion Rate: ${rate}%\n\nKeep going! Open Tonic AI to see more insights.`,
      { parse_mode: "Markdown" }
    );
  });

  bot.onText(/\/ai (.+)/, async (msg, match) => {
    await handleAIMessage(msg, match[1], db, openai);
  });

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

    const tasksRes = await db.query(
      "SELECT * FROM tasks WHERE user_id = $1 ORDER BY due_date ASC LIMIT 10",
      [userId]
    );

    const thinking = await bot.sendMessage(chatId, "🤔 Thinking...");

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        {
          role: "system",
          content: `You are Tonic, an AI productivity agent in Telegram. The user's tasks: ${JSON.stringify(tasksRes.rows.map(t => ({ title: t.title, priority: t.priority, status: t.status })))}. Be concise, helpful, and friendly. Use Telegram markdown. If the user wants to add a task, remind them to use /add <task>. Current date: ${new Date().toISOString()}`
        },
        { role: "user", content: text }
      ]
    });

    const reply = completion.choices[0].message.content;

    await bot.editMessageText(reply, { chat_id: chatId, message_id: thinking.message_id, parse_mode: "Markdown" });
  } catch (err) {
    console.error("[Telegram] AI error:", err.message);
    if (bot) await bot.sendMessage(chatId, "❌ AI is unavailable right now. Try again in a moment!");
  }
}

export default initTelegramBot;
