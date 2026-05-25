import { ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { useThemeColors } from "@/hooks/useThemeColors";
import { normalizeMoveRecord } from "@/features/chess/chessState";
import type { BackendMoveHistoryEntry } from "@/features/chess/backendChessAdapter";
import type { MoveRecord } from "@/types/api";

export function MoveHistoryPanel({ moves = [] }: { moves?: Partial<MoveRecord | BackendMoveHistoryEntry>[] }) {
  const colors = useThemeColors();
  const normalizedMoves = moves.map((move, index) => {
      const normalized = normalizeMoveRecord(move);
      if (!normalized) return `${index + 1}. --`;
      const capture = normalized.captured ? "x" : "-";
      const promotion = normalized.promotion ? `=${String(normalized.promotion).replace("=", "").toUpperCase()}` : "";
      return normalized.text || `${normalized.from}${capture}${normalized.to}${promotion}`;
    });
  const rows = Array.from({ length: Math.ceil(normalizedMoves.length / 2) }, (_, index) => ({
    moveNumber: index + 1,
    white: normalizedMoves[index * 2],
    black: normalizedMoves[index * 2 + 1]
  }));

  return (
    <View style={{ gap: 8 }}>
      <AppText variant="subtitle">Move history</AppText>
      {moves.length ? (
        <ScrollView style={styles.scroll} nestedScrollEnabled>
          {rows.map((row) => (
            <View key={row.moveNumber} style={[styles.row, { borderBottomColor: colors.border }]}>
              <AppText muted style={styles.number}>{row.moveNumber}.</AppText>
              <AppText style={styles.move}>{row.white || "--"}</AppText>
              <AppText style={styles.move}>{row.black || ""}</AppText>
            </View>
          ))}
        </ScrollView>
      ) : (
        <AppText muted>No moves yet.</AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 190 },
  row: { flexDirection: "row", gap: 10, paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth },
  number: { width: 32 },
  move: { flex: 1, fontWeight: "700" }
});
