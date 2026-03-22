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
import Svg, { Circle, G } from "react-native-svg";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Lightbulb,
  Target,
  Brain,
  BarChart3,
  Flame,
  Zap,
  RefreshCw,
  Trophy,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronRight,
  Activity,
  Star,
} from "lucide-react-native";

import { Colors } from "@/constants/colors";
import { useTheme, type AppColors } from "@/providers/ThemeProvider";
import { useTasks } from "@/providers/TasksProvider";
import type { AIInsight } from "@/types/tasks";
import { API_BASE_URL } from "@/constants/api";

// ── Types ─────────────────────────────────────────────────────────────────────
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
  action?: string;
}

// ── Config ────────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<InsightType, { label: string; color: string }> = {
  focus:       { label: "Focus",       color: Colors.gold },
  warning:     { label: "Alert",       color: Colors.danger },
  suggestion:  { label: "Tip",         color: Colors.blue },
  pattern:     { label: "Pattern",     color: Colors.success },
  achievement: { label: "Win",         color: Colors.purple },
};

const ICON_MAP: Record<string, typeof Sparkles> = {
  target: Target, alert: AlertTriangle, balance: Zap,
  trending: TrendingUp, clock: Clock, brain: Brain,
};

// ── Insight Card ──────────────────────────────────────────────────────────────
function InsightCard({ insight, index }: { insight: DisplayInsight; index: number }) {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const Icon = insight.icon;
  const tc = TYPE_CONFIG[insight.type];

  useEffect(() => {
    const delay = index * 100;
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 55, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 55, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [index]);

  const TrendIcon = insight.trend === "up" ? ArrowUp : insight.trend === "down" ? ArrowDown : Minus;
  const trendColor = insight.trend === "up" ? Colors.success : insight.trend === "down" ? Colors.danger : colors.textMuted;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        marginBottom: 12,
      }}
    >
      <View
        style={{
          backgroundColor: `${insight.color}06`,
          borderRadius: 20,
          borderWidth: 1.5,
          borderColor: `${insight.color}22`,
          borderLeftWidth: 4,
          borderLeftColor: insight.color,
          overflow: "hidden",
        }}
      >
        {/* Main row */}
        <View style={{ flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: 12 }}>
          {/* Icon */}
          <View
            style={{
              width: 48, height: 48, borderRadius: 15,
              backgroundColor: `${insight.color}18`,
              justifyContent: "center", alignItems: "center",
              marginRight: 14, flexShrink: 0,
            }}
          >
            <Icon size={22} color={insight.color} />
          </View>

          {/* Title + description */}
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.3, marginBottom: 3 }} numberOfLines={1}>
              {insight.title}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 17 }} numberOfLines={2}>
              {insight.description}
            </Text>
          </View>

          {/* Metric + trend */}
          {insight.metric && (
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <Text style={{ fontSize: 26, fontWeight: "900", color: insight.color, letterSpacing: -1, lineHeight: 28 }}>
                {insight.metric}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <TrendIcon size={11} color={trendColor} />
                <Text style={{ fontSize: 9, fontWeight: "700", color: trendColor, textTransform: "uppercase", letterSpacing: 0.4 }}>
                  {insight.trend ?? "–"}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Bottom action bar */}
        <View
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            paddingHorizontal: 16, paddingVertical: 10,
            borderTopWidth: 1, borderTopColor: `${insight.color}14`,
            backgroundColor: `${insight.color}08`,
          }}
        >
          {/* Type badge */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: `${tc.color}15`, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tc.color }} />
            <Text style={{ fontSize: 10, fontWeight: "700", color: tc.color, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {tc.label}
            </Text>
          </View>

          {/* Action CTA */}
          {insight.action && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: `${insight.color}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: insight.color }}>{insight.action}</Text>
              <ChevronRight size={10} color={insight.color} />
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ── Score Ring (SVG) ───────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const { colors } = useTheme();
  const size = 130;
  const sw = 12;
  const radius = (size - sw) / 2;
  const circ = 2 * Math.PI * radius;
  const capped = Math.min(score, 100);
  const animProg = useRef(new Animated.Value(0)).current;
  const [disp, setDisp] = useState(0);

  useEffect(() => {
    Animated.timing(animProg, { toValue: capped, duration: 1100, useNativeDriver: false }).start();
    const l = animProg.addListener(({ value }) => setDisp(Math.round(value)));
    return () => animProg.removeListener(l);
  }, [capped]);

  const offset = circ - (disp / 100) * circ;

  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size/2} cy={size/2} r={radius} stroke={`${Colors.gold}15`} strokeWidth={sw} fill="none" />
        <Circle cx={size/2} cy={size/2} r={radius} stroke={Colors.gold} strokeWidth={sw} fill="none"
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
      </Svg>
      <Text style={{ fontSize: 28, fontWeight: "900", color: colors.textPrimary, letterSpacing: -1 }}>{disp}</Text>
      <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: "600", letterSpacing: 0.5 }}>SCORE</Text>
    </View>
  );
}

// ── Category Donut (SVG) ───────────────────────────────────────────────────────
function CategoryDonut({ counts }: { counts: Record<string, number> }) {
  const { colors } = useTheme();
  const size = 110;
  const sw = 16;
  const radius = (size - sw) / 2;
  const circ = 2 * Math.PI * radius;
  const catColors = [Colors.blue, Colors.purple, Colors.success, Colors.gold];
  const labels = ["Work", "Personal", "Health", "Learning"];
  const vals = labels.map((l) => counts[l] ?? 0);
  const total = vals.reduce((a, b) => a + b, 0);

  const animProg = useRef(new Animated.Value(0)).current;
  const [pct, setPct] = useState(0);
  useEffect(() => {
    Animated.timing(animProg, { toValue: 1, duration: 900, useNativeDriver: false }).start();
    const l = animProg.addListener(({ value }) => setPct(value));
    return () => animProg.removeListener(l);
  }, [total]);

  let offset = 0;
  const segments = vals.map((v, i) => {
    const frac = total > 0 ? (v / total) * pct : 0;
    const dash = frac * circ;
    const gap = circ - dash;
    const seg = { color: catColors[i], dash, gap, offset };
    offset += dash;
    return seg;
  });

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
      <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
        <Svg width={size} height={size} style={{ position: "absolute" }}>
          <Circle cx={size/2} cy={size/2} r={radius} stroke={`${Colors.gold}10`} strokeWidth={sw} fill="none" />
          {segments.map((s, i) =>
            s.dash > 0 ? (
              <Circle key={i} cx={size/2} cy={size/2} r={radius} stroke={s.color} strokeWidth={sw} fill="none"
                strokeDasharray={`${s.dash} ${circ - s.dash}`} strokeDashoffset={circ / 4 - s.offset}
                strokeLinecap="butt" />
            ) : null
          )}
        </Svg>
        <Text style={{ fontSize: 16, fontWeight: "800", color: colors.textPrimary }}>{total}</Text>
        <Text style={{ fontSize: 9, color: colors.textMuted, fontWeight: "600" }}>tasks</Text>
      </View>

      {/* Legend */}
      <View style={{ flex: 1, gap: 8 }}>
        {labels.map((label, i) => {
          const count = vals[i];
          const frac = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: catColors[i] }} />
              <Text style={{ fontSize: 12, color: colors.textSecondary, flex: 1 }}>{label}</Text>
              <Text style={{ fontSize: 12, fontWeight: "700", color: catColors[i] }}>{count}</Text>
              <Text style={{ fontSize: 10, color: colors.textMuted, width: 30, textAlign: "right" }}>{frac}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Skeleton Card (loading) ────────────────────────────────────────────────────
function SkeletonCard() {
  const { colors } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    ).start();
  }, []);
  const bg = shimmer.interpolate({ inputRange: [0, 1], outputRange: [colors.bgSecondary, colors.bgTertiary] });
  return (
    <Animated.View style={{ backgroundColor: bg, borderRadius: 20, height: 96, marginBottom: 12 }} />
  );
}

// ── Leaderboard Row ────────────────────────────────────────────────────────────
interface LeaderboardEntry { id: string; name: string; wallet_address?: string; completed_tasks: number; total_tasks: number; completion_rate: number; }
function LeaderboardRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const { colors } = useTheme();
  const isTop3 = rank <= 3;
  const rankColors = [Colors.gold, "#C0C0C0", "#CD7F32"];
  const rankColor = isTop3 ? rankColors[rank - 1] : colors.textMuted;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: isTop3 ? `${rankColor}20` : colors.bgTertiary, justifyContent: "center", alignItems: "center" }}>
        {rank === 1 ? <Trophy size={14} color={rankColor} /> : <Text style={{ fontSize: 12, fontWeight: "700", color: rankColor }}>#{rank}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textPrimary }} numberOfLines={1}>{entry.name}</Text>
        <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}>{entry.completion_rate}% rate · {entry.total_tasks} tasks</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: isTop3 ? rankColor : colors.textPrimary }}>{entry.completed_tasks}</Text>
        <Text style={{ fontSize: 9, color: colors.textMuted, letterSpacing: 0.5, fontWeight: "600" }}>DONE</Text>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function InsightsScreen() {
  const [activeTab, setActiveTab] = useState<"insights" | "analytics">("insights");
  const { insights, tasks, getStats, isGeneratingInsights, generateInsights } = useTasks();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [stats, setStats] = useState({ tasksCompleted: 0, tasksCreated: 0, currentStreak: 0, productivityScore: 0, weeklyCompletion: [0,0,0,0,0,0,0] });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isGeneratingInsights) {
      Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 1000, useNativeDriver: true })).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [isGeneratingInsights]);

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const loadStats = useCallback(async () => {
    const s = await getStats();
    setStats(s);
  }, [getStats]);

  useEffect(() => { void loadStats(); }, [loadStats, tasks]);

  useEffect(() => {
    if (activeTab !== "analytics") return;
    setLeaderboardLoading(true);
    fetch(`${API_BASE_URL}/api/leaderboard`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data.leaderboard)) setLeaderboard(data.leaderboard); })
      .catch(() => {})
      .finally(() => setLeaderboardLoading(false));
  }, [activeTab]);

  const displayInsights: DisplayInsight[] = insights.map((i: AIInsight) => ({
    id: i.id, type: i.type as InsightType, title: i.title, description: i.description,
    icon: ICON_MAP[i.icon] || Sparkles,
    color: TYPE_CONFIG[i.type as InsightType]?.color || Colors.gold,
    metric: i.metric, trend: i.trend, action: i.action,
  }));

  if (stats.currentStreak > 0) {
    displayInsights.push({
      id: "streak", type: "achievement", title: `${stats.currentStreak}-Day Streak`,
      description: "Consistency is your superpower — keep it up.",
      icon: Flame, color: Colors.warning,
      metric: `${stats.currentStreak}d`, trend: "up", action: "Keep going",
    });
  }

  const completionRate = stats.tasksCreated > 0 ? Math.round((stats.tasksCompleted / stats.tasksCreated) * 100) : 0;

  const catCounts = {
    Work: tasks.filter((t: any) => t.category === "work").length,
    Personal: tasks.filter((t: any) => t.category === "personal").length,
    Health: tasks.filter((t: any) => t.category === "health").length,
    Learning: tasks.filter((t: any) => t.category === "learning").length,
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrap}>
              <Brain size={18} color={Colors.gold} />
            </View>
            <View>
              <Text style={styles.headerTitle}>AI Insights</Text>
              <Text style={styles.headerSub}>Powered by Tonic AI</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {/* Score pill */}
            <View style={styles.scorePill}>
              <Zap size={12} color={Colors.gold} fill={Colors.gold} />
              <Text style={styles.scoreNum}>{stats.productivityScore}</Text>
              <Text style={{ fontSize: 9, color: Colors.gold, fontWeight: "600" }}>pts</Text>
            </View>
            {/* Refresh button */}
            <TouchableOpacity
              style={[styles.refreshBtn, isGeneratingInsights && { opacity: 0.7 }]}
              onPress={() => void generateInsights()}
              disabled={isGeneratingInsights}
              activeOpacity={0.8}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <RefreshCw size={15} color={Colors.gold} />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, activeTab === "insights" && styles.tabActive]} onPress={() => setActiveTab("insights")}>
            <Sparkles size={14} color={activeTab === "insights" ? "#0D1117" : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === "insights" && styles.tabTextActive]}>Insights</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === "analytics" && styles.tabActive]} onPress={() => setActiveTab("analytics")}>
            <BarChart3 size={14} color={activeTab === "analytics" ? "#0D1117" : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === "analytics" && styles.tabTextActive]}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {activeTab === "insights" ? (
          <>
            {/* Quick stat strip */}
            <View style={styles.quickStats}>
              {[
                { icon: Activity, val: `${completionRate}%`, label: "Rate",   color: Colors.success },
                { icon: Clock,    val: stats.tasksCreated,   label: "Total",  color: Colors.blue },
                { icon: Flame,    val: stats.currentStreak,  label: "Streak", color: Colors.warning },
                { icon: Star,     val: stats.tasksCompleted, label: "Done",   color: Colors.purple },
              ].map(({ icon: Icon, val, label, color }) => (
                <View key={label} style={{ flex: 1, alignItems: "center", gap: 3 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${color}15`, justifyContent: "center", alignItems: "center" }}>
                    <Icon size={15} color={color} />
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 }}>{val}</Text>
                  <Text style={{ fontSize: 9, color: colors.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Section label */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <View style={{ width: 3, height: 14, backgroundColor: Colors.gold, borderRadius: 2 }} />
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.8, textTransform: "uppercase" }}>
                Smart Recommendations
              </Text>
              {displayInsights.length > 0 && (
                <View style={{ backgroundColor: `${Colors.gold}20`, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: Colors.gold }}>{displayInsights.length}</Text>
                </View>
              )}
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>

            {/* Insights list */}
            {isGeneratingInsights ? (
              <View>
                {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
              </View>
            ) : displayInsights.length === 0 ? (
              <EmptyInsights onGenerate={() => void generateInsights()} colors={colors} />
            ) : (
              <View>
                {displayInsights.map((ins, i) => <InsightCard key={ins.id} insight={ins} index={i} />)}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Score + completion */}
            <View style={styles.analyticsHero}>
              <View style={{ flex: 1, gap: 12 }}>
                <View>
                  <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: "600", marginBottom: 2 }}>Productivity Score</Text>
                  <Text style={{ fontSize: 36, fontWeight: "900", color: Colors.gold, letterSpacing: -1.5 }}>{stats.productivityScore}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }}>
                    <TrendingUp size={13} color={Colors.success} />
                    <Text style={{ fontSize: 11, color: Colors.success, fontWeight: "600" }}>Calculated live</Text>
                  </View>
                </View>
                <View style={{ gap: 6 }}>
                  {[
                    { label: "Completed", value: stats.tasksCompleted, color: Colors.success },
                    { label: "Total Created", value: stats.tasksCreated, color: Colors.blue },
                    { label: "Streak", value: `${stats.currentStreak}d`, color: Colors.warning },
                  ].map(({ label, value, color }) => (
                    <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>{label}</Text>
                      <Text style={{ fontSize: 14, fontWeight: "700", color }}>{value}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <ScoreRing score={stats.productivityScore} />
            </View>

            {/* Completion rate card */}
            <View style={styles.rateCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}>Completion Rate</Text>
                <Text style={{ fontSize: 22, fontWeight: "900", color: Colors.success, letterSpacing: -0.5 }}>{completionRate}%</Text>
              </View>
              <View style={{ height: 8, backgroundColor: colors.bgTertiary, borderRadius: 6 }}>
                <View style={{ height: 8, width: `${completionRate}%`, backgroundColor: Colors.success, borderRadius: 6 }} />
              </View>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 6 }}>
                {stats.tasksCompleted} of {stats.tasksCreated} tasks completed
              </Text>
            </View>

            {/* Category donut */}
            <View style={styles.donutCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <View style={{ width: 3, height: 14, backgroundColor: Colors.purple, borderRadius: 2 }} />
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}>Task Distribution</Text>
              </View>
              <CategoryDonut counts={catCounts} />
            </View>

            {/* Leaderboard */}
            <View style={styles.leaderCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Trophy size={16} color={Colors.gold} />
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary, flex: 1 }}>Global Leaderboard</Text>
                <Text style={{ fontSize: 10, color: colors.textMuted }}>Top 10</Text>
              </View>
              {leaderboardLoading ? (
                <View style={{ padding: 24, alignItems: "center" }}><ActivityIndicator color={Colors.gold} /></View>
              ) : leaderboard.length === 0 ? (
                <View style={{ padding: 24, alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: "center" }}>Complete tasks to appear on the leaderboard!</Text>
                </View>
              ) : (
                leaderboard.map((entry, i) => (
                  <View key={entry.id}>
                    {i > 0 && <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 58 }} />}
                    <LeaderboardRow entry={entry} rank={i + 1} />
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────
function EmptyInsights({ onGenerate, colors }: { onGenerate: () => void; colors: any }) {
  const pulse = useRef(new Animated.Value(0.9)).current;
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.parallel([
        Animated.timing(pulse, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 1, duration: 1000, useNativeDriver: false }),
      ]),
      Animated.parallel([
        Animated.timing(pulse, { toValue: 0.9, duration: 1000, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ]),
    ])).start();
  }, []);
  const glowColor = glow.interpolate({ inputRange: [0, 1], outputRange: [`${Colors.gold}10`, `${Colors.gold}28`] });

  return (
    <View style={{ paddingTop: 40, alignItems: "center", gap: 14 }}>
      <Animated.View style={{ transform: [{ scale: pulse }], width: 88, height: 88, borderRadius: 26, backgroundColor: glowColor as any, justifyContent: "center", alignItems: "center", borderWidth: 1.5, borderStyle: "dashed", borderColor: `${Colors.gold}40` }}>
        <Sparkles size={36} color={Colors.gold} />
      </Animated.View>
      <View style={{ alignItems: "center", gap: 6 }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.textPrimary }}>No Insights Yet</Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 18, maxWidth: 220 }}>
          Add tasks and let Tonic AI analyze your patterns
        </Text>
      </View>
      <TouchableOpacity
        onPress={onGenerate}
        activeOpacity={0.85}
        style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.gold, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 16, shadowColor: Colors.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6, marginTop: 4 }}
      >
        <Sparkles size={16} color="#0D1117" />
        <Text style={{ fontSize: 14, fontWeight: "800", color: "#0D1117" }}>Generate Insights</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 110 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${Colors.gold}15`, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  scorePill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: `${Colors.gold}15`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: `${Colors.gold}30` },
  scoreNum: { fontSize: 14, fontWeight: "800", color: Colors.gold },
  refreshBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: `${Colors.gold}15`, borderWidth: 1, borderColor: `${Colors.gold}28`, justifyContent: "center", alignItems: "center" },

  tabs: { flexDirection: "row", backgroundColor: colors.bgSecondary, borderRadius: 14, padding: 4, marginBottom: 18, borderWidth: 1, borderColor: colors.border },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 11 },
  tabActive: { backgroundColor: Colors.gold },
  tabText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  tabTextActive: { color: "#0D1117" },

  quickStats: { flexDirection: "row", alignItems: "center", backgroundColor: colors.bgSecondary, borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: colors.border },

  analyticsHero: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.bgSecondary, borderRadius: 22, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: colors.border },

  rateCard: { backgroundColor: colors.bgSecondary, borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border },

  donutCard: { backgroundColor: colors.bgSecondary, borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: colors.border },

  leaderCard: { backgroundColor: colors.bgSecondary, borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: 14 },
});
