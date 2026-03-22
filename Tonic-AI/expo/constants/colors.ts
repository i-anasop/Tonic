// Dark elegant theme for Pulse AI

export const Colors = {
  // Backgrounds
  bgPrimary: "#0D1117",
  bgSecondary: "#161B22",
  bgTertiary: "#21262D",
  bgElevated: "#1C2128",
  
  // Accents
  gold: "#FFD700",
  goldDim: "#B8860B",
  blue: "#3B82F6",
  blueDim: "#2563EB",
  purple: "#8B5CF6",
  
  // Semantic
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#06B6D4",
  
  // Text
  textPrimary: "#F0F6FC",
  textSecondary: "#8B949E",
  textTertiary: "#484F58",
  textMuted: "#6E7681",
  
  // Borders
  border: "#30363D",
  borderLight: "#3D444D",
  
  // Gradients (arrays for LinearGradient)
  gradientGold: ["#FFD700", "#B8860B"],
  gradientBlue: ["#3B82F6", "#1D4ED8"],
  gradientPurple: ["#8B5CF6", "#6D28D9"],
  
  // Tab bar
  tabIconDefault: "#6E7681",
  tabIconSelected: "#FFD700",
  tint: "#FFD700",
} as const;

export type ColorsType = typeof Colors;
export default Colors;
