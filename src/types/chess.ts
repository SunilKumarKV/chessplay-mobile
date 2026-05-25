export type Square = `${"a" | "b" | "c" | "d" | "e" | "f" | "g" | "h"}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;

export type PlayerColor = "w" | "b";

export type GameStatus =
  | "waiting"
  | "active"
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
  moves?: { from: string; to: string; piece?: string }[];
  players?: {
    w: { id?: string; name?: string; userId?: string; disconnected?: boolean };
    b: { id?: string; name?: string; userId?: string; disconnected?: boolean };
  };
  chatHistory?: { username: string; text: string; timestamp: string }[];
};

export type LiveRoom = {
  roomId: string;
  color: PlayerColor;
  gameState: SocketGameState;
};
