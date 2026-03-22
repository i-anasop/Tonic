import { Tabs } from "expo-router";
import { LayoutDashboard, ListTodo, Sparkles, User } from "lucide-react-native";
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
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }: { color: string }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color }: { color: string }) => <ListTodo size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "AI Insights",
          tabBarIcon: ({ color }: { color: string }) => <Sparkles size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }: { color: string }) => <User size={24} color={color} />,
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
    paddingTop: 12,
  },
  tabBarBackground: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
  },
});
