import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRootNavigationState, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAppState } from "@/providers/AppStateProvider";

import { ThemeProvider, useTheme } from "@/providers/ThemeProvider";
import { AppStateProvider } from "@/providers/AppStateProvider";
import { TasksProvider } from "@/providers/TasksProvider";
import { AchievementsProvider } from "@/providers/AchievementsProvider";
import { TonConnectProvider } from "@/providers/TonConnectProvider";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
          animationEnabled: true,
        }}
      />
      <Stack.Screen
        name="reset"
        options={{
          headerShown: false,
          presentation: "fullScreenModal",
        }}
      />
      <Stack.Screen
        name="modal"
        options={{
          presentation: "modal",
          headerShown: false,
          animation: "slide_from_bottom",
          gestureEnabled: true,
          gestureDirection: "vertical",
        }}
      />
      <Stack.Screen name="+not-found" options={{ headerShown: false }} />
    </Stack>
  );
}

function RootLayoutWrapper() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { isOnboarded, isLoading } = useAppState();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    if (!isLoading) return;
    const timeout = setTimeout(() => {
      console.warn("Loading timeout exceeded - forcing app initialization");
      setLoadingTimeout(true);
    }, 10000);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  useEffect(() => {
    if (!navigationState?.key) return;
    const shouldProceed = !isLoading || loadingTimeout;
    if (!shouldProceed) return;
    if (!isOnboarded) {
      router.replace("/onboarding");
    }
  }, [isOnboarded, isLoading, loadingTimeout, navigationState?.key, router]);

  return <RootLayoutNav />;
}

function ThemedRoot() {
  const { colors } = useTheme();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <RootLayoutWrapper />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TonConnectProvider>
        <AppStateProvider>
          <TasksProvider>
            <AchievementsProvider>
              <ThemeProvider>
                <ThemedRoot />
              </ThemeProvider>
            </AchievementsProvider>
          </TasksProvider>
        </AppStateProvider>
      </TonConnectProvider>
    </QueryClientProvider>
  );
}
