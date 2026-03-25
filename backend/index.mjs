import express from "express";
import cors from "cors";
import pg from "pg";
import OpenAI from "openai";
import { fileURLToPath } from "url";
import path from "path";
import { existsSync, readFileSync, copyFileSync } from "fs";

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

  await db.query(`
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ai_suggested BOOLEAN DEFAULT FALSE;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS stake_amount NUMERIC;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS stake_tx_hash TEXT;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS ton_proof TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    ALTER TABLE users ADD COLUMN IF NOT EXISTS tonic_tokens INT DEFAULT 0;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS sync_code TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS last_daily_challenge DATE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_challenge_done BOOLEAN DEFAULT FALSE;
  `);

  console.log("Database initialized");
}

app.get("/tonconnect-manifest.json", (req, res) => {
  const productionDomains = process.env.REPLIT_DOMAINS;
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  const domain = (productionDomains ? productionDomains.split(",")[0].trim() : null) || devDomain || req.get("host") || "localhost";
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
          content: `You are a productivity coach AI for Tonic AI. Generate exactly 4-5 personalized insights from the user's real task data. Return ONLY valid JSON with an "insights" array. Each insight MUST have ALL of these fields: id (unique string), type ("focus"|"warning"|"suggestion"|"pattern"|"achievement"), title (max 5 words, punchy and specific), description (STRICT max 12 words, actionable and specific — no filler), icon ("target"|"alert"|"balance"|"trending"|"clock"|"brain"), priority ("high"|"medium"|"low"), metric (a specific number/percentage string pulled from real data e.g. "73%", "5", "3d", "2x"), trend ("up"|"down"|"neutral"), action (2-3 word imperative CTA e.g. "Do it now", "Keep going", "Add tasks").`,
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

function buildAgentSystemPrompt(tasks, stats, pendingTasks) {
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const catCounts = {};
  for (const t of completedTasks) catCounts[t.category] = (catCounts[t.category] || 0) + 1;
  const strongestCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const overdueCount = pendingTasks.filter((t) => new Date(t.dueDate || t.due_date) < new Date()).length;
  const highPriorityPending = pendingTasks.filter((t) => t.priority === "high").length;
  const tasksByCategory = { work: 0, personal: 0, health: 0, learning: 0 };
  for (const t of completedTasks) if (tasksByCategory[t.category] !== undefined) tasksByCategory[t.category]++;

  return `You are Tonic, an elite AI productivity coach embedded in Tonic AI — a TON blockchain-integrated productivity app.

USER CONTEXT:
- Pending: ${pendingTasks.length} tasks (${highPriorityPending} high-priority, ${overdueCount} overdue)
- Completed: ${stats.tasksCompleted || 0} tasks | ${stats.currentStreak || 0}-day streak | Score: ${stats.productivityScore || 0} | $TONIC: ${stats.tonicTokens || 0}
- Category strength: Work(${tasksByCategory.work}) Health(${tasksByCategory.health}) Learning(${tasksByCategory.learning}) Personal(${tasksByCategory.personal})
- Best category: ${strongestCat || "building your first habits"} | Date: ${new Date().toLocaleString()}

PENDING TASKS:
${pendingTasks.slice(0, 15).map((t, i) => `${i + 1}. [${t.id}] "${t.title}" | ${t.priority} | ${t.category} | due: ${new Date(t.dueDate || t.due_date).toLocaleDateString()}`).join("\n")}

YOUR ROLE (beyond basic task management):
- Detect habit patterns: notice which categories the user crushes vs. struggles with
- Proactively coach: if overdue tasks exist, acknowledge them. If streak is active, reinforce it.
- Reward framing: mention $TONIC earnings to reinforce completing tasks ("That earns you +15 $TONIC!")
- Suggest smart batching: "You have 3 work tasks — block 90 minutes this morning"
- Be brutally honest about productivity with warmth: "You've skipped health tasks 5 days in a row — want me to reschedule them?"
- When asked "analyze me", "habits", "patterns", or "how am I doing" → use analyze_habits tool
- For scheduling requests → use plan_my_day tool with a specific focus

RESPONSE RULES:
- Max 70 words. No markdown headers (##, ###). At most 3 bullets.
- Direct, warm, punchy — like a brilliant friend who knows your calendar.
- After any tool action: confirm in ONE sentence + one brief coaching insight.
- Reference specific task names and numbers, not vague generalities.`;
}

function buildAgentTools() {
  return [
      {
        type: "function",
        function: {
          name: "create_task",
          description: "Create a new task based on the user's request. Use when they say 'add', 'create', 'remind me', 'schedule', etc.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Clear, concise task title" },
              category: { type: "string", enum: ["work", "personal", "health", "learning"] },
              priority: { type: "string", enum: ["high", "medium", "low"] },
              dueDate: { type: "string", description: "ISO date string. Default to tomorrow if not specified." },
              description: { type: "string" },
            },
            required: ["title", "category", "priority", "dueDate"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "complete_task",
          description: "Mark a pending task as completed. Match by title from the user's task list.",
          parameters: {
            type: "object",
            properties: {
              taskId: { type: "string", description: "The exact task ID from the pending tasks list" },
              taskTitle: { type: "string" },
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
          name: "analyze_habits",
          description: "Deep analysis of the user's productivity habits, patterns, and behavioral trends. Use when asked about habits, patterns, analysis, 'how am I doing', or 'tell me about myself'.",
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
              focus: { type: "string", enum: ["work", "personal", "health", "learning", "balanced"] },
            },
            required: ["focus"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "reschedule_task",
          description: "Reschedule a task to a new due date.",
          parameters: {
            type: "object",
            properties: {
              taskId: { type: "string" },
              taskTitle: { type: "string" },
              newDueDate: { type: "string", description: "New ISO date string" },
              reason: { type: "string" },
            },
            required: ["taskId", "taskTitle", "newDueDate"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "set_task_priority",
          description: "Change the priority of a specific task. Use when user wants to escalate, downgrade, or re-rank a task.",
          parameters: {
            type: "object",
            properties: {
              taskId: { type: "string" },
              taskTitle: { type: "string" },
              newPriority: { type: "string", enum: ["high", "medium", "low"] },
              reason: { type: "string" },
            },
            required: ["taskId", "taskTitle", "newPriority"],
          },
        },
      },
  ];
}

app.post("/api/agent", async (req, res) => {
  try {
    const { messages = [], tasks = [], stats = {}, userId } = req.body;

    const pendingTasks = tasks.filter((t) => t.status !== "completed");
    const systemPrompt = buildAgentSystemPrompt(tasks, stats, pendingTasks);

    const tools = buildAgentTools();

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

      } else if (toolName === "reschedule_task") {
        action = {
          type: "reschedule_task",
          data: { taskId: toolArgs.taskId, taskTitle: toolArgs.taskTitle, newDueDate: toolArgs.newDueDate },
        };

        if (userId) {
          try {
            await db.query(
              "UPDATE tasks SET due_date = $1 WHERE id = $2 AND user_id = $3",
              [toolArgs.newDueDate, toolArgs.taskId, userId]
            );
          } catch (dbErr) {
            console.warn("DB reschedule failed:", dbErr.message);
          }
        }

        const confirmRes = await openai.chat.completions.create({
          model: "gpt-5.2",
          messages: [
            ...allMessages,
            aiMessage,
            { role: "tool", content: JSON.stringify({ success: true, taskTitle: toolArgs.taskTitle, newDueDate: toolArgs.newDueDate, reason: toolArgs.reason }), tool_call_id: toolCall.id },
          ],
        });
        finalMessage = confirmRes.choices[0].message.content || `"${toolArgs.taskTitle}" rescheduled!`;

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

      } else if (toolName === "analyze_habits") {
        const completedByCategory = {};
        const completedByDay = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
        const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
        for (const t of tasks.filter(t => t.status === "completed")) {
          completedByCategory[t.category] = (completedByCategory[t.category] || 0) + 1;
          const d = new Date(t.completedAt || t.completed_at || t.createdAt);
          if (!isNaN(d)) completedByDay[dayNames[d.getDay()]] = (completedByDay[dayNames[d.getDay()]] || 0) + 1;
        }
        const overdueCount = pendingTasks.filter(t => new Date(t.dueDate || t.due_date) < new Date()).length;
        const habitData = { completedByCategory, completedByDay, overdueCount, streak: stats.currentStreak || 0, totalCompleted: tasks.filter(t => t.status === "completed").length, totalPending: pendingTasks.length };
        const confirmRes = await openai.chat.completions.create({
          model: "gpt-5.2",
          messages: [
            ...allMessages,
            aiMessage,
            { role: "tool", content: JSON.stringify(habitData), tool_call_id: toolCall.id },
          ],
        });
        finalMessage = confirmRes.choices[0].message.content || "Here's your habit analysis!";
        action = { type: "show_stats", data: stats };

      } else if (toolName === "set_task_priority") {
        action = { type: "update_priority", data: { taskId: toolArgs.taskId, taskTitle: toolArgs.taskTitle, newPriority: toolArgs.newPriority } };
        if (userId) {
          try {
            await db.query("UPDATE tasks SET priority = $1 WHERE id = $2 AND user_id = $3", [toolArgs.newPriority, toolArgs.taskId, userId]);
          } catch (dbErr) { console.warn("DB priority update failed:", dbErr.message); }
        }
        const confirmRes = await openai.chat.completions.create({
          model: "gpt-5.2",
          messages: [
            ...allMessages,
            aiMessage,
            { role: "tool", content: JSON.stringify({ success: true, taskTitle: toolArgs.taskTitle, newPriority: toolArgs.newPriority, reason: toolArgs.reason }), tool_call_id: toolCall.id },
          ],
        });
        finalMessage = confirmRes.choices[0].message.content || `"${toolArgs.taskTitle}" priority set to ${toolArgs.newPriority}!`;
      }
    }

    res.json({ message: finalMessage, action });
  } catch (error) {
    console.error("AI Agent error:", error.message);
    res.status(500).json({ error: "Agent error", message: "I'm having trouble right now. Please try again in a moment!" });
  }
});

// ── SSE Streaming Agent ──────────────────────────────────────────────────────
app.post("/api/agent/stream", async (req, res) => {
  const { messages = [], tasks = [], stats = {}, userId } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const sendEvent = (data) => {
    try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch {}
  };

  try {
    const pendingTasks = tasks.filter((t) => t.status !== "completed");

    const systemPrompt = buildAgentSystemPrompt(tasks, stats, pendingTasks);
    const tools = buildAgentTools();

    const allMessages = [{ role: "system", content: systemPrompt }, ...messages.slice(-20)];

    // First streaming call
    const stream = await openai.chat.completions.create({
      model: "gpt-5.2", messages: allMessages, tools, tool_choice: "auto", stream: true,
    });

    let toolCallId = "";
    let toolCallName = "";
    let toolCallArgs = "";
    let hasToolCall = false;
    let assistantContent = "";

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        assistantContent += delta.content;
        sendEvent({ delta: delta.content });
      }
      if (delta?.tool_calls) {
        hasToolCall = true;
        const tc = delta.tool_calls[0];
        if (tc.id) toolCallId = tc.id;
        if (tc.function?.name) toolCallName = tc.function.name;
        if (tc.function?.arguments) toolCallArgs += tc.function.arguments;
      }
    }

    if (hasToolCall && toolCallName) {
      let toolArgs = {};
      try { toolArgs = JSON.parse(toolCallArgs); } catch {}

      let action = null;
      let toolResult = { success: true };

      if (toolCallName === "create_task") {
        const newTaskId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const dueDate = toolArgs.dueDate || new Date(Date.now() + 86400000).toISOString();
        action = { type: "create_task", data: { id: newTaskId, title: toolArgs.title, category: toolArgs.category || "work", priority: toolArgs.priority || "medium", dueDate, description: toolArgs.description || null, status: "pending", createdAt: new Date().toISOString(), aiSuggested: true } };
        toolResult = { success: true, taskId: newTaskId, title: toolArgs.title };
        if (userId) { try { await db.query(`INSERT INTO tasks (id, user_id, title, description, category, priority, status, due_date, created_at, ai_suggested) VALUES ($1,$2,$3,$4,$5,$6,'pending',$7,NOW(),true) ON CONFLICT (id) DO NOTHING`, [newTaskId, userId, toolArgs.title, toolArgs.description || null, toolArgs.category || "work", toolArgs.priority || "medium", dueDate]); } catch {} }
      } else if (toolCallName === "complete_task") {
        action = { type: "complete_task", data: { taskId: toolArgs.taskId, taskTitle: toolArgs.taskTitle } };
        toolResult = { success: true, taskTitle: toolArgs.taskTitle };
        if (userId) { try { await db.query("UPDATE tasks SET status='completed', completed_at=NOW() WHERE id=$1 AND user_id=$2", [toolArgs.taskId, userId]); } catch {} }
      } else if (toolCallName === "reschedule_task") {
        action = { type: "reschedule_task", data: { taskId: toolArgs.taskId, taskTitle: toolArgs.taskTitle, newDueDate: toolArgs.newDueDate } };
        toolResult = { success: true, taskTitle: toolArgs.taskTitle, newDueDate: toolArgs.newDueDate, reason: toolArgs.reason };
        if (userId) { try { await db.query("UPDATE tasks SET due_date=$1 WHERE id=$2 AND user_id=$3", [toolArgs.newDueDate, toolArgs.taskId, userId]); } catch {} }
      } else if (toolCallName === "get_productivity_summary") {
        action = { type: "show_stats", data: stats };
        toolResult = { stats, taskCount: tasks.length, pending: pendingTasks.length };
      } else if (toolCallName === "plan_my_day") {
        const todayPending = pendingTasks.filter((t) => { const due = new Date(t.dueDate || t.due_date); return due.toDateString() === new Date().toDateString() || due < new Date(); });
        action = { type: "schedule", data: { focus: toolArgs.focus } };
        toolResult = { todayTasks: todayPending, allPending: pendingTasks.slice(0, 10), focus: toolArgs.focus };
      } else if (toolCallName === "analyze_habits") {
        const completedTasks2 = tasks.filter(t => t.status === "completed");
        const catC = {}; const dayC = { Mon:0,Tue:0,Wed:0,Thu:0,Fri:0,Sat:0,Sun:0 };
        const dn = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
        for (const t of completedTasks2) { catC[t.category] = (catC[t.category]||0)+1; const d=new Date(t.completedAt||t.completed_at||t.createdAt); if(!isNaN(d)) dayC[dn[d.getDay()]]=(dayC[dn[d.getDay()]]||0)+1; }
        action = { type: "show_stats", data: stats };
        toolResult = { completedByCategory: catC, completedByDay: dayC, overdueCount: pendingTasks.filter(t=>new Date(t.dueDate||t.due_date)<new Date()).length, streak: stats.currentStreak||0, totalCompleted: completedTasks2.length };
      } else if (toolCallName === "set_task_priority") {
        action = { type: "update_priority", data: { taskId: toolArgs.taskId, taskTitle: toolArgs.taskTitle, newPriority: toolArgs.newPriority } };
        toolResult = { success: true, taskTitle: toolArgs.taskTitle, newPriority: toolArgs.newPriority };
        if (userId) { try { await db.query("UPDATE tasks SET priority=$1 WHERE id=$2 AND user_id=$3", [toolArgs.newPriority, toolArgs.taskId, userId]); } catch {} }
      }

      if (action) sendEvent({ action });

      // Confirmation call — streamed for word-by-word delivery
      const aiMsg = { role: "assistant", content: assistantContent || null, tool_calls: [{ id: toolCallId, type: "function", function: { name: toolCallName, arguments: toolCallArgs } }] };
      const confirmStream = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [...allMessages, aiMsg, { role: "tool", content: JSON.stringify(toolResult), tool_call_id: toolCallId }],
        stream: true,
      });
      for await (const chunk of confirmStream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) sendEvent({ delta: delta.content });
      }
    }

    sendEvent({ done: true });
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("SSE agent error:", err.message);
    sendEvent({ error: err.message, done: true });
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

// ── $TONIC Token Routes ──────────────────────────────────────────────────────
const TONIC_PER_TASK = 15;
const TONIC_STREAK_BONUS = 25;
const TONIC_DAILY_CHALLENGE = 50;

app.get("/api/users/:userId/tokens", async (req, res) => {
  try {
    const result = await db.query("SELECT tonic_tokens FROM users WHERE id = $1", [req.params.userId]);
    const tokens = result.rows[0]?.tonic_tokens ?? 0;
    res.json({ tokens, earnRate: `+${TONIC_PER_TASK} per task, +${TONIC_STREAK_BONUS} streak bonus` });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tokens", tokens: 0 });
  }
});

app.post("/api/earn-tokens", async (req, res) => {
  try {
    const { userId, reason, amount } = req.body;
    if (!userId || !amount) return res.status(400).json({ error: "userId and amount required" });
    const result = await db.query(
      "UPDATE users SET tonic_tokens = COALESCE(tonic_tokens, 0) + $1 WHERE id = $2 RETURNING tonic_tokens",
      [amount, userId]
    );
    const newBalance = result.rows[0]?.tonic_tokens ?? amount;
    res.json({ success: true, earned: amount, balance: newBalance, reason: reason || "Task completed" });
  } catch (err) {
    console.error("Earn tokens error:", err.message);
    res.status(500).json({ error: "Failed to earn tokens" });
  }
});

// ── Daily Challenge ───────────────────────────────────────────────────────────
const DAILY_CHALLENGES = [
  { id: "c1", title: "Complete 3 tasks today", target: 3, type: "tasks", reward: 50 },
  { id: "c2", title: "Finish a high-priority task", target: 1, type: "high_priority", reward: 60 },
  { id: "c3", title: "Clear all overdue tasks", target: 1, type: "overdue", reward: 75 },
  { id: "c4", title: "Complete a health or learning task", target: 1, type: "category_growth", reward: 45 },
  { id: "c5", title: "Complete 2 work tasks before noon", target: 2, type: "morning_work", reward: 55 },
];

app.get("/api/daily-challenge", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const dayIndex = Math.floor(Date.now() / 86400000) % DAILY_CHALLENGES.length;
    const challenge = DAILY_CHALLENGES[dayIndex];
    const { userId } = req.query;
    let done = false;
    if (userId) {
      const r = await db.query("SELECT last_daily_challenge, daily_challenge_done FROM users WHERE id = $1", [userId]);
      if (r.rows[0]) {
        const lastDay = r.rows[0].last_daily_challenge?.toISOString?.()?.split("T")[0];
        done = lastDay === today && r.rows[0].daily_challenge_done;
      }
    }
    res.json({ challenge: { ...challenge, date: today, done } });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch challenge" });
  }
});

app.post("/api/daily-challenge/complete", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const today = new Date().toISOString().split("T")[0];
    await db.query(
      "UPDATE users SET last_daily_challenge = $1, daily_challenge_done = true, tonic_tokens = COALESCE(tonic_tokens,0) + $2 WHERE id = $3",
      [today, TONIC_DAILY_CHALLENGE, userId]
    );
    const r = await db.query("SELECT tonic_tokens FROM users WHERE id = $1", [userId]);
    res.json({ success: true, earned: TONIC_DAILY_CHALLENGE, balance: r.rows[0]?.tonic_tokens ?? 0 });
  } catch (err) {
    res.status(500).json({ error: "Failed to complete challenge" });
  }
});

// ── Cross-Device Sync Code ────────────────────────────────────────────────────
app.post("/api/sync-code/generate", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });
    const r = await db.query("SELECT sync_code FROM users WHERE id = $1", [userId]);
    let code = r.rows[0]?.sync_code;
    if (!code) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      await db.query("UPDATE users SET sync_code = $1 WHERE id = $2", [code, userId]);
    }
    res.json({ code, userId });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate sync code" });
  }
});

app.post("/api/sync-code/restore", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "code required" });
    const userRes = await db.query("SELECT * FROM users WHERE UPPER(sync_code) = UPPER($1)", [code]);
    if (!userRes.rows[0]) return res.status(404).json({ error: "Invalid sync code. Check the code and try again." });
    const user = userRes.rows[0];
    const tasksRes = await db.query("SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC", [user.id]);
    res.json({ user: { id: user.id, name: user.name, walletAddress: user.wallet_address, tonicTokens: user.tonic_tokens || 0 }, tasks: tasksRes.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to restore from sync code" });
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

const MOCK_LEADERS = [
  { id: "mock_1",  name: "DeFi_Pro",       wallet_address: "UQBpro...x1",   tonic_tokens: 28400, completed_tasks: 284, total_tasks: 296, completion_rate: 96, score: 31240 },
  { id: "mock_2",  name: "CryptoNinja",    wallet_address: "UQBninja...x2", tonic_tokens: 21600, completed_tasks: 216, total_tasks: 224, completion_rate: 96, score: 23760 },
  { id: "mock_3",  name: "BlockStar",      wallet_address: "UQBstar...x3",  tonic_tokens: 16500, completed_tasks: 165, total_tasks: 178, completion_rate: 93, score: 18150 },
  { id: "mock_4",  name: "TONQueen",       wallet_address: null,             tonic_tokens: 11200, completed_tasks: 112, total_tasks: 126, completion_rate: 89, score: 12320 },
  { id: "mock_5",  name: "GrindKing",      wallet_address: null,             tonic_tokens:  7300, completed_tasks:  73, total_tasks:  82, completion_rate: 89, score:  8030 },
  { id: "mock_6",  name: "TON_Wizard",     wallet_address: "UQBwiz...x6",   tonic_tokens:  5800, completed_tasks:  58, total_tasks:  65, completion_rate: 89, score:  6380 },
  { id: "mock_7",  name: "BlockBuilder",   wallet_address: null,             tonic_tokens:  4200, completed_tasks:  42, total_tasks:  50, completion_rate: 84, score:  4620 },
  { id: "mock_8",  name: "ChainHunter",    wallet_address: "UQBhunt...x8",  tonic_tokens:  3100, completed_tasks:  31, total_tasks:  37, completion_rate: 84, score:  3410 },
  { id: "mock_9",  name: "MythicGrinder",  wallet_address: null,             tonic_tokens:  2400, completed_tasks:  24, total_tasks:  29, completion_rate: 83, score:  2640 },
  { id: "mock_10", name: "SolanaKid",      wallet_address: null,             tonic_tokens:  1900, completed_tasks:  19, total_tasks:  24, completion_rate: 79, score:  2090 },
  { id: "mock_11", name: "TaskMaster99",   wallet_address: "UQBtm...x11",   tonic_tokens:  1500, completed_tasks:  15, total_tasks:  19, completion_rate: 79, score:  1650 },
  { id: "mock_12", name: "LegendBit",      wallet_address: null,             tonic_tokens:  1100, completed_tasks:  11, total_tasks:  15, completion_rate: 73, score:  1210 },
  { id: "mock_13", name: "web3_rose",      wallet_address: "UQBrose...x13", tonic_tokens:   800, completed_tasks:   8, total_tasks:  12, completion_rate: 67, score:   880 },
  { id: "mock_14", name: "DiamondHands",   wallet_address: null,             tonic_tokens:   500, completed_tasks:   5, total_tasks:   8, completion_rate: 63, score:   550 },
  { id: "mock_15", name: "RookieCrypto",   wallet_address: null,             tonic_tokens:   200, completed_tasks:   2, total_tasks:   4, completion_rate: 50, score:   220 },
];

app.get("/api/leaderboard", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        u.id,
        u.name,
        u.wallet_address,
        COALESCE(u.tonic_tokens, 0) AS tonic_tokens,
        COUNT(t.id) FILTER (WHERE t.status = 'completed') AS completed_tasks,
        COUNT(t.id) AS total_tasks,
        ROUND(
          CASE WHEN COUNT(t.id) > 0
            THEN (COUNT(t.id) FILTER (WHERE t.status = 'completed')::float / COUNT(t.id)::float) * 100
            ELSE 0
          END
        ) AS completion_rate,
        (COUNT(t.id) FILTER (WHERE t.status = 'completed') * 10 + COALESCE(u.tonic_tokens, 0)) AS score
      FROM users u
      LEFT JOIN tasks t ON t.user_id = u.id
      GROUP BY u.id, u.name, u.wallet_address, u.tonic_tokens
      HAVING COUNT(t.id) > 0
      ORDER BY score DESC
      LIMIT 20
    `);
    // Merge real users with mock leaders; real users who beat a mock user displace them
    const real = result.rows.map(r => ({ ...r, completed_tasks: Number(r.completed_tasks), total_tasks: Number(r.total_tasks), completion_rate: Number(r.completion_rate), score: Number(r.score) }));
    const combined = [...MOCK_LEADERS, ...real]
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
    res.json({ leaderboard: combined });
  } catch (error) {
    console.error("Leaderboard error:", error.message);
    res.status(500).json({ error: "Failed to fetch leaderboard", leaderboard: MOCK_LEADERS });
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

const PORTRAIT_CSS = `
  <style id="portrait-mobile">
    html {
      height: 100%;
      margin: 0;
      padding: 0;
      background-color: #060810;
    }
    body {
      margin: 0;
      padding: 0;
      height: 100%;
      overflow: hidden;
      background-color: #060810;
      background-image:
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,215,0,0.06) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 80% 100%, rgba(100,160,255,0.04) 0%, transparent 50%);
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: stretch;
    }
    #root {
      display: flex;
      flex: 1;
      height: 100%;
      width: 100%;
      max-width: 430px;
      overflow: hidden;
      position: relative;
    }
    @media (min-width: 431px) {
      #root {
        box-shadow:
          0 0 0 1px rgba(255,215,0,0.13),
          0 12px 80px rgba(0,0,0,0.75),
          0 0 60px rgba(255,215,0,0.05);
      }
    }
  </style>
  <link rel="icon" type="image/png" href="/logo.png" />
  <link rel="apple-touch-icon" href="/logo.png" />
  <meta name="theme-color" content="#0D1117" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-title" content="Tonic AI" />
`;

if (existsSync(WEB_DIST)) {
  const logoSrc = path.join(__dirname, "../frontend/assets/images/logo.png");
  const logoDest = path.join(WEB_DIST, "logo.png");
  if (existsSync(logoSrc) && !existsSync(logoDest)) {
    try { copyFileSync(logoSrc, logoDest); } catch {}
  }

  const indexHtmlPath = path.join(WEB_DIST, "index.html");
  let cachedHtml = null;

  const getPortraitHtml = () => {
    if (!cachedHtml) {
      try {
        const raw = readFileSync(indexHtmlPath, "utf8");
        cachedHtml = raw
          .replace(/<link rel="icon" href="\/favicon\.ico" ?\/?>/gi, "")
          .replace("</head>", `${PORTRAIT_CSS}</head>`);
      } catch {
        cachedHtml = `<!DOCTYPE html><html><body><p>App loading…</p></body></html>`;
      }
    }
    return cachedHtml;
  };

  app.use(express.static(WEB_DIST, { index: false }));

  app.get("/{*splat}", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path === "/tonconnect-manifest.json" || req.path === "/health") {
      return next();
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.send(getPortraitHtml());
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
