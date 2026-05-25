import { create } from "zustand";
import type { LiveRoom, RoomChatMessage } from "@/types/chess";

type GameStore = {
  liveRoom: LiveRoom | null;
  roomChat: RoomChatMessage[];
  lastServerError: string | null;
  drawOffer: { fromColor?: string; fromName?: string } | null;
  queueSize: number;
  connectionStatus: "idle" | "connecting" | "connected" | "error";
  setLiveRoom: (room: LiveRoom | null) => void;
  appendRoomChat: (message: RoomChatMessage) => void;
  setRoomChat: (messages: RoomChatMessage[]) => void;
  setLastServerError: (message: string | null) => void;
  setDrawOffer: (offer: GameStore["drawOffer"]) => void;
  setQueueSize: (queueSize: number) => void;
  setConnectionStatus: (status: GameStore["connectionStatus"]) => void;
};

export const useGameStore = create<GameStore>((set) => ({
  liveRoom: null,
  roomChat: [],
  lastServerError: null,
  drawOffer: null,
  queueSize: 0,
  connectionStatus: "idle",
  setLiveRoom: (liveRoom) => set({ liveRoom, roomChat: liveRoom?.chatHistory || liveRoom?.gameState.chatHistory || [] }),
  appendRoomChat: (message) => set((state) => ({ roomChat: [...state.roomChat, message].slice(-50) })),
  setRoomChat: (roomChat) => set({ roomChat }),
  setLastServerError: (lastServerError) => set({ lastServerError }),
  setDrawOffer: (drawOffer) => set({ drawOffer }),
  setQueueSize: (queueSize) => set({ queueSize }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus })
}));
