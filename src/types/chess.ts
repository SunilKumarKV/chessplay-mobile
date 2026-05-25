export type Square = `${"a" | "b" | "c" | "d" | "e" | "f" | "g" | "h"}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;

export type PlayerColor = "w" | "b";

export type GameStatus =
  | "waiting"
  | "active"
  | "playing"
  | "check"
  | "checkmate"
  | "stalemate"
  | "draw"
  | "resigned"
  | "draw-50move"
  | "draw-repetition";

export type SocketGameState = {
  board?: (string | null)[][];
  fen?: string;
  turn?: PlayerColor;
  status?: GameStatus;
  castling?: {
    w?: { kingSide?: boolean; queenSide?: boolean };
    b?: { kingSide?: boolean; queenSide?: boolean };
  };
  enPassant?: [number, number] | null;
  halfmoveClock?: number;
  moves?: {
    from?: string | { row: number; col: number; fromRow?: number; fromCol?: number };
    to?: string | { row: number; col: number; toRow?: number; toCol?: number };
    fromRow?: number;
    fromCol?: number;
    toRow?: number;
    toCol?: number;
    piece?: string;
    promotion?: string;
  }[];
  players?: {
    w: { id?: string; name?: string; userId?: string; disconnected?: boolean };
    b: { id?: string; name?: string; userId?: string; disconnected?: boolean };
  };
  chatHistory?: { username: string; text: string; timestamp: string }[];
};

export type RoomChatMessage = {
  userId?: string;
  username: string;
  text: string;
  timestamp: string;
};

export type LiveRoom = {
  roomId: string;
  color: PlayerColor;
  gameState: SocketGameState;
  chatHistory?: RoomChatMessage[];
};
