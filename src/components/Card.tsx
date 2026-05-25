import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export function Card({ children }: { children: ReactNode }) {
  const colors = useThemeColors();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 8, padding: 16, gap: 12 }
});

