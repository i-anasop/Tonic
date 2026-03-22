export type AchievementCategory = "daily" | "weekly" | "monthly" | "timeless";
export type AchievementDifficulty = "easy" | "medium" | "hard" | "expert";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  difficulty: AchievementDifficulty;
  icon: string;
  basePoints: number;
  difficultyMultiplier: number;
  condition: AchievementCondition;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  secret: boolean;
}

export interface AchievementCondition {
  type: "task_count" | "streak" | "completion_rate" | "points" | "usage_time" | "custom";
  target: number;
  metric?: string;
}

export interface AchievementLevel {
  level: number;
  name: string;
  requiredPoints: number;
  icon: string;
  color: string;
  unlocked: boolean;
  currentPoints: number;
  nextLevelPoints: number;
}

export interface AchievementStats {
  totalPoints: number;
  claimedPoints: number;
  pendingPoints: number;
  currentLevel: AchievementLevel;
  totalUnlocked: number;
  categoryCounts: {
    daily: number;
    weekly: number;
    monthly: number;
    timeless: number;
  };
  difficultyCounts: {
    easy: number;
    medium: number;
    hard: number;
    expert: number;
  };
}

export interface AchievementState {
  achievements: Achievement[];
  stats: AchievementStats;
  claimedPoints: number;
  lastUpdated: string;
}
