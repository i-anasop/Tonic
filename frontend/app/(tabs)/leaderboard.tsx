import { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Crown,
  Star,
  Trophy,
  Zap,
  Medal,
} from "lucide-react-native";
import { Colors } from "@/constants/colors";
import { useTheme } from "@/providers/ThemeProvider";
import { useAppState } from "@/providers/AppStateProvider";
import { API_BASE_URL } from "@/constants/api";

const RANK_PATH = [
  { name: "Rookie",     min: 0,      color: "#9CA3AF" },
  { name: "Apprentice", min: 200,    color: "#CD7F32" },
  { name: "Grinder",    min: 600,    color: "#C0C0C0" },
  { name: "Strategist", min: 1500,   color: Colors.gold },
  { name: "Pro",        min: 3500,   color: "#66D9E8" },
  { name: "Elite",      min: 7500,   color: "#60A5FA" },
  { name: "Master",     min: 15000,  color: "#A78BFA" },
  { name: "Champion",   min: 30000,  color: "#F472B6" },
  { name: "Legend",     min: 60000,  color: "#F97316" },
  { name: "Mythic",     min: 120000, color: "#FFD700" },
];

function getRank(score: number) {
  let rank = RANK_PATH[0];
  for (const r of RANK_PATH) {
    if (score >= r.min) rank = r;
    else break;
  }
  return rank;
}

function PodiumCard({ user, position, delay }: { user: any; position: number; delay: number }) {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  const podiumHeight = position === 1 ? 90 : position === 2 ? 70 : 55;
  const avatarSize = position === 1 ? 64 : 52;
  const medal = position === 1 ? "🥇" : position === 2 ? "🥈" : "🥉";
  const podiumColor = position === 1 ? Colors.gold : position === 2 ? "#C0C0C0" : "#CD7F32";
  const rank = getRank(user.score);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 55, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
    if (position === 1) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0.4, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View style={[
      styles.podiumCard,
      { opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
      position === 1 && { marginBottom: 6 },
    ]}>
      {position === 1 && (
        <Animated.View style={[styles.podiumGlow, { backgroundColor: podiumColor, opacity: glowOpacity }]} />
      )}

      <View style={[styles.podiumAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, borderColor: podiumColor }]}>
        <LinearGradient
          colors={[`${podiumColor}40`, `${podiumColor}18`]}
          style={StyleSheet.absoluteFill}
        />
        <Text style={[styles.podiumInitial, { fontSize: position === 1 ? 22 : 17, color: podiumColor }]}>
          {(user.name || "?")[0].toUpperCase()}
        </Text>
        {position === 1 && (
          <View style={styles.crownBadge}>
            <Crown size={12} color="#0D1117" fill="#0D1117" />
          </View>
        )}
      </View>

      <Text style={styles.medalText}>{medal}</Text>
      <Text style={[styles.podiumName, { color: position === 1 ? podiumColor : colors.textPrimary }]} numberOfLines={1}>
        {user.name}
      </Text>
      <View style={[styles.podiumRankBadge, { backgroundColor: `${rank.color}20`, borderColor: `${rank.color}40` }]}>
        <Text style={[styles.podiumRankText, { color: rank.color }]}>{rank.name}</Text>
      </View>
      <Text style={[styles.podiumScore, { color: podiumColor }]}>{user.score.toLocaleString()}</Text>

      <View style={[styles.podiumBase, { height: podiumHeight, backgroundColor: `${podiumColor}15`, borderTopColor: `${podiumColor}50` }]}>
        <Text style={[styles.podiumPosition, { color: podiumColor }]}>#{position}</Text>
      </View>
    </Animated.View>
  );
}

function LeaderRow({ user, index, isMe }: { user: any; index: number; isMe: boolean }) {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rank = getRank(user.score);
  const position = index + 1;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(Math.min(index * 60, 600)),
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      styles.row,
      { backgroundColor: isMe ? `${Colors.gold}12` : colors.bgSecondary, borderColor: isMe ? `${Colors.gold}35` : colors.border },
      { opacity: opacityAnim, transform: [{ translateX: slideAnim }] },
    ]}>
      <Text style={[styles.rowPos, { color: position <= 3 ? Colors.gold : colors.textMuted }]}>
        {position <= 3 ? ["🥇", "🥈", "🥉"][position - 1] : `#${position}`}
      </Text>

      <View style={[styles.rowAvatar, { backgroundColor: `${rank.color}20`, borderColor: `${rank.color}40` }]}>
        <Text style={[styles.rowInitial, { color: rank.color }]}>
          {(user.name || "?")[0].toUpperCase()}
        </Text>
      </View>

      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: isMe ? Colors.gold : colors.textPrimary }]} numberOfLines={1}>
          {user.name}{isMe ? " (you)" : ""}
        </Text>
        <View style={styles.rowMeta}>
          <View style={[styles.rankChip, { backgroundColor: `${rank.color}18`, borderColor: `${rank.color}35` }]}>
            <Text style={[styles.rankChipText, { color: rank.color }]}>{rank.name}</Text>
          </View>
          <View style={styles.rowMetaItem}>
            <Trophy size={9} color={colors.textMuted} />
            <Text style={[styles.rowMetaText, { color: colors.textMuted }]}>{user.completed_tasks} tasks</Text>
          </View>
          <View style={styles.rowMetaItem}>
            <Zap size={9} color={Colors.gold} />
            <Text style={[styles.rowMetaText, { color: colors.textMuted }]}>{Number(user.tonic_tokens).toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.rowScore, { color: isMe ? Colors.gold : colors.textPrimary }]}>
        {user.score.toLocaleString()}
      </Text>
    </Animated.View>
  );
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAppState();
  const userId = user?.id;
  const [board, setBoard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const load = useCallback(() => {
    fetch(`${API_BASE_URL}/api/leaderboard`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.leaderboard)) setBoard(d.leaderboard);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const top3 = board.slice(0, 3);
  const rest = board.slice(3);
  const myRankIdx = board.findIndex(u => u.id === userId);
  const myRank = myRankIdx >= 0 ? board[myRankIdx] : null;
  const myRankData = myRank ? getRank(myRank.score) : null;

  const headerOpacity = headerAnim;
  const headerTranslate = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bgPrimary }]}>
      <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerTranslate }] }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Global Leaderboard</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>{board.length} players ranked</Text>
        </View>
        <View style={styles.headerRight}>
          <Medal size={20} color={Colors.gold} />
        </View>
      </Animated.View>

      {myRank && myRankData && (
        <View style={[styles.myRankBanner, { backgroundColor: `${Colors.gold}10`, borderColor: `${Colors.gold}30` }]}>
          <View style={[styles.myRankAvatarWrap, { backgroundColor: `${myRankData.color}25`, borderColor: `${myRankData.color}50` }]}>
            <Text style={[styles.myRankInitial, { color: myRankData.color }]}>{(myRank.name || "?")[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.myRankLabel, { color: Colors.gold }]}>Your Ranking</Text>
            <Text style={[styles.myRankName, { color: colors.textPrimary }]}>{myRank.name}</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <View style={[styles.myRankPosBadge, { backgroundColor: `${Colors.gold}20` }]}>
              <Star size={10} color={Colors.gold} fill={Colors.gold} />
              <Text style={[styles.myRankPosText, { color: Colors.gold }]}>#{myRankIdx + 1}</Text>
            </View>
            <Text style={[styles.myRankScore, { color: myRankData.color }]}>{myRank.score.toLocaleString()} pts</Text>
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {top3.length === 3 && (
          <View style={styles.podiumRow}>
            <PodiumCard user={top3[1]} position={2} delay={100} />
            <PodiumCard user={top3[0]} position={1} delay={0} />
            <PodiumCard user={top3[2]} position={3} delay={200} />
          </View>
        )}

        {rest.length > 0 && (
          <View style={styles.restSection}>
            <Text style={[styles.restLabel, { color: colors.textMuted }]}>Rankings</Text>
            <View style={styles.restList}>
              {rest.map((u, i) => (
                <LeaderRow key={u.id ?? i} user={u} index={i + 3} isMe={u.id === userId} />
              ))}
            </View>
          </View>
        )}

        {loading && (
          <View style={styles.loadingWrap}>
            {[0, 1, 2].map(i => (
              <View key={i} style={[styles.skeleton, { backgroundColor: colors.bgSecondary, opacity: 0.6 - i * 0.15 }]} />
            ))}
          </View>
        )}

        {!loading && board.length === 0 && (
          <View style={styles.emptyWrap}>
            <Trophy size={44} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No rankings yet — complete tasks to appear here!</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  headerSub: { fontSize: 12, marginTop: 1 },
  headerRight: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${Colors.gold}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  myRankBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 18,
    marginBottom: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  myRankAvatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  myRankInitial: { fontSize: 16, fontWeight: "800" },
  myRankLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  myRankName: { fontSize: 14, fontWeight: "700", marginTop: 1 },
  myRankPosBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  myRankPosText: { fontSize: 11, fontWeight: "800" },
  myRankScore: { fontSize: 12, fontWeight: "700" },
  scroll: { paddingHorizontal: 18 },
  podiumRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 10,
    marginBottom: 24,
    paddingTop: 8,
  },
  podiumCard: {
    alignItems: "center",
    flex: 1,
    maxWidth: 120,
  },
  podiumGlow: {
    position: "absolute",
    top: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    filter: "blur(20px)" as any,
  },
  podiumAvatar: {
    borderWidth: 2.5,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 6,
  },
  podiumInitial: { fontWeight: "900" },
  crownBadge: {
    position: "absolute",
    top: -10,
    backgroundColor: Colors.gold,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  medalText: { fontSize: 20, marginBottom: 2 },
  podiumName: { fontSize: 11, fontWeight: "700", textAlign: "center", marginBottom: 4, paddingHorizontal: 4 },
  podiumRankBadge: {
    flexDirection: "row",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
  },
  podiumRankText: { fontSize: 8, fontWeight: "700" },
  podiumScore: { fontSize: 13, fontWeight: "900", marginBottom: 8 },
  podiumBase: {
    width: "100%",
    borderTopWidth: 2,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  podiumPosition: { fontSize: 18, fontWeight: "900", marginTop: 8 },
  restSection: { marginBottom: 8 },
  restLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  restList: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  rowPos: { fontSize: 12, fontWeight: "800", width: 32, textAlign: "center" },
  rowAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  rowInitial: { fontSize: 14, fontWeight: "800" },
  rowInfo: { flex: 1, gap: 3 },
  rowName: { fontSize: 13, fontWeight: "700" },
  rowMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  rankChip: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
  },
  rankChipText: { fontSize: 8, fontWeight: "700" },
  rowMetaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  rowMetaText: { fontSize: 9 },
  rowScore: { fontSize: 14, fontWeight: "800" },
  loadingWrap: { gap: 10 },
  skeleton: { height: 62, borderRadius: 14 },
  emptyWrap: { alignItems: "center", gap: 14, paddingVertical: 48 },
  emptyText: { fontSize: 14, textAlign: "center", maxWidth: 240, lineHeight: 20 },
});
