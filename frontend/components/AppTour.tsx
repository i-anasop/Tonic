import { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Platform,
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
} from "lucide-react-native";
import { Colors } from "@/constants/colors";

const TOUR_KEY = "@tonic_tour_v7_seen";

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

const STEPS = [
  {
    id: "welcome",
    tab: "/(tabs)/",
    gradient: ["#1A1200", "#0D1117"] as [string, string],
    accent: Colors.gold,
    icon: Zap,
    title: "Welcome to Tonic AI",
    subtitle: "Your AI-powered productivity hub",
    description: "An intelligent workspace where AI meets blockchain. Complete tasks, earn achievements, and build streaks that matter.",
    features: [
      { icon: Bot, text: "AI Agent that creates & manages tasks for you" },
      { icon: Shield, text: "Achievements recorded on TON blockchain" },
      { icon: Flame, text: "Daily streak system to keep you motivated" },
    ],
    tabLabel: "Dashboard",
    tabIcon: LayoutDashboard,
  },
  {
    id: "tasks",
    tab: "/(tabs)/tasks",
    gradient: ["#001A2E", "#0D1117"] as [string, string],
    accent: Colors.blue,
    icon: ListTodo,
    title: "Smart Task Manager",
    subtitle: "Organize with precision",
    description: "Create tasks across Work, Personal, Health, and Learning — then let the AI prioritize and schedule your day automatically.",
    features: [
      { icon: Target, text: "4 categories with smart color-coding" },
      { icon: CheckCircle, text: "One tap to complete and earn XP points" },
      { icon: TrendingUp, text: "Priority levels: high, medium, low" },
    ],
    tabLabel: "Tasks",
    tabIcon: ListTodo,
  },
  {
    id: "insights",
    tab: "/(tabs)/insights",
    gradient: ["#160D24", "#0D1117"] as [string, string],
    accent: Colors.purple,
    icon: Sparkles,
    title: "AI Productivity Insights",
    subtitle: "Know your patterns",
    description: "GPT-5 analyzes your actual task data and delivers daily personalized insights — no generic advice, only what applies to you.",
    features: [
      { icon: Brain, text: "Real-time AI analysis of your tasks & habits" },
      { icon: TrendingUp, text: "Weekly charts showing your completion trend" },
      { icon: Sparkles, text: "Actionable suggestions, not just pretty graphs" },
    ],
    tabLabel: "Insights",
    tabIcon: Sparkles,
  },
  {
    id: "agent",
    tab: "/(tabs)/",
    gradient: ["#1A1000", "#0D1117"] as [string, string],
    accent: "#F59E0B",
    icon: Bot,
    title: "Tonic AI Agent",
    subtitle: "Your intelligent assistant",
    description: 'Chat naturally to create tasks, plan your day, or get a productivity analysis. Just say "Add a workout task for tomorrow" and it\'s done.',
    features: [
      { icon: Zap, text: "Creates & completes tasks through conversation" },
      { icon: Target, text: "Plans your full day based on pending work" },
      { icon: Brain, text: "Provides honest, data-backed productivity reports" },
    ],
    tabLabel: "AI Agent (⚡ button)",
    tabIcon: Bot,
  },
  {
    id: "profile",
    tab: "/(tabs)/profile",
    gradient: ["#001A0E", "#0D1117"] as [string, string],
    accent: Colors.success,
    icon: Trophy,
    title: "Achievements & TON Rewards",
    subtitle: "Earn. Rank up. Go on-chain.",
    description: "Complete tasks to unlock 40+ achievements, climb from Rookie to Mythic, and permanently record your productivity proof on the TON blockchain.",
    features: [
      { icon: Trophy, text: "10 rank levels from Rookie to Mythic" },
      { icon: Shield, text: "Claim points on-chain with TON wallet" },
      { icon: Sparkles, text: "2× point multiplier when wallet is connected" },
    ],
    tabLabel: "Profile",
    tabIcon: User,
  },
];

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

function FeatureRow({ icon: Icon, text, accent, index }: { icon: any; text: string; accent: string; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 380,
      delay: 200 + index * 100,
      useNativeDriver: true,
    }).start();
  }, [text]);

  return (
    <Animated.View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 10,
        opacity: anim,
        transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
      }}
    >
      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${accent}20`, justifyContent: "center", alignItems: "center", marginTop: 1 }}>
        <Icon size={13} color={accent} />
      </View>
      <Text style={{ flex: 1, fontSize: 13, color: "#C9D1D9", lineHeight: 20 }}>{text}</Text>
    </Animated.View>
  );
}

function StepIndicator({ total, current, accent }: { total: number; current: number; accent: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 6, justifyContent: "center", marginBottom: 24 }}>
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

function TabHighlight({ label, Icon, accent }: { label: string; Icon: any; accent: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.12, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
    ])).start();
  }, [label]);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 6 }}>
      <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: "500" }}>Find it in the</Text>
      <Animated.View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          backgroundColor: `${accent}20`,
          borderWidth: 1,
          borderColor: `${accent}50`,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 20,
          transform: [{ scale: pulse }],
        }}
      >
        <Icon size={11} color={accent} />
        <Text style={{ fontSize: 11, fontWeight: "700", color: accent }}>{label}</Text>
      </Animated.View>
      <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: "500" }}>tab</Text>
    </View>
  );
}

export function AppTour({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const { width: W, height: H } = useWindowDimensions();

  const slideAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const isLargeScreen = W >= 768;
  const cardWidth = isLargeScreen ? Math.min(480, W * 0.6) : W - 40;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 8, tension: 55, useNativeDriver: true }),
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0, duration: 1600, useNativeDriver: true }),
    ])).start();
  }, []);

  const transitionToStep = useCallback((nextStep: number) => {
    iconAnim.setValue(0);
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
        Animated.spring(iconAnim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  useEffect(() => {
    iconAnim.setValue(0);
    Animated.spring(iconAnim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }).start();
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
  const StepIcon = current.icon;
  const TabIcon = current.tabIcon;

  const iconScale = iconAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.overlay, { opacity: overlayOpacity }]}
      pointerEvents="box-none"
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <FloatingParticle
          key={i}
          color={current.accent}
          delay={(i * 300) % 2000}
          x={(W / 10) * i + 10}
        />
      ))}

      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={advance} />

      <TouchableOpacity
        style={styles.skipBtn}
        onPress={skip}
        hitSlop={{ top: 14, right: 14, bottom: 14, left: 14 }}
      >
        <Text style={styles.skipText}>Skip tour</Text>
      </TouchableOpacity>

      <View style={[styles.centered, { paddingHorizontal: isLargeScreen ? 0 : 20 }]} pointerEvents="box-none">
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
          <View style={[styles.cardBorder, { borderColor: `${current.accent}30` }]} />

          <StepIndicator total={STEPS.length} current={step} accent={current.accent} />

          <View style={styles.iconWrap}>
            <Animated.View
              style={[
                styles.iconGlow,
                {
                  backgroundColor: current.accent,
                  opacity: glowOpacity,
                  transform: [{ scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.iconOrb,
                {
                  backgroundColor: `${current.accent}20`,
                  borderColor: `${current.accent}45`,
                  transform: [{ scale: iconScale }],
                },
              ]}
            >
              <StepIcon size={34} color={current.accent} />
            </Animated.View>
          </View>

          <Text style={[styles.subtitle, { color: current.accent }]}>{current.subtitle}</Text>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.description}>{current.description}</Text>

          <View style={styles.divider} />

          <View style={styles.featureList}>
            {current.features.map((f, i) => (
              <FeatureRow key={i} icon={f.icon} text={f.text} accent={current.accent} index={i} />
            ))}
          </View>

          <TabHighlight label={current.tabLabel} Icon={TabIcon} accent={current.accent} />

          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: current.accent }]}
            onPress={advance}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>
              {isLast ? "Start Productivity Journey 🚀" : "Next"}
            </Text>
            {!isLast && <ChevronRight size={16} color="#0D1117" />}
          </TouchableOpacity>

          <Text style={styles.tapHint}>or tap anywhere to continue</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(0,0,0,0.82)",
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
    borderRadius: 28,
    padding: 26,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 24,
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    height: 90,
  },
  iconGlow: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.4,
  },
  iconOrb: {
    width: 74,
    height: 74,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    textAlign: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#E6EDF3",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    color: "#8B949E",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginBottom: 16,
  },
  featureList: {
    marginBottom: 18,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 15,
    borderRadius: 16,
    marginTop: 4,
    marginBottom: 10,
  },
  nextBtnText: {
    color: "#0D1117",
    fontSize: 15,
    fontWeight: "800",
  },
  tapHint: {
    textAlign: "center",
    fontSize: 11,
    color: "rgba(255,255,255,0.28)",
    fontWeight: "500",
  },
});
