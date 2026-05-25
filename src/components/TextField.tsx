import { TextInput, type TextInputProps, StyleSheet } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export function TextField(props: TextInputProps) {
  const colors = useThemeColors();
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      autoCapitalize="none"
      {...props}
      style={[
        styles.input,
        { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
        props.style
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: { minHeight: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, fontSize: 16 }
});

