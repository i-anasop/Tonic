import { Achievement, AchievementCategory, AchievementDifficulty } from "@/types/achievements";

const m = (d: AchievementDifficulty): number =>
  ({ easy: 1, medium: 2, hard: 3, expert: 5 }[d]);

const a = (
  id: string,
  name: string,
  description: string,
  category: AchievementCategory,
  difficulty: AchievementDifficulty,
  icon: string,
  basePoints: number,
  condType: string,
  target: number,
  metric?: string,
  secret = false
): Achievement => ({
  id,
  name,
  description,
  category,
  difficulty,
  icon,
  basePoints,
  difficultyMultiplier: m(difficulty),
  condition: { type: condType as any, target, metric },
  unlocked: false,
  progress: 0,
  secret,
});

export const ACHIEVEMENTS: Achievement[] = [
  // ══════════ DAILY ══════════
  a("first_task_daily",   "First Blood",       "Complete your first task today",                       "daily", "easy",   "Sun",       3,  "task_count",      1,   "daily"),
  a("three_tasks_daily",  "Warming Up",        "Complete 3 tasks in a single day",                    "daily", "easy",   "Zap",       3,  "task_count",      3,   "daily"),
  a("five_tasks_daily",   "Daily Grinder",     "Complete 5 tasks in a single day",                    "daily", "medium", "Flame",     8,  "task_count",      5,   "daily"),
  a("ten_tasks_daily",    "Beast Mode",        "Complete 10 tasks in a single day",                   "daily", "hard",   "Flame",     20, "task_count",      10,  "daily"),
  a("fifteen_tasks_daily","Unstoppable Day",   "Complete 15 tasks in a single day",                   "daily", "expert", "Star",      60, "task_count",      15,  "daily", true),
  a("perfect_day",        "Clean Sweep",       "Complete every task scheduled for today",             "daily", "medium", "Target",    8,  "completion_rate", 100, "daily"),
  a("daily_80pct",        "Consistent",        "Achieve 80% completion rate today",                   "daily", "easy",   "CheckCircle",3, "completion_rate", 80,  "daily"),

  // ══════════ WEEKLY ══════════
  a("three_day_streak",   "Warming Streak",    "Maintain a 3-day task completion streak",             "weekly", "easy",   "Calendar",  3,  "streak",          3,   "weekly"),
  a("five_day_streak",    "On a Roll",         "Maintain a 5-day task completion streak",             "weekly", "medium", "Award",     8,  "streak",          5,   "weekly"),
  a("seven_day_streak",   "Week Warrior",      "Complete tasks every day for a full week",            "weekly", "hard",   "Award",     20, "streak",          7,   "weekly"),
  a("ten_tasks_weekly",   "Weekly Starter",    "Complete 10 tasks in a week",                         "weekly", "easy",   "BookOpen",  3,  "task_count",      10,  "weekly"),
  a("twenty_tasks_weekly","Weekly Grinder",    "Complete 20 tasks in a week",                         "weekly", "medium", "TrendingUp",8,  "task_count",      20,  "weekly"),
  a("fifty_tasks_weekly", "Weekly Monster",    "Complete 50 tasks in a single week",                  "weekly", "expert", "Zap",       60, "task_count",      50,  "weekly", true),
  a("weekly_80pct",       "Consistency Plus",  "Hit 80% task completion rate this week",              "weekly", "medium", "TrendingUp",8,  "completion_rate", 80,  "weekly"),
  a("weekly_90pct",       "Near Perfect Week", "Hit 90% task completion rate this week",              "weekly", "hard",   "Star",      20, "completion_rate", 90,  "weekly"),

  // ══════════ MONTHLY ══════════
  a("ten_day_streak",     "Habit Forming",     "Maintain a 10-day task completion streak",            "monthly","medium", "Calendar",  8,  "streak",          10,  "monthly"),
  a("fourteen_day_streak","Two Week Titan",    "Maintain a 14-day task completion streak",            "monthly","hard",   "Crown",     20, "streak",          14,  "monthly"),
  a("thirty_day_streak",  "Undeniable",        "30-day unbroken streak — no days off",               "monthly","expert", "Crown",     60, "streak",          30,  "monthly", true),
  a("fifty_monthly",      "Monthly Machine",   "Complete 50 tasks in a month",                        "monthly","medium", "BookOpen",  8,  "task_count",      50,  "monthly"),
  a("hundred_monthly",    "Month Master",      "Complete 100 tasks in a single month",                "monthly","hard",   "Trophy",    20, "task_count",      100, "monthly"),
  a("two_hundred_monthly","Iron Month",        "Complete 200 tasks in a month",                       "monthly","expert", "Flame",     60, "task_count",      200, "monthly", true),
  a("ninety_pct_monthly", "Perfection Seeker", "Hit 90% task completion rate this month",             "monthly","hard",   "CheckCircle",20,"completion_rate", 90,  "monthly"),

  // ══════════ ALL-TIME TASK COUNT ══════════
  a("first_task",          "Journey Begins",   "Complete your very first task",                       "timeless","easy",  "Play",      3,  "task_count",      1,   "allTime"),
  a("ten_alltime",         "Double Digits",    "Complete 10 tasks total",                             "timeless","easy",  "Trophy",    3,  "task_count",      10,  "allTime"),
  a("twenty_five_alltime", "Quarter Century",  "Complete 25 tasks total",                             "timeless","easy",  "Target",    3,  "task_count",      25,  "allTime"),
  a("fifty_alltime",       "Task Enthusiast",  "Complete 50 tasks total",                             "timeless","medium","BookOpen",  8,  "task_count",      50,  "allTime"),
  a("hundred_alltime",     "Productivity Pro", "Complete 100 tasks total",                            "timeless","medium","Star",      8,  "task_count",      100, "allTime"),
  a("two_fifty_alltime",   "Task Veteran",     "Complete 250 tasks total",                            "timeless","hard",  "Award",     20, "task_count",      250, "allTime"),
  a("five_hundred_alltime","Task Legend",      "Complete 500 tasks total",                            "timeless","hard",  "Crown",     20, "task_count",      500, "allTime", true),
  a("thousand_alltime",    "Task God",         "Complete 1000 tasks total — you're elite",            "timeless","expert","Sparkles",  60, "task_count",      1000,"allTime", true),

  // ══════════ CATEGORY: WORK ══════════
  a("work_10",     "Desk Warrior",       "Complete 10 work tasks",                                    "timeless","easy",  "Target",    3,  "task_count",      10,  "allTime"),
  a("work_50",     "Corporate Machine",  "Complete 50 work tasks",                                    "timeless","medium","TrendingUp",8,  "task_count",      50,  "allTime"),
  a("work_200",    "Work Titan",         "Complete 200 work tasks",                                   "timeless","hard",  "Award",     20, "task_count",      200, "allTime"),
  a("work_500",    "Corner Office",      "Complete 500 work tasks — you don't stop",                  "timeless","expert","Crown",     60, "task_count",      500, "allTime", true),

  // ══════════ CATEGORY: HEALTH ══════════
  a("health_5",    "Wellness Starter",   "Complete 5 health tasks",                                   "timeless","easy",  "Heart",     3,  "task_count",      5,   "allTime"),
  a("health_25",   "Health Devotee",     "Complete 25 health tasks",                                  "timeless","medium","Heart",     8,  "task_count",      25,  "allTime"),
  a("health_100",  "Iron Body",          "Complete 100 health tasks",                                 "timeless","hard",  "Flame",     20, "task_count",      100, "allTime"),

  // ══════════ CATEGORY: LEARNING ══════════
  a("learn_5",     "Curious Mind",       "Complete 5 learning tasks",                                 "timeless","easy",  "BookOpen",  3,  "task_count",      5,   "allTime"),
  a("learn_30",    "Scholar",            "Complete 30 learning tasks",                                "timeless","medium","BookOpen",  8,  "task_count",      30,  "allTime"),
  a("learn_100",   "Knowledge Master",   "Complete 100 learning tasks",                               "timeless","hard",  "Star",      20, "task_count",      100, "allTime"),

  // ══════════ CATEGORY: PERSONAL ══════════
  a("personal_5",  "Life Manager",       "Complete 5 personal tasks",                                 "timeless","easy",  "Sparkles",  3,  "task_count",      5,   "allTime"),
  a("personal_25", "Balanced Life",      "Complete 25 personal tasks",                                "timeless","medium","Heart",     8,  "task_count",      25,  "allTime"),
  a("personal_100","Life Architect",     "Complete 100 personal tasks",                               "timeless","hard",  "Crown",     20, "task_count",      100, "allTime"),

  // ══════════ PRIORITY: HIGH ══════════
  a("high_5",      "Priority First",     "Complete 5 high-priority tasks",                            "timeless","easy",  "Zap",       3,  "task_count",      5,   "allTime"),
  a("high_25",     "Clutch Player",      "Complete 25 high-priority tasks",                           "timeless","medium","Flame",     8,  "task_count",      25,  "allTime"),
  a("high_100",    "Elite Executor",     "Complete 100 high-priority tasks",                          "timeless","hard",  "Award",     20, "task_count",      100, "allTime"),
  a("high_500",    "The Closer",         "Complete 500 high-priority tasks",                          "timeless","expert","Star",      60, "task_count",      500, "allTime", true),

  // ══════════ COMPLETION RATE ══════════
  a("rate_80_alltime",  "Consistency King",  "Maintain 80% completion rate all time",               "timeless","medium","TrendingUp",8,  "completion_rate", 80,  "allTime"),
  a("rate_90_alltime",  "Precision Master",  "Maintain 90% completion rate all time",               "timeless","hard",  "Target",    20, "completion_rate", 90,  "allTime"),
  a("rate_95_alltime",  "Flawless",          "Maintain 95% all-time completion rate",               "timeless","expert","Star",      60, "completion_rate", 95,  "allTime", true),

  // ══════════ POINTS MILESTONES ══════════
  a("pts_50",    "Point Starter",      "Earn 50 achievement points",                                 "timeless","easy",  "Sparkles",  3,  "points",          50),
  a("pts_200",   "Point Collector",    "Earn 200 achievement points",                                "timeless","medium","Star",      8,  "points",          200),
  a("pts_500",   "Point Hunter",       "Earn 500 achievement points",                                "timeless","medium","Trophy",    8,  "points",          500),
  a("pts_1500",  "Point Master",       "Earn 1,500 achievement points",                              "timeless","hard",  "Crown",     20, "points",          1500),
  a("pts_5000",  "Point Lord",         "Earn 5,000 achievement points",                              "timeless","expert","Crown",     60, "points",          5000, true),
  a("pts_15000", "Point Legend",       "Earn 15,000 achievement points — top 1%",                   "timeless","expert","Sparkles",  60, "points",          15000, true),

  // ══════════ TIME-BASED ══════════
  a("early_bird", "Early Bird",        "Complete a task before 8 AM",                                "timeless","easy",  "Sunrise",   3,  "custom",          1),
  a("night_owl",  "Night Owl",         "Complete a task after 10 PM",                                "timeless","easy",  "Moon",      3,  "custom",          1),
  a("speed_demon","Speed Demon",       "Complete 10 tasks before their due date",                    "timeless","medium","Zap",       8,  "custom",          10),
  a("comeback",   "Comeback King",     "Restart a 7+ day streak after breaking it",                  "timeless","hard",  "RotateCcw", 20, "custom",          1),
  a("all_nighter","All Nighter",       "Stay productive for 12+ hours in a session",                 "timeless","medium","Clock",     8,  "usage_time",      12),

  // ══════════ BLOCKCHAIN ══════════
  a("chain_pioneer",  "Chain Pioneer",    "Claim your achievement points on TON blockchain for the first time",  "timeless","medium","Link",      50, "custom",          1),
  a("chain_verified", "Chain Verified",   "Claim 500+ achievement points on-chain — blockchain native",          "timeless","hard",  "Shield",   100, "custom",          500),
  a("ton_champion",   "TON Champion",     "Claim 2,000+ points on TON — you're a blockchain productivity titan", "timeless","expert","Crown",    250, "custom",          2000),
];

// ═══════════════════════════════════════════════════════════
// COMPETITIVE LEVEL SYSTEM — much harder to climb
// ═══════════════════════════════════════════════════════════
export const ACHIEVEMENT_LEVELS = [
  { level: 1,  name: "Rookie",     requiredPoints: 0,       icon: "Zap",      color: "#8A94A6" },
  { level: 2,  name: "Apprentice", requiredPoints: 150,     icon: "Flame",    color: "#4A9EFF" },
  { level: 3,  name: "Grinder",    requiredPoints: 450,     icon: "Zap",      color: "#22C55E" },
  { level: 4,  name: "Strategist", requiredPoints: 1000,    icon: "Target",   color: "#A855F7" },
  { level: 5,  name: "Pro",        requiredPoints: 2500,    icon: "Star",     color: "#F59E0B" },
  { level: 6,  name: "Elite",      requiredPoints: 5500,    icon: "Award",    color: "#F97316" },
  { level: 7,  name: "Master",     requiredPoints: 11000,   icon: "Crown",    color: "#EF4444" },
  { level: 8,  name: "Champion",   requiredPoints: 22000,   icon: "Trophy",   color: "#EC4899" },
  { level: 9,  name: "Legend",     requiredPoints: 45000,   icon: "Sparkles", color: "#8B5CF6" },
  { level: 10, name: "Mythic",     requiredPoints: 100000,  icon: "Zap",      color: "#FFD700" },
];
