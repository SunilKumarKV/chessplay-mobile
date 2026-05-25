import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { readAuthSession } from "@/services/storage/authStorage";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const queryClient = useMemo(() => new QueryClient(), []);
  const router = useRouter();
  const segments = useSegments();
  const { hydrated, user, hasOnboarded, setHydrated, setSession, setOnboarded } = useAuthStore();
  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    readAuthSession()
      .then((session) => {
        if (session.user) setSession({ user: session.user, accessToken: session.accessToken, socketToken: session.socketToken });
        setOnboarded(session.hasOnboarded);
      })
      .finally(() => setHydrated(true));
  }, [setHydrated, setOnboarded, setSession]);

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
  );
}

