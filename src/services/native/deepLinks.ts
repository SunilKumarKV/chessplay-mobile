import * as Linking from "expo-linking";
import type { Router } from "expo-router";
import { useAuthStore } from "@/store/authStore";

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function handleDeepLink(url: string, router: Router) {
  const parsed = Linking.parse(url);
  const path = parsed.path || "";
  const segments = path.split("/").filter(Boolean);
  const [resource, id] = segments;
  const query = parsed.queryParams || {};

  if (resource === "room" && id) {
    router.push({ pathname: "/(tabs)/play" as never, params: { roomCode: id.toUpperCase() } });
    return;
  }

  if (resource === "profile" && id) {
    router.push(`/profile/${encodeURIComponent(id)}` as never);
    return;
  }

  if (resource === "reset-password" || resource === "password-reset") {
    useAuthStore.getState().setAuthError("Password reset links open on web until the backend exposes a mobile reset completion endpoint.");
    router.push("/(auth)/forgot-password");
    return;
  }

  if (resource === "verify-email" || resource === "email-verify") {
    const token = firstString(query.token);
    useAuthStore.getState().setAuthError(token ? "Email verification links are recognized. Mobile completion is pending backend deep-link support." : "Email verification link is missing a token.");
    router.push("/(auth)/login");
  }
}

export async function handleInitialDeepLink(router: Router) {
  const url = await Linking.getInitialURL();
  if (url) handleDeepLink(url, router);
}

export function subscribeToDeepLinks(router: Router) {
  const subscription = Linking.addEventListener("url", ({ url }) => handleDeepLink(url, router));
  return () => subscription.remove();
}
