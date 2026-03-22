import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Plus,
  Search,
  CircleCheck,
  Clock,
  Target,
  Sparkles,
  Zap,
  TrendingUp,
  Trash2,
  Edit3,
  Ellipsis,
  CalendarDays,
  ListChecks,
  Flag,
  Flame,
} from "lucide-react-native";
import { useRouter } from "expo-router";

import { Colors } from "@/constants/colors";
import { useTheme, type AppColors } from "@/providers/ThemeProvider";
import { useTasks } from "@/providers/TasksProvider";
import type { Task, TaskCategory } from "@/types/tasks";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type FilterTab = "all" | "today" | "upcoming" | "completed";

const categoryConfig: Record<TaskCategory, { icon: typeof Target; color: string; label: string }> = {
  work:     { icon: Target,     color: Colors.blue,    label: "Work" },
  personal: { icon: Sparkles,   color: Colors.purple,  label: "Personal" },
  health:   { icon: Flame,      color: Colors.success, label: "Health" },
  learning: { icon: TrendingUp, color: Colors.gold,    label: "Learn" },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  high:   { color: Colors.danger,  label: "High" },
  medium: { color: Colors.warning, label: "Med" },
  low:    { color: Colors.success, label: "Low" },
};

// ── Summary Stats Strip ──────────────────────────────────────────────────────
function SummaryStrip({ tasks }: { tasks: Task[] }) {
  const { colors } = useTheme();
  const active = tasks.filter((t) => t.status !== "completed").length;
  const today = new Date().toDateString();
  const todayCount = tasks.filter((t) => new Date(t.dueDate).toDateString() === today && t.status !== "completed").length;
  const now = new Date(); now.setHours(0,0,0,0);
  const overdueCount = tasks.filter((t) => t.status !== "completed" && new Date(t.dueDate) < now).length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const total = tasks.length;
  const pct = total > 0 ? completed / total : 0;
  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barAnim, { toValue: pct, duration: 900, useNativeDriver: false }).start();
  }, [pct]);
  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  const stats = [
    { label: "Active",  value: active,       color: colors.textPrimary, bg: colors.bgTertiary },
    { label: "Today",   value: todayCount,   color: Colors.blue,        bg: `${Colors.blue}15` },
    { label: "Overdue", value: overdueCount, color: overdueCount > 0 ? Colors.danger : colors.textMuted, bg: overdueCount > 0 ? `${Colors.danger}12` : colors.bgTertiary },
    { label: "Done",    value: completed,    color: Colors.success,     bg: `${Colors.success}12` },
  ];

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
        {stats.map(({ label, value, color, bg }) => (
          <View key={label} style={{ flex: 1, backgroundColor: bg, borderRadius: 14, paddingVertical: 10, alignItems: "center", gap: 2 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color, letterSpacing: -0.5 }}>{value}</Text>
            <Text style={{ fontSize: 10, fontWeight: "600", color: colors.textMuted }}>{label}</Text>
          </View>
        ))}
      </View>
      {/* Overall progress bar */}
      <View style={{ height: 4, backgroundColor: colors.bgTertiary, borderRadius: 4 }}>
        <Animated.View style={{ height: 4, width: barWidth, backgroundColor: Colors.success, borderRadius: 4 }} />
      </View>
      {total > 0 && (
        <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 4, textAlign: "right" }}>
          {completed}/{total} completed · {Math.round(pct * 100)}%
        </Text>
      )}
    </View>
  );
}

// ── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, onToggle, onDelete, onEdit }: {
  task: Task; onToggle: (id: string) => void; onDelete: (id: string) => void; onEdit: (id: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const actionAnim = useRef(new Animated.Value(0)).current;
  const category = categoryConfig[task.category];
  const CategoryIcon = category.icon;
  const priority = priorityConfig[task.priority];

  const isDone = task.status === "completed";
  const now = new Date(); now.setHours(0,0,0,0);
  const isOverdue = !isDone && new Date(task.dueDate) < now;

  const handleToggle = useCallback(() => {
    if (isDone) { onToggle(task.id); return; }
    Animated.timing(slideAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start(() => {
      onToggle(task.id);
      slideAnim.setValue(0);
    });
  }, [task.id, isDone, onToggle, slideAnim]);

  const toggleActions = useCallback(() => {
    const next = !showActions;
    setShowActions(next);
    Animated.spring(actionAnim, { toValue: next ? 1 : 0, friction: 7, tension: 80, useNativeDriver: true }).start();
  }, [showActions, actionAnim]);

  const translateX = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, SCREEN_WIDTH] });
  const opacity = slideAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.4, 0] });
  const actionOpacity = actionAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const actionTranslateY = actionAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] });

  const formatDate = (date: Date) => {
    const todayStr = new Date().toDateString();
    const tomorrowStr = new Date(Date.now() + 86400000).toDateString();
    const d = date instanceof Date ? date : new Date(date);
    if (d.toDateString() === todayStr) return "Today";
    if (d.toDateString() === tomorrowStr) return "Tomorrow";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const cardBg = isDone
    ? colors.bgSecondary
    : isOverdue
    ? `${Colors.danger}08`
    : colors.bgSecondary;

  const cardBorder = showActions
    ? `${Colors.gold}55`
    : isOverdue && !isDone
    ? `${Colors.danger}30`
    : colors.border;

  return (
    <Animated.View style={{ transform: [{ translateX }], opacity, marginBottom: 10 }}>
      <View style={[styles.taskCard, { backgroundColor: cardBg, borderColor: cardBorder }, isDone && styles.taskCardDone]}>
        {/* Left priority bar */}
        <View style={[styles.priorityBar, { backgroundColor: isDone ? colors.border : isOverdue ? Colors.danger : priority.color }]} />

        {/* Checkbox */}
        <TouchableOpacity style={styles.checkboxWrap} onPress={handleToggle} activeOpacity={0.7} testID={`task-checkbox-${task.id}`}>
          {isDone ? (
            <CircleCheck size={24} color={Colors.success} />
          ) : (
            <View style={[styles.checkbox, { borderColor: isOverdue ? Colors.danger : priority.color }]}>
              <View style={[styles.checkboxInner, { backgroundColor: isOverdue ? `${Colors.danger}15` : `${priority.color}15` }]} />
            </View>
          )}
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.taskContent}>
          <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]} numberOfLines={1}>{task.title}</Text>
          {!!task.description && !isDone && (
            <Text style={styles.taskDesc} numberOfLines={1}>{task.description}</Text>
          )}
          <View style={styles.taskMeta}>
            {/* Category chip */}
            <View style={[styles.metaChip, { backgroundColor: `${category.color}15` }]}>
              <CategoryIcon size={10} color={category.color} />
              <Text style={[styles.metaChipText, { color: category.color }]}>{category.label}</Text>
            </View>
            {/* Date chip */}
            <View style={[styles.metaChip, { backgroundColor: isOverdue ? `${Colors.danger}15` : colors.bgTertiary }]}>
              <CalendarDays size={10} color={isOverdue ? Colors.danger : colors.textMuted} />
              <Text style={[styles.metaChipText, { color: isOverdue ? Colors.danger : colors.textMuted }]}>
                {isOverdue ? `Due ${formatDate(task.dueDate)}` : formatDate(task.dueDate)}
              </Text>
            </View>
            {/* Priority pill */}
            {!isDone && (
              <View style={[styles.metaChip, { backgroundColor: `${priority.color}12` }]}>
                <Flag size={9} color={priority.color} />
                <Text style={[styles.metaChipText, { color: priority.color }]}>{priority.label}</Text>
              </View>
            )}
            {/* AI badge */}
            {task.aiSuggested && (
              <View style={[styles.metaChip, { backgroundColor: `${Colors.gold}15` }]}>
                <Sparkles size={9} color={Colors.gold} />
                <Text style={[styles.metaChipText, { color: Colors.gold }]}>AI</Text>
              </View>
            )}
          </View>
        </View>

        {/* Three-dot action button */}
        <TouchableOpacity style={styles.dotMenuBtn} onPress={toggleActions} activeOpacity={0.7} testID={`task-menu-${task.id}`}>
          <Ellipsis size={17} color={showActions ? Colors.gold : colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Inline action row */}
      {showActions && (
        <Animated.View style={[styles.actionRow, { opacity: actionOpacity, transform: [{ translateY: actionTranslateY }] }]}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => { toggleActions(); onEdit(task.id); }}
            activeOpacity={0.8}
          >
            <Edit3 size={14} color={colors.textSecondary} />
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDanger]}
            onPress={() => { toggleActions(); onDelete(task.id); }}
            activeOpacity={0.8}
          >
            <Trash2 size={14} color={Colors.danger} />
            <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ── Filter Tab ───────────────────────────────────────────────────────────────
function FilterTab({ label, count, isActive, onPress }: { label: string; count: number; isActive: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={{ alignItems: "center", paddingHorizontal: 4 }} onPress={onPress} activeOpacity={0.8}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: isActive ? Colors.gold : colors.textMuted }}>{label}</Text>
        {count > 0 && (
          <View style={{ backgroundColor: isActive ? Colors.gold : colors.bgTertiary, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, minWidth: 20, alignItems: "center" }}>
            <Text style={{ fontSize: 10, fontWeight: "800", color: isActive ? "#0D1117" : colors.textMuted }}>{count}</Text>
          </View>
        )}
      </View>
      {/* Active underline */}
      <View style={{ height: 2, width: "100%", backgroundColor: isActive ? Colors.gold : "transparent", borderRadius: 2 }} />
    </TouchableOpacity>
  );
}

// ── Category Chip ────────────────────────────────────────────────────────────
function CatChip({ category, isSelected, onPress }: { category: TaskCategory | "all"; isSelected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const label = category === "all" ? "All" : categoryConfig[category].label;
  const color = category === "all" ? Colors.gold : categoryConfig[category].color;
  const CatIcon = category === "all" ? null : categoryConfig[category].icon;
  return (
    <TouchableOpacity
      style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: isSelected ? color : colors.bgSecondary, borderWidth: 1, borderColor: isSelected ? color : colors.border }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {CatIcon && <CatIcon size={11} color={isSelected ? "#fff" : color} />}
      <Text style={{ fontSize: 12, fontWeight: "600", color: isSelected ? "#fff" : color }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, count, color }: { title: string; count: number; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10, marginTop: 4 }}>
      <View style={{ width: 3, height: 14, backgroundColor: color, borderRadius: 2 }} />
      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.8, textTransform: "uppercase" }}>{title}</Text>
      <View style={{ backgroundColor: `${color}20`, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 }}>
        <Text style={{ fontSize: 10, fontWeight: "700", color }}>{count}</Text>
      </View>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
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
      const tomorrow = new Date(); tomorrow.setHours(0, 0, 0, 0); tomorrow.setDate(tomorrow.getDate() + 1);
      result = result.filter((t) => new Date(t.dueDate) >= tomorrow && t.status !== "completed");
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
    upcoming: tasks.filter((t) => { const tm = new Date(); tm.setHours(0,0,0,0); tm.setDate(tm.getDate()+1); return new Date(t.dueDate) >= tm && t.status !== "completed"; }).length,
    completed: tasks.filter((t) => t.status === "completed").length,
  }), [tasks]);

  const handleToggle = useCallback((id: string) => { toggleTaskStatus(id); }, [toggleTaskStatus]);
  const handleDelete = useCallback((id: string) => {
    const task = tasks.find((t) => t.id === id);
    Alert.alert(
      "Delete Task",
      `Delete "${task?.title ?? "this task"}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteTask(id) },
      ]
    );
  }, [tasks, deleteTask]);
  const handleEdit = useCallback((id: string) => { router.push({ pathname: "/modal", params: { editTaskId: id } }); }, [router]);
  const handleAdd = useCallback(() => { router.push("/modal"); }, [router]);

  const activeTasks = filteredTasks.filter((t) => t.status !== "completed");
  const doneTasks = filteredTasks.filter((t) => t.status === "completed");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ListChecks size={22} color={Colors.gold} />
          <Text style={styles.headerTitle}>Tasks</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => { setShowSearch(!showSearch); if (showSearch) setSearchQuery(""); }} activeOpacity={0.8}>
            <Search size={18} color={showSearch ? Colors.gold : colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={handleAdd}>
            <Plus size={20} color="#0D1117" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Search size={15} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { outlineWidth: 0 } as any]}
            placeholder="Search tasks…"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearBtn}>
              <Text style={styles.clearText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Summary Stats Strip */}
      {!searchQuery && <SummaryStrip tasks={tasks} />}

      {/* Filter tabs — underline style */}
      <View style={styles.filterRowWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          <FilterTab label="All" count={counts.all} isActive={activeFilter === "all"} onPress={() => setActiveFilter("all")} />
          <FilterTab label="Today" count={counts.today} isActive={activeFilter === "today"} onPress={() => setActiveFilter("today")} />
          <FilterTab label="Upcoming" count={counts.upcoming} isActive={activeFilter === "upcoming"} onPress={() => setActiveFilter("upcoming")} />
          <FilterTab label="Done" count={counts.completed} isActive={activeFilter === "completed"} onPress={() => setActiveFilter("completed")} />
        </ScrollView>
        <View style={{ height: 1, backgroundColor: colors.border }} />
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexShrink: 0, marginTop: 10 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 10 }}>
        <CatChip category="all" isSelected={selectedCategory === "all"} onPress={() => setSelectedCategory("all")} />
        {(Object.keys(categoryConfig) as TaskCategory[]).map((cat) => (
          <CatChip key={cat} category={cat} isSelected={selectedCategory === cat} onPress={() => setSelectedCategory(cat)} />
        ))}
      </ScrollView>

      {/* Task list */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {filteredTasks.length === 0 ? (
          <EmptyState
            searchQuery={searchQuery}
            activeFilter={activeFilter}
            onAdd={handleAdd}
            colors={colors}
          />
        ) : (
          <>
            {activeTasks.length > 0 && activeFilter !== "completed" && (
              <SectionHeader title="Active" count={activeTasks.length} color={Colors.blue} />
            )}
            {activeTasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit} />
            ))}
            {doneTasks.length > 0 && activeFilter !== "completed" && (
              <SectionHeader title="Completed" count={doneTasks.length} color={Colors.success} />
            )}
            {(activeFilter === "completed" ? filteredTasks : doneTasks).map((task) => (
              <TaskCard key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ searchQuery, activeFilter, onAdd, colors }: { searchQuery: string; activeFilter: FilterTab; onAdd: () => void; colors: any }) {
  const pulseAnim = useRef(new Animated.Value(0.95)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0.95, duration: 1000, useNativeDriver: true }),
    ])).start();
  }, []);

  const isSearch = !!searchQuery;
  const isDone = activeFilter === "completed";

  const title = isSearch ? "No results found" : isDone ? "Nothing completed yet" : "All clear!";
  const subtitle = isSearch
    ? `No tasks match "${searchQuery}"`
    : isDone
    ? "Complete your first task to see it here"
    : "You're all caught up — add a new task to stay on track";

  return (
    <View style={{ paddingTop: 60, alignItems: "center", gap: 12 }}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }], width: 80, height: 80, borderRadius: 24, backgroundColor: `${Colors.gold}12`, justifyContent: "center", alignItems: "center", borderWidth: 1.5, borderStyle: "dashed", borderColor: `${Colors.gold}30` }}>
        {isSearch ? <Search size={32} color={colors.textMuted} /> : isDone ? <CircleCheck size={32} color={Colors.success} /> : <Sparkles size={32} color={Colors.gold} />}
      </Animated.View>
      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary, textAlign: "center" }}>{title}</Text>
      <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 19, maxWidth: 240 }}>{subtitle}</Text>
      {!isSearch && !isDone && (
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, backgroundColor: Colors.gold, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 22, shadowColor: Colors.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
          onPress={onAdd}
          activeOpacity={0.85}
        >
          <Plus size={17} color="#0D1117" />
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#0D1117" }}>Add Task</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 },
  headerActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  iconBtn: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.bgSecondary, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.border },
  addBtn: { width: 42, height: 42, borderRadius: 13, backgroundColor: Colors.gold, justifyContent: "center", alignItems: "center", shadowColor: Colors.gold, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 6 },

  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: colors.bgSecondary, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.gold, gap: 8 },
  searchInput: { flex: 1, height: 38, color: colors.textPrimary, fontSize: 15 },
  clearBtn: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.bgTertiary, justifyContent: "center", alignItems: "center" },
  clearText: { color: colors.textMuted, fontSize: 15, lineHeight: 20 },

  filterRowWrap: { flexShrink: 0 },
  filterContent: { paddingHorizontal: 16, gap: 4 },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 110, paddingTop: 4 },

  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  taskCardDone: { opacity: 0.52 },

  priorityBar: { width: 4, alignSelf: "stretch", minHeight: 66 },

  checkboxWrap: { padding: 14 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  checkboxInner: { width: 12, height: 12, borderRadius: 4 },

  taskContent: { flex: 1, paddingVertical: 13, paddingRight: 8 },
  taskTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: 3 },
  taskTitleDone: { textDecorationLine: "line-through", color: colors.textMuted, fontWeight: "500" },
  taskDesc: { fontSize: 12, color: colors.textSecondary, marginBottom: 6, lineHeight: 16, fontStyle: "italic" },
  taskMeta: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  metaChipText: { fontSize: 10, fontWeight: "600" },

  dotMenuBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center", marginRight: 4 },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgSecondary,
    borderRadius: 14,
    marginTop: -4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 11 },
  actionBtnText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  actionBtnDanger: {},
  actionDivider: { width: 1, height: 28, backgroundColor: colors.border },
});
