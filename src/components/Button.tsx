import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { AppText } from "@/components/AppText";
import { useThemeColors } from "@/hooks/useThemeColors";

type Props = {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  disabled?: boolean;
};

export function Button({ label, onPress, variant = "primary", loading, disabled }: Props) {
  const colors = useThemeColors();
  const backgroundColor =
    variant === "primary" ? colors.primary : variant === "danger" ? colors.danger : colors.surfaceMuted;
  const color = variant === "secondary" ? colors.text : "#FFFFFF";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, opacity: disabled ? 0.5 : pressed ? 0.82 : 1 }
      ]}
    >
      {loading ? <ActivityIndicator color={color} /> : <AppText style={[styles.label, { color }]}>{label}</AppText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 48, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  label: { fontWeight: "800" }
});

