import { Chess } from "chess.js";
import type { MoveRecord } from "@/types/api";
import type { SocketGameState } from "@/types/chess";

export function fenFromMoves(moves: MoveRecord[] = []) {
  const chess = new Chess();
  for (const move of moves) {
    try {
      chess.move({ from: move.from, to: move.to, promotion: move.promotion || "q" });
    } catch {
      break;
    }
  }
  return chess.fen();
}

export function fenFromSocketGame(gameState?: SocketGameState | null) {
  if (!gameState) return new Chess().fen();
  if (gameState.fen) return gameState.fen;
  return fenFromMoves(gameState.moves || []);
}

export function describeGameStatus(fen: string) {
  const chess = new Chess(fen);
  if (chess.isCheckmate()) return "Checkmate";
  if (chess.isStalemate()) return "Stalemate";
  if (chess.isDraw()) return "Draw";
  if (chess.isCheck()) return "Check";
  return chess.turn() === "w" ? "White to move" : "Black to move";
}

export function squareToBackend(square: string) {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]);
  return { row: 8 - rank, col: file };
}

