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

export type RoomLifecycleState =
  | "idle"
  | "creating"
  | "joining"
  | "connected"
  | "reconnecting"
  | "opponent_disconnected"
  | "draw_offered"
  | "game_over"
  | "room_closed";

type GameStore = {
  liveRoom: LiveRoom | null;
  roomChat: RoomChatMessage[];
  lastServerError: string | null;
  drawOffer: { fromColor?: string; fromName?: string } | null;
  queueSize: number;
  connectionStatus: "idle" | "connecting" | "connected" | "error";
  roomLifecycle: RoomLifecycleState;
  reconnectStatus: ReconnectStatus;
  lifecycleMessage: string | null;
  opponentReconnectBy: number | null;
  spectatorCount: number;
  roomsList: RoomListItem[];
  isSpectating: boolean;
  drawOfferSent: boolean;
  roomOperation: "none" | "creating" | "joining" | "spectating" | "browsing";
  setLiveRoom: (room: LiveRoom | null) => void;
  appendRoomChat: (message: RoomChatMessage) => void;
  setRoomChat: (messages: RoomChatMessage[]) => void;
  setLastServerError: (message: string | null) => void;
  setDrawOffer: (offer: GameStore["drawOffer"]) => void;
  setQueueSize: (queueSize: number) => void;
  setConnectionStatus: (status: GameStore["connectionStatus"]) => void;
  setReconnectStatus: (status: ReconnectStatus, message?: string | null, reconnectBy?: number | null) => void;
  setRoomLifecycle: (state: RoomLifecycleState, message?: string | null) => void;
  setSpectatorCount: (count: number) => void;
  setRoomsList: (rooms: RoomListItem[]) => void;
  setIsSpectating: (isSpectating: boolean) => void;
  setDrawOfferSent: (drawOfferSent: boolean) => void;
  setRoomOperation: (roomOperation: GameStore["roomOperation"]) => void;
};

export const useGameStore = create<GameStore>((set) => ({
  liveRoom: null,
  roomChat: [],
  lastServerError: null,
  drawOffer: null,
  queueSize: 0,
  connectionStatus: "idle",
  roomLifecycle: "idle",
  reconnectStatus: "idle",
  lifecycleMessage: null,
  opponentReconnectBy: null,
  spectatorCount: 0,
  roomsList: [],
  isSpectating: false,
  drawOfferSent: false,
  roomOperation: "none",
  setLiveRoom: (liveRoom) =>
    set((state) => ({
      liveRoom,
      roomChat: liveRoom?.chatHistory || liveRoom?.gameState.chatHistory || [],
      roomLifecycle: liveRoom ? "connected" : state.roomLifecycle,
      roomOperation: "none"
    })),
  appendRoomChat: (message) => set((state) => ({ roomChat: [...state.roomChat, message].slice(-50) })),
  setRoomChat: (roomChat) => set({ roomChat }),
  setLastServerError: (lastServerError) => set({ lastServerError }),
  setDrawOffer: (drawOffer) => set({ drawOffer }),
  setQueueSize: (queueSize) => set({ queueSize }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setReconnectStatus: (reconnectStatus, lifecycleMessage = null, opponentReconnectBy = null) =>
    set({ reconnectStatus, lifecycleMessage, opponentReconnectBy }),
  setRoomLifecycle: (roomLifecycle, lifecycleMessage = null) => set({ roomLifecycle, lifecycleMessage }),
  setSpectatorCount: (spectatorCount) => set({ spectatorCount }),
  setRoomsList: (roomsList) => set({ roomsList }),
  setIsSpectating: (isSpectating) => set({ isSpectating }),
  setDrawOfferSent: (drawOfferSent) => set({ drawOfferSent }),
  setRoomOperation: (roomOperation) => set({ roomOperation })
}));
