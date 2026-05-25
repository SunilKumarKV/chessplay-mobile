import { Chess, type Square as ChessSquare } from "chess.js";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { AppText } from "@/components/AppText";
import { useThemeColors } from "@/hooks/useThemeColors";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const pieceSymbols: Record<string, string> = {
  wp: "\u2659",
  wn: "\u2658",
  wb: "\u2657",
  wr: "\u2656",
  wq: "\u2655",
  wk: "\u2654",
  bp: "\u265F",
  bn: "\u265E",
  bb: "\u265D",
  br: "\u265C",
  bq: "\u265B",
  bk: "\u265A"
};

type Props = {
  fen: string;
  orientation?: "white" | "black";
  disabled?: boolean;
  onMove?: (from: ChessSquare, to: ChessSquare, promotion?: string) => void;
};

function squareAt(row: number, col: number, orientation: "white" | "black") {
  const file = orientation === "white" ? files[col] : files[7 - col];
  const rank = orientation === "white" ? 8 - row : row + 1;
  return `${file}${rank}` as ChessSquare;
}

export function ChessBoard({ fen, orientation = "white", disabled, onMove }: Props) {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const size = Math.min(width - 40, 420);
  const squareSize = size / 8;
  const [selected, setSelected] = useState<ChessSquare | null>(null);

  const chess = useMemo(() => new Chess(fen), [fen]);
  const legalTargets = useMemo(() => {
    if (!selected) return new Set<string>();
    return new Set(chess.moves({ square: selected, verbose: true }).map((move) => move.to));
  }, [chess, selected]);

  function handlePress(square: ChessSquare) {
    if (disabled) return;
    const piece = chess.get(square);
    if (selected && legalTargets.has(square)) {
      const move = chess.moves({ square: selected, verbose: true }).find((candidate) => candidate.to === square);
      onMove?.(selected, square, move?.promotion || "q");
      setSelected(null);
      return;
    }
    if (piece?.color === chess.turn()) setSelected(square);
    else setSelected(null);
  }

  return (
    <View style={[styles.board, { width: size, height: size, borderColor: colors.border }]}>
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 8 }).map((__, col) => {
          const square = squareAt(row, col, orientation);
          const piece = chess.get(square);
          const isDark = (row + col) % 2 === 1;
          const isSelected = selected === square;
          const isLegal = legalTargets.has(square);
          return (
            <Pressable
              key={square}
              onPress={() => handlePress(square)}
              style={[
                styles.square,
                {
                  width: squareSize,
                  height: squareSize,
                  backgroundColor: isDark ? colors.boardDark : colors.boardLight
                }
              ]}
            >
              {isSelected ? <View style={[styles.selection, { borderColor: colors.highlight }]} /> : null}
              {isLegal ? <View style={[styles.dot, { backgroundColor: colors.highlight }]} /> : null}
              {piece ? (
                <AppText style={[styles.piece, { fontSize: squareSize * 0.58, color: piece.color === "w" ? "#F8FAFC" : "#111827" }]}>
                  {pieceSymbols[`${piece.color}${piece.type}`]}
                </AppText>
              ) : null}
            </Pressable>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { flexDirection: "row", flexWrap: "wrap", borderWidth: 2, alignSelf: "center" },
  square: { alignItems: "center", justifyContent: "center" },
  piece: { textAlign: "center", textShadowColor: "rgba(0,0,0,0.35)", textShadowRadius: 2 },
  dot: { position: "absolute", width: 14, height: 14, borderRadius: 7, opacity: 0.85 },
  selection: { position: "absolute", top: 3, right: 3, bottom: 3, left: 3, borderWidth: 3, borderRadius: 4 }
});
