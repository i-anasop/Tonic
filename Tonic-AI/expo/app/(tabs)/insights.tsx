import { useState, useRef, useEffect, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
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
} from "lucide-react-native";

import { Colors } from "@/constants/colors";
import { useTasks } from "@/providers/TasksProvider";
import type { AIInsight } from "@/types/tasks";

const { width: _SCREEN_WIDTH } = Dimensions.get("window");

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
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const Icon = insight.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
          delay: index * 100,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          delay: index * 100,
        }),
      ]).start();
    }, 100);
    return () => clearTimeout(timer);
  }, [index, scaleAnim, opacityAnim]);

  const handlePress = () => {
    setExpanded(!expanded);
    Animated.spring(scaleAnim, {
      toValue: expanded ? 1 : 0.98,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.insightCard,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
          borderLeftWidth: 4,
          borderLeftColor: insight.color,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.insightContent}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.insightHeader}>
          <View
            style={[
              styles.insightIconContainer,
              { backgroundColor: `${insight.color}15` },
            ]}
          >
            <Icon size={22} color={insight.color} />
          </View>
          <View style={styles.insightTypeBadge}>
            <Text style={[styles.insightTypeText, { color: insight.color }]}>
              {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
            </Text>
          </View>
        </View>

        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.insightDescription}>{insight.description}</Text>

        {insight.metric && (
          <View style={styles.insightFooter}>
            <View style={styles.metricContainer}>
              <Text style={[styles.metricValue, { color: insight.color }]}>
                {insight.metric}
              </Text>
              {insight.trend && (
                <View style={styles.trendContainer}>
                  {insight.trend === "up" && (
                    <TrendingUp size={14} color={Colors.success} />
                  )}
                  {insight.trend === "down" && (
                    <TrendingUp
                      size={14}
                      color={Colors.danger}
                      style={{ transform: [{ rotate: "180deg" }] }}
                    />
                  )}
                </View>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  color,
  subtext,
}: {
  icon: typeof Sparkles;
  value: string | number;
  label: string;
  color: string;
  subtext?: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subtext && <Text style={styles.statSubtext}>{subtext}</Text>}
    </View>
  );
}

function CategoryBar({
  name,
  count,
  total,
  color,
}: {
  name: string;
  count: number;
  total: number;
  color: string;
}) {
  const barWidth = useRef(new Animated.Value(0)).current;
  const percentage = total > 0 ? (count / total) * 100 : 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(barWidth, {
        toValue: percentage,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }, 500);
    return () => clearTimeout(timer);
  }, [percentage, barWidth]);

  const widthInterpolate = barWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.categoryBarContainer}>
      <View style={styles.categoryBarHeader}>
        <Text style={styles.categoryBarName}>{name}</Text>
        <Text style={styles.categoryBarPercent}>{Math.round(percentage)}%</Text>
      </View>
      <View style={styles.categoryBarTrack}>
        <Animated.View
          style={[
            styles.categoryBarFill,
            { backgroundColor: color, width: widthInterpolate },
          ]}
        />
      </View>
    </View>
  );
}

export default function InsightsScreen() {
  const [activeTab, setActiveTab] = useState<"insights" | "analytics">("insights");
  const { insights, tasks, getStats } = useTasks();
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    tasksCreated: 0,
    currentStreak: 0,
    productivityScore: 0,
  });

  const loadStats = useCallback(async () => {
    const newStats = await getStats();
    setStats(newStats);
  }, [getStats]);

  useEffect(() => {
    void loadStats();
  }, [loadStats, tasks]);

  const iconMap: Record<string, typeof Sparkles> = {
    target: Target,
    alert: AlertTriangle,
    balance: Zap,
    trending: TrendingUp,
    clock: Clock,
    brain: Brain,
  };

  const typeColorMap: Record<string, string> = {
    focus: Colors.gold,
    warning: Colors.warning,
    suggestion: Colors.blue,
    pattern: Colors.success,
    achievement: Colors.purple,
  };

  const displayInsights: DisplayInsight[] = insights.map((i: AIInsight) => ({
    id: i.id,
    type: i.type as InsightType,
    title: i.title,
    description: i.description,
    icon: iconMap[i.icon] || Sparkles,
    color: typeColorMap[i.type] || Colors.gold,
  }));

  // Add achievement insight if streak > 0
  const achievementInsights: DisplayInsight[] = [];
  if (stats.currentStreak > 0) {
    achievementInsights.push({
      id: "streak",
      type: "achievement",
      title: "Streak Milestone",
      description: `You've maintained a ${stats.currentStreak}-day productivity streak! Keep it up.`,
      icon: Flame,
      color: Colors.warning,
      metric: `${stats.currentStreak} days`,
      trend: "up",
    });
  }

  const allInsights = [...displayInsights, ...achievementInsights];

  // Calculate category breakdown
  const categoryCounts = {
    Work: tasks.filter((t: any) => t.category === "work").length,
    Personal: tasks.filter((t: any) => t.category === "personal").length,
    Health: tasks.filter((t: any) => t.category === "health").length,
    Learning: tasks.filter((t: any) => t.category === "learning").length,
  };

  const categoryColors: Record<string, string> = {
    Work: Colors.blue,
    Personal: Colors.purple,
    Health: Colors.success,
    Learning: Colors.gold,
  };

  const completionRate = stats.tasksCreated > 0
    ? Math.round((stats.tasksCompleted / stats.tasksCreated) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <View style={styles.headerTitleRow}>
              <Sparkles size={20} color={Colors.gold} />
              <Text style={styles.headerTitle}>AI Insights</Text>
            </View>
            <Text style={styles.headerSubtitle}>Powered by Pulse AI</Text>
          </View>
          <View style={styles.scoreBadge}>
            <Brain size={16} color={Colors.gold} />
            <Text style={styles.scoreText}>{stats.productivityScore}</Text>
          </View>
        </View>

        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "insights" && styles.tabActive]}
            onPress={() => setActiveTab("insights")}
          >
            <Lightbulb
              size={16}
              color={activeTab === "insights" ? Colors.bgPrimary : Colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "insights" && styles.tabTextActive,
              ]}
            >
              Insights
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "analytics" && styles.tabActive]}
            onPress={() => setActiveTab("analytics")}
          >
            <BarChart3
              size={16}
              color={activeTab === "analytics" ? Colors.bgPrimary : Colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "analytics" && styles.tabTextActive,
              ]}
            >
              Analytics
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "insights" ? (
          <>
            <View style={styles.quickStats}>
              <StatCard
                icon={Target}
                value={`${completionRate}%`}
                label="Completion"
                color={Colors.success}
                subtext="All time"
              />
              <StatCard
                icon={Clock}
                value={stats.tasksCreated}
                label="Total Tasks"
                color={Colors.blue}
                subtext="Created"
              />
              <StatCard
                icon={Flame}
                value={stats.currentStreak}
                label="Day Streak"
                color={Colors.warning}
                subtext="Keep it up!"
              />
            </View>

            <Text style={styles.sectionTitle}>Smart Recommendations</Text>
            {allInsights.length === 0 ? (
              <View style={styles.emptyInsights}>
                <Text style={styles.emptyInsightsText}>
                  Complete some tasks to get personalized AI insights
                </Text>
              </View>
            ) : (
              <View style={styles.insightsList}>
                {allInsights.map((insight, index) => (
                  <InsightCard key={insight.id} insight={insight} index={index} />
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <Calendar size={20} color={Colors.gold} />
                <Text style={styles.overviewTitle}>Overview</Text>
              </View>
              <View style={styles.overviewStats}>
                <View style={styles.overviewStat}>
                  <Text style={styles.overviewStatValue}>{stats.tasksCreated}</Text>
                  <Text style={styles.overviewStatLabel}>Total Tasks</Text>
                </View>
                <View style={styles.overviewDivider} />
                <View style={styles.overviewStat}>
                  <Text style={styles.overviewStatValue}>{stats.tasksCompleted}</Text>
                  <Text style={styles.overviewStatLabel}>Completed</Text>
                </View>
                <View style={styles.overviewDivider} />
                <View style={styles.overviewStat}>
                  <Text style={styles.overviewStatValue}>{stats.currentStreak}</Text>
                  <Text style={styles.overviewStatLabel}>Streak</Text>
                </View>
              </View>
            </View>

            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Category Distribution</Text>
              <Text style={styles.breakdownSubtitle}>
                How you allocate your tasks across categories
              </Text>
              <View style={styles.categoryBars}>
                {Object.entries(categoryCounts).map(([name, count]: [string, number]) => (
                  <CategoryBar
                    key={name}
                    name={name}
                    count={count}
                    total={stats.tasksCreated}
                    color={categoryColors[name]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.scoreCard}>
              <View style={styles.scoreCardLeft}>
                <Text style={styles.scoreCardTitle}>Productivity Score</Text>
                <Text style={styles.scoreCardDescription}>
                  Based on completion rate, consistency, and streak
                </Text>
                <View style={styles.scoreTrend}>
                  <TrendingUp size={16} color={Colors.success} />
                  <Text style={styles.scoreTrendText}>Calculated in real-time</Text>
                </View>
              </View>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreCircleValue}>{stats.productivityScore}</Text>
                <Text style={styles.scoreCircleLabel}>Score</Text>
              </View>
            </View>
          </>
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
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: `${Colors.gold}15`,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${Colors.gold}30`,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.gold,
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: Colors.bgSecondary,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: Colors.gold,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.bgPrimary,
  },
  quickStats: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
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
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  emptyInsights: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyInsightsText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  insightsList: {
    gap: 12,
  },
  insightCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  insightContent: {
    padding: 16,
  },
  insightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  insightIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  insightTypeBadge: {
    backgroundColor: Colors.bgTertiary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  insightTypeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  insightDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  insightFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metricContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  overviewCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  overviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  overviewStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overviewStat: {
    alignItems: "center",
    flex: 1,
  },
  overviewStatValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  overviewStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  overviewDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  breakdownCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  breakdownSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  categoryBars: {
    gap: 16,
  },
  categoryBarContainer: {
    gap: 8,
  },
  categoryBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBarName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  categoryBarPercent: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  categoryBarTrack: {
    height: 8,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 4,
    overflow: "hidden",
  },
  categoryBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  scoreCard: {
    flexDirection: "row",
    backgroundColor: Colors.bgSecondary,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  scoreCardLeft: {
    flex: 1,
  },
  scoreCardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  scoreCardDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  scoreTrend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scoreTrendText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.success,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.gold}15`,
    borderWidth: 3,
    borderColor: Colors.gold,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreCircleValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.gold,
  },
  scoreCircleLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "500",
  },
});
