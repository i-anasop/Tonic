import { useState, useCallback, useEffect, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Trophy,
  Wallet,
  Shield,
  Bell,
  Moon,
  LogOut,
  Settings,
  HelpCircle,
  User,
  Camera,
  Target,
  Flame,
  Sparkles,
  ChevronRight,
  Edit3,
  Zap,
  CheckCircle,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { Colors } from "@/constants/colors";
import { useTheme, type AppColors } from "@/providers/ThemeProvider";
import { useAppState } from "@/providers/AppStateProvider";
import { useTasks } from "@/providers/TasksProvider";
import { useAchievements } from "@/providers/AchievementsProvider";
import { useTonConnect } from "@/hooks/useTonConnect";
import { API_BASE_URL } from "@/constants/api";
import { AchievementsModal } from "@/components/AchievementsModal";

function StatItem({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 3 }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${color}15`, justifyContent: "center", alignItems: "center", marginBottom: 2 }}>
        <Icon size={16} color={color} />
      </View>
      <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 }}>{value}</Text>
      <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: "500" }}>{label}</Text>
    </View>
  );
}

function MenuItem({
  icon: Icon,
  title,
  subtitle,
  onPress,
  rightElement,
  danger = false,
  color,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
  color?: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <View style={[styles.menuIconWrap, { backgroundColor: danger ? `${Colors.danger}12` : `${color || colors.textSecondary}12` }]}>
        <Icon size={18} color={danger ? Colors.danger : color || colors.textSecondary} />
      </View>
      <View style={styles.menuBody}>
        <Text style={[styles.menuTitle, danger && { color: Colors.danger }]}>{title}</Text>
        {subtitle && <Text style={styles.menuSub}>{subtitle}</Text>}
      </View>
      {rightElement || <ChevronRight size={17} color={colors.textMuted} />}
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
  const [stats, setStats] = useState({ tasksCompleted: 0, currentStreak: 0, productivityScore: 0 });

  const loadStats = useCallback(async () => {
    const newStats = await getStats();
    setStats({ tasksCompleted: newStats.tasksCompleted, currentStreak: newStats.currentStreak, productivityScore: newStats.productivityScore });
  }, [getStats]);

  useEffect(() => { void loadStats(); }, [loadStats, tasks]);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out? Your data will be preserved.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => { signOut(); router.replace("/onboarding"); } },
    ]);
  };

  const handleDarkModeToggle = useCallback(() => { void toggleTheme(); }, [toggleTheme]);

  const handleClearData = () => {
    Alert.alert("Clear All Data", "This will permanently delete all your tasks and progress. This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear Data", style: "destructive", onPress: () => { signOut(); router.replace("/onboarding"); } },
    ]);
  };

  const handlePickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        if (user) { setUser({ ...user, profilePictureUri: imageUri }); Alert.alert("Updated", "Profile picture saved!"); }
      }
    } catch { Alert.alert("Error", "Failed to pick image"); }
  }, [user, setUser]);

  const handleProofOfProductivity = useCallback(async () => {
    if (!isTonConnected) {
      Alert.alert("Wallet Required", "Connect your TON wallet to sign your productivity score on-chain.", [{ text: "OK" }]);
      return;
    }
    Alert.alert(
      "Proof of Productivity",
      `Sign your score (${stats.productivityScore} pts, ${stats.tasksCompleted} tasks) onto the TON blockchain.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign On-Chain",
          onPress: async () => {
            setIsRecordingOnChain(true);
            try {
              const comment = `Tonic AI | Proof of Productivity | Score: ${stats.productivityScore} | Tasks: ${stats.tasksCompleted} | Streak: ${stats.currentStreak}d`;
              const result = await recordAchievementOnChain({ title: `Productivity Score: ${stats.productivityScore}`, tasksCompleted: stats.tasksCompleted, streak: stats.currentStreak });
              if (result && user?.id) {
                await fetch(`${API_BASE_URL}/api/ton-proof`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, walletAddress: user.walletAddress, proof: { boc: result.boc, comment }, score: stats.productivityScore }) }).catch(() => {});
                setLastTxHash(result.boc);
                Alert.alert("Identity Verified!", `Your score of ${stats.productivityScore} pts is now permanently recorded on TON blockchain.`, [{ text: "Awesome!" }]);
              }
            } catch { Alert.alert("Failed", "Could not sign on-chain. Please try again."); }
            finally { setIsRecordingOnChain(false); }
          },
        },
      ]
    );
  }, [isTonConnected, stats, recordAchievementOnChain, user]);

  const handleClaimPoints = useCallback((forceWallet = false) => {
    const pending = achievementStats.pendingPoints;
    const { level, name: levelName } = achievementStats.currentLevel;
    if (pending <= 0) { Alert.alert("No Pending Points", "Unlock achievements to earn claimable points."); return; }
    if (forceWallet && !isTonConnected) {
      Alert.alert("Wallet Required", "Connect your TON wallet first to claim with the 2× on-chain boost.", [{ text: "OK" }]);
      return;
    }
    if (forceWallet) {
      Alert.alert("Claim via TON (2×)", `You have ${pending} pending pts.\n\n⛓️ Claiming on TON blockchain doubles them to ${pending * 2} pts — permanently verifiable.\n\nOnly gas fee applies.`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Claim 2× on TON",
          onPress: async () => {
            setIsRecordingOnChain(true);
            try {
              const result = await recordAchievementOnChain({ title: `Points Claim: ${pending} pts (2×)`, tasksCompleted: stats.tasksCompleted, streak: stats.currentStreak });
              if (result) {
                setLastTxHash(result.boc);
                await claimPoints(true);
                if (user?.id) await fetch(`${API_BASE_URL}/api/claim-points`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, walletAddress: user.walletAddress, points: pending * 2, level, levelName, tonTxHash: result.boc }) }).catch(() => {});
                Alert.alert("Points Claimed on TON! 🎉", `${pending * 2} pts (2× bonus) recorded on TON blockchain!`, [{ text: "Let's Go!" }]);
              }
            } catch { Alert.alert("Transaction Failed", "Could not claim on-chain. Please try again."); }
            finally { setIsRecordingOnChain(false); }
          },
        },
      ]);
    } else {
      Alert.alert("Claim Points (1×)", `Claim ${pending} pending points.\n\n💡 Tip: Connect a TON wallet to claim with a 2× multiplier!`, [
        { text: "Cancel", style: "cancel" },
        { text: "Claim Now", onPress: async () => { await claimPoints(false); Alert.alert("Points Claimed! 🎉", `${pending} pts added to your score.`, [{ text: "Nice!" }]); } },
      ]);
    }
  }, [isTonConnected, achievementStats, stats, recordAchievementOnChain, claimPoints, user]);

  const completedTasks = getCompletedTasks();
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const formatWalletAddress = (address?: string) => address ? `${address.slice(0, 6)}…${address.slice(-4)}` : undefined;
  const levelProgress = achievementStats.currentLevel.currentPoints / achievementStats.currentLevel.nextLevelPoints;

  if (!user) return null;

  return (
    <>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* ── Header ── */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Profile</Text>
          </View>

          {/* ── Profile Card ── */}
          <View style={styles.profileCard}>
            {/* Avatar row */}
            <View style={styles.avatarRow}>
              <TouchableOpacity style={styles.avatarWrap} onPress={handlePickImage} activeOpacity={0.85}>
                <View style={[styles.avatarRing, { borderColor: `${Colors.gold}50` }]}>
                  {user.profilePictureUri ? (
                    <Image source={{ uri: user.profilePictureUri }} style={styles.avatarImg} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarInitial}>{user.name.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={styles.cameraOverlay}><Camera size={13} color="#fff" /></View>
                </View>
                {/* Level badge on avatar */}
                <View style={styles.lvlBadge}>
                  <Text style={styles.lvlBadgeText}>{achievementStats.currentLevel.level}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.nameArea}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.levelName}>{achievementStats.currentLevel.name}</Text>
                {user.walletAddress ? (
                  <View style={styles.walletChip}>
                    <Wallet size={12} color={Colors.gold} />
                    <Text style={styles.walletText}>{formatWalletAddress(user.walletAddress)}</Text>
                  </View>
                ) : (
                  <View style={styles.guestChip}>
                    <User size={12} color={colors.textMuted} />
                    <Text style={styles.guestText}>Guest</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.editBtn} activeOpacity={0.8}>
                <Edit3 size={17} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Level progress bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Level {achievementStats.currentLevel.level} Progress</Text>
                <Text style={styles.progressPct}>{achievementStats.currentLevel.currentPoints} / {achievementStats.currentLevel.nextLevelPoints} pts</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min(levelProgress * 100, 100)}%` as any }]} />
              </View>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <StatItem icon={Target} value={stats.tasksCompleted} label="Done" color={Colors.success} />
              <View style={styles.statDivider} />
              <StatItem icon={Flame} value={stats.currentStreak} label="Streak" color={Colors.warning} />
              <View style={styles.statDivider} />
              <StatItem icon={Zap} value={completionRate + "%"} label="Rate" color={Colors.blue} />
              <View style={styles.statDivider} />
              <StatItem icon={Sparkles} value={stats.productivityScore} label="Score" color={Colors.purple} />
            </View>
          </View>

          {/* ── Achievements button ── */}
          <TouchableOpacity style={styles.achievCard} onPress={() => setIsAchievementsModalVisible(true)} activeOpacity={0.85}>
            <View style={styles.achievLeft}>
              <View style={styles.achievIcon}>
                <Trophy size={20} color={Colors.gold} />
              </View>
              <View>
                <Text style={styles.achievTitle}>Achievements</Text>
                <Text style={styles.achievSub}>{achievementStats.totalUnlocked} unlocked · {achievementStats.claimedPoints} pts claimed</Text>
              </View>
            </View>
            <View style={styles.achievRight}>
              <View style={styles.lvlCircle}>
                <Text style={styles.lvlCircleText}>{achievementStats.currentLevel.level}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          {/* ── Pending Points Banner ── */}
          {achievementStats.pendingPoints > 0 && (
            <View style={styles.claimCard}>
              <View style={styles.claimLeft}>
                <Text style={styles.claimTitle}>🎁 {achievementStats.pendingPoints} pts ready</Text>
                <Text style={styles.claimSub}>Claim 1× now or connect TON for 2× boost</Text>
              </View>
              <View style={styles.claimBtns}>
                <TouchableOpacity style={styles.claimBtn1x} onPress={() => handleClaimPoints(false)} disabled={isRecordingOnChain || isSendingTx} activeOpacity={0.8}>
                  <Text style={styles.claimBtn1xText}>1×</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.claimBtn2x} onPress={() => handleClaimPoints(true)} disabled={isRecordingOnChain || isSendingTx} activeOpacity={0.8}>
                  {isRecordingOnChain ? <ActivityIndicator size={12} color="#0D1117" /> : <Text style={styles.claimBtn2xText}>2× ⛓️</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── TON Blockchain ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TON Blockchain</Text>
            <View style={styles.menuCard}>
              <TouchableOpacity style={styles.menuItem} onPress={handleProofOfProductivity} activeOpacity={0.75} disabled={isRecordingOnChain || isSendingTx}>
                <View style={[styles.menuIconWrap, { backgroundColor: `${Colors.blue}12` }]}>
                  <Shield size={18} color={Colors.blue} />
                </View>
                <View style={styles.menuBody}>
                  <Text style={styles.menuTitle}>Proof of Productivity</Text>
                  <Text style={styles.menuSub}>{isTonConnected ? `Sign score (${stats.productivityScore}pts) on-chain` : "Connect wallet to verify identity"}</Text>
                </View>
                <View style={[styles.tonBadge, { backgroundColor: isTonConnected ? `${Colors.blue}15` : colors.bgTertiary, borderColor: isTonConnected ? `${Colors.blue}40` : colors.border }]}>
                  <Text style={[styles.tonBadgeText, { color: isTonConnected ? Colors.blue : colors.textMuted }]}>{isTonConnected ? "SIGN" : "OFF"}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Preferences ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Preferences</Text>
            <View style={styles.menuCard}>
              <MenuItem
                icon={Bell} title="Notifications" subtitle="Reminders for upcoming tasks" color={Colors.blue}
                rightElement={<Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: colors.bgTertiary, true: `${Colors.gold}50` }} thumbColor={notificationsEnabled ? Colors.gold : colors.textMuted} />}
              />
              <View style={styles.divider} />
              <MenuItem
                icon={Moon} title="Dark Mode" subtitle="Toggle light / dark theme" color={Colors.purple}
                onPress={handleDarkModeToggle}
                rightElement={<View pointerEvents="none"><Switch value={isDark} trackColor={{ false: colors.bgTertiary, true: `${Colors.gold}50` }} thumbColor={isDark ? Colors.gold : colors.textMuted} /></View>}
              />
            </View>
          </View>

          {/* ── Account ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Account</Text>
            <View style={styles.menuCard}>
              {!user.walletAddress ? (
                <>
                  <MenuItem
                    icon={Wallet} title="Connect TON Wallet" subtitle="Unlock blockchain features & rewards" color={Colors.gold}
                    onPress={() => Alert.alert("Connect TON Wallet", "Connect your TON wallet to unlock exclusive features, earn rewards, and track your productivity on the blockchain!", [{ text: "Later", style: "cancel" }, { text: "Connect Now", onPress: () => router.push("/onboarding") }])}
                  />
                  <View style={styles.divider} />
                </>
              ) : (
                <>
                  <MenuItem
                    icon={Wallet} title="TON Wallet Connected" subtitle={formatWalletAddress(user.walletAddress)} color={Colors.gold}
                    rightElement={<View style={styles.connectedBadge}><CheckCircle size={18} color={Colors.success} /></View>}
                  />
                  <View style={styles.divider} />
                </>
              )}
              <MenuItem icon={Shield} title="Privacy & Security" color={Colors.success} onPress={() => Alert.alert("Privacy", "Privacy settings coming soon!")} />
              <View style={styles.divider} />
              <MenuItem icon={HelpCircle} title="Help & Support" color={Colors.blue} onPress={() => Alert.alert("Help", "Support center coming soon!")} />
            </View>
          </View>

          {/* ── Danger Zone ── */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: Colors.danger }]}>Danger Zone</Text>
            <View style={styles.menuCard}>
              <MenuItem icon={LogOut} title="Sign Out" danger onPress={handleSignOut} />
              <View style={styles.divider} />
              <MenuItem icon={Settings} title="Clear All Data" subtitle="Delete all tasks and progress" danger onPress={handleClearData} />
            </View>
          </View>

          {/* App info */}
          <View style={styles.appInfo}>
            <Text style={styles.appVer}>Tonic AI v1.0.0</Text>
            <Text style={styles.appBuild}>Built for TON & Telegram · Hackathon 2026</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
      <AchievementsModal isVisible={isAchievementsModalVisible} onClose={() => setIsAchievementsModalVisible(false)} />
    </>
  );
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 110 },

  pageHeader: { marginBottom: 16 },
  pageTitle: { fontSize: 26, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 },

  profileCard: {
    backgroundColor: colors.bgSecondary, borderRadius: 24, padding: 20, marginBottom: 14,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4,
  },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  avatarWrap: { position: "relative" },
  avatarRing: { width: 76, height: 76, borderRadius: 38, borderWidth: 2.5, padding: 3 },
  avatarImg: { width: "100%", height: "100%", borderRadius: 35 },
  avatarFallback: { width: "100%", height: "100%", borderRadius: 35, backgroundColor: `${Colors.gold}20`, justifyContent: "center", alignItems: "center" },
  avatarInitial: { fontSize: 26, fontWeight: "800", color: Colors.gold },
  cameraOverlay: { position: "absolute", bottom: 2, right: 2, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.bgPrimary, justifyContent: "center", alignItems: "center", borderWidth: 1.5, borderColor: Colors.gold },
  lvlBadge: { position: "absolute", top: -4, right: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.gold, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: colors.bgSecondary },
  lvlBadgeText: { fontSize: 11, fontWeight: "800", color: "#0D1117" },
  nameArea: { flex: 1, gap: 3 },
  userName: { fontSize: 20, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.3 },
  levelName: { fontSize: 12, color: Colors.gold, fontWeight: "600" },
  walletChip: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4, alignSelf: "flex-start", backgroundColor: `${Colors.gold}15`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  walletText: { fontSize: 11, fontWeight: "600", color: Colors.gold },
  guestChip: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4, alignSelf: "flex-start", backgroundColor: colors.bgTertiary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  guestText: { fontSize: 11, color: colors.textMuted, fontWeight: "500" },
  editBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.bgTertiary, justifyContent: "center", alignItems: "center", alignSelf: "flex-start" },

  progressSection: { marginBottom: 18 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "600", letterSpacing: 0.3 },
  progressPct: { fontSize: 11, color: Colors.gold, fontWeight: "700" },
  progressTrack: { height: 5, backgroundColor: colors.bgTertiary, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: Colors.gold, borderRadius: 3 },

  statsRow: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 },
  statDivider: { width: 1, height: 36, backgroundColor: colors.border, marginHorizontal: 2 },

  achievCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.bgSecondary, borderRadius: 20, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: `${Colors.gold}30`,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  achievLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  achievIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: `${Colors.gold}15`, justifyContent: "center", alignItems: "center" },
  achievTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  achievSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  achievRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  lvlCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gold, justifyContent: "center", alignItems: "center" },
  lvlCircleText: { fontSize: 13, fontWeight: "800", color: "#0D1117" },

  claimCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: `${Colors.gold}10`, borderRadius: 18, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: `${Colors.gold}30`,
  },
  claimLeft: { flex: 1 },
  claimTitle: { fontSize: 14, fontWeight: "700", color: Colors.gold },
  claimSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  claimBtns: { flexDirection: "row", gap: 8 },
  claimBtn1x: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 11, backgroundColor: `${Colors.blue}18`, borderWidth: 1, borderColor: `${Colors.blue}35` },
  claimBtn1xText: { fontSize: 13, fontWeight: "700", color: Colors.blue },
  claimBtn2x: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 11, backgroundColor: Colors.gold },
  claimBtn2xText: { fontSize: 13, fontWeight: "700", color: "#0D1117" },

  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8, paddingLeft: 2 },
  menuCard: { backgroundColor: colors.bgSecondary, borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  menuIconWrap: { width: 36, height: 36, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  menuBody: { flex: 1 },
  menuTitle: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  menuSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 62 },

  tonBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  tonBadgeText: { fontSize: 11, fontWeight: "700" },
  connectedBadge: {},

  appInfo: { alignItems: "center", paddingTop: 8, paddingBottom: 8, gap: 2 },
  appVer: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  appBuild: { fontSize: 11, color: colors.textMuted },
});
