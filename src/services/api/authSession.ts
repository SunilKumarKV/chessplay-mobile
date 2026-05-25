import { api, isApiError } from "@/services/api/client";
import { clearAuthSession, readAuthSession, saveAuthSession } from "@/services/storage/authStorage";
import { disconnectSocket } from "@/services/socket/socketClient";
import { useAuthStore } from "@/store/authStore";

export async function restoreMobileSession() {
  const stored = await readAuthSession();
  const store = useAuthStore.getState();

  if (!stored.user || !stored.accessToken) {
    store.setOnboarded(stored.hasOnboarded);
    return;
  }

  store.setSession({ user: stored.user, accessToken: stored.accessToken, socketToken: stored.socketToken });

  try {
    const session = await api.session();
    if (!session.user) {
      await clearMobileSession();
      store.setOnboarded(stored.hasOnboarded);
      return;
    }
    const socket = await refreshSocketToken().catch(() => stored.socketToken || stored.accessToken);
    store.setSession({ user: session.user, accessToken: stored.accessToken, socketToken: socket });
    await saveAuthSession({ user: session.user, accessToken: stored.accessToken, socketToken: socket });
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
  useAuthStore.getState().setSocketToken(response.socketToken);
  const { user, accessToken } = useAuthStore.getState();
  if (user) await saveAuthSession({ user, accessToken, socketToken: response.socketToken });
  return response.socketToken;
}

export async function clearMobileSession() {
  disconnectSocket();
  await clearAuthSession();
  useAuthStore.getState().clearSession();
}
