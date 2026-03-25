import { Router } from "express";
import { openai } from "../openai.mjs";
import { buildAgentSystemPrompt, buildSpecialistPrompt } from "../agent/prompt.mjs";
import { buildAgentTools } from "../agent/tools.mjs";
import { executeToolCall } from "../agent/executor.mjs";
import { AI_MODEL } from "../config.mjs";

const router = Router();

// ── Standard request/response agent ──────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { messages = [], tasks = [], stats = {}, userId } = req.body;

    const pendingTasks = tasks.filter((t) => t.status !== "completed");
    const systemPrompt = buildAgentSystemPrompt(tasks, stats, pendingTasks);
    const allMessages  = [{ role: "system", content: systemPrompt }, ...messages.slice(-20)];

    const completion = await openai.chat.completions.create({
      model:       AI_MODEL,
      messages:    allMessages,
      tools:       buildAgentTools(),
      tool_choice: "auto",
    });

    const aiMessage  = completion.choices[0].message;
    let finalMessage = aiMessage.content || "";
    let action       = null;

    if (aiMessage.tool_calls?.length > 0) {
      const toolCall = aiMessage.tool_calls[0];
      const toolArgs = JSON.parse(toolCall.function.arguments);

      const result = await executeToolCall(
        toolCall.function.name, toolArgs, tasks, pendingTasks, stats, userId,
      );
      action = result.action;

      // Build confirmation messages — inject specialist persona if applicable
      const confirmMessages = [
        ...allMessages,
        aiMessage,
        { role: "tool", content: JSON.stringify(result.toolResult), tool_call_id: toolCall.id },
      ];

      if (result.specialistContext) {
        const { specialist, mission, tasks: sTasks, stats: sStats, pendingTasks: sPending } = result.specialistContext;
        confirmMessages[0] = { role: "system", content: buildSpecialistPrompt(specialist, mission, sTasks, sStats, sPending) };
      }

      const confirmRes = await openai.chat.completions.create({
        model:    AI_MODEL,
        messages: confirmMessages,
      });

      finalMessage = confirmRes.choices[0].message.content || finalMessage || "Done!";
    }

    res.json({ message: finalMessage, action });
  } catch (error) {
    console.error("[Agent] Error:", error.message);
    res.status(500).json({ error: "Agent error", message: "I'm having trouble right now. Please try again in a moment!" });
  }
});

// ── SSE streaming agent ───────────────────────────────────────────────────────
router.post("/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (data) => {
    try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch { /* client disconnected */ }
  };

  try {
    const { messages = [], tasks = [], stats = {}, userId } = req.body;

    const pendingTasks = tasks.filter((t) => t.status !== "completed");
    const systemPrompt = buildAgentSystemPrompt(tasks, stats, pendingTasks);
    const allMessages  = [{ role: "system", content: systemPrompt }, ...messages.slice(-20)];

    // ── First streaming pass: detect tool calls or stream text ────────────────
    const stream = await openai.chat.completions.create({
      model:       AI_MODEL,
      messages:    allMessages,
      tools:       buildAgentTools(),
      tool_choice: "auto",
      stream:      true,
    });

    let toolCallId   = "";
    let toolCallName = "";
    let toolCallArgs = "";
    let hasToolCall  = false;
    let assistantContent = "";

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        assistantContent += delta.content;
        send({ delta: delta.content });
      }
      if (delta?.tool_calls) {
        hasToolCall = true;
        const tc = delta.tool_calls[0];
        if (tc.id)              toolCallId    = tc.id;
        if (tc.function?.name)  toolCallName  = tc.function.name;
        if (tc.function?.arguments) toolCallArgs += tc.function.arguments;
      }
    }

    // ── Tool execution + confirmation stream ─────────────────────────────────
    if (hasToolCall && toolCallName) {
      let toolArgs = {};
      try { toolArgs = JSON.parse(toolCallArgs); } catch { /* malformed args */ }

      const result = await executeToolCall(toolCallName, toolArgs, tasks, pendingTasks, stats, userId);
      if (result.action) send({ action: result.action });

      const aiMsg = {
        role:       "assistant",
        content:    assistantContent || null,
        tool_calls: [{ id: toolCallId, type: "function", function: { name: toolCallName, arguments: toolCallArgs } }],
      };

      // Inject specialist persona into confirmation call if needed
      const confirmSystem = result.specialistContext
        ? buildSpecialistPrompt(
            result.specialistContext.specialist,
            result.specialistContext.mission,
            result.specialistContext.tasks,
            result.specialistContext.stats,
            result.specialistContext.pendingTasks,
          )
        : systemPrompt;

      const confirmStream = await openai.chat.completions.create({
        model:    AI_MODEL,
        messages: [
          { role: "system", content: confirmSystem },
          ...allMessages.slice(1),
          aiMsg,
          { role: "tool", content: JSON.stringify(result.toolResult), tool_call_id: toolCallId },
        ],
        stream: true,
      });

      for await (const chunk of confirmStream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) send({ delta: delta.content });
      }
    }

    send({ done: true });
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("[Agent/SSE] Error:", err.message);
    send({ error: err.message, done: true });
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

// ── Premium deep-analysis endpoint (free for Tonian badge holders) ────────────
router.post("/deep-analysis", async (req, res) => {
  try {
    const { tasks = [], stats = {}, userId } = req.body;

    const pendingTasks   = tasks.filter((t) => t.status !== "completed");
    const completedTasks = tasks.filter((t) => t.status === "completed");
    const overdueCount   = pendingTasks.filter((t) => new Date(t.dueDate || t.due_date) < new Date()).length;

    const catBreakdown = { work: 0, personal: 0, health: 0, learning: 0 };
    for (const t of completedTasks) {
      if (catBreakdown[t.category] !== undefined) catBreakdown[t.category]++;
    }

    const topPending = pendingTasks
      .slice(0, 20)
      .map((t, i) => `${i + 1}. "${t.title}" [${t.priority}/${t.category}] due: ${new Date(t.dueDate || t.due_date).toLocaleDateString()}`)
      .join("\n");

    const systemPrompt = `You are Tonic's Deep Strategy Engine — a premium AI analyst deployed for users who have earned or purchased deep-analysis access.

USER FULL PROFILE:
- Completed tasks: ${completedTasks.length} (Work: ${catBreakdown.work}, Health: ${catBreakdown.health}, Learning: ${catBreakdown.learning}, Personal: ${catBreakdown.personal})
- Pending: ${pendingTasks.length} (${overdueCount} overdue)
- Streak: ${stats.currentStreak || 0} days | Score: ${stats.productivityScore || 0} | $TONIC: ${stats.tonicTokens || 0}

PENDING TASKS (full list):
${topPending || "No pending tasks."}

DEEP ANALYSIS DIRECTIVE:
Deliver a comprehensive strategic productivity analysis. This is NOT a quick tip — it is a full diagnostic report.
Structure your response with these sections:
1. **Executive Summary** — where this person actually stands (brutally honest, 2-3 sentences)
2. **Pattern Analysis** — what their data reveals about habits, strengths, and blind spots
3. **Critical Vulnerabilities** — the 2-3 things most likely to derail their productivity
4. **Strategic Action Plan** — 4-5 specific, prioritized actions with clear reasoning
5. **30-Day Forecast** — what happens if they execute vs. ignore this plan

Be specific, reference their actual tasks and numbers. Max 300 words. No filler. This should feel like advice from a world-class coach who has studied their entire history.`;

    const completion = await openai.chat.completions.create({
      model:    AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: "Run my full deep strategic productivity analysis." },
      ],
    });

    const analysis = completion.choices[0].message.content || "Analysis unavailable.";
    res.json({ analysis, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[Agent/DeepAnalysis] Error:", err.message);
    res.status(500).json({ error: "Deep analysis failed. Please try again." });
  }
});

export default router;
