import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Achievement,
  AchievementState,
  AchievementStats,
  AchievementLevel,
} from "@/types/achievements";
import { ACHIEVEMENTS, ACHIEVEMENT_LEVELS } from "@/constants/achievements";
import { useTasks } from "./TasksProvider";

interface AchievementsContextType {
  achievements: Achievement[];
  stats: AchievementStats;
  isLoading: boolean;
  filterByCategory: (category: string) => Achievement[];
  filterByDifficulty: (difficulty: string) => Achievement[];
  filterByStatus: (unlocked: boolean) => Achievement[];
  getAchievementsByFilter: (
    category?: string,
    difficulty?: string,
    unlocked?: boolean
  ) => Achievement[];
  getCurrentLevel: () => AchievementLevel;
  getTotalPoints: () => number;
  checkAndUpdateAchievements: () => Promise<void>;
}

const AchievementsContext = createContext<AchievementsContextType | undefined>(undefined);

export const AchievementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats>({
    totalPoints: 0,
    currentLevel: {
      level: ACHIEVEMENT_LEVELS[0].level,
      name: ACHIEVEMENT_LEVELS[0].name,
      requiredPoints: ACHIEVEMENT_LEVELS[0].requiredPoints,
      icon: ACHIEVEMENT_LEVELS[0].icon,
      color: ACHIEVEMENT_LEVELS[0].color,
      unlocked: true,
      currentPoints: 0,
      nextLevelPoints: ACHIEVEMENT_LEVELS[1]?.requiredPoints || 100,
    },
    totalUnlocked: 0,
    categoryCounts: { daily: 0, weekly: 0, monthly: 0, timeless: 0 },
    difficultyCounts: { easy: 0, medium: 0, hard: 0, expert: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const { tasks, getStats } = useTasks();

  // Load achievements from storage on mount
  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const stored = await AsyncStorage.getItem("@tonic_achievements");
        if (stored) {
          const parsed = JSON.parse(stored) as AchievementState;
          setAchievements(parsed.achievements);
          setStats(parsed.stats);
        } else {
          // Initialize with fresh achievements
          setAchievements(ACHIEVEMENTS);
          await saveAchievements(ACHIEVEMENTS, stats);
        }
      } catch (error) {
        console.error("Failed to load achievements:", error);
        setAchievements(ACHIEVEMENTS);
      } finally {
        setIsLoading(false);
      }
    };

    loadAchievements();
  }, []);

  // Save achievements to storage
  const saveAchievements = useCallback(
    async (achvs: Achievement[], newStats: AchievementStats) => {
      try {
        const state: AchievementState = {
          achievements: achvs,
          stats: newStats,
          lastUpdated: new Date().toISOString(),
        };
        await AsyncStorage.setItem("@tonic_achievements", JSON.stringify(state));
      } catch (error) {
        console.error("Failed to save achievements:", error);
      }
    },
    []
  );

  // Calculate achievement progress and unlock status
  const checkAndUpdateAchievements = useCallback(async () => {
    try {
      const taskStats = await getStats();
      const completedTasks = tasks.filter((t) => t.status === "completed");
      const totalTasks = tasks.length;
      const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Count tasks by period
      const tasksToday = tasks.filter((t) => {
        const taskDate = new Date(t.dueDate);
        return (
          taskDate.getFullYear() === today.getFullYear() &&
          taskDate.getMonth() === today.getMonth() &&
          taskDate.getDate() === today.getDate()
        );
      }).length;

      const tasksThisWeek = tasks.filter((t) => {
        const taskDate = new Date(t.dueDate);
        return taskDate >= weekStart && taskDate <= now;
      }).length;

      const tasksThisMonth = tasks.filter((t) => {
        const taskDate = new Date(t.dueDate);
        return (
          taskDate.getFullYear() === monthStart.getFullYear() &&
          taskDate.getMonth() === monthStart.getMonth()
        );
      }).length;

      const completedToday = tasks.filter(
        (t) =>
          t.status === "completed" &&
          t.completedAt &&
          new Date(t.completedAt).getTime() >= today.getTime()
      ).length;

      const completedThisWeek = tasks.filter(
        (t) =>
          t.status === "completed" &&
          t.completedAt &&
          new Date(t.completedAt) >= weekStart
      ).length;

      const completedThisMonth = tasks.filter(
        (t) =>
          t.status === "completed" &&
          t.completedAt &&
          new Date(t.completedAt) >= monthStart
      ).length;

      const completionRateDaily = tasksToday > 0 ? (completedToday / tasksToday) * 100 : 0;
      const completionRateWeekly = tasksThisWeek > 0 ? (completedThisWeek / tasksThisWeek) * 100 : 0;
      const completionRateMonthly = tasksThisMonth > 0 ? (completedThisMonth / tasksThisMonth) * 100 : 0;

      // Update achievements
      const updated = achievements.map((achievement) => {
        let newProgress = achievement.progress;
        let shouldUnlock = false;

        const { condition } = achievement;

        // Calculate progress based on condition type
        if (condition.type === "task_count") {
          let count = 0;
          if (condition.metric === "daily") count = completedToday;
          else if (condition.metric === "weekly") count = completedThisWeek;
          else if (condition.metric === "monthly") count = completedThisMonth;
          else if (condition.metric === "allTime") count = completedTasks.length;

          newProgress = Math.min((count / condition.target) * 100, 100);
          shouldUnlock = count >= condition.target;
        } else if (condition.type === "completion_rate") {
          let rate = 0;
          if (condition.metric === "daily") rate = completionRateDaily;
          else if (condition.metric === "weekly") rate = completionRateWeekly;
          else if (condition.metric === "monthly") rate = completionRateMonthly;
          else if (condition.metric === "allTime") rate = completionRate;

          newProgress = Math.min((rate / condition.target) * 100, 100);
          shouldUnlock = rate >= condition.target;
        } else if (condition.type === "streak") {
          let streakValue = 0;
          if (condition.metric === "weekly") streakValue = taskStats.currentStreak % 7;
          else if (condition.metric === "monthly") streakValue = taskStats.currentStreak % 30;
          else streakValue = taskStats.currentStreak;

          newProgress = Math.min((streakValue / condition.target) * 100, 100);
          shouldUnlock = streakValue >= condition.target;
        } else if (condition.type === "points") {
          // Points will be calculated after all achievements are updated
          newProgress = 0;
        } else if (condition.type === "usage_time") {
          // This requires more context from user session data
          newProgress = achievement.progress;
        } else if (condition.type === "custom") {
          // Custom conditions handled by specific logic
          newProgress = achievement.progress;
        }

        return {
          ...achievement,
          progress: newProgress,
          unlocked: shouldUnlock || achievement.unlocked,
          unlockedAt: shouldUnlock && !achievement.unlocked ? new Date().toISOString() : achievement.unlockedAt,
        };
      });

      // Calculate total points based on unlocked achievements
      const totalPoints = updated.reduce((sum, achievement) => {
        if (achievement.unlocked) {
          const earnedPoints = achievement.basePoints * achievement.difficultyMultiplier;
          return sum + earnedPoints;
        }
        return sum;
      }, 0);

      // Update points-based achievements
      const finalAchievements = updated.map((achievement) => {
        if (achievement.condition.type === "points") {
          const newProgress = Math.min((totalPoints / achievement.condition.target) * 100, 100);
          return {
            ...achievement,
            progress: newProgress,
            unlocked: totalPoints >= achievement.condition.target || achievement.unlocked,
            unlockedAt:
              totalPoints >= achievement.condition.target && !achievement.unlocked
                ? new Date().toISOString()
                : achievement.unlockedAt,
          };
        }
        return achievement;
      });

      // Calculate stats
      const totalUnlocked = finalAchievements.filter((a) => a.unlocked).length;
      const categoryCounts = {
        daily: finalAchievements.filter((a) => a.category === "daily" && a.unlocked).length,
        weekly: finalAchievements.filter((a) => a.category === "weekly" && a.unlocked).length,
        monthly: finalAchievements.filter((a) => a.category === "monthly" && a.unlocked).length,
        timeless: finalAchievements.filter((a) => a.category === "timeless" && a.unlocked).length,
      };
      const difficultyCounts = {
        easy: finalAchievements.filter((a) => a.difficulty === "easy" && a.unlocked).length,
        medium: finalAchievements.filter((a) => a.difficulty === "medium" && a.unlocked).length,
        hard: finalAchievements.filter((a) => a.difficulty === "hard" && a.unlocked).length,
        expert: finalAchievements.filter((a) => a.difficulty === "expert" && a.unlocked).length,
      };

      // Calculate current level
      const currentLevel = ACHIEVEMENT_LEVELS.reduce((prev, level) => {
        return totalPoints >= level.requiredPoints ? level : prev;
      });

      const newStats: AchievementStats = {
        totalPoints,
        currentLevel: {
          level: currentLevel.level,
          name: currentLevel.name,
          requiredPoints: currentLevel.requiredPoints,
          icon: currentLevel.icon,
          color: currentLevel.color,
          unlocked: true,
          currentPoints: totalPoints,
          nextLevelPoints:
            ACHIEVEMENT_LEVELS.find((l) => l.level === currentLevel.level + 1)?.requiredPoints ||
            currentLevel.requiredPoints + 1000,
        },
        totalUnlocked,
        categoryCounts,
        difficultyCounts,
      };

      setAchievements(finalAchievements);
      setStats(newStats);
      await saveAchievements(finalAchievements, newStats);
    } catch (error) {
      console.error("Failed to check achievements:", error);
    }
  }, [tasks, achievements, getStats, saveAchievements]);

  // Check achievements when tasks change
  useEffect(() => {
    if (!isLoading && tasks.length >= 0) {
      void checkAndUpdateAchievements();
    }
  }, [tasks, isLoading]); // Remove checkAndUpdateAchievements from dependencies to prevent infinite loop

  const filterByCategory = useCallback((category: string) => {
    return achievements.filter((a) => a.category === category);
  }, [achievements]);

  const filterByDifficulty = useCallback((difficulty: string) => {
    return achievements.filter((a) => a.difficulty === difficulty);
  }, [achievements]);

  const filterByStatus = useCallback((unlocked: boolean) => {
    return achievements.filter((a) => a.unlocked === unlocked);
  }, [achievements]);

  const getAchievementsByFilter = useCallback(
    (category?: string, difficulty?: string, unlocked?: boolean) => {
      return achievements.filter((a) => {
        if (category && a.category !== category) return false;
        if (difficulty && a.difficulty !== difficulty) return false;
        if (unlocked !== undefined && a.unlocked !== unlocked) return false;
        return true;
      });
    },
    [achievements]
  );

  const getCurrentLevel = useCallback(() => {
    return stats.currentLevel;
  }, [stats]);

  const getTotalPoints = useCallback(() => {
    return stats.totalPoints;
  }, [stats]);

  const value: AchievementsContextType = {
    achievements,
    stats,
    isLoading,
    filterByCategory,
    filterByDifficulty,
    filterByStatus,
    getAchievementsByFilter,
    getCurrentLevel,
    getTotalPoints,
    checkAndUpdateAchievements,
  };

  return (
    <AchievementsContext.Provider value={value}>{children}</AchievementsContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementsContext);
  if (!context) {
    throw new Error("useAchievements must be used within AchievementsProvider");
  }
  return context;
};
