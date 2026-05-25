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
  | "abandoned"
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
const PIECE_VALUES: Record<BackendPieceType, number> = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0 };

export const INITIAL_BACKEND_BOARD: BackendBoard = [
  ["bR", "bN", "bB", "bQ", "bK", "bB", "bN", "bR"],
  ["bP", "bP", "bP", "bP", "bP", "bP", "bP", "bP"],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ["wP", "wP", "wP", "wP", "wP", "wP", "wP", "wP"],
  ["wR", "wN", "wB", "wQ", "wK", "wB", "wN", "wR"]
];

export const INITIAL_CASTLING: Required<BackendCastlingRights> = {
  w: { kingSide: true, queenSide: true },
  b: { kingSide: true, queenSide: true }
};

export function isBackendPiece(value: unknown): value is BackendPiece {
  return typeof value === "string" && PIECE_PATTERN.test(value);
}

export function backendPieceColor(piece: BackendPiece) {
  return piece[0] as BackendColor;
}

export function backendPieceType(piece: BackendPiece) {
  return piece[1] as BackendPieceType;
}

export function backendOpponent(color: BackendColor): BackendColor {
  return color === "w" ? "b" : "w";
}

export function cloneBackendBoard(board: BackendBoard): BackendBoard {
  return board.map((row) => [...row]);
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

export function validateBackendBoard(board: BackendBoard) {
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

export function createInitialBackendGameState(): BackendSocketGameState {
  const gameState: BackendSocketGameState = {
    board: cloneBackendBoard(INITIAL_BACKEND_BOARD),
    turn: "w",
    enPassant: null,
    castling: { w: { ...INITIAL_CASTLING.w }, b: { ...INITIAL_CASTLING.b } },
    status: "playing",
    halfmoveClock: 0,
    positionHistory: [],
    moveHistory: [],
    capturedW: [],
    capturedB: []
  };
  gameState.positionHistory = [getPositionKey(gameState)];
  return gameState;
}

function hasPiecesInPath(board: BackendBoard, fromRow: number, fromCol: number, toRow: number, toCol: number) {
  const rowDiff = toRow - fromRow;
  const colDiff = toCol - fromCol;
  const stepRow = rowDiff === 0 ? 0 : rowDiff > 0 ? 1 : -1;
  const stepCol = colDiff === 0 ? 0 : colDiff > 0 ? 1 : -1;
  let currentRow = fromRow + stepRow;
  let currentCol = fromCol + stepCol;
  while (currentRow !== toRow || currentCol !== toCol) {
    if (board[currentRow]?.[currentCol]) return true;
    currentRow += stepRow;
    currentCol += stepCol;
  }
  return false;
}

function inBounds(row: number, col: number) {
  return Number.isInteger(row) && Number.isInteger(col) && row >= 0 && row <= 7 && col >= 0 && col <= 7;
}

function isSquareAttackedBy(board: BackendBoard, row: number, col: number, attackerColor: BackendColor) {
  const pseudoState: BackendSocketGameState = {
    board,
    turn: attackerColor,
    enPassant: null,
    castling: { w: {}, b: {} }
  };

  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const piece = board[r][c];
      if (piece && backendPieceColor(piece) === attackerColor && isBackendMoveLegal(pseudoState, r, c, row, col, true)) {
        return true;
      }
    }
  }
  return false;
}

function isKingInCheckAfterMove(gameState: BackendSocketGameState, fromRow: number, fromCol: number, toRow: number, toCol: number, color: BackendColor) {
  if (!gameState.board) return false;
  const tempBoard = cloneBackendBoard(gameState.board);
  const piece = tempBoard[fromRow][fromCol];
  if (!piece) return false;
  const type = backendPieceType(piece);
  const targetPiece = tempBoard[toRow][toCol];
  const isEnPassant = type === "P" && toCol !== fromCol && !targetPiece;

  tempBoard[toRow][toCol] = piece;
  tempBoard[fromRow][fromCol] = null;
  if (isEnPassant) tempBoard[fromRow][toCol] = null;

  const king = findKing(tempBoard, color);
  if (!king) return false;
  const opponentColor = backendOpponent(color);
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const enemy = tempBoard[r][c];
      if (enemy && backendPieceColor(enemy) === opponentColor) {
        const miniState: BackendSocketGameState = {
          board: tempBoard,
          turn: opponentColor,
          enPassant: null,
          castling: { w: {}, b: {} }
        };
        if (isBackendMoveLegal(miniState, r, c, king[0], king[1], true)) return true;
      }
    }
  }
  return false;
}

export function isBackendMoveLegal(
  gameState: BackendSocketGameState,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  skipCheckValidation = false
) {
  const board = gameState.board;
  if (!board || !inBounds(fromRow, fromCol) || !inBounds(toRow, toCol)) return false;
  const piece = board[fromRow][fromCol];
  if (!piece) return false;

  const color = backendPieceColor(piece);
  if (color !== gameState.turn) return false;
  if (fromRow === toRow && fromCol === toCol) return false;

  const targetPiece = board[toRow][toCol];
  if (targetPiece && backendPieceColor(targetPiece) === color) return false;
  if (!skipCheckValidation && targetPiece && backendPieceType(targetPiece) === "K") return false;

  const type = backendPieceType(piece);
  const rowDiff = toRow - fromRow;
  const colDiff = toCol - fromCol;
  const absRow = Math.abs(rowDiff);
  const absCol = Math.abs(colDiff);
  let valid = false;

  switch (type) {
    case "P": {
      const direction = color === "w" ? -1 : 1;
      const startRow = color === "w" ? 6 : 1;
      if (colDiff === 0 && rowDiff === direction && !targetPiece) valid = true;
      else if (colDiff === 0 && fromRow === startRow && rowDiff === 2 * direction && !targetPiece && !board[fromRow + direction][fromCol]) valid = true;
      else if (absCol === 1 && rowDiff === direction) {
        if (targetPiece && backendPieceColor(targetPiece) === backendOpponent(color)) valid = true;
        else if (gameState.enPassant?.[0] === toRow && gameState.enPassant?.[1] === toCol) {
          const capturedPawn = board[fromRow][toCol];
          valid = Boolean(capturedPawn && backendPieceType(capturedPawn) === "P" && backendPieceColor(capturedPawn) === backendOpponent(color));
        }
      }
      break;
    }
    case "N":
      valid = (absRow === 2 && absCol === 1) || (absRow === 1 && absCol === 2);
      break;
    case "B":
      valid = absRow === absCol && !hasPiecesInPath(board, fromRow, fromCol, toRow, toCol);
      break;
    case "R":
      valid = (rowDiff === 0 || colDiff === 0) && !hasPiecesInPath(board, fromRow, fromCol, toRow, toCol);
      break;
    case "Q":
      valid = (absRow === absCol || rowDiff === 0 || colDiff === 0) && !hasPiecesInPath(board, fromRow, fromCol, toRow, toCol);
      break;
    case "K": {
      if (absRow <= 1 && absCol <= 1) valid = true;
      else if (rowDiff === 0 && absCol === 2) {
        const rights = gameState.castling?.[color];
        const baseRow = color === "w" ? 7 : 0;
        const isKingSide = colDiff === 2;
        const rookCol = isKingSide ? 7 : 0;
        const pathCols = isKingSide ? [5, 6] : [1, 2, 3];
        const passThroughCol = isKingSide ? 5 : 3;
        const opponentColor = backendOpponent(color);
        valid = Boolean(
          rights &&
            fromRow === baseRow &&
            fromCol === 4 &&
            (isKingSide ? rights.kingSide : rights.queenSide) &&
            board[baseRow][rookCol] &&
            backendPieceType(board[baseRow][rookCol] as BackendPiece) === "R" &&
            !isSquareAttackedBy(board, fromRow, fromCol, opponentColor) &&
            !isSquareAttackedBy(board, baseRow, passThroughCol, opponentColor) &&
            pathCols.every((col) => !board[baseRow][col])
        );
      }
      break;
    }
  }

  if (!valid) return false;
  if (skipCheckValidation) return true;
  return !isKingInCheckAfterMove(gameState, fromRow, fromCol, toRow, toCol, color);
}

export function getLegalBackendMoves(gameState: BackendSocketGameState, row: number, col: number) {
  const legal: [number, number][] = [];
  for (let toRow = 0; toRow < 8; toRow += 1) {
    for (let toCol = 0; toCol < 8; toCol += 1) {
      if (isBackendMoveLegal(gameState, row, col, toRow, toCol)) legal.push([toRow, toCol]);
    }
  }
  return legal;
}

export function findKing(board: BackendBoard, color: BackendColor) {
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      if (board[row][col] === `${color}K`) return [row, col] as [number, number];
    }
  }
  return null;
}

export function isBackendKingInCheck(gameState: BackendSocketGameState, color: BackendColor) {
  if (!gameState.board) return false;
  const king = findKing(gameState.board, color);
  if (!king) return false;
  return isSquareAttackedBy(gameState.board, king[0], king[1], backendOpponent(color));
}

function hasAnyValidMove(gameState: BackendSocketGameState, color: BackendColor) {
  const stateForColor = { ...gameState, turn: color };
  if (!gameState.board) return false;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = gameState.board[row][col];
      if (piece && backendPieceColor(piece) === color && getLegalBackendMoves(stateForColor, row, col).length > 0) return true;
    }
  }
  return false;
}

export function getBackendGameStatus(gameState: BackendSocketGameState): BackendGameStatus {
  const color = gameState.turn || "w";
  const inCheck = isBackendKingInCheck(gameState, color);
  const hasMoves = hasAnyValidMove(gameState, color);
  if (!hasMoves) return inCheck ? "checkmate" : "stalemate";
  return inCheck ? "check" : "playing";
}

function toAlgebraic(row: number, col: number) {
  return `${String.fromCharCode(97 + col)}${8 - row}`;
}

export function getPositionKey(gameState: Pick<BackendSocketGameState, "board" | "turn" | "castling" | "enPassant">) {
  if (!gameState.board) return "";
  const enPassant = gameState.enPassant ? toAlgebraic(gameState.enPassant[0], gameState.enPassant[1]) : "-";
  return [backendBoardToFenPlacement(gameState.board), gameState.turn || "w", castlingToFen(gameState.castling), enPassant].join(" ");
}

function hasThreefoldRepetition(positionHistory: string[] = []) {
  const counts = new Map<string, number>();
  return positionHistory.some((position) => {
    const next = (counts.get(position) || 0) + 1;
    counts.set(position, next);
    return next >= 3;
  });
}

export function applyBackendMove(
  inputState: BackendSocketGameState,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  promotionPiece = "Q"
): BackendSocketGameState | null {
  if (!isBackendMoveLegal(inputState, fromRow, fromCol, toRow, toCol)) return null;
  const gameState: BackendSocketGameState = {
    ...inputState,
    board: cloneBackendBoard(inputState.board || INITIAL_BACKEND_BOARD),
    castling: {
      w: { ...(inputState.castling?.w || {}) },
      b: { ...(inputState.castling?.b || {}) }
    },
    capturedW: [...(inputState.capturedW || [])],
    capturedB: [...(inputState.capturedB || [])],
    moveHistory: [...(inputState.moveHistory || [])],
    positionHistory: [...(inputState.positionHistory || [])]
  };
  const board = gameState.board as BackendBoard;
  const piece = board[fromRow][fromCol] as BackendPiece;
  const type = backendPieceType(piece);
  const color = backendPieceColor(piece);
  const targetPiece = board[toRow][toCol];
  const rowDiff = toRow - fromRow;
  const colDiff = toCol - fromCol;
  const isEnPassant = type === "P" && colDiff !== 0 && !targetPiece;
  const capturedPiece = isEnPassant ? board[fromRow][toCol] : targetPiece;

  board[toRow][toCol] = piece;
  board[fromRow][fromCol] = null;
  if (isEnPassant) board[fromRow][toCol] = null;
  if (type === "K" && Math.abs(colDiff) === 2) {
    const baseRow = color === "w" ? 7 : 0;
    if (toCol === 6) {
      board[baseRow][5] = board[baseRow][7];
      board[baseRow][7] = null;
    } else if (toCol === 2) {
      board[baseRow][3] = board[baseRow][0];
      board[baseRow][0] = null;
    }
  }

  let promotionLabel: string | null = null;
  if (type === "P" && (toRow === 0 || toRow === 7)) {
    const promo = (promotionPiece || "Q").toUpperCase() as BackendPieceType;
    board[toRow][toCol] = `${color}${promo}` as BackendPiece;
    promotionLabel = `=${promo}`;
  }

  if (capturedPiece) {
    if (color === "w") gameState.capturedB?.push(capturedPiece);
    else gameState.capturedW?.push(capturedPiece);
  }

  const castling = {
    w: { ...(gameState.castling?.w || {}) },
    b: { ...(gameState.castling?.b || {}) }
  };
  if (type === "K") {
    castling[color].kingSide = false;
    castling[color].queenSide = false;
  }
  if (type === "R") {
    const baseRow = color === "w" ? 7 : 0;
    if (fromRow === baseRow && fromCol === 7) castling[color].kingSide = false;
    if (fromRow === baseRow && fromCol === 0) castling[color].queenSide = false;
  }
  if (targetPiece && backendPieceType(targetPiece) === "R") {
    const capturedColor = backendPieceColor(targetPiece);
    const baseRow = capturedColor === "w" ? 7 : 0;
    if (toRow === baseRow && toCol === 7) castling[capturedColor].kingSide = false;
    if (toRow === baseRow && toCol === 0) castling[capturedColor].queenSide = false;
  }

  gameState.castling = castling;
  gameState.enPassant = type === "P" && Math.abs(rowDiff) === 2 ? [fromRow + rowDiff / 2, fromCol] : null;
  gameState.turn = backendOpponent(color);
  gameState.halfmoveClock = type === "P" || capturedPiece ? 0 : (gameState.halfmoveClock || 0) + 1;
  gameState.positionHistory = gameState.positionHistory || [];
  gameState.positionHistory.push(getPositionKey(gameState));
  gameState.status =
    gameState.halfmoveClock >= 100
      ? "draw-50move"
      : hasThreefoldRepetition(gameState.positionHistory)
        ? "draw-repetition"
        : getBackendGameStatus(gameState);

  const moveText = `${piece}@${toAlgebraic(fromRow, fromCol)}→${toAlgebraic(toRow, toCol)}${promotionLabel || ""}`;
  gameState.moveHistory = gameState.moveHistory || [];
  gameState.moveHistory.push({
    from: [fromRow, fromCol],
    to: [toRow, toCol],
    piece,
    color,
    text: moveText,
    captured: capturedPiece || null,
    promotion: promotionLabel || undefined,
    timestamp: Date.now()
  });
  return gameState;
}

export function materialBalanceFromBoard(board: BackendBoard = []) {
  let white = 0;
  let black = 0;
  for (const rank of board) {
    for (const piece of rank) {
      if (!piece) continue;
      const value = PIECE_VALUES[backendPieceType(piece)] || 0;
      if (backendPieceColor(piece) === "w") white += value;
      else black += value;
    }
  }
  return white - black;
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
