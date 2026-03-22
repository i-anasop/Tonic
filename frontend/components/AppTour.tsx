import { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/colors";

const TOUR_KEY = "@tonic_tour_v6_seen";

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

const { width: W } = Dimensions.get("window");

const STEPS = [
  {
    id: "dashboard",
    tab: "/(tabs)/",
    emoji: "📊",
    title: "Dashboard",
    tip: "Track your streak, score and tasks at a glance",
  },
  {
    id: "tasks",
    tab: "/(tabs)/tasks",
    emoji: "✅",
    title: "Tasks",
    tip: "Create and complete tasks to build your streak",
  },
  {
    id: "insights",
    tab: "/(tabs)/insights",
    emoji: "✨",
    title: "AI Insights",
    tip: "Your AI agent analyzes patterns and guides your day",
  },
  {
    id: "profile",
    tab: "/(tabs)/profile",
    emoji: "⛓️",
    title: "TON Rewards",
    tip: "Earn achievements and claim points on-chain",
  },
];

export function AppTour({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(40)).current;

  const animateIn = useCallback(() => {
    cardY.setValue(40);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(cardY, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  }, [opacity, cardY]);

  useEffect(() => {
    animateIn();
    const s = STEPS[step];
    if (s?.tab) {
      try { router.push(s.tab as any); } catch {}
    }
  }, [step, animateIn]);

  const advance = useCallback(() => {
    if (step < STEPS.length - 1) {
      opacity.setValue(0);
      setStep((p) => p + 1);
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => onDone());
    }
  }, [step, opacity, onDone]);

  const skip = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => onDone());
  }, [opacity, onDone]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { opacity }]} pointerEvents="box-none">
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={advance} />

      {/* Skip */}
      <TouchableOpacity style={styles.skip} onPress={skip} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Card */}
      <Animated.View style={[styles.card, { transform: [{ translateY: cardY }] }]} pointerEvents="box-none">
        <Text style={styles.emoji}>{current.emoji}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.tip}>{current.tip}</Text>

        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={advance} activeOpacity={0.85}>
          <Text style={styles.nextText}>{isLast ? "Get started" : "Next"}</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(0,0,0,0.70)",
    zIndex: 999,
    justifyContent: "flex-end",
    paddingBottom: 104,
  },
  skip: {
    position: "absolute",
    top: 56,
    right: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    zIndex: 1000,
  },
  skipText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: "#161B22",
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 16,
  },
  emoji: {
    fontSize: 38,
    marginBottom: 10,
  },
  title: {
    fontSize: 21,
    fontWeight: "700",
    color: "#E6EDF3",
    marginBottom: 6,
    textAlign: "center",
  },
  tip: {
    fontSize: 14,
    color: "#8B949E",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 22,
    maxWidth: W - 96,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 20,
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dotActive: {
    backgroundColor: Colors.gold,
    width: 18,
  },
  nextBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 13,
    paddingHorizontal: 40,
    borderRadius: 14,
    alignSelf: "stretch",
    alignItems: "center",
  },
  nextText: {
    color: "#0D1117",
    fontSize: 15,
    fontWeight: "700",
  },
});
