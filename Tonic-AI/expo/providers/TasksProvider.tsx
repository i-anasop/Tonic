import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Task, TaskCategory, AIInsight, UserStats } from "@/types/tasks";

interface TasksState {
  tasks: Task[];
  insights: AIInsight[];
  isLoading: boolean;
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
  generateInsights: () => void;
}

const STORAGE_KEY = "@tonic_tasks";
const INSIGHTS_KEY = "@tonic_insights";

function useTasksProvider(): TasksState {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const longestStreakRef = useRef(0);

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

  const saveTasks = useCallback(async () => {
    try {
      console.log("💾 Saving", tasks.length, "tasks to AsyncStorage");
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      await AsyncStorage.setItem(INSIGHTS_KEY, JSON.stringify(insights));
      console.log("✏️ Saved successfully");
    } catch (error) {
      console.error("❌ Error saving tasks:", error);
    }
  }, [tasks, insights]);

  useEffect(() => {
    if (!isLoading) {
      void saveTasks();
    }
  }, [tasks, insights, isLoading, saveTasks]);

  const addTask = useCallback((taskData: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...taskData,
      id: uuidv4(),
      createdAt: new Date(),
    };
    console.log("📝 Adding task:", newTask.title, "Due:", newTask.dueDate);
    setTasks((prev) => {
      const updated = [newTask, ...prev];
      console.log("✅ Tasks updated. Total tasks:", updated.length);
      return updated;
    });
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      )
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
    const today = getTasksByDate(new Date());
    console.log("📅 Today's tasks:", today.length, "tasks");
    today.forEach((t) => {
      console.log(`  - ${t.title} (Due: ${t.dueDate.toDateString()})`);
    });
    return today;
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

  const generateInsights = useCallback(() => {
    const newInsights: AIInsight[] = [];
    const pending = getPendingTasks();
    const today = new Date();

    const hour = today.getHours();
    let focusTitle = "Deep Work Session";
    let focusDesc = "Your peak productivity window is 9-11 AM. Focus on high-priority tasks during this time.";

    if (hour >= 11 && hour < 14) {
      focusTitle = "Midday Momentum";
      focusDesc = "Great time for collaborative tasks and quick wins while energy is steady.";
    } else if (hour >= 14 && hour < 18) {
      focusTitle = "Afternoon Sprint";
      focusDesc = "Power through remaining tasks. Consider the Pomodoro technique for focus.";
    } else if (hour >= 18) {
      focusTitle = "Evening Wind-down";
      focusDesc = "Perfect time for planning tomorrow and light review tasks.";
    }

    newInsights.push({
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
      newInsights.push({
        id: "workload",
        type: "warning",
        title: "Workload Alert",
        description: `You have ${highPriorityPending.length} high-priority tasks pending. Consider rescheduling lower priority items.`,
        icon: "alert",
        priority: "high",
        createdAt: new Date(),
      });
    }

    const completed = getCompletedTasks();
    if (completed.length > 5) {
      const recentCompletions = completed.filter(
        (t) =>
          t.completedAt &&
          new Date(t.completedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      );
      if (recentCompletions.length >= 5) {
        newInsights.push({
          id: "pattern",
          type: "pattern",
          title: "Consistency Champion",
          description: "You've completed 5+ tasks this week. Your productivity pattern shows strong momentum!",
          icon: "trending",
          priority: "medium",
          createdAt: new Date(),
        });
      }
    }

    const categories = ["work", "personal", "health", "learning"] as const;
    const categoryCounts = categories.map((cat) => ({
      category: cat,
      count: pending.filter((t) => t.category === cat).length,
    }));
    const maxCategory = categoryCounts.reduce((max, c) =>
      c.count > max.count ? c : max
    );
    if (maxCategory.count > 5) {
      const balanceSuggestions: Record<string, string> = {
        work: "Consider taking a break for personal activities to maintain balance.",
        personal: "Great work-life balance! Maybe focus on some professional goals too.",
        health: "Prioritizing wellness is great! Don't forget your other commitments.",
        learning: "Love the growth mindset! Balance with execution on current tasks.",
      };
      newInsights.push({
        id: "balance",
        type: "suggestion",
        title: "Category Balance",
        description: balanceSuggestions[maxCategory.category],
        icon: "balance",
        priority: "low",
        createdAt: new Date(),
      });
    }

    setInsights(newInsights);
  }, [getPendingTasks, getCompletedTasks]);

  useEffect(() => {
    if (!isLoading) {
      generateInsights();
    }
  }, [tasks, isLoading]);

  return useMemo(() => ({
    tasks,
    insights,
    isLoading,
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
  }), [tasks, insights, isLoading, addTask, updateTask, deleteTask, toggleTaskStatus, getTasksByDate, getTasksByCategory, getTodayTasks, getCompletedTasks, getPendingTasks, getStats, generateInsights]);
}

export const [TasksProvider, useTasks] = createContextHook(useTasksProvider);
