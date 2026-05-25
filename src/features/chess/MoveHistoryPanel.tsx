import { View } from "react-native";
import { AppText } from "@/components/AppText";
import type { MoveRecord } from "@/types/api";

export function MoveHistoryPanel({ moves = [] }: { moves?: MoveRecord[] }) {
  return (
    <View style={{ gap: 8 }}>
      <AppText variant="subtitle">Move history</AppText>
      {moves.length ? (
        <AppText muted>{moves.map((move, index) => `${index + 1}. ${move.from}-${move.to}`).join("  ")}</AppText>
      ) : (
        <AppText muted>No moves yet.</AppText>
      )}
    </View>
  );
}

