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
  Clock,
  Target,
  Sparkles,
  Zap,
  TrendingUp,
  Trash2,
  Edit3,
  SlidersHorizontal,
} from "lucide-react-native";
import { useRouter } from "expo-router";

import { Colors } from "@/constants/colors";
import { useTheme, type AppColors } from "@/providers/ThemeProvider";
import { useTasks } from "@/providers/TasksProvider";
import type { Task, TaskCategory } from "@/types/tasks";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type FilterTab = "all" | "today" | "upcoming" | "completed";

const categoryConfig: Record<TaskCategory, { icon: typeof Target; color: string; label: string }> = {
  work: { icon: Target, color: Colors.blue, label: "Work" },
  personal: { icon: Sparkles, color: Colors.purple, label: "Personal" },
  health: { icon: Zap, color: Colors.success, label: "Health" },
  learning: { icon: TrendingUp, color: Colors.gold, label: "Learn" },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  high: { color: Colors.danger, label: "High" },
  medium: { color: Colors.warning, label: "Med" },
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
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start(() => {
      onToggle(task.id);
      slideAnim.setValue(0);
    });
  }, [task.id, task.status, onToggle, slideAnim]);

  const translateX = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, SCREEN_WIDTH] });
  const opacity = slideAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.5, 0] });

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    const taskDate = date instanceof Date ? date : new Date(date);
    if (taskDate.toDateString() === today.toDateString()) return "Today";
    if (taskDate.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return taskDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isOverdue = task.dueDate < new Date() && task.status !== "completed";
  const isDone = task.status === "completed";

  return (
    <Animated.View style={{ transform: [{ translateX }], opacity }}>
      <TouchableOpacity
        style={[styles.taskCard, isDone && styles.taskCardDone, showActions && styles.taskCardActive]}
        activeOpacity={0.9}
        onPress={() => setShowActions(!showActions)}
        testID={`task-card-${task.id}`}
      >
        {/* Left priority bar */}
        <View style={[styles.priorityBar, { backgroundColor: isDone ? colors.border : priority.color }]} />

        {/* Checkbox */}
        <TouchableOpacity
          style={styles.checkboxWrap}
          onPress={handleToggle}
          activeOpacity={0.7}
          testID={`task-checkbox-${task.id}`}
        >
          {isDone ? (
            <CheckCircle2 size={22} color={Colors.success} />
          ) : (
            <View style={[styles.checkbox, { borderColor: priority.color }]} />
          )}
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.taskContent}>
          <Text
            style={[styles.taskTitle, isDone && styles.taskTitleDone]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          <View style={styles.taskMeta}>
            <View style={[styles.catChip, { backgroundColor: `${category.color}15` }]}>
              <CategoryIcon size={11} color={category.color} />
              <Text style={[styles.catText, { color: category.color }]}>{category.label}</Text>
            </View>
            <View style={[styles.dateChip, isOverdue && styles.dateChipOverdue]}>
              <Clock size={10} color={isOverdue ? Colors.danger : colors.textMuted} />
              <Text style={[styles.dateText, isOverdue && { color: Colors.danger }]}>
                {formatDate(task.dueDate)}
              </Text>
            </View>
            {task.aiSuggested && (
              <View style={styles.aiBadge}>
                <Sparkles size={10} color={Colors.gold} />
              </View>
            )}
          </View>
        </View>

        {/* Action buttons */}
        {showActions && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => { setShowActions(false); onEdit(task.id); }}
            >
              <Edit3 size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnDanger]}
              onPress={() => { setShowActions(false); onDelete(task.id); }}
            >
              <Trash2 size={16} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function FilterTab({
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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TouchableOpacity
      style={[styles.filterTab, isActive && styles.filterTabActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>{label}</Text>
      {count > 0 && (
        <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
          <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function CatChip({
  category,
  isSelected,
  onPress,
}: {
  category: TaskCategory | "all";
  isSelected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const label = category === "all" ? "All" : categoryConfig[category].label;
  const color = category === "all" ? Colors.gold : categoryConfig[category].color;
  const CatIcon = category === "all" ? null : categoryConfig[category].icon;

  return (
    <TouchableOpacity
      style={[styles.catFilterChip, isSelected && { backgroundColor: color, borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {CatIcon && <CatIcon size={11} color={isSelected ? "#fff" : color} />}
      <Text style={[styles.catFilterText, { color: isSelected ? "#fff" : color }]}>{label}</Text>
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
    if (selectedCategory !== "all") result = result.filter((t) => t.category === selectedCategory);
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
      const po: Record<string, number> = { high: 0, medium: 1, low: 2 };
      if (po[a.priority] !== po[b.priority]) return po[a.priority] - po[b.priority];
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [tasks, activeFilter, selectedCategory, searchQuery]);

  const counts = useMemo(() => ({
    all: tasks.filter((t) => t.status !== "completed").length,
    today: tasks.filter((t) => new Date(t.dueDate).toDateString() === new Date().toDateString() && t.status !== "completed").length,
    upcoming: tasks.filter((t) => new Date(t.dueDate) > new Date() && t.status !== "completed").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  }), [tasks]);

  const handleToggle = useCallback((id: string) => { toggleTaskStatus(id); }, [toggleTaskStatus]);
  const handleDelete = useCallback((id: string) => { deleteTask(id); }, [deleteTask]);
  const handleEdit = useCallback((id: string) => { router.push({ pathname: "/modal", params: { editTaskId: id } }); }, [router]);
  const handleAdd = useCallback(() => { router.push("/modal"); }, [router]);

  const pending = tasks.filter((t) => t.status !== "completed").length;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Tasks</Text>
          {pending > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pending}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowSearch(!showSearch)}
            activeOpacity={0.8}
          >
            <Search size={19} color={showSearch ? Colors.gold : colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={handleAdd}>
            <Plus size={20} color="#0D1117" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Search size={16} color={colors.textMuted} />
          <input
            type="text"
            placeholder="Search tasks…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              height: 36,
              backgroundColor: "transparent",
              border: "none",
              outline: "none",
              color: colors.textPrimary,
              fontSize: 15,
              fontFamily: Platform.select({ ios: "-apple-system", android: "Roboto", default: "system-ui" }),
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <View style={styles.clearBtn}>
                <Text style={styles.clearText}>×</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        <FilterTab label="All" count={counts.all} isActive={activeFilter === "all"} onPress={() => setActiveFilter("all")} />
        <FilterTab label="Today" count={counts.today} isActive={activeFilter === "today"} onPress={() => setActiveFilter("today")} />
        <FilterTab label="Upcoming" count={counts.upcoming} isActive={activeFilter === "upcoming"} onPress={() => setActiveFilter("upcoming")} />
        <FilterTab label="Done" count={counts.completed} isActive={activeFilter === "completed"} onPress={() => setActiveFilter("completed")} />
      </ScrollView>

      {/* Category chips */}
      <View style={styles.catRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catContent}>
          <CatChip category="all" isSelected={selectedCategory === "all"} onPress={() => setSelectedCategory("all")} />
          {(Object.keys(categoryConfig) as TaskCategory[]).map((cat) => (
            <CatChip key={cat} category={cat} isSelected={selectedCategory === cat} onPress={() => setSelectedCategory(cat)} />
          ))}
        </ScrollView>
      </View>

      {/* Task list */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {filteredTasks.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <CheckCircle2 size={36} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? "No results" : activeFilter === "completed" ? "No completed tasks" : "All clear"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? "Try different keywords" : "Add a task to get started"}
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.emptyBtn} onPress={handleAdd} activeOpacity={0.8}>
                <Plus size={16} color={Colors.gold} />
                <Text style={styles.emptyBtnText}>New Task</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {activeFilter !== "completed" && filteredTasks.some((t) => t.status !== "completed") && (
              <Text style={styles.listSection}>Active</Text>
            )}
            {filteredTasks.filter((t) => t.status !== "completed").map((task) => (
              <TaskCard key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit} />
            ))}
            {activeFilter !== "completed" && filteredTasks.some((t) => t.status === "completed") && (
              <Text style={[styles.listSection, { marginTop: 20 }]}>Completed</Text>
            )}
            {filteredTasks.filter((t) => t.status === "completed").map((task) => (
              <TaskCard key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 },
  pendingBadge: { backgroundColor: `${Colors.gold}20`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  pendingBadgeText: { fontSize: 12, fontWeight: "700", color: Colors.gold },
  headerActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  iconBtn: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.bgSecondary, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.border },
  addBtn: {
    width: 42, height: 42, borderRadius: 13, backgroundColor: Colors.gold,
    justifyContent: "center", alignItems: "center",
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 6,
  },

  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: colors.bgSecondary, marginHorizontal: 20, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: Colors.gold, gap: 8 },
  clearBtn: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.bgTertiary, justifyContent: "center", alignItems: "center" },
  clearText: { color: colors.textMuted, fontSize: 14, lineHeight: 18 },

  filterRow: { flexShrink: 0 },
  filterContent: { paddingHorizontal: 20, paddingBottom: 4, gap: 8 },
  filterTab: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border },
  filterTabActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  filterTabText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  filterTabTextActive: { color: "#0D1117" },
  filterBadge: { backgroundColor: colors.bgTertiary, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  filterBadgeActive: { backgroundColor: "rgba(0,0,0,0.2)" },
  filterBadgeText: { fontSize: 10, fontWeight: "700", color: colors.textMuted },
  filterBadgeTextActive: { color: "#0D1117" },

  catRow: { marginTop: 6 },
  catContent: { paddingHorizontal: 20, gap: 8, paddingBottom: 10 },
  catFilterChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border },
  catFilterText: { fontSize: 12, fontWeight: "600" },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 110 },
  listSection: { fontSize: 12, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8, marginTop: 4, paddingLeft: 4 },

  taskCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.bgSecondary, borderRadius: 16, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  taskCardDone: { opacity: 0.55 },
  taskCardActive: { borderColor: `${Colors.gold}50` },

  priorityBar: { width: 4, alignSelf: "stretch", minHeight: 62 },
  checkboxWrap: { padding: 14 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 2 },

  taskContent: { flex: 1, paddingVertical: 12, paddingRight: 12 },
  taskTitle: { fontSize: 14, fontWeight: "600", color: colors.textPrimary, marginBottom: 6 },
  taskTitleDone: { textDecorationLine: "line-through", color: colors.textMuted },
  taskMeta: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  catChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  catText: { fontSize: 11, fontWeight: "600" },
  dateChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  dateChipOverdue: {},
  dateText: { fontSize: 11, color: colors.textMuted },
  aiBadge: { width: 18, height: 18, borderRadius: 5, backgroundColor: `${Colors.gold}20`, justifyContent: "center", alignItems: "center" },

  actions: { flexDirection: "row", gap: 8, paddingRight: 12 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.bgTertiary, justifyContent: "center", alignItems: "center" },
  actionBtnDanger: { backgroundColor: `${Colors.danger}12` },

  empty: { paddingTop: 80, alignItems: "center", gap: 8 },
  emptyIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: colors.bgSecondary, justifyContent: "center", alignItems: "center", marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary },
  emptySubtitle: { fontSize: 13, color: colors.textMuted, textAlign: "center" },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, backgroundColor: `${Colors.gold}15`, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  emptyBtnText: { fontSize: 14, fontWeight: "600", color: Colors.gold },
});
