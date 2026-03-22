import { useState, useMemo, useRef, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  Sparkles,
  Zap,
  TrendingUp,
  Trash2,
  Edit3,
} from "lucide-react-native";
import { useRouter } from "expo-router";

import { Colors } from "@/constants/colors";
import { useTheme } from "@/providers/ThemeProvider";
import { useTasks } from "@/providers/TasksProvider";
import type { Task, TaskCategory } from "@/types/tasks";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type FilterTab = "all" | "today" | "upcoming" | "completed";

const categoryConfig: Record<TaskCategory, { icon: typeof Target; color: string; label: string }> = {
  work: { icon: Target, color: Colors.blue, label: "Work" },
  personal: { icon: Sparkles, color: Colors.purple, label: "Personal" },
  health: { icon: Zap, color: Colors.success, label: "Health" },
  learning: { icon: TrendingUp, color: Colors.gold, label: "Learning" },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  high: { color: Colors.danger, label: "High" },
  medium: { color: Colors.warning, label: "Medium" },
  low: { color: Colors.success, label: "Low" },
};

function TaskCard({
  task,
  onToggle,
  onDelete,
  onEdit,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const category = categoryConfig[task.category];
  const CategoryIcon = category.icon;
  const priority = priorityConfig[task.priority];

  const handleToggle = useCallback(() => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: task.status === "completed" ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onToggle(task.id);
      slideAnim.setValue(0);
    });
  }, [task.id, task.status, onToggle, slideAnim]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH],
  });

  const opacity = slideAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.5, 0],
  });

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    const taskDate = date instanceof Date ? date : new Date(date);

    if (taskDate.toDateString() === today.toDateString()) return "Today";
    if (taskDate.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return taskDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isOverdue = task.dueDate < new Date() && task.status !== "completed";

  return (
    <Animated.View style={{ transform: [{ translateX }], opacity }}>
      <TouchableOpacity
        style={[
          styles.taskCard,
          task.status === "completed" && styles.taskCardCompleted,
          showActions && styles.taskCardActive,
        ]}
        activeOpacity={0.9}
        onPress={() => setShowActions(!showActions)}
        testID={`task-card-${task.id}`}
      >
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={handleToggle}
          activeOpacity={0.7}
          testID={`task-checkbox-${task.id}`}
        >
          {task.status === "completed" ? (
            <View style={styles.checkboxCompleted}>
              <CheckCircle2 size={20} color={Colors.success} />
            </View>
          ) : (
            <View style={[styles.checkbox, { borderColor: priority.color }]}>
              <Circle size={20} color={priority.color} />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.taskContent}>
          <View style={styles.taskHeader}>
            <Text
              style={[
                styles.taskTitle,
                task.status === "completed" && styles.taskTitleCompleted,
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            {task.aiSuggested && (
              <View style={styles.aiBadge}>
                <Sparkles size={10} color={Colors.gold} />
              </View>
            )}
          </View>

          {task.description && (
            <Text style={styles.taskDescription} numberOfLines={1}>
              {task.description}
            </Text>
          )}

          <View style={styles.taskMeta}>
            <View style={[styles.categoryBadge, { backgroundColor: `${category.color}15` }]}>
              <CategoryIcon size={12} color={category.color} />
              <Text style={[styles.categoryText, { color: category.color }]}>
                {category.label}
              </Text>
            </View>

            <View style={[
              styles.dueBadge,
              isOverdue && styles.dueBadgeOverdue
            ]}>
              <Clock size={12} color={isOverdue ? Colors.danger : colors.textMuted} />
              <Text style={[
                styles.dueText,
                isOverdue && styles.dueTextOverdue
              ]}>
                {formatDate(task.dueDate)}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.priorityIndicator, { backgroundColor: priority.color }]} />

        {showActions && (
          <View style={styles.actionsOverlay}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionEdit]}
              onPress={() => {
                setShowActions(false);
                onEdit(task.id);
              }}
            >
              <Edit3 size={18} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionDelete]}
              onPress={() => {
                setShowActions(false);
                onDelete(task.id);
              }}
            >
              <Trash2 size={18} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function FilterTabButton({
  label,
  count,
  isActive,
  onPress,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.filterTab, isActive && styles.filterTabActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
        {label}
      </Text>
      <View style={[styles.filterCount, isActive && styles.filterCountActive]}>
        <Text style={[styles.filterCountText, isActive && styles.filterCountTextActive]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function CategoryFilterChip({
  category,
  isSelected,
  onPress,
}: {
  category: TaskCategory | "all";
  isSelected: boolean;
  onPress: () => void;
}) {
  const label = category === "all" ? "All" : categoryConfig[category].label;
  const color = category === "all" ? Colors.gold : categoryConfig[category].color;

  return (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        isSelected && { backgroundColor: color, borderColor: color },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.categoryChipText,
          isSelected && styles.categoryChipTextActive,
          !isSelected && { color },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function TasksScreen() {
  const router = useRouter();
  const { tasks, toggleTaskStatus, deleteTask } = useTasks();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (activeFilter === "today") {
      const today = new Date().toDateString();
      result = result.filter((t) => new Date(t.dueDate).toDateString() === today);
    } else if (activeFilter === "upcoming") {
      const today = new Date();
      result = result.filter((t) => new Date(t.dueDate) > today && t.status !== "completed");
    } else if (activeFilter === "completed") {
      result = result.filter((t) => t.status === "completed");
    }

    if (selectedCategory !== "all") {
      result = result.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery) {
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.description?.toLowerCase() ?? "").includes(searchQuery.toLowerCase())
      );
    }

    return result.sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;

      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [tasks, activeFilter, selectedCategory, searchQuery]);

  const taskCounts = useMemo(() => ({
    all: tasks.filter((t) => t.status !== "completed").length,
    today: tasks.filter(
      (t) =>
        new Date(t.dueDate).toDateString() === new Date().toDateString() &&
        t.status !== "completed"
    ).length,
    upcoming: tasks.filter(
      (t) => new Date(t.dueDate) > new Date() && t.status !== "completed"
    ).length,
    completed: tasks.filter((t) => t.status === "completed").length,
  }), [tasks]);

  const handleToggleTask = useCallback((id: string) => {
    toggleTaskStatus(id);
  }, [toggleTaskStatus]);

  const handleDeleteTask = useCallback((id: string) => {
    deleteTask(id);
  }, [deleteTask]);

  const handleEditTask = useCallback((id: string) => {
    router.push({ pathname: "/modal", params: { editTaskId: id } });
  }, [router]);

  const handleAddTask = useCallback(() => {
    router.push("/modal");
  }, [router]);

  const completionRate = tasks.length > 0
    ? Math.round((tasks.filter((t) => t.status === "completed").length / tasks.length) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Tasks</Text>
          <Text style={styles.headerSubtitle}>
            {completionRate}% completion rate
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowSearch(!showSearch)}
            activeOpacity={0.8}
          >
            <Search size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} activeOpacity={0.8} onPress={handleAddTask}>
            <Plus size={20} color={colors.bgPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {showSearch && (
        <View style={styles.searchContainer}>
          <Search size={18} color={colors.textMuted} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              height: 40,
              backgroundColor: "transparent",
              border: "none",
              outline: "none",
              color: colors.textPrimary,
              fontSize: 15,
              fontFamily: Platform.select({
                ios: "-apple-system",
                android: "Roboto",
                default: "system-ui",
              }),
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <View style={styles.clearButton}>
                <Text style={styles.clearText}>×</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterTabsContainer}
        contentContainerStyle={styles.filterTabsContent}
      >
        <FilterTabButton
          label="All"
          count={taskCounts.all}
          isActive={activeFilter === "all"}
          onPress={() => setActiveFilter("all")}
        />
        <FilterTabButton
          label="Today"
          count={taskCounts.today}
          isActive={activeFilter === "today"}
          onPress={() => setActiveFilter("today")}
        />
        <FilterTabButton
          label="Upcoming"
          count={taskCounts.upcoming}
          isActive={activeFilter === "upcoming"}
          onPress={() => setActiveFilter("upcoming")}
        />
        <FilterTabButton
          label="Completed"
          count={taskCounts.completed}
          isActive={activeFilter === "completed"}
          onPress={() => setActiveFilter("completed")}
        />
      </ScrollView>

      <View style={styles.categoryFilterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFilterContent}
        >
          <CategoryFilterChip
            category="all"
            isSelected={selectedCategory === "all"}
            onPress={() => setSelectedCategory("all")}
          />
          {(Object.keys(categoryConfig) as TaskCategory[]).map((category) => (
            <CategoryFilterChip
              key={category}
              category={category}
              isSelected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.taskList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.taskListContent}
      >
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <CheckCircle2 size={48} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No tasks found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? "Try adjusting your search"
                : "Add a new task to get started"}
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddTask}>
              <Plus size={18} color={Colors.gold} />
              <Text style={styles.emptyButtonText}>Create Task</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {activeFilter !== "completed" &&
              filteredTasks.some((t) => t.status !== "completed") && (
                <Text style={styles.sectionTitle}>Active Tasks</Text>
              )}
            {filteredTasks
              .filter((t) => t.status !== "completed")
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                />
              ))}

            {activeFilter !== "completed" &&
              filteredTasks.some((t) => t.status === "completed") && (
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Completed</Text>
            )}
            {filteredTasks
              .filter((t) => t.status === "completed")
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                />
              ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: typeof Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.bgSecondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgSecondary,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.bgTertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  clearText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 16,
  },
  filterTabsContainer: {
    maxHeight: 50,
  },
  filterTabsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.bgPrimary,
  },
  filterCount: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.bgTertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  filterCountActive: {
    backgroundColor: `${colors.bgPrimary}30`,
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  filterCountTextActive: {
    color: colors.bgPrimary,
  },
  categoryFilterContainer: {
    marginTop: 8,
  },
  categoryFilterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  categoryChipTextActive: {
    color: colors.bgPrimary,
  },
  taskList: {
    flex: 1,
  },
  taskListContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    position: "relative",
    overflow: "hidden",
  },
  taskCardCompleted: {
    opacity: 0.7,
    backgroundColor: colors.bgTertiary,
  },
  taskCardActive: {
    borderColor: Colors.gold,
  },
  checkboxContainer: {
    marginRight: 14,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxCompleted: {
    width: 28,
    height: 28,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  aiBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: `${Colors.gold}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  taskDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  dueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dueBadgeOverdue: {
    backgroundColor: `${Colors.danger}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dueText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
  },
  dueTextOverdue: {
    color: Colors.danger,
    fontWeight: "600",
  },
  priorityIndicator: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 2,
  },
  actionsOverlay: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.bgSecondary,
    paddingLeft: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  actionEdit: {
    backgroundColor: colors.bgTertiary,
  },
  actionDelete: {
    backgroundColor: `${Colors.danger}15`,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.bgSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${Colors.gold}15`,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.gold,
  },
});
