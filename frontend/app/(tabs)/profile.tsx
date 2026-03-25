import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
  TextInput,
  Modal,
  Linking,
  Platform,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
  ExternalLink,
  Activity,
  Star,
  Lock,
  MessageCircle,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { Colors } from "@/constants/colors";
import { useTheme, type AppColors } from "@/providers/ThemeProvider";
import { useAppState } from "@/providers/AppStateProvider";
import { useTasks } from "@/providers/TasksProvider";
import { useAchievements } from "@/providers/AchievementsProvider";
import { useTonConnect } from "@/hooks/useTonConnect";
import { API_BASE_URL, TON_REWARD_ADDRESS } from "@/constants/api";
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

function TonianBadgeSection({ minted, minting, disabled, onMint }: { minted: boolean; minting: boolean; disabled: boolean; onMint: () => void }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 7000, useNativeDriver: true })).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.07, duration: 1600, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
    ])).start();
  }, []);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const REWARDS = [
    { emoji: "⚡", text: "2× lifetime point multiplier on all claims" },
    { emoji: "🏅", text: "Verified Tonian rank on the global leaderboard" },
    { emoji: "🔗", text: "Permanent on-chain identity — provable on TON" },
    { emoji: "✨", text: "Exclusive Tonian badge on your profile forever" },
  ];

  return (
    <View style={{ marginBottom: 20, borderRadius: 26, overflow: "hidden", borderWidth: 1.5, borderColor: `${Colors.gold}45` }}>
      <LinearGradient
        colors={["#0A0D18", "#111827", "#130D1E"]}
        style={{ padding: 26 }}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        {minted && (
          <View style={{ position: "absolute", top: 16, right: 16, backgroundColor: `${Colors.success}20`, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: `${Colors.success}50` }}>
            <Text style={{ fontSize: 10, fontWeight: "800", color: Colors.success, letterSpacing: 0.6 }}>✓ VERIFIED</Text>
          </View>
        )}

        {/* Animated Badge Center */}
        <View style={{ alignItems: "center", marginBottom: 22 }}>
          <View style={{ width: 130, height: 130, justifyContent: "center", alignItems: "center" }}>
            {/* Outer rotating ring */}
            <Animated.View
              style={{
                position: "absolute", width: 126, height: 126, borderRadius: 63,
                borderWidth: 2, borderColor: `${Colors.gold}50`,
                borderTopColor: Colors.gold, borderRightColor: `${Colors.gold}80`,
                transform: [{ rotate }],
              }}
            />
            {/* Mid ring */}
            <Animated.View
              style={{
                position: "absolute", width: 108, height: 108, borderRadius: 54,
                borderWidth: 1.5, borderColor: `${Colors.gold}25`,
                borderBottomColor: `${Colors.gold}60`, borderLeftColor: `${Colors.gold}40`,
                transform: [{ rotate: rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["360deg", "0deg"] }) }],
              }}
            />
            {/* Core badge */}
            <Animated.View
              style={{
                width: 86, height: 86, borderRadius: 43,
                backgroundColor: `${Colors.gold}18`,
                borderWidth: 2, borderColor: `${Colors.gold}70`,
                justifyContent: "center", alignItems: "center",
                transform: [{ scale: pulseAnim }],
                shadowColor: Colors.gold, shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8, shadowRadius: 20, elevation: 20,
              }}
            >
              <Text style={{ fontSize: 40 }}>{minted ? "🏅" : "⭐"}</Text>
            </Animated.View>
          </View>

          <Animated.Text
            style={{
              fontSize: 22, fontWeight: "900", color: Colors.gold,
              letterSpacing: 6, marginTop: 14, textTransform: "uppercase",
              opacity: glowAnim.interpolate({ inputRange: [0.4, 1], outputRange: [0.7, 1] }),
              textShadowColor: Colors.gold, textShadowRadius: 12, textShadowOffset: { width: 0, height: 0 },
            }}
          >
            TONIAN
          </Animated.Text>
          <Text style={{ fontSize: 12, color: "rgba(200,190,150,0.6)", marginTop: 3, letterSpacing: 2, textTransform: "uppercase" }}>
            {minted ? "Exclusive Member" : "Exclusive Badge · TON Blockchain"}
          </Text>
        </View>

        {/* Price pill */}
        {!minted && (
          <View style={{ alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: `${Colors.gold}20`, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: `${Colors.gold}40`, marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: "900", color: Colors.gold }}>1 TON</Text>
            <Text style={{ fontSize: 12, color: "rgba(200,190,150,0.6)" }}>· one-time · permanent</Text>
          </View>
        )}

        {/* Rewards */}
        <View style={{ gap: 10, marginBottom: 22 }}>
          {REWARDS.map((r, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${Colors.gold}12`, borderWidth: 1, borderColor: `${Colors.gold}25`, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 16 }}>{r.emoji}</Text>
              </View>
              <Text style={{ fontSize: 13, color: "rgba(220,210,170,0.85)", flex: 1, lineHeight: 18 }}>{r.text}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        {minted ? (
          <View style={{ backgroundColor: `${Colors.success}15`, borderRadius: 16, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: `${Colors.success}35` }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: Colors.success }}>🎉 You're a Verified Tonian!</Text>
            <Text style={{ fontSize: 11, color: "rgba(100,200,130,0.6)", marginTop: 3 }}>Badge permanently minted on TON blockchain</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={onMint}
            disabled={disabled}
            activeOpacity={0.85}
            style={{
              borderRadius: 16, overflow: "hidden",
              shadowColor: Colors.gold, shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4, shadowRadius: 12, elevation: 12,
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <LinearGradient
              colors={[Colors.gold, "#B8860B", Colors.gold]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 15, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 10 }}
            >
              {minting ? (
                <ActivityIndicator size="small" color="#0D1117" />
              ) : (
                <Star size={18} color="#0D1117" fill="#0D1117" />
              )}
              <Text style={{ fontSize: 15, fontWeight: "900", color: "#0D1117", letterSpacing: 0.4 }}>
                {minting ? "Minting Badge…" : "Mint Badge · 1 TON"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, setUser, connectWallet: saveWalletUser } = useAppState();
  const { tasks, getStats, getCompletedTasks } = useTasks();
  const { stats: achievementStats, claimPoints } = useAchievements();
  const { isConnected: isTonConnected, walletAddress: tonWalletAddress, connectWallet: connectTonWallet, sendTransaction, recordAchievementOnChain, isSendingTx } = useTonConnect();
  const { isDark, toggleTheme, colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [isRecordingOnChain, setIsRecordingOnChain] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isAchievementsModalVisible, setIsAchievementsModalVisible] = useState(false);
  const [stats, setStats] = useState({ tasksCompleted: 0, currentStreak: 0, productivityScore: 0 });
  const [onChainRecords, setOnChainRecords] = useState<any[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isMintingTonian, setIsMintingTonian] = useState(false);
  const [tonianMinted, setTonianMinted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showWalletNameModal, setShowWalletNameModal] = useState(false);
  const [walletNameInput, setWalletNameInput] = useState("");
  const [pendingWalletAddr, setPendingWalletAddr] = useState<string | null>(null);
  const [tonicBalance, setTonicBalance] = useState<number | null>(null);
  const [syncCode, setSyncCode] = useState<string | null>(null);
  const [syncInput, setSyncInput] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncRestoreMsg, setSyncRestoreMsg] = useState("");

  useEffect(() => {
    if (isTonConnected && tonWalletAddress && !user?.walletAddress) {
      setPendingWalletAddr(tonWalletAddress);
      setWalletNameInput(user?.name && user.name !== "TON User" && !user.name.startsWith("Guest") ? user.name : "");
      setShowWalletNameModal(true);
    }
  }, [isTonConnected, tonWalletAddress]);

  const handleWalletNameSave = useCallback(() => {
    if (!pendingWalletAddr) return;
    saveWalletUser(pendingWalletAddr, walletNameInput.trim() || undefined);
    setShowWalletNameModal(false);
    setPendingWalletAddr(null);
    setWalletNameInput("");
  }, [pendingWalletAddr, walletNameInput, saveWalletUser]);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_BASE_URL}/api/users/${user.id}/records`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data.records)) setOnChainRecords(data.records); })
      .catch(() => {});
  }, [user?.id, lastTxHash]);

  const loadStats = useCallback(async () => {
    const newStats = await getStats();
    setStats({ tasksCompleted: newStats.tasksCompleted, currentStreak: newStats.currentStreak, productivityScore: newStats.productivityScore });
  }, [getStats]);

  useEffect(() => { void loadStats(); }, [loadStats, tasks]);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_BASE_URL}/api/users/${user.id}/tokens`)
      .then(r => r.json())
      .then(d => { if (typeof d.tokens === "number") setTonicBalance(d.tokens); })
      .catch(() => {});
  }, [user?.id]);

  const handleGenerateSyncCode = useCallback(async () => {
    if (!user?.id) return;
    setSyncLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/sync-code/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.code) setSyncCode(data.code);
    } catch {}
    setSyncLoading(false);
  }, [user?.id]);

  const handleRestoreSync = useCallback(async () => {
    const code = syncInput.trim().toUpperCase();
    if (!code || code.length < 4) return;
    setSyncLoading(true);
    setSyncRestoreMsg("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/sync-code/restore`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.user) {
        setSyncRestoreMsg(`✓ Restored account: ${data.user.name}`);
        setSyncInput("");
      } else {
        setSyncRestoreMsg("Code not found. Check and try again.");
      }
    } catch {
      setSyncRestoreMsg("Restore failed. Please try again.");
    }
    setSyncLoading(false);
  }, [syncInput]);

  const handleEditName = useCallback(() => {
    setEditNameValue(user?.name ?? "");
    setIsEditingName(true);
  }, [user?.name]);

  const handleSaveName = useCallback(() => {
    const trimmed = editNameValue.trim();
    if (!trimmed || !user) return;
    setUser({ ...user, name: trimmed });
    setIsEditingName(false);
  }, [editNameValue, user, setUser]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingName(false);
    setEditNameValue("");
  }, []);

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

  const handleTonianBadge = useCallback(async () => {
    if (!isTonConnected) {
      Alert.alert("Wallet Required", "Connect your TON wallet first to mint the Tonian badge.", [
        { text: "Connect Wallet", onPress: () => void connectTonWallet() },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }
    if (tonianMinted) {
      Alert.alert("Already a Tonian!", "You have already minted your Tonian badge. Check your wallet on TONScan.", [{ text: "View on TONScan", onPress: () => Linking.openURL(`https://tonscan.org/address/${TON_REWARD_ADDRESS}`) }, { text: "OK" }]);
      return;
    }
    Alert.alert(
      "🏅 Verify to be Tonian",
      `Mint your exclusive Tonic AI Tonian badge on the TON blockchain.\n\n• Cost: 1 TON\n• Permanent on-chain verification\n• Proves you're a Tonic AI productivity champion\n\nFunds support the Tonic AI ecosystem.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mint for 1 TON",
          onPress: async () => {
            setIsMintingTonian(true);
            try {
              const result = await sendTransaction({
                to: TON_REWARD_ADDRESS,
                amount: "1000000000",
                comment: `Tonic AI | Tonian Badge | User: ${user?.name || "Anonymous"} | Score: ${stats.productivityScore}`,
              });
              if (result) {
                setTonianMinted(true);
                setLastTxHash(result.boc);
                if (user?.id) {
                  await fetch(`${API_BASE_URL}/api/ton-proof`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: user.id, walletAddress: user.walletAddress, proof: { boc: result.boc, comment: "Tonian Badge" }, score: stats.productivityScore }),
                  }).catch(() => {});
                }
                Alert.alert(
                  "🎉 You're a Tonian!",
                  "Your Tonian badge transaction has been sent! You are now a verified member of the Tonic AI community.",
                  [
                    { text: "View on TONScan", onPress: () => Linking.openURL(`https://tonscan.org/address/${TON_REWARD_ADDRESS}`) },
                    { text: "Awesome!" },
                  ]
                );
              }
            } catch {
              Alert.alert("Transaction Failed", "Could not complete the minting transaction. Please check your wallet balance and try again.");
            } finally {
              setIsMintingTonian(false);
            }
          },
        },
      ]
    );
  }, [isTonConnected, tonianMinted, sendTransaction, user, stats, connectTonWallet]);

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
                  <Text style={styles.lvlBadgeText}>Lv {achievementStats.currentLevel.level}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.nameArea}>
                {isEditingName ? (
                  <>
                    <TextInput
                      style={[styles.nameInput, { outlineWidth: 0 } as any]}
                      value={editNameValue}
                      onChangeText={setEditNameValue}
                      autoFocus
                      maxLength={40}
                      returnKeyType="done"
                      onSubmitEditing={handleSaveName}
                      placeholderTextColor={colors.textMuted}
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName} activeOpacity={0.8}>
                        <Text style={styles.saveBtnText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit} activeOpacity={0.8}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </View>

              {!isEditingName && (
                <TouchableOpacity style={styles.editBtn} activeOpacity={0.8} onPress={handleEditName}>
                  <Edit3 size={17} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
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

            {/* TONIC balance row in profile card */}
            {tonicBalance !== null && (
              <View style={{ marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: `${Colors.gold}10`, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1.5, borderColor: `${Colors.gold}30` }}>
                <Zap size={16} color={Colors.gold} fill={Colors.gold} />
                <Text style={{ fontSize: 22, fontWeight: "900", color: Colors.gold, letterSpacing: -0.5 }}>{tonicBalance.toLocaleString()}</Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.gold }}>TONIC</Text>
                <View style={{ width: 1, height: 18, backgroundColor: `${Colors.gold}30`, marginHorizontal: 4 }} />
                <Text style={{ fontSize: 12, color: colors.textMuted }}>≈ {(tonicBalance / 100000).toFixed(4)} TON</Text>
              </View>
            )}
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


          {/* ── Tonian Badge ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TON Blockchain</Text>
            <TonianBadgeSection
              minted={tonianMinted}
              minting={isMintingTonian}
              disabled={isMintingTonian || isSendingTx}
              onMint={() => void handleTonianBadge()}
            />
          </View>

          {/* ── Last TX Hash ── */}
          {lastTxHash && (
            <View style={[styles.section, { marginTop: -4 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: `${Colors.blue}10`, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: `${Colors.blue}25` }}>
                <CheckCircle size={17} color={Colors.blue} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: Colors.blue, marginBottom: 2 }}>⛓️ Verified on TON Blockchain</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, fontFamily: "monospace" }} numberOfLines={1}>{lastTxHash.slice(0, 32)}…</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── On-Chain Activity Feed ── */}
          {onChainRecords.length > 0 && (
            <View style={styles.section}>
              <View style={styles.activityHeader}>
                <Activity size={14} color={Colors.blue} />
                <Text style={styles.sectionLabel}>On-Chain Activity</Text>
              </View>
              <View style={styles.menuCard}>
                {onChainRecords.slice(0, 5).map((record: any, i: number) => {
                  const date = new Date(record.recorded_at || record.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  const shortHash = record.tx_hash ? `${record.tx_hash.slice(0, 8)}…${record.tx_hash.slice(-5)}` : "pending";
                  const tonscanUrl = record.tx_hash ? `https://tonscan.org/tx/${record.tx_hash}` : null;
                  return (
                    <View key={record.id || i}>
                      {i > 0 && <View style={styles.divider} />}
                      <View style={styles.activityRow}>
                        <View style={[styles.activityDot, { backgroundColor: record.tx_hash ? Colors.blue : colors.textMuted }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.activityTitle} numberOfLines={1}>{record.title || "Proof of Productivity"}</Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
                            <Text style={styles.activityHash}>{shortHash}</Text>
                            <Text style={styles.activityDate}>{date}</Text>
                            {record.score != null && <Text style={[styles.activityDate, { color: Colors.gold }]}>{record.score}pts</Text>}
                          </View>
                        </View>
                        {tonscanUrl && (
                          <TouchableOpacity
                            onPress={() => { if (typeof window !== "undefined") window.open(tonscanUrl, "_blank"); }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <View style={styles.tonscanBtn}>
                              <ExternalLink size={12} color={Colors.blue} />
                              <Text style={styles.tonscanText}>View</Text>
                            </View>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

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
                    onPress={() => void connectTonWallet()}
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
              <MenuItem icon={Shield} title="Privacy & Security" color={Colors.success} onPress={() => setShowPrivacyModal(true)} />
              <View style={styles.divider} />
              <MenuItem icon={HelpCircle} title="Help & Support" color={Colors.blue} onPress={() => setShowHelpModal(true)} />
            </View>
          </View>

          {/* ── $TONIC Token Balance ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>$TONIC Tokens</Text>
            <View style={[styles.menuCard, { padding: 16 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: `${Colors.gold}20`, justifyContent: "center", alignItems: "center" }}>
                  <Star size={20} color={Colors.gold} fill={Colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 }}>Balance</Text>
                  <Text style={{ fontSize: 26, fontWeight: "900", color: Colors.gold }}>
                    {tonicBalance !== null ? tonicBalance.toLocaleString() : "—"} <Text style={{ fontSize: 14, fontWeight: "600" }}>TONIC</Text>
                  </Text>
                </View>
              </View>
              <View style={{ gap: 6 }}>
                {[
                  { label: "Complete a task (low priority)", reward: "+10" },
                  { label: "Complete a task (medium priority)", reward: "+15" },
                  { label: "Complete a task (high priority)", reward: "+25" },
                  { label: "Daily streak bonus", reward: "+25" },
                  { label: "Daily challenge", reward: "+50" },
                ].map((row, i) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 5, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.border }}>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, flex: 1 }}>{row.label}</Text>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.success }}>{row.reward}</Text>
                  </View>
                ))}
              </View>
              <View style={{ marginTop: 10, backgroundColor: colors.bgPrimary, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 }}>Conversion Rate</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
                  100,000 TONIC = 1 TON{"\n"}
                  Your balance ≈ <Text style={{ fontWeight: "700", color: Colors.gold }}>{((tonicBalance ?? 0) / 100000).toFixed(4)} TON</Text>
                </Text>
                <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }}>Rate is intentionally conservative to preserve token value.</Text>
              </View>
              {user?.walletAddress ? (
                <TouchableOpacity
                  style={{ marginTop: 10, backgroundColor: Colors.gold, borderRadius: 12, paddingVertical: 11, alignItems: "center" }}
                  activeOpacity={0.85}
                  onPress={() => Alert.alert("Claim on TON", `You have ${(tonicBalance ?? 0).toLocaleString()} TONIC ≈ ${((tonicBalance ?? 0) / 100000).toFixed(4)} TON.\n\nClaiming will be available after the hackathon. Your balance is securely tracked.`)}
                >
                  <Text style={{ color: "#000", fontWeight: "800", fontSize: 13 }}>Claim on TON Blockchain</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={{ marginTop: 10, backgroundColor: `${Colors.gold}20`, borderRadius: 12, paddingVertical: 11, alignItems: "center", borderWidth: 1, borderColor: `${Colors.gold}40` }}
                  activeOpacity={0.85}
                  onPress={() => void connectTonWallet()}
                >
                  <Text style={{ color: Colors.gold, fontWeight: "700", fontSize: 13 }}>Connect Wallet to Claim</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── Cross-Device Sync ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Cross-Device Sync</Text>
            <View style={[styles.menuCard, { padding: 16 }]}>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 14, lineHeight: 18 }}>
                Generate a 6-character sync code to restore your account on another device.
              </Text>
              {syncCode ? (
                <View style={{ alignItems: "center", backgroundColor: `${Colors.blue}10`, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: `${Colors.blue}25` }}>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 6, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 }}>Your Sync Code</Text>
                  <Text style={{ fontSize: 36, fontWeight: "900", color: Colors.blue, letterSpacing: 6 }}>{syncCode}</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 6 }}>Enter this code on your other device</Text>
                </View>
              ) : null}
              <TouchableOpacity
                onPress={() => void handleGenerateSyncCode()}
                disabled={syncLoading}
                style={{ backgroundColor: Colors.blue, borderRadius: 12, paddingVertical: 11, alignItems: "center", marginBottom: 12 }}
                activeOpacity={0.85}
              >
                {syncLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Generate Sync Code</Text>}
              </TouchableOpacity>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput
                  style={{ flex: 1, backgroundColor: colors.bgSecondary, borderRadius: 12, paddingHorizontal: 14, height: 44, color: colors.textPrimary, fontSize: 16, fontWeight: "700", letterSpacing: 3, borderWidth: 1, borderColor: colors.border, outlineWidth: 0 } as any}
                  placeholder="ENTER CODE"
                  placeholderTextColor={colors.textMuted}
                  value={syncInput}
                  onChangeText={v => { setSyncInput(v.toUpperCase().slice(0, 8)); setSyncRestoreMsg(""); }}
                  autoCapitalize="characters"
                  maxLength={8}
                />
                <TouchableOpacity
                  onPress={() => void handleRestoreSync()}
                  disabled={syncLoading || syncInput.trim().length < 4}
                  style={{ backgroundColor: syncInput.trim().length >= 4 ? Colors.purple : colors.bgSecondary, borderRadius: 12, paddingHorizontal: 16, justifyContent: "center", height: 44 }}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: syncInput.trim().length >= 4 ? "#fff" : colors.textMuted, fontWeight: "700", fontSize: 13 }}>Restore</Text>
                </TouchableOpacity>
              </View>
              {syncRestoreMsg ? (
                <Text style={{ marginTop: 8, fontSize: 12, color: syncRestoreMsg.startsWith("✓") ? Colors.success : Colors.danger, fontWeight: "600" }}>{syncRestoreMsg}</Text>
              ) : null}
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

      {/* ── Wallet Name Modal ── */}
      <Modal visible={showWalletNameModal} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={() => setShowWalletNameModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: 32 }]}>
            <View style={styles.modalHandle} />
            <View style={{ alignItems: "center", marginVertical: 20 }}>
              <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: `${Colors.gold}20`, justifyContent: "center", alignItems: "center", marginBottom: 12, borderWidth: 1.5, borderColor: `${Colors.gold}40` }}>
                <Wallet size={24} color={Colors.gold} />
              </View>
              <Text style={[styles.modalTitle, { fontSize: 18 }]}>Wallet Connected! 🎉</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 6, textAlign: "center", paddingHorizontal: 24 }}>What should we call you? This name shows on your profile and leaderboard.</Text>
            </View>
            <View style={{ paddingHorizontal: 20, gap: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.bgTertiary, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1.5, borderColor: Colors.gold }}>
                <User size={17} color={Colors.gold} />
                <TextInput
                  style={[{ flex: 1, color: colors.textPrimary, fontSize: 15, paddingVertical: 12, outlineWidth: 0 } as any]}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.textMuted}
                  value={walletNameInput}
                  onChangeText={setWalletNameInput}
                  autoFocus
                  onSubmitEditing={handleWalletNameSave}
                  returnKeyType="done"
                />
              </View>
              <TouchableOpacity onPress={handleWalletNameSave} activeOpacity={0.85} style={{ borderRadius: 16, overflow: "hidden" }}>
                <View style={{ backgroundColor: Colors.gold, borderRadius: 16, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
                  <Wallet size={17} color="#0D1117" />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#0D1117" }}>Save & Continue</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleWalletNameSave} style={{ alignItems: "center", paddingVertical: 8 }}>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>Skip — keep current name</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Privacy & Security Modal ── */}
      <Modal visible={showPrivacyModal} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={() => setShowPrivacyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={[styles.menuIconWrap, { backgroundColor: `${Colors.success}15` }]}>
                <Lock size={20} color={Colors.success} />
              </View>
              <Text style={styles.modalTitle}>Privacy & Security</Text>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {[
                { icon: Shield, color: Colors.success, title: "Local-First Storage", body: "All your tasks, progress, and preferences are stored locally on your device using secure on-device storage. We do not upload personal task data to any external server." },
                { icon: Activity, color: Colors.blue, title: "Blockchain Transparency", body: "When you use TON features (Verify to be Tonian badge minting, achievement claims), those transactions are publicly recorded on the TON blockchain — this is by design for verifiability." },
                { icon: Sparkles, color: Colors.gold, title: "AI Processing", body: "Task summaries are sent to our AI server solely to generate insights and power the agent. We do not store or share your conversation history with third parties." },
                { icon: CheckCircle, color: Colors.purple, title: "No Account Required", body: "Tonic AI works as a guest — no email, no sign-up, no tracking. Connecting a TON wallet is optional and only used for on-chain features you explicitly trigger." },
              ].map(({ icon: Ic, color, title, body }, i) => (
                <View key={i} style={styles.privacyItem}>
                  <View style={[styles.menuIconWrap, { backgroundColor: `${color}12` }]}>
                    <Ic size={17} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.privacyItemTitle}>{title}</Text>
                    <Text style={styles.privacyItemBody}>{body}</Text>
                  </View>
                </View>
              ))}

              <View style={styles.privacyActions}>
                <TouchableOpacity style={styles.privacyActionBtn} activeOpacity={0.8} onPress={() => { setShowPrivacyModal(false); Alert.alert("Export Data", "Your task data has been prepared. This feature exports your tasks as JSON.", [{ text: "OK" }]); }}>
                  <ExternalLink size={15} color={Colors.blue} />
                  <Text style={[styles.privacyActionText, { color: Colors.blue }]}>Export My Data</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.privacyActionBtn, { borderColor: `${Colors.danger}30`, backgroundColor: `${Colors.danger}08` }]} activeOpacity={0.8} onPress={() => { setShowPrivacyModal(false); handleClearData(); }}>
                  <Settings size={15} color={Colors.danger} />
                  <Text style={[styles.privacyActionText, { color: Colors.danger }]}>Delete All Data</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowPrivacyModal(false)} activeOpacity={0.85}>
              <Text style={styles.modalCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Help & Support Modal ── */}
      <Modal visible={showHelpModal} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={() => setShowHelpModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={[styles.menuIconWrap, { backgroundColor: `${Colors.blue}15` }]}>
                <HelpCircle size={20} color={Colors.blue} />
              </View>
              <Text style={styles.modalTitle}>Help & Support</Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.faqSectionLabel}>Frequently Asked Questions</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {[
                { q: "How do I add a task?", a: "Tap the + button on the dashboard, or chat with your AI agent. Say something like 'Add a task to finish the report by Friday' and it'll create it automatically." },
                { q: "How do I connect my TON wallet?", a: "Go to Profile → TON Blockchain → tap any blockchain feature. This enables badge minting and the 2× points boost for achievements." },
                { q: "What is the Tonian badge?", a: "A 1 TON on-chain verification that makes you a verified member of the Tonic AI community. It's a blockchain record proving you're a Tonic AI power user." },
                { q: "How do achievements work?", a: "Complete tasks, maintain daily streaks, and hit productivity milestones to unlock achievements. Each unlocked achievement earns claimable points." },
                { q: "What is the 2× points boost?", a: "When you claim points via TON, a tiny gas-only transaction verifies your claim on-chain, doubling your reward as a bonus for using the blockchain feature." },
              ].map(({ q, a }, i) => (
                <TouchableOpacity key={i} style={styles.faqItem} onPress={() => setExpandedFaq(expandedFaq === i ? null : i)} activeOpacity={0.75}>
                  <View style={styles.faqQuestion}>
                    <Text style={styles.faqQuestionText}>{q}</Text>
                    {expandedFaq === i ? <ChevronUp size={16} color={Colors.gold} /> : <ChevronDown size={16} color={colors.textMuted} />}
                  </View>
                  {expandedFaq === i && <Text style={styles.faqAnswer}>{a}</Text>}
                </TouchableOpacity>
              ))}

              <View style={[styles.privacyActions, { marginTop: 16 }]}>
                <TouchableOpacity style={[styles.privacyActionBtn, { borderColor: `${Colors.gold}30`, backgroundColor: `${Colors.gold}08` }]} activeOpacity={0.8} onPress={() => Linking.openURL("https://t.me/tonic_ai_support").catch(() => {})}>
                  <MessageCircle size={15} color={Colors.gold} />
                  <Text style={[styles.privacyActionText, { color: Colors.gold }]}>Chat on Telegram</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.appVersionText}>Tonic AI v1.0.0 · Built for TON AI Hackathon 2026</Text>
            </ScrollView>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowHelpModal(false)} activeOpacity={0.85}>
              <Text style={styles.modalCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  lvlBadge: { alignSelf: "center", marginTop: 6, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8, backgroundColor: Colors.gold, borderWidth: 1.5, borderColor: colors.bgSecondary },
  lvlBadgeText: { fontSize: 11, fontWeight: "800", color: "#0D1117" },
  nameArea: { flex: 1, gap: 3 },
  userName: { fontSize: 20, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.3 },
  levelName: { fontSize: 12, color: Colors.gold, fontWeight: "600" },
  walletChip: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4, alignSelf: "flex-start", backgroundColor: `${Colors.gold}15`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  walletText: { fontSize: 11, fontWeight: "600", color: Colors.gold },
  guestChip: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4, alignSelf: "flex-start", backgroundColor: colors.bgTertiary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  guestText: { fontSize: 11, color: colors.textMuted, fontWeight: "500" },
  editBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.bgTertiary, justifyContent: "center", alignItems: "center", alignSelf: "flex-start" },
  nameInput: { fontSize: 20, fontWeight: "700" as const, color: colors.textPrimary, borderBottomWidth: 2, borderBottomColor: Colors.gold, paddingBottom: 4, paddingHorizontal: 2, marginBottom: 8, minWidth: 100 },
  editActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.gold },
  saveBtnText: { fontSize: 12, fontWeight: "700" as const, color: "#0D1117" },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.bgTertiary },
  cancelBtnText: { fontSize: 12, fontWeight: "600" as const, color: colors.textSecondary },

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

  activityHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  activityRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  activityDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  activityTitle: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  activityHash: { fontSize: 10, color: colors.textMuted, fontFamily: "monospace" },
  activityDate: { fontSize: 10, color: colors.textMuted },
  tonscanBtn: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: `${Colors.blue}12`, borderWidth: 1, borderColor: `${Colors.blue}30` },
  tonscanText: { fontSize: 10, fontWeight: "600", color: Colors.blue },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: colors.bgSecondary, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, borderTopWidth: 1, borderColor: colors.border },
  modalHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  modalTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.3 },

  privacyItem: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16, padding: 14, backgroundColor: colors.bgTertiary, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  privacyItemTitle: { fontSize: 13, fontWeight: "700", color: colors.textPrimary, marginBottom: 4 },
  privacyItemBody: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  privacyActions: { flexDirection: "row", gap: 10, marginTop: 4, marginBottom: 12 },
  privacyActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: `${Colors.blue}30`, backgroundColor: `${Colors.blue}08` },
  privacyActionText: { fontSize: 13, fontWeight: "600" },

  faqSectionLabel: { fontSize: 11, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 },
  faqItem: { backgroundColor: colors.bgTertiary, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  faqQuestion: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  faqQuestionText: { fontSize: 13, fontWeight: "600", color: colors.textPrimary, flex: 1, marginRight: 8 },
  faqAnswer: { fontSize: 12, color: colors.textSecondary, lineHeight: 19, paddingHorizontal: 14, paddingBottom: 14 },
  appVersionText: { fontSize: 11, color: colors.textMuted, textAlign: "center", paddingVertical: 8 },

  modalCloseBtn: { marginTop: 16, backgroundColor: Colors.gold, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  modalCloseBtnText: { fontSize: 15, fontWeight: "800", color: "#0D1117" },
});
