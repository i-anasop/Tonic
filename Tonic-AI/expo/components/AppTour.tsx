import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/colors";

const { width: W, height: H } = Dimensions.get("window");
const TOUR_KEY = "@tonic_tour_v1_seen";

interface Slide {
  id: number;
  emoji: string;
  accentColor: string;
  title: string;
  desc: string;
  visual: React.ReactNode;
}

/* ─── viz StyleSheet MUST be defined before SLIDES ─── */
const viz = StyleSheet.create({
  welcomeWrap: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: 24,
  },
  welcomeGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${Colors.gold}15`,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  welcomeBigEmoji: {
    fontSize: 60,
  },
  welcomeDots: {
    flexDirection: "row",
    gap: 10,
  },
  welcomeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 0.7,
  },
  ringOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  ringProgress: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    transform: [{ rotate: "-40deg" }],
  },
  ringCenter: {
    alignItems: "center",
  },
  ringNum: {
    fontSize: 18,
    fontWeight: "800",
  },
  taskList: {
    width: "100%",
    gap: 12,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgTertiary,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  taskCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  taskCheckMark: {
    color: Colors.bgPrimary,
    fontSize: 12,
    fontWeight: "bold",
  },
  taskLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  taskLabelDone: {
    textDecorationLine: "line-through",
    color: Colors.textMuted,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chatWrap: {
    width: "100%",
    gap: 10,
  },
  chatBubbleUser: {
    alignSelf: "flex-end",
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxWidth: "75%",
  },
  chatBubbleBot: {
    alignSelf: "flex-start",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: Colors.bgTertiary,
    maxWidth: "75%",
  },
  chatTextUser: {
    color: Colors.bgPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  chatTextBot: {
    color: Colors.textPrimary,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
  },
  statEmoji: {
    fontSize: 22,
  },
  statVal: {
    fontSize: 16,
    fontWeight: "800",
  },
  statSub: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  chainWrap: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },
  chainCard: {
    width: "70%",
    borderRadius: 16,
    borderWidth: 2,
    padding: 18,
    alignItems: "center",
    gap: 4,
  },
  chainEmoji: {
    fontSize: 28,
  },
  chainPts: {
    fontSize: 28,
    fontWeight: "800",
  },
  chainLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  chainConnector: {
    alignItems: "center",
    gap: 2,
  },
  chainDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chainLine: {
    width: 2,
    height: 16,
  },
  chainBlock: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    gap: 2,
  },
  chainBlockText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  chainTx: {
    fontSize: 11,
    color: Colors.success,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  slideVisual: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    width: "100%",
  },
  miniStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  miniChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  miniChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
});

/* ─── Mini visual components ─── */

function ProgressRingMini({ color }: { color: string }) {
  return (
    <View style={[viz.ringOuter, { borderColor: `${color}25` }]}>
      <View style={[viz.ringProgress, { borderColor: color, borderRightColor: "transparent", borderBottomColor: "transparent" }]} />
      <View style={viz.ringCenter}>
        <Text style={[viz.ringNum, { color }]}>74%</Text>
      </View>
    </View>
  );
}

function MiniTaskList({ color }: { color: string }) {
  const items = [
    { done: true, label: "Morning run", priority: Colors.success },
    { done: false, label: "Team standup", priority: Colors.danger },
    { done: false, label: "Review PRs", priority: Colors.warning },
  ];
  return (
    <View style={viz.taskList}>
      {items.map((item, i) => (
        <View key={i} style={viz.taskRow}>
          <View style={[viz.taskCheck, item.done && { backgroundColor: color, borderColor: color }]}>
            {item.done && <Text style={viz.taskCheckMark}>✓</Text>}
          </View>
          <Text style={[viz.taskLabel, item.done && viz.taskLabelDone]}>{item.label}</Text>
          <View style={[viz.priorityDot, { backgroundColor: item.priority }]} />
        </View>
      ))}
    </View>
  );
}

function MiniChat({ color }: { color: string }) {
  return (
    <View style={viz.chatWrap}>
      <View style={[viz.chatBubbleUser, { backgroundColor: color }]}>
        <Text style={viz.chatTextUser}>Plan my day 🗓</Text>
      </View>
      <View style={viz.chatBubbleBot}>
        <Text style={viz.chatTextBot}>Here's your top 3 priorities…</Text>
      </View>
      <View style={[viz.chatBubbleUser, { backgroundColor: color, alignSelf: "flex-end", marginTop: 6 }]}>
        <Text style={viz.chatTextUser}>Add a task for me ⚡</Text>
      </View>
    </View>
  );
}

function MiniStats({ color }: { color: string }) {
  const boxes = [
    { emoji: "🔥", val: "7", sub: "streak" },
    { emoji: "📊", val: "82%", sub: "rate" },
    { emoji: "⭐", val: "1,240", sub: "score" },
  ];
  return (
    <View style={viz.statsRow}>
      {boxes.map((b, i) => (
        <View key={i} style={[viz.statBox, { borderColor: `${color}40` }]}>
          <Text style={viz.statEmoji}>{b.emoji}</Text>
          <Text style={[viz.statVal, { color }]}>{b.val}</Text>
          <Text style={viz.statSub}>{b.sub}</Text>
        </View>
      ))}
    </View>
  );
}

function MiniBlockchain({ color }: { color: string }) {
  return (
    <View style={viz.chainWrap}>
      <View style={[viz.chainCard, { borderColor: `${color}60`, backgroundColor: `${color}08` }]}>
        <Text style={viz.chainEmoji}>⚡</Text>
        <Text style={[viz.chainPts, { color }]}>1,240</Text>
        <Text style={viz.chainLabel}>pts claimable</Text>
      </View>
      <View style={viz.chainConnector}>
        <View style={[viz.chainDot, { backgroundColor: color }]} />
        <View style={[viz.chainLine, { backgroundColor: `${color}40` }]} />
        <View style={[viz.chainDot, { backgroundColor: color }]} />
      </View>
      <View style={[viz.chainBlock, { borderColor: `${color}40` }]}>
        <Text style={viz.chainBlockText}>TON Blockchain</Text>
        <Text style={viz.chainTx}>0x7f3a...d91c ✓</Text>
      </View>
    </View>
  );
}

/* ─── Slides (defined after viz + mini components) ─── */

function makeSlides(): Slide[] {
  return [
    {
      id: 1,
      emoji: "⚡",
      accentColor: Colors.gold,
      title: "Welcome to Tonic",
      desc: "AI-powered productivity on TON",
      visual: (
        <View style={viz.welcomeWrap}>
          <View style={[viz.welcomeGlow, { shadowColor: Colors.gold }]}>
            <Text style={viz.welcomeBigEmoji}>⚡</Text>
          </View>
          <View style={viz.welcomeDots}>
            {[Colors.gold, Colors.blue, Colors.purple, Colors.success].map((c, i) => (
              <View key={i} style={[viz.welcomeDot, { backgroundColor: c }]} />
            ))}
          </View>
        </View>
      ),
    },
    {
      id: 2,
      emoji: "🏠",
      accentColor: Colors.blue,
      title: "Dashboard",
      desc: "Daily progress at a glance",
      visual: (
        <View style={viz.slideVisual}>
          <ProgressRingMini color={Colors.blue} />
          <View style={viz.miniStatsRow}>
            {["✅ 12", "🔥 7d", "⚡ 840"].map((s, i) => (
              <View key={i} style={[viz.miniChip, { borderColor: `${Colors.blue}40` }]}>
                <Text style={[viz.miniChipText, { color: Colors.blue }]}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      ),
    },
    {
      id: 3,
      emoji: "✅",
      accentColor: Colors.success,
      title: "Tasks",
      desc: "AI-prioritized, always on time",
      visual: (
        <View style={viz.slideVisual}>
          <MiniTaskList color={Colors.success} />
        </View>
      ),
    },
    {
      id: 4,
      emoji: "🤖",
      accentColor: Colors.purple,
      title: "Tonic Agent",
      desc: "Chat · Plan · Get things done",
      visual: (
        <View style={viz.slideVisual}>
          <MiniChat color={Colors.purple} />
        </View>
      ),
    },
    {
      id: 5,
      emoji: "📊",
      accentColor: Colors.warning,
      title: "Insights",
      desc: "Deep patterns, honest feedback",
      visual: (
        <View style={viz.slideVisual}>
          <MiniStats color={Colors.warning} />
        </View>
      ),
    },
    {
      id: 6,
      emoji: "⛓️",
      accentColor: Colors.gold,
      title: "Earn & Claim",
      desc: "Your score lives on TON forever",
      visual: (
        <View style={viz.slideVisual}>
          <MiniBlockchain color={Colors.gold} />
        </View>
      ),
    },
  ];
}

/* ─── Main AppTour component ─── */

export function AppTour({ onDone }: { onDone: () => void }) {
  const SLIDES = React.useMemo(() => makeSlides(), []);
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotScales = useRef(SLIDES.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const goNext = useCallback(() => {
    if (isLast) { onDone(); return; }

    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -W, duration: 280, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      slideAnim.setValue(W);
      setIdx(prev => {
        const next = prev + 1;
        Animated.parallel([
          Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
        ]).start();
        Animated.sequence([
          Animated.timing(dotScales[next], { toValue: 1.4, duration: 180, useNativeDriver: true }),
          Animated.timing(dotScales[next], { toValue: 1, duration: 180, useNativeDriver: true }),
        ]).start();
        return next;
      });
    });
  }, [isLast, onDone, slideAnim, fadeAnim, scaleAnim, dotScales]);

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.skipBtn} onPress={onDone} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <View style={[styles.visualArea, { backgroundColor: `${slide.accentColor}10` }]}>
            <View style={[styles.accentLine, { backgroundColor: slide.accentColor }]} />
            {slide.visual}
          </View>

          <View style={styles.textArea}>
            <View style={[styles.emojiWrap, { backgroundColor: `${slide.accentColor}18`, borderColor: `${slide.accentColor}40` }]}>
              <Text style={styles.slideEmoji}>{slide.emoji}</Text>
            </View>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideDesc}>{slide.desc}</Text>
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  i === idx
                    ? [styles.dotActive, { backgroundColor: slide.accentColor, width: 20 }]
                    : styles.dotInactive,
                  { transform: [{ scale: dotScales[i] }] },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: slide.accentColor }]}
            onPress={goNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextText}>{isLast ? "Get Started 🚀" : "Next"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

/* ─── Storage helpers ─── */

export async function checkTourSeen(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(TOUR_KEY);
    return val === "true";
  } catch {
    return false;
  }
}

export async function markTourSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(TOUR_KEY, "true");
  } catch {}
}

/* ─── Main styles (defined after components that reference them via hoisting) ─── */

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.88)",
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: W - 32,
    alignItems: "center",
    gap: 20,
  },
  skipBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: `${Colors.textMuted}25`,
    borderRadius: 20,
  },
  skipText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    width: "100%",
    backgroundColor: Colors.bgSecondary,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
    }),
  },
  accentLine: {
    height: 3,
    width: "100%",
    position: "absolute",
    top: 0,
  },
  visualArea: {
    height: H * 0.30,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  textArea: {
    padding: 24,
    paddingTop: 20,
    alignItems: "center",
    gap: 8,
  },
  emojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  slideEmoji: {
    fontSize: 24,
  },
  slideTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  slideDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },
  footer: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
  dotActive: {
    opacity: 1,
  },
  dotInactive: {
    width: 7,
    backgroundColor: Colors.border,
    opacity: 0.6,
  },
  nextBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  nextText: {
    color: Colors.bgPrimary,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
