import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "@/constants/config";
import { clearActiveRoomSnapshot, readActiveRoomSnapshot, saveActiveRoomSnapshot } from "@/services/storage/activeRoomStorage";
import { useGameStore } from "@/store/gameStore";
import type { ClockState, LiveRoom, PlayerColor, RoomChatMessage, SocketGameState } from "@/types/chess";

let socket: Socket | null = null;
let activeAccessToken: string | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;
let tokenRefreshInFlight: Promise<string | null> | null = null;

function isTerminalStatus(status?: string) {
  return ["checkmate", "stalemate", "draw", "resigned", "abandoned", "timeout", "draw-50move", "draw-repetition"].includes(status || "");
}

function applyLiveRoom(room: LiveRoom, options: { spectating?: boolean; message?: string | null } = {}) {
  useGameStore.getState().setLiveRoom(room);
  if (room.gameState.clock) useGameStore.getState().setClock(room.gameState.clock);
  useGameStore.getState().setIsSpectating(Boolean(options.spectating));
  useGameStore.getState().setReconnectStatus("idle");
  useGameStore.getState().setRoomLifecycle(isTerminalStatus(room.gameState.status) ? "game_over" : "connected", options.message || null);
  if (options.spectating) return;
  saveActiveRoomSnapshot(room).catch(() => {});
}

async function rejoinStoredRoom(nextSocket: Socket) {
  const current = useGameStore.getState().liveRoom;
  const stored = await readActiveRoomSnapshot().catch(() => null);
  const roomId = current?.roomId || stored?.activeRoomId;
  if (!roomId) return;
  useGameStore.getState().setReconnectStatus("reconnecting", "Reconnecting to your active game...");
  useGameStore.getState().setRoomLifecycle("reconnecting", "Reconnecting to your active game...");
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
    useGameStore.getState().setRoomLifecycle(expired ? "reconnecting" : "room_closed", message);
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
    useGameStore.getState().setRoomOperation("none");
    if (/room not found|player is not in this room|invalid room code|room is full/i.test(message)) {
      useGameStore.getState().setRoomLifecycle("room_closed", message);
      clearActiveRoomSnapshot().catch(() => {});
      useGameStore.getState().setLiveRoom(null);
    }
  });
  socket.on("queueJoined", (payload: { queueSize: number }) => {
    useGameStore.getState().setQueueSize(payload.queueSize);
    useGameStore.getState().setIsSearching(true);
    useGameStore.getState().setRoomLifecycle("idle", "Searching for an opponent...");
  });
  socket.on("queueUpdate", (payload: { queueSize: number }) => useGameStore.getState().setQueueSize(payload.queueSize));
  socket.on("queueLeft", (payload: { queueSize: number }) => {
    useGameStore.getState().setQueueSize(payload.queueSize);
    useGameStore.getState().setIsSearching(false);
    useGameStore.getState().setRoomLifecycle("idle", "Matchmaking cancelled.");
  });
  socket.on("matchFound", (payload: LiveRoom) => applyLiveRoom(payload, { message: "Match found." }));
  socket.on("roomCreated", (payload: Omit<LiveRoom, "color">) => applyLiveRoom({ ...payload, color: "w" }, { message: "Room created. Waiting for an opponent." }));
  socket.on("joinedRoom", (payload: LiveRoom) => applyLiveRoom(payload, { message: "Joined room." }));
  socket.on("rejoinedRoom", (payload: LiveRoom) => applyLiveRoom(payload, { message: "Rejoined active game." }));
  socket.on("spectatedRoom", (payload: Omit<LiveRoom, "color"> & { spectatorCount?: number }) => {
    applyLiveRoom({ ...payload, color: "w" }, { spectating: true, message: "Spectating room." });
    useGameStore.getState().setSpectatorCount(payload.spectatorCount || 0);
  });
  socket.on("playerJoined", (payload: { gameState: SocketGameState }) => {
    const current = useGameStore.getState().liveRoom;
    if (current) applyLiveRoom({ ...current, gameState: payload.gameState }, { spectating: useGameStore.getState().isSpectating, message: "Opponent joined." });
  });
  socket.on("moveMade", (payload: { gameState: SocketGameState }) => {
    const current = useGameStore.getState().liveRoom;
    if (current) applyLiveRoom({ ...current, gameState: payload.gameState }, { spectating: useGameStore.getState().isSpectating });
    if (isTerminalStatus(payload.gameState.status)) {
      const winnerColor = payload.gameState.status === "checkmate" ? (payload.gameState.turn === "w" ? "b" : "w") : null;
      useGameStore.getState().setResultSummary({
        status: payload.gameState.status,
        winnerColor,
        message: payload.gameState.status === "checkmate" ? "The game ended by checkmate." : "The game ended in a draw.",
        reason: payload.gameState.status
      });
    }
  });
  socket.on("drawAccepted", (payload: { gameState: SocketGameState }) => {
    const current = useGameStore.getState().liveRoom;
    if (current) applyLiveRoom({ ...current, gameState: payload.gameState }, { message: "Draw accepted." });
    useGameStore.getState().setDrawOffer(null);
    useGameStore.getState().setDrawOfferSent(false);
    useGameStore.getState().setRoomLifecycle("game_over", "Draw accepted.");
    useGameStore.getState().setResultSummary({ status: "draw", winnerColor: null, message: "The game ended by accepted draw.", reason: "draw" });
    clearActiveRoomSnapshot().catch(() => {});
  });
  socket.on("drawOffer", (payload: { fromColor?: string; fromName?: string }) => {
    useGameStore.getState().setDrawOffer(payload);
    useGameStore.getState().setRoomLifecycle("draw_offered", `${payload.fromName || "Opponent"} offered a draw.`);
  });
  socket.on("drawDeclined", () => {
    useGameStore.getState().setDrawOffer(null);
    useGameStore.getState().setDrawOfferSent(false);
    useGameStore.getState().setRoomLifecycle("connected", "Draw offer declined.");
  });
  socket.on("playerResigned", (payload: { color?: string; winnerColor?: string; gameState: SocketGameState }) => {
    const current = useGameStore.getState().liveRoom;
    const message = current?.color && payload.color === current.color ? "You resigned." : "Opponent resigned.";
    if (current) applyLiveRoom({ ...current, gameState: payload.gameState }, { message });
    useGameStore.getState().setRoomLifecycle("game_over", message);
    useGameStore.getState().setResultSummary({ status: "resigned", winnerColor: payload.winnerColor as PlayerColor | undefined, message, reason: "resign" });
    clearActiveRoomSnapshot().catch(() => {});
  });
  socket.on("clockSnapshot", (payload: { clock?: ClockState; serverNow?: number }) => {
    if (payload.clock) useGameStore.getState().setClock(payload.clock, payload.serverNow || null);
  });
  socket.on("clockTick", (payload: { clock?: ClockState; serverNow?: number }) => {
    if (payload.clock) useGameStore.getState().setClock(payload.clock, payload.serverNow || null);
  });
  socket.on("timeoutResult", (payload: { color?: PlayerColor; winnerColor?: PlayerColor; gameState?: SocketGameState; clock?: ClockState; serverNow?: number }) => {
    const current = useGameStore.getState().liveRoom;
    if (payload.clock) useGameStore.getState().setClock(payload.clock, payload.serverNow || null);
    if (current && payload.gameState) useGameStore.getState().setLiveRoom({ ...current, gameState: payload.gameState });
    const didWin = current?.color && payload.winnerColor === current.color;
    const message = didWin ? "You won on time." : payload.color === current?.color ? "You lost on time." : "Game ended on time.";
    useGameStore.getState().setTimeoutResult({ color: payload.color, winnerColor: payload.winnerColor, message });
    useGameStore.getState().setResultSummary({ status: "timeout", winnerColor: payload.winnerColor || null, message, reason: "timeout" });
    useGameStore.getState().setRoomLifecycle("game_over", message);
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
    useGameStore.getState().setRoomLifecycle("opponent_disconnected", `${payload.name || "Opponent"} disconnected.`);
  });
  socket.on("playerRejoined", (payload: { color?: string; name?: string; gameState?: SocketGameState }) => {
    const current = useGameStore.getState().liveRoom;
    if (current && payload.gameState) applyLiveRoom({ ...current, gameState: payload.gameState });
    useGameStore.getState().setReconnectStatus("opponent-rejoined", `${payload.name || "Opponent"} rejoined.`);
    useGameStore.getState().setRoomLifecycle("connected", `${payload.name || "Opponent"} rejoined.`);
  });
  socket.on("playerLeft", (payload: { color?: string; name?: string }) => {
    useGameStore.getState().setReconnectStatus("room-closed", `${payload.name || "Opponent"} left the room.`);
    useGameStore.getState().setRoomLifecycle("room_closed", `${payload.name || "Opponent"} left the room.`);
  });
  socket.on("playerAbandoned", (payload: { color?: string; winnerColor?: string; gameState?: SocketGameState }) => {
    const current = useGameStore.getState().liveRoom;
    if (current && payload.gameState) useGameStore.getState().setLiveRoom({ ...current, gameState: payload.gameState });
    const didWin = current?.color && payload.winnerColor === current.color;
    useGameStore.getState().setReconnectStatus("abandoned", didWin ? "You won by abandonment." : "You lost by abandonment.");
    useGameStore.getState().setRoomLifecycle("game_over", didWin ? "You won by abandonment." : "You lost by abandonment.");
    useGameStore.getState().setResultSummary({
      status: "abandoned",
      winnerColor: payload.winnerColor as PlayerColor | undefined,
      message: didWin ? "You won by abandonment." : "You lost by abandonment.",
      reason: "abandoned"
    });
    clearActiveRoomSnapshot().catch(() => {});
  });
  socket.on("leftRoom", () => {
    clearActiveRoomSnapshot().catch(() => {});
    useGameStore.getState().setReconnectStatus("room-closed", "You left the room.");
    useGameStore.getState().setIsSpectating(false);
    useGameStore.getState().setRoomLifecycle("room_closed", "You left the room.");
    useGameStore.getState().setLiveRoom(null);
  });
  socket.on("roomClosed", (payload: { message?: string }) => {
    useGameStore.getState().setLastServerError(payload.message || "Room closed");
    useGameStore.getState().setReconnectStatus("room-closed", payload.message || "Room closed");
    useGameStore.getState().setIsSpectating(false);
    useGameStore.getState().setRoomLifecycle("room_closed", payload.message || "Room closed");
    clearActiveRoomSnapshot().catch(() => {});
    useGameStore.getState().setLiveRoom(null);
  });
  socket.on("spectatorCount", (payload: { count?: number }) => useGameStore.getState().setSpectatorCount(payload.count || 0));
  socket.on("roomsList", (payload: unknown) => {
    if (Array.isArray(payload)) useGameStore.getState().setRoomsList(payload);
    useGameStore.getState().setRoomOperation("none");
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
