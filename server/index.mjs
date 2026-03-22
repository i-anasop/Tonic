import express from "express";
import cors from "cors";
import pg from "pg";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

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
      created_at TIMESTAMP NOT NULL,
      completed_at TIMESTAMP
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
  res.json({ status: "ok", service: "Tonic AI Server", version: "1.0.0" });
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
    const timeOfDay =
      hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

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
      insights = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.insights)
          ? parsed.insights
          : [];
    } catch {
      insights = [];
    }

    res.json({ insights });
  } catch (error) {
    console.error("AI insights error:", error.message);
    res.status(500).json({ error: "Failed to generate insights", insights: [] });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { id, name, walletAddress, isGuest } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: "id and name are required" });
    }

    const result = await db.query(
      `INSERT INTO users (id, name, wallet_address, is_guest)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE
       SET name = $2, wallet_address = $3, is_guest = $4, updated_at = NOW()
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
    const { id, userId, title, description, category, priority, status, dueDate, createdAt, completedAt } = req.body;
    if (!id || !userId || !title) {
      return res.status(400).json({ error: "id, userId, and title are required" });
    }

    const result = await db.query(
      `INSERT INTO tasks (id, user_id, title, description, category, priority, status, due_date, created_at, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE
       SET title = $3, description = $4, category = $5, priority = $6,
           status = $7, due_date = $8, completed_at = $10
       RETURNING *`,
      [id, userId, title, description || null, category || "work", priority || "medium",
       status || "pending", dueDate, createdAt, completedAt || null]
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
    if (!userId || !Array.isArray(tasks)) {
      return res.status(400).json({ error: "userId and tasks array required" });
    }

    for (const task of tasks) {
      await db.query(
        `INSERT INTO tasks (id, user_id, title, description, category, priority, status, due_date, created_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE
         SET title = $3, description = $4, category = $5, priority = $6,
             status = $7, due_date = $8, completed_at = $10`,
        [task.id, userId, task.title, task.description || null, task.category,
         task.priority, task.status, task.dueDate, task.createdAt, task.completedAt || null]
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

initDB()
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Tonic AI Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
