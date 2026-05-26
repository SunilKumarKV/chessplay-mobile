import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Switch, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { ErrorState, LoadingState } from "@/components/StateView";
import { api, settingsApi } from "@/services/api/client";
import { clearMobileSession } from "@/services/api/authSession";
import { canUseBiometricUnlock } from "@/services/native/biometricUnlock";
import { registerDevicePushTokenAfterLogin } from "@/services/native/pushNotifications";
import { readBiometricUnlockEnabled, saveBiometricUnlockEnabled } from "@/services/storage/nativePreferences";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import type { SettingsPayload } from "@/types/api";

const PRIVACY = ["public", "friends", "private"] as const;
const FRIEND_REQUESTS = ["everyone", "friendsOfFriends", "none"] as const;
const DEFAULT_MODES = ["ai", "online", "player"] as const;
const ORIENTATIONS = ["white", "black", "auto"] as const;
const BOARD_THEMES = ["classic", "tournamentGreen", "neonDark", "wooden", "marble", "minimalLight"] as const;

export default function SettingsScreen() {
  const { theme, setTheme, soundEffects, setSoundEffects } = useSettingsStore();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
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

  useEffect(() => {
    Promise.all([canUseBiometricUnlock(), readBiometricUnlockEnabled()])
      .then(([available, enabled]) => {
        setBiometricAvailable(available);
        setBiometricEnabled(enabled);
      })
      .catch(() => undefined);
  }, []);

  async function logout() {
    try {
      await api.logout();
    } catch {}
    await clearMobileSession();
    clearSession();
  }

  function saveSettings(next: SettingsPayload["settings"]) {
    mutation.mutate(next);
  }

  function mergeSettings(partial: SettingsPayload["settings"]) {
    const current = query.data?.settings || {};
    saveSettings({
      ...current,
      ...partial,
      privacy: { ...current.privacy, ...partial.privacy },
      notifications: { ...current.notifications, ...partial.notifications },
      appearance: { ...current.appearance, ...partial.appearance },
      gameplay: { ...current.gameplay, ...partial.gameplay }
    });
  }

  const settings = query.data?.settings;

  return (
    <Screen>
      <AppText variant="title">Settings</AppText>
      {query.isLoading ? <LoadingState label="Syncing settings" /> : null}
      {query.isError ? <ErrorState message={query.error.message} retry={() => query.refetch()} /> : null}

      <Card>
        <AppText variant="subtitle">Privacy</AppText>
        <OptionRow
          label="Profile"
          options={["public", "private"]}
          value={settings?.privacy?.profileVisibility || "public"}
          onChange={(value) => mergeSettings({ privacy: { profileVisibility: value } })}
        />
        <OptionRow
          label="Game history"
          options={PRIVACY}
          value={settings?.privacy?.gameHistoryVisibility || "public"}
          onChange={(value) => mergeSettings({ privacy: { gameHistoryVisibility: value } })}
        />
        <OptionRow
          label="Friend requests"
          options={FRIEND_REQUESTS}
          value={settings?.privacy?.friendRequests || "everyone"}
          onChange={(value) => mergeSettings({ privacy: { friendRequests: value } })}
        />
      </Card>

      <Card>
        <AppText variant="subtitle">Notifications</AppText>
        {["gameInvites", "friendRequests", "messages", "tournaments", "community", "supporter"].map((key) => (
          <ToggleRow
            key={key}
            label={labelFor(key)}
            value={settings?.notifications?.[key] ?? true}
            onValueChange={(value) => mergeSettings({ notifications: { [key]: value } })}
          />
        ))}
        <Button
          label="Prepare push token"
          variant="secondary"
          onPress={() => {
            registerDevicePushTokenAfterLogin()
              .then((result) => setPushStatus(result.status === "registered" ? "Expo push token registered for this device." : result.message))
              .catch((error) => setPushStatus(error.message));
          }}
        />
        {pushStatus ? <AppText variant="caption" muted>{pushStatus}</AppText> : null}
      </Card>

      <Card>
        <AppText variant="subtitle">Appearance</AppText>
        <ToggleRow
          label="Dark theme"
          value={theme === "dark"}
          onValueChange={(value) => {
            const nextTheme = value ? "dark" : "light";
            setTheme(nextTheme);
            mergeSettings({ appearance: { theme: nextTheme } });
          }}
        />
        <OptionRow
          label="Board"
          options={BOARD_THEMES}
          value={settings?.appearance?.boardTheme || "classic"}
          onChange={(value) => mergeSettings({ appearance: { boardTheme: value } })}
        />
      </Card>

      <Card>
        <AppText variant="subtitle">Gameplay</AppText>
        <OptionRow
          label="Default mode"
          options={DEFAULT_MODES}
          value={settings?.gameplay?.defaultMode || "ai"}
          onChange={(value) => mergeSettings({ gameplay: { defaultMode: value } })}
        />
        <OptionRow
          label="Board orientation"
          options={ORIENTATIONS}
          value={settings?.gameplay?.boardOrientation || "white"}
          onChange={(value) => mergeSettings({ gameplay: { boardOrientation: value } })}
        />
        <ToggleRow
          label="Move confirmation"
          value={settings?.gameplay?.moveConfirmation ?? false}
          onValueChange={(value) => mergeSettings({ gameplay: { moveConfirmation: value } })}
        />
        <ToggleRow
          label="Sound effects"
          value={soundEffects}
          onValueChange={(value) => {
            setSoundEffects(value);
            mergeSettings({ gameplay: { soundEffects: value } });
          }}
        />
      </Card>

      <Card>
        <AppText variant="subtitle">Security</AppText>
        <ToggleRow
          label="Biometric app unlock"
          value={biometricEnabled}
          disabled={!biometricAvailable}
          onValueChange={(value) => {
            setBiometricEnabled(value);
            saveBiometricUnlockEnabled(value).catch(() => undefined);
          }}
        />
        <AppText variant="caption" muted>
          {biometricAvailable ? "Biometric unlock protects app foreground access on this device." : "Biometric unlock is unavailable until this device has supported biometrics enrolled."}
        </AppText>
      </Card>

      {mutation.isPending ? <AppText muted>Saving...</AppText> : null}
      <Card>
        <AppText variant="subtitle">Billing and referrals</AppText>
        <AppText muted>Supporter status, manual payment requests, entitlements, and referral rewards are managed from backend-driven mobile screens.</AppText>
        <View style={styles.actionRow}>
          <View style={styles.action}>
            <Link href={"/billing" as never} asChild>
              <Pressable>
                <Button label="Billing" variant="secondary" />
              </Pressable>
            </Link>
          </View>
          <View style={styles.action}>
            <Link href={"/referrals" as never} asChild>
              <Pressable>
                <Button label="Referrals" variant="secondary" />
              </Pressable>
            </Link>
          </View>
        </View>
      </Card>
      <Card>
        <AppText variant="subtitle">Advanced tools</AppText>
        <AppText muted>Tournaments, analysis notes, openings, notifications, and support use the existing ChessPlay backend where available.</AppText>
        <View style={styles.actionRow}>
          <View style={styles.action}>
            <Link href={"/tournaments" as never} asChild>
              <Pressable>
                <Button label="Tournaments" variant="secondary" />
              </Pressable>
            </Link>
          </View>
          <View style={styles.action}>
            <Link href={"/analysis" as never} asChild>
              <Pressable>
                <Button label="Analysis" variant="secondary" />
              </Pressable>
            </Link>
          </View>
        </View>
        <View style={styles.actionRow}>
          <View style={styles.action}>
            <Link href={"/openings" as never} asChild>
              <Pressable>
                <Button label="Openings" variant="secondary" />
              </Pressable>
            </Link>
          </View>
          <View style={styles.action}>
            <Link href={"/notifications" as never} asChild>
              <Pressable>
                <Button label="Notifications" variant="secondary" />
              </Pressable>
            </Link>
          </View>
        </View>
        <Link href={"/support" as never} asChild>
          <Pressable>
            <Button label="Feedback and support" variant="secondary" />
          </Pressable>
        </Link>
      </Card>
      <Card>
        <AppText variant="subtitle">Network</AppText>
        <AppText muted>Production API and Socket.IO URLs are loaded from public Expo environment variables.</AppText>
      </Card>
      <Card>
        <AppText variant="subtitle">Legal and account</AppText>
        <AppText muted>Privacy policy and account deletion requests must point to production support URLs before store submission.</AppText>
        <Button label="Privacy policy" variant="secondary" onPress={() => Linking.openURL("https://getchessplay.com/privacy")} />
        <Button label="Terms of service" variant="secondary" onPress={() => Linking.openURL("https://getchessplay.com/terms")} />
        <Button label="Request account deletion" variant="secondary" onPress={() => Linking.openURL("https://getchessplay.com/support/delete-account")} />
        <Button label="Contact support" variant="secondary" onPress={() => Linking.openURL("https://getchessplay.com/support")} />
      </Card>
      <Button label="Log out" variant="danger" onPress={() => Alert.alert("Log out", "End this mobile session?", [{ text: "Cancel" }, { text: "Log out", onPress: logout }])} />
    </Screen>
  );
}

function ToggleRow({ label, value, disabled, onValueChange }: { label: string; value: boolean; disabled?: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={styles.row}>
      <AppText>{label}</AppText>
      <Switch value={value} disabled={disabled} onValueChange={onValueChange} />
    </View>
  );
}

function OptionRow<T extends string>({ label, options, value, onChange }: { label: string; options: readonly T[]; value: string; onChange: (value: T) => void }) {
  return (
    <View style={styles.optionBlock}>
      <AppText>{label}</AppText>
      <View style={styles.optionRow}>
        {options.map((option) => (
          <Pressable key={option} onPress={() => onChange(option)} style={[styles.option, value === option ? styles.optionActive : null]}>
            <AppText variant="caption">{labelFor(option)}</AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function labelFor(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/Of/g, " of")
    .replace(/^./, (char) => char.toUpperCase());
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  optionBlock: { gap: 8 },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  optionActive: { borderWidth: 2 },
  actionRow: { flexDirection: "row", gap: 10 },
  action: { flex: 1 }
});
