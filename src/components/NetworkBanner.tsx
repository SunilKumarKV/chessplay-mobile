import { Pressable, StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";
import * as Network from "expo-network";
import { AppText } from "@/components/AppText";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useAuthStore } from "@/store/authStore";

export function NetworkBanner() {
  const colors = useThemeColors();
  const authError = useAuthStore((state) => state.authError);
  const setAuthError = useAuthStore((state) => state.setAuthError);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const state = await Network.getNetworkStateAsync();
      if (active) setOffline(state.isConnected === false || state.isInternetReachable === false);
    };
    check().catch(() => undefined);
    const interval = setInterval(() => check().catch(() => undefined), 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const message = offline ? "You are offline. Check your connection, then retry." : authError;
  if (!message) return null;

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Dismiss network notice" onPress={() => setAuthError(null)}>
      <View style={[styles.banner, { backgroundColor: colors.warning }]}>
        <AppText style={styles.text}>{message}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  text: { color: "#111827", fontWeight: "700" }
});
