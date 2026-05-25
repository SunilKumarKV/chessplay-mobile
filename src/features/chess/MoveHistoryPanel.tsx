import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { normalizeMoveRecord } from "@/features/chess/chessState";
import type { BackendMoveHistoryEntry } from "@/features/chess/backendChessAdapter";
import type { MoveRecord } from "@/types/api";

export function MoveHistoryPanel({ moves = [] }: { moves?: Partial<MoveRecord | BackendMoveHistoryEntry>[] }) {
  const normalizedMoves = moves
    .map((move, index) => {
      const normalized = normalizeMoveRecord(move);
      if (!normalized) return `${index + 1}. --`;
      const capture = normalized.captured ? "x" : "-";
      const promotion = normalized.promotion ? `=${String(normalized.promotion).replace("=", "").toUpperCase()}` : "";
      return `${index + 1}. ${normalized.text || `${normalized.from}${capture}${normalized.to}${promotion}`}`;
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
