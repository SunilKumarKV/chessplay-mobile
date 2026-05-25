export type User = {
  id: string;
  _id?: string;
  username: string;
  email?: string;
  avatar?: string | null;
  rating?: number | null;
  gamesPlayed?: number;
  gamesWon?: number;
  gamesLost?: number;
  gamesDrawn?: number;
  isAdmin?: boolean;
  isPremium?: boolean;
  isSupporter?: boolean;
  plan?: string;
  emailVerified?: boolean;
};

export type AuthSession = {
  user: User;
  accessToken?: string | null;
  refreshToken?: string | null;
  socketToken?: string | null;
};

export type AuthResponse = {
  message: string;
  user: User;
  accessToken?: string;
  refreshToken?: string;
  socketToken?: string;
  expiresIn?: number;
};

export type LeaderboardPlayer = {
  rank: number;
  username: string;
  rating: number | null;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  selectedBadge?: string;
  isSupporter?: boolean;
};

export type MoveRecord = {
  from: string | [number, number] | { row: number; col: number; fromRow?: number; fromCol?: number };
  to: string | [number, number] | { row: number; col: number; toRow?: number; toCol?: number };
  fromRow?: number;
  fromCol?: number;
  toRow?: number;
  toCol?: number;
  piece?: string;
  text?: string;
  captured?: string | null;
  promotion?: string;
  timestamp?: string | number;
};

export type GameHistoryItem = {
  _id?: string;
  id?: string;
  whitePlayer?: { username?: string } | string;
  blackPlayer?: { username?: string } | string;
  winner?: { username?: string } | string | null;
  result?: "white" | "black" | "draw" | "ongoing";
  moves?: MoveRecord[];
  aiOpponent?: boolean;
  startTime?: string;
  endTime?: string;
  duration?: number | null;
};

export type Profile = User & {
  displayName?: string;
  bio?: string;
  country?: string;
  joinedAt?: string;
  createdAt?: string;
  selectedBadge?: string;
};

export type SettingsPayload = {
  user: User;
  settings: {
    privacy?: {
      profileVisibility?: string;
      gameHistoryVisibility?: string;
      friendRequests?: string;
    };
    notifications?: Record<string, boolean>;
    appearance?: {
      theme?: "system" | "light" | "dark";
      accentColor?: string;
      boardTheme?: string;
      selectedBadge?: string;
    };
    gameplay?: {
      defaultMode?: string;
      boardOrientation?: string;
      moveConfirmation?: boolean;
      soundEffects?: boolean;
      animation?: string;
    };
  };
};

export type Puzzle = {
  id: string;
  puzzleId?: string;
  fen: string;
  initialMove?: string;
  moveIndex: number;
  solutionLength: number;
  playerMoveCount?: number;
  rating?: number;
  ratingDeviation?: number;
  popularity?: number;
  nbPlays?: number;
  difficulty?: string;
  themes?: string[];
  theme?: string;
  gameUrl?: string;
  openingTags?: string[];
  source?: string;
  isPremium?: boolean;
  learning?: PuzzleLearning | null;
  attribution?: string;
};

export type PuzzleLearning = {
  themeName?: string;
  difficulty?: string;
  rating?: number;
  whatYouLearned?: string;
  explanation?: string;
  nextRecommendedDifficulty?: string;
};

export type PuzzleLimits = {
  plan: string;
  dateKey: string;
  limit: number;
  used: number;
  remaining: number;
  isPremium: boolean;
};

export type PuzzleStats = {
  solved: number;
  failed: number;
  started: number;
  accuracy: number;
  rating: number;
  highestRating: number;
};

export type PuzzleHistoryItem = {
  puzzleId: string;
  difficulty?: string;
  status?: "started" | "in_progress" | "solved" | "failed";
  hintsUsed?: number;
  mistakeCount?: number;
  movesSubmitted?: string[];
  timeSpentMs?: number;
  completedAt?: string;
  updatedAt?: string;
};

export type PuzzleHint = {
  level: number;
  type: "piece" | "target" | "move";
  text: string;
  from?: string;
  to?: string;
  move?: string;
};

export type Conversation = {
  id: string;
  _id?: string;
  title: string;
  unreadCount?: number;
  lastMessageAt?: string;
  lastMessage?: { text?: string; body?: string };
};

export type Message = {
  id: string;
  _id?: string;
  conversation?: string;
  senderId: string;
  senderName?: string;
  body: string;
  text: string;
  createdAt: string;
  isOwn?: boolean;
  read?: boolean;
};

export type Friend = User & {
  relationship?: "friend" | "incoming" | "pending" | "none";
};

export type FriendRequest = {
  id: string;
  from: Friend;
  createdAt?: string;
};

export type UserSearchResult = Friend;
