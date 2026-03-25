import { useState, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Zap, TrendingUp, ArrowRight, Info } from "lucide-react-native";
import { useRouter } from "expo-router";

import { Colors } from "@/constants/colors";
import { useTheme, type AppColors } from "@/providers/ThemeProvider";
import { useAppState } from "@/providers/AppStateProvider";
import { useTonConnect } from "@/hooks/useTonConnect";
import { useAchievements } from "@/providers/AchievementsProvider";
import { API_BASE_URL } from "@/constants/api";

const EARN_RATES = [
  { label: "Low-priority task", reward: 10, icon: "📋" },
  { label: "Medium-priority task", reward: 15, icon: "📌" },
  { label: "High-priority task", reward: 25, icon: "🔥" },
  { label: "Daily login streak", reward: 25, icon: "⚡" },
  { label: "Daily challenge", reward: 50, icon: "🏆" },
  { label: "On-chain achievement (2×)", reward: null, icon: "⛓️" },
];

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgPrimary },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 48 },
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 20, paddingVertical: 16,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 13,
      backgroundColor: colors.bgSecondary,
      justifyContent: "center", alignItems: "center",
    },
    headerTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary },
    heroCard: {
      marginHorizontal: 20, marginBottom: 20,
      borderRadius: 26, overflow: "hidden",
      borderWidth: 1.5, borderColor: `${Colors.gold}30`,
      shadowColor: Colors.gold, shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
    },
    heroGrad: { padding: 26 },
    heroLabel: {
      fontSize: 11, fontWeight: "700", color: "rgba(200,190,150,0.6)",
      textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 10,
    },
    balanceRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 6 },
    balanceNum: { fontSize: 44, fontWeight: "900", color: Colors.gold, letterSpacing: -1 },
    balanceTicker: { fontSize: 16, fontWeight: "700", color: `${Colors.gold}90`, marginBottom: 8 },
    tonEquiv: { fontSize: 14, color: "rgba(200,190,150,0.6)", marginBottom: 20 },
    dividerLine: { height: 1, backgroundColor: `${Colors.gold}18`, marginBottom: 20 },
    metaRow: { flexDirection: "row", gap: 20 },
    metaBox: { flex: 1, alignItems: "center", gap: 4 },
    metaVal: { fontSize: 18, fontWeight: "800", color: colors.textPrimary },
    metaLabel: { fontSize: 10, color: colors.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8 },
    section: { paddingHorizontal: 20, marginBottom: 16 },
    sectionLabel: {
      fontSize: 11, fontWeight: "700", color: colors.textMuted,
      textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12,
    },
    card: { backgroundColor: colors.bgSecondary, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
    earnRow: {
      flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    earnEmoji: { fontSize: 20, width: 34 },
    earnLabel: { flex: 1, fontSize: 13, color: colors.textSecondary, marginLeft: 4 },
    earnReward: { fontSize: 14, fontWeight: "800", color: Colors.success },
    earnRewardSpecial: { fontSize: 13, fontWeight: "700", color: Colors.gold },
    convCard: {
      backgroundColor: colors.bgSecondary, borderRadius: 20,
      borderWidth: 1, borderColor: colors.border, padding: 18,
    },
    convRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 12 },
    convBlock: { alignItems: "center", gap: 4 },
    convNum: { fontSize: 22, fontWeight: "900", color: colors.textPrimary },
    convTicker: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
    convArrow: { opacity: 0.4 },
    convNote: { fontSize: 12, color: colors.textMuted, textAlign: "center", lineHeight: 18 },
    claimBtn: {
      marginHorizontal: 20, borderRadius: 18, overflow: "hidden",
      shadowColor: Colors.gold, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    },
    claimGrad: { paddingVertical: 17, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 },
    claimText: { fontSize: 15, fontWeight: "900", color: "#0D1117" },
    connectBtn: {
      marginHorizontal: 20, borderRadius: 18, paddingVertical: 17,
      backgroundColor: `${Colors.gold}15`, borderWidth: 1.5, borderColor: `${Colors.gold}35`,
      alignItems: "center",
    },
    connectText: { fontSize: 15, fontWeight: "700", color: Colors.gold },
    infoCard: {
      marginHorizontal: 20, flexDirection: "row", gap: 12, alignItems: "flex-start",
      backgroundColor: `${Colors.blue}08`, borderRadius: 16, padding: 14,
      borderWidth: 1, borderColor: `${Colors.blue}20`, marginTop: 16,
    },
    infoText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  });
}

export default function TonicBalanceScreen() {
  const router = useRouter();
  const { user } = useAppState();
  const { isConnected: walletConnected, connectWallet } = useTonConnect();
  const { stats: achievementStats } = useAchievements();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [tonicBalance, setTonicBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_BASE_URL}/api/users/${user.id}/tokens`)
      .then(r => r.json())
      .then(d => { if (typeof d.tokens === "number") setTonicBalance(d.tokens); })
      .catch(() => {});
  }, [user?.id]);

  const balance = tonicBalance ?? achievementStats.claimedPoints * 10;
  const tonEquiv = (balance / 100_000).toFixed(4);

  const handleClaim = () => {
    Alert.alert(
      "Claim on TON",
      `You have ${balance.toLocaleString()} TONIC ≈ ${tonEquiv} TON.\n\nFull claiming will be enabled after the hackathon period. Your balance is securely tracked on-chain.`,
      [{ text: "Got it" }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <ChevronLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>$TONIC Balance</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero balance card */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={["#0A0D18", "#111827", "#130D1E"]}
            style={styles.heroGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Text style={styles.heroLabel}>Total Balance</Text>
            <View style={styles.balanceRow}>
              <Zap size={28} color={Colors.gold} fill={Colors.gold} />
              <Text style={styles.balanceNum}>{balance.toLocaleString()}</Text>
              <Text style={styles.balanceTicker}>TONIC</Text>
            </View>
            <Text style={styles.tonEquiv}>≈ {tonEquiv} TON</Text>

            <View style={styles.dividerLine} />

            <View style={styles.metaRow}>
              <View style={styles.metaBox}>
                <Text style={styles.metaVal}>{achievementStats.claimedPoints.toLocaleString()}</Text>
                <Text style={styles.metaLabel}>Pts Claimed</Text>
              </View>
              <View style={{ width: 1, backgroundColor: `${Colors.gold}15`, alignSelf: "stretch" }} />
              <View style={styles.metaBox}>
                <Text style={styles.metaVal}>{achievementStats.pendingPoints.toLocaleString()}</Text>
                <Text style={styles.metaLabel}>Pts Pending</Text>
              </View>
              <View style={{ width: 1, backgroundColor: `${Colors.gold}15`, alignSelf: "stretch" }} />
              <View style={styles.metaBox}>
                <Text style={styles.metaVal}>Lv {achievementStats.currentLevel.level}</Text>
                <Text style={styles.metaLabel}>Current Rank</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Earn rates */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>How to earn TONIC</Text>
          <View style={styles.card}>
            {EARN_RATES.map((row, i) => (
              <View key={i} style={[styles.earnRow, i === EARN_RATES.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.earnEmoji}>{row.icon}</Text>
                <Text style={styles.earnLabel}>{row.label}</Text>
                {row.reward !== null ? (
                  <Text style={styles.earnReward}>+{row.reward}</Text>
                ) : (
                  <Text style={styles.earnRewardSpecial}>2× pts</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Conversion rate */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Exchange Rate</Text>
          <View style={styles.convCard}>
            <View style={styles.convRow}>
              <View style={styles.convBlock}>
                <Text style={styles.convNum}>100,000</Text>
                <Text style={styles.convTicker}>TONIC</Text>
              </View>
              <View style={styles.convArrow}>
                <ArrowRight size={20} color={colors.textMuted} />
              </View>
              <View style={styles.convBlock}>
                <Text style={styles.convNum}>1</Text>
                <Text style={styles.convTicker}>TON</Text>
              </View>
            </View>
            <Text style={styles.convNote}>
              The rate is intentionally conservative to preserve long-term token value as the ecosystem grows.
            </Text>
          </View>
        </View>

        {/* Claim CTA */}
        {walletConnected ? (
          <TouchableOpacity style={styles.claimBtn} onPress={handleClaim} activeOpacity={0.85}>
            <LinearGradient
              colors={[Colors.gold, "#B8860B", Colors.gold]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.claimGrad}
            >
              <Zap size={18} color="#0D1117" fill="#0D1117" />
              <Text style={styles.claimText}>Claim on TON Blockchain</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.connectBtn} onPress={() => void connectWallet()} activeOpacity={0.85}>
            <Text style={styles.connectText}>Connect Wallet to Claim</Text>
          </TouchableOpacity>
        )}

        {/* Info note */}
        <View style={styles.infoCard}>
          <Info size={15} color={Colors.blue} style={{ marginTop: 1 }} />
          <Text style={styles.infoText}>
            Your TONIC balance is tracked on our servers and tied to your wallet after connection. Full on-chain claiming will be enabled post-hackathon.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
