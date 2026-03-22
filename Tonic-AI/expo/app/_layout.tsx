import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRootNavigationState, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAppState } from "@/providers/AppStateProvider";

import { ThemeProvider } from "@/providers/ThemeProvider";
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

// Wrapper component that handles conditional routing
function RootLayoutWrapper() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { isOnboarded, isLoading } = useAppState();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Safety timeout: if loading takes more than 10 seconds, assume it failed and proceed
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

    // Consider loading done if either isLoading is false OR timeout occurred
    const shouldProceed = !isLoading || loadingTimeout;
    if (!shouldProceed) return;

    // Route to onboarding if not onboarded
    if (!isOnboarded) {
      router.replace("/onboarding");
    }
  }, [isOnboarded, isLoading, loadingTimeout, navigationState?.key, router]);

  return <RootLayoutNav />;
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
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <RootLayoutWrapper />
                </GestureHandlerRootView>
              </ThemeProvider>
            </AchievementsProvider>
          </TasksProvider>
        </AppStateProvider>
      </TonConnectProvider>
    </QueryClientProvider>
  );
}
