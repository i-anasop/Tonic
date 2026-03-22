import express from "express";
import cors from "cors";
import pg from "pg";
import OpenAI from "openai";
import { fileURLToPath } from "url";
import path from "path";
import { existsSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIST = path.join(__dirname, "../frontend/dist");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "placeholder",
});

async function initDB() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      wallet_address TEXT,
      is_guest BOOLEAN DEFAULT TRUE,
      ton_proof TEXT,
      verified_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'work',
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'pending',
      due_date TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMP,
      ai_suggested BOOLEAN DEFAULT FALSE,
      stake_amount NUMERIC,
      stake_tx_hash TEXT
    );

    CREATE TABLE IF NOT EXISTS on_chain_records (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      record_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      ton_tx_hash TEXT,
      recorded_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS agent_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      messages JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log("Database initialized");
}

app.get("/tonconnect-manifest.json", (req, res) => {
  const domain = process.env.REPLIT_DEV_DOMAIN || "localhost";
  res.json({
    url: `https://${domain}`,
    name: "Tonic AI",
    iconUrl: `https://${domain}/icon.png`,
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "Tonic AI Server", version: "2.0.0", features: ["ai-agent", "ton-blockchain", "telegram-bot"] });
});

app.post("/api/insights", async (req, res) => {
  try {
    const { tasks = [], stats = {} } = req.body;
    const completed = tasks.filter((t) => t.status === "completed");
    const pending = tasks.filter((t) => t.status !== "completed");
    const highPriority = pending.filter((t) => t.priority === "high");

    const taskSummary = {
      total: tasks.length,
      completed: completed.length,
      pending: pending.length,
      highPriority: highPriority.length,
      streak: stats.currentStreak || 0,
      productivityScore: stats.productivityScore || 0,
      categories: {
        work: tasks.filter((t) => t.category === "work").length,
        personal: tasks.filter((t) => t.category === "personal").length,
        health: tasks.filter((t) => t.category === "health").length,
        learning: tasks.filter((t) => t.category === "learning").length,
      },
    };

    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        {
          role: "system",
          content: `You are a productivity coach AI for Tonic AI, a TON blockchain-integrated task management app. Generate 3-5 concise, personalized, actionable insights based on the user's real task data. Be specific with numbers, encouraging but honest. Return ONLY valid JSON with an "insights" array. Each insight must have: id (unique string), type ("focus"|"warning"|"suggestion"|"pattern"|"achievement"), title (max 6 words), description (max 35 words, specific and actionable), icon ("target"|"alert"|"balance"|"trending"|"clock"|"brain"), priority ("high"|"medium"|"low").`,
        },
        {
          role: "user",
          content: `Task data: ${JSON.stringify(taskSummary)}. Current time: ${timeOfDay} (hour ${hour}). Generate personalized productivity insights based on this real data.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    let insights = [];
    try {
      const content = completion.choices[0].message.content;
      const parsed = JSON.parse(content);
      insights = Array.isArray(parsed) ? parsed : Array.isArray(parsed.insights) ? parsed.insights : [];
    } catch {}

    res.json({ insights });
  } catch (error) {
    console.error("AI insights error:", error.message);
    res.status(500).json({ error: "Failed to generate insights", insights: [] });
  }
});

app.post("/api/agent", async (req, res) => {
  try {
    const { messages = [], tasks = [], stats = {}, userId } = req.body;

    const pendingTasks = tasks.filter((t) => t.status !== "completed");
    const systemPrompt = `You are Tonic, an AI productivity agent for Tonic AI — a TON blockchain-integrated task management app. Help users manage tasks through natural conversation.

User's current pending tasks (${pendingTasks.length} total):
${pendingTasks.slice(0, 15).map((t, i) => `${i + 1}. [${t.id}] "${t.title}" | ${t.priority} priority | ${t.category} | due: ${new Date(t.dueDate || t.due_date).toLocaleDateString()}`).join("\n")}

User stats: ${stats.tasksCompleted || 0} tasks completed, ${stats.currentStreak || 0}-day streak, ${stats.productivityScore || 0} productivity score.
Current date/time: ${new Date().toLocaleString()}

You can create tasks, complete them, schedule the user's day, or give advice. Be concise and action-oriented.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "create_task",
          description: "Create a new task based on the user's request. Use this when they say 'add', 'create', 'remind me', etc.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Clear, concise task title" },
              category: { type: "string", enum: ["work", "personal", "health", "learning"], description: "Task category" },
              priority: { type: "string", enum: ["high", "medium", "low"], description: "Task priority level" },
              dueDate: { type: "string", description: "ISO date string for due date (e.g. 2026-03-25T09:00:00.000Z). Default to tomorrow if not specified." },
              description: { type: "string", description: "Optional extra details" },
            },
            required: ["title", "category", "priority", "dueDate"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "complete_task",
          description: "Mark a pending task as completed. Match the task by title from the user's task list.",
          parameters: {
            type: "object",
            properties: {
              taskId: { type: "string", description: "The exact task ID from the pending tasks list" },
              taskTitle: { type: "string", description: "The task title for confirmation" },
            },
            required: ["taskId", "taskTitle"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_productivity_summary",
          description: "Get a detailed productivity analysis with personalized advice",
          parameters: { type: "object", properties: {} },
        },
      },
      {
        type: "function",
        function: {
          name: "plan_my_day",
          description: "Create an optimized schedule for today based on pending tasks",
          parameters: {
            type: "object",
            properties: {
              focus: { type: "string", enum: ["work", "personal", "health", "learning", "balanced"], description: "Today's focus area" },
            },
            required: ["focus"],
          },
        },
      },
    ];

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-20),
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: allMessages,
      tools,
      tool_choice: "auto",
    });

    const choice = completion.choices[0];
    const aiMessage = choice.message;
    let action = null;
    let finalMessage = aiMessage.content || "";

    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      const toolCall = aiMessage.tool_calls[0];
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);

      if (toolName === "create_task") {
        const newTaskId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const dueDate = toolArgs.dueDate || new Date(Date.now() + 86400000).toISOString();

        action = {
          type: "create_task",
          data: {
            id: newTaskId,
            title: toolArgs.title,
            category: toolArgs.category || "work",
            priority: toolArgs.priority || "medium",
            dueDate,
            description: toolArgs.description || null,
            status: "pending",
            createdAt: new Date().toISOString(),
            aiSuggested: true,
          },
        };

        if (userId) {
          try {
            await db.query(
              `INSERT INTO tasks (id, user_id, title, description, category, priority, status, due_date, created_at, ai_suggested)
               VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, NOW(), true) ON CONFLICT (id) DO NOTHING`,
              [newTaskId, userId, toolArgs.title, toolArgs.description || null, toolArgs.category || "work", toolArgs.priority || "medium", dueDate]
            );
          } catch (dbErr) {
            console.warn("DB save failed:", dbErr.message);
          }
        }

        const confirmRes = await openai.chat.completions.create({
          model: "gpt-5.2",
          messages: [
            ...allMessages,
            aiMessage,
            { role: "tool", content: JSON.stringify({ success: true, taskId: newTaskId, title: toolArgs.title }), tool_call_id: toolCall.id },
          ],
        });
        finalMessage = confirmRes.choices[0].message.content || `Task "${toolArgs.title}" created!`;

      } else if (toolName === "complete_task") {
        action = {
          type: "complete_task",
          data: { taskId: toolArgs.taskId, taskTitle: toolArgs.taskTitle },
        };

        if (userId) {
          try {
            await db.query(
              "UPDATE tasks SET status = 'completed', completed_at = NOW() WHERE id = $1 AND user_id = $2",
              [toolArgs.taskId, userId]
            );
          } catch (dbErr) {
            console.warn("DB update failed:", dbErr.message);
          }
        }

        const confirmRes = await openai.chat.completions.create({
          model: "gpt-5.2",
          messages: [
            ...allMessages,
            aiMessage,
            { role: "tool", content: JSON.stringify({ success: true, taskTitle: toolArgs.taskTitle }), tool_call_id: toolCall.id },
          ],
        });
        finalMessage = confirmRes.choices[0].message.content || `"${toolArgs.taskTitle}" marked as complete!`;

      } else if (toolName === "get_productivity_summary") {
        const confirmRes = await openai.chat.completions.create({
          model: "gpt-5.2",
          messages: [
            ...allMessages,
            aiMessage,
            { role: "tool", content: JSON.stringify({ stats, taskCount: tasks.length, pending: pendingTasks.length }), tool_call_id: toolCall.id },
          ],
        });
        finalMessage = confirmRes.choices[0].message.content || "Here's your productivity summary!";
        action = { type: "show_stats", data: stats };

      } else if (toolName === "plan_my_day") {
        const todayPending = pendingTasks.filter((t) => {
          const due = new Date(t.dueDate || t.due_date);
          const today = new Date();
          return due.toDateString() === today.toDateString() || due < today;
        });

        const confirmRes = await openai.chat.completions.create({
          model: "gpt-5.2",
          messages: [
            ...allMessages,
            aiMessage,
            {
              role: "tool",
              content: JSON.stringify({ todayTasks: todayPending, allPending: pendingTasks.slice(0, 10), focus: toolArgs.focus }),
              tool_call_id: toolCall.id,
            },
          ],
        });
        finalMessage = confirmRes.choices[0].message.content || "Here's your optimized plan for today!";
        action = { type: "schedule", data: { focus: toolArgs.focus } };
      }
    }

    res.json({ message: finalMessage, action });
  } catch (error) {
    console.error("AI Agent error:", error.message);
    res.status(500).json({ error: "Agent error", message: "I'm having trouble right now. Please try again in a moment!" });
  }
});

app.post("/api/ton-proof", async (req, res) => {
  try {
    const { userId, walletAddress, proof, score } = req.body;
    if (!userId || !walletAddress) {
      return res.status(400).json({ error: "userId and walletAddress required" });
    }

    await db.query(
      `UPDATE users SET wallet_address = $2, ton_proof = $3, verified_at = NOW(), is_guest = false, updated_at = NOW()
       WHERE id = $1`,
      [userId, walletAddress, JSON.stringify(proof) || null]
    );

    const record = await db.query(
      `INSERT INTO on_chain_records (id, user_id, record_type, title, description)
       VALUES ($1, $2, 'ton_proof', 'Wallet Verified', $3) RETURNING *`,
      [`proof_${userId}_${Date.now()}`, userId, `Score: ${score || 0} | Wallet: ${walletAddress.slice(0, 12)}...`]
    );

    res.json({ verified: true, record: record.rows[0] });
  } catch (error) {
    console.error("TON proof error:", error.message);
    res.status(500).json({ error: "Failed to store proof" });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { id, name, walletAddress, isGuest } = req.body;
    if (!id || !name) return res.status(400).json({ error: "id and name are required" });

    const result = await db.query(
      `INSERT INTO users (id, name, wallet_address, is_guest)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE
       SET name = $2, wallet_address = COALESCE($3, users.wallet_address), is_guest = $4, updated_at = NOW()
       RETURNING *`,
      [id, name, walletAddress || null, isGuest ?? true]
    );

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("User upsert error:", error.message);
    res.status(500).json({ error: "Failed to save user" });
  }
});

app.get("/api/users/:userId/tasks", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await db.query(
      "SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json({ tasks: result.rows });
  } catch (error) {
    console.error("Fetch tasks error:", error.message);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const { id, userId, title, description, category, priority, status, dueDate, createdAt, completedAt, aiSuggested, stakeAmount, stakeTxHash } = req.body;
    if (!id || !userId || !title) return res.status(400).json({ error: "id, userId, and title are required" });

    const result = await db.query(
      `INSERT INTO tasks (id, user_id, title, description, category, priority, status, due_date, created_at, completed_at, ai_suggested, stake_amount, stake_tx_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE
       SET title = $3, description = $4, category = $5, priority = $6,
           status = $7, due_date = $8, completed_at = $10, stake_tx_hash = $13
       RETURNING *`,
      [id, userId, title, description || null, category || "work", priority || "medium",
       status || "pending", dueDate, createdAt || new Date(), completedAt || null,
       aiSuggested || false, stakeAmount || null, stakeTxHash || null]
    );

    res.json({ task: result.rows[0] });
  } catch (error) {
    console.error("Task upsert error:", error.message);
    res.status(500).json({ error: "Failed to save task" });
  }
});

app.delete("/api/tasks/:taskId", async (req, res) => {
  try {
    await db.query("DELETE FROM tasks WHERE id = $1", [req.params.taskId]);
    res.json({ success: true });
  } catch (error) {
    console.error("Task delete error:", error.message);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

app.post("/api/tasks/sync", async (req, res) => {
  try {
    const { userId, tasks } = req.body;
    if (!userId || !Array.isArray(tasks)) return res.status(400).json({ error: "userId and tasks array required" });

    for (const task of tasks) {
      await db.query(
        `INSERT INTO tasks (id, user_id, title, description, category, priority, status, due_date, created_at, completed_at, ai_suggested, stake_amount, stake_tx_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE
         SET title = $3, description = $4, category = $5, priority = $6,
             status = $7, due_date = $8, completed_at = $10, stake_tx_hash = $13`,
        [task.id, userId, task.title, task.description || null, task.category,
         task.priority, task.status, task.dueDate, task.createdAt, task.completedAt || null,
         task.aiSuggested || false, task.stakeAmount || null, task.stakeTxHash || null]
      );
    }

    res.json({ synced: tasks.length });
  } catch (error) {
    console.error("Bulk sync error:", error.message);
    res.status(500).json({ error: "Failed to sync tasks" });
  }
});

app.post("/api/records", async (req, res) => {
  try {
    const { id, userId, recordType, title, description, tonTxHash } = req.body;
    const result = await db.query(
      `INSERT INTO on_chain_records (id, user_id, record_type, title, description, ton_tx_hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET ton_tx_hash = $6
       RETURNING *`,
      [id, userId, recordType, title, description || null, tonTxHash || null]
    );
    res.json({ record: result.rows[0] });
  } catch (error) {
    console.error("Record error:", error.message);
    res.status(500).json({ error: "Failed to save record" });
  }
});

app.post("/api/claim-points", async (req, res) => {
  try {
    const { userId, walletAddress, points, level, levelName, tonTxHash } = req.body;
    if (!userId || !points) return res.status(400).json({ error: "userId and points required" });

    const claimId = `claim_${userId}_${Date.now()}`;
    const result = await db.query(
      `INSERT INTO on_chain_records (id, user_id, record_type, title, description, ton_tx_hash)
       VALUES ($1, $2, 'points_claim', $3, $4, $5)
       RETURNING *`,
      [
        claimId,
        userId,
        `Points Claim: ${points} pts`,
        `Tonic AI | Level ${level} ${levelName} | ${points} achievement points claimed on TON | Wallet: ${walletAddress || "unknown"}`,
        tonTxHash || null,
      ]
    );
    res.json({ success: true, record: result.rows[0], claimId });
  } catch (error) {
    console.error("Claim points error:", error.message);
    res.status(500).json({ error: "Failed to save claim" });
  }
});

app.get("/api/users/:userId/records", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM on_chain_records WHERE user_id = $1 ORDER BY recorded_at DESC",
      [req.params.userId]
    );
    res.json({ records: result.rows });
  } catch (error) {
    console.error("Fetch records error:", error.message);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

if (existsSync(WEB_DIST)) {
  app.use(express.static(WEB_DIST));
  app.get("/{*splat}", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path === "/tonconnect-manifest.json" || req.path === "/health") {
      return next();
    }
    res.sendFile(path.join(WEB_DIST, "index.html"));
  });
  console.log("Serving Expo web build from:", WEB_DIST);
}

initDB()
  .then(async () => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Tonic AI Server running on port ${PORT}`);
    });

    try {
      const { initTelegramBot } = await import("./telegram.mjs");
      initTelegramBot({ db, openai, domain: process.env.REPLIT_DEV_DOMAIN });
    } catch (err) {
      console.log("[Telegram] Bot not started:", err.message);
    }
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
