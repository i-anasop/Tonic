import { useWindowDimensions } from "react-native";

export function useResponsive() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const isTablet = width >= 600 && width < 768;
  const isMobile = width < 600;
  const contentMaxWidth = 640;
  const contentWidth = isLargeScreen ? contentMaxWidth : "100%" as const;

  return { width, isLargeScreen, isTablet, isMobile, contentWidth, contentMaxWidth };
}
