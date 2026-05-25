import { create } from "zustand";
import type { ThemeName } from "@/theme/colors";

type SettingsState = {
  theme: ThemeName;
  soundEffects: boolean;
  setTheme: (theme: ThemeName) => void;
  setSoundEffects: (value: boolean) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: "dark",
  soundEffects: true,
  setTheme: (theme) => set({ theme }),
  setSoundEffects: (soundEffects) => set({ soundEffects })
}));

