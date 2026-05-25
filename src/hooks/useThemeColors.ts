import { palettes } from "@/theme/colors";
import { useSettingsStore } from "@/store/settingsStore";

export function useThemeColors() {
  const theme = useSettingsStore((state) => state.theme);
  return palettes[theme];
}

