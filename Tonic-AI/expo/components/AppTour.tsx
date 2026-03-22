import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Plus, ChevronRight, X } from "lucide-react-native";
import { Colors } from "@/constants/colors";

const { width: W } = Dimensions.get("window");
const TOUR_KEY = "@tonic_tour_v2_seen";

/* ── Step definitions ── */
interface TourStep {
  id: string;
  tab: string | null;
  emoji: string;
  accent: string;
  title: string;
  desc: string;
  action?: "add_task" | "open_agent";
  actionLabel?: string;
}

const STEPS: TourStep[] = [
  {
    id: "dashboard",
    tab: "/(tabs)/",
    emoji: "🏠",
    accent: Colors.blue,
    title: "Your Dashboard",
    desc: "See today's progress, streak, and AI highlights — all in one place.",
  },
  {
    id: "add_task",
    tab: "/(tabs)/",
    emoji: "➕",
    accent: Colors.gold,
    title: "Add your first task",
    desc: "Hit the + button at top-right — or tap below to create one now.",
    action: "add_task",
    actionLabel: "Create a task →",
  },
  {
    id: "tasks",
    tab: "/(tabs)/tasks",
    emoji: "✅",
    accent: Colors.success,
    title: "Task list",
    desc: "All tasks sorted by priority. Swipe to complete, long-press for options.",
  },
  {
    id: "agent",
    tab: "/(tabs)/tasks",
    emoji: "🤖",
    accent: Colors.purple,
    title: "Tonic Agent",
    desc: "Your AI assistant lives in the ⚡ button — bottom right, always there.",
    action: "open_agent",
    actionLabel: "Chat with AI →",
  },
  {
    id: "insights",
    tab: "/(tabs)/insights",
    emoji: "📊",
    accent: Colors.warning,
    title: "Insights",
    desc: "AI analyzes your habits and gives honest feedback on your productivity.",
  },
  {
    id: "profile",
    tab: "/(tabs)/profile",
    emoji: "⛓️",
    accent: Colors.gold,
    title: "Earn & Claim",
    desc: "Complete tasks → earn points → claim them on TON blockchain forever.",
  },
];

/* ── Welcome splash (step 0) ── */
function WelcomeSplash({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }),
    ]).start();
  }, [fade, scale]);

  return (
    <Animated.View style={[splash.overlay, { opacity: fade }]}>
      <Animated.View style={[splash.card, { transform: [{ scale }] }]}>
        <TouchableOpacity style={splash.skipBtn} onPress={onSkip} activeOpacity={0.7}>
          <X size={16} color={Colors.textMuted} />
        </TouchableOpacity>

        <Text style={splash.emoji}>⚡</Text>
        <Text style={splash.title}>Welcome to Tonic</Text>
        <Text style={splash.sub}>Take a 30-second tour to see how everything works.</Text>

        <View style={splash.bullets}>
          {["Dashboard & daily progress", "Add & organize tasks", "AI agent & insights", "TON blockchain rewards"].map((b, i) => (
            <View key={i} style={splash.bullet}>
              <View style={splash.bulletDot} />
              <Text style={splash.bulletText}>{b}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={splash.startBtn} onPress={onStart} activeOpacity={0.85}>
          <Text style={splash.startText}>Start Tour</Text>
          <ChevronRight size={18} color={Colors.bgPrimary} />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

/* ── Floating bottom coach card ── */
function CoachCard({
  step,
  stepIdx,
  total,
  onNext,
  onSkip,
  onAction,
}: {
  step: TourStep;
  stepIdx: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
  onAction: () => void;
}) {
  const slideUp = useRef(new Animated.Value(120)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    slideUp.setValue(120);
    fade.setValue(0);
    Animated.parallel([
      Animated.spring(slideUp, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [stepIdx, slideUp, fade]);

  const progress = (stepIdx + 1) / total;

  return (
    <>
      {/* Dim overlay — NOT blocking tap-through in the top area */}
      <Animated.View style={[coach.dimOverlay, { opacity: fade }]} pointerEvents="none" />

      <Animated.View
        style={[coach.card, { transform: [{ translateY: slideUp }], opacity: fade }]}
      >
        {/* Progress bar */}
        <View style={coach.progressTrack}>
          <View style={[coach.progressFill, { width: `${progress * 100}%` as any, backgroundColor: step.accent }]} />
        </View>

        {/* Header row */}
        <View style={coach.header}>
          <View style={[coach.emojiWrap, { backgroundColor: `${step.accent}18`, borderColor: `${step.accent}40` }]}>
            <Text style={coach.emoji}>{step.emoji}</Text>
          </View>
          <View style={coach.headerText}>
            <Text style={coach.title}>{step.title}</Text>
            <Text style={coach.stepCount}>{stepIdx + 1} / {total}</Text>
          </View>
          <TouchableOpacity onPress={onSkip} style={coach.closeBtn} activeOpacity={0.7}>
            <X size={15} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={coach.desc}>{step.desc}</Text>

        {/* Buttons */}
        <View style={coach.buttons}>
          {step.action && (
            <TouchableOpacity
              style={[coach.actionBtn, { backgroundColor: `${step.accent}18`, borderColor: `${step.accent}50` }]}
              onPress={onAction}
              activeOpacity={0.8}
            >
              <Text style={[coach.actionText, { color: step.accent }]}>{step.actionLabel}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[coach.nextBtn, { backgroundColor: step.accent }]}
            onPress={onNext}
            activeOpacity={0.85}
          >
            <Text style={coach.nextText}>{stepIdx === total - 1 ? "Done 🎉" : "Next"}</Text>
            {stepIdx < total - 1 && <ChevronRight size={16} color={Colors.bgPrimary} />}
          </TouchableOpacity>
        </View>

        {/* Dot indicators */}
        <View style={coach.dots}>
          {Array.from({ length: total }).map((_, i) => (
            <View
              key={i}
              style={[
                coach.dot,
                i === stepIdx
                  ? [coach.dotActive, { backgroundColor: step.accent, width: 18 }]
                  : coach.dotInactive,
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </>
  );
}

/* ── Main exported component ── */
export function AppTour({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"welcome" | "tour" | "done">("welcome");
  const [stepIdx, setStepIdx] = useState(0);

  const startTour = useCallback(() => {
    setPhase("tour");
    const firstStep = STEPS[0];
    if (firstStep.tab) {
      try { router.replace(firstStep.tab as any); } catch {}
    }
  }, [router]);

  const handleNext = useCallback(() => {
    const nextIdx = stepIdx + 1;
    if (nextIdx >= STEPS.length) {
      onDone();
      return;
    }
    const nextStep = STEPS[nextIdx];
    if (nextStep.tab && nextStep.tab !== STEPS[stepIdx].tab) {
      try { router.replace(nextStep.tab as any); } catch {}
    }
    setStepIdx(nextIdx);
  }, [stepIdx, router, onDone]);

  const handleAction = useCallback(() => {
    const step = STEPS[stepIdx];
    if (step.action === "add_task") {
      try { router.push("/modal" as any); } catch {}
    } else if (step.action === "open_agent") {
      try { router.replace("/(tabs)/agent" as any); } catch {}
    }
  }, [stepIdx, router]);

  if (phase === "welcome") {
    return <WelcomeSplash onStart={startTour} onSkip={onDone} />;
  }

  if (phase === "tour") {
    return (
      <CoachCard
        step={STEPS[stepIdx]}
        stepIdx={stepIdx}
        total={STEPS.length}
        onNext={handleNext}
        onSkip={onDone}
        onAction={handleAction}
      />
    );
  }

  return null;
}

/* ── Storage helpers ── */
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

/* ── Styles ── */
const splash = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.90)",
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    backgroundColor: Colors.bgSecondary,
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24 },
      android: { elevation: 16 },
    }),
  },
  skipBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgTertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: 52,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  sub: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  bullets: {
    gap: 12,
    marginBottom: 28,
  },
  bullet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bulletDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.gold,
  },
  bulletText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.gold,
    borderRadius: 18,
    paddingVertical: 16,
    gap: 6,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  startText: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.bgPrimary,
  },
});

const coach = StyleSheet.create({
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 990,
    bottom: 200,
  },
  card: {
    position: "absolute",
    bottom: 92,
    left: 16,
    right: 16,
    backgroundColor: Colors.bgSecondary,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: 0,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 999,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 16 },
      android: { elevation: 14 },
    }),
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.bgTertiary,
    marginHorizontal: -20,
    marginBottom: 16,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: 22,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  stepCount: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
    fontWeight: "600",
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgTertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  desc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700",
  },
  nextBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  nextText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.bgPrimary,
  },
  dots: {
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    opacity: 1,
  },
  dotInactive: {
    width: 6,
    backgroundColor: Colors.border,
  },
});
