export type TaskPriority = "high" | "medium" | "low";
export type TaskCategory = "work" | "personal" | "health" | "learning";
export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
  dueDate: Date;
  createdAt: Date;
  completedAt?: Date;
  aiSuggested?: boolean;
}

export interface AIInsight {
  id: string;
  type: "focus" | "warning" | "suggestion" | "pattern";
  title: string;
  description: string;
  icon: string;
  priority: "high" | "medium" | "low";
  createdAt: Date;
}

export interface UserStats {
  tasksCompleted: number;
  tasksCreated: number;
  currentStreak: number;
  longestStreak: number;
  productivityScore: number;
  weeklyCompletion: number[];
}
