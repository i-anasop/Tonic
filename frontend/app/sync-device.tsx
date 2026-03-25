import { useState, useMemo, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Download, Upload, CheckCircle, AlertCircle, Smartphone, RefreshCw } from "lucide-react-native";
import { useRouter } from "expo-router";

import { Colors } from "@/constants/colors";
import { useTheme, type AppColors } from "@/providers/ThemeProvider";
import { useAppState } from "@/providers/AppStateProvider";
import { API_BASE_URL } from "@/constants/api";

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgPrimary },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 60 },
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
    intro: {
      marginHorizontal: 20, marginBottom: 24,
      backgroundColor: colors.bgSecondary, borderRadius: 18,
      padding: 16, borderWidth: 1, borderColor: colors.border,
      flexDirection: "row", gap: 12, alignItems: "flex-start",
    },
    introText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
    section: { paddingHorizontal: 20, marginBottom: 20 },
    card: {
      backgroundColor: colors.bgSecondary, borderRadius: 22,
      borderWidth: 1, borderColor: colors.border, padding: 20,
    },
    cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
    cardIconWrap: {
      width: 42, height: 42, borderRadius: 13,
      justifyContent: "center", alignItems: "center",
    },
    cardTitle: { fontSize: 16, fontWeight: "800", color: colors.textPrimary },
    cardSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
    codeBox: {
      backgroundColor: colors.bgPrimary, borderRadius: 16,
      padding: 20, alignItems: "center", marginBottom: 14,
      borderWidth: 1.5, borderColor: colors.border,
    },
    codeLabel: {
      fontSize: 10, fontWeight: "700", color: colors.textMuted,
      textTransform: "uppercase", letterSpacing: 1, marginBottom: 10,
    },
    codeText: {
      fontSize: 40, fontWeight: "900", color: Colors.blue,
      letterSpacing: 8,
    },
    codeHint: { fontSize: 11, color: colors.textMuted, marginTop: 8, textAlign: "center" },
    genBtn: {
      borderRadius: 14, paddingVertical: 13, alignItems: "center",
      flexDirection: "row", justifyContent: "center", gap: 8,
    },
    genBtnText: { fontSize: 14, fontWeight: "700" },
    dividerRow: {
      flexDirection: "row", alignItems: "center", gap: 12,
      marginHorizontal: 20, marginBottom: 20,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
    inputRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
    codeInput: {
      flex: 1, backgroundColor: colors.bgPrimary, borderRadius: 14,
      paddingHorizontal: 16, height: 50, borderWidth: 1.5, borderColor: colors.border,
      fontSize: 20, fontWeight: "800", letterSpacing: 4,
    },
    restoreBtn: {
      borderRadius: 14, paddingHorizontal: 18, height: 50,
      justifyContent: "center", alignItems: "center",
    },
    restoreBtnText: { fontSize: 14, fontWeight: "700" },
    resultRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
    resultText: { fontSize: 13, fontWeight: "600" },
    stepsTitle: {
      fontSize: 11, fontWeight: "700", color: colors.textMuted,
      textTransform: "uppercase", letterSpacing: 1, marginBottom: 14,
    },
    step: { flexDirection: "row", gap: 12, marginBottom: 12, alignItems: "flex-start" },
    stepNum: {
      width: 26, height: 26, borderRadius: 8,
      backgroundColor: `${Colors.purple}15`, borderWidth: 1, borderColor: `${Colors.purple}30`,
      justifyContent: "center", alignItems: "center",
    },
    stepNumText: { fontSize: 12, fontWeight: "800", color: Colors.purple },
    stepText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20, paddingTop: 3 },
  });
}

export default function SyncDeviceScreen() {
  const router = useRouter();
  const { user } = useAppState();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [syncCode, setSyncCode] = useState<string | null>(null);
  const [syncInput, setSyncInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/sync-code/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.code) setSyncCode(data.code);
    } catch {
      Alert.alert("Error", "Could not generate sync code. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const handleRestore = useCallback(async () => {
    const code = syncInput.trim().toUpperCase();
    if (code.length < 4) return;
    setRestoring(true);
    setRestoreMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/sync-code/restore`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.user) {
        setRestoreMsg({ ok: true, text: `Account restored: ${data.user.name}` });
        setSyncInput("");
      } else {
        setRestoreMsg({ ok: false, text: "Code not found. Double-check and try again." });
      }
    } catch {
      setRestoreMsg({ ok: false, text: "Restore failed. Please try again." });
    } finally {
      setRestoring(false);
    }
  }, [syncInput]);

  const canRestore = syncInput.trim().length >= 4 && !restoring;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <ChevronLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sync Devices</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Intro */}
        <View style={styles.intro}>
          <Smartphone size={18} color={Colors.blue} style={{ marginTop: 1 }} />
          <Text style={styles.introText}>
            Use a sync code to move your Tonic AI account — tasks, achievements, and score — to another device instantly.
          </Text>
        </View>

        {/* Export card */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconWrap, { backgroundColor: `${Colors.blue}15` }]}>
                <Upload size={20} color={Colors.blue} />
              </View>
              <View>
                <Text style={styles.cardTitle}>Export from this device</Text>
                <Text style={styles.cardSub}>Generate a code and enter it on the new device</Text>
              </View>
            </View>

            {syncCode && (
              <View style={styles.codeBox}>
                <Text style={styles.codeLabel}>Your Sync Code</Text>
                <Text style={styles.codeText}>{syncCode}</Text>
                <Text style={styles.codeHint}>Enter this code on your other device to restore</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.genBtn, {
                backgroundColor: syncCode ? `${Colors.blue}15` : Colors.blue,
                borderWidth: syncCode ? 1 : 0,
                borderColor: `${Colors.blue}40`,
              }]}
              onPress={() => void handleGenerate()}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color={syncCode ? Colors.blue : "#fff"} />
              ) : (
                <RefreshCw size={15} color={syncCode ? Colors.blue : "#fff"} />
              )}
              <Text style={[styles.genBtnText, { color: syncCode ? Colors.blue : "#fff" }]}>
                {syncCode ? "Generate New Code" : "Generate Sync Code"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Restore card */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconWrap, { backgroundColor: `${Colors.purple}15` }]}>
                <Download size={20} color={Colors.purple} />
              </View>
              <View>
                <Text style={styles.cardTitle}>Restore on this device</Text>
                <Text style={styles.cardSub}>Enter the code shown on your other device</Text>
              </View>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={[styles.codeInput, { color: colors.textPrimary, outlineWidth: 0 } as any]}
                placeholder="ENTER CODE"
                placeholderTextColor={colors.textMuted}
                value={syncInput}
                onChangeText={v => { setSyncInput(v.toUpperCase().slice(0, 8)); setRestoreMsg(null); }}
                autoCapitalize="characters"
                maxLength={8}
              />
              <TouchableOpacity
                style={[styles.restoreBtn, { backgroundColor: canRestore ? Colors.purple : colors.bgPrimary, borderWidth: canRestore ? 0 : 1, borderColor: colors.border }]}
                onPress={() => void handleRestore()}
                disabled={!canRestore}
                activeOpacity={0.85}
              >
                {restoring ? (
                  <ActivityIndicator size="small" color={canRestore ? "#fff" : colors.textMuted} />
                ) : (
                  <Text style={[styles.restoreBtnText, { color: canRestore ? "#fff" : colors.textMuted }]}>Restore</Text>
                )}
              </TouchableOpacity>
            </View>

            {restoreMsg && (
              <View style={styles.resultRow}>
                {restoreMsg.ok
                  ? <CheckCircle size={15} color={Colors.success} />
                  : <AlertCircle size={15} color={Colors.danger} />}
                <Text style={[styles.resultText, { color: restoreMsg.ok ? Colors.success : Colors.danger }]}>
                  {restoreMsg.text}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <Text style={styles.stepsTitle}>How it works</Text>
          {[
            "Open Tonic AI on the device you want to export from.",
            "Tap \"Generate Sync Code\" to create a 6–8 character code.",
            "On your new device, go to Profile → Sync Devices.",
            "Enter the code and tap Restore. Your account transfers instantly.",
          ].map((text, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{text}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
