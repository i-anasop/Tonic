import createContextHook from "@nkzw/create-context-hook";
import { useMemo } from "react";
import { Colors } from "@/constants/colors";

export const [ThemeProvider, useTheme] = createContextHook(() => {
  return useMemo(() => ({
    colors: Colors,
    isDark: true,
  }), []);
});
