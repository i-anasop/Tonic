import { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  TextInput,
  Modal,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  X,
  Calendar,
  Flag,
  Check,
  AlertCircle as AlertCircleIcon,
  Zap,
  Target,
  TrendingUp,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Heart,
  Brain,
  Flame,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { Colors } from "@/constants/colors";
import { useTheme, type AppColors } from "@/providers/ThemeProvider";
import { useTasks } from "@/providers/TasksProvider";
import type { TaskCategory, TaskPriority } from "@/types/tasks";

const categories: { key: TaskCategory; label: string; icon: typeof Target; color: string; emoji: string }[] = [
  { key: "work",     label: "Work",     icon: Briefcase,   color: Colors.blue,    emoji: "💼" },
  { key: "personal", label: "Personal", icon: Heart,       color: Colors.purple,  emoji: "🌟" },
  { key: "health",   label: "Health",   icon: Flame,       color: Colors.success, emoji: "💪" },
  { key: "learning", label: "Learning", icon: Brain,       color: Colors.gold,    emoji: "📚" },
];

const priorities: { key: TaskPriority; label: string; color: string; dot: string }[] = [
  { key: "high",   label: "High",   color: Colors.danger,  dot: "🔴" },
  { key: "medium", label: "Medium", color: Colors.warning, dot: "🟡" },
  { key: "low",    label: "Low",    color: Colors.success, dot: "🟢" },
];

export default function TaskModal() {
  const router = useRouter();
  const { editTaskId } = useLocalSearchParams<{ editTaskId?: string }>();
  const { tasks, addTask, updateTask } = useTasks();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const existingTask = editTaskId ? tasks.find((t) => t.id === editTaskId) : null;

  const [title, setTitle] = useState(existingTask?.title ?? "");
  const [description, setDescription] = useState(existingTask?.description ?? "");
  const [category, setCategory] = useState<TaskCategory>(existingTask?.category ?? "work");
  const [priority, setPriority] = useState<TaskPriority>(existingTask?.priority ?? "medium");
  const [dueDate, setDueDate] = useState<Date>(existingTask?.dueDate ? new Date(existingTask.dueDate) : new Date());
  const [titleError, setTitleError] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date(dueDate));
  const [isSaving, setIsSaving] = useState(false);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [calendarMonth]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setTitleError(true);
      return;
    }
    setIsSaving(true);
    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      status: existingTask?.status ?? ("pending" as const),
      dueDate,
    };
    if (existingTask) {
      updateTask(existingTask.id, taskData);
    } else {
      addTask(taskData);
    }
    setIsSaving(false);
    router.back();
  }, [title, description, category, priority, dueDate, existingTask, addTask, updateTask, router]);

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    const nextWeek = new Date(today.getTime() + 7 * 86400000);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    if (date.toDateString() === nextWeek.toDateString()) return "Next week";
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const quickDates = [
    { label: "Today",      date: new Date() },
    { label: "Tomorrow",   date: new Date(Date.now() + 86400000) },
    { label: "This week",  date: new Date(Date.now() + 3 * 86400000) },
    { label: "Next week",  date: new Date(Date.now() + 7 * 86400000) },
  ];

  const selectedCat = categories.find((c) => c.key === category)!;
  const selectedPri = priorities.find((p) => p.key === priority)!;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <X size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{existingTask ? "Edit Task" : "New Task"}</Text>
            <View style={styles.aiHint}>
              <Sparkles size={10} color={Colors.gold} />
              <Text style={styles.aiHintText}>AI-powered</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, (!title.trim() || isSaving) && styles.saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={!title.trim() || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#0D1117" />
            ) : (
              <Check size={18} color="#0D1117" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Title Input ── */}
          <View style={styles.section}>
            <View style={[styles.titleWrap, titleFocused && styles.titleWrapFocused, titleError && styles.titleWrapError]}>
              <TextInput
                placeholder="What needs to get done?"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={(t) => { setTitle(t); setTitleError(false); }}
                style={styles.titleInput}
                returnKeyType="done"
                onSubmitEditing={handleSave}
                onFocus={() => setTitleFocused(true)}
                onBlur={() => setTitleFocused(false)}
                maxLength={100}
              />
              <Text style={styles.charCount}>{title.length}/100</Text>
            </View>
            {titleError && (
              <View style={styles.errorRow}>
                <AlertCircleIcon size={13} color={Colors.danger} />
                <Text style={styles.errorText}>Please enter a task title</Text>
              </View>
            )}
          </View>

          {/* ── Category ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => {
                const isSelected = category === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.catCard, isSelected && { backgroundColor: cat.color, borderColor: cat.color }]}
                    onPress={() => setCategory(cat.key)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.catIconWrap, { backgroundColor: isSelected ? "rgba(255,255,255,0.25)" : `${cat.color}18` }]}>
                      <cat.icon size={18} color={isSelected ? "#fff" : cat.color} />
                    </View>
                    <Text style={[styles.catLabel, isSelected && styles.catLabelSelected]}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Priority ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {priorities.map((prio) => {
                const isSelected = priority === prio.key;
                return (
                  <TouchableOpacity
                    key={prio.key}
                    style={[styles.prioBtn, { borderColor: isSelected ? prio.color : colors.border }, isSelected && { backgroundColor: `${prio.color}18` }]}
                    onPress={() => setPriority(prio.key)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.prioDot, { backgroundColor: prio.color }]} />
                    <Text style={[styles.prioText, { color: isSelected ? prio.color : colors.textSecondary }, isSelected && { fontWeight: "700" }]}>
                      {prio.label}
                    </Text>
                    {isSelected && <Flag size={13} color={prio.color} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Due Date ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Due Date</Text>
            <View style={styles.dateCard}>
              <View style={styles.dateCurrent}>
                <View style={styles.dateIconWrap}>
                  <Calendar size={18} color={Colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dateLabel}>Due</Text>
                  <Text style={styles.dateValue}>{formatDate(dueDate)}</Text>
                </View>
                <TouchableOpacity style={styles.calendarBtn} onPress={() => setShowCalendar(true)} activeOpacity={0.8}>
                  <Text style={styles.calendarBtnText}>Pick</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateChips}>
                {quickDates.map(({ label, date }) => {
                  const isActive = dueDate.toDateString() === date.toDateString();
                  return (
                    <TouchableOpacity
                      key={label}
                      style={[styles.dateChip, isActive && styles.dateChipActive]}
                      onPress={() => setDueDate(date)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.dateChipText, isActive && styles.dateChipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* ── Description ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notes <Text style={styles.optionalLabel}>(optional)</Text></Text>
            <View style={[styles.descWrap, descFocused && styles.descWrapFocused]}>
              <TextInput
                placeholder="Add details, links, or context…"
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                style={styles.descInput}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                onFocus={() => setDescFocused(true)}
                onBlur={() => setDescFocused(false)}
              />
            </View>
          </View>

          {/* ── Summary pill ── */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryPill, { backgroundColor: `${selectedCat.color}15`, borderColor: `${selectedCat.color}30` }]}>
              <selectedCat.icon size={12} color={selectedCat.color} />
              <Text style={[styles.summaryPillText, { color: selectedCat.color }]}>{selectedCat.label}</Text>
            </View>
            <View style={[styles.summaryPill, { backgroundColor: `${selectedPri.color}12`, borderColor: `${selectedPri.color}25` }]}>
              <View style={[styles.prioDot, { backgroundColor: selectedPri.color, width: 6, height: 6 }]} />
              <Text style={[styles.summaryPillText, { color: selectedPri.color }]}>{selectedPri.label} priority</Text>
            </View>
            <View style={[styles.summaryPill, { backgroundColor: `${Colors.gold}12`, borderColor: `${Colors.gold}25` }]}>
              <Calendar size={11} color={Colors.gold} />
              <Text style={[styles.summaryPillText, { color: Colors.gold }]}>{formatDate(dueDate)}</Text>
            </View>
          </View>

          {/* ── Create Button ── */}
          <TouchableOpacity
            style={[styles.createBtn, (!title.trim() || isSaving) && styles.createBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={!title.trim() || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#0D1117" />
            ) : (
              <>
                <Check size={18} color="#0D1117" />
                <Text style={styles.createBtnText}>{existingTask ? "Save Changes" : "Create Task"}</Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Calendar Modal ── */}
      <Modal visible={showCalendar} transparent animationType="slide" onRequestClose={() => setShowCalendar(false)}>
        <View style={styles.calOverlay}>
          <View style={styles.calSheet}>
            <View style={styles.calHandle} />
            <View style={styles.calHeader}>
              <Text style={styles.calTitle}>Pick a Date</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.calNav}>
              <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))} style={styles.calNavBtn}>
                <ChevronLeft size={22} color={Colors.gold} />
              </TouchableOpacity>
              <Text style={styles.calMonthText}>
                {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </Text>
              <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))} style={styles.calNavBtn}>
                <ChevronRight size={22} color={Colors.gold} />
              </TouchableOpacity>
            </View>
            <View style={styles.calDayHeaders}>
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                <Text key={d} style={styles.calDayHeader}>{d}</Text>
              ))}
            </View>
            <View style={styles.calDays}>
              {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIdx) => (
                <View key={weekIdx} style={styles.calWeek}>
                  {calendarDays.slice(weekIdx * 7, (weekIdx + 1) * 7).map((day, dayIdx) => {
                    const dateForDay = day ? new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day) : null;
                    const isToday = dateForDay?.toDateString() === new Date().toDateString();
                    const isSelected = dateForDay?.toDateString() === dueDate.toDateString();
                    const isPast = dateForDay ? dateForDay < new Date(new Date().setHours(0,0,0,0)) : false;
                    return (
                      <TouchableOpacity
                        key={`${weekIdx}-${dayIdx}`}
                        style={[styles.calDay, isSelected && styles.calDaySelected, isToday && !isSelected && styles.calDayToday]}
                        onPress={() => {
                          if (day && !isPast && dateForDay) {
                            setDueDate(dateForDay);
                            setShowCalendar(false);
                          }
                        }}
                        disabled={isPast || !day}
                        activeOpacity={0.8}
                      >
                        {day ? (
                          <Text style={[styles.calDayText, isSelected && styles.calDayTextSelected, isToday && !isSelected && styles.calDayTextToday, isPast && styles.calDayTextPast]}>
                            {day}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
            <View style={styles.calFooter}>
              <TouchableOpacity style={styles.calDoneBtn} onPress={() => setShowCalendar(false)} activeOpacity={0.85}>
                <Text style={styles.calDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  keyboardView: { flex: 1 },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.bgSecondary,
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.bgTertiary, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: colors.border,
  },
  headerCenter: { alignItems: "center", gap: 3 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, letterSpacing: -0.2 },
  aiHint: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: `${Colors.gold}15`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: `${Colors.gold}25` },
  aiHintText: { fontSize: 10, fontWeight: "700", color: Colors.gold, letterSpacing: 0.3 },
  saveBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.gold, justifyContent: "center", alignItems: "center",
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 5,
  },
  saveBtnDisabled: { backgroundColor: colors.border, shadowOpacity: 0, elevation: 0 },

  scroll: { flex: 1 },
  scrollContent: { padding: 18, paddingBottom: 48 },

  section: { marginBottom: 22 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 10 },
  optionalLabel: { fontSize: 11, fontWeight: "500", color: colors.textMuted, textTransform: "none", letterSpacing: 0 },

  titleWrap: {
    backgroundColor: colors.bgSecondary, borderRadius: 18, borderWidth: 1.5,
    borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 6,
  },
  titleWrapFocused: { borderColor: Colors.gold, shadowColor: Colors.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 2 },
  titleWrapError: { borderColor: Colors.danger },
  titleInput: {
    height: 54, color: colors.textPrimary, fontSize: 20, fontWeight: "600",
    paddingHorizontal: 0, paddingVertical: 0,
  },
  charCount: { fontSize: 10, color: colors.textMuted, textAlign: "right", paddingBottom: 6 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 7 },
  errorText: { fontSize: 12, color: Colors.danger, fontWeight: "500" },

  categoryGrid: { flexDirection: "row", gap: 10 },
  catCard: {
    flex: 1, alignItems: "center", gap: 8, paddingVertical: 14,
    borderRadius: 16, backgroundColor: colors.bgSecondary,
    borderWidth: 1.5, borderColor: colors.border,
  },
  catIconWrap: { width: 38, height: 38, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  catLabel: { fontSize: 11, fontWeight: "600", color: colors.textSecondary, textAlign: "center" },
  catLabelSelected: { color: "#fff", fontWeight: "700" },

  priorityRow: { flexDirection: "row", gap: 10 },
  prioBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 13, borderRadius: 14,
    backgroundColor: colors.bgSecondary, borderWidth: 1.5, borderColor: colors.border,
  },
  prioDot: { width: 8, height: 8, borderRadius: 4 },
  prioText: { fontSize: 13, fontWeight: "600" },

  dateCard: {
    backgroundColor: colors.bgSecondary, borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: "hidden",
  },
  dateCurrent: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  dateIconWrap: { width: 38, height: 38, borderRadius: 11, backgroundColor: `${Colors.gold}15`, justifyContent: "center", alignItems: "center" },
  dateLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "500" },
  dateValue: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginTop: 1 },
  calendarBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: `${Colors.gold}15`, borderWidth: 1, borderColor: `${Colors.gold}30` },
  calendarBtnText: { fontSize: 12, fontWeight: "700", color: Colors.gold },

  dateChips: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  dateChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.bgTertiary, borderWidth: 1, borderColor: colors.border },
  dateChipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  dateChipText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
  dateChipTextActive: { color: "#0D1117" },

  descWrap: {
    backgroundColor: colors.bgSecondary, borderRadius: 16, borderWidth: 1.5,
    borderColor: colors.border, padding: 14,
  },
  descWrapFocused: { borderColor: `${Colors.gold}60` },
  descInput: {
    color: colors.textPrimary, fontSize: 14, lineHeight: 21,
    minHeight: 72, paddingHorizontal: 0,
  },

  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  summaryPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  summaryPillText: { fontSize: 11, fontWeight: "600" },

  createBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.gold, borderRadius: 18, paddingVertical: 17,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  createBtnDisabled: { backgroundColor: colors.border, shadowOpacity: 0, elevation: 0 },
  createBtnText: { fontSize: 16, fontWeight: "800", color: "#0D1117", letterSpacing: -0.3 },

  calOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  calSheet: {
    backgroundColor: colors.bgPrimary, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingBottom: 30, paddingTop: 12,
  },
  calHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 16 },
  calHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 16 },
  calTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  calNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 14 },
  calNavBtn: { padding: 8, borderRadius: 10, backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border },
  calMonthText: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  calDayHeaders: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 6 },
  calDayHeader: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase" },
  calDays: { paddingHorizontal: 16 },
  calWeek: { flexDirection: "row", marginBottom: 4 },
  calDay: { flex: 1, aspectRatio: 1, justifyContent: "center", alignItems: "center", borderRadius: 10, maxHeight: 42 },
  calDaySelected: { backgroundColor: Colors.gold },
  calDayToday: { borderWidth: 1.5, borderColor: Colors.gold },
  calDayText: { fontSize: 14, fontWeight: "500", color: colors.textPrimary },
  calDayTextSelected: { color: "#0D1117", fontWeight: "800" },
  calDayTextToday: { color: Colors.gold, fontWeight: "700" },
  calDayTextPast: { color: colors.textMuted, opacity: 0.4 },
  calFooter: { paddingHorizontal: 20, paddingTop: 16 },
  calDoneBtn: { backgroundColor: Colors.gold, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  calDoneBtnText: { fontSize: 16, fontWeight: "700", color: "#0D1117" },
});
