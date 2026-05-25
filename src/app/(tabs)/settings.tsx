import { Alert, Switch, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { api } from "@/services/api/client";
import { clearAuthSession } from "@/services/storage/authStorage";
import { disconnectSocket } from "@/services/socket/socketClient";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";

export default function SettingsScreen() {
  const { theme, setTheme, soundEffects, setSoundEffects } = useSettingsStore();
  const clearSession = useAuthStore((state) => state.clearSession);

  async function logout() {
    try {
      await api.logout();
    } catch {}
    disconnectSocket();
    await clearAuthSession();
    clearSession();
  }

  return (
    <Screen>
      <AppText variant="title">Settings</AppText>
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <AppText>Dark theme</AppText>
          <Switch value={theme === "dark"} onValueChange={(value) => setTheme(value ? "dark" : "light")} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <AppText>Sound effects</AppText>
          <Switch value={soundEffects} onValueChange={setSoundEffects} />
        </View>
      </Card>
      <Card>
        <AppText variant="subtitle">Network</AppText>
        <AppText muted>Production API and Socket.IO URLs are loaded from public Expo environment variables.</AppText>
      </Card>
      <Button label="Log out" variant="danger" onPress={() => Alert.alert("Log out", "End this mobile session?", [{ text: "Cancel" }, { text: "Log out", onPress: logout }])} />
    </Screen>
  );
}

