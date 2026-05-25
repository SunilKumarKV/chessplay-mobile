import { Chess } from "chess.js";
import type { MoveRecord } from "@/types/api";
import type { SocketGameState } from "@/types/chess";
import {
  algebraicToBackendRowCol,
  backendBoardToFen,
  fenFromBackendGameState,
  fenFromBackendMoves,
  normalizeBackendMove
} from "./backendChessAdapter";

export const boardToFen = backendBoardToFen;
export const fenFromSocketGame = fenFromBackendGameState;
export const normalizeMoveRecord = normalizeBackendMove;
export const squareToBackend = algebraicToBackendRowCol;

export function fenFromMoves(moves: MoveRecord[] = []) {
  return fenFromBackendMoves(moves);
}

export function describeGameStatus(fen: string, gameState?: Pick<SocketGameState, "status" | "turn"> | null) {
  if (gameState?.status) {
    switch (gameState.status) {
      case "check":
        return "Check";
      case "checkmate":
        return "Checkmate";
      case "stalemate":
        return "Stalemate";
      case "draw":
        return "Draw";
      case "draw-50move":
        return "Draw by 50-move rule";
      case "draw-repetition":
        return "Draw by repetition";
      case "resigned":
        return "Resigned";
      case "timeout":
        return "Timeout";
      case "abandoned":
        return "Abandoned";
      case "playing":
        break;
    }
  }

  try {
    const chess = new Chess(fen);
    if (chess.isCheckmate()) return "Checkmate";
    if (chess.isStalemate()) return "Stalemate";
    if (chess.isDraw()) return "Draw";
    if (chess.isCheck()) return "Check";
    return chess.turn() === "w" ? "White to move" : "Black to move";
  } catch {
    return gameState?.turn === "b" ? "Black to move" : "White to move";
  }
}
