import React, { useEffect, useRef, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Animated,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Sparkles,
  Zap,
  TrendingUp,
  Flame,
  Target,
  Plus,
  ChevronRight,
  AlertCircle,
  RotateCcw,
} from "lucide-react-native";
import { useRouter } from "expo-router";

import { Colors } from "@/constants/colors";
import { useAppState } from "@/providers/AppStateProvider";
import { useTasks } from "@/providers/TasksProvider";
import type { Task, AIInsight } from "@/types/tasks";

const { width: _width } = Dimensions.get("window");

function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [progress, animatedValue]);

  return (
    <View style={[styles.progressContainer, { width: size, height: size }]}>
      <View
        style={[
          styles.progressBackground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.progressFill,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            transform: [
              { rotate: "-90deg" },
              {
                scaleX: animatedValue.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, 1],
                }),
              },
            ],
          },
        ]}
      />
      <View style={styles.progressCenter}>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        <Text style={styles.progressLabel}>Complete</Text>
      </View>
    </View>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TaskItem({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const priorityColors: Record<string, string> = {
    high: Colors.danger,
    medium: Colors.warning,
    low: Colors.success,
  };

  const categoryIcons: Record<string, React.ComponentType<any>> = {
    work: Target,
    personal: Sparkles,
    health: Zap,
    learning: TrendingUp,
  };

  const CategoryIcon = categoryIcons[task.category] || Target;

  return (
    <TouchableOpacity
      style={[styles.taskItem, task.status === "completed" && styles.taskCompleted]}
      activeOpacity={0.8}
      onPress={() => onToggle(task.id)}
    >
      <View style={styles.taskLeft}>
        <View
          style={[
            styles.taskCheckbox,
            task.status === "completed" && styles.taskCheckboxCompleted,
          ]}
        >
          {task.status === "completed" && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.taskContent}>
          <Text
            style={[
              styles.taskTitle,
              task.status === "completed" && styles.taskTitleCompleted,
            ]}
          >
            {task.title}
          </Text>
          {task.aiSuggested && (
            <View style={styles.aiBadge}>
              <Sparkles size={10} color={Colors.gold} />
              <Text style={styles.aiBadgeText}>AI Suggested</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.taskRight}>
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: `${priorityColors[task.priority] || Colors.warning}20` },
          ]}
        >
          <View
            style={[
              styles.priorityDot,
              { backgroundColor: priorityColors[task.priority] || Colors.warning },
            ]}
          />
        </View>
        <CategoryIcon size={16} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function WeeklyChart({ data }: { data: number[] }) {
  const maxValue = Math.max(...data, 1);
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <View style={styles.chartContainer}>
      {data.map((value, index) => {
        const height = (value / maxValue) * 60;
        return (
          <View key={index} style={styles.chartBarContainer}>
            <View style={[styles.chartBar, { height }]}>
              <View style={styles.chartBarFill} />
            </View>
            <Text style={styles.chartLabel}>{days[index]}</Text>
          </View>
        );
      })}
    </View>
  );
}

function InsightCard({ insight }: { insight: AIInsight }) {
  const getIconColor = () => {
    switch (insight.type) {
      case "focus": return Colors.gold;
      case "warning": return Colors.warning;
      case "suggestion": return Colors.blue;
      case "pattern": return Colors.success;
      default: return Colors.gold;
    }
  };

  const getIcon = () => {
    switch (insight.icon) {
      case "target": return Target;
      case "alert": return AlertCircle;
      case "balance": return Zap;
      case "trending": return TrendingUp;
      default: return Sparkles;
    }
  };

  const Icon = getIcon();
  const color = getIconColor();

  return (
    <View style={[styles.insightCard, insight.type === "warning" && styles.warningCard]}>
      <View style={[styles.insightIconContainer, { backgroundColor: `${color}15` }]}>
        <Icon size={20} color={color} />
      </View>
      <View style={styles.insightContent}>
        <Text style={[styles.insightTitle, { color }]}>{insight.title}</Text>
        <Text style={styles.insightDescription} numberOfLines={2}>{insight.description}</Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isOnboarded, isLoading, resetApp } = useAppState();
  const { tasks, insights, toggleTaskStatus, getStats, getTodayTasks } = useTasks();
  const [stats, setStats] = React.useState({
    tasksCompleted: 0,
    tasksCreated: 0,
    currentStreak: 0,
    productivityScore: 0,
    weeklyCompletion: [0, 0, 0, 0, 0, 0, 0],
  });
  const [refreshing, setRefreshing] = React.useState(false);

  const todayTasks = getTodayTasks();
  const focusInsight = insights.find((i: AIInsight) => i.type === "focus");
  const warningInsight = insights.find((i: AIInsight) => i.type === "warning");

  const todayCompleted = todayTasks.filter((t: Task) => t.status === "completed").length;
  const todayProgress = todayTasks.length > 0 ? (todayCompleted / todayTasks.length) * 100 : 0;

  console.log("🎯 Dashboard: Total tasks:", tasks.length, "Today's tasks:", todayTasks.length);

  useEffect(() => {
    if (!isLoading && !isOnboarded) {
      setTimeout(() => {
        router.replace("/onboarding");
      }, 100);
    }
  }, [isOnboarded, isLoading, router]);

  const loadStats = useCallback(async () => {
    const newStats = await getStats();
    setStats(newStats);
  }, [getStats]);

  useEffect(() => {
    void loadStats();
  }, [loadStats, tasks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  const handleReset = () => {
    Alert.alert("Reset App", "Clear all data and return to onboarding?", [
      { text: "Cancel", onPress: () => {}, style: "cancel" },
      {
        text: "Reset",
        onPress: async () => {
          await resetApp();
          setTimeout(() => {
            router.replace("/onboarding");
          }, 500);
        },
        style: "destructive",
      },
    ]);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleAddTask = () => {
    router.push("/modal");
  };

  const handleSeeAllTasks = () => {
    router.push("/tasks");
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Welcome to Tonic</Text>
          <Text style={styles.loadingSubtext}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.resetButton}
              activeOpacity={0.8}
              onPress={handleReset}
            >
              <RotateCcw size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} activeOpacity={0.8} onPress={handleAddTask}>
              <Plus size={20} color={Colors.bgPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {focusInsight && <InsightCard insight={focusInsight} />}

        <View style={styles.progressSection}>
          <View style={styles.progressLeft}>
            <Text style={styles.sectionTitle}>Today</Text>
            <Text style={styles.progressSubtitle}>
              {todayCompleted} / {todayTasks.length} done
            </Text>
            <View style={styles.progressStats}>
              <View style={styles.progressStat}>
                <Flame size={14} color={Colors.warning} />
                <Text style={styles.progressStatText}>{stats.currentStreak}d streak</Text>
              </View>
            </View>
          </View>
          <ProgressRing progress={todayProgress} size={110} strokeWidth={10} />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon={Target}
            value={stats.tasksCompleted}
            label="Completed"
            color={Colors.success}
          />
          <StatCard
            icon={Flame}
            value={stats.currentStreak}
            label="Day Streak"
            color={Colors.warning}
          />
          <StatCard
            icon={Zap}
            value={stats.productivityScore}
            label="Score"
            color={Colors.blue}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Activity</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See all</Text>
              <ChevronRight size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <WeeklyChart data={stats.weeklyCompletion} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today&apos;s Tasks</Text>
            <TouchableOpacity style={styles.seeAllButton} onPress={handleSeeAllTasks}>
              <Text style={styles.seeAllText}>See all</Text>
              <ChevronRight size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          {todayTasks.length === 0 ? (
            <TouchableOpacity style={styles.emptyTasksCard} onPress={handleAddTask} activeOpacity={0.8}>
              <View style={styles.emptyTasksIcon}>
                <Plus size={22} color={Colors.gold} />
              </View>
              <Text style={styles.emptyTasksText}>Add today's first task</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.tasksList}>
              {todayTasks.slice(0, 5).map((task: Task) => (
                <TaskItem key={task.id} task={task} onToggle={toggleTaskStatus} />
              ))}
            </View>
          )}
        </View>

        {warningInsight && (
          <View style={styles.warningCardContainer}>
            <InsightCard insight={warningInsight} />
          </View>
        )}
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  resetButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.bgSecondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.gold,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  insightCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    gap: 16,
  },
  warningCard: {
    backgroundColor: `${Colors.warning}10`,
    borderColor: `${Colors.warning}30`,
  },
  warningCardContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  insightDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  progressSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.bgSecondary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressLeft: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  progressStats: {
    flexDirection: "row",
    gap: 12,
  },
  progressStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.bgTertiary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  progressStatText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  progressContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  progressBackground: {
    position: "absolute",
    borderColor: `${Colors.gold}15`,
  },
  progressFill: {
    position: "absolute",
    borderColor: Colors.gold,
    borderLeftColor: "transparent",
    borderBottomColor: "transparent",
  },
  progressCenter: {
    justifyContent: "center",
    alignItems: "center",
  },
  progressText: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  progressLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 80,
    backgroundColor: Colors.bgSecondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartBarContainer: {
    alignItems: "center",
    flex: 1,
  },
  chartBar: {
    width: 8,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 4,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  chartBarFill: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.gold,
    borderRadius: 4,
    opacity: 0.8,
  },
  chartLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 8,
  },
  emptyTasksCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: `${Colors.gold}30`,
    borderStyle: "dashed",
    gap: 12,
    flexDirection: "row",
    justifyContent: "center",
  },
  emptyTasksIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: `${Colors.gold}18`,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTasksText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  emptyTasksButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${Colors.gold}15`,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyTasksButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.gold,
  },
  tasksList: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  taskItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  taskCompleted: {
    opacity: 0.6,
  },
  taskLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  taskCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  taskCheckboxCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkmark: {
    color: Colors.bgPrimary,
    fontSize: 12,
    fontWeight: "bold",
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: Colors.textMuted,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 10,
    color: Colors.gold,
    fontWeight: "500",
  },
  taskRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priorityBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.bgPrimary,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
