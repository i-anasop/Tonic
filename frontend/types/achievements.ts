// Achievement system types with scalable, extensible design

export type AchievementCategory = "daily" | "weekly" | "monthly" | "timeless";
export type AchievementDifficulty = "easy" | "medium" | "hard" | "expert";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  difficulty: AchievementDifficulty;
  icon: string; // Icon name from lucide-react
  basePoints: number; // Points before difficulty multiplier
  difficultyMultiplier: number; // 1x for easy, 1.5x for medium, 2x for hard, 3x for expert
  condition: AchievementCondition;
  unlocked: boolean;
  unlockedAt?: string; // ISO timestamp
  progress: number; // 0-100 percentage
  secret: boolean; // Hidden until unlocked
}

export interface AchievementCondition {
  type: "task_count" | "streak" | "completion_rate" | "points" | "usage_time" | "custom";
  target: number;
  metric?: string; // e.g., "daily", "weekly", "allTime"
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
  lastUpdated: string;
}
