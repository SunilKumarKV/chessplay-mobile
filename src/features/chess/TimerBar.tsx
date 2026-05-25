import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import type { ClockState, PlayerColor } from "@/types/chess";

function formatMs(value: number) {
  const totalSeconds = Math.max(0, Math.ceil(value / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function ClockFace({ label, color, clock }: { label: string; color: PlayerColor; clock: ClockState }) {
  const ms = color === "w" ? clock.whiteMs : clock.blackMs;
  const active = clock.enabled && clock.status === "running" && clock.activeColor === color;
  const low = clock.enabled && ms <= 10_000;
  return (
    <View style={{ flex: 1 }}>
      <Card>
        <AppText muted>{label}{active ? " to move" : ""}</AppText>
        <AppText variant="subtitle">{formatMs(ms)}</AppText>
        {low ? <AppText muted>Low time</AppText> : null}
      </Card>
    </View>
  );
}

export function TimerBar({ white = "10:00", black = "10:00", clock }: { white?: string; black?: string; clock?: ClockState | null }) {
  if (clock?.enabled) {
    return (
      <View style={{ flexDirection: "row", gap: 12 }}>
        <ClockFace label="White" color="w" clock={clock} />
        <ClockFace label="Black" color="b" clock={clock} />
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Card>
          <AppText muted>White</AppText>
          <AppText variant="subtitle">{white}</AppText>
        </Card>
      </View>
      <View style={{ flex: 1 }}>
        <Card>
          <AppText muted>Black</AppText>
          <AppText variant="subtitle">{black}</AppText>
        </Card>
      </View>
    </View>
  );
}
