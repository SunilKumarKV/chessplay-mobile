import { Chess } from "chess.js";
import type { MoveRecord } from "@/types/api";
import type { SocketGameState } from "@/types/chess";

const START_FEN = new Chess().fen();

function isSquare(value: unknown): value is string {
  return typeof value === "string" && /^[a-h][1-8]$/.test(value);
}

function rowColToSquare(row: number, col: number) {
  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row > 7 || col < 0 || col > 7) return null;
  return `${String.fromCharCode(97 + col)}${8 - row}`;
}

function squareFromMoveValue(
  value: MoveRecord["from"] | MoveRecord["to"] | undefined,
  fallbackRow?: number,
  fallbackCol?: number
) {
  if (isSquare(value)) return value;
  if (value && typeof value === "object") {
    const row = value.row ?? ("fromRow" in value ? value.fromRow : undefined) ?? ("toRow" in value ? value.toRow : undefined);
    const col = value.col ?? ("fromCol" in value ? value.fromCol : undefined) ?? ("toCol" in value ? value.toCol : undefined);
    return rowColToSquare(row, col);
  }
  if (typeof fallbackRow === "number" && typeof fallbackCol === "number") {
    return rowColToSquare(fallbackRow, fallbackCol);
  }
  return null;
}

export function normalizeMoveRecord(move: Partial<MoveRecord>) {
  const from = squareFromMoveValue(move.from, move.fromRow, move.fromCol);
  const to = squareFromMoveValue(move.to, move.toRow, move.toCol);
  if (!from || !to) return null;
  return { from, to, piece: move.piece, promotion: move.promotion };
}

export function fenFromMoves(moves: MoveRecord[] = []) {
  const chess = new Chess();
  for (const move of moves) {
    const normalized = normalizeMoveRecord(move);
    if (!normalized) break;
    try {
      chess.move({ from: normalized.from, to: normalized.to, promotion: normalized.promotion || "q" });
    } catch {
      break;
    }
  }
  return chess.fen();
}

function pieceToFen(piece: string) {
  if (!/^[wb][KQRBNP]$/.test(piece)) return null;
  const type = piece[1];
  return piece[0] === "w" ? type : type.toLowerCase();
}

function castlingToFen(gameState: SocketGameState) {
  const castling = gameState.castling;
  let rights = "";
  if (castling?.w?.kingSide) rights += "K";
  if (castling?.w?.queenSide) rights += "Q";
  if (castling?.b?.kingSide) rights += "k";
  if (castling?.b?.queenSide) rights += "q";
  return rights || "-";
}

function enPassantToFen(gameState: SocketGameState) {
  if (!gameState.enPassant) return "-";
  const [row, col] = gameState.enPassant;
  return rowColToSquare(row, col) || "-";
}

export function boardToFen(gameState: Pick<SocketGameState, "board" | "turn" | "castling" | "enPassant" | "halfmoveClock" | "moves">) {
  const board = gameState.board;
  if (!Array.isArray(board) || board.length !== 8 || board.some((row) => !Array.isArray(row) || row.length !== 8)) {
    throw new Error("Backend board must be an 8x8 array.");
  }

  const placement = board
    .map((row) => {
      let rank = "";
      let empty = 0;
      for (const piece of row) {
        if (!piece) {
          empty += 1;
          continue;
        }
        const fenPiece = pieceToFen(piece);
        if (!fenPiece) throw new Error(`Unsupported backend piece value: ${piece}`);
        if (empty) {
          rank += String(empty);
          empty = 0;
        }
        rank += fenPiece;
      }
      return rank + (empty ? String(empty) : "");
    })
    .join("/");

  const activeColor = gameState.turn === "b" ? "b" : "w";
  const halfmove = Number.isInteger(gameState.halfmoveClock) ? gameState.halfmoveClock : 0;
  const moveCount = Array.isArray(gameState.moves) ? gameState.moves.length : 0;
  const fullmove = Math.max(1, Math.floor(moveCount / 2) + 1);
  return `${placement} ${activeColor} ${castlingToFen(gameState)} ${enPassantToFen(gameState)} ${halfmove} ${fullmove}`;
}

export function fenFromSocketGame(gameState?: SocketGameState | null) {
  if (!gameState) return START_FEN;
  if (gameState.fen) return gameState.fen;
  if (gameState.board) return boardToFen(gameState);
  if (gameState.moves?.length) return fenFromMoves(gameState.moves as MoveRecord[]);
  return START_FEN;
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
