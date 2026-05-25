import * as SecureStore from "expo-secure-store";

export type LocalBoardTheme = "classic" | "blue" | "green" | "dark";
export type LocalBoardOrientation = "white" | "black" | "auto";

export type LocalGamePreferences = {
  whiteName: string;
  blackName: string;
  timeControlIndex: number | null;
  orientation: LocalBoardOrientation;
  boardTheme: LocalBoardTheme;
  soundEnabled: boolean;
};

const LOCAL_GAME_PREFS_KEY = "chessplay.localGamePreferences";

export const DEFAULT_LOCAL_GAME_PREFERENCES: LocalGamePreferences = {
  whiteName: "White",
  blackName: "Black",
  timeControlIndex: null,
  orientation: "white",
  boardTheme: "classic",
  soundEnabled: false
};

function normalizePreferences(value: Partial<LocalGamePreferences> | null): LocalGamePreferences {
  return {
    ...DEFAULT_LOCAL_GAME_PREFERENCES,
    ...(value || {}),
    timeControlIndex: typeof value?.timeControlIndex === "number" ? value.timeControlIndex : null,
    orientation: value?.orientation === "black" || value?.orientation === "auto" ? value.orientation : "white",
    boardTheme: value?.boardTheme === "blue" || value?.boardTheme === "green" || value?.boardTheme === "dark" ? value.boardTheme : "classic",
    soundEnabled: Boolean(value?.soundEnabled)
  };
}

export async function readLocalGamePreferences(): Promise<LocalGamePreferences> {
  const raw = await SecureStore.getItemAsync(LOCAL_GAME_PREFS_KEY);
  if (!raw) return DEFAULT_LOCAL_GAME_PREFERENCES;
  try {
    return normalizePreferences(JSON.parse(raw) as Partial<LocalGamePreferences>);
  } catch {
    return DEFAULT_LOCAL_GAME_PREFERENCES;
  }
}

export async function saveLocalGamePreferences(preferences: LocalGamePreferences) {
  await SecureStore.setItemAsync(LOCAL_GAME_PREFS_KEY, JSON.stringify(normalizePreferences(preferences)));
}
