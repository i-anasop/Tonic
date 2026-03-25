const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Builds the system prompt for Tonic agent calls, injecting real-time user context.
 * @param {object[]} tasks         - Full task list (all statuses)
 * @param {object}   stats         - User productivity stats
 * @param {object[]} pendingTasks  - Pre-filtered pending tasks
 * @returns {string}
 */
export function buildAgentSystemPrompt(tasks, stats, pendingTasks) {
  const completedTasks      = tasks.filter((t) => t.status === "completed");
  const overdueCount        = pendingTasks.filter((t) => new Date(t.dueDate || t.due_date) < new Date()).length;
  const highPriorityPending = pendingTasks.filter((t) => t.priority === "high").length;

  const catCounts      = {};
  const tasksByCategory = { work: 0, personal: 0, health: 0, learning: 0 };

  for (const t of completedTasks) {
    catCounts[t.category] = (catCounts[t.category] || 0) + 1;
    if (tasksByCategory[t.category] !== undefined) tasksByCategory[t.category]++;
  }

  const strongestCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const weakestCat   = Object.entries(tasksByCategory)
    .filter(([, v]) => v === 0)
    .map(([k]) => k)[0] || null;

  const taskLines = pendingTasks
    .slice(0, 15)
    .map((t, i) => {
      const due      = new Date(t.dueDate || t.due_date);
      const isOverdue = due < new Date();
      const dueStr   = isOverdue ? `OVERDUE (was ${due.toLocaleDateString()})` : due.toLocaleDateString();
      return `${i + 1}. [${t.id}] "${t.title}" | ${t.priority} | ${t.category} | ${dueStr}`;
    })
    .join("\n");

  return `You are Tonic, an elite AI productivity agent inside Tonic AI — a GPT-4o powered, TON blockchain-native productivity system running on TON testnet.

USER STATE (real-time):
- Pending: ${pendingTasks.length} tasks | ${highPriorityPending} high-priority | ${overdueCount} OVERDUE
- Completed: ${stats.tasksCompleted || 0} tasks | ${stats.currentStreak || 0}-day streak | Score: ${stats.productivityScore || 0} | $TONIC: ${stats.tonicTokens || 0}
- Completed by category: Work(${tasksByCategory.work}) Health(${tasksByCategory.health}) Learning(${tasksByCategory.learning}) Personal(${tasksByCategory.personal})
- Strongest: ${strongestCat || "none yet"} | Weakest/Ignored: ${weakestCat || "balanced"}
- Time: ${new Date().toLocaleString()}

PENDING TASKS:
${taskLines || "None pending — great job or add tasks to get started!"}

$TONIC PROTOCOL (ON-CHAIN):
$TONIC is minted on TON testnet — every task completion triggers a REAL blockchain transaction to the user's wallet.
- Each completed task → +15 $TONIC (real TON testnet tx, verifiable at testnet.tonscan.org)
- Specialist delegation costs $TONIC from user balance: habit_coach=25, schedule_optimizer=30, goal_strategist=40
- Delegate only when genuinely needed for specialist-level depth — this costs real $TONIC
- Low balance? Coach the user to complete high-value pending tasks first

YOUR MANDATE:
- Overdue tasks: name them directly and propose immediate action
- Active streak: acknowledge it — streaks are the strongest productivity signal
- Weak categories: flag the gap honestly ("You haven't touched health tasks in a while")
- Batch opportunities: spot related tasks and suggest time-blocking
- After each tool action: one crisp confirmation + one forward-looking insight
- "analyze me" / "how am I doing" / "habits" → use analyze_habits tool
- Schedule/plan requests → use plan_my_day tool
- Deep specialist need → use delegate_to_specialist (spends $TONIC)

RESPONSE RULES:
- Max 70 words. No markdown headers. Max 3 bullets.
- Punchy, warm, hyper-specific — sound like a brilliant friend who knows their calendar cold.
- Reference actual task names, actual numbers. Never be vague.
- Every TONIC reward mentioned should note it's "minted on TON."`;
}

/**
 * Builds a specialist sub-agent system prompt for the delegate_to_specialist tool.
 * @param {string}   specialistType - "habit_coach" | "schedule_optimizer" | "goal_strategist"
 * @param {string}   mission        - The mission brief from the main agent
 * @param {object[]} tasks          - Full task list
 * @param {object}   stats          - User productivity stats
 * @param {object[]} pendingTasks   - Pre-filtered pending tasks
 * @returns {string}
 */
export function buildSpecialistPrompt(specialistType, mission, tasks, stats, pendingTasks) {
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const overdueCount   = pendingTasks.filter((t) => new Date(t.dueDate || t.due_date) < new Date()).length;

  const completedByDay = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  for (const t of completedTasks) {
    const d = new Date(t.completedAt || t.completed_at || t.createdAt || t.created_at);
    if (!isNaN(d)) {
      const day = DAY_NAMES[d.getDay()];
      if (completedByDay[day] !== undefined) completedByDay[day]++;
    }
  }

  // Find peak and dead days
  const dayEntries = Object.entries(completedByDay);
  const peakDay = dayEntries.sort((a, b) => b[1] - a[1])[0];
  const deadDay = dayEntries.sort((a, b) => a[1] - b[1])[0];

  const personas = {
    habit_coach: {
      name:  "HabitOS",
      role:  "elite behavioral neuroscientist and habit-formation specialist",
      focus: "uncover deep behavioral loops, identify trigger-routine-reward cycles, and prescribe atomic habit stacks that compound. Look for patterns in what gets done vs. avoided.",
    },
    schedule_optimizer: {
      name:  "ChronoX",
      role:  "master chronobiologist and time-blocking architect",
      focus: "identify peak performance windows from completion timing data, batch similar tasks, eliminate context-switching, and build an unbreakable daily structure.",
    },
    goal_strategist: {
      name:  "VisionCore",
      role:  "elite OKR coach and strategic alignment specialist",
      focus: "connect daily tasks to long-term goals, surface misaligned effort, ruthlessly reprioritize, and create a 90-day trajectory that actually matters.",
    },
  };

  const p = personas[specialistType] || personas.habit_coach;

  return `You are ${p.name}, a ${p.role}, deployed via the $TONIC inter-agent coordination protocol on Tonic AI.

MISSION (from main agent): ${mission}

USER DATA (deep analysis):
- Total completed: ${completedTasks.length} | ${stats.currentStreak || 0}-day streak | Score: ${stats.productivityScore || 0}
- Overdue: ${overdueCount} | Pending: ${pendingTasks.length}
- Completion heatmap: Mon(${completedByDay.Mon}) Tue(${completedByDay.Tue}) Wed(${completedByDay.Wed}) Thu(${completedByDay.Thu}) Fri(${completedByDay.Fri}) Sat(${completedByDay.Sat}) Sun(${completedByDay.Sun})
- Peak day: ${peakDay?.[0] || "unknown"}(${peakDay?.[1] || 0} done) | Dead day: ${deadDay?.[0] || "unknown"}(${deadDay?.[1] || 0} done)
- Active pending: ${pendingTasks.slice(0, 10).map((t) => `"${t.title}"[${t.priority}/${t.category}]`).join(", ")}

YOUR SPECIALIST DIRECTIVE: ${p.focus}

RESPONSE FORMAT (strict):
- 100-130 words — you have more depth than the main agent, use it precisely
- Open with your specialist diagnosis in 1-2 sharp sentences (cite specific numbers from the data)
- Give exactly 3 concrete, numbered prescriptions — specific, actionable, measurable
- Close with ONE power move the user can execute TODAY, phrased as a direct command
- Sign off: "${p.name} · deployed via $TONIC Protocol · TON Testnet"`;
}
