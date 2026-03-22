import { useState, useEffect, useCallback, useRef } from "react";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  Alert,
  Animated,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {
  User,
  Settings,
  Bell,
  Moon,
  Wallet,
  LogOut,
  ChevronRight,
  Trophy,
  Target,
  Flame,
  Sparkles,
  Shield,
  HelpCircle,
  Edit3,
  Zap,
  Crown,
  Heart,
  BookOpen,
  TrendingUp,
  Lightbulb,
  Award,
  Camera,
} from "lucide-react-native";
import { useRouter } from "expo-router";

import { Colors } from "@/constants/colors";
import { useAppState } from "@/providers/AppStateProvider";
import { useTasks } from "@/providers/TasksProvider";
import { useAchievements } from "@/providers/AchievementsProvider";
import { AchievementsModal } from "@/components/AchievementsModal";

interface StatItemProps {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: string;
}

function StatItem({ icon: Icon, value, label, color }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
        <Icon size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface MenuItemProps {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  color?: string;
  danger?: boolean;
}

function MenuItem({
  icon: Icon,
  title,
  subtitle,
  onPress,
  rightElement,
  color,
  danger,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, danger && styles.menuItemDanger]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      <View
        style={[
          styles.menuIconContainer,
          { backgroundColor: danger ? `${Colors.danger}15` : `${color || Colors.textSecondary}15` },
        ]}
      >
        <Icon size={20} color={danger ? Colors.danger : color || Colors.textSecondary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || <ChevronRight size={20} color={Colors.textMuted} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, setUser } = useAppState();
  const { tasks, getStats, getCompletedTasks } = useTasks();
  const { stats: achievementStats } = useAchievements();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [isAchievementsModalVisible, setIsAchievementsModalVisible] = useState(false);
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    currentStreak: 0,
    productivityScore: 0,
  });

  const loadStats = useCallback(async () => {
    const newStats = await getStats();
    setStats({
      tasksCompleted: newStats.tasksCompleted,
      currentStreak: newStats.currentStreak,
      productivityScore: newStats.productivityScore,
    });
  }, [getStats]);

  useEffect(() => {
    void loadStats();
  }, [loadStats, tasks]);

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out? Your data will be preserved.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            signOut();
            router.replace("/onboarding");
          },
        },
      ]
    );
  };

  const handleDarkModeToggle = useCallback((value: boolean) => {
    setDarkModeEnabled(value);
    console.log(`🌙 Dark mode ${value ? "enabled" : "disabled"}`);
    // TODO: Implement dark mode context/provider for app-wide theming
  }, []);

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your tasks and progress. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Data",
          style: "destructive",
          onPress: () => {
            signOut();
            router.replace("/onboarding");
          },
        },
      ]
    );
  };

  const handlePickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        // Update user with new image URI
        if (user) {
          const updatedUser = { ...user, profilePictureUri: imageUri };
          setUser(updatedUser);
          Alert.alert("✅ Profile Picture Updated", "Your profile picture has been saved!");
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  }, [user, setUser]);

  const completedTasks = getCompletedTasks();
  const completionRate = tasks.length > 0
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;

  const formatWalletAddress = (address?: string) => {
    if (!address) return undefined;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={handlePickImage}
                activeOpacity={0.8}
              >
                <View style={styles.avatar}>
                  {user.profilePictureUri ? (
                    <Image
                      source={{ uri: user.profilePictureUri }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {user.name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                  {/* Camera icon overlay */}
                  <View style={styles.cameraIconOverlay}>
                    <Camera size={16} color={Colors.bgPrimary} />
                  </View>
                </View>
                {/* Level Badge */}
                <View style={styles.levelBadgeAvatar}>
                  <Text style={styles.levelBadgeAvatarText}>
                    {achievementStats.currentLevel.level}
                  </Text>
                </View>
                {user.walletAddress && (
                  <View style={styles.walletBadge}>
                    <Wallet size={12} color={Colors.gold} />
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user.name}</Text>
                {user.walletAddress ? (
                  <View style={styles.walletChip}>
                    <Wallet size={14} color={Colors.gold} />
                    <Text style={styles.walletText}>
                      {formatWalletAddress(user.walletAddress)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.guestChip}>
                    <User size={14} color={Colors.textMuted} />
                    <Text style={styles.guestText}>Guest User</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
                <Edit3 size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <StatItem
                icon={Target}
                value={stats.tasksCompleted}
                label="Completed"
                color={Colors.success}
              />
              <View style={styles.statDivider} />
              <StatItem
                icon={Flame}
                value={stats.currentStreak}
                label="Day Streak"
                color={Colors.warning}
              />
              <View style={styles.statDivider} />
              <StatItem
                icon={Sparkles}
                value={stats.productivityScore}
                label="Score"
                color={Colors.blue}
              />
            </View>
          </View>

          {/* Achievements Quick View */}
          <TouchableOpacity
            style={styles.achievementsButton}
            onPress={() => setIsAchievementsModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.achievementsButtonContent}>
              <View style={styles.achievementsButtonLeft}>
                <Trophy size={24} color={Colors.gold} />
                <View>
                  <Text style={styles.achievementsButtonTitle}>Check Your Achievements</Text>
                  <Text style={styles.achievementsButtonSubtitle}>
                    {achievementStats.totalUnlocked} unlocked • {achievementStats.totalPoints} points
                  </Text>
                </View>
              </View>
              <View style={styles.achievementsButtonRight}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{achievementStats.currentLevel.level}</Text>
                </View>
              </View>
            </View>
            <View style={styles.progressIndicator}>
              <View
                style={[
                  styles.progressIndicatorFill,
                  {
                    width: `${
                      (achievementStats.currentLevel.currentPoints /
                        achievementStats.currentLevel.nextLevelPoints) *
                      100
                    }%`,
                  },
                ]}
              />
            </View>
          </TouchableOpacity>
          
          {/* Old achievements grid removed - now in modal */}

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={Bell}
              title="Notifications"
              subtitle="Get reminders for upcoming tasks"
              color={Colors.blue}
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: Colors.bgTertiary, true: `${Colors.gold}50` }}
                  thumbColor={notificationsEnabled ? Colors.gold : Colors.textMuted}
                />
              }
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon={Moon}
              title="Dark Mode"
              subtitle="Use dark theme"
              color={Colors.purple}
              rightElement={
                <Switch
                  value={darkModeEnabled}
                  onValueChange={handleDarkModeToggle}
                  trackColor={{ false: Colors.bgTertiary, true: `${Colors.gold}50` }}
                  thumbColor={darkModeEnabled ? Colors.gold : Colors.textMuted}
                />
              }
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            {!user.walletAddress ? (
              <>
                <MenuItem
                  icon={Wallet}
                  title="Connect TON Wallet"
                  subtitle="Unlock blockchain features & rewards"
                  color={Colors.gold}
                  onPress={() => {
                    Alert.alert(
                      "🔗 Connect TON Wallet",
                      "Connect your TON wallet to unlock exclusive features, earn rewards, and track your productivity on the blockchain!\n\nThis feature enables:\n• Earn TON tokens for completed tasks\n• Share achievements on-chain\n• Participate in community challenges",
                      [
                        { text: "Later", style: "cancel" },
                        { text: "Connect Now", style: "default", onPress: () => {
                          router.push("/onboarding");
                        }},
                      ]
                    );
                  }}
                />
                <View style={styles.menuDivider} />
              </>
            ) : (
              <>
                <MenuItem
                  icon={Wallet}
                  title="TON Wallet Connected"
                  subtitle={formatWalletAddress(user.walletAddress)}
                  color={Colors.gold}
                  rightElement={
                    <View style={styles.connectedBadge}>
                      <Text style={styles.connectedBadgeText}>✓</Text>
                    </View>
                  }
                />
                <View style={styles.menuDivider} />
              </>
            )}
            <MenuItem
              icon={Shield}
              title="Privacy & Security"
              color={Colors.success}
              onPress={() => {
                Alert.alert("Privacy", "Privacy settings coming soon!");
              }}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon={HelpCircle}
              title="Help & Support"
              color={Colors.blue}
              onPress={() => {
                Alert.alert("Help", "Support center coming soon!");
              }}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={LogOut}
              title="Sign Out"
              danger
              onPress={handleSignOut}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon={Settings}
              title="Clear All Data"
              subtitle="Delete all tasks and progress"
              danger
              onPress={handleClearData}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Pulse AI v1.0.0</Text>
          <Text style={styles.appBuild}>Built for TON & Telegram</Text>
        </View>
      </ScrollView>

      {/* Achievements Modal */}
      <AchievementsModal
        isVisible={isAchievementsModalVisible}
        onClose={() => setIsAchievementsModalVisible(false)}
      />
    </SafeAreaView>
    </>
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
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.gold}20`,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.gold,
    overflow: "hidden",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.gold,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
  },
  cameraIconOverlay: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gold,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.bgPrimary,
  },
  levelBadgeAvatar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gold,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.bgSecondary,
  },
  levelBadgeAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.bgPrimary,
  },
  walletBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.bgPrimary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  walletChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: `${Colors.gold}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  walletText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.gold,
  },
  guestChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.bgTertiary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  guestText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textMuted,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.bgTertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statIconContainer: {
    width: 44,
    height: 44,
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
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  achievementsButton: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
    overflow: "hidden",
  },
  achievementsButtonContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  achievementsButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  achievementsButtonRight: {
    marginLeft: 12,
  },
  achievementsButtonTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  achievementsButtonSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  levelBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.gold,
    justifyContent: "center",
    alignItems: "center",
  },
  levelBadgeText: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.bgPrimary,
  },
  progressIndicator: {
    height: 4,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressIndicatorFill: {
    height: "100%",
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  dangerTitle: {
    color: Colors.danger,
  },
  menuCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.bgSecondary,
  },
  menuItemDanger: {
    backgroundColor: `${Colors.danger}05`,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  menuTitleDanger: {
    color: Colors.danger,
  },
  menuSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 70,
  },
  appInfo: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  appVersion: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  appBuild: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  achievementsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
  },
  achievementCard: {
    width: "48%",
    backgroundColor: Colors.bgSecondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  achievementUnlockedCard: {
    borderColor: Colors.gold,
    backgroundColor: `${Colors.gold}05`,
  },
  achievementIconBg: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.bgTertiary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  achievementIconBgUnlocked: {
    backgroundColor: `${Colors.gold}20`,
  },
  achievementCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: "center",
  },
  achievementCardDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
    textAlign: "center",
  },
  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 3,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  achievementProgress: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  connectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.success,
    justifyContent: "center",
    alignItems: "center",
  },
  connectedBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.bgPrimary,
  },
});
