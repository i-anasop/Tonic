import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  TextInput,
  Alert,
  Easing,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Sparkles,
  Zap,
  Brain,
  Wallet,
  ChevronRight,
  User,
  Bot,
  Shield,
  Target,
  Star,
  TrendingUp,
  CheckCircle,
  Trophy,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/colors";
import { API_BASE_URL } from "@/constants/api";
import { useAppState } from "@/providers/AppStateProvider";
import { useTonConnect } from "@/hooks/useTonConnect";

const { width: W, height: H } = Dimensions.get("window");

const SLIDES = [
  {
    id: 1,
    title: "Welcome to\nTonic AI",
    subtitle: "AI-Powered Productivity",
    description: "Intelligent task management, on-chain achievements, and a personal AI agent — all in one.",
    icon: Sparkles,
    accent: Colors.gold,
    bg: "rgba(255,215,0,0.07)",
    features: [
      { icon: Bot, label: "AI Agent" },
      { icon: Shield, label: "TON Chain" },
      { icon: Target, label: "Smart Goals" },
    ],
  },
  {
    id: 2,
    title: "Smart Task\nManagement",
    subtitle: "Organize with Intelligence",
    description: "AI prioritizes your tasks and suggests optimal focus times based on your patterns.",
    icon: Zap,
    accent: Colors.blue,
    bg: "rgba(59,130,246,0.07)",
    features: [
      { icon: Target, label: "Auto-priority" },
      { icon: Star, label: "Difficulty XP" },
      { icon: CheckCircle, label: "4 Categories" },
    ],
  },
  {
    id: 3,
    title: "AI Insights\n& Analytics",
    subtitle: "Know Your Patterns",
    description: "GPT-5 analyzes your productivity and delivers personalised insights every day.",
    icon: Brain,
    accent: Colors.purple,
    bg: "rgba(139,92,246,0.07)",
    features: [
      { icon: TrendingUp, label: "Progress charts" },
      { icon: Brain, label: "GPT-5" },
      { icon: Trophy, label: "10 Rank levels" },
    ],
  },
  {
    id: 4,
    title: "Ready to\nLaunch?",
    subtitle: "Join the TON Ecosystem",
    description: "Connect your TON wallet to earn points, claim achievements on-chain, and rank up.",
    icon: Wallet,
    accent: Colors.success,
    bg: "rgba(34,197,94,0.07)",
    features: [
      { icon: Wallet, label: "TON Wallet" },
      { icon: Shield, label: "On-chain proof" },
      { icon: Star, label: "Achievements" },
    ],
  },
];

function ParticleDot({
  color,
  delay,
  startX,
}: {
  color: string;
  delay: number;
  startX: number;
}) {
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const size = useRef(Math.random() * 3 + 2).current;

  useEffect(() => {
    const run = () => {
      y.setValue(0);
      opacity.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(y, {
            toValue: -(H * 0.55 + Math.random() * H * 0.15),
            duration: 4500 + Math.random() * 2500,
            useNativeDriver: false,
            easing: Easing.out(Easing.quad),
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.75,
              duration: 600,
              useNativeDriver: false,
            }),
            Animated.delay(2200),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 1200,
              useNativeDriver: false,
            }),
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
        left: startX,
        bottom: H * 0.05,
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

function ParticleField({ color }: { color: string }) {
  const count = 14;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => (
        <ParticleDot
          key={i}
          color={color}
          delay={(i * 380) % 2800}
          startX={(W / count) * i + Math.random() * (W / count)}
        />
      ))}
    </View>
  );
}

function IconOrb({
  Icon,
  accent,
  bg,
}: {
  Icon: any;
  accent: string;
  bg: string;
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  const ring1 = useRef(new Animated.Value(0.6)).current;
  const ring2 = useRef(new Animated.Value(0.6)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const orbScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(orbScale, {
      toValue: 1,
      useNativeDriver: false,
      damping: 12,
      stiffness: 90,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    const makeRingAnim = (val: Animated.Value, initDelay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(initDelay),
          Animated.parallel([
            Animated.timing(val, {
              toValue: 1.7,
              duration: 1600,
              useNativeDriver: false,
              easing: Easing.out(Easing.cubic),
            }),
          ]),
          Animated.timing(val, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      );
    makeRingAnim(ring1, 0).start();
    makeRingAnim(ring2, 800).start();

    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: false,
        easing: Easing.linear,
      })
    ).start();
  }, []);

  const ringOpacity1 = ring1.interpolate({
    inputRange: [0.6, 1.7],
    outputRange: [0.55, 0],
  });
  const ringOpacity2 = ring2.interpolate({
    inputRange: [0.6, 1.7],
    outputRange: [0.35, 0],
  });
  const spinDeg = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const ORB = 136;

  return (
    <Animated.View
      style={[
        styles.orbWrap,
        { transform: [{ scale: orbScale }] },
      ]}
    >
      {/* Ripple rings */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: ORB * 1.8,
            height: ORB * 1.8,
            borderRadius: ORB * 0.9,
            borderColor: accent,
            opacity: ringOpacity1,
            transform: [{ scale: ring1 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          {
            width: ORB * 1.8,
            height: ORB * 1.8,
            borderRadius: ORB * 0.9,
            borderColor: accent,
            opacity: ringOpacity2,
            transform: [{ scale: ring2 }],
          },
        ]}
      />

      {/* Spinning orbit dots */}
      <Animated.View
        style={[
          styles.orbitTrack,
          {
            width: ORB * 2.1,
            height: ORB * 2.1,
            borderRadius: ORB * 1.05,
            transform: [{ rotate: spinDeg }],
          },
        ]}
      >
        <View
          style={[
            styles.orbitDot,
            { backgroundColor: accent, top: -4, left: "50%" as any },
          ]}
        />
        <View
          style={[
            styles.orbitDot,
            {
              backgroundColor: accent,
              opacity: 0.45,
              bottom: -4,
              left: "50%" as any,
            },
          ]}
        />
      </Animated.View>

      {/* Main orb */}
      <Animated.View
        style={[
          styles.orb,
          {
            width: ORB,
            height: ORB,
            borderRadius: ORB / 2,
            backgroundColor: bg,
            borderColor: accent + "55",
            transform: [{ scale: pulse }],
          },
        ]}
      >
        <Icon size={44} color={accent} />
      </Animated.View>
    </Animated.View>
  );
}

function FeatureChip({
  icon: ChipIcon,
  label,
  accent,
  index,
}: {
  icon: any;
  label: string;
  accent: string;
  index: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
      delay: 300 + index * 80,
      useNativeDriver: false,
      easing: Easing.out(Easing.back(1.4)),
    }).start();
    return () => {
      anim.setValue(0);
    };
  }, [label]);

  return (
    <Animated.View
      style={[
        styles.chip,
        {
          borderColor: accent + "44",
          backgroundColor: accent + "12",
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
        },
      ]}
    >
      <ChipIcon size={13} color={accent} />
      <Text style={[styles.chipText, { color: accent }]}>{label}</Text>
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guestName, setGuestName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [showWalletNameInput, setShowWalletNameInput] = useState(false);
  const [pendingWalletAddress, setPendingWalletAddress] = useState<string | null>(null);

  const { createGuestUser, connectWallet: saveWallet } = useAppState();
  const { connectWallet, walletAddress, isConnected, isInitialized } =
    useTonConnect();
  const router = useRouter();

  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentY = useRef(new Animated.Value(0)).current;
  const bgScale = useRef(new Animated.Value(1)).current;
  const btnGlow = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-30)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 600,
        useNativeDriver: false,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(btnGlow, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(btnGlow, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!isConnected || !walletAddress || showWalletNameInput) return;

    setPendingWalletAddress(walletAddress);

    const derivedId = `wallet_${walletAddress.slice(-12)}`;

    const tryRestore = async () => {
      // 1. Check AsyncStorage first (fastest — covers the "didn't sign out" case)
      try {
        const stored = await AsyncStorage.getItem("@tonic_user");
        if (stored) {
          const existing = JSON.parse(stored) as { walletAddress?: string; name?: string };
          if (existing.walletAddress === walletAddress && existing.name && existing.name !== "TON User") {
            saveWallet(walletAddress, existing.name);
            router.replace("/(tabs)");
            return;
          }
        }
      } catch { /* continue */ }

      // 2. Check backend (covers returning users who signed out or switched devices)
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/${derivedId}`, {
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = await res.json() as { user?: { name?: string } };
          const storedName = data.user?.name;
          if (storedName && storedName !== "TON User") {
            saveWallet(walletAddress, storedName);
            router.replace("/(tabs)");
            return;
          }
        }
      } catch { /* continue */ }

      // 3. Brand-new wallet — ask for a display name
      setShowWalletNameInput(true);
    };

    void tryRestore();
  }, [isConnected, walletAddress]);

  const handleWalletNameSubmit = () => {
    if (pendingWalletAddress) {
      saveWallet(pendingWalletAddress, walletName.trim() || undefined);
      setTimeout(() => router.replace("/(tabs)"), 300);
    }
  };

  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  const transitionTo = useCallback(
    (nextIndex: number) => {
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: false,
        }),
        Animated.timing(contentY, {
          toValue: 18,
          duration: 180,
          useNativeDriver: false,
          easing: Easing.in(Easing.quad),
        }),
        Animated.timing(bgScale, {
          toValue: 1.06,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setCurrentIndex(nextIndex);
        contentY.setValue(-22);
        bgScale.setValue(0.96);
        Animated.parallel([
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 320,
            useNativeDriver: false,
            easing: Easing.out(Easing.cubic),
          }),
          Animated.timing(contentY, {
            toValue: 0,
            duration: 320,
            useNativeDriver: false,
            easing: Easing.out(Easing.cubic),
          }),
          Animated.timing(bgScale, {
            toValue: 1,
            duration: 380,
            useNativeDriver: false,
            easing: Easing.out(Easing.back(1.2)),
          }),
        ]).start();
      });
    },
    []
  );

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) transitionTo(currentIndex + 1);
  };

  const handleSkip = () => transitionTo(SLIDES.length - 1);

  const handleGuestSubmit = () => {
    if (guestName.trim()) {
      createGuestUser(guestName.trim());
      router.replace("/(tabs)");
    }
  };

  const handleConnectWallet = async () => {
    if (!isInitialized) {
      Alert.alert("Not Ready", "TonConnect is initializing. Try again shortly.");
      return;
    }
    try {
      await connectWallet();
    } catch {}
  };

  const btnShadowRadius = btnGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 22],
  });
  const btnShadowOpacity = btnGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.root}>
      {/* Animated background orb */}
      <Animated.View
        style={[
          styles.bgOrb,
          {
            backgroundColor: slide.bg,
            transform: [{ scale: bgScale }],
          },
        ]}
      />

      <ParticleField color={slide.accent} />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        {/* Header badge */}
        <Animated.View
          style={[
            styles.headerRow,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerSlide }],
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={{ width: 28, height: 28, borderRadius: 8 }}
              resizeMode="contain"
            />
            <View style={styles.badge}>
              <Sparkles size={11} color={Colors.gold} />
              <Text style={styles.badgeText}>Built on TON</Text>
            </View>
          </View>

          {!isLast && (
            <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Progress bar */}
        <View style={styles.progressRow}>
          {SLIDES.map((s, i) => (
            <TouchableOpacity
              key={s.id}
              onPress={() => i < currentIndex && transitionTo(i)}
              activeOpacity={i < currentIndex ? 0.7 : 1}
              style={styles.progressSegWrap}
            >
              <View
                style={[
                  styles.progressSeg,
                  {
                    backgroundColor:
                      i <= currentIndex ? slide.accent : Colors.border,
                    opacity: i === currentIndex ? 1 : i < currentIndex ? 0.6 : 0.25,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Wallet connected full-screen view — replaces content when wallet links */}
        {showWalletNameInput ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 8 }}>
            <Animated.View style={{ alignItems: "center", width: "100%" }}>
              <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: `${Colors.gold}20`, justifyContent: "center", alignItems: "center", marginBottom: 16, borderWidth: 1.5, borderColor: `${Colors.gold}50` }}>
                <Wallet size={32} color={Colors.gold} />
              </View>
              <Text style={{ fontSize: 22, fontWeight: "800", color: Colors.textPrimary, marginBottom: 6, textAlign: "center" }}>Wallet Connected! 🎉</Text>
              <Text style={{ fontSize: 14, color: Colors.textMuted, textAlign: "center", marginBottom: 28, lineHeight: 20 }}>One last step — what should we call you?</Text>
              <View style={[styles.inputWrap, { width: "100%" }]}>
                <User size={18} color={Colors.textMuted} />
                <TextInput
                  placeholder="Enter your name"
                  placeholderTextColor={Colors.textMuted}
                  value={walletName}
                  onChangeText={setWalletName}
                  style={[styles.input, { outlineWidth: 0 } as any]}
                  autoFocus
                  onSubmitEditing={handleWalletNameSubmit}
                />
              </View>
              <Animated.View style={{ width: "100%", shadowColor: Colors.gold, shadowOffset: { width: 0, height: 0 }, shadowRadius: btnShadowRadius, shadowOpacity: btnShadowOpacity, elevation: 12, borderRadius: 18, marginTop: 16 }}>
                <TouchableOpacity onPress={handleWalletNameSubmit} activeOpacity={0.85}>
                  <LinearGradient colors={["#FFD700", "#B8860B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnPrimary}>
                    <Wallet size={17} color="#0D1117" />
                    <Text style={styles.btnPrimaryText}>Launch Tonic AI →</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
              <TouchableOpacity onPress={handleWalletNameSubmit} style={{ marginTop: 14 }}>
                <Text style={{ fontSize: 12, color: Colors.textMuted, textAlign: "center" }}>Skip — use "TON User"</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        ) : (
          <>
        {/* Main content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentY }],
            },
          ]}
        >
          <IconOrb Icon={slide.icon} accent={slide.accent} bg={slide.bg} />

          <View style={styles.textBlock}>
            <Text style={[styles.subtitle, { color: slide.accent }]}>
              {slide.subtitle}
            </Text>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>

          {/* Feature chips */}
          <View style={styles.chipsRow}>
            {slide.features.map((f, i) => (
              <FeatureChip
                key={f.label + currentIndex}
                icon={f.icon}
                label={f.label}
                accent={slide.accent}
                index={i}
              />
            ))}
          </View>
        </Animated.View>

        {/* Bottom actions */}
        <View style={styles.bottom}>
          {isLast ? (
            <View style={styles.authArea}>
              {showNameInput ? (
                <View style={styles.nameGroup}>
                  <View style={styles.inputWrap}>
                    <User size={18} color={Colors.textMuted} />
                    <TextInput
                      placeholder="Your name"
                      placeholderTextColor={Colors.textMuted}
                      value={guestName}
                      onChangeText={setGuestName}
                      style={[styles.input, { outlineWidth: 0 } as any]}
                      autoFocus
                      onSubmitEditing={handleGuestSubmit}
                    />
                  </View>
                  <Animated.View
                    style={{
                      shadowColor: Colors.gold,
                      shadowOffset: { width: 0, height: 0 },
                      shadowRadius: btnShadowRadius,
                      shadowOpacity: btnShadowOpacity,
                      elevation: 12,
                      borderRadius: 18,
                    }}
                  >
                    <TouchableOpacity onPress={handleGuestSubmit} activeOpacity={0.85}>
                      <LinearGradient
                        colors={["#FFD700", "#B8860B"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.btnPrimary}
                      >
                        <Text style={styles.btnPrimaryText}>Continue →</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              ) : (
                <>
                  <Animated.View
                    style={{
                      shadowColor: Colors.gold,
                      shadowOffset: { width: 0, height: 0 },
                      shadowRadius: btnShadowRadius,
                      shadowOpacity: btnShadowOpacity,
                      elevation: 14,
                      borderRadius: 18,
                      marginBottom: 12,
                    }}
                  >
                    <TouchableOpacity
                      onPress={handleConnectWallet}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={["#FFD700", "#B8860B"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.btnPrimary}
                      >
                        <Wallet size={19} color="#0D1117" />
                        <Text style={styles.btnPrimaryText}>
                          Connect TON Wallet
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>

                  <TouchableOpacity
                    style={styles.btnSecondary}
                    onPress={() => setShowNameInput(true)}
                    activeOpacity={0.8}
                  >
                    <User size={17} color={Colors.textSecondary} />
                    <Text style={styles.btnSecondaryText}>
                      Continue as Guest
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.terms}>
                    By continuing you agree to our Terms & Privacy Policy
                  </Text>
                </>
              )}
            </View>
          ) : (
            <View>
              <View style={styles.navRow}>
                <View style={styles.slideCounter}>
                  <Text style={[styles.slideNum, { color: slide.accent }]}>
                    {String(currentIndex + 1).padStart(2, "0")}
                  </Text>
                  <Text style={styles.slideTotal}>/{SLIDES.length}</Text>
                </View>

                <Animated.View
                  style={{
                    shadowColor: slide.accent,
                    shadowOffset: { width: 0, height: 0 },
                    shadowRadius: btnShadowRadius,
                    shadowOpacity: btnShadowOpacity,
                    elevation: 10,
                    borderRadius: 32,
                  }}
                >
                  <TouchableOpacity
                    style={[styles.nextBtn, { backgroundColor: slide.accent }]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                  >
                    <ChevronRight size={26} color="#0D1117" />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          )}
        </View>
        </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  bgOrb: {
    position: "absolute",
    width: W * 1.8,
    height: W * 1.8,
    borderRadius: W * 0.9,
    top: -W * 0.55,
    left: -W * 0.4,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 22,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    marginBottom: 18,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,215,0,0.10)",
    borderColor: "rgba(255,215,0,0.25)",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 11,
    color: Colors.gold,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  skipText: {
    fontSize: 15,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  progressRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 28,
  },
  progressSegWrap: {
    flex: 1,
  },
  progressSeg: {
    height: 3,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  orbWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    width: 290,
    height: 290,
  },
  ring: {
    position: "absolute",
    borderWidth: 1.5,
  },
  orbitTrack: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderStyle: "dashed",
  },
  orbitDot: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: -3.5,
  },
  orb: {
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    alignItems: "center",
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    marginBottom: 8,
    opacity: 0.9,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: Colors.textPrimary,
    textAlign: "center",
    lineHeight: 38,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 10,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  bottom: {
    paddingBottom: 24,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slideCounter: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  slideNum: {
    fontSize: 28,
    fontWeight: "800",
  },
  slideTotal: {
    fontSize: 16,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  nextBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  authArea: {
    gap: 0,
  },
  nameGroup: {
    gap: 12,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgSecondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    height: 48,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingVertical: 17,
    paddingHorizontal: 24,
    borderRadius: 18,
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0D1117",
    letterSpacing: 0.2,
  },
  btnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 18,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  terms: {
    fontSize: 11.5,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 17,
  },
});
