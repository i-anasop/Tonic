import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Sparkles,
  Zap,
  Brain,
  Wallet,
  ChevronRight,
  User,
} from "lucide-react-native";
import { useRouter } from "expo-router";

import { Colors } from "@/constants/colors";
import { useAppState } from "@/providers/AppStateProvider";
import { useTonConnect } from "@/hooks/useTonConnect";

const { width: _width } = Dimensions.get("window");

const onboardingData = [
  {
    id: 1,
    title: "Welcome to Pulse",
    subtitle: "Your AI-Powered Productivity Partner",
    description: "Experience the future of task management with intelligent insights, voice commands, and seamless TON blockchain integration.",
    icon: Sparkles,
    color: Colors.gold,
  },
  {
    id: 2,
    title: "Smart Task Management",
    subtitle: "Organize with Intelligence",
    description: "Categorize tasks by Work, Personal, Health & Learning. AI automatically prioritizes and suggests optimal focus times.",
    icon: Zap,
    color: Colors.blue,
  },
  {
    id: 3,
    title: "AI Insights & Analytics",
    subtitle: "Understand Your Patterns",
    description: "Get personalized productivity insights, workload warnings, and behavioral analysis to optimize your workflow.",
    icon: Brain,
    color: Colors.purple,
  },
  {
    id: 4,
    title: "Ready to Start?",
    subtitle: "Choose How to Continue",
    description: "Connect your TON wallet for blockchain features or continue as a guest to explore the app.",
    icon: Wallet,
    color: Colors.success,
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guestName, setGuestName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const _scrollX = useRef(new Animated.Value(0)).current;
  const { createGuestUser, connectWallet: saveWallet } = useAppState();
  const { connectWallet, walletAddress, isConnected, isInitialized } =
    useTonConnect();
  const router = useRouter();

  // When wallet connects, save and navigate
  useEffect(() => {
    if (isConnected && walletAddress) {
      console.log("[Onboarding] 🎉 Wallet connected:", walletAddress);
      saveWallet(walletAddress);
      setTimeout(() => {
        console.log("[Onboarding] ✅ Navigating to dashboard...");
        router.replace("/(tabs)");
      }, 300);
    }
  }, [isConnected, walletAddress, saveWallet, router]);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleGuestMode = () => {
    setShowNameInput(true);
  };

  const handleGuestSubmit = () => {
    if (guestName.trim()) {
      createGuestUser(guestName.trim());
      router.replace("/(tabs)");
    }
  };

  const handleConnectWallet = async () => {
    if (!isInitialized) {
      Alert.alert(
        "Not Ready",
        "TonConnect is still initializing. Please try again in a moment.",
        [{ text: "OK", onPress: () => {} }]
      );
      return;
    }

    try {
      await connectWallet();
    } catch (error) {
      console.log("[Onboarding] Wallet modal closed");
    }
  };

  const currentSlide = onboardingData[currentIndex];
  const Icon = currentSlide.icon;
  const isLastSlide = currentIndex === onboardingData.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Progress Dots */}
      <View style={styles.dotsContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.iconContainer,
            { backgroundColor: `${currentSlide.color}15` },
          ]}
        >
          <Icon size={48} color={currentSlide.color} />
        </Animated.View>

        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.subtitle}>{currentSlide.subtitle}</Text>
        <Text style={styles.description}>{currentSlide.description}</Text>
      </View>

      {/* Last Slide - Auth Options */}
      {isLastSlide ? (
        <View style={styles.authContainer}>
          {showNameInput ? (
            <View style={styles.nameInputContainer}>
              <View style={styles.inputWrapper}>
                <User size={20} color={Colors.textMuted} />
                <TextInput
                  placeholder="Enter your name"
                  placeholderTextColor={Colors.textMuted}
                  value={guestName}
                  onChangeText={setGuestName}
                  style={styles.textInput}
                  onSubmitEditing={handleGuestSubmit}
                />
              </View>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleGuestSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonTextPrimary}>Continue</Text>
                <ChevronRight size={20} color={Colors.bgPrimary} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleConnectWallet}
                activeOpacity={0.8}
              >
                <Wallet size={20} color={Colors.bgPrimary} />
                <Text style={styles.buttonTextPrimary}>Connect TON Wallet</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleGuestMode}
                activeOpacity={0.8}
              >
                <User size={20} color={Colors.textPrimary} />
                <Text style={styles.buttonTextSecondary}>Continue as Guest</Text>
              </TouchableOpacity>

              <Text style={styles.termsText}>
                By continuing, you agree to our Terms of Service and Privacy Policy
              </Text>
            </>
          )}
        </View>
      ) : (
        /* Navigation */
        <View style={styles.navigation}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => setCurrentIndex(onboardingData.length - 1)}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: currentSlide.color }]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <ChevronRight size={24} color={Colors.bgPrimary} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    paddingHorizontal: 24,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingTop: 20,
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.gold,
    width: 24,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.gold,
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 32,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  authContainer: {
    paddingBottom: 32,
    gap: 12,
  },
  nameInputContainer: {
    gap: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgSecondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  textInput: {
    flex: 1,
    height: 48,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  buttonPrimary: {
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonSecondary: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.bgPrimary,
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  termsText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
});
