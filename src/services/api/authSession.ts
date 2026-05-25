import { api, isApiError } from "@/services/api/client";
import { clearAuthSession, readAuthSession, saveAuthSession } from "@/services/storage/authStorage";
import { disconnectSocket } from "@/services/socket/socketClient";
import { useAuthStore } from "@/store/authStore";

export async function restoreMobileSession() {
  const stored = await readAuthSession();
  const store = useAuthStore.getState();
  const storedAccessToken = stored.accessToken;
  const storedSocketToken = stored.socketToken;

  if (!stored.user || !storedAccessToken) {
    store.setOnboarded(stored.hasOnboarded);
    return;
  }

  store.setSession({ user: stored.user, accessToken: storedAccessToken, socketToken: storedSocketToken });

  try {
    const session = await api.session();
    if (!session.user) {
      await clearMobileSession();
      store.setOnboarded(stored.hasOnboarded);
      return;
    }
    const refreshedSocketToken = await refreshSocketToken().catch(() => storedSocketToken || storedAccessToken);
    store.setSession({ user: session.user, accessToken: storedAccessToken, socketToken: refreshedSocketToken });
    await saveAuthSession({ user: session.user, accessToken: storedAccessToken, socketToken: refreshedSocketToken });
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
  // Backend compatibility: this token is signed as an access JWT today.
  // TODO backend: return accessToken, refreshToken, and socketToken separately.
  const refreshedSocketToken = response.socketToken;
  useAuthStore.getState().setSocketToken(refreshedSocketToken);
  const { user, accessToken } = useAuthStore.getState();
  if (user) await saveAuthSession({ user, accessToken, socketToken: refreshedSocketToken });
  return refreshedSocketToken;
}

export async function clearMobileSession() {
  disconnectSocket();
  await clearAuthSession();
  useAuthStore.getState().clearSession();
}
