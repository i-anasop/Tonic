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

// Minimum task counts before completion-rate achievements can trigger
const MIN_TASKS: Record<string, number> = {
  daily: 5,
  weekly: 10,
  monthly: 20,
  allTime: 10,
};

interface AchievementsContextType {
  achievements: Achievement[];
  stats: AchievementStats;
  isLoading: boolean;
  filterByCategory: (category: string) => Achievement[];
  filterByDifficulty: (difficulty: string) => Achievement[];
  filterByStatus: (unlocked: boolean) => Achievement[];
  getAchievementsByFilter: (category?: string, difficulty?: string, unlocked?: boolean) => Achievement[];
  getCurrentLevel: () => AchievementLevel;
  getTotalPoints: () => number;
  checkAndUpdateAchievements: () => Promise<void>;
  claimPoints: (viaWallet: boolean) => Promise<void>;
  claimedAchievementIds: string[];
  claimAchievement: (id: string, viaWallet: boolean) => Promise<void>;
}

const AchievementsContext = createContext<AchievementsContextType | undefined>(undefined);

const buildDefaultStats = (claimedPoints = 0): AchievementStats => ({
  totalPoints: 0,
  claimedPoints,
  pendingPoints: 0,
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

export const AchievementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats>(buildDefaultStats());
  const [claimedPointsState, setClaimedPointsState] = useState(0);
  const [claimedAchievementIds, setClaimedAchievementIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { tasks, getStats } = useTasks();

  useEffect(() => {
    const load = async () => {
      try {
        const [stored, storedClaimedIds] = await Promise.all([
          AsyncStorage.getItem("@tonic_achievements_v2"),
          AsyncStorage.getItem("@tonic_claimed_ids"),
        ]);
        if (storedClaimedIds) {
          try { setClaimedAchievementIds(JSON.parse(storedClaimedIds)); } catch {}
        }
        if (stored) {
          const parsed = JSON.parse(stored) as AchievementState;
          const claimed = parsed.claimedPoints ?? 0;
          setAchievements(parsed.achievements);
          setClaimedPointsState(claimed);
          setStats({ ...parsed.stats, claimedPoints: claimed });
        } else {
          setAchievements(ACHIEVEMENTS);
          await saveAchievements(ACHIEVEMENTS, buildDefaultStats(), 0);
        }
      } catch {
        setAchievements(ACHIEVEMENTS);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const saveAchievements = useCallback(
    async (achvs: Achievement[], newStats: AchievementStats, claimed: number) => {
      try {
        const state: AchievementState = {
          achievements: achvs,
          stats: newStats,
          claimedPoints: claimed,
          lastUpdated: new Date().toISOString(),
        };
        await AsyncStorage.setItem("@tonic_achievements_v2", JSON.stringify(state));
      } catch (err) {
        console.error("Failed to save achievements:", err);
      }
    },
    []
  );

  const buildStats = useCallback(
    (finalAchievements: Achievement[], claimed: number): AchievementStats => {
      const totalPoints = finalAchievements.reduce((sum, a) => {
        return a.unlocked ? sum + a.basePoints * a.difficultyMultiplier : sum;
      }, 0);

      const pending = Math.max(0, totalPoints - claimed);

      const currentLevel = ACHIEVEMENT_LEVELS.reduce((prev, level) => {
        return claimed >= level.requiredPoints ? level : prev;
      });

      return {
        totalPoints,
        claimedPoints: claimed,
        pendingPoints: pending,
        currentLevel: {
          level: currentLevel.level,
          name: currentLevel.name,
          requiredPoints: currentLevel.requiredPoints,
          icon: currentLevel.icon,
          color: currentLevel.color,
          unlocked: true,
          currentPoints: claimed,
          nextLevelPoints:
            ACHIEVEMENT_LEVELS.find((l) => l.level === currentLevel.level + 1)?.requiredPoints ||
            currentLevel.requiredPoints + 1000,
        },
        totalUnlocked: finalAchievements.filter((a) => a.unlocked).length,
        categoryCounts: {
          daily: finalAchievements.filter((a) => a.category === "daily" && a.unlocked).length,
          weekly: finalAchievements.filter((a) => a.category === "weekly" && a.unlocked).length,
          monthly: finalAchievements.filter((a) => a.category === "monthly" && a.unlocked).length,
          timeless: finalAchievements.filter((a) => a.category === "timeless" && a.unlocked).length,
        },
        difficultyCounts: {
          easy: finalAchievements.filter((a) => a.difficulty === "easy" && a.unlocked).length,
          medium: finalAchievements.filter((a) => a.difficulty === "medium" && a.unlocked).length,
          hard: finalAchievements.filter((a) => a.difficulty === "hard" && a.unlocked).length,
          expert: finalAchievements.filter((a) => a.difficulty === "expert" && a.unlocked).length,
        },
      };
    },
    []
  );

  const checkAndUpdateAchievements = useCallback(async () => {
    try {
      const taskStats = await getStats();
      const completedTasks = tasks.filter((t) => t.status === "completed");
      const totalTasks = tasks.length;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const tasksToday = tasks.filter((t) => {
        const d = new Date(t.dueDate);
        return d.toDateString() === today.toDateString();
      }).length;

      const tasksThisWeek = tasks.filter((t) => {
        const d = new Date(t.dueDate);
        return d >= weekStart && d <= now;
      }).length;

      const tasksThisMonth = tasks.filter((t) => {
        const d = new Date(t.dueDate);
        return d.getFullYear() === monthStart.getFullYear() && d.getMonth() === monthStart.getMonth();
      }).length;

      const completedToday = tasks.filter(
        (t) => t.status === "completed" && t.completedAt && new Date(t.completedAt) >= today
      ).length;

      const completedThisWeek = tasks.filter(
        (t) => t.status === "completed" && t.completedAt && new Date(t.completedAt) >= weekStart
      ).length;

      const completedThisMonth = tasks.filter(
        (t) => t.status === "completed" && t.completedAt && new Date(t.completedAt) >= monthStart
      ).length;

      // Completion rates — only count when minimum tasks exist (prevents 1-task gaming)
      const rateDaily   = tasksToday    >= MIN_TASKS.daily   ? (completedToday    / tasksToday)    * 100 : 0;
      const rateWeekly  = tasksThisWeek >= MIN_TASKS.weekly  ? (completedThisWeek / tasksThisWeek) * 100 : 0;
      const rateMonthly = tasksThisMonth>= MIN_TASKS.monthly ? (completedThisMonth/ tasksThisMonth)* 100 : 0;
      const rateAllTime = totalTasks    >= MIN_TASKS.allTime  ? (completedTasks.length / totalTasks) * 100 : 0;

      // First pass — update task_count, completion_rate, streak achievements
      const pass1 = achievements.map((achievement) => {
        const { condition } = achievement;
        let newProgress = achievement.progress;
        let shouldUnlock = false;

        if (condition.type === "task_count") {
          let count = 0;
          if (condition.metric === "daily")    count = completedToday;
          else if (condition.metric === "weekly")  count = completedThisWeek;
          else if (condition.metric === "monthly") count = completedThisMonth;
          else if (condition.metric === "allTime") count = completedTasks.length;
          newProgress = Math.min((count / condition.target) * 100, 100);
          shouldUnlock = count >= condition.target;

        } else if (condition.type === "completion_rate") {
          let rate = 0;
          if (condition.metric === "daily")    rate = rateDaily;
          else if (condition.metric === "weekly")  rate = rateWeekly;
          else if (condition.metric === "monthly") rate = rateMonthly;
          else if (condition.metric === "allTime") rate = rateAllTime;
          newProgress = Math.min((rate / condition.target) * 100, 100);
          shouldUnlock = rate >= condition.target;

        } else if (condition.type === "streak") {
          let streakValue = taskStats.currentStreak;
          if (condition.metric === "weekly")  streakValue = taskStats.currentStreak % 7;
          else if (condition.metric === "monthly") streakValue = taskStats.currentStreak % 30;
          newProgress = Math.min((streakValue / condition.target) * 100, 100);
          shouldUnlock = streakValue >= condition.target;

        } else if (condition.type === "points") {
          // Handled in pass2 against claimedPoints
          newProgress = achievement.progress;
        } else {
          newProgress = achievement.progress;
        }

        return {
          ...achievement,
          progress: newProgress,
          unlocked: shouldUnlock || achievement.unlocked,
          unlockedAt: shouldUnlock && !achievement.unlocked ? now.toISOString() : achievement.unlockedAt,
        };
      });

      // Compute claimedPoints from state (use current value, not recalculated)
      const currentClaimed = claimedPointsState;

      // Second pass — update points-based achievements using claimedPoints
      const pass2 = pass1.map((achievement) => {
        if (achievement.condition.type === "points") {
          const newProgress = Math.min((currentClaimed / achievement.condition.target) * 100, 100);
          const shouldUnlock = currentClaimed >= achievement.condition.target;
          return {
            ...achievement,
            progress: newProgress,
            unlocked: shouldUnlock || achievement.unlocked,
            unlockedAt: shouldUnlock && !achievement.unlocked ? now.toISOString() : achievement.unlockedAt,
          };
        }
        return achievement;
      });

      const newStats = buildStats(pass2, currentClaimed);
      setAchievements(pass2);
      setStats(newStats);
      await saveAchievements(pass2, newStats, currentClaimed);
    } catch (err) {
      console.error("Failed to check achievements:", err);
    }
  }, [tasks, achievements, claimedPointsState, getStats, saveAchievements, buildStats]);

  useEffect(() => {
    if (!isLoading && tasks.length >= 0) {
      void checkAndUpdateAchievements();
    }
  }, [tasks, isLoading]);

  // Claim pending points — viaWallet = 2× multiplier
  const claimPoints = useCallback(
    async (viaWallet: boolean) => {
      const pending = stats.pendingPoints;
      if (pending <= 0) return;

      const multiplier = viaWallet ? 2 : 1;
      const gain = pending * multiplier;
      const newClaimed = claimedPointsState + gain;

      setClaimedPointsState(newClaimed);

      // Re-run pass2 to check points achievements with new claimed value
      const now = new Date();
      const updatedAchievements = achievements.map((a) => {
        if (a.condition.type === "points") {
          const shouldUnlock = newClaimed >= a.condition.target;
          return {
            ...a,
            progress: Math.min((newClaimed / a.condition.target) * 100, 100),
            unlocked: shouldUnlock || a.unlocked,
            unlockedAt: shouldUnlock && !a.unlocked ? now.toISOString() : a.unlockedAt,
          };
        }
        return a;
      });

      const newStats = buildStats(updatedAchievements, newClaimed);
      setAchievements(updatedAchievements);
      setStats(newStats);
      await saveAchievements(updatedAchievements, newStats, newClaimed);
    },
    [stats.pendingPoints, claimedPointsState, achievements, buildStats, saveAchievements]
  );

  const filterByCategory = useCallback((category: string) => achievements.filter((a) => a.category === category), [achievements]);
  const filterByDifficulty = useCallback((difficulty: string) => achievements.filter((a) => a.difficulty === difficulty), [achievements]);
  const filterByStatus = useCallback((unlocked: boolean) => achievements.filter((a) => a.unlocked === unlocked), [achievements]);
  const getAchievementsByFilter = useCallback(
    (category?: string, difficulty?: string, unlocked?: boolean) =>
      achievements.filter((a) => {
        if (category && a.category !== category) return false;
        if (difficulty && a.difficulty !== difficulty) return false;
        if (unlocked !== undefined && a.unlocked !== unlocked) return false;
        return true;
      }),
    [achievements]
  );
  const claimAchievement = useCallback(
    async (id: string, viaWallet: boolean) => {
      const achievement = achievements.find((a) => a.id === id);
      if (!achievement || !achievement.unlocked || claimedAchievementIds.includes(id)) return;

      const earned = Math.round(achievement.basePoints * achievement.difficultyMultiplier);
      const multiplier = viaWallet ? 2 : 1;
      const gain = earned * multiplier;
      const newClaimed = claimedPointsState + gain;
      const newClaimedIds = [...claimedAchievementIds, id];

      setClaimedAchievementIds(newClaimedIds);
      setClaimedPointsState(newClaimed);

      const updatedAchievements = achievements.map((a) => {
        if (a.condition.type === "points") {
          return {
            ...a,
            progress: Math.min((newClaimed / a.condition.target) * 100, 100),
            unlocked: newClaimed >= a.condition.target || a.unlocked,
          };
        }
        return a;
      });

      const newStats = buildStats(updatedAchievements, newClaimed);
      setAchievements(updatedAchievements);
      setStats(newStats);
      await Promise.all([
        saveAchievements(updatedAchievements, newStats, newClaimed),
        AsyncStorage.setItem("@tonic_claimed_ids", JSON.stringify(newClaimedIds)),
      ]);
    },
    [achievements, claimedAchievementIds, claimedPointsState, buildStats, saveAchievements]
  );

  const getCurrentLevel = useCallback(() => stats.currentLevel, [stats]);
  const getTotalPoints = useCallback(() => stats.claimedPoints, [stats]);

  return (
    <AchievementsContext.Provider
      value={{
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
        claimPoints,
        claimedAchievementIds,
        claimAchievement,
      }}
    >
      {children}
    </AchievementsContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementsContext);
  if (!context) throw new Error("useAchievements must be used within AchievementsProvider");
  return context;
};
