import React, { useEffect, useRef, useCallback, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Animated,
  TouchableOpacity,
  RefreshControl,
  Image,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import {
  Sparkles,
  Zap,
  TrendingUp,
  Flame,
  Target,
  Plus,
  ChevronRight,
  AlertCircle,
  Wallet,
  X,
  ShieldCheck,
  Bot,
  Brain,
  Briefcase,
  Heart,
  Trophy,
  Star,
  CheckSquare,
} from "lucide-react-native";
import { useRouter } from "expo-router";

import { Colors } from "@/constants/colors";
import { useTheme, type AppColors } from "@/providers/ThemeProvider";
import { useAppState } from "@/providers/AppStateProvider";
import { useTasks } from "@/providers/TasksProvider";
import { useAchievements } from "@/providers/AchievementsProvider";
import { useTonConnect } from "@/hooks/useTonConnect";
import type { Task, AIInsight } from "@/types/tasks";

// ── Progress Ring ────────────────────────────────────────────────────────────
function ProgressRing({ progress, size = 120, strokeWidth = 11 }: { progress: number; size?: number; strokeWidth?: number }) {
  const { colors } = useTheme();
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const [displayProgress, setDisplayProgress] = React.useState(0);

  useEffect(() => {
    Animated.timing(animatedProgress, { toValue: progress, duration: 1200, useNativeDriver: false }).start();
    const listener = animatedProgress.addListener(({ value }) => setDisplayProgress(Math.round(value)));
    return () => animatedProgress.removeListener(listener);
  }, [progress]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayProgress / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={`${Colors.gold}18`} strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={Colors.gold} strokeWidth={strokeWidth} fill="none" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      <Text style={{ fontSize: 26, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 }}>{displayProgress}%</Text>
      <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" }}>Today</Text>
    </View>
  );
}

// ── Animated Stat Pill ───────────────────────────────────────────────────────
function StatPill({ icon: Icon, value, label, color, animValue }: { icon: React.ElementType; value: string | number; label: string; color: string; animValue: Animated.Value }) {
  const { colors } = useTheme();
  const scale = animValue.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });
  return (
    <Animated.View style={{ flex: 1, alignItems: "center", gap: 3, transform: [{ scale }] }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${color}18`, justifyContent: "center", alignItems: "center", marginBottom: 2 }}>
        <Icon size={17} color={color} />
      </View>
      <Text style={{ fontSize: 19, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 }}>{value}</Text>
      <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: "500" }}>{label}</Text>
    </Animated.View>
  );
}

// ── Task Item ────────────────────────────────────────────────────────────────
function TaskItem({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const categoryColors: Record<string, string> = { work: Colors.blue, personal: Colors.purple, health: Colors.success, learning: Colors.gold };
  const priorityColors: Record<string, string> = { high: Colors.danger, medium: Colors.warning, low: Colors.success };
  const catColor = categoryColors[task.category] ?? Colors.blue;
  const priColor = priorityColors[task.priority] ?? Colors.warning;

  const handleToggle = () => {
    if (task.status !== "completed") {
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 150, useNativeDriver: false }),
        Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
      ]).start();
    }
    onToggle(task.id);
  };

  const bgColor = flashAnim.interpolate({ inputRange: [0, 1], outputRange: [colors.bgSecondary, `${Colors.success}18`] });

  return (
    <Animated.View style={[styles.taskItem, task.status === "completed" && styles.taskCompleted, { backgroundColor: bgColor }]}>
      <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", flex: 1 }} activeOpacity={0.75} onPress={handleToggle}>
        <View style={[styles.taskCatBar, { backgroundColor: catColor }]} />
        <View style={styles.taskCheckbox}>
          {task.status === "completed" ? (
            <View style={styles.checkboxFilled}><Text style={styles.checkmark}>✓</Text></View>
          ) : (
            <View style={[styles.checkboxEmpty, { borderColor: priColor }]} />
          )}
        </View>
        <View style={styles.taskBody}>
          <Text style={[styles.taskTitle, task.status === "completed" && styles.taskTitleDone]} numberOfLines={1}>{task.title}</Text>
          {task.aiSuggested && (
            <View style={styles.aiBadge}><Sparkles size={9} color={Colors.gold} /><Text style={styles.aiBadgeText}>AI</Text></View>
          )}
        </View>
        <View style={[styles.priDot, { backgroundColor: priColor }]} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Weekly Chart ─────────────────────────────────────────────────────────────
function WeeklyChart({ data }: { data: number[] }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const maxValue = Math.max(...data, 1);
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const todayIdx = (new Date().getDay() + 6) % 7;
  return (
    <View style={styles.chartWrap}>
      {data.map((value, i) => {
        const h = Math.max((value / maxValue) * 72, value > 0 ? 8 : 0);
        const isToday = i === todayIdx;
        return (
          <View key={i} style={styles.barCol}>
            <View style={[styles.barTrack, { height: 72 }]}>
              <View style={[styles.barFill, { height: h, backgroundColor: isToday ? Colors.gold : `${Colors.gold}35`, borderTopLeftRadius: 4, borderTopRightRadius: 4 }]} />
            </View>
            <Text style={[styles.barLabel, isToday && { color: Colors.gold, fontWeight: "700" }]}>{days[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Insight Banner ───────────────────────────────────────────────────────────
function InsightBanner({ insight }: { insight: AIInsight }) {
  const { colors } = useTheme();
  const isWarning = insight.type === "warning";
  const accentColor = isWarning ? Colors.warning : Colors.gold;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: `${accentColor}10`, borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: `${accentColor}25` }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${accentColor}20`, justifyContent: "center", alignItems: "center" }}>
        {isWarning ? <AlertCircle size={18} color={accentColor} /> : <Sparkles size={18} color={accentColor} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: accentColor, marginBottom: 2 }}>{insight.title}</Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 17 }} numberOfLines={2}>{insight.description}</Text>
      </View>
    </View>
  );
}

// ── TON Connect CTA ──────────────────────────────────────────────────────────
function TonConnectCTA({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.06, duration: 1100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Animated.View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: `${Colors.gold}12`, borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: `${Colors.gold}35`, transform: [{ scale: pulseAnim }] }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${Colors.gold}20`, justifyContent: "center", alignItems: "center" }}>
          <Wallet size={17} color={Colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.gold }}>Connect TON Wallet</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>Unlock 2× point multiplier & on-chain achievements</Text>
        </View>
        <ChevronRight size={16} color={Colors.gold} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Streak Guard Banner ──────────────────────────────────────────────────────
function StreakGuardBanner({ streak, onDismiss }: { streak: number; onDismiss: () => void }) {
  const { colors } = useTheme();
  const shakeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 3, duration: 120, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -3, duration: 120, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.delay(3000),
    ])).start();
  }, []);
  return (
    <Animated.View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: `${Colors.warning}12`, borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: `${Colors.warning}35`, transform: [{ translateX: shakeAnim }] }}>
      <Animated.View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${Colors.warning}20`, justifyContent: "center", alignItems: "center" }}>
        <Flame size={18} color={Colors.warning} />
      </Animated.View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.warning }}>🔥 Streak at Risk — {streak}d</Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>No tasks done today — complete one to keep your streak!</Text>
      </View>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <X size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Quick Actions Grid ────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { id: "task",   label: "New Task",  Icon: Plus,        color: Colors.gold,    bg: `${Colors.gold}15`,    route: "/modal" as const },
  { id: "ai",     label: "Ask AI",    Icon: Bot,         color: Colors.purple,  bg: `${Colors.purple}15`,  route: "/(tabs)/agent" as const },
  { id: "tasks",  label: "All Tasks", Icon: CheckSquare, color: Colors.blue,    bg: `${Colors.blue}15`,    route: "/(tabs)/tasks" as const },
  { id: "trophy", label: "Rewards",   Icon: Trophy,      color: Colors.warning, bg: `${Colors.warning}15`, route: "/(tabs)/profile" as const },
];

function QuickActions({ onNavigate }: { onNavigate: (route: string) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 10 }}>Quick Actions</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {QUICK_ACTIONS.map(({ id, label, Icon, color, bg, route }) => (
          <TouchableOpacity
            key={id}
            activeOpacity={0.78}
            onPress={() => onNavigate(route)}
            style={{ flex: 1, backgroundColor: colors.bgSecondary, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 10, alignItems: "center", gap: 8, borderWidth: 1, borderColor: colors.border }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: bg, justifyContent: "center", alignItems: "center" }}>
              <Icon size={19} color={color} />
            </View>
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textSecondary, textAlign: "center" }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Category Breakdown ────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "work",     label: "Work",     Icon: Briefcase, color: Colors.blue },
  { key: "personal", label: "Personal", Icon: Heart,     color: Colors.purple },
  { key: "health",   label: "Health",   Icon: Flame,     color: Colors.success },
  { key: "learning", label: "Learning", Icon: Brain,     color: Colors.gold },
] as const;

function CategoryBreakdown({ tasks }: { tasks: Task[] }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 10 }}>By Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -2 }} contentContainerStyle={{ paddingHorizontal: 2, gap: 10 }}>
        {CATEGORIES.map(({ key, label, Icon, color }) => {
          const all = tasks.filter((t) => t.category === key);
          const done = all.filter((t) => t.status === "completed").length;
          const pct = all.length > 0 ? done / all.length : 0;
          return (
            <View
              key={key}
              style={{ width: 112, backgroundColor: colors.bgSecondary, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.border }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${color}15`, justifyContent: "center", alignItems: "center", marginBottom: 10 }}>
                <Icon size={17} color={color} />
              </View>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary, marginBottom: 2 }}>{label}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8 }}>
                {done}/{all.length} done
              </Text>
              <View style={{ height: 4, backgroundColor: `${color}20`, borderRadius: 4 }}>
                <View style={{ height: 4, width: `${Math.round(pct * 100)}%`, backgroundColor: color, borderRadius: 4 }} />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── Level / XP Card ───────────────────────────────────────────────────────────
function LevelProgressCard() {
  const { colors } = useTheme();
  const { stats } = useAchievements();
  const lvl = stats.currentLevel;
  const current = lvl.currentPoints;
  const next = lvl.nextLevelPoints;
  const pct = next > 0 ? Math.min(current / next, 1) : 1;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, { toValue: pct, duration: 1000, useNativeDriver: false }).start();
  }, [pct]);

  const barWidth = barAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <View style={{ backgroundColor: colors.bgSecondary, borderRadius: 20, padding: 18, marginBottom: 18, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${Colors.gold}20`, justifyContent: "center", alignItems: "center", marginRight: 12 }}>
          <Star size={20} color={Colors.gold} fill={Colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: "500" }}>Your Level</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.3 }}>
            Lv {lvl.level} <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.gold }}>{lvl.name}</Text>
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: Colors.gold }}>{stats.totalPoints}</Text>
          <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: "500" }}>total pts</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
        <Text style={{ fontSize: 11, color: colors.textMuted }}>{current} pts earned</Text>
        <Text style={{ fontSize: 11, color: colors.textMuted }}>{next} to Lv {lvl.level + 1}</Text>
      </View>
      <View style={{ height: 7, backgroundColor: `${Colors.gold}18`, borderRadius: 10 }}>
        <Animated.View style={{ height: 7, width: barWidth, backgroundColor: Colors.gold, borderRadius: 10 }} />
      </View>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter();
  const { user, isOnboarded, isLoading } = useAppState();
  const { colors } = useTheme();
  const { connectWallet } = useTonConnect();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tasks, insights, toggleTaskStatus, getStats, getTodayTasks } = useTasks();
  const [stats, setStats] = React.useState({ tasksCompleted: 0, tasksCreated: 0, currentStreak: 0, productivityScore: 0, weeklyCompletion: [0, 0, 0, 0, 0, 0, 0] });
  const [refreshing, setRefreshing] = React.useState(false);
  const [streakGuardDismissed, setStreakGuardDismissed] = React.useState(false);
  const [nudgeDismissed, setNudgeDismissed] = React.useState(false);

  // Staggered stat animations
  const stat1 = useRef(new Animated.Value(0)).current;
  const stat2 = useRef(new Animated.Value(0)).current;
  const stat3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.stagger(90, [
        Animated.spring(stat1, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true }),
        Animated.spring(stat2, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true }),
        Animated.spring(stat3, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true }),
      ]).start();
    }, 300);
  }, []);

  const todayTasks = getTodayTasks();
  const focusInsight = insights.find((i: AIInsight) => i.type === "focus");
  const warningInsight = insights.find((i: AIInsight) => i.type === "warning");
  const todayCompleted = todayTasks.filter((t: Task) => t.status === "completed").length;
  const todayProgress = todayTasks.length > 0 ? (todayCompleted / todayTasks.length) * 100 : 0;

  // Streak guard: after 6pm, streak > 0, no tasks done today
  const isStreakAtRisk = stats.currentStreak > 0 && new Date().getHours() >= 18 && todayCompleted === 0 && !streakGuardDismissed;

  // Proactive AI nudge: overdue tasks
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const overdueCount = tasks.filter((t: Task) => t.status !== "completed" && new Date(t.dueDate) < todayMidnight).length;
  const showNudge = overdueCount > 0 && !nudgeDismissed;

  useEffect(() => {
    if (!isLoading && !isOnboarded) { setTimeout(() => { router.replace("/onboarding"); }, 100); }
  }, [isOnboarded, isLoading, router]);

  const loadStats = useCallback(async () => {
    const newStats = await getStats();
    setStats(newStats);
  }, [getStats]);

  useEffect(() => { void loadStats(); }, [loadStats, tasks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.textPrimary }}>Tonic AI</Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 8 }}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const showTonCTA = !user.walletAddress;

  const { width: screenWidth } = useWindowDimensions();
  const isLarge = screenWidth >= 768;
  const contentStyle = isLarge ? { maxWidth: 640, alignSelf: "center" as const, width: "100%" as const } : {};

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, isLarge && { paddingHorizontal: 0 }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}>
        <View style={contentStyle}>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={{ width: 36, height: 36, borderRadius: 10 }}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{user.name}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={() => router.push("/modal")}>
            <Plus size={20} color="#0D1117" />
          </TouchableOpacity>
        </View>

        {/* Streak Guard */}
        {isStreakAtRisk && <StreakGuardBanner streak={stats.currentStreak} onDismiss={() => setStreakGuardDismissed(true)} />}

        {/* Proactive AI Nudge — overdue tasks */}
        {showNudge && (
          <View style={styles.nudgeBanner}>
            <View style={styles.nudgeIcon}>
              <AlertCircle size={18} color={Colors.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nudgeTitle}>⚡ {overdueCount} Overdue Task{overdueCount > 1 ? "s" : ""}</Text>
              <Text style={styles.nudgeSub}>I can help you reschedule these to stay on track.</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/agent")} style={styles.nudgeBtn} activeOpacity={0.8}>
              <Text style={styles.nudgeBtnText}>Ask Agent</Text>
              <ChevronRight size={11} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setNudgeDismissed(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ marginLeft: 4 }}>
              <X size={15} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* AI Focus Insight */}
        {focusInsight && !isStreakAtRisk && <InsightBanner insight={focusInsight} />}

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>Today</Text>
            <Text style={styles.heroCount}>
              {todayCompleted}<Text style={styles.heroCountSub}> / {todayTasks.length}</Text>
            </Text>
            <Text style={styles.heroDone}>tasks done</Text>
            {stats.currentStreak > 0 && (
              <View style={styles.streakPill}>
                <Flame size={13} color={Colors.warning} />
                <Text style={styles.streakText}>{stats.currentStreak}d streak</Text>
              </View>
            )}
          </View>
          <ProgressRing progress={todayProgress} size={118} strokeWidth={11} />
        </View>

        {/* Stats Row — staggered animation */}
        <View style={styles.statsRow}>
          <StatPill icon={Target} value={stats.tasksCompleted} label="Done" color={Colors.success} animValue={stat1} />
          <View style={styles.statDivider} />
          <StatPill icon={Flame} value={stats.currentStreak} label="Streak" color={Colors.warning} animValue={stat2} />
          <View style={styles.statDivider} />
          <StatPill icon={Zap} value={stats.productivityScore} label="Score" color={Colors.blue} animValue={stat3} />
        </View>

        {/* Quick Actions */}
        <QuickActions onNavigate={(r) => router.push(r as any)} />

        {/* Level / XP Progress */}
        <LevelProgressCard />

        {/* Category Breakdown */}
        <CategoryBreakdown tasks={tasks} />

        {/* TON CTA */}
        {showTonCTA && <TonConnectCTA onPress={() => void connectWallet()} />}

        {/* Weekly Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly</Text>
            <View style={styles.weeklyBadge}><TrendingUp size={12} color={Colors.gold} /></View>
          </View>
          <WeeklyChart data={stats.weeklyCompletion} />
        </View>

        {/* Today's Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Tasks</Text>
            <TouchableOpacity style={styles.seeAll} onPress={() => router.push("/(tabs)/tasks" as any)}>
              <Text style={styles.seeAllText}>All</Text>
              <ChevronRight size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          {todayTasks.length === 0 ? (
            <EmptyDashboard onAdd={() => router.push("/modal")} colors={colors} styles={styles} />
          ) : (
            <View style={styles.taskList}>
              {todayTasks.slice(0, 5).map((task: Task) => (
                <TaskItem key={task.id} task={task} onToggle={toggleTaskStatus} />
              ))}
            </View>
          )}
        </View>

        {/* Warning Insight */}
        {warningInsight && <InsightBanner insight={warningInsight} />}

        {/* On-chain proof badge hint */}
        {user.walletAddress && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: `${Colors.blue}10`, borderRadius: 14, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: `${Colors.blue}25` }}>
            <ShieldCheck size={16} color={Colors.blue} />
            <Text style={{ fontSize: 12, color: Colors.blue, fontWeight: "600", flex: 1 }}>Wallet connected — your achievements are verifiable on TON blockchain</Text>
          </View>
        )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Animated Empty State ─────────────────────────────────────────────────────
function EmptyDashboard({ onAdd, colors, styles }: { onAdd: () => void; colors: any; styles: any }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <TouchableOpacity style={styles.emptyCard} onPress={onAdd} activeOpacity={0.85}>
      <Animated.View style={[styles.emptyIconWrap, { transform: [{ scale: pulseAnim }] }]}>
        <Sparkles size={28} color={Colors.gold} />
      </Animated.View>
      <Text style={styles.emptyTitle}>Your journey starts here</Text>
      <Text style={styles.emptySubtitle}>Add today's first task and let Tonic help you crush it</Text>
      <View style={styles.emptyAddBtn}>
        <Plus size={15} color={Colors.gold} />
        <Text style={styles.emptyAddBtnText}>Add First Task</Text>
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 110 },

  nudgeBanner: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: `${Colors.danger}10`, borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: `${Colors.danger}25` },
  nudgeIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${Colors.danger}20`, justifyContent: "center", alignItems: "center" },
  nudgeTitle: { fontSize: 13, fontWeight: "700" as const, color: Colors.danger, marginBottom: 2 },
  nudgeSub: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  nudgeBtn: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: Colors.danger, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  nudgeBtnText: { fontSize: 11, fontWeight: "700" as const, color: "#fff" },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  greeting: { fontSize: 13, color: colors.textMuted, fontWeight: "500", letterSpacing: 0.2 },
  userName: { fontSize: 26, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5, marginTop: 1 },
  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.gold, justifyContent: "center", alignItems: "center", shadowColor: Colors.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 8 },

  heroCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.bgSecondary, borderRadius: 24, padding: 24, marginBottom: 12, borderWidth: 1, borderColor: colors.border, shadowColor: Colors.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 },
  heroLeft: { flex: 1 },
  heroLabel: { fontSize: 11, fontWeight: "600", color: colors.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 },
  heroCount: { fontSize: 44, fontWeight: "800", color: colors.textPrimary, letterSpacing: -2, lineHeight: 50 },
  heroCountSub: { fontSize: 22, fontWeight: "500", color: colors.textMuted },
  heroDone: { fontSize: 13, color: colors.textSecondary, marginTop: 2, marginBottom: 12 },
  streakPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: `${Colors.warning}15`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: "flex-start" },
  streakText: { fontSize: 12, fontWeight: "600", color: Colors.warning },

  statsRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.bgSecondary, borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  statDivider: { width: 1, height: 40, backgroundColor: colors.border, marginHorizontal: 4 },

  section: { marginBottom: 18 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  weeklyBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: `${Colors.gold}15`, justifyContent: "center", alignItems: "center" },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { fontSize: 13, color: colors.textMuted },

  chartWrap: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", backgroundColor: colors.bgSecondary, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: colors.border, height: 110 },
  barCol: { alignItems: "center", flex: 1 },
  barTrack: { justifyContent: "flex-end", width: "100%", alignItems: "center" },
  barFill: { width: 8, minHeight: 0 },
  barLabel: { fontSize: 11, color: colors.textMuted, marginTop: 8, fontWeight: "500" },

  emptyCard: { backgroundColor: colors.bgSecondary, borderRadius: 20, padding: 32, alignItems: "center", gap: 10, borderWidth: 1.5, borderStyle: "dashed", borderColor: `${Colors.gold}35` },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 18, backgroundColor: `${Colors.gold}15`, justifyContent: "center", alignItems: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  emptySubtitle: { fontSize: 12, color: colors.textMuted, textAlign: "center", lineHeight: 18 },
  emptyAddBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: `${Colors.gold}15`, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 4 },
  emptyAddBtnText: { fontSize: 13, fontWeight: "600", color: Colors.gold },

  taskList: { backgroundColor: colors.bgSecondary, borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  taskItem: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.border, minHeight: 56 },
  taskCompleted: { opacity: 0.5 },
  taskCatBar: { width: 4, alignSelf: "stretch", borderRadius: 4, marginRight: 12 },
  taskCheckbox: { marginRight: 12, padding: 14 },
  checkboxFilled: { width: 22, height: 22, borderRadius: 7, backgroundColor: Colors.success, justifyContent: "center", alignItems: "center" },
  checkboxEmpty: { width: 22, height: 22, borderRadius: 7, borderWidth: 2 },
  checkmark: { color: "#fff", fontSize: 12, fontWeight: "800" },
  taskBody: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, paddingRight: 16, paddingVertical: 14 },
  taskTitle: { fontSize: 14, fontWeight: "600", color: colors.textPrimary, flex: 1 },
  taskTitleDone: { textDecorationLine: "line-through", color: colors.textMuted },
  aiBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: `${Colors.gold}15`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  aiBadgeText: { fontSize: 9, fontWeight: "700", color: Colors.gold },
  priDot: { width: 7, height: 7, borderRadius: 4, marginRight: 16 },
});
