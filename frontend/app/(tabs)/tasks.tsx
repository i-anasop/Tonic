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
  SlidersHorizontal,
  X,
  Check,
  Brain,
  Briefcase,
  Heart,
  CalendarClock,
  CalendarCheck2,
  CalendarRange,
} from "lucide-react-native";
import { useRouter } from "expo-router";

import { Colors } from "@/constants/colors";
import { useTheme, type AppColors } from "@/providers/ThemeProvider";
import { useTasks } from "@/providers/TasksProvider";
import type { Task, TaskCategory } from "@/types/tasks";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type FilterTime = "all" | "today" | "upcoming" | "completed";
type FilterPriority = "all" | "high" | "medium" | "low";

const categoryConfig: Record<TaskCategory, { icon: typeof Target; color: string; label: string }> = {
  work:     { icon: Briefcase,  color: Colors.blue,    label: "Work" },
  personal: { icon: Heart,      color: Colors.purple,  label: "Personal" },
  health:   { icon: Flame,      color: Colors.success, label: "Health" },
  learning: { icon: Brain,      color: Colors.gold,    label: "Learn" },
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
    <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
        {stats.map(({ label, value, color, bg }) => (
          <View key={label} style={{ flex: 1, backgroundColor: bg, borderRadius: 14, paddingVertical: 10, alignItems: "center", gap: 2 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color, letterSpacing: -0.5 }}>{value}</Text>
            <Text style={{ fontSize: 10, fontWeight: "600", color: colors.textMuted }}>{label}</Text>
          </View>
        ))}
      </View>
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

// ── Filter Sheet ─────────────────────────────────────────────────────────────
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.62, 480);

interface FilterState {
  time: FilterTime;
  category: TaskCategory | "all";
  priority: FilterPriority;
}

function FilterSheet({
  visible, onClose, filters, counts, onApply,
}: {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  counts: { all: number; today: number; upcoming: number; completed: number };
  onApply: (f: FilterState) => void;
}) {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [draft, setDraft] = useState<FilterState>(filters);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraft(filters);
      setMounted(true);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, friction: 22, tension: 200, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 240, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  const reset = () => setDraft({ time: "all", category: "all", priority: "all" });

  const timeOptions: { key: FilterTime; label: string; icon: typeof Target; count: number }[] = [
    { key: "all",       label: "All",      icon: ListChecks,    count: counts.all },
    { key: "today",     label: "Today",    icon: CalendarCheck2, count: counts.today },
    { key: "upcoming",  label: "Upcoming", icon: CalendarRange,  count: counts.upcoming },
    { key: "completed", label: "Done",     icon: CircleCheck,   count: counts.completed },
  ];

  const catOptions: { key: TaskCategory | "all"; label: string; icon: typeof Target; color: string }[] = [
    { key: "all",      label: "All",      icon: Sparkles, color: Colors.gold },
    { key: "work",     label: "Work",     icon: Briefcase, color: Colors.blue },
    { key: "personal", label: "Personal", icon: Heart,     color: Colors.purple },
    { key: "health",   label: "Health",   icon: Flame,     color: Colors.success },
    { key: "learning", label: "Learn",    icon: Brain,     color: Colors.gold },
  ];

  const priOptions: { key: FilterPriority; label: string; color: string }[] = [
    { key: "all",    label: "All",  color: colors.textSecondary },
    { key: "high",   label: "High", color: Colors.danger },
    { key: "medium", label: "Med",  color: Colors.warning },
    { key: "low",    label: "Low",  color: Colors.success },
  ];

  // count tasks matching current draft (rough estimate for apply button)
  const chipBase = { flexDirection: "row" as const, alignItems: "center" as const, gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 };

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.55)", opacity: backdropAnim, zIndex: 10 }}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: SHEET_HEIGHT,
          backgroundColor: colors.bgSecondary,
          borderTopLeftRadius: 26, borderTopRightRadius: 26,
          borderWidth: 1, borderColor: colors.border,
          transform: [{ translateY: slideAnim }],
          zIndex: 11,
          shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 20,
        }}
      >
        {/* Handle */}
        <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 6 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
        </View>

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16 }}>
          <SlidersHorizontal size={16} color={Colors.gold} />
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.textPrimary, flex: 1, marginLeft: 8 }}>Filters</Text>
          <TouchableOpacity onPress={reset} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.bgTertiary, marginRight: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textSecondary }}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgTertiary, justifyContent: "center", alignItems: "center" }}>
            <X size={15} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 20 }}>
          {/* WHEN section */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>When</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {timeOptions.map(({ key, label, icon: Icon, count }) => {
                const active = draft.time === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[chipBase, { backgroundColor: active ? Colors.gold : colors.bgTertiary, borderColor: active ? Colors.gold : colors.border }]}
                    onPress={() => setDraft((d) => ({ ...d, time: key }))}
                    activeOpacity={0.8}
                  >
                    <Icon size={13} color={active ? "#0D1117" : colors.textSecondary} />
                    <Text style={{ fontSize: 13, fontWeight: "700", color: active ? "#0D1117" : colors.textSecondary }}>{label}</Text>
                    {count > 0 && (
                      <View style={{ backgroundColor: active ? "rgba(0,0,0,0.15)" : colors.bgSecondary, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 }}>
                        <Text style={{ fontSize: 10, fontWeight: "800", color: active ? "#0D1117" : colors.textMuted }}>{count}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* CATEGORY section */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Category</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {catOptions.map(({ key, label, icon: Icon, color }) => {
                const active = draft.category === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[chipBase, { backgroundColor: active ? color : colors.bgTertiary, borderColor: active ? color : colors.border }]}
                    onPress={() => setDraft((d) => ({ ...d, category: key }))}
                    activeOpacity={0.8}
                  >
                    <Icon size={13} color={active ? "#fff" : color} />
                    <Text style={{ fontSize: 13, fontWeight: "700", color: active ? "#fff" : color }}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* PRIORITY section */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Priority</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {priOptions.map(({ key, label, color }) => {
                const active = draft.priority === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[chipBase, { backgroundColor: active ? color : colors.bgTertiary, borderColor: active ? color : colors.border, flexDirection: "row", gap: 6 }]}
                    onPress={() => setDraft((d) => ({ ...d, priority: key }))}
                    activeOpacity={0.8}
                  >
                    {key !== "all" && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: active ? "#fff" : color }} />}
                    {key === "all" && <Check size={12} color={active ? "#fff" : color} />}
                    <Text style={{ fontSize: 13, fontWeight: "700", color: active ? "#fff" : color }}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Apply button — floated above bottom */}
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: colors.bgSecondary, borderTopWidth: 1, borderTopColor: colors.border }}>
          <TouchableOpacity
            style={{ backgroundColor: Colors.gold, borderRadius: 16, paddingVertical: 15, alignItems: "center", shadowColor: Colors.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
            onPress={() => { onApply(draft); onClose(); }}
            activeOpacity={0.88}
          >
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#0D1117" }}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

// ── Active Filter Pills ───────────────────────────────────────────────────────
function ActiveFilterBar({ filters, taskCount, onClear, onClearOne }: {
  filters: FilterState;
  taskCount: number;
  onClear: () => void;
  onClearOne: (key: keyof FilterState) => void;
}) {
  const { colors } = useTheme();
  const isDefault = filters.time === "all" && filters.category === "all" && filters.priority === "all";
  if (isDefault) return null;

  const pills: { key: keyof FilterState; label: string; color: string }[] = [];
  if (filters.time !== "all") {
    const labels: Record<FilterTime, string> = { all: "All", today: "Today", upcoming: "Upcoming", completed: "Done" };
    pills.push({ key: "time", label: labels[filters.time], color: Colors.blue });
  }
  if (filters.category !== "all") {
    pills.push({ key: "category", label: categoryConfig[filters.category as TaskCategory].label, color: categoryConfig[filters.category as TaskCategory].color });
  }
  if (filters.priority !== "all") {
    pills.push({ key: "priority", label: priorityConfig[filters.priority].label, color: priorityConfig[filters.priority].color });
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10, gap: 8 }}>
      {pills.map(({ key, label, color }) => (
        <TouchableOpacity
          key={key}
          style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: `${color}18`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: `${color}35` }}
          onPress={() => onClearOne(key)}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color }}>{label}</Text>
          <X size={10} color={color} />
        </TouchableOpacity>
      ))}
      <Text style={{ fontSize: 12, color: colors.textMuted, flex: 1 }}>{taskCount} task{taskCount !== 1 ? "s" : ""}</Text>
      <TouchableOpacity onPress={onClear}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: Colors.danger }}>Clear all</Text>
      </TouchableOpacity>
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

  return (
    <Animated.View style={{ transform: [{ translateX }], opacity, marginBottom: 10 }}>
      <View style={[styles.taskCard, {
        backgroundColor: isDone ? colors.bgSecondary : isOverdue ? `${Colors.danger}08` : colors.bgSecondary,
        borderColor: showActions ? `${Colors.gold}55` : isOverdue && !isDone ? `${Colors.danger}30` : colors.border,
      }, isDone && styles.taskCardDone]}>
        <View style={[styles.priorityBar, { backgroundColor: isDone ? colors.border : isOverdue ? Colors.danger : priority.color }]} />
        <TouchableOpacity style={styles.checkboxWrap} onPress={handleToggle} activeOpacity={0.7}>
          {isDone ? (
            <CircleCheck size={24} color={Colors.success} />
          ) : (
            <View style={[styles.checkbox, { borderColor: isOverdue ? Colors.danger : priority.color }]}>
              <View style={[styles.checkboxInner, { backgroundColor: isOverdue ? `${Colors.danger}15` : `${priority.color}15` }]} />
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.taskContent}>
          <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]} numberOfLines={1}>{task.title}</Text>
          {!!task.description && !isDone && (
            <Text style={styles.taskDesc} numberOfLines={1}>{task.description}</Text>
          )}
          <View style={styles.taskMeta}>
            <View style={[styles.metaChip, { backgroundColor: `${category.color}15` }]}>
              <CategoryIcon size={10} color={category.color} />
              <Text style={[styles.metaChipText, { color: category.color }]}>{category.label}</Text>
            </View>
            <View style={[styles.metaChip, { backgroundColor: isOverdue ? `${Colors.danger}15` : colors.bgTertiary }]}>
              <CalendarDays size={10} color={isOverdue ? Colors.danger : colors.textMuted} />
              <Text style={[styles.metaChipText, { color: isOverdue ? Colors.danger : colors.textMuted }]}>
                {isOverdue ? `Due ${formatDate(task.dueDate)}` : formatDate(task.dueDate)}
              </Text>
            </View>
            {!isDone && (
              <View style={[styles.metaChip, { backgroundColor: `${priority.color}12` }]}>
                <Flag size={9} color={priority.color} />
                <Text style={[styles.metaChipText, { color: priority.color }]}>{priority.label}</Text>
              </View>
            )}
            {task.aiSuggested && (
              <View style={[styles.metaChip, { backgroundColor: `${Colors.gold}15` }]}>
                <Sparkles size={9} color={Colors.gold} />
                <Text style={[styles.metaChipText, { color: Colors.gold }]}>AI</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.dotMenuBtn} onPress={toggleActions} activeOpacity={0.7}>
          <Ellipsis size={17} color={showActions ? Colors.gold : colors.textMuted} />
        </TouchableOpacity>
      </View>
      {showActions && (
        <Animated.View style={[styles.actionRow, { opacity: actionOpacity, transform: [{ translateY: actionTranslateY }] }]}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => { toggleActions(); onEdit(task.id); }} activeOpacity={0.8}>
            <Edit3 size={14} color={colors.textSecondary} />
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => { toggleActions(); onDelete(task.id); }} activeOpacity={0.8}>
            <Trash2 size={14} color={Colors.danger} />
            <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
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

  const [filters, setFilters] = useState<FilterState>({ time: "all", category: "all", priority: "all" });
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (filters.time === "today") {
      const today = new Date().toDateString();
      result = result.filter((t) => new Date(t.dueDate).toDateString() === today);
    } else if (filters.time === "upcoming") {
      const tomorrow = new Date(); tomorrow.setHours(0, 0, 0, 0); tomorrow.setDate(tomorrow.getDate() + 1);
      result = result.filter((t) => new Date(t.dueDate) >= tomorrow && t.status !== "completed");
    } else if (filters.time === "completed") {
      result = result.filter((t) => t.status === "completed");
    }
    if (filters.category !== "all") result = result.filter((t) => t.category === filters.category);
    if (filters.priority !== "all") result = result.filter((t) => t.priority === filters.priority);
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
  }, [tasks, filters, searchQuery]);

  const counts = useMemo(() => ({
    all: tasks.filter((t) => t.status !== "completed").length,
    today: tasks.filter((t) => new Date(t.dueDate).toDateString() === new Date().toDateString() && t.status !== "completed").length,
    upcoming: tasks.filter((t) => { const tm = new Date(); tm.setHours(0,0,0,0); tm.setDate(tm.getDate()+1); return new Date(t.dueDate) >= tm && t.status !== "completed"; }).length,
    completed: tasks.filter((t) => t.status === "completed").length,
  }), [tasks]);

  const isFiltered = filters.time !== "all" || filters.category !== "all" || filters.priority !== "all";

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

  const clearFilter = useCallback((key: keyof FilterState) => {
    setFilters((f) => ({ ...f, [key]: "all" }));
  }, []);

  const activeTasks = filteredTasks.filter((t) => t.status !== "completed");
  const doneTasks = filteredTasks.filter((t) => t.status === "completed");

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ListChecks size={22} color={Colors.gold} />
            <Text style={styles.headerTitle}>Tasks</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => { setShowSearch(!showSearch); if (showSearch) setSearchQuery(""); }}
              activeOpacity={0.8}
            >
              <Search size={18} color={showSearch ? Colors.gold : colors.textSecondary} />
            </TouchableOpacity>
            {/* Filter button with active dot */}
            <TouchableOpacity
              style={[styles.iconBtn, isFiltered && { borderColor: Colors.gold, backgroundColor: `${Colors.gold}12` }]}
              onPress={() => setShowFilterSheet(true)}
              activeOpacity={0.8}
            >
              <SlidersHorizontal size={18} color={isFiltered ? Colors.gold : colors.textSecondary} />
              {isFiltered && (
                <View style={{ position: "absolute", top: 9, right: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.gold, borderWidth: 1.5, borderColor: colors.bgPrimary }} />
              )}
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

        {/* Active filter pills */}
        <ActiveFilterBar
          filters={filters}
          taskCount={filteredTasks.length}
          onClear={() => setFilters({ time: "all", category: "all", priority: "all" })}
          onClearOne={clearFilter}
        />

        {/* Task list */}
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {filteredTasks.length === 0 ? (
            <EmptyState searchQuery={searchQuery} isFiltered={isFiltered} onAdd={handleAdd} onClearFilter={() => setFilters({ time: "all", category: "all", priority: "all" })} colors={colors} />
          ) : (
            <>
              {activeTasks.length > 0 && filters.time !== "completed" && (
                <SectionHeader title="Active" count={activeTasks.length} color={Colors.blue} />
              )}
              {activeTasks.map((task) => (
                <TaskCard key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit} />
              ))}
              {doneTasks.length > 0 && filters.time !== "completed" && (
                <SectionHeader title="Completed" count={doneTasks.length} color={Colors.success} />
              )}
              {(filters.time === "completed" ? filteredTasks : doneTasks).map((task) => (
                <TaskCard key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit} />
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Filter Sheet — rendered outside SafeAreaView so it can cover full screen */}
      <FilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        filters={filters}
        counts={counts}
        onApply={(f) => setFilters(f)}
      />
    </View>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ searchQuery, isFiltered, onAdd, onClearFilter, colors }: {
  searchQuery: string; isFiltered: boolean; onAdd: () => void; onClearFilter: () => void; colors: any;
}) {
  const pulseAnim = useRef(new Animated.Value(0.95)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0.95, duration: 1000, useNativeDriver: true }),
    ])).start();
  }, []);

  const isSearch = !!searchQuery;
  const title = isSearch ? "No results found" : isFiltered ? "No matching tasks" : "All clear!";
  const subtitle = isSearch
    ? `No tasks match "${searchQuery}"`
    : isFiltered
    ? "Try adjusting or clearing your filters"
    : "You're all caught up — add a task to get started";

  return (
    <View style={{ paddingTop: 60, alignItems: "center", gap: 12 }}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }], width: 80, height: 80, borderRadius: 24, backgroundColor: `${Colors.gold}12`, justifyContent: "center", alignItems: "center", borderWidth: 1.5, borderStyle: "dashed", borderColor: `${Colors.gold}30` }}>
        {isSearch ? <Search size={32} color={colors.textMuted} /> : isFiltered ? <SlidersHorizontal size={32} color={Colors.gold} /> : <Sparkles size={32} color={Colors.gold} />}
      </Animated.View>
      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary, textAlign: "center" }}>{title}</Text>
      <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 19, maxWidth: 240 }}>{subtitle}</Text>
      {isFiltered && !isSearch && (
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, backgroundColor: colors.bgSecondary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}
          onPress={onClearFilter}
          activeOpacity={0.8}
        >
          <X size={14} color={colors.textSecondary} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary }}>Clear Filters</Text>
        </TouchableOpacity>
      )}
      {!isSearch && !isFiltered && (
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

  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 110, paddingTop: 4 },

  taskCard: { flexDirection: "row", alignItems: "center", borderRadius: 18, borderWidth: 1.5, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
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
  actionRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.bgSecondary, borderRadius: 14, marginTop: -4, marginBottom: 4, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 11 },
  actionBtnText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  actionBtnDanger: {},
  actionDivider: { width: 1, height: 28, backgroundColor: colors.border },
});
