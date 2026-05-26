import * as Haptics from "expo-haptics";

type HapticEvent = "move" | "capture" | "check" | "illegal" | "success" | "warning";

export async function playHaptic(event: HapticEvent) {
  try {
    if (event === "illegal" || event === "warning") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (event === "check") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (event === "capture") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (event === "success") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.selectionAsync();
    }
  } catch {
    // Haptics are best-effort and may be unavailable on simulators or low-power devices.
  }
}
