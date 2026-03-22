import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Trophy, Lock, Zap, Star } from "lucide-react-native";
import { Colors } from "@/constants/colors";
import { useTheme } from "@/providers/ThemeProvider";
import { useAchievements } from "@/providers/AchievementsProvider";

interface AchievementsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

type FilterTab = "all" | "unlocked" | "locked";

const ICON_MAP: Record<string, string> = {
  Sun: "☀️", Zap: "⚡", Flame: "🔥", Target: "🎯", Calendar: "📅",
  Award: "🏅", BookOpen: "📚", TrendingUp: "📈", Crown: "👑", Star: "⭐",
  CheckCircle: "✅", Play: "▶️", Trophy: "🏆", Heart: "❤️", Sparkles: "✨",
  Sunrise: "🌅", Moon: "🌙", RotateCcw: "🔄", Clock: "⏰",
  Shield: "🔗", Link: "⛓️",
};

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  easy: { label: "Easy", color: Colors.success, bg: `${Colors.success}18` },
  medium: { label: "Medium", color: Colors.warning, bg: `${Colors.warning}18` },
  hard: { label: "Hard", color: Colors.danger, bg: `${Colors.danger}18` },
  expert: { label: "Expert", color: Colors.purple, bg: `${Colors.purple}18` },
};

const LEVEL_EMOJIS = ["", "🌱", "⚡", "🌟", "👑", "🏆", "🔥"];

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ isVisible, onClose }) => {
  const { achievements, stats } = useAchievements();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  const nextUp = [...locked]
    .filter((a) => a.progress > 0)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3);

  const filtered =
    activeTab === "unlocked" ? unlocked :
    activeTab === "locked" ? locked :
    achievements;

  const levelPct = Math.round(
    (stats.currentLevel.currentPoints / stats.currentLevel.nextLevelPoints) * 100
  );

  const renderAchievementCard = ({ item }: { item: typeof achievements[0] }) => {
    const diff = DIFFICULTY_CONFIG[item.difficulty] || DIFFICULTY_CONFIG.easy;
    const emoji = ICON_MAP[item.icon] ?? "🏅";
    const earned = item.basePoints * item.difficultyMultiplier;
    const remaining = item.condition?.target
      ? Math.max(0, item.condition.target - Math.round((item.progress / 100) * item.condition.target))
      : null;

    if (item.unlocked) {
      return (
        <View style={styles.unlockedCard}>
          <View style={[styles.glowRing, { shadowColor: Colors.gold }]}>
            <View style={styles.unlockedIconBg}>
              <Text style={styles.achievementEmoji}>{emoji}</Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTopRow}>
              <Text style={styles.unlockedName}>{item.name}</Text>
              <View style={styles.pointsBadgeGold}>
                <Star size={10} color={Colors.gold} />
                <Text style={styles.pointsBadgeTextGold}>{earned}</Text>
              </View>
            </View>
            <Text style={styles.cardDescription}>{item.description}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.diffBadge, { backgroundColor: diff.bg }]}>
                <Text style={[styles.diffText, { color: diff.color }]}>{diff.label}</Text>
              </View>
              <View style={styles.unlockedBadge}>
                <Text style={styles.unlockedBadgeText}>✓ Earned</Text>
              </View>
            </View>
          </View>
        </View>
      );
    }

    const isClose = item.progress >= 50;
    const isSecretLocked = item.secret && item.progress === 0;

    return (
      <View style={[styles.lockedCard, isClose && styles.lockedCardClose]}>
        <View style={[styles.lockedIconBg, isClose && styles.lockedIconBgClose]}>
          {isSecretLocked ? (
            <Lock size={22} color={colors.textMuted} />
          ) : (
            <Text style={[styles.achievementEmoji, { opacity: 0.5 }]}>{emoji}</Text>
          )}
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={[styles.lockedName, isClose && styles.lockedNameClose]}>
              {isSecretLocked ? "???" : item.name}
            </Text>
            <View style={[styles.pointsBadge, isClose && styles.pointsBadgeClose]}>
              <Text style={[styles.pointsBadgeText, isClose && styles.pointsBadgeTextClose]}>
                {earned} pts
              </Text>
            </View>
          </View>
          <Text style={styles.lockedDescription}>
            {isSecretLocked ? "Secret achievement — keep playing to unlock" : item.description}
          </Text>

          {item.progress > 0 && (
            <>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${item.progress}%`,
                      backgroundColor: isClose ? Colors.gold : diff.color,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressLabelRow}>
                <Text style={[styles.progressLabel, isClose && { color: Colors.gold }]}>
                  {Math.round(item.progress)}% complete
                </Text>
                {remaining !== null && (
                  <Text style={[styles.progressRemaining, isClose && { color: Colors.gold }]}>
                    {remaining} more to go
                  </Text>
                )}
              </View>
            </>
          )}

          <View style={styles.metaRow}>
            <View style={[styles.diffBadge, { backgroundColor: diff.bg, opacity: 0.7 }]}>
              <Text style={[styles.diffText, { color: diff.color }]}>{diff.label}</Text>
            </View>
            {isClose && (
              <View style={styles.urgencyBadge}>
                <Zap size={10} color={Colors.warning} />
                <Text style={styles.urgencyText}>Almost there!</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Trophy size={22} color={Colors.gold} />
            <Text style={styles.headerTitle}>Achievements</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <X size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Level Banner */}
          <View style={styles.levelBanner}>
            <View style={styles.levelLeft}>
              <Text style={styles.levelEmoji}>{LEVEL_EMOJIS[stats.currentLevel.level] ?? "🏆"}</Text>
              <View>
                <Text style={styles.levelTitle}>{stats.currentLevel.name}</Text>
                <Text style={styles.levelSub}>Level {stats.currentLevel.level}</Text>
              </View>
            </View>
            <View style={styles.levelRight}>
              <Text style={styles.levelPct}>{levelPct}%</Text>
              <Text style={styles.levelNextLabel}>to next level</Text>
            </View>
          </View>
          <View style={styles.levelBarTrack}>
            <View style={[styles.levelBarFill, { width: `${levelPct}%` }]} />
          </View>
          <Text style={styles.levelBarCaption}>
            {stats.currentLevel.currentPoints} / {stats.currentLevel.nextLevelPoints} pts
          </Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.totalPoints}</Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxMid]}>
              <Text style={styles.statNumber}>{stats.totalUnlocked}</Text>
              <Text style={styles.statLabel}>Unlocked</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{achievements.length - stats.totalUnlocked}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
          </View>

          {/* Next Up Section */}
          {nextUp.length > 0 && activeTab !== "unlocked" && (
            <View style={styles.nextUpSection}>
              <View style={styles.nextUpHeader}>
                <Zap size={16} color={Colors.warning} />
                <Text style={styles.nextUpTitle}>Close to Unlocking</Text>
              </View>
              {nextUp.map((a) => {
                const emoji = ICON_MAP[a.icon] ?? "🏅";
                return (
                  <View key={a.id} style={styles.nextUpCard}>
                    <Text style={styles.nextUpEmoji}>{emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nextUpName}>{a.name}</Text>
                      <View style={styles.nextUpProgressTrack}>
                        <View style={[styles.nextUpProgressFill, { width: `${a.progress}%` }]} />
                      </View>
                    </View>
                    <Text style={styles.nextUpPct}>{Math.round(a.progress)}%</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Filter Tabs */}
          <View style={styles.tabRow}>
            {(["all", "unlocked", "locked"] as FilterTab[]).map((t) => {
              const count = t === "all" ? achievements.length : t === "unlocked" ? unlocked.length : locked.length;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.tab, activeTab === t && styles.tabActive]}
                  onPress={() => setActiveTab(t)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Achievement List */}
          <View style={styles.listContainer}>
            {filtered.map((item) => (
              <View key={item.id}>
                {renderAchievementCard({ item })}
              </View>
            ))}
            {filtered.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🔒</Text>
                <Text style={styles.emptyText}>Nothing here yet — keep completing tasks!</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const makeStyles = (colors: typeof Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: colors.textPrimary },

  levelBanner: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
  },
  levelLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  levelEmoji: { fontSize: 40 },
  levelTitle: { fontSize: 20, fontWeight: "800", color: colors.textPrimary },
  levelSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  levelRight: { alignItems: "flex-end" },
  levelPct: { fontSize: 28, fontWeight: "800", color: Colors.gold },
  levelNextLabel: { fontSize: 11, color: colors.textSecondary },
  levelBarTrack: {
    marginHorizontal: 20, height: 10, backgroundColor: colors.bgTertiary,
    borderRadius: 5, overflow: "hidden",
  },
  levelBarFill: {
    height: "100%", backgroundColor: Colors.gold, borderRadius: 5,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 6,
  },
  levelBarCaption: {
    textAlign: "right", marginHorizontal: 20, marginTop: 6,
    fontSize: 12, color: colors.textSecondary,
  },

  statsRow: {
    flexDirection: "row", marginHorizontal: 20, marginTop: 16,
    backgroundColor: colors.bgSecondary, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    overflow: "hidden",
  },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 16 },
  statBoxMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  statNumber: { fontSize: 22, fontWeight: "800", color: Colors.gold },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },

  nextUpSection: {
    marginHorizontal: 20, marginTop: 20,
    backgroundColor: `${Colors.warning}10`, borderRadius: 16,
    borderWidth: 1, borderColor: `${Colors.warning}30`, padding: 16,
  },
  nextUpHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  nextUpTitle: { fontSize: 14, fontWeight: "700", color: Colors.warning },
  nextUpCard: {
    flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10,
  },
  nextUpEmoji: { fontSize: 24 },
  nextUpName: { fontSize: 13, fontWeight: "600", color: colors.textPrimary, marginBottom: 6 },
  nextUpProgressTrack: {
    height: 6, backgroundColor: colors.bgTertiary, borderRadius: 3, overflow: "hidden",
  },
  nextUpProgressFill: {
    height: "100%", backgroundColor: Colors.warning, borderRadius: 3,
  },
  nextUpPct: { fontSize: 13, fontWeight: "700", color: Colors.warning, width: 36, textAlign: "right" },

  tabRow: {
    flexDirection: "row", marginHorizontal: 20, marginTop: 20, marginBottom: 16,
    backgroundColor: colors.bgSecondary, borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  tab: {
    flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center",
  },
  tabActive: { backgroundColor: Colors.gold },
  tabText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  tabTextActive: { color: colors.bgPrimary },

  listContainer: { paddingHorizontal: 20, paddingBottom: 40 },

  unlockedCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    backgroundColor: `${Colors.gold}08`, borderRadius: 18,
    borderWidth: 2, borderColor: `${Colors.gold}40`,
    padding: 14, marginBottom: 12,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  glowRing: {
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 8,
  },
  unlockedIconBg: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: `${Colors.gold}20`, justifyContent: "center", alignItems: "center",
    borderWidth: 1.5, borderColor: `${Colors.gold}60`,
  },
  lockedCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    backgroundColor: colors.bgSecondary, borderRadius: 18,
    borderWidth: 1, borderColor: colors.border,
    padding: 14, marginBottom: 12, opacity: 0.75,
  },
  lockedCardClose: {
    opacity: 1, borderColor: `${Colors.warning}40`,
    backgroundColor: `${Colors.warning}06`,
  },
  lockedIconBg: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: colors.bgTertiary, justifyContent: "center", alignItems: "center",
  },
  lockedIconBgClose: {
    backgroundColor: `${Colors.warning}15`, borderWidth: 1, borderColor: `${Colors.warning}40`,
  },
  achievementEmoji: { fontSize: 26 },
  cardBody: { flex: 1 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  unlockedName: { fontSize: 15, fontWeight: "700", color: colors.textPrimary, flex: 1, marginRight: 8 },
  lockedName: { fontSize: 15, fontWeight: "600", color: colors.textSecondary, flex: 1, marginRight: 8 },
  lockedNameClose: { color: colors.textPrimary },
  cardDescription: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 18, marginBottom: 8 },
  lockedDescription: { fontSize: 12.5, color: colors.textMuted, lineHeight: 18, marginBottom: 8 },

  progressTrack: {
    height: 6, backgroundColor: colors.bgTertiary, borderRadius: 3, overflow: "hidden", marginBottom: 4,
  },
  progressFill: { height: "100%", borderRadius: 3 },
  progressLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { fontSize: 11, color: colors.textSecondary },
  progressRemaining: { fontSize: 11, color: colors.textSecondary },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  diffBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  diffText: { fontSize: 11, fontWeight: "600" },
  pointsBadgeGold: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: `${Colors.gold}20`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  pointsBadgeTextGold: { fontSize: 11, fontWeight: "700", color: Colors.gold },
  pointsBadge: {
    backgroundColor: colors.bgTertiary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  pointsBadgeClose: { backgroundColor: `${Colors.warning}18` },
  pointsBadgeText: { fontSize: 11, fontWeight: "600", color: colors.textMuted },
  pointsBadgeTextClose: { color: Colors.warning },
  unlockedBadge: {
    backgroundColor: `${Colors.success}18`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  unlockedBadgeText: { fontSize: 11, fontWeight: "600", color: Colors.success },
  urgencyBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: `${Colors.warning}18`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  urgencyText: { fontSize: 11, fontWeight: "600", color: Colors.warning },

  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: "center" },
});
