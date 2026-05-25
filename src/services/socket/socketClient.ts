import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "@/constants/config";
import { useGameStore } from "@/store/gameStore";
import type { LiveRoom, RoomChatMessage, SocketGameState } from "@/types/chess";

let socket: Socket | null = null;

export function getSocket(accessToken: string) {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    auth: { accessToken },
    reconnection: true,
    reconnectionAttempts: 8,
    timeout: 12000
  });

  const store = useGameStore.getState();
  store.setConnectionStatus("connecting");

  socket.on("connect", () => useGameStore.getState().setConnectionStatus("connected"));
  socket.on("connect_error", (error) => {
    const message = error.message.includes("expired") ? "Your live-game token expired. Reconnect from the Play screen." : error.message;
    useGameStore.getState().setConnectionStatus("error");
    useGameStore.getState().setLastServerError(message);
  });
  socket.on("disconnect", () => useGameStore.getState().setConnectionStatus("idle"));
  socket.on("serverError", (payload: { message?: string }) => useGameStore.getState().setLastServerError(payload.message || "Live game error"));
  socket.on("queueJoined", (payload: { queueSize: number }) => useGameStore.getState().setQueueSize(payload.queueSize));
  socket.on("queueUpdate", (payload: { queueSize: number }) => useGameStore.getState().setQueueSize(payload.queueSize));
  socket.on("queueLeft", (payload: { queueSize: number }) => useGameStore.getState().setQueueSize(payload.queueSize));
  socket.on("matchFound", (payload: LiveRoom) => useGameStore.getState().setLiveRoom(payload));
  socket.on("roomCreated", (payload: Omit<LiveRoom, "color">) => useGameStore.getState().setLiveRoom({ ...payload, color: "w" }));
  socket.on("joinedRoom", (payload: LiveRoom) => useGameStore.getState().setLiveRoom(payload));
  socket.on("rejoinedRoom", (payload: LiveRoom) => useGameStore.getState().setLiveRoom(payload));
  socket.on("playerJoined", (payload: { gameState: SocketGameState }) => {
    const current = useGameStore.getState().liveRoom;
    if (current) useGameStore.getState().setLiveRoom({ ...current, gameState: payload.gameState });
  });
  socket.on("moveMade", (payload: { gameState: SocketGameState }) => {
    const current = useGameStore.getState().liveRoom;
    if (current) useGameStore.getState().setLiveRoom({ ...current, gameState: payload.gameState });
  });
  socket.on("drawAccepted", (payload: { gameState: SocketGameState }) => {
    const current = useGameStore.getState().liveRoom;
    if (current) useGameStore.getState().setLiveRoom({ ...current, gameState: payload.gameState });
    useGameStore.getState().setDrawOffer(null);
  });
  socket.on("drawOffer", (payload: { fromColor?: string; fromName?: string }) => useGameStore.getState().setDrawOffer(payload));
  socket.on("drawDeclined", () => useGameStore.getState().setDrawOffer(null));
  socket.on("playerResigned", (payload: { gameState: SocketGameState }) => {
    const current = useGameStore.getState().liveRoom;
    if (current) useGameStore.getState().setLiveRoom({ ...current, gameState: payload.gameState });
  });
  socket.on("chatMessage", (payload: RoomChatMessage) => useGameStore.getState().appendRoomChat(payload));
  socket.on("roomClosed", (payload: { message?: string }) => {
    useGameStore.getState().setLastServerError(payload.message || "Room closed");
    useGameStore.getState().setLiveRoom(null);
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  useGameStore.getState().setConnectionStatus("idle");
}

export function emitSocket(event: string, payload?: unknown) {
  socket?.emit(event, payload);
}
