import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/colors";

export default function ResetScreen() {
  const router = useRouter();

  useEffect(() => {
    const resetApp = async () => {
      try {
        // Clear all localStorage/AsyncStorage
        await AsyncStorage.clear();
        
        // Wait a moment then redirect to onboarding
        setTimeout(() => {
          router.replace("/onboarding");
        }, 500);
      } catch (error) {
        console.error("Reset failed:", error);
        // Redirect anyway
        setTimeout(() => {
          router.replace("/onboarding");
        }, 1000);
      }
    };

    resetApp();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.gold} />
      <Text style={styles.text}>Resetting app...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0D1117",
  },
  text: {
    color: "#F0F6FC",
    marginTop: 16,
    fontSize: 16,
  },
});
