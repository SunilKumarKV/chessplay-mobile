import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useAuthStore } from "@/store/authStore";

export function NetworkBanner() {
  const colors = useThemeColors();
  const authError = useAuthStore((state) => state.authError);
  const setAuthError = useAuthStore((state) => state.setAuthError);

  if (!authError) return null;

  return (
    <Pressable onPress={() => setAuthError(null)}>
      <View style={[styles.banner, { backgroundColor: colors.warning }]}>
        <AppText style={styles.text}>{authError}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  text: { color: "#111827", fontWeight: "700" }
});
