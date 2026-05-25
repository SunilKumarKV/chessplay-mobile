import { Chess } from "chess.js";

export type BackendColor = "w" | "b";
export type BackendPieceType = "P" | "N" | "B" | "R" | "Q" | "K";
export type BackendPiece = `${BackendColor}${BackendPieceType}`;
export type BackendBoardSquare = BackendPiece | null;
export type BackendBoard = BackendBoardSquare[][];

export type BackendGameStatus =
  | "playing"
  | "check"
  | "checkmate"
  | "stalemate"
  | "draw"
  | "resigned"
  | "timeout"
  | "draw-50move"
  | "draw-repetition";

export type BackendCastlingRights = {
  w?: { kingSide?: boolean; queenSide?: boolean };
  b?: { kingSide?: boolean; queenSide?: boolean };
};

type MoveCoordinateObject = {
  row?: number;
  col?: number;
  fromRow?: number;
  fromCol?: number;
  toRow?: number;
  toCol?: number;
};

export type BackendMoveCoordinate = [number, number] | string | MoveCoordinateObject;

export type BackendMoveHistoryEntry = {
  from?: BackendMoveCoordinate;
  to?: BackendMoveCoordinate;
  fromRow?: number;
  fromCol?: number;
  toRow?: number;
  toCol?: number;
  piece?: string;
  color?: BackendColor;
  text?: string;
  captured?: string | null;
  promotion?: string;
  timestamp?: number | string;
};

export type BackendPlayerSlot = {
  id?: string | null;
  name?: string;
  userId?: string | null;
  disconnected?: boolean;
};

export type BackendSocketGameState = {
  board?: BackendBoard;
  fen?: string;
  turn?: BackendColor;
  status?: BackendGameStatus;
  moveHistory?: BackendMoveHistoryEntry[];
  moves?: BackendMoveHistoryEntry[];
  capturedW?: BackendPiece[];
  capturedB?: BackendPiece[];
  players?: {
    w: BackendPlayerSlot;
    b: BackendPlayerSlot;
  };
  chatHistory?: { username: string; text: string; timestamp: string | number }[];
  enPassant?: [number, number] | null;
  castling?: BackendCastlingRights;
  halfmoveClock?: number;
  positionHistory?: string[];
  clock?: BackendClockState;
};

export type BackendClockState = {
  enabled: boolean;
  timeControlIndex: number | null;
  whiteMs: number;
  blackMs: number;
  incrementMs: number;
  activeColor: BackendColor;
  lastTickAt: number | null;
  status: "idle" | "running" | "paused" | "ended";
};

export type NormalizedBackendMove = {
  from: string;
  to: string;
  text?: string;
  piece?: string;
  captured?: string | null;
  promotion?: string;
  timestamp?: number | string;
};

const START_FEN = new Chess().fen();
const SQUARE_PATTERN = /^[a-h][1-8]$/;
const PIECE_PATTERN = /^[wb][PNBRQK]$/;

export function isBackendPiece(value: unknown): value is BackendPiece {
  return typeof value === "string" && PIECE_PATTERN.test(value);
}

export function backendPieceColor(piece: BackendPiece) {
  return piece[0] as BackendColor;
}

export function backendRowColToSquare(row: number, col: number) {
  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row > 7 || col < 0 || col > 7) return null;
  return `${String.fromCharCode(97 + col)}${8 - row}`;
}

export function algebraicToBackendRowCol(square: string) {
  if (!SQUARE_PATTERN.test(square)) throw new Error(`Invalid algebraic square: ${square}`);
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]);
  return { row: 8 - rank, col: file };
}

function squareFromCoordinate(value: BackendMoveCoordinate | undefined, fallbackRow?: number, fallbackCol?: number) {
  if (typeof value === "string" && SQUARE_PATTERN.test(value)) return value;
  if (Array.isArray(value)) return backendRowColToSquare(value[0], value[1]);
  if (value && typeof value === "object") {
    const row = value.row ?? value.fromRow ?? value.toRow;
    const col = value.col ?? value.fromCol ?? value.toCol;
    return backendRowColToSquare(row ?? -1, col ?? -1);
  }
  if (typeof fallbackRow === "number" && typeof fallbackCol === "number") {
    return backendRowColToSquare(fallbackRow, fallbackCol);
  }
  return null;
}

function pieceToFen(piece: BackendBoardSquare) {
  if (!piece) return null;
  if (!isBackendPiece(piece)) throw new Error(`Unsupported backend piece value: ${piece}`);
  const type = piece[1];
  return piece[0] === "w" ? type : type.toLowerCase();
}

function validateBackendBoard(board: BackendBoard) {
  return Array.isArray(board) && board.length === 8 && board.every((row) => Array.isArray(row) && row.length === 8);
}

export function backendBoardToFenPlacement(board: BackendBoard) {
  if (!validateBackendBoard(board)) throw new Error("Backend board must be an 8x8 array.");

  return board
    .map((row) => {
      let rank = "";
      let empty = 0;
      for (const piece of row) {
        if (!piece) {
          empty += 1;
          continue;
        }
        const fenPiece = pieceToFen(piece);
        if (empty) {
          rank += String(empty);
          empty = 0;
        }
        rank += fenPiece;
      }
      return rank + (empty ? String(empty) : "");
    })
    .join("/");
}

export function fenToBackendBoard(fen: string): BackendBoard {
  const placement = fen.trim().split(/\s+/)[0];
  const ranks = placement.split("/");
  if (ranks.length !== 8) throw new Error("FEN placement must contain 8 ranks.");

  return ranks.map((rank) => {
    const row: BackendBoardSquare[] = [];
    for (const char of rank) {
      const empty = Number(char);
      if (Number.isInteger(empty) && empty > 0) {
        row.push(...Array.from({ length: empty }, () => null));
        continue;
      }
      const color = char === char.toUpperCase() ? "w" : "b";
      const type = char.toUpperCase();
      const piece = `${color}${type}`;
      if (!isBackendPiece(piece)) throw new Error(`Unsupported FEN piece value: ${char}`);
      row.push(piece);
    }
    if (row.length !== 8) throw new Error("Each FEN rank must contain 8 files.");
    return row;
  });
}

function castlingToFen(castling?: BackendCastlingRights) {
  let rights = "";
  if (castling?.w?.kingSide) rights += "K";
  if (castling?.w?.queenSide) rights += "Q";
  if (castling?.b?.kingSide) rights += "k";
  if (castling?.b?.queenSide) rights += "q";
  return rights || "-";
}

function enPassantToFen(enPassant?: [number, number] | null) {
  if (!enPassant) return "-";
  return backendRowColToSquare(enPassant[0], enPassant[1]) || "-";
}

export function backendBoardToFen(gameState: Pick<BackendSocketGameState, "board" | "turn" | "castling" | "enPassant" | "halfmoveClock" | "moves" | "moveHistory">) {
  if (!gameState.board) throw new Error("Backend board is required to build FEN.");
  const placement = backendBoardToFenPlacement(gameState.board);
  const activeColor = gameState.turn === "b" ? "b" : "w";
  const halfmove = Number.isInteger(gameState.halfmoveClock) ? gameState.halfmoveClock : 0;
  const moveCount = Array.isArray(gameState.moveHistory)
    ? gameState.moveHistory.length
    : Array.isArray(gameState.moves)
      ? gameState.moves.length
      : 0;
  const fullmove = Math.max(1, Math.floor(moveCount / 2) + 1);
  return `${placement} ${activeColor} ${castlingToFen(gameState.castling)} ${enPassantToFen(gameState.enPassant)} ${halfmove} ${fullmove}`;
}

export function normalizeBackendMove(move: Partial<BackendMoveHistoryEntry>): NormalizedBackendMove | null {
  const from = squareFromCoordinate(move.from, move.fromRow, move.fromCol);
  const to = squareFromCoordinate(move.to, move.toRow, move.toCol);
  if (!from || !to) return null;
  return {
    from,
    to,
    text: move.text,
    piece: move.piece,
    captured: move.captured,
    promotion: move.promotion,
    timestamp: move.timestamp
  };
}

export function fenFromBackendMoves(moves: BackendMoveHistoryEntry[] = []) {
  const chess = new Chess();
  for (const move of moves) {
    const normalized = normalizeBackendMove(move);
    if (!normalized) break;
    try {
      chess.move({ from: normalized.from, to: normalized.to, promotion: normalized.promotion || "q" });
    } catch {
      break;
    }
  }
  return chess.fen();
}

export function fenFromBackendGameState(gameState?: BackendSocketGameState | null) {
  if (!gameState) return START_FEN;
  if (gameState.board) return backendBoardToFen(gameState);
  if (gameState.fen) return gameState.fen;
  if (gameState.moveHistory?.length) return fenFromBackendMoves(gameState.moveHistory);
  if (gameState.moves?.length) return fenFromBackendMoves(gameState.moves);
  return START_FEN;
}
