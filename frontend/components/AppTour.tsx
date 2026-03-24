import { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  LayoutDashboard,
  ListTodo,
  Sparkles,
  User,
  Bot,
  Zap,
  Target,
  Brain,
  Trophy,
  CheckCircle,
  ChevronRight,
  Shield,
  TrendingUp,
  Flame,
  Wallet,
  Star,
  Plus,
} from "lucide-react-native";
import { Colors } from "@/constants/colors";

const TOUR_KEY = "@tonic_tour_v8_seen";

export async function checkTourSeen(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(TOUR_KEY)) === "true";
  } catch {
    return false;
  }
}

export async function markTourSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(TOUR_KEY, "true");
  } catch {}
}

function MiniDashboard({ accent }: { accent: string }) {
  return (
    <View style={mini.screen}>
      <View style={mini.header}>
        <View>
          <View style={[mini.pill, { backgroundColor: `${accent}25`, width: 60 }]} />
          <View style={[mini.line, { width: 80, marginTop: 4, backgroundColor: "#E6EDF3" }]} />
        </View>
        <View style={[mini.avatar, { backgroundColor: `${accent}30`, borderColor: accent }]} />
      </View>
      <View style={mini.row}>
        {[
          { label: "Tasks", val: "12", icon: CheckCircle },
          { label: "Streak", val: "7d", icon: Flame },
          { label: "Score", val: "940", icon: Star },
        ].map(({ label, val, icon: Icon }, i) => (
          <View key={i} style={[mini.statCard, { borderColor: `${accent}30` }]}>
            <Icon size={10} color={accent} />
            <Text style={[mini.statVal, { color: accent }]}>{val}</Text>
            <Text style={mini.statLabel}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={[mini.chatBubble, { borderColor: `${accent}40`, backgroundColor: `${accent}10` }]}>
        <Bot size={9} color={accent} />
        <Text style={[mini.chatText, { color: accent }]}>Ask me anything…</Text>
        <View style={[mini.sendBtn, { backgroundColor: accent }]}>
          <Zap size={7} color="#0D1117" />
        </View>
      </View>
      <View style={mini.tabBar}>
        {[LayoutDashboard, ListTodo, Sparkles, User].map((Icon, i) => (
          <View key={i} style={[mini.tabItem, i === 0 && { borderTopWidth: 2, borderTopColor: accent }]}>
            <Icon size={11} color={i === 0 ? accent : "rgba(255,255,255,0.3)"} />
          </View>
        ))}
      </View>
    </View>
  );
}

function MiniTasks({ accent }: { accent: string }) {
  const tasks = [
    { label: "Finish project report", cat: "Work", done: false },
    { label: "30 min workout", cat: "Health", done: true },
    { label: "Read 20 pages", cat: "Learning", done: false },
  ];
  const catColors: Record<string, string> = { Work: Colors.blue, Health: Colors.success, Learning: Colors.purple };
  return (
    <View style={mini.screen}>
      <View style={mini.header}>
        <Text style={[mini.screenTitle, { color: "#E6EDF3" }]}>Tasks</Text>
        <View style={[mini.iconBtn, { backgroundColor: `${accent}25` }]}>
          <Plus size={10} color={accent} />
        </View>
      </View>
      <View style={[mini.row, { gap: 4, marginBottom: 8 }]}>
        {["Work", "Health", "Learning"].map((c) => (
          <View key={c} style={[mini.catPill, { backgroundColor: `${catColors[c]}25`, borderColor: `${catColors[c]}50` }]}>
            <Text style={[mini.catText, { color: catColors[c] }]}>{c}</Text>
          </View>
        ))}
      </View>
      {tasks.map((t, i) => (
        <View key={i} style={[mini.taskRow, { opacity: t.done ? 0.5 : 1 }]}>
          <View style={[mini.checkbox, { borderColor: t.done ? Colors.success : "rgba(255,255,255,0.25)", backgroundColor: t.done ? `${Colors.success}30` : "transparent" }]}>
            {t.done && <CheckCircle size={8} color={Colors.success} />}
          </View>
          <View style={{ flex: 1 }}>
            <View style={[mini.line, { width: "80%", opacity: t.done ? 0.4 : 1 }]} />
          </View>
          <View style={[mini.catDot, { backgroundColor: catColors[t.cat] || accent }]} />
        </View>
      ))}
      <View style={mini.tabBar}>
        {[LayoutDashboard, ListTodo, Sparkles, User].map((Icon, i) => (
          <View key={i} style={[mini.tabItem, i === 1 && { borderTopWidth: 2, borderTopColor: accent }]}>
            <Icon size={11} color={i === 1 ? accent : "rgba(255,255,255,0.3)"} />
          </View>
        ))}
      </View>
    </View>
  );
}

function MiniInsights({ accent }: { accent: string }) {
  const bars = [0.4, 0.65, 0.5, 0.8, 0.6, 0.9, 0.75];
  return (
    <View style={mini.screen}>
      <View style={mini.header}>
        <Text style={[mini.screenTitle, { color: "#E6EDF3" }]}>Insights</Text>
        <View style={[mini.pill, { backgroundColor: `${accent}25`, width: 36 }]} />
      </View>
      <View style={[mini.chartWrap, { borderColor: `${accent}20` }]}>
        <View style={mini.bars}>
          {bars.map((h, i) => (
            <View key={i} style={[mini.barCol]}>
              <View style={[mini.bar, { height: h * 36, backgroundColor: i === 5 ? accent : `${accent}40` }]} />
            </View>
          ))}
        </View>
        <Text style={[mini.chartLabel, { color: accent }]}>7-day completion rate</Text>
      </View>
      <View style={[mini.insightCard, { borderColor: `${accent}30`, backgroundColor: `${accent}0A` }]}>
        <Brain size={9} color={accent} />
        <View style={{ flex: 1, gap: 3 }}>
          <View style={[mini.line, { width: "90%" }]} />
          <View style={[mini.line, { width: "70%", opacity: 0.6 }]} />
        </View>
      </View>
      <View style={mini.tabBar}>
        {[LayoutDashboard, ListTodo, Sparkles, User].map((Icon, i) => (
          <View key={i} style={[mini.tabItem, i === 2 && { borderTopWidth: 2, borderTopColor: accent }]}>
            <Icon size={11} color={i === 2 ? accent : "rgba(255,255,255,0.3)"} />
          </View>
        ))}
      </View>
    </View>
  );
}

function MiniAgent({ accent }: { accent: string }) {
  return (
    <View style={mini.screen}>
      <View style={mini.header}>
        <View style={[mini.iconBtn, { backgroundColor: `${accent}25` }]}>
          <Bot size={10} color={accent} />
        </View>
        <Text style={[mini.screenTitle, { color: "#E6EDF3", fontSize: 11 }]}>Tonic AI Agent</Text>
        <View style={[mini.pill, { backgroundColor: `${Colors.success}25`, width: 28 }]} />
      </View>
      <View style={mini.chatArea}>
        <View style={[mini.msgUser, { backgroundColor: `${accent}20`, borderColor: `${accent}30` }]}>
          <Text style={[mini.msgText, { color: accent }]}>"Add workout task for today"</Text>
        </View>
        <View style={[mini.msgBot, { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)" }]}>
          <Bot size={8} color={accent} style={{ marginBottom: 2 }} />
          <Text style={mini.msgText}>Done! Added "30 min workout" — Health category, high priority.</Text>
        </View>
        <View style={[mini.actionChip, { backgroundColor: `${Colors.success}20`, borderColor: `${Colors.success}40` }]}>
          <CheckCircle size={8} color={Colors.success} />
          <Text style={[mini.chipText, { color: Colors.success }]}>Task created ✓</Text>
        </View>
      </View>
      <View style={[mini.chatBubble, { borderColor: `${accent}40`, backgroundColor: `${accent}10` }]}>
        <Bot size={9} color={accent} />
        <Text style={[mini.chatText, { color: accent }]}>Type a message…</Text>
        <View style={[mini.sendBtn, { backgroundColor: accent }]}>
          <Zap size={7} color="#0D1117" />
        </View>
      </View>
    </View>
  );
}

function MiniProfile({ accent }: { accent: string }) {
  return (
    <View style={mini.screen}>
      <View style={[mini.header, { justifyContent: "center", flexDirection: "column", gap: 4 }]}>
        <View style={[mini.avatar, { backgroundColor: `${accent}25`, borderColor: accent, width: 36, height: 36, borderRadius: 18 }]} />
        <View style={[mini.pill, { backgroundColor: "transparent", width: 60 }]}>
          <Text style={[mini.screenTitle, { color: "#E6EDF3", textAlign: "center" }]}>User Name</Text>
        </View>
        <View style={[mini.catPill, { backgroundColor: `${accent}25`, borderColor: `${accent}50`, alignSelf: "center" }]}>
          <Trophy size={8} color={accent} />
          <Text style={[mini.catText, { color: accent }]}>Rising Star</Text>
        </View>
      </View>
      <View style={[mini.row, { gap: 4, marginBottom: 8 }]}>
        {[{ icon: CheckCircle, val: "40", lbl: "Tasks" }, { icon: Flame, val: "14d", lbl: "Streak" }, { icon: Star, val: "1.2k", lbl: "Score" }].map(({ icon: Icon, val, lbl }, i) => (
          <View key={i} style={[mini.statCard, { borderColor: `${accent}30` }]}>
            <Icon size={8} color={accent} />
            <Text style={[mini.statVal, { color: accent, fontSize: 9 }]}>{val}</Text>
            <Text style={mini.statLabel}>{lbl}</Text>
          </View>
        ))}
      </View>
      <View style={[mini.walletRow, { borderColor: `${Colors.gold}40`, backgroundColor: `${Colors.gold}0D` }]}>
        <Wallet size={9} color={Colors.gold} />
        <Text style={[mini.catText, { color: Colors.gold, flex: 1 }]}>Connect TON Wallet</Text>
        <View style={[mini.sendBtn, { backgroundColor: Colors.gold }]}>
          <ChevronRight size={7} color="#0D1117" />
        </View>
      </View>
      <View style={mini.tabBar}>
        {[LayoutDashboard, ListTodo, Sparkles, User].map((Icon, i) => (
          <View key={i} style={[mini.tabItem, i === 3 && { borderTopWidth: 2, borderTopColor: accent }]}>
            <Icon size={11} color={i === 3 ? accent : "rgba(255,255,255,0.3)"} />
          </View>
        ))}
      </View>
    </View>
  );
}

const STEPS = [
  {
    id: "dashboard",
    tab: "/(tabs)/",
    gradient: ["#1A1200", "#0D1117"] as [string, string],
    accent: Colors.gold,
    title: "Your Dashboard",
    subtitle: "AI-powered home base",
    description: "Your stats, AI agent, and daily challenge — all in one view.",
    Screen: MiniDashboard,
  },
  {
    id: "tasks",
    tab: "/(tabs)/tasks",
    gradient: ["#001A2E", "#0D1117"] as [string, string],
    accent: Colors.blue,
    title: "Smart Task Manager",
    subtitle: "Organize with precision",
    description: "Add tasks across Work, Health, and Learning — the AI prioritizes your day.",
    Screen: MiniTasks,
  },
  {
    id: "insights",
    tab: "/(tabs)/insights",
    gradient: ["#160D24", "#0D1117"] as [string, string],
    accent: Colors.purple,
    title: "AI Productivity Insights",
    subtitle: "Know your patterns",
    description: "GPT-5 reads your tasks and delivers daily insights — charts, trends, and honest advice.",
    Screen: MiniInsights,
  },
  {
    id: "agent",
    tab: "/(tabs)/",
    gradient: ["#1A1000", "#0D1117"] as [string, string],
    accent: "#F59E0B",
    title: "Tonic AI Agent",
    subtitle: "Talk to get things done",
    description: 'Say "Add workout today" and it\'s done. Ask for a plan, a report, or a nudge.',
    Screen: MiniAgent,
  },
  {
    id: "profile",
    tab: "/(tabs)/",
    gradient: ["#001A0E", "#0D1117"] as [string, string],
    accent: Colors.success,
    title: "Achievements & TON",
    subtitle: "Rank up. Go on-chain.",
    description: "Unlock achievements, climb 10 ranks to Mythic, and earn $TONIC on the TON blockchain.",
    Screen: MiniProfile,
  },
];

function StepIndicator({ total, current, accent }: { total: number; current: number; accent: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 6, justifyContent: "center", marginBottom: 18 }}>
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === current;
        const isPast = i < current;
        return (
          <View
            key={i}
            style={{
              height: 4,
              width: isActive ? 28 : 8,
              borderRadius: 2,
              backgroundColor: isActive ? accent : isPast ? `${accent}50` : "rgba(255,255,255,0.15)",
            }}
          />
        );
      })}
    </View>
  );
}

function FloatingParticle({ color, delay, x }: { color: string; delay: number; x: number }) {
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const size = useRef(Math.random() * 4 + 2).current;
  const { height: H } = useWindowDimensions();

  useEffect(() => {
    const run = () => {
      y.setValue(0);
      opacity.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(y, { toValue: -H * 0.5, duration: 3000 + Math.random() * 2000, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.6, duration: 400, useNativeDriver: true }),
            Animated.delay(1800),
            Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => run());
    };
    run();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x,
        bottom: 60,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY: y }],
      }}
    />
  );
}

export function AppTour({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const { width: W, height: H } = useWindowDimensions();

  const slideAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const screenAnim = useRef(new Animated.Value(0)).current;

  const isLargeScreen = W >= 768;
  const cardWidth = isLargeScreen ? Math.min(440, W * 0.6) : W - 36;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 8, tension: 55, useNativeDriver: true }),
      Animated.spring(screenAnim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const transitionToStep = useCallback((nextStep: number) => {
    screenAnim.setValue(0);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -30, duration: 180, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0.7, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(30);
      const next = STEPS[nextStep];
      if (next?.tab) {
        try { router.push(next.tab as any); } catch {}
      }
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(screenAnim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  useEffect(() => {
    screenAnim.setValue(0);
    Animated.spring(screenAnim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }).start();
    const s = STEPS[step];
    if (s?.tab) {
      try { router.push(s.tab as any); } catch {}
    }
  }, []);

  const advance = useCallback(() => {
    if (step < STEPS.length - 1) {
      transitionToStep(step + 1);
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(cardScale, { toValue: 0.9, duration: 250, useNativeDriver: true }),
      ]).start(() => onDone());
    }
  }, [step, onDone, transitionToStep]);

  const skip = useCallback(() => {
    Animated.timing(overlayOpacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => onDone());
  }, [onDone]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const { Screen } = current;

  const screenScale = screenAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] });
  const screenOpacity = screenAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.overlay, { opacity: overlayOpacity }]}
      pointerEvents="box-none"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <FloatingParticle
          key={i}
          color={current.accent}
          delay={(i * 300) % 2000}
          x={(W / 8) * i + 10}
        />
      ))}

      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={advance} />

      <TouchableOpacity
        style={styles.skipBtn}
        onPress={skip}
        hitSlop={{ top: 14, right: 14, bottom: 14, left: 14 }}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={[styles.centered, { paddingHorizontal: isLargeScreen ? 0 : 18 }]} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            {
              width: cardWidth,
              transform: [{ scale: cardScale }, { translateX: slideAnim }],
            },
          ]}
          pointerEvents="box-none"
        >
          <LinearGradient
            colors={current.gradient}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={[styles.cardBorder, { borderColor: `${current.accent}35` }]} />

          <StepIndicator total={STEPS.length} current={step} accent={current.accent} />

          <Text style={[styles.subtitle, { color: current.accent }]}>{current.subtitle}</Text>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.description}>{current.description}</Text>

          <Animated.View
            style={[
              styles.mockWrap,
              { borderColor: `${current.accent}25`, transform: [{ scale: screenScale }], opacity: screenOpacity },
            ]}
            pointerEvents="none"
          >
            <Screen accent={current.accent} />
          </Animated.View>

          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: current.accent }]}
            onPress={advance}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>
              {isLast ? "Start My Journey 🚀" : "Next"}
            </Text>
            {!isLast && <ChevronRight size={16} color="#0D1117" />}
          </TouchableOpacity>

          <Text style={styles.tapHint}>or tap anywhere to continue</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const mini = StyleSheet.create({
  screen: {
    backgroundColor: "#0D1117",
    borderRadius: 12,
    overflow: "hidden",
    flex: 1,
    padding: 10,
    gap: 7,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  screenTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E6EDF3",
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
  },
  pill: {
    height: 8,
    borderRadius: 4,
  },
  line: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  row: {
    flexDirection: "row",
    gap: 6,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8,
    borderWidth: 1,
    padding: 6,
    alignItems: "center",
    gap: 2,
  },
  statVal: {
    fontSize: 10,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 7,
    color: "rgba(255,255,255,0.4)",
  },
  chatBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  chatText: {
    flex: 1,
    fontSize: 9,
  },
  sendBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    marginTop: "auto",
    paddingTop: 6,
    marginHorizontal: -10,
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 2,
  },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  catText: {
    fontSize: 7,
    fontWeight: "600",
  },
  catDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 8,
    padding: 7,
  },
  checkbox: {
    width: 13,
    height: 13,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  chartWrap: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    gap: 4,
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    height: 40,
  },
  barCol: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bar: {
    borderRadius: 3,
    minHeight: 3,
  },
  chartLabel: {
    fontSize: 7,
    fontWeight: "600",
    textAlign: "center",
  },
  insightCard: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
  },
  chatArea: {
    flex: 1,
    gap: 6,
  },
  msgUser: {
    alignSelf: "flex-end",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    maxWidth: "80%",
  },
  msgBot: {
    alignSelf: "flex-start",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    maxWidth: "85%",
    gap: 2,
  },
  msgText: {
    fontSize: 8,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 11,
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 7,
    fontWeight: "700",
  },
  walletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  iconBtn: {
    width: 22,
    height: 22,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
});

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(0,0,0,0.86)",
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  centered: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  skipBtn: {
    position: "absolute",
    top: 56,
    right: 20,
    paddingVertical: 7,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    zIndex: 1001,
  },
  skipText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    borderRadius: 26,
    padding: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 24,
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    borderWidth: 1,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    textAlign: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 21,
    fontWeight: "800",
    color: "#E6EDF3",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 13,
    color: "#8B949E",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 14,
  },
  mockWrap: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
    height: 200,
    backgroundColor: "#0D1117",
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  nextBtnText: {
    color: "#0D1117",
    fontSize: 15,
    fontWeight: "800",
  },
  tapHint: {
    textAlign: "center",
    fontSize: 10,
    color: "rgba(255,255,255,0.25)",
    fontWeight: "500",
  },
});
