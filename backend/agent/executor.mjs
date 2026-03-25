import { db } from "../db.mjs";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Executes a parsed tool call and returns { action, toolResult }.
 * This single function is shared by both the regular and the SSE streaming
 * agent endpoints, eliminating the previous duplication.
 *
 * @param {string}   toolName     - The function name from the tool call
 * @param {object}   toolArgs     - Parsed JSON arguments
 * @param {object[]} tasks        - Full task list from the request
 * @param {object[]} pendingTasks - Pre-filtered pending tasks
 * @param {object}   stats        - User productivity stats
 * @param {string}   [userId]     - Authenticated user ID (optional)
 * @returns {Promise<{ action: object|null, toolResult: object }>}
 */
export async function executeToolCall(toolName, toolArgs, tasks, pendingTasks, stats, userId) {
  switch (toolName) {
    case "create_task": {
      const newTaskId = `agent_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const dueDate   = toolArgs.dueDate || new Date(Date.now() + 86_400_000).toISOString();

      const action = {
        type: "create_task",
        data: {
          id:          newTaskId,
          title:       toolArgs.title,
          category:    toolArgs.category  || "work",
          priority:    toolArgs.priority  || "medium",
          dueDate,
          description: toolArgs.description || null,
          status:      "pending",
          createdAt:   new Date().toISOString(),
          aiSuggested: true,
        },
      };

      if (userId) {
        await db.query(
          `INSERT INTO tasks
             (id, user_id, title, description, category, priority, status, due_date, created_at, ai_suggested)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, NOW(), true)
           ON CONFLICT (id) DO NOTHING`,
          [newTaskId, userId, toolArgs.title, toolArgs.description || null,
           toolArgs.category || "work", toolArgs.priority || "medium", dueDate],
        );
      }

      return { action, toolResult: { success: true, taskId: newTaskId, title: toolArgs.title } };
    }

    case "complete_task": {
      const action = {
        type: "complete_task",
        data: { taskId: toolArgs.taskId, taskTitle: toolArgs.taskTitle },
      };

      if (userId) {
        await db.query(
          "UPDATE tasks SET status = 'completed', completed_at = NOW() WHERE id = $1 AND user_id = $2",
          [toolArgs.taskId, userId],
        );
      }

      return { action, toolResult: { success: true, taskTitle: toolArgs.taskTitle } };
    }

    case "get_productivity_summary": {
      return {
        action:     { type: "show_stats", data: stats },
        toolResult: { stats, taskCount: tasks.length, pending: pendingTasks.length },
      };
    }

    case "analyze_habits": {
      const completedTasks = tasks.filter((t) => t.status === "completed");
      const completedByCategory = {};
      const completedByDay = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

      for (const t of completedTasks) {
        completedByCategory[t.category] = (completedByCategory[t.category] || 0) + 1;
        const d = new Date(t.completedAt || t.completed_at || t.createdAt);
        if (!isNaN(d)) {
          const day = DAY_NAMES[d.getDay()];
          completedByDay[day] = (completedByDay[day] || 0) + 1;
        }
      }

      const overdueCount = pendingTasks.filter((t) => new Date(t.dueDate || t.due_date) < new Date()).length;

      return {
        action:     { type: "show_stats", data: stats },
        toolResult: {
          completedByCategory,
          completedByDay,
          overdueCount,
          streak:         stats.currentStreak || 0,
          totalCompleted: completedTasks.length,
          totalPending:   pendingTasks.length,
        },
      };
    }

    case "plan_my_day": {
      const today = new Date();
      const todayPending = pendingTasks.filter((t) => {
        const due = new Date(t.dueDate || t.due_date);
        return due.toDateString() === today.toDateString() || due < today;
      });

      return {
        action:     { type: "schedule", data: { focus: toolArgs.focus } },
        toolResult: {
          todayTasks:  todayPending,
          allPending:  pendingTasks.slice(0, 10),
          focus:       toolArgs.focus,
        },
      };
    }

    case "reschedule_task": {
      const action = {
        type: "reschedule_task",
        data: { taskId: toolArgs.taskId, taskTitle: toolArgs.taskTitle, newDueDate: toolArgs.newDueDate },
      };

      if (userId) {
        await db.query(
          "UPDATE tasks SET due_date = $1 WHERE id = $2 AND user_id = $3",
          [toolArgs.newDueDate, toolArgs.taskId, userId],
        );
      }

      return {
        action,
        toolResult: { success: true, taskTitle: toolArgs.taskTitle, newDueDate: toolArgs.newDueDate, reason: toolArgs.reason },
      };
    }

    case "set_task_priority": {
      const action = {
        type: "update_priority",
        data: { taskId: toolArgs.taskId, taskTitle: toolArgs.taskTitle, newPriority: toolArgs.newPriority },
      };

      if (userId) {
        await db.query(
          "UPDATE tasks SET priority = $1 WHERE id = $2 AND user_id = $3",
          [toolArgs.newPriority, toolArgs.taskId, userId],
        );
      }

      return {
        action,
        toolResult: { success: true, taskTitle: toolArgs.taskTitle, newPriority: toolArgs.newPriority, reason: toolArgs.reason },
      };
    }

    default:
      return { action: null, toolResult: { success: false, error: `Unknown tool: ${toolName}` } };
  }
}
