import React, { useState } from "react";
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
import {
  X,
  Filter,
  Trophy,
  Zap,
  Award,
  Target,
  TrendingUp,
  ChevronDown,
} from "lucide-react-native";
import { Colors } from "@/constants/colors";
import { useAchievements } from "@/providers/AchievementsProvider";

interface AchievementsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

type FilterCategory = "all" | "daily" | "weekly" | "monthly" | "timeless";
type FilterDifficulty = "all" | "easy" | "medium" | "hard" | "expert";
type FilterStatus = "all" | "unlocked" | "locked";

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ isVisible, onClose }) => {
  const { achievements, stats } = useAchievements();
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<FilterDifficulty>("all");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Filter achievements
  const filteredAchievements = achievements.filter((achievement) => {
    if (categoryFilter !== "all" && achievement.category !== categoryFilter) return false;
    if (difficultyFilter !== "all" && achievement.difficulty !== difficultyFilter) return false;
    if (statusFilter === "unlocked" && !achievement.unlocked) return false;
    if (statusFilter === "locked" && achievement.unlocked) return false;
    return true;
  });

  const getDifficultyColor = (difficulty: string): string => {
    const colors: Record<string, string> = {
      easy: Colors.success,
      medium: Colors.warning,
      hard: Colors.danger,
      expert: Colors.purple,
    };
    return colors[difficulty] || Colors.textSecondary;
  };

  const getDifficultyBgColor = (difficulty: string): string => {
    const color = getDifficultyColor(difficulty);
    return `${color}15`;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      daily: <Zap size={14} color={Colors.warning} />,
      weekly: <Award size={14} color={Colors.blue} />,
      monthly: <Trophy size={14} color={Colors.gold} />,
      timeless: <Target size={14} color={Colors.success} />,
    };
    return icons[category];
  };

  const renderAchievementCard = ({ item }: { item: typeof achievements[0] }) => {
    const earnedPoints = item.basePoints * item.difficultyMultiplier;
    const diffColor = getDifficultyColor(item.difficulty);

    return (
      <TouchableOpacity
        style={[
          styles.achievementCard,
          item.unlocked && { borderColor: Colors.gold, backgroundColor: `${Colors.gold}05` },
          !item.unlocked && { opacity: 0.6 },
        ]}
        activeOpacity={0.8}
      >
        {/* Header with icon and points */}
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: getDifficultyBgColor(item.difficulty) },
            ]}
          >
            <Text style={styles.iconPlaceholder}>🏆</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.achievementName}>{item.name}</Text>
            <View style={styles.badgesRow}>
              <View style={styles.badge}>{getCategoryIcon(item.category)}</View>
              <View style={[styles.badge, { backgroundColor: getDifficultyBgColor(item.difficulty) }]}>
                <Text style={[styles.badgeText, { color: diffColor }]}>
                  {item.difficulty.charAt(0).toUpperCase()}
                </Text>
              </View>
              {item.unlocked && (
                <View style={[styles.badge, { backgroundColor: `${Colors.success}20` }]}>
                  <Text style={[styles.badgeText, { color: Colors.success }]}>✓</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={[styles.points, item.unlocked && { color: Colors.gold }]}>
            {earnedPoints}
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>{item.description}</Text>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(item.progress, 100)}%`,
                  backgroundColor: item.unlocked ? Colors.gold : diffColor,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(item.progress)}%
          </Text>
        </View>

        {/* Unlock status */}
        {!item.unlocked && item.secret && (
          <Text style={styles.secretText}>🔒 Secret Achievement</Text>
        )}
        {item.unlocked && item.unlockedAt && (
          <Text style={styles.unlockedText}>
            Unlocked {new Date(item.unlockedAt).toLocaleDateString()}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleSection}>
            <Trophy size={24} color={Colors.gold} />
            <Text style={styles.headerTitle}>Achievements</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalPoints}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.currentLevel.level}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalUnlocked}</Text>
            <Text style={styles.statLabel}>Unlocked</Text>
          </View>
        </View>

        {/* Level Progress */}
        <View style={styles.levelSection}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelName}>{stats.currentLevel.name}</Text>
            <Text style={styles.levelPoints}>
              {stats.currentLevel.currentPoints} / {stats.currentLevel.nextLevelPoints}
            </Text>
          </View>
          <View style={styles.levelProgressBar}>
            <View
              style={[
                styles.levelProgressFill,
                {
                  width: `${
                    (stats.currentLevel.currentPoints / stats.currentLevel.nextLevelPoints) * 100
                  }%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
            activeOpacity={0.8}
          >
            <Filter size={18} color={Colors.textPrimary} />
            <Text style={styles.filterButtonText}>Filters</Text>
            <ChevronDown
              size={18}
              color={Colors.textSecondary}
              style={{ transform: [{ rotate: showFilters ? "180deg" : "0deg" }] }}
            />
          </TouchableOpacity>

          {showFilters && (
            <View style={styles.filterOptions}>
              {/* Category Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Category</Text>
                <View style={styles.filterChips}>
                  {(["all", "daily", "weekly", "monthly", "timeless"] as FilterCategory[]).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.filterChip,
                        categoryFilter === cat && styles.filterChipActive,
                      ]}
                      onPress={() => setCategoryFilter(cat)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          categoryFilter === cat && styles.filterChipTextActive,
                        ]}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Difficulty Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Difficulty</Text>
                <View style={styles.filterChips}>
                  {(["all", "easy", "medium", "hard", "expert"] as FilterDifficulty[]).map((diff) => (
                    <TouchableOpacity
                      key={diff}
                      style={[
                        styles.filterChip,
                        difficultyFilter === diff && styles.filterChipActive,
                      ]}
                      onPress={() => setDifficultyFilter(diff)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          difficultyFilter === diff && styles.filterChipTextActive,
                        ]}
                      >
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Status Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Status</Text>
                <View style={styles.filterChips}>
                  {(["all", "unlocked", "locked"] as FilterStatus[]).map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.filterChip,
                        statusFilter === status && styles.filterChipActive,
                      ]}
                      onPress={() => setStatusFilter(status)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          statusFilter === status && styles.filterChipTextActive,
                        ]}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Achievements List */}
        <FlatList
          data={filteredAchievements}
          renderItem={renderAchievementCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No achievements match your filters</Text>
            </View>
          }
        />

        {/* Footer with summary */}
        <View style={styles.footer}>
          <Text style={styles.summ}>
            {filteredAchievements.filter((a) => a.unlocked).length} / {filteredAchievements.length}{" "}
            Unlocked
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitleSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  statsSection: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.gold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  levelSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.bgSecondary,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  levelName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  levelPoints: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  levelProgressBar: {
    height: 8,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 4,
    overflow: "hidden",
  },
  levelProgressFill: {
    height: "100%",
    backgroundColor: Colors.gold,
    borderRadius: 4,
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.bgSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  filterButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  filterOptions: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.bgPrimary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  achievementCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  iconPlaceholder: {
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  achievementName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.bgTertiary,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  points: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.warning,
    marginLeft: 8,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  progressSection: {
    marginBottom: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "right",
  },
  secretText: {
    fontSize: 11,
    color: Colors.warning,
    fontWeight: "600",
  },
  unlockedText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bgSecondary,
  },
  summ: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
});
