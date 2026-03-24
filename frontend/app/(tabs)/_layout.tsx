import { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, useRouter, usePathname } from "expo-router";
import { LayoutDashboard, ListTodo, Sparkles, User, Bot } from "lucide-react-native";
import { View, StyleSheet, TouchableOpacity, Animated } from "react-native";

import { Colors } from "@/constants/colors";
import { useTheme } from "@/providers/ThemeProvider";
import { AppTour, checkTourSeen, markTourSeen } from "@/components/AppTour";

function AgentFAB({ visible }: { visible: boolean }) {
  const router = useRouter();
  const scale = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: visible ? 1 : 0,
      friction: 6,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [visible, scale]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.6, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, [glow]);

  const shadowOpacity = glow.interpolate({ inputRange: [0.6, 1], outputRange: [0.3, 0.65] });

  return (
    <Animated.View
      style={[
        fab.wrap,
        {
          transform: [{ scale }],
          shadowOpacity,
        },
      ]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <TouchableOpacity
        style={fab.btn}
        activeOpacity={0.85}
        onPress={() => {
          try { router.push("/(tabs)/agent" as any); } catch {}
        }}
      >
        <Bot size={24} color="#0D1117" />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function TabLayout() {
  const [showTour, setShowTour] = useState(false);
  const [tourChecked, setTourChecked] = useState(false);
  const pathname = usePathname();
  const isAgentScreen = pathname?.includes("agent") ?? false;
  const { colors } = useTheme();

  useEffect(() => {
    checkTourSeen().then((seen) => {
      if (!seen) setShowTour(true);
      setTourChecked(true);
    });
  }, []);

  const handleTourDone = useCallback(() => {
    setShowTour(false);
    void markTourSeen();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.gold,
          tabBarInactiveTintColor: colors.textMuted,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.bgSecondary,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            height: 80,
            paddingBottom: 24,
            paddingTop: 8,
          },
          tabBarBackground: () => (
            <View style={{ flex: 1, backgroundColor: colors.bgSecondary }} />
          ),
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color }: { color: string }) => <LayoutDashboard size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: "Tasks",
            tabBarIcon: ({ color }: { color: string }) => <ListTodo size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: "Insights",
            tabBarIcon: ({ color }: { color: string }) => <Sparkles size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }: { color: string }) => <User size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="agent"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="leaderboard"
          options={{
            href: null,
          }}
        />
      </Tabs>

      <AgentFAB visible={tourChecked && !showTour && !isAgentScreen} />

      {showTour && <AppTour onDone={handleTourDone} />}
    </View>
  );
}

const fab = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 94,
    right: 20,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 10,
    zIndex: 500,
  },
  btn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.gold,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: `${Colors.gold}80`,
  },
});

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
});
