import { Text, type TextProps, StyleSheet } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

type Props = TextProps & {
  variant?: "title" | "subtitle" | "body" | "caption";
  muted?: boolean;
};

export function AppText({ variant = "body", muted, style, ...props }: Props) {
  const colors = useThemeColors();
  return <Text {...props} style={[styles[variant], { color: muted ? colors.textMuted : colors.text }, style]} />;
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: "800", lineHeight: 36 },
  subtitle: { fontSize: 20, fontWeight: "700", lineHeight: 26 },
  body: { fontSize: 16, lineHeight: 23 },
  caption: { fontSize: 13, lineHeight: 18 }
});

