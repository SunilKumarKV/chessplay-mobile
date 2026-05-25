import { create } from "zustand";
import type { ClockState, LiveRoom, PlayerColor, RoomChatMessage } from "@/types/chess";

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
  isSearching: boolean;
  clock: ClockState | null;
  clockServerNow: number | null;
  timeoutResult: { color?: PlayerColor; winnerColor?: PlayerColor; message: string } | null;
  resultSummary: { status?: string; winnerColor?: PlayerColor | null; message?: string; reason?: string } | null;
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
  setIsSearching: (isSearching: boolean) => void;
  setClock: (clock: ClockState | null, serverNow?: number | null) => void;
  setTimeoutResult: (result: GameStore["timeoutResult"]) => void;
  setResultSummary: (summary: GameStore["resultSummary"]) => void;
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
  isSearching: false,
  clock: null,
  clockServerNow: null,
  timeoutResult: null,
  resultSummary: null,
  roomOperation: "none",
  setLiveRoom: (liveRoom) =>
    set((state) => ({
      liveRoom,
      roomChat: liveRoom?.chatHistory || liveRoom?.gameState.chatHistory || [],
      clock: liveRoom?.gameState.clock || state.clock,
      roomLifecycle: liveRoom ? "connected" : state.roomLifecycle,
      roomOperation: "none",
      isSearching: liveRoom ? false : state.isSearching
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
  setIsSearching: (isSearching) => set({ isSearching }),
  setClock: (clock, clockServerNow = null) => set({ clock, clockServerNow }),
  setTimeoutResult: (timeoutResult) => set({ timeoutResult }),
  setResultSummary: (resultSummary) => set({ resultSummary }),
  setRoomOperation: (roomOperation) => set({ roomOperation })
}));
