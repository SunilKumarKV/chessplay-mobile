import { Chess, type Square as ChessSquare } from "chess.js";
import { memo, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import {
  algebraicToBackendRowCol,
  backendPieceColor,
  backendRowColToSquare,
  findKing,
  getLegalBackendMoves,
  validateBackendBoard
} from "@/features/chess/backendChessAdapter";
import { useThemeColors } from "@/hooks/useThemeColors";
import { playHaptic } from "@/services/native/haptics";
import type { SocketGameState } from "@/types/chess";
import type { LocalBoardTheme } from "@/services/storage/localGameStorage";

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

type BoardSquareProps = {
  square: ChessSquare;
  squareSize: number;
  backgroundColor: string;
  piece: { color: "w" | "b"; type: string } | null;
  isLastMove: boolean;
  isCheckedKing: boolean;
  isSelected: boolean;
  isLegal: boolean;
  highlightColor: string;
  dangerColor: string;
  lastMoveColor: string;
  onPress: (square: ChessSquare) => void;
};

const BoardSquare = memo(function BoardSquare({
  square,
  squareSize,
  backgroundColor,
  piece,
  isLastMove,
  isCheckedKing,
  isSelected,
  isLegal,
  highlightColor,
  dangerColor,
  lastMoveColor,
  onPress
}: BoardSquareProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${square}${piece ? ` ${piece.color === "w" ? "white" : "black"} ${piece.type}` : ""}`}
      key={square}
      onPress={() => onPress(square)}
      style={[
        styles.square,
        {
          width: squareSize,
          height: squareSize,
          backgroundColor
        }
      ]}
    >
      {isLastMove ? <View style={[styles.lastMove, { backgroundColor: lastMoveColor }]} /> : null}
      {isCheckedKing ? <View style={[styles.check, { borderColor: dangerColor }]} /> : null}
      {isSelected ? <View style={[styles.selection, { borderColor: highlightColor }]} /> : null}
      {isLegal ? <View style={[styles.dot, { backgroundColor: highlightColor }]} /> : null}
      {piece ? (
        <AppText style={[styles.piece, { fontSize: squareSize * 0.58, color: piece.color === "w" ? "#F8FAFC" : "#111827" }]}>
          {pieceSymbols[`${piece.color}${piece.type}`]}
        </AppText>
      ) : null}
    </Pressable>
  );
});

type Props = {
  fen: string;
  gameState?: SocketGameState | null;
  orientation?: "white" | "black";
  boardTheme?: LocalBoardTheme;
  lastMove?: { from: ChessSquare; to: ChessSquare } | null;
  allowedColor?: "w" | "b" | "both";
  disabled?: boolean;
  onMove?: (from: ChessSquare, to: ChessSquare, promotion?: string) => void;
  onInvalidSelection?: (message: string) => void;
};

function squareAt(row: number, col: number, orientation: "white" | "black") {
  const file = orientation === "white" ? files[col] : files[7 - col];
  const rank = orientation === "white" ? 8 - row : row + 1;
  return `${file}${rank}` as ChessSquare;
}

export function ChessBoard({
  fen,
  gameState,
  orientation = "white",
  boardTheme = "classic",
  lastMove = null,
  allowedColor = "both",
  disabled,
  onMove,
  onInvalidSelection
}: Props) {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const size = Math.min(width - 40, 420);
  const squareSize = size / 8;
  const [selected, setSelected] = useState<ChessSquare | null>(null);
  const [promotion, setPromotion] = useState<{ from: ChessSquare; to: ChessSquare } | null>(null);

  const backendBoard = gameState?.board && validateBackendBoard(gameState.board) ? gameState.board : null;
  const chess = useMemo(() => new Chess(fen), [fen]);
  const boardPalette = getBoardPalette(boardTheme, colors);
  const checkedKingSquare = useMemo(() => {
    if (!backendBoard || !gameState || (gameState.status !== "check" && gameState.status !== "checkmate")) return null;
    const king = findKing(backendBoard, gameState.turn || "w");
    return king ? backendRowColToSquare(king[0], king[1]) : null;
  }, [backendBoard, gameState]);
  const legalTargets = useMemo(() => {
    if (!selected) return new Set<string>();
    if (backendBoard && gameState) {
      const { row, col } = algebraicToBackendRowCol(selected);
      return new Set(getLegalBackendMoves(gameState, row, col).map(([targetRow, targetCol]) => backendRowColToSquare(targetRow, targetCol)).filter(Boolean));
    }
    return new Set(chess.moves({ square: selected, verbose: true }).map((move) => move.to));
  }, [backendBoard, chess, gameState, selected]);

  useEffect(() => {
    setSelected(null);
    setPromotion(null);
  }, [disabled, fen, gameState?.turn, gameState?.status]);

  useEffect(() => {
    if (checkedKingSquare) playHaptic("check");
  }, [checkedKingSquare]);

  function pieceAt(square: ChessSquare) {
    if (backendBoard) {
      const { row, col } = algebraicToBackendRowCol(square);
      const piece = backendBoard[row][col];
      return piece ? { color: backendPieceColor(piece), type: piece[1].toLowerCase() } : null;
    }
    return chess.get(square) ?? null;
  }

  function canSelectPiece(square: ChessSquare) {
    const piece = pieceAt(square);
    if (!piece) return false;
    if (allowedColor !== "both" && piece.color !== allowedColor) return false;
    const turn = backendBoard ? gameState?.turn || "w" : chess.turn();
    return piece.color === turn;
  }

  function handlePress(square: ChessSquare) {
    if (disabled) return;
    const piece = pieceAt(square);
    if (selected && legalTargets.has(square)) {
      const selectedPiece = pieceAt(selected);
      const isCapture = Boolean(piece);
      const { row: toRow } = algebraicToBackendRowCol(square);
      const backendPromotion = selectedPiece?.type === "p" && (toRow === 0 || toRow === 7);
      const chessPromotion = !backendBoard && chess.moves({ square: selected, verbose: true }).some((candidate) => candidate.to === square && candidate.promotion);
      if (backendPromotion || chessPromotion) {
        playHaptic("move");
        setPromotion({ from: selected, to: square });
        return;
      }
      playHaptic(isCapture ? "capture" : "move");
      onMove?.(selected, square);
      setSelected(null);
      return;
    }
    if (selected && selected !== square && !canSelectPiece(square)) {
      playHaptic("illegal");
      onInvalidSelection?.("That move is not legal in the current position.");
      setSelected(null);
      return;
    }
    if (canSelectPiece(square)) {
      playHaptic("move");
      setSelected(square);
      return;
    }
    if (piece && allowedColor !== "both" && piece.color !== allowedColor) {
      playHaptic("illegal");
      onInvalidSelection?.("You can only move your own pieces.");
    } else if (piece && piece.color !== (backendBoard ? gameState?.turn || "w" : chess.turn())) {
      playHaptic("illegal");
      onInvalidSelection?.("It is not that side's turn.");
    }
    setSelected(null);
  }

  return (
    <>
      <View style={[styles.board, { width: size, height: size, borderColor: colors.border }]}>
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 8 }).map((__, col) => {
            const square = squareAt(row, col, orientation);
            const piece = pieceAt(square);
            const isDark = (row + col) % 2 === 1;
            const isSelected = selected === square;
            const isLegal = legalTargets.has(square);
            const isLastMove = lastMove?.from === square || lastMove?.to === square;
            const isCheckedKing = checkedKingSquare === square;
            return (
              <BoardSquare
                key={square}
                square={square}
                squareSize={squareSize}
                backgroundColor={isDark ? boardPalette.dark : boardPalette.light}
                piece={piece}
                isLastMove={isLastMove}
                isCheckedKing={isCheckedKing}
                isSelected={isSelected}
                isLegal={isLegal}
                highlightColor={colors.highlight}
                dangerColor={colors.danger}
                lastMoveColor={boardPalette.lastMove}
                onPress={handlePress}
              />
            );
          })
        )}
      </View>
      <Modal transparent visible={Boolean(promotion)} animationType="fade" onRequestClose={() => setPromotion(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Card>
              <AppText variant="subtitle">Promote pawn</AppText>
              <View style={styles.promotionGrid}>
                {(["q", "r", "b", "n"] as const).map((piece) => (
                  <View key={piece} style={styles.promotionButton}>
                    <Button
                      label={{ q: "Queen", r: "Rook", b: "Bishop", n: "Knight" }[piece]}
                      variant="secondary"
                      onPress={() => {
                        if (promotion) onMove?.(promotion.from, promotion.to, piece);
                        setPromotion(null);
                        setSelected(null);
                      }}
                    />
                  </View>
                ))}
              </View>
              <Button label="Cancel" variant="secondary" onPress={() => setPromotion(null)} />
            </Card>
          </View>
        </View>
      </Modal>
    </>
  );
}

function getBoardPalette(theme: LocalBoardTheme, colors: ReturnType<typeof useThemeColors>) {
  const palettes: Record<LocalBoardTheme, { light: string; dark: string; lastMove: string }> = {
    classic: { light: colors.boardLight, dark: colors.boardDark, lastMove: "rgba(250, 204, 21, 0.35)" },
    blue: { light: "#DCEBFA", dark: "#4B78A8", lastMove: "rgba(14, 165, 233, 0.35)" },
    green: { light: "#E7F2D4", dark: "#6E8F57", lastMove: "rgba(132, 204, 22, 0.35)" },
    dark: { light: "#9CA3AF", dark: "#374151", lastMove: "rgba(251, 191, 36, 0.34)" }
  };
  return palettes[theme];
}

const styles = StyleSheet.create({
  board: { flexDirection: "row", flexWrap: "wrap", borderWidth: 2, alignSelf: "center" },
  square: { alignItems: "center", justifyContent: "center" },
  piece: { textAlign: "center", textShadowColor: "rgba(0,0,0,0.35)", textShadowRadius: 2 },
  dot: { position: "absolute", width: 14, height: 14, borderRadius: 7, opacity: 0.85 },
  lastMove: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  check: { position: "absolute", top: 5, right: 5, bottom: 5, left: 5, borderWidth: 3, borderRadius: 999 },
  selection: { position: "absolute", top: 3, right: 3, bottom: 3, left: 3, borderWidth: 3, borderRadius: 4 },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.55)" },
  modalCard: { width: "100%", maxWidth: 360 },
  promotionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  promotionButton: { width: "48%" }
});
