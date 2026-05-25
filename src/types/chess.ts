import type {
  BackendBoard,
  BackendClockState,
  BackendCastlingRights,
  BackendGameStatus,
  BackendMoveHistoryEntry,
  BackendPiece,
  BackendPlayerSlot,
  BackendSocketGameState
} from "@/features/chess/backendChessAdapter";

export type Square = `${"a" | "b" | "c" | "d" | "e" | "f" | "g" | "h"}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;

export type PlayerColor = "w" | "b";
export type GameStatus = BackendGameStatus;
export type ClockState = BackendClockState;

export type SocketGameState = BackendSocketGameState & {
  board?: BackendBoard;
  turn?: PlayerColor;
  status?: GameStatus;
  castling?: BackendCastlingRights;
  moveHistory?: BackendMoveHistoryEntry[];
  moves?: BackendMoveHistoryEntry[];
  capturedW?: BackendPiece[];
  capturedB?: BackendPiece[];
  players?: {
    w: BackendPlayerSlot;
    b: BackendPlayerSlot;
  };
  clock?: ClockState;
};

export type RoomChatMessage = {
  userId?: string;
  username: string;
  text: string;
  timestamp: string | number;
};

export type LiveRoom = {
  roomId: string;
  color: PlayerColor;
  gameState: SocketGameState;
  chatHistory?: RoomChatMessage[];
};
