import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Task, TaskCategory, AIInsight, UserStats } from "@/types/tasks";
import { API_BASE_URL } from "@/constants/api";

interface TasksState {
  tasks: Task[];
  insights: AIInsight[];
  isLoading: boolean;
  isGeneratingInsights: boolean;
  addTask: (task: Omit<Task, "id" | "createdAt">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  getTasksByDate: (date: Date) => Task[];
  getTasksByCategory: (category: TaskCategory) => Task[];
  getTodayTasks: () => Task[];
  getCompletedTasks: () => Task[];
  getPendingTasks: () => Task[];
  getStats: () => Promise<UserStats>;
  generateInsights: () => Promise<void>;
  syncTasksToBackend: (userId: string) => Promise<void>;
}

const STORAGE_KEY = "@tonic_tasks";
const INSIGHTS_KEY = "@tonic_insights";

function useTasksProvider(): TasksState {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const longestStreakRef = useRef(0);
  const insightCooldownRef = useRef(0);

  const loadTasks = useCallback(async () => {
    try {
      const [storedTasks, storedInsights, storedLongest] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(INSIGHTS_KEY),
        AsyncStorage.getItem("@tonic_longest_streak"),
      ]);

      if (storedLongest) {
        longestStreakRef.current = parseInt(storedLongest, 10) || 0;
      }

      if (storedTasks) {
        const parsed = JSON.parse(storedTasks) as Task[];
        setTasks(parsed.map((t) => ({
          ...t,
          dueDate: new Date(t.dueDate),
          createdAt: new Date(t.createdAt),
          completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
        })));
      }

      if (storedInsights) {
        const parsed = JSON.parse(storedInsights) as AIInsight[];
        setInsights(parsed.map((i) => ({
          ...i,
          createdAt: new Date(i.createdAt),
        })));
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const saveTasks = useCallback(async (currentTasks: Task[], currentInsights: AIInsight[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currentTasks));
      await AsyncStorage.setItem(INSIGHTS_KEY, JSON.stringify(currentInsights));
    } catch (error) {
      console.error("Error saving tasks:", error);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      void saveTasks(tasks, insights);
    }
  }, [tasks, insights, isLoading, saveTasks]);

  const addTask = useCallback((taskData: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...taskData,
      id: uuidv4(),
      createdAt: new Date(),
    };
    setTasks((prev) => [newTask, ...prev]);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updates } : task))
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const toggleTaskStatus = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              status: task.status === "completed" ? "pending" : "completed",
              completedAt: task.status !== "completed" ? new Date() : undefined,
            }
          : task
      )
    );
  }, []);

  const getTasksByDate = useCallback((date: Date) => {
    return tasks.filter(
      (task) => new Date(task.dueDate).toDateString() === date.toDateString()
    );
  }, [tasks]);

  const getTasksByCategory = useCallback((category: TaskCategory) => {
    return tasks.filter((task) => task.category === category);
  }, [tasks]);

  const getTodayTasks = useCallback(() => {
    return getTasksByDate(new Date());
  }, [getTasksByDate]);

  const getCompletedTasks = useCallback(() => {
    return tasks.filter((task) => task.status === "completed");
  }, [tasks]);

  const getPendingTasks = useCallback(() => {
    return tasks.filter((task) => task.status !== "completed");
  }, [tasks]);

  const calculateStreak = useCallback(() => {
    const completed = tasks.filter((t) => t.status === "completed");
    if (completed.length === 0) return 0;

    const today = new Date();
    let streak = 0;
    const checkDate = new Date(today);

    while (true) {
      const hasCompletedTask = completed.some(
        (t) =>
          t.completedAt &&
          new Date(t.completedAt).toDateString() === checkDate.toDateString()
      );
      if (hasCompletedTask) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (checkDate.toDateString() === today.toDateString()) {
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, [tasks]);

  const getStats = useCallback(async (): Promise<UserStats> => {
    const completed = getCompletedTasks();
    const streak = calculateStreak();

    if (streak > longestStreakRef.current) {
      longestStreakRef.current = streak;
      await AsyncStorage.setItem("@tonic_longest_streak", streak.toString());
    }

    const weeklyCompletion: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const count = tasks.filter(
        (t) =>
          t.status === "completed" &&
          t.completedAt &&
          new Date(t.completedAt).toDateString() === date.toDateString()
      ).length;
      weeklyCompletion.push(count);
    }

    const completionRate = tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0;
    const streakBonus = Math.min(streak * 5, 30);
    const productivityScore = Math.min(Math.round(completionRate + streakBonus), 100);

    return {
      tasksCompleted: completed.length,
      tasksCreated: tasks.length,
      currentStreak: streak,
      longestStreak: longestStreakRef.current,
      productivityScore,
      weeklyCompletion,
    };
  }, [tasks, getCompletedTasks, calculateStreak]);

  const generateInsights = useCallback(async () => {
    const now = Date.now();
    if (now - insightCooldownRef.current < 30000) return;
    insightCooldownRef.current = now;

    setIsGeneratingInsights(true);
    try {
      const stats = await getStats();

      const response = await fetch(`${API_BASE_URL}/api/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            category: t.category,
            priority: t.priority,
            status: t.status,
            dueDate: t.dueDate,
            completedAt: t.completedAt,
          })),
          stats,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json() as { insights: AIInsight[] };

      if (Array.isArray(data.insights) && data.insights.length > 0) {
        const newInsights: AIInsight[] = data.insights.map((i: any) => ({
          id: i.id || uuidv4(),
          type: i.type || "suggestion",
          title: i.title || "Insight",
          description: i.description || "",
          icon: i.icon || "brain",
          priority: i.priority || "medium",
          createdAt: new Date(),
        }));
        setInsights(newInsights);
        return;
      }
    } catch (error) {
      console.warn("AI insights API unavailable, using local fallback:", error);
    } finally {
      setIsGeneratingInsights(false);
    }

    const fallbackInsights = generateFallbackInsights(tasks, getPendingTasks(), getCompletedTasks());
    setInsights(fallbackInsights);
  }, [tasks, getStats, getPendingTasks, getCompletedTasks]);

  const syncTasksToBackend = useCallback(async (userId: string) => {
    if (!userId || tasks.length === 0) return;
    try {
      await fetch(`${API_BASE_URL}/api/tasks/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          tasks: tasks.map((t) => ({
            id: t.id,
            userId,
            title: t.title,
            description: t.description,
            category: t.category,
            priority: t.priority,
            status: t.status,
            dueDate: t.dueDate,
            createdAt: t.createdAt,
            completedAt: t.completedAt || null,
          })),
        }),
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      console.warn("Task sync failed (offline mode):", error);
    }
  }, [tasks]);

  useEffect(() => {
    if (!isLoading) {
      void generateInsights();
    }
  }, [isLoading]);

  return useMemo(
    () => ({
      tasks,
      insights,
      isLoading,
      isGeneratingInsights,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskStatus,
      getTasksByDate,
      getTasksByCategory,
      getTodayTasks,
      getCompletedTasks,
      getPendingTasks,
      getStats,
      generateInsights,
      syncTasksToBackend,
    }),
    [
      tasks,
      insights,
      isLoading,
      isGeneratingInsights,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskStatus,
      getTasksByDate,
      getTasksByCategory,
      getTodayTasks,
      getCompletedTasks,
      getPendingTasks,
      getStats,
      generateInsights,
      syncTasksToBackend,
    ]
  );
}

function generateFallbackInsights(
  tasks: Task[],
  pending: Task[],
  completed: Task[]
): AIInsight[] {
  const insights: AIInsight[] = [];
  const hour = new Date().getHours();

  let focusTitle = "Deep Work Session";
  let focusDesc = "Peak focus time — tackle your most complex high-priority tasks now.";
  if (hour >= 11 && hour < 14) {
    focusTitle = "Midday Momentum";
    focusDesc = "Great time for collaborative tasks and quick wins while energy holds steady.";
  } else if (hour >= 14 && hour < 18) {
    focusTitle = "Afternoon Sprint";
    focusDesc = "Power through remaining tasks with Pomodoro technique for sustained focus.";
  } else if (hour >= 18) {
    focusTitle = "Evening Planning";
    focusDesc = "Perfect time to review today's progress and plan tomorrow's priorities.";
  }

  insights.push({
    id: "focus",
    type: "focus",
    title: focusTitle,
    description: focusDesc,
    icon: "target",
    priority: "high",
    createdAt: new Date(),
  });

  const highPriorityPending = pending.filter((t) => t.priority === "high");
  if (highPriorityPending.length >= 3) {
    insights.push({
      id: "workload",
      type: "warning",
      title: "Workload Alert",
      description: `${highPriorityPending.length} high-priority tasks are pending. Reschedule lower-priority items to focus.`,
      icon: "alert",
      priority: "high",
      createdAt: new Date(),
    });
  }

  const recentCompletions = completed.filter(
    (t) => t.completedAt && new Date(t.completedAt).getTime() > Date.now() - 7 * 86400000
  );
  if (recentCompletions.length >= 5) {
    insights.push({
      id: "pattern",
      type: "pattern",
      title: "Consistency Champion",
      description: `${recentCompletions.length} tasks completed this week — your momentum is building strong!`,
      icon: "trending",
      priority: "medium",
      createdAt: new Date(),
    });
  }

  if (tasks.length > 0) {
    const completionRate = Math.round((completed.length / tasks.length) * 100);
    if (completionRate < 40) {
      insights.push({
        id: "balance",
        type: "suggestion",
        title: "Completion Opportunity",
        description: `${completionRate}% completion rate — try breaking large tasks into smaller, achievable steps.`,
        icon: "brain",
        priority: "medium",
        createdAt: new Date(),
      });
    }
  }

  return insights;
}

export const [TasksProvider, useTasks] = createContextHook(useTasksProvider);
