/**
 * Returns the OpenAI function-calling tool definitions for the Tonic agent.
 * Centralised here so both the regular and streaming endpoints share the same schema.
 * @returns {object[]}
 */
export function buildAgentTools() {
  return [
    {
      type: "function",
      function: {
        name: "create_task",
        description: "Create a new task based on the user's request. Use when they say 'add', 'create', 'remind me', 'schedule', etc.",
        parameters: {
          type: "object",
          properties: {
            title:       { type: "string", description: "Clear, concise task title" },
            category:    { type: "string", enum: ["work", "personal", "health", "learning"] },
            priority:    { type: "string", enum: ["high", "medium", "low"] },
            dueDate:     { type: "string", description: "ISO date string. Default to tomorrow if not specified." },
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
            taskId:    { type: "string", description: "The exact task ID from the pending tasks list" },
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
            taskId:     { type: "string" },
            taskTitle:  { type: "string" },
            newDueDate: { type: "string", description: "New ISO date string" },
            reason:     { type: "string" },
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
            taskId:      { type: "string" },
            taskTitle:   { type: "string" },
            newPriority: { type: "string", enum: ["high", "medium", "low"] },
            reason:      { type: "string" },
          },
          required: ["taskId", "taskTitle", "newPriority"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "delegate_to_specialist",
        description: "Spend $TONIC tokens to hire a specialist AI sub-agent via the $TONIC inter-agent coordination protocol. The specialist runs a focused deep-work session the main agent cannot do alone. Available specialists: 'habit_coach' (25 $TONIC) — behavioral pattern analysis, 'schedule_optimizer' (30 $TONIC) — optimal time-blocking strategy, 'goal_strategist' (40 $TONIC) — long-term goal alignment and prioritization. Use when the user wants deep specialist insight beyond standard coaching, or explicitly asks to 'hire', 'delegate', 'deep dive', or 'specialist'.",
        parameters: {
          type: "object",
          properties: {
            specialist: {
              type: "string",
              enum: ["habit_coach", "schedule_optimizer", "goal_strategist"],
              description: "Which specialist sub-agent to hire",
            },
            mission: {
              type: "string",
              description: "Specific mission brief for the specialist — what problem to solve",
            },
            tonicCost: {
              type: "number",
              description: "TONIC cost: 25 for habit_coach, 30 for schedule_optimizer, 40 for goal_strategist",
            },
          },
          required: ["specialist", "mission"],
        },
      },
    },
  ];
}
