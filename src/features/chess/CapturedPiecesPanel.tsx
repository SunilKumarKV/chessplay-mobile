import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { useThemeColors } from "@/hooks/useThemeColors";
import { backendPieceType, materialBalanceFromBoard } from "@/features/chess/backendChessAdapter";
import type { BackendBoard, BackendPiece } from "@/features/chess/backendChessAdapter";

const pieceSymbols: Record<BackendPiece, string> = {
  wP: "\u2659",
  wN: "\u2658",
  wB: "\u2657",
  wR: "\u2656",
  wQ: "\u2655",
  wK: "\u2654",
  bP: "\u265F",
  bN: "\u265E",
  bB: "\u265D",
  bR: "\u265C",
  bQ: "\u265B",
  bK: "\u265A"
};

const sortOrder = "PNBRQK";

function pieceList(pieces: BackendPiece[] = []) {
  return [...pieces]
    .sort((left, right) => sortOrder.indexOf(backendPieceType(right)) - sortOrder.indexOf(backendPieceType(left)))
    .map((piece, index) => `${pieceSymbols[piece]}${index === pieces.length - 1 ? "" : " "}`)
    .join("");
}

export function CapturedPiecesPanel({ capturedW = [], capturedB = [], board }: { capturedW?: BackendPiece[]; capturedB?: BackendPiece[]; board?: BackendBoard }) {
  const colors = useThemeColors();
  const balance = board ? materialBalanceFromBoard(board) : 0;
  return (
    <View style={{ gap: 8 }}>
      <AppText variant="subtitle">Captured pieces</AppText>
      <View style={styles.row}>
        <View style={[styles.plate, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
          <AppText muted>White has captured</AppText>
          <AppText style={styles.pieces}>{pieceList(capturedB) || "-"}</AppText>
        </View>
        <View style={[styles.plate, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
          <AppText muted>Black has captured</AppText>
          <AppText style={styles.pieces}>{pieceList(capturedW) || "-"}</AppText>
        </View>
      </View>
      <View style={[styles.balanceBar, { backgroundColor: colors.surfaceMuted }]}>
        <View
          style={[
            styles.balanceFill,
            {
              width: `${Math.min(100, Math.max(0, 50 + balance * 4))}%`,
              backgroundColor: balance >= 0 ? colors.primary : colors.text
            }
          ]}
        />
      </View>
      <AppText muted>Material: {balance === 0 ? "Even" : balance > 0 ? `White +${balance}` : `Black +${Math.abs(balance)}`}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  plate: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, gap: 4 },
  pieces: { fontSize: 20, lineHeight: 26 },
  balanceBar: { height: 8, borderRadius: 999, overflow: "hidden" },
  balanceFill: { height: "100%", borderRadius: 999 }
});
