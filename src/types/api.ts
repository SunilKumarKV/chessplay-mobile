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
  socketToken?: string | null;
};

export type AuthResponse = {
  message: string;
  user: User;
  socketToken?: string;
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
  from: string;
  to: string;
  piece?: string;
  promotion?: string;
  timestamp?: string;
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
  moveIndex: number;
  solutionLength: number;
  rating?: number;
  difficulty?: string;
  themes?: string[];
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
