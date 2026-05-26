import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef } from "react";
import { AppState } from "react-native";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { restoreMobileSession } from "@/services/api/authSession";
import { authenticateIfBiometricEnabled } from "@/services/native/biometricUnlock";
import { handleInitialDeepLink, subscribeToDeepLinks } from "@/services/native/deepLinks";
import { getExpoPushTokenAfterLogin } from "@/services/native/pushNotifications";
import { recoverActiveGame } from "@/services/socket/rejoinActiveGame";
import { disconnectSocket } from "@/services/socket/socketClient";
import { useAuthStore } from "@/store/authStore";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const queryClient = useMemo(() => new QueryClient(), []);
  const router = useRouter();
  const segments = useSegments();
  const { hydrated, user, hasOnboarded, setHydrated } = useAuthStore();
  const theme = useSettingsStore((state) => state.theme);
  const pushPreparedForUser = useRef<string | null>(null);

  useEffect(() => {
    restoreMobileSession()
      .then(async () => {
        if (useAuthStore.getState().user) {
          const unlocked = await authenticateIfBiometricEnabled();
          if (!unlocked) useAuthStore.getState().setAuthError("Biometric unlock was cancelled.");
          return recoverActiveGame("launch");
        }
        return null;
      })
      .finally(() => setHydrated(true));
  }, [setHydrated]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && useAuthStore.getState().user) {
        authenticateIfBiometricEnabled()
          .then((unlocked) => {
            if (!unlocked) useAuthStore.getState().setAuthError("Biometric unlock was cancelled.");
            return recoverActiveGame("foreground");
          })
          .catch(() => {});
      } else if (state === "background" && !useGameStore.getState().liveRoom) {
        disconnectSocket();
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => subscribeToDeepLinks(router), [router]);

  useEffect(() => {
    if (!hydrated) return;
    handleInitialDeepLink(router).catch(() => undefined);
  }, [hydrated, router]);

  useEffect(() => {
    if (!user?.id || pushPreparedForUser.current === user.id) return;
    pushPreparedForUser.current = user.id;
    getExpoPushTokenAfterLogin()
      .then((result) => {
        if (result.status === "missing-project-id") useAuthStore.getState().setAuthError(result.message);
      })
      .catch(() => undefined);
  }, [user?.id]);

  useEffect(() => {
    if (!hydrated) return;
    const group = segments[0];
    if (!hasOnboarded && group !== "onboarding") router.replace("/onboarding");
    else if (hasOnboarded && !user && group !== "(auth)") router.replace("/(auth)/login");
    else if (hasOnboarded && user && (group === "(auth)" || group === "onboarding")) router.replace("/(tabs)");
    SplashScreen.hideAsync().catch(() => {});
  }, [hasOnboarded, hydrated, router, segments, user]);

  if (!hydrated) return null;

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="game/live" />
          <Stack.Screen name="game/result" />
        </Stack>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
