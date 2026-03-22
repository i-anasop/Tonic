import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { ChevronRight, X } from "lucide-react-native";
import { Colors } from "@/constants/colors";

const { width: W, height: H } = Dimensions.get("window");
const TOUR_KEY = "@tonic_tour_v5_seen";

interface Spotlight {
  x: number;
  y: number;
  w: number;
  h: number;
  round?: number;
  tipBelow: boolean;
}

interface TourStep {
  id: string;
  tab: string | null;
  emoji: string;
  accent: string;
  title: string;
  tip: string;
  getSpot: (W: number, H: number, topInset: number) => Spotlight;
}

// 4 tabs: Dashboard (0), Tasks (1), Insights (2), Profile (3)
// Tab center x = W/8 + tabIndex * W/4
const TAB_CX = (W: number, i: number) => W / 8 + i * (W / 4);

const STEPS: TourStep[] = [
  {
    id: "dashboard",
    tab: "/(tabs)/",
    emoji: "📊",
    accent: Colors.blue,
    title: "Your daily hub",
    tip: "Streak, score & today's task overview — all at a glance",
    getSpot: (W, H, top) => ({
      x: 12,
      y: top,
      w: W - 24,
      h: H * 0.50,
      round: 18,
      tipBelow: true,
    }),
  },
  {
    id: "add_task",
    tab: "/(tabs)/",
    emoji: "➕",
    accent: Colors.gold,
    title: "Add a task",
    tip: "Tap the + button in the top-right to create a new task",
    getSpot: (W, _H, top) => ({
      x: W - 58,
      y: top + 8,
      w: 44,
      h: 44,
      round: 14,
      tipBelow: true,
    }),
  },
  {
    id: "agent",
    tab: "/(tabs)/tasks",
    emoji: "🤖",
    accent: Colors.gold,
    title: "Your AI agent",
    tip: "Tap the gold bot button — chat, plan your day, or add tasks by voice",
    getSpot: (W, H) => ({
      x: W - 80,
      y: H - 154,
      w: 56,
      h: 56,
      round: 28,
      tipBelow: false,
    }),
  },
  {
    id: "insights",
    tab: "/(tabs)/insights",
    emoji: "✨",
    accent: Colors.purple,
    title: "AI Insights",
    tip: "GPT-5 analyzes your work patterns — real insights, no fluff",
    getSpot: (W, H) => ({
      x: TAB_CX(W, 2) - 32,
      y: H - 80,
      w: 64,
      h: 80,
      round: 10,
      tipBelow: false,
    }),
  },
  {
    id: "profile",
    tab: "/(tabs)/profile",
    emoji: "⛓️",
    accent: Colors.success,
    title: "Earn on TON",
    tip: "Complete tasks → unlock achievements → claim points on the blockchain",
    getSpot: (W, H) => ({
      x: TAB_CX(W, 3) - 32,
      y: H - 80,
      w: 64,
      h: 80,
      round: 10,
      tipBelow: false,
    }),
  },
];

const PAD = 10;

function SpotlightFrame({
  spot,
  accent,
}: {
  spot: Spotlight;
  accent: string;
}) {
  const sx = spot.x - PAD;
  const sy = spot.y - PAD;
  const sw = spot.w + PAD * 2;
  const sh = spot.h + PAD * 2;
  const round = (spot.round ?? 12) + PAD;
  const dark = "rgba(0,0,0,0.82)";
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();
  }, []);

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [accent + "88", accent + "ff"],
  });
  const shadowRadius = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 20],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Top dark bar */}
      <View
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: sy, backgroundColor: dark }}
      />
      {/* Bottom dark bar */}
      <View
        style={{ position: "absolute", top: sy + sh, left: 0, right: 0, bottom: 0, backgroundColor: dark }}
      />
      {/* Left dark bar */}
      <View
        style={{ position: "absolute", top: sy, left: 0, width: sx, height: sh, backgroundColor: dark }}
      />
      {/* Right dark bar */}
      <View
        style={{ position: "absolute", top: sy, left: sx + sw, right: 0, height: sh, backgroundColor: dark }}
      />
      {/* Glowing border */}
      <Animated.View
        style={{
          position: "absolute",
          top: sy,
          left: sx,
          width: sw,
          height: sh,
          borderRadius: round,
          borderWidth: 2,
          borderColor,
          shadowColor: accent,
          shadowRadius,
          shadowOpacity: 0.9,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
    </View>
  );
}

function Tooltip({
  step,
  spot,
  stepIdx,
  total,
  onNext,
  onSkip,
}: {
  step: TourStep;
  spot: Spotlight;
  stepIdx: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(spot.tipBelow ? 14 : -14)).current;

  useEffect(() => {
    fade.setValue(0);
    slideY.setValue(spot.tipBelow ? 14 : -14);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 280,
        useNativeDriver: false,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideY, {
        toValue: 0,
        duration: 280,
        useNativeDriver: false,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, [stepIdx]);

  const sx = spot.x - PAD;
  const sy = spot.y - PAD;
  const sw = spot.w + PAD * 2;
  const sh = spot.h + PAD * 2;
  const CARD_H = 120;
  const MARGIN = 14;

  let top: number;
  if (spot.tipBelow) {
    top = sy + sh + MARGIN;
  } else {
    top = Math.max(16, sy - CARD_H - MARGIN);
  }

  const cardLeft = Math.max(16, Math.min(sx + sw / 2 - (W - 32) / 2, W - 16 - (W - 32)));

  return (
    <Animated.View
      style={[
        styles.tooltip,
        {
          top,
          left: cardLeft,
          right: 16 - cardLeft < 0 ? 16 : undefined,
          width: W - 32,
          opacity: fade,
          transform: [{ translateY: slideY }],
        },
      ]}
    >
      {/* Header row */}
      <View style={styles.ttHeader}>
        <View style={[styles.ttEmojiBox, { backgroundColor: step.accent + "18", borderColor: step.accent + "44" }]}>
          <Text style={styles.ttEmoji}>{step.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.ttTitle}>{step.title}</Text>
          <Text style={styles.ttTip}>{step.tip}</Text>
        </View>
        <TouchableOpacity onPress={onSkip} style={styles.ttClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <X size={13} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Progress + Next */}
      <View style={styles.ttFooter}>
        <View style={styles.ttDots}>
          {Array.from({ length: total }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.ttDot,
                i === stepIdx
                  ? { width: 16, backgroundColor: step.accent }
                  : { width: 6, backgroundColor: Colors.border },
              ]}
            />
          ))}
        </View>
        <TouchableOpacity
          style={[styles.ttNext, { backgroundColor: step.accent }]}
          onPress={onNext}
          activeOpacity={0.85}
        >
          <Text style={styles.ttNextText}>{stepIdx === total - 1 ? "Done" : "Next"}</Text>
          {stepIdx < total - 1 && <ChevronRight size={14} color={Colors.bgPrimary} />}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export function AppTour({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stepIdx, setStepIdx] = useState(0);
  const overlayFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const step = STEPS[0];
    if (step.tab) {
      try { router.replace(step.tab as any); } catch {}
    }
    Animated.timing(overlayFade, {
      toValue: 1,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, []);

  const handleNext = useCallback(() => {
    const nextIdx = stepIdx + 1;
    if (nextIdx >= STEPS.length) {
      Animated.timing(overlayFade, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start(() => onDone());
      return;
    }
    const nextStep = STEPS[nextIdx];
    if (nextStep.tab && nextStep.tab !== STEPS[stepIdx].tab) {
      try { router.replace(nextStep.tab as any); } catch {}
    }
    setStepIdx(nextIdx);
  }, [stepIdx, router, onDone]);

  const handleSkip = useCallback(() => {
    Animated.timing(overlayFade, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => onDone());
  }, [onDone]);

  const step = STEPS[stepIdx];
  const spot = step.getSpot(W, H, insets.top);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: overlayFade, zIndex: 999 }]} pointerEvents="box-none">
      <SpotlightFrame spot={spot} accent={step.accent} />
      <Tooltip
        step={step}
        spot={spot}
        stepIdx={stepIdx}
        total={STEPS.length}
        onNext={handleNext}
        onSkip={handleSkip}
      />
    </Animated.View>
  );
}

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

const styles = StyleSheet.create({
  tooltip: {
    position: "absolute",
    backgroundColor: Colors.bgSecondary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 16,
    gap: 12,
    zIndex: 1000,
  },
  ttHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ttEmojiBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  ttEmoji: {
    fontSize: 20,
  },
  ttTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  ttTip: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  ttClose: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.bgTertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  ttFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ttDots: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  ttDot: {
    height: 6,
    borderRadius: 3,
  },
  ttNext: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  ttNextText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.bgPrimary,
  },
});
