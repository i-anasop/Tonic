import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Linking, Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Star, ExternalLink, CheckCircle, Zap, Shield, Link2 } from "lucide-react-native";
import { useRouter } from "expo-router";

import { Colors } from "@/constants/colors";
import { useTheme, type AppColors } from "@/providers/ThemeProvider";
import { useAppState } from "@/providers/AppStateProvider";
import { useTasks } from "@/providers/TasksProvider";
import { useTonConnect } from "@/hooks/useTonConnect";
import { API_BASE_URL, TON_REWARD_ADDRESS } from "@/constants/api";

const TESTNET_EXPLORER = "https://testnet.tonscan.org";

const REWARDS = [
  { icon: Zap,     label: "2× lifetime point multiplier on all claims" },
  { icon: Shield,  label: "Verified Tonian rank on the global leaderboard" },
  { icon: Link2,   label: "Permanent on-chain identity — provable on TON" },
  { icon: Star,    label: "Free Deep Strategy Sessions — premium AI analysis, forever" },
  { icon: Star,    label: "Exclusive Tonian badge on your profile forever" },
];

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0A0D18" },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 48 },
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 20, paddingVertical: 16,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 13,
      backgroundColor: `${colors.bgSecondary}CC`,
      justifyContent: "center", alignItems: "center",
    },
    headerTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary },
    heroWrap: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 },
    badgeRing: {
      width: 200, height: 200, justifyContent: "center", alignItems: "center", marginBottom: 20,
    },
    badgeName: {
      fontSize: 28, fontWeight: "900", color: Colors.gold,
      letterSpacing: 8, textTransform: "uppercase",
      textShadowColor: Colors.gold, textShadowRadius: 16, textShadowOffset: { width: 0, height: 0 },
    },
    badgeSub: {
      fontSize: 12, color: "rgba(200,190,150,0.55)", marginTop: 4,
      letterSpacing: 3, textTransform: "uppercase",
    },
    pricePill: {
      flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor: `${Colors.gold}18`, borderRadius: 24,
      paddingHorizontal: 22, paddingVertical: 9,
      borderWidth: 1, borderColor: `${Colors.gold}40`, marginTop: 18,
    },
    priceTon: { fontSize: 16, fontWeight: "900", color: Colors.gold },
    priceSub: { fontSize: 12, color: "rgba(200,190,150,0.55)" },
    verifiedPill: {
      flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor: `${Colors.success}15`, borderRadius: 24,
      paddingHorizontal: 22, paddingVertical: 9,
      borderWidth: 1, borderColor: `${Colors.success}40`, marginTop: 18,
    },
    verifiedText: { fontSize: 13, fontWeight: "800", color: Colors.success },
    section: { paddingHorizontal: 20, marginBottom: 16 },
    card: {
      borderRadius: 22, borderWidth: 1.5, borderColor: `${Colors.gold}30`,
      overflow: "hidden",
    },
    cardInner: { padding: 20 },
    cardTitle: {
      fontSize: 11, fontWeight: "700", color: colors.textMuted,
      textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 16,
    },
    rewardRow: {
      flexDirection: "row", alignItems: "center", gap: 14,
      paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: `${Colors.gold}15`,
    },
    rewardIcon: {
      width: 38, height: 38, borderRadius: 11,
      backgroundColor: `${Colors.gold}12`, borderWidth: 1, borderColor: `${Colors.gold}25`,
      justifyContent: "center", alignItems: "center",
    },
    rewardText: { fontSize: 13, color: "rgba(220,210,170,0.85)", flex: 1, lineHeight: 19 },
    mintWrap: {
      marginHorizontal: 20, borderRadius: 20, overflow: "hidden",
      shadowColor: Colors.gold, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4, shadowRadius: 16, elevation: 14,
    },
    mintGrad: {
      paddingVertical: 18, flexDirection: "row",
      justifyContent: "center", alignItems: "center", gap: 10,
    },
    mintText: { fontSize: 16, fontWeight: "900", color: "#0D1117", letterSpacing: 0.4 },
    verifiedCta: {
      marginHorizontal: 20, borderRadius: 20, paddingVertical: 16,
      backgroundColor: `${Colors.success}12`, borderWidth: 1, borderColor: `${Colors.success}30`,
      alignItems: "center",
    },
    verifiedCtaTitle: { fontSize: 15, fontWeight: "800", color: Colors.success },
    verifiedCtaSub: { fontSize: 12, color: "rgba(100,200,130,0.55)", marginTop: 3 },
    tonscanBtn: {
      flexDirection: "row", alignItems: "center", gap: 6,
      marginHorizontal: 20, marginTop: 14,
      justifyContent: "center", paddingVertical: 11,
      borderRadius: 14, backgroundColor: `${Colors.blue}10`,
      borderWidth: 1, borderColor: `${Colors.blue}25`,
    },
    tonscanText: { fontSize: 12, fontWeight: "700", color: Colors.blue },
    txCard: {
      marginHorizontal: 20, marginTop: 14, flexDirection: "row", alignItems: "center", gap: 10,
      backgroundColor: `${Colors.blue}10`, borderRadius: 16, padding: 14,
      borderWidth: 1, borderColor: `${Colors.blue}25`,
    },
    txLabel: { fontSize: 11, fontWeight: "700", color: Colors.blue, marginBottom: 2 },
    txHash: { fontSize: 11, color: colors.textMuted, fontFamily: "monospace" },
  });
}

export default function TonianBadgeScreen() {
  const router = useRouter();
  const { user } = useAppState();
  const { getStats } = useTasks();
  const { isConnected: isTonConnected, connectWallet, sendTransaction, isSendingTx } = useTonConnect();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [minted, setMinted] = useState(false);
  const [minting, setMinting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [stats, setStats] = useState({ productivityScore: 0, tasksCompleted: 0 });

  // Check backend on mount to restore minted state after navigation
  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_BASE_URL}/api/users/${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.verifiedAt || data?.ton_proof) {
          setMinted(true);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const counterAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 7000, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(counterAnim, { toValue: 1, duration: 9000, useNativeDriver: true })).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.07, duration: 1600, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    getStats().then(s => setStats({ productivityScore: s.productivityScore, tasksCompleted: s.tasksCompleted }));
  }, [getStats]);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const counterRotate = counterAnim.interpolate({ inputRange: [0, 1], outputRange: ["360deg", "0deg"] });

  const handleMint = useCallback(async () => {
    if (!isTonConnected) {
      const { Alert } = await import("react-native");
      Alert.alert("Wallet Required", "Connect your TON wallet to mint the Tonian badge.", [
        { text: "Connect Wallet", onPress: () => void connectWallet() },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }
    if (minted) return;

    const { Alert } = await import("react-native");
    Alert.alert(
      "Mint Tonian Badge",
      `Permanently mint your exclusive Tonian badge on TON.\n\n• Cost: 1 TON (one-time)\n• Permanent on-chain verification\n• Unlocks lifetime 2× point multiplier\n\nFunds support the Tonic AI ecosystem.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mint for 1 TON",
          onPress: async () => {
            setMinting(true);
            try {
              const result = await sendTransaction({
                to: TON_REWARD_ADDRESS,
                amount: "1000000000",
                comment: `Tonic AI | Tonian Badge | User: ${user?.name || "Anonymous"} | Score: ${stats.productivityScore}`,
              });
              if (result) {
                setMinted(true);
                setTxHash(result.boc);
                if (user?.id) {
                  await fetch(`${API_BASE_URL}/api/ton-proof`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId: user.id,
                      walletAddress: user.walletAddress,
                      proof: { boc: result.boc, comment: "Tonian Badge" },
                      score: stats.productivityScore,
                    }),
                  }).catch(() => {});
                }
                Alert.alert("You're a Tonian! 🎉", "Your badge is permanently recorded on the TON blockchain.", [{ text: "Awesome!" }]);
              }
            } catch {
              Alert.alert("Transaction Failed", "Could not complete minting. Check your wallet balance and try again.");
            } finally {
              setMinting(false);
            }
          },
        },
      ]
    );
  }, [isTonConnected, minted, sendTransaction, user, stats, connectWallet]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <ChevronLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tonian Badge</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero badge */}
        <View style={styles.heroWrap}>
          <View style={styles.badgeRing}>
            {/* Outer ring */}
            <Animated.View style={{
              position: "absolute", width: 196, height: 196, borderRadius: 98,
              borderWidth: 2, borderColor: `${Colors.gold}50`,
              borderTopColor: Colors.gold, borderRightColor: `${Colors.gold}80`,
              transform: [{ rotate }],
            }} />
            {/* Mid ring */}
            <Animated.View style={{
              position: "absolute", width: 166, height: 166, borderRadius: 83,
              borderWidth: 1.5, borderColor: `${Colors.gold}20`,
              borderBottomColor: `${Colors.gold}55`, borderLeftColor: `${Colors.gold}35`,
              transform: [{ rotate: counterRotate }],
            }} />
            {/* Inner ring */}
            <Animated.View style={{
              position: "absolute", width: 138, height: 138, borderRadius: 69,
              borderWidth: 1, borderColor: `${Colors.gold}15`,
              borderTopColor: `${Colors.gold}40`,
              transform: [{ rotate }],
            }} />
            {/* Core */}
            <Animated.View style={{
              width: 110, height: 110, borderRadius: 55,
              backgroundColor: `${Colors.gold}14`, borderWidth: 2.5, borderColor: `${Colors.gold}65`,
              justifyContent: "center", alignItems: "center",
              transform: [{ scale: pulseAnim }],
              shadowColor: Colors.gold, shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.9, shadowRadius: 28, elevation: 24,
            }}>
              <Text style={{ fontSize: 50 }}>{minted ? "🏅" : "⭐"}</Text>
            </Animated.View>
          </View>

          <Animated.Text style={[styles.badgeName, {
            opacity: glowAnim.interpolate({ inputRange: [0.4, 1], outputRange: [0.65, 1] }),
          }]}>
            TONIAN
          </Animated.Text>
          <Text style={styles.badgeSub}>{minted ? "Verified Member" : "Exclusive · TON Blockchain"}</Text>

          {minted ? (
            <View style={styles.verifiedPill}>
              <CheckCircle size={15} color={Colors.success} />
              <Text style={styles.verifiedText}>Verified Tonian</Text>
            </View>
          ) : (
            <View style={styles.pricePill}>
              <Text style={styles.priceTon}>1 TON</Text>
              <Text style={styles.priceSub}>· one-time · permanent</Text>
            </View>
          )}
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <View style={styles.card}>
            <LinearGradient colors={["#0A0D18", "#111827", "#130D1E"]} style={styles.cardInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.cardTitle}>What you unlock</Text>
              {REWARDS.map(({ icon: Icon, label }, i) => (
                <View key={i} style={[styles.rewardRow, i === REWARDS.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.rewardIcon}>
                    <Icon size={17} color={Colors.gold} />
                  </View>
                  <Text style={styles.rewardText}>{label}</Text>
                </View>
              ))}
            </LinearGradient>
          </View>
        </View>

        {/* TX hash */}
        {txHash && (
          <View style={styles.txCard}>
            <CheckCircle size={17} color={Colors.blue} />
            <View style={{ flex: 1 }}>
              <Text style={styles.txLabel}>⛓️ Verified on TON Blockchain</Text>
              <Text style={styles.txHash} numberOfLines={1}>{txHash.slice(0, 36)}…</Text>
            </View>
          </View>
        )}

        {/* CTA */}
        <View style={{ marginTop: 8 }}>
          {minted ? (
            <>
              <View style={styles.verifiedCta}>
                <Text style={styles.verifiedCtaTitle}>🎉 You're a Verified Tonian!</Text>
                <Text style={styles.verifiedCtaSub}>Badge permanently minted on TON blockchain</Text>
              </View>
              <TouchableOpacity
                style={styles.tonscanBtn}
                onPress={() => Linking.openURL(`${TESTNET_EXPLORER}/address/${TON_REWARD_ADDRESS}`)}
                activeOpacity={0.8}
              >
                <ExternalLink size={14} color={Colors.blue} />
                <Text style={styles.tonscanText}>View on TONScan (Testnet)</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.mintWrap, (minting || isSendingTx) && { opacity: 0.65 }]}
              onPress={() => void handleMint()}
              disabled={minting || isSendingTx}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.gold, "#B8860B", Colors.gold]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.mintGrad}
              >
                {minting ? (
                  <ActivityIndicator size="small" color="#0D1117" />
                ) : (
                  <Star size={19} color="#0D1117" fill="#0D1117" />
                )}
                <Text style={styles.mintText}>{minting ? "Minting Badge…" : "Mint Badge · 1 TON"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
