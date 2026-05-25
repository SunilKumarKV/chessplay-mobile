import * as SecureStore from "expo-secure-store";
import type { User } from "@/types/api";

const ACCESS_TOKEN_KEY = "chessplay.accessToken";
const REFRESH_TOKEN_KEY = "chessplay.refreshToken";
const SOCKET_TOKEN_KEY = "chessplay.socketToken";
const USER_KEY = "chessplay.user";
const ONBOARDED_KEY = "chessplay.hasOnboarded";

export async function saveAuthSession(input: {
  accessToken?: string | null;
  refreshToken?: string | null;
  socketToken?: string | null;
  user?: unknown;
}) {
  const storedAccessToken = input.accessToken || input.socketToken || null;
  const storedSocketToken = input.socketToken || input.accessToken || null;
  if (storedAccessToken) await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, storedAccessToken);
  if (input.refreshToken) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, input.refreshToken);
  if (storedSocketToken) await SecureStore.setItemAsync(SOCKET_TOKEN_KEY, storedSocketToken);
  if (input.user) await SecureStore.setItemAsync(USER_KEY, JSON.stringify(input.user));
}

export async function readAuthSession() {
  const [storedAccessToken, storedRefreshToken, storedSocketToken, userJson, hasOnboarded] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(SOCKET_TOKEN_KEY),
    SecureStore.getItemAsync(USER_KEY),
    SecureStore.getItemAsync(ONBOARDED_KEY)
  ]);
  return {
    accessToken: storedAccessToken,
    refreshToken: storedRefreshToken,
    socketToken: storedSocketToken,
    user: userJson ? (JSON.parse(userJson) as User) : null,
    hasOnboarded: hasOnboarded === "true"
  };
}

export async function clearAuthSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(SOCKET_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY)
  ]);
}

export async function saveOnboarded(value = true) {
  await SecureStore.setItemAsync(ONBOARDED_KEY, String(value));
}
