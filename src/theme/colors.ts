export type ThemeName = "light" | "dark";

export const palettes = {
  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceMuted: "#EEF2F7",
    text: "#101828",
    textMuted: "#667085",
    border: "#D0D5DD",
    primary: "#2563EB",
    primarySoft: "#DBEAFE",
    success: "#15803D",
    danger: "#DC2626",
    warning: "#B45309",
    boardLight: "#E8EDF3",
    boardDark: "#7A91B4",
    highlight: "#FACC15"
  },
  dark: {
    background: "#0B1120",
    surface: "#111827",
    surfaceMuted: "#1F2937",
    text: "#F8FAFC",
    textMuted: "#CBD5E1",
    border: "#334155",
    primary: "#60A5FA",
    primarySoft: "#1E3A8A",
    success: "#22C55E",
    danger: "#F87171",
    warning: "#FBBF24",
    boardLight: "#CBD5E1",
    boardDark: "#475569",
    highlight: "#FDE047"
  }
} as const;

