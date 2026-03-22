import { useState, useCallback, useMemo } from "react";
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
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  X,
  Calendar,
  Flag,
  Check,
  AlertCircle,
  Zap,
  Target,
  TrendingUp,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Coins,
  Shield,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { Colors } from "@/constants/colors";
import { useTasks } from "@/providers/TasksProvider";
import { useTonConnect } from "@/hooks/useTonConnect";
import { TON_REWARD_ADDRESS } from "@/constants/api";
import type { TaskCategory, TaskPriority } from "@/types/tasks";

const categories: { key: TaskCategory; label: string; icon: typeof Target; color: string }[] = [
  { key: "work", label: "Work", icon: Target, color: Colors.blue },
  { key: "personal", label: "Personal", icon: Sparkles, color: Colors.purple },
  { key: "health", label: "Health", icon: Zap, color: Colors.success },
  { key: "learning", label: "Learning", icon: TrendingUp, color: Colors.gold },
];

const priorities: { key: TaskPriority; label: string; color: string }[] = [
  { key: "high", label: "High", color: Colors.danger },
  { key: "medium", label: "Medium", color: Colors.warning },
  { key: "low", label: "Low", color: Colors.success },
];

const STAKE_AMOUNTS = [
  { label: "0.05 TON", value: 0.05, nanotons: "50000000" },
  { label: "0.1 TON", value: 0.1, nanotons: "100000000" },
  { label: "0.5 TON", value: 0.5, nanotons: "500000000" },
];

export default function TaskModal() {
  const router = useRouter();
  const { editTaskId } = useLocalSearchParams<{ editTaskId?: string }>();
  const { tasks, addTask, updateTask } = useTasks();
  const { isConnected: isTonConnected, sendTransaction } = useTonConnect();

  const existingTask = editTaskId ? tasks.find((t) => t.id === editTaskId) : null;

  const [title, setTitle] = useState(existingTask?.title ?? "");
  const [description, setDescription] = useState(existingTask?.description ?? "");
  const [category, setCategory] = useState<TaskCategory>(existingTask?.category ?? "work");
  const [priority, setPriority] = useState<TaskPriority>(existingTask?.priority ?? "medium");
  const [dueDate, setDueDate] = useState<Date>(existingTask?.dueDate ? new Date(existingTask.dueDate) : new Date());
  const [titleError, setTitleError] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date(dueDate));

  const [stakeEnabled, setStakeEnabled] = useState(false);
  const [selectedStake, setSelectedStake] = useState(1);
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

    if (stakeEnabled && !isTonConnected) {
      Alert.alert(
        "Wallet Required",
        "Connect your TON wallet to stake TON on this task. The stake is returned when you complete it!",
        [{ text: "OK" }]
      );
      return;
    }

    setIsSaving(true);

    let stakeTxHash: string | undefined;
    let stakeAmount: number | undefined;

    if (stakeEnabled && isTonConnected && !existingTask) {
      try {
        const stake = STAKE_AMOUNTS[selectedStake];
        const result = await sendTransaction({
          to: TON_REWARD_ADDRESS,
          amount: stake.nanotons,
          comment: `Tonic AI Stake | ${title.trim()} | ${stake.value} TON`,
        });
        stakeTxHash = result.boc;
        stakeAmount = stake.value;
      } catch (err) {
        Alert.alert("Transaction Failed", "Could not stake TON. Task will be created without stake.");
      }
    }

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      status: existingTask?.status ?? ("pending" as const),
      dueDate,
      stakeAmount,
      stakeTxHash,
    };

    if (existingTask) {
      updateTask(existingTask.id, taskData);
    } else {
      addTask(taskData);
    }

    setIsSaving(false);
    router.back();
  }, [title, description, category, priority, dueDate, existingTask, addTask, updateTask, router, stakeEnabled, isTonConnected, selectedStake, sendTransaction]);

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const adjustDate = (days: number) => {
    const newDate = new Date(dueDate);
    newDate.setDate(newDate.getDate() + days);
    setDueDate(newDate);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} activeOpacity={0.8}>
            <X size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{existingTask ? "Edit Task" : "New Task"}</Text>
          <TouchableOpacity
            style={[styles.saveButton, (!title.trim() || isSaving) && styles.saveButtonDisabled]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={!title.trim() || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.bgPrimary} />
            ) : (
              <Check size={20} color={Colors.bgPrimary} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Task Title</Text>
            <View style={[styles.titleInputContainer, titleError && styles.inputError]}>
              <TextInput
                placeholder="What needs to be done?"
                placeholderTextColor={Colors.textSecondary}
                value={title}
                onChangeText={(text) => { setTitle(text); setTitleError(false); }}
                style={styles.titleInput}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>
            {titleError && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color={Colors.danger} />
                <Text style={styles.errorText}>Please enter a task title</Text>
              </View>
            )}
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <View style={styles.descriptionInputContainer}>
              <TextInput
                placeholder="Add details..."
                placeholderTextColor={Colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                style={styles.descriptionInput}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.categoryCard, isSelected && { backgroundColor: cat.color, borderColor: cat.color }]}
                    onPress={() => setCategory(cat.key)}
                    activeOpacity={0.8}
                  >
                    <Icon size={20} color={isSelected ? Colors.bgPrimary : cat.color} />
                    <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {priorities.map((prio) => {
                const isSelected = priority === prio.key;
                return (
                  <TouchableOpacity
                    key={prio.key}
                    style={[styles.priorityButton, { borderColor: prio.color }, isSelected && { backgroundColor: prio.color }]}
                    onPress={() => setPriority(prio.key)}
                    activeOpacity={0.8}
                  >
                    <Flag size={16} color={isSelected ? Colors.bgPrimary : prio.color} />
                    <Text style={[styles.priorityText, { color: isSelected ? Colors.bgPrimary : prio.color }]}>{prio.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Due Date</Text>
            <View style={styles.dateContainer}>
              <View style={styles.dateDisplay}>
                <Calendar size={20} color={Colors.gold} />
                <Text style={styles.dateText}>{formatDate(dueDate)}</Text>
              </View>
              <View style={styles.dateButtons}>
                <TouchableOpacity style={styles.dateButton} onPress={() => setDueDate(new Date())}>
                  <Text style={styles.dateButtonText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateButton} onPress={() => adjustDate(1)}>
                  <Text style={styles.dateButtonText}>+1d</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateButton} onPress={() => adjustDate(7)}>
                  <Text style={styles.dateButtonText}>+7d</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(true)}>
                  <Text style={styles.dateButtonText}>📅</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {!existingTask && (
            <View style={styles.inputSection}>
              <View style={styles.stakeHeader}>
                <View style={styles.stakeLabelRow}>
                  <Coins size={16} color={Colors.gold} />
                  <Text style={styles.inputLabel}>Stake TON to Commit</Text>
                </View>
                <TouchableOpacity
                  style={[styles.stakeToggle, stakeEnabled && styles.stakeToggleActive]}
                  onPress={() => setStakeEnabled(!stakeEnabled)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.stakeToggleThumb, stakeEnabled && styles.stakeToggleThumbActive]} />
                </TouchableOpacity>
              </View>

              {stakeEnabled && (
                <View style={styles.stakeCard}>
                  <View style={styles.stakeDescription}>
                    <Shield size={14} color={Colors.gold} />
                    <Text style={styles.stakeDescText}>
                      Stake TON as commitment. Complete the task to get it back. Miss it and it supports the community.
                    </Text>
                  </View>
                  <View style={styles.stakeAmounts}>
                    {STAKE_AMOUNTS.map((s, i) => (
                      <TouchableOpacity
                        key={s.label}
                        style={[styles.stakeAmountButton, selectedStake === i && styles.stakeAmountButtonActive]}
                        onPress={() => setSelectedStake(i)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.stakeAmountText, selectedStake === i && styles.stakeAmountTextActive]}>
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {!isTonConnected && (
                    <View style={styles.stakeWarning}>
                      <AlertCircle size={12} color={Colors.warning} />
                      <Text style={styles.stakeWarningText}>Connect your TON wallet to enable staking</Text>
                    </View>
                  )}
                  {isTonConnected && (
                    <View style={styles.stakeActive}>
                      <Check size={12} color={Colors.success} />
                      <Text style={styles.stakeActiveText}>
                        {STAKE_AMOUNTS[selectedStake].value} TON will be staked on save
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showCalendar} transparent animationType="slide" onRequestClose={() => setShowCalendar(false)}>
        <View style={styles.calendarModalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Date</Text>
              <TouchableOpacity style={styles.calendarCloseButton} onPress={() => setShowCalendar(false)}>
                <X size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.monthNavigation}>
              <TouchableOpacity
                onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                style={styles.navButton}
              >
                <ChevronLeft size={24} color={Colors.gold} />
              </TouchableOpacity>
              <Text style={styles.monthYear}>
                {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </Text>
              <TouchableOpacity
                onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                style={styles.navButton}
              >
                <ChevronRight size={24} color={Colors.gold} />
              </TouchableOpacity>
            </View>
            <View style={styles.dayHeaders}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <Text key={day} style={styles.dayHeader}>{day}</Text>
              ))}
            </View>
            <View style={styles.calendarDaysContainer}>
              {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIdx) => (
                <View key={weekIdx} style={styles.weekRow}>
                  {calendarDays.slice(weekIdx * 7, (weekIdx + 1) * 7).map((day, dayIdx) => {
                    const isToday = day && new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day).toDateString() === new Date().toDateString();
                    const isSelected = day && new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day).toDateString() === dueDate.toDateString();
                    const isPastDate = day && new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day) < new Date();
                    return (
                      <TouchableOpacity
                        key={`${weekIdx}-${dayIdx}`}
                        style={[styles.dayCell, isSelected ? styles.daySelected : undefined, isToday ? styles.dayToday : undefined]}
                        onPress={() => {
                          if (day && !isPastDate) {
                            setDueDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
                            setShowCalendar(false);
                          }
                        }}
                        disabled={isPastDate || !day}
                      >
                        {day && (
                          <Text style={[styles.dayText, isSelected ? styles.daySelectedText : undefined, isToday ? styles.dayTodayText : undefined, isPastDate ? styles.dayDisabledText : undefined]}>
                            {day}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
            <View style={styles.calendarActions}>
              <TouchableOpacity style={styles.calendarButton} onPress={() => setShowCalendar(false)}>
                <Text style={styles.calendarButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.bgSecondary, justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: Colors.textPrimary },
  saveButton: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.gold, justifyContent: "center", alignItems: "center",
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  saveButtonDisabled: { backgroundColor: Colors.border, shadowOpacity: 0, elevation: 0 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  inputSection: { marginBottom: 24 },
  inputLabel: {
    fontSize: 14, fontWeight: "600", color: Colors.textSecondary,
    marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5,
  },
  titleInputContainer: {
    backgroundColor: Colors.bgSecondary, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 4,
  },
  titleInput: {
    height: 52, backgroundColor: "transparent", color: Colors.textPrimary,
    fontSize: 18, fontWeight: "500", paddingHorizontal: 12, width: "100%",
  },
  inputError: { borderColor: Colors.danger },
  errorContainer: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  errorText: { fontSize: 13, color: Colors.danger },
  descriptionInputContainer: {
    backgroundColor: Colors.bgSecondary, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16,
  },
  descriptionInput: {
    width: "100%", backgroundColor: "transparent", color: Colors.textPrimary,
    fontSize: 15, lineHeight: 20, paddingHorizontal: 12, paddingVertical: 10, height: 80,
  },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryCard: {
    flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.border, minWidth: 100,
  },
  categoryLabel: { fontSize: 14, fontWeight: "500", color: Colors.textPrimary },
  categoryLabelSelected: { color: Colors.bgPrimary, fontWeight: "600" },
  priorityRow: { flexDirection: "row", gap: 10 },
  priorityButton: {
    flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12, backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.border, flex: 1, justifyContent: "center",
  },
  priorityText: { fontSize: 14, fontWeight: "600" },
  dateContainer: {
    backgroundColor: Colors.bgSecondary, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border,
  },
  dateDisplay: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dateText: { fontSize: 16, fontWeight: "600", color: Colors.textPrimary },
  dateButtons: { flexDirection: "row", gap: 8, justifyContent: "space-between" },
  dateButton: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: Colors.bgTertiary, alignItems: "center" },
  dateButtonText: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  stakeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 0 },
  stakeLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stakeToggle: {
    width: 48, height: 28, borderRadius: 14, backgroundColor: Colors.bgTertiary,
    justifyContent: "center", paddingHorizontal: 3, borderWidth: 1, borderColor: Colors.border,
  },
  stakeToggleActive: { backgroundColor: `${Colors.gold}30`, borderColor: Colors.gold },
  stakeToggleThumb: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.textMuted, alignSelf: "flex-start",
  },
  stakeToggleThumbActive: { backgroundColor: Colors.gold, alignSelf: "flex-end" },
  stakeCard: {
    backgroundColor: Colors.bgSecondary, borderRadius: 16, padding: 16, borderWidth: 1,
    borderColor: `${Colors.gold}30`, gap: 12, marginTop: 12,
  },
  stakeDescription: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  stakeDescText: { fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 18 },
  stakeAmounts: { flexDirection: "row", gap: 8 },
  stakeAmountButton: {
    flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.bgTertiary,
    alignItems: "center", borderWidth: 1, borderColor: Colors.border,
  },
  stakeAmountButtonActive: { backgroundColor: `${Colors.gold}20`, borderColor: Colors.gold },
  stakeAmountText: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  stakeAmountTextActive: { color: Colors.gold },
  stakeWarning: { flexDirection: "row", alignItems: "center", gap: 6 },
  stakeWarningText: { fontSize: 12, color: Colors.warning },
  stakeActive: { flexDirection: "row", alignItems: "center", gap: 6 },
  stakeActiveText: { fontSize: 12, color: Colors.success },
  calendarModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  calendarModal: {
    backgroundColor: Colors.bgPrimary, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 20, paddingBottom: 30, elevation: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.25, shadowRadius: 8,
  },
  calendarHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  calendarTitle: { fontSize: 18, fontWeight: "600", color: Colors.textPrimary },
  calendarCloseButton: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bgSecondary,
    justifyContent: "center", alignItems: "center",
  },
  calendarActions: {
    flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 20,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  calendarButton: {
    flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.gold, alignItems: "center",
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  calendarButtonText: { fontSize: 16, fontWeight: "600", color: Colors.bgPrimary },
  monthNavigation: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  navButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  monthYear: { fontSize: 16, fontWeight: "600", color: Colors.textPrimary },
  dayHeaders: { flexDirection: "row", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dayHeader: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "600", color: Colors.textMuted, textTransform: "uppercase" },
  calendarDaysContainer: { paddingHorizontal: 12, paddingTop: 8 },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  dayCell: { flex: 1, height: 40, justifyContent: "center", alignItems: "center", borderRadius: 10 },
  daySelected: { backgroundColor: Colors.gold },
  dayToday: { borderWidth: 1, borderColor: Colors.gold },
  dayText: { fontSize: 14, fontWeight: "500", color: Colors.textPrimary },
  daySelectedText: { color: Colors.bgPrimary, fontWeight: "700" },
  dayTodayText: { color: Colors.gold },
  dayDisabledText: { color: Colors.textTertiary },
});
