import { create } from "zustand";
import type { LiveRoom } from "@/types/chess";

type GameStore = {
  liveRoom: LiveRoom | null;
  queueSize: number;
  connectionStatus: "idle" | "connecting" | "connected" | "error";
  setLiveRoom: (room: LiveRoom | null) => void;
  setQueueSize: (queueSize: number) => void;
  setConnectionStatus: (status: GameStore["connectionStatus"]) => void;
};

export const useGameStore = create<GameStore>((set) => ({
  liveRoom: null,
  queueSize: 0,
  connectionStatus: "idle",
  setLiveRoom: (liveRoom) => set({ liveRoom }),
  setQueueSize: (queueSize) => set({ queueSize }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus })
}));

