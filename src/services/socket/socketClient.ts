import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "@/constants/config";
import { clearActiveRoomSnapshot, readActiveRoomSnapshot, saveActiveRoomSnapshot } from "@/services/storage/activeRoomStorage";
import { useGameStore } from "@/store/gameStore";
import type { LiveRoom, RoomChatMessage, SocketGameState } from "@/types/chess";

let socket: Socket | null = null;
let activeAccessToken: string | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;
let tokenRefreshInFlight: Promise<string | null> | null = null;

function applyLiveRoom(room: LiveRoom) {
  useGameStore.getState().setLiveRoom(room);
  useGameStore.getState().setReconnectStatus("idle");
  saveActiveRoomSnapshot(room).catch(() => {});
}

async function rejoinStoredRoom(nextSocket: Socket) {
  const current = useGameStore.getState().liveRoom;
  const stored = await readActiveRoomSnapshot().catch(() => null);
  const roomId = current?.roomId || stored?.activeRoomId;
  if (!roomId) return;
  useGameStore.getState().setReconnectStatus("reconnecting", "Reconnecting to your active game...");
  nextSocket.emit("rejoinRoom", { roomId });
}

export function setSocketTokenRefreshHandler(handler: (() => Promise<string | null>) | null) {
  refreshHandler = handler;
}

export function getSocket(accessToken: string) {
  if (!SOCKET_URL) {
    useGameStore.getState().setConnectionStatus("error");
    useGameStore.getState().setLastServerError("Socket URL is not configured. Set EXPO_PUBLIC_SOCKET_URL before live play.");
    return null;
  }

  if (socket?.connected && activeAccessToken === accessToken) return socket;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  activeAccessToken = accessToken;

  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    auth: { accessToken },
    reconnection: true,
    reconnectionAttempts: 8,
    timeout: 12000
  });

  const store = useGameStore.getState();
  store.setConnectionStatus("connecting");

  socket.on("connect", () => {
    useGameStore.getState().setConnectionStatus("connected");
  });
  socket.on("connect_error", (error) => {
    const expired = error.message.toLowerCase().includes("expired");
    const message = expired ? "Your live-game token expired. Refreshing session..." : error.message;
    useGameStore.getState().setConnectionStatus("error");
    useGameStore.getState().setLastServerError(message);
    if (!expired || !refreshHandler) return;
    if (!tokenRefreshInFlight) {
      tokenRefreshInFlight = refreshHandler().finally(() => {
        tokenRefreshInFlight = null;
      });
    }
    tokenRefreshInFlight.then((nextToken) => {
      if (!nextToken) return;
      const nextSocket = getSocket(nextToken);
      if (!nextSocket) return;
      if (nextSocket.connected) rejoinStoredRoom(nextSocket).catch(() => {});
      else nextSocket.once("connect", () => rejoinStoredRoom(nextSocket).catch(() => {}));
    });
  });
  socket.on("disconnect", () => useGameStore.getState().setConnectionStatus("idle"));
  socket.on("serverError", (payload: { message?: string }) => {
    const message = payload.message || "Live game error";
    useGameStore.getState().setLastServerError(message);
    useGameStore.getState().setReconnectStatus("error", message);
    if (/room not found|player is not in this room/i.test(message)) {
      clearActiveRoomSnapshot().catch(() => {});
      useGameStore.getState().setLiveRoom(null);
    }
  });
  socket.on("queueJoined", (payload: { queueSize: number }) => useGameStore.getState().setQueueSize(payload.queueSize));
  socket.on("queueUpdate", (payload: { queueSize: number }) => useGameStore.getState().setQueueSize(payload.queueSize));
  socket.on("queueLeft", (payload: { queueSize: number }) => useGameStore.getState().setQueueSize(payload.queueSize));
  socket.on("matchFound", (payload: LiveRoom) => applyLiveRoom(payload));
  socket.on("roomCreated", (payload: Omit<LiveRoom, "color">) => applyLiveRoom({ ...payload, color: "w" }));
  socket.on("joinedRoom", (payload: LiveRoom) => applyLiveRoom(payload));
  socket.on("rejoinedRoom", (payload: LiveRoom) => applyLiveRoom(payload));
  socket.on("playerJoined", (payload: { gameState: SocketGameState }) => {
    const current = useGameStore.getState().liveRoom;
    if (current) applyLiveRoom({ ...current, gameState: payload.gameState });
  });
  socket.on("moveMade", (payload: { gameState: SocketGameState }) => {
    const current = useGameStore.getState().liveRoom;
    if (current) applyLiveRoom({ ...current, gameState: payload.gameState });
  });
  socket.on("drawAccepted", (payload: { gameState: SocketGameState }) => {
    const current = useGameStore.getState().liveRoom;
    if (current) applyLiveRoom({ ...current, gameState: payload.gameState });
    useGameStore.getState().setDrawOffer(null);
  });
  socket.on("drawOffer", (payload: { fromColor?: string; fromName?: string }) => useGameStore.getState().setDrawOffer(payload));
  socket.on("drawDeclined", () => useGameStore.getState().setDrawOffer(null));
  socket.on("playerResigned", (payload: { gameState: SocketGameState }) => {
    const current = useGameStore.getState().liveRoom;
    if (current) applyLiveRoom({ ...current, gameState: payload.gameState });
    clearActiveRoomSnapshot().catch(() => {});
  });
  socket.on("chatMessage", (payload: RoomChatMessage) => useGameStore.getState().appendRoomChat(payload));
  socket.on("playerDisconnected", (payload: { color?: string; name?: string; reconnectBy?: number; gameState?: SocketGameState }) => {
    const current = useGameStore.getState().liveRoom;
    if (current && payload.gameState) applyLiveRoom({ ...current, gameState: payload.gameState });
    useGameStore.getState().setReconnectStatus(
      "opponent-disconnected",
      `${payload.name || "Opponent"} disconnected. Waiting for reconnect...`,
      payload.reconnectBy || null
    );
  });
  socket.on("playerRejoined", (payload: { color?: string; name?: string; gameState?: SocketGameState }) => {
    const current = useGameStore.getState().liveRoom;
    if (current && payload.gameState) applyLiveRoom({ ...current, gameState: payload.gameState });
    useGameStore.getState().setReconnectStatus("opponent-rejoined", `${payload.name || "Opponent"} rejoined.`);
  });
  socket.on("playerLeft", (payload: { color?: string; name?: string }) => {
    useGameStore.getState().setReconnectStatus("room-closed", `${payload.name || "Opponent"} left the room.`);
  });
  socket.on("playerAbandoned", (payload: { color?: string; winnerColor?: string; gameState?: SocketGameState }) => {
    const current = useGameStore.getState().liveRoom;
    if (current && payload.gameState) useGameStore.getState().setLiveRoom({ ...current, gameState: payload.gameState });
    const didWin = current?.color && payload.winnerColor === current.color;
    useGameStore.getState().setReconnectStatus("abandoned", didWin ? "You won by abandonment." : "You lost by abandonment.");
    clearActiveRoomSnapshot().catch(() => {});
  });
  socket.on("leftRoom", () => {
    clearActiveRoomSnapshot().catch(() => {});
    useGameStore.getState().setReconnectStatus("room-closed", "You left the room.");
    useGameStore.getState().setLiveRoom(null);
  });
  socket.on("roomClosed", (payload: { message?: string }) => {
    useGameStore.getState().setLastServerError(payload.message || "Room closed");
    useGameStore.getState().setReconnectStatus("room-closed", payload.message || "Room closed");
    clearActiveRoomSnapshot().catch(() => {});
    useGameStore.getState().setLiveRoom(null);
  });
  socket.on("spectatorCount", (payload: { count?: number }) => useGameStore.getState().setSpectatorCount(payload.count || 0));
  socket.on("roomsList", (payload: unknown) => {
    if (Array.isArray(payload)) useGameStore.getState().setRoomsList(payload);
  });

  return socket;
}

export function disconnectSocket() {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
  activeAccessToken = null;
  useGameStore.getState().setConnectionStatus("idle");
}

export function emitSocket(event: string, payload?: unknown) {
  socket?.emit(event, payload);
}
