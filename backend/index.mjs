import express from "express";
import cors from "cors";

import { initDB } from "./db.mjs";
import { openai } from "./openai.mjs";
import { registerStaticServing } from "./static.mjs";
import { initTelegramBot } from "./telegram.mjs";
import { initDeployerWallet } from "./ton/wallet.mjs";

import agentRouter       from "./routes/agent.mjs";
import tasksRouter       from "./routes/tasks.mjs";
import usersRouter       from "./routes/users.mjs";
import tokensRouter      from "./routes/tokens.mjs";
import recordsRouter     from "./routes/records.mjs";
import leaderboardRouter from "./routes/leaderboard.mjs";
import tonChainRouter    from "./routes/ton-chain.mjs";

const app = express();

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// ── Utility routes ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status:   "ok",
    service:  "Tonic AI Server",
    version:  "2.0.0",
    features: ["ai-agent", "ton-blockchain", "telegram-bot"],
  });
});

app.get("/tonconnect-manifest.json", (req, res) => {
  const productionDomains = process.env.REPLIT_DOMAINS;
  const devDomain         = process.env.REPLIT_DEV_DOMAIN;
  const domain = (productionDomains ? productionDomains.split(",")[0].trim() : null)
    || devDomain
    || req.get("host")
    || "localhost";

  res.json({ url: `https://${domain}`, name: "Tonic AI", iconUrl: `https://${domain}/icon.png` });
});

// ── AI insights (standalone endpoint, not part of agent chat) ─────────────────
app.post("/api/insights", async (req, res) => {
  try {
    const { tasks = [], stats = {} } = req.body;
    const completed    = tasks.filter((t) => t.status === "completed");
    const pending      = tasks.filter((t) => t.status !== "completed");
    const highPriority = pending.filter((t) => t.priority === "high");
    const hour         = new Date().getHours();
    const timeOfDay    = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

    const taskSummary = {
      total: tasks.length, completed: completed.length, pending: pending.length,
      highPriority: highPriority.length, streak: stats.currentStreak || 0,
      productivityScore: stats.productivityScore || 0,
      categories: {
        work:     tasks.filter((t) => t.category === "work").length,
        personal: tasks.filter((t) => t.category === "personal").length,
        health:   tasks.filter((t) => t.category === "health").length,
        learning: tasks.filter((t) => t.category === "learning").length,
      },
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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
      const parsed = JSON.parse(completion.choices[0].message.content);
      insights = Array.isArray(parsed) ? parsed : Array.isArray(parsed.insights) ? parsed.insights : [];
    } catch { /* malformed JSON — return empty */ }

    res.json({ insights });
  } catch (err) {
    console.error("[Insights] Error:", err.message);
    res.status(500).json({ error: "Failed to generate insights", insights: [] });
  }
});

// ── Feature routers ───────────────────────────────────────────────────────────
app.use("/api/agent", agentRouter);
app.use("/api",       tasksRouter);
app.use("/api",       usersRouter);
app.use("/api",       tokensRouter);
app.use("/api",       recordsRouter);
app.use("/api",       leaderboardRouter);
app.use("/api",       tonChainRouter);

// ── Static / SPA serving ──────────────────────────────────────────────────────
registerStaticServing(app);

// ── Bootstrap ────────────────────────────────────────────────────────────────
initDB()
  .then(async () => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`[Server] Tonic AI running on port ${PORT}`));
    // Initialize TON deployer wallet (non-blocking — logs address + balance)
    initDeployerWallet().catch((e) => console.warn("[TON] Wallet init warning:", e.message));
    await initTelegramBot({ db: (await import("./db.mjs")).db, openai, domain: process.env.REPLIT_DEV_DOMAIN });
  })
  .catch((err) => {
    console.error("[Server] Fatal startup error:", err);
    process.exit(1);
  });
