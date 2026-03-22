import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Sparkles,
  TrendingUp,
  Clock,
  AlertTriangle,
  Lightbulb,
  Target,
  Brain,
  Calendar,
  BarChart3,
  Flame,
  Zap,
  RefreshCw,
} from "lucide-react-native";

import { Colors } from "@/constants/colors";
import { useTheme, type AppColors } from "@/providers/ThemeProvider";
import { useTasks } from "@/providers/TasksProvider";
import type { AIInsight } from "@/types/tasks";

type InsightType = "focus" | "warning" | "suggestion" | "pattern" | "achievement";

interface DisplayInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  icon: typeof Sparkles;
  color: string;
  metric?: string;
  trend?: "up" | "down" | "neutral";
}

function InsightCard({ insight, index }: { insight: DisplayInsight; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const Icon = insight.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 350, useNativeDriver: true, delay: index * 80 }),
        Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 50, useNativeDriver: true, delay: index * 80 }),
      ]).start();
    }, 50);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <Animated.View
      style={[
        styles.insightCard,
        { opacity: opacityAnim, transform: [{ translateY: slideAnim }], borderLeftColor: insight.color },
      ]}
    >
      <TouchableOpacity style={styles.insightInner} onPress={() => setExpanded(!expanded)} activeOpacity={0.85}>
        <View style={styles.insightTop}>
          <View style={[styles.insightIcon, { backgroundColor: `${insight.color}15` }]}>
            <Icon size={20} color={insight.color} />
          </View>
          <View style={styles.insightTitleArea}>
            <Text style={[styles.insightTitle, { color: insight.color }]}>{insight.title}</Text>
            <View style={[styles.typePill, { backgroundColor: `${insight.color}12` }]}>
              <Text style={[styles.typeText, { color: insight.color }]}>
                {insight.type === "focus" ? "Focus" : insight.type === "warning" ? "Warning" : insight.type === "suggestion" ? "Tip" : insight.type === "achievement" ? "Achievement" : "Pattern"}
              </Text>
            </View>
          </View>
          {insight.metric && (
            <Text style={[styles.metricValue, { color: insight.color }]}>{insight.metric}</Text>
          )}
        </View>
        <Text
          style={styles.insightDesc}
          numberOfLines={expanded ? undefined : 2}
        >
          {insight.description}
        </Text>
        {insight.description.length > 90 && (
          <Text style={[styles.expandBtn, { color: insight.color }]}>{expanded ? "Less ↑" : "More ↓"}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function StatPill({
  icon: Icon,
  value,
  label,
  sub,
  color,
}: {
  icon: typeof Sparkles;
  value: string | number;
  label: string;
  sub?: string;
  color: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 3 }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${color}15`, justifyContent: "center", alignItems: "center", marginBottom: 2 }}>
        <Icon size={17} color={color} />
      </View>
      <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 }}>{value}</Text>
      <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: "500" }}>{label}</Text>
      {sub && <Text style={{ fontSize: 9, color: colors.textMuted }}>{sub}</Text>}
    </View>
  );
}

function CategoryBar({ name, count, total, color }: { name: string; count: number; total: number; color: string }) {
  const barWidth = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const pct = total > 0 ? (count / total) * 100 : 0;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(barWidth, { toValue: pct, duration: 700, useNativeDriver: false }).start();
    }, 400);
    return () => clearTimeout(t);
  }, [pct]);

  const widthInterp = barWidth.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

  return (
    <View style={styles.barItem}>
      <View style={styles.barHeader}>
        <Text style={styles.barName}>{name}</Text>
        <Text style={[styles.barPct, { color }]}>{count} <Text style={styles.barPctSub}>/ {total}</Text></Text>
      </View>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { backgroundColor: color, width: widthInterp }]} />
      </View>
    </View>
  );
}

export default function InsightsScreen() {
  const [activeTab, setActiveTab] = useState<"insights" | "analytics">("insights");
  const { insights, tasks, getStats, isGeneratingInsights, generateInsights } = useTasks();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [stats, setStats] = useState({ tasksCompleted: 0, tasksCreated: 0, currentStreak: 0, productivityScore: 0 });

  const loadStats = useCallback(async () => {
    const s = await getStats();
    setStats(s);
  }, [getStats]);

  useEffect(() => { void loadStats(); }, [loadStats, tasks]);

  const iconMap: Record<string, typeof Sparkles> = {
    target: Target, alert: AlertTriangle, balance: Zap, trending: TrendingUp, clock: Clock, brain: Brain,
  };
  const colorMap: Record<string, string> = {
    focus: Colors.gold, warning: Colors.warning, suggestion: Colors.blue, pattern: Colors.success, achievement: Colors.purple,
  };

  const displayInsights: DisplayInsight[] = insights.map((i: AIInsight) => ({
    id: i.id, type: i.type as InsightType, title: i.title, description: i.description,
    icon: iconMap[i.icon] || Sparkles, color: colorMap[i.type] || Colors.gold,
  }));

  const streakInsights: DisplayInsight[] = stats.currentStreak > 0 ? [{
    id: "streak", type: "achievement", title: "On a Roll",
    description: `You've maintained a ${stats.currentStreak}-day productivity streak! Momentum is your superpower.`,
    icon: Flame, color: Colors.warning, metric: `${stats.currentStreak}d`, trend: "up",
  }] : [];

  const allInsights = [...displayInsights, ...streakInsights];

  const catCounts = {
    Work: tasks.filter((t: any) => t.category === "work").length,
    Personal: tasks.filter((t: any) => t.category === "personal").length,
    Health: tasks.filter((t: any) => t.category === "health").length,
    Learning: tasks.filter((t: any) => t.category === "learning").length,
  };
  const catColors: Record<string, string> = { Work: Colors.blue, Personal: Colors.purple, Health: Colors.success, Learning: Colors.gold };
  const completionRate = stats.tasksCreated > 0 ? Math.round((stats.tasksCompleted / stats.tasksCreated) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Sparkles size={16} color={Colors.gold} />
            </View>
            <View>
              <Text style={styles.headerTitle}>AI Insights</Text>
              <Text style={styles.headerSub}>Powered by Tonic AI</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.scorePill}>
              <Zap size={13} color={Colors.gold} />
              <Text style={styles.scoreNum}>{stats.productivityScore}</Text>
            </View>
            <TouchableOpacity
              style={[styles.refreshBtn, isGeneratingInsights && { opacity: 0.6 }]}
              onPress={() => void generateInsights()}
              disabled={isGeneratingInsights}
              activeOpacity={0.8}
            >
              {isGeneratingInsights
                ? <ActivityIndicator size={14} color={Colors.gold} />
                : <RefreshCw size={15} color={Colors.gold} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "insights" && styles.tabActive]}
            onPress={() => setActiveTab("insights")}
          >
            <Lightbulb size={14} color={activeTab === "insights" ? "#0D1117" : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === "insights" && styles.tabTextActive]}>Insights</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "analytics" && styles.tabActive]}
            onPress={() => setActiveTab("analytics")}
          >
            <BarChart3 size={14} color={activeTab === "analytics" ? "#0D1117" : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === "analytics" && styles.tabTextActive]}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {activeTab === "insights" ? (
          <>
            {/* Quick stats row */}
            <View style={styles.statsRow}>
              <StatPill icon={Target} value={`${completionRate}%`} label="Completion" sub="All time" color={Colors.success} />
              <View style={styles.statDivider} />
              <StatPill icon={Clock} value={stats.tasksCreated} label="Total" sub="Created" color={Colors.blue} />
              <View style={styles.statDivider} />
              <StatPill icon={Flame} value={stats.currentStreak} label="Streak" sub="Days" color={Colors.warning} />
            </View>

            {/* Insights list */}
            <Text style={styles.sectionTitle}>Smart Recommendations</Text>
            {allInsights.length === 0 ? (
              <View style={styles.empty}>
                {isGeneratingInsights ? (
                  <>
                    <ActivityIndicator size={28} color={Colors.gold} style={{ marginBottom: 14 }} />
                    <Text style={styles.emptyTitle}>Analyzing your data…</Text>
                    <Text style={styles.emptySub}>Tonic AI is working on it</Text>
                  </>
                ) : (
                  <>
                    <View style={styles.emptyIcon}>
                      <Brain size={32} color={colors.textMuted} />
                    </View>
                    <Text style={styles.emptyTitle}>No insights yet</Text>
                    <Text style={styles.emptySub}>Add and complete tasks to unlock AI insights</Text>
                    <TouchableOpacity style={styles.genBtn} onPress={() => void generateInsights()} activeOpacity={0.8}>
                      <Sparkles size={15} color="#0D1117" />
                      <Text style={styles.genBtnText}>Generate Insights</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : (
              <View style={styles.insightsList}>
                {allInsights.map((ins, i) => <InsightCard key={ins.id} insight={ins} index={i} />)}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Overview card */}
            <View style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <Calendar size={18} color={Colors.gold} />
                <Text style={styles.overviewTitle}>Overview</Text>
              </View>
              <View style={styles.overviewStats}>
                {[
                  { label: "Total", value: stats.tasksCreated },
                  { label: "Done", value: stats.tasksCompleted },
                  { label: "Streak", value: stats.currentStreak },
                  { label: "Rate", value: `${completionRate}%` },
                ].map((s, i) => (
                  <View key={s.label} style={[styles.ovStat, i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
                    <Text style={styles.ovStatVal}>{s.value}</Text>
                    <Text style={styles.ovStatLbl}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Score card */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreLeft}>
                <Text style={styles.scoreTitle}>Productivity Score</Text>
                <Text style={styles.scoreSub}>Completion × consistency × streak</Text>
                <View style={styles.scoreTrend}>
                  <TrendingUp size={14} color={Colors.success} />
                  <Text style={styles.scoreTrendText}>Calculated live</Text>
                </View>
              </View>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreVal}>{stats.productivityScore}</Text>
                <Text style={styles.scoreLbl}>pts</Text>
              </View>
            </View>

            {/* Category breakdown */}
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Task Distribution</Text>
              <View style={styles.bars}>
                {Object.entries(catCounts).map(([name, count]: [string, number]) => (
                  <CategoryBar key={name} name={name} count={count} total={stats.tasksCreated} color={catColors[name]} />
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 110 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: `${Colors.gold}15`, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  scorePill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: `${Colors.gold}15`, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: `${Colors.gold}30` },
  scoreNum: { fontSize: 13, fontWeight: "700", color: Colors.gold },
  refreshBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${Colors.gold}15`, borderWidth: 1, borderColor: `${Colors.gold}28`, justifyContent: "center", alignItems: "center" },

  tabs: { flexDirection: "row", backgroundColor: colors.bgSecondary, borderRadius: 14, padding: 4, marginBottom: 18, borderWidth: 1, borderColor: colors.border },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 11 },
  tabActive: { backgroundColor: Colors.gold },
  tabText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  tabTextActive: { color: "#0D1117" },

  statsRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.bgSecondary, borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  statDivider: { width: 1, height: 40, backgroundColor: colors.border, marginHorizontal: 4 },

  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 12 },

  insightsList: { gap: 10 },
  insightCard: {
    backgroundColor: colors.bgSecondary, borderRadius: 18, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  insightInner: { padding: 16, gap: 8 },
  insightTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  insightIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  insightTitleArea: { flex: 1, gap: 4 },
  insightTitle: { fontSize: 14, fontWeight: "700", lineHeight: 20 },
  typePill: { alignSelf: "flex-start", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
  metricValue: { fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },
  insightDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  expandBtn: { fontSize: 12, fontWeight: "600", marginTop: 2 },

  empty: { paddingTop: 60, alignItems: "center", gap: 8 },
  emptyIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: colors.bgSecondary, justifyContent: "center", alignItems: "center", marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: "center" },
  genBtn: {
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14,
    backgroundColor: Colors.gold, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  genBtnText: { fontSize: 14, fontWeight: "700", color: "#0D1117" },

  overviewCard: { backgroundColor: colors.bgSecondary, borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  overviewHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  overviewTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  overviewStats: { flexDirection: "row" },
  ovStat: { flex: 1, alignItems: "center", gap: 3, paddingVertical: 4 },
  ovStatVal: { fontSize: 24, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 },
  ovStatLbl: { fontSize: 11, color: colors.textMuted, fontWeight: "500" },

  scoreCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.bgSecondary, borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  scoreLeft: { flex: 1, gap: 4 },
  scoreTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  scoreSub: { fontSize: 12, color: colors.textSecondary },
  scoreTrend: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  scoreTrendText: { fontSize: 12, color: Colors.success, fontWeight: "500" },
  scoreCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: `${Colors.gold}15`, borderWidth: 1, borderColor: `${Colors.gold}35`, justifyContent: "center", alignItems: "center" },
  scoreVal: { fontSize: 22, fontWeight: "800", color: Colors.gold, letterSpacing: -0.5 },
  scoreLbl: { fontSize: 10, color: Colors.gold, fontWeight: "600" },

  breakdownCard: { backgroundColor: colors.bgSecondary, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border },
  breakdownTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 16 },
  bars: { gap: 14 },
  barItem: { gap: 6 },
  barHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  barName: { fontSize: 13, color: colors.textSecondary, fontWeight: "500" },
  barPct: { fontSize: 13, fontWeight: "700" },
  barPctSub: { fontSize: 11, color: colors.textMuted, fontWeight: "400" },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: colors.bgTertiary, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
});
