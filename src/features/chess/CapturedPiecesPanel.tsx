import { View } from "react-native";
import { AppText } from "@/components/AppText";
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
  const balance = board ? materialBalanceFromBoard(board) : 0;
  return (
    <View style={{ gap: 8 }}>
      <AppText variant="subtitle">Captured pieces</AppText>
      <View style={{ gap: 6 }}>
        <AppText muted>White captured: {pieceList(capturedW) || "-"}</AppText>
        <AppText muted>Black captured: {pieceList(capturedB) || "-"}</AppText>
        <AppText muted>Material: {balance === 0 ? "Even" : balance > 0 ? `White +${balance}` : `Black +${Math.abs(balance)}`}</AppText>
      </View>
    </View>
  );
}
