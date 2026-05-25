import { gamesApi, isApiError } from "@/services/api/client";
import { refreshMobileTokens } from "@/services/api/authSession";
import { clearActiveRoomSnapshot, readActiveRoomSnapshot, saveActiveRoomSnapshot } from "@/services/storage/activeRoomStorage";
import { getSocket } from "@/services/socket/socketClient";
import { useAuthStore } from "@/store/authStore";
import { useGameStore } from "@/store/gameStore";

type RecoverySource = "launch" | "foreground" | "manual";

async function tokenForSocket() {
  const auth = useAuthStore.getState();
  if (auth.socketToken || auth.accessToken) return auth.socketToken || auth.accessToken;
  const refreshed = await refreshMobileTokens();
  return refreshed?.socketToken || refreshed?.accessToken || null;
}

export async function recoverActiveGame(source: RecoverySource = "manual") {
  const store = useGameStore.getState();
  store.setReconnectStatus("reconnecting", source === "manual" ? "Checking for an active game..." : "Restoring active game...");

  try {
    const response = await gamesApi.activeRoom();
    const activeRoom = response.activeRoom;

    if (!activeRoom) {
      await clearActiveRoomSnapshot();
      store.setReconnectStatus("idle");
      return null;
    }

    store.setLiveRoom(activeRoom);
    await saveActiveRoomSnapshot(activeRoom);

    const token = await tokenForSocket();
    if (!token) {
      store.setReconnectStatus("error", "Sign in again to rejoin your active game.");
      return activeRoom;
    }

    const socket = getSocket(token);
    if (!socket) return activeRoom;

    const emitRejoin = () => {
      useGameStore.getState().setReconnectStatus("reconnecting", "Rejoining active game...");
      socket.emit("rejoinRoom", { roomId: activeRoom.roomId });
    };
    if (socket.connected) emitRejoin();
    else socket.once("connect", emitRejoin);

    return activeRoom;
  } catch (error) {
    const snapshot = await readActiveRoomSnapshot().catch(() => null);
    if (snapshot?.activeRoomId && snapshot.activeColor && snapshot.lastKnownGameState) {
      store.setLiveRoom({
        roomId: snapshot.activeRoomId,
        color: snapshot.activeColor,
        gameState: snapshot.lastKnownGameState,
        chatHistory: snapshot.lastKnownGameState.chatHistory || []
      });
    }
    if (isApiError(error) && error.status === 401) {
      const refreshed = await refreshMobileTokens();
      if (refreshed) return recoverActiveGame(source);
    }
    store.setReconnectStatus("error", error instanceof Error ? error.message : "Unable to restore active game.");
    return null;
  }
}
