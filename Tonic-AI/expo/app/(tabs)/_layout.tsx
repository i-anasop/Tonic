import { Tabs } from "expo-router";
import { LayoutDashboard, ListTodo, Sparkles, User, Bot } from "lucide-react-native";
import { View, StyleSheet } from "react-native";

import { Colors } from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.textMuted,
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <View style={styles.tabBarBackground} />
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
        name="agent"
        options={{
          title: "Tonic",
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <View style={[styles.agentTabIcon, focused && styles.agentTabIconActive]}>
              <Bot size={22} color={focused ? Colors.bgPrimary : color} />
            </View>
          ),
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 80,
    paddingBottom: 24,
    paddingTop: 8,
  },
  tabBarBackground: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  agentTabIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgTertiary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: `${Colors.gold}40`,
    marginTop: -6,
  },
  agentTabIconActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
});
