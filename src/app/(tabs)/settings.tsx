import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Alert, Switch, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { ErrorState, LoadingState } from "@/components/StateView";
import { api, settingsApi } from "@/services/api/client";
import { clearMobileSession } from "@/services/api/authSession";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";

export default function SettingsScreen() {
  const { theme, setTheme, soundEffects, setSoundEffects } = useSettingsStore();
  const clearSession = useAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["settings", "me"], queryFn: settingsApi.me });
  const mutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: (data) => {
      queryClient.setQueryData(["settings", "me"], data);
      const nextTheme = data.settings.appearance?.theme;
      if (nextTheme === "dark" || nextTheme === "light") setTheme(nextTheme);
      if (typeof data.settings.gameplay?.soundEffects === "boolean") setSoundEffects(data.settings.gameplay.soundEffects);
    },
    onError: (error) => Alert.alert("Settings not saved", error.message)
  });

  useEffect(() => {
    const remote = query.data?.settings;
    if (!remote) return;
    const remoteTheme = remote.appearance?.theme;
    if (remoteTheme === "dark" || remoteTheme === "light") setTheme(remoteTheme);
    if (typeof remote.gameplay?.soundEffects === "boolean") setSoundEffects(remote.gameplay.soundEffects);
  }, [query.data, setSoundEffects, setTheme]);

  async function logout() {
    try {
      await api.logout();
    } catch {}
    await clearMobileSession();
    clearSession();
  }

  function saveAppearance(next: { theme?: "dark" | "light"; soundEffects?: boolean }) {
    const current = query.data?.settings || {};
    mutation.mutate({
      ...current,
      appearance: { ...current.appearance, theme: next.theme || theme },
      gameplay: { ...current.gameplay, soundEffects: next.soundEffects ?? soundEffects }
    });
  }

  return (
    <Screen>
      <AppText variant="title">Settings</AppText>
      {query.isLoading ? <LoadingState label="Syncing settings" /> : null}
      {query.isError ? <ErrorState message={query.error.message} retry={() => query.refetch()} /> : null}
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <AppText>Dark theme</AppText>
          <Switch
            value={theme === "dark"}
            onValueChange={(value) => {
              const nextTheme = value ? "dark" : "light";
              setTheme(nextTheme);
              saveAppearance({ theme: nextTheme });
            }}
          />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <AppText>Sound effects</AppText>
          <Switch
            value={soundEffects}
            onValueChange={(value) => {
              setSoundEffects(value);
              saveAppearance({ soundEffects: value });
            }}
          />
        </View>
        {mutation.isPending ? <AppText muted>Saving...</AppText> : null}
      </Card>
      <Card>
        <AppText variant="subtitle">Network</AppText>
        <AppText muted>Production API and Socket.IO URLs are loaded from public Expo environment variables.</AppText>
      </Card>
      <Button label="Log out" variant="danger" onPress={() => Alert.alert("Log out", "End this mobile session?", [{ text: "Cancel" }, { text: "Log out", onPress: logout }])} />
    </Screen>
  );
}
