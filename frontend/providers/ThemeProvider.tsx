import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Colors } from "@/constants/colors";

const DARK_THEME_KEY = "@tonic_dark_mode";

export const LightColors = {
  bgPrimary: "#F5F7FA",
  bgSecondary: "#FFFFFF",
  bgTertiary: "#EEF1F6",
  bgElevated: "#FFFFFF",
  gold: Colors.gold,
  goldDim: Colors.goldDim,
  blue: Colors.blue,
  blueDim: Colors.blueDim,
  purple: Colors.purple,
  success: Colors.success,
  warning: Colors.warning,
  danger: Colors.danger,
  info: Colors.info,
  textPrimary: "#0D1117",
  textSecondary: "#4A5568",
  textTertiary: "#6B7280",
  textMuted: "#8A94A6",
  border: "#E2E8F0",
  borderLight: "#D1D5DB",
  gradientGold: Colors.gradientGold,
  gradientBlue: Colors.gradientBlue,
  gradientPurple: Colors.gradientPurple,
  tabIconDefault: "#8A94A6",
  tabIconSelected: Colors.gold,
  tint: Colors.gold,
} as const;

export type AppColors = typeof Colors | typeof LightColors;

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [isDark, setIsDark] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DARK_THEME_KEY).then((val) => {
      if (val !== null) setIsDark(JSON.parse(val) as boolean);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const toggleTheme = useCallback(async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem(DARK_THEME_KEY, JSON.stringify(next));
  }, [isDark]);

  return useMemo(() => ({
    isDark,
    loaded,
    toggleTheme,
    colors: isDark ? Colors : LightColors,
  }), [isDark, loaded, toggleTheme]);
});
