import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import { useTheme, type AppColors } from "@/providers/ThemeProvider";
import { useAppState } from "@/providers/AppStateProvider";
import { useTasks } from "@/providers/TasksProvider";
import { useAchievements } from "@/providers/AchievementsProvider";
import { AchievementsModal } from "@/components/AchievementsModal";
import { useTonConnect } from "@/hooks/useTonConnect";
import { API_BASE_URL } from "@/constants/api";

interface StatItemProps {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: string;
}

function StatItem({ icon: Icon, value, label, color }: StatItemProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
          { backgroundColor: danger ? `${Colors.danger}15` : `${color || colors.textSecondary}15` },
        ]}
      >
        <Icon size={20} color={danger ? Colors.danger : color || colors.textSecondary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || <ChevronRight size={20} color={colors.textMuted} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, setUser } = useAppState();
  const { tasks, getStats, getCompletedTasks } = useTasks();
  const { stats: achievementStats, claimPoints } = useAchievements();
  const { isConnected: isTonConnected, recordAchievementOnChain, isSendingTx } = useTonConnect();
  const { isDark, toggleTheme, colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [isRecordingOnChain, setIsRecordingOnChain] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
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

  const handleDarkModeToggle = useCallback(() => {
    void toggleTheme();
  }, [toggleTheme]);

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

  const handleProofOfProductivity = useCallback(async () => {
    if (!isTonConnected) {
      Alert.alert("Wallet Required", "Connect your TON wallet to sign your productivity score on-chain.", [{ text: "OK" }]);
      return;
    }

    Alert.alert(
      "Proof of Productivity",
      `This will sign your productivity score (${stats.productivityScore} points, ${stats.tasksCompleted} tasks) onto the TON blockchain using your wallet signature.\n\nYour score becomes a verifiable on-chain identity.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign On-Chain",
          onPress: async () => {
            setIsRecordingOnChain(true);
            try {
              const comment = `Tonic AI | Proof of Productivity | Score: ${stats.productivityScore} | Tasks: ${stats.tasksCompleted} | Streak: ${stats.currentStreak}d`;
              const result = await recordAchievementOnChain({
                title: `Productivity Score: ${stats.productivityScore}`,
                tasksCompleted: stats.tasksCompleted,
                streak: stats.currentStreak,
              });
              if (result && user?.id) {
                await fetch(`${API_BASE_URL}/api/ton-proof`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId: user.id,
                    walletAddress: user.walletAddress,
                    proof: { boc: result.boc, comment },
                    score: stats.productivityScore,
                  }),
                }).catch(() => {});
                await fetch(`${API_BASE_URL}/api/records`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    id: `proof_${user.id}_${Date.now()}`,
                    userId: user.id,
                    recordType: "proof_of_productivity",
                    title: `Proof of Productivity: ${stats.productivityScore}pts`,
                    description: comment,
                    tonTxHash: result.boc,
                  }),
                }).catch(() => {});
                setLastTxHash(result.boc);
                Alert.alert("Identity Verified!", `Your productivity score of ${stats.productivityScore} points is now permanently recorded on the TON blockchain. Verifiable by anyone.`, [{ text: "Awesome!" }]);
              }
            } catch {
              Alert.alert("Failed", "Could not sign on-chain. Please try again.");
            } finally {
              setIsRecordingOnChain(false);
            }
          },
        },
      ]
    );
  }, [isTonConnected, stats, recordAchievementOnChain, user]);

  const handleClaimPoints = useCallback(
    (forceWallet = false) => {
      const pending = achievementStats.pendingPoints;
      const { level, name: levelName } = achievementStats.currentLevel;

      if (pending <= 0) {
        Alert.alert("No Pending Points", "Unlock achievements to earn claimable points.");
        return;
      }

      if (forceWallet && !isTonConnected) {
        Alert.alert(
          "Wallet Required",
          "Connect your TON wallet first to claim with the 2× on-chain boost.",
          [{ text: "OK" }]
        );
        return;
      }

      if (forceWallet) {
        // TON 2× claim — record on-chain then credit 2× points
        Alert.alert(
          "Claim via TON (2×)",
          `You have ${pending} pending pts.\n\n⛓️ Claiming on TON blockchain doubles them to ${pending * 2} pts — permanently verifiable on tonscan.org.\n\nOnly gas fee applies.`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Claim 2× on TON",
              onPress: async () => {
                setIsRecordingOnChain(true);
                try {
                  const result = await recordAchievementOnChain({
                    title: `Points Claim: ${pending} pts (2×)`,
                    tasksCompleted: stats.tasksCompleted,
                    streak: stats.currentStreak,
                  });
                  if (result) {
                    setLastTxHash(result.boc);
                    await claimPoints(true);
                    if (user?.id) {
                      await fetch(`${API_BASE_URL}/api/claim-points`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          userId: user.id,
                          walletAddress: user.walletAddress,
                          points: pending * 2,
                          level,
                          levelName,
                          tonTxHash: result.boc,
                        }),
                      }).catch(() => {});
                    }
                    Alert.alert(
                      "Points Claimed on TON! 🎉",
                      `${pending * 2} pts (2× bonus) recorded on TON blockchain. Your score is now ${achievementStats.claimedPoints + pending * 2} pts.`,
                      [{ text: "Let's Go!" }]
                    );
                  }
                } catch {
                  Alert.alert("Transaction Failed", "Could not claim on-chain. Please try again.");
                } finally {
                  setIsRecordingOnChain(false);
                }
              },
            },
          ]
        );
      } else {
        // Standard 1× claim — no wallet needed
        Alert.alert(
          "Claim Points (1×)",
          `Claim ${pending} pending points to your score.\n\n💡 Tip: Connect a TON wallet to claim with a 2× multiplier — double the points!`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Claim Now",
              onPress: async () => {
                await claimPoints(false);
                Alert.alert(
                  "Points Claimed! 🎉",
                  `${pending} pts added to your score.`,
                  [{ text: "Nice!" }]
                );
              },
            },
          ]
        );
      }
    },
    [isTonConnected, achievementStats, stats, recordAchievementOnChain, claimPoints, user]
  );

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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={["top"]}>
        <ScrollView
          style={[styles.scrollView, { backgroundColor: colors.bgPrimary }]}
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
                    <Camera size={16} color={colors.bgPrimary} />
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
                    <User size={14} color={colors.textMuted} />
                    <Text style={styles.guestText}>Guest User</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
                <Edit3 size={18} color={colors.textSecondary} />
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
                    {achievementStats.totalUnlocked} unlocked • {achievementStats.claimedPoints} pts claimed
                    {achievementStats.pendingPoints > 0 ? ` • ${achievementStats.pendingPoints} pending` : ""}
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

          {/* Pending Points Claim Banner */}
          {achievementStats.pendingPoints > 0 && (
            <View style={[styles.claimChainRow, { gap: 10 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.claimChainTitle}>
                  🎁 {achievementStats.pendingPoints} pts ready to claim
                </Text>
                <Text style={styles.claimChainSub}>
                  Claim now (1×) or connect TON wallet for a 2× boost
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={[styles.claimChainBadge, { backgroundColor: `${Colors.blue}20`, borderColor: `${Colors.blue}40`, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }]}
                  onPress={() => handleClaimPoints(false)}
                  disabled={isRecordingOnChain || isSendingTx}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.claimChainBadgeText, { color: Colors.blue }]}>1×</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.claimChainBadge, { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }]}
                  onPress={() => handleClaimPoints(true)}
                  disabled={isRecordingOnChain || isSendingTx}
                  activeOpacity={0.8}
                >
                  <Text style={styles.claimChainBadgeText}>
                    {isRecordingOnChain ? "..." : "2× ⛓️"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TON Blockchain Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TON Blockchain</Text>
            <View style={styles.menuCard}>
              <TouchableOpacity
                style={styles.tonRecordButton}
                onPress={handleProofOfProductivity}
                activeOpacity={0.8}
                disabled={isRecordingOnChain || isSendingTx}
              >
                <View style={styles.tonRecordLeft}>
                  <View style={[styles.menuIconContainer, { backgroundColor: `${Colors.blue}15` }]}>
                    <Shield size={20} color={Colors.blue} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>Proof of Productivity</Text>
                    <Text style={styles.menuSubtitle}>
                      {isTonConnected
                        ? `Sign your score (${stats.productivityScore}pts) on TON blockchain`
                        : "Connect wallet to verify identity on-chain"}
                    </Text>
                  </View>
                </View>
                <View style={[styles.tonBadge, { backgroundColor: `${Colors.blue}15`, borderColor: `${Colors.blue}40` }, !isTonConnected && styles.tonBadgeInactive]}>
                  <Text style={[styles.tonBadgeText, { color: Colors.blue }, !isTonConnected && styles.tonBadgeTextInactive]}>
                    {isTonConnected ? "SIGN" : "OFF"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

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
                  trackColor={{ false: colors.bgTertiary, true: `${Colors.gold}50` }}
                  thumbColor={notificationsEnabled ? Colors.gold : colors.textMuted}
                />
              }
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon={Moon}
              title="Dark Mode"
              subtitle="Toggle light / dark theme"
              color={Colors.purple}
              onPress={handleDarkModeToggle}
              rightElement={
                <View pointerEvents="none">
                  <Switch
                    value={isDark}
                    trackColor={{ false: colors.bgTertiary, true: `${Colors.gold}50` }}
                    thumbColor={isDark ? Colors.gold : colors.textMuted}
                  />
                </View>
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
          <Text style={styles.appVersion}>Tonic AI v1.0.0</Text>
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

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
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
    backgroundColor: colors.bgSecondary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
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
    borderColor: colors.bgPrimary,
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
    borderColor: colors.bgSecondary,
  },
  levelBadgeAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.bgPrimary,
  },
  walletBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bgPrimary,
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
    color: colors.textPrimary,
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
    backgroundColor: colors.bgTertiary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  guestText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textMuted,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bgTertiary,
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
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  achievementsButton: {
    backgroundColor: colors.bgSecondary,
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
    color: colors.textPrimary,
    marginBottom: 4,
  },
  achievementsButtonSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
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
    color: colors.bgPrimary,
  },
  progressIndicator: {
    height: 4,
    backgroundColor: colors.bgTertiary,
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
    color: colors.textPrimary,
    marginBottom: 12,
  },
  dangerTitle: {
    color: Colors.danger,
  },
  menuCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.bgSecondary,
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
    color: colors.textPrimary,
    marginBottom: 2,
  },
  menuTitleDanger: {
    color: Colors.danger,
  },
  menuSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
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
    color: colors.textSecondary,
    marginBottom: 4,
  },
  appBuild: {
    fontSize: 12,
    color: colors.textMuted,
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
    backgroundColor: colors.bgSecondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.bgTertiary,
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
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: "center",
  },
  achievementCardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
    textAlign: "center",
  },
  progressBar: {
    width: "100%",
    height: 6,
    backgroundColor: colors.bgTertiary,
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
    color: colors.textMuted,
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
    color: colors.bgPrimary,
  },
  tonRecordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  tonRecordLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  tonBadge: {
    backgroundColor: `${Colors.gold}20`,
    borderWidth: 1,
    borderColor: `${Colors.gold}60`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tonBadgeInactive: {
    backgroundColor: `${colors.textMuted}15`,
    borderColor: `${colors.textMuted}40`,
  },
  tonBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  tonBadgeTextInactive: {
    color: colors.textMuted,
  },
  txHashContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  txHashText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: "monospace",
    flex: 1,
  },
  claimCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 12,
  },
  claimCardActive: {
    borderColor: `${Colors.gold}60`,
    backgroundColor: `${Colors.gold}06`,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  claimCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  claimLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  claimEmoji: {
    fontSize: 30,
  },
  claimTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  claimSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  claimBadge: {
    backgroundColor: `${Colors.gold}20`,
    borderWidth: 1,
    borderColor: `${Colors.gold}60`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  claimBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  claimPointsRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  claimPointsNumber: {
    fontSize: 36,
    fontWeight: "800",
    color: Colors.gold,
  },
  claimPointsLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  txHashRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  claimChainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: `${Colors.gold}08`,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${Colors.gold}30`,
  },
  claimChainEmoji: {
    fontSize: 22,
  },
  claimChainTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  claimChainSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  claimChainBadge: {
    backgroundColor: Colors.gold,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  claimChainBadgeText: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.bgPrimary,
    letterSpacing: 0.5,
  },
});
