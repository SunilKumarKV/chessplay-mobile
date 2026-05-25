import { create } from "zustand";
import type { LiveRoom, RoomChatMessage } from "@/types/chess";

export type RoomListItem = {
  id: string;
  players?: { w?: string; b?: string };
  spectatorCount?: number;
  isFull?: boolean;
  status?: string;
};

export type ReconnectStatus =
  | "idle"
  | "reconnecting"
  | "opponent-disconnected"
  | "opponent-rejoined"
  | "abandoned"
  | "room-closed"
  | "error";

type GameStore = {
  liveRoom: LiveRoom | null;
  roomChat: RoomChatMessage[];
  lastServerError: string | null;
  drawOffer: { fromColor?: string; fromName?: string } | null;
  queueSize: number;
  connectionStatus: "idle" | "connecting" | "connected" | "error";
  reconnectStatus: ReconnectStatus;
  lifecycleMessage: string | null;
  opponentReconnectBy: number | null;
  spectatorCount: number;
  roomsList: RoomListItem[];
  setLiveRoom: (room: LiveRoom | null) => void;
  appendRoomChat: (message: RoomChatMessage) => void;
  setRoomChat: (messages: RoomChatMessage[]) => void;
  setLastServerError: (message: string | null) => void;
  setDrawOffer: (offer: GameStore["drawOffer"]) => void;
  setQueueSize: (queueSize: number) => void;
  setConnectionStatus: (status: GameStore["connectionStatus"]) => void;
  setReconnectStatus: (status: ReconnectStatus, message?: string | null, reconnectBy?: number | null) => void;
  setSpectatorCount: (count: number) => void;
  setRoomsList: (rooms: RoomListItem[]) => void;
};

export const useGameStore = create<GameStore>((set) => ({
  liveRoom: null,
  roomChat: [],
  lastServerError: null,
  drawOffer: null,
  queueSize: 0,
  connectionStatus: "idle",
  reconnectStatus: "idle",
  lifecycleMessage: null,
  opponentReconnectBy: null,
  spectatorCount: 0,
  roomsList: [],
  setLiveRoom: (liveRoom) => set({ liveRoom, roomChat: liveRoom?.chatHistory || liveRoom?.gameState.chatHistory || [] }),
  appendRoomChat: (message) => set((state) => ({ roomChat: [...state.roomChat, message].slice(-50) })),
  setRoomChat: (roomChat) => set({ roomChat }),
  setLastServerError: (lastServerError) => set({ lastServerError }),
  setDrawOffer: (drawOffer) => set({ drawOffer }),
  setQueueSize: (queueSize) => set({ queueSize }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setReconnectStatus: (reconnectStatus, lifecycleMessage = null, opponentReconnectBy = null) =>
    set({ reconnectStatus, lifecycleMessage, opponentReconnectBy }),
  setSpectatorCount: (spectatorCount) => set({ spectatorCount }),
  setRoomsList: (roomsList) => set({ roomsList })
}));
