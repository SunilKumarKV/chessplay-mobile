import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { ClockState, PlayerColor } from "@/types/chess";

function formatMs(value: number) {
  const totalSeconds = Math.max(0, Math.ceil(value / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function ClockFace({ label, color, clock }: { label: string; color: PlayerColor; clock: ClockState }) {
  const colors = useThemeColors();
  const ms = color === "w" ? clock.whiteMs : clock.blackMs;
  const active = clock.enabled && clock.status === "running" && clock.activeColor === color;
  const low = clock.enabled && ms <= 10_000;
  return (
    <View
      style={[
        styles.clock,
        {
          backgroundColor: active ? colors.primarySoft : colors.surfaceMuted,
          borderColor: low ? colors.danger : active ? colors.primary : colors.border
        }
      ]}
    >
        <AppText muted>{label}{active ? " to move" : ""}</AppText>
        <AppText variant="subtitle">{formatMs(ms)}</AppText>
        {low ? <AppText muted>Low time</AppText> : null}
    </View>
  );
}

export function TimerBar({
  white = "10:00",
  black = "10:00",
  clock,
  whiteLabel = "White",
  blackLabel = "Black"
}: {
  white?: string;
  black?: string;
  clock?: ClockState | null;
  whiteLabel?: string;
  blackLabel?: string;
}) {
  const colors = useThemeColors();
  if (clock?.enabled) {
    return (
      <View style={styles.row}>
        <ClockFace label={whiteLabel} color="w" clock={clock} />
        <ClockFace label={blackLabel} color="b" clock={clock} />
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={[styles.clock, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <AppText muted>{whiteLabel}</AppText>
        <AppText variant="subtitle">{white}</AppText>
      </View>
      <View style={[styles.clock, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <AppText muted>{blackLabel}</AppText>
        <AppText variant="subtitle">{black}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  clock: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 12, gap: 4 }
});
