import { api, isApiError } from "@/services/api/client";
import { clearAuthSession, readAuthSession, saveAuthSession } from "@/services/storage/authStorage";
import { clearActiveRoomSnapshot } from "@/services/storage/activeRoomStorage";
import { disconnectSocket, setSocketTokenRefreshHandler } from "@/services/socket/socketClient";
import { useAuthStore } from "@/store/authStore";
import { useGameStore } from "@/store/gameStore";

export async function restoreMobileSession() {
  const stored = await readAuthSession();
  const store = useAuthStore.getState();
  const storedAccessToken = stored.accessToken;
  const storedRefreshToken = stored.refreshToken;
  const storedSocketToken = stored.socketToken;

  if (!stored.user || !storedAccessToken) {
    store.setOnboarded(stored.hasOnboarded);
    return;
  }

  store.setSession({ user: stored.user, accessToken: storedAccessToken, refreshToken: storedRefreshToken, socketToken: storedSocketToken });

  try {
    let session: Awaited<ReturnType<typeof api.session>>;
    try {
      session = await api.session();
    } catch (error) {
      if (!storedRefreshToken || !isApiError(error) || error.status !== 401) throw error;
      const refreshed = await refreshMobileTokens(storedRefreshToken);
      if (!refreshed) throw error;
      session = await api.session();
    }
    if (!session.user) {
      await clearMobileSession();
      store.setOnboarded(stored.hasOnboarded);
      return;
    }
    const refreshedSocketToken = await refreshSocketToken().catch(() => storedSocketToken || storedAccessToken);
    const { accessToken, refreshToken } = useAuthStore.getState();
    store.setSession({ user: session.user, accessToken: accessToken || storedAccessToken, refreshToken, socketToken: refreshedSocketToken });
    await saveAuthSession({ user: session.user, accessToken: accessToken || storedAccessToken, refreshToken, socketToken: refreshedSocketToken });
  } catch (error) {
    if (isApiError(error) && error.status === 0) {
      store.setAuthError("You appear to be offline. Some account data may be stale.");
      return;
    }
    await clearMobileSession();
  } finally {
    store.setOnboarded(stored.hasOnboarded);
  }
}

export async function refreshSocketToken() {
  const response = await api.socketToken();
  const refreshedSocketToken = response.socketToken;
  useAuthStore.getState().setSocketToken(refreshedSocketToken);
  const { user, accessToken, refreshToken } = useAuthStore.getState();
  if (user) await saveAuthSession({ user, accessToken, refreshToken, socketToken: refreshedSocketToken });
  return refreshedSocketToken;
}

export async function refreshMobileTokens(refreshTokenOverride?: string | null) {
  const current = useAuthStore.getState();
  const refreshToken = refreshTokenOverride || current.refreshToken;
  if (!refreshToken) return null;

  try {
    const response = await api.refresh(refreshToken);
    const accessToken = response.accessToken || response.socketToken || null;
    const nextRefreshToken = response.refreshToken || refreshToken;
    const socketToken = response.socketToken || response.accessToken || null;
    if (!accessToken || !socketToken) return null;

    const user = response.user || current.user;
    if (!user) return null;
    useAuthStore.getState().setSession({ user, accessToken, refreshToken: nextRefreshToken, socketToken });
    await saveAuthSession({ user, accessToken, refreshToken: nextRefreshToken, socketToken });
    return { accessToken, refreshToken: nextRefreshToken, socketToken };
  } catch {
    await clearMobileSession();
    return null;
  }
}

export async function clearMobileSession() {
  disconnectSocket();
  await clearActiveRoomSnapshot();
  await clearAuthSession();
  useGameStore.getState().setLiveRoom(null);
  useAuthStore.getState().clearSession();
}

setSocketTokenRefreshHandler(async () => {
  const refreshed = await refreshMobileTokens();
  return refreshed?.socketToken || refreshed?.accessToken || null;
});
