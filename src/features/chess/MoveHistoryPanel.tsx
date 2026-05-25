import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { normalizeMoveRecord } from "@/features/chess/chessState";
import type { MoveRecord } from "@/types/api";

export function MoveHistoryPanel({ moves = [] }: { moves?: Partial<MoveRecord>[] }) {
  const normalizedMoves = moves
    .map((move, index) => {
      const normalized = normalizeMoveRecord(move);
      if (!normalized) return `${index + 1}. --`;
      return `${index + 1}. ${normalized.from}-${normalized.to}`;
    })
    .join("  ");

  return (
    <View style={{ gap: 8 }}>
      <AppText variant="subtitle">Move history</AppText>
      {moves.length ? (
        <AppText muted>{normalizedMoves}</AppText>
      ) : (
        <AppText muted>No moves yet.</AppText>
      )}
    </View>
  );
}
