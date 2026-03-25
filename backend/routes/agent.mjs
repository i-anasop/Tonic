import { Router } from "express";
import { openai } from "../openai.mjs";
import { buildAgentSystemPrompt } from "../agent/prompt.mjs";
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

      const confirmRes = await openai.chat.completions.create({
        model:    AI_MODEL,
        messages: [
          ...allMessages,
          aiMessage,
          { role: "tool", content: JSON.stringify(result.toolResult), tool_call_id: toolCall.id },
        ],
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

      const confirmStream = await openai.chat.completions.create({
        model:    AI_MODEL,
        messages: [
          ...allMessages,
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

export default router;
