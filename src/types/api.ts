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
  title?: string | null;
  bio?: string;
  country?: string;
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
  title?: string | null;
  wins?: number;
  losses?: number;
  draws?: number;
  adsDisabled?: boolean;
  planStatus?: string;
  supporterPlan?: string;
  supporterSince?: string | null;
  joinedAt?: string;
  createdAt?: string;
  selectedBadge?: string;
  earnedBadges?: string[];
  privacy?: {
    profileVisibility?: string;
    gameHistoryVisibility?: string;
    friendRequests?: string;
  };
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
      textColor?: string;
      boardTheme?: string;
      selectedBadge?: string;
    };
    badges?: {
      earned?: string[];
      selected?: string;
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
  type?: "private" | "public";
  roomKey?: string;
  participants?: User[];
  otherParticipants?: User[];
  unreadCount?: number;
  lastMessageAt?: string;
  lastMessage?: { text?: string; body?: string };
  isMuted?: boolean;
  isBlocked?: boolean;
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
  onlineVisible?: boolean;
};

export type FriendRequest = {
  id: string;
  from: Friend;
  createdAt?: string;
};

export type UserSearchResult = Friend;

export type BillingPlan = {
  label: string;
  amount: number;
  usdAmount: number;
  days: number;
  benefits: string[];
  entitlements?: Record<string, boolean>;
};

export type PaymentMethod = {
  id: "upi" | "qr" | "bank" | "paypal" | string;
  label: string;
  amount?: number;
  currency?: string;
  configured?: boolean;
  upiId?: string;
  merchantName?: string;
  qrUrl?: string;
  checkoutUrl?: string;
  paypalEmail?: string;
  bank?: {
    accountName?: string;
    accountNumber?: string;
    ifsc?: string;
    bankName?: string;
  };
};

export type BillingState = {
  plan: string;
  planStatus: string;
  planStartedAt?: string | null;
  planExpiresAt?: string | null;
  isSupporter: boolean;
  isPremium: boolean;
  supporterSince?: string | null;
  supporterPlan?: string;
  supporterExpiresAt?: string | null;
  adsDisabled: boolean;
  coins?: number;
  analysisCredits?: number;
  entitlements?: Record<string, boolean>;
};

export type SupporterRequest = {
  _id?: string;
  id?: string;
  plan: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  upiId?: string;
  utr?: string;
  bankReference?: string;
  payerEmail?: string;
  providerReference?: string;
  paymentProofUrl?: string;
  status: "pending" | "approved" | "rejected" | string;
  rejectionReason?: string;
  reviewedAt?: string;
  expiresAt?: string;
  paymentDate?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentIntent = {
  _id?: string;
  id?: string;
  plan: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  providerCheckoutUrl?: string;
  createdAt?: string;
  expiresAt?: string;
};

export type ReferralDashboard = {
  code: string;
  linkPath: string;
  stats: {
    invitesSent: number;
    joinedUsers: number;
    verifiedReferrals: number;
    rewardStatus: string;
  };
  rewards: { threshold: number; label: string; status: string }[];
  referrals: {
    id: string;
    username: string;
    joinedAt?: string;
    status: string;
    rewardStatus: string;
    rewardNote: string;
  }[];
  user: {
    username: string;
    isSupporter: boolean;
    adsDisabled: boolean;
  };
};

export type Tournament = {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  format?: string;
  status: "upcoming" | "open" | "active" | "completed" | "cancelled" | string;
  startsAt?: string;
  endsAt?: string | null;
  maxPlayers: number;
  playerCount: number;
  players?: {
    username: string;
    rating: number;
    supporterBadge?: boolean;
    joinedAt?: string;
    status?: string;
  }[];
  rules?: string;
  isJoined?: boolean;
  roadmap?: string[];
};

export type AnalysisNote = {
  gameId: string;
  fen?: string;
  pgn?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AnalysisReport = {
  accuracy?: number;
  mistakes?: number;
  blunders?: number;
  bestMoves?: string[];
  status?: "queued" | "complete" | "failed" | "coming_soon" | string;
  summary?: string;
};

export type Opening = {
  _id?: string;
  id?: string;
  eco: string;
  name: string;
  moves: string;
  tags?: string[];
};

export type MistakeReviewItem = {
  _id?: string;
  id?: string;
  fen: string;
  movePlayed?: string;
  bestMove?: string;
  reason?: string;
  severity?: "inaccuracy" | "mistake" | "blunder" | string;
  status?: "open" | "reviewed" | "dismissed" | string;
  updatedAt?: string;
  createdAt?: string;
};

export type PublicRoom = {
  key: string;
  title: string;
  description: string;
};

export type CommunityPost = {
  id?: string;
  _id?: string;
  type: "announcement" | "feedback" | "bug" | "feature" | "discussion";
  status?: "open" | "reviewing" | "resolved" | "closed";
  title: string;
  body?: string;
  content?: string;
  authorName?: string;
  author?: string;
  authorSupporter?: boolean;
  likesCount?: number;
  liked?: boolean;
  comments?: {
    _id?: string;
    id?: string;
    username?: string;
    text: string;
    createdAt?: string;
  }[];
  isPinned?: boolean;
  createdAt?: string;
  updatedAt?: string;
};
