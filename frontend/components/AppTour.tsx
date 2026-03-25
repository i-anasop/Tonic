import { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  LayoutDashboard,
  ListTodo,
  Sparkles,
  Bot,
  Trophy,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/colors";

const TOUR_KEY = "@tonic_tour_v9_seen";

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

const SPOT_R = 52;

const STEPS = [
  {
    id: "dashboard",
    Icon: LayoutDashboard,
    accent: Colors.gold,
    title: "Your hub",
    desc: "Stats, AI chat, and daily tasks — all here.",
    cxRatio: 0.5,
    cyRatio: 0.30,
    tooltipBelow: true,
  },
  {
    id: "agent",
    Icon: Bot,
    accent: "#F59E0B",
    title: "Your AI",
    desc: "Tap the button to add tasks or ask anything.",
    cxRatio: 0.82,
    cyRatio: 0.82,
    tooltipBelow: false,
  },
  {
    id: "tasks",
    Icon: ListTodo,
    accent: Colors.blue,
    title: "Task manager",
    desc: "Create and organize with AI priority.",
    cxRatio: 0.26,
    cyRatio: 0.935,
    tooltipBelow: false,
  },
  {
    id: "insights",
    Icon: Sparkles,
    accent: Colors.purple,
    title: "AI insights",
    desc: "GPT-5 reads your habits and guides you.",
    cxRatio: 0.50,
    cyRatio: 0.935,
    tooltipBelow: false,
  },
  {
    id: "achievements",
    Icon: Trophy,
    accent: Colors.success,
    title: "Rank up",
    desc: "Unlock achievements and earn $TONIC on TON.",
    cxRatio: 0.75,
    cyRatio: 0.935,
    tooltipBelow: false,
  },
];

function RippleRing({ accent, delay, size }: { accent: string; delay: number; size: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const run = () => {
      scale.setValue(1);
      opacity.setValue(0.7);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, { toValue: 2.4, duration: 1200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ]),
      ]).start(() => run());
    };
    run();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: accent,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

function HandPointer({ accent, below }: { accent: string; below: boolean }) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -10, duration: 480, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 480, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.Text
      style={{
        fontSize: 28,
        transform: [{ translateY: bounce }],
        textShadowColor: accent,
        textShadowRadius: 10,
        textShadowOffset: { width: 0, height: 0 },
      }}
    >
      {below ? "👆" : "👇"}
    </Animated.Text>
  );
}

export function AppTour({ onDone }: { onDone: () => void }) {
  const { width: W, height: H } = useWindowDimensions();
  const [step, setStep] = useState(0);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const spotScale = useRef(new Animated.Value(0)).current;
  const spotOpacity = useRef(new Animated.Value(0)).current;
  const tooltipY = useRef(new Animated.Value(20)).current;
  const tooltipOpacity = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    spotScale.setValue(0.4);
    spotOpacity.setValue(0);
    tooltipY.setValue(16);
    tooltipOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(spotScale, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
      Animated.timing(spotOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(tooltipOpacity, { toValue: 1, duration: 340, useNativeDriver: true }),
      Animated.spring(tooltipY, { toValue: 0, friction: 8, tension: 70, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(overlayOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start(() => {
      animateIn();
    });
  }, []);

  const goNext = useCallback(() => {
    Animated.parallel([
      Animated.timing(spotOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(tooltipOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      if (step < STEPS.length - 1) {
        setStep((s) => s + 1);
        animateIn();
      } else {
        Animated.timing(overlayOpacity, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => onDone());
      }
    });
  }, [step, animateIn, onDone]);

  const skip = useCallback(() => {
    Animated.timing(overlayOpacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => onDone());
  }, [onDone]);

  const cur = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const cx = cur.cxRatio * W;
  const cy = cur.cyRatio * H;

  const tooltipLeft = Math.max(16, Math.min(cx - 140, W - 296));
  const tooltipBelow = cur.tooltipBelow;
  const tooltipTop = tooltipBelow ? cy + SPOT_R + 52 : cy - SPOT_R - 130;
  const handTop = tooltipBelow ? cy + SPOT_R + 10 : cy - SPOT_R - 46;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity: overlayOpacity, zIndex: 9999 }]}
      pointerEvents="box-none"
    >
      {/* Dark overlay */}
      <TouchableOpacity
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(5,7,12,0.82)" }]}
        activeOpacity={1}
        onPress={goNext}
      />

      {/* Spotlight */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: cx - SPOT_R,
          top: cy - SPOT_R,
          width: SPOT_R * 2,
          height: SPOT_R * 2,
          borderRadius: SPOT_R,
          justifyContent: "center",
          alignItems: "center",
          opacity: spotOpacity,
          transform: [{ scale: spotScale }],
        }}
      >
        {/* Ripple rings */}
        <RippleRing accent={cur.accent} delay={0} size={SPOT_R * 2} />
        <RippleRing accent={cur.accent} delay={500} size={SPOT_R * 2} />

        {/* Core spotlight */}
        <View
          style={{
            width: SPOT_R * 2,
            height: SPOT_R * 2,
            borderRadius: SPOT_R,
            backgroundColor: `${cur.accent}22`,
            borderWidth: 2.5,
            borderColor: cur.accent,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: cur.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 22,
            elevation: 20,
          }}
        >
          <cur.Icon size={28} color={cur.accent} />
        </View>
      </Animated.View>

      {/* Hand pointer */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: cx - 18,
          top: handTop,
          opacity: spotOpacity,
        }}
      >
        <HandPointer accent={cur.accent} below={!tooltipBelow} />
      </Animated.View>

      {/* Tooltip */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: tooltipLeft,
          top: tooltipTop,
          width: 280,
          opacity: tooltipOpacity,
          transform: [{ translateY: tooltipY }],
        }}
      >
        <View
          style={{
            backgroundColor: "#12151F",
            borderRadius: 18,
            borderWidth: 1.5,
            borderColor: `${cur.accent}50`,
            padding: 16,
            shadowColor: cur.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: "800", color: cur.accent, marginBottom: 4 }}>
            {cur.title}
          </Text>
          <Text style={{ fontSize: 13, color: "rgba(230,237,243,0.75)", lineHeight: 19 }}>
            {cur.desc}
          </Text>
        </View>
      </Animated.View>

      {/* Step dots */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: 38,
          left: 0,
          right: 0,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 7,
          opacity: overlayOpacity,
        }}
      >
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === step ? 22 : 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: i === step ? cur.accent : "rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </Animated.View>

      {/* Skip button */}
      <Animated.View
        style={{
          position: "absolute",
          top: 54,
          right: 20,
          opacity: overlayOpacity,
        }}
      >
        <TouchableOpacity
          onPress={skip}
          hitSlop={{ top: 14, right: 14, bottom: 14, left: 14 }}
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
          }}
        >
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "600" }}>
            Skip
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Next / Done button */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 90,
          right: 20,
          opacity: tooltipOpacity,
        }}
      >
        <TouchableOpacity
          onPress={goNext}
          style={{
            backgroundColor: cur.accent,
            borderRadius: 24,
            paddingHorizontal: 22,
            paddingVertical: 12,
            shadowColor: cur.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 12,
            elevation: 8,
          }}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 14, fontWeight: "800", color: "#0D1117" }}>
            {isLast ? "Let's go 🚀" : "Next"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}
