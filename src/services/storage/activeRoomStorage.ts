import * as SecureStore from "expo-secure-store";
import type { LiveRoom, PlayerColor, SocketGameState } from "@/types/chess";

const ACTIVE_ROOM_ID_KEY = "chessplay.activeRoomId";
const ACTIVE_COLOR_KEY = "chessplay.activeColor";
const LAST_GAME_STATE_KEY = "chessplay.lastKnownGameState";
const LAST_CONNECTED_AT_KEY = "chessplay.lastConnectedAt";

export type ActiveRoomSnapshot = {
  activeRoomId: string | null;
  activeColor: PlayerColor | null;
  lastKnownGameState: SocketGameState | null;
  lastConnectedAt: number | null;
};

export async function saveActiveRoomSnapshot(room: LiveRoom) {
  await Promise.all([
    SecureStore.setItemAsync(ACTIVE_ROOM_ID_KEY, room.roomId),
    SecureStore.setItemAsync(ACTIVE_COLOR_KEY, room.color),
    SecureStore.setItemAsync(LAST_GAME_STATE_KEY, JSON.stringify(room.gameState)),
    SecureStore.setItemAsync(LAST_CONNECTED_AT_KEY, String(Date.now()))
  ]);
}

export async function readActiveRoomSnapshot(): Promise<ActiveRoomSnapshot> {
  const [activeRoomId, activeColor, gameStateJson, lastConnectedAt] = await Promise.all([
    SecureStore.getItemAsync(ACTIVE_ROOM_ID_KEY),
    SecureStore.getItemAsync(ACTIVE_COLOR_KEY),
    SecureStore.getItemAsync(LAST_GAME_STATE_KEY),
    SecureStore.getItemAsync(LAST_CONNECTED_AT_KEY)
  ]);

  return {
    activeRoomId,
    activeColor: activeColor === "w" || activeColor === "b" ? activeColor : null,
    lastKnownGameState: gameStateJson ? (JSON.parse(gameStateJson) as SocketGameState) : null,
    lastConnectedAt: lastConnectedAt ? Number(lastConnectedAt) : null
  };
}

export async function clearActiveRoomSnapshot() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACTIVE_ROOM_ID_KEY),
    SecureStore.deleteItemAsync(ACTIVE_COLOR_KEY),
    SecureStore.deleteItemAsync(LAST_GAME_STATE_KEY),
    SecureStore.deleteItemAsync(LAST_CONNECTED_AT_KEY)
  ]);
}
